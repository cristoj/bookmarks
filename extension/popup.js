// Initialize Firebase (config loaded from firebase-config.js)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const functions = firebase.functions();

// UI Elements
const loginForm = document.getElementById('login-form');
const bookmarkForm = document.getElementById('bookmark-form');
const loading = document.getElementById('loading');

// Check auth state
auth.onAuthStateChanged(user => {
  if (user) {
    showBookmarkForm();
  } else {
    showLoginForm();
  }
});

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showLoginError('Please enter email and password');
    return;
  }

  showLoading();

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showLoginError(''); // Clear error
  } catch (error) {
    showLoginError(getErrorMessage(error));
  } finally {
    hideLoading();
  }
});

// Handle Enter key on login form
document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('login-btn').click();
  }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await auth.signOut();
    // Clear cached tags
    await chrome.storage.local.remove(['tags', 'tagsTimestamp']);
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Global tag input instance
let tagInput = null;

// Save Bookmark
document.getElementById('save-btn').addEventListener('click', async () => {
  const url = document.getElementById('url').value.trim();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const tags = tagInput ? tagInput.getValue() : [];

  if (!url || !title) {
    showMessage('❌ URL and Title are required', 'error');
    return;
  }

  showLoading();

  try {
    const createBookmark = functions.httpsCallable('createBookmark');

    // Build bookmark data - only include optional fields if they have values
    const bookmarkData = {
      url,
      title
    };

    if (description) {
      bookmarkData.description = description;
    }

    if (tags.length > 0) {
      bookmarkData.tags = tags;
    }

    const result = await createBookmark(bookmarkData);

    showMessage('✅ Bookmark saved successfully!', 'success');

    // Update cached tags with new ones
    if (tags.length > 0) {
      updateTagsCache(tags);
    }

    // Clear form fields (except URL and title for next save)
    document.getElementById('description').value = '';
    if (tagInput) {
      tagInput.setValue([]);
    }

    // Optional: Open app in new tab after short delay
    setTimeout(() => {
      const openApp = confirm('Bookmark saved! Open Bookmarks App?');
      if (openApp) {
        chrome.tabs.create({ url: 'https://bookmarks-cristoj.web.app' });
      }
    }, 1000);

  } catch (error) {
    console.error('Save error:', error);
    showMessage('❌ ' + getErrorMessage(error), 'error');
  } finally {
    hideLoading();
  }
});

// Get current tab info
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Load user tags for autocomplete
async function loadTags() {
  try {
    // Try to get from cache first (chrome.storage)
    const cached = await chrome.storage.local.get(['tags', 'tagsTimestamp']);
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    if (cached.tags && cached.tagsTimestamp && Date.now() - cached.tagsTimestamp < CACHE_DURATION) {
      initializeTagInput(cached.tags);
      return;
    }

    // Fetch fresh tags from Firebase
    const getTags = functions.httpsCallable('getTags');
    const result = await getTags();
    const tags = result.data.tags;

    // Cache tags
    await chrome.storage.local.set({
      tags: tags,
      tagsTimestamp: Date.now()
    });

    initializeTagInput(tags);
  } catch (error) {
    console.error('Failed to load tags:', error);
    // Continue without autocomplete - not critical
  }
}

// Update tags cache with newly used tags
async function updateTagsCache(newTags) {
  try {
    const cached = await chrome.storage.local.get(['tags']);
    if (!cached.tags) return;

    const existingTags = cached.tags;
    let updated = false;

    newTags.forEach(tagName => {
      const exists = existingTags.some(t => t.name === tagName);
      if (!exists) {
        existingTags.push({ name: tagName, count: 1 });
        updated = true;
      }
    });

    if (updated) {
      await chrome.storage.local.set({ tags: existingTags });
      initializeTagInput(existingTags);
    }
  } catch (error) {
    console.error('Failed to update tags cache:', error);
  }
}

// Initialize or update tag input component
function initializeTagInput(tags) {
  if (!tagInput) {
    // Create tag input component for the first time
    tagInput = new TagInput('tags-container', 'tags', tags);
  } else {
    // Update available tags
    tagInput.setAvailableTags(tags);
  }
}

// Show bookmark form
async function showBookmarkForm() {
  loginForm.style.display = 'none';
  bookmarkForm.style.display = 'block';
  loading.style.display = 'none';

  // Auto-fill from current tab
  try {
    const tab = await getCurrentTab();
    document.getElementById('url').value = tab.url;
    document.getElementById('title').value = tab.title;

    // Load tags for autocomplete
    loadTags();

    // Focus on title field
    document.getElementById('title').focus();
    document.getElementById('title').select();
  } catch (error) {
    console.error('Error getting current tab:', error);
  }
}

// Show login form
function showLoginForm() {
  loginForm.style.display = 'block';
  bookmarkForm.style.display = 'none';
  loading.style.display = 'none';

  // Focus on email field
  setTimeout(() => {
    document.getElementById('email').focus();
  }, 100);
}

// Helper functions
function showLoading() {
  loading.style.display = 'block';
  loginForm.style.display = 'none';
  bookmarkForm.style.display = 'none';
}

function hideLoading() {
  loading.style.display = 'none';
  // Auth state will determine which form to show
}

function showMessage(msg, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = msg;
  messageEl.className = type;

  setTimeout(() => {
    messageEl.textContent = '';
    messageEl.className = '';
  }, 5000);
}

function showLoginError(msg) {
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = msg;
}

// Get user-friendly error message
function getErrorMessage(error) {
  if (error.code === 'auth/invalid-email') {
    return 'Invalid email address';
  } else if (error.code === 'auth/user-not-found') {
    return 'User not found';
  } else if (error.code === 'auth/wrong-password') {
    return 'Incorrect password';
  } else if (error.code === 'auth/network-request-failed') {
    return 'Network error. Check your connection';
  } else if (error.message) {
    return error.message;
  } else {
    return 'An error occurred. Please try again';
  }
}
