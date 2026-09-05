"""Verify archived game identity, downloadable ZIP contents, and relative links."""
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def check(condition, message):
    if not condition: raise AssertionError(message)

def main():
    manifest = json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
    expected = {}
    per_game = {}
    for game in manifest['games']:
        files = {}
        for record in game['files']:
            path = ROOT/record['path']
            data = path.read_bytes()
            check(hashlib.sha256(data).hexdigest() == record['sha256'], f'Changed source: {path}')
            check(len(data) == record['bytes'], f'Wrong size: {path}')
            expected[record['path']] = data
            files[f"{game['slug']}/{path.name}"] = data
        per_game[game['slug']] = files
    actual = {p.relative_to(ROOT).as_posix() for p in (ROOT/'games').rglob('*') if p.is_file()}
    check(set(expected) == actual, 'Unexpected or missing files in preserved games')
    hashes = {}
    for line in (ROOT/'downloads/SHA256SUMS.txt').read_text().splitlines():
        digest, name = line.split('  ', 1)
        hashes[name] = digest
    check(set(hashes) == {'lastlight.zip','last-light-lancer.zip','both-games.zip'}, 'Package checksum list changed')
    for name, digest in hashes.items():
        path = ROOT/'downloads'/name
        check(hashlib.sha256(path.read_bytes()).hexdigest() == digest, f'Wrong ZIP digest: {name}')
        if name == 'both-games.zip':
            entries = {'one-prompt-two-worlds/'+p: data for p,data in expected.items()}
            entries.update({'one-prompt-two-worlds/'+p: (ROOT/p).read_bytes() for p in ['PLAY BOTH.bat','START HERE.txt']})
        else: entries = per_game[name[:-4]]
        with zipfile.ZipFile(path) as z:
            check(len(z.namelist()) == len(set(z.namelist())), f'Duplicate ZIP paths: {name}')
            check(set(z.namelist()) == set(entries), f'Unexpected or missing ZIP entry: {name}')
            for entry, data in entries.items():
                check(z.read(entry) == data, f'Archive contents differ: {entry}')
                check('..' not in Path(entry).parts and not entry.startswith('/'), 'Unsafe archive path')
    checked = 0
    for path in ROOT.rglob('*.md'):
        if '.git' in path.parts: continue
        source = path.read_text(encoding='utf-8')
        links = re.findall(r'\]\(([^)]+)\)', source) + re.findall(r'(?:href|src)="([^"]+)"', source)
        for link in links:
            link = link.strip('<>')
            parsed = urlsplit(link)
            if parsed.scheme or link.startswith('#'): continue
            target = (path.parent/unquote(parsed.path)).resolve()
            check(target.exists(), f'Broken local link in {path.relative_to(ROOT)}: {link}')
            check(target.is_relative_to(ROOT), f'Link escapes repository: {link}')
            checked += 1
    for folder in ['lastlight','last-light-lancer']:
        html = (ROOT/'games'/folder/'index.html').read_text(encoding='utf-8')
        for ref in re.findall(r'(?:src|href)="([^"]+)"',html):
            check((ROOT/'games'/folder/ref).exists(), f'Missing runtime asset: {folder}/{ref}')
    print(f'PASS: {len(expected)} frozen files, 3 exact ZIPs, checksums, runtime assets, {checked} relative documentation links.')

if __name__ == '__main__': main()
