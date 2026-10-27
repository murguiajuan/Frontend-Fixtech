import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RetirarOfertaData, RetirarOfertaDialog } from './retirar-oferta-dialog';

describe('RetirarOfertaDialog', () => {
  const referencia = { close: vi.fn() };

  beforeEach(() => {
    referencia.close.mockReset();
  });

  it('muestra el identificador y el total de la oferta a retirar', async () => {
    const fixture = await crear({ ofertaId: 7, precioTotal: 160 });

    const texto = contenido(fixture);
    expect(texto).toContain('Retirar oferta #7');
    expect(texto).toContain('S/ 160.00');
    expect(texto).toContain('Las contraofertas pendientes quedarán superadas.');
  });

  it('confirma el retiro con true', async () => {
    const fixture = await crear({ ofertaId: 7, precioTotal: 160 });

    pulsarBoton(fixture, 'Sí, retirar oferta');

    expect(referencia.close).toHaveBeenCalledWith(true);
  });

  it('cierra sin confirmar al volver', async () => {
    const fixture = await crear({ ofertaId: 7, precioTotal: 160 });

    pulsarBoton(fixture, 'Volver');

    expect(referencia.close).toHaveBeenCalledWith();
  });

  async function crear(datos: RetirarOfertaData): Promise<ComponentFixture<RetirarOfertaDialog>> {
    await TestBed.configureTestingModule({
      imports: [RetirarOfertaDialog],
      providers: [
        { provide: MatDialogRef, useValue: referencia },
        { provide: MAT_DIALOG_DATA, useValue: datos },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RetirarOfertaDialog);
    fixture.detectChanges();
    return fixture;
  }
});

function contenido(fixture: ComponentFixture<RetirarOfertaDialog>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function pulsarBoton(fixture: ComponentFixture<RetirarOfertaDialog>, etiqueta: string): void {
  const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
    (elemento) => elemento.textContent?.includes(etiqueta),
  );
  if (boton === undefined) {
    throw new Error(`No se encontró el botón ${etiqueta}`);
  }
  boton.click();
  fixture.detectChanges();
}
