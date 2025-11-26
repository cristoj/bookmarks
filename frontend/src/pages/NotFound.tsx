import { type JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

/**
 * NotFound (404) Page Component
 *
 * Displays when a user navigates to a non-existent route.
 *
 * Features:
 * - Friendly 404 message
 * - Navigation back to home page
 * - Browser back button
 * - Responsive design
 * - Clean, centered layout
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Routes>
 *   <Route path="*" element={<NotFound />} />
 * </Routes>
 * ```
 */
export function NotFound(): JSX.Element {
  const navigate = useNavigate();

  /**
   * Navigate back in browser history
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-blue-500">404</h1>
          <div className="h-1 w-32 bg-blue-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-bold text-gray-900">Page Not Found</h2>
          <p className="text-gray-600 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        {/* Additional Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{' '}
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
