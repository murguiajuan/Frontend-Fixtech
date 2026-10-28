import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AdminCatalogosService } from './admin-catalogos.service';

describe('AdminCatalogosService', () => {
  let servicio: AdminCatalogosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminCatalogosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lista el catálogo indicando si incluye inactivos', () => {
    servicio.listar('especialidades', false).subscribe();

    const peticion = http.expectOne(
      `${environment.apiUrl}/admin/catalogos/especialidades?incluirInactivos=false`,
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('crea registros en el catálogo seleccionado', () => {
    servicio.crear('tipos-equipo', { nombre: 'Laptop' }).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/catalogos/tipos-equipo`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ nombre: 'Laptop' });
    peticion.flush({ id: 8, nombre: 'Laptop', activo: true });
  });

  it('actualiza un registro por id', () => {
    servicio
      .actualizar('distritos', 4, {
        nombre: 'Castilla',
        provincia: 'Piura',
        topeMovilidad: 12.5,
      })
      .subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/admin/catalogos/distritos/4`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({
      nombre: 'Castilla',
      provincia: 'Piura',
      topeMovilidad: 12.5,
    });
    peticion.flush({
      id: 4,
      nombre: 'Castilla',
      provincia: 'Piura',
      topeMovilidad: 12.5,
      activo: true,
    });
  });

  it('cambia el estado de un registro', () => {
    servicio.cambiarEstado('tipos-servicio', 12, false).subscribe();

    const peticion = http.expectOne(
      `${environment.apiUrl}/admin/catalogos/tipos-servicio/12/estado`,
    );
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ activo: false });
    peticion.flush({ id: 12, nombre: 'Mantenimiento', activo: false });
  });
});
