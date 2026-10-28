import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { ServiciosService } from '../servicios.service';
import { crearServicioDetalle } from '../testing/servicio.fixtures';
import { FinalizarServicioDialog } from './finalizar-servicio-dialog';
import { PinInicioDialog } from './pin-inicio-dialog';
import { ServicioDetallePage } from './servicio-detalle.page';

describe('ServicioDetallePage', () => {
  const serviciosService = {
    obtener: vi.fn(),
    cambiarEstado: vi.fn(),
    finalizar: vi.fn(),
    confirmar: vi.fn(),
    listarMensajes: vi.fn(),
    urlFotoAvance: vi.fn(),
    urlEvidenciaAjuste: vi.fn(),
    obtenerResena: vi.fn(),
    listarReclamos: vi.fn(),
  };
  const dialogo = { open: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };
  let rol: 'CLIENTE' | 'TECNICO';

  beforeEach(async () => {
    rol = 'CLIENTE';
    serviciosService.obtener.mockReset();
    serviciosService.obtener.mockReturnValue(of(crearServicioDetalle()));
    serviciosService.cambiarEstado.mockReset();
    serviciosService.cambiarEstado.mockReturnValue(of({}));
    serviciosService.finalizar.mockReset();
    serviciosService.finalizar.mockReturnValue(of({}));
    serviciosService.confirmar.mockReset();
    serviciosService.confirmar.mockReturnValue(of({}));
    serviciosService.listarMensajes.mockReset();
    serviciosService.listarMensajes.mockReturnValue(of([]));
    serviciosService.urlFotoAvance.mockReset();
    serviciosService.urlEvidenciaAjuste.mockReset();
    serviciosService.obtenerResena.mockReset();
    serviciosService.obtenerResena.mockReturnValue(of(null));
    serviciosService.listarReclamos.mockReset();
    serviciosService.listarReclamos.mockReturnValue(of([]));
    dialogo.open.mockReset();
    dialogo.open.mockReturnValue({ afterClosed: () => of(undefined) });
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [ServicioDetallePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ServiciosService, useValue: serviciosService },
        { provide: AuthService, useValue: { rol: () => rol } },
        { provide: MatDialog, useValue: dialogo },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra el detalle, los montos y el PIN al cliente', async () => {
    const fixture = await crear();

    const texto = contenido(fixture);
    expect(texto).toContain('Servicio #21');
    expect(texto).toContain('Laptop · Diagnóstico y reparación');
    expect(texto).toContain('Programado');
    expect(texto).toContain('S/ 150.00');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('S/ 20.00');
    expect(texto).toContain('4821');
    const pin = (fixture.nativeElement as HTMLElement).querySelector('.detalle__pin');
    expect(pin?.getAttribute('role')).toBe('group');
    expect(pin?.getAttribute('aria-label')).toBe('PIN de inicio: 4821');
    expect(texto).toContain('María Quispe');
    expect(texto).toContain('912345678');
    expect(texto).toContain('Historial de estados');
    expect(texto).toContain('Servicio creado');
    expect(texto).toContain('Reseña del servicio');
    expect(texto).toContain('La reseña se habilita cuando el servicio esté confirmado.');
  });

  it('inicia el traslado del técnico sin PIN', async () => {
    rol = 'TECNICO';
    serviciosService.obtener.mockReturnValue(
      of(crearServicioDetalle({ pinInicio: null, pinValidado: false })),
    );
    const fixture = await crear();

    pulsarBoton(fixture, 'Iniciar traslado');

    expect(serviciosService.cambiarEstado).toHaveBeenCalledWith(21, {
      estado: 'TECNICO_EN_CAMINO',
      pin: null,
      comentario: null,
      motivo: null,
    });
    expect(notificaciones.exito).toHaveBeenCalledWith('Estado actualizado: Técnico en camino.');
  });

  it('valida el PIN de inicio y registra el comentario', async () => {
    rol = 'TECNICO';
    serviciosService.obtener.mockReturnValue(
      of(
        crearServicioDetalle({
          estado: 'TECNICO_EN_CAMINO',
          pinInicio: null,
          pinValidado: false,
        }),
      ),
    );
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ pin: '4821', comentario: 'Llegué al domicilio.' }),
    });
    const fixture = await crear();

    pulsarBoton(fixture, 'Validar PIN e iniciar');

    expect(dialogo.open).toHaveBeenCalledWith(
      PinInicioDialog,
      expect.objectContaining({
        data: { servicioId: 21, clienteNombre: 'Cliente E2E' },
      }),
    );
    expect(serviciosService.cambiarEstado).toHaveBeenCalledWith(21, {
      estado: 'EN_PROCESO',
      pin: '4821',
      comentario: 'Llegué al domicilio.',
      motivo: null,
    });
  });

  it('finaliza el servicio en proceso con el monto total y el método de pago', async () => {
    rol = 'TECNICO';
    serviciosService.obtener.mockReturnValue(
      of(
        crearServicioDetalle({
          estado: 'EN_PROCESO',
          pinInicio: null,
          pinValidado: true,
        }),
      ),
    );
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ montoFinal: 160, metodoPago: 'YAPE' }),
    });
    const fixture = await crear();

    pulsarBoton(fixture, 'Finalizar servicio');

    expect(dialogo.open).toHaveBeenCalledWith(
      FinalizarServicioDialog,
      expect.objectContaining({ data: { servicioId: 21, montoTotal: 160 } }),
    );
    expect(serviciosService.finalizar).toHaveBeenCalledWith(21, {
      montoFinal: 160,
      metodoPago: 'YAPE',
    });
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Servicio finalizado. El cliente podrá confirmar su conformidad.',
    );
  });

  it('confirma la conformidad del cliente', async () => {
    serviciosService.obtener.mockReturnValue(
      of(crearServicioDetalle({ estado: 'FINALIZADO', pinInicio: null, pinValidado: true })),
    );
    dialogo.open.mockReturnValue({ afterClosed: () => of({ motivo: null }) });
    const fixture = await crear();

    pulsarBoton(fixture, 'Confirmar conformidad');

    expect(serviciosService.confirmar).toHaveBeenCalledWith(21);
    expect(notificaciones.exito).toHaveBeenCalledWith(
      'Conformidad registrada. ¡Gracias por usar FIXTECH!',
    );
  });

  it('cancela el servicio con el motivo indicado', async () => {
    serviciosService.obtener.mockReturnValue(
      of(crearServicioDetalle({ estado: 'EN_PROCESO', pinInicio: null, pinValidado: true })),
    );
    dialogo.open.mockReturnValue({
      afterClosed: () => of({ motivo: 'El equipo dejó de ser necesario.' }),
    });
    const fixture = await crear();

    pulsarBoton(fixture, 'Cancelar servicio');

    expect(serviciosService.cambiarEstado).toHaveBeenCalledWith(21, {
      estado: 'CANCELADO',
      pin: null,
      comentario: null,
      motivo: 'El equipo dejó de ser necesario.',
    });
    expect(notificaciones.exito).toHaveBeenCalledWith('Servicio cancelado.');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    serviciosService.obtener.mockReturnValueOnce(
      throwError(() => ({ estado: 500, mensaje: 'No se pudo consultar', detalles: [] })),
    );
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar el servicio');
    expect(contenido(fixture)).toContain('No se pudo consultar');

    pulsarBoton(fixture, 'Reintentar');
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('Servicio #21');
  });

  it('bloquea el flujo de taller hasta registrar las constancias', async () => {
    rol = 'TECNICO';
    serviciosService.obtener.mockReturnValue(
      of(
        crearServicioDetalle({
          modalidad: 'TALLER',
          estado: 'PROGRAMADO',
          pinInicio: null,
        }),
      ),
    );
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Falta la constancia de recepción del equipo');
    expect(contenido(fixture)).not.toContain('Iniciar traslado');
    expect(contenido(fixture)).not.toContain('Finalizar servicio');
  });

  it('avisa al cliente que el ajuste pendiente debe responderse', async () => {
    serviciosService.obtener.mockReturnValue(
      of(
        crearServicioDetalle({
          estado: 'PENDIENTE_AJUSTE',
          ajustePendiente: {
            id: 8,
            servicioId: 21,
            montoAnterior: 160,
            montoNuevo: 200,
            justificacion: 'Se requiere un repuesto original.',
            tieneEvidencia: false,
            estado: 'PENDIENTE',
            creadoEn: '2026-10-27T13:00:00',
            fechaRespuesta: null,
          },
        }),
      ),
    );
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Hay un ajuste de precio pendiente');
    expect(contenido(fixture)).toContain('Si la rechazas,');
    expect(contenido(fixture)).toContain('S/ 200.00');
  });
});

async function crear(): Promise<ComponentFixture<ServicioDetallePage>> {
  const fixture = TestBed.createComponent(ServicioDetallePage);
  fixture.componentRef.setInput('id', '21');
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<ServicioDetallePage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarBoton(fixture: ComponentFixture<ServicioDetallePage>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
