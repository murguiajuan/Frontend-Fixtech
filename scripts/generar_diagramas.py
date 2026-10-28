#!/usr/bin/env python3
"""Genera diagramas monocromáticos para la documentación Word de FIXTECH.

Los diagramas usan únicamente negro sobre blanco, sin colores, y están
pensados para insertarse a 15.5 cm de ancho con texto legible en impresión.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SALIDA = Path(__file__).resolve().parent.parent / "docs" / "word" / "assets"
FUENTE = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FUENTE_NEGRITA = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

NEGRO = (0, 0, 0)
BLANCO = (255, 255, 255)


def fuente(tamano: int, negrita: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FUENTE_NEGRITA if negrita else FUENTE, tamano)


def caja(
    dibujo: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    texto: str,
    tamano: int = 30,
    negrita: bool = True,
) -> None:
    x1, y1, x2, y2 = xy
    dibujo.rounded_rectangle(xy, radius=12, outline=NEGRO, width=3, fill=BLANCO)
    lineas = texto.split("\n")
    disponible_ancho = (x2 - x1) - 28
    disponible_alto = (y2 - y1) - 18
    while tamano > 12:
        fuente_actual = fuente(tamano, negrita)
        ancho_ok = all(
            dibujo.textlength(linea, font=fuente_actual) <= disponible_ancho
            for linea in lineas
        )
        alto_ok = (tamano + 10) * len(lineas) <= disponible_alto
        if ancho_ok and alto_ok:
            break
        tamano -= 1
    alto_linea = tamano + 10
    total = alto_linea * len(lineas)
    y = y1 + ((y2 - y1) - total) / 2
    for linea in lineas:
        ancho = dibujo.textlength(linea, font=fuente(tamano, negrita))
        dibujo.text(
            (x1 + ((x2 - x1) - ancho) / 2, y),
            linea,
            font=fuente(tamano, negrita),
            fill=NEGRO,
        )
        y += alto_linea


def flecha(
    dibujo: ImageDraw.ImageDraw,
    inicio: tuple[int, int],
    fin: tuple[int, int],
    etiqueta: str | None = None,
    tamano_etiqueta: int = 22,
    desplazamiento: tuple[int, int] = (0, -32),
) -> None:
    dibujo.line([inicio, fin], fill=NEGRO, width=3)
    x1, y1 = inicio
    x2, y2 = fin
    dx, dy = x2 - x1, y2 - y1
    longitud = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / longitud, dy / longitud
    px, py = -uy, ux
    largo, ancho = 18, 9
    punta = (x2, y2)
    base = (x2 - ux * largo, y2 - uy * largo)
    izquierda = (base[0] + px * ancho, base[1] + py * ancho)
    derecha = (base[0] - px * ancho, base[1] - py * ancho)
    dibujo.polygon([punta, izquierda, derecha], fill=NEGRO)

    if etiqueta:
        mx = (x1 + x2) / 2 + desplazamiento[0]
        my = (y1 + y2) / 2 + desplazamiento[1]
        ancho_texto = dibujo.textlength(etiqueta, font=fuente(tamano_etiqueta))
        dibujo.rectangle(
            [mx - ancho_texto / 2 - 4, my - 3, mx + ancho_texto / 2 + 4, my + tamano_etiqueta + 5],
            fill=BLANCO,
        )
        dibujo.text(
            (mx - ancho_texto / 2, my),
            etiqueta,
            font=fuente(tamano_etiqueta),
            fill=NEGRO,
        )


def diagrama_arquitectura() -> None:
    ancho, alto = 1600, 900
    imagen = Image.new("RGB", (ancho, alto), BLANCO)
    dibujo = ImageDraw.Draw(imagen)

    caja(dibujo, (40, 360, 300, 520), "Usuario\n(navegador)")
    caja(dibujo, (400, 360, 700, 520), "Nginx\nSPA + proxy /api")
    caja(dibujo, (800, 120, 1120, 280), "Angular 22\nSPA (standalone)")
    caja(dibujo, (800, 580, 1120, 740), "Spring Boot 4.1\nAPI REST")
    caja(dibujo, (1240, 580, 1520, 740), "MySQL 8\nfixtech_db")
    caja(dibujo, (1240, 120, 1520, 280), "Almacenamiento\nuploads/")

    flecha(dibujo, (300, 440), (400, 440), "HTTPS")
    flecha(dibujo, (700, 400), (800, 200), "estáticos", desplazamiento=(0, -38))
    flecha(dibujo, (700, 480), (800, 660), "/api", desplazamiento=(0, 30))
    flecha(dibujo, (960, 280), (960, 580), "HTTP /api", desplazamiento=(78, 0))
    flecha(dibujo, (1120, 660), (1240, 660), "JPA")
    flecha(dibujo, (1120, 620), (1240, 240), "archivos", desplazamiento=(0, -30))

    imagen.save(SALIDA / "arquitectura.png", "PNG")


def diagrama_despliegue() -> None:
    ancho, alto = 1600, 900
    imagen = Image.new("RGB", (ancho, alto), BLANCO)
    dibujo = ImageDraw.Draw(imagen)

    caja(dibujo, (40, 360, 280, 520), "Internet\n(HTTPS)")
    caja(dibujo, (380, 330, 680, 550), "Servidor Nginx\n:80 / :443")
    caja(dibujo, (800, 120, 1120, 280), "Archivos estáticos\nSPA compilada")
    caja(dibujo, (800, 580, 1120, 740), "Proxy inverso\n/api")
    caja(dibujo, (1220, 580, 1520, 740), "Backend\nSpring Boot\n:8080")
    caja(dibujo, (1220, 120, 1520, 280), "MySQL 8\nfixtech_db")
    caja(dibujo, (1220, 800, 1520, 880), "Volumen\nuploads/", tamano=28)

    dibujo.rounded_rectangle((1170, 80, 1560, 890), radius=16, outline=NEGRO, width=2)
    dibujo.text((1190, 95), "Red interna / Docker", font=fuente(21), fill=NEGRO)

    flecha(dibujo, (280, 440), (380, 440), "HTTPS")
    flecha(dibujo, (680, 400), (800, 200), "SPA", desplazamiento=(0, -38))
    flecha(dibujo, (680, 480), (800, 660), "/api", desplazamiento=(0, 30))
    flecha(dibujo, (1120, 660), (1220, 660), "HTTP", desplazamiento=(0, -30))
    flecha(dibujo, (1370, 740), (1370, 800), "archivos", desplazamiento=(52, 0))
    flecha(dibujo, (1270, 580), (1270, 280), "JDBC", desplazamiento=(-48, 0))

    imagen.save(SALIDA / "despliegue.png", "PNG")


def diagrama_flujo() -> None:
    ancho, alto = 1600, 720
    imagen = Image.new("RGB", (ancho, alto), BLANCO)
    dibujo = ImageDraw.Draw(imagen)

    fila_superior = [
        ("1. El cliente\npublica la\nsolicitud", (40, 110, 360, 250)),
        ("2. Los técnicos\nenvían ofertas", (440, 110, 760, 250)),
        ("3. El cliente\ncompara y acepta\nuna oferta", (840, 110, 1160, 250)),
        ("4. Servicio\naceptado y en\nejecución", (1240, 110, 1560, 250)),
    ]
    fila_inferior = [
        ("5. El técnico\nregistra avances\ny constancias", (1240, 470, 1560, 610)),
        ("6. El técnico\nfinaliza el\nservicio", (840, 470, 1160, 610)),
        ("7. El cliente da\nconformidad", (440, 470, 760, 610)),
        ("8. Reseña,\nreclamo y\ncomisión", (40, 470, 360, 610)),
    ]
    for texto, xy in fila_superior + fila_inferior:
        caja(dibujo, xy, texto, tamano=28)

    flecha(dibujo, (360, 180), (440, 180))
    flecha(dibujo, (760, 180), (840, 180))
    flecha(dibujo, (1160, 180), (1240, 180))
    flecha(dibujo, (1400, 250), (1400, 470))
    flecha(dibujo, (1240, 540), (1160, 540))
    flecha(dibujo, (840, 540), (760, 540))
    flecha(dibujo, (440, 540), (360, 540))

    imagen.save(SALIDA / "flujo-servicio.png", "PNG")


def main() -> None:
    SALIDA.mkdir(parents=True, exist_ok=True)
    diagrama_arquitectura()
    diagrama_despliegue()
    diagrama_flujo()
    print(f"Diagramas generados en {SALIDA}")


if __name__ == "__main__":
    main()
