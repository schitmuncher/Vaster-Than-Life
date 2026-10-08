'use strict';
/* =========================================================================
   Phones, tablets and any screen size:
   - Responsive stage that uses every pixel (respecting notches/safe areas),
     with the game auto-rotated to landscape when a phone is held upright.
   - Full screen (with landscape lock where the browser allows it), and an
     "Add to Home Screen" guide where it doesn't (iPhone).
   - Touch controls: tap to act with forgiving hit areas, press-and-hold for
     tooltips, pinch to zoom, drag to pan while zoomed, tap ripples.
   - Keeps the screen awake while playing, pauses when you switch away,
     and buzzes on hits on phones that support vibration.
   ========================================================================= */
const MOB = { z:1, px:0, py:0, rot:0, gw:0, gh:0, cx:0, cy:0, ptrs:new Map(), pinch:null, press:null, taps:[], wake:null, touch:false };
MOB.touch = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window);
if(MOB.touch) document.documentElement.classList.add('touch');
if(MOB.touch && PROFILE.settings && PROFILE.settings.textSize == null) SET.textSize = 'large';
const stageEl = document.getElementById('stage');
const zoomBtn = document.getElementById('zoomReset');

/* ---------------- layout ---------------- */
function layoutGame(){
  const vw = window.innerWidth, vh = window.innerHeight;
  const bar = document.getElementById('bar'); const desktopBar = !MOB.touch && !document.fullscreenElement;
  const barH = desktopBar && bar ? bar.offsetHeight + 12 : 0;
  const sr = stageEl.getBoundingClientRect();
  const aw = Math.max(100, sr.width), ah = Math.max(100, sr.height - barH);
  MOB.rot = (MOB.touch && vh > vw * 1.05 && SET.rotatePortrait !== false) ? 90 : 0;
  // long side of the game runs along the long side of the screen
  const longS = MOB.rot ? ah : aw, shortS = MOB.rot ? aw : ah;
  const pad = MOB.touch ? 0 : 8;
  // aspect: fill = stretch to the whole screen (within limits), crop = zoom so no bars show (pan to look around), or a fixed ratio
  const mode = SET.aspect || (MOB.touch ? 'fill' : 'fit'); const LW = longS - pad*2, SH = shortS - pad*2;
  const ratio = { fit:1.6, r169:16/9, r2:2, r219:21/9 }[mode] || clamp(LW/SH, 1.25, 2.6);
  let gw, gh; MOB.crop = mode === 'crop';
  if(MOB.crop){ const k = Math.max(LW/W, SH/H); gw = W*k; gh = H*k; }
  else { gw = Math.max(160, Math.min(LW, SH*ratio)); gh = gw/ratio; }
  MOB.gw = gw; MOB.gh = gh; MOB.cx = sr.left + aw/2; MOB.cy = sr.top + ah/2;
  cv.style.width = gw + 'px'; cv.style.height = gh + 'px';
  clampPan(); applyTransform();
}
function applyTransform(){
  cv.style.transform = `translate(-50%,-50%) translate(${MOB.px}px,${MOB.py}px) rotate(${MOB.rot}deg) scale(${MOB.z})`;
  const ah = stageEl.getBoundingClientRect().height - ((!MOB.touch && !document.fullscreenElement) ? (document.getElementById('bar').offsetHeight + 12) : 0);
  cv.style.top = (ah/2) + 'px';
  if(zoomBtn) zoomBtn.hidden = MOB.z < 1.05;
}
function clampPan(){
  const sw = (MOB.rot ? MOB.gh : MOB.gw)*MOB.z, sh = (MOB.rot ? MOB.gw : MOB.gh)*MOB.z;
  const sr = stageEl.getBoundingClientRect();
  const mx = Math.max(0, (sw - sr.width)/2 + 20), my = Math.max(0, (sh - sr.height)/2 + 20);
  MOB.px = clamp(MOB.px, -mx, mx); MOB.py = clamp(MOB.py, -my, my);
  if(MOB.z <= 1.001 && !MOB.crop){ MOB.px = 0; MOB.py = 0; }
}
/* screen point -> game canvas coordinates, through pan, rotation and zoom */
function screenToGame(sx, sy, st = MOB){
  let dx = sx - MOB.cx - st.px, dy = sy - MOB.cy - st.py;
  if(MOB.rot){ const t = dx; dx = dy; dy = -t; }      // undo a 90° clockwise rotation
  dx /= st.z; dy /= st.z;
  return { x:(dx/MOB.gw + .5)*W, y:(dy/MOB.gh + .5)*H };
}
function gameToScreenDelta(gx, gy, z){ let dx = (gx/W - .5)*MOB.gw*z, dy = (gy/H - .5)*MOB.gh*z; if(MOB.rot){ const t = dx; dx = -dy; dy = t; } return { dx, dy }; }
function cssPerCanvas(){ return MOB.gw*MOB.z / W; }
function resetZoom(){ MOB.z = 1; MOB.px = 0; MOB.py = 0; applyTransform(); }
if(zoomBtn) zoomBtn.onclick = resetZoom;

