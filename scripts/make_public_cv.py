"""Prepare the CV that the site's "Download CV" buttons serve.

    python scripts/make_public_cv.py --src <Fakhri's latest CV PDF>

The latest CV (28 Sep 2026) was produced for one recruiter: its page footer reads
"Muhammad Fakhri Helmi • <recruiter> Candidate CV • n" and its metadata names the
recruiter. This script keeps every page exactly as Fakhri wrote it and only:

  * replaces that footer with "Muhammad Fakhri Helmi • Curriculum Vitae • n"
    (same size, colour and a metric-compatible serif face);
  * rewrites the document metadata and drops the XMP packet;
  * refuses to write the file if any recruiter name or any term from the
    git-ignored .privacy-terms.local.txt is still in the text.

Output: public/cv/Muhammad-Fakhri-Helmi-CV.pdf, plus its SHA-256 in
docs/public-cv.json — scripts/check.mjs lets exactly that file through.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "cv" / "Muhammad-Fakhri-Helmi-CV.pdf"
RECORD = ROOT / "docs" / "public-cv.json"
FOOTER = re.compile(r"Muhammad Fakhri Helmi\s+•\s+(.+?)\s+•\s*(\d*)")
NEW_LABEL = "Curriculum Vitae"


def footer_font() -> dict[str, str]:
    """Times New Roman is metric-compatible with the CV's Liberation Serif and has
    the bullet glyph; the built-in Times face is the fallback."""
    candidates = [os.environ.get("CV_FONT"), os.path.join(os.environ.get("WINDIR", ""), "Fonts", "times.ttf")]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return {"fontname": "cvserif", "fontfile": candidate}
    return {"fontname": "tiro"}


def footer_stamp(text: str, size: float, rgb: tuple[float, ...]) -> tuple[fitz.Document, float, float]:
    """The new footer as a one-line PDF whose font is subset on its own, so the
    CV's embedded fonts are never re-subset. Returns (stamp, width, ascent)."""
    font = footer_font()
    measure = fitz.Font(fontfile=font["fontfile"]) if "fontfile" in font else fitz.Font(font["fontname"])
    width = measure.text_length(text, fontsize=size) + 2
    ascent = size * 1.2
    stamp = fitz.open()
    line = stamp.new_page(width=width, height=size * 1.6)
    line.insert_text((1, ascent), text, fontsize=size, color=rgb, **font)
    stamp.subset_fonts()
    return stamp, width, ascent


def private_terms() -> list[str]:
    path = ROOT / ".privacy-terms.local.txt"
    if not path.exists():
        return []
    return [t.strip() for t in path.read_text(encoding="utf-8").splitlines() if t.strip() and not t.startswith("#")]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True, type=Path)
    args = parser.parse_args()

    doc = fitz.open(args.src)
    removed_labels: set[str] = set()
    for page in doc:
        footer_spans = []
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                text = "".join(span["text"] for span in line["spans"])
                if line["bbox"][1] > page.rect.height - 40 and FOOTER.search(text):
                    footer_spans.append(line)
        if not footer_spans:
            raise SystemExit(f"page {page.number + 1}: footer not found — check the source CV")
        for line in footer_spans:
            text = "".join(span["text"] for span in line["spans"])
            match = FOOTER.search(text)
            assert match
            removed_labels.add(match.group(1))
            first = line["spans"][0]
            size, colour = first["size"], first["color"]
            baseline = first["origin"][1]
            rect = fitz.Rect(line["bbox"]) + (-2, -1, 2, 1)
            page.add_redact_annot(rect)
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)
            new_text = f"Muhammad Fakhri Helmi  •  {NEW_LABEL}  •  {page.number + 1}"
            rgb = tuple(((colour >> shift) & 0xFF) / 255 for shift in (16, 8, 0))
            stamp, width, ascent = footer_stamp(new_text, size, rgb)
            left = (page.rect.width - width) / 2
            top = baseline - ascent
            page.show_pdf_page(fitz.Rect(left, top, left + width, top + stamp[0].rect.height), stamp, 0)

    now = datetime.now(timezone.utc).strftime("D:%Y%m%d%H%M%SZ")
    doc.set_metadata(
        {
            "title": "Muhammad Fakhri Helmi — Curriculum Vitae",
            "author": "Muhammad Fakhri Helmi",
            "subject": "Petroleum Engineer — Drilling & Well Operations, Well Integrity, Field Support",
            "keywords": "petroleum engineer, drilling, well operations, well integrity, field engineer, project coordinator",
            "creator": "",
            "producer": "",
            "creationDate": now,
            "modDate": now,
        }
    )
    doc.del_xml_metadata()

    text = "\n".join(page.get_text() for page in doc)
    leftovers = [label for label in removed_labels if label != NEW_LABEL and label.split()[0] in text]
    hits = [term for term in private_terms() if re.search(rf"\b{re.escape(term)}\b", text, re.IGNORECASE)]
    if leftovers or hits:
        raise SystemExit(f"refusing to publish: recruiter label {leftovers} / private terms ({len(hits)}) still in the text")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT, garbage=4, deflate=True, clean=True, no_new_id=True)
    digest = hashlib.sha256(OUT.read_bytes()).hexdigest()
    RECORD.write_text(
        json.dumps(
            {
                "path": "cv/Muhammad-Fakhri-Helmi-CV.pdf",
                "sha256": digest,
                "pages": doc.page_count,
                "source": "Fakhri's CV of 28 Sep 2026 (recruiter-specific edition), footer and metadata generalised",
                "prepared": datetime.now(timezone.utc).date().isoformat(),
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"footer label replaced on {doc.page_count} pages: {sorted(removed_labels)} -> {NEW_LABEL}")
    print(f"{OUT.relative_to(ROOT)}  {OUT.stat().st_size // 1024} KB  sha256 {digest[:16]}…")


if __name__ == "__main__":
    main()
