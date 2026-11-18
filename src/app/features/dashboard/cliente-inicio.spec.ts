import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { SolicitudesService } from '../cliente/services/solicitudes.service';
import { SolicitudResumen } from '../cliente/solicitudes/solicitud.models';
import { ServicioListado } from '../servicios/servicio.models';
import { ServiciosService } from '../servicios/servicios.service';
import { ClienteInicio } from './cliente-inicio';

const solicitud: SolicitudResumen = {
  id: 3,
  estado: 'CON_OFERTAS',
  urgencia: 'MEDIA',
  modalidad: 'DOMICILIO',
  tipoEquipo: 'Laptop',
  tipoServicio: 'Reparación',
  distrito: 'Piura',
  marca: null,
  modelo: null,
  descripcion: 'Pantalla',
  presupuestoReferencial: null,
  fechaVencimiento: '2026-11-12',
  creadoEn: '2026-11-04',
  imagenPrincipalUrl: null,
};
const servicio: ServicioListado = {
  id: 8,
  solicitudId: 3,
  modalidad: 'DOMICILIO',
  estado: 'EN_PROCESO',
  montoTotal: 120,
  montoFinal: null,
  contraparteId: 4,
  contraparteNombre: 'Técnico',
  tipoEquipo: 'Laptop',
  tipoServicio: 'Reparación',
  fechaProgramada: null,
  fechaFinalizacion: null,
  creadoEn: '2026-11-04',
};

describe('ClienteInicio', () => {
  const solicitudes = { listarMias: vi.fn() };
  const servicios = { listarMios: vi.fn() };

  beforeEach(async () => {
    solicitudes.listarMias.mockReset().mockReturnValue(of([solicitud]));
    servicios.listarMios.mockReset().mockReturnValue(of([servicio]));
    await TestBed.configureTestingModule({
      imports: [ClienteInicio],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: SolicitudesService, useValue: solicitudes },
        { provide: ServiciosService, useValue: servicios },
        { provide: AuthService, useValue: { perfil: signal({ nombres: 'Ana María' }) } },
      ],
    }).compileComponents();
  });

  it('muestra indicadores y enlaces basados en datos reales', () => {
    const fixture = crear();
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Hola, Ana');
    expect(texto).toContain('Reparación · Laptop');
    expect(texto).toContain('Técnico');
    expect(
      fixture.nativeElement.querySelector('a[href="/app/cliente/solicitudes/3"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('a[href="/app/cliente/servicios/8"]'),
    ).not.toBeNull();
    expect(solicitudes.listarMias).toHaveBeenCalledOnce();
    expect(servicios.listarMios).toHaveBeenCalledOnce();
  });

  it('muestra estados vacíos sin cifras inventadas', () => {
    solicitudes.listarMias.mockReturnValue(of([]));
    servicios.listarMios.mockReturnValue(of([]));
    const texto = crear().nativeElement.textContent as string;
    expect(texto).toContain('Tu próxima solución empieza aquí');
    expect(texto).toContain('Todo en orden por ahora');
  });

  it('no convierte fallos en ceros y permite reintentar', () => {
    solicitudes.listarMias
      .mockReturnValueOnce(throwError(() => new Error('Fallo')))
      .mockReturnValue(of([solicitud]));
    const fixture = crear();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar tus solicitudes');
    expect(fixture.nativeElement.querySelector('.indicador__valor').textContent).toContain('—');
    (fixture.nativeElement.querySelector('.reintentar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reparación · Laptop');
  });

  it('muestra carga hasta recibir respuesta', () => {
    const respuesta = new Subject<readonly SolicitudResumen[]>();
    solicitudes.listarMias.mockReturnValue(respuesta);
    const fixture = crear();
    expect(fixture.nativeElement.textContent).toContain('Cargando solicitudes');
    respuesta.next([solicitud]);
    respuesta.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reparación · Laptop');
  });
});

function crear(): ComponentFixture<ClienteInicio> {
  const fixture = TestBed.createComponent(ClienteInicio);
  fixture.detectChanges();
  return fixture;
}
