'use strict';
/* =========================================================================
   Career: a captain level that moves every run, and save slots.

   Captain level (like an online shooter's player level): xp for everything
   you do in a run, win or lose: jumps, beacons, ships beaten, sectors
   crossed, the Dreadnought, crew levelling up, medals. Levels come quickly at
   first and more slowly later, up to level 55; then you can prestige (★) and
   climb again. Ships the Admiralty releases by level (the hangar) count your
   prestiges too, so nothing locks again. Renown and rank stay as they were.

   Save slots: up to five separate careers on one device, each with its own
   record, unlocks, roster and run in progress (settings are shared). Download
   everything to one file to move it to another device, load that file back,
   or clear everything and start again.
   ========================================================================= */
const CAP_MAX = 55;
function capXpFor(L){ return 100*(L - 1) + 25*(L - 1)*(L - 1); }   // total xp to reach level L
function capMigrate(){ if(PROFILE.cxp != null) return; const r = PROFILE.renown || 0, old = Math.min(50, 1 + Math.floor(Math.sqrt(Math.max(0, r)/4))); PROFILE.cxp = capXpFor(old) + r*5; }   // earlier careers start where they were, plus a bit for their history
function capXp(){ capMigrate(); return PROFILE.cxp || 0; }
function capLevelAt(x){ let L = 1; while(L < CAP_MAX && x >= capXpFor(L + 1)) L++; return L; }
function capLevel(){ return capLevelAt(capXp()); }
function capPres(){ return PROFILE.cpres || 0; }
function capShipsAt(lv){ try{ return Object.values(DATA.ships).filter(d => d && !d.secret && typeof shipProg==='function' && shipProg(d).lvl===lv).map(d => d.name); }catch(e){ return []; } }
/* the hangar's level checks use every level you've climbed, prestiges included */
pilotLevel = function(){ return capLevel() + CAP_MAX*capPres(); };
function capGain(n){
  if(!n || !G || G.tut || UI.screen==='title') return; capMigrate();
  n = Math.round(n * ({ easy:.8, normal:1, hard:1.25 }[G.diff] || 1)); if(n <= 0) return;
  const p0 = pilotLevel(), L0 = capLevel(); PROFILE.cxp += n; G.cxpRun = (G.cxpRun || 0) + n; const L1 = capLevel();
  if(L1 > L0){ const ships = []; for(let l = p0 + 1; l <= pilotLevel(); l++) ships.push(...capShipsAt(l));
    toast(`Captain level ${L1}!${ships.length ? ' New ship cleared for you: ' + ships.join(', ') + '.' : ''}${L1===CAP_MAX ? ' Maximum level: you can prestige from the title screen.' : ''}`); if(typeof sfx==='function') sfx('levelup'); saveProfile(); } }
