import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { leerPlazos } from '../../logic';
import { Plan, PlanRequest } from '../../model';
import { PlanesService } from '../../services/planes.service';

interface Borrador {
  nombre: string;
  descripcion: string;
  tasaAnual: string;
  plazos: string;
  anticipo: string;
  mora: string;
}

const VACIO: Borrador = {
  nombre: '',
  descripcion: '',
  tasaAnual: '',
  plazos: '',
  anticipo: '',
  mora: '',
};

/** Planes de financiación (RF-28). Los edita el ADMIN; los vendedores los consultan. */
@Component({
  selector: 'app-planes-financiamiento',
  imports: [Etiqueta],
  templateUrl: './planes-financiamiento.html',
})
export class PlanesFinanciamiento {
  private readonly servicio = inject(PlanesService);
  private readonly auth = inject(AuthService);

  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');

  private readonly recurso = rxResource({
    params: () => this.esAdmin(),
    stream: ({ params }) => this.servicio.listar(params),
  });
  protected readonly planes = computed(() =>
    [...(valorDe(this.recurso) ?? [])].sort(
      (a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'),
    ),
  );
  protected readonly cargando = computed(
    () => this.recurso.isLoading() && !this.recurso.hasValue(),
  );

  /** null = sin formulario abierto; 'nuevo' o el id del plan que se edita. */
  protected readonly editando = signal<'nuevo' | number | null>(null);
  protected readonly borrador = signal<Borrador>(VACIO);
  protected readonly intento = signal(false);
  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly errores = computed(() => {
    const b = this.borrador();
    const e: Partial<Record<keyof Borrador, string>> = {};
    if (!b.nombre.trim()) e.nombre = 'Completá el nombre.';
    const enRango = (v: string, min: number, max: number) =>
      v.trim() !== '' && !isNaN(Number(v)) && Number(v) >= min && Number(v) <= max;
    if (!enRango(b.tasaAnual, 0, 500)) e.tasaAnual = 'Entre 0 y 500.';
    if (!leerPlazos(b.plazos)) e.plazos = 'Números de 1 a 120 separados por coma. Ej.: 12, 24, 36';
    if (!enRango(b.anticipo, 0, 95)) e.anticipo = 'Entre 0 y 95.';
    if (!enRango(b.mora, 0, 5)) e.mora = 'Entre 0 y 5.';
    return e;
  });

  protected campo(nombre: keyof Borrador, valor: string): void {
    this.borrador.update((b) => ({ ...b, [nombre]: valor }));
  }

  protected nuevo(): void {
    this.abrir('nuevo', VACIO);
  }

  protected editar(p: Plan): void {
    this.abrir(p.id, {
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      tasaAnual: String(p.tasaAnual),
      plazos: p.plazos.join(', '),
      anticipo: String(p.porcentajeAnticipoMinimo),
      mora: String(p.porcentajeMoraDiaria),
    });
  }

  protected cerrar(): void {
    this.editando.set(null);
  }

  protected guardar(): void {
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return;
    const b = this.borrador();
    const datos: PlanRequest = {
      nombre: b.nombre.trim(),
      descripcion: b.descripcion.trim() || null,
      tasaAnual: Number(b.tasaAnual),
      plazos: leerPlazos(b.plazos)!,
      porcentajeAnticipoMinimo: Number(b.anticipo),
      porcentajeMoraDiaria: Number(b.mora),
    };
    const id = this.editando();
    this.ejecutar(
      this.servicio.guardar(id === 'nuevo' ? undefined : (id ?? undefined), datos),
      id === 'nuevo' ? 'Plan creado.' : 'Plan actualizado.',
    );
  }

  protected cambiarActivo(p: Plan): void {
    this.ejecutar(
      this.servicio.activar(p.id, !p.activo),
      p.activo ? 'Plan desactivado: ya no se ofrece en ventas nuevas.' : 'Plan activado.',
    );
  }

  private abrir(id: 'nuevo' | number, b: Borrador): void {
    this.borrador.set(b);
    this.intento.set(false);
    this.error.set(null);
    this.aviso.set(null);
    this.editando.set(id);
  }

  private ejecutar(accion: ReturnType<PlanesService['activar']>, aviso: string): void {
    this.ocupado.set(true);
    this.error.set(null);
    accion.subscribe({
      next: () => {
        this.aviso.set(aviso);
        this.editando.set(null);
        this.recurso.reload();
        this.ocupado.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
      },
    });
  }
}
