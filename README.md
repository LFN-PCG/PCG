# Protocol Finder

A fast, phone-first viewer for the Patient Care Guidelines PDF.

- Full-text search: lists protocols whose titles match, then every section that mentions the term, with page number and context.
- Tapping a result opens the original PDF page (rendered with pdf.js) with the term highlighted. Content is never retyped.
- Favorites and recently viewed protocols on the home screen (stored on the device).
- Works offline after the first load; can be added to the home screen.

## Updating to a new PDF version

```bash
pdftotext -layout new.pdf full.txt
pdftotext new.pdf raw.txt
python3 tools/build_index.py full.txt raw.txt data.json
cp new.pdf guidelines.pdf
# bump CACHE in sw.js (e.g. protocols-v2) so phones pick up the new version
```
