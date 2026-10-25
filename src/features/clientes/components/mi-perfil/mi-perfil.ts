import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CambiarPassword } from '../../../auth/components/cambiar-password/cambiar-password';
import { hoyISO } from '../../../../shared/utils/formato';
import { mostrarErroresEnFormulario } from '../../../../shared/utils/formularios';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { PATRON_TELEFONO, PROVINCIAS, TIPOS_DOCUMENTO, errorDeDocumento } from '../../logic';
import { Cliente, PerfilRequest, TipoDocumento } from '../../model';
import { ClientesService } from '../../services/clientes.service';
import { PerfilActual } from '../cuenta-cliente/perfil-actual';

function documentoValido(grupo: AbstractControl): ValidationErrors | null {
  const tipo = grupo.get('tipoDocumento')?.value as TipoDocumento;
  const numero = (grupo.get('numeroDocumento')?.value as string).trim();
  if (!numero) return null;
  const error = errorDeDocumento(tipo, numero);
  return error ? { documento: error } : null;
}

/** La dirección se puede dejar vacía, pero si se empieza a cargar hay que completarla. */
function direccionCompleta(grupo: AbstractControl): ValidationErrors | null {
  const v = grupo.value as Record<string, string>;
  if (!Object.values(v).some((x) => x.trim())) return null;
  const faltan = ['calle', 'numero', 'ciudad', 'provincia'].filter((c) => !v[c].trim());
  return faltan.length ? { incompleta: faltan } : null;
}

type Campo =
  | 'numeroDocumento'
  | 'telefono'
  | 'fechaNacimiento'
  | 'direccion.calle'
  | 'direccion.numero'
  | 'direccion.ciudad'
  | 'direccion.provincia';

/** Mis datos (/cuenta/datos): el cliente completa su perfil (RF-15) y cambia su contraseña. */
@Component({
  selector: 'app-mi-perfil',
  imports: [ReactiveFormsModule, CambiarPassword],
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {
  private readonly servicio = inject(ClientesService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly perfil = inject(PerfilActual);

  protected readonly tiposDocumento = TIPOS_DOCUMENTO;
  protected readonly provincias = PROVINCIAS;
  protected readonly hoy = hoyISO();

  protected readonly form = this.fb.group(
    {
      tipoDocumento: this.fb.control<TipoDocumento>('DNI'),
      numeroDocumento: ['', Validators.maxLength(20)],
      telefono: ['', Validators.pattern(PATRON_TELEFONO)],
      fechaNacimiento: [''],
      direccion: this.fb.group(
        {
          calle: ['', Validators.maxLength(120)],
          numero: ['', Validators.maxLength(10)],
          pisoDepto: ['', Validators.maxLength(20)],
          ciudad: ['', Validators.maxLength(80)],
          provincia: ['', Validators.maxLength(80)],
          codigoPostal: ['', Validators.maxLength(10)],
        },
        { validators: direccionCompleta },
      ),
    },
    { validators: documentoValido },
  );

  protected readonly intento = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly guardado = signal(false);
  protected readonly errorCarga = computed(() => {
    const e = this.perfil.error();
    return e ? mensajeDeError(e) : null;
  });

  constructor() {
    effect(() => {
      const c = this.perfil.cliente();
      if (c) this.cargar(c);
    });
  }

  protected errorDe(campo: Campo): string | null {
    const control = this.form.get(campo)!;
    if (!control.touched && !this.intento()) return null;
    const e = control.errors ?? {};
    if (e['servidor']) return e['servidor'];
    if (e['pattern']) return 'Revisá el teléfono: solo números, espacios, guiones o paréntesis.';
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (campo === 'numeroDocumento' && this.form.errors?.['documento']) {
      return this.form.errors['documento'];
    }
    const faltan = this.form.controls.direccion.errors?.['incompleta'] as string[] | undefined;
    if (faltan?.includes(campo.replace('direccion.', ''))) return 'Completá este campo.';
    return null;
  }

  protected guardar(): void {
    this.intento.set(true);
    this.guardado.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const f = this.form.getRawValue();
    const d = f.direccion;
    const texto = (v: string) => v.trim() || null;
    const numero = texto(f.numeroDocumento);
    const datos: PerfilRequest = {
      tipoDocumento: numero ? f.tipoDocumento : null,
      numeroDocumento: numero,
      telefono: texto(f.telefono),
      fechaNacimiento: f.fechaNacimiento || null,
      direccion: d.calle.trim()
        ? {
            calle: d.calle.trim(),
            numero: d.numero.trim(),
            pisoDepto: texto(d.pisoDepto),
            ciudad: d.ciudad.trim(),
            provincia: d.provincia.trim(),
            codigoPostal: texto(d.codigoPostal),
          }
        : null,
    };
    this.guardando.set(true);
    this.error.set(null);
    this.servicio.actualizarMiPerfil(datos).subscribe({
      next: (cliente) => {
        this.perfil.actualizar(cliente);
        this.guardando.set(false);
        this.guardado.set(true);
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.error.set(
          mostrarErroresEnFormulario(this.form, err, [
            [/ con (DNI|CUIT|CUIL|PASAPORTE) /, 'numeroDocumento'],
          ]),
        );
      },
    });
  }

  private cargar(c: Cliente): void {
    const d = c.direccion;
    this.form.reset({
      tipoDocumento: c.tipoDocumento ?? 'DNI',
      numeroDocumento: c.numeroDocumento ?? '',
      telefono: c.telefono ?? '',
      fechaNacimiento: c.fechaNacimiento ?? '',
      direccion: {
        calle: d?.calle ?? '',
        numero: d?.numero ?? '',
        pisoDepto: d?.pisoDepto ?? '',
        ciudad: d?.ciudad ?? '',
        provincia: d?.provincia ?? '',
        codigoPostal: d?.codigoPostal ?? '',
      },
    });
    this.intento.set(false);
  }
}
