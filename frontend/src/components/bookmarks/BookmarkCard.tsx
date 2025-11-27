import { Edit, Trash2, ExternalLink, Tag as TagIcon } from 'lucide-react';
import { type Bookmark } from '../../services/bookmarks.service';
import { formatRelativeTime } from '../../utils/dateFormat';
import type { JSX } from 'react';

/**
 * BookmarkCard component props
 */
export interface BookmarkCardProps {
  /**
   * Bookmark data to display
   */
  bookmark: Bookmark;
  /**
   * Callback when edit button is clicked
   */
  onEdit: (bookmark: Bookmark) => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: (bookmarkId: string) => void;
  /**
   * Optional callback when a tag is clicked
   */
  onTagClick?: (tag: string) => void;
}

/**
 * BookmarkCard Component
 *
 * Displays a single bookmark with screenshot, title, description, tags,
 * and action buttons (edit, delete).
 *
 * Features:
 * - Screenshot with fallback image
 * - Truncated title and description
 * - Relative date formatting
 * - Clickable tags
 * - Hover effects
 * - Responsive design
 *
 * @example
 * ```tsx
 * <BookmarkCard
 *   bookmark={bookmark}
 *   onEdit={(bookmark) => handleEdit(bookmark)}
 *   onDelete={(id) => handleDelete(id)}
 *   onTagClick={(tag) => filterByTag(tag)}
 * />
 * ```
 */
export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onTagClick,
}: BookmarkCardProps): JSX.Element {
  const {
    id,
    title,
    url,
    description,
    tags,
    screenshotUrl,
    createdAt,
  } = bookmark;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full mx-auto">
      {/* Screenshot Section */}
      <div className="relative aspect-video bg-black">
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ExternalLink className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {/* Overlay with URL link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center group"
          aria-label={`Visitar ${title}`}
        >
          <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </a>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
            title={title}
          >
            {title}
          </a>
          <p className="text-xs text-gray-500 mt-1">
            {formatRelativeTime(createdAt)}
          </p>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2" title={description}>
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                aria-label={`Filtrar por tag: ${tag}`}
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onEdit(bookmark)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Editar bookmark"
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Editar
          </button>
          <button
            onClick={() => onDelete(id)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            aria-label="Eliminar bookmark"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookmarkCard;
