/**
 * Developer Notes - Notes Generator
 * 
 * Scans the docs/ directory recursively and generates data/notes.json
 * Automatically splits oversized PDFs (> 24 MiB) to stay within Cloudflare Pages limits.
 * 
 * Usage: node scripts/generate-notes.js
 * 
 * This script automatically detects files, extracts metadata,
 * and builds the notes.json data file without manual editing.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'notes.json');

const CLOUDFLARE_LIMIT_MB = 24;
const MAX_SIZE_BYTES = CLOUDFLARE_LIMIT_MB * 1024 * 1024;

// Category mapping: folder name -> display name
const CATEGORY_NAMES = {
  'java': 'Java',
  'spring': 'Spring',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'kafka': 'Kafka',
  'sql': 'SQL',
  'database': 'Database',
  'system-design': 'System Design',
  'microservices': 'Microservices',
  'azure': 'Azure',
  'aws': 'AWS',
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'react': 'React',
  'angular': 'Angular',
  'html': 'HTML',
  'css': 'CSS',
  'authentication': 'Authentication',
  'networking': 'Networking',
  'algorithms': 'Algorithms',
  'data-structures': 'Data Structures',
  'interview': 'Interview',
  'misc': 'Misc'
};

// Difficulty levels extracted from filename patterns or default
const DEFAULT_LEVEL = 'Intermediate';

// File types we support
const SUPPORTED_EXTENSIONS = [
  '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.md', '.txt'
];

/**
 * Get a human-readable title from a file path
 */
function extractTitle(filePath, fileName) {
  let name = path.basename(fileName, path.extname(fileName));
  // Remove leading numbers/dates like "01-", "2024-01-01-"
  name = name.replace(/^[\d-]+\s*/, '');
  // Replace hyphens and underscores with spaces
  name = name.replace(/[-_]/g, ' ');
  // Capitalize words
  name = name.replace(/\b\w/g, c => c.toUpperCase());
  return name.trim() || 'Untitled';
}

/**
 * Get relative path from docs directory
 */
function getRelativePath(absolutePath) {
  const relative = path.relative(ROOT_DIR, absolutePath);
  return relative.replace(/\\/g, '/');
}

/**
 * Get file extension without dot
 */
function getExtension(fileName) {
  return path.extname(fileName).toLowerCase().replace('.', '');
}

/**
 * Determine category from folder path
 */
function getCategory(dirPath) {
  const relative = path.relative(DOCS_DIR, dirPath);
  const parts = relative.split(path.sep).filter(Boolean);
  const folderName = parts[0] || 'misc';
  return CATEGORY_NAMES[folderName.toLowerCase()] || folderName.charAt(0).toUpperCase() + folderName.slice(1);
}

/**
 * Estimate difficulty level based on file content or path
 */
function guessLevel(title, category) {
  const titleLower = title.toLowerCase();
  const catLower = category.toLowerCase();

  if (titleLower.includes('beginner') || titleLower.includes('intro') || titleLower.includes('fundamental') || titleLower.includes('basic') || titleLower.includes('cheatsheet') || titleLower.includes('cheat sheet')) {
    return 'Beginner';
  }
  if (titleLower.includes('advanced') || titleLower.includes('deep dive') || titleLower.includes('master') || titleLower.includes('expert') || titleLower.includes('complex') || titleLower.includes('performance')) {
    return 'Advanced';
  }

  return DEFAULT_LEVEL;
}

/**
 * Generate tags from title and category
 */
function generateTags(title, category, ext) {
  const tags = new Set();
  tags.add(category);

  const titleLower = title.toLowerCase();
  const keywordMap = {
    'interview': 'Interview',
    'java': 'Java',
    'spring': 'Spring',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'kafka': 'Kafka',
    'sql': 'SQL',
    'database': 'Database',
    'design': 'Design',
    'microservice': 'Microservices',
    'azure': 'Azure',
    'aws': 'AWS',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'react': 'React',
    'angular': 'Angular',
    'html': 'HTML',
    'css': 'CSS',
    'oauth': 'OAuth',
    'security': 'Security',
    'network': 'Networking',
    'algorithm': 'Algorithms',
    'data structure': 'Data Structures',
    'architecture': 'Architecture',
    'cloud': 'Cloud',
    'devops': 'DevOps',
    'testing': 'Testing',
    'performance': 'Performance'
  };

  for (const [keyword, tag] of Object.entries(keywordMap)) {
    if (titleLower.includes(keyword)) {
      tags.add(tag);
    }
  }

  if (ext === 'pdf') tags.add('PDF');
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) tags.add('Visual');
  if (ext === 'md') tags.add('Markdown');

  return Array.from(tags);
}

/**
 * Generate a description from the title and category
 */
