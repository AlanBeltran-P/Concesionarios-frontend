import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { EstadoCarga } from './estado-carga';

/** Cuenta los pedidos en curso para mostrar la barra de carga de arriba. */
export const cargaInterceptor: HttpInterceptorFn = (req, next) => {
  const estado = inject(EstadoCarga);
  estado.empezoPedido();
  return next(req).pipe(finalize(() => estado.terminoPedido()));
};
