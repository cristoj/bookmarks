/**
 * Bookmarks Service
 *
 * Service layer for interacting with bookmark-related Cloud Functions.
 * Handles all CRUD operations for bookmarks and tag management.
 */

import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Interface for bookmark data
 */
export interface BookmarkData {
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  folderId?: string;
}

/**
 * Interface for a bookmark item
 */
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  folderId: string | null;
  screenshotUrl: string | null;
  screenshotStatus: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for filters when getting bookmarks
 */
export interface BookmarkFilters {
  limit?: number;
  lastDocId?: string;
  tags?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  folderId?: string;
}

/**
 * Interface for the response from getAll
 */
export interface GetBookmarksResponse {
  data: Bookmark[];
  lastDocId: string | null;
  hasMore: boolean;
}

/**
 * Interface for a tag
 */
export interface Tag {
  name: string;
  count: number;
  updatedAt: string;
}

/**
 * Interface for successful operation response
 */
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

/**
 * Custom error class for bookmark service errors
 */
export class BookmarkServiceError extends Error {
  code?: string;
  details?: any;

  constructor(
    message: string,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'BookmarkServiceError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Creates a new bookmark
 *
 * Calls the createBookmark Cloud Function to create a new bookmark
 * in Firestore. The function will also initialize screenshot capture.
 *
 * @param data - Bookmark data including url, title, and optional fields
 * @returns The created bookmark with its ID
 * @throws BookmarkServiceError if the operation fails
 *
 * @example
 * ```typescript
 * const bookmark = await bookmarksService.create({
 *   url: 'https://example.com',
 *   title: 'Example Site',
 *   description: 'A great example',
 *   tags: ['example', 'web']
 * });
 * console.log('Created bookmark:', bookmark.id);
 * ```
 */
export async function create(data: BookmarkData): Promise<Bookmark> {
  try {
    const createBookmark = httpsCallable<BookmarkData, Bookmark>(
      functions,
      'createBookmark'
    );

    const result: HttpsCallableResult<Bookmark> = await createBookmark(data);
    return result.data;
  } catch (error: any) {
    throw new BookmarkServiceError(
      error.message || 'Failed to create bookmark',
      error.code,
      error.details
    );
  }
}

/**
 * Gets bookmarks with optional filters and pagination
 *
 * Calls the getBookmarks Cloud Function to retrieve bookmarks
 * with support for filtering by tags, search text, dates, and folders.
 * Implements cursor-based pagination.
 *
 * @param filters - Optional filters for the query
 * @returns Object containing bookmarks array, pagination cursor, and hasMore flag
 * @throws BookmarkServiceError if the operation fails
 *
 * @example
 * ```typescript
 * // Get first page
 * const firstPage = await bookmarksService.getAll({ limit: 20 });
 *
 * // Get next page
 * const nextPage = await bookmarksService.getAll({
 *   limit: 20,
 *   lastDocId: firstPage.lastDocId
 * });
 *
 * // Filter by tags
 * const filtered = await bookmarksService.getAll({
 *   tags: ['javascript', 'react'],
 *   search: 'tutorial'
 * });
 * ```
 */
export async function getAll(
  filters: BookmarkFilters = {}
): Promise<GetBookmarksResponse> {
  try {
    const getBookmarks = httpsCallable<BookmarkFilters, GetBookmarksResponse>(
      functions,
      'getBookmarks'
    );

    const result: HttpsCallableResult<GetBookmarksResponse> =
      await getBookmarks(filters);
    return result.data;
  } catch (error: any) {
    throw new BookmarkServiceError(
      error.message || 'Failed to get bookmarks',
      error.code,
      error.details
    );
  }
}

/**
 * Updates an existing bookmark
 *
 * Calls the updateBookmark Cloud Function to update bookmark fields.
 * Only the provided fields will be updated; others remain unchanged.
 * Verifies user ownership before updating.
 *
 * @param bookmarkId - The ID of the bookmark to update
 * @param data - Partial bookmark data to update
 * @returns Success response
 * @throws BookmarkServiceError if the operation fails or user doesn't own the bookmark
 *
 * @example
 * ```typescript
 * await bookmarksService.update('abc123', {
 *   title: 'Updated Title',
 *   tags: ['updated', 'tags']
 * });
 * ```
 */
export async function update(
  bookmarkId: string,
  data: Partial<Omit<BookmarkData, 'url'>>
): Promise<SuccessResponse> {
  try {
    const updateBookmark = httpsCallable<
      { bookmarkId: string } & Partial<Omit<BookmarkData, 'url'>>,
      SuccessResponse
    >(functions, 'updateBookmark');

    const result: HttpsCallableResult<SuccessResponse> = await updateBookmark({
      bookmarkId,
      ...data,
    });
    return result.data;
  } catch (error: any) {
    throw new BookmarkServiceError(
      error.message || 'Failed to update bookmark',
      error.code,
      error.details
    );
  }
}

/**
 * Deletes a bookmark
 *
 * Calls the deleteBookmark Cloud Function to delete a bookmark.
 * Also removes the associated screenshot from Storage and updates tag counts.
 * Verifies user ownership before deleting.
 *
 * @param bookmarkId - The ID of the bookmark to delete
 * @returns Success response
 * @throws BookmarkServiceError if the operation fails or user doesn't own the bookmark
 *
 * @example
 * ```typescript
 * await bookmarksService.delete('abc123');
 * console.log('Bookmark deleted successfully');
 * ```
 */
export async function deleteBookmark(bookmarkId: string): Promise<SuccessResponse> {
  try {
    const deleteBookmarkFn = httpsCallable<
      { bookmarkId: string },
      SuccessResponse
    >(functions, 'deleteBookmark');

    const result: HttpsCallableResult<SuccessResponse> = await deleteBookmarkFn({
      bookmarkId,
    });
    return result.data;
  } catch (error: any) {
    throw new BookmarkServiceError(
      error.message || 'Failed to delete bookmark',
      error.code,
      error.details
    );
  }
}

/**
 * Gets all tags with their counts
 *
 * Calls the getTags Cloud Function to retrieve all tags
 * ordered by usage count (most popular first).
 * Limited to 100 tags.
 *
 * @returns Array of tags with names and counts
 * @throws BookmarkServiceError if the operation fails
 *
 * @example
 * ```typescript
 * const tags = await bookmarksService.getTags();
 * tags.forEach(tag => {
 *   console.log(`${tag.name}: ${tag.count} bookmarks`);
 * });
 * ```
 */
export async function getTags(): Promise<Tag[]> {
  try {
    const getTagsFn = httpsCallable<void, { tags: Tag[]; total: number }>(
      functions,
      'getTags'
    );

    const result: HttpsCallableResult<{ tags: Tag[]; total: number }> =
      await getTagsFn();
    return result.data.tags;
  } catch (error: any) {
    throw new BookmarkServiceError(
      error.message || 'Failed to get tags',
      error.code,
      error.details
    );
  }
}

/**
 * Interface for page metadata
 */
export interface PageMetadata {
  title: string;
  description: string;
  success: boolean;
}

/**
 * Fetches page metadata (title and description) from a URL
 *
 * Calls the getPageMetadata Cloud Function to extract
 * meta tags from the provided URL for autocomplete functionality.
 *
 * @param url - The URL to fetch metadata from
 * @returns Object with title and description
 * @throws BookmarkServiceError if the operation fails
 *
 * @example
 * ```typescript
 * const metadata = await bookmarksService.getPageMetadata('https://example.com');
 * console.log(metadata.title); // "Example Domain"
 * console.log(metadata.description); // "Example description"
 * ```
 */
export async function getPageMetadata(url: string): Promise<PageMetadata> {
  try {
    const getMetadata = httpsCallable<{ url: string }, PageMetadata>(
      functions,
      'getPageMetadata'
    );

    const result: HttpsCallableResult<PageMetadata> = await getMetadata({ url });
    return result.data;
  } catch (error: any) {
    throw new BookmarkServiceError(
      error.message || 'Failed to fetch page metadata',
      error.code,
      error.details
    );
  }
}

/**
 * Default export with all service functions
 */
export default {
  create,
  getAll,
  update,
  delete: deleteBookmark,
  getTags,
  getPageMetadata,
};
