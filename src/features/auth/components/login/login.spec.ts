import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let backend: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    backend = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  function completar(email: string, password: string): void {
    const inputs = el.querySelectorAll('input');
    inputs[0].value = email;
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = password;
    inputs[1].dispatchEvent(new Event('input'));
  }

  async function enviar(): Promise<void> {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('no llama al backend si el formulario está incompleto', async () => {
    await enviar();
    backend.expectNone(`${environment.apiUrl}/auth/login`);
    expect(el.textContent).toContain('Ingresá un email válido.');
  });

  it('muestra el mensaje del backend si las credenciales son incorrectas', async () => {
    completar('admin@concesionaria.com', 'mala');
    await enviar();
    backend
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(
        { status: 401, detail: 'Email o contraseña incorrectos' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await fixture.whenStable();
    expect(el.querySelector('[role=alert]')?.textContent).toContain(
      'Email o contraseña incorrectos',
    );
  });

  it('con login correcto navega a la página pedida', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('redirect', '/ventas');
    completar('admin@concesionaria.com', 'secreta');
    await enviar();
    backend.expectOne(`${environment.apiUrl}/auth/login`).flush({
      accessToken: 'a',
      refreshToken: 'r',
      tipo: 'Bearer',
      expiraEn: 1800,
      usuario: { id: 1, email: 'admin@concesionaria.com', rol: 'ADMIN' },
    });
    expect(navegar).toHaveBeenCalledWith('/ventas');
  });

  it('ignora redirecciones a otros sitios y manda al inicio de su rol', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentRef.setInput('redirect', '//sitio-malicioso.com');
    completar('admin@concesionaria.com', 'secreta');
    await enviar();
    backend.expectOne(`${environment.apiUrl}/auth/login`).flush({
      accessToken: 'a',
      refreshToken: 'r',
      tipo: 'Bearer',
      expiraEn: 1800,
      usuario: { id: 1, email: 'admin@concesionaria.com', rol: 'ADMIN' },
    });
    expect(navegar).toHaveBeenCalledWith('/panel');
  });
});
