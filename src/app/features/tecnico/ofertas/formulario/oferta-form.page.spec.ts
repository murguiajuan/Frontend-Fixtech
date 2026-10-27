import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { PerfilUsuario } from '../../../../core/auth/auth.models';
import { CatalogoService } from '../../../../core/catalogos/catalogo.service';
import { DistritoCatalogo } from '../../../../core/catalogos/catalogo.models';
import { NotificacionService } from '../../../../shared/ui/notificacion.service';
import { OfertaRequest, SolicitudDisponible } from '../../../ofertas/oferta.models';
import { OfertasService } from '../../../ofertas/ofertas.service';
import { crearOferta, crearSolicitudDisponible } from '../../../ofertas/testing/oferta.fixtures';
import { SolicitudesDisponiblesService } from '../../services/solicitudes-disponibles.service';
import { OfertaFormPage } from './oferta-form.page';

const DISTRITO: DistritoCatalogo = {
  id: 3,
  nombre: 'Piura',
  provincia: 'Piura',
  topeMovilidad: 25,
  activo: true,
};

const PERFIL: PerfilUsuario = {
  id: 1,
  correo: 'tecnico@fixtech.pe',
  rol: 'TECNICO',
  estado: 'ACTIVO',
  nombres: 'María',
  apellidos: 'Quispe',
  fotoUrl: null,
  tecnico: {
    id: 9,
    dni: '12345678',
    celular: '999999999',
    estadoVerificacion: 'APROBADO',
    motivoVerificacion: null,
    bloqueadoPorDeuda: false,
    saldoComisionPendiente: 0,
    modalidades: ['DOMICILIO', 'TALLER'],
    ofreceDomicilio: true,
    ofreceTaller: true,
    especialidades: [],
    distritos: [],
    descripcion: 'Especialista en laptops.',
    aniosExperiencia: 5,
    direccionTaller: null,
    referenciaTaller: null,
    horarioTaller: null,
    garantiaDiasDefecto: 30,
    calificacionPromedio: 4.8,
    totalResenas: 24,
    serviciosCompletados: 31,
    destacado: true,
  },
};

