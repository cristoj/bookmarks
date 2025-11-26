import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BookmarkGrid } from './BookmarkGrid';
import type { Bookmark } from '../../services/bookmarks.service';

/**
 * Mock IntersectionObserver for testing
 */
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

/**
 * Test suite for BookmarkGrid component
 */
describe('BookmarkGrid', () => {
  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn((_callback, _options) => {
      return new MockIntersectionObserver();
    }) as any;
  });

  const mockBookmarks: Bookmark[] = [
    {
      id: '1',
      url: 'https://example.com',
      title: 'Example Site',
      description: 'A great example',
      tags: ['example', 'test'],
      folderId: null,
      screenshotUrl: 'https://example.com/screenshot.png',
      screenshotStatus: 'completed',
      userId: 'user123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      url: 'https://test.com',
      title: 'Test Site',
      description: 'Testing description',
      tags: ['test'],
      folderId: null,
      screenshotUrl: null,
      screenshotStatus: 'pending',
      userId: 'user123',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTagClick: vi.fn(),
  };

  /**
   * Test: Should render loading skeletons when isLoading is true
   */
  it('should render loading skeletons when isLoading is true', () => {
    render(
      <BookmarkGrid
        bookmarks={[]}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        isLoading={true}
        skeletonCount={3}
      />
    );

    // Should render 3 skeleton loaders
    const skeletons = screen.getAllByRole('generic').filter((el) =>
      el.className.includes('animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  /**
   * Test: Should render empty state when no bookmarks
   */
  it('should render empty state when no bookmarks and not loading', () => {
    render(
      <BookmarkGrid
        bookmarks={[]}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        isLoading={false}
      />
    );

    expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Start saving your favorite links/i)
    ).toBeInTheDocument();
  });

  /**
   * Test: Should render all bookmarks correctly
   */
  it('should render all bookmarks correctly', () => {
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('A great example')).toBeInTheDocument();
    expect(screen.getByText('Testing description')).toBeInTheDocument();
  });

  /**
   * Test: Should call onEdit when edit button is clicked
   */
  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const editButtons = screen.getAllByLabelText(/Editar bookmark/i);
    await user.click(editButtons[0]);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockBookmarks[0]);
  });

  /**
   * Test: Should call onDelete when delete button is clicked
   */
  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const deleteButtons = screen.getAllByLabelText(/Eliminar bookmark/i);
    await user.click(deleteButtons[0]);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
  });

  /**
   * Test: Should call onTagClick when tag is clicked
   */
  it('should call onTagClick when tag is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onTagClick={mockHandlers.onTagClick}
      />
    );

    const tagButton = screen.getByLabelText(/Filtrar por tag: example/i);
    await user.click(tagButton);

    expect(mockHandlers.onTagClick).toHaveBeenCalledWith('example');
  });

  /**
   * Test: Should render correct number of bookmark cards
   */
  it('should render correct number of bookmark cards', () => {
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const editButtons = screen.getAllByLabelText(/Editar bookmark/i);
    expect(editButtons).toHaveLength(mockBookmarks.length);
  });

  /**
   * Test: Should render tags correctly for each bookmark
   */
  it('should render tags correctly for each bookmark', () => {
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByLabelText(/Filtrar por tag: example/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Filtrar por tag: test/i)).toHaveLength(2);
  });

  /**
   * Test: Should use responsive grid classes
   */
  it('should use responsive grid classes', () => {
    const { container } = render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });

  /**
   * Test: Should display screenshot when available
   */
  it('should display screenshot when available', () => {
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const screenshot = screen.getByAltText('Example Site') as HTMLImageElement;
    expect(screenshot).toBeInTheDocument();
    expect(screenshot.src).toBe('https://example.com/screenshot.png');
  });

  /**
   * Test: Should display fallback when screenshot not available
   */
  it('should display fallback when screenshot not available', () => {
    render(
      <BookmarkGrid
        bookmarks={[mockBookmarks[1]]} // Second bookmark has no screenshot
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    // Should not find image for second bookmark
    const images = screen.queryAllByRole('img');
    expect(images).toHaveLength(0);
  });

  /**
   * Test: Should render observer element when fetchNextPage is provided
   */
  it('should render observer element when fetchNextPage is provided', () => {
    const fetchNextPage = vi.fn();

    const { container } = render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        fetchNextPage={fetchNextPage}
        hasNextPage={true}
      />
    );

    // Observer element should be present
    const observer = container.querySelector('[class*="justify-center"]');
    expect(observer).toBeInTheDocument();
  });

  /**
   * Test: Should not render observer element when fetchNextPage is not provided
   */
  it('should not render observer element when fetchNextPage is not provided', () => {
    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.queryByText(/loading more/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no more bookmarks/i)).not.toBeInTheDocument();
  });

  /**
   * Test: Should show "Loading more..." when fetching next page
   */
  it('should show loading indicator when fetching next page', () => {
    const fetchNextPage = vi.fn();

    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        fetchNextPage={fetchNextPage}
        hasNextPage={true}
        isFetchingNextPage={true}
      />
    );

    expect(screen.getByText(/loading more/i)).toBeInTheDocument();
    // Should have spinning icon
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  /**
   * Test: Should show "No more bookmarks" when no next page
   */
  it('should show end message when no more pages', () => {
    const fetchNextPage = vi.fn();

    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        fetchNextPage={fetchNextPage}
        hasNextPage={false}
        isFetchingNextPage={false}
      />
    );

    expect(screen.getByText(/no more bookmarks/i)).toBeInTheDocument();
    expect(screen.getByText(/you've reached the end/i)).toBeInTheDocument();
  });

  /**
   * Test: Should not show end message when list is empty
   */
  it('should not show end message when no bookmarks', () => {
    const fetchNextPage = vi.fn();

    render(
      <BookmarkGrid
        bookmarks={[]}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        fetchNextPage={fetchNextPage}
        hasNextPage={false}
        isFetchingNextPage={false}
      />
    );

    expect(screen.queryByText(/no more bookmarks/i)).not.toBeInTheDocument();
  });

  /**
   * Test: Should not show loading or end message during initial load
   */
  it('should not show infinite scroll messages during initial load', () => {
    const fetchNextPage = vi.fn();

    render(
      <BookmarkGrid
        bookmarks={[]}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        fetchNextPage={fetchNextPage}
        hasNextPage={true}
        isLoading={true}
      />
    );

    expect(screen.queryByText(/loading more/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no more bookmarks/i)).not.toBeInTheDocument();
  });

  /**
   * Test: Should handle infinite scroll with existing bookmarks
   */
  it('should work with infinite scroll enabled', () => {
    const fetchNextPage = vi.fn();

    render(
      <BookmarkGrid
        bookmarks={mockBookmarks}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        fetchNextPage={fetchNextPage}
        hasNextPage={true}
        isFetchingNextPage={false}
      />
    );

    // Bookmarks should still render
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('Test Site')).toBeInTheDocument();

    // Observer should be present but not showing loading or end messages
    expect(screen.queryByText(/loading more/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no more bookmarks/i)).not.toBeInTheDocument();
  });
});
