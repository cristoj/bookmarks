/**
 * Utilidades de autenticación para Cloud Functions
 */

import {CallableRequest, HttpsError} from "firebase-functions/v2/https";

/**
 * Verifica que el usuario esté autenticado en una Cloud Function
 *
 * @param request - El contexto de la llamada de la función
 * @returns El userId del usuario autenticado
 * @throws HttpsError si el usuario no está autenticado
 */
export function verifyAuth(request: CallableRequest): string {
  // Verificar que el usuario esté autenticado
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Debes estar autenticado para realizar esta acción"
    );
  }

  // Retornar el userId
  return request.auth.uid;
}
