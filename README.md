# Protocol Finder

A fast, phone-first viewer for the Patient Care Guidelines PDF.

- Full-text search: lists protocols whose titles match, then every section that mentions the term, with page number and context.
- Opens the original PDF pages (rendered with pdf.js) with the term highlighted. Content is never retyped.
- Links inside the PDF work: tapping a cross-reference jumps to the page it points at.
- Meds: formulary and dosing pages one tap from the home screen.
- Peds: pediatric quick reference built only from values and formulas in the guidelines (`peds.json`, with source pages).
- Changes: section-by-section text differences from the previous guidelines version.
- Favorites and recent protocols are stored on the device. Works offline after the first load.

## Updating to a new PDF version

```bash
cp data.json versions/data-<old version>.json              # keep the old index for comparison
pdftotext -layout new.pdf full.txt && pdftotext new.pdf raw.txt
python3 tools/build_index.py full.txt raw.txt data.json --prev versions/data-<old version>.json changes.json
cp new.pdf guidelines.pdf
# Re-verify every value and page in peds.json against the new PDF, then set verified_version.
python3 tools/release.py .                                 # stamps sw.js so installed phones update
```
