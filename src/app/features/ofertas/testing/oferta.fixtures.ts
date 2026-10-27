import { Contraoferta, Oferta, SolicitudDisponible } from '../oferta.models';

export function crearContraoferta(overrides: Partial<Contraoferta> = {}): Contraoferta {
  return {
    id: 3,
    emisor: 'CLIENTE',
    ronda: 1,
    montoPropuesto: 140,
    mensaje: 'Puedo pagar 140 por el servicio.',
    estado: 'PENDIENTE',
    creadoEn: '2026-10-27T11:00:00',
    ...overrides,
  };
}

export function crearOferta(overrides: Partial<Oferta> = {}): Oferta {
  return {
    id: 7,
    solicitudId: 15,
    estado: 'ENVIADA',
    modalidad: 'DOMICILIO',
    precioServicio: 150,
    costoMovilidad: 10,
    costoDiagnostico: 20,
    precioTotal: 160,
    tiempoEstimadoHoras: 3,
    garantiaDias: 30,
    mensaje: 'Incluye limpieza interna y prueba de rendimiento.',
    creadoEn: '2026-10-27T10:00:00',
    actualizadoEn: '2026-10-27T10:00:00',
    tecnico: {
      id: 9,
      nombres: 'María',
      apellidos: 'Quispe',
      fotoUrl: null,
      descripcion: 'Especialista en laptops y equipos de cómputo.',
      aniosExperiencia: 5,
      calificacionPromedio: 4.8,
      totalResenas: 24,
      serviciosCompletados: 31,
      destacado: true,
    },
    contraofertas: [],
    servicioId: null,
    ...overrides,
  };
}

export function crearSolicitudDisponible(
  overrides: Partial<SolicitudDisponible> = {},
): SolicitudDisponible {
  return {
    id: 15,
    estado: 'PUBLICADA',
    urgencia: 'MEDIA',
    modalidad: 'DOMICILIO',
    tipoEquipo: 'Laptop',
    tipoServicio: 'Diagnóstico y reparación',
    distritoId: 3,
    distrito: 'Piura',
    marca: 'Lenovo',
    modelo: 'ThinkPad E14',
    descripcion: 'La laptop no enciende y emite un pitido al conectar el cargador.',
    fechaPreferida: '2026-10-30',
    horarioPreferido: 'Mañanas',
    presupuestoReferencial: 180,
    fechaVencimiento: '2026-11-03T10:00:00',
    creadoEn: '2026-10-27T10:00:00',
    imagenes: [{ id: 1, orden: 1, url: '/api/solicitudes/15/imagenes/1' }],
    ...overrides,
  };
}