function generateDescription(title, category, ext) {
  const extNames = {
    pdf: 'comprehensive PDF guide',
    md: 'Markdown reference document',
    png: 'PNG diagram',
    jpg: 'JPG image',
    jpeg: 'JPEG image',
    gif: 'animated GIF illustration',
    webp: 'WEBP image',
    svg: 'SVG diagram',
    txt: 'text document'
  };

  const typeDesc = extNames[ext] || 'document';
  return `${title} - A ${typeDesc} covering ${category.toLowerCase()} topics for interview preparation.`;
}

/**
 * Recursively scan directory for supported files
 */
function scanDirectory(dirPath) {
  const results = [];
  let entries;

  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`  Error reading directory ${dirPath}: ${err.message}`);
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        try {
          const stat = fs.statSync(fullPath);
          const title = extractTitle(fullPath, entry.name);
          const category = getCategory(dirPath);
          const relativePath = getRelativePath(fullPath);
          const fileExt = ext.replace('.', '');
          const level = guessLevel(title, category);
          const tags = generateTags(title, category, fileExt);
          const description = generateDescription(title, category, fileExt);
          const date = stat.mtime.toISOString().split('T')[0];
          const fileSize = stat.size;

          results.push({
            title,
            description,
            category,
            tags,
            type: fileExt,
            path: relativePath,
            level,
            date,
            fileSize
          });

          console.log(`  ✓ ${entry.name} (${category}, ${level})`);
        } catch (err) {
          console.error(`  ✗ Error processing ${entry.name}: ${err.message}`);
        }
      }
    }
  }

  return results;
}

/**
 * Check if qpdf is available
 */
