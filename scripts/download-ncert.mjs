/**
 * EduVault Automated NCERT Class 1 to 12 Textbook Downloader
 * 
 * Features:
 *   - Downloads all NCERT textbooks from Class 1 to Class 12
 *   - Stores chapter PDFs in both:
 *       1) Standard repository: storage/ncert/{code}/{filename}
 *       2) Human-readable library: storage/by-class/Class {N}/{Subject}/{BookTitle}/
 *   - Automatic byte-range resume (-C -) for interrupted downloads
 *   - TLS/Schannel drop resilience with retry and PDF validation
 *   - Zero duplicate storage: uses NTFS hardlinks between folder structures
 *   - Generates complete download manifest in storage/ncert_manifest.json
 * 
 * Usage:
 *   node scripts/download-ncert.mjs --all            # Download all 113 NCERT books (Classes 1-12)
 *   node scripts/download-ncert.mjs --class 10       # Download all Class 10 textbooks
 *   node scripts/download-ncert.mjs --priority       # Download priority exam textbooks
 *   node scripts/download-ncert.mjs jesc1 jemh1      # Download specific book codes
 *   node scripts/download-ncert.mjs --status         # Check local download status
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NCERT_FULL_CHAPTER_COUNTS, ncertCatalogByClassAndSubject } from '../src/data/ncertCatalogData.js';
import { items as allOpenItems } from '../src/data/openItems.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const STORAGE_ROOT = path.resolve(ROOT_DIR, 'storage');
const STORAGE_NCERT = path.resolve(STORAGE_ROOT, 'ncert');
const STORAGE_BY_CLASS = path.resolve(STORAGE_ROOT, 'by-class');

// Ensure root storage folders exist
fs.mkdirSync(STORAGE_NCERT, { recursive: true });
fs.mkdirSync(STORAGE_BY_CLASS, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Sanitize string for Windows filesystem safety */
function sanitizeFolderName(str) {
  return str.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

/** Check if a PDF file is completely and correctly downloaded */
function isPdfComplete(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (stat.size < 5000) return false;

    // Check %PDF header
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(5);
    fs.readSync(fd, header, 0, 5, 0);
    if (header.toString('utf8') !== '%PDF-') {
      fs.closeSync(fd);
      return false;
    }

    // Check for %%EOF in the last 2048 bytes
    const tailSize = Math.min(2048, stat.size);
    const tail = Buffer.alloc(tailSize);
    fs.readSync(fd, tail, 0, tailSize, stat.size - tailSize);
    fs.closeSync(fd);
    return tail.toString('latin1').includes('%%EOF');
  } catch {
    return false;
  }
}

/** Check if downloaded file is actually an HTML error page */
function isHtml404(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buf = Buffer.alloc(512);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
    fs.closeSync(fd);
    const text = buf.toString('utf8', 0, bytesRead).toLowerCase();
    return text.includes('404') || text.includes('not found') || text.includes('<!doctype') || text.includes('<html');
  } catch {
    return false;
  }
}

/** Robust chapter download using curl.exe with byte-range resume (-C -) */
function downloadChapterOnce(url, destPath, isOptional = false) {
  return new Promise((resolve, reject) => {
    if (isPdfComplete(destPath)) {
      return resolve(fs.statSync(destPath).size);
    }

    const maxTime = isOptional ? '10' : '30';
    execFile('curl.exe', [
      '-k', '-s', '-S', '-L',
      '--http1.1',
      '-C', '-',
      '--retry', '0',
      '--ssl-no-revoke',
      '--connect-timeout', '10',
      '--max-time', maxTime,
      '--speed-limit', '2000',
      '--speed-time', '8',
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '-e', 'https://ncert.nic.in/textbook.php',
      '-o', destPath,
      url,
    ], (curlErr) => {
      if (isHtml404(destPath)) {
        try { fs.unlinkSync(destPath); } catch {}
        return reject(new Error('HTTP 404 Not Found'));
      }

      if (isPdfComplete(destPath)) {
        return resolve(fs.statSync(destPath).size);
      }

      if (curlErr) {
        return reject(new Error(`curl error: ${curlErr.message}`));
      }

      const sz = fs.existsSync(destPath) ? fs.statSync(destPath).size : 0;
      if (sz > 5000) {
        return resolve(sz);
      }

      reject(new Error('Downloaded file too small or incomplete'));
    });
  });
}

