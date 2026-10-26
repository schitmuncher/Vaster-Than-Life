'use strict';
/* =========================================================================
   Challenges: hand-made runs with a twist and a goal. A challenge picks the
   ship, difficulty and rules, changes the starting loadout, and is complete
   the moment you reach its goal (a sector, or victory). Mods can add their own
   under "challenges", with the same fields.
   ========================================================================= */
BASE.challenges = {
  first_command: { name:'First Command', tier:1, ship:'pestrel', difficulty:'easy', goal:{ sector:3 },
    desc:'A gentle start. Reach sector 3 on Easy.' },
  low_fuel:      { name:'Running on Fumes', tier:1, ship:'pestrel', start:{ fuel:4 }, goal:{ sector:3 },
    desc:'Leave dock with 4 fuel. Every jump counts: hunt for stores and fuel caches.' },
  embargo:       { name:'Missile Embargo', tier:1, ship:'pestrel', start:{ weapons:['bust1','basic'], missiles:0 }, goal:{ sector:5 },
    desc:'No missiles aboard. Break shields with lasers alone and reach sector 5.' },
  ion_age:       { name:'The Ion Age', tier:1, ship:'pestrel', start:{ weapons:['ion2','heavy1'] }, goal:{ sector:4 },
    desc:'One Heavy Ion and one Heavy Laser. Lock their shields, then hit hard. Reach sector 4.' },
  lone_wolf:     { name:'Lone Wolf', tier:2, ship:'pestrel', start:{ crewCount:1 }, goal:{ sector:4 },
    desc:'Just you. Fly, fight and fix with one crew member until you can hire more. Reach sector 4.' },
  glass_jaw:     { name:'Glass Jaw', tier:2, ship:'pestrel', start:{ hull:12 }, goal:{ sector:5 },
    desc:'Your hull tops out at 12. Dodge, shield and repair your way to sector 5.' },
  shoestring:    { name:'Shoestring Budget', tier:2, ship:'pestrel', start:{ scrap:0 }, scrapMult:.6, goal:{ sector:5 },
    desc:'No scrap to start, and every wreck pays 40% less. Spend wisely and reach sector 5.' },
  hot_pursuit:   { name:'Hot Pursuit', tier:2, ship:'pestrel', rules:{ fleetSpeed:.16 }, goal:{ sector:5 },
    desc:'The Rebuff Fleet moves half again as fast. No time to explore. Reach sector 5.' },
  drone_cmd:     { name:'Drone Commander', tier:2, ship:'pestrel', start:{ weapons:['basic'], systems:{ drones:3 }, drones:['combat1','defense1'], parts:12 }, goal:{ sector:4 },
    desc:'Your drones do the fighting, backed by one basic laser. Reach sector 4.' },
  boarders:      { name:'Boarders Away', tier:3, ship:'mantlis', start:{ weapons:[], systems:{ teleporter:2 } }, goal:{ sector:4 },
    desc:'No guns at all. Beam your Mantlis over and win every fight by hand. Reach sector 4.' },
  short_fuse:    { name:'Short Fuse', tier:3, ship:'pestrel', rules:{ sectors:4 }, goal:{ win:true },
    desc:'Only four sectors, so the Flaggship comes early. Build fast and beat it.' },
  paper_tiger:   { name:'Paper Tiger', tier:3, ship:'pestrel', start:{ hull:15, weapons:['bust2','heavy1','arty'], scrap:40 }, goal:{ win:true },
    desc:'Big guns, a paper-thin hull. Win the whole run.' },
  hard_way:      { name:'The Hard Way', tier:3, ship:'pestrel', difficulty:'hard', goal:{ win:true },
    desc:'Win a full run on Hard.' },
  endurance:     { name:'Endurance', tier:3, ship:'pestrel', rules:{ sectors:10, baseHP:6 }, goal:{ win:true },
    desc:'Ten sectors of space between you and the Flaggship. Win the long war.' }
};