function capPrestige(){ if(capLevel() < CAP_MAX || capPres() >= 10) return; PROFILE.cpres = capPres() + 1; PROFILE.cxp = 0; saveProfile(); toast(`Prestige ${PROFILE.cpres}! Back to captain level 1, with a ★ by your name.`); if(typeof sfx==='function') sfx('achieve'); }
(function(){
  const j0 = homeJump; homeJump = function(){ j0(); capGain(10); saveProfile(); };
  const c0 = chooseOption; chooseOption = function(o){ const ev = G && G.modal && G.modal.type==='event'; c0(o); if(ev) capGain(12); };
  const f0 = finishCombat; finishCombat = function(kind, offer){ const had = !!(G && G.enemy); f0(kind, offer); if(had) capGain(kind==='fled' ? 10 : 40 + 10*(G.sector || 1)); };
  if(typeof flagDefeated==='function'){ const d0 = flagDefeated; flagDefeated = function(...a){ capGain(250); return d0(...a); }; }
  const g0 = gainXP; gainXP = function(c, s, amt){ g0(c, s, amt); if(c && c.owner==='p' && !c.drone){ if(s==='combat') capGain(5*amt); else if(s==='repair') capGain(2*amt); } };
  if(typeof loLevelUp==='function'){ const l0 = loLevelUp; loLevelUp = function(c){ l0(c); capGain(20); }; }
  const a0 = grant; grant = function(id){ const had = !!PROFILE.ach[id]; a0(id); if(!had && PROFILE.ach[id] && G && UI.screen==='game') capGain(50); };
  const s0 = genSector; genSector = function(...a){ const r = s0(...a); if(G && G.sector > 1 && G._capSec !== G.sector){ G._capSec = G.sector; capGain(100); } return r; };
  const n0 = newRun; newRun = function(...a){ n0(...a); if(G){ G.cxpRun = 0; G.cap0 = capLevel(); G.capX0 = capXp(); } };
  if(typeof campaignRunEnd==='function'){ const e0 = campaignRunEnd; campaignRunEnd = function(win, reason){ if(win) capGain(1000); else capGain(50 + 25*Math.max(0, (G && G.sector || 1) - 1));   // every run counts, the further the better
    PROFILE.lastCxp = G ? G.cxpRun || 0 : 0; e0(win, reason); const d = UI.debrief; if(d && G){ const L = capLevel(); d.unlocks = d.unlocks || []; d.unlocks.unshift(`Captain xp +${fmtNum(G.cxpRun || 0)} this run · level ${G.cap0 || L}${L > (G.cap0 || L) ? ' → ' + L : ''}`); } }; }
})();
/* the title screen's career card: rank, captain level and the bar to the next one */
drawRankCard = function(x, y, w){
  const L = capLevel(), P = capPres(), x0 = capXpFor(L), x1 = capXpFor(L + 1), cur = capXp(), fr = L >= CAP_MAX ? 1 : clamp((cur - x0)/(x1 - x0), 0, 1), last = (PROFILE.history || [])[0];
  T(`${rankName()} · Level ${L}${P ? ' ★' + P : ''}`, x, y, { s:24, f:FD, w:700, c:C.amber, max:w - 150 });
  rr(x, y + 12, w, 10, 5); ctx.fillStyle = 'rgba(6,9,18,.8)'; ctx.fill(); rr(x, y + 12, Math.max(10, w*fr), 10, 5); ctx.fillStyle = C.amber; ctx.fill();
  T(L >= CAP_MAX ? (P < 10 ? 'Maximum level: prestige is ready (Career ›)' : 'Maximum level and prestige') : `${fmtNum(cur - x0)} / ${fmtNum(x1 - x0)} xp to level ${L + 1}${PROFILE.lastCxp ? ` · +${fmtNum(PROFILE.lastCxp)} last run` : ''}`, x, y + 44, { s:13, c:C.muted, max:w });
  tip(x, y - 24, w, 76, `Captain level ${L}`, `Every run earns xp, win or lose: jumps, beacons, ships beaten, sectors crossed, the Dreadnought, crew levelling up and medals. Levels clear new ships for the hangar. At level ${CAP_MAX} you can prestige and climb again. Your rank (${rankName()}) comes from renown, earned at the end of each run.`);
};
/* prestige lives on the Career screen */
(function(){ if(typeof drawCareer!=='function') return; const d0 = drawCareer; drawCareer = function(){ d0(); if(capLevel() >= CAP_MAX && capPres() < 10) btn(1100, 906, 220, 64, UI.capAsk ? 'Sure? Tap again' : '★ Prestige', () => { if(!UI.capAsk){ UI.capAsk = true; return; } UI.capAsk = false; capPrestige(); }, { s:18, col:C.violet || '#c48bff', fill:!!UI.capAsk }); }; })();

/* ---------------- save slots ---------------- */
const SLOT_KEY = 'vtl2.slots', SLOT_MAX = 5;
function slotKey(i){ return 'vtl2.slot.' + i; }
function slotsMeta(){ const m = LS.get(SLOT_KEY, null); if(m && Array.isArray(m.list) && m.list.length) return m; return { cur:0, list:[{ name:'Save 1' }] }; }
function slotsSave(m){ return LS.set(SLOT_KEY, m); }
function slotData(i){ const m = slotsMeta(); if(i===m.cur) return { profile:PROFILE, save:LS.get(SAVE_KEY, null) }; return LS.get(slotKey(i), null) || { profile:null, save:null }; }
function slotSummary(i){ const d = slotData(i), p = d.profile; if(!p) return 'Empty: a fresh start';
  const lv = capLevelAt(p.cxp != null ? p.cxp : capXpFor(Math.min(50, 1 + Math.floor(Math.sqrt(Math.max(0, p.renown || 0)/4))))), wins = Object.values(p.wins || {}).reduce((a, b) => a + (+b || 0), 0);
  return `Level ${lv}${p.cpres ? ' ★' + p.cpres : ''} · ${p.runs || 0} runs · ${wins} wins${d.save ? ' · run in progress' : ''}`; }
