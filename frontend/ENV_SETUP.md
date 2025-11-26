# Environment Configuration Guide

## Overview

This project uses different environment configurations for development and production. Environment variables are managed through `.env` files and Vite's built-in environment variable system.

## Environment Files

### `.env` (Local - Git Ignored)
**Purpose**: Contains your actual Firebase credentials and local settings.
**Git Status**: ❌ **Ignored** (contains sensitive data)
**When to use**: For your local development with real Firebase project

```bash
# Copy from .env.example and fill with your Firebase credentials
cp .env.example .env
```

### `.env.example` (Template - Git Tracked)
**Purpose**: Template showing required environment variables.
**Git Status**: ✅ **Tracked**
**When to use**: Reference for new developers setting up the project

### `.env.development` (Development - Git Tracked)
**Purpose**: Development-specific configuration.
**Git Status**: ✅ **Tracked**
**When to use**: Automatically loaded when running `npm run dev`

**Contains**:
- Development app name
- Local dev server URL (http://localhost:5173)
- Firebase emulator settings (optional)

### `.env.production` (Production - Git Tracked)
**Purpose**: Production-specific configuration.
**Git Status**: ✅ **Tracked**
**When to use**: Automatically loaded when running `npm run build`

**Contains**:
- Production app name
- Production URL (set in deployment platform)
- Production Firebase settings

## Environment Variable Priority

Vite loads environment files in this priority order (highest to lowest):

1. `.env.[mode].local` (e.g., `.env.development.local`) - Git ignored
2. `.env.[mode]` (e.g., `.env.development`) - Git tracked
3. `.env.local` - Git ignored
4. `.env` - Git ignored

**Example**:
```bash
# When running: npm run dev
# Vite loads in order:
.env.development.local  # If exists
.env.development        # ✅ Loaded
.env.local              # If exists
.env                    # ✅ Loaded (your Firebase credentials)
```

## Setup Instructions

### First Time Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Get Firebase credentials**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Project Settings** → **Your apps** → **Web app**
   - Copy the configuration values

3. **Edit `.env` with your credentials**:
   ```bash
   VITE_FIREBASE_API_KEY=your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Run the dev server**:
   ```bash
   npm run dev
   ```

### Production Deployment

#### Option 1: Environment Variables in Deployment Platform (Recommended)

Most deployment platforms (Vercel, Netlify, etc.) allow you to set environment variables in their dashboard:

**Vercel**:
1. Go to Project Settings → Environment Variables
2. Add all `VITE_FIREBASE_*` variables
3. Set `VITE_APP_URL` to your production domain

**Netlify**:
1. Go to Site Settings → Build & Deploy → Environment
2. Add all `VITE_FIREBASE_*` variables
3. Set `VITE_APP_URL` to your production domain

#### Option 2: Use .env.production (Less Secure)

If your deployment platform doesn't support env variables:

1. Create `.env.production.local` (git ignored):
   ```bash
   cp .env .env.production.local
   ```

2. Add production URL:
   ```bash
   VITE_APP_URL=https://your-production-domain.com
   ```

⚠️ **Warning**: Never commit `.env.production.local` with real credentials!

## Required Environment Variables

### Firebase Configuration (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyXXXXXXXXXXXXXX` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789012:web:abc123` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID | Not set | `G-XXXXXXXXXX` |
| `VITE_APP_NAME` | Application Name | `Bookmarks App` | `My Bookmarks` |
| `VITE_APP_URL` | Application URL | Auto-detected | `https://mybookmarks.com` |
| `VITE_USE_FIREBASE_EMULATORS` | Use local emulators | `false` | `true` |

## Using Environment Variables in Code

### Import and Use

```typescript
// ❌ Wrong - won't work
const apiKey = process.env.VITE_FIREBASE_API_KEY;

// ✅ Correct - use import.meta.env
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
```

### Use App Config (Recommended)

```typescript
import { appConfig } from '@/config/app';

// Get app URL (auto-adapts to environment)
console.log(appConfig.url); // 'http://localhost:5173' in dev, production URL in prod

// Check environment
if (appConfig.isDevelopment) {
  console.log('Running in development mode');
}

// Build full URLs
import { buildUrl } from '@/config/app';
const bookmarkUrl = buildUrl('/bookmarks/123');
// => 'http://localhost:5173/bookmarks/123' in dev
// => 'https://your-domain.com/bookmarks/123' in prod
```

## Firebase Emulators

For local development, you can use Firebase Emulators instead of the production Firebase:

### Setup

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize emulators** (from project root):
   ```bash
   firebase init emulators
   ```
   Select:
   - Authentication
   - Firestore
   - Storage
   - Functions

4. **Start emulators**:
   ```bash
   firebase emulators:start
   ```

5. **Enable in your app**:
   ```bash
   # In .env or .env.development
   VITE_USE_FIREBASE_EMULATORS=true
   ```

### Emulator Ports

The emulators run on these ports (configurable in `firebase.json`):
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Functions: http://localhost:5001
- Emulator UI: http://localhost:4000

## Troubleshooting

### Issue: "Firebase configuration error"

**Cause**: Missing or incorrect environment variables.

**Solution**:
1. Check that `.env` file exists
2. Verify all required `VITE_FIREBASE_*` variables are set
3. Restart dev server after changing `.env`

### Issue: "App URL is wrong in production"

**Cause**: `VITE_APP_URL` not set in deployment platform.

**Solution**:
1. Set `VITE_APP_URL` in your deployment platform's environment variables
2. Or, let it auto-detect using `window.location.origin`

### Issue: "Changes to .env not taking effect"

**Cause**: Vite caches environment variables.

**Solution**:
```bash
# Stop the dev server and restart
npm run dev
```

### Issue: "Environment variables are undefined"

**Cause**: Using `process.env` instead of `import.meta.env`.

**Solution**:
```typescript
// Change this:
const key = process.env.VITE_FIREBASE_API_KEY;

// To this:
const key = import.meta.env.VITE_FIREBASE_API_KEY;
```

## Security Best Practices

1. ✅ **Never commit `.env` with real credentials**
   - Already in `.gitignore`

2. ✅ **Use different Firebase projects for dev/prod**
   - Development project for testing
   - Production project for live users

3. ✅ **Restrict Firebase API keys**
   - Set allowed domains in Firebase Console
   - Enable App Check for production

4. ✅ **Use deployment platform env variables**
   - More secure than committing `.env.production.local`
   - Easier to rotate credentials

5. ✅ **Keep measurement ID optional**
   - Only add if using Google Analytics
   - Reduces unnecessary data collection

## Example Configurations

### Development with Real Firebase

```bash
# .env
VITE_FIREBASE_API_KEY=AIzaSy_dev_project_key
VITE_FIREBASE_AUTH_DOMAIN=bookmarks-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bookmarks-dev
VITE_FIREBASE_STORAGE_BUCKET=bookmarks-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:devapp123
```

### Development with Emulators

```bash
# .env
# ... same Firebase config as above ...

# .env.development or .env.local
VITE_USE_FIREBASE_EMULATORS=true
```

### Production (Platform Environment Variables)

Set these in Vercel/Netlify dashboard:
```bash
VITE_FIREBASE_API_KEY=AIzaSy_prod_project_key
VITE_FIREBASE_AUTH_DOMAIN=bookmarks-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bookmarks-prod
VITE_FIREBASE_STORAGE_BUCKET=bookmarks-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321098
VITE_FIREBASE_APP_ID=1:987654321098:web:prodapp456
VITE_APP_URL=https://bookmarks.yourdomain.com
```

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Configuration Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Emulators Documentation](https://firebase.google.com/docs/emulator-suite)
