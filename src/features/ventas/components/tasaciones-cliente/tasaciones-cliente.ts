import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { formatearFecha, formatearKm, formatearPrecio } from '../../../../shared/utils/formato';
import { mostrarErroresEnFormulario } from '../../../../shared/utils/formularios';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { ANIO_MINIMO, PATRON_VIN, anioMaximo } from '../../../vehiculos/logic';
import { VehiculosService } from '../../../vehiculos/services/vehiculos.service';
import { DIAS_VALIDEZ_TASACION, ESTADO_TASACION, tasacionUtilizable } from '../../logic';
import { Tasacion } from '../../model';
import { CotizacionesService } from '../../services/cotizaciones.service';

/**
 * Autos usados que el cliente ofrece como parte de pago (RF-20): sus tasaciones, cuál se usa,
 * lo que decidió el cliente y el alta de una nueva.
 */
@Component({
  selector: 'app-tasaciones-cliente',
  imports: [ReactiveFormsModule, Etiqueta],
  templateUrl: './tasaciones-cliente.html',
})
export class TasacionesCliente {
  private readonly servicio = inject(CotizacionesService);
  private readonly vehiculos = inject(VehiculosService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly clienteId = input.required<number>();
  /** La que se usa como parte de pago. */
  readonly elegida = model<Tasacion | null>(null);
  /** Para marcar la que ya tiene la cotización al abrirla. */
  readonly idInicial = input<number | null>(null);
  readonly deshabilitado = input(false);

  protected readonly estado = ESTADO_TASACION;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearKm = formatearKm;
  protected readonly formatearFecha = formatearFecha;
  protected readonly utilizable = (t: Tasacion) => tasacionUtilizable(t);
  protected readonly anioMax = anioMaximo();

  private readonly recurso = rxResource({
    params: () => this.clienteId(),
    stream: ({ params }) => this.servicio.tasacionesDe(params),
  });
  protected readonly lista = computed(() => valorDe(this.recurso) ?? []);
  protected readonly cargando = computed(
    () => this.recurso.isLoading() && !this.recurso.hasValue(),
  );
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });

  protected readonly tasando = signal(false);
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly intento = signal(false);

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
    vin: ['', [Validators.required, Validators.pattern(PATRON_VIN)]],
    valorTasado: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    diasValidez: this.fb.control<number>(DIAS_VALIDEZ_TASACION, [
      Validators.required,
      Validators.min(1),
      Validators.max(60),
    ]),
    observaciones: ['', Validators.maxLength(1000)],
  });

  private readonly marcasRecurso = rxResource({ stream: () => this.vehiculos.marcas() });
  protected readonly marcas = computed(() => valorDe(this.marcasRecurso) ?? []);
  private readonly marcaElegida = toSignal(this.form.controls.marcaId.valueChanges, {
    initialValue: null,
  });
  private readonly modelosRecurso = rxResource({
    params: () => this.marcaElegida() ?? undefined,
    stream: ({ params }) => this.vehiculos.modelos(params),
  });
  protected readonly modelos = computed(() => valorDe(this.modelosRecurso) ?? []);

  constructor() {
    // Al abrir una cotización que ya tiene auto usado, lo marca como elegido.
    effect(() => {
      const id = this.idInicial();
      const encontrada = this.lista().find((t) => t.id === id);
      if (encontrada && !this.elegida()) this.elegida.set(encontrada);
    });
  }

  protected elegir(t: Tasacion | null): void {
    if (!this.deshabilitado()) this.elegida.set(t);
  }

  protected decidir(t: Tasacion, estado: 'ACEPTADA' | 'RECHAZADA'): void {
    this.ocupado.set(true);
    this.error.set(null);
    this.servicio.decidirTasacion(t.id, estado).subscribe({
      next: (actualizada) => {
        if (this.elegida()?.id === t.id) {
          this.elegida.set(tasacionUtilizable(actualizada) ? actualizada : null);
        }
        this.recurso.reload();
        this.ocupado.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
      },
    });
  }

  protected errorDe(campo: keyof typeof this.form.controls): string | null {
    const c = this.form.controls[campo];
    if (!(c.touched || this.intento()) || !c.errors) return null;
    const e = c.errors;
    if (e['servidor']) return e['servidor'];
    if (e['required']) return 'Completá este campo.';
    if (e['pattern']) return '17 letras y números, sin I, O ni Q.';
    if (e['min'] || e['max']) return 'Revisá el valor.';
    return 'Revisá este campo.';
  }

  protected guardar(): void {
    this.intento.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const f = this.form.getRawValue();
    this.ocupado.set(true);
    this.error.set(null);
    this.servicio
      .tasar({
        clienteId: this.clienteId(),
        vin: f.vin.trim().toUpperCase(),
        modeloId: f.modeloId!,
        anio: f.anio!,
        color: f.color.trim(),
        kilometraje: f.kilometraje!,
        valorTasado: f.valorTasado!,
        diasValidez: f.diasValidez,
        observaciones: f.observaciones.trim() || null,
      })
      .subscribe({
        next: (nueva) => {
          this.elegida.set(nueva);
          this.tasando.set(false);
          this.intento.set(false);
          this.form.reset();
          this.recurso.reload();
          this.ocupado.set(false);
        },
        error: (err: unknown) => {
          this.error.set(mostrarErroresEnFormulario(this.form, err));
          this.ocupado.set(false);
        },
      });
  }
}
