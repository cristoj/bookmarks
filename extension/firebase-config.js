// Firebase Configuration
// These are public API keys and are safe to commit to version control
// Security is handled by Firebase Security Rules and Authentication

const firebaseConfig = {
  apiKey: "AIzaSyBdxfsW7hURuZOXY-IHDyX0oHOcKfQ5WxU",
  authDomain: "bookmarks-cristoj.firebaseapp.com",
  projectId: "bookmarks-cristoj",
  storageBucket: "bookmarks-cristoj.firebasestorage.app",
  messagingSenderId: "372143535558",
  appId: "1:372143535558:web:cf645c844c35f1ce6baec7"
};

// Note: These credentials are PUBLIC and meant to be exposed in client-side code.
// Firebase security is enforced through:
// 1. Firestore Security Rules (only authenticated users can access their own data)
// 2. Cloud Functions authentication checks
// 3. Storage Security Rules
