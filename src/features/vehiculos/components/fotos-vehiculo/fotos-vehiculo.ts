import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { concatMap, from, toArray } from 'rxjs';
import { urlDelBackend } from '../../../../shared/utils/http';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { MAX_FOTOS, TIPOS_IMAGEN, errorDeImagen } from '../../logic';
import { ImagenVehiculo } from '../../model';
import { VehiculosService } from '../../services/vehiculos.service';

/** Fotos de un vehículo (RF-10): subir varias, elegir la principal y borrar. */
@Component({
  selector: 'app-fotos-vehiculo',
  templateUrl: './fotos-vehiculo.html',
})
export class FotosVehiculo {
  private readonly servicio = inject(VehiculosService);

  readonly vehiculoId = input.required<number>();
  readonly imagenesIniciales = input.required<ImagenVehiculo[]>();
  readonly deshabilitado = input(false);

  protected readonly tipos = TIPOS_IMAGEN.join(',');
  protected readonly maximo = MAX_FOTOS;
  protected readonly url = urlDelBackend;

  /** Copia local: se actualiza con cada cambio sin recargar todo el vehículo. */
  protected readonly imagenes = linkedSignal(() =>
    [...this.imagenesIniciales()].sort((a, b) => a.orden - b.orden),
  );
  protected readonly lugares = computed(() => MAX_FOTOS - this.imagenes().length);

  protected readonly subiendo = signal<{ hechas: number; total: number } | null>(null);
  protected readonly ocupado = signal(false);
  protected readonly errores = signal<string[]>([]);

  protected elegirArchivos(input: HTMLInputElement): void {
    const archivos = Array.from(input.files ?? []);
    input.value = '';
    if (!archivos.length) return;

    const errores = archivos.map(errorDeImagen).filter((e): e is string => !!e);
    const validos = archivos.filter((a) => !errorDeImagen(a));
    const entran = validos.slice(0, this.lugares());
    if (validos.length > entran.length) {
      errores.push(
        `Se pueden cargar hasta ${MAX_FOTOS} fotos: ${validos.length - entran.length} quedaron afuera.`,
      );
    }
    this.errores.set(errores);
    if (!entran.length) return;

    this.subiendo.set({ hechas: 0, total: entran.length });
    // De a una, para respetar el orden y no pasar el máximo si hay errores.
    from(entran)
      .pipe(
        concatMap((archivo) => this.servicio.subirImagen(this.vehiculoId(), archivo)),
        toArray(),
      )
      .subscribe({
        next: (nuevas) => {
          this.imagenes.update((lista) => [...lista, ...nuevas]);
          this.subiendo.set(null);
        },
        error: (err: unknown) => {
          this.errores.update((e) => [...e, mensajeDeError(err)]);
          this.subiendo.set(null);
          this.recargar();
        },
      });
  }

  protected hacerPrincipal(imagen: ImagenVehiculo): void {
    this.ocupado.set(true);
    this.servicio.marcarPrincipal(this.vehiculoId(), imagen.id).subscribe({
      next: () => {
        this.imagenes.update((lista) =>
          lista.map((i) => ({ ...i, principal: i.id === imagen.id })),
        );
        this.ocupado.set(false);
      },
      error: (err: unknown) => this.fallo(err),
    });
  }

  protected eliminar(imagen: ImagenVehiculo): void {
    if (!confirm('¿Borrar esta foto?')) return;
    this.ocupado.set(true);
    this.servicio.eliminarImagen(this.vehiculoId(), imagen.id).subscribe({
      next: () => {
        // Si era la principal, el backend elige la siguiente: se vuelve a leer.
        if (imagen.principal) this.recargar();
        else this.imagenes.update((lista) => lista.filter((i) => i.id !== imagen.id));
        this.ocupado.set(false);
      },
      error: (err: unknown) => this.fallo(err),
    });
  }

  private recargar(): void {
    this.servicio.obtener(this.vehiculoId()).subscribe((v) => {
      this.imagenes.set([...v.imagenes].sort((a, b) => a.orden - b.orden));
    });
  }

  private fallo(err: unknown): void {
    this.errores.set([mensajeDeError(err)]);
    this.ocupado.set(false);
  }
}
