import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { CatalogoService } from './catalogo.service';

describe('CatalogoService', () => {
  let servicio: CatalogoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(CatalogoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('obtiene las especialidades activas del catálogo público', () => {
    const especialidades = [
      {
        id: 1,
        nombre: 'Mantenimiento de laptops',
        descripcion: 'Limpieza y cambio de componentes.',
        activo: true,
      },
    ];
    let respuesta: unknown;

    servicio.listarEspecialidades().subscribe((resultado) => {
      respuesta = resultado;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/catalogos/especialidades`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(especialidades);

    expect(respuesta).toEqual(especialidades);
  });

  it('obtiene los distritos con su tope de movilidad', () => {
    const distritos = [
      {
        id: 1,
        nombre: 'Piura',
        provincia: 'Piura',
        topeMovilidad: 15,
        activo: true,
      },
    ];
    let respuesta: unknown;

    servicio.listarDistritos().subscribe((resultado) => {
      respuesta = resultado;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/catalogos/distritos`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush(distritos);

    expect(respuesta).toEqual(distritos);
  });
});
