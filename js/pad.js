'use strict';
/* =========================================================================
   Game controllers and keyboard focus on the flat screen.
   A standard gamepad drives a cursor: the d-pad jumps between buttons and
   rooms, the left stick moves the cursor freely, A selects, B backs out,
   Start pauses. The arrow keys and Enter do the same from a keyboard.
   Ignored inside VR, where the headset's own controllers are used.
   ========================================================================= */
const GP = { active:false, x:W/2, y:H/2, prev:[], rep:{}, seen:false };

/* what can be clicked right now: regions added after the last full-screen blocker (an open window swallows clicks beneath it) */
function padTargets(){
  let start = 0; for(let i=HR.length-1;i>=0;i--){ const r = HR[i]; if(r.w>=W-1 && r.h>=H-1){ start = i+1; break; } }
  return HR.slice(start).filter(r => r.w > 6 && r.h > 6 && r.w < 900 && r.h < 640);
}
function padUnder(list){ for(let i=list.length-1;i>=0;i--){ const r = list[i]; if(GP.x>=r.x && GP.x<=r.x+r.w && GP.y>=r.y && GP.y<=r.y+r.h) return r; } return null; }
/* move focus to the best region in a direction: close along the direction, and not far off to the side */
function padSnap(dx, dy){
  const list = padTargets(); if(!list.length) return;
  const here = padUnder(list); let best = null, bs = Infinity;
  for(const r of list){ if(r===here) continue; const cx = r.x + r.w/2, cy = r.y + r.h/2, vx = cx - GP.x, vy = cy - GP.y;
    const along = vx*dx + vy*dy; if(along < 8) continue;
    const s = along + Math.abs(vx*dy - vy*dx)*2.2; if(s < bs){ bs = s; best = r; } }
  if(!best && !here) for(const r of list){ const d = Math.hypot(r.x + r.w/2 - GP.x, r.y + r.h/2 - GP.y); if(d < bs){ bs = d; best = r; } }
  if(best){ GP.x = best.x + best.w/2; GP.y = best.y + best.h/2; }
  padWake();
}
function padWake(){ GP.active = true; PTR[0].x = GP.x; PTR[0].y = GP.y; PTR[0].on = true; }
function padBack(){
  if(UI.hint && typeof closeHint==='function'){ closeHint(false); return; }
  if(UI.screen==='game' && G){
    if(G.modal && ['map','ship','store'].includes(G.modal.type)){ G.modal = null; return; }
    if(UI.selWeapon!=null || UI.selCrew || UI.mode){ UI.selWeapon = null; UI.selCrew = null; UI.selCrews = []; UI.mode = null; }
    return; }
  if(typeof handleBack==='function') handleBack(); else if(UI.screen!=='title') UI.screen = 'title';
}
/* LB / RB: step through powered weapons and park the cursor on the enemy so A picks a room */
function padWeapon(d){
  if(!G || G.modal || UI.screen!=='game') return; const ws = G.ship.weapons, on = ws.map((w,i)=>i).filter(i => ws[i].on); if(!on.length){ toast('No powered weapons.'); return; }
  let k = on.indexOf(UI.selWeapon); k = k<0 ? (d>0 ? 0 : on.length-1) : (k + d + on.length) % on.length; UI.selWeapon = on[k]; UI.mode = null;
  const b = G.enemy && !G.enemy.dead ? G.enemy._b : null; if(b && b.x1 > b.x0){ GP.x = (b.x0 + b.x1)/2; GP.y = (b.y0 + b.y1)/2; }
  padWake(); sfx('click');
}
function padGame(fn){ if(UI.screen==='game' && G) fn(); }
function pollPad(dt){
  if(GP.active){ PTR[0].x = GP.x; PTR[0].y = GP.y; PTR[0].on = true; }
  if(typeof navigator==='undefined' || !navigator.getGamepads) return;
  if(typeof inXR==='function' && inXR()) return;
  let pad = null; try{ for(const p of navigator.getGamepads()) if(p && p.connected && p.mapping==='standard'){ pad = p; break; } }catch(e){ return; }
  if(!pad){ GP.prev = []; return; }
  const b = pad.buttons.map(x => !!x && (x.pressed || x.value > .5)), was = GP.prev; GP.prev = b;
  const press = i => b[i] && !was[i];
  if(!GP.seen && b.some(Boolean)){ GP.seen = true; toast('Controller ready: d-pad moves between buttons, A selects, B goes back.'); }
  // left stick: a free cursor that speeds up the further you push
  const ax = pad.axes[0]||0, ay = pad.axes[1]||0, m = Math.hypot(ax, ay);
  if(m > .2){ const sp = 240 + 1150*Math.pow(Math.min(1, (m - .2)/.8), 1.7); GP.x = clamp(GP.x + ax/m*sp*dt, 0, W); GP.y = clamp(GP.y + ay/m*sp*dt, 0, H); padWake(); }
  // d-pad: jump between things you can click, with key repeat
  for(const [i, dx, dy] of [[12,0,-1],[13,0,1],[14,-1,0],[15,1,0]]){
    if(!b[i]){ GP.rep[i] = null; continue; }
    if(GP.rep[i]==null){ GP.rep[i] = .38; padSnap(dx, dy); }
    else { GP.rep[i] -= dt; if(GP.rep[i] <= 0){ GP.rep[i] = .12; padSnap(dx, dy); } } }
  if(press(0)){ padWake(); click(GP.x, GP.y); }
  if(press(1)){ padWake(); padBack(); }
  if(press(2)) padGame(() => { G.hold = !G.hold; toast(G.hold ? 'Holding fire' : 'Firing at will'); });
  if(press(3)) padGame(() => { if(G.modal?.type==='map') G.modal = null; else if(!G.modal) openMap(); });
  if(press(4)) padWeapon(-1);
  if(press(5)) padWeapon(1);
  if(press(6)) padGame(() => { if(!G.modal){ returnToStations(G.ship); toast('Crew back to stations.'); } });
  if(press(7)) padGame(() => { G.autofire = !G.autofire; toast(G.autofire ? 'Autofire on' : 'Autofire off'); });
  if(press(8)) padGame(() => { if(G.modal?.type==='ship') G.modal = null; else if(!G.modal){ G.modal = { type:'ship' }; UI.tab = UI.tab || 'systems'; } });
  if(press(9)){ if(UI.screen==='game' && G){ if(!G.modal) G.paused = !G.paused; } else padBack(); }
}
/* the focus ring and cursor, drawn last */
function drawPadCursor(){
  if(!GP.active || (typeof inXR==='function' && inXR())) return;
  const r = padUnder(padTargets());
  if(r){ ctx.save(); rr(r.x-4, r.y-4, r.w+8, r.h+8, 9); ctx.strokeStyle = hexA(C.amber,.9); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
  glow(GP.x, GP.y, 18, C.amber, .45);
  ctx.beginPath(); ctx.arc(GP.x, GP.y, 11, 0, 7); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(GP.x, GP.y, 2.5, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill();
}
/* keyboard: arrows move the same focus, Enter selects; the mouse takes over again as soon as it moves */
window.addEventListener('keydown', e => {
  if(e.defaultPrevented) return;
  if(e.target && e.target.closest && e.target.closest('dialog,#modPanel,#renameDlg,input,textarea')) return;
  const dir = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] }[e.key];
  if(dir){ e.preventDefault(); padSnap(dir[0], dir[1]); return; }
  if(e.key==='Enter' && GP.active && !UI.hint){ e.preventDefault(); click(GP.x, GP.y); }
});
window.addEventListener('pointermove', e => { if(e.pointerType==='mouse' && GP.active){ GP.active = false; } });
