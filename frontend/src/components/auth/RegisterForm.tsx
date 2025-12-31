import React, { useState, type FormEvent, type JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useRecaptcha } from '@hooks/useRecaptcha';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import type { RegisterFormData } from '@types';

/**
 * Register Form Component
 * Allows new users to create an account
 *
 * @example
 * ```tsx
 * <RegisterForm />
 * ```
 */
export function RegisterForm(): JSX.Element {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { verifier, isReady, widgetId, error: recaptchaError } = useRecaptcha('register-recaptcha');

  // Form state
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  // UI state
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Clear general error
    if (generalError) {
      setGeneralError('');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setGeneralError('');

      // Ensure reCAPTCHA is available
      if (!verifier || !isReady) {
        setGeneralError('Please complete the reCAPTCHA before continuing.');
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
        setGeneralError('reCAPTCHA verification failed. Please complete the widget.');
        setLoading(false);
        return;
      }

      await register(formData.email, formData.password, formData.displayName.trim());

      // Success - navigate to home
      navigate('/');
    } catch (error: any) {
      setGeneralError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 shadow-lg p-8 rounded-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-3xl">Create an account</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
            Join us and start organizing your bookmarks
          </p>
        </div>

        {/* General error message */}
        {generalError && (
          <div className="bg-red-50 mb-6 p-4 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="mt-0.5 mr-2 w-5 h-5 text-red-500 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800 text-sm">{generalError}</p>
            </div>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name field */}
          <Input
            label="Display Name"
            type="text"
            name="displayName"
            placeholder="John Doe"
            value={formData.displayName}
            onChange={handleChange}
            error={errors.displayName}
            required
            autoComplete="name"
          />

          {/* Email field */}
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
          />

          {/* Password field */}
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            helperText="Must be at least 6 characters"
            required
            autoComplete="new-password"
          />

          {/* Confirm Password field */}
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />

          {/* reCAPTCHA */}
          <div id="register-recaptcha" className="flex justify-center mb-4"></div>
          {recaptchaError && (
            <div className="bg-red-50 mb-4 p-3 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{recaptchaError}</p>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={true}
            className="mt-6"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="border-gray-300 border-t w-full" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Login link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="font-medium text-blue-500 hover:text-blue-600 transition-colors"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
