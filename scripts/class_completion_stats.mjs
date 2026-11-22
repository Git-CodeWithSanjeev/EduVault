import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

const agent = new https.Agent({ minVersion: 'TLSv1.3', keepAlive: true });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({ httpsAgent: agent }),
});

async function run() {
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

  const websiteBooks = ncertBooks.filter(b => Array.isArray(b.chapters) && b.chapters.length > 0);

  const classStats = {};
  for (let cl = 1; cl <= 12; cl++) {
    classStats[cl] = { books: 0, totalChapters: 0, uploadedChapters: 0 };
  }

  for (const b of websiteBooks) {
    const cl = b.classLevel;
    const code = b.code.toLowerCase();
    classStats[cl].books++;
    for (const ch of b.chapters) {
      classStats[cl].totalChapters++;
      const key = `ncert/${code}/${code}${ch.id}.pdf`;
      if (keys.has(key)) {
        classStats[cl].uploadedChapters++;
      }
    }
  }

  console.log(JSON.stringify(classStats, null, 2));
}

run().catch(console.error);
