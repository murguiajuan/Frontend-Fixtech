import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { SolicitudesService } from './solicitudes.service';
import {
  SolicitudDetalle,
  SolicitudRequest,
  SolicitudResumen,
} from '../solicitudes/solicitud.models';

const RESUMEN: SolicitudResumen = {
  id: 15,
  estado: 'PUBLICADA',
  urgencia: 'MEDIA',
  modalidad: 'DOMICILIO',
  tipoEquipo: 'Laptop',
  tipoServicio: 'Diagnóstico y reparación',
  distrito: 'Piura',
  marca: 'Lenovo',
  modelo: 'ThinkPad',
  descripcion: 'La laptop no enciende.',
  presupuestoReferencial: 150,
  fechaVencimiento: '2026-11-03T10:00:00',
  creadoEn: '2026-10-27T10:00:00',
  imagenPrincipalUrl: '/api/solicitudes/15/imagenes/1',
};

const DETALLE: SolicitudDetalle = {
  ...RESUMEN,
  tipoEquipoId: 1,
  tipoServicioId: 2,
  distritoId: 3,
  direccion: 'Av. Grau 123',
  referencia: 'Frente al mercado',
  fechaPreferida: '2026-10-30',
  horarioPreferido: 'Mañanas',
  motivoCancelacion: null,
  imagenes: [{ id: 1, orden: 1, url: '/api/solicitudes/15/imagenes/1' }],
};

const DATOS: SolicitudRequest = {
  tipoEquipoId: 1,
  tipoServicioId: 2,
  marca: 'Lenovo',
  modelo: null,
  descripcion: 'La laptop no enciende.',
  urgencia: 'MEDIA',
  modalidad: 'DOMICILIO',
  distritoId: 3,
  direccion: 'Av. Grau 123',
  referencia: null,
  fechaPreferida: '2026-10-30',
  horarioPreferido: null,
  presupuestoReferencial: 150,
};

describe('SolicitudesService', () => {
  let servicio: SolicitudesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(SolicitudesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista todas las solicitudes del cliente sin parámetros de estado', () => {
    let respuesta: readonly SolicitudResumen[] | null = null;

    servicio.listarMias().subscribe((resultado) => {
      respuesta = resultado;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/solicitudes/mias`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush([RESUMEN]);

    expect(respuesta).toEqual([RESUMEN]);
  });

  it('envía el filtro de estado al listado', () => {
    servicio.listarMias('CON_OFERTAS').subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/solicitudes/mias?estado=CON_OFERTAS`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('obtiene el detalle de una solicitud', () => {
    let respuesta: SolicitudDetalle | null = null;

    servicio.obtener(15).subscribe((resultado) => {
      respuesta = resultado;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/solicitudes/15`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(DETALLE);

    expect(respuesta).toEqual(DETALLE);
  });

  it('crea una solicitud multipart con los datos y las fotos', async () => {
    const foto = new File(['imagen'], 'equipo.png', { type: 'image/png' });

    servicio.crear(DATOS, [foto]).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/solicitudes`);
    expect(peticion.request.method).toBe('POST');
    const cuerpo = peticion.request.body;
    expect(cuerpo).toBeInstanceOf(FormData);
    const formulario = cuerpo as FormData;
    const datos = formulario.get('datos');
    expect(datos).toBeInstanceOf(Blob);
    expect((datos as Blob).type).toBe('application/json');
    expect(JSON.parse(await leerTexto(datos as Blob))).toEqual(DATOS);
    const fotos = formulario.getAll('fotos');
    expect(fotos).toHaveLength(1);
    expect((fotos[0] as File).name).toBe('equipo.png');
    peticion.flush(DETALLE);
  });

  it('actualiza solo los datos de una solicitud', () => {
    servicio.actualizar(15, DATOS).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/solicitudes/15`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual(DATOS);
    peticion.flush(DETALLE);
  });

  it('cancela una solicitud con el motivo indicado', () => {
    servicio.cancelar(15, '  Ya se resolvió  ').subscribe();

    const peticion = http.expectOne(
      `${environment.apiUrl}/solicitudes/15?motivo=Ya%20se%20resolvi%C3%B3`,
    );
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush({ ...DETALLE, estado: 'CANCELADA', motivoCancelacion: 'Ya se resolvió' });
  });

  it('omite el parámetro motivo cuando está vacío', () => {
    servicio.cancelar(15, null).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/solicitudes/15`);
    expect(peticion.request.method).toBe('DELETE');
    expect(peticion.request.params.has('motivo')).toBe(false);
    peticion.flush({ ...DETALLE, estado: 'CANCELADA' });
  });
});

function leerTexto(blob: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = lector.result;
      if (typeof resultado === 'string') {
        resolver(resultado);
      } else {
        rechazar(new Error('No se pudo leer el contenido del blob de prueba.'));
      }
    };
    lector.onerror = () => rechazar(new Error('No se pudo leer el contenido del blob de prueba.'));
    lector.readAsText(blob);
  });
}
