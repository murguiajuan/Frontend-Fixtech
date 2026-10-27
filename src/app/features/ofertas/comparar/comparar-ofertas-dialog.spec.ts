import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CompararOfertasData, CompararOfertasDialog } from './comparar-ofertas-dialog';
import { crearOferta } from '../testing/oferta.fixtures';

describe('CompararOfertasDialog', () => {
  const referencia = { close: vi.fn() };

  beforeEach(() => {
    referencia.close.mockReset();
  });

  it('compara precio, tiempo, garantía y calificación de las ofertas', async () => {
    const fixture = await crear({
      ofertas: [
        crearOferta({
          id: 7,
          precioTotal: 160,
          tiempoEstimadoHoras: 3,
          garantiaDias: 30,
          tecnico: {
            ...crearOferta().tecnico,
            nombres: 'María',
            apellidos: 'Quispe',
            calificacionPromedio: 4.8,
          },
        }),
        crearOferta({
          id: 8,
          precioTotal: 190,
          tiempoEstimadoHoras: 2,
          garantiaDias: 45,
          tecnico: {
            ...crearOferta().tecnico,
            nombres: 'Carlos',
            apellidos: 'Rojas',
            calificacionPromedio: 4.9,
          },
        }),
      ],
    });

    const texto = contenido(fixture);
    expect(texto).toContain('Comparación de 2 ofertas para la solicitud #15');
    expect(texto).toContain('María Quispe');
    expect(texto).toContain('Carlos Rojas');
    expect(texto).toContain('Oferta #7');
    expect(texto).toContain('Menor total');
    expect(texto).toContain('Más rápida');
    expect(texto).toContain('Mayor garantía');
    expect(texto).toContain('Mejor calificada');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('S/ 190.00');
    expect(texto).toContain('El total suma el precio del servicio y la movilidad');
  });

  it('cierra el diálogo desde el botón de cierre', async () => {
    const fixture = await crear({ ofertas: [crearOferta()] });

    const cerrar = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((boton) => boton.textContent?.includes('Cerrar'));
    expect(cerrar).toBeDefined();
    cerrar?.click();

    expect(referencia.close).toHaveBeenCalled();
  });

  async function crear(
    datos: CompararOfertasData,
  ): Promise<ComponentFixture<CompararOfertasDialog>> {
    await TestBed.configureTestingModule({
      imports: [CompararOfertasDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: datos },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CompararOfertasDialog);
    fixture.detectChanges();
    return fixture;
  }
});

function contenido(fixture: ComponentFixture<CompararOfertasDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}
