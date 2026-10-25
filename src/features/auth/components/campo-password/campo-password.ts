import { Component, input, model, signal } from '@angular/core';
import { Icono } from '../../../../shared/ui/icono/icono';

/** Campo de contraseña con botón para mostrarla. Se usa con [(valor)]. */
@Component({
  selector: 'app-campo-password',
  imports: [Icono],
  template: `
    <div class="flex flex-col gap-1.5">
      <label [for]="idCampo()" class="etiqueta">{{ etiqueta() }}</label>
      <div class="relative">
        <input
          [id]="idCampo()"
          [type]="ver() ? 'text' : 'password'"
          class="campo pr-11"
          [class.campo-invalido]="!!error()"
          [autocomplete]="autocomplete()"
          [value]="valor()"
          (input)="valor.set($any($event.target).value)"
          [attr.aria-invalid]="!!error()"
          [attr.aria-describedby]="idCampo() + '-ayuda'"
        />
        <button
          type="button"
          class="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1.5 text-fg-muted hover:text-fg"
          [attr.aria-label]="ver() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          (click)="ver.set(!ver())"
        >
          <app-icono [nombre]="ver() ? 'ojo-tachado' : 'ojo'" class="size-[18px]" />
        </button>
      </div>
      @if (error(); as e) {
        <p [id]="idCampo() + '-ayuda'" class="error-campo">{{ e }}</p>
      } @else if (ayuda()) {
        <p [id]="idCampo() + '-ayuda'" class="text-xs text-fg-muted">{{ ayuda() }}</p>
      }
    </div>
  `,
})
export class CampoPassword {
  readonly idCampo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly autocomplete = input('new-password');
  readonly error = input<string | null | undefined>(null);
  readonly ayuda = input<string | null>(null);
  readonly valor = model('');

  protected readonly ver = signal(false);
}
