# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal bookmarks management application built with React + Firebase. Users can save, organize, and search web bookmarks with automatic screenshot capture. The app uses Firebase Authentication for user management, Cloud Functions for backend logic, Firestore for data storage, and Cloud Storage for screenshots.

## Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite 7
- Tailwind CSS 4 for styling
- React Query (TanStack Query) for server state management
- React Hook Form for form handling
- React Router v7 for routing
- Vitest + React Testing Library for testing

**Backend:**
- Firebase Cloud Functions v2 (Node 22 + TypeScript)
- Firestore for database
- Cloud Storage for screenshot storage
- Puppeteer for screenshot capture
- Mocha + Chai for testing

## Development Commands

### Frontend (in `/frontend` directory)

```bash
# Development server
npm run dev                    # Start dev server at http://localhost:5173

# Building
npm run build                  # Type check + build for production
npm run preview               # Preview production build locally

# Testing
npm test                      # Run tests in watch mode
npm run test:run             # Run tests once
npm run test:ui              # Open Vitest UI
npm run test:coverage        # Generate coverage report

# Linting
npm run lint                  # Run ESLint
```

### Backend (in `/functions` directory)

```bash
# Development
npm run serve                 # Build and start Firebase emulators
npm run build                 # Compile TypeScript
npm run build:watch          # Watch mode compilation

# Testing
npm test                      # Run function tests
npm run test:watch           # Test watch mode

# Deployment
npm run deploy               # Deploy functions to Firebase
npm run logs                 # View function logs
```

### Firebase (from project root)

```bash
# Emulators
firebase emulators:start                    # Start all emulators
firebase emulators:start --only functions   # Only functions
firebase emulators:start --only hosting     # Only hosting

# Deployment
firebase deploy                             # Deploy everything (hosting + functions + rules)
firebase deploy --only hosting              # Only frontend
firebase deploy --only functions            # Only functions
firebase deploy --only firestore:rules      # Only Firestore rules
firebase deploy --only storage:rules        # Only Storage rules
firebase deploy --only functions:createBookmark  # Specific function

# Logs & Monitoring
firebase functions:log                      # View function logs
firebase functions:log --only createBookmark  # Specific function logs

# Hosting
firebase hosting:channel:deploy preview     # Deploy to preview channel
firebase hosting:channel:list               # List preview channels
```

## Architecture

### Frontend Structure

```
frontend/src/
├── components/          # React components
│   ├── auth/           # Login, Register, ProtectedRoute
│   ├── bookmarks/      # BookmarkCard, BookmarkGrid, BookmarkForm, BookmarkFilters
│   ├── common/         # Reusable UI components (Button, Input, Modal, etc.)
│   └── layout/         # Header, Layout
├── contexts/           # React contexts
│   └── AuthContext.tsx # Global auth state management
├── hooks/              # Custom React hooks (all use React Query)
│   ├── useBookmarks.ts        # Infinite scroll query
│   ├── useCreateBookmark.ts   # Create mutation
│   ├── useUpdateBookmark.ts   # Update mutation
│   ├── useDeleteBookmark.ts   # Delete mutation
│   ├── useTags.ts             # Tags query
│   └── useInfiniteScroll.ts   # Intersection Observer hook
├── services/           # Service layer (thin wrappers around Firebase)
│   ├── firebase.ts            # Firebase initialization
│   ├── auth.service.ts        # Auth operations
│   └── bookmarks.service.ts   # Bookmark CRUD via Cloud Functions
├── pages/              # Route components
├── types/              # TypeScript interfaces
├── utils/              # Utility functions
└── config/             # App configuration
```

**Key Patterns:**
- **State Management**: AuthContext for auth, React Query for server state, useState for local UI state
- **Forms**: react-hook-form for all forms (uncontrolled components)
- **API Calls**: All backend operations go through Cloud Functions via `httpsCallable`
- **Error Handling**: Services throw custom errors, components catch and display them
- **Loading States**: React Query handles loading/error/success states automatically

### Backend Structure

```
functions/src/
├── bookmarks/
│   ├── create.ts       # createBookmark function
│   ├── get.ts          # getBookmarks function (with pagination & filters)
│   ├── update.ts       # updateBookmark function
│   ├── delete.ts       # deleteBookmark function
│   ├── tags.ts         # getTags function
│   └── helpers.ts      # Tag count management utilities
├── screenshots/
│   ├── capture.ts      # captureScreenshot function (Puppeteer)
│   └── retry.ts        # retryFailedScreenshots (scheduled function)
├── utils/
│   ├── auth.ts         # verifyAuth helper
│   └── validation.ts   # Input validation helpers
└── index.ts            # Function exports
```

