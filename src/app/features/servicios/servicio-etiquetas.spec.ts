import {
  coincideFiltroServicio,
  esCancelableServicio,
  esServicioEnCurso,
  permiteAvances,
  permiteProponerAjuste,
  puedeConfirmarConformidad,
  puedeFinalizarServicio,
  requiereConstanciaEntrega,
  requiereConstanciaRecepcion,
  tiposAvanceDisponibles,
  transicionesTecnico,
} from './servicio-etiquetas';
import { EstadoServicio } from './servicio.models';

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
      }),
    ).toBe(true);
    expect(
      puedeFinalizarServicio({
        estado: 'EN_PROCESO',
        modalidad: 'DOMICILIO',
        pinValidado: false,
      }),
    ).toBe(false);
    expect(
      puedeFinalizarServicio({
        estado: 'EN_DIAGNOSTICO',
        modalidad: 'DOMICILIO',
        pinValidado: true,
      }),
    ).toBe(false);
  });

  it('detecta las constancias pendientes del flujo de taller', () => {
    expect(requiereConstanciaRecepcion({ estado: 'PROGRAMADO', modalidad: 'TALLER' })).toBe(true);
    expect(requiereConstanciaRecepcion({ estado: 'PROGRAMADO', modalidad: 'DOMICILIO' })).toBe(
      false,
    );
    expect(requiereConstanciaEntrega({ estado: 'LISTO_PARA_RECOGER', modalidad: 'TALLER' })).toBe(
      true,
    );
    expect(requiereConstanciaEntrega({ estado: 'EN_REPARACION', modalidad: 'TALLER' })).toBe(false);
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
