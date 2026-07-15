/* ============================================================
   Developer Notes - UI Rendering & Interactions
   ============================================================ */

const UI = {

  /* ---- Toast ---- */
  showToast(message, icon = 'check') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<svg class="icon toast-icon" viewBox="0 0 24 24"><use href="#icon-${icon}"/></svg> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  /* ---- Statistics ---- */
  renderStats() {
    const stats = DataStore.getStats();
    const grid = document.getElementById('stats-grid');
    if (!grid) return;

    const items = [
      { label: 'Total Notes', value: stats.total, icon: 'file-text', cls: 'notes' },
      { label: 'Categories', value: stats.categories, icon: 'folder', cls: 'categories' },
      { label: 'PDF Files', value: stats.pdfCount, icon: 'file', cls: 'pdf' },
      { label: 'Images', value: stats.imageCount, icon: 'image', cls: 'images' }
    ];

    grid.innerHTML = items.map(item => `
      <div class="stat-card ${item.cls} animate-slide-up">
        <div class="stat-icon">
          <svg class="icon-lg" viewBox="0 0 24 24"><use href="#icon-${item.icon}"/></svg>
        </div>
        <div class="stat-number" data-target="${item.value}">0</div>
        <div class="stat-label">${item.label}</div>
      </div>
    `).join('');

    this.animateCounters();
  },

  animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const duration = 1200;
      const step = Math.ceil(target / (duration / 16));
      let current = 0;
      const update = () => {
        current += step;
        if (current >= target) {
          counter.textContent = target;
          return;
        }
        counter.textContent = current;
        requestAnimationFrame(update);
      };
      update();
    });
  },

  /* ---- Category Cards ---- */
  renderCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    const cats = Array.from(DataStore.categories.values())
      .sort((a, b) => b.count - a.count);

    grid.innerHTML = cats.map(cat => `
      <div class="category-card" data-category="${cat.name}" role="button" tabindex="0" aria-label="Filter by ${cat.name}">
        <div class="cc-icon">${cat.icon}</div>
        <div class="cc-info">
          <h4>${cat.name}</h4>
          <span>${cat.count} note${cat.count !== 1 ? 's' : ''}</span>
        </div>
      </div>
    `).join('');

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.category-card');
      if (!card) return;
      const cat = card.dataset.category;
      document.getElementById('filter-category').value = cat;
      App.applyFilters();
      document.getElementById('notes-section').scrollIntoView({ behavior: 'smooth' });
    });
  },

  /* ---- Sidebar ---- */
  renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    const cats = Array.from(DataStore.categories.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    const allCount = DataStore.notes.length;

    nav.innerHTML = `
      <div class="sidebar-section">
        <div class="sidebar-nav">
          <div class="sidebar-link active" data-category="all" role="button" tabindex="0">
            <div class="cat-icon" style="background:var(--primary-light);color:var(--primary)">📋</div>
            <span>All Notes</span>
            <span class="cat-count">${allCount}</span>
          </div>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title" role="button" tabindex="0" aria-expanded="true">
          Categories
          <svg class="icon collapse-icon" viewBox="0 0 24 24"><use href="#icon-chevron-down"/></svg>
        </div>
        <div class="sidebar-nav">
          ${cats.map(cat => `
            <div class="sidebar-link" data-category="${cat.name}" role="button" tabindex="0">
              <div class="cat-icon">${cat.icon}</div>
              <span>${cat.name}</span>
              <span class="cat-count">${cat.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    nav.addEventListener('click', (e) => {
      const link = e.target.closest('.sidebar-link');
      if (link) {
        nav.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const cat = link.dataset.category;
        const hs = document.getElementById('header-search-input');
        const hr = document.getElementById('hero-search-input');
        if (hs) hs.value = '';
        if (hr) hr.value = '';
        if (cat === 'all') {
          document.getElementById('filter-category').value = '';
        } else {
          document.getElementById('filter-category').value = cat;
        }
        App.applyFilters();
        App.scrollToNotes();
        if (window.innerWidth <= 1024) {
          document.getElementById('sidebar').classList.remove('open');
          document.getElementById('sidebar-overlay').classList.remove('active');
        }
        return;
      }

      const title = e.target.closest('.sidebar-section-title');
      if (title) {
        title.classList.toggle('collapsed');
        const content = title.nextElementSibling;
        if (content) {
          content.classList.toggle('collapsed-content');
          title.setAttribute('aria-expanded', !content.classList.contains('collapsed-content'));
        }
      }
    });
  },

  /* ---- Note Cards ---- */
  renderNotes(notes) {
    const grid = document.getElementById('notes-grid');
    const info = document.getElementById('results-info');
    if (!grid) return;

    if (!notes || notes.length === 0) {
      grid.className = 'notes-grid empty';
      grid.innerHTML = `
        <div class="empty-icon">
          <svg class="icon-xl" viewBox="0 0 24 24"><use href="#icon-search"/></svg>
        </div>
        <h3>No notes found</h3>
        <p>Try adjusting your search or filters</p>
      `;
      if (info) info.textContent = '0 results';
      return;
    }

    grid.className = 'notes-grid stagger';

    grid.innerHTML = notes.map((note, idx) => {
      const isBookmarked = Bookmarks.isBookmarked(note.path);
      const isFavorited = Bookmarks.isFavorited(note.path);
      const levelClass = (note.level || '').toLowerCase();
      const typeDisplay = (note.type || '').toUpperCase();
      const dateDisplay = note.date ? this.formatDate(note.date) : '';

      return `
        <div class="note-card" data-index="${idx}">
          <div class="note-card-header">
            <div class="note-card-badges">
              <span class="badge badge-category">
                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-folder"/></svg>
                ${note.category || 'Uncategorized'}
              </span>
              ${note.level ? `<span class="badge badge-level ${levelClass}">${note.level}</span>` : ''}
              <span class="badge badge-type">${typeDisplay}</span>
            </div>
            <div class="note-card-actions">
              <button class="btn-bookmark ${isBookmarked ? 'bookmarked' : ''}" data-path="${note.path}" aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark note'}">
                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-${isBookmarked ? 'bookmark-filled' : 'bookmark'}"/></svg>
              </button>
              <button class="btn-fav ${isFavorited ? 'bookmarked' : ''}" data-path="${note.path}" aria-label="${isFavorited ? 'Unfavorite' : 'Favorite note'}">
                <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-${isFavorited ? 'heart-filled' : 'heart'}"/></svg>
              </button>
            </div>
          </div>
          <h3 class="note-card-title">${note.title || 'Untitled'}</h3>
          <p class="note-card-desc">${note.description || ''}</p>
          ${note.tags && note.tags.length ? `
            <div class="note-card-tags">
              ${note.tags.map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          ` : ''}
          <div class="note-card-footer">
            ${dateDisplay ? `<span class="note-date">${dateDisplay}</span>` : '<span class="note-date"></span>'}
            <button class="btn btn-card btn-preview" data-path="${note.path}" data-type="${note.type}">Preview</button>
            <a class="btn btn-card btn-ghost" href="${note.path}" target="_blank" download>Download</a>
            <button class="btn btn-card btn-ghost btn-share" data-title="${note.title}" data-path="${note.path}">
              <svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-share"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (info) info.textContent = `${notes.length} result${notes.length !== 1 ? 's' : ''}`;

    this.attachCardEvents();
  },

  attachCardEvents() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;

    grid.querySelectorAll('.btn-preview').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Preview.open(btn.dataset.path, btn.dataset.type);
      });
    });

    grid.querySelectorAll('.btn-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = btn.dataset.path;
        Bookmarks.toggleBookmark(path);
        const isNow = Bookmarks.isBookmarked(path);
        btn.classList.toggle('bookmarked', isNow);
        btn.querySelector('use').setAttribute('href', `#icon-${isNow ? 'bookmark-filled' : 'bookmark'}`);
        btn.setAttribute('aria-label', isNow ? 'Remove bookmark' : 'Bookmark note');
        UI.showToast(isNow ? 'Note bookmarked' : 'Bookmark removed');
      });
    });

    grid.querySelectorAll('.btn-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = btn.dataset.path;
        Bookmarks.toggleFavorite(path);
        const isNow = Bookmarks.isFavorited(path);
        btn.classList.toggle('bookmarked', isNow);
        btn.querySelector('use').setAttribute('href', `#icon-${isNow ? 'heart-filled' : 'heart'}`);
        btn.setAttribute('aria-label', isNow ? 'Unfavorite' : 'Favorite note');
        UI.showToast(isNow ? 'Added to favorites' : 'Removed from favorites', 'heart');
      });
    });

    grid.querySelectorAll('.btn-share').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const path = btn.dataset.path;
        const url = `${window.location.origin}${window.location.pathname}?note=${encodeURIComponent(path)}`;
        try {
          await navigator.clipboard.writeText(url);
          UI.showToast('Link copied to clipboard', 'link');
        } catch {
          UI.showToast('Failed to copy link', 'x');
        }
      });
    });
  },

  /* ---- Recent Notes ---- */
  renderRecent() {
    const grid = document.getElementById('recent-notes');
    if (!grid) return;
    const recent = DataStore.getRecentNotes(6);
    grid.innerHTML = '';
    recent.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';
      const levelClass = (note.level || '').toLowerCase();
      const dateDisplay = note.date ? this.formatDate(note.date) : '';
      card.innerHTML = `
        <div class="note-card-header">
          <div class="note-card-badges">
            <span class="badge badge-category">${note.category || 'Uncategorized'}</span>
            ${note.level ? `<span class="badge badge-level ${levelClass}">${note.level}</span>` : ''}
          </div>
        </div>
        <h3 class="note-card-title">${note.title || 'Untitled'}</h3>
        <p class="note-card-desc">${note.description || ''}</p>
        ${note.tags && note.tags.length ? `
          <div class="note-card-tags">
            ${note.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        ` : ''}
        <div class="note-card-footer">
          ${dateDisplay ? `<span class="note-date">${dateDisplay}</span>` : '<span class="note-date"></span>'}
          <button class="btn btn-card btn-preview" data-path="${note.path}" data-type="${note.type}">Preview</button>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-preview').forEach(btn => {
      btn.addEventListener('click', () => Preview.open(btn.dataset.path, btn.dataset.type));
    });
  },

  /* ---- Filters ---- */
  populateFilters() {
    const catSelect = document.getElementById('filter-category');
    if (!catSelect) return;

    const cats = Array.from(DataStore.categories.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    catSelect.innerHTML = '<option value="">All Categories</option>' +
      cats.map(c => `<option value="${c.name}">${c.name} (${c.count})</option>`).join('');
  },

  /* ---- Breadcrumbs ---- */
  updateBreadcrumbs(path) {
    const el = document.getElementById('breadcrumbs');
    if (!el) return;

    if (!path) {
      el.innerHTML = `<a href="/"><svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-home"/></svg></a>
        <span class="separator">/</span>
        <span class="current">All Notes</span>`;
      return;
    }

    const parts = path.replace(/\\/g, '/').split('/');
    let currentPath = '';
    let html = `<a href="/"><svg class="icon-sm" viewBox="0 0 24 24"><use href="#icon-home"/></svg></a>`;

    parts.forEach((part, i) => {
      currentPath += (i > 0 ? '/' : '') + part;
      const isLast = i === parts.length - 1;
      const name = part.replace(/\.[^/.]+$/, '');
      html += `<span class="separator">/</span>`;
      if (isLast) {
        html += `<span class="current">${name}</span>`;
      } else {
        html += `<a href="#">${part}</a>`;
      }
    });

    el.innerHTML = html;
  },

  /* ---- Format ---- */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
};
