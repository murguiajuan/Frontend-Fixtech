import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { SILENCIAR_ERROR } from '../http/silenciar-error';
import { Notificacion } from './notificaciones.models';
import { NotificacionesService } from './notificaciones.service';

const URL = `${environment.apiUrl}/notificaciones`;

const NOTIFICACION: Notificacion = {
  id: 5,
  tipo: 'PAGO_COMISION_REGISTRADO',
  titulo: 'Pago de comisión por validar',
  mensaje: 'El técnico registró un pago de S/ 12.00.',
  referenciaTipo: 'PAGO_COMISION',
  referenciaId: 13,
  leida: false,
  creadoEn: '2026-10-27T21:57:38',
};

const NOTIFICACION_LEIDA: Notificacion = {
  ...NOTIFICACION,
  id: 4,
  titulo: 'Servicio finalizado',
  leida: true,
};

describe('NotificacionesService', () => {
  let servicio: NotificacionesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(NotificacionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('carga todas las notificaciones y actualiza el contador', () => {
    servicio.cargar().subscribe();

    const peticion = http.expectOne(`${URL}?soloNoLeidas=false`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({ notificaciones: [NOTIFICACION, NOTIFICACION_LEIDA], noLeidas: 1 });

    expect(servicio.notificaciones()).toEqual([NOTIFICACION, NOTIFICACION_LEIDA]);
    expect(servicio.noLeidas()).toBe(1);
    expect(servicio.soloNoLeidas()).toBe(false);
    expect(servicio.ultimaActualizacion()).not.toBeNull();
  });

  it('consulta solo las no leídas y limpia la lista al cambiar de filtro', () => {
    servicio.cargar(false).subscribe();
    http
      .expectOne(`${URL}?soloNoLeidas=false`)
      .flush({ notificaciones: [NOTIFICACION, NOTIFICACION_LEIDA], noLeidas: 1 });

    servicio.cargar(true).subscribe();
    expect(servicio.notificaciones()).toEqual([]);

    const peticion = http.expectOne(`${URL}?soloNoLeidas=true`);
    peticion.flush({ notificaciones: [NOTIFICACION], noLeidas: 1 });

    expect(servicio.notificaciones()).toEqual([NOTIFICACION]);
    expect(servicio.soloNoLeidas()).toBe(true);
  });

  it('marca una notificación como leída y descuenta el contador', () => {
    servicio.cargar(false).subscribe();
    http
      .expectOne(`${URL}?soloNoLeidas=false`)
      .flush({ notificaciones: [NOTIFICACION, NOTIFICACION_LEIDA], noLeidas: 1 });

    servicio.marcarLeida(NOTIFICACION.id).subscribe();
    const peticion = http.expectOne(`${URL}/${NOTIFICACION.id}/leer`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({});
    peticion.flush({ ...NOTIFICACION, leida: true });

    expect(servicio.notificaciones()[0].leida).toBe(true);
    expect(servicio.noLeidas()).toBe(0);
  });

  it('retira de la bandeja la notificación leída cuando solo se muestran no leídas', () => {
    servicio.cargar(true).subscribe();
    http
      .expectOne(`${URL}?soloNoLeidas=true`)
      .flush({ notificaciones: [NOTIFICACION], noLeidas: 1 });

    servicio.marcarLeida(NOTIFICACION.id).subscribe();
    http.expectOne(`${URL}/${NOTIFICACION.id}/leer`).flush({ ...NOTIFICACION, leida: true });

    expect(servicio.notificaciones()).toEqual([]);
    expect(servicio.noLeidas()).toBe(0);
  });

  it('marca todas como leídas y deja el contador en cero', () => {
    servicio.cargar(false).subscribe();
    http
      .expectOne(`${URL}?soloNoLeidas=false`)
      .flush({ notificaciones: [NOTIFICACION, NOTIFICACION_LEIDA], noLeidas: 1 });

    servicio.marcarTodasLeidas().subscribe();
    const peticion = http.expectOne(`${URL}/leer-todas`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({});
    peticion.flush(null);

    expect(servicio.noLeidas()).toBe(0);
    expect(servicio.notificaciones().every((notificacion) => notificacion.leida)).toBe(true);
  });

  it('expone el error de carga y permite volver a intentarlo', () => {
    servicio.cargar().subscribe({ error: () => undefined });
    http
      .expectOne(`${URL}?soloNoLeidas=false`)
      .flush(
        { mensaje: 'No se pudo obtener la bandeja.', detalles: [] },
        { status: 500, statusText: 'Server Error' },
      );

    expect(servicio.error()?.estado).toBe(500);
    expect(servicio.error()?.mensaje).toBe('No se pudo obtener la bandeja.');
    expect(servicio.cargando()).toBe(false);

    servicio.cargar().subscribe();
    const reintento = http.expectOne(`${URL}?soloNoLeidas=false`);
    expect(servicio.error()).toBeNull();
    reintento.flush({ notificaciones: [NOTIFICACION], noLeidas: 1 });

    expect(servicio.notificaciones()).toEqual([NOTIFICACION]);
  });

  it('refresca el contador al iniciar y cada minuto sin mostrar errores globales', () => {
    vi.useFakeTimers();
    const detener = servicio.iniciarPolling();

    const primera = http.expectOne(
      (peticion) => peticion.url === URL && peticion.params.get('soloNoLeidas') === 'true',
    );
    expect(primera.request.context.get(SILENCIAR_ERROR)).toBe(true);
    primera.flush({ notificaciones: [], noLeidas: 3 });
    expect(servicio.noLeidas()).toBe(3);

    vi.advanceTimersByTime(60_000);
    http
      .expectOne(
        (peticion) => peticion.url === URL && peticion.params.get('soloNoLeidas') === 'true',
      )
      .flush({ notificaciones: [], noLeidas: 5 });
    expect(servicio.noLeidas()).toBe(5);

    detener();
    vi.advanceTimersByTime(60_000);
    http.expectNone(URL);
  });

  it('mantiene el último contador si el polling falla', () => {
    vi.useFakeTimers();
    const detener = servicio.iniciarPolling();

    http
      .expectOne(
        (peticion) => peticion.url === URL && peticion.params.get('soloNoLeidas') === 'true',
      )
      .flush(
        { mensaje: 'Servicio no disponible' },
        { status: 503, statusText: 'Service Unavailable' },
      );
    expect(servicio.noLeidas()).toBe(0);

    vi.advanceTimersByTime(60_000);
    http
      .expectOne(
        (peticion) => peticion.url === URL && peticion.params.get('soloNoLeidas') === 'true',
      )
      .flush({ notificaciones: [], noLeidas: 2 });
    expect(servicio.noLeidas()).toBe(2);

    detener();
  });

  it('limpia la bandeja, el contador y el polling', () => {
    vi.useFakeTimers();
    servicio.iniciarPolling();
    http
      .expectOne(
        (peticion) => peticion.url === URL && peticion.params.get('soloNoLeidas') === 'true',
      )
      .flush({ notificaciones: [NOTIFICACION], noLeidas: 1 });

    servicio.limpiar();
    vi.advanceTimersByTime(60_000);

    expect(servicio.notificaciones()).toEqual([]);
    expect(servicio.noLeidas()).toBe(0);
    expect(servicio.ultimaActualizacion()).toBeNull();
    http.expectNone(URL);
  });
});
