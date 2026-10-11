'use strict';
/* =========================================================================
   Licensed FTL artwork and soundtrack (used with the rights holders' permission):
   - the title wallpaper, the concept-art gallery and the crew avatars
   - five soundtrack tracks by Ben Prunty, streamed on demand
   FTL: Faster Than Light is © Subset Games. Music © Ben Prunty.
   Both can be switched off in Settings (portraits -> Drawn, music -> Synth).
   ========================================================================= */
const AVATAR_FOR = { enjinn:'engi', voltan:'zoltan', sloog:'slug', mantlis:'mantis', pebblekin:'rock' };
function avatarName(c){
  if(SET.portraits === 'drawn' || !c) return null;
  if(c.drone) return 'repair';
  if(c.race === 'human'){ if(typeof ensureLook==='function') ensureLook(c); return c.gender==='f' ? 'human-f' : 'human-m'; }
  return AVATAR_FOR[c.race] || null;
}
/* portrait in a circle, using the artwork; returns false when there is none (caller draws its own) */
function drawAvatarPortrait(x, y, rad, c, hostile){
  const n = avatarName(c); if(!n) return false;
  const img = getImg(`assets/avatars/${n}.png`); if(!img) return false;
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.clip();
  const bg = ctx.createRadialGradient(x, y - rad*.3, 1, x, y, rad); bg.addColorStop(0, hostile ? '#4a1a26' : '#2a3a66'); bg.addColorStop(1, '#0c1226'); ctx.fillStyle = bg; ctx.fillRect(x-rad, y-rad, rad*2, rad*2);
  const s = rad*2.25; ctx.imageSmoothingEnabled = false; ctx.drawImage(img, x - s/2, y - s/2 - rad*.05, s, s); ctx.imageSmoothingEnabled = true;
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.strokeStyle = hostile ? C.hostile : hexA(C.amber,.8); ctx.lineWidth = 2; ctx.stroke();
  return true;
}

/* ---------------- title wallpaper ---------------- */
function drawWallpaper(){
  const img = getImg('assets/art/wallpaper.jpg'); if(!img) return;
  const k = Math.max(W/img.naturalWidth, H/img.naturalHeight), w = img.naturalWidth*k, h = img.naturalHeight*k;
  ctx.save(); ctx.globalAlpha = .75; ctx.drawImage(img, (W-w)/2, (H-h)/2, w, h);
  const g = ctx.createLinearGradient(0, 0, W*.7, 0); g.addColorStop(0, 'rgba(5,7,16,.88)'); g.addColorStop(1, 'rgba(5,7,16,0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

/* ---------------- gallery ---------------- */
function drawGallery(){
  T('Gallery', 60, 122, { s:50, f:FD, w:700 }); label('Artwork from FTL: Faster Than Light, used with permission', 62, 150, C.cyan, 'left', 16);
  const sheets = [1,2,3]; UI.galIdx = UI.galIdx || 0; const img = getImg(`assets/art/sheet${sheets[UI.galIdx]}.jpg`);
  panel(60, 180, 1000, 640, 10);
  if(img){ const k = Math.min(980/img.naturalWidth, 620/img.naturalHeight); ctx.drawImage(img, 70, 190, img.naturalWidth*k, img.naturalHeight*k); } else T('Loading…', 560, 500, { s:22, a:'center', c:C.muted });
  sheets.forEach((s,i) => btn(1100, 200 + i*74, 440, 62, `Concept art ${s}`, () => { UI.galIdx = i; }, { fill:UI.galIdx===i, s:18 }));
  label('Crew avatars', 1102, 450, C.cyan, 'left', 16);
  ['human-m','human-f','engi','zoltan','slug','mantis','rock','repair','battle','kestrel','stealth','torus'].forEach((n,i) => { const a = getImg(`assets/avatars/${n}.png`); const x = 1100 + (i%6)*76, y = 470 + Math.floor(i/6)*84; panel(x, y, 70, 76, 6); if(a){ ctx.imageSmoothingEnabled = false; ctx.drawImage(a, x+3, y+3, 64, 70); ctx.imageSmoothingEnabled = true; } });
  para('FTL: Faster Than Light © Subset Games. Artwork and soundtrack used with permission. Soundtrack by Ben Prunty.', 1100, 680, 440, { s:15, c:C.muted });
  btn(60, 870, 200, 64, 'Back', () => { UI.screen = 'title'; });
}

/* ---------------- soundtrack ---------------- */
const MEDIA = { t:{}, cur:null, fail:false, battle:0, lastBattle:-1, timer:null };
function mediaTrack(n){
  if(MEDIA.t[n]) return MEDIA.t[n];
  const el = new Audio(); el.preload = 'auto'; el.loop = !/^battle/.test(n); el.src = `assets/music/${n}.mp3`;
  const T_ = MEDIA.t[n] = { n, el, g:null, vis:false };
  try{ const src = AC.createMediaElementSource(el); T_.g = AC.createGain(); T_.g.gain.value = 0; src.connect(T_.g); T_.g.connect(MUSG); }catch(e){ MEDIA.fail = true; }
  el.addEventListener('error', () => { MEDIA.fail = true; });
  el.addEventListener('ended', () => { if(MEDIA.cur===n && /^battle/.test(n)) MEDIA.cur = null; });
  return T_;
}
function mediaWant(){
  if(typeof UI==='undefined' || typeof G==='undefined' || UI.screen!=='game' || !G) return 'title';
  if(G.enemy && !G.enemy.dead){
    if(G.boss) return 'battle3';
    if(MEDIA.cur && /^battle/.test(MEDIA.cur)) return MEDIA.cur;
    let k; do { k = 1 + Math.floor(Math.random()*3); } while(k === MEDIA.lastBattle); MEDIA.lastBattle = k; return 'battle' + k;
  }
  return 'explore';
}
function mediaActive(){ return !!AC && SET.musicSrc !== 'synth' && !MEDIA.fail && SET.music > 0 && !!MEDIA.cur; }
function mediaTick(){
  if(!AC) return;
  if(SET.musicSrc === 'synth' || MEDIA.fail || SET.music <= 0){ for(const k in MEDIA.t){ const t = MEDIA.t[k]; if(t.vis){ t.g?.gain.setTargetAtTime(0, AC.currentTime, .2); setTimeout(() => t.el.pause(), 800); t.vis = false; } } MEDIA.cur = null; return; }
  const want = mediaWant();
  if(want !== MEDIA.cur){
    const prev = MEDIA.cur && MEDIA.t[MEDIA.cur];
    if(prev){ prev.g?.gain.setTargetAtTime(0, AC.currentTime, .6); prev.vis = false; setTimeout(() => { if(!prev.vis) prev.el.pause(); }, 2600); }
    const t = mediaTrack(want); if(!t.g) return;
    if(/^battle/.test(want)) t.el.currentTime = 0;
    const p = t.el.play(); if(p && p.catch) p.catch(() => { MEDIA.cur = null; });
    t.g.gain.setTargetAtTime(1, AC.currentTime, .7); t.vis = true; MEDIA.cur = want;
  }
}
function startMedia(){ if(!MEDIA.timer) MEDIA.timer = setInterval(mediaTick, 400); }
