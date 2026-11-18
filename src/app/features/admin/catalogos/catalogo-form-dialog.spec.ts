import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AdminCatalogosService } from '../services/admin-catalogos.service';
import { CatalogoAdmin, TipoCatalogoAdmin } from './catalogos-admin.models';
import { CatalogoFormDialog } from './catalogo-form-dialog';

const RESPUESTA = { id: 9, nombre: 'Laptop', activo: true };

describe('CatalogoFormDialog', () => {
  const servicio = { crear: vi.fn(), actualizar: vi.fn() };
  const dialogo = { close: vi.fn() };
  const datos: {
    tipo: TipoCatalogoAdmin;
    item: CatalogoAdmin | null;
  } = {
    tipo: 'tipos-equipo',
    item: null,
  };

  beforeEach(async () => {
    datos.tipo = 'tipos-equipo';
    datos.item = null;
    servicio.crear.mockReset();
    servicio.crear.mockReturnValue(of(RESPUESTA));
    servicio.actualizar.mockReset();
    servicio.actualizar.mockReturnValue(of(RESPUESTA));
    dialogo.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [CatalogoFormDialog],
      providers: [
        { provide: AdminCatalogosService, useValue: servicio },
        { provide: MatDialogRef, useValue: dialogo },
        { provide: MAT_DIALOG_DATA, useValue: datos },
      ],
    }).compileComponents();
  });

  it('exige el nombre antes de crear y lo envía recortado', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.crear).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('El nombre es obligatorio.');

    escribir(compilado, 'Nombre', '  Laptop  ');
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.crear).toHaveBeenCalledWith('tipos-equipo', { nombre: 'Laptop' });
    expect(dialogo.close).toHaveBeenCalledWith(RESPUESTA);
  });

  it('envía la descripción de una especialidad y la convierte en nula si está vacía', () => {
    datos.tipo = 'especialidades';
    datos.item = {
      id: 3,
      nombre: 'Redes',
      descripcion: 'Configuración de redes.',
      activo: true,
    };
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    expect(compilado.textContent).toContain('Editar especialidad');
    escribir(compilado, 'Descripción', '   ');
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.actualizar).toHaveBeenCalledWith('especialidades', 3, {
      nombre: 'Redes',
      descripcion: null,
    });
  });

  it('rechaza nombres y provincias compuestos solo por espacios', () => {
    datos.tipo = 'distritos';
    datos.item = null;
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribir(compilado, 'Nombre', '   ');
    escribir(compilado, 'Provincia', '   ');
    escribir(compilado, 'Tope de movilidad', '10');
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.crear).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('El nombre no puede estar vacío.');
    expect(compilado.textContent).toContain('La provincia no puede estar vacía.');
  });

  it('valida los campos obligatorios de un distrito y envía el tope numérico', () => {
    datos.tipo = 'distritos';
    datos.item = null;
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.crear).not.toHaveBeenCalled();
    expect(compilado.textContent).toContain('La provincia es obligatoria.');
    expect(compilado.textContent).toContain('El tope de movilidad es obligatorio.');

    escribir(compilado, 'Nombre', 'Castilla');
    escribir(compilado, 'Provincia', ' Piura ');
    escribir(compilado, 'Tope de movilidad', '15.5');
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(servicio.crear).toHaveBeenCalledWith('distritos', {
      nombre: 'Castilla',
      provincia: 'Piura',
      topeMovilidad: 15.5,
    });
  });

  it('muestra el mensaje y los detalles de error de la API', () => {
    servicio.crear.mockReturnValue(
      throwError(() => ({
        estado: 400,
        mensaje: 'Ya existe un registro con ese nombre.',
        detalles: ['Verifique el catálogo de tipos de equipo.'],
      })),
    );
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    escribir(compilado, 'Nombre', 'Laptop');
    fixture.detectChanges();
    enviar(compilado);
    fixture.detectChanges();

    expect(compilado.textContent).toContain('Ya existe un registro con ese nombre.');
    expect(compilado.textContent).toContain('Verifique el catálogo de tipos de equipo.');
    expect(dialogo.close).not.toHaveBeenCalled();
  });

  it('cierra el diálogo sin guardar al cancelar', () => {
    const fixture = crear();
    const compilado = fixture.nativeElement as HTMLElement;

    pulsarBoton(compilado, 'Cancelar');

    expect(servicio.crear).not.toHaveBeenCalled();
    expect(dialogo.close).toHaveBeenCalledWith();
  });
});

function crear(): ComponentFixture<CatalogoFormDialog> {
  const fixture = TestBed.createComponent(CatalogoFormDialog);
  fixture.detectChanges();
  return fixture;
}

function enviar(contenedor: HTMLElement): void {
  contenedor.querySelector('form')?.dispatchEvent(new Event('submit'));
}

function escribir(contenedor: HTMLElement, etiqueta: string, valor: string): void {
  const campos = Array.from(contenedor.querySelectorAll('mat-form-field'));
  const campo = campos.find((elemento) => elemento.textContent?.includes(etiqueta));
  const input = campo?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
  if (input === undefined || input === null) {
    throw new Error(`No se encontró el campo ${etiqueta}`);
  }
  input.value = valor;
  input.dispatchEvent(new Event('input'));
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
