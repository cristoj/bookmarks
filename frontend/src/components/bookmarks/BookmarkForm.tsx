import { useEffect, type JSX } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { TagInput } from '../common/TagInput';
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
 * - Form validation with react-hook-form
 * - URL validation
 * - Tag management with chips
 * - Loading state handling
 * - Error messages
 * - Responsive design
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
    formState: { errors },
  } = useForm<BookmarkFormData>({
    defaultValues: {
      url: bookmark?.url || '',
      title: bookmark?.title || '',
      description: bookmark?.description || '',
      tags: bookmark?.tags || [],
    },
  });

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
