'use strict';
/* =========================================================================
   The crew roster: crew who outlive a run.
   - Save anyone to the roster (Crew → pick someone), and your
     roster crew are updated automatically at the end of every run they
     survive: level, prestige, skills, perks, abilities, grenades and kit.
   - In the hangar, "Crew roster" picks who flies with you this run.
   - Export a crew member, or the whole roster, as a file (or a code you can
     paste), and import it on another device.
   Dailies, challenges, campaign mods and multiplayer use their own crews.
   ========================================================================= */
const ROSTER_MAX = 40;
function roster(){ return (PROFILE.roster = PROFILE.roster || []); }
function rosterUid(){ return 'r' + Date.now().toString(36) + Math.floor(Math.random()*1e6).toString(36); }
function kitSnap(it){ return it && it.id ? { id:it.id, att:(it.att || []).slice(0, 2) } : null; }
function rosterSnap(c, old){ return { uid:c.rid || (old && old.uid) || rosterUid(), name:String(c.name).slice(0, 16), race:c.race, quirk:c.quirk || null, gender:c.gender || null, look:c.look || null,
  sk:Object.assign({}, c.sk || {}), lvl:c.lvl || 1, cxp:Math.floor(c.cxp || 0), pres:c.pres || 0, abil:(c.abil || []).slice(0, 4), perks:(c.perks || []).slice(0, 4), lethal:c.lethal || null, tactical:c.tactical || null,
  kit:{ arm:kitSnap(c.arm), side:kitSnap(c.side), suit:kitSnap(c.suit) }, kills:(old && old.kills || 0) + Math.max(0, (c.kills || 0) - (c._rk0 || 0)), runs:(old && old.runs) || 0, t:Date.now() }; }
function rosterSave(c, quiet){ if(!c || c.drone) return; const R_ = roster(), i = R_.findIndex(x => x.uid===c.rid);
  if(i < 0 && R_.length >= ROSTER_MAX){ toast(`The roster is full (${ROSTER_MAX}). Remove someone in the hangar first.`); return; }
  const snap = rosterSnap(c, i >= 0 ? R_[i] : null); c.rid = snap.uid; c._rk0 = c.kills || 0; if(i >= 0) R_[i] = snap; else R_.push(snap); saveProfile(); if(!quiet) toast(`${c.name} is in the crew roster. Pick them in the hangar for future runs.`); }
/* end of a run: everyone from the roster who made it home is updated (the fallen keep what they had) */
(function(){ if(typeof endRun!=='function') return; const e0 = endRun; endRun = function(win, reason){ try{ if(G && G.ship && rosterOk()){ for(const c of G.ship.crew) if(c.owner==='p' && !c.drone && c.rid && c.hp > 0){ const old = roster().find(x => x.uid===c.rid); if(old){ old.runs = (old.runs||0) + 1; rosterSave(c, true); } } } }catch(e){} return e0(win, reason); }; })();
function rosterOk(o){ return !(G && (G.daily || G.cup || G.challenge || G.seedDuel || G.tut)) && !(o && (o.daily || o.cup || o.challenge || o.seedDuel || o.practice)) && !(typeof CAMP!=='undefined' && CAMP) && !(typeof NET!=='undefined' && NET.on && NET.mode); }
/* bring them along: chosen in the hangar, swapped in as the run starts */
function rosterCrew(snap, old){ const race = DATA.races[snap.race] && !DATA.races[snap.race].secret ? snap.race : 'human', c = newCrew(race, 'p', snap.name);
  Object.assign(c, { quirk:snap.quirk || c.quirk, gender:snap.gender || c.gender, look:snap.look || c.look, sk:Object.assign({}, c.sk || {}, snap.sk || {}), lvl:snap.lvl || 1, cxp:snap.cxp || 0, pres:snap.pres || 0,
    abil:(snap.abil || []).slice(), perks:(snap.perks || []).slice(), lethal:snap.lethal, tactical:snap.tactical, rid:snap.uid, quirkSet:true });
  c.maxHp += 3*(c.pres || 0) + (c.abil.includes('juggernaut') ? 30 : 0); c.hp = c.maxHp;
  for(const k of ['arm', 'side', 'suit']){ const s = snap.kit && snap.kit[k]; if(s && DATA.arms[s.id]){ const it = armNew(s.id, 1); it.att = (s.att || []).filter(a => typeof LO_ATT==='undefined' || LO_ATT[a]); c[k] = it; } }
  if(old){ c.x = old.x; c.y = old.y; c.tx = old.tx; c.ty = old.ty; c.room = old.room; c.station = old.station; c.path = []; } c._rk0 = 0; return c; }
