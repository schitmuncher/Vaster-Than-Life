/* The Graveyard: a very rare beacon (roughly one run in eight once you have a few dead, at most once per run) where the dead of your earlier runs
   are buried. Dig one up and, with luck, they come back. Without luck they come back anyway, which is worse.
   The candidates are the best of the Memorial Wall (memorial.js): most kills, highest level, longest served. */
const GRAVE_CHANCE = .012;
function graveCands(){
  if(!G || G.daily || G.cup || G.tut || G.practice || typeof PROFILE==='undefined' || (typeof NET!=='undefined' && NET.on)) return [];
  const start = G.startedAt || 0, seed = G.seed || '';
  return (PROFILE.memorial || []).filter(f => f && f.name && !f.risen && !(f.runId && f.runId===seed) && (!start || (f.date || f.t || 0) < start))
    .map(f => ({ f, score:(f.kills || 0)*2 + (f.lvl || 1) + (f.served || 0)/3 + (f.pres || 0)*10 }))
    .sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.f);
}
const GRAVE_OPEN = [
  'The beacon sits over a little moon covered in headstones. A sign at the gate reads: "PEACEFUL REST PLANETARY CEMETERY. Est. by accident. No ball games." Some of the names on the stones are names you know.',
  'Your sensors find a graveyard drifting in a slow orbit: tombstones bolted to rocks, fake flowers, one very real and very angry groundskeeper robot. Your old crew are here. You never sent them here. Space is like that.',
  'A cemetery moon. The stones are cheap, the lettering is worse, and the gravedigger is a drone with a shovel and a bad attitude. "Visiting?" it asks. "Or reclaiming? Reclaiming is extra."' ];
const GRAVE_FLOWERS = [ 'You leave flowers. The crew stand around awkwardly, then someone tells a story about the dead that is mostly lies, and everyone feels better.',
  'The crew lay plastic flowers and a half-eaten ration bar, which was their favourite. A small robot comes along and eats the ration bar. Circle of life.' ];
const GRAVE_WRONG = [ 'They come back, but not quite right. They keep calling the ship by the wrong name and they hum when they think nobody\'s listening.',
  'Something comes back. It has their face and most of their memories. It also has a new personality, and that personality is not a hit at parties.',
  'They sit up, look at you, and say: "Was I dead? I thought I was on holiday." They are not the same. They are not entirely different. It\'s fine. It\'s probably fine.' ];
const GRAVE_RISE = [ '{name} coughs up two years of soil, looks around and says, "Right. Who\'s been touching my stuff?" Welcome back.',
  'The coffin lid creaks open. {name} sits up, squints at the crew and says, "You lot look terrible." Back from the dead, and back on the rota.',
  '{name} climbs out of the grave, brushes themselves off and asks how long they were gone. Nobody has the heart to tell them about the funeral roast.' ];
const GRAVE_ROB_OK = 'Nobody here needs scrap any more. Your crew work quickly and say sorry a lot.',
      GRAVE_ROB_BAD = 'The groundskeeper robot catches you mid-dig and beats your crew with a spade while reciting the cemetery bylaws. Fair.';
function graveName(f){ const r = (typeof DATA!=='undefined' && DATA.races[f.race]) || null; return `${f.name}${r ? ' the ' + r.name : ''}`; }
function graveDesc(f){ const b = [];
  if(f.lvl > 1) b.push(`level ${f.lvl}`); if(f.kills) b.push(`${f.kills} kill${f.kills===1 ? '' : 's'}`); if(f.ship) b.push(`of the ${String(f.ship).replace(/^the /i, '')}`);
  return b.join(', '); }
