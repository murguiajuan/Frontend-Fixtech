import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { rangoMesActual } from '../../../core/models/fechas';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { AdminReportesService } from '../services/admin-reportes.service';
import { DashboardAdmin, ReporteAdmin } from './reportes.models';
import { AdminReportesPage } from './reportes.page';

const DASHBOARD: DashboardAdmin = {
  totalSolicitudes: 10,
  solicitudesSinOfertas: 2,
  totalServicios: 8,
  serviciosPorEstado: { CONFIRMADO: 5, CANCELADO: 1 },
  ingresoTotalComisiones: 120.5,
  ingresoMesActual: 20.5,
  comisionesPendientes: 3,
  deudaComisionesPendiente: 15,
  pagosPorValidar: 1,
  tecnicosActivos: 4,
  calificacionPromedio: 4.5,
  totalResenas: 9,
  reclamosAbiertos: 1,
  resenasReportadas: 2,
  tecnicosMasActivos: [
    { tecnicoId: 1, nombre: 'Ana Torres', servicios: 3, calificacionPromedio: 4.8 },
  ],
};

const REPORTE: ReporteAdmin = {
  desde: '2026-10-01',
  hasta: '2026-10-27',
  totalSolicitudes: 6,
  solicitudesSinOfertas: 1,
  totalServicios: 4,
  serviciosPorEstado: { CONFIRMADO: 2, EN_PROCESO: 1 },
  volumenServicios: 850,
  ingresoComisiones: 51,
  ingresosPorMes: [{ mes: '2026-10', servicios: 4, volumenTotal: 850, ingresoFixtech: 51 }],
  tecnicosMasActivos: [
    { tecnicoId: 1, nombre: 'Ana Torres', servicios: 2, calificacionPromedio: 4.8 },
  ],
  calificacionPromedio: 4.5,
  totalResenas: 7,
  totalReclamos: 1,
  reclamosPorEstado: { ABIERTO: 1 },
};

describe('AdminReportesPage', () => {
  const servicio = {
    obtenerDashboard: vi.fn(),
    obtenerReporte: vi.fn(),
    exportarExcel: vi.fn(),
  };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    servicio.obtenerDashboard.mockReset();
    servicio.obtenerDashboard.mockReturnValue(of(DASHBOARD));
    servicio.obtenerReporte.mockReset();
    servicio.obtenerReporte.mockReturnValue(of(REPORTE));
    servicio.exportarExcel.mockReset();
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminReportesPage],
      providers: [
        { provide: AdminReportesService, useValue: servicio },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carga el dashboard y el reporte del mes actual', async () => {
    const fixture = await crear();

    expect(servicio.obtenerDashboard).toHaveBeenCalledTimes(1);
    expect(servicio.obtenerReporte).toHaveBeenCalledWith(rangoMesActual());
    const texto = contenido(fixture);
    expect(texto).toContain('Resumen operativo');
    expect(texto).toContain('Solicitudes registradas');
    expect(texto).toContain('Ana Torres');
    expect(texto).toContain('Resultado del periodo');
    expect(texto).toContain('Ingresos por mes');
    expect(texto).toContain('oct 2026');
  });

  it('genera un reporte con el rango indicado', async () => {
    const fixture = await crear();

    escribirFecha(fixture, 0, '2026-09-01');
    escribirFecha(fixture, 1, '2026-09-30');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.obtenerReporte).toHaveBeenLastCalledWith({
      desde: '2026-09-01',
      hasta: '2026-09-30',
    });
  });

  it('rechaza un periodo mayor a 366 días sin consultar la API', async () => {
    const fixture = await crear();
    const llamadas = servicio.obtenerReporte.mock.calls.length;

    escribirFecha(fixture, 0, '2024-01-01');
    escribirFecha(fixture, 1, '2025-01-02');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();

    expect(servicio.obtenerReporte).toHaveBeenCalledTimes(llamadas);
    expect(contenido(fixture)).toContain('El periodo no puede superar los 366 días.');
  });

  it('exporta el Excel con el nombre del servidor y notifica el éxito', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:reporte'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    servicio.exportarExcel.mockReturnValue(
      of(
        new HttpResponse({
          body: new Blob(['excel']),
          headers: new HttpHeaders({
            'Content-Disposition': 'attachment; filename="reporte-fixtech.xlsx"',
          }),
        }),
      ),
    );
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Descargar Excel');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(servicio.exportarExcel).toHaveBeenCalledWith(rangoMesActual());
    expect(notificaciones.exito).toHaveBeenCalledWith('El reporte se descargó correctamente.');
  });

  it('muestra los estados vacíos de ingresos y técnicos del reporte', async () => {
    servicio.obtenerReporte.mockReturnValue(
      of({ ...REPORTE, ingresosPorMes: [], tecnicosMasActivos: [] }),
    );
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No hay ingresos registrados en el periodo.');
    expect(contenido(fixture)).toContain('Sin actividad de técnicos en el periodo.');
  });

  it('muestra el error del dashboard y permite recargarlo', async () => {
    servicio.obtenerDashboard
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudo obtener el dashboard.',
          detalles: [],
        })),
      )
      .mockReturnValue(of(DASHBOARD));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar los indicadores');
    expect(contenido(fixture)).toContain('No se pudo obtener el dashboard.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.obtenerDashboard).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('Solicitudes registradas');
  });

  it('muestra el error del reporte y permite recargarlo', async () => {
    servicio.obtenerReporte
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 400,
          mensaje: 'El periodo del reporte no es válido.',
          detalles: [],
        })),
      )
      .mockReturnValue(of(REPORTE));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos generar el reporte');
    expect(contenido(fixture)).toContain('El periodo del reporte no es válido.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Resultado del periodo');
  });

  it('informa el error de exportación', async () => {
    servicio.exportarExcel.mockReturnValue(
      throwError(() => ({
        estado: 500,
        mensaje: 'No se pudo generar el archivo.',
        detalles: [],
      })),
    );
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Descargar Excel');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(notificaciones.error).toHaveBeenCalledWith('No se pudo generar el archivo.');
  });
});

async function crear(): Promise<ComponentFixture<AdminReportesPage>> {
  const fixture = TestBed.createComponent(AdminReportesPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function escribirFecha(
  fixture: ComponentFixture<AdminReportesPage>,
  indice: number,
  valor: string,
): void {
  const input = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
    'input[type="date"]',
  )[indice];
  if (input === undefined) {
    throw new Error(`No se encontró la fecha en la posición ${indice}`);
  }
  input.value = valor;
  input.dispatchEvent(new Event('input'));
}

function enviar(fixture: ComponentFixture<AdminReportesPage>): void {
  (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
}

function contenido(fixture: ComponentFixture<AdminReportesPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  const boton = Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  boton.click();
}
