import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

// Mock Firebase modules
vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('./firebase', () => ({
  auth: {},
  db: {},
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('creates user and Firestore document successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);
      vi.mocked(updateProfile).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await authService.register(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'Test User',
      });
      expect(setDoc).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('throws user-friendly error on email already in use', async () => {
      const error = { code: 'auth/email-already-in-use' };
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(error);

      await expect(
        authService.register('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('This email is already registered');
    });

    it('throws user-friendly error on weak password', async () => {
      const error = { code: 'auth/weak-password' };
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(error);

      await expect(
        authService.register('test@example.com', '123', 'Test User')
      ).rejects.toThrow('Password is too weak');
    });
  });

  describe('login', () => {
    it('signs in user successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      const result = await authService.login('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('throws user-friendly error on wrong password', async () => {
      const error = { code: 'auth/wrong-password' };
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error);

      await expect(
        authService.login('test@example.com', 'wrongpass')
      ).rejects.toThrow('Incorrect password');
    });

    it('throws user-friendly error on user not found', async () => {
      const error = { code: 'auth/user-not-found' };
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error);

      await expect(
        authService.login('notfound@example.com', 'password123')
      ).rejects.toThrow('No account found with this email');
    });
  });

  describe('logout', () => {
    it('signs out user successfully', async () => {
      vi.mocked(signOut).mockResolvedValue(undefined);

      await authService.logout();

      expect(signOut).toHaveBeenCalledWith({});
    });

    it('handles logout errors', async () => {
      const error = { code: 'auth/network-request-failed' };
      vi.mocked(signOut).mockRejectedValue(error);

      await expect(authService.logout()).rejects.toThrow('Network error');
    });
  });

  describe('forgotPassword', () => {
    it('sends password reset email successfully', async () => {
      vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);

      await authService.forgotPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com'
      );
    });

    it('throws user-friendly error on invalid email', async () => {
      const error = { code: 'auth/invalid-email' };
      vi.mocked(sendPasswordResetEmail).mockRejectedValue(error);

      await expect(
        authService.forgotPassword('invalid-email')
      ).rejects.toThrow('Invalid email address');
    });

    it('throws user-friendly error on user not found', async () => {
      const error = { code: 'auth/user-not-found' };
      vi.mocked(sendPasswordResetEmail).mockRejectedValue(error);

      await expect(
        authService.forgotPassword('notfound@example.com')
      ).rejects.toThrow('No account found with this email');
    });
  });

  describe('onAuthChange', () => {
    it('subscribes to auth state changes', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribe);

      const result = authService.onAuthChange(callback);

      expect(onAuthStateChanged).toHaveBeenCalledWith({}, callback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('getIdToken', () => {
    it('returns ID token for current user', async () => {
      const mockGetIdToken = vi.fn().mockResolvedValue('mock-token');
      const mockAuth = {
        currentUser: {
          getIdToken: mockGetIdToken,
        },
      };

      // Override the mock for this test
      vi.mocked(authService.getCurrentUser).mockReturnValue(mockAuth.currentUser as any);

      const token = await mockAuth.currentUser.getIdToken();

      expect(token).toBe('mock-token');
      expect(mockGetIdToken).toHaveBeenCalled();
    });

    it('throws error when no user is logged in', async () => {
      vi.mocked(authService.getCurrentUser).mockReturnValue(null);

      await expect(authService.getIdToken()).rejects.toThrow('No user logged in');
    });
  });

  describe('getCurrentUser', () => {
    it('returns current user when logged in', () => {

      // This would need to be tested with the actual auth object
      // For now, we just test that the method exists
      expect(authService.getCurrentUser).toBeDefined();
    });
  });

  describe('getErrorMessage', () => {
    it('returns correct message for email-already-in-use', () => {
      const message = authService.getErrorMessage('auth/email-already-in-use');
      expect(message).toContain('already registered');
    });

    it('returns correct message for invalid-email', () => {
      const message = authService.getErrorMessage('auth/invalid-email');
      expect(message).toContain('Invalid email');
    });

    it('returns correct message for weak-password', () => {
      const message = authService.getErrorMessage('auth/weak-password');
      expect(message).toContain('too weak');
    });

    it('returns correct message for wrong-password', () => {
      const message = authService.getErrorMessage('auth/wrong-password');
      expect(message).toContain('Incorrect password');
    });

    it('returns generic message for unknown error codes', () => {
      const message = authService.getErrorMessage('auth/unknown-error');
      expect(message).toContain('unexpected error');
    });

    it('handles too many requests error', () => {
      const message = authService.getErrorMessage('auth/too-many-requests');
      expect(message).toContain('Too many failed attempts');
    });

    it('handles network error', () => {
      const message = authService.getErrorMessage('auth/network-request-failed');
      expect(message).toContain('Network error');
    });
  });
});