function graveEvent(){
  const C = graveCands(); if(!C.length) return null; G.graveCands = C.map(f => ({ name:f.name, date:f.date || f.t || 0 }));
  const stones = C.map(f => `${graveName(f)}${graveDesc(f) ? ' (' + graveDesc(f) + ')' : ''}: "${f.epitaph || f.words || 'Here lies someone.'}"`).join('\n• ');
  const choices = C.map((f, i) => ({ text:`Dig up ${f.name}.${graveDesc(f) ? ' (' + graveDesc(f) + ')' : ''}`, chance:.7,
    success:{ text:pick(GRAVE_RISE).replace(/\{name\}/g, f.name), resurrect:i + 1 },
    fail:{ text:pick(GRAVE_WRONG), resurrect:i + 1, wrong:1 } }));
  choices.push({ text:'Leave flowers and go.', effect:{ text:pick(GRAVE_FLOWERS), crewHeal:15, graveFlowers:1 } });
  choices.push({ text:'Rob the graves. They don\'t need scrap.', chance:.6, success:{ text:GRAVE_ROB_OK, scrap:35 }, fail:{ text:GRAVE_ROB_BAD, crewHurt:20, scrap:8 } });
  DATA.events.g3_graveyard = { id:'g3_graveyard', title:'The Graveyard', text:`${pick(GRAVE_OPEN)} The best of them:\n• ${stones}`, choices, art:'planet', questOnly:true, once:true };
  return 'g3_graveyard';
}
function graveRaise(i, wrong, L){
  const ref = (G.graveCands || [])[i - 1]; if(!ref) return;
  const f = (PROFILE.memorial || []).find(m => m.name===ref.name && (m.date || m.t || 0)===ref.date); if(!f || f.risen) return;
  const s = G.ship, race = DATA.races[f.race] ? f.race : 'human', c = newCrew(race, 'p', f.name);
  if(f.quirk && !wrong) c.quirk = f.quirk; else if(wrong && typeof rollQuirk==='function') c.quirk = rollQuirk([f.quirk]);
  c.lvl = clamp(Math.round((f.lvl || 1)*(wrong ? .4 : .6)), 1, 20); c.cxp = 0; c.pres = f.pres || 0; c.kills = 0; c.risen = true;
  if(typeof SKILLT!=='undefined'){ const ks = Object.keys(SKILLT).sort(() => Math.random() - .5), great = (f.kills || 0) >= 8 || (f.lvl || 1) >= 18 || f.pres;
    ks.slice(0, wrong ? 1 : 2).forEach((k, j) => { c.sk[k] = SKILLT[k][j===0 && great && !wrong ? 1 : 0]; }); }
  if(wrong){ c.maxHp = Math.max(40, Math.round(c.maxHp*.8)); c.hp = c.maxHp; }
  f.risen = { t:Date.now(), wrong:!!wrong, ship:s.name }; if(typeof saveProfile==='function') saveProfile();
  if(s.crew.filter(o => o.owner==='p' && !o.drone).length < R.maxCrew){
    s.crew.push(c); c.station = stationRoom(s); placeCrew(s, c, c.station); if(typeof loSyncHp==='function') loSyncHp(c);
    if(typeof sagaJoined==='function') sagaJoined(c, wrong ? 'from the grave, not quite right' : 'from the grave');
    L.push(`${c.name} rises from the dead and rejoins the crew${race!==f.race ? ' (as a human, somehow)' : ''}`); }
  else { G.recruitOffer = c; L.push(`${c.name} is back, but every bunk is full. You can swap someone out next`); }
  if(typeof logEntry==='function') logEntry(`Dug up ${c.name} at the Graveyard${wrong ? '. They came back wrong' : ''}.`);
}
(function(){
  const p0 = pickEvent; pickEvent = function(node){
    if(G && !G.flags.graveyard && G.sector >= 2 && !node?.distress && Math.random() < (G.graveBoost || GRAVE_CHANCE)){ const id = graveEvent(); if(id){ G.flags.graveyard = 1; return id; } }
    return p0(node); };
  const a0 = applyEffect; applyEffect = function(e, ...rest){ const L = a0(e, ...rest); if(e && e.resurrect){ try{ graveRaise(e.resurrect, e.wrong, L || []); }catch(err){ console.warn('graveyard', err); } } return L; };
  // the modal keeps its own copy, so a save made mid-visit still opens (DATA is rebuilt on load)
  const s0 = startEvent; startEvent = function(id, o){ s0(id, o); const ev = id==='g3_graveyard' && DATA.events[id]; if(ev && G.modal && G.modal.id===id){ G.modal.inline = { text:ev.text, choices:ev.choices, art:ev.art }; G.modal.title = ev.title; } };
  const n0 = newRun; newRun = function(...a){ const r = n0(...a); if(G) G.startedAt = G.startedAt || Date.now(); return r; };
})();
