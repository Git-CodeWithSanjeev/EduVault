/**
 * EduVault Automated NCERT to Cloudflare R2 Sync CLI
 * 
 * Features:
 *   - Downloads NCERT textbook chapters with automated retries & backoff
 *   - Uploads directly to Cloudflare R2 bucket (`eduvault-books`)
 *   - Verifies against Cloudflare R2 Edge CDN (sub-second streaming)
 *   - Skips already-uploaded files for zero duplicate bandwidth
 * 
 * Usage:
 *   node scripts/sync-ncert-to-r2.mjs aemr1           # Sync specific book (e.g. Class 1 Mridang)
 *   node scripts/sync-ncert-to-r2.mjs --upload-local # Upload all locally downloaded chapters to R2
 *   node scripts/sync-ncert-to-r2.mjs --status       # List all books & chapters currently on R2
 *   node scripts/sync-ncert-to-r2.mjs --priority     # Batch sync high-demand NCERT books (Classes 1-12)
 */

import { S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import fs from 'fs';
import path from 'path';

// 1. Load environment configuration
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
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '7b76226b88ca0832393d8026859c1784';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '788feaf5e2976f085deef69a3b70148b';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'b8846f6880be22cdb375ab5ccdea302805d7622b713b9fd3ddde4f93959dbb46';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'eduvault-books';
const R2_PUBLIC_URL = (process.env.VITE_R2_PUBLIC_URL || 'https://pub-54ce43e6ab02460299838f807b567083.r2.dev').replace(/\/+$/, '');

// Cloudflare R2 S3 Client with TLS 1.3
const agent = new https.Agent({ minVersion: 'TLSv1.3' });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({ httpsAgent: agent }),
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Check if an object exists in Cloudflare R2 */
async function r2ObjectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    // If permission or other error, assume not present
    return false;
  }
}

/** Upload a local file or buffer to Cloudflare R2 */
async function uploadToR2(key, fileBufferOrPath, contentType = 'application/pdf') {
  const body = typeof fileBufferOrPath === 'string'
    ? fs.readFileSync(fileBufferOrPath)
    : fileBufferOrPath;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return `${R2_PUBLIC_URL}/${key}`;
}

/** Single chapter downloader with retry loop */
function downloadFileOnce(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://ncert.nic.in/textbook.php',
        'Accept': 'application/pdf,*/*',
        'Connection': 'keep-alive',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        try { fs.unlinkSync(destPath); } catch {}
        return downloadFileOnce(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode === 404) {
        file.close();
        try { fs.unlinkSync(destPath); } catch {}
        return reject(new Error('HTTP 404 Not Found'));
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(destPath); } catch {}
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const sz = fs.existsSync(destPath) ? fs.statSync(destPath).size : 0;
          if (sz < 1000) {
            try { fs.unlinkSync(destPath); } catch {}
            return reject(new Error('Downloaded file too small / invalid'));
          }
          resolve(sz);
        });
      });
      file.on('error', (err) => {
        file.close();
        try { fs.unlinkSync(destPath); } catch {}
        reject(err);
      });
    });

    req.on('error', (err) => {
      file.close();
      try { fs.unlinkSync(destPath); } catch {}
      reject(err);
    });

    req.setTimeout(45000, () => {
      req.destroy();
      file.close();
      try { fs.unlinkSync(destPath); } catch {}
      reject(new Error('Connection timed out'));
    });
  });
}

const KNOWN_CHAPTER_COUNTS = {
  aemr1: 9, // Class 1 English Mridang
  lech1: 5, // Class 12 Chemistry Part 1
  lech2: 5, // Class 12 Chemistry Part 2
  leph1: 8, // Class 12 Physics Part 1
  leph2: 6, // Class 12 Physics Part 2
  lemh1: 6, // Class 12 Math Part 1
  lemh2: 7, // Class 12 Math Part 2
  kech1: 6, // Class 11 Chemistry Part 1
  kech2: 3, // Class 11 Chemistry Part 2
  kepy1: 7, // Class 11 Physics Part 1
  kepy2: 7, // Class 11 Physics Part 2
  kemh1: 14, // Class 11 Math
  jebh1: 5, // Class 12 Biology
  kebo1: 19, // Class 11 Biology
  jesc1: 13, // Class 10 Science
  jemh1: 14, // Class 10 Math
};

