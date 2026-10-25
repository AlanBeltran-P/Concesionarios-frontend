import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, formatearKm, formatearPrecio } from '../../../../shared/utils/formato';
import { urlDelBackend } from '../../../../shared/utils/http';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { SimuladorPublico } from '../../../financiamiento/components/simulador-publico/simulador-publico';
import { PlanesService } from '../../../financiamiento/services/planes.service';
import { AccionesCliente } from '../../../ventas/components/acciones-cliente/acciones-cliente';
import { ETIQUETA_CONDICION, ETIQUETA_ESTADO } from '../../logic';
import { VehiculosService } from '../../services/vehiculos.service';

/** Detalle de un vehículo en el sitio público (RF-13), con galería y simulador de cuotas. */
@Component({
  selector: 'app-detalle-publico',
  imports: [RouterLink, Icono, Etiqueta, SimuladorPublico, AccionesCliente],
  templateUrl: './detalle-publico.html',
  host: {
    '(document:keydown.arrowleft)': 'anterior()',
    '(document:keydown.arrowright)': 'siguiente()',
  },
})
export class DetallePublico {
  private readonly servicio = inject(VehiculosService);
  private readonly planesServicio = inject(PlanesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  /** ?cotizacion=: viene de "Reservar con este precio" en la cuenta del cliente. */
  readonly cotizacion = input<string>();
  protected readonly cotizacionId = computed(() => Number(this.cotizacion()) || null);

  protected readonly condicion = ETIQUETA_CONDICION;
  protected readonly estado = ETIQUETA_ESTADO;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly url = urlDelBackend;

  private readonly recurso = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.servicio.obtener(params),
  });
  protected readonly vehiculo = computed(() => valorDe(this.recurso));
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && (e.status === 404 || e.status === 400)
      ? 'Este vehículo ya no está publicado.'
      : mensajeDeError(e);
  });

  protected readonly fotos = computed(() =>
    [...(this.vehiculo()?.imagenes ?? [])].sort(
      (a, b) => Number(b.principal) - Number(a.principal) || a.orden - b.orden,
    ),
  );
  /** Foto grande: arranca en la principal y vuelve a ella al cambiar de vehículo. */
  protected readonly actual = linkedSignal({ source: this.fotos, computation: () => 0 });

  protected readonly especificaciones = computed(() => {
    const v = this.vehiculo();
    if (!v) return [];
    return [
      ['Marca', v.marca],
      ['Modelo', v.modelo],
      ['Categoría', v.categoria],
      ['Año', String(v.anio)],
      ['Condición', ETIQUETA_CONDICION[v.condicion]],
      ['Kilometraje', formatearKm(v.kilometraje)],
      ['Color', v.color],
      ['Publicado', formatearFecha(v.fechaIngreso)],
    ];
  });
  protected readonly subtitulo = computed(() => {
    const v = this.vehiculo();
    return v ? `${v.anio} · ${formatearKm(v.kilometraje)} · ${v.categoria} · ${v.color}` : '';
  });

  protected readonly disponible = computed(() => {
    const v = this.vehiculo();
    return !!v && v.activo && v.estado === 'DISPONIBLE';
  });

  private readonly planesRecurso = rxResource({ stream: () => this.planesServicio.listar() });
  /** Para el "hasta N cuotas" del resumen. */
  protected readonly maximoCuotas = computed(() => {
    const plazos = (valorDe(this.planesRecurso) ?? []).flatMap((p) => p.plazos);
    return plazos.length ? Math.max(...plazos) : null;
  });

  protected readonly usuario = this.auth.usuario;
  /** Los empleados ven el botón para abrir la ficha del panel. */
  protected readonly esEmpleado = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMIN' || rol === 'VENDEDOR';
  });
  /** Para volver a este vehículo después de ingresar. */
  protected readonly redirect = computed(() => {
    this.id();
    return this.router.url;
  });

  constructor() {
    // Al entrar desde el catálogo (o pasar a otro vehículo) arranca desde arriba.
    effect(() => {
      this.id();
      window.scrollTo({ top: 0 });
    });
  }

  protected elegir(indice: number): void {
    this.actual.set(indice);
  }

  protected anterior(): void {
    const n = this.fotos().length;
    if (n > 1) this.actual.set((this.actual() - 1 + n) % n);
  }

  protected siguiente(): void {
    const n = this.fotos().length;
    if (n > 1) this.actual.set((this.actual() + 1) % n);
  }
}
