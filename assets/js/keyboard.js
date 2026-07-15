/* ============================================================
   Developer Notes - Keyboard Shortcuts & Command Palette
   ============================================================ */

const Keyboard = {
  init() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K - Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        Palette.toggle();
      }

      // / - Focus search
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        const searchInput = document.getElementById('header-search-input') || document.getElementById('hero-search-input');
        if (searchInput) searchInput.focus();
      }

      // ? - Show shortcuts help
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        UI.showToast('Shortcuts: Ctrl+K: Palette | /: Search | ?: Help', 'help');
      }
    });
  }
};

const Palette = {
  isOpen: false,

  init() {
    const overlay = document.getElementById('palette-overlay');
    const input = document.getElementById('palette-input');
    const results = document.getElementById('palette-results');

    if (!overlay || !input || !results) return;

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigate(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigate(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.select();
      }
    });

    input.addEventListener('input', () => this.search(input.value));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
  },

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  },

  open() {
    this.isOpen = true;
    const overlay = document.getElementById('palette-overlay');
    const input = document.getElementById('palette-input');
    overlay.classList.add('active');
    input.value = '';
    input.focus();
    this.search('');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.isOpen = false;
    const overlay = document.getElementById('palette-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  search(query) {
    const results = document.getElementById('palette-results');
    const q = query.toLowerCase().trim();

    if (!q) {
      const recent = Bookmarks.getHistory();
      const recentNotes = recent.map(p => DataStore.getNoteByPath(p)).filter(Boolean).slice(0, 5);

      if (recentNotes.length) {
        results.innerHTML = `
          <div style="padding:0.5rem 0.75rem;font-size:0.75rem;color:var(--text-tertiary);font-weight:600">Recent</div>
          ${recentNotes.map(n => this.createItem(n)).join('')}
        `;
      } else {
        results.innerHTML = `
          <div style="padding:0.5rem 0.75rem;font-size:0.75rem;color:var(--text-tertiary);font-weight:600">Suggestions</div>
          <div class="palette-item" data-action="search" data-query="">
            <div class="pi-icon"><svg class="icon" viewBox="0 0 24 24"><use href="#icon-search"/></svg></div>
            <div class="pi-info"><div class="pi-title">Browse all notes</div><div class="pi-sub">View all available notes</div></div>
          </div>
          <div class="palette-item" data-action="bookmarks">
            <div class="pi-icon"><svg class="icon" viewBox="0 0 24 24"><use href="#icon-bookmark"/></svg></div>
            <div class="pi-info"><div class="pi-title">View bookmarks</div><div class="pi-sub">${Bookmarks.getBookmarks().length} bookmarked notes</div></div>
          </div>
          <div class="palette-item" data-action="favorites">
            <div class="pi-icon"><svg class="icon" viewBox="0 0 24 24"><use href="#icon-heart"/></svg></div>
            <div class="pi-info"><div class="pi-title">View favorites</div><div class="pi-sub">${Bookmarks.getFavorites().length} favorited notes</div></div>
          </div>
        `;
      }

      this.attachEvents();
      return;
    }

    const matches = DataStore.notes.filter(n => {
      const searchText = [
        n.title, n.description, n.category, ...(n.tags || []), n.type, n.path
      ].filter(Boolean).join(' ').toLowerCase();
      return searchText.includes(q);
    }).slice(0, 10);

    if (!matches.length) {
      results.innerHTML = '<div class="palette-empty">No results found</div>';
      return;
    }

    results.innerHTML = matches.map(n => this.createItem(n)).join('');
    this.attachEvents();
  },

  createItem(note) {
    return `
      <div class="palette-item" data-path="${note.path}" data-type="${note.type}">
        <div class="pi-icon">${DataStore.getCategoryIcon(note.category)}</div>
        <div class="pi-info">
          <div class="pi-title">${note.title}</div>
          <div class="pi-sub">${note.category} · ${note.level || 'All Levels'} · ${(note.type || '').toUpperCase()}</div>
        </div>
      </div>
    `;
  },

  attachEvents() {
    const results = document.getElementById('palette-results');

    results.querySelectorAll('.palette-item').forEach(el => {
      el.addEventListener('click', () => {
        const path = el.dataset.path;
        const action = el.dataset.action;

        if (action === 'bookmarks') {
          this.close();
          this.showBookmarks();
          return;
        }
        if (action === 'favorites') {
          this.close();
          this.showFavorites();
          return;
        }
        if (action === 'search') {
          this.close();
          const searchInput = document.getElementById('header-search-input');
          if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
          }
          App.filterAndRender();
          return;
        }

        if (path) {
          Bookmarks.addToHistory(path);
          this.close();
          Preview.open(path, el.dataset.type);
        }
      });
    });

    this.selectedIndex = -1;
  },

  navigate(dir) {
    const items = document.querySelectorAll('#palette-results .palette-item');
    if (!items.length) return;

    if (this.selectedIndex >= 0) {
      items[this.selectedIndex].classList.remove('selected');
    }

    this.selectedIndex = (this.selectedIndex === -1)
      ? (dir === 1 ? 0 : items.length - 1)
      : (this.selectedIndex + dir + items.length) % items.length;

    items[this.selectedIndex].classList.add('selected');
    items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
  },

  select() {
    const selected = document.querySelector('#palette-results .palette-item.selected');
    if (selected) {
      selected.click();
    }
  },

  showBookmarks() {
    const paths = Bookmarks.getBookmarks();
    const notes = paths.map(p => DataStore.getNoteByPath(p)).filter(Boolean);
    App.filterAndRender();
    const grid = document.getElementById('notes-grid');
    if (notes.length) {
      UI.renderNotes(notes);
    }
    UI.showToast(`Showing ${notes.length} bookmarked notes`, 'bookmark');
  },

  showFavorites() {
    const paths = Bookmarks.getFavorites();
    const notes = paths.map(p => DataStore.getNoteByPath(p)).filter(Boolean);
    App.filterAndRender();
    const grid = document.getElementById('notes-grid');
    if (notes.length) {
      UI.renderNotes(notes);
    }
    UI.showToast(`Showing ${notes.length} favorited notes`, 'heart');
  }
};
