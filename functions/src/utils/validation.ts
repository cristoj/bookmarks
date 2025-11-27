/**
 * Utilidades de validación para Cloud Functions
 */

import {HttpsError} from "firebase-functions/v2/https";

/**
 * Expresión regular para validar URLs
 * Permite http, https y protocolos comunes
 */
// eslint-disable-next-line max-len
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * Valida que una URL sea válida
 *
 * @param {string} url - La URL a validar
 * @return {void}
 * @throws {HttpsError} si la URL no es válida
 */
export function validateUrl(url: string): void {
  if (!url || typeof url !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "La URL es requerida y debe ser una cadena de texto"
    );
  }

  if (!URL_REGEX.test(url)) {
    throw new HttpsError(
      "invalid-argument",
      "La URL proporcionada no es válida"
    );
  }

  // Validar longitud máxima
  if (url.length > 2048) {
    throw new HttpsError(
      "invalid-argument",
      "La URL es demasiado larga (máximo 2048 caracteres)"
    );
  }
}

/**
 * Interface para los datos de un bookmark
 */
export interface BookmarkData {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  folderId?: string;
}

/**
 * Valida los datos de un bookmark
 *
 * @param {BookmarkData} data - Los datos del bookmark a validar
 * @return {void}
 * @throws {HttpsError} si los datos no son válidos
 */
export function validateBookmarkData(data: BookmarkData): void {
  // Validar que data sea un objeto
  if (!data || typeof data !== "object") {
    throw new HttpsError(
      "invalid-argument",
      "Los datos del bookmark deben ser un objeto"
    );
  }

  // Validar URL (requerida)
  validateUrl(data.url);

  // Validar título (opcional, pero si existe debe ser string)
  if (data.title !== undefined) {
    if (typeof data.title !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "El título debe ser una cadena de texto"
      );
    }
    if (data.title.length > 500) {
      throw new HttpsError(
        "invalid-argument",
        "El título es demasiado largo (máximo 500 caracteres)"
      );
    }
  }

  // Validar descripción (opcional, pero si existe debe ser string)
  if (data.description !== undefined) {
    if (typeof data.description !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "La descripción debe ser una cadena de texto"
      );
    }
    if (data.description.length > 2000) {
      throw new HttpsError(
        "invalid-argument",
        "La descripción es demasiado larga (máximo 2000 caracteres)"
      );
    }
  }

  // Validar tags (opcional, pero si existe debe ser array de strings)
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      throw new HttpsError(
        "invalid-argument",
        "Las etiquetas deben ser un array"
      );
    }
    if (data.tags.length > 20) {
      throw new HttpsError(
        "invalid-argument",
        "Demasiadas etiquetas (máximo 20)"
      );
    }
    for (const tag of data.tags) {
      if (typeof tag !== "string") {
        throw new HttpsError(
          "invalid-argument",
          "Cada etiqueta debe ser una cadena de texto"
        );
      }
      if (tag.length > 50) {
        throw new HttpsError(
          "invalid-argument",
          "Una etiqueta es demasiado larga (máximo 50 caracteres)"
        );
      }
    }
  }

  // Validar folderId (opcional, pero si existe debe ser string)
  if (data.folderId !== undefined) {
    if (typeof data.folderId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "El ID de carpeta debe ser una cadena de texto"
      );
    }
    if (data.folderId.length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "El ID de carpeta no puede estar vacío"
      );
    }
  }
}
