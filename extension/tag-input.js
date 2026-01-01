/**
 * Tag Input Component (Vanilla JS)
 * Replicates the TagAutocompleteInput from the web app
 * with visual chips, autocomplete dropdown, and keyboard navigation
 */

class TagInput {
  constructor(containerId, inputId, availableTags = []) {
    this.container = document.getElementById(containerId);
    this.originalInput = document.getElementById(inputId);
    this.availableTags = availableTags;
    this.selectedTags = [];
    this.searchQuery = '';
    this.highlightedIndex = -1;

    if (!this.container) {
      console.error('Tag input container not found:', containerId);
      return;
    }

    if (!this.originalInput) {
      console.error('Original input not found:', inputId);
      return;
    }

    this.init();
  }

  init() {
    // Create new tag input UI
    this.render();
    this.attachEventListeners();
  }

  render() {
    const html = `
      <div class="tag-input-wrapper">
        <div class="tag-chips-container" id="tag-chips">
          ${this.renderChips()}
          <input
            type="text"
            class="tag-search-input"
            id="tag-search"
            placeholder="${this.selectedTags.length === 0 ? 'Start typing tags...' : ''}"
            autocomplete="off"
          />
        </div>
        <div class="tag-dropdown" id="tag-dropdown" style="display: none;">
          <!-- Autocomplete suggestions go here -->
        </div>
      </div>
      <small class="hint">Press Enter to add, click X to remove</small>
    `;

    // Insert into container
    this.container.innerHTML = html;

    this.chipsContainer = document.getElementById('tag-chips');
    this.searchInput = document.getElementById('tag-search');
    this.dropdown = document.getElementById('tag-dropdown');
  }

  renderChips() {
    return this.selectedTags
      .map(tag => `
        <span class="tag-chip" data-tag="${tag}">
          ${tag}
          <button type="button" class="tag-remove" data-tag="${tag}" aria-label="Remove ${tag}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </span>
      `)
      .join('');
  }

  updateChips() {
    const chipsHtml = this.renderChips();
    const existingChips = this.chipsContainer.querySelectorAll('.tag-chip');

    // Remove old chips
    existingChips.forEach(chip => chip.remove());

    // Add new chips before input
    this.searchInput.insertAdjacentHTML('beforebegin', chipsHtml);

    // Update placeholder
    this.searchInput.placeholder = this.selectedTags.length === 0 ? 'Start typing tags...' : '';

    // Update original input value (comma-separated)
    this.originalInput.value = this.selectedTags.join(', ');
  }

  addTag(tagName) {
    const trimmed = tagName.trim().toLowerCase();
    if (!trimmed || this.selectedTags.includes(trimmed)) return;

    this.selectedTags.push(trimmed);
    this.updateChips();
    this.searchInput.value = '';
    this.searchQuery = '';
    this.hideDropdown();
    this.searchInput.focus();
  }

  removeTag(tagName) {
    this.selectedTags = this.selectedTags.filter(tag => tag !== tagName);
    this.updateChips();
  }

  getFilteredTags() {
    if (this.searchQuery.length < 2) return [];

    return this.availableTags.filter(tag =>
      tag.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
      !this.selectedTags.includes(tag.name)
    );
  }

  showDropdown() {
    const filtered = this.getFilteredTags();

    if (filtered.length === 0) {
      this.hideDropdown();
      return;
    }

    const html = filtered.map((tag, index) => `
      <button
        type="button"
        class="tag-dropdown-item ${index === this.highlightedIndex ? 'highlighted' : ''}"
        data-tag="${tag.name}"
        data-index="${index}"
      >
        <span class="tag-name">${tag.name}</span>
        <span class="tag-count">${tag.count}</span>
      </button>
    `).join('');

    this.dropdown.innerHTML = html;
    this.dropdown.style.display = 'block';
  }

  hideDropdown() {
    this.dropdown.style.display = 'none';
    this.highlightedIndex = -1;
  }

  attachEventListeners() {
    // Search input events
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.highlightedIndex = -1;
      this.showDropdown();
    });

    this.searchInput.addEventListener('keydown', (e) => {
      const filtered = this.getFilteredTags();

      if (e.key === 'Enter') {
        e.preventDefault();
        if (this.highlightedIndex >= 0 && filtered[this.highlightedIndex]) {
          // Add highlighted tag
          this.addTag(filtered[this.highlightedIndex].name);
        } else if (this.searchQuery.trim()) {
          // Add current input as tag
          this.addTag(this.searchQuery);
        }
      } else if (e.key === 'Backspace' && !this.searchQuery && this.selectedTags.length > 0) {
        // Remove last tag if input is empty
        this.removeTag(this.selectedTags[this.selectedTags.length - 1]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filtered.length > 0) {
          this.highlightedIndex = Math.min(this.highlightedIndex + 1, filtered.length - 1);
          this.showDropdown();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filtered.length > 0) {
          this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
          this.showDropdown();
        }
      } else if (e.key === 'Escape') {
        this.hideDropdown();
      }
    });

    this.searchInput.addEventListener('blur', () => {
      // Delay to allow click on dropdown
      setTimeout(() => this.hideDropdown(), 200);
    });

    // Dropdown click events (event delegation)
    this.dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.tag-dropdown-item');
      if (item) {
        const tagName = item.dataset.tag;
        this.addTag(tagName);
      }
    });

    // Chip remove events (event delegation)
    this.chipsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.tag-remove');
      if (removeBtn) {
        const tagName = removeBtn.dataset.tag;
        this.removeTag(tagName);
      }
    });
  }

  setAvailableTags(tags) {
    this.availableTags = tags;
  }

  getValue() {
    return this.selectedTags;
  }

  setValue(tags) {
    this.selectedTags = tags;
    this.updateChips();
  }
}
