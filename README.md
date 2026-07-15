# Developer Notes

A production-ready documentation portal for technical interview notes, built with vanilla HTML, CSS, and JavaScript. Hosted on GitHub Pages with zero build steps.

## Features

- **Search** - Instant client-side search across titles, descriptions, categories, and tags
- **Filters** - Filter by category, difficulty level, file type, and sort order
- **Previews** - In-browser preview for PDFs, images (PNG, JPG, GIF), and Markdown files
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
│   └── notes.json          # Note database (auto-generated)
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
│   ├── html/
│   ├── css/
│   ├── authentication/
│   ├── networking/
│   ├── algorithms/
│   ├── data-structures/
│   ├── interview/
│   └── misc/
└── scripts/
    └── generate-notes.js   # Automation script
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

Supported file types: PDF, PNG, JPG, JPEG, GIF, WEBP, SVG, MD, TXT

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

### Option A: GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node scripts/generate-notes.js
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: 'developer-notes'
      - uses: actions/deploy-pages@v4
```

### Option B: Manual

1. Push the `developer-notes/` folder to a GitHub repository
2. Go to Settings > Pages
3. Set source to "main" branch and folder to `/developer-notes`
4. Save - your site will be live at `https://yourusername.github.io/developer-notes/`

## Adding New Notes

1. **Place the file** in the appropriate `docs/<category>/` folder
2. **Run the generator**: `node scripts/generate-notes.js`
3. **Commit and push** the changes (including the updated `notes.json`)

The script automatically extracts:
- Title (from filename)
- Category (from folder name)
- Type (from file extension)
- Date (from file modification time)
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
2. Add the mapping in `scripts/generate-notes.js`:
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
