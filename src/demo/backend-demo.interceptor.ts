import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, defer, delay, from, mergeMap, of, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { BackendDemo } from './backend-demo';
import { Datos, ErrorDemo } from './base-demo';
import { VERSION_DATOS, datosIniciales } from './datos-iniciales';

const CLAVE = 'concesionaria.demo.datos';

/**
 * Lo que tarda en responder el "backend" de la demo, en milisegundos. Imita a los microservicios
 * (gateway + servicio + base de datos) para que se vean las pantallas de carga.
 * Las consultas tardan menos que las operaciones que guardan algo.
 */
const DEMORA = { consulta: [700, 1500], operacion: [1000, 2000] } as const;

function demora(metodo: string): number {
  const [min, max] = metodo === 'GET' ? DEMORA.consulta : DEMORA.operacion;
  return min + Math.random() * (max - min);
}

let backend: BackendDemo | null = null;

/** Los datos se guardan en el navegador: lo que se crea en la demo sigue ahí al recargar. */
function obtenerBackend(): BackendDemo {
  if (!backend) {
    let datos: Datos | null = null;
    try {
      const guardados = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Datos | null;
      if (guardados?.version === VERSION_DATOS) datos = guardados;
    } catch {
      // Sin storage o con datos rotos se arranca de cero.
    }
    backend = new BackendDemo(datos ?? datosIniciales());
  }
  return backend;
}

function guardar(b: BackendDemo) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(b.d));
  } catch {
    // Storage lleno (por ejemplo, muchas fotos subidas): los cambios duran hasta recargar.
  }
}

/** Vuelve a los datos de ejemplo originales. */
export function reiniciarDemo(): void {
  backend = new BackendDemo(datosIniciales());
  guardar(backend);
}

/**
 * Solo en la versión demo: responde los pedidos al backend sin salir del navegador.
 * Va después de authInterceptor, así recibe el token que agrega.
 */
export const backendDemoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl + '/')) return next(req);

  return defer(() => {
    const b = obtenerBackend();
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;
    let resultado: unknown;
    try {
      resultado = b.atender({
        metodo: req.method,
        ruta: req.url.slice(environment.apiUrl.length),
        param: (nombre) => req.params.get(nombre),
        cuerpo: req.body,
        usuario: b.usuarioDelToken(token),
      });
    } catch (e) {
      return throwError(() => e);
    }
    const respuesta = resultado instanceof Promise ? from(resultado) : of(resultado);
    return respuesta.pipe(
      mergeMap((cuerpo) => {
        if (req.method !== 'GET') guardar(b);
        return of(
          new HttpResponse({ status: cuerpo === null ? 204 : 200, body: cuerpo, url: req.url }),
        );
      }),
    );
  }).pipe(delay(demora(req.method)), mapearError(req.url));
};

function mapearError(url: string) {
  return <T>(fuente: Observable<T>) =>
    new Observable<T>((suscriptor) =>
      fuente.subscribe({
        next: (v) => suscriptor.next(v),
        complete: () => suscriptor.complete(),
        error: (e: unknown) => {
          if (!(e instanceof ErrorDemo)) {
            console.error('[demo]', e);
            e = new ErrorDemo(500, 'Ocurrió un error inesperado en la demo.');
          }
          const { status, detail, errores } = e as ErrorDemo;
          setTimeout(
            () =>
              suscriptor.error(
                new HttpErrorResponse({
                  status,
                  url,
                  error: { status, title: 'Error', detail, errores },
                }),
              ),
            150,
          );
        },
      }),
    );
}
