import { HttpInterceptorFn } from '@angular/common/http';
import { authInterceptor } from '../features/auth/services/auth.interceptor';

/** En la versión demo este archivo se reemplaza por interceptores.demo.ts (ver angular.json). */
export const interceptores: HttpInterceptorFn[] = [authInterceptor];
