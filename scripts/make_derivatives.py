"""Build the public WebP derivatives of Fakhri's character frames.

The original PNG frames stay untouched in their source folder (outside this
repository). This script only reads them and writes resized WebP copies with
lossless alpha into public/character/, plus a JSON manifest in docs/
(the manifest is documentation and is not shipped with the site).

Usage (run from the repository root):
    python scripts/make_derivatives.py --src <folder containing frame-*.png>

Requires Pillow with WebP support (pip install pillow).
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

WIDTHS = (1122, 840, 560)
QUALITY = 93  # colour quality; alpha is always stored losslessly
FRAMES = (
    "frame-01-intro-open",
    "frame-02-intro-crossing",
    "frame-03-intro-final",
    # Frames 04-10 (WIMS and INPEX gestures) are no longer shipped: since the
    # CV-mapped rebuild those features show the linked case studies instead.
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True, help="folder with the original frame PNGs")
    parser.add_argument("--out", default="public/character", help="output folder (default: public/character)")
    parser.add_argument("--manifest", default="docs/asset-manifest.json", help="JSON manifest path (not shipped)")
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest = []

    for name in FRAMES:
        source = src / f"{name}.png"
        image = Image.open(source)
        if image.mode != "RGBA":
            raise SystemExit(f"{source.name}: expected RGBA with transparency, got {image.mode}")
        w, h = image.size
        entry = {
            "frame": name,
            "source": {"file": source.name, "width": w, "height": h, "bytes": source.stat().st_size, "sha256": sha256(source)},
            "derivatives": [],
        }
        for width in WIDTHS:
            height = round(h * width / w)
            resized = image if width == w else image.resize((width, height), Image.Resampling.LANCZOS)
            target = out / f"{name}-{width}.webp"
            # No metadata is copied: Pillow writes no EXIF/XMP/ICC unless asked to.
            resized.save(target, "WEBP", quality=QUALITY, alpha_quality=100, method=6, exact=False)
            entry["derivatives"].append({"file": target.name, "width": width, "height": height, "bytes": target.stat().st_size})
            print(f"{target.name:44s} {width}x{height}  {target.stat().st_size / 1024:7.1f} KB")
        manifest.append(entry)

    manifest_path = Path(args.manifest)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps({"frames": manifest}, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {manifest_path}")


if __name__ == "__main__":
    main()
