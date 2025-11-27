import { useEffect, useState, type JSX } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { TagInput } from '../common/TagInput';
import { useDebounce } from '../../hooks/useDebounce';
import { usePageMetadata } from '../../hooks/usePageMetadata';
import type { Bookmark, BookmarkData } from '../../services/bookmarks.service';

/**
 * BookmarkForm component props
 */
export interface BookmarkFormProps {
  /**
   * Bookmark to edit (optional, if not provided it's create mode)
   */
  bookmark?: Bookmark;
  /**
   * Callback when form is saved
   */
  onSave: (data: BookmarkData) => void;
  /**
   * Callback when form is cancelled
   */
  onCancel: () => void;
  /**
   * Loading state (disables form during submission)
   */
  isLoading?: boolean;
}

/**
 * Form data interface
 */
interface BookmarkFormData {
  url: string;
  title: string;
  description: string;
  tags: string[];
}

/**
 * BookmarkForm Component
 *
 * Form for creating and editing bookmarks.
 *
 * Features:
 * - Create or edit mode based on bookmark prop
 * - Automatic title and description extraction from URL (create mode only)
 * - Form validation with react-hook-form
 * - URL validation
 * - Tag management with chips
 * - Loading state handling
 * - Error messages
 * - Responsive design
 *
 * The form automatically fetches page metadata (title and description) when a URL
 * is entered in create mode. The metadata is fetched after a 1-second debounce
 * to avoid excessive requests. If the fields are empty, they are auto-filled with
 * the fetched data.
 *
 * @example
 * ```tsx
 * // Create mode
 * <BookmarkForm
 *   onSave={(data) => createBookmark(data)}
 *   onCancel={() => closeModal()}
 *   isLoading={isCreating}
 * />
 *
 * // Edit mode
 * <BookmarkForm
 *   bookmark={existingBookmark}
 *   onSave={(data) => updateBookmark(data)}
 *   onCancel={() => closeModal()}
 *   isLoading={isUpdating}
 * />
 * ```
 */
export function BookmarkForm({
  bookmark,
  onSave,
  onCancel,
  isLoading = false,
}: BookmarkFormProps): JSX.Element {
  const isEditMode = !!bookmark;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookmarkFormData>({
    defaultValues: {
      url: bookmark?.url || '',
      title: bookmark?.title || '',
      description: bookmark?.description || '',
      tags: bookmark?.tags || [],
    },
  });

  // Watch URL field for changes
  const urlValue = watch('url');
  const titleValue = watch('title');
  const descriptionValue = watch('description');

  // Debounce URL to avoid too many requests
  const debouncedUrl = useDebounce(urlValue, 1000);

  // Fetch metadata when URL changes (only in create mode)
  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = usePageMetadata(debouncedUrl, {
    enabled: !isEditMode && !!debouncedUrl,
  });

  // State to track if metadata was already applied
  const [metadataApplied, setMetadataApplied] = useState(false);

  // Reset form when bookmark changes
  useEffect(() => {
    if (bookmark) {
      reset({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || '',
        tags: bookmark.tags || [],
      });
    }
  }, [bookmark, reset]);

  // Auto-fill title and description when metadata is fetched
  useEffect(() => {
    if (metadata && metadata.success && !isEditMode && !metadataApplied) {
      // Only auto-fill if the fields are empty
      if (!titleValue && metadata.title) {
        setValue('title', metadata.title);
      }
      if (!descriptionValue && metadata.description) {
        setValue('description', metadata.description);
      }
      setMetadataApplied(true);
    }
  }, [metadata, isEditMode, titleValue, descriptionValue, setValue, metadataApplied]);

  // Reset metadataApplied when URL changes
  useEffect(() => {
    setMetadataApplied(false);
  }, [debouncedUrl]);

  /**
   * Handle form submission
   */
  const onSubmit = (data: BookmarkFormData) => {
    const bookmarkData: BookmarkData = {
      url: data.url.trim(),
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      tags: data.tags.length > 0 ? data.tags : undefined,
    };

    onSave(bookmarkData);
  };

  /**
   * URL validation regex
   * Validates http/https URLs
   */
  const urlPattern = /^https?:\/\/.+\..+/i;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* URL Field */}
      <div>
        <Input
          label="URL"
          type="text"
          placeholder="https://example.com"
          disabled={isLoading || isEditMode} // URL is readonly in edit mode
          error={errors.url?.message}
          {...register('url', {
            required: 'URL is required',
            validate: (value) => {
              const trimmedValue = value.trim();
              if (!urlPattern.test(trimmedValue)) {
                return 'Please enter a valid URL (must start with http:// or https://)'
              }
              return true;
            },
          })}
        />
        {/* Metadata loading indicator */}
        {!isEditMode && isLoadingMetadata && (
          <p className="mt-1 text-sm text-blue-600 flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Fetching page details...
          </p>
        )}
        {/* Metadata success indicator */}
        {!isEditMode && metadata && metadata.success && !isLoadingMetadata && (
          <p className="mt-1 text-sm text-green-600">
            ✓ Title and description auto-filled
          </p>
        )}
        {/* Metadata error indicator (silent, non-blocking) */}
        {!isEditMode && metadataError && !isLoadingMetadata && (
          <p className="mt-1 text-sm text-gray-500">
            Could not fetch page details. Please fill manually.
          </p>
        )}
      </div>

      {/* Title Field */}
      <Input
        label="Title"
        type="text"
        placeholder="Enter bookmark title"
        disabled={isLoading}
        error={errors.title?.message}
        {...register('title', {
          required: 'Title is required',
          minLength: {
            value: 3,
            message: 'Title must be at least 3 characters',
          },
          maxLength: {
            value: 200,
            message: 'Title must be less than 200 characters',
          },
        })}
      />

      {/* Description Field */}
      <Textarea
        label="Description"
        placeholder="Optional description or notes"
        rows={4}
        disabled={isLoading}
        error={errors.description?.message}
        helperText="Add a description to help you remember this bookmark"
        {...register('description', {
          maxLength: {
            value: 1000,
            message: 'Description must be less than 1000 characters',
          },
        })}
      />

      {/* Tags Field */}
      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <TagInput
            label="Tags"
            value={field.value}
            onChange={field.onChange}
            placeholder="Add tags (press Enter or comma)"
            disabled={isLoading}
            error={errors.tags?.message}
            helperText="Press Enter or comma to add a tag. Click X to remove."
            maxTags={20}
          />
        )}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          fullWidth
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          fullWidth
        >
          {isEditMode ? 'Update Bookmark' : 'Create Bookmark'}
        </Button>
      </div>
    </form>
  );
}

export default BookmarkForm;