function freshProfile(){ return { ach:{}, maxSector:1, kills:0, wins:{}, runs:0, settings:Object.assign({}, SET) }; }
/* swap the active career out to its slot, and another in; then reload so everything starts clean */
function slotSwitch(i){ const m = slotsMeta(); if(i===m.cur || !m.list[i]) return;
  saveProfile(); const out = { profile:PROFILE, save:LS.get(SAVE_KEY, null), t:Date.now() };
  if(!LS.set(slotKey(m.cur), out)){ if(!LS.set(slotKey(m.cur), { profile:PROFILE, save:null, t:Date.now() })){ toast('Not enough storage on this device to switch saves. Download your data first, or clear a save.'); return; } toast('Not enough room to keep this save\'s run in progress: the career is kept, the run is not.'); }
  const d = LS.get(slotKey(i), null), prof = (d && d.profile) || freshProfile(); prof.settings = Object.assign({}, SET);   // settings belong to the device
  LS.set(PROFILE_KEY, prof); if(d && d.save) LS.set(SAVE_KEY, d.save); else LS.del(SAVE_KEY); LS.del(slotKey(i));
  m.cur = i; slotsSave(m); setTimeout(() => (() => { try{ location.reload(); }catch(e){} })(), 150); }
function slotNew(){ const m = slotsMeta(); if(m.list.length >= SLOT_MAX){ toast(`${SLOT_MAX} saves is the most this device keeps.`); return; } m.list.push({ name:`Save ${m.list.length + 1}` }); slotsSave(m); slotSwitch(m.list.length - 1); }
function slotRename(i){ const m = slotsMeta(); if(!m.list[i]) return; if(typeof openRename==='function') openRename({ title:'Name this save', value:m.list[i].name, max:20, onOk:v => { const mm = slotsMeta(); if(mm.list[i]){ mm.list[i].name = String(v || mm.list[i].name).slice(0, 20); slotsSave(mm); } } }); }
function slotDelete(i){ const m = slotsMeta(); if(!m.list[i]) return;
  if(i===m.cur){ const s = Object.assign({}, SET); for(const k of Object.keys(PROFILE)) delete PROFILE[k]; Object.assign(PROFILE, freshProfile(), { settings:s }); saveProfile(); LS.del(SAVE_KEY); toast(`${m.list[i].name} cleared: a fresh start.`); setTimeout(() => (() => { try{ location.reload(); }catch(e){} })(), 300); return; }
  LS.del(slotKey(i)); for(let k = i + 1; k < m.list.length; k++){ const d = LS.get(slotKey(k), null); if(d) LS.set(slotKey(k - 1), d); else LS.del(slotKey(k - 1)); } LS.del(slotKey(m.list.length - 1));
  m.list.splice(i, 1); if(m.cur > i) m.cur--; slotsSave(m); toast('Save deleted.'); }
