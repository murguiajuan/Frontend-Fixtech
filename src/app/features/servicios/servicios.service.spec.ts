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

  it('registra una constancia con fotos y campos opcionales', () => {
    const foto = new File(['imagen'], 'recepcion.png', { type: 'image/png' });
    servicio
      .registrarConstancia(
        12,
        {
          tipo: 'RECEPCION',
          observaciones: '  Equipo con rayones.  ',
          accesorios: '  Cargador original  ',
        },
        [foto],
      )
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/constancias`);
    expect(peticion.request.method).toBe('POST');
    const datos = peticion.request.body as FormData;
    expect(datos.get('tipo')).toBe('RECEPCION');
    expect(datos.get('observaciones')).toBe('Equipo con rayones.');
    expect(datos.get('accesorios')).toBe('Cargador original');
    expect(datos.get('fotos')).toBe(foto);
    peticion.flush({});
  });

  it('omite observaciones y accesorios vacíos al registrar la constancia', () => {
    const foto = new File(['imagen'], 'entrega.png', { type: 'image/png' });
    servicio
      .registrarConstancia(12, { tipo: 'ENTREGA', observaciones: '   ', accesorios: null }, [foto])
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/constancias`);
    const datos = peticion.request.body as FormData;
    expect(datos.has('observaciones')).toBe(false);
    expect(datos.has('accesorios')).toBe(false);
    peticion.flush({});
  });

  it('confirma una constancia y construye la URL de sus fotos', () => {
    servicio.confirmarConstancia(12, 31).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/constancias/31/confirmar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toBeNull();
    expect(servicio.urlFotoConstancia(12, 31, 101)).toBe(
      '/api/servicios/12/constancias/31/fotos/101',
    );
    peticion.flush({});
  });

  it('obtiene la reseña del servicio', () => {
    servicio.obtenerResena(12).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/resenas`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ id: 41 });
  });

  it('devuelve null cuando el servicio todavía no tiene reseña', () => {
    let resultado: unknown = undefined;
    servicio.obtenerResena(12).subscribe((resena) => {
      resultado = resena;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/resenas`);
    peticion.flush(
      { mensaje: 'No existe una reseña para el servicio' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(resultado).toBeNull();
  });

  it('propaga los errores distintos de 404 al obtener la reseña', () => {
    let mensaje: string | undefined;
    servicio.obtenerResena(12).subscribe({
      error: (error: unknown) => {
        mensaje = (error as { mensaje: string }).mensaje;
      },
    });

    const peticion = http.expectOne(`${environment.apiUrl}/servicios/12/resenas`);
    peticion.flush(
      { mensaje: 'No se pudo consultar la reseña' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(mensaje).toBe('No se pudo consultar la reseña');
  });

  it('registra, responde y reporta una reseña', () => {
    const request = {
      estrellas: 5,
      puntualidad: 5,
      trato: 4,
      calidad: 5,
      precioJusto: 4,
      comentario: 'Muy buen servicio.',
    };
    servicio.registrarResena(12, request).subscribe();

    const registro = http.expectOne(`${environment.apiUrl}/servicios/12/resenas`);
    expect(registro.request.method).toBe('POST');
    expect(registro.request.body).toEqual(request);
    registro.flush({});

    servicio.responderResena(12, 41, 'Gracias por tu comentario.').subscribe();

    const respuesta = http.expectOne(`${environment.apiUrl}/servicios/12/resenas/41/respuesta`);
    expect(respuesta.request.method).toBe('PATCH');
    expect(respuesta.request.body).toEqual({ respuesta: 'Gracias por tu comentario.' });
    respuesta.flush({});

    servicio.reportarResena(12, 41, 'Contiene datos personales.').subscribe();

    const reporte = http.expectOne(`${environment.apiUrl}/servicios/12/resenas/41/reporte`);
    expect(reporte.request.method).toBe('POST');
    expect(reporte.request.body).toEqual({ motivo: 'Contiene datos personales.' });
    reporte.flush({});
  });

  it('lista, obtiene, crea y responde reclamos', () => {
    servicio.listarReclamos(12).subscribe();
    const listado = http.expectOne(`${environment.apiUrl}/servicios/12/reclamos`);
    expect(listado.request.method).toBe('GET');
    listado.flush([]);

    servicio.obtenerReclamo(12, 51).subscribe();
    const detalle = http.expectOne(`${environment.apiUrl}/servicios/12/reclamos/51`);
    expect(detalle.request.method).toBe('GET');
    detalle.flush({});

    const foto = new File(['imagen'], 'reclamo.jpg', { type: 'image/jpeg' });
    servicio.crearReclamo(12, 'El equipo volvió a fallar.', [foto]).subscribe();
    const creacion = http.expectOne(`${environment.apiUrl}/servicios/12/reclamos`);
    expect(creacion.request.method).toBe('POST');
    const datos = creacion.request.body as FormData;
    expect(datos.get('descripcion')).toBe('El equipo volvió a fallar.');
    expect(datos.get('fotos')).toBe(foto);
    creacion.flush({});

    servicio.responderReclamo(12, 51, 'Revisamos el equipo sin costo.').subscribe();
    const respuesta = http.expectOne(`${environment.apiUrl}/servicios/12/reclamos/51/respuesta`);
    expect(respuesta.request.method).toBe('PATCH');
    expect(respuesta.request.body).toEqual({ respuesta: 'Revisamos el equipo sin costo.' });
    expect(servicio.urlFotoReclamo(12, 51, 201)).toBe('/api/servicios/12/reclamos/51/fotos/201');
    respuesta.flush({});
  });
});
