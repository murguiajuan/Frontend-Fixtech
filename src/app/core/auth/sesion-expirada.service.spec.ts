import { TestBed } from '@angular/core/testing';
import { SesionExpiradaService } from './sesion-expirada.service';

describe('SesionExpiradaService', () => {
  let servicio: SesionExpiradaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(SesionExpiradaService);
  });

  it('marca la sesión como expirada y consume el aviso una sola vez', () => {
    expect(servicio.expirada()).toBe(false);

    servicio.marcarExpirada();

    expect(servicio.expirada()).toBe(true);
    expect(servicio.consumir()).toBe(true);
    expect(servicio.expirada()).toBe(false);
    expect(servicio.consumir()).toBe(false);
  });

  it('permite limpiar el aviso sin consumirlo', () => {
    servicio.marcarExpirada();
    servicio.limpiar();

    expect(servicio.expirada()).toBe(false);
  });
});
