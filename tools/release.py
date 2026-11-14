"""Stamp sw.js with a cache name derived from the app's files, so installed phones pick up any change."""
import hashlib, json, re, sys, os
root = sys.argv[1] if len(sys.argv) > 1 else '.'
h = hashlib.sha256()
for f in ['index.html', 'data.json', 'changes.json', 'peds.json', 'guidelines.pdf', 'pdf.min.js', 'pdf.worker.min.js', 'manifest.webmanifest']:
    p = os.path.join(root, f)
    if os.path.exists(p):
        h.update(open(p, 'rb').read())
ver = json.load(open(os.path.join(root, 'data.json'))).get('version', 'x')
name = f'protocols-{ver}-{h.hexdigest()[:8]}'
sw = os.path.join(root, 'sw.js')
s = re.sub(r"const CACHE = '[^']*';", f"const CACHE = '{name}';", open(sw).read())
open(sw, 'w').write(s)
print(name)
