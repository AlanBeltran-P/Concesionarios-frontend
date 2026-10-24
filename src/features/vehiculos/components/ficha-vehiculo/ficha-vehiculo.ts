import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha } from '../../../../shared/utils/formato';
import { mostrarErroresEnFormulario } from '../../../../shared/utils/formularios';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import {
  ANIO_MINIMO,
  ETIQUETA_CONDICION,
  ETIQUETA_ESTADO,
  PATRON_VIN,
  anioMaximo,
  estadosSiguientes,
} from '../../logic';
import { CondicionVehiculo, EstadoVehiculo, Vehiculo, VehiculoRequest } from '../../model';
import { VehiculosService } from '../../services/vehiculos.service';
import { EstadoBadge } from '../estado-badge/estado-badge';
import { FotosVehiculo } from '../fotos-vehiculo/fotos-vehiculo';

type Campo =
  'marcaId' | 'modeloId' | 'anio' | 'color' | 'kilometraje' | 'precio' | 'vin' | 'descripcion';

const ACCION_ESTADO: Record<EstadoVehiculo, string> = {
  DISPONIBLE: 'Volver a disponible',
  RESERVADO: 'Marcar como reservado',
  VENDIDO: 'Marcar como vendido',
};

/** Alta (/panel/vehiculos/nuevo) y ficha de un vehículo (/panel/vehiculos/:id). */
@Component({
  selector: 'app-ficha-vehiculo',
  imports: [ReactiveFormsModule, RouterLink, Icono, EstadoBadge, FotosVehiculo],
  templateUrl: './ficha-vehiculo.html',
})
export class FichaVehiculo {
  private readonly servicio = inject(VehiculosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Viene de la URL. No está en el alta. */
  readonly id = input<string>();

  protected readonly etiquetaCondicion = ETIQUETA_CONDICION;
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly accionEstado = ACCION_ESTADO;
  protected readonly formatearFecha = formatearFecha;
  protected readonly anioMax = anioMaximo();
  protected readonly condiciones: CondicionVehiculo[] = ['NUEVO', 'USADO'];

  protected readonly esNuevo = computed(() => !this.id());
  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');
  /** Cualquier empleado da de alta; editar un vehículo existente es solo de ADMIN. */
  protected readonly puedeEditar = computed(() => this.esNuevo() || this.esAdmin());

  protected readonly form = this.fb.group({
    marcaId: this.fb.control<number | null>(null, Validators.required),
    modeloId: this.fb.control<number | null>(null, Validators.required),
    anio: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(ANIO_MINIMO),
      Validators.max(this.anioMax),
    ]),
    color: ['', [Validators.required, Validators.maxLength(40)]],
    kilometraje: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(2_000_000),
    ]),
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    condicion: this.fb.control<CondicionVehiculo>('USADO'),
    vin: ['', [Validators.required, Validators.pattern(PATRON_VIN)]],
    descripcion: ['', Validators.maxLength(1000)],
  });

  protected readonly vehiculo = rxResource({
    params: () => (this.id() ? Number(this.id()) : undefined),
    stream: ({ params }) => this.servicio.obtener(params),
  });

  protected readonly marcas = rxResource({ stream: () => this.servicio.marcas() });

  private readonly marcaElegida = toSignal(this.form.controls.marcaId.valueChanges, {
    initialValue: null,
  });
  protected readonly modelos = rxResource({
    params: () => this.marcaElegida() ?? undefined,
    stream: ({ params }) => this.servicio.modelos(params),
  });

  /** El vehículo cargado (undefined en el alta, mientras carga o si falló). */
  protected readonly actual = computed(() => valorDe(this.vehiculo));
  protected readonly listaMarcas = computed(() => valorDe(this.marcas));
  protected readonly listaModelos = computed(() => valorDe(this.modelos));

  protected readonly guardando = signal(false);
  protected readonly cambiandoEstado = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Mensaje verde de confirmación. Al crear llega desde el alta a través del state de la navegación. */
  protected readonly aviso = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['aviso'] as string | undefined) ?? null,
  );

  protected readonly estadosPosibles = computed(() => {
    const v = this.actual();
    return v && v.activo ? estadosSiguientes(v.estado, this.esAdmin()) : [];
  });

  protected readonly errorCarga = computed(() => {
    const e = this.vehiculo.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && e.status === 404
      ? 'No encontramos ese vehículo.'
      : mensajeDeError(e);
  });

  constructor() {
    effect(() => {
      const v = this.actual();
      if (v) this.cargarEnFormulario(v);
    });
    effect(() => {
      if (this.puedeEditar()) this.form.enable();
      else this.form.disable();
    });
  }

  /** Al cambiar de marca, el modelo elegido ya no corresponde. */
  protected cambioMarca(): void {
    this.form.controls.modeloId.setValue(null);
  }

  /** Un 0 km arranca con 0 kilómetros. */
  protected elegirCondicion(condicion: CondicionVehiculo): void {
    if (!this.puedeEditar()) return;
    this.form.controls.condicion.setValue(condicion);
    if (condicion === 'NUEVO' && this.form.controls.kilometraje.value === null) {
      this.form.controls.kilometraje.setValue(0);
    }
  }

  protected errorDe(campo: Campo): string | null {
    const control = this.form.controls[campo];
    if (!control.touched || !control.errors) return null;
    const e = control.errors;
    if (e['servidor']) return e['servidor'];
    if (e['required']) return 'Completá este campo.';
    if (e['pattern'] && campo === 'vin')
      return 'Tiene que tener 17 letras y números, sin I, O ni Q.';
    if (e['min'] && campo === 'anio') return `El año mínimo es ${ANIO_MINIMO}.`;
    if (e['max'] && campo === 'anio') return `El año máximo es ${this.anioMax}.`;
    if (e['min'])
      return campo === 'precio' ? 'El precio tiene que ser mayor a 0.' : 'No puede ser negativo.';
    if (e['max']) return 'El valor es demasiado alto.';
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Revisá este campo.';
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const f = this.form.getRawValue();
    const datos: VehiculoRequest = {
      vin: f.vin.trim().toUpperCase(),
      modeloId: f.modeloId!,
      anio: f.anio!,
      color: f.color.trim(),
      kilometraje: f.kilometraje!,
      precio: f.precio!,
      condicion: f.condicion,
      descripcion: f.descripcion.trim() || null,
    };
    const id = this.actual()?.id;
    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);

    if (id === undefined) {
      this.servicio.crear(datos).subscribe({
        next: (creado) =>
          void this.router.navigate(['/panel/vehiculos', creado.id], {
            state: { aviso: 'Vehículo cargado.' },
          }),
        error: (err: unknown) => this.mostrarError(err),
      });
    } else {
      this.servicio.actualizar(id, datos).subscribe({
        next: (actualizado) => this.terminar(actualizado, 'Cambios guardados.'),
        error: (err: unknown) => this.mostrarError(err),
      });
    }
  }

  protected cambiarEstado(estado: EstadoVehiculo): void {
    const v = this.actual();
    if (!v) return;
    this.ejecutar(
      this.servicio.cambiarEstado(v.id, estado, v.estado),
      `Ahora está ${ETIQUETA_ESTADO[estado].toLowerCase()}.`,
    );
  }

  protected darDeBaja(): void {
    const v = this.actual();
    if (
      !v ||
      !confirm(`¿Dar de baja el ${v.marca} ${v.modelo}? Deja de aparecer en el inventario.`)
    ) {
      return;
    }
    this.cambiandoEstado.set(true);
    this.error.set(null);
    this.servicio.darDeBaja(v.id).subscribe({
      next: () => this.terminar({ ...v, activo: false }, 'Vehículo dado de baja.'),
      error: (err: unknown) => this.mostrarError(err),
    });
  }

  protected reactivar(): void {
    const v = this.actual();
    if (v) this.ejecutar(this.servicio.reactivar(v.id), 'Vehículo reactivado.');
  }

  private ejecutar(accion: Observable<Vehiculo>, aviso: string): void {
    this.cambiandoEstado.set(true);
    this.error.set(null);
    this.aviso.set(null);
    accion.subscribe({
      next: (v) => this.terminar(v, aviso),
      error: (err: unknown) => {
        this.mostrarError(err);
        // Si otro usuario lo cambió mientras tanto (409), mostramos el estado actual.
        if (err instanceof HttpErrorResponse && err.status === 409) this.vehiculo.reload();
      },
    });
  }

  private terminar(v: Vehiculo, aviso: string): void {
    this.vehiculo.set(v);
    this.aviso.set(aviso);
    this.guardando.set(false);
    this.cambiandoEstado.set(false);
  }

  private mostrarError(err: unknown): void {
    this.guardando.set(false);
    this.cambiandoEstado.set(false);
    // El VIN repetido llega como 409 sin campo, pero va debajo del VIN.
    this.error.set(mostrarErroresEnFormulario(this.form, err, [[/VIN/, 'vin']]));
  }

  private cargarEnFormulario(v: Vehiculo): void {
    this.form.reset({
      marcaId: v.marcaId,
      modeloId: v.modeloId,
      anio: v.anio,
      color: v.color,
      kilometraje: v.kilometraje,
      precio: v.precio,
      condicion: v.condicion,
      vin: v.vin,
      descripcion: v.descripcion ?? '',
    });
  }
}
