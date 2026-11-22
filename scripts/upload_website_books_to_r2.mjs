/**
 * EduVault Cloudflare R2 Sync CLI - Website Books Only (High-Throughput Parallel Pipeline)
 * 
 * Target: ONLY the 113 core curriculum books mentioned on the EduVault website.
 * Destination: Cloudflare R2 bucket `eduvault-books`
 * CDN URL: https://pub-54ce43e6ab02460299838f807b567083.r2.dev/ncert/{code}/{filename}
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { ncertBooks } from '../src/data/ncertBooksData.js';

// 1. Environment & R2 Setup
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'eduvault-books';
const R2_PUBLIC_URL = (process.env.VITE_R2_PUBLIC_URL || 'https://pub-54ce43e6ab02460299838f807b567083.r2.dev').replace(/\/+$/, '');

const agent = new https.Agent({ minVersion: 'TLSv1.3', keepAlive: true, maxSockets: 20 });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({ httpsAgent: agent }),
});

// 2. Fetch all existing R2 Keys into an in-memory Set (0ms lookup)
async function fetchAllR2Keys() {
  const keys = new Set();
  let continuationToken = undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
    }));
    for (const item of res.Contents || []) {
      keys.add(item.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  return keys;
}

// 3. Scan storage/by-class once to build local lookup index
const BY_CLASS_DIR = path.resolve(process.cwd(), 'storage', 'by-class');
const TEMP_CACHE_DIR = path.resolve('C:\\Users\\ssuni\\AppData\\Local\\Temp\\ncert_cache');
const localClassFiles = {}; // classNum -> list of { bookName, fileName, fullPath }

function indexLocalFiles() {
  if (!fs.existsSync(BY_CLASS_DIR)) return;
  const classDirs = fs.readdirSync(BY_CLASS_DIR);
  for (const cName of classDirs) {
    const cMatch = cName.match(/(\d+)/);
    if (!cMatch) continue;
    const clNum = parseInt(cMatch[1], 10);
    localClassFiles[clNum] = [];

    const cPath = path.join(BY_CLASS_DIR, cName);
    if (!fs.statSync(cPath).isDirectory()) continue;

    const subjects = fs.readdirSync(cPath);
    for (const sName of subjects) {
      const sPath = path.join(cPath, sName);
      if (!fs.statSync(sPath).isDirectory()) continue;

      const books = fs.readdirSync(sPath);
      for (const bName of books) {
        const bPath = path.join(sPath, bName);
        if (!fs.statSync(bPath).isDirectory()) continue;

        const files = fs.readdirSync(bPath).filter(f => f.toLowerCase().endsWith('.pdf'));
        for (const f of files) {
          localClassFiles[clNum].push({
            bookName: bName.toLowerCase(),
            fileName: f.toLowerCase(),
            fullPath: path.join(bPath, f),
          });
        }
      }
    }
  }
}

// 4. Aliases for books where local folder name differs
const BOOK_ALIASES = {
  ahjm1: ['joyful-mathematics hindi', 'anandmay ganit', 'joyful mathematics'],
  ahsr1: ['sarangi'],
  aevs1: ['our wondrous world', 'our-wondrous-world'],
  ahvs1: ['hamara adbhut sansar'],
  bevs1: ['our wondrous world', 'our-wondrous-world', 'bevs1'],
  bhjm1: ['joyful-mathematics hindi', 'joyful mathematics'],
  bhsr1: ['sarangi'],
  chvn1: ['veena', 'bansuri'],
  demh1: ['math-magic', 'math magic'],
  dhrm1: ['rimjhim'],
  ehrm1: ['rimjhim'],
  fesc1: ['curiosity', 'science'],
  fess1: ['our-pasts-i', 'our pasts - i', 'our pasts i'],
  fess2: ['earth our habitat', 'the earth our habitat'],
  fess3: ['social and political life-i', 'social and political life - i'],
  fhvs1: ['vasant'],
  fskr1: ['ruchira'],
  gemh1: ['mathematics'],
  gskr1: ['ruchira'],
  hess1: ['our-pasts-iii', 'our pasts - iii'],
  hskr1: ['ruchira'],
  iess1: ['india and the contemporary world-i', 'india & contemporary world - i'],
  iess2: ['contemporary india'],
  iess3: ['democratic politics'],
  ihks1: ['kshitij'],
  iskr1: ['shemushi'],
  jess1: ['india and the contemporary world-ii', 'india & contemporary world - ii'],
  jess2: ['contemporary india'],
  jess3: ['democratic politics'],
  jhks1: ['kshitij'],
  jskr1: ['shemushi'],
  kepy2: ['physics part-ii', 'physics part 2'],
  ksbv1: ['bhaswati'],
  lsbv1: ['bhaswati'],
  leph1: ['physics part 1', 'physics part-i'],
  leph2: ['physics part 2', 'physics part-ii'],
  lech1: ['chemistry part 1', 'chemistry part-i'],
  lech2: ['chemistry part 2', 'chemistry part-ii'],
  lemh1: ['mathematics part 1', 'mathematics part-i', 'mathematics'],
  lemh2: ['mathematics part 2', 'mathematics part-ii'],
};

function findLocalChapterPath(classLevel, bookCode, bookTitle, chId) {
  // 0. Check in temp cache first (from GitHub mirror downloads)
  const expectedFilename = `${bookCode}${chId}.pdf`;
  const tempPath = path.join(TEMP_CACHE_DIR, bookCode, expectedFilename);
  if (fs.existsSync(tempPath)) {
    return tempPath;
  }

  const files = localClassFiles[classLevel] || [];
  const cleanTitle = bookTitle.split('—')[0].trim().toLowerCase();
  const aliases = BOOK_ALIASES[bookCode] || [];
  const matchCandidates = [...aliases, cleanTitle, bookCode];

  // Filter files that belong to this book
  const bookFiles = files.filter(f => {
    return matchCandidates.some(c => f.bookName.includes(c) || c.includes(f.bookName));
  });

  if (chId === 'ps') {
    const f = bookFiles.find(x => x.fileName.includes('prelim') || x.fileName.startsWith('00') || x.fileName.includes('ps'));
    return f ? f.fullPath : null;
  }
  if (chId === 'an') {
    const f = bookFiles.find(x => x.fileName.includes('answer') || x.fileName.startsWith('99') || x.fileName.includes('an'));
    return f ? f.fullPath : null;
  }

  // Numeric chapter
  const num = parseInt(chId, 10);
  const f = bookFiles.find(x => {
    const m = x.fileName.match(/chapter\s*0*(\d+)/i) || x.fileName.match(/^0*(\d+)\.pdf/i);
    if (!m) return false;
    const fNum = parseInt(m[1], 10);
    return fNum === num || (fNum > 100 && (fNum % 100) === num);
  });

  return f ? f.fullPath : null;
}

// 5. Download in-memory buffer with timeout & retry (Zero disk writes)
function downloadBufferInMemory(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: timeoutMs, rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBufferInMemory(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 5000) {
          return reject(new Error('PDF too small or empty'));
        }
        resolve(buf);
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', reject);
  });
}

// 6. Upload directly to Cloudflare R2
async function uploadBufferToR2(key, buffer) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
}

// 7. Concurrent Worker Pool
async function runConcurrent(items, concurrencyLimit, taskFn) {
  const executing = new Set();
  const results = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => taskFn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// 8. Main runner
async function main() {
  const args = process.argv.slice(2);
  const classFilter = args.includes('--class') ? parseInt(args[args.indexOf('--class') + 1], 10) : null;
  const statusOnly = args.includes('--status');
  const specificBook = args.find(a => !a.startsWith('-') && args[args.indexOf(a) - 1] !== '--class');

  console.log(`================================================================`);
  console.log(`🚀 EduVault Cloudflare R2 Website Books Sync (Parallel Pipeline)`);
  console.log(`   Destination Bucket: ${BUCKET_NAME}`);
  console.log(`   Public Edge CDN:    ${R2_PUBLIC_URL}`);
  console.log(`================================================================`);

  console.log(`\n🔍 Fetching all existing R2 keys from bucket [${BUCKET_NAME}]...`);
  const liveR2Keys = await fetchAllR2Keys();
  console.log(`📊 Currently stored on Cloudflare R2: ${liveR2Keys.size} objects`);

  console.log(`\n📂 Indexing local storage/by-class...`);
  indexLocalFiles();
  let totalIndexed = 0;
  for (const c in localClassFiles) totalIndexed += localClassFiles[c].length;
  console.log(`📁 Local chapter PDFs indexed: ${totalIndexed} across 12 classes`);

  // Target: ONLY website books (the 113 core books with explicit chapters)
  let targetBooks = ncertBooks.filter(b => Array.isArray(b.chapters) && b.chapters.length > 0);
  if (classFilter) {
    targetBooks = targetBooks.filter(b => b.classLevel === classFilter);
    console.log(`📌 Filtered to Class ${classFilter}: ${targetBooks.length} books`);
  } else if (specificBook) {
    targetBooks = targetBooks.filter(b => b.code.toLowerCase() === specificBook.toLowerCase());
    console.log(`📌 Filtered to specific book [${specificBook.toUpperCase()}]: ${targetBooks.length} books`);
  } else {
    console.log(`📚 Target Catalog: All ${targetBooks.length} core website books`);
  }

  // Calculate overall status
  let totalTargetChapters = 0;
  let alreadyUploaded = 0;
  const pendingChapters = [];

  for (const b of targetBooks) {
    const code = b.code.toLowerCase();
    for (const ch of b.chapters) {
      totalTargetChapters++;
      const filename = `${code}${ch.id}.pdf`;
      const r2Key = `ncert/${code}/${filename}`;
      if (liveR2Keys.has(r2Key)) {
        alreadyUploaded++;
      } else {
        pendingChapters.push({
          book: b,
          code,
          chapter: ch,
          filename,
          r2Key,
          cdnUrl: `${R2_PUBLIC_URL}/${r2Key}`,
        });
      }
    }
  }

  console.log(`\n📈 Target Chapters Status:`);
  console.log(`   Total Chapters:   ${totalTargetChapters}`);
  console.log(`   Already on R2:    ${alreadyUploaded} (${((alreadyUploaded / totalTargetChapters) * 100).toFixed(1)}%)`);
  console.log(`   Remaining to Sync:${pendingChapters.length}`);

  if (statusOnly || pendingChapters.length === 0) {
    return;
  }

  console.log(`\n================================================================`);
  console.log(`⚡ Syncing ${pendingChapters.length} Remaining Chapters with Concurrency = 4`);
  console.log(`================================================================\n`);

  let completedCount = 0;
  let successCount = 0;
  let failCount = 0;
  let totalBytes = 0;

  await runConcurrent(pendingChapters, 4, async (item) => {
    const { book, code, chapter, filename, r2Key, cdnUrl } = item;

    // 1. Obtain chapter buffer (Local disk first, then web)
    let buffer = null;
    let sourceTag = '';

    const localPath = findLocalChapterPath(book.classLevel, code, book.title, chapter.id);
    if (localPath && fs.existsSync(localPath)) {
      try {
        buffer = fs.readFileSync(localPath);
        sourceTag = '💾 Local';
      } catch (e) {
        buffer = null;
      }
    }

    if (!buffer) {
      try {
        buffer = await downloadBufferInMemory(`https://ncert.nic.in/textbook/pdf/${filename}`);
        sourceTag = '🌐 Web';
      } catch (e) {
        failCount++;
        completedCount++;
        console.log(`[${completedCount}/${pendingChapters.length}] ⏭️  [${code.toUpperCase()}] ${filename} skipped (${e.message})`);
        return;
      }
    }

    // 2. Upload to Cloudflare R2
    const szMB = (buffer.length / 1024 / 1024).toFixed(2);
    try {
      await uploadBufferToR2(r2Key, buffer);
      liveR2Keys.add(r2Key);
      successCount++;
      totalBytes += buffer.length;
      completedCount++;
      console.log(`[${completedCount}/${pendingChapters.length}] ✅ [${sourceTag}] ${r2Key} (${szMB} MB) -> LIVE!`);
    } catch (err) {
      failCount++;
      completedCount++;
      console.log(`[${completedCount}/${pendingChapters.length}] ❌ ${r2Key} failed: ${err.message}`);
    }
  });

  console.log(`\n================================================================`);
  console.log(`🎉 Cloud Upload Complete!`);
  console.log(`   Uploaded:        ${successCount} chapters (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   Skipped/404:     ${failCount} chapters`);
  console.log(`   Total Now in R2: ${liveR2Keys.size} chapters`);
  console.log(`================================================================\n`);
}

main().catch(console.error);
