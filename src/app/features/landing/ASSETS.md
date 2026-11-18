# Referencia visual y assets

Referencia: `/home/juan/Descargas/principalweb.jpeg`, proporcionada por el usuario.
Los WebP locales en `public/images/landing` son recortes de la zona fotográfica
de esa referencia (no se utiliza la captura completa como fondo). La interfaz,
textos, tarjetas e iconos se renderizan como HTML y Material Symbols locales.
No se añaden fotografías de terceros descargadas ni peticiones externas.
Los iconos usan ahora la fuente compartida completa `public/fonts/fixtech-symbols.woff2`
(Material Symbols Outlined, Google Fonts, Apache 2.0). La licencia está incluida
en el directorio de assets. El antiguo subconjunto `icons.ttf` queda sin uso.

Los retratos son ilustrativos, no representan usuarios reales de FIXTECH.
Servicios, reseñas, técnicos y clientes de `landing.data.ts` son demostrativos.
Los CTA abren el flujo existente de solicitudes; el guard conserva el returnUrl.
El buscador filtra el catálogo local y no consulta endpoints inexistentes.

Adaptaciones: se ordenan las tarjetas y el proceso inferior para evitar el
solapamiento de la captura; colores de tarjetas y botones oscurecidos para
contraste AA; pasos ajustados al flujo existente de ofertas y coordinación.
No se muestran enlaces Blog/Contacto porque no aparecen en la referencia ni
existen rutas correspondientes. No se afirma verificación de clientes mock.
