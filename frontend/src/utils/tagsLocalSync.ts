/**
 * Tags Local Sync
 *
 * Keeps the tags list (React Query + localStorage) in step with bookmark
 * create/update/delete without re-downloading every tag from Firestore.
 * The periodic refresh in useTags syncs with the server.
 */

import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { GetBookmarksResponse, Tag } from '@services/bookmarks.service';
import { getCacheTimestamp, getTagsFromCache, saveTagsToCache } from './tagsCache';

const tagKey = (name: string): string => name.trim().toLowerCase();

/**
 * Returns a new tags list with +1 for every added tag and -1 for every
 * removed tag. Tags that reach 0 are dropped; the result is sorted by count.
 */
export function applyTagChanges(tags: Tag[], added: string[], removed: string[]): Tag[] {
  const byKey = new Map<string, Tag>(tags.map((tag) => [tagKey(tag.name), { ...tag }]));
  const now = new Date().toISOString();

  for (const name of added) {
    if (!name.trim()) continue;
    const existing = byKey.get(tagKey(name));
    byKey.set(
      tagKey(name),
      existing
        ? { ...existing, count: existing.count + 1, updatedAt: now }
        : { name: name.trim(), count: 1, updatedAt: now }
    );
  }

  for (const name of removed) {
    const existing = byKey.get(tagKey(name));
    if (existing) byKey.set(tagKey(name), { ...existing, count: existing.count - 1, updatedAt: now });
  }

  return [...byKey.values()]
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Applies tag count changes to the ['tags'] query and the localStorage cache
 * without touching their "last synced" age.
 *
 * @returns false when there is no tags list to update yet
 */
export function syncTagsLocally(
  queryClient: QueryClient,
  changes: { added?: string[]; removed?: string[] }
): boolean {
  const current = queryClient.getQueryData<Tag[]>(['tags']) ?? getTagsFromCache();
  if (!current) return false;

  const next = applyTagChanges(current, changes.added ?? [], changes.removed ?? []);
  const updatedAt =
    queryClient.getQueryState(['tags'])?.dataUpdatedAt ?? getCacheTimestamp() ?? 0;

  queryClient.setQueryData<Tag[]>(['tags'], next, { updatedAt });
  saveTagsToCache(next, false);
  return true;
}

/**
 * Finds the tags a bookmark had before a mutation, from the cached bookmark lists.
 *
 * @returns The tags, or null when the bookmark is not in any cached list
 */
export function findCachedBookmarkTags(
  queryClient: QueryClient,
  bookmarkId: string
): string[] | null {
  const queries = queryClient.getQueriesData<InfiniteData<GetBookmarksResponse>>({
    queryKey: ['bookmarks'],
  });

  for (const [, data] of queries) {
    for (const page of data?.pages ?? []) {
      const bookmark = page.data.find((item) => item.id === bookmarkId);
      if (bookmark) return bookmark.tags ?? [];
    }
  }
  return null;
}
