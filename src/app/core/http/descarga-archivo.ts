export function nombreArchivoDesdeContentDisposition(cabecera: string | null): string | null {
  if (cabecera === null || cabecera.trim() === '') {
    return null;
  }
  const extendido = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(cabecera);
  if (extendido !== null) {
    return decodificarNombre(extendido[1]);
  }
  const simple = /filename\s*=\s*("([^"]+)"|([^;]+))/i.exec(cabecera);
  if (simple === null) {
    return null;
  }
  return decodificarNombre(simple[2] ?? simple[3]);
}

export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function decodificarNombre(valor: string): string | null {
  const nombre = valor.trim().replace(/^"|"$/g, '');
  if (nombre === '') {
    return null;
  }
  try {
    return decodeURIComponent(nombre);
  } catch {
    return nombre;
  }
}
