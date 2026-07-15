/* ============================================================
   Developer Notes - Data Management & Search Engine
   ============================================================ */

const DataStore = {
  notes: [],
  categories: new Map(),
  filteredNotes: [],
  searchIndex: [],

  async load() {
    try {
      const res = await fetch('data/notes.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.notes = await res.json();
      this.buildIndex();
      this.buildCategories();
      return true;
    } catch (err) {
      console.error('Failed to load notes:', err);
      return false;
    }
  },

  buildIndex() {
    this.searchIndex = this.notes.map((note, idx) => ({
      index: idx,
      text: [
        note.title || '',
        note.description || '',
        note.category || '',
        ...(note.tags || []),
        note.type || '',
        note.path || ''
      ].join(' ').toLowerCase(),
      note
    }));
  },

  buildCategories() {
    this.categories.clear();
    this.notes.forEach(note => {
      const cat = note.category || 'Uncategorized';
      if (!this.categories.has(cat)) {
        this.categories.set(cat, { name: cat, count: 0, icon: this.getCategoryIcon(cat) });
      }
      this.categories.get(cat).count++;
    });
  },

  getCategoryIcon(category) {
    const icons = {
      'Java': '☕', 'Spring': '🍃', 'Docker': '🐳', 'Kubernetes': '☸',
      'Kafka': '📨', 'SQL': '🗃', 'Database': '💾', 'System Design': '🏗',
      'Microservices': '🔧', 'Azure': '☁', 'AWS': '☁', 'JavaScript': '🟨',
      'TypeScript': '🔷', 'React': '⚛', 'Angular': '🅰', 'HTML': '🌐',
      'CSS': '🎨', 'Authentication': '🔐', 'Networking': '🌍',
      'Algorithms': '⚡', 'Data Structures': '📊', 'Interview': '💼',
      'Misc': '📎'
    };
    return icons[category] || '📄';
  },

  getCategoryColor(category) {
    const colors = [
      '#2563EB', '#0EA5E9', '#06B6D4', '#14B8A6', '#22C55E',
      '#84CC16', '#EAB308', '#F59E0B', '#EF4444', '#EC4899', '#A855F7', '#6366F1'
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  search(query, filters = {}) {
    if (!query && !Object.values(filters).some(v => v)) {
      this.filteredNotes = [...this.notes];
      return this.filteredNotes;
    }

    const q = query ? query.toLowerCase().trim() : '';

    let results = this.notes;

    if (q) {
      results = results.filter((note, idx) => {
        const searchText = this.searchIndex[idx].text;
        return searchText.includes(q);
      });
    }

    if (filters.category) {
      results = results.filter(n => n.category === filters.category);
    }
    if (filters.level) {
      results = results.filter(n => (n.level || '').toLowerCase() === filters.level.toLowerCase());
    }
    if (filters.type) {
      results = results.filter(n => n.type === filters.type);
    }

    if (filters.sort) {
      switch (filters.sort) {
        case 'newest':
          results.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          break;
        case 'oldest':
          results.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
          break;
        case 'az':
          results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
          break;
        case 'za':
          results.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
          break;
      }
    }

    this.filteredNotes = results;
    return results;
  },

  getStats() {
    const total = this.notes.length;
    const categories = this.categories.size;
    const pdfCount = this.notes.filter(n => n.type === 'pdf').length;
    const imageCount = this.notes.filter(n => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(n.type)).length;
    return { total, categories, pdfCount, imageCount };
  },

  getRecentNotes(count = 6) {
    return [...this.notes]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, count);
  },

  getNoteByPath(path) {
    return this.notes.find(n => n.path === path);
  },

  getNoteByIndex(idx) {
    return this.notes[idx];
  }
};
