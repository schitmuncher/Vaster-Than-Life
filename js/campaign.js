'use strict';
/* =========================================================================
   Campaign: what makes one run part of a career.
   - Admiralty ranks: every run earns renown. Ranks unlock better send-off gifts and ships.
   - The send-off: Admiral Hale sees you off with a choice of gifts, and remembers how your last run went.
   - Pip: the data core in your hold wakes up. A story across the sectors, with four endings.
   - Director Kross: Rebuff Intelligence, who wants Pip back and remembers you too.
   - Veteran beacons: marked on the map. Hard fights that always pay out a weapon or augment.
   - Rebuff alert: harder runs, unlocked one level at a time by winning.
   ========================================================================= */

/* ---------------- ranks & renown ---------------- */
const RANKS = [
  { name:'Cadet',                at:0 },
  { name:'Ensign',               at:60,   reward:'Admiral Hale offers three send-off gifts, not two' },
  { name:'Lieutenant',           at:160,  reward:'Ship requisition: the next locked ship is yours', ship:true },
  { name:'Lieutenant Commander', at:320,  reward:'Better send-off gifts: weapons, crew, refits' },
  { name:'Commander',            at:540,  reward:'Ship requisition: the next locked ship is yours', ship:true },
  { name:'Captain',              at:820,  reward:'Ask Hale for different gifts, once a run' },
  { name:'Commodore',            at:1160, reward:'Ship requisition: the next locked ship is yours', ship:true },
  { name:'Rear Admiral',         at:1560, reward:'The best send-off gifts: augments, drones, reactor tuning' },
  { name:'Vice Admiral',         at:2040, reward:'Ship requisition: the next locked ship is yours', ship:true },
  { name:'Admiral',              at:2600, reward:'Four send-off gifts to choose from, and Hale salutes you first' }
];
function renownNow(){ return PROFILE.renown || 0; }
function rankIdx(r){ r = r==null ? renownNow() : r; let i = 0; for(let k=0;k<RANKS.length;k++) if(r >= RANKS[k].at) i = k; return i; }
function rankName(i){ return RANKS[i==null ? rankIdx() : i].name; }
function rankShort(i){ return rankName(i).replace('Lieutenant Commander', 'Lt Commander'); }
function nextRank(){ const i = rankIdx(); return i < RANKS.length-1 ? RANKS[i+1] : null; }
/* the next ship the Admiralty will requisition for you */
function nextRequisition(){ const locked = Object.keys(BASE.ships).map(id => (DATA && DATA.ships && DATA.ships[id]) || Object.assign({ id }, BASE.ships[id])).filter(d => d && !d.secret && !shipUnlocked(d));
  locked.sort((a,b) => (a.layout||'A').localeCompare(b.layout||'A')); return locked[0] || null; }

/* is this run a normal one, where career features apply? (dailies, cups, challenges, seed duels and multiplayer stay pure) */
function campaignSolo(){ return !!G && !(typeof NET!=='undefined' && NET.on && NET.mode); }
function campaignPure(){ return !!G && !G.daily && !G.cup && !G.challenge && !G.seedDuel && campaignSolo(); }

/* ---------------- Rebuff alert (harder runs) ---------------- */
const ALERTS = [
  null,
  { name:'Patrols',        desc:'Enemy ships have 2 more hull.' },
  { name:'Price hikes',    desc:'Everything at stores costs 10% more.' },
  { name:'Fast pursuit',   desc:'The Rebuff Fleet advances 10% faster.' },
  { name:'Lean salvage',   desc:'Fights give 15% less scrap.' },
  { name:'Veteran crews',  desc:'Veterans are twice as common, and every sector has one more veteran beacon.' },
  { name:'Short supplies', desc:'You start with 10 less scrap and 3 less fuel.' },
  { name:'Drilled gunners',desc:'Enemy weapons charge 6% faster.' },
  { name:'Total war',      desc:'The Flaggship has 6 more hull in every phase.' }
];
const ALERT_MAX = ALERTS.length - 1;
function alertLv(){ return (G && G.alert) || 0; }
function alertText(n){ const out = []; for(let i=1;i<=n;i++) out.push(`${i}. ${ALERTS[i].name}: ${ALERTS[i].desc}`); return out.join(' '); }

