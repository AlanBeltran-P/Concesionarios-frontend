import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Icono } from '../../../../shared/ui/icono/icono';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { destinoDespuesDelLogin } from '../../logic';
import { AuthService } from '../../services/auth.service';
import { MarcoAuth } from '../marco-auth/marco-auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icono, MarcoAuth],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Página a la que volver después del login (?redirect=/ventas). */
  readonly redirect = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Mensaje que deja otra pantalla al mandar al login (ej. después de cambiar la contraseña). */
  protected readonly aviso = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['aviso'] as string | undefined) ?? null,
  );
  protected readonly verPassword = signal(false);
  /** Solo en la versión demo: las cuentas de ejemplo para entrar con un clic. */
  protected readonly cuentasDemo = environment.cuentasDemo;

  protected usarCuenta(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.ingresar();
  }

  protected campoInvalido(campo: 'email' | 'password'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  protected ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () =>
        void this.router.navigateByUrl(
          destinoDespuesDelLogin(this.redirect(), this.auth.usuario()?.rol),
        ),
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
