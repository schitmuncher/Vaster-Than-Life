#!/usr/bin/env python3
"""Writes the Red Dwarf campaign's extra music: five original tunes, as small MIDI files (plus the .mid.json base64 copies
the game falls back on when a host won't serve .mid). Notes below MIDI 50 play as bass, channel 9 as drums (midi.js).
Run: python3 tools/compose-rd-music.py  (writes into mods/)"""
import base64, json, os, struct
OUT = os.path.join(os.path.dirname(__file__), '..', 'mods')
NOTE = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11}
def p(name):   # 'E4' -> 64
    n, o = (name[:-1], int(name[-1])) if name[-1].isdigit() else (name, 4)
    return 12*(o + 1) + NOTE[n]

def vlq(n):
    out = [n & 0x7f]; n >>= 7
    while n: out.insert(0, (n & 0x7f) | 0x80); n >>= 7
    return bytes(out)
def write(name, bpm, notes, tpb=480):
    """notes: (beat, beats, pitch, velocity, channel)"""
    ev = []
    for b, d, n, v, ch in notes:
        t0, t1 = int(round(b*tpb)), int(round((b + d)*tpb)) - 6
        ev.append((t0, 1, bytes([0x90 | ch, n, v]))); ev.append((max(t0 + 10, t1), 0, bytes([0x80 | ch, n, 0])))
    ev.sort(key=lambda e: (e[0], e[1]))
    trk = bytearray(); trk += b'\x00\xff\x51\x03' + struct.pack('>I', int(60e6/bpm))[1:]
    last = 0
    for t, _, data in ev: trk += vlq(t - last) + data; last = t
    trk += b'\x00\xff\x2f\x00'
    mid = b'MThd' + struct.pack('>IHHH', 6, 0, 1, tpb) + b'MTrk' + struct.pack('>I', len(trk)) + bytes(trk)
    path = os.path.join(OUT, name)
    open(path, 'wb').write(mid); json.dump({ 'base64':base64.b64encode(mid).decode() }, open(path + '.json', 'w'))
    print(name, len(notes), 'notes', len(mid), 'bytes')

def drums(bars, pattern, beats=4, start=0, swing=0):
    out = []
    for bar in range(bars):
        for step, kind in pattern:
            b = start + bar*beats + step + (swing if (step*2) % 2 == 1 else 0)
            out.append((b, .25, {'k':36, 's':38, 'h':42}[kind], 90 if kind != 'h' else 60, 9))
    return out