/* everything in one file */
function allData(){ const m = slotsMeta(); return { app:'vaster-than-life', v:2, kind:'all', t:Date.now(), cur:m.cur, settings:SET, mods:MODS, slots:m.list.map((s, i) => Object.assign({ name:s.name }, slotData(i))) }; }
function downloadAll(){ try{ const blob = new Blob([JSON.stringify(allData())], { type:'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vaster-than-life-all-${todayKey()}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('All your data is in your downloads.'); }catch(e){ toast('Could not save a file on this device.'); } }
function restoreAll(d){ try{ if(d && d.profile) renameProfile(d.profile); }catch(e){}
  if(!d || d.app!=='vaster-than-life') { toast('That file is not Vaster Than Life data.'); return false; }
  if(d.kind!=='all'){ return restoreBackup(d); }   // an older one-career backup: load it into this save
  const list = (d.slots || []).slice(0, SLOT_MAX); if(!list.length){ toast('That file has no saves in it.'); return false; }
  for(let i = 0; i < SLOT_MAX; i++) LS.del(slotKey(i));
  const cur = clamp(d.cur || 0, 0, list.length - 1), settings = Object.assign({}, SET, d.settings || {});
  list.forEach((s, i) => { const prof = s.profile || freshProfile(); prof.settings = settings; if(i===cur){ LS.set(PROFILE_KEY, prof); if(s.save) LS.set(SAVE_KEY, s.save); else LS.del(SAVE_KEY); } else LS.set(slotKey(i), { profile:prof, save:s.save || null }); });
  slotsSave({ cur, list:list.map((s, i) => ({ name:s.name || `Save ${i + 1}` })) }); if(Array.isArray(d.mods)){ MODS = d.mods; saveMods(); }
  toast(`Loaded ${list.length} save${list.length===1 ? '' : 's'} from ${new Date(d.t || Date.now()).toLocaleDateString('en-GB')}.`); setTimeout(() => (() => { try{ location.reload(); }catch(e){} })(), 600); return true; }
function uploadAll(){ const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => { const f = inp.files && inp.files[0]; if(!f) return; try{ restoreAll(JSON.parse(await f.text())); }catch(e){ toast('That file is not Vaster Than Life data.'); } };
  try{ inp.click(); }catch(e){ toast('Could not open the file picker here.'); } }
function clearAll(){ try{ const keys = []; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k && /^vtl/.test(k)) keys.push(k); } for(const k of keys) localStorage.removeItem(k); }catch(e){}
  toast('Everything cleared. Starting fresh.'); setTimeout(() => (() => { try{ location.reload(); }catch(e){} })(), 500); }
/* Settings → Profile: the saves and data panel */
function drawSavesPanel(X, y){
  const m = slotsMeta(), rowH = 64;
  label('Saves on this device', X, y + 18, C.cyan, 'left', 15); T('Each save is a separate career: record, unlocks, roster and the run in progress. Settings are shared.', X + 280, y + 18, { s:14, c:C.muted, max:1050 }); y += 30;
  m.list.forEach((s, i) => { const on = i===m.cur, yy = y + i*(rowH + 8); rr(X, yy, 1360, rowH, 10); ctx.fillStyle = on ? hexA(C.amber, .14) : 'rgba(6,9,18,.55)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : C.line; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    T(s.name + (on ? '  (playing)' : ''), X + 20, yy + 28, { s:20, f:FD, w:700, c:on ? C.amber : C.ink, max:440 }); T(slotSummary(i), X + 20, yy + 52, { s:14, c:C.muted, max:600 });
    if(!on) btn(X + 760, yy + 10, 200, 44, 'Play this save', () => slotSwitch(i), { s:15, fill:true, col:C.good });
    btn(X + 970, yy + 10, 150, 44, 'Rename', () => slotRename(i), { s:15 });
    btn(X + 1130, yy + 10, 210, 44, UI.slotDel===i ? 'Sure? Tap again' : on ? 'Clear this save' : 'Delete', () => { if(UI.slotDel!==i){ UI.slotDel = i; return; } UI.slotDel = null; slotDelete(i); }, { s:15, col:C.hostile, fill:UI.slotDel===i }); });
  y += m.list.length*(rowH + 8) + 6;
  if(m.list.length < SLOT_MAX) btn(X, y, 260, 48, '+ New save', () => slotNew(), { s:16, col:C.good });
  y += 66; label('All your data', X, y + 18, C.cyan, 'left', 15); y += 30;
  btn(X, y, 300, 52, 'Download all data', () => { if(typeof inXR==='function' && inXR()) toast('Take the headset off to save a file.'); else downloadAll(); }, { s:16 });
  btn(X + 320, y, 300, 52, 'Load data file', () => { if(typeof inXR==='function' && inXR()) toast('Take the headset off to load a file.'); else uploadAll(); }, { s:16 });
  btn(X + 640, y, 300, 52, UI.clearAsk ? 'Really? Tap again' : 'Clear all data', () => { if(!UI.clearAsk){ UI.clearAsk = true; toast('This deletes every save, setting and mod on this device. Tap again to confirm.'); return; } UI.clearAsk = false; clearAll(); }, { s:16, col:C.hostile, fill:!!UI.clearAsk });
  para('Download all data saves every save, your settings and mods to one file: load it on another device (or this one) to carry on. Clear all data starts again from nothing.', X + 960, y + 4, 400, { s:13, lh:18, c:C.muted, max:3 });
}
