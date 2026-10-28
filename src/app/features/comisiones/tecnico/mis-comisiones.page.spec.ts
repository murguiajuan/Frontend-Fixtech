import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ComprobantePagoDialog } from '../comprobante-pago-dialog/comprobante-pago-dialog';
import { ComisionesService } from '../services/comisiones.service';
import { crearComision, crearPago, crearSaldo } from '../testing/comision.fixtures';
import { MisComisionesPage } from './mis-comisiones.page';

registerLocaleData(localeEsPe);

interface AccesoPagina {
  readonly formularioPago: FormGroup;
  readonly formularioFiltro: FormGroup;
  readonly seleccionadas: WritableSignal<readonly number[]>;
  alternarTodas(marcarTodas: boolean): void;
  cambiarFiltro(): void;
  registrarPago(): void;
  seleccionarArchivo(evento: Event): void;
}

describe('MisComisionesPage', () => {
  const servicio = {
    obtenerMiSaldo: vi.fn(),
    listarPagos: vi.fn(),
    registrarPago: vi.fn(),
    urlComprobante: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    servicio.obtenerMiSaldo.mockReset();
    servicio.obtenerMiSaldo.mockReturnValue(of(crearSaldo()));
    servicio.listarPagos.mockReset();
    servicio.listarPagos.mockReturnValue(of([]));
    servicio.registrarPago.mockReset();
    servicio.registrarPago.mockReturnValue(of(crearPago()));
    servicio.urlComprobante.mockReset();
    servicio.urlComprobante.mockReturnValue('/api/comisiones/pagos/51/comprobante');
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({});
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [MisComisionesPage],
      providers: [
        provideRouter([]),
        { provide: ComisionesService, useValue: servicio },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra el saldo, las comisiones y el historial', async () => {
    servicio.listarPagos.mockReturnValue(of([crearPago()]));
    const fixture = await crear();
    const texto = contenido(fixture);

    expect(servicio.obtenerMiSaldo).toHaveBeenCalled();
    expect(servicio.listarPagos).toHaveBeenCalledWith(undefined);
    expect(texto).toContain('Comisiones y pagos');
    expect(texto).toContain('Saldo pendiente');
    expect(texto).toContain('10.80');
    expect(texto).toContain('Límite de deuda');
    expect(texto).toContain('30.00');
    expect(texto).toContain('Servicio #21');
    expect(texto).toContain('Comisión (6');
    expect(texto).toContain('Pago #51');
  });

  it('muestra el aviso de bloqueo y la acción para regularizar', async () => {
    servicio.obtenerMiSaldo.mockReturnValue(
      of(
        crearSaldo({
          bloqueadoPorDeuda: true,
          comisionesVencidas: 2,
          saldoPendiente: 45,
        }),
      ),
    );
    const fixture = await crear();
    const texto = contenido(fixture);

    expect(texto).toContain('Tu cuenta está bloqueada por deuda de comisiones.');
    expect(texto).toContain('2 comisión(es) vencida(s)');
    expect(boton(fixture.nativeElement, 'Regularizar comisiones')).toBeDefined();
  });

  it('impide pagar una comisión incluida en un pago pendiente', async () => {
    const comision = crearComision({ id: 101, servicioId: 21 });
    const pago = crearPago({
      estado: 'PENDIENTE',
      comisiones: [comision],
    });
    servicio.obtenerMiSaldo.mockReturnValue(
      of(crearSaldo({ comisionesPendientes: [comision], pagos: [pago] })),
    );
    servicio.listarPagos.mockReturnValue(of([pago]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('En revisión de pago');
    expect(contenido(fixture)).toContain('Tus comisiones están en revisión');
    const casillas = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
        '.comision input[type="checkbox"]',
      ),
    );
    expect(casillas).toHaveLength(1);
    expect(casillas[0].disabled).toBe(true);
  });

  it('selecciona todas las comisiones disponibles y calcula el total', async () => {
    const comisiones = [
      crearComision({ id: 101, servicioId: 21, montoComision: 10.8 }),
      crearComision({ id: 102, servicioId: 22, montoComision: 6.3 }),
    ];
    servicio.obtenerMiSaldo.mockReturnValue(
      of(crearSaldo({ saldoPendiente: 17.1, comisionesPendientes: comisiones })),
    );
    const fixture = await crear();

    acceder(fixture).alternarTodas(true);
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('2 seleccionada(s)');
    expect(contenido(fixture)).toContain('17.10');
    expect(acceder(fixture).seleccionadas()).toEqual([101, 102]);
  });

  it('registra el pago con el comprobante y recarga el saldo y el historial', async () => {
    const fixture = await crear();
    const componente = acceder(fixture);
    const archivo = new File(['imagen'], 'comprobante.png', { type: 'image/png' });

    componente.seleccionadas.set([101]);
    componente.formularioPago.controls['metodo'].setValue('PLIN');
    componente.formularioPago.controls['numeroOperacion'].setValue('  OP-2026-001  ');
    componente.formularioPago.controls['comprobante'].setValue(archivo);
    componente.registrarPago();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.registrarPago).toHaveBeenCalledWith({
      comisionIds: [101],
      metodo: 'PLIN',
      numeroOperacion: 'OP-2026-001',
      comprobante: archivo,
    });
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Pago registrado. Queda pendiente de validación.',
    );
    expect(servicio.obtenerMiSaldo).toHaveBeenCalledTimes(2);
    expect(servicio.listarPagos).toHaveBeenCalledTimes(2);
    expect(componente.formularioPago.controls['numeroOperacion'].value).toBe('');
    expect(componente.seleccionadas()).toEqual([]);
  });

  it('valida la selección y el comprobante antes de registrar', async () => {
    const fixture = await crear();
    const componente = acceder(fixture);

    componente.registrarPago();
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('Selecciona al menos una comisión pendiente para pagar.');
    expect(servicio.registrarPago).not.toHaveBeenCalled();

    componente.seleccionadas.set([101]);
    componente.formularioPago.controls['numeroOperacion'].setValue('OP-1');
    componente.registrarPago();
    fixture.detectChanges();
    expect(contenido(fixture)).toContain('Adjunta el comprobante del pago en formato JPG o PNG.');
    expect(servicio.registrarPago).not.toHaveBeenCalled();
  });

  it('rechaza comprobantes que no sean JPG o PNG', async () => {
    const fixture = await crear();
    const componente = acceder(fixture);
    const archivo = new File(['texto'], 'comprobante.txt', { type: 'text/plain' });

    componente.seleccionadas.set([101]);
    componente.formularioPago.controls['numeroOperacion'].setValue('OP-1');
    componente.seleccionarArchivo({ target: { files: [archivo] } } as unknown as Event);
    componente.registrarPago();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('El comprobante debe ser una imagen JPG o PNG.');
    expect(servicio.registrarPago).not.toHaveBeenCalled();
  });

  it('muestra el error de carga y permite reintentar', async () => {
    servicio.obtenerMiSaldo
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudo obtener el saldo.',
          detalles: [],
        })),
      )
      .mockReturnValue(of(crearSaldo()));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar tus comisiones');
    expect(contenido(fixture)).toContain('No se pudo obtener el saldo.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Servicio #21');
  });

  it('filtra el historial por estado de pago', async () => {
    servicio.listarPagos
      .mockReturnValueOnce(of([]))
      .mockReturnValue(of([crearPago({ estado: 'PENDIENTE' })]));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Aún no registraste pagos');

    const componente = acceder(fixture);
    componente.formularioFiltro.controls['estado'].setValue('PENDIENTE');
    componente.cambiarFiltro();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listarPagos).toHaveBeenLastCalledWith('PENDIENTE');
    expect(contenido(fixture)).toContain('Pago #51');
    expect(contenido(fixture)).toContain('En revisión');
  });

  it('abre el comprobante autenticado del pago', async () => {
    servicio.listarPagos.mockReturnValue(of([crearPago()]));
    const fixture = await crear();

    pulsarBoton(fixture.nativeElement, 'Ver comprobante');
    fixture.detectChanges();

    expect(dialogo.open).toHaveBeenCalledWith(
      ComprobantePagoDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          url: '/api/comisiones/pagos/51/comprobante',
          titulo: 'Comprobante del pago #51',
        }),
      }),
    );
  });
});

async function crear(): Promise<ComponentFixture<MisComisionesPage>> {
  const fixture = TestBed.createComponent(MisComisionesPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function acceder(fixture: ComponentFixture<MisComisionesPage>): AccesoPagina {
  return fixture.componentInstance as unknown as AccesoPagina;
}

function contenido(fixture: ComponentFixture<MisComisionesPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function boton(contenedor: HTMLElement, texto: string): HTMLButtonElement | undefined {
  return Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  const encontrado = boton(contenedor, texto);
  if (encontrado === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  encontrado.click();
}
