import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

/**
 * Firebase configuration object
 * Values are loaded from environment variables (Vite prefixed with VITE_)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase application
 * @type {FirebaseApp}
 */
const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance
 * Used for user authentication (login, register, logout, etc.)
 *
 * @example
 * ```typescript
 * import { auth } from '@services/firebase';
 * import { signInWithEmailAndPassword } from 'firebase/auth';
 *
 * const login = async (email: string, password: string) => {
 *   const userCredential = await signInWithEmailAndPassword(auth, email, password);
 *   return userCredential.user;
 * };
 * ```
 */
export const auth: Auth = getAuth(app);

/**
 * Firestore Database instance
 * Used for storing and querying bookmarks, users, and tags
 *
 * @example
 * ```typescript
 * import { db } from '@services/firebase';
 * import { collection, getDocs } from 'firebase/firestore';
 *
 * const getBookmarks = async () => {
 *   const querySnapshot = await getDocs(collection(db, 'bookmarks'));
 *   return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
 * };
 * ```
 */
export const db: Firestore = getFirestore(app);

/**
 * Firebase Storage instance
 * Used for storing and retrieving bookmark screenshots
 *
 * @example
 * ```typescript
 * import { storage } from '@services/firebase';
 * import { ref, getDownloadURL } from 'firebase/storage';
 *
 * const getScreenshotUrl = async (path: string) => {
 *   const storageRef = ref(storage, path);
 *   return await getDownloadURL(storageRef);
 * };
 * ```
 */
export const storage: FirebaseStorage = getStorage(app);

/**
 * Firebase Cloud Functions instance
 * Used for calling backend Cloud Functions (CRUD operations, screenshots, etc.)
 *
 * @example
 * ```typescript
 * import { functions } from '@services/firebase';
 * import { httpsCallable } from 'firebase/functions';
 *
 * const createBookmark = httpsCallable(functions, 'createBookmark');
 * const result = await createBookmark({ url: 'https://example.com', title: 'Example' });
 * ```
 */
export const functions: Functions = getFunctions(app);

/**
 * Connect to Firebase Emulators for local development
 * Uncomment the lines below to use Firebase emulators locally
 * Make sure to start emulators first: firebase emulators:start
 *
 * Emulator ports (configured in firebase.json):
 * - Auth: 9099
 * - Firestore: 8080
 * - Storage: 9199
 * - Functions: 5001
 * - Emulator UI: http://localhost:4000
 */
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  // Connect to Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

  // Connect to Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);

  // Connect to Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199);

  // Connect to Functions emulator
  connectFunctionsEmulator(functions, 'localhost', 5001);

  console.log('🔧 Connected to Firebase Emulators');
}

/**
 * Export the initialized Firebase app
 * @type {FirebaseApp}
 */
export default app;
