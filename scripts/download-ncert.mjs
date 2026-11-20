import https from 'https';
import fs from 'fs';
import path from 'path';

function downloadChapter(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const req = https.get(url, {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://ncert.nic.in/',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadChapter(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
      file.on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    req.on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      file.close();
      fs.unlink(destPath, () => {});
      reject(new Error('Download timed out'));
    });
  });
}

async function downloadBook(code, maxChapters = 10) {
  const outDir = path.resolve(process.cwd(), 'storage', 'ncert', code);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n📥 Downloading NCERT Book [${code.toUpperCase()}] to: ${outDir}`);

  const chapters = ['ps'];
  for (let i = 1; i <= maxChapters; i++) {
    chapters.push(String(i).padStart(2, '0'));
  }
  chapters.push('an');

  for (const ch of chapters) {
    const filename = `${code}${ch}.pdf`;
    const destPath = path.join(outDir, filename);
    const url = `https://ncert.nic.in/textbook/pdf/${filename}`;

    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
      console.log(`  ✅ ${filename} already exists (${(fs.statSync(destPath).size / 1024 / 1024).toFixed(2)} MB)`);
      continue;
    }

    process.stdout.write(`  ⏳ Downloading ${filename}... `);
    try {
      await downloadChapter(url, destPath);
      const sizeMB = (fs.statSync(destPath).size / 1024 / 1024).toFixed(2);
      console.log(`✅ Done (${sizeMB} MB)`);
    } catch (err) {
      if (err.message.includes('404')) {
        console.log(`⏭️  Chapter ${ch} not present on NCERT (end of book)`);
        break;
      } else {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
  }

  console.log(`\n🎉 Book [${code.toUpperCase()}] downloaded successfully to storage/ncert/${code}/`);
}

const target = (process.argv[2] || 'aemr1').toLowerCase().trim();
downloadBook(target).catch(console.error);
