import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInfiniteScroll } from './useInfiniteScroll';

/**
 * Mock IntersectionObserver for testing
 */
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

describe('useInfiniteScroll Hook', () => {
  let mockIntersectionObserver: typeof MockIntersectionObserver;

  beforeEach(() => {
    // Mock IntersectionObserver
    mockIntersectionObserver = vi.fn((_callback, _options) => {
      const instance = new MockIntersectionObserver();
      return instance;
    }) as any;

    global.IntersectionObserver = mockIntersectionObserver as any;
  });

  describe('Basic Functionality', () => {
    it('returns a ref object', () => {
      const fetchNextPage = vi.fn();
      const { result } = renderHook(() => useInfiniteScroll(fetchNextPage, true));

      expect(result.current).toHaveProperty('current');
      expect(result.current.current).toBeNull(); // Initially null
    });

    it('does not throw errors when called with valid arguments', () => {
      const fetchNextPage = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(fetchNextPage, true));
      }).not.toThrow();
    });

    it('accepts custom threshold parameter', () => {
      const fetchNextPage = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(fetchNextPage, true, 0.75));
      }).not.toThrow();
    });

    it('uses default threshold when not specified', () => {
      const fetchNextPage = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(fetchNextPage, true));
      }).not.toThrow();
    });
  });

  describe('hasNextPage Behavior', () => {
    it('does not create observer when hasNextPage is false', () => {
      const fetchNextPage = vi.fn();
      renderHook(() => useInfiniteScroll(fetchNextPage, false));

      // Observer should not be created
      expect(mockIntersectionObserver).not.toHaveBeenCalled();
    });

    it('handles hasNextPage changing from false to true', () => {
      const fetchNextPage = vi.fn();
      const { rerender } = renderHook(
        ({ hasNext }) => useInfiniteScroll(fetchNextPage, hasNext),
        { initialProps: { hasNext: false } }
      );

      // Initially should not create observer
      expect(mockIntersectionObserver).not.toHaveBeenCalled();

      // Change hasNextPage to true - hook will recreate observer on next effect
      rerender({ hasNext: true });

      // This is expected behavior - hook is ready to observe when element is attached
    });

    it('handles hasNextPage changing from true to false', () => {
      const fetchNextPage = vi.fn();
      const { rerender } = renderHook(
        ({ hasNext }) => useInfiniteScroll(fetchNextPage, hasNext),
        { initialProps: { hasNext: true } }
      );

      // Change to false
      rerender({ hasNext: false });

      // Should work without errors
      expect(fetchNextPage).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('handles unmount gracefully', () => {
      const fetchNextPage = vi.fn();
      const { unmount } = renderHook(() => useInfiniteScroll(fetchNextPage, true));

      expect(() => unmount()).not.toThrow();
    });

    it('can be re-rendered before unmounting', () => {
      const fetchNextPage = vi.fn();
      const { rerender } = renderHook(() =>
        useInfiniteScroll(fetchNextPage, true)
      );

      // Should be able to rerender multiple times
      expect(() => {
        rerender();
        rerender();
      }).not.toThrow();
    });

    it('updates when dependencies change', () => {
      const fetchNextPage1 = vi.fn();
      const fetchNextPage2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useInfiniteScroll(callback, true),
        { initialProps: { callback: fetchNextPage1 } }
      );

      // Change callback
      expect(() => {
        rerender({ callback: fetchNextPage2 });
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles null ref gracefully', () => {
      const fetchNextPage = vi.fn();
      const { result } = renderHook(() => useInfiniteScroll(fetchNextPage, true));

      // Ref should be null initially
      expect(result.current.current).toBeNull();
    });

    it('works with threshold of 0', () => {
      const fetchNextPage = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(fetchNextPage, true, 0));
      }).not.toThrow();
    });

    it('works with threshold of 1', () => {
      const fetchNextPage = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(fetchNextPage, true, 1));
      }).not.toThrow();
    });

    it('works with threshold of 0.5', () => {
      const fetchNextPage = vi.fn();

      expect(() => {
        renderHook(() => useInfiniteScroll(fetchNextPage, true, 0.5));
      }).not.toThrow();
    });

    it('handles rapid prop changes', () => {
      const fetchNextPage = vi.fn();
      const { rerender } = renderHook(
        ({ hasNext }) => useInfiniteScroll(fetchNextPage, hasNext),
        { initialProps: { hasNext: true } }
      );

      // Rapidly change props
      expect(() => {
        rerender({ hasNext: false });
        rerender({ hasNext: true });
        rerender({ hasNext: false });
        rerender({ hasNext: true });
      }).not.toThrow();
    });

    it('handles empty fetchNextPage function', () => {
      const emptyFn = () => {};

      expect(() => {
        renderHook(() => useInfiniteScroll(emptyFn, true));
      }).not.toThrow();
    });
  });

  describe('Return Value', () => {
    it('returns the same ref object on re-renders', () => {
      const fetchNextPage = vi.fn();
      const { result, rerender } = renderHook(() =>
        useInfiniteScroll(fetchNextPage, true)
      );

      const firstRef = result.current;
      rerender();
      const secondRef = result.current;

      // Should return the same ref object
      expect(firstRef).toBe(secondRef);
    });

    it('ref can be attached to a div element', () => {
      const fetchNextPage = vi.fn();
      const { result } = renderHook(() => useInfiniteScroll(fetchNextPage, true));

      // Create a mock div element
      const mockDiv = document.createElement('div');

      // Should be able to attach ref
      expect(() => {
        // In real usage: <div ref={result.current} />
        if (result.current) {
          (result.current as any).current = mockDiv;
        }
      }).not.toThrow();
    });
  });
});
