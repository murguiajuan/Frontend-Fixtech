#!/usr/bin/env python3
"""Genera los documentos Word de cierre de FIXTECH con estilo UCV.

Lee los archivos Markdown de ``docs/word`` y produce documentos ``.docx``
monocromáticos con portada, índice, encabezado, pie de página, numeración,
tablas formales e imágenes. Convierte cada documento a PDF con LibreOffice
para calcular las páginas del índice y verificar el resultado.

Uso:
    python3 scripts/generar_documentos.py
    python3 scripts/generar_documentos.py --solo 01
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import tempfile
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / "docs" / "word"
SALIDA = Path("/home/juan/Documentos/calidadd")
TEMPORAL = Path("/tmp/opencode/documentos-word")

FUENTE = "Times New Roman"
FUENTE_CODIGO = "Courier New"
NEGRO = RGBColor(0, 0, 0)
ANCHO_TEXTO_CM = 16.0

DOCUMENTOS = [
    "01_Informe_Final_QA_FIXTECH.md",
    "02_Manual_Despliegue_FIXTECH.md",
    "03_Documentacion_Tecnica_FIXTECH.md",
    "04_Manual_Usuario_FIXTECH.md",
    "05_Checklist_Aceptacion_FIXTECH.md",
    "06_Acta_Conformidad_FIXTECH.md",
]


# ---------------------------------------------------------------------------
# Modelo de bloques
# ---------------------------------------------------------------------------


@dataclass
class Bloque:
    tipo: str
    texto: str = ""
    nivel: int = 0
    numero: int = 0
    filas: list[list[str]] = field(default_factory=list)
    alineaciones: list[str] = field(default_factory=list)
    ruta: str = ""
    caption: str = ""
    lineas: list[str] = field(default_factory=list)
    sangria: int = 0


@dataclass
class Encabezado:
    texto: str
    nivel: int


# ---------------------------------------------------------------------------
# Lectura y parseo de Markdown
# ---------------------------------------------------------------------------


def leer_front_matter(lineas: list[str]) -> tuple[dict[str, str], list[str]]:
    if not lineas or lineas[0].strip() != "---":
        return {}, lineas
    fin = None
    for i in range(1, len(lineas)):
        if lineas[i].strip() == "---":
            fin = i
            break
    if fin is None:
        return {}, lineas
    meta: dict[str, str] = {}
    for linea in lineas[1:fin]:
        if ":" in linea:
            clave, valor = linea.split(":", 1)
            meta[clave.strip()] = valor.strip().strip('"').strip("'")
    return meta, lineas[fin + 1 :]


def es_inicio_bloque(linea: str) -> bool:
    texto = linea.strip()
    return (
        not texto
        or texto.startswith("#")
        or texto.startswith("|")
        or texto.startswith("```")
        or texto.startswith("> ")
        or texto.startswith("- ")
        or re.match(r"^\d+\.\s", texto) is not None
        or texto.startswith("![")
        or texto.startswith("<!--")
        or texto == "---"
    )


def parsear_tabla(lineas: list[str]) -> tuple[list[list[str]], list[str]]:
    filas: list[list[str]] = []
    alineaciones: list[str] = []
    for indice, linea in enumerate(lineas):
        celdas = [c.strip() for c in linea.strip().strip("|").split("|")]
        if indice == 1 and all(re.fullmatch(r":?-{3,}:?", c) for c in celdas):
            for celda in celdas:
                izquierda = celda.startswith(":")
                derecha = celda.endswith(":")
                if izquierda and derecha:
                    alineaciones.append("center")
                elif derecha:
                    alineaciones.append("right")
                else:
                    alineaciones.append("left")
            continue
        filas.append(celdas)
    if not filas:
        return [], []
    ancho = max(len(f) for f in filas)
    filas = [f + [""] * (ancho - len(f)) for f in filas]
    if len(alineaciones) < ancho:
        alineaciones += ["left"] * (ancho - len(alineaciones))
    return filas, alineaciones[:ancho]


def parsear_bloques(
    lineas: list[str], base: Path, profundidad: int = 0
) -> list[Bloque]:
    bloques: list[Bloque] = []
    i = 0
    while i < len(lineas):
        linea = lineas[i]
        texto = linea.strip()

        if not texto or texto == "---":
            i += 1
            continue

        if texto.startswith("<!--"):
            if "include:" in texto and profundidad < 3:
                nombre = texto.split("include:", 1)[1].split("-->", 1)[0].strip()
                ruta = (base / nombre).resolve()
                if ruta.exists():
                    incluidas = ruta.read_text(encoding="utf-8").splitlines()
                    bloques.extend(parsear_bloques(incluidas, ruta.parent, profundidad + 1))
                else:
                    print(f"  AVISO: no existe el include {ruta}")
            elif "pagebreak" in texto:
                bloques.append(Bloque("pagebreak"))
            i += 1
            continue

        if texto.startswith("!["):
            coincidencia = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", texto)
            if coincidencia:
                bloques.append(
                    Bloque(
                        "imagen",
                        caption=coincidencia.group(1).strip(),
                        ruta=str((base / coincidencia.group(2)).resolve()),
                    )
                )
            i += 1
            continue

        if texto.startswith("#"):
            nivel = len(texto) - len(texto.lstrip("#"))
            contenido = texto[nivel:].strip().replace("`", "")
            if contenido:
                # El nivel 1 de Markdown se reserva para el título del documento;
                # las secciones del cuerpo usan ##, ### y ####.
                nivel_docx = max(1, min(3, nivel - 1)) if nivel >= 2 else 1
                bloques.append(Bloque("encabezado", contenido, nivel=nivel_docx))
            i += 1
            continue

        if texto.startswith("```"):
            i += 1
            codigo: list[str] = []
            while i < len(lineas) and not lineas[i].strip().startswith("```"):
                codigo.append(lineas[i].rstrip("\n"))
                i += 1
            i += 1
            bloques.append(Bloque("codigo", lineas=codigo))
            continue

        if texto.startswith("|"):
            tabla: list[str] = []
            while i < len(lineas) and lineas[i].strip().startswith("|"):
                tabla.append(lineas[i].strip())
                i += 1
            filas, alineaciones = parsear_tabla(tabla)
            if filas:
                bloques.append(Bloque("tabla", filas=filas, alineaciones=alineaciones))
            continue

        if texto.startswith("> "):
            cita: list[str] = []
            while i < len(lineas) and lineas[i].strip().startswith("> "):
                cita.append(lineas[i].strip()[2:].strip())
                i += 1
            bloques.append(Bloque("cita", texto=" ".join(cita)))
            continue

        if texto.startswith("- "):
            while i < len(lineas) and lineas[i].strip().startswith("- "):
                sangria = len(lineas[i]) - len(lineas[i].lstrip(" "))
                contenido = lineas[i].strip()[2:].strip()
                bloques.append(
                    Bloque("vineta", contenido, sangria=sangria // 2)
                )
                i += 1
            continue

        coincidencia_numero = re.match(r"^(\d+)\.\s+(.*)$", texto)
        if coincidencia_numero:
            while i < len(lineas):
                coincidencia = re.match(r"^(\d+)\.\s+(.*)$", lineas[i].strip())
                if not coincidencia:
                    break
                bloques.append(
                    Bloque(
                        "numerada",
                        coincidencia.group(2).strip(),
                        numero=int(coincidencia.group(1)),
                    )
                )
                i += 1
            continue

        parrafo: list[str] = [texto]
        i += 1
        while i < len(lineas) and not es_inicio_bloque(lineas[i]):
            parrafo.append(lineas[i].strip())
            i += 1
        bloques.append(Bloque("parrafo", " ".join(parrafo)))

    return bloques


def cargar_documento(ruta: Path) -> tuple[dict[str, str], list[Bloque]]:
    lineas = ruta.read_text(encoding="utf-8").splitlines()
    meta, cuerpo = leer_front_matter(lineas)
    bloques = parsear_bloques(cuerpo, ruta.parent)
    return meta, bloques


# ---------------------------------------------------------------------------
# Utilidades de formato
# ---------------------------------------------------------------------------


def configurar_fuente(run, tamano: float | None = None, negrita: bool = False,
                      cursiva: bool = False, fuente: str = FUENTE,
                      color: RGBColor = NEGRO) -> None:
    run.font.name = fuente
    run.font.size = Pt(tamano) if tamano else None
    run.font.bold = negrita
    run.font.italic = cursiva
    run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for atributo in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rfonts.set(qn(atributo), fuente)


def agregar_borde(parrafo, lado: str = "bottom", tamano: int = 4,
                  espacio: int = 1) -> None:
    ppr = parrafo._p.get_or_add_pPr()
    pbdr = ppr.find(qn("w:pBdr"))
    if pbdr is None:
        pbdr = OxmlElement("w:pBdr")
        ppr.append(pbdr)
    borde = OxmlElement(f"w:{lado}")
    borde.set(qn("w:val"), "single")
    borde.set(qn("w:sz"), str(tamano))
    borde.set(qn("w:space"), str(espacio))
    borde.set(qn("w:color"), "000000")
    pbdr.append(borde)


def agregar_campo_pagina(parrafo, romano: bool = False) -> None:
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), " PAGE \\* roman " if romano else " PAGE ")
    run = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    rfonts = OxmlElement("w:rFonts")
    for atributo in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rfonts.set(qn(atributo), FUENTE)
    rpr.append(rfonts)
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), "18")
    rpr.append(sz)
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "000000")
    rpr.append(color)
    run.append(rpr)
    texto = OxmlElement("w:t")
    texto.text = "1"
    run.append(texto)
    fld.append(run)
    parrafo._p.append(fld)


def agregar_texto_con_formato(parrafo, texto: str, tamano: float | None = None,
                              negrita: bool = False, cursiva: bool = False,
                              fuente: str = FUENTE) -> None:
    patron = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\*[^*]+?\*)")
    posicion = 0
    for coincidencia in patron.finditer(texto):
        if coincidencia.start() > posicion:
            run = parrafo.add_run(texto[posicion : coincidencia.start()])
            configurar_fuente(run, tamano, negrita, cursiva, fuente)
        token = coincidencia.group(0)
        if token.startswith("**"):
            run = parrafo.add_run(token[2:-2])
            configurar_fuente(run, tamano, True, cursiva, fuente)
        elif token.startswith("`"):
            run = parrafo.add_run(token[1:-1])
            configurar_fuente(
                run,
                (tamano - 1) if tamano else 9,
                negrita,
                cursiva,
                FUENTE_CODIGO,
            )
        else:
            run = parrafo.add_run(token[1:-1])
            configurar_fuente(run, tamano, negrita, True, fuente)
        posicion = coincidencia.end()
    if posicion < len(texto):
        run = parrafo.add_run(texto[posicion:])
        configurar_fuente(run, tamano, negrita, cursiva, fuente)


# ---------------------------------------------------------------------------
# Estilos y secciones
# ---------------------------------------------------------------------------


def configurar_estilos(doc: Document) -> None:
    normal = doc.styles["Normal"]
    normal.font.name = FUENTE
    normal.font.size = Pt(12)
    normal.font.color.rgb = NEGRO
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.first_line_indent = Cm(1.25)
    normal.paragraph_format.widow_control = True

    estilos = {
        "Heading 1": (16, 18, 8, True),
        "Heading 2": (14, 14, 6, True),
        "Heading 3": (12.5, 12, 4, True),
        "Heading 4": (12, 10, 4, True),
    }
    for nombre, (tamano, antes, despues, negrita) in estilos.items():
        estilo = doc.styles[nombre]
        estilo.font.name = FUENTE
        estilo.font.size = Pt(tamano)
        estilo.font.bold = negrita
        estilo.font.italic = False
        estilo.font.color.rgb = NEGRO
        estilo.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        estilo.paragraph_format.space_before = Pt(antes)
        estilo.paragraph_format.space_after = Pt(despues)
        estilo.paragraph_format.line_spacing = 1.15
        estilo.paragraph_format.first_line_indent = Cm(0)
        estilo.paragraph_format.keep_with_next = True
        estilo.paragraph_format.widow_control = True

    # Fuente para todos los runs de los estilos.
    for estilo in doc.styles:
        try:
            rpr = estilo.element.get_or_add_rPr()
        except AttributeError:
            continue
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is None:
            rfonts = OxmlElement("w:rFonts")
            rpr.append(rfonts)
        for atributo in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            rfonts.set(qn(atributo), FUENTE)


def configurar_seccion(seccion, numeracion: str = "decimal",
                       reiniciar: bool = True) -> None:
    seccion.page_width = Cm(21)
    seccion.page_height = Cm(29.7)
    seccion.left_margin = Cm(2.5)
    seccion.right_margin = Cm(2.5)
    seccion.top_margin = Cm(2.5)
    seccion.bottom_margin = Cm(2.5)
    seccion.header_distance = Cm(1.25)
    seccion.footer_distance = Cm(1.25)

    sectpr = seccion._sectPr
    for anterior in sectpr.findall(qn("w:pgNumType")):
        sectpr.remove(anterior)
    pgnum = OxmlElement("w:pgNumType")
    pgnum.set(qn("w:fmt"), numeracion)
    if reiniciar:
        pgnum.set(qn("w:start"), "1")
    sectpr.append(pgnum)


def agregar_encabezado(seccion, izquierda: str, derecha: str) -> None:
    seccion.header.is_linked_to_previous = False
    encabezado = seccion.header
    parrafo = encabezado.paragraphs[0]
    parrafo.text = ""
    parrafo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    parrafo.paragraph_format.space_after = Pt(0)
    parrafo.paragraph_format.space_before = Pt(0)
    parrafo.paragraph_format.first_line_indent = Cm(0)
    parrafo.paragraph_format.tab_stops.add_tab_stop(
        Cm(ANCHO_TEXTO_CM), WD_TAB_ALIGNMENT.RIGHT
    )
    run = parrafo.add_run(f"{izquierda.upper()}\t{derecha.upper()}")
    configurar_fuente(run, 9, False, False)
    run.font.color.rgb = NEGRO
    agregar_borde(parrafo, "bottom", 4, 1)


def agregar_pie(seccion, romano: bool = False) -> None:
    seccion.footer.is_linked_to_previous = False
    pie = seccion.footer
    parrafo = pie.paragraphs[0]
    parrafo.text = ""
    parrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    parrafo.paragraph_format.space_before = Pt(0)
    parrafo.paragraph_format.space_after = Pt(0)
    parrafo.paragraph_format.first_line_indent = Cm(0)
    run = parrafo.add_run("Página ")
    configurar_fuente(run, 9)
    agregar_campo_pagina(parrafo, romano)
    agregar_borde(parrafo, "top", 4, 1)


# ---------------------------------------------------------------------------
# Portada e índice
# ---------------------------------------------------------------------------


def parrafo_portada(doc: Document, texto: str, tamano: float, negrita: bool = False,
                    espacio_despues: float = 4, espacio_antes: float = 0,
                    mayusculas: bool = False, interlineado: float = 1.15):
    parrafo = doc.add_paragraph()
    parrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    parrafo.paragraph_format.first_line_indent = Cm(0)
    parrafo.paragraph_format.space_before = Pt(espacio_antes)
    parrafo.paragraph_format.space_after = Pt(espacio_despues)
    parrafo.paragraph_format.line_spacing = interlineado
    run = parrafo.add_run(texto.upper() if mayusculas else texto)
    configurar_fuente(run, tamano, negrita)
    return parrafo


def crear_portada(doc: Document, meta: dict[str, str]) -> None:
    parrafo_portada(doc, "UNIVERSIDAD CÉSAR VALLEJO", 16, True, 4, 18, True)
    parrafo_portada(doc, "FACULTAD DE INGENIERÍA", 13, True, 4, 0, True)
    parrafo_portada(
        doc,
        "ESCUELA PROFESIONAL DE INGENIERÍA DE SISTEMAS",
        12,
        True,
        18,
        0,
        True,
    )
    linea = doc.add_paragraph()
    linea.paragraph_format.space_before = Pt(0)
    linea.paragraph_format.space_after = Pt(26)
    agregar_borde(linea, "bottom", 12, 1)

    parrafo_portada(doc, "FIXTECH", 28, True, 6, 10, True, 1.0)
    parrafo_portada(
        doc,
        "Plataforma web de soporte y mantenimiento tecnológico",
        14,
        False,
        22,
        0,
        False,
        1.15,
    )

    titulo = meta.get("titulo", "Documento del proyecto")
    parrafo_portada(doc, titulo, 22, True, 10, 4, True, 1.1)
    parrafo_portada(
        doc,
        meta.get("tipo", "Documento de cierre").upper(),
        12,
        True,
        4,
        0,
        True,
    )
    parrafo_portada(
        doc,
        f"Código: {meta.get('codigo', 'FIXTECH')}   |   Versión: {meta.get('version', '1.0')}",
        10.5,
        False,
        48,
        0,
    )

    parrafo_portada(doc, "AUTOR", 11, True, 2, 0, True)
    parrafo_portada(doc, meta.get("autor", "Equipo FIXTECH"), 12, False, 14)
    parrafo_portada(doc, "CURSO", 11, True, 2, 0, True)
    parrafo_portada(doc, meta.get("curso", "Calidad de Software"), 12, False, 54)
    parrafo_portada(doc, "PIURA — PERÚ", 12, True, 4, 0, True)
    parrafo_portada(doc, "2026", 12, True, 0, 0, False)


def crear_indice(doc: Document, encabezados: list[Encabezado],
                 paginas: dict[str, str]) -> None:
    titulo = doc.add_paragraph()
    titulo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    titulo.paragraph_format.first_line_indent = Cm(0)
    titulo.paragraph_format.space_before = Pt(0)
    titulo.paragraph_format.space_after = Pt(20)
    run = titulo.add_run("CONTENIDO")
    configurar_fuente(run, 16, True)

    for encabezado in encabezados:
        parrafo = doc.add_paragraph()
        parrafo.paragraph_format.first_line_indent = Cm(0)
        parrafo.paragraph_format.line_spacing = 1.15
        parrafo.paragraph_format.space_after = Pt(3)
        parrafo.paragraph_format.tab_stops.add_tab_stop(
            Cm(ANCHO_TEXTO_CM), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS
        )
        if encabezado.nivel == 1:
            parrafo.paragraph_format.left_indent = Cm(0)
            tamano = 11.5
            negrita = True
        elif encabezado.nivel == 2:
            parrafo.paragraph_format.left_indent = Cm(0.7)
            tamano = 11
            negrita = False
        else:
            parrafo.paragraph_format.left_indent = Cm(1.4)
            tamano = 10.5
            negrita = False
        run = parrafo.add_run(encabezado.texto)
        configurar_fuente(run, tamano, negrita)
        run = parrafo.add_run("\t" + paginas.get(encabezado.texto, "—"))
        configurar_fuente(run, tamano, negrita)


# ---------------------------------------------------------------------------
# Tablas, imágenes y bloques
# ---------------------------------------------------------------------------


def calcular_anchos(cabeceras: list[str], columnas: int) -> list[float]:
    h = [c.lower() for c in cabeceras]
    total = ANCHO_TEXTO_CM
    if columnas == 2:
        return [5.5, 10.5]
    if columnas == 3:
        if any("método" in c for c in h):
            return [3.2, 1.8, 11.0]
        if any("resultado" in c for c in h):
            return [4.0, 8.0, 4.0]
        if any("ruta" in c for c in h):
            return [3.2, 1.8, 11.0]
        return [5.0, 5.5, 5.5]
    if columnas == 4:
        if h and h[0].startswith("n."):
            return [1.5, 6.7, 5.3, 2.5]
        if any("descripción" in c for c in h):
            return [3.8, 2.2, 4.0, 6.0]
        return [4.0, 4.0, 4.0, 4.0]
    if columnas == 5:
        if h and h[0].startswith("n."):
            return [1.0, 5.5, 4.5, 2.5, 2.5]
        return [3.2, 3.2, 3.2, 3.2, 3.2]
    if columnas == 6:
        return [2.6, 2.6, 2.6, 2.6, 2.6, 3.0]
    return [total / columnas] * columnas


def agregar_bordes_tabla(tabla) -> None:
    tblpr = tabla._tbl.tblPr
    for anterior in tblpr.findall(qn("w:tblBorders")):
        tblpr.remove(anterior)
    bordes = OxmlElement("w:tblBorders")
    for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
        borde = OxmlElement(f"w:{lado}")
        borde.set(qn("w:val"), "single")
        borde.set(qn("w:sz"), "8" if lado in ("top", "left", "bottom", "right") else "4")
        borde.set(qn("w:space"), "0")
        borde.set(qn("w:color"), "000000")
        bordes.append(borde)
    tblpr.append(bordes)


def agregar_margenes_celda(celda) -> None:
    tcpr = celda._tc.get_or_add_tcPr()
    for anterior in tcpr.findall(qn("w:tcMar")):
        tcpr.remove(anterior)
    margenes = OxmlElement("w:tcMar")
    for lado, valor in (("top", "30"), ("left", "80"), ("bottom", "30"), ("right", "80")):
        elemento = OxmlElement(f"w:{lado}")
        elemento.set(qn("w:w"), valor)
        elemento.set(qn("w:type"), "dxa")
        margenes.append(elemento)
    tcpr.append(margenes)


def agregar_tabla(doc: Document, bloque: Bloque) -> None:
    filas = bloque.filas
    if not filas:
        return
    columnas = len(filas[0])
    tabla = doc.add_table(rows=len(filas), cols=columnas)
    tabla.style = "Table Grid"
    tabla.alignment = WD_TABLE_ALIGNMENT.CENTER
    tabla.autofit = False

    anchos = calcular_anchos(filas[0], columnas)
    for indice, ancho in enumerate(anchos):
        tabla.columns[indice].width = Cm(ancho)

    tamano = 10.0
    if len(filas) > 30:
        tamano = 8.5
    elif len(filas) > 15:
        tamano = 9.0

    for indice_fila, fila in enumerate(filas):
        for indice_columna, texto in enumerate(fila):
            celda = tabla.cell(indice_fila, indice_columna)
            celda.width = Cm(anchos[indice_columna])
            celda.vertical_alignment = (
                WD_ALIGN_VERTICAL.CENTER if indice_fila == 0 else WD_ALIGN_VERTICAL.TOP
            )
            agregar_margenes_celda(celda)
            parrafo = celda.paragraphs[0]
            parrafo.text = ""
            parrafo.paragraph_format.space_before = Pt(0)
            parrafo.paragraph_format.space_after = Pt(0)
            parrafo.paragraph_format.line_spacing = 1.0
            parrafo.paragraph_format.first_line_indent = Cm(0)
            if indice_fila == 0:
                parrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                alineacion = bloque.alineaciones[indice_columna]
                if alineacion == "center":
                    parrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
                elif alineacion == "right":
                    parrafo.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                elif indice_columna == 0 and filas[0][0].lower().startswith("n."):
                    parrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    parrafo.alignment = WD_ALIGN_PARAGRAPH.LEFT
            agregar_texto_con_formato(
                parrafo,
                texto,
                tamano,
                negrita=(indice_fila == 0),
                fuente=FUENTE,
            )

    # Repetir encabezado y evitar cortes de fila.
    for indice_fila, fila in enumerate(tabla.rows):
        trpr = fila._tr.get_or_add_trPr()
        cant = OxmlElement("w:cantSplit")
        trpr.append(cant)
        if indice_fila == 0:
            encabezado = OxmlElement("w:tblHeader")
            encabezado.set(qn("w:val"), "true")
            trpr.append(encabezado)

    agregar_bordes_tabla(tabla)

    separador = doc.add_paragraph()
    separador.paragraph_format.space_before = Pt(0)
    separador.paragraph_format.space_after = Pt(6)
    separador.paragraph_format.first_line_indent = Cm(0)
    separador.paragraph_format.line_spacing = 1.0


def agregar_imagen(doc: Document, bloque: Bloque) -> None:
    ruta = Path(bloque.ruta)
    if not ruta.exists():
        print(f"  AVISO: no existe la imagen {ruta}")
        return
    parrafo = doc.add_paragraph()
    parrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    parrafo.paragraph_format.first_line_indent = Cm(0)
    parrafo.paragraph_format.space_before = Pt(6)
    parrafo.paragraph_format.space_after = Pt(2)
    run = parrafo.add_run()
    run.add_picture(str(ruta), width=Cm(15.5))

    caption = doc.add_paragraph()
    caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption.paragraph_format.first_line_indent = Cm(0)
    caption.paragraph_format.space_before = Pt(2)
    caption.paragraph_format.space_after = Pt(0)
    caption.paragraph_format.line_spacing = 1.0
    run = caption.add_run(bloque.caption)
    configurar_fuente(run, 10, True)

    fuente = doc.add_paragraph()
    fuente.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fuente.paragraph_format.first_line_indent = Cm(0)
    fuente.paragraph_format.space_before = Pt(0)
    fuente.paragraph_format.space_after = Pt(12)
    fuente.paragraph_format.line_spacing = 1.0
    run = fuente.add_run("Fuente: elaboración propia.")
    configurar_fuente(run, 9, False, True)


def agregar_codigo(doc: Document, bloque: Bloque) -> None:
    parrafo = doc.add_paragraph()
    parrafo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    parrafo.paragraph_format.first_line_indent = Cm(0)
    parrafo.paragraph_format.left_indent = Cm(0.75)
    parrafo.paragraph_format.right_indent = Cm(0.5)
    parrafo.paragraph_format.space_before = Pt(6)
    parrafo.paragraph_format.space_after = Pt(8)
    parrafo.paragraph_format.line_spacing = 1.0
    parrafo.paragraph_format.keep_together = True
    agregar_borde(parrafo, "left", 8, 6)
    for indice, linea in enumerate(bloque.lineas):
        if indice:
            parrafo.add_run().add_break()
        run = parrafo.add_run(linea if linea else " ")
        configurar_fuente(run, 9, False, False, FUENTE_CODIGO)


def agregar_cita(doc: Document, bloque: Bloque) -> None:
    parrafo = doc.add_paragraph()
    parrafo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    parrafo.paragraph_format.first_line_indent = Cm(0)
    parrafo.paragraph_format.left_indent = Cm(0.75)
    parrafo.paragraph_format.right_indent = Cm(0.75)
    parrafo.paragraph_format.space_before = Pt(4)
    parrafo.paragraph_format.space_after = Pt(8)
    parrafo.paragraph_format.line_spacing = 1.15
    agregar_borde(parrafo, "left", 8, 6)
    agregar_texto_con_formato(parrafo, bloque.texto, 11, False, True)


def agregar_parrafo(doc: Document, bloque: Bloque) -> None:
    parrafo = doc.add_paragraph()
    agregar_texto_con_formato(parrafo, bloque.texto)


def agregar_vineta(doc: Document, bloque: Bloque) -> None:
    parrafo = doc.add_paragraph()
    parrafo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    sangria = 0.75 + bloque.sangria * 0.6
    parrafo.paragraph_format.left_indent = Cm(sangria)
    parrafo.paragraph_format.first_line_indent = Cm(-0.4)
    parrafo.paragraph_format.space_after = Pt(3)
    parrafo.paragraph_format.line_spacing = 1.5
    parrafo.paragraph_format.tab_stops.add_tab_stop(Cm(sangria), WD_TAB_ALIGNMENT.LEFT)
    run = parrafo.add_run("•\t")
    configurar_fuente(run, 12)
    agregar_texto_con_formato(parrafo, bloque.texto, 12)


def agregar_numerada(doc: Document, bloque: Bloque) -> None:
    parrafo = doc.add_paragraph()
    parrafo.alignment = WD_ALIGN_PARAGRAPH.LEFT
    parrafo.paragraph_format.left_indent = Cm(1.0)
    parrafo.paragraph_format.first_line_indent = Cm(-0.5)
    parrafo.paragraph_format.space_after = Pt(3)
    parrafo.paragraph_format.line_spacing = 1.5
    parrafo.paragraph_format.tab_stops.add_tab_stop(Cm(1.0), WD_TAB_ALIGNMENT.LEFT)
    run = parrafo.add_run(f"{bloque.numero}.\t")
    configurar_fuente(run, 12)
    agregar_texto_con_formato(parrafo, bloque.texto, 12)


def crear_cuerpo(doc: Document, bloques: list[Bloque]) -> None:
    primer_encabezado = True
    for bloque in bloques:
        if bloque.tipo == "encabezado":
            parrafo = doc.add_paragraph(style=f"Heading {bloque.nivel}")
            if bloque.nivel == 1 and not primer_encabezado:
                parrafo.paragraph_format.page_break_before = True
            run = parrafo.add_run(bloque.texto)
            configurar_fuente(
                run,
                {1: 16, 2: 14, 3: 12.5}.get(bloque.nivel, 12),
                True,
            )
            if bloque.nivel == 1:
                primer_encabezado = False
        elif bloque.tipo == "parrafo":
            agregar_parrafo(doc, bloque)
        elif bloque.tipo == "vineta":
            agregar_vineta(doc, bloque)
        elif bloque.tipo == "numerada":
            agregar_numerada(doc, bloque)
        elif bloque.tipo == "tabla":
            agregar_tabla(doc, bloque)
        elif bloque.tipo == "imagen":
            agregar_imagen(doc, bloque)
        elif bloque.tipo == "codigo":
            agregar_codigo(doc, bloque)
        elif bloque.tipo == "cita":
            agregar_cita(doc, bloque)
        elif bloque.tipo == "pagebreak":
            doc.add_page_break()


# ---------------------------------------------------------------------------
# Construcción y cálculo de páginas
# ---------------------------------------------------------------------------


def construir_documento(meta: dict[str, str], bloques: list[Bloque],
                        paginas: dict[str, str]) -> Document:
    doc = Document()
    configurar_estilos(doc)

    propiedades = doc.core_properties
    propiedades.title = f"FIXTECH - {meta.get('titulo', 'Documento de cierre')}"
    propiedades.subject = meta.get("subtitulo", "Proyecto FIXTECH")
    propiedades.author = meta.get("autor", "Equipo FIXTECH")
    propiedades.last_modified_by = meta.get("autor", "Equipo FIXTECH")
    propiedades.category = meta.get("tipo", "Documento de cierre")
    propiedades.comments = (
        f"Código {meta.get('codigo', 'FIXTECH')} | Versión {meta.get('version', '1.0')}"
    )
    propiedades.keywords = "FIXTECH, calidad, Angular, Spring Boot, despliegue"

    seccion_portada = doc.sections[0]
    configurar_seccion(seccion_portada, "decimal", True)
    crear_portada(doc, meta)

    seccion_indice = doc.add_section(WD_SECTION.NEW_PAGE)
    configurar_seccion(seccion_indice, "lowerRoman", True)
    agregar_encabezado(seccion_indice, "FIXTECH", "Contenido")
    agregar_pie(seccion_indice, romano=True)
    encabezados = [
        Encabezado(b.texto, b.nivel) for b in bloques if b.tipo == "encabezado"
    ]
    crear_indice(doc, encabezados, paginas)

    seccion_cuerpo = doc.add_section(WD_SECTION.NEW_PAGE)
    configurar_seccion(seccion_cuerpo, "decimal", True)
    titulo_corto = meta.get("titulo", "Documento")
    if len(titulo_corto) > 44:
        titulo_corto = titulo_corto[:41] + "..."
    agregar_encabezado(seccion_cuerpo, f"FIXTECH — {titulo_corto}", "2026")
    agregar_pie(seccion_cuerpo, romano=False)
    crear_cuerpo(doc, bloques)

    return doc


def convertir_pdf(docx: Path, directorio: Path) -> Path:
    perfil = Path(tempfile.mkdtemp(prefix="lo-profile-", dir=str(directorio)))
    comando = [
        "libreoffice",
        "--headless",
        "--norestore",
        f"-env:UserInstallation=file://{perfil}",
        "--convert-to",
        "pdf",
        "--outdir",
        str(directorio),
        str(docx),
    ]
    resultado = subprocess.run(
        comando, capture_output=True, text=True, timeout=240, check=False
    )
    if resultado.returncode != 0:
        raise RuntimeError(
            f"LibreOffice falló al convertir {docx.name}: {resultado.stderr}"
        )
    pdf = directorio / f"{docx.stem}.pdf"
    if not pdf.exists():
        raise RuntimeError(f"No se generó el PDF de {docx.name}")
    return pdf


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFC", texto)
    texto = texto.replace("\u00a0", " ")
    texto = texto.replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", texto).strip()


def extraer_paginas(pdf: Path, encabezados: list[Encabezado]) -> dict[str, str]:
    resultado = subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        capture_output=True,
        text=True,
        check=True,
    )
    paginas = resultado.stdout.split("\f")
    if paginas and not paginas[-1].strip():
        paginas.pop()
    lineas = [
        [normalizar(linea) for linea in pagina.splitlines() if linea.strip()]
        for pagina in paginas
    ]
    if not encabezados:
        return {}

    primer_titulo = normalizar(encabezados[0].texto)
    inicio_cuerpo = None
    for indice, contenido in enumerate(lineas):
        if primer_titulo in contenido:
            inicio_cuerpo = indice
            break
    if inicio_cuerpo is None:
        inicio_cuerpo = 0

    paginas_indice: dict[str, str] = {}
    ultima = 1
    for encabezado in encabezados:
        objetivo = normalizar(encabezado.texto)
        encontrada = None
        for indice in range(inicio_cuerpo, len(lineas)):
            if objetivo in lineas[indice]:
                encontrada = indice
                break
        if encontrada is None:
            prefijo = objetivo[:36]
            for indice in range(inicio_cuerpo, len(lineas)):
                if any(linea.startswith(prefijo) for linea in lineas[indice]):
                    encontrada = indice
                    break
        if encontrada is not None:
            ultima = encontrada - inicio_cuerpo + 1
        paginas_indice[encabezado.texto] = str(ultima)
    return paginas_indice


def generar_documento(ruta_md: Path) -> tuple[Path, int]:
    print(f"\n=== {ruta_md.name} ===")
    meta, bloques = cargar_documento(ruta_md)
    encabezados = [Encabezado(b.texto, b.nivel) for b in bloques if b.tipo == "encabezado"]
    if not encabezados:
        raise RuntimeError(f"{ruta_md.name} no tiene encabezados para el índice")
    print(f"  Bloques: {len(bloques)} | Encabezados: {len(encabezados)}")

    paginas: dict[str, str] = {e.texto: "—" for e in encabezados}
    docx_final = SALIDA / f"{ruta_md.stem}.docx"
    pdf_final = TEMPORAL / f"{ruta_md.stem}.pdf"

    for intento in range(1, 4):
        doc = construir_documento(meta, bloques, paginas)
        doc.save(docx_final)
        pdf = convertir_pdf(docx_final, TEMPORAL)
        nuevas = extraer_paginas(pdf, encabezados)
        print(f"  Pasada {intento}: páginas calculadas para {len(nuevas)} encabezados")
        if nuevas == paginas:
            break
        paginas = nuevas

    # Guardar la versión final con el último mapa de páginas.
    doc = construir_documento(meta, bloques, paginas)
    doc.save(docx_final)
    pdf = convertir_pdf(docx_final, TEMPORAL)
    pdf_final = pdf

    cantidad_paginas = subprocess.run(
        ["pdfinfo", str(pdf_final)], capture_output=True, text=True, check=True
    ).stdout
    paginas_totales = 0
    for linea in cantidad_paginas.splitlines():
        if linea.startswith("Pages:"):
            paginas_totales = int(linea.split(":", 1)[1].strip())
            break
    print(f"  Generado: {docx_final} ({paginas_totales} páginas)")
    return docx_final, paginas_totales


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera los documentos Word de FIXTECH")
    parser.add_argument(
        "--solo",
        help="Genera solo los documentos cuyo nombre empiece por el prefijo indicado",
    )
    args = parser.parse_args()

    SALIDA.mkdir(parents=True, exist_ok=True)
    TEMPORAL.mkdir(parents=True, exist_ok=True)

    if shutil.which("libreoffice") is None or shutil.which("pdftotext") is None:
        print("Error: se requieren libreoffice y pdftotext para calcular el índice.")
        return 1

    seleccionados = [
        ENTRADA / nombre
        for nombre in DOCUMENTOS
        if not args.solo or nombre.startswith(args.solo)
    ]
    if not seleccionados:
        print(f"No hay documentos que empiecen por {args.solo!r}.")
        return 1

    resultados: list[tuple[Path, int]] = []
    for ruta in seleccionados:
        resultados.append(generar_documento(ruta))

    print("\nResumen:")
    for ruta, paginas in resultados:
        print(f"  {ruta.name}: {paginas} páginas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
