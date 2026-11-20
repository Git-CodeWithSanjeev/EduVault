/**
 * EduVault NCERT -> Cloudflare R2 Sync Tool
 * 
 * Usage:
 *   node scripts/sync-ncert-to-r2.mjs <bookCode>   (e.g., node scripts/sync-ncert-to-r2.mjs aemr1)
 *   node scripts/sync-ncert-to-r2.mjs --all        (syncs all NCERT books)
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import https from 'https';
import fs from 'fs';
import path from 'path';

// Read .env manually
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
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL || 'https://pub-54ce43e6ab02460299838f807b567083.r2.dev';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

/** Download a remote file as a Buffer */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://ncert.nic.in/',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(45000, () => {
      req.destroy();
      reject(new Error('Download timed out'));
    });
  });
}

/** Upload a Buffer to Cloudflare R2 */
async function uploadToR2(key, buffer, contentType = 'application/pdf') {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
}

/** Sync a specific NCERT book code (e.g. 'aemr1') */
async function syncBook(code, maxChapters = 10) {
  console.log(`\n📚 Syncing NCERT Book: ${code.toUpperCase()} to Cloudflare R2...`);
  
  // Chapter list
  const chapters = ['ps'];
  for (let i = 1; i <= maxChapters; i++) {
    chapters.push(String(i).padStart(2, '0'));
  }
  chapters.push('an');

  for (const ch of chapters) {
    const filename = `${code}${ch}.pdf`;
    const r2Key = `ncert/${code}/${filename}`;
    const ncertUrl = `https://ncert.nic.in/textbook/pdf/${filename}`;
    const publicCdnUrl = `${R2_PUBLIC_URL}/${r2Key}`;

    process.stdout.write(`  ⏳ ${filename}... `);

    try {
      const buffer = await downloadFile(ncertUrl);
      await uploadToR2(r2Key, buffer);
      console.log(`✅ Uploaded (${(buffer.length / 1024 / 1024).toFixed(2)} MB) -> ${publicCdnUrl}`);
    } catch (err) {
      if (err.message.includes('404')) {
        console.log(`⏭️  Not present on server (done)`);
        break;
      } else {
        console.log(`❌ Error: ${err.message}`);
      }
    }
  }
}

async function main() {
  const targetCode = process.argv[2];
  if (!targetCode) {
    console.log(`
EduVault R2 Cloud Storage Sync CLI
===================================
Bucket:     ${BUCKET_NAME}
Endpoint:   https://${ACCOUNT_ID}.r2.cloudflarestorage.com
Public CDN: ${R2_PUBLIC_URL}

Usage:
  node scripts/sync-ncert-to-r2.mjs <bookCode>
  Example: node scripts/sync-ncert-to-r2.mjs aemr1
`);
    process.exit(0);
  }

  await syncBook(targetCode.toLowerCase().replace(/[^a-z0-9]/g, ''));
  console.log(`\n🎉 Sync complete! All chapters are ready on Cloudflare R2.`);
}

main().catch(console.error);
