#!/usr/bin/env python3
"""Paints the game's backgrounds from noise: title scenes, gallery pieces and the space vistas behind every beacon.
All original, made by this script. Run: python3 tools/paint-backgrounds.py  (writes assets/art/, about a minute)."""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'art'); os.makedirs(OUT, exist_ok=True)
W, H = 1600, 1000

def hexc(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], float)/255
def noise(rng, w, h, scale):
    """smooth, even noise: blurred white noise at a fraction of the size, scaled up"""
    q = max(1., scale/5); gw, gh = int(w/q) + 6, int(h/q) + 6
    g = ndimage.gaussian_filter(rng.random((gh, gw)), 1.6, mode='wrap')
    z = ndimage.zoom(g, (h/(gh - 4), w/(gw - 4)), order=3, mode='wrap'); oy, ox = (z.shape[0] - h)//2, (z.shape[1] - w)//2
    z = z[oy:oy + h, ox:ox + w]; return (z - z.min())/(z.max() - z.min() + 1e-9)
def fbm(rng, w, h, scale, octaves=6, gain=.5):
    out = np.zeros((h, w)); amp = 1; tot = 0
    for o in range(octaves):
        sc = scale/(2**o)
        if sc < 3: break
        out += amp*noise(rng, w, h, sc); tot += amp; amp *= gain
    out /= tot; return (out - out.min())/(out.max() - out.min() + 1e-9)
def ridged(rng, w, h, scale, octaves=5):
    out = np.zeros((h, w)); amp = 1; tot = 0
    for o in range(octaves):
        sc = scale/(2**o)
        if sc < 3: break
        n = 1 - np.abs(noise(rng, w, h, sc)*2 - 1); out += amp*n*n; tot += amp; amp *= .55
    out /= tot; return (out - out.min())/(out.max() - out.min() + 1e-9)
def warp(rng, f, amt):
    h, w = f.shape; dx = (fbm(rng, w, h, 300, 4) - .5)*amt; dy = (fbm(rng, w, h, 300, 4) - .5)*amt
    yy, xx = np.mgrid[0:h, 0:w]; return ndimage.map_coordinates(f, [np.clip(yy + dy, 0, h - 1), np.clip(xx + dx, 0, w - 1)], order=1)
