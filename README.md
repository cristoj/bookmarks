# Bookmarks App

A modern, full-stack bookmarks manager built with React and Firebase. Save, organize, and search your favorite web links with automatic screenshot capture.

## Features

- 🔖 **Bookmark Management**: Create, edit, and delete bookmarks
- 📸 **Automatic Screenshots**: Captures website screenshots using Puppeteer
- 🏷️ **Tag System**: Organize bookmarks with tags and smart autocomplete
- 🔍 **Advanced Search**: Filter by text, tags, and date range
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔐 **User Authentication**: Secure login with Firebase Auth
- ♾️ **Infinite Scroll**: Smooth pagination for large collections
- 🎯 **Smart Metadata**: Auto-extracts page titles and descriptions

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite 7** for fast builds
- **Tailwind CSS 4** for styling
- **React Query** for server state
- **React Hook Form** for forms
- **Vitest** for testing

### Backend
- **Firebase Cloud Functions** (v2, Node 22)
- **Firestore** for database
- **Cloud Storage** for screenshots
- **Puppeteer** for web scraping

## Getting Started

### Prerequisites

- Node.js 22+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project ([create one](https://console.firebase.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cristoj/bookmarks.git
   cd bookmarks
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../functions
   npm install
   ```

4. **Configure Firebase**

   Create `frontend/.env.development`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_USE_FIREBASE_EMULATORS=true
   ```

5. **Login to Firebase**
   ```bash
   firebase login
   ```

## Development

### Run with Firebase Emulators (Recommended)

The Firebase Emulator Suite allows you to develop and test locally without affecting production data.

```bash
# Terminal 1 - Start all Firebase emulators
firebase emulators:start

# Terminal 2 - Start frontend dev server
cd frontend
npm run dev
```

**Access points:**
- Frontend: http://localhost:5173
- Emulator UI: http://localhost:4000
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Storage: http://localhost:9199

**Run specific emulators:**
```bash
firebase emulators:start --only functions     # Functions only
firebase emulators:start --only hosting       # Hosting only
firebase emulators:start --only firestore     # Firestore only
firebase emulators:start --only auth          # Auth only
```

### Frontend Development

```bash
cd frontend
npm run dev                    # Start dev server at http://localhost:5173
npm run build                  # Type check + build for production
npm run preview               # Preview production build locally
npm run lint                  # Run ESLint
```

### Backend Development

```bash
cd functions
npm run serve                 # Build and start Firebase emulators
npm run build                 # Compile TypeScript
npm run build:watch          # Watch mode compilation
npm run logs                 # View function logs (production)
```

**View function logs:**
```bash
firebase functions:log                      # All functions
firebase functions:log --only createBookmark  # Specific function
```

## Testing

### Frontend Tests

The frontend uses **Vitest** and **React Testing Library** for unit and integration tests.

```bash
cd frontend

# Run tests
npm test                      # Run tests in watch mode
npm run test:run             # Run tests once
npm run test:ui              # Open Vitest UI (visual test runner)
npm run test:coverage        # Generate coverage report

# Linting
npm run lint                  # Run ESLint
```

**Test files:** `*.test.tsx` or `*.test.ts` in `src/` directory

### Backend Tests

The backend uses **Mocha** and **Chai** for Cloud Functions testing.

```bash
cd functions

# Run tests
npm test                      # Run all function tests
npm run test:watch           # Run tests in watch mode

# Build
npm run build                # Compile TypeScript
npm run build:watch          # Watch mode compilation
```

**Test files:** `*.test.ts` in `src/` directory

## Deployment

### Prerequisites

Make sure you're logged in to Firebase:
```bash
firebase login
```

### Deploy Everything

Deploy the complete application (hosting, functions, and rules):
```bash
firebase deploy
```

This command will:
1. Build the frontend (`npm run build` in `frontend/`)
2. Compile Cloud Functions
3. Deploy hosting, functions, and security rules

### Deploy Specific Parts

**Frontend (Hosting):**
```bash
firebase deploy --only hosting
```
This automatically runs `npm run build` in the `frontend/` directory.

**Backend (Cloud Functions):**
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:createBookmark
firebase deploy --only functions:getBookmarks
firebase deploy --only functions:updateBookmark
firebase deploy --only functions:deleteBookmark
firebase deploy --only functions:getTags
firebase deploy --only functions:captureScreenshot
```

**Security Rules:**
```bash
# Firestore rules
firebase deploy --only firestore:rules

# Storage rules
firebase deploy --only storage:rules

# Both rules
firebase deploy --only firestore:rules,storage:rules
```

**Indexes:**
```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### Preview Deployments

Create a temporary preview URL before deploying to production:
```bash
firebase hosting:channel:deploy preview     # Deploy to preview channel
firebase hosting:channel:list               # List all preview channels
firebase hosting:channel:delete preview     # Delete preview channel
```

### Monitoring

**View logs:**
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only createBookmark

# With limit
firebase functions:log --limit 100
```

**List deployed functions:**
```bash
firebase functions:list
```

**Check Firestore databases:**
```bash
firebase firestore:databases:list
firebase firestore:databases:get (default)
```

## Project Structure

```
bookmarks/
├── frontend/              # React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks (React Query)
│   │   ├── pages/         # Route pages
│   │   ├── services/      # Firebase services
│   │   └── utils/         # Utilities
│   └── public/            # Static assets
│
├── functions/             # Cloud Functions
│   ├── src/
│   │   ├── bookmarks/     # Bookmark CRUD
│   │   ├── screenshots/   # Screenshot capture
│   │   └── utils/         # Helpers
│   └── package.json
│
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── firebase.json          # Firebase config
└── README.md
```

## Key Features Explained

### Screenshot Capture

Screenshots are captured automatically when you create a bookmark:
- Uses Puppeteer with optimized Chrome flags
- 2GB memory allocation for stability
- Retries up to 3 times on failure
- Falls back gracefully if capture fails

### Tag System

Tags use autocomplete with smart search:
- Type 2+ characters to see suggestions
- Shows tag usage counts
- 500ms debounce to optimize performance
- Chip-based UI for easy removal

### Infinite Scroll

Bookmarks load progressively as you scroll:
- 12 bookmarks per page by default
- Smooth loading states
- Error handling
- "Load more" fallback for accessibility

## Configuration

### Memory Settings

Cloud Functions use **2GB memory** for Puppeteer. Adjust in:
- `functions/src/screenshots/trigger.ts` (line 14)
- `functions/src/screenshots/capture.ts` (line 63)

### Screenshot Retry Schedule

Failed screenshots retry every 24 hours. Adjust in:
- `functions/src/screenshots/retry.ts` (line 37)

## Environment Variables

### Frontend
- `VITE_FIREBASE_*` - Firebase config
- `VITE_USE_FIREBASE_EMULATORS` - Use local emulators

## Contributing

This is a personal project, but feel free to fork and adapt for your needs.

## License

MIT

## Documentation

- Full setup guide: `firebase-setup-guide.md` (Spanish)
- Project specifications: `especificaciones-app-favoritos.md` (Spanish)
- Claude Code instructions: `CLAUDE.md`
- Bug fixes log: `BUGFIX-TAGS.md`
- Testing notes: `TESTING.md`

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using React, Firebase, and Claude Code**
