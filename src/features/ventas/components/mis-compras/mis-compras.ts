import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ESTADO_CUOTA, ESTADO_FINANCIAMIENTO } from '../../../financiamiento/logic';
import { EstadoCuenta } from '../../../financiamiento/model';
import { FinanciamientosService } from '../../../financiamiento/services/financiamientos.service';
import { ESTADO_VENTA, FORMA_PAGO } from '../../logic';
import { Venta } from '../../model';
import { VentasService } from '../../services/ventas.service';
import { EsqueletoLineas } from '../../../../shared/ui/carga/esqueleto-lineas';

/** Mis compras (/cuenta): cada compra con su comprobante y, si es financiada, sus cuotas (RF-32). */
@Component({
  selector: 'app-mis-compras',
  imports: [EsqueletoLineas, RouterLink, Etiqueta, Icono],
  templateUrl: './mis-compras.html',
})
export class MisCompras {
  private readonly ventas = inject(VentasService);
  private readonly financiamientos = inject(FinanciamientosService);

  protected readonly precio = formatearPrecio;
  protected readonly fecha = formatearFecha;
  protected readonly estadoVenta = ESTADO_VENTA;
  protected readonly formaPago = FORMA_PAGO;
  protected readonly estadoFinanciamiento = ESTADO_FINANCIAMIENTO;
  protected readonly estadoCuota = ESTADO_CUOTA;

  private readonly comprasRecurso = rxResource({ stream: () => this.ventas.misCompras(0, 50) });
  private readonly cuentasRecurso = rxResource({ stream: () => this.financiamientos.mios() });

  protected readonly cargando = computed(
    () => this.comprasRecurso.isLoading() || this.cuentasRecurso.isLoading(),
  );
  protected readonly error = computed(() => {
    const e = this.comprasRecurso.error() ?? this.cuentasRecurso.error();
    return e ? mensajeDeError(e) : null;
  });

  /** Cada compra con el estado de cuenta de su financiación, si tiene. */
  protected readonly compras = computed(() => {
    const cuentas = valorDe(this.cuentasRecurso) ?? [];
    return (valorDe(this.comprasRecurso)?.content ?? []).map((venta) => ({
      venta,
      cuenta: cuentas.find((c) => c.financiamiento.ventaId === venta.id) ?? null,
    }));
  });

  /** Ids de las compras con la tabla de cuotas abierta. */
  protected readonly abiertas = signal<ReadonlySet<number>>(new Set());
  protected readonly descargando = signal<number | null>(null);
  protected readonly errorDescarga = signal<string | null>(null);

  protected alternarCuotas(id: number): void {
    this.abiertas.update((s) => {
      const nuevo = new Set(s);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  protected progreso(c: EstadoCuenta): number {
    const total = c.financiamiento.cantidadCuotas || 1;
    return Math.round((c.resumen.cuotasPagadas / total) * 100);
  }

  protected descargar(v: Venta): void {
    this.descargando.set(v.id);
    this.errorDescarga.set(null);
    this.ventas.comprobante(v.id).subscribe({
      next: (pdf) => {
        const url = URL.createObjectURL(pdf);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `comprobante-${v.numeroComprobante}.pdf`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.descargando.set(null);
      },
      error: () => {
        this.errorDescarga.set('No se pudo descargar el comprobante. Intentá de nuevo.');
        this.descargando.set(null);
      },
    });
  }
}