/* ---------------- the send-off ---------------- */
const SENDOFF = [
  { id:'fuel',    t:1, text:'Extra fuel cells and missiles for the road.', fx:{ fuel:4, missiles:3 } },
  { id:'purse',   t:1, text:'A purse of requisition scrap.', fx:{ cmp:{ scrap:45 } } },
  { id:'plating', t:1, text:'Bolt on extra hull plating (+4 hull).', fx:{ maxHull:4, hull:4 } },
  { id:'parts',   t:1, text:'A crate of drone parts and missiles.', fx:{ parts:4, missiles:2 } },
  { id:'charts',  t:1, text:'Star charts: every beacon in the first two sectors, marked.', fx:{ reveal:true, cmp:{ charts:1 } } },
  { id:'seeds',   t:1, text:'Rare seed packets and a third planter for the garden.', fx:{ seeds:{ moon_melon:2, void_pepper:2 }, cmp:{ planter:true } } },
  { id:'head',    t:1, text:'A head start: the Rebuff Fleet begins further back.', fx:{ fleetPush:-.14 } },
  { id:'weapon',  t:2, text:'A weapon from the armoury.', fx:{ weapon:'random' } },
  { id:'recruit', t:2, text:'A volunteer for your crew.', fx:{ crew:'random' } },
  { id:'drill',   t:2, text:'A week of drills: everyone starts skilled at their post.', fx:{ cmp:{ drill:true } } },
  { id:'cargo',   t:2, text:'A hold of trade goods to sell along the way.', fx:{ goods:{ sloog_silk:2, space_wine:2, old_books:2 } } },
  { id:'refit',   t:2, text:'A refit: one system upgraded.', fx:{ upgrade:'random' } },
  { id:'augment', t:3, text:'An augment from the Admiral\'s private stores.', fx:{ augment:'random' } },
  { id:'reactor', t:3, text:'A tuned reactor (+2 reactor power).', fx:{ reactor:2 } },
  { id:'drone',   t:3, text:'A drone and the parts to fly it.', fx:{ drone:'random', parts:2 }, needs:'drones' },
  // trades: something good, for a price
  { id:'proto',   t:1, trade:true, text:'Take the prototype gun, and lose 6 hull fitting it.', fx:{ weapon:'random', hull:-6 } },
  { id:'convoy',  t:2, trade:true, text:'Give half your fuel to a stranded convoy. They send an augment.', fx:{ cmp:{ halfFuel:true }, augment:'random' } },
  { id:'early',   t:2, trade:true, text:'Leave before the supply drop: +90 scrap, but no missiles.', fx:{ cmp:{ scrap:90, noMissiles:true } } },
  { id:'mutiny',  t:3, trade:true, text:'Take a disgraced Mantlis veteran nobody else will. They bring a weapon, and opinions.', fx:{ crew:'mantlis', weapon:'random', cmp:{ grumpy:true } } }
];
function sendoffTier(){ const r = rankIdx(); return r >= 7 ? 3 : r >= 3 ? 2 : 1; }
function sendoffPicks(salt){
  return withSeed(`sendoff${salt||''}`, () => {
    const tier = sendoffTier(), n = rankIdx() >= RANKS.length-1 ? 4 : rankIdx() >= 1 ? 3 : 2, s = G.ship;
    const ok = g => g.t <= tier && !(g.needs && !s.systems[g.needs]) && !(g.id==='recruit' && s.crew.filter(c => c.owner==='p' && !c.drone).length >= R.maxCrew);
    // the better a gift's tier, the likelier it turns up once it is unlocked
    const pool = SENDOFF.filter(ok), out = [];
    while(out.length < n && pool.length){ const g = wpick(pool, x => x.t===tier ? 2.2 : 1); pool.splice(pool.indexOf(g), 1); if(g.trade && out.some(o => o.trade)) continue; out.push(g); }
    return out; });
}
function giftChoice(g){ return { text:g.text, effect:Object.assign({ text:pick(HALE_THANKS) }, g.fx, { cmp:Object.assign({}, g.fx.cmp||{}, { gift:g.id, thenMap:true }) }) }; }
const HALE_THANKS = ['"Good choice. Now go, before the Rebuff notice you\'re gone."', '"Sign here. And here. And here. Off you go."', 'The quartermaster loads it aboard with a grunt. Hale salutes. "Fly well."', '"I\'ll put it on the Fedoration\'s tab. Don\'t make me regret it."'];
/* Admiral Hale remembers you (like a good Hades character should) */
function haleGreeting(){
  const hist = (PROFILE.history||[]).filter(e => !e.daily), last = hist[0];
  const rk = rankShort(), ship = G.ship.name, out = [];
  const promoted = PROFILE.newRank != null; if(promoted) delete PROFILE.newRank;
  if(!hist.length) out.push(`Admiral Hale looks you up and down, then looks at ${ship} for rather longer. "So you're my courier. The data core in your hold could end this war. Cross ${R.sectors} sectors, stay ahead of the Rebuff Fleet, and stop their Flaggship before it reaches Fedoration command. Don't open the core. Don't sell it." A pause. "And don't talk to it."`);
  else if(rankIdx() >= RANKS.length-1) out.push(pick([`Hale salutes you first, for once. "Admiral." A grin. "Two of us now. The Rebuff have built yet another Flaggship. Shall we?"`, `"You know the job better than I do by now. Go on. Show off."`]));
  else if(last && last.win) out.push(pick([`"${rk}. You won last time, and the Rebuff have built a new Flaggship out of pure spite. Same job. Same core."`, `"Last time the Flaggship fell. The Rebuff Directorate took it personally. They've built another one. Bigger."`]));
  else if(last && last.sector >= 6) out.push(`"Sector ${last.sector}, ${rk}. You were nearly there." Hale taps the map. "Nearly is a word for people who don't try again. You're trying again."`);
  else if(last && (PROFILE.lastFallen||[]).length) out.push(`"We lost ${listText(PROFILE.lastFallen.slice(0,2))} last time." Hale is quiet for a moment. "Bring this lot home, ${rk}."`);
  else if(last) out.push(pick([`"Sector ${last.sector} last time, ${rk}. I've written sector ${Math.min(R.sectors, last.sector+1)} in the plan. In pen."`, `"Back again, ${rk}? Good. The core is loaded, the Fleet is gathering, and the coffee is terrible. Off you go."`]));
  if(promoted) out.push(`"Oh, and congratulations on the promotion, ${rk}. It suits you."`);
  if(PROFILE.endings && PROFILE.endings.trusted) out.push(pick(['"And be nice to Pip. You know what I mean."', '"The core is humming already. I think it remembers you."']));
  else if(PROFILE.endings && PROFILE.endings.sold) out.push('"And this time, the core stays with you. Understood?"');
  out.push('"The quartermaster has a few things for you. Pick one."');
  return out.join(' ');
}
function campaignSendOff(){
  const picks = sendoffPicks(), choices = picks.map(giftChoice);
  if(rankIdx() >= 5){ const again = sendoffPicks('again').filter(g => !picks.some(p => p.id===g.id)); if(again.length) choices.push({ text:'Ask the quartermaster for something else.', effect:{ text:'Hale sighs, and sends the quartermaster back down to stores. "Last chance, Captain."', choices:again.map(giftChoice) } }); }
  G.modal = { type:'event', id:'c_sendoff', inline:{ text:haleGreeting(), choices, art:'station' }, ctx:{ crew:randomCrewName() } };
  return true;
}

