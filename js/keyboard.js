'use strict';
/* =========================================================================
   The on-screen keyboard: every text box in the game uses this one QWERTY
   keyboard, drawn on the game canvas, so it works the same in VR (point or
   touch), on a phone, with a mouse, and with a physical keyboard (just type).
   Pasting works too (Ctrl+V, or the Paste key where the browser allows it).
   openKeyboard({ title, value, max, min, upper, allowed, ok, onOk, random, hint, boxes })
   ========================================================================= */
const KB = { open:false, title:'', value:'', max:24, min:1, upper:false, allowed:null, ok:'Done', onOk:null, random:null, hint:'', boxes:false, shift:true, caps:false, sym:false, lastShift:0, err:'' };
const KB_ROWS = [['1','2','3','4','5','6','7','8','9','0'], ['Q','W','E','R','T','Y','U','I','O','P'], ['A','S','D','F','G','H','J','K','L'], ['Z','X','C','V','B','N','M']];
const KB_SYM = [['1','2','3','4','5','6','7','8','9','0'], ['!','@','#','$','%','&','*','(',')','_'], ['-','+','=','/',':',';','\'','"','?'], ['.',',','~','^','[',']','|']];
function openKeyboard(o){
  Object.assign(KB, { open:true, title:o.title || 'Type', value:String(o.value || ''), max:o.max || 24, min:o.min ?? 1, upper:!!o.upper, allowed:o.allowed ? new Set(String(o.allowed).split('')) : null,
    ok:o.ok || 'Done', onOk:o.onOk || null, random:o.random || null, hint:o.hint || '', boxes:!!o.boxes, clean:o.clean || null, sym:false, caps:false, err:'' });
  KB.value = KB.value.slice(0, KB.max); KB.fresh = !!KB.value;   // like a selected text box: the first key replaces the old text
  KB.shift = !KB.upper;
  if(typeof PTR!=='undefined') for(const p of PTR) p.down = false;
}
function closeKeyboard(){ KB.open = false; KB.onOk = null; KB.random = null; KB.clean = null; }
/* pasted text can be tidied first (a room code pulled out of an invite link, say) */
function kbPasteText(t){ t = String(t||'').trim(); if(KB.clean) t = KB.clean(t); if(KB.boxes) KB.value = ''; KB.lastKeyFromScreen = false; kbType(t); }
function kbAllowed(ch){ if(KB.upper) ch = ch.toUpperCase(); return !KB.allowed || KB.allowed.has(ch); }
function kbDeselect(){ if(KB.fresh){ KB.fresh = false; if(!KB.caps) KB.shift = false; } }
function kbType(s){
  if(KB.fresh){ KB.value = ''; KB.fresh = false; }
  for(let ch of String(s)){ if(ch==='\n' || ch==='\r' || ch==='\t') ch = ' '; if(ch < ' ') continue;
    if(KB.upper) ch = ch.toUpperCase();
    if(!kbAllowed(ch)){ KB.err = `"${ch}" can't be used here.`; continue; }
    if(KB.value.length >= KB.max){ KB.err = `That's the limit: ${KB.max} characters.`; break; }
    KB.value += ch; KB.err = ''; }
  if(KB.shift && !KB.caps) KB.shift = false;
}
function kbBack(){ if(KB.fresh){ KB.value = ''; KB.fresh = false; KB.shift = !KB.upper; return; } KB.value = KB.value.slice(0, -1); KB.err = ''; if(!KB.value && !KB.upper) KB.shift = true; }
function kbDone(){ const v = KB.value.trim(); if(v.length < KB.min){ KB.err = KB.min > 1 ? `Type ${KB.min} characters.` : 'Type something first.'; sfx('error'); return; }
  const f = KB.onOk; closeKeyboard(); if(f) f(v); }
