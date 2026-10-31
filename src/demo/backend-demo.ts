import { Rol, TokenResponse, Usuario } from '../features/auth/model';
import { Cliente, ClienteRequest, PerfilRequest } from '../features/clientes/model';
import { Cuota, Plan } from '../features/financiamiento/model';
import {
  Dashboard,
  PorGrupo,
  PorVendedor,
  ReporteCartera,
  ReporteInventario,
  ReporteVentas,
  VentaDetalle,
} from '../features/reportes/model';
import { Categoria, EstadoVehiculo, Marca, Modelo, Vehiculo } from '../features/vehiculos/model';
import { Tasacion, Venta } from '../features/ventas/model';
import { hoyISO } from '../shared/utils/formato';
import {
  BaseDemo,
  ErrorDemo,
  UsuarioDemo,
  conflicto,
  diasEntre,
  esEmpleado,
  fechaHora,
  invalido,
  masDias,
  masMeses,
  noEncontrado,
  paginar,
  suma,
} from './base-demo';
import { pdfSimple } from './pdf';

export interface Pedido {
  metodo: string;
  /** Ruta sin el prefijo /api, ej. "/vehiculos/12". */
  ruta: string;
  param: (nombre: string) => string | null;
  cuerpo: any;
  usuario: UsuarioDemo | null;
}

type Manejador = (p: Pedido, m: string[]) => unknown;

const num = (v: string | null) => (v === null || v === '' ? undefined : Number(v));

/** Responde los pedidos al backend con los datos en memoria. */
export class BackendDemo extends BaseDemo {
  private readonly rutas: [string, RegExp, Manejador][] = [];

  constructor(...args: ConstructorParameters<typeof BaseDemo>) {
    super(...args);
    this.registrarRutas();
  }

  /** Devuelve el cuerpo de la respuesta o tira un ErrorDemo. */
  atender(p: Pedido): unknown {
    this.mantenimiento();
    for (const [metodo, patron, manejador] of this.rutas) {
      const m = metodo === p.metodo ? patron.exec(p.ruta) : null;
      if (m) return manejador(p, m.slice(1));
    }
    throw new ErrorDemo(404, `La demo no tiene ${p.metodo} ${p.ruta}`);
  }

  usuarioDelToken(token: string | null): UsuarioDemo | null {
    const id = /^demo\.(\d+)\./.exec(token ?? '')?.[1];
    const usuario = id ? this.d.usuarios.find((u) => u.id === Number(id)) : undefined;
    return usuario?.activo ? usuario : null;
  }

  private ruta(metodo: string, patron: string, manejador: Manejador) {
    const regex = new RegExp('^' + patron.replace(/:id/g, '(\\d+)') + '/?$');
    this.rutas.push([metodo, regex, manejador]);
  }

