/**
 * Categorize all books class-wise in Cloudflare R2
 * Creates server-side mirrors under:
 *   `by-class/Class {N}/{Subject}/{BookTitle}/{readableChapter}`
 * and publishes `by-class/manifest.json` on the Edge CDN.
 */

import { S3Client, CopyObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { ncertBooks } from '../src/data/ncertBooksData.js';

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

const agent = new https.Agent({ minVersion: 'TLSv1.3', keepAlive: true, maxSockets: 25 });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({ httpsAgent: agent }),
});

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

function cleanTitle(title) {
  return title.split('—')[0].trim().replace(/[\/\\:*?"<>|]/g, '-');
}

function getReadableName(chId, chName) {
  if (chId === 'ps') return '00 - Prelims & Index.pdf';
  if (chId === 'an') return '99 - Answers & Solutions.pdf';
  const num = parseInt(chId, 10);
  if (!isNaN(num)) {
    const cleanChapterName = chName ? chName.replace(/^\d+[\.\s\-]*/, '').trim() : '';
    const safeTitle = cleanChapterName ? ` - ${cleanChapterName.replace(/[\/\\:*?"<>|]/g, '-')}` : '';
    return `Chapter ${String(num).padStart(2, '0')}${safeTitle}.pdf`;
  }
  return `${chId}.pdf`;
}

// Concurrency helper
async function runConcurrent(items, limit, fn) {
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(Array.from(executing));
}

async function main() {
  console.log(`================================================================`);
  console.log(`🗂️  Categorizing Cloudflare R2 Library Class-Wise`);
  console.log(`   Destination Bucket: ${BUCKET_NAME}`);
  console.log(`   Target Hierarchy:   by-class/Class {N}/{Subject}/{BookTitle}/`);
  console.log(`================================================================\n`);

  console.log(`🔍 Fetching existing R2 keys...`);
  const liveKeys = await fetchAllR2Keys();
  console.log(`📊 Total objects in bucket: ${liveKeys.size}`);

  const websiteBooks = ncertBooks.filter(b => Array.isArray(b.chapters) && b.chapters.length > 0);

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: BUCKET_NAME,
    cdnBase: R2_PUBLIC_URL,
    totalClasses: 12,
    classes: {},
  };

  const copyOperations = [];

  for (const book of websiteBooks) {
    const cl = book.classLevel;
    const clKey = `Class ${cl}`;
    const code = book.code.toLowerCase();
    const subj = book.subject || 'General';
    const bTitle = cleanTitle(book.title);

    if (!manifest.classes[clKey]) {
      manifest.classes[clKey] = {
        classLevel: cl,
        subjects: {},
      };
    }
    if (!manifest.classes[clKey].subjects[subj]) {
      manifest.classes[clKey].subjects[subj] = {
        books: {},
      };
    }

    const bookEntry = {
      code,
      title: book.title,
      chapters: [],
    };

    for (const ch of book.chapters) {
      const srcFilename = `${code}${ch.id}.pdf`;
      const srcKey = `ncert/${code}/${srcFilename}`;

      if (liveKeys.has(srcKey)) {
        const destFilename = getReadableName(ch.id, ch.name);
        const destKey = `by-class/${clKey}/${subj}/${bTitle}/${destFilename}`;
        const cdnUrl = `${R2_PUBLIC_URL}/${destKey}`;

        bookEntry.chapters.push({
          id: ch.id,
          name: ch.name,
          srcKey,
          destKey,
          cdnUrl,
        });

        if (!liveKeys.has(destKey)) {
          copyOperations.push({
            srcKey,
            destKey,
            clKey,
            bTitle,
            destFilename,
          });
        }
      }
    }

    manifest.classes[clKey].subjects[subj].books[bTitle] = bookEntry;
  }

  console.log(`\n📋 Class-wise Plan:`);
  console.log(`   Total Chapters to Categorize: ${copyOperations.length} new class-wise keys`);
  console.log(`   Already Categorized:          ${liveKeys.size - copyOperations.length} keys`);

  if (copyOperations.length > 0) {
    console.log(`\n⚡ Copying server-side in Cloudflare R2 (Concurrency = 15)...`);
    let done = 0;
    await runConcurrent(copyOperations, 15, async (op) => {
      try {
        await s3.send(new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `${BUCKET_NAME}/${op.srcKey}`,
          Key: op.destKey,
          MetadataDirective: 'COPY',
        }));
        done++;
        if (done % 50 === 0 || done === copyOperations.length) {
          console.log(`  [${done}/${copyOperations.length}] Categorized -> ${op.destKey}`);
        }
      } catch (err) {
        console.error(`  ❌ Failed to copy ${op.srcKey} -> ${op.destKey}:`, err.message);
      }
    });
  }

  // Upload Manifest to R2
  console.log(`\n📄 Publishing class-wise manifest to Cloudflare R2...`);
  const manifestJson = JSON.stringify(manifest, null, 2);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: 'by-class/manifest.json',
    Body: Buffer.from(manifestJson),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=3600',
  }));
  console.log(`✅ Live Manifest: ${R2_PUBLIC_URL}/by-class/manifest.json`);

  console.log(`\n🎉 Class-wise cloud categorization complete!`);
}

main().catch(console.error);