def smooth(x, a, b): t = np.clip((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t)

def sky(rng, base=('#05070f', '#0b1022')):
    yy = np.linspace(0, 1, H)[:, None]; c0, c1 = hexc(base[0]), hexc(base[1])
    img = c0*(1 - yy)[..., None]*np.ones((H, W, 1)) + c1*yy[..., None]*np.ones((H, W, 1)); return img
def nebula(rng, img, cols, strength=1., scale=520, dust=.6, cover=.5):
    base = warp(rng, fbm(rng, W, H, scale, 6), 260)
    detail = fbm(rng, W, H, scale*.18, 5); fil = warp(rng, ridged(rng, W, H, scale*.45, 5), 120)
    dens = smooth(base, 1 - cover, 1.02)*(.45 + .85*detail**1.5)
    wisps = smooth(base, 1 - cover*1.25, 1)*fil**3*.9
    dens = (dens + wisps)*strength
    ramp = [hexc(c) for c in cols]; d2 = np.clip(fbm(rng, W, H, scale*.7, 5)*.7 + dens*.45, 0, 1)
    t = d2*(len(ramp) - 1); i0 = np.clip(np.floor(t).astype(int), 0, len(ramp) - 2); fr = (t - i0)[..., None]
    R = np.array(ramp); tint = R[i0]*(1 - fr) + R[i0 + 1]*fr
    glow = ndimage.gaussian_filter(dens, 26)
    img = img + tint*(dens[..., None]*.8) + R[1]*glow[..., None]*.45
    if dust:
        lanes = smooth(warp(rng, ridged(rng, W, H, scale*.6, 5), 200), .45, .85)*smooth(base, .2, .7)*dust
        img = img*(1 - lanes[..., None]*.8)
    return img
def stars(rng, img, n=2600, glow=26, tint=None):
    lay = np.zeros((H, W, 3)); big = np.zeros((H, W, 3))
    xs, ys = rng.integers(0, W, n), rng.integers(0, H, n); br = rng.pareto(2.6, n)*.18 + .05
    cols = np.array([hexc('#cfe0ff'), hexc('#fff2d8'), hexc('#ffd0a0'), hexc('#bcd4ff'), hexc('#ffffff')])
    cc = cols[rng.integers(0, len(cols), n)]
    for x, y, b, c in zip(xs, ys, br, cc): lay[y, x] += c*min(b, 2.2)
    for k in range(glow):
        x, y = rng.integers(0, W), rng.integers(0, H); c = cols[rng.integers(0, len(cols))]; r = rng.uniform(1.2, 3.2); b = rng.uniform(.6, 1.6)
        big[y, x] += c*b*40*r*rng.uniform(.3, 1.)
    lay = ndimage.gaussian_filter(lay, (.5, .5, 0)) + ndimage.gaussian_filter(big, (2.2, 2.2, 0)) + ndimage.gaussian_filter(big, (9, 9, 0))*.35
    # little cross flares on the brightest
    fl = ndimage.gaussian_filter(big, (.6, 14, 0))*.25 + ndimage.gaussian_filter(big, (14, .6, 0))*.25
    return img + lay + fl
def galaxy(rng, img, cx, cy, r, col, tilt=.45, rot=0., arms=2):
    yy, xx = np.mgrid[0:H, 0:W].astype(float); x = (xx - cx); y = (yy - cy)
    xr = x*math.cos(rot) + y*math.sin(rot); yr = (-x*math.sin(rot) + y*math.cos(rot))/tilt
    rad = np.hypot(xr, yr)/r; ang = np.arctan2(yr, xr)
    spiral = (np.cos(arms*(ang - np.log(rad + 1e-3)*2.8)) + 1)/2
    disc = np.exp(-rad*3.2)*(.35 + .65*spiral**2); core = np.exp(-(rad/.12)**2)*1.4
    mottle = fbm(rng, W, H, 60, 4)
    val = (disc*(.6 + .6*mottle) + core)[..., None]
    return img + val*hexc(col)*.9 + core[..., None]*hexc('#fff3dc')*.6
def planet(rng, img, cx, cy, r, c1, c2, atmo, rings=None, light=(-.6, -.45), bands=True, craters=False):
    yy, xx = np.mgrid[0:H, 0:W].astype(float); x = (xx - cx)/r; y = (yy - cy)/r; d2 = x*x + y*y; inside = d2 < 1
    z = np.sqrt(np.clip(1 - d2, 0, 1)); lx, ly = light; lz = math.sqrt(max(0, 1 - lx*lx - ly*ly))
    lam = np.clip(x*lx + y*ly + z*lz, 0, 1)
    tex = fbm(rng, W, H, r*.35, 6)
    if bands: tex = (np.sin((y*7 + tex*2.2)*math.pi) + 1)/2*.6 + tex*.4
    if craters:
        for k in range(40):
            a, b, s = rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(.02, .12)
            tex -= .25*np.exp(-((x - a)**2 + (y - b)**2)/(s*s))
    col = hexc(c1)[None, None]*(1 - tex[..., None]) + hexc(c2)[None, None]*tex[..., None]
    shade = (lam**.9)[..., None]*1.15 + .03
    rim = np.clip(1 - z, 0, 1)**3*np.clip(lam*1.4 + .15, 0, 1)
    body = col*shade + hexc(atmo)*rim[..., None]*.9
    halo = np.exp(-np.clip(np.sqrt(d2) - 1, 0, None)*14)*(~inside)*np.clip((x*lx + y*ly)*-.2 + .8, 0, 1)
    out = img*(1 - inside[..., None]) + body*inside[..., None] + hexc(atmo)*halo[..., None]*.55
    if rings:
        tilt, inner, outer, rc = rings; ry = (y - x*.18)/tilt; rr = np.hypot(x, ry)
        band = ((rr > inner) & (rr < outer)).astype(float)*(.55 + .45*np.sin(rr*55)**2)
        behind = (ry < 0) & inside; front = band*(~behind)
        shadow = np.clip(1 - ((x*lx + y*ly) < -.2)*.0, 0, 1)
        out = out*(1 - front[..., None]*.8) + hexc(rc)*front[..., None]*.8*np.clip(.35 + (x*-lx + 1)*.4, .2, 1)[..., None]
    return out
def black_hole(rng, img, cx, cy, r):
    yy, xx = np.mgrid[0:H, 0:W].astype(float); x = (xx - cx)/r; y = (yy - cy)/r; d = np.hypot(x, y)
    dy = y/.16; dd = np.hypot(x, dy)
    swirl = ridged(rng, W, H, 30, 4)*.6 + .4
    disk = np.exp(-((dd - 2.4)/1.1)**2)*(dd > 1.15)*swirl*np.clip(1.25 - x*.22, .35, 1.7)   # the near side brighter
    # the far side of the disk, bent up over the top by the hole's gravity
    arc = np.exp(-((d - 1.32)/.09)**2)*np.clip(-y*1.6 + .2, 0, 1)*.9 + np.exp(-((d - 1.32)/.09)**2)*np.clip(y*1.6 + .2, 0, 1)*.35
    hot = disk[..., None]*(hexc('#ff8a3a')*.9 + hexc('#ffe2b0')*disk[..., None]*.6) + arc[..., None]*hexc('#ffd9a8')
    bloom = ndimage.gaussian_filter(disk + arc, 10)[..., None]*hexc('#ff9a50')*.6
    shadow = smooth(d, .95, 1.25)
    out = (img + hot*1.1 + bloom)*shadow[..., None]
    return out
def nebula_cloud_light(img, cx, cy, r, col, amt=.7):
    yy, xx = np.mgrid[0:H, 0:W].astype(float); g = np.exp(-(((xx - cx)**2 + (yy - cy)**2)/(r*r)))
    return img + hexc(col)*g[..., None]*amt
def finish(img, name, vignette=.55, left=0., grain=.012, rng=None, q=84):
    yy, xx = np.mgrid[0:H, 0:W].astype(float); vx = (xx/W - .5); vy = (yy/H - .5)
    img = img*(1 - vignette*(vx*vx + vy*vy)*1.6)[..., None]
    if left: img = img*(1 - left*np.clip(1 - xx/(W*.62), 0, 1)**1.6)[..., None]
    img = 1 - np.exp(-img*1.25)   # soft tone curve: no hard clipping on bright cores
    if rng is not None: img = img + (rng.random((H, W, 1)) - .5)*grain
    im = Image.fromarray(np.clip(img*255, 0, 255).astype(np.uint8)); im.save(os.path.join(OUT, name + '.jpg'), quality=q, optimize=True, progressive=True)
    print(name, os.path.getsize(os.path.join(OUT, name + '.jpg'))//1024, 'KB')

PIECES = {}
def piece(fn): PIECES[fn.__name__] = fn; return fn
# ---------- title scenes (dark on the left, where the menu sits) ----------
@piece
def title1(rng):
    img = sky(rng); img = nebula(rng, img, ['#3a1d5c', '#b24a6e', '#ffb547', '#ffe2a8'], 1.1, 560, .55, .55); img = stars(rng, img, 2400, 30)
    img = planet(rng, img, 1230, 520, 300, '#2b1d3a', '#a5603f', '#ffb06a', rings=(.24, 1.35, 2.05, '#e8c79a'))
    img = planet(rng, img, 860, 210, 46, '#3a4a6a', '#8fb7d9', '#9fd3ff', bands=False, craters=True)
    finish(img, 'title1', left=.55, rng=rng)
@piece
def title2(rng):
    img = sky(rng, ('#03060d', '#061424')); img = nebula(rng, img, ['#0c3a4a', '#1f8aa0', '#5fd3e6', '#d2fbff'], 1.0, 620, .7, .5); img = stars(rng, img, 2600, 34)
    img = galaxy(rng, img, 1180, 330, 260, '#9fd8ff', tilt=.32, rot=-.35)
    img = planet(rng, img, 1350, 1180, 560, '#0d2533', '#2f6f7a', '#7fe8ff', bands=True)
    finish(img, 'title2', left=.55, rng=rng)
@piece
def title3(rng):
    img = sky(rng, ('#07040a', '#140818')); img = nebula(rng, img, ['#2a0d1a', '#8a2a3d', '#ff6a5a', '#ffd2a0'], 1.0, 480, .6, .5); img = stars(rng, img, 2200, 26)
    img = black_hole(rng, img, 1170, 480, 95)
    finish(img, 'title3', left=.55, rng=rng)
# ---------- gallery pieces ----------
@piece
def gallery1(rng):   # twin suns over a ringed giant
    img = sky(rng, ('#0a0610', '#1a0e1e')); img = nebula(rng, img, ['#2b1238', '#7a3a7a', '#ff9de2'], .8, 600, .5, .45); img = stars(rng, img, 2000, 20)
    img = nebula_cloud_light(img, 360, 260, 120, '#fff0c8', 1.6); img = nebula_cloud_light(img, 360, 260, 420, '#ffb547', .45)
    img = nebula_cloud_light(img, 520, 330, 70, '#ffe0f0', 1.2)
    img = planet(rng, img, 1050, 640, 360, '#341f3c', '#c57a8a', '#ffc2d8', rings=(.2, 1.3, 2.1, '#f5d9e0'), light=(-.75, -.4))
    finish(img, 'gallery1', rng=rng)
@piece
def gallery2(rng):   # the fleet's graveyard: a moon among dust
    img = sky(rng, ('#05080a', '#0e1612')); img = nebula(rng, img, ['#0e2a1c', '#2f7a4a', '#7be0a0', '#e0ffe8'], .9, 520, .8, .5); img = stars(rng, img, 2400, 22)
    img = planet(rng, img, 520, 520, 260, '#4a4a46', '#8a8a80', '#bfffd2', bands=False, craters=True, light=(.55, -.5))
    finish(img, 'gallery2', rng=rng)
@piece
def gallery3(rng):   # a galaxy edge-on above a blue world
    img = sky(rng, ('#03050d', '#0a1024')); img = stars(rng, img, 3000, 40)
    img = galaxy(rng, img, 800, 360, 520, '#c9b7ff', tilt=.16, rot=.12, arms=3)
    img = planet(rng, img, 800, 1560, 760, '#0b1f3d', '#2f6fb0', '#8fc1ff', bands=True, light=(0, -.9))
    finish(img, 'gallery3', rng=rng)
@piece
def gallery4(rng):   # inside a red nebula
    img = sky(rng, ('#0a0303', '#1a0707')); img = nebula(rng, img, ['#3a0a0a', '#a32a1a', '#ff7a3a', '#ffd9a8'], 1.4, 380, .9, .7); img = stars(rng, img, 1600, 18)
    finish(img, 'gallery4', rng=rng)
# ---------- vistas behind the beacons: no planets (the game paints its own on top) ----------
VISTAS = { 'amber':['#2a1a3a', '#a0522d', '#ffb547', '#ffe7b0'], 'cyan':['#0a2a3a', '#1f8aa0', '#5fd3e6', '#d8fbff'], 'green':['#0a2a1a', '#2f7a4a', '#7be0a0', '#e0ffe8'],
  'violet':['#1a0f3a', '#5a3aa0', '#b28bff', '#efe2ff'], 'red':['#2a0808', '#8a2a2a', '#ff6a5a', '#ffd2b8'], 'pink':['#2a0c2a', '#8a3a7a', '#ff9de2', '#ffe6f6'],
  'blue':['#071030', '#203a8a', '#6f9bff', '#dbe6ff'], 'teal':['#04201e', '#1a6a64', '#5fe0cc', '#dcfff8'] }
def vista(key, n):
    def fn(rng):
        cols = VISTAS[key]; img = sky(rng, ('#04060c', '#0a0d1a'))
        if n == 2: img = galaxy(rng, img, rng.uniform(300, 1300), rng.uniform(200, 600), rng.uniform(180, 320), cols[2], tilt=rng.uniform(.2, .5), rot=rng.uniform(-.8, .8))
        img = nebula(rng, img, cols, rng.uniform(.95, 1.3), rng.uniform(420, 700), rng.uniform(.45, .85), rng.uniform(.55, .72))
        other = VISTAS[list(VISTAS)[(list(VISTAS).index(key) + 3) % len(VISTAS)]]
        img = nebula(rng, img, other, rng.uniform(.25, .45), rng.uniform(300, 500), 0, .35)
        img = stars(rng, img, int(rng.uniform(2200, 3200)), int(rng.uniform(8, 18)))
        finish(img, f'vista_{key}{n}', vignette=.4, rng=rng, q=80)
    fn.__name__ = f'vista_{key}{n}'; return fn
for k in VISTAS:
    for n in (1, 2): PIECES[f'vista_{k}{n}'] = vista(k, n)

if __name__ == '__main__':
    only = set(sys.argv[1:])
    for i, (name, fn) in enumerate(PIECES.items()):
        if only and name not in only: continue
        fn(np.random.default_rng(1000 + i))
    json.dump({ 'vistas':{ k:[f'vista_{k}1', f'vista_{k}2'] for k in VISTAS }, 'tints':VISTAS }, open(os.path.join(OUT, 'vistas.json'), 'w'))
