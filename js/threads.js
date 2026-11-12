'use strict';
/* =========================================================================
   Loose ends: stories that interlock.

   Most beacons are self-contained. A loose end is different: something you
   pick up in one event (a stowaway cat, a cursed hat, a debt to Big Kev)
   that stays with you, comes back at later beacons, butts into events that
   have nothing to do with it, and reacts to the other loose ends you happen
   to be carrying. Which ones you get, and in what order, is random, so the
   combinations are different every voyage.

   It is all done with ordinary events (so mods can add more) and a few
   extra fields:
     starts:'cat'              this event can begin the loose end "cat"
     thread:'cat', step:2      a later beat: needs "cat", after beat 1
     threads:['cat','weevils'] a crossover: needs both at once
     noThread:'hat'            never while "hat" is loose
     aside:true, into:'pyrate' not a beacon at all: its one choice is added
                               to other events ('pay' 'fight' 'gamble'
                               'distress' 'pyrate' 'any') while the thread
                               is loose
   and two effects:
     thread:{ id:'cat', name:'A stowaway cat' }   pick it up
     endThread:'cat'                              tie it off
   Kept in G.threads { id: { name, s, j, n } } and G.threadsDone.
   ========================================================================= */
const THREAD_MAX = 3;
function thrActive(){ return G ? (G.threads = G.threads || {}) : {}; }
function thrDone(){ return G ? (G.threadsDone = G.threadsDone || {}) : {}; }
function thrNeeds(ev){ return ev.threads ? ev.threads : ev.thread ? [ev.thread] : []; }
function thrIs(ev){ return !!(ev && (ev.starts || ev.thread || ev.threads || ev.aside)); }
function thrOkRun(){ return !!G && !G.tut && !G.daily && !G.cup && !G.challenge && !(typeof NET!=='undefined' && NET.on); }
/* thread events never come up at random: only when it is their turn */
function thrPrepare(){ if(typeof DATA==="undefined" || !DATA || !DATA.events) return; for(const id in DATA.events){ const e = DATA.events[id]; if(thrIs(e)) e.questOnly = true; } }
function thrBasicOk(e){ const jumps = G.stats ? G.stats.jumps : 0; return !(e.adult && SET.grownUp===false) && !(e.minSector && G.sector < e.minSector) && !(e.maxSector && G.sector > e.maxSector) && !G.seen[e.id]
  && !(e.noThread && [].concat(e.noThread).some(t => thrActive()[t])) && (!e.req || reqMet(e.req)) && !(typeof campDef==='function' && campDef() && e.pack); }
function thrBeats(){ const A = thrActive(), jumps = G.stats ? G.stats.jumps : 0, out = [];
  for(const e of Object.values(DATA.events)){ if(e.aside || e.starts) continue; const need = thrNeeds(e); if(!need.length || !need.every(t => A[t])) continue; if(!thrBasicOk(e)) continue;
    if(e.step && (A[need[0]].n || 0) !== e.step - 1) continue;          // beats come in order
    if(need.some(t => jumps - A[t].j < 2)) continue;                    // give each one a breather: at least two jumps between beats
    out.push(e); } return out; }
function thrStarters(){ const A = thrActive(), D = thrDone(); if(Object.keys(A).length >= THREAD_MAX) return [];
  return Object.values(DATA.events).filter(e => e.starts && !A[e.starts] && !D[e.starts] && thrBasicOk(e) && (!e.tags || e.tags.includes('') || e.tags.includes(G.sectorType))); }
function thrPick(node){ if(!thrOkRun() || (node && node.distress)) return null; const A = thrActive(), n = Object.keys(A).length, r = Math.random();
  const beats = thrBeats();
  if(beats.length && r < Math.min(.55, .22 + .1*n)){ let tot = 0; const w = beats.map(e => { const need = thrNeeds(e), stale = Math.min(...need.map(t => (G.stats.jumps || 0) - (A[t].j || 0))); const x = (e.weight || 1)*(need.length > 1 ? 3.5 : 1)*(1 + Math.min(4, stale)*.25); tot += x; return x; });
    let k = Math.random()*tot; for(let i = 0; i < beats.length; i++){ k -= w[i]; if(k <= 0) return beats[i].id; } return beats[beats.length - 1].id; }
  if(r > .84 - (n===0 ? .1 : 0) - (G.sector >= 2 && n < 2 ? .04 : 0)){ const st = thrStarters(); if(st.length) return st[Math.floor(Math.random()*st.length)].id; }
  return null; }
