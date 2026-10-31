import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { ESTADO_VENTA, FORMA_PAGO } from '../../logic';
import { VentasService } from '../../services/ventas.service';
import { EsqueletoFicha } from '../../../../shared/ui/carga/esqueleto-ficha';

/** Ficha de una venta (/panel/ventas/:id): montos, comprobante PDF y anulación. */
@Component({
  selector: 'app-ficha-venta',
  imports: [EsqueletoFicha, RouterLink, Icono, Etiqueta],
  templateUrl: './ficha-venta.html',
})
export class FichaVenta {
  private readonly servicio = inject(VentasService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly estadoVenta = ESTADO_VENTA;
  protected readonly formaPago = FORMA_PAGO;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;

  private readonly recurso = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.servicio.obtenerVenta(params),
  });
  protected readonly venta = computed(() => valorDe(this.recurso));
  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && e.status === 404
      ? 'No encontramos esa venta.'
      : mensajeDeError(e);
  });

  protected readonly aviso = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['aviso'] as string | undefined) ?? null,
  );
  protected readonly error = signal<string | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly anulando = signal(false);
  protected readonly motivo = signal('');

  protected descargarComprobante(): void {
    const v = this.venta();
    if (!v) return;
    this.ocupado.set(true);
    this.error.set(null);
    this.servicio.comprobante(v.id).subscribe({
      next: (pdf) => {
        const url = URL.createObjectURL(pdf);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `comprobante-${v.numeroComprobante}.pdf`;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this.ocupado.set(false);
      },
      error: () => {
        this.error.set('No se pudo descargar el comprobante. Intentá de nuevo.');
        this.ocupado.set(false);
      },
    });
  }

  protected anular(): void {
    const v = this.venta();
    if (!v || !this.motivo().trim()) return;
    this.ocupado.set(true);
    this.error.set(null);
    this.servicio.anularVenta(v.id, this.motivo().trim()).subscribe({
      next: (anulada) => {
        this.recurso.set(anulada);
        this.aviso.set('Venta anulada. El vehículo volvió a estar disponible.');
        this.anulando.set(false);
        this.ocupado.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
      },
    });
  }
}