(function(){ const n0 = newRun; newRun = function(id, name, o = {}){ n0(id, name, o); const pickIds = UI.rosterPick || []; if(!G || !G.ship || !pickIds.length || !rosterOk(o)) return;
  const mine = G.ship.crew.filter(c => c.owner==='p' && !c.drone); let k = 0;
  for(const uid of pickIds){ const snap = roster().find(x => x.uid===uid); if(!snap) continue; const old = mine[k]; const c = rosterCrew(snap, old);
    if(old){ G.ship.crew[G.ship.crew.indexOf(old)] = c; k++; } else if(mine.length + (k - mine.length) < R.maxCrew){ G.ship.crew.push(c); placeCrew(G.ship, c, 0); } }
  if(typeof logEntry==='function') logEntry(`Veterans from the roster signed on: ${pickIds.map(u => (roster().find(x => x.uid===u) || {}).name).filter(Boolean).join(', ')}.`); save(); }; })();
/* sharing: a file to download, or a code to paste */
function rosterClean(x){ if(!x || typeof x!=='object' || typeof x.name!=='string') return null; const n = (v, lo, hi) => clamp(Math.round(+v || 0), lo, hi);
  const sk = {}; for(const k in (x.sk || {})) if(typeof x.sk[k]==='number') sk[k] = clamp(x.sk[k], 0, 1000);
  const kit = {}; for(const k of ['arm', 'side', 'suit']){ const s = x.kit && x.kit[k]; if(s && typeof s.id==='string' && DATA.arms[s.id]) kit[k] = { id:s.id, att:(Array.isArray(s.att) ? s.att : []).filter(a => typeof LO_ATT!=='undefined' && LO_ATT[a]).slice(0, 2) }; }
  return { uid:typeof x.uid==='string' ? x.uid.slice(0, 40) : rosterUid(), name:x.name.slice(0, 16), race:typeof x.race==='string' && DATA.races[x.race] && !DATA.races[x.race].secret ? x.race : 'human', quirk:typeof x.quirk==='string' ? x.quirk.slice(0, 24) : null,
    gender:x.gender==='f' || x.gender==='m' ? x.gender : null, look:x.look && typeof x.look==='object' ? x.look : null, sk, lvl:n(x.lvl, 1, 30), cxp:n(x.cxp, 0, 9999), pres:n(x.pres, 0, 10),
    abil:(Array.isArray(x.abil) ? x.abil : []).filter(a => typeof LO_ABIL!=='undefined' && LO_ABIL[a]).slice(0, 4), perks:(Array.isArray(x.perks) ? x.perks : []).map(p => typeof LO_PERKS!=="undefined" && LO_PERKS[p] ? p : null).slice(0, 4),
    lethal:typeof LO_LETHAL!=='undefined' && LO_LETHAL[x.lethal] ? x.lethal : null, tactical:typeof LO_TACT!=='undefined' && LO_TACT[x.tactical] ? x.tactical : null, kit, kills:n(x.kills, 0, 99999), runs:n(x.runs, 0, 9999), t:Date.now() }; }