/* does this ordinary event give a loose end something to say? */
function thrHostMatch(ev, into){ const ch = ev.choices || []; switch(into){
  case 'pay': return ch.some(c => c.cost && c.cost.scrap);
  case 'fight': return ch.some(c => (c.effect && c.effect.fight) || (c.success && c.success.fight) || (c.fail && c.fail.fight));
  case 'gamble': return ch.some(c => c.chance != null);
  case 'distress': return !!ev.distress;
  case 'pyrate': return /pyrate/i.test(ev.text || '') || (ev.tags || []).includes('pyrate');
  case 'mandate': return /mandate/i.test(ev.text || '');
  case 'any': return true; } return false; }
function thrAside(ev){ if(!thrOkRun() || thrIs(ev) || ev.reg || ev.moment || ev.hail) return null; const A = thrActive(); if(!Object.keys(A).length) return null;
  const c = Object.values(DATA.events).filter(a => a.aside && A[a.thread] && !G.seen[a.id] && !(a.adult && SET.grownUp===false) && thrHostMatch(ev, a.into || 'any') && a.choices && a.choices[0]);
  if(!c.length || Math.random() > .65) return null; return c[Math.floor(Math.random()*c.length)]; }
(function(){
  thrPrepare();
  if(typeof applyMods==='function'){ const a0 = applyMods; applyMods = function(...a){ const r = a0(...a); try{ thrPrepare(); }catch(e){} return r; }; }
  if(typeof pickEvent==='function'){ const p0 = pickEvent; pickEvent = function(node){ try{ const id = thrPick(node); if(id) return id; }catch(e){} return p0(node); }; }
  if(typeof startEvent==='function'){ const s0 = startEvent; startEvent = function(id, o){ const r = s0(id, o);
    try{ const m = G && G.modal, ev = m && m.type==='event' && DATA.events[m.id]; if(ev && thrOkRun()){ const A = thrActive(), jumps = G.stats ? G.stats.jumps : 0;
        for(const t of thrNeeds(ev)) if(A[t]){ A[t].n = (A[t].n || 0) + 1; A[t].j = jumps; }
        const as = thrAside(ev); if(as){ G.seen[as.id] = 1; A[as.thread].j = jumps; m.inline = { text:ev.text, choices:[...ev.choices, Object.assign({ _aside:as.thread }, as.choices[0], { text:'🧵 ' + as.choices[0].text })], art:ev.art }; } } }catch(e){}
    return r; }; }
  if(typeof applyEffect==='function'){ const a0 = applyEffect; applyEffect = function(e){ const L = a0(e);
    try{ if(e && G){ if(e.thread && e.thread.id && !thrActive()[e.thread.id]){ thrActive()[e.thread.id] = { name:e.thread.name || e.thread.id, s:G.sector, j:G.stats ? G.stats.jumps : 0, n:0 }; L.push(`Loose end: ${e.thread.name || e.thread.id}`); }
        for(const t of [].concat(e.endThread || [])){ if(thrActive()[t]){ L.push(`Tied off: ${thrActive()[t].name}`); delete thrActive()[t]; } thrDone()[t] = 1; } } }catch(err){}
    return L; }; }
  // the list, in the corner of a quiet beacon
  if(typeof drawQuiet==='function'){ const q0 = drawQuiet; drawQuiet = function(){ q0(); try{ if(!G || G.modal) return; const A = Object.values(thrActive()); if(!A.length) return; const b = EBOX, x = b.x + 474, y = b.y + 150;
      rr(x - 12, y - 22, 286, 34 + A.length*24, 8); ctx.fillStyle = 'rgba(7,10,20,.55)'; ctx.fill(); label(`Loose ends · ${A.length}`, x, y, C.violet || '#c48bff', 'left', 13);
      A.slice(0, 5).forEach((t, i) => T('🧵 ' + t.name, x, y + 24 + i*24, { s:14, c:C.ink, max:262 })); tip(x - 12, y - 22, 286, 34 + A.length*24, 'Loose ends', 'Things you have picked up along the way. They come back at later beacons, turn up in other events, and get tangled in each other.'); }catch(e){} }; }
})();
