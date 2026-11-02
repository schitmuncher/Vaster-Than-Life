#!/usr/bin/env python3
"""Assembles mods/AI-MOD-GUIDE.md from the parts in tools/ (head, schema, cookbook, generated reference, examples)."""
import json, os
T = os.path.dirname(os.path.abspath(__file__)); R = lambda f: open(os.path.join(T, f)).read()
ref_intro = """
## Reference: what already exists

Use these ids freely. Items marked with a pack name come from a built-in content pack: they are in every normal run, but not inside campaign mods.

**Systems**: `shields`, `engines`, `oxygen`, `weapons`, `drones`, `medbay`, `clonebay`, `teleporter`, `cloaking`, `hacking`, `mindcontrol`, `piloting`, `sensors`, `doors`, `battery`. Subsystems (no reactor power): `piloting`, `sensors`, `doors`, `battery`. Highest levels: shields 8, engines 8, oxygen 3, weapons 8, drones 8, medbay 3, clonebay 3, teleporter 3, cloaking 3, hacking 3, mindcontrol 3, piloting 3, sensors 3, doors 3, battery 2.

**Skills** (for `xp`): `pilot`, `engines`, `shields`, `weapons`, `repair`, `combat`.

**Weapon types**: `laser`, `missile`, `ion`, `beam`, `flak`, `bomb`. **Drone kinds**: `attack`, `defense`, `anti`, `internal`, `boarding`, `hull`.

"""
def fmt(d):
    parts = []
    for k, v in d.items():
        if isinstance(v, list): parts.append('  ' + json.dumps(k) + ': [\n' + ',\n'.join('    ' + json.dumps(o, ensure_ascii=False) for o in v) + '\n  ]')
        else: parts.append('  ' + json.dumps(k) + ': ' + json.dumps(v, ensure_ascii=False))
    return '{\n' + ',\n'.join(parts) + '\n}'
ex = json.load(open(os.path.join(T, 'example-glacier.json')))
examples = "\n## Complete examples\n\n### A small mod\n" + R('mod-guide-example1.md').replace('## A complete small example\n', '') + \
  "\n### A medium mod using most features\nA new sector with its own race, goods, quirk, kit, weapons, drone, trade-off augment, enemies, hails, an unlockable ship, a quest, a delayed consequence, a twist and a cargo check. This exact file loads with no warnings.\n\n```json\n" + fmt(ex) + "\n```\n"
out = R('mod-guide-head.md') + R('mod-guide-schema.md') + R('mod-guide-cookbook.md') + ref_intro + R('mod-reference.md') + examples
open(os.path.join(T, '..', 'mods', 'AI-MOD-GUIDE.md'), 'w').write(out)
print(len(out), 'bytes')
