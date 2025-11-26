import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BookmarkForm } from './BookmarkForm';
import type { Bookmark } from '../../services/bookmarks.service';

/**
 * Test suite for BookmarkForm component
 */
describe('BookmarkForm', () => {
  const mockBookmark: Bookmark = {
    id: 'test-123',
    url: 'https://example.com',
    title: 'Example Website',
    description: 'This is a test bookmark',
    tags: ['test', 'example'],
    folderId: null,
    screenshotUrl: null,
    screenshotStatus: 'pending',
    userId: 'user123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockHandlers = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    mockHandlers.onSave.mockClear();
    mockHandlers.onCancel.mockClear();
  });

  /**
   * Test: Should render form in create mode
   */
  it('should render form in create mode', () => {
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    expect(screen.getByLabelText(/URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Bookmark/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  /**
   * Test: Should render form in edit mode with pre-filled data
   */
  it('should render form in edit mode with pre-filled data', () => {
    render(
      <BookmarkForm
        bookmark={mockBookmark}
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i) as HTMLInputElement;
    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;

    expect(urlInput.value).toBe('https://example.com');
    expect(titleInput.value).toBe('Example Website');
    expect(descriptionInput.value).toBe('This is a test bookmark');
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Bookmark/i })).toBeInTheDocument();
  });

  /**
   * Test: Should validate required URL field
   */
  it('should validate required URL field', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/URL is required/i)).toBeInTheDocument();
    });

    expect(mockHandlers.onSave).not.toHaveBeenCalled();
  });

  /**
   * Test: Should validate URL format
   */
  it('should validate URL format', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i);
    const titleInput = screen.getByLabelText(/Title/i);

    await user.type(urlInput, 'invalid-url');
    await user.type(titleInput, 'Valid Title');

    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
    });

    expect(mockHandlers.onSave).not.toHaveBeenCalled();
  });

  /**
   * Test: Should validate required title field
   */
  it('should validate required title field', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i);
    await user.type(urlInput, 'https://example.com');

    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });

    expect(mockHandlers.onSave).not.toHaveBeenCalled();
  });

  /**
   * Test: Should validate title minimum length
   */
  it('should validate title minimum length', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i);
    const titleInput = screen.getByLabelText(/Title/i);

    await user.type(urlInput, 'https://example.com');
    await user.type(titleInput, 'ab');

    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Title must be at least 3 characters/i)).toBeInTheDocument();
    });

    expect(mockHandlers.onSave).not.toHaveBeenCalled();
  });

  /**
   * Test: Should submit form with valid data in create mode
   */
  it('should submit form with valid data in create mode', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i);
    const titleInput = screen.getByLabelText(/Title/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    await user.type(urlInput, 'https://test.com');
    await user.type(titleInput, 'Test Title');
    await user.type(descriptionInput, 'Test description');

    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onSave).toHaveBeenCalledWith({
        url: 'https://test.com',
        title: 'Test Title',
        description: 'Test description',
        tags: undefined,
      });
    });
  });

  /**
   * Test: Should submit form with tags
   */
  it('should submit form with tags', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i);
    const titleInput = screen.getByLabelText(/Title/i);

    await user.type(urlInput, 'https://test.com');
    await user.type(titleInput, 'Test Title');

    // Add tags
    const tagsInput = screen.getByLabelText(/Tags/i);
    await user.type(tagsInput, 'tag1{Enter}');
    await user.type(tagsInput, 'tag2{Enter}');

    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onSave).toHaveBeenCalledWith({
        url: 'https://test.com',
        title: 'Test Title',
        description: undefined,
        tags: ['tag1', 'tag2'],
      });
    });
  });

  /**
   * Test: Should call onCancel when cancel button is clicked
   */
  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Should disable form when isLoading is true
   */
  it('should disable form when isLoading is true', () => {
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
        isLoading={true}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i) as HTMLInputElement;
    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i }) as HTMLButtonElement;
    const cancelButton = screen.getByRole('button', { name: /Cancel/i }) as HTMLButtonElement;

    expect(urlInput.disabled).toBe(true);
    expect(titleInput.disabled).toBe(true);
    expect(descriptionInput.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
    expect(cancelButton.disabled).toBe(true);
  });

  /**
   * Test: Should disable URL field in edit mode
   */
  it('should disable URL field in edit mode', () => {
    render(
      <BookmarkForm
        bookmark={mockBookmark}
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i) as HTMLInputElement;
    expect(urlInput.disabled).toBe(true);
  });

  /**
   * Test: Should trim whitespace from inputs
   */
  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
      />
    );

    const urlInput = screen.getByLabelText(/URL/i);
    const titleInput = screen.getByLabelText(/Title/i);

    await user.type(urlInput, '  https://test.com  ');
    await user.type(titleInput, '  Test Title  ');

    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockHandlers.onSave).toHaveBeenCalledWith({
        url: 'https://test.com',
        title: 'Test Title',
        description: undefined,
        tags: undefined,
      });
    });
  });

  /**
   * Test: Should show loading state on submit button
   */
  it('should show loading state on submit button', () => {
    render(
      <BookmarkForm
        onSave={mockHandlers.onSave}
        onCancel={mockHandlers.onCancel}
        isLoading={true}
      />
    );

    // Loading spinner should be present
    const submitButton = screen.getByRole('button', { name: /Create Bookmark/i });
    const spinner = submitButton.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
