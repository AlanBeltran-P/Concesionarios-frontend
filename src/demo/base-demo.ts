import { Rol, Usuario } from '../features/auth/model';
import { Cliente, Direccion } from '../features/clientes/model';
import {
  Cuota,
  EstadoCuenta,
  FinanciamientoResumen,
  MedioPago,
  Pago,
  Plan,
  Simulacion,
  TipoPago,
} from '../features/financiamiento/model';
import { Notificacion, TipoNotificacion } from '../features/notificaciones/model';
import {
  Categoria,
  CondicionVehiculo,
  EstadoVehiculo,
  ImagenVehiculo,
  Marca,
  Modelo,
  OrigenVehiculo,
  Vehiculo,
  VehiculoResumen,
} from '../features/vehiculos/model';
import {
  Comision,
  Cotizacion,
  FormaPago,
  Reserva,
  Tasacion,
  Venta,
} from '../features/ventas/model';
import { Pagina } from '../shared/types/pagina';
import { hoyISO } from '../shared/utils/formato';

/**
 * El "backend" de la versión demo: todos los datos en memoria y las mismas reglas principales
 * que los microservicios (estados de vehículos, reservas, ventas, cuotas, mora y comisiones).
 */

export type UsuarioDemo = Usuario & { password: string };

/** Cuota tal como se guarda. El estado, la mora y el saldo se calculan al leerla. */
export interface CuotaGuardada {
  id: number;
  financiamientoId: number;
  clienteId: number;
  clienteNombre: string;
  numero: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  monto: number;
  montoPagado: number;
  /** Mora que quedó fija cuando se terminó de pagar. */
  moraFinal: number | null;
  fechaPago: string | null;
  anulada: boolean;
}

export interface FinanciamientoGuardado extends Omit<FinanciamientoResumen, 'estado'> {
  montoAnticipo: number;
  porcentajeMoraDiaria: number;
  anulado: boolean;
}

export interface Datos {
  version: number;
  sig: number;
  usuarios: UsuarioDemo[];
  marcas: Marca[];
  categorias: Categoria[];
  modelos: Modelo[];
  vehiculos: Vehiculo[];
  planes: Plan[];
  clientes: Cliente[];
  cotizaciones: Cotizacion[];
  tasaciones: Tasacion[];
  reservas: Reserva[];
  ventas: Venta[];
  comisiones: Comision[];
  financiamientos: FinanciamientoGuardado[];
  cuotas: CuotaGuardada[];
  pagos: Pago[];
  notificaciones: Notificacion[];
}

/** Error con la forma de ProblemDetail que devuelve el backend. */
export class ErrorDemo extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly errores?: Record<string, string>,
  ) {
    super(detail);
  }
}

export const noEncontrado = (que: string) => new ErrorDemo(404, `${que} no existe`);
export const invalido = (detalle: string, errores?: Record<string, string>) =>
  new ErrorDemo(400, detalle, errores);
export const conflicto = (detalle: string) => new ErrorDemo(409, detalle);

// ---------- Fechas y números

export function masDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

export function masMeses(fecha: Date, meses: number): Date {
  const d = new Date(fecha);
  d.setMonth(d.getMonth() + meses);
  return d;
}