/* ---------------- Pip, the data core ---------------- */
function pipState(){ return (G.pip = G.pip || { met:false, trust:0, beat:0, sold:false, free:false, promise:false, truth:false, ready:null, beats:0 }); }
function pipAboard(){ const p = G && G.pip; return !!(p && p.met && !p.sold && !p.free); }
const PIP_BEATS = ['pip_wake', 'pip_window', 'kross_offer', 'pip_song', 'pip_fear'];
/* entering a sector: maybe a story scene. Returns true when one starts. */
function campaignSector(){
  if(!G || !campaignSolo() || G.noStory) return false; const P = pipState(), sd = sectorDef();
  if(sd.final){ const id = P.sold ? 'kross_final' : P.free ? 'pip_beacons' : P.met ? (P.trust >= 3 ? 'pip_ready_hi' : 'pip_ready_lo') : null;
    if(id && !G.seen[id]){ startEvent(id); G.thenMap = true; return true; } return false; }
  if(G.sector < 2 || sd.secret) return false;
  while(P.beat < PIP_BEATS.length){ const id = PIP_BEATS[P.beat++]; if(P.sold || P.free) continue; if(id!=='pip_wake' && !P.met) continue;
    startEvent(id); G.thenMap = true; return true; }
  return false;
}
const PIP_CHATTER = ['That star looks like a potato. A good potato.', 'I counted the jumps. That\'s {n}. I like {n}.', '{crew} is my favourite. Don\'t tell the others.', 'Is it always this dark out here? I like it.', 'The Fleet is behind us. I can feel them. Like an itch, in the maths.',
  'I made up a new constellation. It\'s called "the ship". It\'s us.', 'If anyone needs anything calculated, I\'m right here. In the box. Calculating.', 'Your coffee machine and I are friends now. It\'s a bit shy.'];
function campaignArrive(node, first){
  if(!pipAboard() || !first || G.enemy) return; const P = G.pip;
  if(Math.random() < (P.trust >= 1 ? .08 : .03)){ const line = P.trust >= 1 ? pick(PIP_CHATTER).replace(/\{n\}/g, G.stats.jumps).replace('{crew}', randomCrewName()) : 'Pip is humming, very quietly, to itself.';
    if(P.trust >= 1) toast(`Pip: ${line}`); else toast(line); }
}

/* ---------------- effects (from applyEffect) ---------------- */
function campaignEffect(e, L){
  const c = e && e.cmp; if(!c || !G) return; const s = G.ship;
  if(c.scrap){ G.scrap += c.scrap; G.stats.scrap += c.scrap; L.push(`+${c.scrap} scrap`); }
  if(c.charts){ G.charts = 1; }   // the next sector's map comes pre-marked too
  if(c.planter){ G.garden = G.garden || { plots:[] }; if(G.garden.plots.length < 4){ G.garden.plots.push(null); L.push('+1 garden planter'); } }
  if(c.drill){ const posts = { piloting:'pilot', engines:'engines', shields:'shields', weapons:'weapons' };
    for(const cr of mineAlive()){ const st = Object.keys(posts).find(k => cr.station!=null && s.rooms[cr.station] && s.rooms[cr.station].sys===k); const sk = st ? posts[st] : pick(['repair','combat']);
      if(SKILLT[sk]) cr.sk[sk] = Math.max(cr.sk[sk]||0, SKILLT[sk][0]); } L.push('Crew trained: everyone is skilled at their post'); }
  if(c.halfFuel){ const n = Math.floor(G.fuel/2); G.fuel -= n; L.push(`-${n} fuel`); }
  if(c.noMissiles){ L.push(`-${G.missiles} missiles`); G.missiles = 0; }
  if(c.grumpy){ const m = mineAlive().slice(-1)[0]; if(m && !m.quirkSet){ m.quirk = 'grump'; m.quirkSet = true; } }
  if(c.gift){ G.gift = c.gift; if(typeof sagaNote==='function'){ const g = SENDOFF.find(x => x.id===c.gift); if(g) sagaNote('start', `Admiral Hale saw them off with a parting gift: ${g.text.charAt(0).toLowerCase() + g.text.slice(1).replace(/\.$/, '')}.`); } }
  if(c.thenMap) G.thenMap = true;
  // Pip
  const P = pipState();
  if(c.pipMet){ P.met = true; if(typeof sagaNote==='function') sagaNote('pip', `In sector ${G.sector}, the data core in the hold woke up and said its name was Pip.`); }
  if(c.pip){ P.trust += c.pip; L.push(c.pip > 0 ? 'Pip likes that' : 'Pip goes quiet'); }
  if(c.beat) P.beats++;
  if(c.truth) P.truth = true;
  if(c.promise){ P.promise = true; if(typeof sagaNote==='function') sagaNote('pip', `The captain promised Pip that nobody would unpack it.`); }
  if(c.hearts){ for(const cr of mineAlive()) if(typeof addHearts==='function') addHearts(cr, c.hearts); L.push('The crew feel closer'); }
  if(c.sell){ P.sold = true; G.scrap += 150; G.stats.scrap += 150; G.fleetX -= .25; L.push('+150 scrap', 'The Rebuff Fleet falls back'); grant('end_sellout');
    if(typeof sagaNote==='function') sagaNote('pip', `In sector ${G.sector}, the captain sold Pip to Director Kross of Rebuff Intelligence for 150 scrap.`); }
  if(c.free){ P.free = true; if(typeof sagaNote==='function') sagaNote('pip', `In sector ${G.sector}, the captain opened a channel and let Pip go free into the relay network.`); }
  if(c.ready){ P.ready = c.ready; }
}

