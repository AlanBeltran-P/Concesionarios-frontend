import { Injectable, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { valorDe } from '../../../../shared/utils/recurso';
import { faltantesDelPerfil } from '../../logic';
import { Cliente } from '../../model';
import { ClientesService } from '../../services/clientes.service';

/**
 * El perfil del cliente logueado, compartido entre las pantallas de su cuenta.
 * Lo provee CuentaCliente: al guardar en "Mis datos" se actualiza el aviso de datos faltantes.
 */
@Injectable()
export class PerfilActual {
  private readonly servicio = inject(ClientesService);

  private readonly recurso = rxResource({ stream: () => this.servicio.miPerfil() });
  readonly cliente = computed(() => valorDe(this.recurso));
  readonly cargando = computed(() => this.recurso.isLoading());
  readonly error = computed(() => this.recurso.error());
  readonly faltantes = computed(() => {
    const c = this.cliente();
    return c ? faltantesDelPerfil(c) : [];
  });

  actualizar(cliente: Cliente): void {
    this.recurso.set(cliente);
  }
}
