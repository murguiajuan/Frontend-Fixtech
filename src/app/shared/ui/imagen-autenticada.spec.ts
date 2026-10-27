import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImagenAutenticada } from './imagen-autenticada';

describe('ImagenAutenticada', () => {
  let http: HttpTestingController;
  let crearUrl: ReturnType<typeof vi.fn>;
  let revocarUrl: ReturnType<typeof vi.fn>;
  const crearOriginal = URL.createObjectURL;
  const revocarOriginal = URL.revokeObjectURL;

  beforeEach(async () => {
    crearUrl = vi.fn(() => 'blob:imagen-autenticada');
    revocarUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: crearUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revocarUrl,
    });

    await TestBed.configureTestingModule({
      imports: [ImagenAutenticada],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: crearOriginal,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revocarOriginal,
    });
  });

  it('descarga la imagen con HttpClient y muestra el blob autenticado', () => {
    const fixture = crear('/api/solicitudes/1/imagenes/2', 'Foto del equipo');

    const peticion = http.expectOne('http://localhost:8082/api/solicitudes/1/imagenes/2');
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.responseType).toBe('blob');
    peticion.flush(new Blob(['imagen'], { type: 'image/png' }));
    fixture.detectChanges();

    const imagen = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(imagen).not.toBeNull();
    expect(imagen?.getAttribute('src')).toBe('blob:imagen-autenticada');
    expect(imagen?.getAttribute('alt')).toBe('Foto del equipo');
  });

  it('muestra el estado vacío cuando no hay ruta', () => {
    const fixture = crear(null, 'Foto del equipo');

    const estado = (fixture.nativeElement as HTMLElement).querySelector('[role="img"]');
    expect(estado?.getAttribute('aria-label')).toBe('Foto del equipo: sin imagen');
  });

  it('muestra un estado de error cuando la descarga falla', () => {
    const fixture = crear('/api/solicitudes/1/imagenes/2', 'Foto del equipo');

    http
      .expectOne('http://localhost:8082/api/solicitudes/1/imagenes/2')
      .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const estado = (fixture.nativeElement as HTMLElement).querySelector('[role="img"]');
    expect(estado?.getAttribute('aria-label')).toBe('Foto del equipo: no disponible');
  });

  it('libera la URL del objeto al destruir el componente', () => {
    const fixture = crear('/api/solicitudes/1/imagenes/2', 'Foto del equipo');
    http
      .expectOne('http://localhost:8082/api/solicitudes/1/imagenes/2')
      .flush(new Blob(['imagen'], { type: 'image/png' }));
    fixture.detectChanges();

    fixture.destroy();

    expect(revocarUrl).toHaveBeenCalledWith('blob:imagen-autenticada');
  });
});

function crear(src: string | null, alt: string): ComponentFixture<ImagenAutenticada> {
  const fixture = TestBed.createComponent(ImagenAutenticada);
  fixture.componentRef.setInput('src', src);
  fixture.componentRef.setInput('alt', alt);
  fixture.detectChanges();
  return fixture;
}
