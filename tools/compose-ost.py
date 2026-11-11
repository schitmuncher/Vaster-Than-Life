#!/usr/bin/env python3
"""The Vaster Than Life soundtrack: eighteen original tunes, written as MIDI and played by the game's own synth
(js/midi.js, with the instruments set per track in MIDI_STYLES). Run: python3 tools/compose-ost.py  (writes music/).

Channels: 0 bass, 1 chords/pad, 2 lead, 3 arpeggio/counter-melody, 4 bells/harmony, 9 drums
(36 kick, 38 snare, 39 clap, 37 rim, 42 closed hat, 46 open hat, 49 crash, 51 ride, 45/47/50 toms, 70 shaker).

Melodies are written as scale degrees: "4:1.5 3:.5 2:1 0:1 | ..." means degree 4 for 1.5 beats, then degree 3 for half
a beat and so on; 0 is the key note, 7 an octave up, -1 the note below; 'r' is a rest; '#' or 'b' after a degree
sharpens or flattens it; '|' is only there to make bars easier to read."""
import base64, json, os, random, struct
OUT = os.path.join(os.path.dirname(__file__), '..', 'music'); os.makedirs(OUT, exist_ok=True)
SCALES = { 'major':[0,2,4,5,7,9,11], 'minor':[0,2,3,5,7,8,10], 'dorian':[0,2,3,5,7,9,10], 'mixo':[0,2,4,5,7,9,10],
  'phrygian':[0,1,3,5,7,8,10], 'harmonic':[0,2,3,5,7,8,11], 'lydian':[0,2,4,6,7,9,11], 'phrydom':[0,1,4,5,7,8,10] }
