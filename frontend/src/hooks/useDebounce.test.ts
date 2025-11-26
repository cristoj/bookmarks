import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce Hook', () => {

  describe('Basic Functionality', () => {
    it('returns the initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      expect(result.current).toBe('initial');
    });

    it('debounces value updates with default delay (500ms)', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Change value
      rerender({ value: 'updated' });

      // Value should not change immediately
      expect(result.current).toBe('initial');

      // Wait for debounce delay
      await waitFor(
        () => {
          expect(result.current).toBe('updated');
        },
        { timeout: 1000 }
      );
    });

    it('debounces value updates with custom delay', async () => {
      const customDelay = 300;
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, customDelay),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Change value
      rerender({ value: 'updated' });

      // Value should not change immediately
      expect(result.current).toBe('initial');

      // Wait for debounce delay
      await waitFor(
        () => {
          expect(result.current).toBe('updated');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Multiple Rapid Changes', () => {
    it('only updates to the final value after multiple rapid changes', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // Rapid changes
      rerender({ value: 'change1' });
      rerender({ value: 'change2' });
      rerender({ value: 'change3' });
      rerender({ value: 'final' });

      // Should still be initial since no full delay has passed
      expect(result.current).toBe('initial');

      // Wait for debounce to complete with the final value
      await waitFor(
        () => {
          expect(result.current).toBe('final');
        },
        { timeout: 1000 }
      );
    });

    it('resets the timer on each value change', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // First change
      rerender({ value: 'change1' });

      // Second change before first delay completes
      rerender({ value: 'change2' });

      // Wait for debounce to complete with the final value
      await waitFor(
        () => {
          expect(result.current).toBe('change2');
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Different Value Types', () => {
    it('works with string values', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 'hello' } }
      );

      rerender({ value: 'world' });

      await waitFor(
        () => {
          expect(result.current).toBe('world');
        },
        { timeout: 1000 }
      );
    });

    it('works with number values', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 0 } }
      );

      rerender({ value: 42 });

      await waitFor(
        () => {
          expect(result.current).toBe(42);
        },
        { timeout: 1000 }
      );
    });

    it('works with object values', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: { name: 'John' } } }
      );

      const newValue = { name: 'Jane' };
      rerender({ value: newValue });

      await waitFor(
        () => {
          expect(result.current).toEqual(newValue);
        },
        { timeout: 1000 }
      );
    });

    it('works with array values', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: [1, 2, 3] } }
      );

      const newValue = [4, 5, 6];
      rerender({ value: newValue });

      await waitFor(
        () => {
          expect(result.current).toEqual(newValue);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 'text' } }
      );

      rerender({ value: '' });

      await waitFor(
        () => {
          expect(result.current).toBe('');
        },
        { timeout: 1000 }
      );
    });

    it('handles zero as value', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 10 } }
      );

      rerender({ value: 0 });

      await waitFor(
        () => {
          expect(result.current).toBe(0);
        },
        { timeout: 1000 }
      );
    });

    it('handles null value', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 'text' as string | null } }
      );

      rerender({ value: null });

      await waitFor(
        () => {
          expect(result.current).toBe(null);
        },
        { timeout: 1000 }
      );
    });

    it('handles undefined value', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 200),
        { initialProps: { value: 'text' as string | undefined } }
      );

      rerender({ value: undefined });

      await waitFor(
        () => {
          expect(result.current).toBe(undefined);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Cleanup', () => {
    it('does not throw errors on unmount', () => {
      const { unmount } = renderHook(() => useDebounce('test', 300));

      // Should not throw
      expect(() => unmount()).not.toThrow();
    });

    it('handles value changes without errors', () => {
      const { rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // Change value multiple times
      expect(() => {
        rerender({ value: 'change1' });
        rerender({ value: 'change2' });
      }).not.toThrow();
    });
  });
});