/** Download chapter with retries */
async function downloadChapterWithRetry(url, destPath, isOptional = false) {
  const maxAttempts = isOptional ? 1 : 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const size = await downloadChapterOnce(url, destPath, isOptional);
      return size;
    } catch (err) {
      if (err.message.includes('404')) {
        throw err;
      }
      if (attempt === maxAttempts) {
        throw err;
      }
      await sleep(500);
    }
  }
}

/** Link standard storage file to human-readable by-class hierarchy (NTFS hard link) */
function createReadableLink(sourcePath, targetPath) {
  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (fs.existsSync(targetPath)) return;
    try {
      fs.linkSync(sourcePath, targetPath); // 0 extra bytes on NTFS!
    } catch {
      fs.copyFileSync(sourcePath, targetPath);
    }
  } catch {}
}

/** Find metadata for a book code across catalog */
function findBookMetadata(code) {
  const cleanCode = code.toLowerCase().trim();
  for (const [classNum, subjects] of Object.entries(ncertCatalogByClassAndSubject)) {
    for (const [subject, books] of Object.entries(subjects)) {
      for (const b of books) {
        if (b.code?.toLowerCase() === cleanCode) {
          return { ...b, classLevel: parseInt(classNum, 10), subject };
        }
      }
    }
  }

  // Fallback to openItems
  if (Array.isArray(allOpenItems)) {
    const fromOpen = allOpenItems.find((x) => {
      const c = x.code || x.url?.match(/\/pdf\/([a-z0-9]+)dd\.zip/)?.[1] || x.id.replace('ncert-', '');
      return c?.toLowerCase() === cleanCode;
    });
    if (fromOpen) {
      let inferredClass = fromOpen.classLevel;
      if (!inferredClass) {
        const prefix = cleanCode[0];
        const classMap = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, k: 11, l: 12 };
        inferredClass = classMap[prefix] || 0;
      }
      const rawSubject = fromOpen.subject || 'General';
      const normalizedSubject = rawSubject === 'Maths' ? 'Mathematics' : rawSubject;
      return {
        ...fromOpen,
        code: cleanCode,
        classLevel: inferredClass,
        subject: normalizedSubject,
      };
    }
  }

  return {
    code: cleanCode,
    title: `NCERT Textbook (${cleanCode.toUpperCase()})`,
    classLevel: cleanCode.startsWith('l') ? 12 : 0,
    subject: 'General',
  };
}

