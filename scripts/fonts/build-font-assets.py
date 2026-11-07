#!/usr/bin/env python3
"""
One-off generator for the embedded font assets (run locally, outputs are committed).

  python3 scripts/fonts/build-font-assets.py path/to/InterVariable.ttf

Produces, next to this file:
  inter-text.woff2     Inter, opsz pinned to 14 (text cut), wght 400..700, ASCII + typographic extras
  inter-display.woff2  Inter, opsz pinned to 32 (display cut), same coverage
  metrics.json         Advance widths per character for weights 400/500/600/700, used by
                       scripts/glass/font.ts to measure text exactly at build time.
"""
import io
import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

HERE = Path(__file__).resolve().parent
UNICODES = list(range(0x20, 0x7F)) + [
    0x00A0, 0x00B7, 0x00D7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D,
    0x2022, 0x2026, 0x2191, 0x2192, 0x2193, 0x2197, 0x2190, 0x2122, 0x00A9, 0x2009, 0x2715, 0x2713,
]
FEATURES = ['kern', 'liga', 'calt', 'tnum', 'case', 'ss01', 'cv11']
WEIGHTS = [400, 500, 600, 700]
CUTS = {'text': 14, 'display': 32}


def subset_font(font: TTFont) -> TTFont:
    opts = subset.Options()
    opts.layout_features = FEATURES
    opts.flavor = None
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(font)
    return font


def tnum_digit_advance(font: TTFont) -> int | None:
    """Advance of tabular figures ('tnum' substitutes digits with fixed-width glyphs)."""
    cmap = font.getBestCmap()
    gsub = font.get('GSUB')
    hmtx = font['hmtx']
    if not gsub:
        return None
    zero = cmap.get(ord('0'))
    for fr in gsub.table.FeatureList.FeatureRecord:
        if fr.FeatureTag != 'tnum':
            continue
        for li in fr.Feature.LookupListIndex:
            lookup = gsub.table.LookupList.Lookup[li]
            for st in lookup.SubTable:
                mapping = getattr(st, 'mapping', None)
                if mapping is None and hasattr(st, 'ExtSubTable'):
                    mapping = getattr(st.ExtSubTable, 'mapping', None)
                if mapping and zero in mapping:
                    return hmtx[mapping[zero]][0]
    return hmtx[zero][0]


def main() -> None:
    src = Path(sys.argv[1])
    metrics = {'unitsPerEm': None, 'cuts': {}}
    for cut, opsz in CUTS.items():
        base = TTFont(src)
        ranged = instancer.instantiateVariableFont(base, {'wght': (400, 700), 'opsz': opsz})
        buf = io.BytesIO()
        ranged.save(buf)  # round-trip so the subsetter sees fully materialised tables
        buf.seek(0)
        ranged = subset_font(TTFont(buf))
        ranged.flavor = 'woff2'
        out = HERE / f'inter-{cut}.woff2'
        ranged.save(out)
        print(f'wrote {out.name} ({out.stat().st_size} bytes)')

        cut_metrics = {}
        for w in WEIGHTS:
            static = instancer.instantiateVariableFont(TTFont(src), {'wght': w, 'opsz': opsz})
            metrics['unitsPerEm'] = static['head'].unitsPerEm
            cmap = static.getBestCmap()
            hmtx = static['hmtx']
            adv = {}
            for cp in UNICODES:
                g = cmap.get(cp)
                if g is not None:
                    adv[chr(cp)] = hmtx[g][0]
            cut_metrics[str(w)] = {'advances': adv, 'tnumDigit': tnum_digit_advance(static)}
        metrics['cuts'][cut] = cut_metrics

    (HERE / 'metrics.json').write_text(json.dumps(metrics, separators=(',', ':'), ensure_ascii=False))
    print('wrote metrics.json')


if __name__ == '__main__':
    main()
