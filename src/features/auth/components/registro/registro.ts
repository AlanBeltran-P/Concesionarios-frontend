import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { erroresDelServidor } from '../../../../shared/utils/formularios';
import { PATRON_EMAIL, destinoDespuesDelLogin, errorDePassword } from '../../logic';
import { AuthService } from '../../services/auth.service';
import { CampoPassword } from '../campo-password/campo-password';
import { MarcoAuth } from '../marco-auth/marco-auth';

/** Registro de clientes en el portal (RF-02). Al terminar queda logueado. */
@Component({
  selector: 'app-registro',
  imports: [RouterLink, MarcoAuth, CampoPassword],
  template: `
    <app-marco-auth>
      <form class="flex flex-col gap-5" novalidate (submit)="$event.preventDefault(); registrar()">
        <header class="flex flex-col gap-2">
          <h2 class="text-h2">Creá tu cuenta</h2>
          <p class="text-fg-secondary">Para pedir cotizaciones, reservar y seguir tus cuotas.</p>
        </header>

        @if (error(); as mensaje) {
          <div role="alert" class="rounded-md bg-danger-bg px-4 py-3 text-sm text-danger">
            {{ mensaje }}
          </div>
        }

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label for="nombre" class="etiqueta">Nombre</label>
            <input
              id="nombre"
              class="campo"
              autocomplete="given-name"
              maxlength="80"
              [class.campo-invalido]="!!ver('nombre')"
              [value]="nombre()"
              (input)="nombre.set($any($event.target).value)"
            />
            @if (ver('nombre'); as e) {
              <p class="error-campo">{{ e }}</p>
            }
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="apellido" class="etiqueta">Apellido</label>
            <input
              id="apellido"
              class="campo"
              autocomplete="family-name"
              maxlength="80"
              [class.campo-invalido]="!!ver('apellido')"
              [value]="apellido()"
              (input)="apellido.set($any($event.target).value)"
            />
            @if (ver('apellido'); as e) {
              <p class="error-campo">{{ e }}</p>
            }
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="email" class="etiqueta">Email</label>
          <input
            id="email"
            type="email"
            class="campo"
            autocomplete="email"
            maxlength="150"
            placeholder="nombre@mail.com"
            [class.campo-invalido]="!!ver('email')"
            [value]="email()"
            (input)="email.set($any($event.target).value); servidor.set({})"
          />
          @if (ver('email'); as e) {
            <p class="error-campo">{{ e }}</p>
          }
        </div>

        <app-campo-password
          idCampo="password"
          etiqueta="Contraseña"
          ayuda="Al menos 8 caracteres, con letras y números."
          [error]="ver('password')"
          [(valor)]="password"
        />
        <app-campo-password
          idCampo="repetida"
          etiqueta="Repetí la contraseña"
          [error]="ver('repetida')"
          [(valor)]="repetida"
        />

        <button type="submit" class="boton boton-primario h-12" [disabled]="enviando()">
          {{ enviando() ? 'Creando la cuenta…' : 'Crear cuenta' }}
        </button>

        <p class="rounded-md bg-subtle px-4 py-3.5 text-center text-sm text-fg-secondary">
          ¿Ya tenés cuenta?
          <a
            routerLink="/auth/login"
            [queryParams]="{ redirect: redirect() || null }"
            class="font-medium text-fg underline-offset-2 hover:underline"
          >
            Ingresá
          </a>
        </p>
      </form>
    </app-marco-auth>
  `,
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Página a la que volver después de crear la cuenta (por ejemplo, el vehículo que miraba). */
  readonly redirect = input<string>();

  protected readonly nombre = signal('');
  protected readonly apellido = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly repetida = signal('');

  protected readonly intento = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Errores del backend por campo. */
  protected readonly servidor = signal<Record<string, string>>({});

  protected readonly errores = computed(() => {
    const e: Record<string, string> = {};
    if (!this.nombre().trim()) e['nombre'] = 'Completá tu nombre.';
    if (!this.apellido().trim()) e['apellido'] = 'Completá tu apellido.';
    if (!PATRON_EMAIL.test(this.email().trim())) e['email'] = 'Ingresá un email válido.';
    const p = errorDePassword(this.password());
    if (p) e['password'] = p;
    if (this.repetida() !== this.password()) e['repetida'] = 'No coincide con la contraseña.';
    return { ...e, ...this.servidor() };
  });

  protected ver(campo: string): string | null {
    return this.intento() ? (this.errores()[campo] ?? null) : null;
  }

  protected registrar(): void {
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return;
    this.enviando.set(true);
    this.error.set(null);
    this.auth
      .registrar({
        nombre: this.nombre().trim(),
        apellido: this.apellido().trim(),
        email: this.email().trim(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          // Sin página pendiente, a completar el perfil (lo necesita para comprar).
          const destino = this.redirect()
            ? destinoDespuesDelLogin(this.redirect(), 'CLIENTE')
            : '/cuenta/datos';
          void this.router.navigateByUrl(destino, {
            state: { aviso: '¡Listo, ya tenés tu cuenta!' },
          });
        },
        error: (err: unknown) => {
          const { campos, general } = erroresDelServidor(err, [[/email/i, 'email']]);
          this.servidor.set(campos);
          this.error.set(general);
          this.enviando.set(false);
        },
      });
  }
}
