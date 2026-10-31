import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { formatearFecha } from '../../../../shared/utils/formato';
import { valorDe } from '../../../../shared/utils/recurso';
import { NOMBRE_ROL } from '../../logic';
import { AuthService } from '../../services/auth.service';
import { CambiarPassword } from '../cambiar-password/cambiar-password';
import { EsqueletoLineas } from '../../../../shared/ui/carga/esqueleto-lineas';

/** Mi cuenta (/panel/mi-cuenta): mis datos y cambiar la contraseña (RF-05). */
@Component({
  selector: 'app-mi-cuenta',
  imports: [EsqueletoLineas, CambiarPassword],
  templateUrl: './mi-cuenta.html',
})
export class MiCuenta {
  private readonly auth = inject(AuthService);

  protected readonly nombreRol = NOMBRE_ROL;
  protected readonly formatearFecha = formatearFecha;

  private readonly recurso = rxResource({ stream: () => this.auth.yo() });
  protected readonly yo = computed(() => valorDe(this.recurso));
}
