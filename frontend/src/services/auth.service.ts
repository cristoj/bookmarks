import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@services/firebase';
import type { User } from '@types';

/**
 * Authentication Service
 * Handles all Firebase Authentication operations and user management
 */
export const authService = {
  /**
   * Register a new user with email and password
   * Creates Firebase Auth account and Firestore user document
   *
   * @param email - User email address
   * @param password - User password (min 6 characters)
   * @param displayName - User display name
   * @returns Promise resolving to the created Firebase user
   * @throws {FirebaseError} If registration fails
   *
   * @example
   * ```typescript
   * try {
   *   const user = await authService.register(
   *     'user@example.com',
   *     'password123',
   *     'John Doe'
   *   );
   *   console.log('User registered:', user.uid);
   * } catch (error) {
   *   console.error('Registration failed:', error);
   * }
   * ```
   */
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<FirebaseUser> {
    try {
      // Create Firebase Auth user
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName,
      });

      // Create user document in Firestore
      const userData: Omit<User, 'uid'> = {
        uid: user.uid,
        email: user.email!,
        displayName,
        photoURL: null,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Login user with email and password
   *
   * @param email - User email address
   * @param password - User password
   * @returns Promise resolving to the authenticated Firebase user
   * @throws {FirebaseError} If login fails
   *
   * @example
   * ```typescript
   * try {
   *   const user = await authService.login('user@example.com', 'password123');
   *   console.log('User logged in:', user.uid);
   * } catch (error) {
   *   console.error('Login failed:', error);
   * }
   * ```
   */
  async login(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Logout current user
   *
   * @returns Promise resolving when logout is complete
   * @throws {FirebaseError} If logout fails
   *
   * @example
   * ```typescript
   * try {
   *   await authService.logout();
   *   console.log('User logged out');
   * } catch (error) {
   *   console.error('Logout failed:', error);
   * }
   * ```
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Send password reset email
   *
   * @param email - User email address
   * @returns Promise resolving when email is sent
   * @throws {FirebaseError} If sending email fails
   *
   * @example
   * ```typescript
   * try {
   *   await authService.forgotPassword('user@example.com');
   *   console.log('Password reset email sent');
   * } catch (error) {
   *   console.error('Failed to send reset email:', error);
   * }
   * ```
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  },

  /**
   * Subscribe to authentication state changes
   *
   * @param callback - Function called when auth state changes
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = authService.onAuthChange((user) => {
   *   if (user) {
   *     console.log('User is logged in:', user.uid);
   *   } else {
   *     console.log('User is logged out');
   *   }
   * });
   *
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   */
  onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Get current user's ID token for authenticated requests
   *
   * @returns Promise resolving to the ID token
   * @throws {Error} If no user is logged in
   *
   * @example
   * ```typescript
   * try {
   *   const token = await authService.getIdToken();
   *   // Use token in API requests
   *   fetch('/api/endpoint', {
   *     headers: { 'Authorization': `Bearer ${token}` }
   *   });
   * } catch (error) {
   *   console.error('No user logged in');
   * }
   * ```
   */
  async getIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }
    return await user.getIdToken();
  },

  /**
   * Get current authenticated user
   *
   * @returns Current Firebase user or null
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * Convert Firebase error codes to user-friendly messages
   *
   * @param errorCode - Firebase error code
   * @returns User-friendly error message
   * @private
   */
  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered. Please login instead.',
      'auth/invalid-email': 'Invalid email address. Please check and try again.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email. Please register first.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/requires-recent-login': 'This operation requires recent authentication. Please login again.',
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  },
};
