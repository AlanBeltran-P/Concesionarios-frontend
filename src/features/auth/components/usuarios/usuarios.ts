import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Icono } from '../../../../shared/ui/icono/icono';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { NOMBRE_ROL, errorDePassword } from '../../logic';
import { Rol, Usuario } from '../../model';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';

type RolEmpleado = 'ADMIN' | 'VENDEDOR';

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Usuarios del sistema (RF-01, RF-06). Solo ADMIN. */
@Component({
  selector: 'app-usuarios',
  imports: [Etiqueta, Icono, Paginado],
  templateUrl: './usuarios.html',
})
export class Usuarios {
  private readonly servicio = inject(UsuariosService);
  private readonly auth = inject(AuthService);

  protected readonly nombreRol = NOMBRE_ROL;
  protected readonly formatearFecha = formatearFecha;
  protected readonly miId = computed(() => this.auth.usuario()?.id);

  // Filtros
  protected readonly texto = signal('');
  private readonly textoBuscado = signal('');
  protected readonly rol = signal<Rol | undefined>(undefined);
  protected readonly activo = signal<boolean | undefined>(undefined);
  protected readonly pagina = signal(0);
  private temporizador?: ReturnType<typeof setTimeout>;

  private readonly recurso = rxResource({
    params: () => ({
      texto: this.textoBuscado().trim() || undefined,
      rol: this.rol(),
      activo: this.activo(),
      page: this.pagina(),
      size: 20,
    }),
    stream: ({ params }) => this.servicio.buscar(params),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly cargando = computed(() => this.recurso.isLoading());
  protected readonly errorCarga = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });

  // Alta
  protected readonly creando = signal(false);
  protected readonly nombre = signal('');
  protected readonly apellido = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly verPassword = signal(false);
  protected readonly rolNuevo = signal<RolEmpleado>('VENDEDOR');
  protected readonly intento = signal(false);
  protected readonly errores = computed(() => {
    const e: Record<string, string> = {};
    if (!this.nombre().trim()) e['nombre'] = 'Completá el nombre.';
    if (!this.apellido().trim()) e['apellido'] = 'Completá el apellido.';
    if (!PATRON_EMAIL.test(this.email().trim())) e['email'] = 'Ingresá un email válido.';
    const p = errorDePassword(this.password());
    if (p) e['password'] = p;
    return e;
  });

  protected readonly ocupado = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected buscar(valor: string): void {
    this.texto.set(valor);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => {
      this.textoBuscado.set(valor);
      this.pagina.set(0);
    }, 300);
  }

  protected filtrarRol(valor: string): void {
    this.rol.set((valor || undefined) as Rol | undefined);
    this.pagina.set(0);
  }

  protected filtrarEstado(valor: string): void {
    this.activo.set(valor === '' ? undefined : valor === 'true');
    this.pagina.set(0);
  }

  protected abrirAlta(): void {
    this.nombre.set('');
    this.apellido.set('');
    this.email.set('');
    this.password.set('');
    this.rolNuevo.set('VENDEDOR');
    this.intento.set(false);
    this.error.set(null);
    this.aviso.set(null);
    this.creando.set(true);
  }

  protected crear(): void {
    this.intento.set(true);
    if (Object.keys(this.errores()).length) return;
    this.ejecutar(
      this.servicio.crear({
        nombre: this.nombre().trim(),
        apellido: this.apellido().trim(),
        email: this.email().trim(),
        password: this.password(),
        rol: this.rolNuevo(),
      }),
      `Listo: ${this.nombre().trim()} ya puede ingresar con ${this.email().trim()}.`,
      () => this.creando.set(false),
    );
  }

  protected cambiarRol(u: Usuario, rol: string): void {
    this.ejecutar(
      this.servicio.cambiarRol(u.id, rol as Rol),
      `${u.nombre} ${u.apellido} ahora es ${NOMBRE_ROL[rol as Rol].toLowerCase()}. Se le cerró la sesión para que el cambio aplique.`,
    );
  }

  protected cambiarEstado(u: Usuario): void {
    this.ejecutar(
      this.servicio.cambiarEstado(u.id, !u.activo),
      u.activo
        ? `${u.nombre} ${u.apellido} ya no puede ingresar.`
        : `${u.nombre} ${u.apellido} puede volver a ingresar.`,
    );
  }

  private ejecutar(accion: Observable<unknown>, aviso: string, alTerminar?: () => void): void {
    this.ocupado.set(true);
    this.error.set(null);
    this.aviso.set(null);
    accion.subscribe({
      next: () => {
        alTerminar?.();
        this.aviso.set(aviso);
        this.recurso.reload();
        this.ocupado.set(false);
      },
      error: (err: unknown) => {
        this.error.set(mensajeDeError(err));
        this.ocupado.set(false);
        // Si el select cambió pero el backend lo rechazó, vuelve a mostrar el rol real.
        this.recurso.reload();
      },
    });
  }
}
