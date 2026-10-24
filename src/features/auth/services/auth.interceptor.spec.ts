import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenResponse } from '../model';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

const API = environment.apiUrl;

function tokens(accessToken: string, refreshToken: string): TokenResponse {
  return {
    accessToken,
    refreshToken,
    tipo: 'Bearer',
    expiraEn: 1800,
    usuario: {
      id: 1,
      email: 'admin@concesionaria.com',
      nombre: 'Ana',
      apellido: 'Pérez',
      rol: 'ADMIN',
      activo: true,
      fechaCreacion: '2026-01-01T00:00:00',
    },
  };
}

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'auth/login', children: [] }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => backend.verify());

  function loguear(): void {
    auth.login({ email: 'admin@concesionaria.com', password: 'secreta' }).subscribe();
    backend.expectOne(`${API}/auth/login`).flush(tokens('access-1', 'refresh-1'));
  }

  it('no agrega token si no hay sesión', () => {
    http.get(`${API}/vehiculos`).subscribe();
    const req = backend.expectOne(`${API}/vehiculos`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('agrega el token a los pedidos al backend', () => {
    loguear();
    http.get(`${API}/ventas`).subscribe();
    const req = backend.expectOne(`${API}/ventas`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush([]);
  });

  it('no manda el token a otros dominios', () => {
    loguear();
    http.get('https://otro-sitio.com/datos').subscribe();
    const req = backend.expectOne('https://otro-sitio.com/datos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('con 401 renueva el token una sola vez y reintenta los pedidos', () => {
    loguear();
    const respuestas: unknown[] = [];
    http.get(`${API}/ventas`).subscribe((r) => respuestas.push(r));
    http.get(`${API}/clientes`).subscribe((r) => respuestas.push(r));

    const noAutorizado = { status: 401, statusText: 'Unauthorized' };
    backend.expectOne(`${API}/ventas`).flush(null, noAutorizado);
    backend.expectOne(`${API}/clientes`).flush(null, noAutorizado);

    const refresh = backend.expectOne(`${API}/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush(tokens('access-2', 'refresh-2'));

    const reintentos = backend.match((r) => r.headers.get('Authorization') === 'Bearer access-2');
    expect(reintentos.map((r) => r.request.url).sort()).toEqual([
      `${API}/clientes`,
      `${API}/ventas`,
    ]);
    reintentos.forEach((r) => r.flush({ ok: true }));

    expect(respuestas).toEqual([{ ok: true }, { ok: true }]);
    expect(auth.accessToken).toBe('access-2');
  });

  it('si el refresh falla, cierra la sesión', () => {
    loguear();
    let fallo = false;
    http.get(`${API}/ventas`).subscribe({ error: () => (fallo = true) });

    backend.expectOne(`${API}/ventas`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend
      .expectOne(`${API}/auth/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(fallo).toBe(true);
    expect(auth.autenticado()).toBe(false);
    expect(localStorage.length).toBe(0);
  });
});