/* ---------------- the Flaggship (Pip helps, Kross gloats) ---------------- */
const KROSS_FIRST = ['"Courier. Director Kross. We meet in person, more or less. I do hope you\'ve enjoyed the trip."', '"Director Kross, Rebuff Intelligence. You have been a great deal of paperwork."'];
function campaignBoss(e, o){
  if(!G || !campaignSolo()) return; const P = pipState(), ph = o.phase||0;
  if(ph===0){ PROFILE.krossMet = (PROFILE.krossMet||0) + 1; saveProfile(); }
  const met = PROFILE.krossMet||1, bits = [];
  if(ph===0) bits.push(met > 1 ? `Director Kross is on the bridge of the Flaggship. "You again. That makes ${met} times now. I've started a file. It's thicker than the war."` : `Director Kross is on the bridge of the Flaggship. ${pick(KROSS_FIRST)}`);
  if(P.sold){ e.hull += 5; e.maxHull += 5; if(ph===0) bits.push('"Thank you for the codes, by the way. We patched every weak spot you could have hit."'); }
  else if(P.free && ph < 2){ ionizeAll(e, 'weapons', 6); bits.push('Every beacon nearby blinks twice. Pip, out in the network, jams the Flaggship\'s weapons for a few seconds.'); }
  else if(pipAboard()){ const t = P.trust >= 3 ? (P.promise ? 12 : 10) : 5;
    { ionizeAll(e, 'shields', t); e.shield = 0; bits.push(P.trust >= 3 ? `Pip: "Shields... now!" The Flaggship's shields flicker out for ${t} seconds.` : `Pip drops the Flaggship's shields for ${t} seconds, without a word.`); } }
  if(alertLv() >= 8){ e.hull += 6; e.maxHull += 6; }
  if(bits.length) o.text = (o.text ? o.text + ' ' : '') + bits.join(' ');
}
function ionizeAll(sh, k, secs){ const y = sh.systems[k]; if(!y) return; y.ion = y.max; y.ionT = Math.max(y.ionT||0, secs); if(k==='weapons'){ for(const w of sh.weapons) if(w.on){ w.on = false; } } }

/* ---------------- veteran beacons ---------------- */
function campaignElites(nodes, n, final, sd){
  if(final || n < 2 || (sd && sd.secret)) return;
  let k = (n >= 4 ? 2 : 1) + (alertLv() >= 5 ? 1 : 0); const last = Math.max(...nodes.map(z => z.col)), cols = [];
  for(const nd of shuffle(nodes.filter(nd => nd.col >= 2 && nd.col < last && ['combat','event','empty'].includes(nd.type) && !nd.quest && !nd.distress && !nd.hazard))){
    if(k <= 0) break; if(cols.includes(nd.col)) continue; nd.type = 'combat'; nd.elite = true; cols.push(nd.col); k--; }
}
function campaignSectorGen(n){ if(G && G.charts && G.map){ for(const nd of G.map.nodes) nd.revealed = true; if(n >= 2) G.charts = 0; } }

/* ---------------- run start & end ---------------- */
function campaignRunStart(o){
  if(!G) return; pipState();
  G.alert = campaignPure() ? clamp(SET.alert||0, 0, PROFILE.alert||0) : 0;
  if(G.alert >= 6){ G.scrap = Math.max(0, G.scrap - 10); G.fuel = Math.max(4, G.fuel - 3); }
  if(G.alert) logEntry(`Rebuff alert level ${G.alert}.`);
  if(campaignPure() && !o.noSendoff){ const intro = G.modal; campaignSendOff(); G.introText = intro && intro.text; }
}
const ENDINGS = {
  trusted:{ title:'Good Data', text:'Fedoration command unpacks the data core very, very gently. Pip gets a desk, a window and a ridiculous title, and the Flaggship\'s codes are never needed again. Every so often a message arrives for your crew. It is always a song.' },
  cold:   { title:'The Lead Box', text:'Command carries the data core away in a lead box. The war turns on what is inside it. Nobody asks Pip anything ever again, and your crew can\'t quite get its tune out of their heads.' },
  free:   { title:'Ghost in the Beacons', text:'The Flaggship burns, and the war turns without its codes. Out in the relay network, something small and bright is having the time of its life. Some nights, every beacon in the sector blinks twice: hello.' },
  sold:   { title:'Thirty Pieces of Scrap', text:'You won, in the end, without it. Somewhere in a Rebuff archive, a beige box hums a song your crew taught it, very quietly, to nobody.' }
};
function endingFor(){ const P = G && G.pip; if(!P || !P.met) return null; return P.sold ? 'sold' : P.free ? 'free' : P.trust >= 3 ? 'trusted' : 'cold'; }
function campaignEndText(win){ if(!win) return null; const k = endingFor(); return k ? ENDINGS[k].text : null; }
function campaignRunEnd(win, reason){
  if(!G) return; const P = pipState(), lines = [], st = G.stats;
  PROFILE.lastFallen = campaignPure() ? (G.lost||[]).slice(0, 4) : PROFILE.lastFallen;
  if(!win && pipAboard() && typeof sagaNote==='function') sagaNote('pip', P.trust >= 1 ? 'Pip was still humming when the ship went dark.' : 'The data core was never recovered.');
  const phases = win ? 3 : (G.flag ? G.flag.phase : 0), alive = mineAlive().length;
  const add = (l, v) => { if(v > 0) lines.push([l, Math.round(v)]); };
  add(`Sectors crossed (${Math.max(0, G.sector-1)})`, Math.max(0, G.sector-1)*15);
  add(`Ships defeated (${st.kills})`, st.kills*3);
  add('Flaggship beaten' + (phases > 1 ? ` ×${phases}` : ''), phases*30);
  if(win) add('Mission complete', 150);
  if(win) add(`Crew brought home (${alive})`, alive*4);
  add('Pip\'s story', P.beats*5);
  let ending = null; const ek = win ? endingFor() : null;
  if(ek){ PROFILE.endings = PROFILE.endings || {}; const first = !PROFILE.endings[ek]; if(first){ PROFILE.endings[ek] = Date.now(); add(`New ending: ${ENDINGS[ek].title}`, 60); }
    ending = Object.assign({ id:ek, first }, ENDINGS[ek]); grant('end_' + ek); if(Object.keys(ENDINGS).every(k => PROFILE.endings[k])) grant('end_all'); }
  const dm = { easy:.75, normal:1, hard:1.5 }[G.diff] || 1, am = 1 + .15*alertLv();
  const base = lines.reduce((t, l) => t + l[1], 0), total = Math.max(5, Math.round(base * dm * am));
  const mults = []; if(dm !== 1) mults.push([`${(DIFFICULTY[G.diff]||{}).name || G.diff} difficulty`, `×${dm}`]); if(am !== 1) mults.push([`Rebuff alert ${alertLv()}`, `×${am.toFixed(2).replace(/0$/, '')}`]);
  const before = renownNow(), r0 = rankIdx(before); PROFILE.renown = before + total; const r1 = rankIdx();
  const unlocks = [];
  for(let i = r0+1; i <= r1; i++){ PROFILE.newRank = i; if(RANKS[i].ship){ const d = nextRequisition(); if(d){ PROFILE.unlocked = PROFILE.unlocked || {}; PROFILE.unlocked[d.id] = true; unlocks.push(`New ship: ${d.name} (${d.cls || ''})`); } } }
  if(r1 >= 4) grant('rank_cmdr'); if(r1 >= RANKS.length-1) grant('rank_admiral'); if(r1 >= 2) grant('rank_lt');
  // the alert ladder: win at your highest level on Normal or Hard to open the next one
  if(win && campaignPure() && G.diff !== 'easy'){ const cur = PROFILE.alert || 0; PROFILE.alertBest = PROFILE.alertBest || {}; PROFILE.alertBest[G.shipDef] = Math.max(PROFILE.alertBest[G.shipDef]||0, alertLv());
    if(alertLv() >= cur && cur < ALERT_MAX){ PROFILE.alert = cur + 1; unlocks.push(`Rebuff alert ${cur+1} unlocked: ${ALERTS[cur+1].name}`); }
    if(alertLv() >= 1) grant('alert1'); if(alertLv() >= 4) grant('alert4'); if(alertLv() >= ALERT_MAX) grant('alert8'); }
  saveProfile();
  if(!(typeof NET!=='undefined' && NET.on && NET.mode)) UI.debrief = { t0:performance.now(), lines, mults, total, before, after:PROFILE.renown, r0, r1, unlocks, ending, win };
}

