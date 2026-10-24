/** Tipos de reporte-service (RF-39 a RF-42). Coinciden con los DTOs del backend. */

export interface PorVendedor {
  vendedorId: number;
  vendedorNombre: string;
  cantidad: number;
  monto: number;
  comisiones: number;
}

export interface PorGrupo {
  grupo: string;
  cantidad: number;
  monto: number;
}

/** RF-42: KPIs del período (por defecto, los últimos 12 meses). */
export interface Dashboard {
  desde: string;
  hasta: string;
  ingresos: number;
  unidadesVendidas: number;
  ticketPromedio: number;
  comisiones: number;
  topModelos: {
    modeloId: number;
    marca: string;
    modelo: string;
    unidades: number;
    ingresos: number;
  }[];
  topVendedores: PorVendedor[];
  /** mes = "2026-10" */
  ventasPorMes: { mes: string; unidades: number; ingresos: number }[];
  stockDisponible: number;
  carteraVencida: number;
  clientesMorosos: number;
}

/** RF-39: las anuladas solo se cuentan aparte. */
export interface ReporteVentas {
  desde: string;
  hasta: string;
  cantidadVentas: number;
  ventasAnuladas: number;
  montoTotal: number;
  ticketPromedio: number;
  comisiones: number;
  conTradeIn: number;
  porVendedor: PorVendedor[];
  porFormaPago: PorGrupo[];
  porCondicion: PorGrupo[];
}

export interface VentaDetalle {
  ventaId: number;
  numeroComprobante: string;
  fechaVenta: string;
  vendedorId: number;
  vendedorNombre: string;
  clienteId: number;
  vehiculo: string;
  condicion: string;
  formaPago: string;
  conTradeIn: boolean;
  precioFinal: number;
  comision: number | null;
  estado: string;
}

/** RF-40: inventario por estado y antigüedad en stock. */
export interface ReporteInventario {
  fecha: string;
  /** Disponibles + reservados. */
  enStock: number;
  valorStock: number;
  diasPromedioEnStock: number;
  porEstado: Record<string, number>;
  porCondicion: Record<string, number>;
  antiguedad: { rango: string; cantidad: number; valor: number }[];
  masAntiguos: {
    vehiculoId: number;
    vin: string;
    marca: string;
    modelo: string;
    anio: number;
    condicion: string;
    estado: string;
    precio: number;
    fechaIngreso: string;
    diasEnStock: number;
  }[];
}

/** RF-41: cartera de créditos y morosos (de mayor a menor deuda). */
export interface ReporteCartera {
  fecha: string;
  cobrado: number;
  pendiente: number;
  vencido: number;
  moraTotal: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  cuotasVencidas: number;
  morosos: {
    clienteId: number;
    clienteNombre: string;
    cuotasVencidas: number;
    deudaVencida: number;
    vencimientoMasAntiguo: string;
    diasMaximoAtraso: number;
  }[];
}

export interface Periodo {
  desde?: string;
  hasta?: string;
}
