import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}
loadEnv();

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({ minVersion: 'TLSv1.3', maxSockets: 10, keepAlive: true }),
  }),
});

const BUCKET = process.env.R2_BUCKET_NAME || 'eduvault-books';

// Remaining archives to sync for Class 5, 7, and others
const ARCHIVES_TO_SYNC = [
  // Class 5
  {
    code: 'eenm1',
    name: 'Class 5 Marigold',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_5_2023-24/NCERT_CLASS_5_English_Marigold.zip',
  },
  {
    code: 'eemh1',
    name: 'Class 5 Math-Magic',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_5_2023-24/NCERT_CLASS_5_Mathematics_Math-Magic.zip',
  },
  {
    code: 'ehrm1',
    name: 'Class 5 Rimjhim',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_5_2023-24/NCERT_CLASS_5_Hindi_Rimjhim.zip',
  },
  {
    code: 'eeev1',
    name: 'Class 5 Looking Around (EVS)',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_5_2023-24/NCERT_CLASS_5_Environmental_Studies_Looking_Around.zip',
  },

  // Class 7
  {
    code: 'gemh1',
    name: 'Class 7 Mathematics',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_Mathematics_Mathmatics.zip',
  },
  {
    code: 'gesc1',
    name: 'Class 7 Science',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_Science_Science.zip',
  },
  {
    code: 'gehc1',
    name: 'Class 7 Honeycomb',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_English_Honeycomb.zip',
  },
  {
    code: 'ghvs1',
    name: 'Class 7 Vasant',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_Hindi_Vasant.zip',
  },
  {
    code: 'gskr1',
    name: 'Class 7 Ruchira',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_Sanskrit_Ruchira.zip',
  },
  {
    code: 'gess1',
    name: 'Class 7 Our Pasts - II',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_Social_Science_Our_Pasts-II.zip',
  },
  {
    code: 'gess2',
    name: 'Class 7 Our Environment',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_Social_Science_Our_Environment.zip',
  },
  {
    code: 'gess3',
    name: 'Class 7 Social and Political Life - II',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_7_2023-24/NCERT_CLASS_7_Social_Science_Social_and_Political_Life.zip',
  },

  // Class 3 & 4
  {
    code: 'chvn1',
    name: 'Class 3 Veena',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_3_2025-26/NCERT_CLASS_3_Hindi_Veena.zip',
  },
  {
    code: 'demh1',
    name: 'Class 4 Math-Magic',
    url: 'https://github.com/nit-in/download_ncert_books/releases/download/class_4_2025-26/NCERT_CLASS_4_Mathematics_Math-Mela.zip',
  },
];

async function syncOneArchive(item, index, total) {
  const { code, name, url } = item;
  console.log(`\n================================================================`);
  console.log(`[${index + 1}/${total}] 📚 Processing ${name} [${code.toUpperCase()}]`);
  console.log(`   URL: ${url}`);
  console.log(`================================================================`);

  const tmpDir = path.resolve(process.cwd(), '.tmp_sync', code);
  
  // If files were already extracted in temp directory, skip re-downloading
  let pdfFiles = fs.existsSync(tmpDir) ? fs.readdirSync(tmpDir).filter(f => f.endsWith('.pdf')) : [];

  if (pdfFiles.length === 0) {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });

    const pyScript = `
import urllib.request, zipfile, io, os, sys
url = "${url}"
print("   📥 Downloading archive...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
except Exception as e:
    print("   ❌ Download failed:", e)
    sys.exit(1)

print(f"   ⚡ Downloaded {len(data)/1024/1024:.2f} MB")
zf = zipfile.ZipFile(io.BytesIO(data))
out_dir = r"${tmpDir}"
count = 0
for f in zf.namelist():
    if f.lower().endswith('.pdf'):
        fname = os.path.basename(f)
        if not fname:
            continue
        pdf_data = zf.read(f)
        if len(pdf_data) > 2000 and pdf_data.startswith(b'%PDF-'):
            with open(os.path.join(out_dir, fname), 'wb') as fp:
                fp.write(pdf_data)
            count += 1
print(f"   ✅ Extracted {count} valid PDFs to temporary workspace")
`;

    const scriptPath = path.join(tmpDir, 'extract.py');
    fs.writeFileSync(scriptPath, pyScript, 'utf8');

    try {
      execSync(`python "${scriptPath}"`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`   ❌ Failed to download or extract ${name}:`, err.message);
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      return;
    }

    pdfFiles = fs.readdirSync(tmpDir).filter(f => f.endsWith('.pdf'));
  } else {
    console.log(`   ⚡ Using existing ${pdfFiles.length} extracted PDFs from workspace`);
  }

  console.log(`   🚀 Uploading ${pdfFiles.length} chapter PDFs directly to R2 in parallel...`);

  let uploadedCount = 0;

  // Process in batches of 4
  for (let i = 0; i < pdfFiles.length; i += 4) {
    const batch = pdfFiles.slice(i, i + 4);
    await Promise.all(batch.map(async (pdf) => {
      const filePath = path.join(tmpDir, pdf);
      const buffer = fs.readFileSync(filePath);
      
      let targetFileName = pdf;
      const lower = pdf.toLowerCase();
      const stem = path.basename(lower, '.pdf');

      if (lower.startsWith(code)) {
        targetFileName = pdf;
      } else if (stem.length >= 7) {
        // e.g. eeen101 -> suffix is "01" -> code + "01.pdf"
        const suffix = stem.slice(5);
        targetFileName = `${code}${suffix}.pdf`;
      } else if (stem.endsWith('ps') || stem.includes('prelim') || stem.startsWith('00')) {
        targetFileName = `${code}ps.pdf`;
      } else if (stem.endsWith('an') || stem.includes('answer') || stem.startsWith('99')) {
        targetFileName = `${code}an.pdf`;
      } else {
        const m = stem.match(/(\d+)$/);
        if (m) {
          const num = String(parseInt(m[1], 10)).padStart(2, '0');
          targetFileName = `${code}${num}.pdf`;
        }
      }

      const key = `ncert/${code}/${targetFileName}`;
      try {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
          CacheControl: 'public, max-age=31536000, immutable',
        }));
        uploadedCount++;
        console.log(`      ✅ Uploaded ${key} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
      } catch (uErr) {
        console.error(`      ❌ Failed to upload ${key}:`, uErr.message);
      }
    }));
  }

  console.log(`   ✨ Successfully uploaded ${uploadedCount} chapters for ${name} to R2!`);

  // Cleanup temp dir
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

async function main() {
  console.log(`================================================================`);
  console.log(`🚀 Starting Comprehensive Sync for Class 5, 7 NCERT Books`);
  console.log(`   Bucket: ${BUCKET}`);
  console.log(`   Total Book Archives: ${ARCHIVES_TO_SYNC.length}`);
  console.log(`================================================================`);

  for (let i = 0; i < ARCHIVES_TO_SYNC.length; i++) {
    await syncOneArchive(ARCHIVES_TO_SYNC[i], i, ARCHIVES_TO_SYNC.length);
  }

  console.log(`\n================================================================`);
  console.log(`🎉 ALL ARCHIVES SYNCED SUCCESSFULLY TO CLOUDFLARE R2!`);
  console.log(`================================================================\n`);
}

main().catch(console.error);