ACHIEVEMENTS.push(
  { id:'challenge1',  name:'Up for It',               desc:'Complete a challenge.' },
  { id:'challenge5',  name:'Challenge Accepted',      desc:'Complete 5 challenges.' },
  { id:'challengeall',name:'Overachiever',            desc:'Complete every built-in challenge.' },
  { id:'kills100',    name:'Centurion',               desc:'Defeat 100 ships across all runs.' },
  { id:'hardwin',     name:'Hard Boiled',             desc:'Win a run on Hard.' },
  { id:'noloss',      name:'Nobody Left Behind',      desc:'Win a run without losing a crew member.' },
  { id:'speedwin',    name:'Light Speed',             desc:'Win a run in under 40 minutes of play.' },
  { id:'marathonwin', name:'The Long Haul',           desc:'Win a run of 10 or more sectors.' },
  { id:'flawless5',   name:'Untouchable',             desc:'Win 5 fights in one run without losing any hull in them.' },
  { id:'quickdraw',   name:'Quick Draw',              desc:'Destroy a ship within 20 seconds of the fight starting.' },
  { id:'pacifist',    name:'Conscientious Objector',  desc:'Reach sector 4 without defeating a single ship.' },
  { id:'rainbow',     name:'United Colours',          desc:'Have crew of 5 different races aboard at once.' },
  { id:'hoarder',     name:'Dragon\'s Hoard',          desc:'Hold 400 scrap at once.' },
  { id:'scrapbaron',  name:'Scrap Baron',             desc:'Collect 1000 scrap in one run.' },
  { id:'streak7',     name:'Daily Devotion',          desc:'Fly the daily run seven days in a row.' },
  { id:'modsquad',    name:'Mod Squad',               desc:'Start a run with 5 or more mods turned on.' },
  { id:'lever',       name:'Punch It',                desc:'In VR, jump with the jump lever.' },
  { id:'starpilot',   name:'Star Pilot',              desc:'In VR, jump by pointing at a beacon on the 3D star map.' },
  { id:'blaster5',    name:'Quick on the Trigger',    desc:'In VR, take down 5 hostile crew with your blaster.' }
);

function challengeDef(id){ return (typeof DATA!=='undefined' && DATA && DATA.challenges && DATA.challenges[id]) || BASE.challenges[id] || (PROFILE.customChallenges && PROFILE.customChallenges[id]) || null; }
function startChallenge(id){
  const ch = challengeDef(id); if(!ch) return;
  const ship = (DATA.ships && DATA.ships[ch.ship]) ? ch.ship : 'pestrel';
  newRun(ship, null, { challenge:id });
}
/* called by newRun after mods are applied (rules) and after the ship is built (loadout) */
function challengeRules(ch){ if(ch && ch.rules && typeof ch.rules==='object') Object.assign(R, ch.rules); }
function challengeLoadout(ch){
  const s = G.ship, st = (ch && ch.start) || {}; if(!ch) return;
  if(typeof st.hull==='number'){ s.maxHull = s.hull = Math.max(1, st.hull); }
  if(Array.isArray(st.crew)){ s.crew = s.crew.filter(c => c.owner!=='p'); for(const r of st.crew) if(DATA.races[r]) addCrew(s, r, 'p'); }
  if(typeof st.crewCount==='number'){ const mine = s.crew.filter(c => c.owner==='p'); for(const c of mine.slice(Math.max(1, st.crewCount))) s.crew.splice(s.crew.indexOf(c), 1); }
  if(st.systems) for(const k in st.systems){ if(!SYSN[k]) continue; if(!s.systems[k]) installSystem(s, k); if(s.systems[k]) s.systems[k].max = Math.max(s.systems[k].max, Math.min(8, st.systems[k])); }
  if(Array.isArray(st.weapons)) s.weapons = st.weapons.filter(id => DATA.weapons[id]).slice(0, R.weaponSlots).map(id => ({ id, charge:0, on:false, target:null }));
  if(Array.isArray(st.drones)) s.drones = st.drones.filter(id => DATA.drones[id]).slice(0, R.droneSlots).map(id => ({ id, on:false, unit:null }));
  if(Array.isArray(st.augments)) s.augments = st.augments.filter(id => DATA.augments[id]).slice(0, R.augmentSlots);
  for(const k of ['scrap','fuel','missiles','parts']) if(typeof st[k]==='number') G[k] = Math.max(0, st[k]);
  if(typeof autoPowerWeapons==='function') autoPowerWeapons(s);
  G.chScrap = typeof ch.scrapMult==='number' ? ch.scrapMult : 1;
}
function challengeGoalText(ch){ const g = ch.goal || {}; return g.win ? 'Win the run' : `Reach sector ${g.sector || 3}`; }
/* goal reached? called on every new sector and at the end of a run */
function challengeCheck(win){
  if(!G || !G.challenge || G.chDone) return; const ch = challengeDef(G.challenge); if(!ch) return;
  const g = ch.goal || {}, ok = g.win ? !!win : G.sector >= (g.sector || 3); if(!ok) return;
  G.chDone = true; const P = (PROFILE.challenges = PROFILE.challenges || {}), rec = P[G.challenge] || {};
  if(!rec.done) rec.done = Date.now(); P[G.challenge] = rec; saveProfile(); sfx('achieve');
  toast(`Challenge complete: ${ch.name}!`); logEntry(`Completed the ${ch.name} challenge.`);
  const done = Object.keys(P).filter(k => P[k].done);
  grant('challenge1'); if(done.length >= 5) grant('challenge5');
  if(Object.keys(BASE.challenges).every(k => P[k] && P[k].done)) grant('challengeall');
}
function challengeRecord(){
  if(!G || !G.challenge) return; const P = (PROFILE.challenges = PROFILE.challenges || {}), rec = P[G.challenge] || {};
  rec.tries = (rec.tries||0) + 1; rec.best = Math.max(rec.best||0, G.sector); P[G.challenge] = rec;
}
/* run-wide medals that need a look at the run as it goes */
function runAchCheck(){
  if(!G || !G.ship) return;
  if(G.scrap >= 400) grant('hoarder'); if((G.stats.scrap||0) >= 1000) grant('scrapbaron');
  const races = new Set(G.ship.crew.filter(c => c.owner==='p' && !c.drone).map(c => c.race)); if(races.size >= 5) grant('rainbow');
  if(G.sector >= 4 && (G.stats.kills||0) === 0) grant('pacifist');
}

