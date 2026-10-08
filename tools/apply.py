"""Merge new summaries/transcriptions into private/archive.json.

usage: python3 tools/apply.py batch.json
batch.json: [{"s": "6", "notes": "...", "excerpt": "...", "transcript": "markdown..."}, ...]
Transcriptions are also written to private/transcriptions/<s>.md (build.mjs reads those).
"""
import json, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
arch_p = root / 'private' / 'archive.json'
arch = json.loads(arch_p.read_text())
by = {l['s']: l for l in arch['letters']}
tr_dir = root / 'private' / 'transcriptions'
tr_dir.mkdir(parents=True, exist_ok=True)

for e in json.loads(pathlib.Path(sys.argv[1]).read_text()):
    l = by[e['s']]
    for k in ('notes', 'excerpt', 'ms', 'dd', 'd', 'loc'):
        if e.get(k): l[k] = e[k]
    if e.get('notes'): l['context'] = ''
    if e.get('typed') is not None: l['typed'] = e['typed']
    if e.get('transcript'):
        l['transcript'] = e['transcript']
        l['draft'] = True
        (tr_dir / f"{e['s']}.md").write_text(e['transcript'])
    print('updated', e['s'])

arch['letters'].sort(key=lambda l: (l['d'][:7], l['n'], l['s']))
arch_p.write_text(json.dumps(arch, indent=1, ensure_ascii=False))
left = [l['s'] for l in arch['letters'] if not l['notes']]
print(f'{len(left)} still without a summary')
