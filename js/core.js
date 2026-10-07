'use strict';
/* =========================================================================
   Core: utilities, saved profile and settings, mods, audio and music.
   ========================================================================= */
const rand = (a,b) => a + Math.random()*(b-a);
const ri = (a,b) => Math.floor(rand(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => Math.random().toString(36).slice(2,10);
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
function grant(id){
  if(PROFILE.ach[id]) return; const a = ACHIEVEMENTS.find(x=>x.id===id); if(!a) return;
  PROFILE.ach[id] = Date.now(); saveProfile(); if(typeof sfx==='function') sfx('achieve');
  if(typeof toast==='function') toast(`Achievement: ${a.name}`); sfx('buy');
}
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
const KINDS = ['weapons','races','ships','enemies','events','drones','augments','sectors'];
let HOOKS = {};
function on(evt, fn){ (HOOKS[evt] = HOOKS[evt] || []).push(fn); }
function emit(evt, arg){ const list = HOOKS[evt]; if(!list) return; for(const fn of list){ try{ fn(arg); }catch(e){ if(typeof toast==='function') toast('Mod script error: ' + e.message); } } }
function toMap(x){ if(!x) return {}; if(Array.isArray(x)){ const m={}; x.forEach(o=>{ if(o && o.id!=null) m[o.id]=o; }); return m; } return typeof x==='object' ? x : {}; }
function applyMods(){
  DATA = clone(BASE); HOOKS = {};
  for(const k of KINDS) for(const id in DATA[k]) DATA[k][id].id = id;
  for(const m of MODS){
    if(!m.enabled) continue; const d = m.data || {};
    if(d.rules && typeof d.rules==='object') Object.assign(DATA.rules, d.rules);
    for(const k of KINDS){ const mp = toMap(d[k]); for(const id in mp) DATA[k][id] = Object.assign({}, DATA[k][id]||{}, mp[id], { id }); }
    if(d.remove && typeof d.remove==='object') for(const k in d.remove) if(DATA[k] && Array.isArray(d.remove[k])) d.remove[k].forEach(id => delete DATA[k][id]);
  }
  R = DATA.rules;
  if(SET.allowScripts){ for(const m of MODS){ if(!m.enabled || typeof m.data?.script!=='string') continue;
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
function modSummary(d){ const parts=[]; for(const k of KINDS){ const n = Object.keys(toMap(d[k])).length; if(n) parts.push(`${n} ${k}`); }
  if(d.rules) parts.push('rules'); if(d.script) parts.push('script'); return parts.join(', ') || 'no content'; }
function addModText(txt, label){
  let d; try{ d = JSON.parse(txt); }catch(e){ return { ok:false, msg:`${label}: this is not valid JSON (${e.message}).` }; }
  const errs = validateMod(d);
  if(errs.length) return { ok:false, msg:`${label} was not added:\n• ` + errs.slice(0,8).join('\n• ') + (errs.length>8?`\n…and ${errs.length-8} more.`:'') };
  const entry = { name:d.name.trim(), version:d.version||'', author:d.author||'', enabled:true, data:d, added:Date.now() };
  const i = MODS.findIndex(m=>m.name===entry.name); if(i>=0) MODS[i]=entry; else MODS.push(entry);
  if(!LS.set(MOD_KEY, MODS)) return { ok:true, msg:`${entry.name} is active for this session, but this browser would not save it for next time.` };
  return { ok:true, msg:`Added ${entry.name} (${modSummary(d)}). It applies to new runs.${d.script && !SET.allowScripts ? ' Its script stays off until you allow mod scripts in Settings.' : ''}` };
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