async function kbPaste(){ try{ const t = await navigator.clipboard.readText(); kbPasteText(t); }catch(e){ KB.err = 'Pasting isn\'t allowed here: press Ctrl+V instead.'; } }
function kbKey(x, y, w, h, label, fn, o={}){ btn(x, y, w, h, label, () => { KB.lastKeyFromScreen = true; fn(); }, Object.assign({ s:o.s || 26, loc:true }, o)); }
function drawKeyboard(){
  if(!KB.open) return;
  ctx.fillStyle = 'rgba(4,6,12,.78)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => {}, null, true);
  const pw = 1300, ph = 660, px = (W - pw)/2, py = H - ph - 40;
  panel(px, py, pw, ph, 16); region(px, py, pw, ph, () => {}, null, true); UI.kbRect = { x:px-8, y:py-8, w:pw+16, h:ph+16 };   // VR shows the keyboard as a pop-out window
  label(KB.title, px+32, py+44, C.amber, 'left', 18);
  if(KB.hint) T(KB.hint, px+pw-32, py+44, { s:14, a:'right', c:C.muted, max:pw-480 });
  // what has been typed
  if(KB.boxes){ const n = KB.max, bw = 84, bx = W/2 - (n*(bw+12) - 12)/2;
    for(let i=0;i<n;i++){ const x = bx + i*(bw+12); rr(x, py+66, bw, 92, 10); ctx.fillStyle = C.panel2; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = i===KB.value.length ? C.amber : C.line; ctx.stroke();
      if(KB.value[i]) T(KB.value[i], x+bw/2, py+130, { s:54, f:FD, w:700, a:'center', c:C.ink }); } }
  else { rr(px+32, py+66, pw-64, 84, 10); ctx.fillStyle = '#060a16'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.amber; ctx.stroke(); region(px+32, py+66, pw-64, 84, () => kbDeselect(), null, true);
    ctx.font = `600 34px ${FD}`; let shown = KB.value; while(shown.length && ctx.measureText(shown).width > pw - 150) shown = shown.slice(1); if(shown!==KB.value) shown = '…' + shown;
    if(KB.fresh && shown){ ctx.fillStyle = hexA(C.cyan, .28); ctx.fillRect(px+52, py+90, ctx.measureText(shown).width + 8, 44); }
    T(shown, px+56, py+122, { s:34, f:FD, w:600, c:C.ink }); const tw = ctx.measureText(shown).width;
    if(Math.floor(performance.now()/500) % 2 === 0){ ctx.fillStyle = C.amber; ctx.fillRect(px+60+tw, py+88, 3, 42); }
    T(`${KB.value.length}/${KB.max}`, px+pw-48, py+140, { s:13, a:'right', c:C.muted }); }
  if(KB.err) T(KB.err, W/2, py+186, { s:16, a:'center', c:C.hostile }); else if(KB.fresh && !KB.boxes) T('Typing replaces the old text. Tap it to add to the end instead.', W/2, py+186, { s:13, a:'center', c:C.cyan }); else if(!KB.boxes && !inXR() && !(typeof MOB!=='undefined' && MOB.touch)) T('You can also type on your keyboard', W/2, py+186, { s:13, a:'center', c:C.muted });
  // the keys
  const rows = KB.sym ? KB_SYM : KB_ROWS, kw = 96, kh = 70, gap = 10, y0 = py+204;
  const up = KB.upper || KB.shift || KB.caps;
  rows.forEach((row, r) => { const extra = r===3 ? 2 : r===0 ? 1 : 0, rw = (row.length + extra)*(kw+gap) - gap + (r===0 ? 60 : r===3 ? 80 : 0); let x = W/2 - rw/2 + (r===2 ? 0 : 0); const y = y0 + r*(kh+gap);
    if(r===3 && !KB.upper){ kbKey(x, y, kw+40, kh, KB.sym ? 'ABC' : KB.caps ? '⇪' : '⇧', () => { if(KB.sym){ KB.sym = false; return; } const now = performance.now(); if(KB.shift && now - KB.lastShift < 450){ KB.caps = !KB.caps; KB.shift = KB.caps; } else { KB.shift = !KB.shift; KB.caps = false; } KB.lastShift = now; }, { s:22, fill:(KB.shift || KB.caps) && !KB.sym, col:C.cyan }); x += kw+40+gap; }
    else if(r===3) x += (kw+40+gap)/2;
    for(const k of row){ const ch = KB.sym || /\d/.test(k) ? k : up ? k : k.toLowerCase(); const ok = kbAllowed(ch);
      kbKey(x, y, kw, kh, ch, () => kbType(ch), { disabled:!ok }); x += kw + gap; }
    if(r===0) kbKey(x, y, kw+60, kh, '⌫', () => kbBack(), { s:24, col:C.hostile });
    if(r===3) kbKey(x, y, kw+40, kh, KB.sym ? 'ABC' : '?123', () => { KB.sym = !KB.sym; }, { s:18, col:C.cyan, fill:KB.sym, disabled:KB.upper && !!KB.allowed && ![...KB.allowed].some(c => /[^A-Z0-9]/.test(c)) });
  });
  // the bottom row
  const by = y0 + 4*(kh+gap) + 6, bh = 70;
  let bx = px+40;
  kbKey(bx, by, 200, bh, 'Cancel', () => closeKeyboard(), { s:20, col:C.hostile }); bx += 210;
  if(KB.random){ kbKey(bx, by, 180, bh, 'Random', () => { const v = String(KB.random() || ''); KB.value = ''; KB.lastKeyFromScreen = false; kbType(v); }, { s:20, col:C.cyan }); bx += 190; }
  if(navigator.clipboard && navigator.clipboard.readText && !inXR()){ kbKey(bx, by, 160, bh, 'Paste', () => kbPaste(), { s:20, col:C.cyan }); bx += 170; }
  if(!KB.allowed || KB.allowed.has(' ')){ const sw = px+pw-40-300-12 - bx; if(sw > 120) kbKey(bx, by, sw, bh, 'Space', () => kbType(' '), { s:20 }); }
  kbKey(px+pw-40-300, by, 300, bh, KB.ok, () => kbDone(), { s:22, fill:KB.value.trim().length >= KB.min, col:C.good });
}
/* a physical keyboard types straight in, and nothing else hears the keys while the keyboard is up */
window.addEventListener('keydown', e => {
  if(!KB.open) return;
  if(e.target && e.target.closest && e.target.closest('#modPanel')) return;
  e.stopImmediatePropagation();
  if(e.key==='Enter'){ e.preventDefault(); kbDone(); return; }
  if(e.key==='Escape'){ e.preventDefault(); closeKeyboard(); return; }
  if(e.key==='Backspace'){ e.preventDefault(); kbBack(); return; }
  if(/^(Arrow|Home|End)/.test(e.key)){ e.preventDefault(); kbDeselect(); return; }
  if((e.ctrlKey || e.metaKey) && (e.key==='v' || e.key==='V')) return;   // the paste event does it
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.key.length===1){ e.preventDefault(); KB.lastKeyFromScreen = false; kbType(e.key); }
}, true);
window.addEventListener('paste', e => { if(!KB.open) return; const t = (e.clipboardData || window.clipboardData)?.getData('text') || ''; if(t){ e.preventDefault(); kbPasteText(t); } }, true);
/* the game's older name for a text box */
function openRename(kind, crew){
  if(kind && typeof kind==='object') return openKeyboard(Object.assign({ ok:'Save' }, kind));
  if(kind==='ship') return openKeyboard({ title:'Name your ship', value:UI.shipName || DATA.ships[UI.selShip]?.name || '', max:24, ok:'Save', random:() => pick(SHIP_NAMES), onOk:v => { UI.shipName = v; } });
  if(kind==='seed') return openKeyboard({ title:'Enter a seed', value:UI.seed || '', max:24, upper:true, allowed:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-', ok:'Use seed', random:randomSeed, hint:'Same seed, same maps and events', onOk:v => { UI.seed = cleanSeed(v) || null; } });
  if(kind==='mp') return openKeyboard({ title:'Your name in multiplayer', value:mpName(), max:22, ok:'Save', random:mpRandomName, onOk:v => { PROFILE.mpName = v.slice(0, 22); saveProfile(); } });
  if(kind==='crew' && crew) return openKeyboard({ title:`Rename ${crew.name}`, value:crew.name, max:16, ok:'Save', random:() => pick(NAMES), onOk:v => { crew.name = v; if(typeof syncAfterInput==='function' && SYNC.on) syncAfterInput(); } });
}