# 1. Curry Blues: a lazy 12-bar in E with a walking bass, for wandering between beacons
def curry_blues():
    N = []; chords = ['E','E','E','E','A','A','E','E','B','A','E','B']
    walk = { 'E':['E2','G#2','B2','C#3'], 'A':['A1','C#2','E2','F#2'], 'B':['B1','D#2','F#2','A2'] }
    third = { 'E':['E4','G#4','B4','D5'], 'A':['A3','C#4','E4','G4'], 'B':['B3','D#4','F#4','A4'] }
    riff = [ [(0,'G4',.66),(0.66,'E4',.34),(1,'G4',.5),(1.5,'A4',.5),(2,'A#4',.33),(2.33,'B4',1.67)],
             [(0,'D5',.5),(0.5,'B4',.5),(1,'A4',.66),(1.66,'G4',.34),(2,'E4',2)],
             [(0,'B4',1),(1,'A4',.66),(1.66,'G4',.34),(2,'E4',.5),(2.5,'G4',1.5)] ]
    for rep in range(2):
        for i, c in enumerate(chords):
            b = (rep*12 + i)*4
            for k, n in enumerate(walk[c]): N.append((b + k, .9, p(n), 84, 0))
            for k in (0, 2): N.append((b + k + (.66 if k else 0), .5, p(third[c][1]), 52, 1)); N.append((b + k + (.66 if k else 0), .5, p(third[c][3]), 48, 1))
            if i in (0, 4, 8) or (i == 10 and rep):
                ph = riff[(i//4 + rep) % 3]; tr = {'E':0,'A':5,'B':7}[c] if i != 0 else 0
                for o, n, d in ph: N.append((b + o, d, p(n) + (tr if tr <= 5 else tr - 12), 92, 2))
            if i == 11: N.append((b + 2, 2, p('B4'), 80, 2)); N.append((b + 2, 2, p('D#5'), 70, 2))
        N += drums(12, [(0,'k'),(1,'h'),(1.66,'h'),(2,'s'),(3,'h'),(3.66,'h')], start=rep*48)
    write('rd-curry-blues.mid', 96, N)

# 2. Simulant March: a driving D minor stomp for fights
def simulant_march():
    N = []; prog = ['Dm','Dm','Bb','C','Dm','Dm','Gm','A']
    root = {'Dm':'D2','Bb':'Bb1','C':'C2','Gm':'G1','A':'A1'}
    tune = [('D5',1),('D5',.5),('E5',.5),('F5',1),('E5',.5),('D5',.5), ('C5',1),('A4',1),('C5',1),('D5',1),
            ('F5',1),('G5',.5),('F5',.5),('E5',1),('C5',1), ('D5',3),(None,1),
            ('A5',1),('G5',.5),('F5',.5),('E5',1),('D5',1), ('Bb4',1),('C5',1),('D5',2),
            ('G5',1),('F5',.5),('E5',.5),('D5',1),('E5',1), ('C#5',3),(None,1)]
    for rep in range(2):
        for i, c in enumerate(prog):
            b = (rep*8 + i)*4; r = p(root[c])
            for k in range(8): N.append((b + k*.5, .45, r + (12 if k % 4 == 3 else 0), 92 if k % 2 == 0 else 74, 0))
        t = rep*32
        for n, d in tune:
            if n: N.append((t, d*.95, p(n), 100, 1))
            t += d
        N += drums(8, [(0,'k'),(.5,'k'),(1,'s'),(2,'k'),(2.5,'k'),(3,'s'),(3.5,'s')], start=rep*32)
    write('rd-simulant-march.mid', 138, N)

# 3. Holly's Lullaby: slow and a bit lost, for the strange places
def holly_lullaby():
    N = []; prog = [('A2',['A3','C4','E4']),('F2',['F3','A3','C4']),('C3',['C4','E4','G4']),('G2',['G3','B3','D4']),
                    ('A2',['A3','C4','E4']),('D3',['D4','F4','A4']),('E2',['E3','G#3','B3']),('E2',['E3','G#3','B3'])]
    mel = [('E5',2),('D5',1),('C5',1), ('A4',3),(None,1), ('G4',1),('C5',1),('E5',2), ('D5',4),
           ('E5',1),('F5',1),('E5',1),('C5',1), ('A4',2),('D5',2), ('B4',2),('G#4',2), ('A4',4)]
    for rep in range(2):
        for i, (bass, ch) in enumerate(prog):
            b = (rep*8 + i)*4; N.append((b, 4, p(bass), 70, 0))
            for k in range(8): N.append((b + k*.5, .6, p(ch[[0,1,2,1][k % 4]]) + (12 if k >= 4 and rep else 0), 46, 1))
        t = rep*32
        for n, d in mel:
            if n: N.append((t, d*.9, p(n) + (0 if rep == 0 else 12 if d >= 2 else 0), 70, 2))
            t += d
    write('rd-holly-lullaby.mid', 66, N)

# 4. Cat Strut: funky and pleased with itself, for the hangar
def cat_strut():
    N = []; riff = [(0,'G2',.4),(.75,'G2',.2),(1,'Bb2',.4),(1.5,'C3',.4),(2.25,'G2',.2),(2.5,'F2',.4),(3,'G2',.3),(3.5,'D3',.3)]
    hits = [(.5,['F4','A4','D5']),(1.75,['F4','A4','D5']),(3.25,['F4','Bb4','D5'])]
    lick = [[(0,'D5',.5),(.5,'F5',.25),(.75,'G5',.75),(2,'Bb5',.5),(2.5,'G5',.5),(3,'F5',1)],
            [(0,'G5',.25),(.25,'F5',.25),(.5,'D5',.5),(1,'C5',.5),(1.5,'Bb4',.5),(2,'G4',2)]]
    for bar in range(16):
        b = bar*4; tr = 5 if bar % 8 in (4, 5) else 0
        for o, n, d in riff: N.append((b + o, d, p(n) + tr, 96, 0))
        for o, ch in hits:
            for n in ch: N.append((b + o, .2, p(n) + tr, 58, 1))
        if bar % 2 == 1:
            for o, n, d in lick[(bar//2) % 2]: N.append((b + o, d, p(n) + tr, 90, 2))
    N += drums(16, [(0,'k'),(.5,'h'),(.75,'k'),(1,'s'),(1.5,'h'),(2,'h'),(2.5,'k'),(3,'s'),(3.5,'h'),(3.75,'h')])
    write('rd-cat-strut.mid', 104, N)

# 5. Skutter Shuffle: a busy little tune, for the shopping and tidying
def skutter_shuffle():
    N = []; prog = ['C','Am','F','G','C','Am','Dm','G']
    root = {'C':'C3','Am':'A2','F':'F2','G':'G2','Dm':'D3'}
    tone = {'C':['C5','E5','G5'],'Am':['A4','C5','E5'],'F':['F4','A4','C5'],'G':['G4','B4','D5'],'Dm':['D5','F5','A5']}
    for rep in range(2):
        for i, c in enumerate(prog):
            b = (rep*8 + i)*4; r = p(root[c])
            for k in range(4): N.append((b + k, .5, r - (12 if k % 2 else 0) + 0, 80, 0))
            seq = [0,1,2,1,0,2,1,2] if rep == 0 else [2,1,0,1,2,0,1,0]
            for k, s in enumerate(seq): N.append((b + k*.5, .4, p(tone[c][s]), 72 if k % 2 else 86, 1))
        N += drums(8, [(0,'k'),(1,'h'),(2,'s'),(3,'h')], start=rep*32)
    write('rd-skutter-shuffle.mid', 126, N)

for f in (curry_blues, simulant_march, holly_lullaby, cat_strut, skutter_shuffle): f()
