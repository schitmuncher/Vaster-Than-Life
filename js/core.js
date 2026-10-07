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
PROFILE.settings = Object.assign({ music:.5, sfx:.7, difficulty:'normal', unlockAll:false, allowScripts:false, holotable:true }, PROFILE.settings||{});
const SET = PROFILE.settings;
function saveProfile(){ LS.set(PROFILE_KEY, PROFILE); }
function grant(id){
  if(PROFILE.ach[id]) return; const a = ACHIEVEMENTS.find(x=>x.id===id); if(!a) return;
  PROFILE.ach[id] = Date.now(); saveProfile();
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

/* ---------------- audio ---------------- */
let AC = null, MASTER = null, SFXG = null, MUSG = null, NOISE = null;
let hapticFn = null;
function haptic(v, ms){ if(hapticFn) try{ hapticFn(v, ms); }catch(e){} }
function ensureAudio(){
  if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); MASTER = AC.createGain(); MASTER.connect(AC.destination);
    SFXG = AC.createGain(); SFXG.connect(MASTER); MUSG = AC.createGain(); MUSG.connect(MASTER);
    NOISE = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = NOISE.getChannelData(0); for(let i=0;i<a.length;i++) a[i] = Math.random()*2-1;
    applyVolumes(); }catch(e){ AC = null; } }
  if(AC && AC.state==='suspended') AC.resume();
  if(AC) startMusic();
}
function applyVolumes(){ if(!AC) return; SFXG.gain.value = SET.sfx; MUSG.gain.value = SET.music*.6; }
function tone(f,d,type='square',v=.05,slide=0,dest){ if(!AC) return; const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide), t+d);
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g); g.connect(dest||SFXG); o.start(t); o.stop(t+d+.03); }
function noise(d,v,hp=0,dest,when){ if(!AC) return; const t = when ?? AC.currentTime; const s=AC.createBufferSource(), g=AC.createGain(); s.buffer=NOISE;
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+d);
  if(hp){ const f = AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; s.connect(f); f.connect(g); } else s.connect(g);
  g.connect(dest||SFXG); s.start(t); s.stop(t+d+.02); }
function sfx(n){ if(!AC) return; switch(n){
  case 'click': tone(880,.04,'square',.025); break;
  case 'laser': tone(1300,.14,'sawtooth',.035,.35); break;
  case 'missile': tone(160,.45,'triangle',.06,2.4); break;
  case 'ion': tone(600,.25,'sine',.05,2.5); break;
  case 'beam': tone(300,.5,'sawtooth',.03,1.3); break;
  case 'flak': noise(.18,.08,800); tone(220,.12,'square',.03,.5); break;
  case 'bomb': tone(90,.3,'sine',.07,3); break;
  case 'hit': noise(.35,.14); tone(90,.3,'square',.05,.5); break;
  case 'shield': tone(420,.25,'sine',.06,1.8); break;
  case 'miss': tone(700,.1,'triangle',.03,1.4); break;
  case 'jump': tone(70,1.1,'sawtooth',.05,8); noise(.8,.05); break;
  case 'buy': tone(660,.08,'square',.03); setTimeout(()=>tone(990,.1,'square',.03),70); break;
  case 'alarm': tone(520,.18,'square',.04); setTimeout(()=>tone(390,.22,'square',.04),190); break;
  case 'zap': tone(1800,.08,'square',.03,.3); break;
  case 'tele': tone(300,.6,'sine',.05,4); break;
  case 'cloak': tone(900,.6,'sine',.04,.2); break;
  case 'punch': noise(.08,.06,1200); break;
  case 'fire': noise(.25,.03,300); break;
} }
/* procedural music: a slow pad and arpeggio, with a pulse layer during fights */
const MUS = { timer:null, next:0, step:0 };
const PROG = [[0,3,7,10],[-4,0,3,7],[-2,2,5,9],[-5,-1,2,5]];
function startMusic(){ if(!AC || MUS.timer) return; MUS.next = AC.currentTime + .2; MUS.timer = setInterval(musicTick, 60); }
function musicTick(){ if(!AC) return; if(SET.music<=0){ MUS.next = AC.currentTime + .1; return; }
  while(MUS.next < AC.currentTime + .3){ playStep(MUS.step, MUS.next); MUS.next += .3; MUS.step++; } }
function mnote(f, t, d, type, v, cutoff){ const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(1.2, d*.3)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  if(cutoff){ const fl = AC.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value = cutoff; o.connect(fl); fl.connect(g); } else o.connect(g);
  g.connect(MUSG); o.start(t); o.stop(t + d + .05); }
function playStep(s, t){
  const sector = (typeof G!=='undefined' && G) ? G.sector : 1;
  const root = 110 * Math.pow(2, ((sector*5) % 12 - 5)/12);
  const chord = PROG[Math.floor(s/16) % 4];
  const combat = typeof G!=='undefined' && G && G.enemy && !G.enemy.dead;
  if(s % 16 === 0) chord.forEach(n => mnote(root*2*Math.pow(2,n/12), t, 5.2, 'triangle', .035, 900));
  if(s % 2 === 0 && Math.random() < .6){ const n = chord[(s/2) % 4] + (Math.random()<.3?24:12); mnote(root*Math.pow(2,n/12), t, .5, 'sine', .022); }
  if(combat){
    if(s % 4 === 0) mnote(root*Math.pow(2,chord[0]/12)/2*2, t, .28, 'sawtooth', .05, 380);
    if(s % 2 === 1) noise(.04, .025, 6000, MUSG, t);
    if(s % 8 === 4) noise(.16, .045, 1200, MUSG, t);
  }
}
