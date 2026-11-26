/**
 * Tests for tagsLocalSync utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { Tag } from '@services/bookmarks.service';
import { applyTagChanges, findCachedBookmarkTags, syncTagsLocally } from './tagsLocalSync';
import { getCacheTimestamp, getTagsFromCache, saveTagsToCache } from './tagsCache';

const tag = (name: string, count: number): Tag => ({
  name,
  count,
  updatedAt: '2024-01-01T00:00:00.000Z',
});

describe('applyTagChanges', () => {
  it('increments existing tags and adds new ones', () => {
    const result = applyTagChanges([tag('react', 2)], ['react', 'Vite'], []);

    expect(result.find((t) => t.name === 'react')?.count).toBe(3);
    expect(result.find((t) => t.name === 'Vite')?.count).toBe(1);
  });

  it('decrements removed tags and drops those that reach zero', () => {
    const result = applyTagChanges([tag('react', 2), tag('old', 1)], [], ['react', 'old']);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'react', count: 1 });
  });

  it('matches tags case-insensitively and sorts by count', () => {
    const result = applyTagChanges([tag('a', 1), tag('react', 1)], ['React'], []);

    expect(result.map((t) => t.name)).toEqual(['react', 'a']);
    expect(result[0].count).toBe(2);
  });

  it('does not mutate the input list', () => {
    const input = [tag('react', 2)];
    applyTagChanges(input, ['react'], []);

    expect(input[0].count).toBe(2);
  });
});

describe('syncTagsLocally', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient();
  });

  it('returns false when there is no tags list to update', () => {
    expect(syncTagsLocally(queryClient, { added: ['x'] })).toBe(false);
  });

  it('updates the query and localStorage without changing the sync timestamp', () => {
    saveTagsToCache([tag('react', 1)]);
    localStorage.setItem('bookmarks_tags_timestamp', '1000');
    queryClient.setQueryData(['tags'], [tag('react', 1)], { updatedAt: 1000 });

    expect(syncTagsLocally(queryClient, { added: ['react', 'vite'] })).toBe(true);

    expect(queryClient.getQueryData<Tag[]>(['tags'])?.map((t) => t.name)).toEqual(['react', 'vite']);
    expect(getTagsFromCache()?.find((t) => t.name === 'react')?.count).toBe(2);
    expect(getCacheTimestamp()).toBe(1000);
    expect(queryClient.getQueryState(['tags'])?.dataUpdatedAt).toBe(1000);
  });

  it('falls back to the localStorage list when the query has no data', () => {
    saveTagsToCache([tag('react', 1)]);

    expect(syncTagsLocally(queryClient, { removed: ['react'] })).toBe(true);
    expect(getTagsFromCache()).toEqual([]);
  });
});

describe('findCachedBookmarkTags', () => {
  it('returns the tags of a bookmark found in a cached list', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['bookmarks', undefined], {
      pages: [{ data: [{ id: 'b1', tags: ['a', 'b'] }], lastDocId: null, hasMore: false }],
      pageParams: [undefined],
    });

    expect(findCachedBookmarkTags(queryClient, 'b1')).toEqual(['a', 'b']);
  });

  it('returns null when the bookmark is not cached', () => {
    expect(findCachedBookmarkTags(new QueryClient(), 'missing')).toBeNull();
  });
});