/* ---------------- forgiving clicks ---------------- */
function nearestRegion(x, y, tol){
  let best = null, bd = tol;
  for(let i=HR.length-1;i>=0;i--){ const r = HR[i]; const dx = Math.max(r.x - x, 0, x - (r.x + r.w)), dy = Math.max(r.y - y, 0, y - (r.y + r.h)); const d = Math.hypot(dx, dy);
    if(d===0) return r; if(d < bd && r.w < W*.6 && r.h < H*.6){ bd = d; best = r; } }
  return best;
}
function tapAt(x, y, tolCss){
  ensureAudio();
  const tol = tolCss / Math.max(.05, cssPerCanvas());
  const r = nearestRegion(x, y, tol);
  MOB.taps.push({ x, y, t:0, hit:!!r });
  if(r){ r.cb(); sfx('click'); return true; }
  if(UI.screen==='game'){ UI.selCrew = null; UI.selWeapon = null; UI.mode = null; }
  return false;
}
let tapLast = performance.now();
function drawTaps(){ const now_ = performance.now(), dt = Math.min(.1, (now_ - tapLast)/1000); tapLast = now_;
  for(let i=MOB.taps.length-1;i>=0;i--){ const tp = MOB.taps[i]; tp.t += dt; if(tp.t > .45){ MOB.taps.splice(i,1); continue; }
    const k = tp.t/.45; ctx.beginPath(); ctx.arc(tp.x, tp.y, 14 + k*46, 0, 7); ctx.strokeStyle = hexA(tp.hit ? C.amber : C.muted, (1-k)*.8); ctx.lineWidth = 3*(1-k) + 1; ctx.stroke(); }
}

