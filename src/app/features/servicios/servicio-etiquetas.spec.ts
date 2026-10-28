import {
  coincideFiltroServicio,
  esCancelableServicio,
  esReclamoActivo,
  esServicioEnCurso,
  permiteAvances,
  permiteProponerAjuste,
  puedeConfirmarConformidad,
  puedeConfirmarConstancia,
  puedeCrearReclamo,
  puedeCrearResena,
  puedeFinalizarServicio,
  puedeRegistrarConstancia,
  puedeReportarResena,
  puedeResponderReclamo,
  puedeResponderResena,
  requiereConstanciaEntrega,
  requiereConstanciaRecepcion,
  tiposAvanceDisponibles,
  transicionesReclamo,
  transicionesTecnico,
} from './servicio-etiquetas';
import { EstadoServicio } from './servicio.models';
import { crearConstancia, crearReclamo, crearResena } from './testing/servicio.fixtures';

describe('servicio-etiquetas', () => {
  it('define las transiciones del técnico para domicilio', () => {
    expect(transicionesTecnico({ estado: 'PROGRAMADO', modalidad: 'DOMICILIO' })).toEqual([
      { estado: 'TECNICO_EN_CAMINO', etiqueta: 'Iniciar traslado', icono: 'directions_car' },
    ]);
    expect(transicionesTecnico({ estado: 'TECNICO_EN_CAMINO', modalidad: 'DOMICILIO' })).toEqual([
      { estado: 'EN_PROCESO', etiqueta: 'Validar PIN e iniciar', icono: 'pin' },
    ]);
    expect(transicionesTecnico({ estado: 'EN_PROCESO', modalidad: 'DOMICILIO' })).toEqual([
      { estado: 'EN_DIAGNOSTICO', etiqueta: 'Registrar diagnóstico', icono: 'troubleshoot' },
    ]);
    expect(transicionesTecnico({ estado: 'EN_DIAGNOSTICO', modalidad: 'DOMICILIO' })).toEqual([
      { estado: 'EN_PROCESO', etiqueta: 'Reanudar trabajo', icono: 'play_arrow' },
    ]);
    expect(transicionesTecnico({ estado: 'EQUIPO_RECIBIDO', modalidad: 'TALLER' })).toEqual([
      { estado: 'EN_DIAGNOSTICO', etiqueta: 'Iniciar diagnóstico', icono: 'troubleshoot' },
    ]);
    expect(transicionesTecnico({ estado: 'EN_DIAGNOSTICO', modalidad: 'TALLER' })).toEqual([
      { estado: 'EN_REPARACION', etiqueta: 'Iniciar reparación', icono: 'build' },
    ]);
    expect(transicionesTecnico({ estado: 'EN_REPARACION', modalidad: 'TALLER' })).toEqual([
      {
        estado: 'LISTO_PARA_RECOGER',
        etiqueta: 'Marcar listo para recoger',
        icono: 'inventory_2',
      },
    ]);
  });

  it('no propone transiciones en estados cerrados o talleres sin constancia', () => {
    expect(transicionesTecnico({ estado: 'PROGRAMADO', modalidad: 'TALLER' })).toEqual([]);
    expect(transicionesTecnico({ estado: 'FINALIZADO', modalidad: 'DOMICILIO' })).toEqual([]);
    expect(transicionesTecnico({ estado: 'CANCELADO', modalidad: 'DOMICILIO' })).toEqual([]);
  });

  it('exige PIN validado y estado EN_PROCESO para finalizar un domicilio', () => {
    expect(
      puedeFinalizarServicio({
        estado: 'EN_PROCESO',
        modalidad: 'DOMICILIO',
        pinValidado: true,
        constancias: [],
      }),
    ).toBe(true);
    expect(
      puedeFinalizarServicio({
        estado: 'EN_PROCESO',
        modalidad: 'DOMICILIO',
        pinValidado: false,
        constancias: [],
      }),
    ).toBe(false);
    expect(
      puedeFinalizarServicio({
        estado: 'EN_DIAGNOSTICO',
        modalidad: 'DOMICILIO',
        pinValidado: true,
        constancias: [],
      }),
    ).toBe(false);
  });

  it('detecta las constancias pendientes del flujo de taller', () => {
    expect(
      requiereConstanciaRecepcion({ estado: 'PROGRAMADO', modalidad: 'TALLER', constancias: [] }),
    ).toBe(true);
    expect(
      requiereConstanciaRecepcion({
        estado: 'PROGRAMADO',
        modalidad: 'DOMICILIO',
        constancias: [],
      }),
    ).toBe(false);
    expect(
      requiereConstanciaEntrega({
        estado: 'LISTO_PARA_RECOGER',
        modalidad: 'TALLER',
        constancias: [],
      }),
    ).toBe(true);
    expect(
      requiereConstanciaEntrega({ estado: 'EN_REPARACION', modalidad: 'TALLER', constancias: [] }),
    ).toBe(false);
    expect(
      requiereConstanciaRecepcion({
        estado: 'PROGRAMADO',
        modalidad: 'TALLER',
        constancias: [crearConstancia()],
      }),
    ).toBe(false);
    expect(
      requiereConstanciaEntrega({
        estado: 'LISTO_PARA_RECOGER',
        modalidad: 'TALLER',
        constancias: [crearConstancia({ tipo: 'ENTREGA' })],
      }),
    ).toBe(false);
  });

  it('habilita la constancia de recepción y entrega solo en taller', () => {
    expect(
      puedeRegistrarConstancia(
        { estado: 'PROGRAMADO', modalidad: 'TALLER', constancias: [] },
        'RECEPCION',
      ),
    ).toBe(true);
    expect(
      puedeRegistrarConstancia(
        { estado: 'EQUIPO_RECIBIDO', modalidad: 'TALLER', constancias: [] },
        'RECEPCION',
      ),
    ).toBe(true);
    expect(
      puedeRegistrarConstancia(
        {
          estado: 'PROGRAMADO',
          modalidad: 'TALLER',
          constancias: [crearConstancia()],
        },
        'RECEPCION',
      ),
    ).toBe(false);
    expect(
      puedeRegistrarConstancia(
        { estado: 'PROGRAMADO', modalidad: 'DOMICILIO', constancias: [] },
        'RECEPCION',
      ),
    ).toBe(false);
    expect(
      puedeRegistrarConstancia(
        { estado: 'LISTO_PARA_RECOGER', modalidad: 'TALLER', constancias: [] },
        'ENTREGA',
      ),
    ).toBe(true);
    expect(
      puedeRegistrarConstancia(
        { estado: 'EN_REPARACION', modalidad: 'TALLER', constancias: [] },
        'ENTREGA',
      ),
    ).toBe(false);
  });

  it('permite finalizar y confirmar constancias según el rol', () => {
    expect(
      puedeFinalizarServicio({
        estado: 'LISTO_PARA_RECOGER',
        modalidad: 'TALLER',
        pinValidado: false,
        constancias: [crearConstancia({ tipo: 'ENTREGA' })],
      }),
    ).toBe(true);
    expect(
      puedeFinalizarServicio({
        estado: 'LISTO_PARA_RECOGER',
        modalidad: 'TALLER',
        pinValidado: true,
        constancias: [],
      }),
    ).toBe(false);
    expect(puedeConfirmarConstancia(true, crearConstancia())).toBe(true);
    expect(puedeConfirmarConstancia(true, crearConstancia({ confirmadaPorCliente: true }))).toBe(
      false,
    );
    expect(puedeConfirmarConstancia(false, crearConstancia())).toBe(false);
  });

  it('calcula los permisos de la reseña', () => {
    expect(puedeCrearResena('CONFIRMADO')).toBe(true);
    expect(puedeCrearResena('CALIFICADO')).toBe(false);
    expect(puedeCrearResena('FINALIZADO')).toBe(false);

    expect(puedeResponderResena(crearResena(), true)).toBe(true);
    expect(puedeResponderResena(crearResena(), false)).toBe(false);
    expect(puedeResponderResena(crearResena({ respuestaTecnico: 'Gracias.' }), true)).toBe(false);
    expect(puedeResponderResena(crearResena({ estado: 'REPORTADA' }), true)).toBe(false);

    expect(puedeReportarResena(crearResena(), true)).toBe(true);
    expect(puedeReportarResena(crearResena(), false)).toBe(false);
    expect(puedeReportarResena(crearResena({ estado: 'OCULTA' }), true)).toBe(false);
  });

  it('calcula los permisos y transiciones del reclamo', () => {
    expect(esReclamoActivo('ABIERTO')).toBe(true);
    expect(esReclamoActivo('EN_REVISION')).toBe(true);
    expect(esReclamoActivo('RESUELTO')).toBe(false);
    expect(esReclamoActivo('CERRADO')).toBe(false);

    expect(puedeCrearReclamo('CONFIRMADO', [])).toBe(true);
    expect(puedeCrearReclamo('CALIFICADO', [crearReclamo({ estado: 'CERRADO' })])).toBe(true);
    expect(puedeCrearReclamo('CALIFICADO', [crearReclamo()])).toBe(false);
    expect(puedeCrearReclamo('FINALIZADO', [])).toBe(false);

    expect(puedeResponderReclamo(crearReclamo(), true)).toBe(true);
    expect(puedeResponderReclamo(crearReclamo(), false)).toBe(false);
    expect(puedeResponderReclamo(crearReclamo({ respuestaTecnico: 'Revisado.' }), true)).toBe(
      false,
    );
    expect(puedeResponderReclamo(crearReclamo({ estado: 'RESUELTO' }), true)).toBe(false);

    expect(transicionesReclamo('ABIERTO')).toEqual([
      { estado: 'EN_REVISION', etiqueta: 'Iniciar revisión', icono: 'manage_search' },
    ]);
    expect(transicionesReclamo('EN_REVISION')).toEqual([
      { estado: 'RESUELTO', etiqueta: 'Resolver reclamo', icono: 'task_alt' },
      { estado: 'CERRADO', etiqueta: 'Cerrar reclamo', icono: 'lock' },
    ]);
    expect(transicionesReclamo('RESUELTO')).toEqual([
      { estado: 'CERRADO', etiqueta: 'Cerrar reclamo', icono: 'lock' },
    ]);
    expect(transicionesReclamo('CERRADO')).toEqual([]);
  });

  it('habilita avances y ajustes solo en los estados permitidos', () => {
    expect(permiteAvances('EN_DIAGNOSTICO')).toBe(true);
    expect(permiteAvances('PROGRAMADO')).toBe(false);
    expect(tiposAvanceDisponibles('EN_DIAGNOSTICO')).toEqual(['DIAGNOSTICO', 'AVANCE']);
    expect(tiposAvanceDisponibles('EN_PROCESO')).toEqual(['AVANCE']);
    expect(tiposAvanceDisponibles('FINALIZADO')).toEqual([]);

    expect(permiteProponerAjuste('EN_DIAGNOSTICO')).toBe(true);
    expect(permiteProponerAjuste('EN_PROCESO')).toBe(true);
    expect(permiteProponerAjuste('EN_REPARACION')).toBe(true);
    expect(permiteProponerAjuste('PENDIENTE_AJUSTE')).toBe(false);
  });

  it('identifica los estados en curso, cancelables y confirmables', () => {
    expect(esServicioEnCurso('PROGRAMADO')).toBe(true);
    expect(esServicioEnCurso('LISTO_PARA_RECOGER')).toBe(true);
    expect(esServicioEnCurso('FINALIZADO')).toBe(false);
    expect(esCancelableServicio('EN_PROCESO')).toBe(true);
    expect(esCancelableServicio('FINALIZADO')).toBe(false);
    expect(esCancelableServicio('CANCELADO')).toBe(false);
    expect(puedeConfirmarConformidad('FINALIZADO')).toBe(true);
    expect(puedeConfirmarConformidad('CONFIRMADO')).toBe(false);
  });

  it('clasifica los servicios en los filtros del listado', () => {
    const casos: readonly (readonly [EstadoServicio, boolean, boolean, boolean, boolean])[] = [
      ['PROGRAMADO', true, false, false, false],
      ['EN_PROCESO', true, false, false, false],
      ['FINALIZADO', false, true, false, false],
      ['CONFIRMADO', false, false, true, false],
      ['CALIFICADO', false, false, true, false],
      ['CANCELADO', false, false, false, true],
    ];

    for (const [estado, enCurso, porConfirmar, cerrado, cancelado] of casos) {
      expect(coincideFiltroServicio(estado, 'TODOS')).toBe(true);
      expect(coincideFiltroServicio(estado, 'EN_CURSO')).toBe(enCurso);
      expect(coincideFiltroServicio(estado, 'POR_CONFIRMAR')).toBe(porConfirmar);
      expect(coincideFiltroServicio(estado, 'CERRADOS')).toBe(cerrado);
      expect(coincideFiltroServicio(estado, 'CANCELADOS')).toBe(cancelado);
    }
  });
});
