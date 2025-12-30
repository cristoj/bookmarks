/**
 * Tags Cache Utility
 *
 * Utility for caching tags in localStorage to reduce API calls
 * and improve autocomplete performance.
 *
 * Strategy:
 * - Tags are cached in localStorage with a timestamp
 * - On app load, tags are loaded from cache (instant)
 * - Then refreshed from API in the background
 * - When creating/editing bookmarks, new tags are added to cache immediately
 */

import type { Tag } from '../services/bookmarks.service';

const TAGS_CACHE_KEY = 'bookmarks_tags_cache';
const TAGS_TIMESTAMP_KEY = 'bookmarks_tags_timestamp';

/**
 * Get tags from localStorage cache
 *
 * @returns Cached tags or null if cache is empty/invalid
 *
 * @example
 * ```typescript
 * const cachedTags = getTagsFromCache();
 * if (cachedTags) {
 *   console.log('Using cached tags:', cachedTags);
 * }
 * ```
 */
export function getTagsFromCache(): Tag[] | null {
  try {
    const cached = localStorage.getItem(TAGS_CACHE_KEY);
    if (!cached) return null;

    const tags: Tag[] = JSON.parse(cached);
    return Array.isArray(tags) ? tags : null;
  } catch (error) {
    console.error('Error reading tags from cache:', error);
    return null;
  }
}

/**
 * Save tags to localStorage cache
 *
 * @param tags - Tags array to cache
 *
 * @example
 * ```typescript
 * const tags = await fetchTagsFromAPI();
 * saveTagsToCache(tags);
 * ```
 */
export function saveTagsToCache(tags: Tag[]): void {
  try {
    localStorage.setItem(TAGS_CACHE_KEY, JSON.stringify(tags));
    localStorage.setItem(TAGS_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving tags to cache:', error);
  }
}

/**
 * Add a new tag to the cache
 * If the tag already exists, updates its count
 * Otherwise, adds it with count = 1
 *
 * @param tagName - Name of the tag to add
 *
 * @example
 * ```typescript
 * // When creating a bookmark with tags
 * ['react', 'typescript'].forEach(tag => addTagToCache(tag));
 * ```
 */
export function addTagToCache(tagName: string): void {
  try {
    const tags = getTagsFromCache() || [];
    const existingIndex = tags.findIndex(t => t.name === tagName);

    if (existingIndex >= 0) {
      // Tag exists, increment count
      tags[existingIndex].count += 1;
      tags[existingIndex].updatedAt = new Date().toISOString();
    } else {
      // New tag, add it
      tags.push({
        name: tagName,
        count: 1,
        updatedAt: new Date().toISOString(),
      });
    }

    // Sort by count descending
    tags.sort((a, b) => b.count - a.count);

    saveTagsToCache(tags);
  } catch (error) {
    console.error('Error adding tag to cache:', error);
  }
}

/**
 * Add multiple tags to the cache
 *
 * @param tagNames - Array of tag names to add
 *
 * @example
 * ```typescript
 * addTagsToCache(['react', 'typescript', 'nextjs']);
 * ```
 */
export function addTagsToCache(tagNames: string[]): void {
  tagNames.forEach(tagName => addTagToCache(tagName));
}

/**
 * Remove a tag from the cache
 * Decrements its count, removes if count reaches 0
 *
 * @param tagName - Name of the tag to remove
 *
 * @example
 * ```typescript
 * // When deleting a bookmark with tags
 * removeTagFromCache('react');
 * ```
 */
export function removeTagFromCache(tagName: string): void {
  try {
    const tags = getTagsFromCache() || [];
    const existingIndex = tags.findIndex(t => t.name === tagName);

    if (existingIndex >= 0) {
      tags[existingIndex].count -= 1;

      // Remove if count is 0 or less
      if (tags[existingIndex].count <= 0) {
        tags.splice(existingIndex, 1);
      } else {
        tags[existingIndex].updatedAt = new Date().toISOString();
      }

      saveTagsToCache(tags);
    }
  } catch (error) {
    console.error('Error removing tag from cache:', error);
  }
}

/**
 * Clear the tags cache
 *
 * @example
 * ```typescript
 * clearTagsCache();
 * ```
 */
export function clearTagsCache(): void {
  try {
    localStorage.removeItem(TAGS_CACHE_KEY);
    localStorage.removeItem(TAGS_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing tags cache:', error);
  }
}

/**
 * Get cache timestamp
 *
 * @returns Timestamp when cache was last updated, or null
 */
export function getCacheTimestamp(): number | null {
  try {
    const timestamp = localStorage.getItem(TAGS_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error reading cache timestamp:', error);
    return null;
  }
}

/**
 * Check if cache is stale (older than X minutes)
 *
 * @param maxAgeMinutes - Maximum age in minutes (default: 5)
 * @returns true if cache is stale or doesn't exist
 */
export function isCacheStale(maxAgeMinutes: number = 5): boolean {
  const timestamp = getCacheTimestamp();
  if (!timestamp) return true;

  const ageMs = Date.now() - timestamp;
  const maxAgeMs = maxAgeMinutes * 60 * 1000;

  return ageMs > maxAgeMs;
}

export default {
  getTagsFromCache,
  saveTagsToCache,
  addTagToCache,
  addTagsToCache,
  removeTagFromCache,
  clearTagsCache,
  getCacheTimestamp,
  isCacheStale,
};
