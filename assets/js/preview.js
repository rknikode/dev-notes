/* ============================================================
   Developer Notes - Preview System (PDF, Image, Markdown)
   ============================================================ */

const Preview = {
  currentPath: '',

  open(path, type) {
    this.currentPath = path;
    const typeLower = (type || '').toLowerCase();

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(typeLower)) {
      this.openImage(path);
    } else if (typeLower === 'pdf') {
      this.openPDF(path);
    } else if (typeLower === 'md' || typeLower === 'txt') {
      this.openMarkdown(path);
    } else {
      UI.showToast('Cannot preview this file type', 'x');
    }
  },

  openPDF(path) {
    const modal = document.getElementById('preview-modal');
    const title = document.getElementById('preview-title');
    const body = document.getElementById('preview-body');

    title.textContent = path.split('/').pop() || 'PDF Preview';
    body.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = path;
    iframe.title = 'PDF Preview';
    iframe.setAttribute('loading', 'lazy');
    body.appendChild(iframe);

    const openBtn = document.getElementById('preview-open');
    openBtn.onclick = () => window.open(path, '_blank');

    const downloadBtn = document.getElementById('preview-download');
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = path;
      a.download = path.split('/').pop();
      a.click();
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  openImage(path) {
    const viewer = document.getElementById('image-viewer');
    const img = document.getElementById('image-viewer-img');
    const downloadLink = document.getElementById('iv-download-link');

    img.src = path;
    img.alt = path.split('/').pop() || 'Image';
    downloadLink.href = path;

    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';

    let zoomLevel = 1;
    viewer.onwheel = (e) => {
      e.preventDefault();
      zoomLevel += e.deltaY > 0 ? -0.1 : 0.1;
      zoomLevel = Math.max(0.5, Math.min(3, zoomLevel));
      img.style.transform = `scale(${zoomLevel})`;
    };

    viewer.onclick = (e) => {
      if (e.target === viewer) {
        zoomLevel = 1;
        img.style.transform = '';
        viewer.classList.remove('active');
        document.body.style.overflow = '';
      }
    };
  },

  async openMarkdown(path) {
    const modal = document.getElementById('preview-modal');
    const title = document.getElementById('preview-title');
    const body = document.getElementById('preview-body');

    title.textContent = path.split('/').pop() || 'Markdown Preview';
    body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-tertiary)">Loading...</div>';

    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      body.innerHTML = '';

      if (typeof marked !== 'undefined') {
        const content = document.createElement('div');
        content.className = 'markdown-content';
        content.innerHTML = marked.parse(text);
        body.appendChild(content);
      } else {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'var(--font-mono)';
        pre.style.fontSize = '0.875rem';
        pre.style.lineHeight = '1.6';
        pre.style.color = 'var(--text-secondary)';
        pre.textContent = text;
        body.appendChild(pre);
      }
    } catch (err) {
      body.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-tertiary)">Failed to load: ${err.message}</div>`;
    }

    const openBtn = document.getElementById('preview-open');
    openBtn.onclick = () => window.open(path, '_blank');

    const downloadBtn = document.getElementById('preview-download');
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = path;
      a.download = path.split('/').pop();
      a.click();
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  close() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('active');

    const viewer = document.getElementById('image-viewer');
    viewer.classList.remove('active');

    document.body.style.overflow = '';
  }
};

/* Modal close handlers */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('preview-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) Preview.close();
    });
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', Preview.close);
  }

  const viewerClose = document.getElementById('iv-close');
  if (viewerClose) {
    viewerClose.addEventListener('click', () => {
      document.getElementById('image-viewer').classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  /* Escape key closes modals */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('preview-modal').classList.contains('active')) Preview.close();
      if (document.getElementById('image-viewer').classList.contains('active')) {
        document.getElementById('image-viewer').classList.remove('active');
        document.body.style.overflow = '';
      }
      if (document.getElementById('palette-overlay').classList.contains('active')) {
        Palette.close();
      }
    }
  });
});
