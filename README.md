# Developer Notes

A production-ready documentation portal for technical interview notes, built with vanilla HTML, CSS, and JavaScript. Hosted on GitHub Pages with zero build steps.

## Features

- **Search** - Instant client-side search across titles, descriptions, categories, and tags
- **Filters** - Filter by category, difficulty level, file type, and sort order
- **Previews** - In-browser preview for PDFs, images (PNG, JPG, GIF), and Markdown files; HTML notes open in a new tab
- **Dark Mode** - Theme toggle with localStorage persistence
- **Bookmarks & Favorites** - Save and organize your favorite notes
- **Command Palette** - Press `Ctrl+K` for quick navigation
- **Keyboard Shortcuts** - `Ctrl+K`: Palette, `/`: Focus search, `?`: Show help
- **Responsive** - Works on desktop, tablet, and mobile
- **Accessible** - ARIA labels, keyboard navigation, contrast compliant
- **SEO** - Open Graph, Twitter Cards, sitemap.xml, robots.txt, manifest.json
- **Performance** - Lazy loading, minimal JavaScript, skeleton loading

## Tech Stack

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Marked.js (Markdown rendering via CDN)
- Google Fonts (Inter, JetBrains Mono)

No build tools, no frameworks, no external dependencies.

## Folder Structure

```
developer-notes/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest
├── robots.txt              # Search engine crawling rules
├── sitemap.xml             # SEO sitemap
├── assets/
│   ├── css/
│   │   ├── styles.css      # All styles (variables, layout, components, dark mode)
│   │   └── responsive.css  # Media queries
│   ├── js/
│   │   ├── app.js          # Main orchestrator
│   │   ├── bookmarks.js    # Bookmarks & favorites management
│   │   ├── data.js         # Data loading & search engine
│   │   ├── keyboard.js     # Keyboard shortcuts & command palette
│   │   ├── preview.js      # PDF, image, markdown preview
│   │   ├── theme.js        # Dark mode management
│   │   └── ui.js           # UI rendering & interactions
│   ├── icons/
│   │   └── favicon.svg     # SVG favicon
│   └── images/             # Open Graph images
├── data/
│   └── notes.json          # Note database (auto-generated, safe to hand-edit)
├── docs/                   # Your note files go here
│   ├── java/
│   ├── spring/
│   ├── docker/
│   ├── kubernetes/
│   ├── kafka/
│   ├── sql/
│   ├── database/
│   ├── system-design/
│   ├── microservices/
│   ├── azure/
│   ├── aws/
│   ├── javascript/
│   ├── typescript/
│   ├── react/
│   ├── angular/
│   ├── Junit/
│   ├── html/
│   ├── css/
│   ├── authentication/
│   ├── networking/
│   ├── algorithms/
│   ├── data-structures/
│   ├── design-patterns/
│   ├── interview/
│   └── misc/
└── scripts/
    ├── generate-notes.js   # Generator (single source of truth)
    └── generate-notes.ps1  # Windows wrapper that calls the Node generator
```

## Quick Start

### 1. Clone or download

```bash
git clone https://github.com/yourusername/developer-notes.git
cd developer-notes
```

### 2. Add your notes

Place your files in the appropriate `docs/<category>/` folder:

- `docs/java/java-notes.pdf`
- `docs/spring/spring-boot.md`
- `docs/system-design/diagram.png`

Supported file types: PDF, PNG, JPG, JPEG, GIF, WEBP, SVG, MD, TXT, HTML, HTM

> HEIC/HEIF images are not indexed because browsers cannot render them. Convert to JPG/PNG or export as PDF first.

### 3. Generate the database

```bash
node scripts/generate-notes.js
```

This scans the `docs/` folder and creates `data/notes.json` automatically.

### 4. Open in browser

Just open `index.html` in any modern browser, or serve with any static server:

```bash
npx serve .
```

## Deploy to GitHub Pages

Deployment is fully automated by `.github/workflows/deploy.yml`:

- Triggers on every push to `main` (and manually via **workflow_dispatch**)
- Installs Node 20 and `qpdf` (used to split PDFs larger than 24 MiB)
- Runs `node scripts/generate-notes.js` so `data/notes.json` always matches the files in `docs/`
- Uploads the repository root as the Pages artifact and deploys it

Live site: <https://rknikode.github.io/dev-notes/>

Repository settings required once: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Why CI regeneration is safe

`data/notes.json` is committed, and the generator treats any existing entry as
the source of truth for curated fields (`title`, `description`, `category`,
`tags`, `level`, `date`). Only file-derived data (`path`, `type`, `fileSize`,
`parts`) is refreshed, so edits made locally are never lost during deploy.

## Adding New Notes

1. **Place the file** in the appropriate `docs/<category>/` folder
2. **Run the generator**: `node scripts/generate-notes.js`
3. **Refine the new entry** in `data/notes.json` if the auto-generated title or
   description needs work (curated values survive the next run)
4. **Commit and push** the notes plus the updated `notes.json`

The script automatically extracts:
- Title (from filename)
- Category (from folder name)
- Type (from file extension)
- Date (from file modification time, preserved once the note exists)
- Tags and difficulty level (intelligent guessing)

For precise control, edit `data/notes.json` directly after generation.

## Customization

### Colors

Edit the CSS custom properties in `assets/css/styles.css`:

```css
:root {
  --primary: #2563EB;
  --accent: #0EA5E9;
  --bg-primary: #F8FAFC;
  /* ... */
}
```

### Categories

To add a new category:
1. Create a new folder in `docs/` (e.g., `docs/golang/`)
2. Add the mapping in `scripts/generate-notes.js` (keys are lowercase folder names):
   ```js
   const CATEGORY_NAMES = { ..., 'golang': 'Go' };
   ```
3. Add an icon in `DataStore.getCategoryIcon()` in `assets/js/data.js`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+K` | Open command palette |
| `/` | Focus search bar |
| `Ctrl+L` | Select search text |
| `Escape` | Close modals/palette |
| `?` | Show shortcuts |


## Notes JSON Format

```json
{
  "title": "Java Interview Questions",
  "description": "Most asked Java interview questions",
  "category": "Java",
  "tags": ["Java", "Interview"],
  "type": "pdf",
  "path": "docs/java/java-interview.pdf",
  "level": "Intermediate",
  "date": "2026-06-01"
}
```

**Fields:**
- `title` - Display name of the note
- `description` - Brief summary
- `category` - Must match a folder or custom category name
- `tags` - Array of searchable keywords
- `type` - File extension (pdf, png, jpg, md, gif, etc.)
- `path` - Relative path from project root (use forward slashes)
- `level` - Difficulty: Beginner, Intermediate, Advanced
- `date` - ISO date string (YYYY-MM-DD)

## Troubleshooting

**Notes not showing up?**
- Run `node scripts/generate-notes.js` to rebuild `data/notes.json`
- Check that the file path in notes.json matches the actual file location
- Open browser console (F12) for error messages

**Images not displaying?**
- Ensure file paths use forward slashes (`/`)
- Verify the file exists at the specified path

**PDF not rendering?**
- The browser's built-in PDF viewer is used
- Some browsers may block cross-origin PDF loading - use a local server

## License

MIT
