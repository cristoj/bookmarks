import React, { useState, type FormEvent, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useRecaptcha } from '@hooks/useRecaptcha';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import type { ForgotPasswordFormData } from '@types';

/**
 * Forgot Password Form Component
 * Allows users to request a password reset email
 *
 * @example
 * ```tsx
 * <ForgotPasswordForm />
 * ```
 */
export function ForgotPasswordForm(): JSX.Element {
  const { forgotPassword } = useAuth();
  const { verifier, isReady, widgetId, error: recaptchaError } = useRecaptcha('forgot-password-recaptcha');

  // Form state
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });

  // UI state
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Validate email
   */
  const validateEmail = (): boolean => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }

    return true;
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    if (error) {
      setError('');
    }
    if (success) {
      setSuccess(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate email
    if (!validateEmail()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Ensure reCAPTCHA is available
      if (!verifier || !isReady) {
        setError('Por favor, completa el reCAPTCHA antes de continuar.');
        setLoading(false);
        return;
      }

      try {
        if (typeof window !== 'undefined' && (window as any).grecaptcha && typeof widgetId !== 'undefined') {
          const resp = (window as any).grecaptcha.getResponse(widgetId as number);
          if (!resp) throw new Error('reCAPTCHA not completed');
        } else if (typeof verifier.verify === 'function') {
          // @ts-ignore
          const verifyPromise = verifier.verify();
          const timeoutMs = 5000;
          await Promise.race([
            verifyPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('reCAPTCHA verification timeout')), timeoutMs)),
          ]);
        } else {
          throw new Error('reCAPTCHA verification not available');
        }
      } catch (recapErr: any) {
        console.error('reCAPTCHA verify error:', recapErr);
        setError('reCAPTCHA verification failed. Please complete the widget.');
        setLoading(false);
        return;
      }

      await forgotPassword(formData.email);

      // Success - show success message
      setSuccess(true);
      setFormData({ email: '' });
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Password reset email sent!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Check your inbox for instructions to reset your password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            disabled={success}
          />

          {/* reCAPTCHA */}
          <div id="forgot-password-recaptcha" className="flex justify-center mb-4"></div>
          {recaptchaError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{recaptchaError}</p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading || success}
          >
            {loading ? 'Sending email...' : 'Send reset link'}
          </Button>
        </form>

        {/* Back to login link */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to login
          </Link>
        </div>

        {/* Additional help text */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong className="font-medium text-gray-700">Note:</strong> If you don't receive an email within a few minutes,
            check your spam folder or try again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