**Key Patterns:**
- **Authentication**: Every function calls `verifyAuth()` first to get userId
- **Validation**: Dual validation (functions + Firestore rules)
- **Error Handling**: Throw `HttpsError` with specific codes
- **Batch Operations**: Use batch writes for tag updates
- **Atomic Operations**: Use `FieldValue.increment()` for counters

### Data Model (Firestore)

```typescript
// Collection: users/{uid}
interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: bookmarks/{id}
interface Bookmark {
  id: string;                    // Document ID
  userId: string;                // Owner user ID
  url: string;                   // Immutable after creation
  title: string;
  description: string;
  tags: string[];                // Array for easy filtering
  folderId: string | null;       // Optional folder organization
  screenshotUrl: string | null;  // Cloud Storage URL
  screenshotStatus: string;      // 'pending' | 'completed' | 'failed'
  screenshotRetries: number;     // Retry counter
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: tags/{tagName}
interface Tag {
  name: string;                  // Used as document ID
  count: number;                 // Number of bookmarks with this tag
  updatedAt: Timestamp;          // Last used timestamp
}
```

**Indexes Required:**
- `bookmarks`: userId (ASC) + createdAt (DESC)
- `bookmarks`: userId (ASC) + tags (ARRAY_CONTAINS) + createdAt (DESC)

These are defined in `firestore.indexes.json` and deployed with `firebase deploy`.

### Security Rules

**Firestore** (`firestore.rules`):
- Users can only read/write their own user document
- Bookmarks: Users can only CRUD bookmarks where `userId == auth.uid`
- Tags: Read-only for users, write-only for Cloud Functions

**Storage** (`storage.rules`):
- Path: `screenshots/{userId}/{fileName}`
- Users can read/write/delete only their own screenshots
- Only image files allowed (MIME type check)
- Max file size: 10MB

## Common Development Tasks

### Adding a New Cloud Function

1. Create function file in `functions/src/<category>/<name>.ts`
2. Export function with v2 API:
   ```typescript
   import { onCall, HttpsError } from 'firebase-functions/v2/https';
   import { verifyAuth } from '../utils/auth';

   export const myFunction = onCall(async (request) => {
     const userId = await verifyAuth(request);
     // function logic
     return { success: true };
   });
   ```
3. Export from `functions/src/index.ts`
4. Add corresponding service method in `frontend/src/services/`
5. Create custom hook in `frontend/src/hooks/` using React Query
6. Write tests for both function and hook

### Adding a New Component

1. Create component in appropriate `frontend/src/components/` subdirectory
2. Use TypeScript interfaces for props
3. Handle loading/error states from React Query hooks
4. Export from `index.ts` in the same directory
5. Write tests in `<ComponentName>.test.tsx`

### Working with Authentication

The `AuthContext` provides:
- `user`: Current Firebase user or null
- `loading`: Boolean for initial auth check
- `login(email, password)`: Login method
- `register(email, password, displayName)`: Register method
- `logout()`: Logout method
- `forgotPassword(email)`: Send password reset email

Use `ProtectedRoute` wrapper for authenticated pages:
```tsx
<ProtectedRoute>
  <HomePage />
</ProtectedRoute>
```

### Working with Bookmarks

Always use the provided hooks:
```tsx
// List bookmarks with infinite scroll
const { data, fetchNextPage, hasNextPage, isLoading } = useBookmarks(filters);

// Create bookmark
const createMutation = useCreateBookmark();
createMutation.mutate({ url, title, description, tags });

// Update bookmark
const updateMutation = useUpdateBookmark();
updateMutation.mutate({ bookmarkId, title, tags });

// Delete bookmark
const deleteMutation = useDeleteBookmark();
deleteMutation.mutate(bookmarkId);

// Get tags
const { data: tags } = useTags();
```

React Query automatically handles caching, refetching, and state synchronization.

### Working with Screenshots

Screenshot capture is **asynchronous**:
1. When creating a bookmark, it's saved immediately with `screenshotStatus: 'pending'`
2. Call `captureScreenshot` function separately (client-side trigger or backend trigger)
3. The function updates the bookmark with the screenshot URL when complete
4. If capture fails, status is set to 'failed'
5. A scheduled function retries failed screenshots every 24 hours (up to 3 attempts)

