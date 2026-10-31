import { HttpInterceptorFn } from '@angular/common/http';
import { cargaInterceptor } from '../shared/ui/carga/carga.interceptor';
import { authInterceptor } from '../features/auth/services/auth.interceptor';

/** En la versión demo este archivo se reemplaza por interceptores.demo.ts (ver angular.json). */
export const interceptores: HttpInterceptorFn[] = [cargaInterceptor, authInterceptor];