/* ---------------- pointer handling (mouse, pen and touch) ---------------- */
function evGame(e){ return screenToGame(e.clientX, e.clientY); }
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointermove', e => {
  const p = evGame(e);
  if(e.pointerType==='mouse'){ PTR[0].x = p.x; PTR[0].y = p.y; PTR[0].on = true; return; }
  const P = MOB.ptrs.get(e.pointerId); if(!P) return; P.x = e.clientX; P.y = e.clientY;
  if(MOB.ptrs.size >= 2 && MOB.pinch){ pinchMove(); return; }
  const pr = MOB.press; if(!pr || pr.id!==e.pointerId) return;
  const moved = Math.hypot(e.clientX - pr.sx, e.clientY - pr.sy);
  if(moved > 12 && !pr.long){ pr.drag = true; clearTimeout(pr.timer); }
  if(pr.drag && (MOB.z > 1.01 || MOB.crop)){ MOB.px = pr.px0 + (e.clientX - pr.sx); MOB.py = pr.py0 + (e.clientY - pr.sy); clampPan(); applyTransform(); PTR[0].on = false; }
  else if(!pr.drag || pr.long){ PTR[0].x = p.x; PTR[0].y = p.y; }   // hold-and-slide reads tooltips
});
cv.addEventListener('pointerleave', e => { if(e.pointerType==='mouse') PTR[0].on = false; });
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); ensureAudio();
  const p = evGame(e);
  if(e.pointerType==='mouse'){ PTR[0].x = p.x; PTR[0].y = p.y; click(p.x, p.y); MOB.taps.push({ x:p.x, y:p.y, t:.2, hit:true }); return; }
  try{ cv.setPointerCapture(e.pointerId); }catch(err){}
  MOB.ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if(MOB.ptrs.size === 2){ // start pinch: cancel any tap in progress
    if(MOB.press){ clearTimeout(MOB.press.timer); MOB.press = null; } PTR[0].on = false;
    const [a, b] = [...MOB.ptrs.values()]; MOB.pinch = { d0:Math.hypot(a.x-b.x, a.y-b.y), z0:MOB.z, px0:MOB.px, py0:MOB.py, mx0:(a.x+b.x)/2, my0:(a.y+b.y)/2 };
    return; }
  if(MOB.ptrs.size > 2) return;
  PTR[0].x = p.x; PTR[0].y = p.y; PTR[0].on = true;   // finger down shows the pressed/hover state
  const pr = MOB.press = { id:e.pointerId, sx:e.clientX, sy:e.clientY, px0:MOB.px, py0:MOB.py, drag:false, long:false, t0:performance.now() };
  pr.timer = setTimeout(() => { if(MOB.press===pr && !pr.drag){ pr.long = true; haptic(.15, 15); } }, 430);
});
function endPointer(e){
  if(e.pointerType==='mouse') return;
  MOB.ptrs.delete(e.pointerId);
  if(MOB.pinch){ if(MOB.ptrs.size < 2){ MOB.pinch = null; MOB.pinchEnded = performance.now(); } return; }
  const pr = MOB.press; if(!pr || pr.id!==e.pointerId) return;
  clearTimeout(pr.timer); MOB.press = null;
  const p = evGame(e);
  if(!pr.drag && !pr.long && performance.now() - (MOB.pinchEnded||0) > 250){
    const hit = tapAt(p.x, p.y, 26), now = performance.now(), L = MOB.lastEmpty;
    // double-tap on empty space zooms in on that spot (or back out)
    if(!hit && L && now - L.t < 320 && Math.hypot(e.clientX - L.x, e.clientY - L.y) < 40 && UI.screen==='game'){
      MOB.lastEmpty = null;
      if(MOB.z > 1.2) resetZoom();
      else { const z = 2.2, off = gameToScreenDelta(p.x, p.y, z); MOB.z = z; MOB.px = e.clientX - MOB.cx - off.dx; MOB.py = e.clientY - MOB.cy - off.dy; clampPan(); applyTransform(); }
      haptic(.3, 15);
    } else MOB.lastEmpty = hit ? null : { t:now, x:e.clientX, y:e.clientY };
  }
  setTimeout(() => { if(!MOB.press) PTR[0].on = false; }, pr.long ? 0 : 120);
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', e => { MOB.ptrs.delete(e.pointerId); if(MOB.press && MOB.press.id===e.pointerId){ clearTimeout(MOB.press.timer); MOB.press = null; } if(MOB.ptrs.size < 2) MOB.pinch = null; PTR[0].on = false; });
function pinchMove(){
  const [a, b] = [...MOB.ptrs.values()]; const P = MOB.pinch; const d = Math.hypot(a.x-b.x, a.y-b.y); const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
  const z = clamp(P.z0 * d/Math.max(20, P.d0), 1, 4);
  // keep the game point that was under the fingers' midpoint under it
  const g0 = screenToGame(P.mx0, P.my0, { z:P.z0, px:P.px0, py:P.py0 });
  const off = gameToScreenDelta(g0.x, g0.y, z);
  MOB.z = z; MOB.px = mx - MOB.cx - off.dx; MOB.py = my - MOB.cy - off.dy; clampPan(); applyTransform();
}
cv.addEventListener('wheel', e => { if(!e.ctrlKey) return; e.preventDefault(); const g = evGame(e); const z = clamp(MOB.z * (e.deltaY < 0 ? 1.1 : 1/1.1), 1, 4); const off = gameToScreenDelta(g.x, g.y, z); MOB.z = z; MOB.px = e.clientX - MOB.cx - off.dx; MOB.py = e.clientY - MOB.cy - off.dy; clampPan(); applyTransform(); }, { passive:false });

/* ---------------- full screen & install ---------------- */
function isFullscreen(){ return !!(document.fullscreenElement || document.webkitFullscreenElement) || window.navigator.standalone === true || matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches; }
function canFullscreen(){ const el = document.documentElement; return !!(el.requestFullscreen || el.webkitRequestFullscreen); }
async function toggleFullscreen(){
  ensureAudio();
  if(document.fullscreenElement || document.webkitFullscreenElement){ (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
  const el = document.documentElement;
  if(!canFullscreen()){ document.getElementById('installDlg').hidden = false; return; }
  try{ if(el.requestFullscreen) await el.requestFullscreen({ navigationUI:'hide' }); else el.webkitRequestFullscreen(); }catch(err){ document.getElementById('installDlg').hidden = false; return; }
  try{ if(screen.orientation && screen.orientation.lock && SET.lockLandscape !== false) await screen.orientation.lock('landscape'); }catch(err){}
  setTimeout(layoutGame, 120);
}
['fullscreenchange','webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { document.documentElement.classList.toggle('fs', !!(document.fullscreenElement || document.webkitFullscreenElement)); setTimeout(layoutGame, 60); }));
const fsBtn = document.getElementById('fsBtn'); if(fsBtn) fsBtn.onclick = toggleFullscreen;
const instClose = document.getElementById('installClose'); if(instClose) instClose.onclick = () => { document.getElementById('installDlg').hidden = true; };

/* ---------------- keep awake, pause when hidden, vibrate ---------------- */
async function wantWake(){ try{ if('wakeLock' in navigator && !MOB.wake && UI.screen==='game' && !document.hidden) { MOB.wake = await navigator.wakeLock.request('screen'); MOB.wake.addEventListener('release', () => { MOB.wake = null; }); } }catch(err){ MOB.wake = null; } }
document.addEventListener('visibilitychange', () => {
  if(document.hidden){ if(G && UI.screen==='game' && !G.modal && !G.paused){ G.paused = true; MOB.autoPaused = true; } if(typeof AC!=='undefined' && AC && AC.state==='running') AC.suspend(); }
  else { if(typeof AC!=='undefined' && AC && AC.state==='suspended') AC.resume(); wantWake(); if(MOB.autoPaused){ MOB.autoPaused = false; toast('Paused while you were away. Tap Resume to carry on.'); } }
});
function mobileHaptic(v, ms){ if(SET.vibrate === false || !navigator.vibrate || v < .2) return; try{ navigator.vibrate(Math.min(80, Math.max(10, ms|0))); }catch(err){} }

/* per-frame hook from the draw loop */
let mobT = 0;
function mobileFrame(){
  drawTaps(); const dt = .016;
  // on touch screens the floating buttons only show on the title screen, so they never cover game controls
  const offTitle = UI.screen !== 'title'; if(MOB.offTitle !== offTitle){ MOB.offTitle = offTitle; document.documentElement.classList.toggle('offtitle', offTitle); }
  mobT += dt; if(mobT > 2){ mobT = 0; if(UI.screen==='game') wantWake(); }
  // long-press tooltip marker
  if(MOB.press && MOB.press.long){ ctx.beginPath(); ctx.arc(PTR[0].x, PTR[0].y, 22, 0, 7); ctx.strokeStyle = hexA(C.cyan, .8); ctx.lineWidth = 3; ctx.stroke(); }
}
window.addEventListener('resize', () => setTimeout(layoutGame, 30));
window.addEventListener('orientationchange', () => setTimeout(layoutGame, 250));
if(window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(layoutGame, 30));
