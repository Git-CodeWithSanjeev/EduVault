"""
EduVault GitHub NCERT Loader
Downloads official NCERT textbooks directly from nit-in/download_ncert_books GitHub Releases.
Extracts directly into: storage/by-class/Class {N}/{Subject}/{BookTitle}/
"""

import sys
import os
import io
import re
import json
import ssl
import time
import zipfile
import shutil
import urllib.request
from pathlib import Path

try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

ROOT_DIR = Path(__file__).resolve().parent.parent
STORAGE_ROOT = ROOT_DIR / 'storage'
STORAGE_BY_CLASS = STORAGE_ROOT / 'by-class'
STORAGE_BY_CLASS.mkdir(parents=True, exist_ok=True)

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

def sanitize_name(name):
    # Replace dots and special characters
    cleaned = name.replace('.', ' ').replace('_', ' ')
    cleaned = "".join(c if c not in r'\/:*?"<>|' else '-' for c in cleaned)
    return " ".join(cleaned.split()).strip()

def is_pdf_complete(file_path):
    p = Path(file_path)
    if not p.is_file():
        return False
    size = p.stat().st_size
    if size < 5000:
        return False
    try:
        with open(p, 'rb') as f:
            header = f.read(5)
            if header != b'%PDF-':
                return False
            f.seek(max(0, size - 4096))
            tail = f.read()
            return b'%%EOF' in tail
    except Exception:
        return False

def get_readable_chapter_name(filename):
    stem = Path(filename).stem.lower() # e.g. 'jhkr101', 'jhkr1ps', 'jhkr1an', '01'
    if stem.endswith('ps') or stem == 'ps':
        return "00 - Prelims & Index.pdf"
    if stem.endswith('an') or stem == 'an':
        return "99 - Answers & Solutions.pdf"
    
    # Check for trailing digits
    m = re.search(r'(\d+)$', stem)
    if m:
        num = int(m.group(1))
        return f"Chapter {num:02d}.pdf"
    return f"{stem}.pdf"

def update_manifest():
    manifest = {
        'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'storageLocation': str(STORAGE_BY_CLASS),
        'totalClasses': 0,
        'totalBooks': 0,
        'totalPdfs': 0,
        'totalBytes': 0,
        'classes': {}
    }

    total_pdfs = 0
    total_bytes = 0
    total_books = 0

    for c_dir in sorted(STORAGE_BY_CLASS.iterdir()):
        if not c_dir.is_dir(): continue
        c_name = c_dir.name
        manifest['classes'][c_name] = {'subjects': {}, 'pdfCount': 0, 'sizeBytes': 0}
        c_pdfs = 0
        c_bytes = 0

        for s_dir in sorted(c_dir.iterdir()):
            if not s_dir.is_dir(): continue
            s_name = s_dir.name
            manifest['classes'][c_name]['subjects'][s_name] = {'books': {}}

            for b_dir in sorted(s_dir.iterdir()):
                if not b_dir.is_dir(): continue
                b_name = b_dir.name
                files = [f for f in b_dir.glob('*.pdf') if is_pdf_complete(f)]
                if not files: continue

                total_books += 1
                b_bytes = sum(f.stat().st_size for f in files)
                c_pdfs += len(files)
                c_bytes += b_bytes

                manifest['classes'][c_name]['subjects'][s_name]['books'][b_name] = {
                    'chapterCount': len(files),
                    'sizeBytes': b_bytes,
                    'files': [{'filename': f.name, 'sizeBytes': f.stat().st_size} for f in files]
                }

        manifest['classes'][c_name]['pdfCount'] = c_pdfs
        manifest['classes'][c_name]['sizeBytes'] = c_bytes
        total_pdfs += c_pdfs
        total_bytes += c_bytes

    manifest['totalClasses'] = len(manifest['classes'])
    manifest['totalBooks'] = total_books
    manifest['totalPdfs'] = total_pdfs
    manifest['totalBytes'] = total_bytes

    manifest_path = STORAGE_ROOT / 'ncert_manifest.json'
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    return manifest

def fetch_releases():
    url = 'https://api.github.com/repos/nit-in/download_ncert_books/releases?per_page=100'
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, context=SSL_CTX) as resp:
        return json.load(resp)

KNOWN_SUBJECTS = [
    'Social Science',
    'Health and Physical Education',
    'Computer Science',
    'Informatics Practices',
    'Business Studies',
    'Political Science',
    'Environmental Studies',
    'Physical Education',
    'Fine Arts',
    'Heritage Crafts',
    'Home Science',
    'Human Ecology',
    'Vocational Education',
    'Accountancy',
    'Biology',
    'Chemistry',
    'Economics',
    'English',
    'Geography',
    'Hindi',
    'History',
    'Mathematics',
    'Physics',
    'Psychology',
    'Sanskrit',
    'Science',
    'Sociology',
    'Urdu'
]

def parse_class_subject_title(name, default_class):
    # Strip .zip
    base = Path(name).stem
    # Match NCERT_CLASS_{num}_ or CLASS_{num}_
    cl = default_class
    m = re.match(r'^(?:NCERT_)?CLASS_?(\d+)_?(.*)$', base, re.IGNORECASE)
    if m:
        cl = int(m.group(1))
        remainder = m.group(2).replace('_', ' ').strip()
    else:
        remainder = base.replace('_', ' ').strip()

    matched_subj = None
    book_title = remainder
    for subj in KNOWN_SUBJECTS:
        if remainder.lower().startswith(subj.lower()):
            matched_subj = subj
            book_title = remainder[len(subj):].strip()
            # If title starts with hyphen or separator
            book_title = book_title.lstrip('- :_')
            break

    if not matched_subj:
        parts = remainder.split(' ', 1)
        if len(parts) == 2:
            matched_subj = parts[0]
            book_title = parts[1]
        else:
            matched_subj = "General"
            book_title = remainder

    return cl, sanitize_name(matched_subj), sanitize_name(book_title)

