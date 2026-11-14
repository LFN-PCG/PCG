import re, json, sys
lay=open(sys.argv[1]).read().split('\f')
raw=open(sys.argv[2]).read().split('\f')
NP=len([p for p in raw if p.strip()]) or len(raw)
toc=[]
for ln in '\f'.join(lay[:8]).splitlines():
    m=re.match(r'^(\s*)(\d+(?:\.\d+[a-z]?)?|\d{4}\.\d{2}\.\d{2})\s+(.+?)\s*\.{2,}\s*(\d+)\s*$',ln)
    if m:
        ind,num,title,pg=m.groups()
        title=re.sub(r'\s+',' ',title).strip()
        if '.' not in num: lvl=0
        elif re.search(r'[a-z]$',num) or re.match(r'\d{4}\.',num): lvl=2
        else: lvl=1
        toc.append(dict(num=num,title=title,lvl=lvl,start=int(pg)+1))
# verify / fix start page by searching heading
def norm(s): return re.sub(r'[^a-z0-9]','',s.lower())
for e in toc:
    key=norm(e['title'])[:25]
    found=None
    for d in [0,-1,1,-2,2,3,-3]:
        p=e['start']+d
        if 1<=p<=len(raw) and key in norm(raw[p-1][:400]):
            found=p;break
    if found is None: print('UNVERIFIED',e['num'],e['title'],e['start'],file=sys.stderr)
    elif found!=e['start']: print('SHIFT',e['num'],e['title'],e['start'],'->',found,file=sys.stderr); e['start']=found
last=408
for i,e in enumerate(toc):
    end=last
    for f in toc[i+1:]:
        if f['lvl']<=e['lvl'] or (e['lvl']==1 and f['lvl']==1):
            end=max(e['start'],f['start']-1) if f['start']>e['start'] else e['start'];break
    e['end']=end
ch=None
out=[]
for e in toc:
    if e['lvl']==0: ch=e['title']; 
    e['chapter']=ch
    if e['lvl']==0: continue
    out.append(e)
# abbreviations
abbr={}
for e in out:
  if 'Glossary' in e['title']:
    for p in raw[e['start']-1:e['end']]:
        for m in re.finditer(r'^([A-Za-z0-9/]{1,10}) – (.+)$',p,re.M): abbr[m.group(1).lower()]=m.group(2).strip()
pages=[re.sub(r'(?:•\s*)+','• ',re.sub(r'[ \t]+',' ',re.sub(r'\n?\d+ \| P a g e\s*$','',p))).strip() for p in raw[:408]]
pages=[re.sub(r'\n{2,}','\n',p) for p in pages]
json.dump(dict(sections=out,pages=pages,abbr=abbr),open(sys.argv[3],'w'),separators=(',',':'))
print(len(out),'sections',len(abbr),'abbr',sum(len(p) for p in pages),'chars')
