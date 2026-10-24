import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ESTADO_CUOTA, ESTADO_FINANCIAMIENTO, MEDIO_PAGO, TIPO_PAGO } from '../../logic';
import { MedioPago, TipoPago } from '../../model';
import { FinanciamientosService } from '../../services/financiamientos.service';

/**
 * Estado de cuenta de un financiamiento (RF-32) y registro de pagos (RF-31).
 * Se abre por id (/panel/financiamiento/:id) o desde una venta (/panel/financiamiento/venta/:ventaId).
 */
@Component({
  selector: 'app-estado-cuenta',
  imports: [RouterLink, Icono, Etiqueta],
  templateUrl: './estado-cuenta.html',
})
export class EstadoCuentaComponent {
  private readonly servicio = inject(FinanciamientosService);

  readonly id = input<string>();
  readonly ventaId = input<string>();

  protected readonly estadoFinanciamiento = ESTADO_FINANCIAMIENTO;
  protected readonly estadoCuota = ESTADO_CUOTA;
  protected readonly tipoPago = TIPO_PAGO;
  protected readonly tiposPago: TipoPago[] = ['ANTICIPO', 'CUOTA'];
  protected readonly mediosPago = Object.entries(MEDIO_PAGO) as [MedioPago, string][];
  protected readonly medioPago = MEDIO_PAGO;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;

  private readonly recurso = rxResource({
    params: () => ({ id: Number(this.id()) || null, ventaId: Number(this.ventaId()) || null }),
    stream: ({ params }) =>
      params.id ? this.servicio.estadoDeCuenta(params.id) : this.servicio.deVenta(params.ventaId!),
  });
  protected readonly cuenta = computed(() => valorDe(this.recurso));
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && e.status === 404
      ? 'No encontramos ese financiamiento.'
      : mensajeDeError(e);
  });
  protected readonly admitePagos = computed(() => {
    const estado = this.cuenta()?.financiamiento.estado;
    return estado === 'ACTIVO' || estado === 'EN_MORA';
  });

  // Registro de pago
  protected readonly tipo = signal<TipoPago>('CUOTA');
  protected readonly monto = signal(0);
  protected readonly medio = signal<MedioPago>('EFECTIVO');
  protected readonly referencia = signal('');
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  /** Cuánto se debe de lo que se va a pagar: el anticipo pendiente o la cuota impaga más antigua. */
  protected readonly pendiente = computed(() => {
    const r = this.cuenta()?.resumen;
    if (!r) return 0;
    return this.tipo() === 'ANTICIPO' ? r.anticipoPendiente : (r.proximaCuota?.saldo ?? 0);
  });
  protected readonly errorMonto = computed(() => {
    const m = this.monto();
    if (m <= 0) return 'Ingresá el monto.';
    if (m > this.pendiente())
      return `No puede superar lo que se debe (${formatearPrecio(this.pendiente())}).`;
    return null;
  });
  protected readonly intento = signal(false);

  constructor() {
    // Propone pagar lo que corresponde: primero el anticipo y después la próxima cuota.
    effect(() => {
      const r = this.cuenta()?.resumen;
      if (!r) return;
      untracked(() => {
        const tipo: TipoPago = r.anticipoPendiente > 0 ? 'ANTICIPO' : 'CUOTA';
        this.tipo.set(tipo);
        this.monto.set(tipo === 'ANTICIPO' ? r.anticipoPendiente : (r.proximaCuota?.saldo ?? 0));
      });
    });
  }

  protected elegirTipo(tipo: TipoPago): void {
    this.tipo.set(tipo);
    this.monto.set(this.pendiente());
  }

  protected numero(valor: string): number {
    return valor === '' ? 0 : Number(valor);
  }

  protected registrar(): void {
    const c = this.cuenta();
    this.intento.set(true);
    if (!c || this.errorMonto()) return;
    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);
    this.servicio
      .registrarPago({
        financiamientoId: c.financiamiento.id,
        tipo: this.tipo(),
        cuotaId: null,
        monto: this.monto(),
        medioPago: this.medio(),
        referencia: this.referencia().trim() || null,
      })
      .subscribe({
        next: (pago) => {
          this.aviso.set(
            pago.tipo === 'ANTICIPO'
              ? `Pago del anticipo registrado: ${formatearPrecio(pago.monto)}.`
              : `Pago de la cuota ${pago.numeroCuota} registrado: ${formatearPrecio(pago.monto)}.`,
          );
          this.referencia.set('');
          this.intento.set(false);
          this.recurso.reload();
          this.guardando.set(false);
        },
        error: (err: unknown) => {
          this.error.set(mensajeDeError(err));
          this.guardando.set(false);
        },
      });
  }
}
