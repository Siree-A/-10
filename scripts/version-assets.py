"""Refresh local CSS/JS content versions before publishing static HTML."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[1]
pattern = re.compile(r'((?:href|src)=")(assets/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?(")')

def version(match):
    asset = root / match[2]
    digest = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
    return f'{match[1]}{match[2]}?v={digest}{match[3]}'

for page in root.glob("*.html"):
    original = page.read_text(encoding="utf-8")
    updated = pattern.sub(version, original)
    if updated != original:
        page.write_text(updated, encoding="utf-8")
        print(f"Versioned assets: {page.name}")
