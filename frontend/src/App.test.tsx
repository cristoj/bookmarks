import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import * as authService from './services/auth.service';

// Mock all page components
vi.mock('./pages/Home', () => ({
  Home: () => <div>Home Page</div>,
}));

vi.mock('./pages/Login', () => ({
  Login: () => <div>Login Page</div>,
}));

vi.mock('./pages/Register', () => ({
  Register: () => <div>Register Page</div>,
}));

vi.mock('./pages/ForgotPassword', () => ({
  ForgotPassword: () => <div>Forgot Password Page</div>,
}));

vi.mock('./pages/NotFound', () => ({
  NotFound: () => <div>Not Found Page</div>,
}));

// Mock Firebase User
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
} as any;

describe('App Component', () => {
  let onAuthChangeCallback: ((user: any) => void) | null = null;

  beforeEach(() => {
    // Reset callback
    onAuthChangeCallback = null;

    // Mock authService.onAuthChange to call callback immediately
    vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
      onAuthChangeCallback = callback;
      // Call callback immediately with null to simulate initial state
      setTimeout(() => callback(null), 0);
      return vi.fn(); // Return unsubscribe function
    });

    // Clear window location
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Loading State', () => {
    it('shows loading spinner while checking authentication', () => {
      render(<App />);

      // Should show loading state before auth is determined
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('hides loading spinner after authentication is checked', async () => {
      render(<App />);

      // Trigger auth change with no user
      if (onAuthChangeCallback) {
        onAuthChangeCallback(null);
      }

      await waitFor(() => {
        expect(screen.queryByText(/verifying authentication/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated User Routing', () => {
    it('redirects unauthenticated user from home to login', async () => {
      window.history.pushState({}, '', '/');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Login Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows login page when navigating to /login', async () => {
      window.history.pushState({}, '', '/login');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Login Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows register page when navigating to /register', async () => {
      window.history.pushState({}, '', '/register');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Register Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows forgot password page when navigating to /forgot-password', async () => {
      window.history.pushState({}, '', '/forgot-password');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Forgot Password Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows 404 page for unknown routes', async () => {
      window.history.pushState({}, '', '/unknown-route');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Not Found Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Authenticated User Routing', () => {
    it('shows home page for authenticated user on /', async () => {
      // Mock auth to return user immediately
      vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      window.history.pushState({}, '', '/');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Home Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('redirects authenticated user from /login to home', async () => {
      // Mock auth to return user immediately
      vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      window.history.pushState({}, '', '/login');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Home Page')).toBeInTheDocument();
          expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('redirects authenticated user from /register to home', async () => {
      // Mock auth to return user immediately
      vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      window.history.pushState({}, '', '/register');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Home Page')).toBeInTheDocument();
          expect(screen.queryByText('Register Page')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('redirects authenticated user from /forgot-password to home', async () => {
      // Mock auth to return user immediately
      vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      window.history.pushState({}, '', '/forgot-password');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Home Page')).toBeInTheDocument();
          expect(screen.queryByText('Forgot Password Page')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('shows 404 page for unknown routes even when authenticated', async () => {
      // Mock auth to return user immediately
      vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      window.history.pushState({}, '', '/unknown-route');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Not Found Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Route Protection', () => {
    it('protects home route from unauthenticated access', async () => {
      window.history.pushState({}, '', '/');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
          expect(screen.getByText('Login Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('allows authenticated user to access home', async () => {
      // Mock auth to return user immediately
      vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      window.history.pushState({}, '', '/');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Home Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Provider Hierarchy', () => {
    it('wraps app with QueryClientProvider', () => {
      render(<App />);
      // If QueryClientProvider is missing, React Query hooks would fail
      // This test passes if the component renders without errors
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('wraps app with BrowserRouter', () => {
      render(<App />);
      // If BrowserRouter is missing, routing would fail
      // This test passes if the component renders without errors
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('wraps app with AuthProvider', () => {
      render(<App />);
      // If AuthProvider is missing, useAuth hook would fail
      // This test passes if the component renders without errors
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });



  describe('Direct URL Access', () => {
    it('handles direct access to /login', async () => {
      window.history.pushState({}, '', '/login');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Login Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('handles direct access to /register', async () => {
      window.history.pushState({}, '', '/register');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Register Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('handles direct access to protected route when authenticated', async () => {
      // Mock auth to return user immediately
      vi.spyOn(authService.authService, 'onAuthChange').mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      window.history.pushState({}, '', '/');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Home Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('handles direct access to protected route when not authenticated', async () => {
      window.history.pushState({}, '', '/');
      render(<App />);

      await waitFor(
        () => {
          expect(screen.getByText('Login Page')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });
});
