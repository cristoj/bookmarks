import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BookmarkCard } from './BookmarkCard';
import type { Bookmark } from '../../services/bookmarks.service';

/**
 * Test suite for BookmarkCard component
 */
describe('BookmarkCard', () => {
  const mockBookmark: Bookmark = {
    id: 'test-123',
    url: 'https://example.com',
    title: 'Example Website',
    description: 'This is a great example website',
    tags: ['example', 'test', 'web'],
    folderId: null,
    screenshotUrl: 'https://example.com/screenshot.png',
    screenshotStatus: 'completed',
    userId: 'user123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTagClick: vi.fn(),
  };

  /**
   * Test: Should render bookmark title and description
   */
  it('should render bookmark title and description', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    expect(screen.getByText('Example Website')).toBeInTheDocument();
    expect(
      screen.getByText('This is a great example website')
    ).toBeInTheDocument();
  });

  /**
   * Test: Should render screenshot when available
   */
  it('should render screenshot when available', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const screenshot = screen.getByAltText('Example Website') as HTMLImageElement;
    expect(screenshot).toBeInTheDocument();
    expect(screenshot.src).toBe('https://example.com/screenshot.png');
  });

  /**
   * Test: Should render fallback when no screenshot
   */
  it('should render fallback when no screenshot', () => {
    const bookmarkWithoutScreenshot = {
      ...mockBookmark,
      screenshotUrl: null,
    };

    render(
      <BookmarkCard
        bookmark={bookmarkWithoutScreenshot}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    // Should not find image
    const images = screen.queryAllByRole('img');
    expect(images).toHaveLength(0);
  });

  /**
   * Test: Should render all tags
   */
  it('should render all tags', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onTagClick={mockHandlers.onTagClick}
      />
    );

    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('web')).toBeInTheDocument();
  });

  /**
   * Test: Should call onEdit when edit button is clicked
   */
  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const editButton = screen.getByLabelText('Editar bookmark');
    await user.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockBookmark);
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Should call onDelete when delete button is clicked
   */
  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Eliminar bookmark');
    await user.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith('test-123');
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Should call onTagClick when tag is clicked
   */
  it('should call onTagClick when tag is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onTagClick={mockHandlers.onTagClick}
      />
    );

    const tagButton = screen.getByLabelText('Filtrar por tag: example');
    await user.click(tagButton);

    expect(mockHandlers.onTagClick).toHaveBeenCalledWith('example');
    expect(mockHandlers.onTagClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Should not crash when onTagClick is not provided
   */
  it('should not crash when onTagClick is not provided', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        // Not passing onTagClick
      />
    );

    const tagButton = screen.getByLabelText('Filtrar por tag: example');

    // Should not throw error when clicking
    await expect(user.click(tagButton)).resolves.not.toThrow();
  });

  /**
   * Test: Should render relative time
   */
  it('should render relative time', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    // Should show "justo ahora" for recent bookmarks
    expect(screen.getByText('justo ahora')).toBeInTheDocument();
  });

  /**
   * Test: Should have correct links to URL
   */
  it('should have correct links to URL', () => {
    render(
      <BookmarkCard
        bookmark={mockBookmark}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  /**
   * Test: Should not render description if not provided
   */
  it('should not render description if not provided', () => {
    const bookmarkWithoutDescription = {
      ...mockBookmark,
      description: '',
    };

    const { container } = render(
      <BookmarkCard
        bookmark={bookmarkWithoutDescription}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    // Description paragraph should not be rendered
    const paragraphs = container.querySelectorAll('p');
    const descriptionParagraphs = Array.from(paragraphs).filter(
      (p) => p.className.includes('line-clamp-2')
    );
    expect(descriptionParagraphs).toHaveLength(0);
  });

  /**
   * Test: Should render with empty tags array
   */
  it('should render with empty tags array', () => {
    const bookmarkWithoutTags = {
      ...mockBookmark,
      tags: [],
    };

    render(
      <BookmarkCard
        bookmark={bookmarkWithoutTags}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
      />
    );

    // Should still render the card
    expect(screen.getByText('Example Website')).toBeInTheDocument();
    // But no tags
    expect(screen.queryByLabelText(/Filtrar por tag/)).not.toBeInTheDocument();
  });
});