/* ---------------- the Challenges screen ---------------- */
function drawChallenges(){
  label('Hand-made runs', 60, 70, C.cyan, 'left', 18);
  T('Challenges', 60, 122, { s:50, f:FD, w:700 });
  const all = Object.entries((DATA && DATA.challenges) || BASE.challenges).concat(Object.entries(PROFILE.customChallenges || {})), P = PROFILE.challenges || {};
  T(`${all.filter(([k]) => P[k] && P[k].done).length} of ${all.length} complete`, 1540, 122, { s:20, a:'right', c:C.amber });
  const per = 9, pages = Math.max(1, Math.ceil(all.length/per)); UI.chPage = clamp(UI.chPage||0, 0, pages-1);
  all.slice(UI.chPage*per, UI.chPage*per + per).forEach(([id, ch], i) => {
    const x = 60 + (i%3)*496, y = 160 + Math.floor(i/3)*226, rec = P[id] || {}, done = !!rec.done;
    panel(x, y, 480, 214, 10); if(done){ ctx.strokeStyle = C.good; ctx.lineWidth = 2; rr(x+1, y+1, 478, 212, 10); ctx.stroke(); }
    T(ch.name || id, x+20, y+38, { s:22, f:FD, w:700, c: done ? C.good : C.ink, max:330 });
    const tier = clamp(ch.tier||1, 1, 3); T('★'.repeat(tier) + '☆'.repeat(3 - tier), x+460, y+36, { s:18, a:'right', c:C.amber });
    para(ch.desc || '', x+20, y+66, 440, { s:14, lh:19, c:C.muted, max:3 });
    const shipName = (DATA.ships[ch.ship] || DATA.ships.pestrel || {}).name || ch.ship;
    T(`${challengeGoalText(ch)} · ${shipName} · ${(DIFFICULTY[ch.difficulty] || DIFFICULTY.normal).name}`, x+20, y+142, { s:14, c:C.cyan, max:440 });
    T(done ? `Complete ✓${rec.tries ? ' · ' + rec.tries + ' tr' + (rec.tries===1?'y':'ies') : ''}` : rec.tries ? `Best: sector ${rec.best||1} · ${rec.tries} tr${rec.tries===1?'y':'ies'}` : 'Not tried yet', x+20, y+190, { s:15, c: done ? C.good : C.muted });
    btn(x+320, y+158, 140, 44, done ? 'Again' : 'Start', () => startChallenge(id), { s:17, fill:!done });
    if(ch.custom){ label('Custom', x+20, y+18, C.warn, 'left', 11); btn(x+180, y+158, 130, 44, 'Share', () => { if(typeof shareChallenge==='function') shareChallenge(id); }, { s:15, col:C.warn }); }
  });
  if(pages>1){ btn(300, 880, 80, 64, '‹', () => UI.chPage--, { disabled:UI.chPage<=0 }); T(`Page ${UI.chPage+1} of ${pages}`, 470, 920, { s:16, a:'center', c:C.muted }); btn(560, 880, 80, 64, '›', () => UI.chPage++, { disabled:UI.chPage>=pages-1 }); }
  para('Challenges use your mods. The goal is checked as you play: reach it and the challenge is yours, even if the run goes on.', 700, 900, 840, { s:15, lh:21, c:C.muted });
  btn(60, 880, 200, 64, 'Back', () => { UI.screen = 'title'; });
  if(typeof mpCodesOpen==='function') btn(60, 800, 200, 64, 'Make your own', () => { UI.screen = 'mp'; MP.view = 'codes'; mpCodesOpen('codes'); }, { s:16, col:C.warn });
}
