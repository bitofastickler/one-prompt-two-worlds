"""Build deterministic, offline-playable archives from the frozen game snapshots."""
import hashlib
import io
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
STAMP = (2026, 9, 5, 0, 0, 0)

def sha(data): return hashlib.sha256(data).hexdigest()

def load_files():
    manifest = json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
    result = {}
    for game in manifest['games']:
        entries = []
        for record in game['files']:
            data = (ROOT/record['path']).read_bytes()
            if sha(data) != record['sha256'] or len(data) != record['bytes']:
                raise ValueError(f"Captured source changed: {record['path']}")
            entries.append((Path(record['path']).name, data))
        result[game['slug']] = entries
    return result

def archive(entries):
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in sorted(entries):
            item = zipfile.ZipInfo(name, STAMP)
            item.compress_type = zipfile.ZIP_DEFLATED
            item.create_system = 3
            item.external_attr = 0o100644 << 16
            z.writestr(item, data, compresslevel=9)
    return output.getvalue()

def packages():
    games = load_files()
    output = {f'{slug}.zip': archive([(f'{slug}/{name}', data) for name,data in entries]) for slug,entries in games.items()}
    both = [(f'one-prompt-two-worlds/games/{slug}/{name}',data) for slug,entries in games.items() for name,data in entries]
    for filename in ['PLAY BOTH.bat','START HERE.txt']:
        both.append((f'one-prompt-two-worlds/{filename}',(ROOT/filename).read_bytes()))
    output['both-games.zip'] = archive(both)
    return output

def main():
    out = ROOT/'downloads'
    out.mkdir(exist_ok=True)
    built = packages()
    for filename, data in built.items():
        (out/filename).write_bytes(data)
        print(f'{filename}: {len(data):,} bytes')
    (out/'SHA256SUMS.txt').write_text(''.join(f'{sha(data)}  {name}\n' for name,data in sorted(built.items())),encoding='utf-8')

if __name__ == '__main__': main()