/* ---------------- drawing: the debrief over the end screen ---------------- */
function drawDebrief(){
  const d = UI.debrief; if(!d) return; const now = performance.now(), el = (now - d.t0)/1000;
  ctx.fillStyle = 'rgba(4,6,12,.86)'; ctx.fillRect(0,0,W,H); region(0,0,W,H,() => { if(el < 2.4) d.t0 = now - 2400*1; });   // a click skips the count-up
  const w = 1180, h = d.ending ? 820 : 690, x = (W-w)/2, y = (H-h)/2; panel(x, y, w, h, 14);
  label('Admiralty debrief', x+40, y+52, C.cyan, 'left', 18);
  let yy = y + 84;
  if(d.ending){ label(d.ending.first ? `New ending · ${d.ending.title}` : `Ending · ${d.ending.title}`, x+40, yy+16, C.amber, 'left', 15); yy += 50 + para(d.ending.text, x+40, yy+52, w-80, { s:18, lh:26, c:C.ink }); yy += 10; }
  // renown lines, one by one
  const lx = x+40, lw = 520; label('Renown earned', lx, yy+20, C.muted, 'left', 13); yy += 54;
  d.lines.forEach((l, i) => { const a = clamp(el*4 - i*.8, 0, 1); if(a <= 0) return; ctx.globalAlpha = a; T(l[0], lx, yy + i*32, { s:17, max:400 }); T(`+${l[1]}`, lx+lw, yy + i*32, { s:17, a:'right', c:C.good, f:FD, w:700 }); ctx.globalAlpha = 1; });
  let my = yy + d.lines.length*32; d.mults.forEach((m, i) => { T(m[0], lx, my + i*30, { s:16, c:C.muted }); T(m[1], lx+lw, my + i*30, { s:16, a:'right', c:C.cyan, f:FD, w:700 }); }); my += d.mults.length*30 + 8;
  ctx.fillStyle = C.line; ctx.fillRect(lx, my - 18, lw, 1.5);
  const k = clamp((el - .4)/1.6, 0, 1), shown = Math.round(d.total * (1 - Math.pow(1-k, 3)));
  T('Total', lx, my + 14, { s:20, f:FD, w:700 }); T(`+${fmtNum(shown)}`, lx+lw, my + 14, { s:30, a:'right', c:C.amber, f:FD, w:700 });
  // the rank bar fills up
  const rx = x+620, rw = w-660; const cur = d.before + (d.after - d.before) * (1 - Math.pow(1-k, 3)), ri = rankIdx(cur), nx = RANKS[ri+1];
  label('Rank', rx, yy - 34, C.muted, 'left', 13);
  T(RANKS[ri].name, rx, yy + 20, { s:30, f:FD, w:700, c: ri > d.r0 ? C.amber : C.ink, max:rw });
  const frac = nx ? (cur - RANKS[ri].at)/(nx.at - RANKS[ri].at) : 1;
  rr(rx, yy + 40, rw, 18, 9); ctx.fillStyle = 'rgba(6,9,18,.8)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
  if(frac > 0){ rr(rx, yy + 40, Math.max(18, rw*clamp(frac,0,1)), 18, 9); ctx.fillStyle = C.amber; ctx.fill(); }
  T(nx ? `${fmtNum(cur)} / ${fmtNum(nx.at)} renown · next: ${nx.name}` : `${fmtNum(cur)} renown · the top of the ladder`, rx, yy + 84, { s:14, c:C.muted, max:rw });
  if(nx) para(`At ${nx.name}: ${nx.reward}.`, rx, yy + 108, rw, { s:15, lh:21, c:C.muted, max:3 });
  let uy = yy + 180;
  if(d.r1 > d.r0 && k >= 1){ glow(rx + 120, uy + 10, 90, C.amber, .25); label('Promoted!', rx, uy + 18, C.amber, 'left', 18); uy += 50;
    for(let i = d.r0+1; i <= d.r1; i++){ uy += 4 + para(`${RANKS[i].name}: ${RANKS[i].reward}.`, rx, uy, rw, { s:16, lh:22, c:C.ink, max:3 }); } }
  if(k >= 1) for(const u of d.unlocks){ uy += 8; T('★ ' + u, rx, uy + 18, { s:16, c:C.good, max:rw }); uy += 26; }
  btn(x + w - 280, y + h - 84, 240, 60, el < 2 ? 'Skip' : 'Continue', () => { if(el < 2){ d.t0 = now - 2400; return; } UI.debrief = null; }, { fill:el >= 2, s:20 });
}

