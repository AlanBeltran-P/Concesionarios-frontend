# Concesionaria · Frontend

Frontend del [Sistema de Gestión para Concesionarios](https://github.com/AlanBeltran-P/Sistema-de-Gestion-para-Concesionarios).
Una sola aplicación con tres partes:

- **Sitio público:** catálogo con buscador y filtros, detalle de cada vehículo con fotos y
  simulador de cuotas, y la página de planes de financiación.
- **Cuenta del cliente:** registro, recuperar la contraseña, pedir cotizaciones, reservar con seña,
  ver sus compras con el estado de las cuotas y completar su perfil.
- **Panel de gestión** (empleados): dashboard, vehículos con fotos, marcas y modelos, clientes,
  cotizaciones y tasaciones, reservas y ventas, financiamiento y pagos, comisiones, reportes,
  notificaciones y usuarios.

## Tecnologías

- Angular 22 (componentes standalone, signals, `rxResource`, rutas con carga diferida)
- Tailwind CSS 4, con los colores y tipografías del diseño en Figma
- Vitest para los tests
- Docker: se compila con Node y se sirve con nginx

## Cómo levantarlo

El frontend necesita el backend corriendo (el api-gateway en http://localhost:8080).

### Con Docker, junto con todo el sistema (recomendado)

Las dos carpetas van juntas, una al lado de la otra:

```
Concesionaria-System/
├── docker-compose.yml          levanta backend + frontend
├── concesionaria/              backend (este otro repositorio)
└── concesionaria-frontend/     este repositorio
```

Desde `Concesionaria-System/`:

```bash
docker compose up -d --build
```

La primera vez tarda unos minutos porque compila todo. Después abrí http://localhost:4200.

Para recompilar solo el frontend después de cambiar código:

```bash
docker compose up -d --build frontend
```

### En modo desarrollo

Con el backend levantado:

```bash
npm install
npm start
```

Abre en http://localhost:4200 y se recarga solo con cada cambio. Si el contenedor `frontend`
está corriendo, frenalo antes (`docker compose stop frontend`), porque usa el mismo puerto.

> El puerto 4200 importa: es el origen que el api-gateway acepta por CORS y la dirección a la
> que apunta el link del email de recuperación de contraseña.

### Usuario inicial

El backend crea un administrador: `admin@concesionaria.com` / `Admin12345`. Desde **Usuarios** se
dan de alta los vendedores. Los clientes se registran solos en el sitio.

### Datos de ejemplo

Con la base vacía, el catálogo no muestra nada. El repositorio del backend tiene un script que carga
vehículos con fotos, clientes, ventas, cuotas y cotizaciones. Desde `concesionaria/`:

```bash
python datos-demo/cargar_datos.py
```

También crea dos vendedores (`vera.gomez@concesionaria.com` / `Vendedor12345`) y un cliente con
compras y cotizaciones (`cliente.demo@mail.com` / `Cliente12345`). El detalle está en el
[README del backend](https://github.com/AlanBeltran-P/Sistema-de-Gestion-para-Concesionarios#datos-de-ejemplo).

## Quién ve qué

| Rol | Dónde trabaja | Qué puede hacer |
|---|---|---|
| Visitante | Sitio público | Ver el catálogo, el detalle de los vehículos y simular cuotas |
| `CLIENTE` | Sitio + **Mi cuenta** (`/cuenta`) | Pedir cotizaciones, reservar, ver sus compras y cuotas, editar su perfil |
| `VENDEDOR` | Panel (`/panel`) | Vehículos, clientes, cotizaciones, reservas, ventas, pagos y sus comisiones |
| `ADMIN` | Panel (`/panel`) | Todo lo anterior más dashboard, reportes, catálogo, planes, notificaciones y usuarios |

Después del login, los empleados van al panel y los clientes al sitio. Si alguien entra a una
página sin permiso, ve la pantalla "No tenés acceso".

## Rutas principales

| Ruta | Pantalla |
|---|---|
| `/` | Catálogo (los filtros quedan en la URL para compartir una búsqueda) |
| `/vehiculos/:id` | Detalle del vehículo |
| `/financiacion` | Planes y simulador |
| `/auth/login`, `/auth/registro`, `/auth/recuperar` | Acceso |
| `/restablecer-password?token=…` | Nueva contraseña (link del email) |
| `/cuenta`, `/cuenta/cotizaciones`, `/cuenta/reservas`, `/cuenta/datos` | Cuenta del cliente |
| `/panel/...` | Panel de gestión (el menú sale de `shared/ui/panel-layout/menu.ts`) |

## Estructura

```
src/
├── app/                  rutas (app.routes.ts, panel.routes.ts) y configuración
├── environments/         URL de la API
├── features/             una carpeta por servicio del backend
│   ├── auth/             login, registro, contraseñas, usuarios
│   ├── vehiculos/        catálogo público, detalle, inventario, fotos, marcas y modelos
│   ├── clientes/         clientes del panel, historial, cuenta y perfil del cliente
│   ├── ventas/           cotizaciones, tasaciones, reservas, ventas, comisiones
│   ├── financiamiento/   planes, simulador, estado de cuenta, pagos y mora
│   ├── notificaciones/   historial de emails
│   └── reportes/         dashboard y reportes
└── shared/               piezas comunes
    ├── ui/               layouts (sitio y panel), íconos, etiquetas, paginado, buscador
    ├── styles/           tema (colores, tipografías) y clases comunes (.campo, .boton, .tarjeta)
    ├── types/            tipos compartidos (página de Spring)
    └── utils/            formato de precios y fechas, errores del backend, formularios
```

Cada feature tiene la misma forma:

- `components/`: pantallas y componentes.
- `services/`: llamadas a la API.
- `model.ts`: tipos que coinciden con los DTOs del backend.
- `logic.ts`: reglas y textos sin Angular (por ejemplo, la seña mínima o la validación del DNI),
  con sus tests en `logic.spec.ts`.

### Detalles

- **Sesión:** el JWT se guarda en `localStorage`. Un interceptor lo agrega a cada pedido y, si
  vence, lo renueva con el refresh token una sola vez aunque haya varios pedidos esperando.
- **Errores del backend:** llegan como ProblemDetail. Los de validación se muestran debajo de cada
  campo (`shared/utils/formularios.ts`).
- **Reglas duplicadas a propósito:** la seña mínima, el formato de la contraseña o del documento
  se validan también en el navegador para avisar antes. El backend sigue siendo el que decide.

## Configuración

La URL de la API está en `src/environments/environment.ts` (`apiUrl`). Si se despliega en otro
servidor, hay que cambiarla ahí y agregar el nuevo origen en `CORS_ALLOWED_ORIGINS` del backend.

## Tests

```bash
npm test            # tests unitarios (Vitest)
npm run build       # compilación de producción
```
