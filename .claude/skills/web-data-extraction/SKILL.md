---
name: web-data-extraction
description: >-
  Turn messy public documents and pages into clean, structured text/tables/
  records — article extraction, PDF/table parsing, OCR, normalization. Use for
  filings, reports, and public pages (within ToS). Triggers: "extract clean
  text", "parse this PDF", "scrape table", "OCR", "clean article content".
---

# Web & document data extraction

Clean signal out of HTML/PDF/scans, lawfully (public + ToS-respecting; prefer
APIs/feeds first — see [[lawful-intel-acquisition]]).

## Article / HTML

Strip boilerplate (nav/ads/footers) with Readability/Trafilatura-style extraction
→ main text + metadata (title, author, date, canonical URL). Keep the source
URL + a raw copy for provenance.

## PDF

- **Text PDFs** — pdfminer/PyMuPDF/pdfplumber for text + layout; pdfplumber/
  Camelot for **tables** (watch merged cells, multi-page headers).
- **Scanned PDFs/images** — OCR with Tesseract/PaddleOCR; report confidence;
  never silently trust low-confidence OCR.
- **Mixed/complex** (filings, decks) — Unstructured/Docling to segment into
  typed elements (title, table, list).

## Normalize

Canonicalize dates (→ epoch/ISO), numbers (units, scale), and entities. Dedup by
content hash. **Timestamp + preserve source URL on every record.** Store the raw
evidence so any extracted claim is reconstructable.

## Quality

Validate against the source (spot-check tables/totals). Flag extraction
confidence; degraded input → `stale`/`partial`/`unavailable`, never fabricated
values. Garbage-in is the #1 failure — verify before you trust.

## Boundaries

Public/permitted content only; honor robots.txt, rate limits, ToS, copyright/
attribution. No login/paywall bypass, no personal data.