/** Download a single NCERT book */
async function downloadBook(code) {
  const cleanCode = code.toLowerCase().trim();
  const meta = findBookMetadata(cleanCode);
  const maxChapters = NCERT_FULL_CHAPTER_COUNTS[cleanCode] || 10;

  const standardDir = path.resolve(STORAGE_NCERT, cleanCode);
  fs.mkdirSync(standardDir, { recursive: true });

  const classFolder = meta.classLevel ? `Class ${meta.classLevel}` : 'Other';
  const readableBookDir = path.resolve(
    STORAGE_BY_CLASS,
    classFolder,
    sanitizeFolderName(meta.subject || 'General'),
    sanitizeFolderName(meta.title || cleanCode)
  );

  console.log(`\n================================================================`);
  console.log(`📚 NCERT Textbook: [${cleanCode.toUpperCase()}] ${meta.title}`);
  console.log(`   Class:    ${meta.classLevel ? `Class ${meta.classLevel}` : 'N/A'}`);
  console.log(`   Subject:  ${meta.subject}`);
  console.log(`   Chapters: ${maxChapters} chapters + prelims & answers`);
  console.log(`   Storage:  storage/ncert/${cleanCode}/`);
  console.log(`   Library:  storage/by-class/${classFolder}/${sanitizeFolderName(meta.subject)}/`);
  console.log(`================================================================`);

  const chapters = ['ps'];
  for (let i = 1; i <= maxChapters; i++) {
    chapters.push(String(i).padStart(2, '0'));
  }
  const answerEligibleSubjects = ['Mathematics', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Science', 'Accountancy', 'Economics'];
  if (answerEligibleSubjects.includes(meta.subject)) {
    chapters.push('an');
  }

  let downloadedCount = 0;
  let skippedCount = 0;
  let totalBytes = 0;
  let consecutive404 = 0;

  for (const ch of chapters) {
    const filename = `${cleanCode}${ch}.pdf`;
    const destPath = path.join(standardDir, filename);
    const ncertUrl = `https://ncert.nic.in/textbook/pdf/${filename}`;

    // Readable name formatting
    let readableChapterName = `Chapter ${ch}.pdf`;
    if (ch === 'ps') readableChapterName = '00 - Prelims & Index.pdf';
    else if (ch === 'an') readableChapterName = '99 - Answers & Solutions.pdf';
    else if (meta.chapters) {
      const chNum = parseInt(ch, 10);
      const chMeta = meta.chapters.find((c) => c.id === `${cleanCode}${ch}`);
      if (chMeta && chMeta.name) {
        readableChapterName = `${String(chNum).padStart(2, '0')} - ${sanitizeFolderName(chMeta.name)}.pdf`;
      }
    }
    const readablePath = path.join(readableBookDir, readableChapterName);

    // 1. Check if already completely downloaded
    if (isPdfComplete(destPath)) {
      const szMB = (fs.statSync(destPath).size / 1024 / 1024).toFixed(2);
      console.log(`  ⚡ [Cached] ${filename} (${szMB} MB)`);
      createReadableLink(destPath, readablePath);
      skippedCount++;
      consecutive404 = 0;
      continue;
    }

    // 2. Download from NCERT with byte-range resume
    process.stdout.write(`  📥 Downloading ${filename}... `);
    const isOptional = ch === 'ps' || ch === 'an';
    try {
      const size = await downloadChapterWithRetry(ncertUrl, destPath, isOptional);
      const szMB = (size / 1024 / 1024).toFixed(2);
      console.log(`✅ (${szMB} MB)`);
      createReadableLink(destPath, readablePath);
      totalBytes += size;
      downloadedCount++;
      consecutive404 = 0;
    } catch (err) {
      const isNotFoundOrDropped = err.message.includes('404') || err.message.includes('Operation too slow') || err.message.includes('server closed abruptly');
      if (isNotFoundOrDropped) {
        console.log(`⏭️  Not Available on NCERT`);
        if (ch !== 'ps' && ch !== 'an') {
          consecutive404++;
          if (consecutive404 >= 2) {
            console.log(`   Reached end of available chapters for this book.`);
            break; // Book is finished
          }
        }
      } else {
        console.log(`⚠️  Failed: ${err.message}`);
        if (ch !== 'ps' && ch !== 'an') {
          consecutive404++;
          if (consecutive404 >= 2) {
            break;
          }
        }
      }
    }

    await sleep(600); // Polite delay between requests
  }

  console.log(`\n🎉 [${cleanCode.toUpperCase()}] Finished! Downloaded: ${downloadedCount}, Cached: ${skippedCount}, Total Size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  return { downloadedCount, skippedCount, totalBytes };
}

/** Check and display local download inventory */
function displayStatus() {
  console.log(`\n📊 Querying local storage inventory: ${STORAGE_ROOT}`);
  if (!fs.existsSync(STORAGE_NCERT)) {
    console.log('No local storage found yet.');
    return;
  }

  const bookDirs = fs.readdirSync(STORAGE_NCERT).filter((d) => fs.statSync(path.join(STORAGE_NCERT, d)).isDirectory());
  let totalFiles = 0;
  let totalBytes = 0;

  console.log(`\n================================================================`);
  console.log(`📚 Local NCERT Textbook Storage Inventory (${bookDirs.length} books present)`);
  console.log(`================================================================`);

  for (const b of bookDirs) {
    const dir = path.join(STORAGE_NCERT, b);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf'));
    let bookBytes = 0;
    for (const f of files) {
      const sz = fs.statSync(path.join(dir, f)).size;
      bookBytes += sz;
    }
    totalFiles += files.length;
    totalBytes += bookBytes;
    const meta = findBookMetadata(b);
    const label = meta.classLevel ? `Class ${meta.classLevel} - ${meta.title}` : b;
    console.log(`  📁 [${b.toUpperCase().padEnd(6)}] ${label.padEnd(52)} : ${String(files.length).padStart(2)} PDFs (${(bookBytes / 1024 / 1024).toFixed(2)} MB)`);
  }

  console.log(`----------------------------------------------------------------`);
  console.log(`💾 Total Local PDFs Stored: ${totalFiles} chapters`);
  console.log(`📦 Total Storage Consumed: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📂 Folder Location:         ${STORAGE_NCERT}`);
  console.log(`📂 By-Class Library:       ${STORAGE_BY_CLASS}\n`);
}

/** Generate complete JSON manifest of downloaded storage */
function generateManifest() {
  const manifest = {
    updatedAt: new Date().toISOString(),
    storageLocation: STORAGE_ROOT,
    books: {},
  };

  if (fs.existsSync(STORAGE_NCERT)) {
    const bookDirs = fs.readdirSync(STORAGE_NCERT).filter((d) => fs.statSync(path.join(STORAGE_NCERT, d)).isDirectory());
    for (const b of bookDirs) {
      const dir = path.join(STORAGE_NCERT, b);
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf'));
      const meta = findBookMetadata(b);
      manifest.books[b] = {
        code: b,
        title: meta.title,
        classLevel: meta.classLevel,
        subject: meta.subject,
        chapterCount: files.length,
        files: files.map((f) => ({
          filename: f,
          sizeBytes: fs.statSync(path.join(dir, f)).size,
        })),
      };
    }
  }

  const manifestPath = path.join(STORAGE_ROOT, 'ncert_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📄 Saved download manifest: ${manifestPath}`);
}

// Priority books for high-demand exam curriculum
const PRIORITY_BOOKS = [
  'aemr1', // Class 1 English Mridang
  'aejm1', // Class 1 Math Joyful Mathematics
  'ahsr1', // Class 1 Hindi Sarangi
  'jesc1', // Class 10 Science
  'jemh1', // Class 10 Mathematics
  'jess1', // Class 10 Social Science (History)
  'jeff1', // Class 10 English First Flight
  'lech1', // Class 12 Chemistry Part 1
  'lech2', // Class 12 Chemistry Part 2
  'leph1', // Class 12 Physics Part 1
  'leph2', // Class 12 Physics Part 2
  'lemh1', // Class 12 Mathematics Part 1
  'lemh2', // Class 12 Mathematics Part 2
  'lebo1', // Class 12 Biology
  'kepy1', // Class 11 Physics Part 1
  'kech1', // Class 11 Chemistry Part 1
  'kemh1', // Class 11 Mathematics Part 1
];

async function main() {
  const args = process.argv.slice(2);
  const firstArg = args[0];

  if (!firstArg || firstArg === '--help' || firstArg === '-h') {
    console.log(`
EduVault NCERT Textbook Downloader (Class 1 to 12)
==================================================
Website Source: https://ncert.nic.in/textbook.php
Destination:    ${STORAGE_ROOT}

Usage:
  node scripts/download-ncert.mjs --all            Download all 113 books across Class 1-12
  node scripts/download-ncert.mjs --class <1-12>   Download all books for a specific class
  node scripts/download-ncert.mjs --priority       Download high-priority core curriculum
  node scripts/download-ncert.mjs <codes...>       Download specific books (e.g. jesc1 jemh1 leph1)
  node scripts/download-ncert.mjs --status         Check downloaded textbooks in storage/
  node scripts/download-ncert.mjs --manifest       Generate JSON inventory manifest
`);
    return;
  }

  if (firstArg === '--status') {
    displayStatus();
    return;
  }

  if (firstArg === '--manifest') {
    generateManifest();
    return;
  }

  if (firstArg === '--class' || firstArg === '--classes') {
    const classArgs = [];
    for (const a of args.slice(1)) {
      if (a.includes('-')) {
        const [start, end] = a.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (!classArgs.includes(i)) classArgs.push(i);
          }
        }
      } else if (a.includes(',')) {
        a.split(',').forEach((n) => {
          const num = parseInt(n.trim(), 10);
          if (!isNaN(num) && !classArgs.includes(num)) classArgs.push(num);
        });
      } else {
        const num = parseInt(a.trim(), 10);
        if (!isNaN(num) && !classArgs.includes(num)) classArgs.push(num);
      }
    }

    if (classArgs.length === 0) {
      console.error(`❌ Please provide one or more class numbers (1-12), e.g. --classes 2,3,4,5,6,7,8,9,11`);
      return;
    }

    console.log(`\n📚 Preparing Batch NCERT Download for Classes: ${classArgs.join(', ')}...`);

    for (const classNum of classArgs) {
      const classData = ncertCatalogByClassAndSubject[classNum] || {};
      const bookCodes = [];

      // 1. Collect from ncertCatalogByClassAndSubject
      for (const [subject, books] of Object.entries(classData)) {
        for (const b of books) {
          if (b.code && !bookCodes.includes(b.code)) bookCodes.push(b.code);
        }
      }

      // 2. Also collect from allOpenItems
      if (Array.isArray(allOpenItems)) {
        allOpenItems.forEach((x) => {
          if (x.source === 'NCERT' && x.classLevel === classNum) {
            const c = x.code || x.url?.match(/\/pdf\/([a-z0-9]+)dd\.zip/)?.[1] || x.id.replace('ncert-', '');
            if (c && !bookCodes.includes(c.toLowerCase())) {
              bookCodes.push(c.toLowerCase());
            }
          }
        });
      }

      if (bookCodes.length === 0) {
        console.warn(`[Skip Warning] Class ${classNum} has no books defined in catalog.`);
        continue;
      }

      console.log(`\n============================================================`);
      console.log(`🏫 Starting Class ${classNum} (${bookCodes.length} textbooks): ${bookCodes.join(', ')}`);
      console.log(`============================================================`);

      for (const code of bookCodes) {
        try {
          await downloadBook(code);
        } catch (err) {
          console.warn(`[Skip Warning] Could not finish ${code}:`, err.message);
        }
      }
    }

    generateManifest();
    console.log(`\n🌟 All requested classes (${classArgs.join(', ')}) download complete!`);
    return;
  }

  if (firstArg === '--priority') {
    console.log(`\n📚 Downloading High-Priority NCERT Textbooks (${PRIORITY_BOOKS.length} books)...`);
    for (const code of PRIORITY_BOOKS) {
      try {
        await downloadBook(code);
      } catch (err) {
        console.warn(`[Skip Warning] Could not finish ${code}:`, err.message);
      }
    }
    generateManifest();
    console.log(`\n🌟 Priority textbook download complete!`);
    return;
  }

  if (firstArg === '--all') {
    const allCodes = Object.keys(NCERT_FULL_CHAPTER_COUNTS);
    console.log(`\n🌍 Starting Complete NCERT Download for ALL ${allCodes.length} Books (Class 1 to 12)...`);
    let idx = 0;
    for (const code of allCodes) {
      idx++;
      console.log(`\n------------------------------------------------------------`);
      console.log(`[${idx}/${allCodes.length}] Processing Book Code: ${code.toUpperCase()}`);
      console.log(`------------------------------------------------------------`);
      try {
        await downloadBook(code);
      } catch (err) {
        console.warn(`[Skip Warning] Could not finish ${code}:`, err.message);
      }
    }
    generateManifest();
    console.log(`\n🌟 Complete NCERT Catalog download finished!`);
    return;
  }

  // Multi or single book download
  for (const code of args) {
    if (code.startsWith('-')) continue;
    try {
      await downloadBook(code);
    } catch (err) {
      console.warn(`[Skip Warning] Could not finish ${code}:`, err.message);
    }
  }
  generateManifest();
}

main().catch((err) => {
  console.error('\n❌ Fatal Download Error:', err);
  process.exit(1);
});
