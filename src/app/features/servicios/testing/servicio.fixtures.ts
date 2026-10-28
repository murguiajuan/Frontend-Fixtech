import {
  AjustePrecio,
  Avance,
  Constancia,
  Mensaje,
  Reclamo,
  Resena,
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

export function crearConstancia(overrides: Partial<Constancia> = {}): Constancia {
  return {
    id: 31,
    tipo: 'RECEPCION',
    observaciones: 'Equipo con rayones en la tapa.',
    accesorios: 'Cargador original',
    confirmadaPorCliente: false,
    fechaConfirmacion: null,
    creadoEn: '2026-10-27T12:30:00',
    fotoIds: [101],
    ...overrides,
  };
}

export function crearResena(overrides: Partial<Resena> = {}): Resena {
  return {
    id: 41,
    servicioId: 21,
    tecnicoId: 9,
    tecnicoNombre: 'María Quispe',
    clienteNombre: 'Cliente E2E',
    estrellas: 5,
    puntualidad: 5,
    trato: 4,
    calidad: 5,
    precioJusto: 4,
    comentario: 'Excelente atención y explicación del problema.',
    respuestaTecnico: null,
    fechaRespuesta: null,
    estado: 'VISIBLE',
    motivoReporte: null,
    creadoEn: '2026-10-27T16:00:00',
    ...overrides,
  };
}

export function crearReclamo(overrides: Partial<Reclamo> = {}): Reclamo {
  return {
    id: 51,
    servicioId: 21,
    clienteId: 2,
    clienteNombre: 'Cliente E2E',
    descripcion: 'El equipo regresó con la misma falla al día siguiente.',
    estado: 'ABIERTO',
    respuestaTecnico: null,
    resolucion: null,
    resueltoPorId: null,
    creadoEn: '2026-10-27T17:00:00',
    fechaResolucion: null,
    fotoIds: [201],
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
