# Sistema visual FIXTECH

## Entrega 0 — Base compartida

- Logo único: `BrandLogo` (`app-brand`), engranaje + herramienta y FIX/TECH bicolor.
  Se comparte entre landing, autenticación y layout de los tres roles.
- `compacta` omite el subtítulo. Tamaños mediante `--ft-brand-icon-size` y
  `--ft-brand-text-size`; no duplicar el logotipo dentro de páginas.
- Iconos: Material Symbols Outlined, peso 400, fuente completa local
  `public/fonts/fixtech-symbols.woff2` (Apache 2.0). Incluye los iconos de la landing
  y los de los módulos internos. Usar `mat-icon` con su nombre oficial.
  Los iconos decorativos quedan ocultos a lectores; los botones de solo icono
  necesitan un `aria-label` descriptivo.
- Tipografía: Roboto local, misma familia en Material y landing.
- Tokens compartidos: `src/styles.scss`, familia `--ft-*`.
  Azul principal `#0865D9`, marino `#062657`, fondo `#F6FAFF`, naranja `#FF6900`.
  Naranja brillante con texto oscuro; naranja oscuro para texto blanco.
- Material: tema azul con overrides públicos, sin sobrescribir clases internas
  de controles. Tailwind continúa limitado a la landing, sin preflight.
- Componentes existentes: `EstadoBadge`, `BrandLogo`, alertas `ft-alert`, tarjetas
  `ft-card`, contenedores `ft-container` y `ft-page`.
- Utilidades para las siguientes entregas: `ft-page-heading`, `ft-action-accent`,
  escala de espacios `--ft-space-*`. Estados funcionales conservan sus colores
  semánticos; no convertir acciones destructivas a naranja.
- Foco visible y reducción de movimiento compartidos. Navegación móvil existente
  de Material conservada; comprobar cada rediseño a 360, 768 y 1440 px.

## Secuencia de entregas

### Entrega 1 — Autenticación implementada

- Login, registro de cliente, registro de técnico y recuperación comparten
  `AuthPresentacion` y el mixin SCSS `auth.pantalla`.
- Presentación azul con fotografía local en escritorio; resumen compacto en móvil.
- Formularios Material con bordes redondeados, jerarquía de encabezados y acciones
  coherentes. Registro técnico agrupado por secciones; progreso OTP destacado.
- Se mantienen la validación, los contratos HTTP, el retorno tras login, los
  estados de sesión, el registro y los tres pasos de recuperación existentes.
- Comprobadas las cuatro rutas a 1440 y 360 px: sin overflow ni infracciones Axe.

### Próximas entregas

1. Autenticación: completada en la entrega descrita arriba.
2. Cliente (en curso): dashboard con conteos reales de solicitudes y servicios,
   estados de carga/error con reintentos, accesos directos y cabeceras visuales
   en lista/formulario/detalle de solicitudes y lista de servicios. Quedan por revisar
   ofertas, detalle de servicios, perfil y notificaciones.
3. Técnico: dashboard, oportunidades, ofertas, ejecución, comisiones y perfil.
4. Administrador: dashboard, gestión, reportes, auditoría y configuración.

Cada entrega: verificar contratos existentes, capturas desktop/móvil, Axe,
flujos afectados, lint, formato y build. No usar métricas ficticias en paneles.
La base no implica que los rediseños de estas fases ya estén completos.
