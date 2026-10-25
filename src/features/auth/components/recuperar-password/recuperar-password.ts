import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { PATRON_EMAIL } from '../../logic';
import { AuthService } from '../../services/auth.service';
import { MarcoAuth } from '../marco-auth/marco-auth';

/** Pedir el email para elegir una contraseña nueva (RF-05). */
@Component({
  selector: 'app-recuperar-password',
  imports: [RouterLink, MarcoAuth],
  template: `
    <app-marco-auth>
      <div class="flex flex-col gap-6">
        <header class="flex flex-col gap-2">
          <h2 class="text-h2">Recuperá tu contraseña</h2>
          <p class="text-fg-secondary">
            Te mandamos un link por email para que elijas una nueva.
          </p>
        </header>

        @if (enviado()) {
          <div role="status" class="flex flex-col gap-2 rounded-md bg-success-bg px-4 py-3.5 text-sm text-success">
            <p class="font-medium">Revisá tu correo</p>
            <p>
              Si hay una cuenta con {{ correo().trim() }}, en unos minutos te llega el link. Vence a
              los 30 minutos.
            </p>
          </div>
          <button type="button" class="boton boton-secundario" (click)="enviado.set(false)">
            Usar otro email
          </button>
        } @else {
          <form class="flex flex-col gap-5" novalidate (submit)="$event.preventDefault(); enviar()">
            @if (error(); as mensaje) {
              <div role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
                {{ mensaje }}
              </div>
            }
            <div class="flex flex-col gap-1.5">
              <label for="email" class="etiqueta">Email de tu cuenta</label>
              <input
                id="email"
                type="email"
                class="campo"
                autocomplete="email"
                placeholder="nombre@mail.com"
                [class.campo-invalido]="intento() && !valido()"
                [value]="correo()"
                (input)="correo.set($any($event.target).value)"
              />
              @if (intento() && !valido()) {
                <p class="error-campo">Ingresá un email válido.</p>
              }
            </div>
            <button type="submit" class="boton boton-primario h-12" [disabled]="enviando()">
              {{ enviando() ? 'Enviando…' : 'Enviarme el link' }}
            </button>
          </form>
        }

        <a routerLink="/auth/login" class="text-center text-sm font-medium text-fg-secondary hover:text-fg hover:underline">
          Volver a iniciar sesión
        </a>
      </div>
    </app-marco-auth>
  `,
})
export class RecuperarPassword {
  private readonly auth = inject(AuthService);

  /** ?email= viene del login, si ya lo había escrito. */
  readonly email = input<string>();

  protected readonly correo = linkedSignal(() => this.email() ?? '');
  protected readonly intento = signal(false);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected valido(): boolean {
    return PATRON_EMAIL.test(this.correo().trim());
  }

  protected enviar(): void {
    this.intento.set(true);
    if (!this.valido()) return;
    this.enviando.set(true);
    this.error.set(null);
    this.auth.recuperarPassword(this.correo().trim()).subscribe({
      next: () => {
        this.enviado.set(true);
        this.enviando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.enviando.set(false);
      },
    });
  }
}
