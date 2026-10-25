import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { PerfilActual } from './perfil-actual';

/** Cuenta del cliente en el portal (/cuenta): compras, cotizaciones, reservas y sus datos. */
@Component({
  selector: 'app-cuenta-cliente',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  providers: [PerfilActual],
  template: `
    <div class="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-8 pb-16 sm:px-8 lg:pb-20">
      <header class="flex flex-col gap-1">
        <h1 class="text-h2">Hola, {{ usuario()?.nombre }}</h1>
        <p class="text-fg-secondary">Seguí tus compras, cotizaciones y reservas.</p>
      </header>

      <nav class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Mi cuenta">
        <ul class="flex w-max gap-1 rounded-md bg-subtle p-1">
          @for (s of secciones; track s.ruta) {
            <li>
              <a
                [routerLink]="s.ruta"
                routerLinkActive
                #activo="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: s.exacto }"
                ariaCurrentWhenActive="page"
                class="flex h-9 items-center rounded-[7px] px-4 text-sm font-medium whitespace-nowrap transition"
                [class.bg-surface]="activo.isActive"
                [class.shadow-sm]="activo.isActive"
                [class.text-fg]="activo.isActive"
                [class.text-fg-secondary]="!activo.isActive"
              >
                {{ s.texto }}
                @if (s.ruta === '/cuenta/datos' && perfil.faltantes().length) {
                  <span class="ml-2 size-2 rounded-full bg-warning" aria-label="(faltan datos)"></span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      @if (aviso(); as mensaje) {
        <div role="status" class="flex items-start justify-between gap-3 rounded-md bg-success-bg px-4 py-3 text-sm text-success">
          <span>{{ mensaje }}</span>
          <button type="button" class="font-medium underline" (click)="aviso.set(null)">Cerrar</button>
        </div>
      }

      @if (perfil.faltantes().length && !enDatos()) {
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-warning-bg px-4 py-3 text-sm text-warning">
          <span>Para comprar necesitamos tu {{ perfil.faltantes().join(', ') }}.</span>
          <a routerLink="/cuenta/datos" class="font-medium underline">Completar mis datos</a>
        </div>
      }

      <router-outlet />
    </div>
  `,
})
export class CuentaCliente {
  private readonly router = inject(Router);
  protected readonly perfil = inject(PerfilActual);
  protected readonly usuario = inject(AuthService).usuario;

  protected readonly secciones = [
    { ruta: '/cuenta', texto: 'Mis compras', exacto: true },
    { ruta: '/cuenta/cotizaciones', texto: 'Cotizaciones', exacto: false },
    { ruta: '/cuenta/reservas', texto: 'Reservas', exacto: false },
    { ruta: '/cuenta/datos', texto: 'Mis datos', exacto: false },
  ];

  /** Mensaje que deja otra pantalla al llegar acá (ej. "Reserva hecha"). */
  protected readonly aviso = signal<string | null>(this.avisoDeLaNavegacion());
  protected readonly enDatos = signal(this.router.url.startsWith('/cuenta/datos'));

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.aviso.set(this.avisoDeLaNavegacion());
        this.enDatos.set(this.router.url.startsWith('/cuenta/datos'));
      });
  }

  private avisoDeLaNavegacion(): string | null {
    const nav = this.router.currentNavigation() ?? this.router.lastSuccessfulNavigation();
    return (nav?.extras.state?.['aviso'] as string | undefined) ?? null;
  }
}
