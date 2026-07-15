/* ============================================================
   Developer Notes - Bookmarks & Favorites
   ============================================================ */

const Bookmarks = {
  STORAGE_KEY: 'devnotes-bookmarks',
  FAV_KEY: 'devnotes-favorites',
  HISTORY_KEY: 'devnotes-history',

  getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch { return []; }
  },

  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.FAV_KEY)) || [];
    } catch { return []; }
  },

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
    } catch { return []; }
  },

  isBookmarked(path) {
    return this.getBookmarks().includes(path);
  },

  isFavorited(path) {
    return this.getFavorites().includes(path);
  },

  toggleBookmark(path) {
    let bookmarks = this.getBookmarks();
    if (bookmarks.includes(path)) {
      bookmarks = bookmarks.filter(p => p !== path);
    } else {
      bookmarks.unshift(path);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
  },

  toggleFavorite(path) {
    let favs = this.getFavorites();
    if (favs.includes(path)) {
      favs = favs.filter(p => p !== path);
    } else {
      favs.unshift(path);
    }
    localStorage.setItem(this.FAV_KEY, JSON.stringify(favs));
  },

  addToHistory(path) {
    let history = this.getHistory();
    history = history.filter(p => p !== path);
    history.unshift(path);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  },

  clearHistory() {
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify([]));
  }
};
