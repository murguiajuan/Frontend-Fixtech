import {
  contraofertaPendiente,
  esperaRespuestaDeLaOtraParte,
  estaActiva,
  puedeIniciarContraoferta,
  puedeResponderContraoferta,
  puedeVolverAEnviar,
} from './oferta-etiquetas';
import { crearContraoferta, crearOferta } from './testing/oferta.fixtures';

describe('Reglas de ofertas', () => {
  it('considera activas solo las ofertas enviadas o contraofertadas', () => {
    expect(estaActiva('ENVIADA')).toBe(true);
    expect(estaActiva('CONTRAOFERTADA')).toBe(true);
    expect(estaActiva('ACEPTADA')).toBe(false);
    expect(estaActiva('RECHAZADA')).toBe(false);
    expect(estaActiva('RETIRADA')).toBe(false);
    expect(estaActiva('EXPIRADA')).toBe(false);
  });

  it('permite volver a enviar tras rechazo, retiro o expiración', () => {
    expect(puedeVolverAEnviar('RECHAZADA')).toBe(true);
    expect(puedeVolverAEnviar('RETIRADA')).toBe(true);
    expect(puedeVolverAEnviar('EXPIRADA')).toBe(true);
    expect(puedeVolverAEnviar('ENVIADA')).toBe(false);
    expect(puedeVolverAEnviar('ACEPTADA')).toBe(false);
  });

  it('devuelve la contraoferta pendiente más reciente', () => {
    const oferta = crearOferta({
      contraofertas: [
        crearContraoferta({ id: 1, ronda: 1, estado: 'SUPERADA' }),
        crearContraoferta({ id: 2, ronda: 2, mensaje: 'Segunda ronda' }),
      ],
    });

    expect(contraofertaPendiente(oferta)?.id).toBe(2);
  });

  it('solo permite al cliente iniciar la negociación sin contraoferta pendiente', () => {
    const oferta = crearOferta();

    expect(puedeIniciarContraoferta(oferta, 'CLIENTE')).toBe(true);
    expect(puedeIniciarContraoferta(oferta, 'TECNICO')).toBe(false);
  });

  it('impide iniciar si ya existe una contraoferta pendiente', () => {
    const oferta = crearOferta({ contraofertas: [crearContraoferta()] });

    expect(puedeIniciarContraoferta(oferta, 'CLIENTE')).toBe(false);
  });

  it('permite responder solo a la parte contraria de la contraoferta pendiente', () => {
    const oferta = crearOferta({ contraofertas: [crearContraoferta({ emisor: 'CLIENTE' })] });

    expect(puedeResponderContraoferta(oferta, 'TECNICO')).toBe(true);
    expect(puedeResponderContraoferta(oferta, 'CLIENTE')).toBe(false);
    expect(esperaRespuestaDeLaOtraParte(oferta, 'CLIENTE')).toBe(true);
    expect(esperaRespuestaDeLaOtraParte(oferta, 'TECNICO')).toBe(false);
  });

  it('no permite negociar ofertas cerradas', () => {
    const oferta = crearOferta({
      estado: 'ACEPTADA',
      contraofertas: [crearContraoferta()],
    });

    expect(puedeResponderContraoferta(oferta, 'TECNICO')).toBe(false);
    expect(puedeIniciarContraoferta(oferta, 'CLIENTE')).toBe(false);
    expect(esperaRespuestaDeLaOtraParte(oferta, 'CLIENTE')).toBe(false);
  });
});
