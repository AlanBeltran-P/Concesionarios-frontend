import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, of } from 'rxjs';
import { Etiqueta } from '../../../../shared/ui/etiqueta/etiqueta';
import { Paginado } from '../../../../shared/ui/paginado/paginado';
import { formatearFecha, formatearPrecio, hoyISO } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import { AuthService } from '../../../auth/services/auth.service';
import { UsuariosService } from '../../../auth/services/usuarios.service';
import { ESTADO_COMISION } from '../../logic';
import { EstadoComision } from '../../model';
import { ComisionesService } from '../../services/comisiones.service';

/** Comisiones (RF-25): cada vendedor ve las suyas; el ADMIN ve todas y las marca como pagadas. */
@Component({
  selector: 'app-listado-comisiones',
  imports: [RouterLink, Etiqueta, Paginado],
  templateUrl: './listado-comisiones.html',
})
export class ListadoComisiones {
  private readonly servicio = inject(ComisionesService);
  private readonly usuarios = inject(UsuariosService);
  private readonly auth = inject(AuthService);

  protected readonly estadoComision = ESTADO_COMISION;
  protected readonly estados = Object.entries(ESTADO_COMISION) as [
    EstadoComision,
    { texto: string },
  ][];
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly esAdmin = computed(() => this.auth.usuario()?.rol === 'ADMIN');

  // Por defecto, el mes en curso.
  protected readonly desde = signal(hoyISO().slice(0, 8) + '01');
  protected readonly hasta = signal('');
  protected readonly vendedorId = signal<number | undefined>(undefined);
  protected readonly estado = signal<EstadoComision | undefined>(undefined);
  protected readonly pagina = signal(0);

  private readonly periodo = computed(() => ({
    vendedorId: this.vendedorId(),
    desde: this.desde() || undefined,
    hasta: this.hasta() || undefined,
  }));

  private readonly lista = rxResource({
    params: () => ({ ...this.periodo(), estado: this.estado(), page: this.pagina(), size: 20 }),
    stream: ({ params }) => this.servicio.buscar(params),
  });
  private readonly totales = rxResource({
    params: () => this.periodo(),
    stream: ({ params }) => this.servicio.resumen(params),
  });
  /** Para el filtro del ADMIN. */
  private readonly vendedores = rxResource({
    params: () => this.esAdmin(),
    stream: ({ params }) =>
      params
        ? this.usuarios.buscar({ rol: 'VENDEDOR', page: 0, size: 100 }).pipe(map((p) => p.content))
        : of([]),
  });

  protected readonly datos = computed(() => valorDe(this.lista));
  protected readonly resumen = computed(() => valorDe(this.totales));
  protected readonly listaVendedores = computed(() => valorDe(this.vendedores) ?? []);
  protected readonly cargando = computed(() => this.lista.isLoading());
  private readonly errorAccion = signal<string | null>(null);
  protected readonly error = computed(() => {
    const e = this.lista.error() ?? this.totales.error();
    return e ? mensajeDeError(e) : this.errorAccion();
  });
  protected readonly pagando = signal<number | null>(null);

  protected filtrar(filtro: 'vendedor' | 'estado' | 'desde' | 'hasta', valor: string): void {
    switch (filtro) {
      case 'vendedor':
        this.vendedorId.set(valor ? Number(valor) : undefined);
        break;
      case 'estado':
        this.estado.set((valor || undefined) as EstadoComision | undefined);
        break;
      case 'desde':
        this.desde.set(valor);
        break;
      case 'hasta':
        this.hasta.set(valor);
        break;
    }
    this.pagina.set(0);
  }

  protected pagar(id: number): void {
    this.pagando.set(id);
    this.errorAccion.set(null);
    this.servicio.pagar(id).subscribe({
      next: () => {
        this.lista.reload();
        this.totales.reload();
        this.pagando.set(null);
      },
      error: (err: unknown) => {
        this.errorAccion.set(mensajeDeError(err));
        this.pagando.set(null);
      },
    });
  }
}
