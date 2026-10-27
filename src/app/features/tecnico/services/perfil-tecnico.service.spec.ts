import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PerfilTecnicoRequest, PerfilUsuario } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { PerfilTecnicoService } from './perfil-tecnico.service';

const PERFIL: PerfilUsuario = {
  id: 30,
  correo: 'carlos.mena@fixtech.pe',
  rol: 'TECNICO',
  estado: 'ACTIVO',
  nombres: 'Carlos',
  apellidos: 'Mena',
  fotoUrl: null,
  tecnico: null,
};

const REQUEST: PerfilTecnicoRequest = {
  nombres: 'Carlos',
  apellidos: 'Mena',
  dni: '12345678',
  celular: '987654321',
  descripcion: 'Reparo laptops.',
  aniosExperiencia: 8,
  ofreceDomicilio: true,
  ofreceTaller: false,
  direccionTaller: null,
  referenciaTaller: null,
  horarioTaller: null,
  garantiaDiasDefecto: 15,
  especialidadIds: [1],
  distritoIds: [2],
};

describe('PerfilTecnicoService', () => {
  const auth = { actualizarPerfil: vi.fn() };
  let servicio: PerfilTecnicoService;
  let http: HttpTestingController;

  beforeEach(() => {
    auth.actualizarPerfil.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    servicio = TestBed.inject(PerfilTecnicoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('actualiza el perfil técnico y sincroniza la sesión', () => {
    let respuesta: PerfilUsuario | null = null;

    servicio.actualizarPerfil(REQUEST).subscribe((perfil) => {
      respuesta = perfil;
    });

    const peticion = http.expectOne(`${environment.apiUrl}/perfil/tecnico`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual(REQUEST);
    peticion.flush(PERFIL);

    expect(respuesta).toEqual(PERFIL);
    expect(auth.actualizarPerfil).toHaveBeenCalledWith(PERFIL);
  });

  it('sube la foto en multipart y sincroniza la sesión', () => {
    const foto = new File(['imagen'], 'perfil.png', { type: 'image/png' });

    servicio.actualizarFoto(foto).subscribe();

    const peticion = http.expectOne(`${environment.apiUrl}/perfil/foto`);
    expect(peticion.request.method).toBe('POST');
    const cuerpo = peticion.request.body;
    expect(cuerpo).toBeInstanceOf(FormData);
    const partes = cuerpo as FormData;
    expect(partes.getAll('foto')).toHaveLength(1);
    expect((partes.get('foto') as File).name).toBe('perfil.png');
    peticion.flush(PERFIL);

    expect(auth.actualizarPerfil).toHaveBeenCalledWith(PERFIL);
  });
});
