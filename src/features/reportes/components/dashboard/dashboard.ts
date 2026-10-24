import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Columna, GraficoColumnas } from '../../../../shared/ui/grafico-columnas/grafico-columnas';
import { formatearFecha, formatearPrecio } from '../../../../shared/utils/formato';
import { mensajeDeError } from '../../../../shared/utils/mensaje-error';
import { valorDe } from '../../../../shared/utils/recurso';
import {
  ATAJOS_PERIODO,
  AtajoPeriodo,
  completarMeses,
  nombreMes,
  periodoDe,
  precioCompacto,
} from '../../logic';
import { ReportesService } from '../../services/reportes.service';

/** Dashboard del ADMIN (RF-42): indicadores, ventas por mes y rankings. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, GraficoColumnas],
  templateUrl: './dashboard.html',
})
export class DashboardComponent {
  private readonly servicio = inject(ReportesService);

  protected readonly atajos = ATAJOS_PERIODO;
  protected readonly formatearPrecio = formatearPrecio;
  protected readonly formatearFecha = formatearFecha;
  protected readonly precioCompacto = precioCompacto;

  protected readonly atajo = signal<AtajoPeriodo>('12meses');
  private readonly periodo = computed(() => periodoDe(this.atajo()));

  private readonly recurso = rxResource({
    params: () => this.periodo(),
    stream: ({ params }) => this.servicio.dashboard(params),
  });
  protected readonly datos = computed(() => valorDe(this.recurso));
  protected readonly cargando = computed(
    () => this.recurso.isLoading() && !this.recurso.hasValue(),
  );
  protected readonly error = computed(() => {
    const e = this.recurso.error();
    return e ? mensajeDeError(e) : null;
  });

  protected readonly columnas = computed<Columna[]>(() => {
    const d = this.datos();
    if (!d) return [];
    return completarMeses(d.desde, d.hasta, d.ventasPorMes, (mes) => ({
      mes,
      unidades: 0,
      ingresos: 0,
    })).map((m) => ({
      etiqueta: nombreMes(m.mes),
      valor: m.ingresos,
      detalle: `${m.unidades} ${m.unidades === 1 ? 'unidad' : 'unidades'}`,
    }));
  });

  /** Para las barras de los rankings: proporción respecto del primero. */
  protected readonly maxModelo = computed(() =>
    Math.max(1, ...(this.datos()?.topModelos.map((m) => m.unidades) ?? [])),
  );
  protected readonly maxVendedor = computed(() =>
    Math.max(1, ...(this.datos()?.topVendedores.map((v) => v.monto) ?? [])),
  );

  protected reintentar(): void {
    this.recurso.reload();
  }
}