  private registrarRutas() {
    const r = this.ruta.bind(this);
    const id = (m: string[], i = 0) => Number(m[i]);

    // ---------- Auth
    r('POST', '/auth/login', (p) => {
      const u = this.d.usuarios.find(
        (x) => x.email === String(p.cuerpo.email).trim().toLowerCase(),
      );
      if (!u || u.password !== p.cuerpo.password)
        throw new ErrorDemo(401, 'Email o contraseña incorrectos');
      if (!u.activo)
        throw new ErrorDemo(403, 'La cuenta está desactivada. Hablá con el administrador.');
      return this.tokens(u);
    });
    r('POST', '/auth/refresh', (p) => {
      const u = this.usuarioDelToken(String(p.cuerpo.refreshToken).replace('refresh.', ''));
      if (!u) throw new ErrorDemo(401, 'La sesión venció');
      return this.tokens(u);
    });
    r('POST', '/auth/logout', () => null);
    r('POST', '/auth/registro', (p) => sinPassword(this.registrarCliente(p.cuerpo)));
    r('POST', '/auth/recuperar-password', (p) => {
      const u = this.d.usuarios.find(
        (x) => x.email === String(p.cuerpo.email).trim().toLowerCase(),
      );
      if (u) this.notificar('RECUPERACION_PASSWORD', u.email, 'Recuperá tu contraseña', u.id);
      return null;
    });
    r('POST', '/auth/restablecer-password', () => {
      throw invalido('El link no es válido o ya venció. En la demo no se mandan emails de verdad.');
    });
    r('GET', '/auth/me', (p) => sinPassword(this.requiere(p)));
    r('PUT', '/auth/me/password', (p) => {
      const u = this.requiere(p);
      if (u.password !== p.cuerpo.passwordActual) {
        throw invalido('Datos inválidos', {
          passwordActual: 'La contraseña actual no es correcta',
        });
      }
      if (String(p.cuerpo.nuevaPassword).length < 8) {
        throw invalido('Datos inválidos', {
          nuevaPassword: 'Tiene que tener al menos 8 caracteres',
        });
      }
      u.password = p.cuerpo.nuevaPassword;
      return null;
    });

    // ---------- Usuarios
    r('GET', '/usuarios', (p) => {
      this.requiere(p, 'ADMIN');
      const rol = p.param('rol');
      const activo = p.param('activo');
      const texto = p.param('texto')?.toLowerCase();
      const lista = this.d.usuarios
        .filter((u) => !rol || u.rol === rol)
        .filter((u) => activo === null || String(u.activo) === activo)
        .filter(
          (u) => !texto || `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(texto),
        )
        .sort((a, b) => a.apellido.localeCompare(b.apellido))
        .map(sinPassword);
      return this.pagina(lista, p);
    });
    r('POST', '/usuarios', (p) => {
      this.requiere(p, 'ADMIN');
      if (!['ADMIN', 'VENDEDOR'].includes(p.cuerpo.rol))
        throw invalido('El rol tiene que ser ADMIN o VENDEDOR');
      return sinPassword(this.crearUsuario(p.cuerpo));
    });
    r('PATCH', '/usuarios/:id/rol', (p, m) => {
      const admin = this.requiere(p, 'ADMIN');
      const u = this.usuario(id(m));
      if (u.id === admin.id) throw conflicto('No podés cambiarte el rol a vos mismo');
      if (u.rol === 'CLIENTE' || p.cuerpo.rol === 'CLIENTE')
        throw conflicto('Los clientes no cambian de rol');
      u.rol = p.cuerpo.rol;
      return sinPassword(u);
    });
    r('PATCH', '/usuarios/:id/estado', (p, m) => {
      const admin = this.requiere(p, 'ADMIN');
      const u = this.usuario(id(m));
      if (u.id === admin.id) throw conflicto('No podés desactivar tu propia cuenta');
      u.activo = Boolean(p.cuerpo.activo);
      return sinPassword(u);
    });

    // ---------- Clientes
    r('GET', '/clientes/me', (p) => this.clienteDeUsuario(this.requiere(p, 'CLIENTE').id));
    r('PUT', '/clientes/me', (p) => {
      const c = this.clienteDeUsuario(this.requiere(p, 'CLIENTE').id);
      const datos = p.cuerpo as PerfilRequest;
      if (Boolean(datos.tipoDocumento) !== Boolean(datos.numeroDocumento)) {
        throw invalido('Datos inválidos', {
          numeroDocumento: 'Completá el tipo y el número de documento',
        });
      }
      return this.guardarCliente(c.id, { ...datos, nombre: c.nombre, apellido: c.apellido });
    });
    r('GET', '/clientes', (p) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const texto = p.param('texto')?.toLowerCase();
      const origen = p.param('origen');
      const lista = this.d.clientes
        .filter((c) => !origen || c.origen === origen)
        .filter(
          (c) =>
            !texto ||
            [c.nombre, c.apellido, `${c.nombre} ${c.apellido}`, c.email, c.numeroDocumento].some(
              (x) => x?.toLowerCase().includes(texto),
            ),
        )
        .sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));
      return this.pagina(lista, p);
    });
    r(
      'GET',
      '/clientes/:id',
      (p, m) => (this.requiere(p, 'ADMIN', 'VENDEDOR'), this.cliente(id(m))),
    );
    r(
      'POST',
      '/clientes',
      (p) => (
        this.requiere(p, 'ADMIN', 'VENDEDOR'),
        this.guardarClienteDelPanel(undefined, p.cuerpo)
      ),
    );
    r(
      'PUT',
      '/clientes/:id',
      (p, m) => (
        this.requiere(p, 'ADMIN', 'VENDEDOR'),
        this.guardarClienteDelPanel(id(m), p.cuerpo)
      ),
    );
    r('GET', '/clientes/:id/historial', (p, m) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const cliente = this.cliente(id(m));
      const fins = this.d.financiamientos.filter((f) => f.clienteId === cliente.id);
      return {
        cliente,
        cotizaciones: this.d.cotizaciones.filter((c) => c.clienteId === cliente.id).reverse(),
        reservas: this.d.reservas.filter((x) => x.clienteId === cliente.id).reverse(),
        compras: this.d.ventas.filter((v) => v.clienteId === cliente.id).reverse(),
        financiamientos: fins.map((f) => this.verFinanciamiento(f)),
        pagos: this.d.pagos.filter((x) => x.clienteId === cliente.id).reverse(),
        avisos: [],
      };
    });

    // ---------- Vehículos
    r('GET', '/vehiculos', (p) => {
      const empleado = esEmpleado(p.usuario?.rol);
      const texto = p.param('texto')?.toLowerCase().trim();
      const f = {
        marcaId: num(p.param('marcaId')),
        modeloId: num(p.param('modeloId')),
        categoriaId: num(p.param('categoriaId')),
        precioMax: num(p.param('precioMax')),
        anioMin: num(p.param('anioMin')),
        condicion: p.param('condicion'),
        estado: p.param('estado'),
      };
      let lista = this.d.vehiculos.filter(
        (v) =>
          (f.marcaId === undefined || v.marcaId === f.marcaId) &&
          (f.modeloId === undefined || v.modeloId === f.modeloId) &&
          (f.categoriaId === undefined || v.categoriaId === f.categoriaId) &&
          (f.precioMax === undefined || v.precio <= f.precioMax) &&
          (f.anioMin === undefined || v.anio >= f.anioMin) &&
          (!f.condicion || v.condicion === f.condicion) &&
          (!texto || [v.marca, v.modelo, v.vin].some((x) => x.toLowerCase().includes(texto))),
      );
      lista = empleado
        ? lista.filter(
            (v) =>
              (!f.estado || v.estado === f.estado) &&
              (v.activo || p.param('incluirInactivos') === 'true'),
          )
        : lista.filter((v) => v.activo && v.estado === 'DISPONIBLE');
      return this.pagina(
        ordenar(lista, p.param('sort') ?? 'fechaIngreso,desc').map((v) => this.resumenVehiculo(v)),
        p,
      );
    });
    r('GET', '/vehiculos/:id', (p, m) => {
      const v = this.vehiculo(id(m));
      if (!v.activo && !esEmpleado(p.usuario?.rol)) throw noEncontrado('El vehículo');
      return v;
    });
    r(
      'POST',
      '/vehiculos',
      (p) => (this.requiere(p, 'ADMIN', 'VENDEDOR'), this.guardarVehiculo(undefined, p.cuerpo)),
    );
    r('PUT', '/vehiculos/:id', (p, m) => {
      this.requiere(p, 'ADMIN');
      const v = this.vehiculo(id(m));
      if (v.estado === 'VENDIDO') throw conflicto('Un vehículo vendido no se puede editar');
      return this.guardarVehiculo(v.id, p.cuerpo);
    });
    r('PATCH', '/vehiculos/:id/estado', (p, m) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const v = this.vehiculo(id(m));
      const estado = p.cuerpo.estado as EstadoVehiculo;
      const activa = this.d.reservas.some((x) => x.vehiculoId === v.id && x.estado === 'ACTIVA');
      if (activa && estado === 'DISPONIBLE') {
        throw conflicto('Tiene una reserva activa: para liberarlo hay que anular la reserva');
      }
      return this.cambiarEstadoVehiculo(v, estado, p.cuerpo.estadoEsperado);
    });
    r('DELETE', '/vehiculos/:id', (p, m) => {
      this.requiere(p, 'ADMIN');
      const v = this.vehiculo(id(m));
      if (v.estado === 'RESERVADO')
        throw conflicto('No se puede dar de baja un vehículo reservado');
      v.activo = false;
      return null;
    });
    r('POST', '/vehiculos/:id/reactivar', (p, m) => {
      this.requiere(p, 'ADMIN');
      const v = this.vehiculo(id(m));
      v.activo = true;
      return v;
    });
    r('POST', '/vehiculos/:id/imagenes', (p, m) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const v = this.vehiculo(id(m));
      const archivo = (p.cuerpo as FormData).get('archivo') as File;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
        throw invalido('La foto tiene que ser JPG, PNG o WEBP');
      }
      if (archivo.size > 5 * 1024 * 1024) throw invalido('La foto puede pesar hasta 5 MB');
      return leerComoDataUrl(archivo).then((url) => {
        const imagen = this.agregarImagen(v, url, p.param('principal') === 'true');
        imagen.nombreArchivo = archivo.name;
        return imagen;
      });
    });
    r('DELETE', '/vehiculos/:id/imagenes/:id', (p, m) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const v = this.vehiculo(id(m));
      const i = v.imagenes.findIndex((x) => x.id === id(m, 1));
      if (i < 0) throw noEncontrado('La foto');
      const [borrada] = v.imagenes.splice(i, 1);
      v.imagenes.forEach((x, n) => (x.orden = n + 1));
      if (borrada.principal && v.imagenes[0]) v.imagenes[0].principal = true;
      return null;
    });
    r('PATCH', '/vehiculos/:id/imagenes/:id/principal', (p, m) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const v = this.vehiculo(id(m));
      const imagen =
        v.imagenes.find((x) => x.id === id(m, 1)) ?? fallarCon(noEncontrado('La foto'));
      v.imagenes.forEach((x) => (x.principal = x === imagen));
      return imagen;
    });

    // ---------- Marcas, modelos y categorías
    r('GET', '/marcas', (p) =>
      this.d.marcas
        .filter((x) => x.activo || p.param('incluirInactivas') === 'true')
        .sort(porNombre),
    );
    r('GET', '/categorias', (p) =>
      this.d.categorias
        .filter((x) => x.activo || p.param('incluirInactivas') === 'true')
        .sort(porNombre),
    );
    r('GET', '/modelos', (p) => {
      const marcaId = num(p.param('marcaId'));
      return this.d.modelos
        .filter((x) => x.activo || p.param('incluirInactivos') === 'true')
        .filter((x) => marcaId === undefined || x.marcaId === marcaId)
        .sort((a, b) => a.marcaNombre.localeCompare(b.marcaNombre) || porNombre(a, b));
    });
    for (const tipo of ['marcas', 'categorias', 'modelos'] as const) {
      r(
        'POST',
        `/${tipo}`,
        (p) => (this.requiere(p, 'ADMIN'), this.guardarEnCatalogo(tipo, undefined, p.cuerpo)),
      );
      r(
        'PUT',
        `/${tipo}/:id`,
        (p, m) => (this.requiere(p, 'ADMIN'), this.guardarEnCatalogo(tipo, id(m), p.cuerpo)),
      );
      r('PATCH', `/${tipo}/:id/estado`, (p, m) => {
        this.requiere(p, 'ADMIN');
        const item = (this.d[tipo] as { id: number; activo: boolean }[]).find(
          (x) => x.id === id(m),
        );
        if (!item) throw noEncontrado('El elemento');
        item.activo = Boolean(p.cuerpo.activo);
        return item;
      });
    }

    // ---------- Planes
    r('GET', '/planes', (p) =>
      this.d.planes.filter(
        (x) => x.activo || (p.param('incluirInactivos') === 'true' && p.usuario?.rol === 'ADMIN'),
      ),
    );
    r('POST', '/planes/simulacion', (p) =>
      this.simular(
        Number(p.cuerpo.planId),
        Number(p.cuerpo.precio),
        Number(p.cuerpo.anticipo),
        Number(p.cuerpo.cantidadCuotas),
      ),
    );
    r('POST', '/planes', (p) => (this.requiere(p, 'ADMIN'), this.guardarPlan(undefined, p.cuerpo)));
    r(
      'PUT',
      '/planes/:id',
      (p, m) => (this.requiere(p, 'ADMIN'), this.guardarPlan(id(m), p.cuerpo)),
    );
    r('PATCH', '/planes/:id/estado', (p, m) => {
      this.requiere(p, 'ADMIN');
      const plan = this.plan(id(m));
      plan.activo = Boolean(p.cuerpo.activo);
      return plan;
    });

    // ---------- Financiamiento
    r('GET', '/financiamientos/mios', (p) => {
      const c = this.clienteDeUsuario(this.requiere(p, 'CLIENTE').id);
      return this.d.financiamientos
        .filter((f) => f.clienteId === c.id)
        .reverse()
        .map((f) => this.estadoDeCuenta(f));
    });
    r('GET', '/financiamientos/venta/:id', (p, m) => {
      const u = this.requiere(p);
      const f =
        this.d.financiamientos.find((x) => x.ventaId === id(m)) ??
        fallarCon(noEncontrado('El financiamiento'));
      this.soloSuyo(u, f.clienteId);
      return this.estadoDeCuenta(f);
    });
    r('GET', '/financiamientos/:id', (p, m) => {
      const f = this.financiamiento(id(m));
      this.soloSuyo(this.requiere(p), f.clienteId);
      return this.estadoDeCuenta(f);
    });
    r('GET', '/financiamientos', (p) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const clienteId = num(p.param('clienteId'));
      const estado = p.param('estado');
      const lista = this.d.financiamientos
        .map((f) => this.verFinanciamiento(f))
        .filter(
          (f) =>
            (clienteId === undefined || f.clienteId === clienteId) &&
            (!estado || f.estado === estado),
        )
        .reverse();
      return this.pagina(lista, p);
    });
    r('GET', '/cuotas', (p) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const estado = p.param('estado');
      const clienteId = num(p.param('clienteId'));
      const finId = num(p.param('financiamientoId'));
      const lista = this.todasLasCuotas()
        .filter(
          (c) =>
            (!estado || c.estado === estado) &&
            (clienteId === undefined || c.clienteId === clienteId),
        )
        .filter((c) => finId === undefined || c.financiamientoId === finId)
        .sort(
          (a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento) || a.numero - b.numero,
        );
      return this.pagina(lista, p);
    });
    r('POST', '/cuotas/procesar-vencimientos', (p) => {
      this.requiere(p, 'ADMIN');
      const cuotas = this.todasLasCuotas();
      const hoy = this.hoy();
      const en5 = hoyISO(masDias(new Date(), 5));
      return {
        fecha: hoy,
        cuotasVencidas: cuotas.filter((c) => c.estado === 'VENCIDA').length,
        morasActualizadas: cuotas.filter((c) => c.estado === 'VENCIDA').length,
        recordatorios: cuotas.filter((c) => c.estado === 'PENDIENTE' && c.fechaVencimiento <= en5)
          .length,
      };
    });
    r('POST', '/pagos', (p) => this.registrarPago(p.cuerpo, this.requiere(p, 'ADMIN', 'VENDEDOR')));

    // ---------- Notificaciones
    r('GET', '/notificaciones', (p) => {
      this.requiere(p, 'ADMIN');
      const tipo = p.param('tipo');
      const estado = p.param('estado');
      const dest = p.param('destinatario')?.toLowerCase();
      const lista = this.d.notificaciones
        .filter((n) => (!tipo || n.tipo === tipo) && (!estado || n.estado === estado))
        .filter((n) => !dest || n.destinatario.includes(dest))
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
        .map((n) => ({ ...n, cuerpo: null }));
      return this.pagina(lista, p);
    });
    r('GET', '/notificaciones/:id', (p, m) => {
      this.requiere(p, 'ADMIN');
      return (
        this.d.notificaciones.find((n) => n.id === id(m)) ??
        fallarCon(noEncontrado('La notificación'))
      );
    });
    r('POST', '/notificaciones/:id/reenviar', (p, m) => {
      this.requiere(p, 'ADMIN');
      const n =
        this.d.notificaciones.find((x) => x.id === id(m)) ??
        fallarCon(noEncontrado('La notificación'));
      Object.assign(n, {
        estado: 'ENVIADA',
        intentos: n.intentos + 1,
        ultimoError: null,
        fechaEnvio: fechaHora(new Date()),
      });
      return n;
    });

    // ---------- Reportes
    r('GET', '/reportes/dashboard', (p) => (this.requiere(p, 'ADMIN'), this.dashboard(p)));
    r('GET', '/reportes/ventas', (p) => (this.requiere(p, 'ADMIN'), this.reporteVentas(p)));
    r('GET', '/reportes/ventas/detalle', (p) => {
      this.requiere(p, 'ADMIN');
      const { ventas } = this.ventasDelPeriodo(p);
      return ventas.map((v): VentaDetalle => ({
        ventaId: v.id,
        numeroComprobante: v.numeroComprobante,
        fechaVenta: v.fechaVenta,
        vendedorId: v.vendedorId,
        vendedorNombre: v.vendedorNombre,
        clienteId: v.clienteId,
        vehiculo: v.vehiculo,
        condicion: this.vehiculo(v.vehiculoId).condicion,
        formaPago: v.formaPago,
        conTradeIn: v.tasacionId !== null,
        precioFinal: v.precioFinal,
        comision: v.comision?.monto ?? null,
        estado: v.estado,
      }));
    });
    r('GET', '/reportes/inventario', (p) => (this.requiere(p, 'ADMIN'), this.inventario()));
    r('GET', '/reportes/cartera', (p) => (this.requiere(p, 'ADMIN'), this.cartera()));

    // ---------- Comisiones
    const filtrarComisiones = (p: Pedido) => {
      const u = this.requiere(p, 'ADMIN', 'VENDEDOR');
      const vendedorId = u.rol === 'VENDEDOR' ? u.id : num(p.param('vendedorId'));
      const estado = p.param('estado');
      const desde = p.param('desde');
      const hasta = p.param('hasta');
      return this.d.comisiones
        .filter(
          (c) =>
            (vendedorId === undefined || c.vendedorId === vendedorId) &&
            (!estado || c.estado === estado),
        )
        .filter(
          (c) =>
            (!desde || c.fechaCalculo.slice(0, 10) >= desde) &&
            (!hasta || c.fechaCalculo.slice(0, 10) <= hasta),
        )
        .sort((a, b) => b.fechaCalculo.localeCompare(a.fechaCalculo));
    };
    r('GET', '/comisiones', (p) => this.pagina(filtrarComisiones(p), p));
    r('GET', '/comisiones/resumen', (p) => {
      const lista = filtrarComisiones(p).filter((c) => c.estado !== 'ANULADA');
      const u = p.usuario!;
      const pendiente = suma(
        lista.filter((c) => c.estado === 'PENDIENTE'),
        (c) => c.monto,
      );
      const pagado = suma(
        lista.filter((c) => c.estado === 'PAGADA'),
        (c) => c.monto,
      );
      return {
        vendedorId: u.rol === 'VENDEDOR' ? u.id : (num(p.param('vendedorId')) ?? null),
        cantidadVentas: lista.length,
        totalPendiente: pendiente,
        totalPagado: pagado,
        total: pendiente + pagado,
      };
    });
    r('PATCH', '/comisiones/:id/pagar', (p, m) => {
      this.requiere(p, 'ADMIN');
      const c =
        this.d.comisiones.find((x) => x.id === id(m)) ?? fallarCon(noEncontrado('La comisión'));
      if (c.estado !== 'PENDIENTE') throw conflicto(`La comisión está ${c.estado}`);
      c.estado = 'PAGADA';
      c.fechaPago = fechaHora(new Date());
      const venta = this.venta(c.ventaId);
      venta.comision = { ...venta.comision!, estado: 'PAGADA' };
      return c;
    });

    // ---------- Cotizaciones y tasaciones
    r('GET', '/cotizaciones/mias', (p) => {
      const c = this.clienteDeUsuario(this.requiere(p, 'CLIENTE').id);
      return this.pagina(this.d.cotizaciones.filter((x) => x.clienteId === c.id).reverse(), p);
    });
    r('POST', '/cotizaciones/solicitudes', (p) => {
      const c = this.clienteDeUsuario(this.requiere(p, 'CLIENTE').id);
      const abierta = this.d.cotizaciones.some(
        (x) =>
          x.clienteId === c.id && x.vehiculoId === p.cuerpo.vehiculoId && x.estado === 'SOLICITADA',
      );
      if (abierta)
        throw conflicto('Ya pediste precio por este vehículo: te vamos a responder pronto');
      return this.solicitarCotizacion(c, Number(p.cuerpo.vehiculoId), p.cuerpo.mensaje || null);
    });
    r('GET', '/cotizaciones', (p) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const estado = p.param('estado');
      const clienteId = num(p.param('clienteId'));
      const vendedorId = num(p.param('vendedorId'));
      const sinAsignar = p.param('sinAsignar') === 'true';
      const lista = this.d.cotizaciones
        .filter(
          (c) =>
            (!estado || c.estado === estado) &&
            (clienteId === undefined || c.clienteId === clienteId),
        )
        .filter(
          (c) =>
            (vendedorId === undefined || c.vendedorId === vendedorId) &&
            (!sinAsignar || c.vendedorId === null),
        )
        .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
      return this.pagina(lista, p);
    });
    r('GET', '/cotizaciones/:id', (p, m) => {
      const c = this.cotizacion(id(m));
      this.soloSuyo(this.requiere(p), c.clienteId);
      return c;
    });
    r('POST', '/cotizaciones', (p) => {
      const u = this.requiere(p, 'ADMIN', 'VENDEDOR');
      const c = this.solicitarCotizacion(
        this.cliente(Number(p.cuerpo.clienteId)),
        Number(p.cuerpo.vehiculoId),
        null,
      );
      try {
        return this.responderCotizacion(c, u, p.cuerpo);
      } catch (e) {
        this.d.cotizaciones.pop();
        throw e;
      }
    });
    r('PUT', '/cotizaciones/:id/respuesta', (p, m) =>
      this.responderCotizacion(
        this.cotizacion(id(m)),
        this.requiere(p, 'ADMIN', 'VENDEDOR'),
        p.cuerpo,
      ),
    );
    r('POST', '/cotizaciones/:id/(aceptar|rechazar)', (p, m) => {
      const c = this.cotizacion(id(m));
      this.soloSuyo(this.requiere(p), c.clienteId);
      if (c.estado !== 'RESPONDIDA') throw conflicto(`La cotización está ${c.estado}`);
      c.estado = m[1] === 'aceptar' ? 'ACEPTADA' : 'RECHAZADA';
      return c;
    });
    r('GET', '/tasaciones', (p) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const clienteId = num(p.param('clienteId'));
      return this.pagina(
        this.d.tasaciones
          .filter((t) => clienteId === undefined || t.clienteId === clienteId)
          .reverse(),
        p,
      );
    });
    r('POST', '/tasaciones', (p) => {
      const u = this.requiere(p, 'ADMIN', 'VENDEDOR');
      const datos = p.cuerpo;
      const modelo = this.modelo(Number(datos.modeloId));
      if (!(datos.valorTasado > 0))
        throw invalido('Datos inválidos', { valorTasado: 'Tiene que ser mayor a 0' });
      const t: Tasacion = {
        id: this.nuevoId(),
        clienteId: this.cliente(Number(datos.clienteId)).id,
        vendedorId: u.id,
        vin: String(datos.vin).toUpperCase(),
        modeloId: modelo.id,
        modelo: `${modelo.marcaNombre} ${modelo.nombre}`,
        anio: datos.anio,
        color: datos.color,
        kilometraje: datos.kilometraje,
        observaciones: datos.observaciones,
        valorTasado: datos.valorTasado,
        estado: 'PENDIENTE',
        fechaValidez: hoyISO(masDias(new Date(), datos.diasValidez ?? 15)),
        vehiculoIngresadoId: null,
        fechaTasacion: fechaHora(new Date()),
      };
      this.d.tasaciones.push(t);
      return t;
    });
    r('PATCH', '/tasaciones/:id/estado', (p, m) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const t = this.tasacion(id(m));
      if (t.estado === 'UTILIZADA') throw conflicto('La tasación ya se usó en una venta');
      t.estado = p.cuerpo.estado;
      return t;
    });

    // ---------- Reservas
    r('GET', '/reservas/mias', (p) => {
      const c = this.clienteDeUsuario(this.requiere(p, 'CLIENTE').id);
      return this.pagina(this.d.reservas.filter((x) => x.clienteId === c.id).reverse(), p);
    });
    r('POST', '/reservas', (p) => {
      const u = this.requiere(p);
      const datos = p.cuerpo;
      const cot = datos.cotizacionId ? this.cotizacion(datos.cotizacionId) : null;
      if (u.rol === 'CLIENTE') {
        const c = this.clienteDeUsuario(u.id);
        if (!c.perfilCompleto)
          throw conflicto('Completá tus datos (documento, teléfono y dirección) para reservar');
        const vendedor =
          cot?.vendedorId ?? this.d.usuarios.find((x) => x.rol === 'VENDEDOR' && x.activo)!.id;
        return this.reservar(
          c,
          Number(datos.vehiculoId),
          Number(datos.montoAnticipo),
          vendedor,
          cot?.id ?? null,
          null,
        );
      }
      return this.reservar(
        this.cliente(Number(datos.clienteId)),
        Number(datos.vehiculoId),
        Number(datos.montoAnticipo),
        u.id,
        cot?.id ?? null,
        datos.diasVigencia,
      );
    });
    r('GET', '/reservas', (p) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const clienteId = num(p.param('clienteId'));
      const vehiculoId = num(p.param('vehiculoId'));
      const estado = p.param('estado');
      const lista = this.d.reservas
        .filter(
          (x) =>
            (clienteId === undefined || x.clienteId === clienteId) &&
            (vehiculoId === undefined || x.vehiculoId === vehiculoId),
        )
        .filter((x) => !estado || x.estado === estado)
        .reverse();
      return this.pagina(lista, p);
    });
    r('GET', '/reservas/:id', (p, m) => {
      const x = this.reserva(id(m));
      this.soloSuyo(this.requiere(p), x.clienteId);
      return x;
    });
    r('POST', '/reservas/:id/anular', (p, m) => {
      this.requiere(p, 'ADMIN');
      const x = this.reserva(id(m));
      if (x.estado !== 'ACTIVA') throw conflicto(`La reserva está ${x.estado}`);
      Object.assign(x, {
        estado: 'ANULADA',
        motivoAnulacion: p.cuerpo.motivo,
        fechaAnulacion: fechaHora(new Date()),
      });
      const v = this.vehiculo(x.vehiculoId);
      if (v.estado === 'RESERVADO') v.estado = 'DISPONIBLE';
      return x;
    });

    // ---------- Ventas
    r('GET', '/ventas/mias', (p) => {
      const c = this.clienteDeUsuario(this.requiere(p, 'CLIENTE').id);
      return this.pagina(
        this.d.ventas
          .filter((v) => v.clienteId === c.id)
          .reverse()
          .map(sinComision),
        p,
      );
    });
    r('GET', '/ventas', (p) => {
      this.requiere(p, 'ADMIN', 'VENDEDOR');
      const clienteId = num(p.param('clienteId'));
      const vendedorId = num(p.param('vendedorId'));
      const estado = p.param('estado');
      const desde = p.param('desde');
      const hasta = p.param('hasta');
      const lista = this.d.ventas
        .filter(
          (v) =>
            (clienteId === undefined || v.clienteId === clienteId) &&
            (vendedorId === undefined || v.vendedorId === vendedorId),
        )
        .filter(
          (v) =>
            (!estado || v.estado === estado) &&
            (!desde || v.fechaVenta.slice(0, 10) >= desde) &&
            (!hasta || v.fechaVenta.slice(0, 10) <= hasta),
        )
        .sort((a, b) => b.fechaVenta.localeCompare(a.fechaVenta));
      return this.pagina(lista, p);
    });
    r('GET', '/ventas/:id', (p, m) => {
      const u = this.requiere(p);
      const v = this.venta(id(m));
      this.soloSuyo(u, v.clienteId);
      return u.rol === 'CLIENTE' ? sinComision(v) : v;
    });
    r('POST', '/ventas', (p) => this.vender(p.cuerpo, this.requiere(p, 'ADMIN', 'VENDEDOR')));
    r(
      'POST',
      '/ventas/:id/anular',
      (p, m) => (this.requiere(p, 'ADMIN'), this.anularVenta(this.venta(id(m)), p.cuerpo.motivo)),
    );
    r('GET', '/ventas/:id/comprobante', (p, m) => {
      const v = this.venta(id(m));
      this.soloSuyo(this.requiere(p), v.clienteId);
      return this.comprobante(v);
    });
  }

  // ---------- Ayudas

  private tokens(u: UsuarioDemo): TokenResponse {
    const accessToken = `demo.${u.id}.${Date.now().toString(36)}`;
    return {
      accessToken,
      refreshToken: `refresh.${accessToken}`,
      tipo: 'Bearer',
      expiraEn: 86_400,
      usuario: sinPassword(u),
    };
  }

  private requiere(p: Pedido, ...roles: Rol[]): UsuarioDemo {
    if (!p.usuario) throw new ErrorDemo(401, 'Tenés que iniciar sesión');
    if (roles.length && !roles.includes(p.usuario.rol)) {
      throw new ErrorDemo(403, 'No tenés permiso para hacer esto');
    }
    return p.usuario;
  }

  /** Un cliente solo puede ver lo suyo. */
  private soloSuyo(u: UsuarioDemo, clienteId: number) {
    if (u.rol === 'CLIENTE' && this.clienteDeUsuario(u.id).id !== clienteId) {
      throw new ErrorDemo(403, 'No tenés permiso para ver esto');
    }
  }

  private pagina<T>(lista: T[], p: Pedido) {
    return paginar(lista, num(p.param('page')) ?? 0, num(p.param('size')) ?? 20);
  }

  private todasLasCuotas(): Cuota[] {
    return this.d.cuotas.map((c) => this.verCuota(c));
  }

  private guardarClienteDelPanel(id: number | undefined, datos: ClienteRequest): Cliente {
    const errores: Record<string, string> = {};
    if (!datos.nombre?.trim()) errores['nombre'] = 'Es obligatorio';
    if (!datos.apellido?.trim()) errores['apellido'] = 'Es obligatorio';
    if (!datos.numeroDocumento?.trim()) errores['numeroDocumento'] = 'Es obligatorio';
    if (!datos.email && !datos.telefono)
      errores['telefono'] = 'Cargá al menos un email o un teléfono';
    if (Object.keys(errores).length) throw invalido('Datos inválidos', errores);
    if (id !== undefined) {
      const actual = this.cliente(id);
      if (actual.tieneCuenta && datos.email !== actual.email) {
        throw conflicto('El email de un cliente con cuenta en el portal solo lo cambia él');
      }
    }
    return this.guardarCliente(id, datos);
  }

  private guardarEnCatalogo(
    tipo: 'marcas' | 'categorias' | 'modelos',
    id: number | undefined,
    datos: any,
  ) {
    const nombre = String(datos.nombre ?? '').trim();
    if (!nombre) throw invalido('Datos inválidos', { nombre: 'Es obligatorio' });
    const lista = this.d[tipo] as (Marca | Categoria | Modelo)[];
    const repetido = lista.some(
      (x) =>
        x.id !== id &&
        x.nombre.toLowerCase() === nombre.toLowerCase() &&
        (tipo !== 'modelos' || (x as Modelo).marcaId === datos.marcaId),
    );
    if (repetido) throw conflicto(`Ya existe "${nombre}"`);
    let campos: object = { nombre };
    if (tipo === 'categorias') campos = { nombre, descripcion: datos.descripcion || null };
    if (tipo === 'modelos') {
      const marca =
        this.d.marcas.find((x) => x.id === datos.marcaId) ?? fallarCon(noEncontrado('La marca'));
      const cat =
        this.d.categorias.find((x) => x.id === datos.categoriaId) ??
        fallarCon(noEncontrado('La categoría'));
      campos = {
        nombre,
        marcaId: marca.id,
        marcaNombre: marca.nombre,
        categoriaId: cat.id,
        categoriaNombre: cat.nombre,
      };
    }
    if (id === undefined) {
      const nuevo = { id: this.nuevoId(), activo: true, ...campos } as Marca & Categoria & Modelo;
      lista.push(nuevo);
      return nuevo;
    }
    const item = lista.find((x) => x.id === id) ?? fallarCon(noEncontrado('El elemento'));
    return Object.assign(item, campos);
  }

  private guardarPlan(id: number | undefined, datos: Omit<Plan, 'id' | 'activo'>): Plan {
    const errores: Record<string, string> = {};
    if (!datos.nombre?.trim()) errores['nombre'] = 'Es obligatorio';
    if (!datos.plazos?.length) errores['plazos'] = 'Elegí al menos un plazo';
    if (Object.keys(errores).length) throw invalido('Datos inválidos', errores);
    if (id !== undefined) return Object.assign(this.plan(id), datos);
    const plan: Plan = { ...datos, id: this.nuevoId(), activo: true };
    this.d.planes.push(plan);
    return plan;
  }

  private comprobante(v: Venta): Blob {
    const pesos = (n: number | null) => '$ ' + Math.round(n ?? 0).toLocaleString('es-AR');
    const lineas = [
      `Comprobante de venta ${v.numeroComprobante}`,
      '',
      `Fecha: ${v.fechaVenta.slice(0, 10)}`,
      `Cliente: ${v.clienteNombre}`,
      `Vendedor: ${v.vendedorNombre}`,
      `Vehículo: ${v.vehiculo}`,
      '',
      `Precio: ${pesos(v.precioVehiculo)}`,
      `Descuento: ${pesos(v.descuento)}`,
      `Precio final: ${pesos(v.precioFinal)}`,
      ...(v.valorTradeIn ? [`Auto usado entregado: ${pesos(v.valorTradeIn)}`] : []),
      ...(v.montoAnticipoReserva ? [`Seña: ${pesos(v.montoAnticipoReserva)}`] : []),
      `Forma de pago: ${v.formaPago === 'CONTADO' ? 'Contado' : `Financiada (${v.planNombre}, ${v.cantidadCuotas} cuotas de ${pesos(v.valorCuota)})`}`,
      ...(v.estado === 'ANULADA' ? ['', `ANULADA: ${v.motivoAnulacion}`] : []),
      '',
      'Documento de ejemplo generado por la versión demo.',
    ];
    return pdfSimple(lineas);
  }

  // ---------- Reportes

  private periodo(p: Pedido) {
    const hasta = p.param('hasta') || this.hoy();
    const desde = p.param('desde') || hoyISO(masDias(masMeses(new Date(), -12), 1));
    return { desde, hasta };
  }

  private ventasDelPeriodo(p: Pedido) {
    const { desde, hasta } = this.periodo(p);
    const vendedorId = num(p.param('vendedorId'));
    const ventas = this.d.ventas
      .filter((v) => v.fechaVenta.slice(0, 10) >= desde && v.fechaVenta.slice(0, 10) <= hasta)
      .filter((v) => vendedorId === undefined || v.vendedorId === vendedorId)
      .sort((a, b) => b.fechaVenta.localeCompare(a.fechaVenta));
    return { desde, hasta, ventas };
  }

  private porVendedor(ventas: Venta[]): PorVendedor[] {
    const grupos = agrupar(ventas, (v) => v.vendedorId);
    return [...grupos.values()]
      .map((vs) => ({
        vendedorId: vs[0].vendedorId,
        vendedorNombre: vs[0].vendedorNombre,
        cantidad: vs.length,
        monto: suma(vs, (v) => v.precioFinal),
        comisiones: suma(vs, (v) => v.comision?.monto ?? 0),
      }))
      .sort((a, b) => b.monto - a.monto);
  }

  private dashboard(p: Pedido): Dashboard {
    const { desde, hasta, ventas: todas } = this.ventasDelPeriodo(p);
    const ventas = todas.filter((v) => v.estado === 'CONFIRMADA');
    const ingresos = suma(ventas, (v) => v.precioFinal);
    const modelos = agrupar(ventas, (v) => this.vehiculo(v.vehiculoId).modeloId);
    const meses: Dashboard['ventasPorMes'] = [];
    for (let mes = desde.slice(0, 7); mes <= hasta.slice(0, 7);) {
      const delMes = ventas.filter((v) => v.fechaVenta.startsWith(mes));
      meses.push({ mes, unidades: delMes.length, ingresos: suma(delMes, (v) => v.precioFinal) });
      const [a, m] = mes.split('-').map(Number);
      mes = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
    }
    const cartera = this.cartera();
    return {
      desde,
      hasta,
      ingresos,
      unidadesVendidas: ventas.length,
      ticketPromedio: ventas.length ? Math.round(ingresos / ventas.length) : 0,
      comisiones: suma(ventas, (v) => v.comision?.monto ?? 0),
      topModelos: [...modelos.entries()]
        .map(([modeloId, vs]) => {
          const modelo = this.modelo(modeloId);
          return {
            modeloId,
            marca: modelo.marcaNombre,
            modelo: modelo.nombre,
            unidades: vs.length,
            ingresos: suma(vs, (v) => v.precioFinal),
          };
        })
        .sort((a, b) => b.unidades - a.unidades || b.ingresos - a.ingresos)
        .slice(0, 5),
      topVendedores: this.porVendedor(ventas).slice(0, 5),
      ventasPorMes: meses,
      stockDisponible: this.d.vehiculos.filter((v) => v.activo && v.estado === 'DISPONIBLE').length,
      carteraVencida: cartera.vencido,
      clientesMorosos: cartera.morosos.length,
    };
  }

  private reporteVentas(p: Pedido): ReporteVentas {
    const { desde, hasta, ventas: todas } = this.ventasDelPeriodo(p);
    const ventas = todas.filter((v) => v.estado === 'CONFIRMADA');
    const montoTotal = suma(ventas, (v) => v.precioFinal);
    const grupos = (clave: (v: Venta) => string): PorGrupo[] =>
      [...agrupar(ventas, clave).entries()].map(([grupo, vs]) => ({
        grupo,
        cantidad: vs.length,
        monto: suma(vs, (v) => v.precioFinal),
      }));
    return {
      desde,
      hasta,
      cantidadVentas: ventas.length,
      ventasAnuladas: todas.length - ventas.length,
      montoTotal,
      ticketPromedio: ventas.length ? Math.round(montoTotal / ventas.length) : 0,
      comisiones: suma(ventas, (v) => v.comision?.monto ?? 0),
      conTradeIn: ventas.filter((v) => v.tasacionId !== null).length,
      porVendedor: this.porVendedor(ventas),
      porFormaPago: grupos((v) => v.formaPago),
      porCondicion: grupos((v) => this.vehiculo(v.vehiculoId).condicion),
    };
  }

  private inventario(): ReporteInventario {
    const hoy = this.hoy();
    const activos = this.d.vehiculos.filter((v) => v.activo);
    const enStock = activos.filter((v) => v.estado !== 'VENDIDO');
    const dias = (v: Vehiculo) => diasEntre(v.fechaIngreso, hoy);
    const contar = (lista: Vehiculo[], clave: (v: Vehiculo) => string) =>
      Object.fromEntries([...agrupar(lista, clave).entries()].map(([k, vs]) => [k, vs.length]));
    const rangos: [number, number][] = [
      [0, 30],
      [31, 60],
      [61, 90],
      [91, 180],
      [181, Infinity],
    ];
    return {
      fecha: hoy,
      enStock: enStock.length,
      valorStock: suma(enStock, (v) => v.precio),
      diasPromedioEnStock: enStock.length ? Math.round(suma(enStock, dias) / enStock.length) : 0,
      porEstado: contar(activos, (v) => v.estado),
      porCondicion: contar(enStock, (v) => v.condicion),
      antiguedad: rangos.map(([a, b]) => {
        const vs = enStock.filter((v) => dias(v) >= a && dias(v) <= b);
        return {
          rango: b === Infinity ? `más de ${a - 1} días` : `${a} a ${b} días`,
          cantidad: vs.length,
          valor: suma(vs, (v) => v.precio),
        };
      }),
      masAntiguos: [...enStock]
        .sort((a, b) => dias(b) - dias(a))
        .slice(0, 10)
        .map((v) => ({
          vehiculoId: v.id,
          vin: v.vin,
          marca: v.marca,
          modelo: v.modelo,
          anio: v.anio,
          condicion: v.condicion,
          estado: v.estado,
          precio: v.precio,
          fechaIngreso: v.fechaIngreso,
          diasEnStock: dias(v),
        })),
    };
  }

  private cartera(): ReporteCartera {
    const cuotas = this.todasLasCuotas().filter((c) => c.estado !== 'ANULADA');
    const vencidas = cuotas.filter((c) => c.estado === 'VENCIDA');
    const pendientes = cuotas.filter(
      (c) => c.estado === 'PENDIENTE' || c.estado === 'PAGADA_PARCIAL',
    );
    return {
      fecha: this.hoy(),
      cobrado: suma(cuotas, (c) => c.montoPagado),
      pendiente: suma(pendientes, (c) => c.saldo),
      vencido: suma(vencidas, (c) => c.saldo),
      moraTotal: suma(vencidas, (c) => c.mora),
      cuotasPagadas: cuotas.filter((c) => c.estado === 'PAGADA').length,
      cuotasPendientes: pendientes.length,
      cuotasVencidas: vencidas.length,
      morosos: [...agrupar(vencidas, (c) => c.clienteId).values()]
        .map((cs) => ({
          clienteId: cs[0].clienteId,
          clienteNombre: cs[0].clienteNombre,
          cuotasVencidas: cs.length,
          deudaVencida: suma(cs, (c) => c.saldo),
          vencimientoMasAntiguo: cs.map((c) => c.fechaVencimiento).sort()[0],
          diasMaximoAtraso: Math.max(...cs.map((c) => c.diasAtraso)),
        }))
        .sort((a, b) => b.deudaVencida - a.deudaVencida),
    };
  }
}

function sinPassword({ password: _, ...usuario }: UsuarioDemo): Usuario {
  return usuario;
}

function sinComision(v: Venta): Venta {
  return { ...v, comision: null };
}

function porNombre(a: { nombre: string }, b: { nombre: string }) {
  return a.nombre.localeCompare(b.nombre);
}

function fallarCon(error: Error): never {
  throw error;
}

function agrupar<T, K>(lista: T[], clave: (x: T) => K): Map<K, T[]> {
  const mapa = new Map<K, T[]>();
  for (const x of lista) mapa.set(clave(x), [...(mapa.get(clave(x)) ?? []), x]);
  return mapa;
}

/** sort = "precio,asc" */
function ordenar(lista: Vehiculo[], sort: string): Vehiculo[] {
  const [campo, dir] = sort.split(',') as [keyof Vehiculo, string];
  const signo = dir === 'asc' ? 1 : -1;
  return [...lista].sort((a, b) => {
    const x = a[campo] as string | number;
    const y = b[campo] as string | number;
    return (x < y ? -1 : x > y ? 1 : 0) * signo || b.id - a.id;
  });
}

function leerComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(invalido('No se pudo leer la foto'));
    lector.readAsDataURL(archivo);
  });
}