function hasQpdf() {
  try {
    execSync('qpdf --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get PDF page count using qpdf
 */
function getPdfPageCount(filePath) {
  const result = execSync(`qpdf --show-npages "${filePath}"`, { encoding: 'utf-8' });
  return parseInt(result.trim(), 10);
}

/**
 * Split a PDF into parts by page ranges using qpdf
 * Returns: array of { part, path, pages, size }
 */
function splitOversizedPdf(filePath, relativePath) {
  const totalPages = getPdfPageCount(filePath);
  const totalBytes = fs.statSync(filePath).size;
  const totalMB = totalBytes / (1024 * 1024);
  const avgMBPerPage = totalMB / totalPages;

  const targetMB = 20;
  let maxPagesPerPart = Math.floor(targetMB / avgMBPerPage);
  if (maxPagesPerPart < 1) maxPagesPerPart = 1;

  let numParts = Math.ceil(totalPages / maxPagesPerPart);
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, '.pdf');

  // Iterative approach: try increasing parts until all are under limit
  let parts = [];
  let allUnderLimit = false;

  while (!allUnderLimit) {
    const basePP = Math.floor(totalPages / numParts);
    const extra = totalPages - (basePP * numParts);
    parts = [];
    let current = 1;
    allUnderLimit = true;

    for (let i = 0; i < numParts; i++) {
      let pagesInPart = basePP;
      if (i < extra) pagesInPart++;

      const start = current;
      const end = current + pagesInPart - 1;
      current = end + 1;

      const partStr = String(i + 1).padStart(2, '0');
      const outputName = `${baseName}-Part${partStr}.pdf`;
      const outputPath = path.join(dir, outputName);

      console.log(`    Splitting pages ${start}-${end} -> ${outputName}`);
      execSync(`qpdf --empty --pages "${filePath}" "${start}-${end}" -- "${outputPath}"`, { stdio: 'ignore' });

      const sizeMB = fs.statSync(outputPath).size / (1024 * 1024);
      if (sizeMB > CLOUDFLARE_LIMIT_MB) {
        allUnderLimit = false;
      }

      const partRelPath = relativePath.replace(/[^/\\]+\.pdf$/, outputName);
      parts.push({
        part: i + 1,
        path: partRelPath.replace(/\\/g, '/'),
        pages: `${start}-${end}`,
        size: Math.round(sizeMB * 100) / 100
      });
    }

    if (!allUnderLimit) {
      console.log(`    Some parts exceed limit, redistributing into ${numParts + 1} parts...`);
      // Clean up oversized parts
      for (const p of parts) {
        const fullP = path.join(dir, path.basename(p.path));
        if (fs.existsSync(fullP)) fs.unlinkSync(fullP);
      }
      numParts++;
    }
  }

  // Remove original oversized PDF
  fs.unlinkSync(filePath);
  console.log(`    Removed original oversized PDF`);

  return parts;
}

/**
 * Post-process notes: group Part files, split oversized PDFs
 */
function processNotes(notes) {
  const partRegex = /-Part(\d{2})\.(pdf|PDF)$/;
  const groups = new Map();

  for (const note of notes) {
    const match = note.path.match(partRegex);
    if (match) {
      const basePath = note.path.replace(partRegex, '.pdf');
      if (!groups.has(basePath)) groups.set(basePath, []);
      groups.get(basePath).push(note);
    } else {
      if (!groups.has(note.path)) groups.set(note.path, []);
      groups.get(note.path).push(note);
    }
  }

  const merged = [];

  for (const [key, items] of groups) {
    if (items.length === 1) {
      const item = items[0];
      const fullPath = path.join(ROOT_DIR, item.path);

      // Check if oversized PDF
      if (fs.existsSync(fullPath) && item.type === 'pdf' && fs.statSync(fullPath).size > MAX_SIZE_BYTES) {
        console.log(`\n  ⚠ ${item.path} (${(fs.statSync(fullPath).size / (1024 * 1024)).toFixed(1)} MiB) exceeds ${CLOUDFLARE_LIMIT_MB} MiB limit`);
        console.log(`    Splitting into parts...`);

        if (hasQpdf()) {
          const parts = splitOversizedPdf(fullPath, item.path);
          item.path = parts[0].path;
          item.parts = parts;
          // Update description
          item.description = `${item.title} - Multi-part PDF guide. Total ${parts.length} parts covering ${item.category.toLowerCase()} topics for interview preparation.`;
        } else {
          console.log(`    WARNING: qpdf not installed. Cannot split ${item.path}. This file will exceed Cloudflare Pages limits.`);
          console.log(`    Install qpdf: sudo apt-get install -y qpdf (Linux) or brew install qpdf (macOS)`);
        }
      }

      merged.push(item);
    } else {
      // Multiple parts - merge into single entry
      const sorted = items.sort((a, b) => {
        const ma = a.path.match(partRegex);
        const mb = b.path.match(partRegex);
        return parseInt(ma[1], 10) - parseInt(mb[1], 10);
      });

      const first = sorted[0];
      const parts = sorted.map((n, i) => {
        const m = n.path.match(partRegex);
        return {
          part: parseInt(m[1], 10),
          path: n.path,
          pages: '',  // Will be calculated from total pages if possible
          size: Math.round(fs.statSync(path.join(ROOT_DIR, n.path)).size / (1024 * 1024) * 100) / 100
        };
      });

      first.title = first.title.replace(/\s*Part\d{2}\s*$/i, '').trim();
      if (first.title.endsWith('-') || first.title.endsWith('_')) {
        first.title = first.title.slice(0, -1).trim();
      }
      first.path = parts[0].path;
      first.parts = parts;
      first.description = `${first.title} - Multi-part PDF guide. Total ${parts.length} parts covering ${first.category.toLowerCase()} topics for interview preparation.`;

      merged.push(first);
    }
  }

  return merged;
}

/**
 * Main entry point
 */
function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   Developer Notes Generator              ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`Scanning: ${DOCS_DIR}\n`);

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Error: docs directory not found at ${DOCS_DIR}`);
    console.error('Make sure you are running this script from the project root.\n');
    process.exit(1);
  }

  let notes = scanDirectory(DOCS_DIR);

  console.log(`\nFound ${notes.length} file(s).`);

  if (notes.length > 0) {
    console.log('\nProcessing oversized PDFs and grouping parts...');
    notes = processNotes(notes);

    notes.sort((a, b) => new Date(b.date) - new Date(a.date));

    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(notes, null, 2), 'utf-8');
    console.log(`\n✓ Generated: ${OUTPUT_FILE}`);

    // Print summary
    const categories = {};
    const types = {};
    notes.forEach(n => {
      categories[n.category] = (categories[n.category] || 0) + 1;
      types[n.type] = (types[n.type] || 0) + 1;
    });

    console.log('\n📂 Category Breakdown:');
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

    console.log('\n📄 File Type Breakdown:');
    Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => console.log(`  .${type}: ${count}`));

    // Cloudflare compliance check
    const oversized = notes.filter(n => n.type === 'pdf' && !n.parts && fs.statSync(path.join(ROOT_DIR, n.path)).size > MAX_SIZE_BYTES);
    if (oversized.length > 0) {
      console.log('\n⚠ WARNING: The following PDFs exceed 24 MiB and may not deploy on Cloudflare Pages:');
      oversized.forEach(n => {
        const size = (fs.statSync(path.join(ROOT_DIR, n.path)).size / (1024 * 1024)).toFixed(1);
        console.log(`  - ${n.path} (${size} MiB)`);
      });
    } else {
      console.log('\n✓ All PDFs within Cloudflare Pages limits (≤ 24 MiB).');
    }

    console.log('\n✅ Done! data/notes.json has been updated.\n');
  } else {
    console.log('\nNo supported files found. Add files to the docs/ folder and re-run.\n');
    // Create an empty array
    fs.writeFileSync(OUTPUT_FILE, '[]', 'utf-8');
    console.log('Created empty data/notes.json\n');
  }
}

main();