def process_asset(class_num, asset):
    name = asset['name'] # e.g. NCERT_CLASS_10_English_First_Flight.zip
    size_bytes = asset['size']
    download_url = asset['browser_download_url']

    if not name.endswith('.zip'):
        return 0, "Not a zip"
    if 'Books_Text' in name or size_bytes < 50000:
        return 0, "Skipped (text/empty)"

    cl, subject, book_title = parse_class_subject_title(name, class_num)

    target_dir = STORAGE_BY_CLASS / f"Class {cl}" / subject / book_title
    target_dir.mkdir(parents=True, exist_ok=True)

    # Check if target already has complete chapters
    existing_pdfs = [p for p in target_dir.glob('*.pdf') if is_pdf_complete(p)]
    if len(existing_pdfs) >= 4:
        return len(existing_pdfs), f"⚡ Already complete ({len(existing_pdfs)} chapters cached)"

    print(f"\n📥 [{cl} | {subject}] Downloading {book_title} ({size_bytes/1024/1024:.2f} MB)...")
    t0 = time.time()

    # Stream download zip
    req = urllib.request.Request(download_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=60) as resp:
            data = resp.read()
    except Exception as e:
        return 0, f"Download failed: {e}"

    dl_time = time.time() - t0
    speed_mb = (len(data) / 1024 / 1024) / max(0.1, dl_time)
    print(f"   ⚡ Downloaded {len(data)/1024/1024:.2f} MB in {dl_time:.2f}s ({speed_mb:.1f} MB/s)")

    # Unpack PDFs
    extracted_count = 0
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            for member in zf.infolist():
                if member.is_dir() or not member.filename.lower().endswith('.pdf'):
                    continue
                pdf_data = zf.read(member.filename)
                if len(pdf_data) < 5000 or not pdf_data.startswith(b'%PDF-'):
                    continue

                r_name = get_readable_chapter_name(Path(member.filename).name)
                dest_path = target_dir / r_name
                dest_path.write_bytes(pdf_data)
                if is_pdf_complete(dest_path):
                    extracted_count += 1
                    # print(f"      ✅ {r_name} ({len(pdf_data)/1024/1024:.2f} MB)")
    except Exception as e:
        return 0, f"Unpack error: {e}"

    print(f"   ✅ Unpacked {extracted_count} chapters into Class {cl}/{subject}/{book_title}")
    return extracted_count, "Success"

def download_class_assets(releases, class_num):
    print(f"\n=======================================================")
    print(f"🚀 Processing Class {class_num} from GitHub Releases")
    print(f"=======================================================")

    release_by_tag = {r['tag_name']: r for r in releases}
    tag25 = f"class_{class_num}_2025-26"
    tag23 = f"class_{class_num}_2023-24"
    tag_old = f"class_{class_num}"

    assets = []
    seen_names = set()

    for tag in [tag25, tag23, tag_old]:
        rel = release_by_tag.get(tag)
        if not rel: continue
        for a in rel.get('assets', []):
            aname = a['name']
            if aname.endswith('.zip') and 'Books_Text' not in aname and a['size'] > 50000:
                # Deduplicate by book base name
                if aname not in seen_names:
                    seen_names.add(aname)
                    assets.append(a)

    print(f"Found {len(assets)} viable textbook archives for Class {class_num}")

    total_extracted = 0
    for i, asset in enumerate(assets, 1):
        print(f"\n--- [{i}/{len(assets)}] {asset['name']} ---")
        cnt, msg = process_asset(class_num, asset)
        print(f"   Result: {msg}")
        if cnt > 0 and msg == "Success":
            total_extracted += cnt
            m = update_manifest()
            print(f"   📊 Current Total: {m['totalPdfs']} PDFs in {m['totalBooks']} books ({m['totalBytes']/1024/1024:.1f} MB)")

    print(f"\n🎉 Finished Class {class_num}! Extracted {total_extracted} new chapters.")
    return total_extracted

def main():
    args = sys.argv[1:]
    print("Fetching GitHub release catalog from nit-in/download_ncert_books...")
    releases = fetch_releases()
    print(f"Loaded {len(releases)} release tags.")

    if '--class' in args:
        idx = args.index('--class')
        cl = int(args[idx + 1])
        download_class_assets(releases, cl)
    elif '--classes' in args:
        idx = args.index('--classes')
        classes = [int(x.strip()) for x in args[idx + 1].split(',')]
        for cl in classes:
            download_class_assets(releases, cl)
    else:
        # Priority order: Remaining middle & primary classes first, then secondary
        priority = [8, 7, 6, 5, 4, 3, 2, 1, 9, 10, 11, 12]
        for cl in priority:
            download_class_assets(releases, cl)

    m = update_manifest()
    print(f"\n=======================================================")
    print(f"🏆 ALL DOWNLOADS COMPLETE!")
    print(f"Grand Total: {m['totalClasses']} Classes | {m['totalBooks']} Books | {m['totalPdfs']} Verified PDFs ({m['totalBytes']/1024/1024:.2f} MB)")
    print(f"=======================================================")

if __name__ == '__main__':
    main()