NOTE = {'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11}

class Song:
    def __init__(s, name, key, scale, bpm, beats=4, seed=1):
        s.name, s.root, s.sc, s.bpm, s.beats = name, 48 + NOTE[key], SCALES[scale], bpm, beats; s.notes = []; s.bar = 0; s.rnd = random.Random(seed); s.chordAt = {}
    def p(s, deg, octave=0, acc=0):   # scale degree -> MIDI pitch (octave 0 = the octave starting at C3 + key)
        o, i = divmod(deg, 7); return s.root + 12*(o + octave) + s.sc[i] + acc
    def n(s, beat, dur, pitch, vel, ch):
        top = { 2:96, 3:93, 4:93, 1:88 }.get(ch)   # keep the high parts out of the shrill range
        while top and pitch > top: pitch -= 12
        if 0 <= pitch <= 127 and dur > 0: s.notes.append((s.bar*s.beats + beat, dur, pitch, max(1, min(127, int(vel))), ch))
    def chord(s, d, sev=False): return [d, d + 2, d + 4] + ([d + 6] if sev else [])

def parse(mel):
    out = []
    for tok in mel.replace('|', ' ').split():
        d, l = tok.split(':'); acc = 0
        if d.endswith('#'): acc, d = 1, d[:-1]
        elif d.endswith('b') and d != 'b': acc, d = -1, d[:-1]
        out.append((None if d == 'r' else int(d), float(l), acc))
    return out

# ---------------- parts ----------------
def bass(s, deg, style, vel=92, bars=1):
    b = s.beats; r = s.p(deg, -1) if s.p(deg, -1) >= 33 else s.p(deg)
    for k in range(bars):
        s0 = k*b
        if style == 'pulse':      [s.n(s0 + i*.5, .45, r, vel - (i % 2)*14, 0) for i in range(b*2)]
        elif style == 'octave':   [s.n(s0 + i*.5, .4, r + (12 if i % 2 else 0), vel - (i % 2)*10, 0) for i in range(b*2)]
        elif style == 'gallop':   [s.n(s0 + i + o, l, r, vel - (8 if o else 0), 0) for i in range(b) for o, l in ((0, .45), (.5, .22), (.75, .22))]
        elif style == 'root':     s.n(s0, b*.95, r, vel, 0)
        elif style == 'half':     [s.n(s0 + i*2, 1.9, r, vel, 0) for i in range(b//2)]
        elif style == 'funk':
            for o, l, iv in ((0, .4, 0), (.75, .2, 0), (1.5, .3, 12), (2, .4, 0), (2.5, .2, 7), (3, .3, 10), (3.5, .3, 12)): s.n(s0 + o, l, r + iv, vel - (0 if o in (0, 2) else 12), 0)
        elif style == 'walk':
            steps = [0, 2, 4, 5] if s.sc[2] == 4 else [0, 2, 4, 6]
            for i in range(b): s.n(s0 + i, .85, s.p(deg + steps[i % 4] if i < 3 else deg + 5, -1) if s.p(deg, -1) >= 33 else s.p(deg + steps[i % 4]), vel - (i % 2)*8, 0)
        elif style == 'bossa':    [s.n(s0 + o, l, r + iv, vel, 0) for o, l, iv in ((0, 1.4, 0), (1.5, .45, 7), (2, 1.4, 7), (3.5, .45, 0))]
        elif style == 'waltz':    s.n(s0, b*.9, r, vel, 0)
        elif style == 'synth':    [s.n(s0 + i*.25, .2, r + (12 if i % 4 == 2 else 0), vel - (i % 2)*16, 0) for i in range(b*4)]
def chords(s, deg, style, vel=58, sev=False, octave=1, bars=1):
    ps = [s.p(d, octave) for d in s.chord(deg, sev)]; b = s.beats
    for k in range(bars):
        s0 = k*b
        if style == 'pad':        [s.n(s0, b*.98, p, vel, 1) for p in ps]
        elif style == 'stabs':    [s.n(s0 + o, .3, p, vel + 6, 1) for o in (.5, 1.75, 3.25) for p in ps]
        elif style == 'offbeat':  [s.n(s0 + i + .5, .35, p, vel, 1) for i in range(b) for p in ps]
        elif style == 'pump':     [s.n(s0 + i*.5, .4, p, vel - (0 if i % 2 else 14), 1) for i in range(b*2) for p in ps]
        elif style == 'bossa':    [s.n(s0 + o, .45, p, vel, 1) for o in (0, 1.5, 2.5, 3.5) for p in ps]
        elif style == 'waltz':    [s.n(s0 + i, .7, p, vel - 6, 1) for i in (1, 2) for p in ps]
        elif style == 'swell':    [s.n(s0, b*2*.98, p, vel, 1) for p in ps] if k % 2 == 0 else None
def arp(s, deg, pattern, vel=54, octave=1, rate=.25, ch=3, sev=True, bars=1):
    ps = [s.p(d, octave) for d in s.chord(deg, sev)]; seqs = { 'up':[0,1,2,3], 'updown':[0,1,2,3,2,1], 'down':[3,2,1,0], 'broken':[0,2,1,3,2,0,3,1], 'pulse':[0,0,1,0,2,0,1,0] }
    seq = seqs[pattern]; steps = int(s.beats/rate)
    for k in range(bars):
        for i in range(steps): s.n(k*s.beats + i*rate, rate*.9, ps[seq[i % len(seq)] % len(ps)] + (12 if (i // len(seq)) % 2 and pattern in ('up', 'updown') else 0), vel - (i % 2)*10, ch)
def fit(s, t, pitch, dur):
    """a held note on the beat that rubs a semitone against the chord moves to the nearest chord note"""
    deg = s.chordAt.get(s.bar + int(t // s.beats))
    if deg is None or t % 1 or dur < .75: return pitch
    tones = [s.p(d) % 12 for d in s.chord(deg)]
    if not any((pitch - q) % 12 in (1, 11) for q in tones): return pitch
    best = min((pitch + k for k in range(-4, 5) if (pitch + k) % 12 in tones), key=lambda q: (abs(q - pitch), q < pitch))
    return best
def melody(s, mel, octave=1, vel=88, ch=2, start=0, shift=0, legato=.95, harm=None):
    t = start
    for d, l, acc in parse(mel):
        if d is not None:
            s.n(t, l*legato, fit(s, t, s.p(d + shift, octave, acc), l), vel + (6 if t % s.beats == 0 else 0), ch)
            if harm is not None: s.n(t, l*legato, fit(s, t, s.p(d + shift + harm, octave, acc), l), vel - 26, 4)
        t += l
    return t
DRUMS = {
  'rock':   [(0,36),(1,38),(2,36),(2.5,36),(3,38)] + [(i*.5,42) for i in range(8)],
  'half':   [(0,36),(2,38),(3.5,36)] + [(i*.5,42) for i in range(8)],
  'four':   [(0,36),(1,36),(2,36),(3,36),(1,39),(3,39)] + [(i+.5,46) for i in range(4)],
  'disco':  [(0,36),(1,36),(2,36),(3,36),(1,38),(3,38)] + [(i*.5,42) for i in range(8)] + [(i+.5,46) for i in range(4)],
  'shuffle':[(0,36),(1,38),(2,36),(3,38),(2.66,36)] + [(i + o,42) for i in range(4) for o in (0, .66)],
  'march':  [(0,36),(1,38),(2,36),(3,38),(3.5,38),(3.75,38)] + [(i*.5,42) for i in range(8)],
  'gallop': [(0,36),(.75,36),(1,38),(2,36),(2.75,36),(3,38)] + [(i*.5,42) for i in range(8)],
  'break':  [(0,36),(.75,36),(1,38),(1.75,38),(2.5,36),(3,38),(3.75,38)] + [(i*.25,42) for i in range(16)],
  'boss':   [(0,36),(.5,36),(1,38),(2,36),(2.5,36),(3,45),(3.25,47),(3.5,50),(3.75,50)] + [(i*.5,51) for i in range(8)],
  'bossa':  [(0,36),(1.5,36),(2,36),(3.5,36),(0,37),(.75,37),(1.75,37),(2.5,37),(3.25,37)] + [(i*.5,70) for i in range(8)],
  'brush':  [(0,36),(2,36)] + [(i,51) for i in range(4)] + [(1,37),(3,37)],
  'waltz':  [(0,36),(1,42),(2,42)],
  'pulse':  [(0,36),(2,36)] + [(i*.5,42) for i in range(1,8,2)],
  'toms':   [(0,45),(1.5,47),(2.5,50),(3,45)],
  'fill':   [(0,38),(.5,38),(1,45),(1.5,45),(2,47),(2.5,47),(3,50),(3.25,50),(3.5,38),(3.75,38)] }
def drums(s, style, vel=88, bars=1, crash=False):
    for k in range(bars):
        for o, n in DRUMS[style]:
            if o >= s.beats: continue
            s.n(k*s.beats + o, .2, n, vel - (28 if n in (42, 70, 51, 37) else 0) - (10 if (o*2) % 2 else 0), 9)
        if crash and k == 0: s.n(0, 1, 49, vel, 9)

def write(s):
    tpb = 480; ev = []
    for b, d, n, v, ch in s.notes:
        t0, t1 = int(round(b*tpb)), int(round((b + d)*tpb)) - 6
        ev.append((t0, 1, bytes([0x90 | ch, n, v]))); ev.append((max(t0 + 10, t1), 0, bytes([0x80 | ch, n, 0])))
    ev.sort(key=lambda e: (e[0], e[1]))
    trk = bytearray(b'\x00\xff\x51\x03' + struct.pack('>I', int(60e6/s.bpm))[1:]); last = 0
    for t, _, data in ev: trk += vlq(t - last) + data; last = t
    end = s.bar*s.beats*tpb; trk += vlq(max(0, end - last)) + b'\xff\x2f\x00'
    mid = b'MThd' + struct.pack('>IHHH', 6, 0, 1, tpb) + b'MTrk' + struct.pack('>I', len(trk)) + bytes(trk)
    path = os.path.join(OUT, s.name + '.mid'); open(path, 'wb').write(mid); json.dump({ 'base64':base64.b64encode(mid).decode() }, open(path + '.json', 'w'))
    secs = s.bar*s.beats*60/s.bpm; print(f'{s.name:22} {s.bar:3} bars {secs/60:4.1f} min {len(s.notes):5} notes'); return secs
def vlq(n):
    out = [n & 0x7f]; n >>= 7
    while n: out.insert(0, (n & 0x7f) | 0x80); n >>= 7
    return bytes(out)

VARY_ARP = { 'up':'updown', 'updown':'broken', 'broken':'up', 'down':'updown', 'pulse':'broken' }
def play(s, plan, again=True):
    """plan: list of sections; each is (progression, bars per chord, parts dict). Parts take the chord's degree.
    With again, the middle sections come round a second time, varied (melody up an octave or harmonised, a
    different arpeggio, busier drums), so the loop is longer and doesn't repeat note for note."""
    _play(s, plan)
    if again and len(plan) > 2:
        mid = []
        for prog, per, P in plan[1:-1]:
            Q = dict(P)
            if 'mel' in Q: Q['mo'] = 2 if Q.get('mo', 1) == 1 else 1; Q['harm'] = None if Q.get('harm') is not None else (-2 if s.sc[2] == 3 else 2)
            if 'arp' in Q: Q['arp'] = VARY_ARP.get(Q['arp'], 'up')
            else: Q['arp'] = 'up'; Q['av'] = 30; Q['ar'] = .5
            mid.append((prog, per, Q))
        _play(s, mid + [plan[-1]])
def _play(s, plan):
    for prog, per, P in plan:
        mel_t = None
        if 'mel' in P: mel_start = s.bar
        for i, deg in enumerate(prog):
            for k in range(per):
                s.chordAt[s.bar] = deg
                if 'bass' in P: bass(s, deg, P['bass'], P.get('bv', 92))
                if 'chords' in P and (P['chords'] != 'swell' or k % 2 == 0): chords(s, deg, P['chords'], P.get('cv', 58), P.get('sev', False), P.get('co', 1), bars=2 if P['chords'] == 'swell' and per >= 2 else 1)
                if 'arp' in P: arp(s, deg, P['arp'], P.get('av', 52), P.get('ao', 1), P.get('ar', .25))
                if 'drums' in P:
                    last = (i == len(prog) - 1 and k == per - 1)
                    drums(s, 'fill' if (last and P.get('fill')) else P['drums'], P.get('dv', 88), crash=(i == 0 and k == 0 and P.get('crash')))
                s.bar += 1
        if 'mel' in P:
            end = s.bar; s.bar = mel_start; melody(s, P['mel'], P.get('mo', 1), P.get('mv', 88), 2, 0, P.get('shift', 0), P.get('leg', .95), P.get('harm')); s.bar = end

tracks = []
def track(fn): tracks.append(fn); return fn

# ======================= the tunes =======================
@track
def title():
    s = Song('title', 'D', 'minor', 104, seed=11)
    A = '4:1.5 3:.5 2:1 0:1 | 2:1.5 3:.5 4:2 | 5:1.5 4:.5 2:1 4:1 | 3:3 r:1 | 4:1.5 3:.5 2:1 0:1 | 2:1.5 3:.5 4:1 7:1 | 6:1.5 5:.5 4:1 3:1 | 4:4'
    B = '7:2 6:1 5:1 | 4:2 2:2 | 5:2 4:1 3:1 | 2:2 0:2 | 3:1.5 4:.5 5:1 6:1 | 7:1.5 6:.5 5:2 | 4:1 5:1 6:1 4#:1 | 4:4'
    play(s, [([0, 5, 2, 6], 1, { 'chords':'pad', 'cv':46, 'bass':'root', 'bv':70 }),
             ([0, 5, 2, 6, 0, 5, 3, 4], 1, { 'chords':'pad', 'bass':'pulse', 'drums':'half', 'dv':74, 'mel':A, 'arp':'updown', 'av':40, 'fill':True }),
             ([5, 3, 0, 4, 5, 3, 6, 4], 1, { 'chords':'pump', 'cv':50, 'bass':'octave', 'drums':'rock', 'crash':True, 'mel':B, 'harm':-2, 'fill':True }),
             ([0, 5, 2, 6, 0, 5, 3, 4], 1, { 'chords':'pump', 'cv':52, 'bass':'octave', 'drums':'rock', 'crash':True, 'mel':A, 'mo':2, 'arp':'broken', 'av':44 }),
             ([0, 5, 3, 4], 1, { 'chords':'pad', 'bass':'root', 'arp':'up', 'av':38 })])
    return s
@track
def hangar():
    s = Song('hangar', 'F', 'mixo', 96, seed=12)
    A = 'r:.5 4:.5 6:.5 7:1 6:.5 4:1 | r:1 2:.5 4:.5 3:1 2:1 | r:.5 4:.5 6:.5 7:1 9:.5 7:1 | 6:2 4:2'
    B = '9:1 8:.5 7:.5 6:1 4:1 | 5:1.5 4:.5 2:2 | 7:1 6:.5 4:.5 3:1 2:1 | 0:3 r:1'
    play(s, [([0, 3, 0, 4], 1, { 'bass':'funk', 'drums':'shuffle', 'dv':70, 'chords':'stabs', 'cv':50, 'sev':True }),
             ([0, 3, 0, 4], 1, { 'bass':'funk', 'drums':'shuffle', 'chords':'stabs', 'sev':True, 'mel':A }),
             ([3, 0, 1, 4], 1, { 'bass':'funk', 'drums':'shuffle', 'chords':'stabs', 'sev':True, 'mel':B, 'harm':2 }),
             ([0, 3, 0, 4], 1, { 'bass':'funk', 'drums':'shuffle', 'chords':'offbeat', 'sev':True, 'mel':A, 'mo':2 }),
             ([3, 4, 0, 0], 1, { 'bass':'walk', 'drums':'brush', 'chords':'pad', 'sev':True, 'cv':42 })])
    return s
@track
def start():
    s = Song('start', 'C', 'lydian', 120, seed=13)
    A = '0:1 4:1 7:2 | 6:1 4:1 5:2 | 3:1 4:1 6:2 | 4:4 | 0:1 4:1 7:2 | 9:1 8:1 7:2 | 6:1 5:1 4:1 6:1 | 7:4'
    play(s, [([0, 1, 0, 1], 1, { 'arp':'pulse', 'av':46, 'ar':.25, 'bass':'root', 'bv':60 }),
             ([0, 1, 5, 4], 1, { 'arp':'up', 'bass':'pulse', 'drums':'pulse', 'dv':70, 'chords':'pad', 'cv':40 }),
             ([0, 1, 5, 4, 0, 1, 3, 4], 1, { 'arp':'updown', 'bass':'octave', 'drums':'four', 'crash':True, 'chords':'pad', 'mel':A, 'fill':True }),
             ([5, 3, 0, 4, 5, 3, 1, 4], 1, { 'arp':'broken', 'bass':'synth', 'bv':80, 'drums':'disco', 'chords':'pump', 'cv':46, 'mel':A, 'mo':2, 'harm':-2 }),
             ([0, 0], 1, { 'chords':'pad', 'bass':'root', 'arp':'up', 'av':36 })])
    return s
@track
def explore1():
    s = Song('explore1', 'G', 'major', 92, seed=14)
    A = '2:1 4:1 5:1.5 4:.5 | 2:2 0:2 | 1:1 2:1 4:1.5 2:.5 | 1:4 | 2:1 4:1 5:1.5 7:.5 | 6:2 4:2 | 3:1 2:1 1:1 2:1 | 0:4'
    B = '5:2 4:1 5:1 | 7:3 6:1 | 5:1 4:1 2:1 4:1 | 3:4 | 2:2 3:1 4:1 | 5:2 4:2 | 2:1.5 1:.5 0:1 1:1 | 1:4'
    play(s, [([0, 4], 2, { 'chords':'pad', 'cv':44, 'bass':'root', 'bv':66, 'arp':'up', 'av':36, 'ar':.5 }),
             ([0, 4, 5, 3, 0, 4, 3, 0], 1, { 'chords':'pad', 'bass':'half', 'drums':'half', 'dv':60, 'mel':A, 'arp':'up', 'av':34, 'ar':.5 }),
             ([3, 4, 5, 2, 3, 4, 1, 4], 1, { 'chords':'offbeat', 'cv':44, 'bass':'half', 'drums':'half', 'dv':66, 'mel':B, 'harm':2 }),
             ([0, 4, 5, 3, 0, 4, 3, 0], 1, { 'chords':'pad', 'bass':'pulse', 'bv':72, 'drums':'rock', 'dv':66, 'mel':A, 'mo':2, 'arp':'updown', 'av':34 })])
    return s
@track
def explore2():
    s = Song('explore2', 'E', 'dorian', 110, seed=15)
    A = '4:.5 r:.5 4:.5 5:.5 6:1 4:1 | 3:1 2:1 0:2 | 4:.5 r:.5 4:.5 5:.5 6:1 7:1 | 8:2 6:2'
    B = '7:1.5 6:.5 5:1 4:1 | 5:1.5 4:.5 3:2 | 2:1 3:1 4:1 6:1 | 4:4'
    play(s, [([0, 3], 2, { 'arp':'broken', 'av':44, 'bass':'pulse', 'bv':70 }),
             ([0, 3, 0, 3], 1, { 'arp':'broken', 'bass':'pulse', 'drums':'pulse', 'dv':66, 'mel':A, 'chords':'pad', 'cv':36 }),
             ([5, 6, 3, 4], 1, { 'arp':'updown', 'bass':'octave', 'drums':'rock', 'dv':70, 'mel':B, 'chords':'pad', 'cv':40 }),
             ([0, 3, 0, 3], 1, { 'arp':'broken', 'bass':'octave', 'drums':'rock', 'dv':72, 'mel':A, 'mo':2, 'harm':-2, 'chords':'pad' }),
             ([5, 6, 3, 4], 1, { 'arp':'up', 'bass':'pulse', 'drums':'pulse', 'mel':B, 'chords':'pad' })])
    return s
@track
def explore3():   # Drift: no drums, slow chords, a bell line
    s = Song('explore3', 'Ab', 'lydian', 70, seed=16)
    A = '4:3 3:1 | 2:4 | 1:2 2:1 4:1 | 0:4 | 4:2 6:2 | 7:3 6:1 | 4:2 3:1 1:1 | 2:4'
    play(s, [([0, 1], 2, { 'chords':'swell', 'cv':44, 'bass':'root', 'bv':54, 'sev':True }),
             ([0, 1, 5, 4, 0, 1, 3, 4], 1, { 'chords':'pad', 'cv':40, 'sev':True, 'bass':'root', 'bv':54, 'mel':A, 'mv':70, 'arp':'up', 'av':30, 'ar':.5 }),
             ([3, 1, 0, 4], 2, { 'chords':'swell', 'cv':42, 'sev':True, 'bass':'root', 'bv':50, 'arp':'updown', 'av':28, 'ar':.5 }),
             ([0, 1, 5, 4, 0, 1, 3, 0], 1, { 'chords':'pad', 'sev':True, 'bass':'root', 'bv':54, 'mel':A, 'mo':2, 'mv':64, 'harm':2 })])
    return s
@track
def explore4():   # Quiet Stars: a waltz
    s = Song('explore4', 'A', 'minor', 84, beats=3, seed=17)
    A = '4:2 3:1 | 2:2 0:1 | 1:1.5 2:.5 3:1 | 2:3 | 4:2 5:1 | 6:2 4:1 | 3:1 2:1 1:1 | 0:3'
    B = '7:2 6:1 | 5:2 4:1 | 5:1 4:1 2:1 | 4:3 | 3:2 2:1 | 1:2 3:1 | 2:1 1:1 -1:1 | 0:3'
    play(s, [([0, 3, 0, 4], 1, { 'bass':'waltz', 'bv':62, 'chords':'waltz', 'cv':40, 'drums':'waltz', 'dv':48 }),
             ([0, 3, 6, 2, 0, 3, 4, 0], 1, { 'bass':'waltz', 'bv':64, 'chords':'waltz', 'cv':42, 'drums':'waltz', 'dv':50, 'mel':A, 'mv':76 }),
             ([5, 3, 6, 2, 5, 3, 4, 4], 1, { 'bass':'waltz', 'chords':'waltz', 'drums':'waltz', 'dv':54, 'mel':B, 'mv':76, 'harm':-2 }),
             ([0, 3, 6, 2, 0, 3, 4, 0], 1, { 'bass':'waltz', 'chords':'waltz', 'drums':'waltz', 'mel':A, 'mo':2, 'mv':70, 'arp':'up', 'av':26, 'ar':.5 })])
    return s
@track
def explore5():   # Engine Room: a groove
    s = Song('explore5', 'B', 'dorian', 116, seed=18)
    A = 'r:.5 0:.5 2:.5 3:.5 4:1 3:.5 2:.5 | 0:1.5 -2:.5 0:2 | r:.5 0:.5 2:.5 3:.5 4:1 6:.5 7:.5 | 5:2 4:2'
    B = '7:.5 6:.5 5:.5 4:.5 5:1 4:1 | 2:1.5 3:.5 4:2 | 5:.5 4:.5 3:.5 2:.5 3:1 2:1 | 0:4'
    play(s, [([0, 3], 2, { 'bass':'funk', 'bv':84, 'drums':'shuffle', 'dv':72 }),
             ([0, 3, 0, 3], 1, { 'bass':'funk', 'drums':'shuffle', 'chords':'stabs', 'cv':48, 'sev':True, 'mel':A }),
             ([5, 4, 3, 4], 1, { 'bass':'funk', 'drums':'shuffle', 'chords':'stabs', 'sev':True, 'mel':B, 'harm':2 }),
             ([0, 3, 0, 3], 1, { 'bass':'funk', 'drums':'disco', 'dv':76, 'chords':'offbeat', 'sev':True, 'mel':A, 'mo':2, 'arp':'pulse', 'av':36 }),
             ([5, 4, 3, 4], 1, { 'bass':'funk', 'drums':'shuffle', 'chords':'stabs', 'sev':True, 'mel':B })])
    return s
@track
def strange1():   # Nebula Hymn
    s = Song('strange1', 'C', 'harmonic', 64, seed=19)
    A = '0:2 1:1 2:1 | 3:3 2:1 | 1:2 0:1 -1:1 | 0:4 | 4:2 5:1 4:1 | 3:2 2:2 | 1:1 2:1 3:1 1:1 | -1:4'
    play(s, [([0, 5], 2, { 'chords':'swell', 'cv':40, 'bass':'root', 'bv':48 }),
             ([0, 5, 3, 4, 0, 5, 1, 4], 1, { 'chords':'pad', 'cv':40, 'bass':'root', 'bv':50, 'mel':A, 'mv':66, 'mo':1 }),
             ([3, 0, 5, 4], 2, { 'chords':'swell', 'cv':42, 'bass':'root', 'bv':48, 'arp':'down', 'av':26, 'ar':.5, 'ao':2 }),
             ([0, 5, 3, 4, 0, 5, 1, 4], 1, { 'chords':'pad', 'cv':40, 'bass':'root', 'mel':A, 'mv':60, 'mo':2, 'harm':-2, 'drums':'toms', 'dv':44 })])
    return s
@track
def strange2():   # Static
    s = Song('strange2', 'F#', 'phrygian', 76, seed=20)
    A = '0:1 1:1 0:2 | r:2 -2:1 -1:1 | 0:1 1:1 3:1 1:1 | 0:4 | 4:1 3:1 1:2 | r:2 1:1 3:1 | 4:1 5:1 4:1 1:1 | 0:4'
    play(s, [([0, 1], 2, { 'arp':'pulse', 'av':36, 'ar':.25, 'bass':'root', 'bv':54 }),
             ([0, 1, 0, 6, 0, 1, 5, 6], 1, { 'arp':'broken', 'av':34, 'bass':'half', 'bv':58, 'mel':A, 'mv':64, 'drums':'toms', 'dv':46 }),
             ([5, 1, 6, 0], 2, { 'arp':'pulse', 'av':32, 'chords':'swell', 'cv':38, 'bass':'root', 'bv':54 }),
             ([0, 1, 0, 6, 0, 1, 5, 6], 1, { 'arp':'broken', 'av':34, 'bass':'half', 'mel':A, 'mv':60, 'mo':2, 'drums':'pulse', 'dv':50, 'chords':'pad', 'cv':30 })])
    return s
@track
def combat1():   # Shields Up
    s = Song('combat1', 'A', 'minor', 140, seed=21)
    A = '0:1 0:.5 2:.5 4:1 2:1 | 3:1 2:.5 1:.5 2:2 | 0:1 0:.5 2:.5 4:1 7:1 | 6:2 4:2 | 5:1 4:.5 3:.5 4:1 2:1 | 3:1 2:.5 1:.5 -1:2 | 0:1 2:1 4:1 6:1 | 4:4'
    B = '7:2 6:1 7:1 | 4:2 2:2 | 5:2 4:1 5:1 | 2:2 0:2 | 3:1 4:1 5:1 6:1 | 7:1 6:1 5:1 4:1 | 3:2 4#:2 | 4:4'
    play(s, [([0, 0], 1, { 'bass':'pulse', 'bv':96, 'drums':'rock', 'dv':86, 'fill':True }),
             ([0, 5, 3, 4, 0, 5, 6, 4], 1, { 'bass':'pulse', 'drums':'rock', 'chords':'pump', 'cv':44, 'mel':A, 'crash':True, 'fill':True }),
             ([5, 6, 0, 0, 3, 4, 5, 4], 1, { 'bass':'octave', 'drums':'rock', 'chords':'pump', 'cv':48, 'mel':B, 'harm':-2, 'crash':True, 'arp':'up', 'av':40 }),
             ([0, 5, 3, 4, 0, 5, 6, 4], 1, { 'bass':'pulse', 'drums':'rock', 'chords':'pump', 'mel':A, 'mo':2, 'crash':True, 'arp':'broken', 'av':40, 'fill':True })])
    return s
@track
def combat2():   # Boarding Party
    s = Song('combat2', 'D', 'phrydom', 150, seed=22)
    A = '0:.5 1:.5 2:1 1:.5 0:.5 -1:1 | 0:2 r:1 4:1 | 5:.5 4:.5 2:1 1:.5 2:.5 4:1 | 2:4 | 0:.5 1:.5 2:1 4:1 5:1 | 4:1 2:1 1:2 | 2:.5 1:.5 0:1 -1:1 -2:1 | 0:4'
    play(s, [([0], 2, { 'bass':'gallop', 'bv':94, 'drums':'gallop', 'dv':84 }),
             ([0, 1, 0, 6, 0, 1, 5, 0], 1, { 'bass':'gallop', 'drums':'gallop', 'chords':'stabs', 'cv':48, 'mel':A, 'crash':True, 'fill':True }),
             ([3, 1, 0, 6, 5, 1, 6, 0], 1, { 'bass':'gallop', 'drums':'gallop', 'chords':'pump', 'cv':44, 'mel':A, 'mo':2, 'harm':2, 'crash':True, 'fill':True }),
             ([0, 1, 0, 6], 1, { 'bass':'gallop', 'drums':'march', 'arp':'broken', 'av':44 })])
    return s
@track
def combat3():   # Red Alert
    s = Song('combat3', 'E', 'minor', 132, seed=23)
    A = '4:1.5 3:.5 4:1 7:1 | 6:2 4:2 | 3:1.5 2:.5 3:1 6:1 | 4:4 | 4:1.5 3:.5 4:1 7:1 | 9:2 7:2 | 8:1 7:1 6:1 5:1 | 4:4'
    play(s, [([0, 5, 2, 6], 1, { 'bass':'synth', 'bv':84, 'arp':'up', 'av':42, 'drums':'pulse', 'dv':72 }),
             ([0, 5, 2, 6, 0, 5, 3, 4], 1, { 'bass':'synth', 'arp':'updown', 'av':40, 'drums':'disco', 'dv':84, 'chords':'pad', 'cv':40, 'mel':A, 'crash':True, 'fill':True }),
             ([3, 4, 5, 6, 3, 4, 2, 4], 1, { 'bass':'octave', 'arp':'broken', 'av':42, 'drums':'four', 'chords':'pump', 'cv':44, 'mel':A, 'shift':-2, 'harm':2 }),
             ([0, 5, 2, 6, 0, 5, 3, 4], 1, { 'bass':'synth', 'arp':'updown', 'drums':'disco', 'chords':'pad', 'mel':A, 'mo':2, 'crash':True })])
    return s
@track
def combat4():   # Dogfight
    s = Song('combat4', 'G', 'minor', 156, seed=24)
    A = '7:.5 6:.5 4:.5 2:.5 4:1 0:1 | 2:.5 3:.5 4:.5 6:.5 7:2 | 9:.5 7:.5 6:.5 4:.5 6:1 2:1 | 4:4 | 7:.5 6:.5 4:.5 2:.5 4:1 0:1 | 3:.5 4:.5 6:.5 7:.5 9:2 | 8:1 7:1 6:1 5:1 | 7:4'
    play(s, [([0, 6], 1, { 'bass':'synth', 'bv':86, 'drums':'break', 'dv':82, 'arp':'broken', 'av':42 }),
             ([0, 6, 5, 4, 0, 6, 3, 4], 1, { 'bass':'synth', 'drums':'break', 'arp':'broken', 'av':40, 'chords':'stabs', 'cv':44, 'mel':A, 'crash':True, 'fill':True }),
             ([5, 3, 0, 4, 5, 3, 6, 4], 1, { 'bass':'octave', 'drums':'break', 'arp':'updown', 'av':42, 'chords':'pump', 'cv':42, 'mel':A, 'mo':2, 'shift':-2, 'crash':True, 'fill':True }),
             ([0, 6, 5, 4], 1, { 'bass':'synth', 'drums':'four', 'arp':'up', 'av':44 })])
    return s
@track
def boss():   # Flaggship
    s = Song('boss', 'C', 'harmonic', 120, seed=25)
    A = '0:2 -1:1 0:1 | 2:2 1:1 0:1 | -1:2 -2:1 -1:1 | -3:4 | 0:2 2:1 4:1 | 5:2 4:1 2:1 | 3:2 2:1 1:1 | -1:4'
    B = '7:3 6:1 | 5:3 4:1 | 5:2 4:1 2:1 | 4:4 | 3:3 2:1 | 1:3 0:1 | 1:2 2:1 -1:1 | 0:4'
    play(s, [([0, 0], 1, { 'bass':'half', 'bv':96, 'drums':'toms', 'dv':84, 'chords':'pad', 'cv':40, 'co':0 }),
             ([0, 5, 3, 4, 0, 5, 1, 4], 1, { 'bass':'octave', 'bv':96, 'drums':'boss', 'dv':88, 'chords':'pump', 'cv':50, 'co':0, 'mel':A, 'mo':1, 'crash':True, 'fill':True }),
             ([5, 3, 4, 0, 5, 3, 1, 4], 1, { 'bass':'gallop', 'drums':'boss', 'chords':'pad', 'cv':48, 'mel':B, 'harm':-2, 'arp':'down', 'av':42, 'crash':True, 'fill':True }),
             ([0, 5, 3, 4, 0, 5, 1, 4], 1, { 'bass':'octave', 'drums':'boss', 'chords':'pump', 'cv':52, 'co':0, 'mel':A, 'mo':2, 'arp':'broken', 'av':44, 'crash':True })])
    return s
@track
def store():   # Haggle Bossa
    s = Song('store', 'Bb', 'major', 108, seed=26)
    A = '4:1.5 2:.5 3:1 4:1 | 5:1.5 4:.5 2:2 | 3:1.5 1:.5 2:1 3:1 | 4:3 r:1 | 4:1.5 2:.5 3:1 4:1 | 6:1.5 5:.5 4:2 | 3:1 2:1 1:1 2:1 | 0:4'
    play(s, [([1, 4], 1, { 'bass':'bossa', 'bv':74, 'drums':'bossa', 'dv':66, 'chords':'bossa', 'cv':44, 'sev':True }),
             ([0, 5, 1, 4, 0, 5, 1, 4], 1, { 'bass':'bossa', 'drums':'bossa', 'chords':'bossa', 'sev':True, 'mel':A, 'mv':80 }),
             ([3, 2, 5, 1, 3, 2, 1, 4], 1, { 'bass':'bossa', 'drums':'bossa', 'chords':'bossa', 'sev':True, 'mel':A, 'mo':2, 'mv':74, 'shift':2, 'harm':-2 }),
             ([0, 5, 1, 4, 0, 5, 1, 0], 1, { 'bass':'bossa', 'drums':'bossa', 'chords':'bossa', 'sev':True, 'mel':A, 'mv':80 })])
    return s
@track
def win():   # Homecoming
    s = Song('win', 'D', 'major', 96, seed=27)
    A = '0:1 2:1 4:2 | 7:2 6:1 4:1 | 5:2 4:1 3:1 | 4:4 | 4:1 5:1 7:2 | 9:2 8:1 7:1 | 8:1 7:1 6:1 8:1 | 7:4'
    play(s, [([0, 4], 1, { 'chords':'pad', 'cv':48, 'bass':'root', 'bv':70, 'arp':'up', 'av':36 }),
             ([0, 4, 5, 3, 0, 4, 3, 4], 1, { 'chords':'pump', 'cv':48, 'bass':'pulse', 'drums':'half', 'dv':70, 'mel':A, 'arp':'updown', 'av':34, 'crash':True, 'fill':True }),
             ([3, 4, 5, 3, 0, 4, 3, 4], 1, { 'chords':'pump', 'cv':52, 'bass':'octave', 'drums':'rock', 'dv':78, 'mel':A, 'mo':2, 'harm':-2, 'crash':True }),
             ([0, 0], 2, { 'chords':'swell', 'cv':46, 'bass':'root', 'arp':'up', 'av':30 })])
    return s
@track
def over():   # Drifting On
    s = Song('over', 'A', 'minor', 66, seed=28)
    A = '4:2 3:1 2:1 | 1:3 0:1 | 2:2 1:1 0:1 | -1:4 | 0:2 2:1 4:1 | 5:3 4:1 | 3:1 2:1 1:1 -1:1 | 0:4'
    play(s, [([0, 5], 2, { 'chords':'swell', 'cv':40, 'bass':'root', 'bv':50 }),
             ([0, 5, 3, 4, 0, 5, 3, 0], 1, { 'chords':'pad', 'cv':38, 'bass':'root', 'bv':50, 'mel':A, 'mv':66, 'leg':1 }),
             ([3, 4, 0, 0], 2, { 'chords':'swell', 'cv':38, 'bass':'root', 'bv':46, 'arp':'down', 'av':24, 'ar':.5 })])
    return s

if __name__ == '__main__':
    total = 0
    for fn in tracks: total += write(fn())
    print(f'{len(tracks)} tracks, {total/60:.1f} minutes')
