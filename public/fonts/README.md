# Fuentes autoalojadas

Estos archivos se sirven desde el propio frontend para que el build y la aplicación no dependan de
Google Fonts. Ambas familias se distribuyen bajo la licencia Apache 2.0.

## Archivos

| Archivo                           | Familia                   | Origen                                                      | Uso                                                                |
| --------------------------------- | ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `roboto-latin.woff2`              | Roboto v51 (variable)     | `https://fonts.gstatic.com/s/roboto/v51/`                   | Texto de la interfaz; eje `wght` de 100 a 900, subconjunto latino. |
| `material-symbols-outlined.woff2` | Material Symbols Outlined | `https://fonts.gstatic.com/s/materialsymbolsoutlined/v382/` | Iconos de `mat-icon`; subconjunto de 133 iconos usados por la SPA. |

## Regeneración del subconjunto de iconos

El subconjunto se generó con la API de Google Fonts limitando `icon_names` a los iconos
referenciados en las plantillas (`<mat-icon>`) y en las listas de TypeScript. La petición usó los
ejes variables `opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200` para conservar el relleno de las
estrellas y los pesos de los iconos.

Si se agrega un icono nuevo:

1. Añadir su nombre a la lista de `icon_names` y solicitar el CSS con un `User-Agent` de navegador
   moderno.
2. Descargar el `woff2` apuntado por el `@font-face` y reemplazar
   `material-symbols-outlined.woff2`.
3. Verificar que el icono se ve en la pantalla correspondiente y ejecutar la suite E2E.

Los iconos que no estén en el subconjunto se muestran como texto (ligadura sin glifo), por lo que
conviene revisar la lista al incorporar pantallas nuevas.
