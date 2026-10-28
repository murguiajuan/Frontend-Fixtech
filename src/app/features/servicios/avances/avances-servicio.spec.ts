import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NotificacionService } from '../../../shared/ui/notificacion.service';
import { EstadoServicio } from '../servicio.models';
import { ServiciosService } from '../servicios.service';
import { crearAvance } from '../testing/servicio.fixtures';
import { AvancesServicio } from './avances-servicio';

describe('AvancesServicio', () => {
  const serviciosService = { registrarAvance: vi.fn() };
  const notificaciones = { exito: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    serviciosService.registrarAvance.mockReset();
    notificaciones.exito.mockReset();
    notificaciones.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [AvancesServicio],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ServiciosService, useValue: serviciosService },
        { provide: NotificacionService, useValue: notificaciones },
      ],
    }).compileComponents();
  });

  it('muestra los avances y el formulario para el técnico', async () => {
    const fixture = await crear('EN_PROCESO', [crearAvance()], true);

    const texto = contenido(fixture);
    expect(texto).toContain('Avances del servicio');
    expect(texto).toContain('Se reemplazó la pasta térmica.');
    expect(texto).toContain('Registrar avance');
    expect(texto).toContain('Adjuntar foto (opcional)');
  });

  it('no muestra el formulario al cliente y usa un vacío adecuado', async () => {
    const fixture = await crear('PROGRAMADO', [], false);

    const texto = contenido(fixture);
    expect(texto).not.toContain('Registrar avance');
    expect(texto).toContain('El técnico aún no registró avances');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('registra un avance con descripción y sin foto', async () => {
    serviciosService.registrarAvance.mockReturnValue(of(crearAvance({ id: 9 })));
    const fixture = await crear('EN_PROCESO', [], true);
    const emitido = vi.fn();
    fixture.componentInstance.actualizado.subscribe(emitido);

    escribir(fixture.nativeElement, '  Se revisó el ventilador.  ');
    pulsarBoton(fixture.nativeElement, 'Registrar avance');

    expect(serviciosService.registrarAvance).toHaveBeenCalledWith(
      21,
      { tipo: 'AVANCE', descripcion: 'Se revisó el ventilador.' },
      null,
    );
    expect(notificaciones.exito).toHaveBeenCalledWith('Avance registrado. El cliente podrá verlo.');
    expect(emitido).toHaveBeenCalled();
  });

  it('permite registrar un diagnóstico cuando el servicio está en diagnóstico', async () => {
    serviciosService.registrarAvance.mockReturnValue(of(crearAvance()));
    const fixture = await crear('EN_DIAGNOSTICO', [], true);
    expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();

    escribir(fixture.nativeElement, 'La placa presenta sulfatación.');
    pulsarBoton(fixture.nativeElement, 'Registrar avance');

    expect(serviciosService.registrarAvance).toHaveBeenCalledWith(
      21,
      { tipo: 'DIAGNOSTICO', descripcion: 'La placa presenta sulfatación.' },
      null,
    );
  });

  it('adjunta una foto válida al avance', async () => {
    serviciosService.registrarAvance.mockReturnValue(of(crearAvance()));
    const fixture = await crear('EN_PROCESO', [], true);
    const foto = new File(['imagen'], 'avance.png', { type: 'image/png' });

    escribir(fixture.nativeElement, 'Se limpió el equipo.');
    seleccionarArchivo(fixture.nativeElement, foto);
    fixture.detectChanges();
    pulsarBoton(fixture.nativeElement, 'Registrar avance');

    expect(serviciosService.registrarAvance).toHaveBeenCalledWith(
      21,
      { tipo: 'AVANCE', descripcion: 'Se limpió el equipo.' },
      foto,
    );
  });

  it('rechaza fotos que no sean JPG o PNG', async () => {
    const fixture = await crear('EN_PROCESO', [], true);

    seleccionarArchivo(
      fixture.nativeElement,
      new File(['documento'], 'avance.pdf', { type: 'application/pdf' }),
    );
    fixture.detectChanges();

    expect(contenido(fixture)).toContain('avance.pdf: solo se permiten imágenes JPG o PNG.');
  });

  it('exige la descripción del avance', async () => {
    const fixture = await crear('EN_PROCESO', [], true);

    pulsarBoton(fixture.nativeElement, 'Registrar avance');
    fixture.detectChanges();

    expect(serviciosService.registrarAvance).not.toHaveBeenCalled();
    expect(contenido(fixture)).toContain('La descripción es obligatoria.');
  });
});

async function crear(
  estado: EstadoServicio,
  avances: ReturnType<typeof crearAvance>[],
  esTecnico: boolean,
): Promise<ComponentFixture<AvancesServicio>> {
  const fixture = TestBed.createComponent(AvancesServicio);
  fixture.componentRef.setInput('servicioId', 21);
  fixture.componentRef.setInput('estado', estado);
  fixture.componentRef.setInput('avances', avances);
  fixture.componentRef.setInput('esTecnico', esTecnico);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function contenido(fixture: ComponentFixture<AvancesServicio>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function escribir(contenedor: HTMLElement, texto: string): void {
  const area = contenedor.querySelector<HTMLTextAreaElement>('textarea');
  if (area === null) {
    throw new Error('No se encontró el campo de descripción');
  }
  area.value = texto;
  area.dispatchEvent(new Event('input'));
}

function seleccionarArchivo(contenedor: HTMLElement, archivo: File): void {
  const input = contenedor.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) {
    throw new Error('No se encontró el campo de foto');
  }
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: Object.assign([archivo], {
      item: (indice: number) => (indice === 0 ? archivo : null),
    }),
  });
  input.dispatchEvent(new Event('change'));
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
