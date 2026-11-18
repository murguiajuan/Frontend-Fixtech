export interface ServicioLanding {
  id: number;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  categoria: string;
}

export interface ClienteLanding {
  id: number;
  nombre: string;
  foto: string;
}

export interface ResenaLanding {
  id: number;
  cliente: ClienteLanding;
  texto: string;
  servicio: string;
}

export const CATEGORIAS = [
  'mantenimiento pc laptop',
  'hardware pantalla disco',
  'limpieza optimizacion',
  'virus seguridad',
  'remoto soporte',
  'software instalacion',
] as const;

export const SERVICIOS: readonly ServicioLanding[] = [
  {
    id: 1,
    titulo: 'Mantenimiento Preventivo',
    descripcion: 'Mejora el rendimiento de tu equipo.',
    icono: 'desktop_windows',
    color: 'azul',
    categoria: CATEGORIAS[0],
  },
  {
    id: 2,
    titulo: 'Reparación de Hardware',
    descripcion: 'Pantallas, discos, puertos y más.',
    icono: 'memory',
    color: 'celeste',
    categoria: CATEGORIAS[1],
  },
  {
    id: 3,
    titulo: 'Limpieza y Optimización',
    descripcion: 'Equipos más rápidos y estables.',
    icono: 'cleaning_services',
    color: 'naranja',
    categoria: CATEGORIAS[2],
  },
  {
    id: 4,
    titulo: 'Eliminación de Virus',
    descripcion: 'Seguridad y protección de tus datos.',
    icono: 'verified_user',
    color: 'morado',
    categoria: CATEGORIAS[3],
  },
  {
    id: 5,
    titulo: 'Soporte Remoto',
    descripcion: 'Solución rápida desde donde estés.',
    icono: 'headset_mic',
    color: 'verde',
    categoria: CATEGORIAS[4],
  },
  {
    id: 6,
    titulo: 'Instalación de Software',
    descripcion: 'Sistemas, programas y configuraciones.',
    icono: 'settings_applications',
    color: 'marino',
    categoria: CATEGORIAS[5],
  },
];

export const CLIENTES: readonly ClienteLanding[] = [
  { id: 1, nombre: 'Carlos M.', foto: '/images/landing/cliente.webp' },
  { id: 2, nombre: 'Diego R.', foto: '/images/landing/cliente.webp' },
  { id: 3, nombre: 'Luis A.', foto: '/images/landing/cliente.webp' },
];

export const RESENAS: readonly ResenaLanding[] = [
  {
    id: 1,
    cliente: CLIENTES[0],
    texto:
      'Mi laptop volvió a funcionar como nueva. Una atención clara, rápida y profesional. ¡Muy recomendado!',
    servicio: 'Mantenimiento de laptop',
  },
  {
    id: 2,
    cliente: CLIENTES[1],
    texto:
      'Me explicaron el problema de la pantalla y el presupuesto antes de empezar. Una experiencia muy sencilla.',
    servicio: 'Reparación de hardware',
  },
  {
    id: 3,
    cliente: CLIENTES[2],
    texto:
      'Pude coordinar la revisión de mi PC sin complicaciones y consultar los avances del servicio.',
    servicio: 'Diagnóstico de PC',
  },
];

export const TECNICOS: readonly {
  id: number;
  nombre: string;
  especialidad: string;
  foto: string;
}[] = [
  { id: 1, nombre: 'Juan P.', especialidad: 'PC y laptops', foto: '/images/landing/tecnico.webp' },
];

export const BENEFICIOS: readonly { icono: string; titulo: string; detalle: string }[] = [
  { icono: 'bolt', titulo: 'Servicio rápido', detalle: 'Solicita en minutos' },
  { icono: 'verified_user', titulo: 'Técnicos verificados', detalle: 'Revisión administrativa' },
  { icono: 'receipt_long', titulo: 'Precios claros', detalle: 'Compara propuestas' },
];

export const PASOS: readonly { icono: string; titulo: string; detalle: string }[] = [
  { icono: 'edit_note', titulo: 'Describe tu problema', detalle: 'Cuéntanos qué necesitas.' },
  { icono: 'badge', titulo: 'Elige tu técnico', detalle: 'Compara las propuestas.' },
  { icono: 'calendar_month', titulo: 'Coordina tu servicio', detalle: 'Acuerda los detalles.' },
  { icono: 'laptop_mac', titulo: 'Disfruta tu equipo', detalle: 'Confirma y califica.' },
];
