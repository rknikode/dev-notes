/* ============================================================
   Developer Notes - Theme Management
   ============================================================ */

const ThemeManager = {
  STORAGE_KEY: 'devnotes-theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    this.set(theme);
  },

  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateUI(theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    this.set(current === 'dark' ? 'light' : 'dark');
  },

  updateUI(theme) {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', theme === 'dark');
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  },

  isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }
};
