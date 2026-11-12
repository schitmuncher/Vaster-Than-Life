'use strict';
/* =========================================================================
   Painted backgrounds and the Gallery. Everything here is the game's own:
   the paintings in assets/art are made by tools/paint-backgrounds.py and the
   soundtrack in music/ by tools/compose-ost.py (played by midi.js).
   ========================================================================= */
/* portraits are always drawn by the game (or come from the Pixel Studio) */
function avatarName(){ return null; }
function drawAvatarPortrait(){ return false; }

/* ---------------- title wallpaper: three paintings, crossfading ---------------- */
const WALLS = ['title1', 'title2', 'title3'];
const WALL = { i:Math.floor(Math.random()*WALLS.length), t0:performance.now(), prev:null };
function wallImg(n){ return getImg(`assets/art/${n}.jpg`); }
function drawWallpaper(){
  const t = performance.now(); if(t - WALL.t0 > 45000){ WALL.prev = WALL.i; WALL.i = (WALL.i + 1) % WALLS.length; WALL.t0 = t; }
  const fade = Math.min(1, (t - WALL.t0)/2500), cover = (img, a) => { if(!img || !img.complete || !img.naturalWidth) return false; const k = Math.max(W/img.naturalWidth, H/img.naturalHeight), w = img.naturalWidth*k, h = img.naturalHeight*k;
    const drift = Math.sin(t/14000)*12; ctx.globalAlpha = a; ctx.drawImage(img, (W - w)/2 + drift, (H - h)/2, w, h); return true; };
  ctx.save(); if(WALL.prev != null && fade < 1) cover(wallImg(WALLS[WALL.prev]), .9);
  cover(wallImg(WALLS[WALL.i]), .9*(WALL.prev != null ? fade : 1)); ctx.globalAlpha = 1;
  const g = ctx.createLinearGradient(0, 0, W*.7, 0); g.addColorStop(0, 'rgba(5,7,16,.82)'); g.addColorStop(1, 'rgba(5,7,16,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  wallImg(WALLS[(WALL.i + 1) % WALLS.length]);   // have the next one ready
}

/* ---------------- painted vistas behind the beacons ---------------- */
/* paintSpace() paints a quick sky; on top of it goes the painted vista whose colour is closest to the sector's */
const VISTA_TINTS = { amber:'#ffb547', cyan:'#5fd3e6', green:'#7be0a0', violet:'#b28bff', red:'#ff6a5a', pink:'#ff9de2', blue:'#6f9bff', teal:'#5fe0cc' };
function vistaFor(tint, r){ let best = 'cyan', bd = 1e9; const c = hexRGB(tint || '#5fd3e6');
  for(const k in VISTA_TINTS){ const v = hexRGB(VISTA_TINTS[k]), d = (c[0] - v[0])**2 + (c[1] - v[1])**2 + (c[2] - v[2])**2; if(d < bd){ bd = d; best = k; } }
  return `vista_${best}${r < .5 ? 1 : 2}`; }
function hexRGB(h){ h = String(h).replace('#', ''); if(h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
(function(){
  if(typeof paintSpace!=='function') return; const p0 = paintSpace;
  paintSpace = function(g, w, h, rnd, tint, o = {}){
    p0(g, w, h, rnd, tint, o); if(typeof SET!=='undefined' && SET.vistas === false) return;
    const src = `assets/art/${vistaFor(tint, rnd())}.jpg`, img = getImg(src), raw = typeof IMG!=='undefined' ? IMG[src] : null;
    if(img && img.complete && img.naturalWidth){ const k = Math.max(w/img.naturalWidth, h/img.naturalHeight), iw = img.naturalWidth*k, ih = img.naturalHeight*k;
      g.save(); g.globalAlpha = o.nebula ? .78 : .62; g.drawImage(img, (w - iw)/2 + (rnd() - .5)*Math.max(0, iw - w), (h - ih)/2, iw, ih); g.restore(); }
    else if(raw && !raw.vtlWait){ raw.vtlWait = true; raw.addEventListener('load', () => { if(typeof BG!=='undefined') BG.key = null; if(typeof MAPBG!=='undefined') MAPBG.key = null; }); }
  };
})();

/* ---------------- gallery: paintings and a jukebox ---------------- */
const GALLERY = [['title1', 'The Ringed Giant'], ['title2', 'Cyan Reach'], ['title3', 'The Hungry Dark'], ['gallery1', 'Twin Suns'], ['gallery2', 'Graveyard Moon'], ['gallery3', 'Edge-On'], ['gallery4', 'Inside the Red'],
  ['vista_amber2', 'Amber Drift'], ['vista_violet1', 'Violet Deep'], ['vista_teal1', 'Teal Shallows'], ['vista_red1', 'Ember Clouds'], ['vista_blue2', 'Blue Hour']];
function drawGallery(){
  T('Gallery', 60, 122, { s:50, f:FD, w:700 }); label('Paintings and music made for the game', 62, 150, C.cyan, 'left', 16);
  UI.galTab = UI.galTab || 'art';
  btn(1100, 64, 210, 50, 'Paintings', () => { UI.galTab = 'art'; }, { fill:UI.galTab === 'art', s:17 }); btn(1320, 64, 210, 50, 'Soundtrack', () => { UI.galTab = 'music'; }, { fill:UI.galTab === 'music', s:17 });
  if(UI.galTab === 'music') drawJukebox(); else {
    UI.galIdx = clamp(UI.galIdx || 0, 0, GALLERY.length - 1); const [file, name] = GALLERY[UI.galIdx], img = getImg(`assets/art/${file}.jpg`);
    panel(60, 180, 1000, 640, 10);
    if(img && img.complete && img.naturalWidth){ const k = Math.min(980/img.naturalWidth, 620/img.naturalHeight); ctx.drawImage(img, 70 + (980 - img.naturalWidth*k)/2, 190, img.naturalWidth*k, img.naturalHeight*k); } else T('Loading…', 560, 500, { s:22, a:'center', c:C.muted });
    T(name, 80, 850, { s:22, f:FD, w:700, c:C.amber });
    GALLERY.forEach(([f, n], i) => { const x = 1100 + (i % 3)*148, y = 180 + Math.floor(i/3)*112, th = getImg(`assets/art/${f}.jpg`);
      rr(x, y, 140, 100, 6); ctx.fillStyle = '#0a0e1c'; ctx.fill(); if(th && th.complete && th.naturalWidth){ ctx.save(); rr(x, y, 140, 100, 6); ctx.clip(); ctx.drawImage(th, x, y, 160, 100); ctx.restore(); }
      ctx.strokeStyle = i === UI.galIdx ? C.amber : 'rgba(120,135,170,.3)'; ctx.lineWidth = i === UI.galIdx ? 3 : 1; rr(x, y, 140, 100, 6); ctx.stroke();
      region(x, y, 140, 100, () => { UI.galIdx = i; }, 'gal:' + f); });
    para('Painted by the game\'s own tools from noise: no photos, no borrowed art. The same paintings sit behind the beacons as you play, tinted to each sector.', 1100, 650, 440, { s:15, c:C.muted });
  }
  btn(60, 870, 200, 64, 'Back', () => { UI.screen = 'title'; UI.jukebox = null; });
}
const JUKEBOX = [['title', 'Vaster Than Life', 'title', 'ost_anthem'], ['hangar', 'Dry Dock', 'hangar', 'ost_funk'], ['start', 'Departure', 'start', 'ost_arp'],
  ['explore1', 'The Long Way Round', 'explore', 'ost_soft'], ['explore2', 'Beacon Lights', 'explore', 'ost_arp'], ['explore3', 'Drift', 'explore', 'ost_ambient'], ['explore4', 'Quiet Stars', 'explore', 'ost_waltz'], ['explore5', 'Engine Room', 'explore', 'ost_funk'],
  ['strange1', 'Nebula Hymn', 'strange sectors', 'ost_ambient'], ['strange2', 'Static', 'strange sectors', 'ost_eerie'], ['store', 'Haggle Bossa', 'stores', 'ost_bossa'],
  ['combat1', 'Shields Up', 'fights', 'ost_rock'], ['combat2', 'Boarding Party', 'fights', 'ost_rock'], ['combat3', 'Red Alert', 'fights', 'ost_arp'], ['combat4', 'Dogfight', 'fights', 'ost_break'], ['boss', 'Dreadnought', 'the last fight', 'ost_rock'],
  ['win', 'Homecoming', 'victory', 'ost_anthem'], ['over', 'Drifting On', 'the end', 'ost_ambient']];
function drawJukebox(){
  panel(60, 180, 1470, 660, 10); label('The soundtrack · eighteen tunes written for the game', 84, 216, C.amber, 'left', 15);
  JUKEBOX.forEach(([f, name, where, style], i) => { const x = 84 + (i % 3)*480, y = 238 + Math.floor(i/3)*96, on = UI.jukebox && UI.jukebox.file === f + '.mid';
    rr(x, y, 460, 84, 8); ctx.fillStyle = on ? hexA(C.amber, .14) : 'rgba(8,11,22,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : 'rgba(120,135,170,.25)'; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    T(on ? '❚❚' : '▶', x + 34, y + 50, { s:on ? 18 : 22, a:'center', c:on ? C.amber : C.cyan });
    T(name, x + 64, y + 38, { s:19, f:FD, w:700, c:on ? C.amber : C.ink, max:380 }); T(`Plays in ${where}`, x + 64, y + 64, { s:13, c:C.muted });
    region(x, y, 460, 84, () => { if(typeof ensureAudio === 'function') ensureAudio(); UI.jukebox = on ? null : { file:f + '.mid', style }; }, 'juke:' + f); });
  if(SET.music <= 0) T('Music is turned off in Settings → Sound.', 795, 816, { s:15, a:'center', c:C.hostile });
}
/* the jukebox wins while the gallery is open */
(function(){ if(typeof midiCue !== 'function') return; const m0 = midiCue;
  midiCue = function(){ if(UI.screen === 'gallery' && UI.jukebox){ midiLoad(OST.dir + UI.jukebox.file); MIDI.title = OST_TITLES[UI.jukebox.file.replace(/\.mid$/, '')]; return UI.jukebox.style; }
    return m0(); };
})();
function startMedia(){}   // the old streamed soundtrack is gone; midi.js plays the music
