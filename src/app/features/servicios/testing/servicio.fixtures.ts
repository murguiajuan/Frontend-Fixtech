import {
  AjustePrecio,
  Avance,
  Mensaje,
  ServicioDetalle,
  ServicioListado,
} from '../servicio.models';

export function crearServicioListado(overrides: Partial<ServicioListado> = {}): ServicioListado {
  return {
    id: 21,
    solicitudId: 15,
    modalidad: 'DOMICILIO',
    estado: 'PROGRAMADO',
    montoTotal: 160,
    montoFinal: null,
    contraparteId: 9,
    contraparteNombre: 'María Quispe',
    tipoEquipo: 'Laptop',
    tipoServicio: 'Diagnóstico y reparación',
    fechaProgramada: '2026-11-02T09:00:00',
    fechaFinalizacion: null,
    creadoEn: '2026-10-27T12:00:00',
    ...overrides,
  };
}

export function crearAvance(overrides: Partial<Avance> = {}): Avance {
  return {
    id: 4,
    tipo: 'AVANCE',
    descripcion: 'Se reemplazó la pasta térmica.',
    tieneFoto: false,
    creadoEn: '2026-10-27T14:00:00',
    ...overrides,
  };
}

export function crearAjuste(overrides: Partial<AjustePrecio> = {}): AjustePrecio {
  return {
    id: 8,
    servicioId: 21,
    montoAnterior: 160,
    montoNuevo: 200,
    justificacion: 'Se requiere un repuesto original.',
    tieneEvidencia: false,
    estado: 'PENDIENTE',
    creadoEn: '2026-10-27T13:00:00',
    fechaRespuesta: null,
    ...overrides,
  };
}

export function crearMensaje(overrides: Partial<Mensaje> = {}): Mensaje {
  return {
    id: 6,
    emisorId: 9,
    emisorNombre: 'María Quispe',
    contenido: 'Estoy en camino al domicilio.',
    leido: false,
    mio: false,
    creadoEn: '2026-10-27T15:00:00',
    ...overrides,
  };
}

export function crearServicioDetalle(overrides: Partial<ServicioDetalle> = {}): ServicioDetalle {
  return {
    id: 21,
    solicitudId: 15,
    ofertaId: 7,
    modalidad: 'DOMICILIO',
    estado: 'PROGRAMADO',
    precioServicio: 150,
    costoMovilidad: 10,
    costoDiagnostico: 20,
    montoTotal: 160,
    montoFinal: null,
    metodoPago: null,
    pinInicio: '4821',
    pinValidado: false,
    garantiaDias: 30,
    fechaProgramada: '2026-11-02T09:00:00',
    fechaInicio: null,
    fechaFinalizacion: null,
    fechaLimiteConformidad: null,
    fechaConfirmacion: null,
    confirmadoAutomaticamente: false,
    canceladoPor: null,
    motivoCancelacion: null,
    creadoEn: '2026-10-27T12:00:00',
    actualizadoEn: '2026-10-27T12:00:00',
    cliente: {
      id: 2,
      nombres: 'Cliente',
      apellidos: 'E2E',
      celular: '987654321',
      correo: 'cliente@fixtech.pe',
    },
    tecnico: {
      id: 9,
      nombres: 'María',
      apellidos: 'Quispe',
      celular: '912345678',
      correo: 'tecnico@fixtech.pe',
      fotoUrl: null,
      calificacionPromedio: 4.8,
      totalResenas: 24,
      direccionTaller: null,
      referenciaTaller: null,
      horarioTaller: null,
    },
    solicitud: {
      id: 15,
      descripcion: 'La laptop no enciende y emite un pitido.',
      tipoEquipo: 'Laptop',
      tipoServicio: 'Diagnóstico y reparación',
      marca: 'Lenovo',
      modelo: 'ThinkPad',
      urgencia: 'MEDIA',
      distrito: 'Piura',
      direccion: 'Av. Grau 123',
      referencia: 'Frente al parque',
      fechaPreferida: '2026-11-02',
      horarioPreferido: 'Mañana',
    },
    historial: [
      {
        id: 1,
        estadoAnterior: null,
        estadoNuevo: 'PROGRAMADO',
        cambiadoPorId: 2,
        cambiadoPorNombre: 'Cliente E2E',
        comentario: 'Servicio creado al aceptar la oferta',
        creadoEn: '2026-10-27T12:00:00',
      },
    ],
    constancias: [],
    avances: [],
    ajustes: [],
    ajustePendiente: null,
    ...overrides,
  };
}