**Cost Consideration**: Each screenshot capture uses ~2 GB-seconds on Cloud Functions. The free tier allows ~400K GB-seconds/month, so roughly 200K screenshots per month (if capture takes 2 seconds each).

### Running Tests

**Frontend tests:**
- Use `describe` and `it` blocks
- Mock Firebase modules (already configured in `src/test/setup.ts`)
- Mock React Query for component tests
- Use `@testing-library/react` utilities

**Backend tests:**
- Use `describe` and `it` blocks (Mocha)
- Use `firebase-functions-test` for function emulation
- Mock Firestore and Storage operations
- Clean up in `after` hooks

### Environment Variables

**Frontend** (`.env` files):
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_USE_FIREBASE_EMULATORS=true  # For local development
```

**Backend**: Cloud Functions use Firebase Admin SDK credentials automatically. For external services:
```bash
firebase functions:config:set service.key="value"
```

## Important Constraints & Limitations

### Firestore Limitations
- **array-contains-any**: Max 10 values (affects tag filtering)
- **No full-text search**: Search is implemented client-side
- **Composite indexes**: Required for compound queries (already configured)
- **Write batches**: Max 500 operations per batch

### Cloud Functions Limitations
- **Max timeout**: 540 seconds (9 minutes) for 2nd gen functions
- **Max memory**: 8GB (we use 1GB for screenshots)
- **Cold starts**: First invocation can be slow (use `minInstances` if needed)
- **Concurrent invocations**: Controlled by `maxInstances: 10` (cost management)

### Screenshot Limitations
- **Puppeteer in Cloud Functions**: Some websites may block headless browsers
- **Timeout**: 30 seconds per page load
- **Memory usage**: ~0.5-1GB per capture
- **Cost**: ~2 GB-seconds per screenshot

### Free Tier Limits
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Cloud Functions**: 2M invocations/month, 400K GB-seconds/month
- **Cloud Storage**: 5GB storage, 1GB download/day
- **Authentication**: Unlimited (but 10K verification emails/day)

## Debugging

### Firebase Emulator Suite
Start emulators for local development:
```bash
firebase emulators:start
```

Access:
- Emulator UI: http://localhost:4000
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Functions: http://localhost:5001
- Storage: http://localhost:9199

**Connect frontend to emulators**: Set `VITE_USE_FIREBASE_EMULATORS=true` in `.env`

### Common Issues

**"Permission denied" errors:**
- Check Firestore rules in `firestore.rules`
- Verify user is authenticated
- Verify `userId` matches in the query

**Function timeouts:**
- Check function logs: `firebase functions:log`
- Increase timeout if needed (max 540s)
- For screenshots, check Puppeteer isn't hanging

**Screenshot capture fails:**
- Some sites block headless browsers (Cloudflare, etc.)
- Check URL is accessible
- Verify Storage rules allow write
- Check function logs for Puppeteer errors

**React Query cache issues:**
- Use DevTools: `import { ReactQueryDevtools } from '@tanstack/react-query-devtools'`
- Invalidate queries manually: `queryClient.invalidateQueries(['bookmarks'])`
- Check `staleTime` and `cacheTime` in query config

### Logging

**Frontend**: Use browser DevTools console

**Backend**:
```typescript
import { logger } from 'firebase-functions';
logger.info('Message', { data });
logger.error('Error', { error });
```

View logs:
```bash
firebase functions:log --only functionName
```

## Deployment

This project uses Firebase Hosting for frontend and Firebase Cloud Functions for backend.

**Deploy everything:**
```bash
firebase deploy
```

**Deploy frontend only:**
```bash
firebase deploy --only hosting
```

**Deploy functions only:**
```bash
firebase deploy --only functions
```

**Deploy Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

**Deploy Storage rules:**
```bash
firebase deploy --only storage:rules
```

**Note:** Firebase Hosting automatically builds the frontend (see `firebase.json` predeploy hooks)

## Code Style & Conventions

- **TypeScript**: Strict mode enabled, avoid `any` types
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Imports**: Use path aliases (`@/components` instead of `../../components`)
- **Error handling**: Always catch and handle errors gracefully
- **Comments**: Use JSDoc for public functions, inline comments for complex logic
- **Testing**: Write tests for all new features

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- Project specifications: See `especificaciones-app-favoritos.md` (in Spanish)
- Firebase setup guide: See `firebase-setup-guide.md` (in Spanish)
