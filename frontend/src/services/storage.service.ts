/**
 * Storage Service
 *
 * Service layer for interacting with Firebase Storage.
 * Handles screenshot image uploads and deletions.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { auth } from './firebase';

/**
 * Custom error class for storage service errors
 */
export class StorageServiceError extends Error {
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'StorageServiceError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates that a file is an image and under 10MB
 *
 * @param file - The file to validate
 * @throws StorageServiceError if validation fails
 */
function validateImageFile(file: File): void {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    throw new StorageServiceError(
      'El archivo debe ser una imagen',
      'invalid-file-type'
    );
  }

  // Check size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new StorageServiceError(
      'La imagen es demasiado grande (máximo 10MB)',
      'file-too-large'
    );
  }
}

/**
 * Uploads a screenshot image to Firebase Storage
 *
 * Uploads the image to the path: screenshots/{userId}/{timestamp}_{filename}
 * The file is validated before upload (must be image, under 10MB)
 *
 * @param file - The image file to upload
 * @param bookmarkId - Optional bookmark ID to include in filename
 * @returns The download URL of the uploaded image
 * @throws StorageServiceError if user is not authenticated or upload fails
 *
 * @example
 * ```typescript
 * const file = document.getElementById('imageInput').files[0];
 * const url = await storageService.uploadScreenshot(file, 'bookmark-123');
 * console.log('Image uploaded:', url);
 * ```
 */
export async function uploadScreenshot(
  file: File,
  bookmarkId?: string
): Promise<string> {
  try {
    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      throw new StorageServiceError(
        'Debes iniciar sesión para subir imágenes',
        'unauthenticated'
      );
    }

    // Validate file
    validateImageFile(file);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = bookmarkId
      ? `${bookmarkId}_${timestamp}.${fileExtension}`
      : `${timestamp}.${fileExtension}`;

    // Create storage reference
    const storagePath = `screenshots/${user.uid}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error: unknown) {
    if (error instanceof StorageServiceError) {
      throw error;
    }

    const err = error as { message?: string; code?: string };
    throw new StorageServiceError(
      err.message || 'Error al subir la imagen',
      err.code,
      error
    );
  }
}

/**
 * Deletes a screenshot from Firebase Storage
 *
 * Extracts the storage path from the download URL and deletes the file
 *
 * @param downloadUrl - The download URL of the screenshot to delete
 * @throws StorageServiceError if user is not authenticated or deletion fails
 *
 * @example
 * ```typescript
 * await storageService.deleteScreenshot('https://firebasestorage.googleapis.com/...');
 * console.log('Screenshot deleted');
 * ```
 */
export async function deleteScreenshot(downloadUrl: string): Promise<void> {
  try {
    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      throw new StorageServiceError(
        'Debes iniciar sesión para eliminar imágenes',
        'unauthenticated'
      );
    }

    // Extract path from URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media...
    const urlParts = downloadUrl.split('/o/');
    if (urlParts.length < 2) {
      throw new StorageServiceError(
        'URL de imagen inválida',
        'invalid-url'
      );
    }

    const pathEncoded = urlParts[1].split('?')[0];
    const path = decodeURIComponent(pathEncoded);

    // Verify path belongs to current user
    if (!path.startsWith(`screenshots/${user.uid}/`)) {
      throw new StorageServiceError(
        'No tienes permiso para eliminar esta imagen',
        'permission-denied'
      );
    }

    // Delete file
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error: unknown) {
    if (error instanceof StorageServiceError) {
      throw error;
    }

    const err = error as { message?: string; code?: string };
    throw new StorageServiceError(
      err.message || 'Error al eliminar la imagen',
      err.code,
      error
    );
  }
}

/**
 * Default export with all service functions
 */
export default {
  uploadScreenshot,
  deleteScreenshot,
};
