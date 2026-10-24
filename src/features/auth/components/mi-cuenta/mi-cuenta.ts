import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatearFecha } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { NOMBRE_ROL, errorDePassword } from '../../logic';
import { AuthService } from '../../services/auth.service';

/** Mi cuenta (/panel/mi-cuenta): mis datos y cambiar la contraseña (RF-05). */
@Component({
  selector: 'app-mi-cuenta',
  templateUrl: './mi-cuenta.html',
})
export class MiCuenta {
  private readonly auth = inject(AuthService);

  protected readonly nombreRol = NOMBRE_ROL;
  protected readonly formatearFecha = formatearFecha;

  private readonly recurso = rxResource({ stream: () => this.auth.yo() });
  protected readonly yo = computed(() => valorDe(this.recurso));

  protected readonly actual = signal('');
  protected readonly nueva = signal('');
  protected readonly repetida = signal('');
  protected readonly ver = signal(false);
  protected readonly intento = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errores = computed(() => {
    const e: Record<string, string> = {};
    if (!this.actual()) e['actual'] = 'Ingresá tu contraseña actual.';
    const p = errorDePassword(this.nueva());
    if (p) e['nueva'] = p;
    else if (this.nueva() === this.actual()) e['nueva'] = 'Tiene que ser distinta de la actual.';
    if (this.repetida() !== this.nueva()) e['repetida'] = 'No coincide con la nueva.';
    return e;
  });

  protected cambiar(): void {
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return;
    this.guardando.set(true);
    this.error.set(null);
    this.auth.cambiarPassword(this.actual(), this.nueva()).subscribe({
      // El backend cerró todas las sesiones: se vuelve a ingresar con la nueva.
      next: () =>
        this.auth.cerrarSesionLocal('Listo, cambiaste tu contraseña. Ingresá con la nueva.'),
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.guardando.set(false);
      },
    });
  }
}
