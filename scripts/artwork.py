"""Generate dependency-free editorial SVG art. These images are not screenshots."""
from pathlib import Path
import math
import random

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'

def scene(kind):
    rng = random.Random(23 if kind == 'sea' else 61)
    parts = []
    for _ in range(90):
        x, y = rng.randrange(1000), rng.randrange(560)
        parts.append(f'<circle cx="{x}" cy="{y}" r="{rng.choice([1,1,2])}" fill="#b1d8dc" opacity="{rng.uniform(.1,.4):.2f}"/>')
    if kind == 'sea':
        for y in range(40, 570, 35):
            pts = ' '.join(f'{x},{y+math.sin(x*.01+y)*9:.1f}' for x in range(0,1001,10))
            parts.append(f'<polyline points="{pts}" stroke="#67a6a5" stroke-opacity=".10" fill="none"/>')
        parts += ['<path d="M650 250L1000 55V335Z" fill="url(#beam)"/>',
                  '<path d="M650 250L0 155V450Z" fill="url(#beam)" opacity=".35"/>']
        for rx, ry in [(105,35),(140,48),(180,63)]:
            parts.append(f'<ellipse cx="650" cy="350" rx="{rx}" ry="{ry}" stroke="#79b1a5" stroke-opacity=".18" fill="none"/>')
        parts += ['<path d="M561 344L588 326 610 331 641 314 676 325 712 334 740 360 690 378 610 375Z" fill="#284a49"/>',
                  '<path d="M627 335L635 263H666L674 335Z" fill="#95a6a0"/>',
                  '<path d="M650 265H666L674 335H650Z" fill="#4f6a69"/>',
                  '<path d="M625 262H676V272H625Z" fill="#c9bf9f"/>',
                  '<path d="M636 235H665V260H636Z" fill="#f5d99b"/>',
                  '<path d="M624 235L650 218 677 235Z" fill="#667f77"/>',
                  '<circle cx="650" cy="250" r="75" fill="url(#glow)"/>',
                  '<path d="M465 394L422 368 433 393 420 413Z" fill="#bbecdf"/>',
                  '<path d="M419 389L361 374M417 402L360 410" stroke="#8cbfb6" stroke-opacity=".4" stroke-width="2"/>']
        for x,y in [(800,425),(365,297),(905,208)]:
            parts.append(f'<path d="M{x} {y-9}l9 9-9 9-9-9Z" fill="#e6c67e"/>')
        for x,y in [(835,340),(332,438)]:
            parts.append(f'<g transform="translate({x} {y})" stroke="#cf8585" stroke-width="3" fill="#27363d"><path d="M-20-12Q-42-33-45-9M-20 12Q-42 33-45 9M6-12Q-8-35-22-34M6 12Q-8 35-22 34" fill="none"/><ellipse rx="27" ry="16"/><circle cx="13" cy="-6" r="2" fill="#f6de9c"/><circle cx="13" cy="6" r="2" fill="#f6de9c"/></g>')
    else:
        for x in range(0,1000,80): parts.append(f'<path d="M{x} 0V560" stroke="#74c8e8" stroke-opacity=".06"/>')
        for y in range(0,560,80): parts.append(f'<path d="M0 {y}H1000" stroke="#74c8e8" stroke-opacity=".06"/>')
        for x,y,w,h in [(590,340,130,66),(800,210,110,75),(400,454,85,42),(355,220,95,54)]:
            parts.append(f'<g transform="rotate(-4 {x} {y})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#182c3b" stroke="#365368" stroke-width="2"/><path d="M{x+10} {y+10}h{w-20}" stroke="#476073" stroke-width="3"/></g>')
        parts += ['<circle cx="735" cy="260" r="59" fill="none" stroke="#e5cc85" stroke-opacity=".3" stroke-width="2"/>',
                  '<circle cx="735" cy="260" r="83" fill="none" stroke="#e5cc85" stroke-opacity=".08"/>',
                  '<path d="M735 233L754 260 735 287 716 260Z" fill="#f3d991"/>',
                  '<path d="M606 289L548 266 558 288 546 314Z" fill="#6ed5f6" stroke="#d4f4ff" stroke-width="2"/>',
                  '<circle cx="575" cy="289" r="44" fill="none" stroke="#70d9ff" stroke-opacity=".3" stroke-width="2"/>',
                  '<path d="M538 285L470 280M537 299L482 307" stroke="#62b8d4" stroke-width="2" stroke-opacity=".5"/>']
        for x,y in [(873,382),(852,420),(921,393)]:
            parts.append(f'<path d="M{x-19} {y}l37-16-7 16 7 16Z" fill="#e66d88"/>')
        for x,y in [(625,283),(650,277),(679,270)]:parts.append(f'<circle cx="{x}" cy="{y}" r="4" fill="#e9d193"/>')
    return ''.join(parts)

