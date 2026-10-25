import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { errorDePassword } from '../../logic';
import { AuthService } from '../../services/auth.service';
import { CampoPassword } from '../campo-password/campo-password';
import { MarcoAuth } from '../marco-auth/marco-auth';

/** Elegir una contraseña nueva con el link del email (/restablecer-password?token=...). RF-05. */
@Component({
  selector: 'app-restablecer-password',
  imports: [RouterLink, MarcoAuth, CampoPassword],
  template: `
    <app-marco-auth>
      <div class="flex flex-col gap-6">
        <header class="flex flex-col gap-2">
          <h2 class="text-h2">Elegí una contraseña nueva</h2>
          <p class="text-fg-secondary">Después vas a ingresar con ella.</p>
        </header>

        @if (!token()) {
          <div role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
            El link está incompleto. Abrilo de nuevo desde el email o pedí uno nuevo.
          </div>
          <a routerLink="/auth/recuperar" class="boton boton-primario">Pedir un link nuevo</a>
        } @else {
          <form class="flex flex-col gap-5" novalidate (submit)="$event.preventDefault(); guardar()">
            @if (error(); as mensaje) {
              <div role="alert" class="flex flex-col gap-1 rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
                <p>{{ mensaje }}</p>
                <a routerLink="/auth/recuperar" class="font-medium underline">Pedir un link nuevo</a>
              </div>
            }
            <app-campo-password
              idCampo="nueva"
              etiqueta="Contraseña nueva"
              ayuda="Al menos 8 caracteres, con letras y números."
              [error]="intento() ? errores()['nueva'] : null"
              [(valor)]="nueva"
            />
            <app-campo-password
              idCampo="repetida"
              etiqueta="Repetí la contraseña"
              [error]="intento() ? errores()['repetida'] : null"
              [(valor)]="repetida"
            />
            <button type="submit" class="boton boton-primario h-12" [disabled]="guardando()">
              {{ guardando() ? 'Guardando…' : 'Guardar contraseña' }}
            </button>
          </form>
        }
      </div>
    </app-marco-auth>
  `,
})
export class RestablecerPassword {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly token = input<string>();

  protected readonly nueva = signal('');
  protected readonly repetida = signal('');
  protected readonly intento = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errores = computed(() => {
    const e: Record<string, string> = {};
    const p = errorDePassword(this.nueva());
    if (p) e['nueva'] = p;
    if (this.repetida() !== this.nueva()) e['repetida'] = 'No coincide con la nueva.';
    return e;
  });

  protected guardar(): void {
    this.intento.set(true);
    const token = this.token();
    if (!token || Object.keys(this.errores()).length) return;
    this.guardando.set(true);
    this.error.set(null);
    this.auth.restablecerPassword(token, this.nueva()).subscribe({
      next: () => {
        // Si había una sesión abierta en este navegador, el backend ya la cerró.
        if (this.auth.autenticado()) {
          this.auth.cerrarSesionLocal('Listo, ya podés ingresar con tu contraseña nueva.');
        } else {
          void this.router.navigate(['/auth/login'], {
            state: { aviso: 'Listo, ya podés ingresar con tu contraseña nueva.' },
          });
        }
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.guardando.set(false);
      },
    });
  }
}
