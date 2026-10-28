import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminAuditoriaService } from '../services/admin-auditoria.service';
import { Auditoria, PaginaAuditoria } from './auditoria.models';
import { AdminAuditoriaPage } from './auditoria.page';

const REGISTRO: Auditoria = {
  id: 90,
  usuarioId: 7,
  accion: 'ACTUALIZAR_PARAMETRO',
  entidad: 'parametro',
  entidadId: 12,
  detalle: 'comision_porcentaje: 0.0600 -> 0.0700',
  ip: '127.0.0.1',
  creadoEn: '2026-10-27T10:15:00',
};

const PAGINA: PaginaAuditoria = {
  contenido: [REGISTRO],
  pagina: 0,
  tamano: 20,
  totalElementos: 1,
  totalPaginas: 1,
};

describe('AdminAuditoriaPage', () => {
  const servicio = { listar: vi.fn() };

  beforeEach(async () => {
    servicio.listar.mockReset();
    servicio.listar.mockReturnValue(of(PAGINA));

    await TestBed.configureTestingModule({
      imports: [AdminAuditoriaPage],
      providers: [{ provide: AdminAuditoriaService, useValue: servicio }],
    }).compileComponents();
  });

  it('carga la primera página de auditoría al entrar', async () => {
    const fixture = await crear();

    expect(servicio.listar).toHaveBeenCalledWith({
      usuarioId: null,
      entidad: '',
      accion: '',
      desde: '',
      hasta: '',
      pagina: 0,
      tamano: 20,
    });
    const texto = contenido(fixture);
    expect(texto).toContain('ACTUALIZAR_PARAMETRO');
    expect(texto).toContain('parametro');
    expect(texto).toContain('#12');
    expect(texto).toContain('127.0.0.1');
    expect(texto).toContain('comision_porcentaje: 0.0600 -> 0.0700');
    expect(texto).toContain('Página 1 de 1');
  });

  it('aplica los filtros normalizados y vuelve a la primera página', async () => {
    const fixture = await crear();

    escribir(fixture, 0, ' 7 ');
    escribir(fixture, 1, '  servicio  ');
    escribir(fixture, 2, '  actualizar_estado  ');
    escribir(fixture, 3, '2026-10-01');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({
      usuarioId: 7,
      entidad: 'servicio',
      accion: 'actualizar_estado',
      desde: '2026-10-01',
      hasta: '',
      pagina: 0,
      tamano: 20,
    });
    expect(contenido(fixture)).toContain('con los filtros aplicados');
  });

  it('rechaza un rango de fechas invertido sin consultar la API', async () => {
    const fixture = await crear();
    const llamadas = servicio.listar.mock.calls.length;

    escribir(fixture, 3, '2026-10-28');
    escribir(fixture, 4, '2026-10-27');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenCalledTimes(llamadas);
    expect(contenido(fixture)).toContain(
      'La fecha de fin no puede ser anterior a la fecha de inicio.',
    );
  });

  it('valida que el id de usuario sea un entero positivo', async () => {
    const fixture = await crear();
    const llamadas = servicio.listar.mock.calls.length;

    escribir(fixture, 0, 'abc');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenCalledTimes(llamadas);
    expect(contenido(fixture)).toContain('El ID debe ser un número entero positivo.');
  });

  it('navega a la página siguiente', async () => {
    servicio.listar.mockReturnValue(of({ ...PAGINA, totalPaginas: 3 }));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Página 1 de 3');

    pulsarBoton(fixture.nativeElement, 'Siguiente');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith(
      expect.objectContaining({ pagina: 1, tamano: 20 }),
    );
  });

  it('limpia los filtros y recarga la primera página', async () => {
    const fixture = await crear();
    escribir(fixture, 1, 'servicio');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    pulsarBoton(fixture.nativeElement, 'Limpiar filtros');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenLastCalledWith({
      usuarioId: null,
      entidad: '',
      accion: '',
      desde: '',
      hasta: '',
      pagina: 0,
      tamano: 20,
    });
  });

  it('muestra el estado vacío con y sin filtros', async () => {
    servicio.listar.mockReturnValue(
      of({ ...PAGINA, contenido: [], totalElementos: 0, totalPaginas: 0 }),
    );
    const fixture = await crear();

    expect(contenido(fixture)).toContain('Las acciones administrativas aparecerán aquí');

    escribir(fixture, 1, 'servicio');
    fixture.detectChanges();
    enviar(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('No encontramos acciones para los filtros seleccionados.');
  });

  it('muestra el error de carga y permite reintentar', async () => {
    servicio.listar
      .mockReturnValueOnce(
        throwError(() => ({
          estado: 500,
          mensaje: 'No se pudo obtener la auditoría.',
          detalles: ['Intente más tarde.'],
        })),
      )
      .mockReturnValue(of(PAGINA));
    const fixture = await crear();

    expect(contenido(fixture)).toContain('No pudimos cargar la auditoría');
    expect(contenido(fixture)).toContain('No se pudo obtener la auditoría.');
    expect(contenido(fixture)).toContain('Intente más tarde.');

    pulsarBoton(fixture.nativeElement, 'Reintentar');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(servicio.listar).toHaveBeenCalledTimes(2);
    expect(contenido(fixture)).toContain('ACTUALIZAR_PARAMETRO');
  });
});

async function crear(): Promise<ComponentFixture<AdminAuditoriaPage>> {
  const fixture = TestBed.createComponent(AdminAuditoriaPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function escribir(
  fixture: ComponentFixture<AdminAuditoriaPage>,
  indice: number,
  valor: string,
): void {
  const input = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input')[
    indice
  ];
  if (input === undefined) {
    throw new Error(`No se encontró el campo en la posición ${indice}`);
  }
  input.value = valor;
  input.dispatchEvent(new Event('input'));
}

function enviar(fixture: ComponentFixture<AdminAuditoriaPage>): void {
  (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
}

function contenido(fixture: ComponentFixture<AdminAuditoriaPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarBoton(contenedor: HTMLElement, texto: string): void {
  const boton = Array.from(contenedor.querySelectorAll('button')).find((elemento) =>
    elemento.textContent?.includes(texto),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${texto}`);
  }
  boton.click();
}