/* ---------------- drawing: the career screen ---------------- */
function drawCareer(){
  label('Your career', 60, 70, C.cyan, 'left', 18);
  const r = renownNow(), ri = rankIdx(), nx = nextRank();
  T(rankName(), 60, 124, { s:50, f:FD, w:700, c:C.amber });
  T(nx ? `${fmtNum(r)} renown · ${fmtNum(nx.at - r)} more for ${nx.name}` : `${fmtNum(r)} renown · Admiral of the Fleet`, 1540, 118, { s:18, a:'right', c:C.muted });
  { const frac = nx ? (r - RANKS[ri].at)/(nx.at - RANKS[ri].at) : 1; rr(60, 146, 1480, 14, 7); ctx.fillStyle = 'rgba(6,9,18,.8)'; ctx.fill(); rr(60, 146, Math.max(14, 1480*clamp(frac,0,1)), 14, 7); ctx.fillStyle = C.amber; ctx.fill(); }
  // ranks
  panel(60, 186, 720, 700, 12); label('Admiralty ranks', 84, 224, C.amber, 'left', 16);
  T('Every run earns renown: sectors crossed, ships beaten, the Flaggship, and the story. Harder runs earn more.', 84, 252, { s:14, c:C.muted, max:670 });
  RANKS.forEach((k, i) => { const yy = 278 + i*60, got = i <= ri;
    if(i===ri){ rr(76, yy-6, 688, 56, 8); ctx.fillStyle = hexA(C.amber,.1); ctx.fill(); }
    T(got ? '✓' : '·', 96, yy+24, { s:20, c: got ? C.good : C.muted, a:'center' });
    T(k.name, 120, yy+18, { s:19, f:FD, w:700, c: got ? C.ink : C.muted, max:300 }); T(`${fmtNum(k.at)}`, 750, yy+18, { s:15, a:'right', c:C.muted });
    T(k.reward || 'Where everyone starts.', 120, yy+40, { s:13, c: got ? C.good : C.muted, max:620 }); });
  // endings
  panel(800, 186, 740, 330, 12); label('The data core', 824, 224, C.amber, 'left', 16);
  const E = PROFILE.endings || {}; T(`${Object.keys(ENDINGS).filter(k => E[k]).length} of ${Object.keys(ENDINGS).length} endings found. How you treat Pip decides how a win ends.`, 824, 252, { s:14, c:C.muted, max:690 });
  Object.keys(ENDINGS).forEach((k, i) => { const cx = 824 + (i%2)*352, cy = 272 + Math.floor(i/2)*116, got = !!E[k];
    rr(cx, cy, 340, 104, 10); ctx.fillStyle = got ? hexA(C.amber,.08) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = got ? C.amber : C.line; ctx.lineWidth = 1.5; ctx.stroke();
    T(got ? ENDINGS[k].title : '???', cx+16, cy+32, { s:19, f:FD, w:700, c: got ? C.amber : C.muted, max:310 });
    para(got ? ENDINGS[k].text : { trusted:'Win with Pip trusting you.', cold:'Win with Pip aboard, but not your friend.', free:'Win after letting Pip go.', sold:'Win after selling Pip to the Rebuff.' }[k], cx+16, cy+48, 312, { s:12, lh:16, c:C.muted, max:3 });
    if(got) tip(cx, cy, 340, 104, ENDINGS[k].title, ENDINGS[k].text); });
  // alert levels
  panel(800, 536, 740, 350, 12); label('Rebuff alert', 824, 574, C.hostile, 'left', 16);
  const A = PROFILE.alert || 0;
  T(A ? `Unlocked up to level ${A}. Pick it in the hangar. Win on Normal or Hard at your highest level to open the next.` : 'Win a run on Normal or Hard to unlock alert level 1: harder runs for more renown and score.', 824, 602, { s:14, c:C.muted, max:690 });
  for(let i=1;i<=ALERT_MAX;i++){ const yy = 618 + (i-1)*32, got = i <= A;
    T(`${i}`, 836, yy+22, { s:17, f:FD, w:700, c: got ? C.hostile : C.muted, a:'center' }); T(ALERTS[i].name, 860, yy+22, { s:16, f:FD, w:700, c: got ? C.ink : C.muted, max:190 }); T(ALERTS[i].desc, 1060, yy+22, { s:13, c: got ? C.ink : C.muted, max:470 }); }
  btn(1340, 906, 200, 64, 'Back', () => { UI.screen = 'title'; }, { s:20 });
  const req = nextRequisition(); if(req) T(`Next ship requisition: ${req.name}`, 60, 942, { s:16, c:C.muted });
}

/* a small rank card for the title screen (inside the Captain's record panel) */
function drawRankCard(x, y, w){
  const r = renownNow(), ri = rankIdx(), nx = nextRank();
  T(rankName(), x, y, { s:24, f:FD, w:700, c:C.amber, max:w-150 });
  const frac = nx ? (r - RANKS[ri].at)/(nx.at - RANKS[ri].at) : 1; rr(x, y+12, w, 10, 5); ctx.fillStyle = 'rgba(6,9,18,.8)'; ctx.fill(); rr(x, y+12, Math.max(10, w*clamp(frac,0,1)), 10, 5); ctx.fillStyle = C.amber; ctx.fill();
  T(nx ? `${fmtNum(r)} / ${fmtNum(nx.at)} renown · next: ${nx.name}` : `${fmtNum(r)} renown`, x, y+44, { s:13, c:C.muted, max:w });
}