/** "2026-10-30T14:05:00" en hora local. */
export function fechaHora(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${hoyISO(fecha)}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}`;
}

function fechaLocal(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((fechaLocal(hasta).getTime() - fechaLocal(desde).getTime()) / 86_400_000);
}

const redondear = (n: number) => Math.round(n * 100) / 100;
const porcentaje = (base: number, pct: number) => redondear((base * pct) / 100);
const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

export function paginar<T>(lista: T[], page = 0, size = 20): Pagina<T> {
  const desde = page * size;
  return {
    content: lista.slice(desde, desde + size),
    page: {
      size,
      number: page,
      totalElements: lista.length,
      totalPages: Math.max(1, Math.ceil(lista.length / size)),
    },
  };
}

/** Sistema francés: cuota fija. */
export function cuotasFrancesas(capital: number, tasaAnual: number, n: number) {
  const i = tasaAnual / 100 / 12;
  const valorCuota = redondear(i === 0 ? capital / n : (capital * i) / (1 - Math.pow(1 + i, -n)));
  const cuotas = [];
  let saldo = capital;
  for (let numero = 1; numero <= n; numero++) {
    const interes = redondear(saldo * i);
    const amortiza = numero === n ? saldo : redondear(valorCuota - interes);
    saldo = redondear(saldo - amortiza);
    cuotas.push({
      numero,
      capital: amortiza,
      interes,
      monto: numero === n ? redondear(amortiza + interes) : valorCuota,
      saldoRestante: Math.max(0, saldo),
    });
  }
  return { valorCuota, cuotas };
}

export const PORCENTAJE_COMISION: Record<CondicionVehiculo, number> = { NUEVO: 2.5, USADO: 4 };
const DESCUENTO_MAXIMO_VENDEDOR = 15;

export class BaseDemo {
  constructor(public d: Datos) {}

  hoy(): string {
    return hoyISO();
  }

  nuevoId(): number {
    return ++this.d.sig;
  }

  // ---------- Búsquedas

  usuario(id: number): UsuarioDemo {
    return this.d.usuarios.find((u) => u.id === id) ?? fallar(noEncontrado('El usuario'));
  }
  cliente(id: number): Cliente {
    return this.d.clientes.find((c) => c.id === id) ?? fallar(noEncontrado('El cliente'));
  }
  clienteDeUsuario(usuarioId: number): Cliente {
    return (
      this.d.clientes.find((c) => c.usuarioId === usuarioId) ??
      fallar(noEncontrado('El perfil de cliente'))
    );
  }
  vehiculo(id: number): Vehiculo {
    return this.d.vehiculos.find((v) => v.id === id) ?? fallar(noEncontrado('El vehículo'));
  }
  modelo(id: number): Modelo {
    return this.d.modelos.find((m) => m.id === id) ?? fallar(noEncontrado('El modelo'));
  }
  plan(id: number): Plan {
    return this.d.planes.find((p) => p.id === id) ?? fallar(noEncontrado('El plan'));
  }
  cotizacion(id: number): Cotizacion {
    return this.d.cotizaciones.find((c) => c.id === id) ?? fallar(noEncontrado('La cotización'));
  }
  tasacion(id: number): Tasacion {
    return this.d.tasaciones.find((t) => t.id === id) ?? fallar(noEncontrado('La tasación'));
  }
  reserva(id: number): Reserva {
    return this.d.reservas.find((r) => r.id === id) ?? fallar(noEncontrado('La reserva'));
  }
  venta(id: number): Venta {
    return this.d.ventas.find((v) => v.id === id) ?? fallar(noEncontrado('La venta'));
  }
  financiamiento(id: number): FinanciamientoGuardado {
    return (
      this.d.financiamientos.find((f) => f.id === id) ?? fallar(noEncontrado('El financiamiento'))
    );
  }

  nombreCliente(c: Cliente): string {
    return `${c.nombre} ${c.apellido}`;
  }
  nombreUsuario(u: Usuario): string {
    return `${u.nombre} ${u.apellido}`;
  }
  descripcionVehiculo(v: Vehiculo): string {
    return `${v.marca} ${v.modelo} ${v.anio}`;
  }

  // ---------- Usuarios y clientes

  crearUsuario(datos: Omit<UsuarioDemo, 'id' | 'activo' | 'fechaCreacion'>, fecha = new Date()) {
    const email = datos.email.trim().toLowerCase();
    if (this.d.usuarios.some((u) => u.email === email)) {
      throw conflicto(`Ya existe un usuario con el email ${email}`);
    }
    if (datos.password.length < 8) {
      throw invalido('Datos inválidos', { password: 'Tiene que tener al menos 8 caracteres' });
    }
    const usuario: UsuarioDemo = {
      ...datos,
      email,
      id: this.nuevoId(),
      activo: true,
      fechaCreacion: fechaHora(fecha),
    };
    this.d.usuarios.push(usuario);
    return usuario;
  }

  guardarCliente(
    id: number | undefined,
    datos: Partial<Cliente> & { nombre: string; apellido: string },
    extra: Partial<Cliente> = {},
    fecha = new Date(),
  ): Cliente {
    if (datos.numeroDocumento) {
      const repetido = this.d.clientes.find(
        (c) =>
          c.id !== id &&
          c.tipoDocumento === datos.tipoDocumento &&
          c.numeroDocumento === datos.numeroDocumento,
      );
      if (repetido) {
        throw conflicto(`Ya existe un cliente con ${datos.tipoDocumento} ${datos.numeroDocumento}`);
      }
    }
    const anterior = id !== undefined ? this.cliente(id) : undefined;
    const cliente: Cliente = {
      id: anterior?.id ?? this.nuevoId(),
      usuarioId: anterior?.usuarioId ?? null,
      tipoDocumento: null,
      numeroDocumento: null,
      email: null,
      telefono: null,
      direccion: null,
      fechaNacimiento: null,
      origen: anterior?.origen ?? 'LOCAL',
      tieneCuenta: anterior?.tieneCuenta ?? false,
      fechaCreacion: anterior?.fechaCreacion ?? fechaHora(fecha),
      ...anterior,
      ...datos,
      ...extra,
      perfilCompleto: false,
    };
    if (cliente.direccion) cliente.direccion = normalizarDireccion(cliente.direccion);
    cliente.perfilCompleto = Boolean(
      cliente.tipoDocumento && cliente.numeroDocumento && cliente.telefono && cliente.direccion,
    );
    if (anterior) Object.assign(anterior, cliente);
    else this.d.clientes.push(cliente);
    return anterior ?? cliente;
  }

  registrarCliente(datos: { email: string; password: string; nombre: string; apellido: string }) {
    const usuario = this.crearUsuario({ ...datos, rol: 'CLIENTE' });
    this.guardarCliente(
      undefined,
      { nombre: datos.nombre, apellido: datos.apellido, email: usuario.email },
      { usuarioId: usuario.id, origen: 'PORTAL', tieneCuenta: true },
    );
    this.notificar('BIENVENIDA', usuario.email, `¡Bienvenido/a, ${datos.nombre}!`, usuario.id);
    return usuario;
  }

  // ---------- Vehículos

  resumenVehiculo(v: Vehiculo): VehiculoResumen {
    const principal = v.imagenes.find((i) => i.principal) ?? v.imagenes[0];
    return {
      id: v.id,
      marca: v.marca,
      modelo: v.modelo,
      categoria: v.categoria,
      anio: v.anio,
      color: v.color,
      kilometraje: v.kilometraje,
      precio: v.precio,
      condicion: v.condicion,
      estado: v.estado,
      imagenPrincipalUrl: principal?.url ?? null,
    };
  }

  guardarVehiculo(
    id: number | undefined,
    datos: {
      vin: string;
      modeloId: number;
      anio: number;
      color: string;
      kilometraje: number;
      precio: number;
      condicion: CondicionVehiculo;
      descripcion: string | null;
    },
    extra: { origen?: OrigenVehiculo; fechaIngreso?: string; fotos?: string[] } = {},
  ): Vehiculo {
    const vin = datos.vin.trim().toUpperCase();
    const errores: Record<string, string> = {};
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) errores['vin'] = 'El VIN tiene 17 letras y números';
    if (!(datos.precio > 0)) errores['precio'] = 'Tiene que ser mayor a 0';
    if (datos.condicion === 'NUEVO' && datos.kilometraje > 0) {
      errores['kilometraje'] = 'Un vehículo nuevo tiene 0 km';
    }
    if (Object.keys(errores).length) throw invalido('Datos inválidos', errores);
    if (this.d.vehiculos.some((v) => v.vin === vin && v.id !== id)) {
      throw conflicto(`Ya existe un vehículo con el VIN ${vin}`);
    }
    const modelo = this.modelo(datos.modeloId);
    const campos = {
      ...datos,
      vin,
      marcaId: modelo.marcaId,
      marca: modelo.marcaNombre,
      modelo: modelo.nombre,
      categoriaId: modelo.categoriaId,
      categoria: modelo.categoriaNombre,
    };
    if (id !== undefined) {
      return Object.assign(this.vehiculo(id), campos);
    }
    const nuevo: Vehiculo = {
      ...campos,
      id: this.nuevoId(),
      estado: 'DISPONIBLE',
      origen: extra.origen ?? 'COMPRA',
      activo: true,
      imagenes: [],
      fechaIngreso: extra.fechaIngreso ?? fechaHora(new Date()),
    };
    (extra.fotos ?? []).forEach((url, i) => this.agregarImagen(nuevo, url, i === 0));
    this.d.vehiculos.push(nuevo);
    return nuevo;
  }

  agregarImagen(v: Vehiculo, url: string, principal: boolean): ImagenVehiculo {
    if (v.imagenes.length >= 10) throw invalido('Un vehículo puede tener hasta 10 fotos');
    const esPrincipal = principal || v.imagenes.length === 0;
    if (esPrincipal) v.imagenes.forEach((i) => (i.principal = false));
    const imagen: ImagenVehiculo = {
      id: this.nuevoId(),
      url,
      nombreArchivo: url.startsWith('data:') ? 'foto.jpg' : url.split('/').pop()!,
      orden: v.imagenes.length + 1,
      principal: esPrincipal,
    };
    v.imagenes.push(imagen);
    return imagen;
  }

  cambiarEstadoVehiculo(v: Vehiculo, estado: EstadoVehiculo, esperado?: EstadoVehiculo) {
    if (esperado && v.estado !== esperado) {
      throw conflicto(`El vehículo ahora está ${v.estado}: otro usuario lo cambió`);
    }
    v.estado = estado;
    return v;
  }

  // ---------- Planes y simulación

  simular(planId: number, precio: number, anticipo: number, cantidadCuotas: number): Simulacion {
    const plan = this.plan(planId);
    if (!plan.plazos.includes(cantidadCuotas)) {
      throw invalido(`El plan ${plan.nombre} se ofrece en ${plan.plazos.join(', ')} cuotas`, {
        cantidadCuotas: `Elegí entre ${plan.plazos.join(', ')} cuotas`,
      });
    }
    const anticipoMinimo = porcentaje(precio, plan.porcentajeAnticipoMinimo);
    if (anticipo < anticipoMinimo) {
      throw invalido(
        `El anticipo mínimo del plan es el ${plan.porcentajeAnticipoMinimo} % (${pesos(anticipoMinimo)})`,
        { anticipo: `El anticipo mínimo es ${pesos(anticipoMinimo)}` },
      );
    }
    if (anticipo >= precio) throw invalido('Con ese anticipo no queda nada para financiar');
    const montoFinanciado = redondear(precio - anticipo);
    const { valorCuota, cuotas } = cuotasFrancesas(montoFinanciado, plan.tasaAnual, cantidadCuotas);
    const totalAPagar = redondear(cuotas.reduce((s, c) => s + c.monto, 0));
    return {
      planId,
      plan: plan.nombre,
      tasaAnual: plan.tasaAnual,
      precio,
      anticipo,
      anticipoMinimo,
      montoFinanciado,
      cantidadCuotas,
      valorCuota,
      totalIntereses: redondear(totalAPagar - montoFinanciado),
      totalAPagar,
      cuotas,
    };
  }

  // ---------- Cotizaciones y tasaciones

  solicitarCotizacion(
    cliente: Cliente,
    vehiculoId: number,
    mensaje: string | null,
    fecha = new Date(),
  ) {
    const v = this.vehiculo(vehiculoId);
    if (v.estado !== 'DISPONIBLE') throw conflicto('El vehículo ya no está disponible');
    const cot: Cotizacion = {
      id: this.nuevoId(),
      clienteId: cliente.id,
      clienteNombre: this.nombreCliente(cliente),
      vehiculoId: v.id,
      vehiculo: this.descripcionVehiculo(v),
      vendedorId: null,
      vendedorNombre: null,
      estado: 'SOLICITADA',
      precioLista: v.precio,
      descuento: null,
      tasacionId: null,
      valorTradeIn: null,
      precioFinal: null,
      mensajeCliente: mensaje,
      respuestaVendedor: null,
      fechaValidez: null,
      fechaSolicitud: fechaHora(fecha),
      fechaRespuesta: null,
    };
    this.d.cotizaciones.push(cot);
    return cot;
  }

  responderCotizacion(
    cot: Cotizacion,
    vendedor: UsuarioDemo,
    datos: {
      descuento: number | null;
      tasacionId: number | null;
      respuesta: string;
      diasValidez: number | null;
    },
    fecha = new Date(),
  ) {
    if (!['SOLICITADA', 'RESPONDIDA'].includes(cot.estado)) {
      throw conflicto(`La cotización está ${cot.estado} y ya no se puede responder`);
    }
    const descuento = datos.descuento ?? 0;
    this.validarDescuento(descuento, cot.precioLista, vendedor);
    const tasacion = datos.tasacionId
      ? this.tasacionUtilizable(datos.tasacionId, cot.clienteId)
      : null;
    const valorTradeIn = tasacion?.valorTasado ?? null;
    Object.assign(cot, {
      vendedorId: vendedor.id,
      vendedorNombre: this.nombreUsuario(vendedor),
      estado: 'RESPONDIDA',
      descuento: descuento || null,
      tasacionId: tasacion?.id ?? null,
      valorTradeIn,
      precioFinal: cot.precioLista - descuento - (valorTradeIn ?? 0),
      respuestaVendedor: datos.respuesta,
      fechaValidez: hoyISO(masDias(fecha, datos.diasValidez ?? 7)),
      fechaRespuesta: fechaHora(fecha),
    } satisfies Partial<Cotizacion>);
    const cliente = this.cliente(cot.clienteId);
    if (cliente.email) {
      this.notificar(
        'COTIZACION_RESPONDIDA',
        cliente.email,
        `Tu cotización del ${cot.vehiculo}`,
        cliente.usuarioId,
        cot.id,
        fecha,
      );
    }
    return cot;
  }

  validarDescuento(descuento: number, precio: number, usuario: Usuario) {
    if (descuento < 0) throw invalido('El descuento no puede ser negativo');
    if (descuento >= precio) throw invalido('El descuento no puede ser igual o mayor al precio');
    const maximo = porcentaje(precio, DESCUENTO_MAXIMO_VENDEDOR);
    if (usuario.rol !== 'ADMIN' && descuento > maximo) {
      throw invalido(
        `Un vendedor puede descontar hasta el ${DESCUENTO_MAXIMO_VENDEDOR} % (${pesos(maximo)}). Para más, tiene que autorizarlo un ADMIN`,
      );
    }
  }

  tasacionUtilizable(id: number, clienteId: number): Tasacion {
    const t = this.tasacion(id);
    if (t.clienteId !== clienteId) throw invalido('La tasación es de otro cliente');
    if (t.estado !== 'ACEPTADA')
      throw conflicto('La tasación tiene que estar ACEPTADA por el cliente');
    if (t.fechaValidez && t.fechaValidez < this.hoy()) throw conflicto('La tasación está vencida');
    return t;
  }

  // ---------- Reservas

  reservar(
    cliente: Cliente,
    vehiculoId: number,
    montoAnticipo: number,
    vendedorId: number,
    cotizacionId: number | null,
    diasVigencia: number | null,
    fecha = new Date(),
  ): Reserva {
    const v = this.vehiculo(vehiculoId);
    if (v.estado !== 'DISPONIBLE') throw conflicto(`El vehículo está ${v.estado}`);
    if (!(montoAnticipo > 0))
      throw invalido('Datos inválidos', { montoAnticipo: 'Tiene que ser mayor a 0' });
    if (montoAnticipo >= v.precio) throw invalido('La seña no puede ser mayor al precio');
    const minima = porcentaje(v.precio, 5);
    if (montoAnticipo < minima) {
      throw invalido('Datos inválidos', {
        montoAnticipo: `La seña mínima es ${pesos(minima)} (5 % del precio)`,
      });
    }
    const reserva: Reserva = {
      id: this.nuevoId(),
      clienteId: cliente.id,
      clienteNombre: this.nombreCliente(cliente),
      vehiculoId: v.id,
      vehiculo: this.descripcionVehiculo(v),
      vendedorId,
      cotizacionId,
      montoAnticipo,
      fechaVencimiento: hoyISO(masDias(fecha, diasVigencia ?? 7)),
      estado: 'ACTIVA',
      motivoAnulacion: null,
      fechaAnulacion: null,
      fechaReserva: fechaHora(fecha),
    };
    v.estado = 'RESERVADO';
    this.d.reservas.push(reserva);
    if (cliente.email) {
      this.notificar(
        'RESERVA_CONFIRMADA',
        cliente.email,
        `Reservaste el ${reserva.vehiculo}`,
        cliente.usuarioId,
        reserva.id,
        fecha,
      );
    }
    return reserva;
  }

  // ---------- Ventas

  vender(
    datos: {
      clienteId: number;
      vehiculoId: number;
      cotizacionId: number | null;
      tasacionId: number | null;
      descuento: number | null;
      formaPago: FormaPago;
      planFinanciamientoId: number | null;
      cantidadCuotas: number | null;
      montoFinanciado: number | null;
    },
    vendedor: UsuarioDemo,
    fecha = new Date(),
  ): Venta {
    const cliente = this.cliente(datos.clienteId);
    if (!cliente.perfilCompleto) {
      throw conflicto('El cliente tiene que tener documento, teléfono y dirección para comprar');
    }
    const v = this.vehiculo(datos.vehiculoId);
    const reserva = this.d.reservas.find((r) => r.vehiculoId === v.id && r.estado === 'ACTIVA');
    if (v.estado === 'VENDIDO' || !v.activo) throw conflicto('El vehículo ya se vendió');
    if (reserva && reserva.clienteId !== cliente.id) {
      throw conflicto('El vehículo está reservado para otro cliente');
    }

    let cotizacion: Cotizacion | null = null;
    let precio = v.precio;
    let descuento = datos.descuento ?? 0;
    let tasacion: Tasacion | null = null;
    if (datos.cotizacionId) {
      cotizacion = this.cotizacion(datos.cotizacionId);
      if (cotizacion.clienteId !== cliente.id || cotizacion.vehiculoId !== v.id) {
        throw invalido('La cotización es de otro cliente o de otro vehículo');
      }
      if (!['RESPONDIDA', 'ACEPTADA'].includes(cotizacion.estado)) {
        throw conflicto(`La cotización está ${cotizacion.estado}`);
      }
      precio = cotizacion.precioLista;
      descuento = cotizacion.descuento ?? 0;
      tasacion = cotizacion.tasacionId
        ? this.tasacionUtilizable(cotizacion.tasacionId, cliente.id)
        : null;
    } else {
      this.validarDescuento(descuento, precio, vendedor);
      tasacion = datos.tasacionId ? this.tasacionUtilizable(datos.tasacionId, cliente.id) : null;
    }
    const precioFinal = precio - descuento;
    const valorTradeIn = tasacion?.valorTasado ?? 0;
    const sena = reserva?.montoAnticipo ?? 0;
    const saldo = precioFinal - valorTradeIn - sena;
    if (saldo < 0) throw invalido('El trade-in y la seña superan el precio final');

    let simulacion: Simulacion | null = null;
    if (datos.formaPago === 'FINANCIADA') {
      if (!datos.planFinanciamientoId || !datos.cantidadCuotas || !datos.montoFinanciado) {
        throw invalido('Para financiar elegí el plan, las cuotas y el monto');
      }
      if (datos.montoFinanciado > saldo) {
        throw invalido(`No se puede financiar más que el saldo (${pesos(saldo)})`);
      }
      simulacion = this.simular(
        datos.planFinanciamientoId,
        precioFinal,
        precioFinal - datos.montoFinanciado,
        datos.cantidadCuotas,
      );
    }

    const id = this.nuevoId();
    const condicion = v.condicion;
    const pctComision = PORCENTAJE_COMISION[condicion];
    const venta: Venta = {
      id,
      numeroComprobante: `V-${fecha.getFullYear()}-${String(id).padStart(6, '0')}`,
      clienteId: cliente.id,
      clienteNombre: this.nombreCliente(cliente),
      vehiculoId: v.id,
      vehiculo: this.descripcionVehiculo(v),
      vendedorId: vendedor.id,
      vendedorNombre: this.nombreUsuario(vendedor),
      cotizacionId: cotizacion?.id ?? null,
      reservaId: reserva?.id ?? null,
      tasacionId: tasacion?.id ?? null,
      vehiculoTradeInId: null,
      formaPago: datos.formaPago,
      precioVehiculo: precio,
      descuento,
      precioFinal,
      valorTradeIn: tasacion ? valorTradeIn : null,
      montoAnticipoReserva: reserva ? sena : null,
      saldoAPagar: saldo,
      entregaEfectivo: simulacion ? redondear(saldo - simulacion.montoFinanciado) : saldo,
      planFinanciamientoId: simulacion?.planId ?? null,
      planNombre: simulacion?.plan ?? null,
      cantidadCuotas: simulacion?.cantidadCuotas ?? null,
      montoFinanciado: simulacion?.montoFinanciado ?? null,
      valorCuota: simulacion?.valorCuota ?? null,
      comision: null,
      estado: 'CONFIRMADA',
      motivoAnulacion: null,
      fechaVenta: fechaHora(fecha),
      fechaAnulacion: null,
    };
    const comision: Comision = {
      id: this.nuevoId(),
      ventaId: id,
      numeroComprobante: venta.numeroComprobante,
      vendedorId: vendedor.id,
      vendedorNombre: venta.vendedorNombre,
      baseCalculo: precioFinal,
      porcentaje: pctComision,
      monto: porcentaje(precioFinal, pctComision),
      estado: 'PENDIENTE',
      fechaCalculo: venta.fechaVenta,
      fechaPago: null,
    };
    venta.comision = {
      id: comision.id,
      porcentaje: pctComision,
      monto: comision.monto,
      estado: 'PENDIENTE',
    };
    this.d.ventas.push(venta);
    this.d.comisiones.push(comision);

    if (reserva) reserva.estado = 'CONVERTIDA';
    if (cotizacion) cotizacion.estado = 'ACEPTADA';
    if (tasacion) {
      // El auto usado entra al inventario.
      const modelo = this.modelo(tasacion.modeloId);
      const usado = this.guardarVehiculo(
        undefined,
        {
          vin: tasacion.vin,
          modeloId: modelo.id,
          anio: tasacion.anio,
          color: tasacion.color,
          kilometraje: tasacion.kilometraje,
          precio: Math.round(tasacion.valorTasado * 1.15),
          condicion: 'USADO',
          descripcion: tasacion.observaciones,
        },
        { origen: 'TRADE_IN', fechaIngreso: venta.fechaVenta },
      );
      tasacion.estado = 'UTILIZADA';
      tasacion.vehiculoIngresadoId = usado.id;
      venta.vehiculoTradeInId = usado.id;
    }
    v.estado = 'VENDIDO';
    if (simulacion) this.crearFinanciamiento(venta, simulacion, fecha);
    if (cliente.email) {
      this.notificar(
        'VENTA_CONFIRMADA',
        cliente.email,
        `Compraste el ${venta.vehiculo}`,
        cliente.usuarioId,
        venta.id,
        fecha,
      );
    }
    return venta;
  }

  private crearFinanciamiento(venta: Venta, sim: Simulacion, fecha: Date) {
    const plan = this.plan(sim.planId);
    const primerVencimiento = masMeses(fecha, 1);
    const fin: FinanciamientoGuardado = {
      id: this.nuevoId(),
      ventaId: venta.id,
      numeroComprobante: venta.numeroComprobante,
      clienteId: venta.clienteId,
      clienteNombre: venta.clienteNombre,
      planId: plan.id,
      plan: plan.nombre,
      montoFinanciado: sim.montoFinanciado,
      tasaAnualAplicada: plan.tasaAnual,
      cantidadCuotas: sim.cantidadCuotas,
      valorCuota: sim.valorCuota,
      fechaPrimerVencimiento: hoyISO(primerVencimiento),
      fechaCreacion: venta.fechaVenta,
      montoAnticipo: venta.entregaEfectivo ?? 0,
      porcentajeMoraDiaria: plan.porcentajeMoraDiaria,
      anulado: false,
    };
    this.d.financiamientos.push(fin);
    for (const c of sim.cuotas) {
      this.d.cuotas.push({
        id: this.nuevoId(),
        financiamientoId: fin.id,
        clienteId: fin.clienteId,
        clienteNombre: fin.clienteNombre,
        numero: c.numero,
        fechaVencimiento: hoyISO(masMeses(primerVencimiento, c.numero - 1)),
        capital: c.capital,
        interes: c.interes,
        monto: c.monto,
        montoPagado: 0,
        moraFinal: null,
        fechaPago: null,
        anulada: false,
      });
    }
  }

  anularVenta(venta: Venta, motivo: string) {
    if (venta.estado === 'ANULADA') throw conflicto('La venta ya está anulada');
    if (venta.vehiculoTradeInId) {
      const usado = this.vehiculo(venta.vehiculoTradeInId);
      if (usado.estado !== 'DISPONIBLE') {
        throw conflicto(
          `El auto recibido como parte de pago ya está ${usado.estado}; no se puede anular la venta`,
        );
      }
      usado.activo = false;
    }
    Object.assign(venta, {
      estado: 'ANULADA',
      motivoAnulacion: motivo,
      fechaAnulacion: fechaHora(new Date()),
    });
    this.vehiculo(venta.vehiculoId).estado = 'DISPONIBLE';
    const comision = this.d.comisiones.find((c) => c.ventaId === venta.id);
    if (comision) {
      comision.estado = 'ANULADA';
      venta.comision = { ...venta.comision!, estado: 'ANULADA' };
    }
    const fin = this.d.financiamientos.find((f) => f.ventaId === venta.id);
    if (fin) {
      fin.anulado = true;
      this.d.cuotas
        .filter((c) => c.financiamientoId === fin.id && c.montoPagado < c.monto)
        .forEach((c) => (c.anulada = true));
    }
    return venta;
  }

  // ---------- Financiamiento, cuotas y pagos

  verCuota(c: CuotaGuardada, hoy = this.hoy()): Cuota {
    const fin = this.financiamiento(c.financiamientoId);

    const atraso = Math.max(0, diasEntre(c.fechaVencimiento, c.fechaPago ?? hoy));
    const mora = c.moraFinal ?? redondear(c.monto * (fin.porcentajeMoraDiaria / 100) * atraso);
    const saldo = c.anulada ? 0 : Math.max(0, redondear(c.monto + mora - c.montoPagado));
    const estado = c.anulada
      ? 'ANULADA'
      : saldo === 0
        ? 'PAGADA'
        : c.fechaVencimiento < hoy
          ? 'VENCIDA'
          : c.montoPagado > 0
            ? 'PAGADA_PARCIAL'
            : 'PENDIENTE';
    const { moraFinal: _, anulada: __, ...resto } = c;
    return {
      ...resto,
      mora,
      saldo,
      estado,
      diasAtraso: estado === 'VENCIDA' ? atraso : 0,
    };
  }

  cuotasDe(finId: number): Cuota[] {
    return this.d.cuotas
      .filter((c) => c.financiamientoId === finId)
      .sort((a, b) => a.numero - b.numero)
      .map((c) => this.verCuota(c));
  }

  verFinanciamiento(f: FinanciamientoGuardado): FinanciamientoResumen {
    const cuotas = this.cuotasDe(f.id);
    const estado = f.anulado
      ? 'ANULADO'
      : cuotas.every((c) => c.estado === 'PAGADA')
        ? 'CANCELADO'
        : cuotas.some((c) => c.estado === 'VENCIDA')
          ? 'EN_MORA'
          : 'ACTIVO';
    const { montoAnticipo: _, porcentajeMoraDiaria: __, anulado: ___, ...resto } = f;
    return { ...resto, estado };
  }

  estadoDeCuenta(f: FinanciamientoGuardado): EstadoCuenta {
    const cuotas = this.cuotasDe(f.id);
    const pagos = this.d.pagos.filter((p) => p.financiamientoId === f.id);
    const anticipoPagado = suma(
      pagos.filter((p) => p.tipo === 'ANTICIPO'),
      (p) => p.monto,
    );
    const impagas = cuotas.filter((c) => c.estado !== 'PAGADA' && c.estado !== 'ANULADA');
    const vencidas = cuotas.filter((c) => c.estado === 'VENCIDA');
    return {
      financiamiento: this.verFinanciamiento(f),
      resumen: {
        montoAnticipo: f.montoAnticipo,
        anticipoPagado,
        anticipoPendiente: Math.max(0, redondear(f.montoAnticipo - anticipoPagado)),
        cuotasPagadas: cuotas.filter((c) => c.estado === 'PAGADA').length,
        cuotasPendientes: impagas.length,
        cuotasVencidas: vencidas.length,
        totalCuotas: suma(cuotas, (c) => c.monto),
        totalPagadoCuotas: suma(cuotas, (c) => c.montoPagado),
        moraAcumulada: suma(cuotas, (c) => c.mora),
        saldoPendiente: suma(impagas, (c) => c.saldo),
        deudaVencida: suma(vencidas, (c) => c.saldo),
        proximaCuota: impagas[0] ?? null,
      },
      cuotas,
      pagos: [...pagos].sort((a, b) => b.fechaPago.localeCompare(a.fechaPago)),
    };
  }

  registrarPago(
    datos: {
      financiamientoId: number;
      tipo: TipoPago;
      cuotaId: number | null;
      monto: number;
      medioPago: MedioPago;
      referencia: string | null;
    },
    registradoPor: Usuario,
    fecha = new Date(),
  ): Pago {
    const fin = this.financiamiento(datos.financiamientoId);
    if (fin.anulado) throw conflicto('El financiamiento está anulado');
    if (!(datos.monto > 0)) throw invalido('Datos inválidos', { monto: 'Tiene que ser mayor a 0' });
    const pago: Pago = {
      id: this.nuevoId(),
      financiamientoId: fin.id,
      ventaId: fin.ventaId,
      clienteId: fin.clienteId,
      tipo: datos.tipo,
      cuotaId: null,
      numeroCuota: null,
      monto: datos.monto,
      montoMora: null,
      medioPago: datos.medioPago,
      referencia: datos.referencia,
      registradoPorId: registradoPor.id,
      fechaPago: fechaHora(fecha),
    };
    if (datos.tipo === 'ANTICIPO') {
      const pendiente = this.estadoDeCuenta(fin).resumen.anticipoPendiente;
      if (pendiente <= 0) throw conflicto('El anticipo ya está pago');
      if (datos.monto > pendiente + 0.01)
        throw invalido(`Falta pagar ${pesos(pendiente)} de anticipo`);
    } else {
      const impagas = this.d.cuotas
        .filter((c) => c.financiamientoId === fin.id)
        .sort((a, b) => a.numero - b.numero)
        .filter((c) => this.verCuota(c, hoyISO(fecha)).saldo > 0);
      const cuota = datos.cuotaId ? impagas.find((c) => c.id === datos.cuotaId) : impagas[0];
      if (!cuota) throw conflicto('No hay cuotas pendientes para pagar');
      if (cuota !== impagas[0])
        throw conflicto(`Primero hay que pagar la cuota ${impagas[0].numero}`);
      const vista = this.verCuota(cuota, hoyISO(fecha));
      if (datos.monto > vista.saldo + 0.01) {
        throw invalido(`La cuota ${cuota.numero} tiene un saldo de ${pesos(vista.saldo)}`);
      }
      cuota.montoPagado = redondear(cuota.montoPagado + datos.monto);
      if (cuota.montoPagado + 0.01 >= cuota.monto + vista.mora) {
        cuota.moraFinal = vista.mora;
        cuota.fechaPago = hoyISO(fecha);
      }
      pago.cuotaId = cuota.id;
      pago.numeroCuota = cuota.numero;
      pago.montoMora = vista.mora || null;
    }
    this.d.pagos.push(pago);
    return pago;
  }

  // ---------- Notificaciones

  notificar(
    tipo: TipoNotificacion,
    destinatario: string,
    asunto: string,
    usuarioId: number | null = null,
    referenciaId: number | null = null,
    fecha = new Date(),
    fallida = false,
  ) {
    this.d.notificaciones.push({
      id: this.nuevoId(),
      tipo,
      destinatario,
      usuarioId,
      asunto,
      cuerpo: `<div style="font-family:sans-serif"><h2>${asunto}</h2><p>Este es un email de ejemplo de la versión demo.</p><p>— Concesionaria</p></div>`,
      referenciaId,
      estado: fallida ? 'FALLIDA' : 'ENVIADA',
      intentos: fallida ? 3 : 1,
      ultimoError: fallida ? 'Connection refused: smtp.mailserver.com:587' : null,
      fechaCreacion: fechaHora(fecha),
      fechaEnvio: fallida ? null : fechaHora(fecha),
    });
  }

  /** Lo que en el backend hacen los procesos diarios: vencer reservas y cotizaciones. */
  mantenimiento() {
    const hoy = this.hoy();
    for (const r of this.d.reservas) {
      if (r.estado === 'ACTIVA' && r.fechaVencimiento < hoy) {
        r.estado = 'VENCIDA';
        const v = this.vehiculo(r.vehiculoId);
        if (v.estado === 'RESERVADO') v.estado = 'DISPONIBLE';
      }
    }
    for (const c of this.d.cotizaciones) {
      if (c.estado === 'RESPONDIDA' && c.fechaValidez && c.fechaValidez < hoy) c.estado = 'VENCIDA';
    }
  }
}

export function suma<T>(lista: T[], valor: (x: T) => number): number {
  return redondear(lista.reduce((s, x) => s + (valor(x) ?? 0), 0));
}

export function fallar(error: Error): never {
  throw error;
}

function normalizarDireccion(d: Direccion): Direccion {
  return { ...d, pisoDepto: d.pisoDepto ?? null, codigoPostal: d.codigoPostal ?? null };
}

export function esEmpleado(rol: Rol | undefined): boolean {
  return rol === 'ADMIN' || rol === 'VENDEDOR';
}
