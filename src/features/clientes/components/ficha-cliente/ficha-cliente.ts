import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { formatearFecha, hoyISO } from '../../../../shared/utils/formato';
import { mostrarErroresEnFormulario } from '../../../../shared/utils/formularios';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import {
  PATRON_TELEFONO,
  PROVINCIAS,
  TIPOS_DOCUMENTO,
  errorDeDocumento,
  faltantesDelPerfil,
} from '../../logic';
import { Cliente, ClienteRequest, TipoDocumento } from '../../model';
import { ClientesService } from '../../services/clientes.service';
import { HistorialClienteComponent } from '../historial-cliente/historial-cliente';
import { EsqueletoFicha } from '../../../../shared/ui/carga/esqueleto-ficha';

/** El documento se valida según su tipo (DNI, CUIT con dígito verificador, etc.). */
function documentoValido(grupo: AbstractControl): ValidationErrors | null {
  const tipo = grupo.get('tipoDocumento')?.value as TipoDocumento;
  const numero = (grupo.get('numeroDocumento')?.value as string).trim();
  if (!numero) return null;
  const error = errorDeDocumento(tipo, numero);
  return error ? { documento: error } : null;
}

/** El backend pide al menos un email o un teléfono. */
function algunContacto(grupo: AbstractControl): ValidationErrors | null {
  const email = (grupo.get('email')?.value as string).trim();
  const telefono = (grupo.get('telefono')?.value as string).trim();
  return email || telefono ? null : { contacto: true };
}

/** La dirección es opcional, pero si se empieza a cargar hay que completarla. */
function direccionCompleta(grupo: AbstractControl): ValidationErrors | null {
  const v = grupo.value as Record<string, string>;
  const algo = Object.values(v).some((x) => x.trim());
  if (!algo) return null;
  const faltan = ['calle', 'numero', 'ciudad', 'provincia'].filter((c) => !v[c].trim());
  return faltan.length ? { incompleta: faltan } : null;
}

type Campo =
  | 'nombre'
  | 'apellido'
  | 'numeroDocumento'
  | 'email'
  | 'telefono'
  | 'fechaNacimiento'
  | 'direccion.calle'
  | 'direccion.numero'
  | 'direccion.ciudad'
  | 'direccion.provincia'
  | 'direccion.codigoPostal'
  | 'direccion.pisoDepto';

/** Alta (/panel/clientes/nuevo) y ficha de un cliente (/panel/clientes/:id) con su historial. */
@Component({
  selector: 'app-ficha-cliente',
  imports: [
    EsqueletoFicha,
    ReactiveFormsModule,
    RouterLink,
    Icono,
    Etiqueta,
    HistorialClienteComponent,
  ],
  templateUrl: './ficha-cliente.html',
})
export class FichaCliente {
  private readonly servicio = inject(ClientesService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly id = input<string>();

  protected readonly tiposDocumento = TIPOS_DOCUMENTO;
  protected readonly provincias = PROVINCIAS;
  protected readonly formatearFecha = formatearFecha;
  protected readonly hoy = hoyISO();

  protected readonly form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      apellido: ['', [Validators.required, Validators.maxLength(80)]],
      tipoDocumento: this.fb.control<TipoDocumento>('DNI'),
      numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
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
    { validators: [documentoValido, algunContacto] },
  );

  private readonly cliente = rxResource({
    params: () => (this.id() ? Number(this.id()) : undefined),
    stream: ({ params }) => this.servicio.obtener(params),
  });
  protected readonly actual = computed(() => valorDe(this.cliente));
  protected readonly esNuevo = computed(() => !this.id());
  protected readonly faltantes = computed(() => {
    const c = this.actual();
    return c ? faltantesDelPerfil(c) : [];
  });
  protected readonly errorCarga = computed(() => {
    const e = this.cliente.error();
    if (!e) return null;
    return e instanceof HttpErrorResponse && e.status === 404
      ? 'No encontramos ese cliente.'
      : mensajeDeError(e);
  });

  protected readonly guardando = signal(false);
  protected readonly intentoGuardar = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['aviso'] as string | undefined) ?? null,
  );

  constructor() {
    effect(() => {
      const c = this.actual();
      if (c) this.cargarEnFormulario(c);
    });
  }

  protected errorDe(campo: Campo): string | null {
    const control = this.form.get(campo)!;
    const visible = control.touched || this.intentoGuardar();
    if (!visible) return null;
    const e = control.errors ?? {};
    if (e['servidor']) return e['servidor'];
    if (e['required']) return 'Completá este campo.';
    if (e['email']) return 'Revisá el email.';
    if (e['pattern']) return 'Revisá el teléfono: solo números, espacios, guiones o paréntesis.';
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (campo === 'numeroDocumento' && this.form.errors?.['documento']) {
      return this.form.errors['documento'];
    }
    const faltan = this.form.controls.direccion.errors?.['incompleta'] as string[] | undefined;
    if (faltan?.includes(campo.replace('direccion.', ''))) return 'Completá este campo.';
    return null;
  }

  /** "Cargá al menos un email o un teléfono", debajo de los dos campos. */
  protected faltaContacto(): boolean {
    return this.intentoGuardar() && !!this.form.errors?.['contacto'];
  }

  protected guardar(): void {
    this.intentoGuardar.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const f = this.form.getRawValue();
    const d = f.direccion;
    const texto = (v: string) => v.trim() || null;
    const datos: ClienteRequest = {
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      tipoDocumento: f.tipoDocumento,
      numeroDocumento: f.numeroDocumento.trim(),
      email: texto(f.email),
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
    const id = this.actual()?.id;
    this.guardando.set(true);
    this.error.set(null);
    this.aviso.set(null);

    if (id === undefined) {
      this.servicio.crear(datos).subscribe({
        next: (creado) =>
          void this.router.navigate(['/panel/clientes', creado.id], {
            state: { aviso: 'Cliente cargado.' },
          }),
        error: (err: unknown) => this.mostrarError(err),
      });
    } else {
      this.servicio.actualizar(id, datos).subscribe({
        next: (actualizado) => {
          this.cliente.set(actualizado);
          this.aviso.set('Cambios guardados.');
          this.guardando.set(false);
        },
        error: (err: unknown) => this.mostrarError(err),
      });
    }
  }

  private mostrarError(err: unknown): void {
    this.guardando.set(false);
    this.error.set(
      mostrarErroresEnFormulario(this.form, err, [
        [/ con (DNI|CUIT|CUIL|PASAPORTE) /, 'numeroDocumento'],
        [/ con el email /, 'email'],
      ]),
    );
  }

  private cargarEnFormulario(c: Cliente): void {
    const d = c.direccion;
    this.form.reset({
      nombre: c.nombre,
      apellido: c.apellido,
      tipoDocumento: c.tipoDocumento ?? 'DNI',
      numeroDocumento: c.numeroDocumento ?? '',
      email: c.email ?? '',
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
    // Si tiene cuenta en el portal, el email lo cambia él desde su cuenta.
    if (c.tieneCuenta) this.form.controls.email.disable();
    else this.form.controls.email.enable();
    this.intentoGuardar.set(false);
  }
}
