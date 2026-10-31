import { HttpInterceptorFn } from '@angular/common/http';
import { backendDemoInterceptor } from '../demo/backend-demo.interceptor';
import { cargaInterceptor } from '../shared/ui/carga/carga.interceptor';
import { authInterceptor } from '../features/auth/services/auth.interceptor';

/** Versión demo: sin backend, backendDemoInterceptor responde todos los pedidos a /api. */
export const interceptores: HttpInterceptorFn[] = [
  cargaInterceptor,
  authInterceptor,
  backendDemoInterceptor,
];
