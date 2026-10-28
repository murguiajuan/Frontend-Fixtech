#!/usr/bin/env python3
"""Calcula los hashes CSP de los scripts inline de un index.html de Angular.

Uso:
    python3 deploy/calcular-csp-hash.py dist/fixtech-frontend/browser/index.html

Angular inserta un script inline para activar el CSS crítico. La política CSP
de Nginx debe incluir su hash en `script-src`; de lo contrario el navegador
bloquea el script y la hoja de estilos principal no se activa.
"""

from __future__ import annotations

import base64
import hashlib
import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: python3 deploy/calcular-csp-hash.py <ruta/index.html>", file=sys.stderr)
        return 2

    html = Path(sys.argv[1]).read_text(encoding="utf-8")
    scripts = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", html, re.DOTALL)
    if not scripts:
        print("No se encontraron scripts inline.", file=sys.stderr)
        return 1

    hashes = []
    for script in scripts:
        digest = hashlib.sha256(script.encode("utf-8")).digest()
        hashes.append("'sha256-" + base64.b64encode(digest).decode("ascii") + "'")

    print("script-src 'self' " + " ".join(hashes))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
