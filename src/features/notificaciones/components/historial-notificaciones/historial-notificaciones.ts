import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ESTADO_NOTIFICACION, TIPO_NOTIFICACION } from '../../logic';
import { EstadoNotificacion, TipoNotificacion } from '../../model';
import { NotificacionesService } from '../../services/notificaciones.service';

/** Historial de emails (RF-38): qué se mandó, a quién, si falló, y reenvío. Solo ADMIN. */
@Component({
  selector: 'app-historial-notificaciones',
  imports: [Etiqueta, Icono, Paginado],
  templateUrl: './historial-notificaciones.html',
})
export class HistorialNotificaciones {
  private readonly servicio = inject(NotificacionesService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly tipoNotificacion = TIPO_NOTIFICACION;
  protected readonly estadoNotificacion = ESTADO_NOTIFICACION;
  protected readonly tipos = Object.entries(TIPO_NOTIFICACION) as [TipoNotificacion, string][];
  protected readonly estados = Object.entries(ESTADO_NOTIFICACION) as [
    EstadoNotificacion,
    { texto: string },
  ][];
  protected readonly formatearFecha = formatearFecha;

  protected readonly tipo = signal<TipoNotificacion | undefined>(undefined);
  protected readonly estado = signal<EstadoNotificacion | undefined>(undefined);
  protected readonly destinatario = signal('');
  private readonly destinatarioBuscado = signal('');
  protected readonly pagina = signal(0);

  private readonly recurso = rxResource({
    params: () => ({
      tipo: this.tipo(),
      estado: this.estado(),
      destinatario: this.destinatarioBuscado().trim() || undefined,
      page: this.pagina(),
      size: 20,
    }),
    stream: ({ params }) => this.servicio.buscar(params),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });

  // Detalle de la abierta
  protected readonly abierta = signal<number | null>(null);
  private readonly detalleRecurso = rxResource({
    params: () => this.abierta() ?? undefined,
    stream: ({ params }) => this.servicio.obtener(params),
  });
  protected readonly detalle = computed(() => valorDe(this.detalleRecurso));
  /**
   * El cuerpo es el HTML del email. Va en un iframe con sandbox vacío: se ve tal cual le
   * llegó al cliente, pero no puede correr scripts ni tocar la página.
   */
  protected readonly cuerpo = computed<SafeHtml | null>(() => {
    const c = this.detalle()?.cuerpo;
    return c ? this.sanitizer.bypassSecurityTrustHtml(c) : null;
  });

  protected readonly reenviando = signal(false);
  protected readonly aviso = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected filtrar(filtro: 'tipo' | 'estado', valor: string): void {
    if (filtro === 'tipo') this.tipo.set((valor || undefined) as TipoNotificacion | undefined);
    else this.estado.set((valor || undefined) as EstadoNotificacion | undefined);
    this.limpiarAvisos();
    this.pagina.set(0);
  }

  /** El backend busca por email exacto, así que busca al confirmar (Enter o salir del campo). */
  protected buscar(valor: string): void {
    this.destinatario.set(valor);
    this.destinatarioBuscado.set(valor);
    this.limpiarAvisos();
    this.pagina.set(0);
  }

  private limpiarAvisos(): void {
    this.aviso.set(null);
    this.error.set(null);
  }

  protected alternar(id: number): void {
    this.limpiarAvisos();
    this.abierta.set(this.abierta() === id ? null : id);
  }

  protected reenviar(id: number): void {
    this.reenviando.set(true);
    this.aviso.set(null);
    this.error.set(null);
    this.servicio.reenviar(id).subscribe({
      next: (n) => {
        this.aviso.set(
          n.estado === 'ENVIADA'
            ? `Reenviado a ${n.destinatario}.`
            : 'Se volvió a intentar, pero falló.',
        );
        this.detalleRecurso.reload();
        this.recurso.reload();
        this.reenviando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.reenviando.set(false);
      },
    });
  }
}
