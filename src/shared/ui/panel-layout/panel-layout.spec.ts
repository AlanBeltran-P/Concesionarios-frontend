import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Rol, Sesion } from '../../../features/auth/model';
import { PanelLayout } from './panel-layout';
import { menuParaRol } from './menu';

function iniciarSesionComo(rol: Rol): void {
  const sesion: Sesion = {
    accessToken: 'a',
    refreshToken: 'r',
    usuario: {
      id: 1,
      email: 'ana@concesionaria.com',
      nombre: 'Ana',
      apellido: 'Gómez',
      rol,
      activo: true,
      fechaCreacion: '2026-10-24T00:00:00',
    },
  };
  localStorage.setItem('concesionaria.sesion', JSON.stringify(sesion));
}

async function renderizar(): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [PanelLayout],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  }).compileComponents();
  const fixture = TestBed.createComponent(PanelLayout);
  await fixture.whenStable();
  return fixture.nativeElement;
}

const textosDelMenu = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('nav a')).map((a) => a.textContent?.trim());

describe('PanelLayout', () => {
  beforeEach(() => localStorage.clear());

  it('al ADMIN le muestra todas las secciones', async () => {
    iniciarSesionComo('ADMIN');
    const el = await renderizar();
    expect(textosDelMenu(el)).toContain('Dashboard');
    expect(textosDelMenu(el)).toContain('Usuarios');
    expect(el.textContent).toContain('Administrador');
    expect(el.textContent).toContain('AG');
  });

  it('al vendedor no le muestra lo que es solo para ADMIN', async () => {
    iniciarSesionComo('VENDEDOR');
    const el = await renderizar();
    expect(textosDelMenu(el)).toEqual([
      'Vehículos',
      'Clientes',
      'Cotizaciones',
      'Ventas',
      'Financiamiento',
    ]);
  });
});

describe('menuParaRol', () => {
  it('saca las secciones que quedan vacías', () => {
    expect(menuParaRol('VENDEDOR').map((s) => s.titulo)).toEqual(['Gestión']);
    expect(menuParaRol('CLIENTE')).toEqual([]);
    expect(menuParaRol(undefined)).toEqual([]);
  });
});
