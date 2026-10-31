import { CondicionVehiculo, Vehiculo } from '../features/vehiculos/model';
import { BaseDemo, Datos, masDias, fechaHora } from './base-demo';

/** Cambiarla cuando cambien los datos: así los navegadores que ya tenían la demo la recargan. */
export const VERSION_DATOS = 1;

const FOTOS: Record<string, number[]> = {
  Corolla: [1, 2, 3],
  Hilux: [2, 3],
  Yaris: [2, 1, 3],
  Amarok: [1, 2, 3],
  'T-Cross': [1, 2, 3],
  Polo: [1, 2, 3],
  Ranger: [1, 2, 3],
  Territory: [2, 1, 3],
  '208': [1, 2, 3],
  '2008': [1, 2, 3],
};
const fotos = (modelo: string) =>
  FOTOS[modelo].map((n) => `/demo/fotos/${modelo.toLowerCase()}-${n}.jpg`);

/** Números pseudoaleatorios fijos, para que los VIN no cambien entre cargas. */
function generador(semilla: number) {
  return () => {
    semilla = (semilla * 1_103_515_245 + 12_345) % 2_147_483_648;
    return semilla / 2_147_483_648;
  };
}

export function datosIniciales(): Datos {
  const b = new BaseDemo({
    version: VERSION_DATOS,
    sig: 100,
    usuarios: [],
    marcas: [],
    categorias: [],
    modelos: [],
    vehiculos: [],
    planes: [],
    clientes: [],
    cotizaciones: [],
    tasaciones: [],
    reservas: [],
    ventas: [],
    comisiones: [],
    financiamientos: [],
    cuotas: [],
    pagos: [],
    notificaciones: [],
  });
  const d = b.d;
  const ahora = new Date();
  const hace = (dias: number, hora = 11) => {
    const f = masDias(ahora, -dias);
    f.setHours(hora, (dias * 7) % 60, 0, 0);
    return f;
  };
  const azar = generador(2026);
  const vin = () =>
    Array.from(
      { length: 17 },
      () => 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'[Math.floor(azar() * 33)],
    ).join('');

  // ---------- Usuarios
  const admin = b.crearUsuario(
    {
      email: 'admin@concesionaria.com',
      password: 'Admin12345',
      nombre: 'Ana',
      apellido: 'Pérez',
      rol: 'ADMIN',
    },
    hace(400),
  );
  const vera = b.crearUsuario(
    {
      email: 'vera.gomez@concesionaria.com',
      password: 'Vendedor12345',
      nombre: 'Vera',
      apellido: 'Gómez',
      rol: 'VENDEDOR',
    },
    hace(380),
  );
  const bruno = b.crearUsuario(
    {
      email: 'bruno.diaz@concesionaria.com',
      password: 'Vendedor12345',
      nombre: 'Bruno',
      apellido: 'Díaz',
      rol: 'VENDEDOR',
    },
    hace(360),
  );
  const ex = b.crearUsuario(
    {
      email: 'carlos.ruiz@concesionaria.com',
      password: 'Vendedor12345',
      nombre: 'Carlos',
      apellido: 'Ruiz',
      rol: 'VENDEDOR',
    },
    hace(390),
  );
  ex.activo = false;

  // ---------- Catálogo
  const categorias: Record<string, number> = {};
  for (const [nombre, descripcion] of [
    ['Sedán', 'Tres volúmenes, baúl separado'],
    ['SUV', 'Utilitario deportivo'],
    ['Pickup', 'Caja de carga abierta'],
    ['Hatchback', 'Compacto con portón trasero'],
  ]) {
    const id = b.nuevoId();
    d.categorias.push({ id, nombre, descripcion, activo: true });
    categorias[nombre] = id;
  }
  const marcas: Record<string, number> = {};
  for (const nombre of ['Toyota', 'Volkswagen', 'Ford', 'Peugeot', 'Fiat']) {
    const id = b.nuevoId();
    d.marcas.push({ id, nombre, activo: nombre !== 'Fiat' });
    marcas[nombre] = id;
  }
  const modelos: Record<string, number> = {};
  for (const [marca, nombre, categoria] of [
    ['Toyota', 'Corolla', 'Sedán'],
    ['Toyota', 'Hilux', 'Pickup'],
    ['Toyota', 'Yaris', 'Hatchback'],
    ['Volkswagen', 'Amarok', 'Pickup'],
    ['Volkswagen', 'T-Cross', 'SUV'],
    ['Volkswagen', 'Polo', 'Hatchback'],
    ['Ford', 'Ranger', 'Pickup'],
    ['Ford', 'Territory', 'SUV'],
    ['Peugeot', '208', 'Hatchback'],
    ['Peugeot', '2008', 'SUV'],
  ]) {
    const id = b.nuevoId();
    d.modelos.push({
      id,
      nombre,
      marcaId: marcas[marca],
      marcaNombre: marca,
      categoriaId: categorias[categoria],
      categoriaNombre: categoria,
      activo: true,
    });
    modelos[nombre] = id;
  }

  const auto = (
    modelo: string,
    anio: number,
    km: number,
    precio: number,
    color: string,
    descripcion: string,
    diasEnStock: number,
  ): Vehiculo =>
    b.guardarVehiculo(
      undefined,
      {
        vin: vin(),
        modeloId: modelos[modelo],
        anio,
        color,
        kilometraje: km,
        precio,
        condicion: (km === 0 ? 'NUEVO' : 'USADO') as CondicionVehiculo,
        descripcion,
      },
      { fechaIngreso: fechaHora(hace(diasEnStock, 9)), fotos: fotos(modelo) },
    );

  // ---------- Vehículos en el inventario
  const corolla24 = auto(
    'Corolla',
    2024,
    0,
    38_500_000,
    'Blanco perla',
    'Versión híbrida con caja automática CVT, control de crucero adaptativo y pantalla de 10".',
    12,
  );
  const hilux23 = auto(
    'Hilux',
    2023,
    25_000,
    52_000_000,
    'Gris plata',
    'Doble cabina 4x4, motor 2.8 turbodiésel. Service oficial al día, único dueño.',
    48,
  );
  const yaris = auto(
    'Yaris',
    2022,
    41_000,
    21_500_000,
    'Rojo',
    'Hatchback ideal para la ciudad, muy económico. Cubiertas nuevas.',
    95,
  );
  const amarok = auto(
    'Amarok',
    2021,
    68_000,
    45_000_000,
    'Negro',
    'V6 Extreme 4Motion, tapizado de cuero, cámara de retroceso y lona marítima.',
    140,
  );
  const tcross25 = auto(
    'T-Cross',
    2025,
    0,
    36_900_000,
    'Azul',
    'SUV compacto 0 km, motor 1.0 TSI, techo panorámico y asistente de estacionamiento.',
    20,
  );
  const polo20 = auto(
    'Polo',
    2020,
    72_000,
    16_800_000,
    'Gris',
    'Motor 1.6, aire acondicionado y dirección asistida. Excelente estado general.',
    60,
  );
  const ranger24 = auto(
    'Ranger',
    2024,
    12_000,
    55_500_000,
    'Blanco',
    'Wildtrak V6, caja automática de 10 marchas, todavía en garantía de fábrica.',
    33,
  );
  const territory = auto(
    'Territory',
    2025,
    0,
    41_200_000,
    'Gris oscuro',
    'SUV 0 km con pantalla de 12", cargador inalámbrico y seis airbags.',
    26,
  );
  const p208 = auto(
    '208',
    2023,
    18_000,
    23_900_000,
    'Blanco',
    'Versión Allure con i-Cockpit 3D y faros full LED.',
    74,
  );
  const p2008 = auto(
    '2008',
    2022,
    35_000,
    28_700_000,
    'Negro',
    'GT-Line, motor 1.6 THP, techo bitono y llantas de 17".',
    85,
  );
  const corolla19 = auto(
    'Corolla',
    2019,
    95_000,
    19_500_000,
    'Gris',
    'Sedán confiable con mantenimiento registrado. Ideal primer auto familiar.',
    70,
  );
  const hilux25 = auto(
    'Hilux',
    2025,
    0,
    61_000_000,
    'Negro',
    'SRX 0 km, la versión más completa de la gama, entrega inmediata.',
    8,
  );
  const polo25 = auto(
    'Polo',
    2025,
    0,
    24_500_000,
    'Rojo',
    'Polo Track 0 km, el más económico de la línea para arrancar.',
    120,
  );
  auto(
    'Ranger',
    2020,
    110_000,
    33_000_000,
    'Azul',
    'XLT 4x2, uso particular, papeles al día y listo para transferir.',
    210,
  );
  auto(
    'T-Cross',
    2023,
    30_000,
    31_000_000,
    'Blanco',
    'Highline con techo panorámico, un solo dueño.',
    150,
  );
  auto('208', 2025, 0, 26_400_000, 'Gris', 'Active 0 km con Apple CarPlay y Android Auto.', 4);
  const baja = auto(
    'Yaris',
    2018,
    130_000,
    12_000_000,
    'Blanco',
    'Dado de baja: tenía un problema de papeles.',
    260,
  );
  baja.activo = false;

  // ---------- Planes
  const plan = {
    id: b.nuevoId(),
    nombre: 'Plan Clásico',
    descripcion: 'Tasa fija en pesos, cuotas mensuales.',
    tasaAnual: 55,
    plazos: [12, 24, 36],
    porcentajeAnticipoMinimo: 30,
    porcentajeMoraDiaria: 0.1,
    activo: true,
  };
  const plan0km = {
    id: b.nuevoId(),
    nombre: 'Plan 0 km',
    descripcion: 'Para unidades nuevas, con menor anticipo.',
    tasaAnual: 45,
    plazos: [12, 24, 36, 48],
    porcentajeAnticipoMinimo: 20,
    porcentajeMoraDiaria: 0.08,
    activo: true,
  };
  d.planes.push(plan, plan0km, {
    id: b.nuevoId(),
    nombre: 'Plan Verano 2025',
    descripcion: 'Promoción que ya terminó.',
    tasaAnual: 39,
    plazos: [12, 18],
    porcentajeAnticipoMinimo: 40,
    porcentajeMoraDiaria: 0.1,
    activo: false,
  });

  // ---------- Clientes
  const direcciones = [
    {
      calle: 'Av. Corrientes',
      numero: '1234',
      pisoDepto: '3A',
      ciudad: 'CABA',
      provincia: 'Ciudad Autónoma de Buenos Aires',
      codigoPostal: '1043',
    },
    {
      calle: 'Av. Rivadavia',
      numero: '5820',
      pisoDepto: null,
      ciudad: 'CABA',
      provincia: 'Ciudad Autónoma de Buenos Aires',
      codigoPostal: '1406',
    },
    {
      calle: 'Calle 7',
      numero: '910',
      pisoDepto: null,
      ciudad: 'La Plata',
      provincia: 'Buenos Aires',
      codigoPostal: '1900',
    },
    {
      calle: 'Av. Maipú',
      numero: '2450',
      pisoDepto: '1B',
      ciudad: 'Olivos',
      provincia: 'Buenos Aires',
      codigoPostal: '1636',
    },
    {
      calle: 'San Martín',
      numero: '330',
      pisoDepto: null,
      ciudad: 'Quilmes',
      provincia: 'Buenos Aires',
      codigoPostal: '1878',
    },
  ];
  const nuevoCliente = (
    nombre: string,
    apellido: string,
    dni: string,
    email: string | null,
    i: number,
    dias: number,
  ) =>
    b.guardarCliente(
      undefined,
      {
        nombre,
        apellido,
        tipoDocumento: 'DNI',
        numeroDocumento: dni,
        email,
        telefono: `11 5555-${String(1000 + i * 137).slice(-4)}`,
        direccion: direcciones[i % direcciones.length],
        fechaNacimiento: `19${70 + ((i * 3) % 28)}-0${1 + (i % 9)}-1${i % 9}`,
      },
      {},
      hace(dias),
    );
  const [lucia, martin, sofia, juan, valen, mateo, camila, tomas, julieta, franco] = [
    ['Lucía', 'Ferreyra', '30111222', 'lucia.ferreyra@mail.com'],
    ['Martín', 'Acosta', '28333444', 'martin.acosta@mail.com'],
    ['Sofía', 'Gómez', '35100200', 'sofia.gomez@mail.com'],
    ['Juan', 'Rodríguez', '33222111', null],
    ['Valentina', 'López', '40123456', 'valen.lopez@mail.com'],
    ['Mateo', 'Díaz', '38999000', null],
    ['Camila', 'Martínez', '36555777', 'camila.martinez@mail.com'],
    ['Tomás', 'Pérez', '31444888', null],
    ['Julieta', 'Sánchez', '39876543', 'juli.sanchez@mail.com'],
    ['Franco', 'Romero', '27666333', 'franco.romero@mail.com'],
  ].map(([n, a, dni, mail], i) => nuevoCliente(n!, a!, dni!, mail, i, 150 - i * 10));
  const historicos = [
    ['Ricardo', 'Benítez', '25444111', 'ricardo.benitez@mail.com'],
    ['Paula', 'Medina', '33777222', 'paula.medina@mail.com'],
    ['Diego', 'Suárez', '29888555', null],
    ['Florencia', 'Castro', '37222999', 'flor.castro@mail.com'],
    ['Gustavo', 'Herrera', '24111777', 'gherrera@mail.com'],
    ['Agustina', 'Molina', '41333666', 'agus.molina@mail.com'],
  ].map(([n, a, dni, mail], i) => nuevoCliente(n!, a!, dni!, mail, i + 10, 360 - i * 30));

  // Clientes del portal (se registraron solos)
  const pablo = b.registrarCliente({
    email: 'cliente.demo@mail.com',
    password: 'Cliente12345',
    nombre: 'Pablo',
    apellido: 'Portal',
  });
  const pabloCliente = b.clienteDeUsuario(pablo.id);
  b.guardarCliente(pabloCliente.id, {
    nombre: 'Pablo',
    apellido: 'Portal',
    tipoDocumento: 'DNI',
    numeroDocumento: '34567890',
    telefono: '11 4444-5555',
    direccion: {
      calle: 'Av. Santa Fe',
      numero: '2100',
      pisoDepto: '4B',
      ciudad: 'CABA',
      provincia: 'Ciudad Autónoma de Buenos Aires',
      codigoPostal: '1123',
    },
    fechaNacimiento: '1990-05-12',
  });
  pabloCliente.fechaCreacion = fechaHora(hace(110));
  pablo.fechaCreacion = pabloCliente.fechaCreacion;
  b.registrarCliente({
    email: 'nadia.ruiz@mail.com',
    password: 'Cliente12345',
    nombre: 'Nadia',
    apellido: 'Ruiz',
  });

  // ---------- Ventas
  const financiada = (
    vendedor: typeof vera,
    cliente: typeof lucia,
    v: Vehiculo,
    planId: number,
    cuotas: number,
    monto: number,
    dias: number,
    cotizacionId: number | null = null,
  ) => {
    const venta = b.vender(
      {
        clienteId: cliente.id,
        vehiculoId: v.id,
        cotizacionId,
        tasacionId: null,
        descuento: null,
        formaPago: 'FINANCIADA',
        planFinanciamientoId: planId,
        cantidadCuotas: cuotas,
        montoFinanciado: monto,
      },
      vendedor,
      hace(dias, 16),
    );
    const fin = d.financiamientos.find((f) => f.ventaId === venta.id)!;
    b.registrarPago(
      {
        financiamientoId: fin.id,
        tipo: 'ANTICIPO',
        cuotaId: null,
        monto: fin.montoAnticipo,
        medioPago: 'TRANSFERENCIA',
        referencia: `ANT-${venta.id}`,
      },
      vendedor,
      hace(dias, 17),
    );
    return { venta, fin };
  };
  /** Paga las cuotas que vencieron hasta "cuantas" (o todas las vencidas), cada una el día que vence. */
  const pagarCuotas = (finId: number, cuantas = Infinity) => {
    const hoy = b.hoy();
    d.cuotas
      .filter((c) => c.financiamientoId === finId && c.fechaVencimiento <= hoy)
      .sort((x, y) => x.numero - y.numero)
      .slice(0, cuantas)
      .forEach((c) => {
        const [a, m, dia] = c.fechaVencimiento.split('-').map(Number);
        b.registrarPago(
          {
            financiamientoId: finId,
            tipo: 'CUOTA',
            cuotaId: c.id,
            monto: c.monto,
            medioPago: c.numero % 3 ? 'TRANSFERENCIA' : 'EFECTIVO',
            referencia: null,
          },
          admin,
          new Date(a, m - 1, dia, 12),
        );
      });
  };
  const contado = (
    vendedor: typeof vera,
    cliente: typeof lucia,
    v: Vehiculo,
    dias: number,
    descuento: number | null = null,
  ) =>
    b.vender(
      {
        clienteId: cliente.id,
        vehiculoId: v.id,
        cotizacionId: null,
        tasacionId: null,
        descuento,
        formaPago: 'CONTADO',
        planFinanciamientoId: null,
        cantidadCuotas: null,
        montoFinanciado: null,
      },
      vendedor,
      hace(dias, 15),
    );

  // Ventas de los últimos meses (para el dashboard y los reportes). Sus comisiones ya se pagaron.
  const vendidos: [string, number, number, number, string, number, number][] = [
    ['Corolla', 2023, 0, 33_000_000, 'Gris', 330, 300],
    ['Ranger', 2022, 48_000, 39_000_000, 'Rojo', 300, 265],
    ['208', 2024, 0, 21_000_000, 'Azul', 260, 230],
    ['Hilux', 2021, 80_000, 38_500_000, 'Blanco', 240, 200],
    ['T-Cross', 2024, 0, 30_500_000, 'Gris', 200, 170],
    ['Yaris', 2023, 15_000, 19_800_000, 'Negro', 180, 140],
    ['Amarok', 2024, 0, 52_000_000, 'Gris oscuro', 150, 112],
    ['Territory', 2024, 0, 37_000_000, 'Blanco', 120, 80],
    ['2008', 2024, 0, 30_200_000, 'Rojo', 90, 50],
    ['Polo', 2024, 0, 22_000_000, 'Blanco', 60, 25],
  ];
  vendidos.forEach(([modelo, anio, km, precio, color, ingreso, venta], i) => {
    const v = auto(modelo, anio, km, precio, color, 'Unidad vendida.', ingreso);
    const cliente = historicos[i % historicos.length];
    const vendedor = i % 3 === 0 ? bruno : i === 1 ? ex : vera;
    if (i % 2 === 0) {
      contado(vendedor, cliente, v, venta, i === 4 ? 1_000_000 : null);
    } else {
      const { fin } = financiada(
        vendedor,
        cliente,
        v,
        i % 4 === 1 ? plan.id : plan0km.id,
        12,
        Math.round(precio * 0.5),
        venta,
      );
      pagarCuotas(fin.id);
    }
  });
  for (const c of d.comisiones) {
    c.estado = 'PAGADA';
    c.fechaPago = fechaHora(masDias(new Date(c.fechaCalculo), 20));
    const venta = d.ventas.find((v) => v.id === c.ventaId)!;
    venta.comision = { ...venta.comision!, estado: 'PAGADA' };
  }

  contado(vera, juan, polo20, 20);
  contado(bruno, mateo, corolla19, 35, 500_000);

  const cotLucia = b.solicitarCotizacion(lucia, yaris.id, null, hace(75));
  b.responderCotizacion(
    cotLucia,
    vera,
    {
      descuento: 500_000,
      tasacionId: null,
      respuesta: 'Te hacemos precio especial pagando este mes.',
      diasValidez: 10,
    },
    hace(75, 12),
  );
  const yarisVenta = financiada(vera, lucia, yaris, plan.id, 12, 14_000_000, 70, cotLucia.id);
  pagarCuotas(yarisVenta.fin.id, 2);
  // Martín pagó solo la primera cuota y Sofía ninguna: quedan en mora.
  pagarCuotas(financiada(bruno, martin, amarok, plan.id, 24, 30_000_000, 100).fin.id, 1);
  financiada(vera, sofia, p2008, plan.id, 36, 20_000_000, 45);
  // Compra del cliente demo, al día.
  pagarCuotas(financiada(vera, pabloCliente, polo25, plan0km.id, 24, 17_000_000, 95).fin.id, 3);

  // ---------- Reservas con seña
  b.reservar(valen, hilux23.id, 3_000_000, bruno.id, null, 7, hace(3));
  b.reservar(camila, territory.id, 2_500_000, vera.id, null, 10, hace(1));

  // ---------- Tasación del auto usado de Tomás (puede entrarlo como parte de pago)
  d.tasaciones.push({
    id: b.nuevoId(),
    clienteId: tomas.id,
    vendedorId: bruno.id,
    vin: vin(),
    modeloId: modelos['Corolla'],
    modelo: 'Toyota Corolla',
    anio: 2017,
    color: 'Gris',
    kilometraje: 120_000,
    observaciones: 'Detalles de pintura en el paragolpes trasero.',
    valorTasado: 14_000_000,
    estado: 'ACEPTADA',
    fechaValidez: fechaHora(masDias(ahora, 12)).slice(0, 10),
    vehiculoIngresadoId: null,
    fechaTasacion: fechaHora(hace(2)),
  });

  // ---------- Cotizaciones abiertas
  const cotTomas = b.solicitarCotizacion(tomas, ranger24.id, null, hace(4));
  b.responderCotizacion(
    cotTomas,
    bruno,
    {
      descuento: 1_000_000,
      tasacionId: null,
      respuesta: 'Con el descuento por pago contado.',
      diasValidez: 10,
    },
    hace(4, 13),
  );
  const cotJulieta = b.solicitarCotizacion(julieta, p208.id, null, hace(6));
  b.responderCotizacion(
    cotJulieta,
    vera,
    { descuento: null, tasacionId: null, respuesta: 'Precio de lista.', diasValidez: 15 },
    hace(6, 12),
  );
  const cotFranco = b.solicitarCotizacion(franco, corolla24.id, null, hace(30));
  b.responderCotizacion(
    cotFranco,
    bruno,
    {
      descuento: 800_000,
      tasacionId: null,
      respuesta: 'Precio especial por esta semana.',
      diasValidez: 5,
    },
    hace(30, 12),
  );
  cotFranco.estado = 'RECHAZADA';
  b.solicitarCotizacion(
    pabloCliente,
    tcross25.id,
    '¿Tienen financiación en 36 cuotas?',
    hace(1, 18),
  );
  const cotHilux = b.solicitarCotizacion(
    pabloCliente,
    hilux25.id,
    '¿Toman mi auto usado como parte de pago?',
    hace(2, 20),
  );
  b.responderCotizacion(
    cotHilux,
    vera,
    {
      descuento: 2_000_000,
      tasacionId: null,
      respuesta:
        'Sí, tomamos tu usado. Traelo al local y lo tasamos en el momento. Te dejamos un descuento especial.',
      diasValidez: 10,
    },
    hace(1, 10),
  );

  // ---------- Algunos emails más (recordatorios y uno que falló)
  b.notificar(
    'CUOTA_VENCIDA',
    'martin.acosta@mail.com',
    'Tenés una cuota vencida',
    null,
    null,
    hace(9),
  );
  b.notificar(
    'CUOTA_VENCIDA',
    'sofia.gomez@mail.com',
    'Tenés una cuota vencida',
    null,
    null,
    hace(14),
  );
  b.notificar(
    'CUOTA_POR_VENCER',
    'cliente.demo@mail.com',
    'Tu cuota vence en 5 días',
    pablo.id,
    null,
    hace(1, 8),
  );
  b.notificar(
    'RECUPERACION_PASSWORD',
    'franco.romero@mail.com',
    'Recuperá tu contraseña',
    null,
    null,
    hace(5),
    true,
  );

  return d;
}
