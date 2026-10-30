'use strict';
/* =========================================================================
   Core: utilities, saved profile and settings, mods, audio and music.
   ========================================================================= */
const rand = (a,b) => a + Math.random()*(b-a);
const ri = (a,b) => Math.floor(rand(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const clone = o => JSON.parse(JSON.stringify(o));
const MR0 = Math.random.bind(Math);   // the real random source: ids must stay unique even while a seeded run swaps Math.random
let UIDN = 0; const uid = () => (UIDN++).toString(36) + MR0().toString(36).slice(2,9);
function hexA(hex, a){ const h = String(hex).replace('#',''); const n = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h.slice(0,6), 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`; }
function wpick(items, wf){ const tot = items.reduce((s,i)=>s+Math.max(0,wf(i)),0); if(tot<=0) return items[0]; let r = Math.random()*tot; for(const i of items){ r -= Math.max(0,wf(i)); if(r<=0) return i; } return items[items.length-1]; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
const LS = {
  get(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
const SAVE_KEY = 'vtl2.save', MOD_KEY = 'vtl.mods', PROFILE_KEY = 'vtl2.profile';

/* ---------------- profile, settings, unlocks ---------------- */
const PROFILE = Object.assign({ ach:{}, maxSector:1, kills:0, wins:{}, runs:0 }, LS.get(PROFILE_KEY, {}));
PROFILE.settings = Object.assign({ music:.5, sfx:.7, difficulty:(PROFILE.runs||0)===0 ? 'easy' : 'normal', hints:true, unlockAll:false, allowScripts:false, holotable:true, smartPause:true }, PROFILE.settings||{});
const SET = PROFILE.settings;
function saveProfile(){ LS.set(PROFILE_KEY, PROFILE); }
/* colour vision and contrast: remap the status colours used by the 2D interface and the VR consoles.
   Red-green safe swaps green for blue and deepens the red, so friend, foe and health stay apart
   for protanopia and deuteranopia (the commonest kinds). */
const C_BASE = Object.assign({}, C);
const PALETTES = { redgreen:{ good:'#4b9dff', hostile:'#ff4545', warn:'#ffe066' } };
const CONTRAST = { muted:'#b8c3dc', line:'#3c4c76', ink:'#ffffff' };
function applyPalette(){ for(const k in C_BASE) C[k] = C_BASE[k]; Object.assign(C, PALETTES[SET.palette] || {}); if(SET.contrast) Object.assign(C, CONTRAST); }
applyPalette();
function grant(id){
  if(PROFILE.ach[id]) return; const a = ACHIEVEMENTS.find(x=>x.id===id); if(!a) return;
  PROFILE.ach[id] = Date.now(); saveProfile(); if(typeof sfx==='function') sfx('achieve');
  if(typeof toast==='function') toast(`Achievement: ${a.name}`); sfx('buy');
}
/* the difficulty of the run in progress (a daily challenge fixes its own), or the one picked in the hangar */
/* the pop-up that stops the game (in multiplayer only shared pop-ups do; the map, ship screen and store are each player's own) */
function blockingModal(){ return typeof SYNC!=='undefined' && SYNC.on ? SYNC.smodal : (G && G.modal); }
function curDiff(){ return DIFFICULTY[(typeof G!=='undefined' && G && G.diff) || SET.difficulty] || DIFFICULTY.normal; }
function shipUnlocked(def){
  if(SET.unlockAll || PROFILE.unlocked?.[def.id]) return true; const u = def.unlock; if(!u) return true;
  if(u.sector) return PROFILE.maxSector >= u.sector;
  if(u.ach) return !!PROFILE.ach[u.ach];
  if(u.win) return !!PROFILE.wins[u.win];
  if(u.kills) return PROFILE.kills >= u.kills;
  return true;
}
function unlockText(u){
  if(!u) return '';
  if(u.sector) return `Reach sector ${u.sector} in any run.`;
  if(u.ach) return `Earn the "${(ACHIEVEMENTS.find(a=>a.id===u.ach)||{}).name||u.ach}" achievement.`;
  if(u.win) return `Win with ${DATA.ships[u.win]?.name || u.win}.`;
  if(u.kills) return `Defeat ${u.kills} ships across all runs.`;
  return '';
}

/* ---------------- mods ---------------- */
let MODS = LS.get(MOD_KEY, []);
let DATA = null, R = null;
const KINDS = ['weapons','races','ships','enemies','events','drones','augments','sectors','traits','challenges'];
const NOTRAIT = {};
function traitOf(c){ const t = (c && c.trait && DATA && DATA.traits && DATA.traits[c.trait]) || NOTRAIT; const p = typeof perkOf==='function' ? perkOf(c) : null; return p ? mergeTrait(t, p) : t; }   // personalities, friendship and good food (homestead.js)
let HOOKS = {};
function on(evt, fn){ (HOOKS[evt] = HOOKS[evt] || []).push(fn); }
function emit(evt, arg){ const list = HOOKS[evt]; if(!list) return; for(const fn of list){ try{ fn(arg); }catch(e){ if(typeof toast==='function') toast('Mod script error: ' + e.message); } } }
function toMap(x){ if(!x) return {}; if(Array.isArray(x)){ const m={}; x.forEach(o=>{ if(o && o.id!=null) m[o.id]=o; }); return m; } return typeof x==='object' ? x : {}; }
function applyMods(baseOnly){
  DATA = clone(BASE); HOOKS = {};
  for(const k of KINDS) for(const id in DATA[k]) DATA[k][id].id = id;
  for(const m of MODS){
    if(!m.enabled || baseOnly) continue; const d = m.data || {};
    if(d.rules && typeof d.rules==='object') Object.assign(DATA.rules, d.rules);
    for(const k of KINDS){ const mp = toMap(d[k]); for(const id in mp) DATA[k][id] = Object.assign({}, DATA[k][id]||{}, mp[id], { id }); }
    if(d.remove && typeof d.remove==='object') for(const k in d.remove) if(DATA[k] && Array.isArray(d.remove[k])) d.remove[k].forEach(id => delete DATA[k][id]);
  }
  R = DATA.rules;
  if(SET.allowScripts && !baseOnly){ for(const m of MODS){ if(!m.enabled || typeof m.data?.script!=='string') continue;
    try{ new Function('VTL', m.data.script)(modAPI()); }catch(e){ if(typeof toast==='function') toast(`Script in ${m.name} failed: ${e.message}`); } } }
}
function modAPI(){
  return { on, emit, get G(){ return G; }, get DATA(){ return DATA; }, get UI(){ return UI; },
    toast:(t)=>toast(t), applyEffect:(e)=>applyEffect(e), startCombat:(id)=>startCombat(id), giveWeapon:(id)=>giveWeapon(id),
    addEvent:(id,ev)=>{ DATA.events[id] = Object.assign({ id }, ev); }, rand, pick };
}
function validateMod(d){
  const E = [];
  if(!d || typeof d!=='object' || Array.isArray(d)) return ['The file must contain one JSON object, starting with { and ending with }.'];
  if(typeof d.name!=='string' || !d.name.trim()) E.push('Add a "name" string so the mod can be listed.');
  for(const k of KINDS){ if(Array.isArray(d[k])) d[k].forEach((o,i)=>{ if(!o || o.id==null) E.push(`${k}[${i}] needs an "id".`); }); }
  const types = ['laser','missile','ion','beam','flak','bomb'];
  const Wm = toMap(d.weapons); for(const id in Wm){ const w = Wm[id];
    if(!types.includes(w.type)) E.push(`Weapon "${id}": "type" must be one of ${types.join(', ')}.`);
    for(const f of ['charge','power']) if(typeof w[f]!=='number') E.push(`Weapon "${id}": "${f}" must be a number.`); }
  const Dm = toMap(d.drones); for(const id in Dm){ const x = Dm[id];
    if(!['attack','defense','anti','internal','boarding','hull'].includes(x.kind)) E.push(`Drone "${id}": "kind" must be attack, defense, anti, internal, boarding or hull.`);
    if(typeof x.power!=='number') E.push(`Drone "${id}": "power" must be a number.`); }
  const Rm = toMap(d.races); for(const id in Rm){ if(typeof Rm[id].hp!=='number') E.push(`Race "${id}": "hp" must be a number.`); }
  for(const [k,label] of [['ships','Ship'],['enemies','Enemy']]){ const M = toMap(d[k]); for(const id in M){ const s = M[id];
    if(typeof s.hull!=='number') E.push(`${label} "${id}": "hull" must be a number.`);
    if(!s.systems || typeof s.systems!=='object') E.push(`${label} "${id}": add a "systems" object, e.g. {"shields":2}.`);
    if(s.rooms && !Array.isArray(s.rooms)) E.push(`${label} "${id}": "rooms" must be a list.`); } }
  const Ev = toMap(d.events); for(const id in Ev){ const e = Ev[id];
    if(typeof e.text!=='string') E.push(`Event "${id}": add a "text" string.`);
    if(!Array.isArray(e.choices) || !e.choices.length) E.push(`Event "${id}": add at least one entry in "choices".`);
    else e.choices.forEach((c,i)=>{ if(typeof c.text!=='string') E.push(`Event "${id}" choice ${i+1}: add a "text" string.`);
      if(!c.effect && c.chance==null) E.push(`Event "${id}" choice ${i+1}: add an "effect", or "chance" with "success" and "fail".`); }); }
  if(d.script!=null && typeof d.script!=='string') E.push('"script" must be a string of JavaScript.');
  return E;
}
// gentle warnings for fields the game never reads, so a typo like "damge" doesn't fail silently
const MOD_KEYS = { weapons:'name type damage shots charge power cost tier fire breach sysDamage crewDamage ion stun pierce rooms radius heal desc',
  drones:'name kind power cost rate shot targets role heal desc', races:'name color hp repair combat speed power heal fireproof telepathic mindImmune deathBurst learn armor noAir desc',
  augments:'name cost desc fx', traits:'name desc repair dps speed charge shield hp evade heal', sectors:'name blurb color mix tags enemyTags hazards nebula fleetMult intro',
  enemies:'name tags onlyTagged eventOnly hull systems weapons drones crew sectors auto super boss phases', ships:'name cls layout desc hull reactor color image systems reserve weapons drones crew augments fuel missiles parts pattern rooms unlock',
  events:'text weight minSector maxSector tags nebula distress questOnly once flag noFlag hail art choices',
  challenges:'name desc tier ship difficulty rules start scrapMult goal' };
const MOD_FX = 'evade ionRes sysRes breachRes ammo speed shield heal charge dps repair scrap superShield'.split(' ');
const MOD_EFFECTS = 'text scrap fuel missiles parts hull crew crewLoss weapon drone augment install upgrade damageSystem reactor fire fight afterWin event quest later store choices setFlag clearFlag begin dismiss crewHeal crewHurt maxHull xp reveal fleetPush mapPiece unlock achievement primeWeapons'.split(' ');
let MOD_ALLOW = null;
function modWarnings(d){
  if(!MOD_ALLOW){ MOD_ALLOW = {}; const B = typeof BASE!=='undefined' ? BASE : DATA;
    for(const k in MOD_KEYS){ const s = new Set(['id', ...MOD_KEYS[k].split(' ')]); for(const o of Object.values(B[k]||{})) for(const f in o) s.add(f); MOD_ALLOW[k] = s; }
    const eff = new Set(MOD_EFFECTS), walk = (e) => { if(!e) return; for(const f in e) eff.add(f); for(const c of e.choices||[]){ walk(c.effect); walk(c.success); walk(c.fail); } };
    for(const ev of Object.values(B.events||{})) for(const c of ev.choices||[]){ walk(c.effect); walk(c.success); walk(c.fail); } MOD_ALLOW.effects = eff; }
  const W = [];
  for(const k in MOD_KEYS) for(const [id,o] of Object.entries(toMap(d[k]))) for(const f in (o||{})) if(!MOD_ALLOW[k].has(f)) W.push(`${k} "${id}": the game doesn't use "${f}".`);
  for(const [id,a] of Object.entries(toMap(d.augments))) for(const f in (a?.fx||{})) if(!MOD_FX.includes(f)) W.push(`augment "${id}": unknown fx "${f}" (use ${MOD_FX.join(', ')}).`);
  const chk = (e, id) => { if(!e) return; for(const f in e) if(!MOD_ALLOW.effects.has(f)) W.push(`event "${id}": unknown effect "${f}".`); if(e.afterWin) chk(e.afterWin, id); for(const c of e.choices||[]){ chk(c.effect,id); chk(c.success,id); chk(c.fail,id); } };
  for(const [id,ev] of Object.entries(toMap(d.events))) for(const c of ev?.choices||[]){ chk(c.effect, id); chk(c.success, id); chk(c.fail, id); }
  return W;
}
const KIND_ONE = { races:'race', weapons:'weapon', drones:'drone', augments:'augment', ships:'ship', enemies:'enemy', sectors:'sector', events:'event', traits:'trait', challenges:'challenge' };
function modSummary(d){ const parts=[]; for(const k of KINDS){ const n = Object.keys(toMap(d[k])).length; if(n) parts.push(`${n} ${n===1 ? (KIND_ONE[k]||k) : k}`); }
  if(d.rules) parts.push('rules'); if(d.script) parts.push('script'); return parts.join(', ') || 'no content'; }
function addModText(txt, label){
  let d; try{ d = JSON.parse(txt); }catch(e){ return { ok:false, msg:`${label}: this is not valid JSON (${e.message}).` }; }
  const errs = validateMod(d);
  if(errs.length) return { ok:false, msg:`${label} was not added:\n• ` + errs.slice(0,8).join('\n• ') + (errs.length>8?`\n…and ${errs.length-8} more.`:'') };
  const entry = { name:d.name.trim(), version:d.version||'', author:d.author||'', enabled:true, data:d, added:Date.now() };
  const i = MODS.findIndex(m=>m.name===entry.name); if(i>=0) MODS[i]=entry; else MODS.push(entry);
  let warn = ''; try{ const W = modWarnings(d); if(W.length) warn = `\nCheck these (they do nothing as written):\n• ` + W.slice(0,5).join('\n• ') + (W.length>5 ? `\n…and ${W.length-5} more.` : ''); }catch(e){}
  if(!LS.set(MOD_KEY, MODS)) return { ok:true, msg:`${entry.name} is active for this session, but this browser would not save it for next time.${warn}` };
  return { ok:true, msg:`Added ${entry.name} (${modSummary(d)}). It applies to new runs.${d.script && !SET.allowScripts ? ' Its script stays off until you allow mod scripts in Settings.' : ''}${warn}` };
}
function saveMods(){ LS.set(MOD_KEY, MODS); }
const LIBRARY = { state:'idle', mods:[] };
async function loadLibrary(){
  if(LIBRARY.state==='loading' || LIBRARY.state==='ready') return;
  LIBRARY.state = 'loading';
  try{ const r = await fetch('mods/index.json', { cache:'no-store' }); if(!r.ok) throw new Error(r.status); const j = await r.json(); LIBRARY.mods = Array.isArray(j.mods) ? j.mods : []; LIBRARY.state = 'ready'; }
  catch(e){ LIBRARY.state = 'none'; }
}
async function installLibraryMod(m){
  try{ const r = await fetch('mods/' + m.file, { cache:'no-store' }); if(!r.ok) throw new Error('HTTP ' + r.status); const res = addModText(await r.text(), m.name || m.file); toast(res.ok ? `Installed ${m.name}.` : `Could not install ${m.name}.`); if(typeof renderModList==='function') renderModList(); }
  catch(e){ toast(`Could not download ${m.name}.`); }
}
const IMG = {};
function getImg(src){ if(!src) return null; if(!IMG[src]){ const im = new Image(); im.src = src; IMG[src] = im; } const im = IMG[src]; return im.complete && im.naturalWidth ? im : null; }
/* audio lives in audio.js */