function rosterImportText(t){ let d = null; t = String(t || '').trim();
  try{ if(/^VTLC1:/.test(t)) d = JSON.parse(decodeURIComponent(escape(atob(t.slice(6).replace(/\s+/g, ''))))); else d = JSON.parse(t); }catch(e){ toast('That isn\'t a crew file or code.'); return 0; }
  const list = Array.isArray(d) ? d : d && Array.isArray(d.crews) ? d.crews : d && d.name ? [d] : []; let n = 0;
  for(const x of list){ const c = rosterClean(x); if(!c) continue; const R_ = roster(), i = R_.findIndex(o => o.uid===c.uid); if(i >= 0) R_[i] = c; else if(R_.length < ROSTER_MAX) R_.push(c); else break; n++; }
  saveProfile(); toast(n ? `Imported ${n} crew member${n===1 ? '' : 's'} into the roster.` : 'Nobody to import there.'); return n; }
function rosterCode(list){ return 'VTLC1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ vtlCrew:1, crews:list })))); }
function rosterExport(list, name){ const json = JSON.stringify({ vtlCrew:1, crews:list }, null, 1);
  try{ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type:'application/json' })); a.download = name || 'vaster-than-life-crew.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }catch(e){}
  try{ navigator.clipboard && navigator.clipboard.writeText(rosterCode(list)); toast(`Saved ${name || 'the file'}, and copied a crew code to the clipboard too.`); }catch(e){ toast('Crew file saved.'); } }
function rosterImportFile(){ try{ const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json,text/plain'; inp.onchange = () => { const f = inp.files && inp.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => rosterImportText(r.result); r.readAsText(f); }; inp.click(); }catch(e){ toast('This browser can\'t open files here: use Paste code instead.'); } }
function rosterPasteCode(){ if(typeof openKeyboard==='function') openKeyboard({ title:'Paste a crew code (Ctrl+V, or the Paste key)', value:'', max:60000, min:6, ok:'Import', onOk:v => rosterImportText(v) }); }
/* the hangar: picked veterans replace the first seats in the crew line */
function rosterHangarNames(temp){ const P = (UI.rosterPick || []).map(u => roster().find(x => x.uid===u)).filter(Boolean); if(!P.length || (typeof NET!=='undefined' && NET.on) || (typeof CAMP!=='undefined' && CAMP)) return null;
  const base = hangarCrew(UI.selShip, temp).names.map((n, i) => `${n} (${DATA.races[temp.crew[i].race].name})`);
  return base.map((t, i) => P[i] ? `★ ${P[i].name} (Lv ${P[i].lvl}${P[i].pres ? ' ★' + P[i].pres : ''})` : t).concat(P.slice(base.length).map(r => `★ ${r.name}`)).join(', '); }
/* the hangar: the roster overlay */
function drawRosterButton(x, y){ if(typeof NET!=='undefined' && NET.on) return; if(typeof CAMP!=='undefined' && CAMP) return; const n = (UI.rosterPick || []).length;
  btn(x, y, 230, 48, `Crew roster${n ? ` · ${n} picked` : ` (${roster().length})`}`, () => { UI.rosterOpen = true; }, { s:15, col:C.cyan, fill:n > 0 });
  tip(x, y, 230, 48, 'Crew roster', 'Veterans you saved from earlier runs, or imported from another device. Pick who flies with you this time.'); }
