import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ComprobantePagoDialog } from '../comprobante-pago-dialog/comprobante-pago-dialog';
import { AdminComisionesService } from '../services/admin-comisiones.service';
import { crearDeuda, crearPago } from '../testing/comision.fixtures';
import { AdminComisionesPage } from './admin-comisiones.page';
import { ValidacionPagoDialog } from './validacion-pago-dialog/validacion-pago-dialog';

registerLocaleData(localeEsPe);

interface AccesoPagina {
  readonly formularioFiltros: FormGroup;
  aplicarFiltros(): void;
  limpiarFiltros(): void;
}

describe('AdminComisionesPage', () => {
  const servicio = {
    listarPagos: vi.fn(),
    validarPago: vi.fn(),
    listarDeudores: vi.fn(),
    urlComprobante: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    servicio.listarPagos.mockReset();
    servicio.listarPagos.mockReturnValue(of([crearPago()]));
    servicio.validarPago.mockReset();
    servicio.listarDeudores.mockReset();
    servicio.listarDeudores.mockReturnValue(of([crearDeuda()]));
    servicio.urlComprobante.mockReset();
    servicio.urlComprobante.mockReturnValue('/api/admin/pagos/51/comprobante');
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of(crearPago({ estado: 'VALIDADO' })) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminComisionesPage],
      providers: [
        { provide: AdminComisionesService, useValue: servicio },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra los pagos y los deudores con sus métricas', async () => {
    const fixture = await crear();

    expect(servicio.listarPagos).toHaveBeenCalledWith({ estado: 'TODOS' });
    expect(servicio.listarDeudores).toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Pago #51');
    expect(contenido(fixture)).toContain('María Quispe');
    expect(contenido(fixture)).toContain('10.80');
    expect(contenido(fixture)).toContain('Yape');

    await abrirTab(fixture, 'Deudores');
    const texto = contenido(fixture);
    expect(texto).toContain('Deuda pendiente total');
    expect(texto).toContain('Técnicos deudores');
    expect(texto).toContain('Sin bloqueo');
    expect(texto).toContain('Próximo vencimiento');
    expect(texto).toContain('30.00');
  });

  it('prioriza pagos pendientes y evita inventar métricas cuando deudores falla', async () => {
    servicio.listarPagos.mockReturnValue(
      of([crearPago({ id: 52, estado: 'VALIDADO' }), crearPago({ id: 51, estado: 'PENDIENTE' })]),
    );
    servicio.listarDeudores.mockReturnValue(
      throwError(() => ({ estado: 503, mensaje: 'Sin datos de deudores.', detalles: [] })),
    );
    const fixture = await crear();
    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('.pago h3')?.textContent).toContain('Pago #51');
    expect(contenido(fixture)).toContain('1 por validar en este listado');
    await abrirTab(fixture, 'Deudores');
    expect(contenido(fixture)).toContain('No pudimos cargar los deudores');
    expect(contenido(fixture)).not.toContain('Deuda pendiente total');
  });

  it('aplica y limpia el filtro de estado de los pagos', async () => {
    const fixture = await crear();
    const formulario = acceder(fixture).formularioFiltros;
    formulario.controls['estado'].setValue('PENDIENTE');
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listarPagos).toHaveBeenLastCalledWith({ estado: 'PENDIENTE' });

    pulsarBoton(fixture.nativeElement, 'Limpiar filtros');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listarPagos).toHaveBeenLastCalledWith({ estado: 'TODOS' });
    expect(acceder(fixture).formularioFiltros.getRawValue().estado).toBe('TODOS');
  });

  it('muestra los estados vacíos de pagos y deudores', async () => {
    servicio.listarPagos.mockReturnValue(of([]));
    servicio.listarDeudores.mockReturnValue(of([]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Aún no hay pagos registrados');

    await abrirTab(fixture, 'Deudores');
    expect(contenido(fixture)).toContain('No hay técnicos con deuda pendiente');
  });

  it('muestra el error de pagos y permite reintentar', async () => {
    servicio.listarPagos
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudieron obtener los pagos.',
          detalles: [],
        })),
      )
      .mockReturnValue(of([crearPago()]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar los pagos');
    expect(contenido(fixture)).toContain('No se pudieron obtener los pagos.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Pago #51');
  });

  it('muestra el error de deudores y permite reintentar', async () => {
    servicio.listarPagos.mockReturnValue(of([]));
    servicio.listarDeudores
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudieron obtener los deudores.',
          detalles: [],
        })),
      )
      .mockReturnValue(of([crearDeuda()]));
    const fixture = await crear();

    await abrirTab(fixture, 'Deudores');
    expect(contenido(fixture)).toContain('No pudimos cargar los deudores');
    expect(contenido(fixture)).toContain('No se pudieron obtener los deudores.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Técnicos deudores');
  });

  it('abre la validación de un pago pendiente y recarga los listados', async () => {
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Validar pago');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialogo.open).toHaveBeenCalledWith(
      ValidacionPagoDialog,
      expect.objectContaining({
        data: expect.objectContaining({ decision: 'VALIDADO' }),
      }),
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Pago validado y comisiones actualizadas.');
    expect(servicio.listarPagos).toHaveBeenCalledTimes(2);
    expect(servicio.listarDeudores).toHaveBeenCalledTimes(2);
  });

  it('abre el rechazo de un pago pendiente con la decisión correcta', async () => {
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Rechazar pago');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalledWith(
      ValidacionPagoDialog,
      expect.objectContaining({
        data: expect.objectContaining({ decision: 'RECHAZADO' }),
      }),
    );
  });

  it('abre el comprobante autenticado del pago', async () => {
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Ver comprobante');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalledWith(
      ComprobantePagoDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          url: '/api/admin/pagos/51/comprobante',
          titulo: 'Comprobante del pago #51',
        }),
      }),
    );
  });

  it('despliega las comisiones incluidas en el pago', async () => {
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Ver comisiones');
    fixture.detectChanges();

    const texto = contenido(fixture);
    expect(texto).toContain('Servicio #21');
    expect(texto).toContain('Neto técnico');
    expect(texto).toContain('169.20');
  });

  it('marca a los deudores bloqueados y explica el bloqueo', async () => {
    servicio.listarPagos.mockReturnValue(of([]));
    servicio.listarDeudores.mockReturnValue(
      of([
        crearDeuda({
          bloqueadoPorDeuda: true,
          comisionesVencidas: 2,
          saldoPendiente: 45,
        }),
      ]),
    );
    const fixture = await crear();

    await abrirTab(fixture, 'Deudores');
    const texto = contenido(fixture);
    expect(texto).toContain('Bloqueado');
    expect(texto).toContain('45.00');
    expect(texto).toContain('El técnico no puede ofertar mientras mantenga el bloqueo.');
  });
});

async function crear(): Promise<ComponentFixture<AdminComisionesPage>> {
  const fixture = TestBed.createComponent(AdminComisionesPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

async function abrirTab(
  fixture: ComponentFixture<AdminComisionesPage>,
  etiqueta: string,
): Promise<void> {
  const tabs = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]'),
  );
  const tab = tabs.find((elemento) => elemento.textContent?.includes(etiqueta));
  if (tab === undefined) {
    throw new Error(`No se encontró la pestaña ${etiqueta}`);
  }
  tab.click();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function acceder(fixture: ComponentFixture<AdminComisionesPage>): AccesoPagina {
  return fixture.componentInstance as unknown as AccesoPagina;
}

function contenido(fixture: ComponentFixture<AdminComisionesPage>): string {
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
