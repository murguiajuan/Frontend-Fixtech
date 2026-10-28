import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ServiciosService } from './servicios.service';

describe('ServiciosService', () => {
  let servicio: ServiciosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ServiciosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista los servicios propios sin filtro', () => {
    servicio.listarMios().subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/mios`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('lista los servicios propios filtrando por estado', () => {
    servicio.listarMios('EN_PROCESO').subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/mios?estado=EN_PROCESO`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('obtiene el detalle del servicio', () => {
    servicio.obtener(12).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({});
  });

  it('cambia el estado del servicio', () => {
    servicio
      .cambiarEstado(12, {
        estado: 'EN_PROCESO',
        pin: '1234',
        comentario: 'Inicio en domicilio',
        motivo: null,
      })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/estado`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({
      estado: 'EN_PROCESO',
      pin: '1234',
      comentario: 'Inicio en domicilio',
      motivo: null,
    });
    peticion.flush({});
  });

  it('finaliza el servicio con monto y método de pago', () => {
    servicio.finalizar(12, { montoFinal: 150, metodoPago: 'YAPE' }).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/finalizar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ montoFinal: 150, metodoPago: 'YAPE' });
    peticion.flush({});
  });

  it('registra la conformidad del cliente', () => {
    servicio.confirmar(12).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/conformidad`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toBeNull();
    peticion.flush({});
  });

  it('lista los avances y construye la URL de su foto', () => {
    servicio.listarAvances(12).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/avances`);
    expect(peticion.request.method).toBe('GET');
    expect(servicio.urlFotoAvance(12, 4)).toBe('/api/servicios/12/avances/4/foto');
    peticion.flush([]);
  });

  it('registra un avance con foto mediante multipart', () => {
    const foto = new File(['imagen'], 'avance.png', { type: 'image/png' });
    servicio
      .registrarAvance(12, { tipo: 'AVANCE', descripcion: 'Cambio de pasta térmica' }, foto)
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/avances`);
    expect(peticion.request.method).toBe('POST');
    const datos = peticion.request.body as FormData;
    expect(datos instanceof FormData).toBe(true);
    expect(datos.get('tipo')).toBe('AVANCE');
    expect(datos.get('descripcion')).toBe('Cambio de pasta térmica');
    expect(datos.get('foto')).toBe(foto);
    peticion.flush({});
  });

  it('registra un avance sin foto', () => {
    servicio
      .registrarAvance(12, { tipo: 'DIAGNOSTICO', descripcion: 'Falla en la placa' }, null)
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/avances`);
    const datos = peticion.request.body as FormData;
    expect(datos.get('foto')).toBeNull();
    peticion.flush({});
  });

  it('lista y envía mensajes', () => {
    servicio.listarMensajes(12).subscribe();
    const listado = http.expectOne(`${environment.apiUrl}/servicios/12/mensajes`);
    expect(listado.request.method).toBe('GET');
    listado.flush([]);

    servicio.enviarMensaje(12, 'Hola, estoy en camino.').subscribe();
    const envio = http.expectOne(`${environment.apiUrl}/servicios/12/mensajes`);
    expect(envio.request.method).toBe('POST');
    expect(envio.request.body).toEqual({ contenido: 'Hola, estoy en camino.' });
    envio.flush({});
  });

  it('propone un ajuste de precio con evidencia', () => {
    const evidencia = new File(['imagen'], 'repuesto.png', { type: 'image/png' });
    servicio
      .proponerAjuste(12, { montoNuevo: 180, justificacion: 'Repuesto original' }, evidencia)
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/ajuste-precio`);
    expect(peticion.request.method).toBe('POST');
    const datos = peticion.request.body as FormData;
    expect(datos.get('montoNuevo')).toBe('180');
    expect(datos.get('justificacion')).toBe('Repuesto original');
    expect(datos.get('evidencia')).toBe(evidencia);
    peticion.flush({});
  });

  it('responde un ajuste y construye la URL de su evidencia', () => {
    servicio.responderAjuste(5, { estado: 'APROBADO' }).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/ajustes/5/respuesta`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'APROBADO' });
    expect(servicio.urlEvidenciaAjuste(5)).toBe('/api/ajustes/5/evidencia');
    peticion.flush({});
  });
});
