import { HttpContextToken } from '@angular/common/http';

/**
 * Evita que el interceptor global muestre una notificación para peticiones
 * silenciosas, como el refresco periódico del contador de notificaciones.
 */
export const SILENCIAR_ERROR = new HttpContextToken<boolean>(() => false);