describe('OfertaFormPage', () => {
  const solicitudesService = { listar: vi.fn(), obtener: vi.fn() };
  const ofertasService = { listarMias: vi.fn(), crear: vi.fn(), actualizar: vi.fn() };
  const catalogos = { listarDistritos: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };
  const auth = { perfil: signal<PerfilUsuario | null>(PERFIL) };
  let navegar: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    solicitudesService.obtener.mockReset();
    solicitudesService.obtener.mockReturnValue(of(crearSolicitudDisponible()));
    ofertasService.listarMias.mockReset();
    ofertasService.listarMias.mockReturnValue(of([]));
    ofertasService.crear.mockReset();
    ofertasService.actualizar.mockReset();
    catalogos.listarDistritos.mockReset();
    catalogos.listarDistritos.mockReturnValue(of([DISTRITO]));
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();
    auth.perfil.set(PERFIL);

    await TestBed.configureTestingModule({
      imports: [OfertaFormPage],
      providers: [
        provideRouter([]),
        { provide: SolicitudesDisponiblesService, useValue: solicitudesService },
        { provide: OfertasService, useValue: ofertasService },
        { provide: CatalogoService, useValue: catalogos },
        { provide: AuthService, useValue: auth },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();

    navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('prepara una oferta nueva con la garantía por defecto del técnico', () => {
    const fixture = crear({ solicitudId: '15' });
    const texto = contenido(fixture);

    expect(texto).toContain('Enviar oferta');
    expect(texto).toContain('Laptop · Diagnóstico y reparación');
    expect(texto).toContain('Tope para Piura: S/ 25.00');
    expect(texto).toContain('(30 días)');
    expect(campo(fixture, 'input[formControlName="garantiaDias"]').value).toBe('30');
  });

  it('calcula el total con servicio y movilidad, sin el diagnóstico', () => {
    const fixture = crear({ solicitudId: '15' });

    escribir(fixture, 'input[formControlName="precioServicio"]', '150');
    escribir(fixture, 'input[formControlName="costoMovilidad"]', '10');
    escribir(fixture, 'input[formControlName="costoDiagnostico"]', '20');

    expect(contenido(fixture)).toContain('S/ 160.00');
    expect(contenido(fixture)).toContain('El costo de diagnóstico se muestra por separado');
  });

  it('envía la oferta con los datos del formulario', () => {
    ofertasService.crear.mockReturnValue(of(crearOferta({ solicitudId: 15 })));
    const fixture = crear({ solicitudId: '15' });

    escribir(fixture, 'input[formControlName="precioServicio"]', '150');
    escribir(fixture, 'input[formControlName="tiempoEstimadoHoras"]', '3');
    escribir(fixture, 'input[formControlName="costoMovilidad"]', '10');
    escribir(fixture, 'input[formControlName="costoDiagnostico"]', '20');
    escribir(fixture, 'textarea[formControlName="mensaje"]', '  Incluye limpieza.  ');
    enviar(fixture);

    const esperado: OfertaRequest = {
      modalidad: 'DOMICILIO',
      precioServicio: 150,
      costoMovilidad: 10,
      costoDiagnostico: 20,
      tiempoEstimadoHoras: 3,
      garantiaDias: 30,
      mensaje: 'Incluye limpieza.',
    };
    expect(ofertasService.crear).toHaveBeenCalledWith(15, esperado);
    expect(notificaciones.exito).toHaveBeenCalledWith('Oferta enviada.');
    expect(navegar).toHaveBeenCalledWith(['/app/tecnico/solicitudes', 15]);
  });

  it('no envía la oferta si faltan el precio o el tiempo', () => {
    const fixture = crear({ solicitudId: '15' });

    enviar(fixture);

    expect(ofertasService.crear).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('Ingresa el precio del servicio.');
    expect(contenido(fixture)).toContain('Ingresa el tiempo estimado.');
  });

  it('valida que la movilidad no supere el tope del distrito', () => {
    const fixture = crear({ solicitudId: '15' });

    escribir(fixture, 'input[formControlName="precioServicio"]', '150');
    escribir(fixture, 'input[formControlName="tiempoEstimadoHoras"]', '3');
    escribir(fixture, 'input[formControlName="costoMovilidad"]', '30');
    enviar(fixture);

    expect(ofertasService.crear).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('La movilidad no puede superar el tope de S/ 25.00');
  });

  it('deshabilita la movilidad cuando la modalidad es en taller', () => {
    const solicitud: SolicitudDisponible = crearSolicitudDisponible({ modalidad: 'TALLER' });
    solicitudesService.obtener.mockReturnValue(of(solicitud));
    const fixture = crear({ solicitudId: '15' });

    const movilidad = campo(fixture, 'input[formControlName="costoMovilidad"]');
    expect(movilidad.disabled).toBe(true);
    expect(contenido(fixture)).toContain('No aplica para la modalidad en taller.');
  });

  it('bloquea una nueva oferta si ya existe una activa para la solicitud', () => {
    ofertasService.listarMias.mockReturnValue(of([crearOferta({ solicitudId: 15 })]));

    const fixture = crear({ solicitudId: '15' });

    expect(contenido(fixture)).toContain('Ya tienes una oferta para esta solicitud');
    expect(contenido(fixture)).toContain('Editar oferta');
  });

  it('carga y actualiza una oferta existente en modo edición', () => {
    const oferta = crearOferta({
      id: 7,
      solicitudId: 15,
      precioServicio: 150,
      tiempoEstimadoHoras: 3,
      garantiaDias: 30,
      mensaje: 'Mensaje original',
    });
    ofertasService.listarMias.mockReturnValue(of([oferta]));
    ofertasService.actualizar.mockReturnValue(of({ ...oferta, precioServicio: 170 }));

    const fixture = crear({ ofertaId: '7' });
    expect(contenido(fixture)).toContain('Editar oferta');
    expect(campo(fixture, 'input[formControlName="precioServicio"]').value).toBe('150');
    expect(campo(fixture, 'textarea[formControlName="mensaje"]').value).toBe('Mensaje original');

    escribir(fixture, 'input[formControlName="precioServicio"]', '170');
    enviar(fixture);

    expect(ofertasService.actualizar).toHaveBeenCalledWith(7, {
      modalidad: 'DOMICILIO',
      precioServicio: 170,
      costoMovilidad: 10,
      costoDiagnostico: 20,
      tiempoEstimadoHoras: 3,
      garantiaDias: 30,
      mensaje: 'Mensaje original',
    });
    expect(notificaciones.exito).toHaveBeenCalledWith('Oferta actualizada.');
    expect(navegar).toHaveBeenCalledWith(['/app/tecnico/ofertas']);
  });

  it('bloquea la edición de una oferta que ya no está activa', () => {
    ofertasService.listarMias.mockReturnValue(
      of([crearOferta({ id: 7, solicitudId: 15, estado: 'RETIRADA' })]),
    );

    const fixture = crear({ ofertaId: '7' });

    expect(contenido(fixture)).toContain('Esta oferta ya no se puede editar');
    expect(contenido(fixture)).toContain('Solo las ofertas activas admiten cambios');
  });

  it('muestra el error de carga y permite reintentar', () => {
    solicitudesService.obtener.mockReturnValueOnce(
      throwError(() => ({ estado: 403, mensaje: 'Solicitud no disponible', detalles: [] })),
    );
    solicitudesService.obtener.mockReturnValue(of(crearSolicitudDisponible()));

    const fixture = crear({ solicitudId: '15' });
    expect(contenido(fixture)).toContain('No pudimos preparar la oferta');
    expect(contenido(fixture)).toContain('Solicitud no disponible');

    pulsarBoton(fixture, 'Reintentar');

    expect(contenido(fixture)).toContain('Tu propuesta');
  });

  it('rechaza un identificador inválido sin consultar la API', () => {
    const fixture = crear({ solicitudId: 'abc' });

    expect(contenido(fixture)).toContain('La solicitud indicada no es válida');
    expect(solicitudesService.obtener).not.toHaveBeenCalled();
  });

  function crear(ids: {
    solicitudId?: string;
    ofertaId?: string;
  }): ComponentFixture<OfertaFormPage> {
    const fixture = TestBed.createComponent(OfertaFormPage);
    fixture.componentRef.setInput('solicitudId', ids.solicitudId);
    fixture.componentRef.setInput('ofertaId', ids.ofertaId);
    fixture.detectChanges();
    return fixture;
  }
});

function contenido(fixture: ComponentFixture<OfertaFormPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function campo(
  fixture: ComponentFixture<OfertaFormPage>,
  selector: string,
): HTMLInputElement | HTMLTextAreaElement {
  const elemento = (fixture.nativeElement as HTMLElement).querySelector<
    HTMLInputElement | HTMLTextAreaElement
  >(selector);
  if (elemento === null) {
    throw new Error(`No se encontró el campo ${selector}`);
  }
  return elemento;
}

function escribir(
  fixture: ComponentFixture<OfertaFormPage>,
  selector: string,
  valor: string,
): void {
  const elemento = campo(fixture, selector);
  elemento.value = valor;
  elemento.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function enviar(fixture: ComponentFixture<OfertaFormPage>): void {
  const formulario = (fixture.nativeElement as HTMLElement).querySelector('form');
  if (formulario === null) {
    throw new Error('No se encontró el formulario');
  }
  formulario.dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

function pulsarBoton(fixture: ComponentFixture<OfertaFormPage>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
