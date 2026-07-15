/* ============================================================
   Developer Notes - Main Application Orchestrator
   ============================================================ */

const App = {
  async init() {
    ThemeManager.init();
    Keyboard.init();

    if (window.location.protocol === 'file:') {
      document.getElementById('loading-skeleton').style.display = 'none';
      document.getElementById('app-content').innerHTML = `
        <div style="text-align:center;padding:4rem 2rem;max-width:500px;margin:0 auto">
          <div style="width:64px;height:64px;border-radius:16px;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:var(--text-tertiary)">
            <svg class="icon-xl" viewBox="0 0 24 24"><use href="#icon-info"/></svg>
          </div>
          <h2>Serve with a local server</h2>
          <p style="color:var(--text-secondary);margin-top:0.5rem;line-height:1.6">
            This app requires a web server. Open a terminal in this folder and run:<br>
            <code style="display:inline-block;background:var(--bg-secondary);padding:0.25rem 0.75rem;border-radius:6px;margin-top:0.5rem;font-size:0.875rem">npx serve .</code>
          </p>
          <p style="color:var(--text-tertiary);margin-top:1rem;font-size:0.875rem">
            Or deploy to GitHub Pages for the full experience.
          </p>
        </div>
      `;
      return;
    }

    const loaded = await DataStore.load();
    if (!loaded) {
      document.getElementById('loading-skeleton').style.display = 'none';
      document.getElementById('app-content').innerHTML = `
        <div style="text-align:center;padding:4rem 2rem">
          <h2>Unable to load notes</h2>
          <p style="color:var(--text-secondary);margin-top:0.5rem">Please ensure <code>data/notes.json</code> exists and is valid JSON.</p>
        </div>
      `;
      return;
    }

    document.getElementById('app-content').style.display = 'block';
    document.getElementById('loading-skeleton').style.display = 'none';

    this.render();
    this.attachEvents();
    this.handleRoute();
    this.initScrollProgress();
    this.initScrollToTop();

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.initLazyLoad());
    } else {
      setTimeout(() => this.initLazyLoad(), 500);
    }
  },

  /* ---- Render all UI ---- */
  render() {
    UI.updateBreadcrumbs();
    UI.renderStats();
    UI.renderCategories();
    UI.renderSidebar();
    UI.populateFilters();
    UI.renderRecent();
    this.applyFilters();
  },

  /* ---- Central filter + render ---- */
  applyFilters() {
    try {
      const query = document.getElementById('header-search-input').value;
      const category = document.getElementById('filter-category').value;
      const level = document.getElementById('filter-level').value;
      const type = document.getElementById('filter-type').value;
      const sort = document.getElementById('filter-sort').value;

      const results = DataStore.search(query, { category, level, type, sort });
      UI.renderNotes(results);
    } catch (err) {
      console.error('filterAndRender error:', err);
    }
  },

  /* ---- Attach event listeners ---- */
  attachEvents() {
    const headerSearch = document.getElementById('header-search-input');
    const heroSearch = document.getElementById('hero-search-input');

    const search = this.debounce(() => {
      this.applyFilters();
      this.scrollToNotes();
    }, 200);

    if (headerSearch) {
      headerSearch.addEventListener('input', () => {
        document.getElementById('filter-category').value = '';
        search();
      });
    }
    if (heroSearch) {
      heroSearch.addEventListener('input', () => {
        if (headerSearch) headerSearch.value = heroSearch.value;
        document.getElementById('filter-category').value = '';
        search();
      });
    }

    document.getElementById('filter-category').addEventListener('change', () => this.applyFilters());
    document.getElementById('filter-level').addEventListener('change', () => this.applyFilters());
    document.getElementById('filter-type').addEventListener('change', () => this.applyFilters());
    document.getElementById('filter-sort').addEventListener('change', () => this.applyFilters());

    document.getElementById('clear-filters').addEventListener('click', () => {
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-level').value = '';
      document.getElementById('filter-type').value = '';
      document.getElementById('filter-sort').value = 'newest';
      if (headerSearch) headerSearch.value = '';
      if (heroSearch) heroSearch.value = '';
      this.applyFilters();
    });

    document.querySelector('.theme-toggle').addEventListener('click', () => ThemeManager.toggle());
    document.querySelector('.menu-toggle').addEventListener('click', this.toggleSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', this.closeSidebar);
    Palette.init();
  },

  scrollToNotes() {
    const el = document.getElementById('notes-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
  },

  handleRoute() {
    const params = new URLSearchParams(window.location.search);
    const notePath = params.get('note');
    if (notePath) {
      const note = DataStore.getNoteByPath(notePath);
      if (note) {
        setTimeout(() => Preview.open(note.path, note.type), 500);
      }
    }
  },

  initScrollProgress() {
    const bar = document.getElementById('reading-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = scrollHeight > 0 ? `${Math.min((scrollTop / scrollHeight) * 100, 100)}%` : '0%';
    });
  },

  initScrollToTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', (document.documentElement.scrollTop || document.body.scrollTop) > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  },

  initLazyLoad() {
    const images = document.querySelectorAll('[data-src]');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });
      images.forEach(img => observer.observe(img));
    } else {
      images.forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    }
  },

  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
