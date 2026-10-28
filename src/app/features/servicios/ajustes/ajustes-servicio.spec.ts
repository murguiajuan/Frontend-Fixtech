import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ServicioDetalle } from '../servicio.models';
import { ServiciosService } from '../servicios.service';
import { crearAjuste, crearServicioDetalle } from '../testing/servicio.fixtures';
import { AjustePrecioDialog } from './ajuste-precio-dialog';
import { AjustesServicio } from './ajustes-servicio';

describe('AjustesServicio', () => {
  const serviciosService = {
    proponerAjuste: vi.fn(),
    responderAjuste: vi.fn(),
    urlEvidenciaAjuste: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    serviciosService.proponerAjuste.mockReset();
    serviciosService.proponerAjuste.mockReturnValue(of(crearAjuste()));
    serviciosService.responderAjuste.mockReset();
    serviciosService.responderAjuste.mockReturnValue(of(crearAjuste({ estado: 'APROBADO' })));
    serviciosService.urlEvidenciaAjuste.mockReset();
    serviciosService.urlEvidenciaAjuste.mockReturnValue('/api/ajustes/8/evidencia');
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of(undefined) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [AjustesServicio],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ServiciosService, useValue: serviciosService },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra el ajuste pendiente y permite aprobarlo al cliente', async () => {
    const ajuste = crearAjuste();
    const fixture = await crear(
      crearServicioDetalle({
        estado: 'PENDIENTE_AJUSTE',
        ajustes: [ajuste],
        ajustePendiente: ajuste,
      }),
      true,
    );
    const emitido = vi.fn();
    fixture.componentInstance.actualizado.subscribe(emitido);
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });

    const texto = contenido(fixture);
    expect(texto).toContain('Ajuste pendiente de respuesta');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('S/ 200.00');
    expect(texto).toContain('Se requiere un repuesto original.');
    expect(texto).toContain('Aprobar ajuste');
    expect(texto).toContain('Rechazar ajuste');

    pulsarBoton(fixture, 'Aprobar ajuste');

    expect(serviciosService.responderAjuste).toHaveBeenCalledWith(8, { estado: 'APROBADO' });
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Ajuste aprobado. El monto del servicio fue actualizado.',
    );
    expect(emitido).toHaveBeenCalled();
  });

  it('rechaza el ajuste y avisa que el servicio se cancelará', async () => {
    const ajuste = crearAjuste();
    const fixture = await crear(
      crearServicioDetalle({
        estado: 'PENDIENTE_AJUSTE',
        ajustes: [ajuste],
        ajustePendiente: ajuste,
      }),
      true,
    );
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });

    pulsarBoton(fixture, 'Rechazar ajuste');

    expect(dialogo.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: 'Rechazar ajuste de precio',
          peligro: true,
        }),
      }),
    );
    expect(serviciosService.responderAjuste).toHaveBeenCalledWith(8, { estado: 'RECHAZADO' });
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Ajuste rechazado. El servicio fue cancelado.',
    );
  });

  it('permite al técnico proponer un ajuste con evidencia', async () => {
    const fixture = await crear(crearServicioDetalle({ estado: 'EN_DIAGNOSTICO' }), false);
    const emitido = vi.fn();
    fixture.componentInstance.actualizado.subscribe(emitido);
    const evidencia = new File(['imagen'], 'repuesto.png', { type: 'image/png' });
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ montoNuevo: 200, justificacion: 'Repuesto original.', evidencia }),
    });

    pulsarBoton(fixture, 'Proponer ajuste');

    expect(dialogo.open).toHaveBeenCalledWith(
      AjustePrecioDialog,
      expect.objectContaining({ data: { montoActual: 160 } }),
    );
    expect(serviciosService.proponerAjuste).toHaveBeenCalledWith(
      21,
      { montoNuevo: 200, justificacion: 'Repuesto original.' },
      evidencia,
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Ajuste de precio enviado al cliente.');
    expect(emitido).toHaveBeenCalled();
  });

  it('no permite proponer otro ajuste mientras hay uno pendiente', async () => {
    const ajuste = crearAjuste();
    const fixture = await crear(
      crearServicioDetalle({
        estado: 'PENDIENTE_AJUSTE',
        ajustes: [ajuste],
        ajustePendiente: ajuste,
      }),
      false,
    );

    expect(contenido(fixture)).toContain('Esperando la respuesta del cliente');
    expect(
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).some((boton) =>
        boton.textContent?.includes('Proponer ajuste'),
      ),
    ).toBe(false);
  });

  it('muestra el historial de ajustes respondidos y el vacío', async () => {
    const aprobado = crearAjuste({
      id: 7,
      estado: 'APROBADO',
      fechaRespuesta: '2026-10-27T16:00:00',
    });
    const fixture = await crear(
      crearServicioDetalle({ estado: 'EN_PROCESO', ajustes: [aprobado], ajustePendiente: null }),
      false,
    );

    expect(contenido(fixture)).toContain('Historial de ajustes');
    expect(contenido(fixture)).toContain('Aprobado');
    expect(contenido(fixture)).toContain('Respondido el');

    const vacio = await crear(crearServicioDetalle({ estado: 'PROGRAMADO' }), false);
    expect(contenido(vacio)).toContain('No se han registrado ajustes de precio');
  });

  it('muestra el error de la API al responder un ajuste', async () => {
    const ajuste = crearAjuste();
    serviciosService.responderAjuste.mockReturnValue(
      throwError(() => ({ estado: 409, mensaje: 'El ajuste ya fue respondido', detalles: [] })),
    );
    const fixture = await crear(
      crearServicioDetalle({
        estado: 'PENDIENTE_AJUSTE',
        ajustes: [ajuste],
        ajustePendiente: ajuste,
      }),
      true,
    );
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });

    pulsarBoton(fixture, 'Aprobar ajuste');

    expect(notificaciones.error).toHaveBeenCalledWith('El ajuste ya fue respondido');
  });
});

async function crear(
  servicio: ServicioDetalle,
  esCliente: boolean,
): Promise<ComponentFixture<AjustesServicio>> {
  const fixture = TestBed.createComponent(AjustesServicio);
  fixture.componentRef.setInput('servicio', servicio);
  fixture.componentRef.setInput('esCliente', esCliente);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<AjustesServicio>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarBoton(fixture: ComponentFixture<AjustesServicio>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
