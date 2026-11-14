"""Build the search index (data.json) and, optionally, a version diff (changes.json).

Usage:
  python3 build_index.py full_layout.txt raw.txt data.json [--prev previous_data.json changes.json]

full_layout.txt = `pdftotext -layout guidelines.pdf`, raw.txt = `pdftotext guidelines.pdf`.
"""
import re, json, sys, difflib

args = sys.argv[1:]
prev_path = changes_path = None
if '--prev' in args:
    k = args.index('--prev')
    prev_path, changes_path = args[k + 1], args[k + 2]
    args = args[:k] + args[k + 3:]
lay_path, raw_path, out_path = args
lay = open(lay_path).read().split('\f')
raw = open(raw_path).read().split('\f')
if raw and not raw[-1].strip():
    raw = raw[:-1]
NPAGES = len(raw)

m = re.search(r'Version\s+(\d{4}\.\d{2}\.\d{2})', ' '.join(raw[:2]))
version = m.group(1) if m else 'unknown'

# ---- table of contents ----
toc = []
for ln in '\f'.join(lay[:10]).splitlines():
    m = re.match(r'^(\s*)(\d{4}\.\d{2}\.\d{2}|\d+(?:\.\d+[a-z]?)?)\s*(.*?)\s*\.{2,}\s*(\d+)\s*$', ln)
    if not m:
        continue
    ind, num, title, pg = m.groups()
    title = re.sub(r'\s+', ' ', title).strip()
    if re.match(r'\d{4}\.\d{2}\.\d{2}$', num):
        lvl, title = 2, 'Update summary ' + num
    elif '.' not in num:
        lvl = 0
    elif re.search(r'[a-z]$', num):
        lvl = 2
    else:
        lvl = 1
    if not title:
        continue
    toc.append(dict(num=num, title=title, lvl=lvl, start=int(pg) + 1))


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


for e in toc:
    key = norm(e['title'])[:25]
    if e['title'].startswith('Update summary'):
        key = norm(e['num'])
    for d in [0, -1, 1, -2, 2, 3, -3]:
        p = e['start'] + d
        if 1 <= p <= NPAGES and key in norm(raw[p - 1][:400]):
            if d:
                print('SHIFT', e['num'], e['title'], e['start'], '->', p, file=sys.stderr)
            e['start'] = p
            break
    else:
        print('UNVERIFIED', e['num'], e['title'], e['start'], file=sys.stderr)

for i, e in enumerate(toc):
    end = NPAGES
    for f in toc[i + 1:]:
        if f['lvl'] <= e['lvl']:
            end = max(e['start'], f['start'] - 1)
            break
    e['end'] = end

out, ch = [], None
for i, e in enumerate(toc):
    if e['lvl'] == 0:
        ch = e['title']
        e['chapter'] = ch
        # a chapter with no numbered protocols under it (e.g. "PCG Update Summaries") becomes a section itself
        nxt = toc[i + 1] if i + 1 < len(toc) else None
        if not nxt or nxt['lvl'] != 1:
            out.append(dict(e, lvl=1))
        continue
    e['chapter'] = ch
    out.append(e)

# ---- glossary abbreviations ----
abbr = {}
for e in out:
    if 'Glossary' in e['title']:
        for p in raw[e['start'] - 1:e['end']]:
            for m in re.finditer(r'^([A-Za-z0-9/]{1,10}) – (.+)$', p, re.M):
                abbr[m.group(1).lower()] = m.group(2).strip()


def clean(p):
    p = re.sub(r'\n?\d+ \| P a g e\s*$', '', p)
    p = re.sub(r'[ \t]+', ' ', p)
    p = re.sub(r'(?:•\s*)+', '• ', p)
    return re.sub(r'\n{2,}', '\n', p).strip()


pages = [clean(p) for p in raw]
data = dict(version=version, sections=out, pages=pages, abbr=abbr)
json.dump(data, open(out_path, 'w'), separators=(',', ':'))
print(version, len(out), 'sections', len(abbr), 'abbr', NPAGES, 'pages')


# ---- version diff ----
def section_lines(d, s):
    """Comparable text lines for one section: drop running headers, page footers and bullets-only lines."""
    lines = []
    for p in d['pages'][s['start'] - 1:s['end']]:
        for ln in p.split('\n'):
            t = re.sub(r'\s+', ' ', ln).strip(' •o▪')
            if len(t) < 3 or t == 'CONTINUES TO NEXT PAGE' or norm(t) in (norm(s['title']), norm(s['num'] + s['title'])):
                continue
            lines.append(t)
    return lines


if prev_path:
    prev = json.load(open(prev_path))
    pv = prev.get('version', 'previous')
    by_title = {norm(s['title']): s for s in prev['sections']}
    by_num = {s['num']: s for s in prev['sections']}
    by_both = {s['num'] + '|' + norm(s['title']): s for s in prev['sections']}
    matched, items = set(), []
    for s in out:
        if s['chapter'] and s['chapter'].startswith('PCG Update'):
            continue
        o = by_both.get(s['num'] + '|' + norm(s['title'])) or by_title.get(norm(s['title'])) or by_num.get(s['num'])
        if not o:
            items.append(dict(num=s['num'], title=s['title'], status='added', added=[], removed=[]))
            continue
        matched.add(o['num'] + o['title'])
        a, b = section_lines(prev, o), section_lines(data, s)
        if a == b:
            continue
        sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
        add, rem = [], []
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op == 'equal' or ' '.join(a[i1:i2]).replace('- ', '').split() == ' '.join(b[j1:j2]).replace('- ', '').split():
                continue  # unchanged, or only re-wrapped
            if op in ('replace', 'delete'):
                rem += a[i1:i2]
            if op in ('replace', 'insert'):
                add += b[j1:j2]
        # ignore pure re-flow (same words, different line breaks)
        if not add and not rem:
            continue
        items.append(dict(num=s['num'], title=s['title'], status='changed', added=add[:60], removed=rem[:60],
                          renumbered=o['num'] if o['num'] != s['num'] else None))
    for o in prev['sections']:
        if o['num'] + o['title'] not in matched and not (o.get('chapter') or '').startswith('PCG Update') \
                and not any(norm(o['title']) == norm(s['title']) or o['num'] == s['num'] for s in out):
            items.append(dict(num=o['num'], title=o['title'], status='removed', added=[], removed=[]))
    json.dump(dict(**{'from': pv, 'to': version}, sections=items), open(changes_path, 'w'), separators=(',', ':'))
    print('changes', pv, '->', version, len(items), 'sections differ')