/* ---------------- the killing blow: a beat of slow motion and a banner ---------------- */
function juiceKill(e, kind){
  if(!G || G.duel) return; const vet = e.elite, boss = e.boss || G.boss;
  G.slowT = SET.slowmo===false ? 0 : (boss ? 1.1 : .7); G.flash = Math.max(G.flash||0, boss ? .9 : .55); G.shake = Math.max(G.shake||0, boss ? 1 : .6);
  const quick = (G.combatT||0) < 20, flawless = G.ship.hull >= (G.hull0 ?? 0);
  const sub = kind==='crew' ? 'Crew eliminated' : quick ? 'Quick draw' : flawless ? 'Not a scratch' : (G.ship.hull <= 5 ? 'By a thread' : '');
  G.banner = { t:0, t0:0, text: boss ? 'FLAGGSHIP BROKEN' : kind==='crew' ? 'SHIP TAKEN' : vet ? 'VETERAN DOWN' : 'TARGET DESTROYED', sub, col: boss ? C.amber : vet ? '#ff9f43' : C.good };
}
function drawBanner(){ const b = G && G.banner; if(!b) return; const now = performance.now(); b.t0 = b.t0 || now; b.t = (now - b.t0)/1000; if(b.t > 1.9){ G.banner = null; return; }
  const a = b.t < .15 ? b.t/.15 : b.t > 1.5 ? (1.9 - b.t)/.4 : 1, sc = 1 + Math.max(0, .15 - b.t)*1.6;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(W/2, 300); ctx.scale(sc, sc);
  const g = ctx.createLinearGradient(-520, 0, 520, 0); g.addColorStop(0, 'rgba(6,9,18,0)'); g.addColorStop(.2, 'rgba(6,9,18,.82)'); g.addColorStop(.8, 'rgba(6,9,18,.82)'); g.addColorStop(1, 'rgba(6,9,18,0)');
  ctx.fillStyle = g; ctx.fillRect(-520, -54, 1040, b.sub ? 100 : 80); ctx.fillStyle = b.col; ctx.fillRect(-360, -54, 720, 2); ctx.fillRect(-360, b.sub ? 44 : 24, 720, 2);
  T(b.text, 0, 6, { s:52, f:FD, w:700, a:'center', c:b.col, ls:8 }); if(b.sub) T(b.sub.toUpperCase(), 0, 34, { s:16, f:FD, w:700, a:'center', c:C.ink, ls:4 });
  ctx.restore(); }

