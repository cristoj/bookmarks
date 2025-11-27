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

```bash
# Terminal 1 - Start Firebase emulators
firebase emulators:start

# Terminal 2 - Start frontend dev server
cd frontend
npm run dev
```

Frontend: http://localhost:5173
Emulator UI: http://localhost:4000

### Run Frontend Only

```bash
cd frontend
npm run dev
```

### Build Functions

```bash
cd functions
npm run build
```

## Testing

### Frontend Tests
```bash
cd frontend
npm test              # Watch mode
npm run test:run      # Run once
npm run test:coverage # With coverage
```

### Backend Tests
```bash
cd functions
npm test
```

## Deployment

### Deploy Everything
```bash
firebase deploy
```

### Deploy Specific Parts
```bash
firebase deploy --only hosting              # Frontend only
firebase deploy --only functions            # Functions only
firebase deploy --only firestore:rules      # Firestore rules
firebase deploy --only storage:rules        # Storage rules
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