DEFS = '''<defs>
<linearGradient id="bg" x2="1" y2="1"><stop stop-color="#0c242a"/><stop offset="1" stop-color="#07121e"/></linearGradient>
<linearGradient id="beam"><stop stop-color="#f3d68e" stop-opacity=".01"/><stop offset=".6" stop-color="#f3d68e" stop-opacity=".12"/><stop offset="1" stop-color="#f3d68e" stop-opacity=".01"/></linearGradient>
<radialGradient id="glow"><stop stop-color="#ffe1a1" stop-opacity=".4"/><stop offset="1" stop-color="#ffe1a1" stop-opacity="0"/></radialGradient>
<linearGradient id="shade" x2="0" y2="1"><stop stop-color="#08141a" stop-opacity="0"/><stop offset="1" stop-color="#08141a" stop-opacity=".9"/></linearGradient>
</defs>'''

def card(kind, title, model, filename, label):
    color = '#dfca92' if kind == 'sea' else '#97d6ed'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="560" viewBox="0 0 1000 560" role="img" aria-label="{title} editorial illustration">
{DEFS}<rect width="1000" height="560" fill="url(#bg)"/>{scene(kind)}
<rect width="1000" height="560" fill="url(#shade)"/>
<g font-family="Segoe UI,Arial,sans-serif"><text x="44" y="55" fill="{color}" font-size="13" letter-spacing="4">{label}</text>
<text x="42" y="461" fill="#f0eee6" font-weight="700" font-size="58" letter-spacing="-2">{title}</text>
<text x="45" y="508" fill="{color}" font-size="17" letter-spacing="2">{model}</text></g>
<rect x=".5" y=".5" width="999" height="559" fill="none" stroke="#47606a" stroke-opacity=".5"/></svg>'''
    (OUT / filename).write_text(svg, encoding='utf-8')

def main():
    OUT.mkdir(exist_ok=True)
    card('sea','LASTLIGHT','GPT-6 ASTRA / MEDIUM','lastlight.svg','01 / HOLD THE LIGHT')
    card('space','Last Light Lancer','GPT-5.6 SOL / HIGH','lancer.svg','02 / BRING THE SIGNAL HOME')
    hero=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="780" viewBox="0 0 1600 780" role="img" aria-label="One prompt. Two worlds. A game generation experiment">
{DEFS}<rect width="1600" height="780" fill="#09151d"/>
<g opacity=".67" transform="translate(420 155) scale(1.25)">{scene('sea')}</g>
<rect width="1600" height="780" fill="url(#shade)"/>
<path d="M60 65H1540M60 670H1540" stroke="#37515a"/>
<g font-family="Segoe UI,Arial,sans-serif">
<text x="64" y="112" fill="#d7c190" font-size="17" letter-spacing="5">THE ONE-SHOT GAME CHALLENGE</text>
<text x="58" y="287" fill="#f0eee6" font-size="126" font-weight="700" letter-spacing="-6">One prompt.</text>
<text x="58" y="414" fill="#a2d9d1" font-size="126" font-weight="700" letter-spacing="-6">Two worlds.</text>
<text x="66" y="486" fill="#b1c1c4" font-size="25">No supplied assets. No prescribed genre. Just make it playable.</text>
<rect x="64" y="551" width="361" height="55" rx="4" fill="#192e31" stroke="#657266"/>
<text x="85" y="586" fill="#e1cea0" font-size="21">GPT-6 Astra <tspan fill="#9aafaa">/ medium</tspan></text>
<text x="450" y="586" fill="#72898f" font-size="18">×</text>
<rect x="490" y="551" width="352" height="55" rx="4" fill="#152733" stroke="#436578"/>
<text x="513" y="586" fill="#a7d9ee" font-size="21">GPT-5.6 Sol <tspan fill="#8aa9b5">/ high</tspan></text>
<text x="66" y="720" fill="#839da4" font-size="15" letter-spacing="3">PLAY THE GAMES. EXPLORE THE CHOICES. DRAW YOUR OWN CONCLUSIONS.</text>
<text x="1535" y="720" text-anchor="end" fill="#b6c7c9" font-size="16">VOL. 01 / 2026</text></g></svg>'''
    (OUT/'cover.svg').write_text(hero, encoding='utf-8')
    print('Generated three editorial SVG illustrations.')

if __name__ == '__main__': main()