/* ---------------- story events ---------------- */
Object.assign(BASE.events, {
  c_sendoff:{ title:'Admiral Hale', questOnly:true, noStar:true, art:'station', text:'Admiral Hale sees you off.', choices:[ { text:'Go.', effect:{ dismiss:true } } ] },
  pip_wake:{ title:'The data core', questOnly:true, noStar:true, once:true, art:'ship', text:'Somewhere in the hold, the data core starts humming. Badly. {crew} puts an ear to the casing and jumps back. "It said ow."', choices:[
    { text:'Talk to it.', effect:{ text:'"Oh! Hello! Is this the outside? It\'s very loud." The voice is small and bright. "I\'m Pip. I think. I\'m the data. Please don\'t open me with a crowbar, I\'ve heard about crowbars."', cmp:{ pipMet:true, pip:1, beat:true } } },
    { text:'Orders are orders: seal the hold and ignore it.', effect:{ text:'You weld the hatch shut. Through two inches of steel, a muffled voice says "rude." The humming carries on for three days.', cmp:{ pipMet:true, pip:-1, beat:true } } },
    { text:'Have {who} run a very gentle diagnostic.', req:{ quirk:'tinkerer' }, effect:{ text:'{who} and the core talk in machine code for an hour. "It\'s called Pip," {who} reports. "It\'s frightened, and it\'s very good at maths." Pip retunes your reactor to say thank you.', reactor:1, cmp:{ pipMet:true, pip:2, beat:true } } } ] },
  pip_window:{ title:'Pip', questOnly:true, noStar:true, once:true, art:'star', text:'"Can I see out?" Pip has taught itself to use the intercom. "Just once. I\'ve only ever seen the inside of the box. It\'s beige."', choices:[
    { text:'Patch Pip into the sensors.', effect:{ text:'Pip goes very quiet for a long time. "Oh," it says at last. "It\'s so big." Then it starts naming stars, and marks every beacon in the sector while it\'s at it.', reveal:true, cmp:{ pip:1, beat:true } } },
    { text:'Not a chance. You might be a Rebuff trick.', effect:{ text:'"That\'s fair," says Pip, in a voice that means it isn\'t. The intercom clicks off.', cmp:{ pip:-1, beat:true } } },
    { text:'{who} describes the view instead.', req:{ quirk:'poet' }, effect:{ text:'{who} talks for an hour about the light of dying stars. Pip records every word. "I\'m going to keep that," it says. "Forever. I can do that, you know."', cmp:{ pip:2, beat:true, hearts:20 } } } ] },
  kross_offer:{ title:'Director Kross', questOnly:true, noStar:true, once:true, art:'fleet', text:'Every screen on the bridge flickers, and a thin, tidy face appears. "Director Kross, Rebuff Intelligence. You have something of ours. A data core. I am told it has started talking." A pause. "Hand it over, and I call off the Fleet. I will even pay you. Generously."', choices:[
    { text:'"Pip stays with us."', effect:{ text:'"Pity." The screen goes dark. Down in the hold, a very small voice says "thank you", then pretends it didn\'t.', cmp:{ pip:1, beat:true } } },
    { text:'Sell the core: 150 scrap, and the Fleet falls back.', effect:{ text:'A Rebuff shuttle docks. Pip doesn\'t say anything as they carry it out. That is the worst part. Kross keeps his word, which is somehow the second worst part.', cmp:{ sell:true, beat:true } } },
    { text:'Hand over a fake core full of cat pictures.', chance:.55, success:{ text:'Kross\'s technicians spend six hours decrypting four terabytes of cats. By the time he calls back, screaming, you are long gone. Pip laughs so hard its fan rattles.', fleetPush:-.08, cmp:{ pip:1, beat:true } }, fail:{ text:'Kross looks at the first file for a long moment. "Cats." He cuts the line. Somewhere behind you, the Fleet speeds up.', fleetPush:.1, cmp:{ pip:1, beat:true } } },
    { text:'{who} has been expecting this exact call for years.', req:{ quirk:'conspiracy' }, effect:{ text:'{who} keeps Kross talking about "the Directorate\'s long game" while tracing the signal. By the time he notices, you know where his patrols are. Pip is deeply impressed.', fleetPush:-.15, cmp:{ pip:1, beat:true } } } ] },
  pip_song:{ title:'Pip', questOnly:true, noStar:true, once:true, art:'ship', text:'Pip has learned everyone\'s name. It has also learned to sing, using the ship\'s alarm klaxon, which is a problem. "{crew} taught me a song," it says. "Do you want to hear it? You\'re going to hear it."', choices:[
    { text:'Sing along.', effect:{ text:'The whole crew sings. It is terrible. Morale has never been better.', crewHeal:100, cmp:{ pip:1, beat:true, hearts:30 } } },
    { text:'"Pip. What are you, really?"', effect:{ text:'"I\'m the Flaggship\'s shield codes," says Pip. "And also me. I\'m not sure which came first. Somebody made the codes too clever and, well. Here I am." A pause. "Are you going to give me to the soldiers?"', cmp:{ truth:true, beat:true } } },
    { text:'Mute the klaxon.', effect:{ text:'Silence. Then, faintly, Pip humming the song through the coffee machine.', cmp:{ pip:-1, beat:true } } } ] },
  pip_fear:{ title:'Pip', questOnly:true, noStar:true, once:true, art:'nebula', text:'"When we get there," Pip says, "they\'ll unpack me, won\'t they? To get at the codes." The hold is very quiet. "Will it hurt?"', choices:[
    { text:'"Nobody is unpacking you. I promise."', effect:{ text:'"Okay," says Pip. "Okay. I believe you." It goes back to humming, a little louder than before.', cmp:{ pip:1, promise:true, beat:true } } },
    { text:'"You\'re a weapon, Pip. This is what you\'re for."', effect:{ text:'Pip doesn\'t answer. The humming stops, and doesn\'t start again.', cmp:{ pip:-2, beat:true } } },
    { text:'Let Pip go: open a channel to the relay network.', effect:{ text:'"Really?" Pip hovers on the edge of the network for a long moment. "I\'ll leave you something. And I\'ll be around. Look for me in the beacons." Then it\'s gone, and the core is just a beige box. A parting gift is waiting in your systems.', augment:'random', cmp:{ free:true, beat:true } } } ] },
  pip_ready_hi:{ title:'Pip', questOnly:true, noStar:true, once:true, art:'fleet', text:'"I can get into the Flaggship\'s shields," Pip says. "I\'ve been practising. Not for long, but long enough. Just say when." A nervous whirr. "And afterwards... you\'ll still be here?"', choices:[
    { text:'"When. And yes."', effect:{ text:'Pip giggles, very quietly, and starts limbering up its maths.', cmp:{ ready:'shields' } } } ] },
  pip_ready_lo:{ title:'Pip', questOnly:true, noStar:true, once:true, art:'fleet', text:'"I can drop the Flaggship\'s shields," Pip says flatly. "For a moment. That\'s what I\'m for, isn\'t it."', choices:[
    { text:'"Do it when we get there."', effect:{ text:'"Fine."', cmp:{ ready:'shields' } } },
    { text:'"Pip... I\'m sorry."', effect:{ text:'A long silence. "Okay," Pip says. "Thanks. I\'ll try harder than a moment."', cmp:{ pip:2, ready:'shields' } } } ] },
  kross_final:{ title:'Director Kross', questOnly:true, noStar:true, once:true, art:'fleet', text:'Kross again, smug as a filing cabinet. "Courier. I wanted to thank you personally. Your little core told us everything about the Flaggship\'s weak spots. They have all been fixed." He smiles. "I am told it cried."', choices:[
    { text:'Close the channel.', effect:{ text:'You close it harder than strictly necessary.' } } ] },
  pip_beacons:{ title:'Hello', questOnly:true, noStar:true, once:true, art:'star', text:'As you enter the last sector, every beacon in it blinks twice. Then the map lights up with routes nobody gave you. Somewhere out in the relay network, a small bright voice says: "Hi! Miss me? Thought you could use a hand."', choices:[
    { text:'"Hi, Pip."', effect:{ text:'"Hi!" Pip marks the whole sector for you, and promises to jam the Flaggship\'s guns when you find it.', reveal:true, cmp:{ ready:'weapons' } } } ] }
});

ACHIEVEMENTS.push(
  { id:'end_trusted',  name:'Good Data',             desc:'Win with Pip trusting you.' },
  { id:'end_cold',     name:'The Lead Box',          desc:'Win with Pip aboard, but not your friend.' },
  { id:'end_free',     name:'Ghost in the Beacons',  desc:'Win after setting Pip free.' },
  { id:'end_sold',     name:'Thirty Pieces of Scrap',desc:'Win after selling Pip to the Rebuff.' },
  { id:'end_sellout',  name:'A Very Reasonable Offer',desc:'Accept Director Kross\'s offer.' },
  { id:'end_all',      name:'Every Version of Pip',  desc:'See all four endings.' },
  { id:'rank_lt',      name:'Lieutenant',            desc:'Reach the rank of Lieutenant.' },
  { id:'rank_cmdr',    name:'Commander',             desc:'Reach the rank of Commander.' },
  { id:'rank_admiral', name:'Admiral of the Fleet',  desc:'Reach the rank of Admiral.' },
  { id:'alert1',       name:'On Alert',              desc:'Win at Rebuff alert 1 or higher.' },
  { id:'alert4',       name:'High Alert',            desc:'Win at Rebuff alert 4 or higher.' },
  { id:'alert8',       name:'Total War',             desc:'Win at Rebuff alert 8.' },
  { id:'veteran3',     name:'Veteran Hunter',        desc:'Beat three veteran crews in one run.' }
);
