"""Convert captured case-study views into the WebP posters this site ships.

    python scripts/evidence/make_posters.py --src <folder with the PNGs from capture.mjs>

Writes public/evidence/<id>-800.webp and <id>-1600.webp (no EXIF/XMP/ICC) and
docs/evidence-manifest.json. Only the ids listed in POSTERS are published.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import date
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "evidence"
MANIFEST = ROOT / "docs" / "evidence-manifest.json"
WIDTHS = (800, 1600)
QUALITY = 80

SITES = {
    "wims": "https://muhammadfakhri-helmi.github.io/Project-Coordinator-WIMS-Portofolio/",
    "inpex": "https://muhammadfakhri-helmi.github.io/fakhri-experience/",
    "alpha": "https://muhammadfakhri-helmi.github.io/alpha05-drilling-3d/",
    "thesis": "https://muhammadfakhri-helmi.github.io/Fakhri-Tugas-Akhir-Design/",
    "simprug": "https://muhammadfakhri-helmi.github.io/Simprug-Economic-Case-Study/",
}

# id -> what the view shows (kept in the manifest for review)
POSTERS = {
    "wims-model": "WIMS case study opening view: 3D wellhead / X-mas tree model",
    "wims-equipment": "Interactive wellhead integrity model with fictional findings",
    "wims-dashboard": "Operational dashboard (fictional demonstration values)",
    "wims-attention": "Need-attention workflow for one fictional valve record",
    "wims-archive": "Searchable report register with fictional wells",
    "wims-planning": "Visit history and next-due planning (fictional well and dates)",
    "inpex-overview": "Conductor-analysis story, chapter 01: system overview and study inputs",
    "inpex-offset": "Chapter 05: offset limit and operating envelope",
    "inpex-summary": "Chapter 11: engineering summary",
    "alpha-rig": "Alpha-05 animation: rig on location",
    "alpha-bit": "Alpha-05 animation: drilling the 12-1/4 in. section, BHA list",
    "alpha-well": "Alpha-05 animation: whole-well view with casing shoes",
    "alpha-complete": "Alpha-05 animation: completion",
    "thesis-top": "Drillstring thesis case study: opening view",
    "simprug-top": "Simprug case study: opening view with the 3D field model",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True, type=Path)
    args = parser.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"captured": date.today().isoformat(), "viewport": "1280x800 @1.5x", "posters": []}
    for poster_id, description in POSTERS.items():
        source = args.src / f"{poster_id}.png"
        image = Image.open(source).convert("RGB")
        entry = {
            "id": poster_id,
            "site": SITES[poster_id.split("-")[0]],
            "shows": description,
            "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "files": {},
        }
        for width in WIDTHS:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.LANCZOS)
            target = OUT / f"{poster_id}-{width}.webp"
            resized.save(target, "WEBP", quality=QUALITY, method=6)
            entry["files"][target.name] = target.stat().st_size
        manifest["posters"].append(entry)
        print(f"{poster_id}: " + ", ".join(f"{name} {size // 1024} KB" for name, size in entry["files"].items()))

    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    total = sum(size for p in manifest["posters"] for size in p["files"].values())
    print(f"{len(POSTERS)} posters, {total / 1024 / 1024:.2f} MB total")


if __name__ == "__main__":
    main()