function drawRosterOverlay(){
  if(!UI.rosterOpen || UI.screen!=='select') return; ctx.fillStyle = 'rgba(4,6,12,.88)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => {}, null, true);
  const f = { x:80, y:50, w:W - 160, h:H - 100 }; rr(f.x, f.y, f.w, f.h, 16); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
  label('Veterans', f.x + 36, f.y + 46, C.cyan, 'left', 15); T('Crew roster', f.x + 36, f.y + 92, { s:38, f:FD, w:700 });
  const def = DATA.ships[UI.selShip], seats = def && def.crew ? def.crew.length : 3, pickL = (UI.rosterPick = (UI.rosterPick || []).filter(u => roster().some(x => x.uid===u)));
  T(`Pick up to ${seats} to fly with you (they replace the ship's usual crew). ${pickL.length}/${seats} picked.`, f.x + 300, f.y + 88, { s:15, c:C.ink, max:f.w - 340 });
  const R_ = roster(), per = 12, pages = Math.max(1, Math.ceil(R_.length/per)), pg = clamp(UI.rosterPg || 0, 0, pages - 1), cw = (f.w - 72 - 40)/3;
  if(!R_.length) para('Nobody yet. In a run, tap Crew, pick someone and press "Save to roster" you want to keep. They\'re updated at the end of every run they survive. Or import a crew file from another device.', f.x + 36, f.y + 150, f.w - 72, { s:17, lh:25, c:C.muted });
  R_.slice(pg*per, pg*per + per).forEach((r, i) => { const x = f.x + 36 + (i % 3)*(cw + 20), y = f.y + 120 + Math.floor(i/3)*126, on = pickL.includes(r.uid), race = DATA.races[r.race] || {};
    rr(x, y, cw, 116, 10); ctx.fillStyle = on ? hexA(C.cyan, .14) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.cyan : C.line; ctx.lineWidth = on ? 2.5 : 1; ctx.stroke();
    T(r.name, x + 16, y + 30, { s:19, f:FD, w:700, max:cw - 150 }); T(`Lv ${r.lvl}${r.pres ? '  ★' + r.pres : ''}`, x + cw - 16, y + 30, { s:15, a:'right', c:C.amber });
    T(`${race.name || r.race}${r.quirk && typeof quirkDef==='function' && quirkDef(r.quirk) ? ' · ' + quirkDef(r.quirk).name : ''} · ${r.runs || 0} run${r.runs===1 ? '' : 's'} · ${r.kills || 0} kills`, x + 16, y + 52, { s:12, c:race.color || C.muted, max:cw - 32 });
    const k = r.kit || {}; T([k.arm, k.side].filter(Boolean).map(s => (DATA.arms[s.id] || {}).name).filter(Boolean).join(' + ') || 'No weapons', x + 16, y + 72, { s:12, c:C.muted, max:cw - 32 });
    btn(x + 12, y + 80, 120, 30, on ? '✓ Flying' : 'Bring', () => { if(on) UI.rosterPick = pickL.filter(u => u!==r.uid); else if(pickL.length < seats) UI.rosterPick = [...pickL, r.uid]; else toast(`This ship has ${seats} seats.`); }, { s:13, col:C.cyan, fill:on });
    btn(x + 140, y + 80, 100, 30, 'Export', () => rosterExport([r], `crew-${r.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`), { s:12 });
    btn(x + cw - 112, y + 80, 100, 30, UI.rosterDel===r.uid ? 'Sure?' : 'Remove', () => { if(UI.rosterDel!==r.uid){ UI.rosterDel = r.uid; return; } UI.rosterDel = null; PROFILE.roster = R_.filter(o => o!==r); UI.rosterPick = pickL.filter(u => u!==r.uid); saveProfile(); }, { s:12, col:C.hostile }); });
  if(pages > 1){ btn(f.x + f.w - 200, f.y + 60, 50, 40, '‹', () => { UI.rosterPg = pg - 1; }, { disabled:pg <= 0 }); btn(f.x + f.w - 140, f.y + 60, 50, 40, '›', () => { UI.rosterPg = pg + 1; }, { disabled:pg >= pages - 1 }); }
  const by = f.y + f.h - 84;
  btn(f.x + 36, by, 230, 56, 'Export whole roster', () => rosterExport(R_, 'vaster-than-life-roster.json'), { s:15, disabled:!R_.length });
  btn(f.x + 276, by, 200, 56, 'Import file', () => rosterImportFile(), { s:15 });
  btn(f.x + 486, by, 200, 56, 'Paste code', () => rosterPasteCode(), { s:15 });
  if(pickL.length) btn(f.x + 696, by, 200, 56, 'Clear picks', () => { UI.rosterPick = []; }, { s:15 });
  btn(f.x + f.w - 236, by, 200, 56, 'Done', () => { UI.rosterOpen = false; UI.rosterDel = null; }, { fill:true, s:18 });
}