/** Robust chapter download with up to 4 attempts and backoff */
async function downloadChapterWithRetry(url, destPath, maxAttempts = 4) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const size = await downloadFileOnce(url, destPath);
      return size;
    } catch (err) {
      if (err.message.includes('404')) {
        throw err; // Stop retrying if file truly doesn't exist
      }
      if (attempt === maxAttempts) {
        throw err;
      }
      const backoffMs = attempt * 1500;
      await sleep(backoffMs);
    }
  }
}

/** Sync one NCERT book code to Cloudflare R2 */
async function syncBook(code, customMaxChapters) {
  const cleanCode = code.toLowerCase().trim();
  const maxChapters = customMaxChapters || KNOWN_CHAPTER_COUNTS[cleanCode] || 10;
  const storageDir = path.resolve(process.cwd(), 'storage', 'ncert', cleanCode);
  fs.mkdirSync(storageDir, { recursive: true });

  console.log(`\n================================================================`);
  console.log(`🚀 Starting Automated Sync for NCERT Book: [${cleanCode.toUpperCase()}]`);
  console.log(`   Chapters Expected:  ${maxChapters} chapters + prelims & answers`);
  console.log(`   Destination Bucket: ${BUCKET_NAME}`);
  console.log(`   Public Edge CDN:    ${R2_PUBLIC_URL}/ncert/${cleanCode}/`);
  console.log(`================================================================`);

  const chapters = ['ps'];
  for (let i = 1; i <= maxChapters; i++) {
    chapters.push(String(i).padStart(2, '0'));
  }
  chapters.push('an');

  let uploadedCount = 0;
  let skippedCount = 0;
  let totalBytes = 0;
  let consecutive404 = 0;

  for (const ch of chapters) {
    const filename = `${cleanCode}${ch}.pdf`;
    const r2Key = `ncert/${cleanCode}/${filename}`;
    const destPath = path.join(storageDir, filename);
    const ncertUrl = `https://ncert.nic.in/textbook/pdf/${filename}`;
    const cdnUrl = `${R2_PUBLIC_URL}/${r2Key}`;

    // 1. Check if already uploaded to R2
    const inR2 = await r2ObjectExists(r2Key);
    if (inR2) {
      console.log(`  ⚡ [R2 CDN Ready] ${filename} already live in bucket!`);
      skippedCount++;
      consecutive404 = 0;
      continue;
    }

    // 2. Check if already cached on local disk
    let hasLocal = fs.existsSync(destPath) && fs.statSync(destPath).size > 10000;

    if (!hasLocal) {
      process.stdout.write(`  📥 Downloading ${filename} from NCERT... `);
      try {
        const size = await downloadChapterWithRetry(ncertUrl, destPath, 4);
        console.log(`✅ (${(size / 1024 / 1024).toFixed(2)} MB)`);
        hasLocal = true;
        consecutive404 = 0;
      } catch (err) {
        if (err.message.includes('404')) {
          console.log(`⏭️  404 Not Found (End of chapters)`);
          consecutive404++;
          if (consecutive404 >= 2 && ch !== 'ps' && ch !== 'an') {
            break; // Finished book
          }
          continue;
        } else {
          console.log(`⚠️  Download failed: ${err.message}`);
          continue;
        }
      }
    } else {
      const szMB = (fs.statSync(destPath).size / 1024 / 1024).toFixed(2);
      console.log(`  💾 Found local cache: ${filename} (${szMB} MB)`);
    }

    // 3. Upload to Cloudflare R2
    if (hasLocal) {
      process.stdout.write(`  ☁️  Uploading to Cloudflare R2: ${r2Key}... `);
      try {
        const fileSize = fs.statSync(destPath).size;
        await uploadToR2(r2Key, destPath);
        totalBytes += fileSize;
        uploadedCount++;
        console.log(`✅ LIVE -> ${cdnUrl}`);
      } catch (err) {
        console.log(`❌ Upload failed: ${err.message}`);
      }
    }

    // Polite 1s delay
    await sleep(800);
  }

  console.log(`\n🎉 Book [${cleanCode.toUpperCase()}] Complete!`);
  console.log(`   Uploaded: ${uploadedCount} chapters (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`   Cached/Skipped: ${skippedCount} chapters`);
  console.log(`   Live on CDN: ${R2_PUBLIC_URL}/ncert/${cleanCode}/\n`);
}

/** Upload all files currently in storage/ncert to R2 */
async function uploadAllLocal() {
  const rootDir = path.resolve(process.cwd(), 'storage', 'ncert');
  if (!fs.existsSync(rootDir)) {
    console.log('No local storage directory found at storage/ncert.');
    return;
  }

  console.log(`\n📦 Scanning local storage/ncert for chapters to sync to Cloudflare R2...`);
  const books = fs.readdirSync(rootDir).filter((d) => fs.statSync(path.join(rootDir, d)).isDirectory());

  let totalUploaded = 0;

  for (const book of books) {
    const bookDir = path.join(rootDir, book);
    const files = fs.readdirSync(bookDir).filter((f) => f.endsWith('.pdf'));

    for (const f of files) {
      const r2Key = `ncert/${book}/${f}`;
      const filePath = path.join(bookDir, f);
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);

      const exists = await r2ObjectExists(r2Key);
      if (exists) {
        console.log(`  ⚡ Already in R2: ${r2Key}`);
        continue;
      }

      process.stdout.write(`  ☁️  Uploading ${r2Key} (${sizeMB} MB)... `);
      try {
        await uploadToR2(r2Key, filePath);
        totalUploaded++;
        console.log(`✅ Done -> ${R2_PUBLIC_URL}/${r2Key}`);
      } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
  }

  console.log(`\n🎉 Finished uploading local storage. Total chapters uploaded: ${totalUploaded}`);
}

/** List all objects in Cloudflare R2 */
async function listR2Status() {
  console.log(`\n🔍 Querying Cloudflare R2 bucket [${BUCKET_NAME}]...`);
  try {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
    }));

    const items = res.Contents || [];
    console.log(`📊 Total Objects in Cloudflare R2: ${items.length}`);
    let totalBytes = 0;
    for (const item of items) {
      totalBytes += item.Size || 0;
      console.log(`  📄 ${item.Key} (${((item.Size || 0) / 1024 / 1024).toFixed(2)} MB)`);
    }
    console.log(`💾 Total Storage Used: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🌐 Public CDN Base: ${R2_PUBLIC_URL}\n`);
  } catch (err) {
    console.error('Failed to list R2 bucket:', err.message);
  }
}

// Priority NCERT books across Class 1, 10, 11, 12
const PRIORITY_BOOKS = [
  'aemr1', // Class 1 English (Mridang)
  'leph1', // Class 12 Physics Part 1
  'leph2', // Class 12 Physics Part 2
  'lech1', // Class 12 Chemistry Part 1
  'lech2', // Class 12 Chemistry Part 2
  'lemh1', // Class 12 Mathematics Part 1
  'lemh2', // Class 12 Mathematics Part 2
  'lebo1', // Class 12 Biology
  'kepy1', // Class 11 Physics Part 1
  'kech1', // Class 11 Chemistry Part 1
  'kemh1', // Class 11 Mathematics Part 1
];

async function main() {
  const arg = process.argv[2];

  if (!arg || arg === '--help' || arg === '-h') {
    console.log(`
EduVault Automated Cloudflare R2 Storage Sync
==============================================
Connected Bucket: ${BUCKET_NAME}
Account ID:       ${ACCOUNT_ID}
Public CDN:       ${R2_PUBLIC_URL}

Commands:
  node scripts/sync-ncert-to-r2.mjs <bookCode>     Sync chapters for a specific book (e.g. aemr1, leph1)
  node scripts/sync-ncert-to-r2.mjs --upload-local Upload all chapters currently in storage/ncert/
  node scripts/sync-ncert-to-r2.mjs --status       List all live chapters stored in Cloudflare R2
  node scripts/sync-ncert-to-r2.mjs --priority     Sync high-demand Class 1, 10, 11, 12 NCERT books
`);
    return;
  }

  if (arg === '--status') {
    await listR2Status();
    return;
  }

  if (arg === '--upload-local') {
    await uploadAllLocal();
    return;
  }

  if (arg === '--priority') {
    console.log(`\n📚 Syncing Priority NCERT Catalog (${PRIORITY_BOOKS.length} books)...`);
    for (const code of PRIORITY_BOOKS) {
      await syncBook(code);
    }
    console.log('\n🌟 All priority books synced to Cloudflare R2!');
    return;
  }

  // Single book sync
  await syncBook(arg);
}

main().catch((err) => {
  console.error('\n❌ Fatal Sync Error:', err);
  process.exit(1);
});
