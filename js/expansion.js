'use strict';
/* =========================================================================
   Expansion: more to do between the Admiral's send-off and the Flaggship.
   - Gun refits: stores tune the weapons you already own (Mk II, Mk III).
   - Sector situations: a crackdown, a salvage boom, storm season... shown on
     the exit cards, so choosing a route means more.
   - The Ghost Fleet: a three-part quest that can bring old Fedoration frigates
     to the last battle.
   - Lucky Vell's crate: carry a smuggler's cargo, and decide what to do with it.
   - New one-off events.
   ========================================================================= */

/* ---------------- gun refits ---------------- */
const MK_NAMES = ['', ' Mk II', ' Mk III'];
const MK_MAX = 2, MK_SPEED = .15;   // each refit: the gun charges 15% faster
function refitCost(w){ return Math.round((28 + 8*G.sector + 26*(w.mk||0)) * (typeof alertLv==='function' && alertLv() >= 2 ? 1.1 : 1)); }
function weaponLabel(w){ const d = DATA.weapons[w.id]; return (d ? d.name : w.id) + (MK_NAMES[w.mk||0] || ''); }
function refitMult(sh, w){ return sh && sh.side==='p' && w.mk ? 1 + MK_SPEED*w.mk : 1; }
function drawRefits(st, cx, y, W2){
  const s = G.ship, ws = s.weapons.filter(w => DATA.weapons[w.id] && !DATA.weapons[w.id].heal); if(!ws.length) return;
  label('Workshop: refit the guns you have', cx, y, C.cyan, 'left', 14);
  T('Each refit: 15% faster charging. Two per gun.', cx + W2, y, { s:13, a:'right', c:C.muted, max:W2/2 - 20 });
  ws.slice(0, 4).forEach((w, i) => { const x = cx + (i%2)*(W2/2 + 6), yy = y + 14 + Math.floor(i/2)*60, bw = W2/2 - 6, d = DATA.weapons[w.id], mk = w.mk||0, c = refitCost(w);
    rr(x, yy, bw, 52, 8); ctx.fillStyle = 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
    T(weaponLabel(w), x+16, yy+24, { s:17, f:FD, w:700, c: mk ? C.cyan : C.ink, max:bw-250 }); T(`${(d.charge/(1 + MK_SPEED*mk)).toFixed(1)}s${mk < MK_MAX ? ` → ${(d.charge/(1 + MK_SPEED*(mk+1))).toFixed(1)}s` : ''}`, x+16, yy+44, { s:13, c:C.muted });
    btn(x+bw-220, yy+6, 210, 40, mk >= MK_MAX ? 'Fully refitted' : `Refit · ${c}`, () => spend(c, () => { w.mk = mk + 1; toast(`${weaponLabel(w)}: charges faster now.`); if(w.mk >= MK_MAX) grant('exp_refit'); }), { s:15, col:C.cyan, disabled: mk >= MK_MAX || G.scrap < c }); });
}


/* ---------------- weapon descriptions in plain words ---------------- */
function weaponRole(d){ if(!d) return ''; return weaponRole_(d) + (typeof trickText==='function' ? trickText(d) : ''); }
function weaponRole_(d){
  const n = d.shots||1, dmg = d.damage||0, every = `every ${d.charge}s`;
  const extras = []; if(d.fire) extras.push(d.fire >= .5 ? 'often starts fires' : 'can start fires'); if(d.breach) extras.push(d.breach >= .5 ? 'often breaches the hull' : 'can breach the hull'); if(d.stun) extras.push(`stuns crew for ${d.stun}s`); if(d.crewDamage) extras.push(`hurts crew in the room (${d.crewDamage})`);
  const x = extras.length ? ` ${extras.join(', ').replace(/^./, m => m.toUpperCase())}.` : '';
  switch(d.type){
    case 'laser': return `Fires ${n} laser shot${n>1?'s':''} of ${dmg} damage ${every}. Each shield layer stops one shot, so ${n >= 3 ? 'this many shots tears shields down: a great opener' : n===2 ? 'fire it with another gun to get through' : 'on its own it only hurts an unshielded ship'}.${dmg >= 2 ? ' Hits hard once the shields are down.' : ''}${x}`;
    case 'missile': return `Fires a missile of ${dmg} damage ${every} that flies straight through shields. Costs 1 missile a shot; defence drones can shoot it down. Best for knocking out their shields or guns early.${x}`;
    case 'ion': return `Each hit knocks out a shield layer, or locks a system for ${5*dmg}s, but does no hull damage. Pair it with lasers: ion the shields, then shoot.${x}`;
    case 'beam': return dmg ? `A beam that sweeps ${d.rooms||2} rooms, ${dmg} damage each. Every shield layer cuts a point off, so fire it once the shields are down.${x}` : `A beam that sweeps ${d.rooms||2} rooms. Does no hull damage, but gets through shields to the crew and rooms.${x}`;
    case 'flak': return `Scatters ${n} fragments around the room you aim at, ${every}. Each one strips a shield layer: messy, but superb at breaking shields.${x}`;
    case 'bomb': return d.heal ? `Teleports onto a room on your own ship and heals everyone in it by ${d.heal}.` : `Teleports straight onto a room, ignoring shields${d.sysDamage ? `: ${d.sysDamage} system damage` : ''}${d.ion ? `, ${d.ion} ion` : ''}. No hull damage.${x}`;
  } return d.desc || ''; }
function weaponStats(d){ if(!d) return ''; return `${d.type} · ${d.heal ? 'heals ' + d.heal : d.type==='bomb' ? (d.sysDamage||0) + ' system dmg' : (d.damage||0) + ' dmg' + ((d.shots||1) > 1 ? ' × ' + d.shots : '')} · ${d.power} power · ${d.charge}s`; }


/* ---------------- the ship's pet: a job aboard, and a sprite you can see and pat ---------------- */
const PET_JOBS = {
  kitten:{ job:'Hunts boarders: claws any intruder in its room (4 damage a second).', seek:'foe' },
  slug:  { job:'Seals hull breaches it finds, and sometimes patches 1 hull after a fight.', seek:'breach' },
  moth:  { job:'Drawn to fire: flaps out the flames in whatever room is burning.', seek:'fire' },
  goat:  { job:'Headbutts boarders (stuns them), and eats junk from the hold for scrap.', seek:'foe' },
  cloud: { job:'Fuzzes your sensor signature: +3% evasion. Calms anyone in its room.', seek:'crew' }
};
function petHere(){ return G && G.pet && !G.pet.gone && !G.pet.big && G.ship ? G.pet : null; }
function petTarget(P){ const sh = G.ship, rooms = sh.rooms, seek = (PET_JOBS[P.kind]||{}).seek;
  const pickR = f => { const l = rooms.map((r,i) => i).filter(i => f(rooms[i], i)); return l.length ? pick(l) : null; };
  let t = null;
  if(seek==='foe') t = pickR((r,i) => sh.crew.some(c => c.room===i && crewSide(c)!=='p'));
  else if(seek==='breach') t = pickR(r => r.breach > 0);
  else if(seek==='fire') t = pickR(r => r.fire > 0);
  else if(seek==='crew') t = pickR((r,i) => sh.crew.some(c => c.room===i && c.owner==='p' && c.hp < c.maxHp));
  return t!=null ? t : (Math.random() < .5 ? P.room : Math.floor(Math.random()*rooms.length)); }
function petTick(dt){ const P = petHere(); if(!P) return; const sh = G.ship; if(P.room==null || !sh.rooms[P.room]) P.room = 0;
  P.moveT = (P.moveT||0) - dt; if(P.moveT <= 0){ const to = petTarget(P); if(to!==P.room){ P.from = P.room; P.room = to; P.walk = 0; } P.moveT = 4 + Math.random()*5; }
  if(P.walk!=null && P.walk < 1) P.walk = Math.min(1, P.walk + dt*.8);
  const r = sh.rooms[P.room]; P.workT = (P.workT||0) + dt; const here = sh.crew.filter(c => c.room===P.room);
  if(P.kind==='kitten'){ const foe = here.find(c => crewSide(c)!=='p' && !c.drone); if(foe){ foe.hp -= 4*dt; P.busy = 'pounce'; } else P.busy = null; }
  if(P.kind==='goat' && P.workT > 8){ const foe = here.find(c => crewSide(c)!=='p'); if(foe){ foe.stunT = Math.max(foe.stunT||0, 2.5); P.workT = 0; P.busy = 'butt'; fxAtRoom(sh, P.room, 'text', 'HEADBUTT'); } }
  if(P.kind==='slug' && r.breach > 0 && P.workT > 6){ r.breach--; P.workT = 0; fxAtRoom(sh, P.room, 'text', 'SEALED'); }
  if(P.kind==='moth' && r.fire > 0 && P.workT > 5){ r.fire--; P.workT = 0; fxAtRoom(sh, P.room, 'text', 'FLAP FLAP'); }
  if(P.kind==='cloud') for(const c of here) if(c.owner==='p' && !c.drone && c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + 1.2*dt);
  P.loveT = (P.loveT||0) + dt; if(P.loveT > 12){ P.loveT = 0; for(const c of here) if(c.owner==='p' && !c.drone && typeof addHearts==='function') addHearts(c, 2); } }
function petEvade(sh){ const P = petHere(); return P && P.kind==='cloud' && sh===G.ship ? 3 : 0; }
function petAfterFight(L){ const P = petHere(); if(!P) return; if(P.kind==='slug' && Math.random() < .4 && G.ship.hull < G.ship.maxHull){ G.ship.hull++; L.push(`${P.name} slimes a crack shut: +1 hull`); } }
function petJump(){ const P = petHere(); if(!P) return; P.patted = false;
  if(P.kind==='goat' && G.bay && G.bay.junk > 0){ G.bay.junk--; if(!G.bay.junk) delete G.bay.junk; G.scrap += 6; G.stats.scrap += 6; toast(`${P.name} ate some interesting junk and coughed up 6 scrap. Don't ask.`); } }
function petPat(){ const P = petHere(); if(!P) return; if(P.patted){ toast(`${P.name} has had enough fuss for now.`); return; } P.patted = true; P.hop = performance.now();
  for(const c of G.ship.crew) if(c.owner==='p' && !c.drone && typeof addHearts==='function') addHearts(c, 4); sfx('click'); toast(`You give ${P.name} a fuss. The whole crew cheers up a little.`); }
/* drawn inside the ship view: a little creature in its room, walking from room to room */
/* a pet, drawn at x, y (also used by the tutorial) */
function petSprite(kind, x, y, sc, dir, k){ if(k==null) k = 1; if(!dir) dir = 1;
  const t = performance.now()/1000; ctx.save(); ctx.translate(x, y); ctx.scale(sc*dir, sc); ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 4;   // a dark outline so it reads on any floor
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(0, 7, 9, 2.5, 0, 0, 7); ctx.fill();
  const body = (c, path) => { ctx.fillStyle = c; ctx.beginPath(); path(); ctx.fill(); };
  switch(kind){
    case 'kitten': { body('#e9eefc', () => ctx.ellipse(0, 0, 8, 5.5, 0, 0, 7)); body('#e9eefc', () => ctx.arc(7, -5, 4.5, 0, 7));
      body('#e9eefc', () => { ctx.moveTo(4, -8); ctx.lineTo(5, -13); ctx.lineTo(7.5, -9); ctx.moveTo(8, -9); ctx.lineTo(10.5, -13); ctx.lineTo(11, -7.5); });
      ctx.strokeStyle = '#e9eefc'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-7, -1); ctx.quadraticCurveTo(-13, -4 + Math.sin(t*4)*3, -11, -11); ctx.stroke();
      body('#2a7f5a', () => { ctx.arc(6, -5.5, 1, 0, 7); ctx.arc(9, -5.5, 1, 0, 7); }); break; }
    case 'slug': { const w = Math.sin(t*3)*1.2; body('#7be0a0', () => { ctx.moveTo(-10, 5); ctx.quadraticCurveTo(-8, -3 + w, 2, -2); ctx.quadraticCurveTo(10, -4, 10, 5); ctx.closePath(); });
      ctx.strokeStyle = '#7be0a0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(7, -10); ctx.moveTo(9, -3); ctx.lineTo(11, -9); ctx.stroke(); body('#10151f', () => { ctx.arc(7, -10, 1.3, 0, 7); ctx.arc(11, -9, 1.3, 0, 7); }); body('rgba(255,255,255,.35)', () => ctx.ellipse(-1, 0, 5, 1.6, -.1, 0, 7)); break; }
    case 'moth': { const fl = Math.sin(t*18)*.6; ctx.save(); ctx.translate(0, -6 + Math.sin(t*3)*3);
      body('rgba(255,209,102,.85)', () => ctx.ellipse(-5, 0, 6, 4 + fl*2, -.5, 0, 7)); body('rgba(255,209,102,.85)', () => ctx.ellipse(5, 0, 6, 4 + fl*2, .5, 0, 7));
      body('#6a4b2a', () => ctx.ellipse(0, 1, 1.8, 5, 0, 0, 7)); ctx.strokeStyle = '#6a4b2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(-3, -8); ctx.moveTo(0, -3); ctx.lineTo(3, -8); ctx.stroke(); ctx.restore(); break; }
    case 'goat': { body('#d8d0c0', () => ctx.ellipse(0, -1, 9, 5.5, 0, 0, 7)); body('#d8d0c0', () => ctx.ellipse(9, -6, 4, 3.4, -.4, 0, 7));
      ctx.strokeStyle = '#8a7a64'; ctx.lineWidth = 2; ctx.beginPath(); for(const lx of [-6, -2, 3, 6]){ ctx.moveTo(lx, 3); ctx.lineTo(lx + (k < 1 ? Math.sin(t*14 + lx)*1.5 : 0), 8); } ctx.stroke();
      ctx.strokeStyle = '#6a5a44'; ctx.beginPath(); ctx.moveTo(8, -9); ctx.quadraticCurveTo(6, -14, 3, -12); ctx.stroke(); body('#10151f', () => ctx.arc(11, -6.5, .9, 0, 7)); body('#d8d0c0', () => ctx.ellipse(12, -2, 1.2, 2.2, 0, 0, 7)); break; }
    case 'cloud': { for(const [ox, oy, rr_, c] of [[-4, -4, 5, 'rgba(180,140,255,.75)'], [3, -6, 6, 'rgba(95,211,230,.7)'], [6, -1, 4, 'rgba(255,138,216,.7)'], [-1, -1, 4.5, 'rgba(180,140,255,.8)']]){ body(c, () => ctx.arc(ox + Math.sin(t*2 + ox)*1, oy + Math.cos(t*2 + oy)*1, rr_, 0, 7)); }
      body('#fff', () => { ctx.arc(-1, -5, .9, 0, 7); ctx.arc(3, -5, .9, 0, 7); }); break; }
    default: body('#ffb547', () => ctx.arc(0, 0, 5, 0, 7));
  }
  ctx.restore();
}
function drawPet(){ const P = petHere(), sh = G && G.ship; if(!P || !sh || !sh._rects) return; const q = sh._rects[P.room]; if(!q) return;
  const f = P.from!=null && sh._rects[P.from] ? sh._rects[P.from] : q, k = P.walk==null ? 1 : P.walk, e = k*k*(3-2*k);
  const cx0 = f.x + f.w*.72, cy0 = f.y + f.h*.72, cx1 = q.x + q.w*.72, cy1 = q.y + q.h*.72, t = performance.now()/1000;
  const hop = P.hop && t - P.hop/1000 < .6 ? Math.sin((t - P.hop/1000)/.6*Math.PI)*10 : 0;
  const x = cx0 + (cx1 - cx0)*e, y = cy0 + (cy1 - cy0)*e - Math.abs(Math.sin(t*(k < 1 ? 14 : 2)))*(k < 1 ? 3 : 1) - hop, sc = Math.min(1.2, Math.max(.7, q.h/60)), dir = cx1 >= cx0 ? 1 : -1;
  petSprite(P.kind, x, y, sc, dir, k);
  if(P.busy==='pounce' && Math.floor(t*4)%2) T('!', x, y - 16*sc, { s:14, f:FD, w:700, a:'center', c:C.hostile });
  region(x - 14, y - 16, 28, 24, () => petPat());
  tip(x - 14, y - 16, 28, 24, `${P.name} the ${PET_KINDS[P.kind] || 'pet'}`, `${(PET_JOBS[P.kind]||{}).job || ''} Crew who share a room with ${P.name} grow fonder of you. Tap to give ${P.name} a fuss (once a jump).`); }

/* ---------------- sector situations ---------------- */
const SITUATIONS = {
  crackdown:{ name:'Rebuff crackdown', desc:'More patrols. The shopkeepers are nervous: stores are 15% cheaper.', mix:{ combat:+12, event:-12 }, price:.85, col:'#ff5a7a' },
  salvage:  { name:'Salvage boom', desc:'Wrecks everywhere: fights pay 25% more scrap. The Fleet is in a hurry too.', scrap:1.25, fleet:1.1, col:'#ffd166' },
  storms:   { name:'Storm season', desc:'Twice the hazards. The Fleet hates them too: it moves 10% slower.', hazard:2, fleet:.9, col:'#ffb547' },
  festival: { name:'Festival season', desc:'Fewer fights, more people to meet, and the Harvest Fair is on.', mix:{ combat:-12, event:+12 }, fair:true, col:'#7be0a0' },
  refugees: { name:'Refugee convoys', desc:'Distress calls everywhere: risky, often rewarding.', distress:2.4, col:'#5fd3e6' },
  blackout: { name:'Comms blackout', desc:'No charts: stores only show once you are next to them. The Fleet is half blind too.', fleet:.85, hideStores:true, col:'#b48cff' }
};
function situ(){ return G && G.situ && SITUATIONS[G.situ] || null; }
function situFor(type){ return G && G.nextSitu && G.nextSitu[type] ? SITUATIONS[G.nextSitu[type]] : null; }
/* picked when the exit beacon offers its routes (seeded, so a replayed seed gets the same ones) */
function pickSituations(opts){ G.nextSitu = {};
  for(const t of opts){ const sd = DATA.sectors[t]; if(!sd || sd.final || sd.secret) continue; if(Math.random() < .55) G.nextSitu[t] = pick(Object.keys(SITUATIONS)); } }
function situMix(mix){ const S = situ(); if(!S || !S.mix) return mix; const m = Object.assign({}, mix); for(const k in S.mix) m[k] = Math.max(4, (m[k]||0) + S.mix[k]); return m; }
function situHazard(){ const S = situ(); return S && S.hazard || 1; }
function situDistress(){ const S = situ(); return S && S.distress || 1; }
function situFleet(){ const S = situ(); return S && S.fleet || 1; }
function situPrice(){ const S = situ(); return S && S.price || 1; }
function situScrap(){ const S = situ(); return S && S.scrap || 1; }
function storeHidden(n, reach){ const S = situ(); return !!(S && S.hideStores && n.type==='store' && !n.visited && !reach && !n.revealed); }
/* entering a sector: set (or clear) its situation */
function situEnter(type){ G.situ = (G.nextSitu && G.nextSitu[type]) || null; G.nextSitu = null;
  const S = situ(); if(!S) return; logEntry(`Sector situation: ${S.name}.`); G.situCount = (G.situCount||0) + 1; if(G.situCount >= 5) grant('exp_situ');
  if(S.fair && BASE.events.m_fair && !G.seen.m_fair) G.later.push({ event:'m_fair', jumps:ri(1, 3) }); }
function situLine(){ const S = situ(); return S ? ` ${S.name}: ${S.desc}` : ''; }

/* ---------------- effects (from applyEffect) ---------------- */
function expansionEffect(e, L){
  if(!e || !G) return;
  if(e.questNext){ for(const q of [].concat(e.questNext)) G.questQueue.push(q); L.push('A new lead: it points to the next sector'); }
  if(e.ghostCrew){ const s = G.ship; if(s.crew.filter(c => c.owner==='p' && !c.drone).length < R.maxCrew){ const c = addCrew(s, 'human', 'p', 'Rourke'); c.quirk = 'grump'; c.quirkSet = true; for(const k of ['pilot','weapons','repair']) c.sk[k] = SKILLT[k][1]; c.maxHp += 10; c.hp = c.maxHp; G.flags.rourke = true; L.push('Captain Rourke joins your crew (expert pilot, gunner and engineer)'); if(typeof sagaJoined==='function') sagaJoined(c); }
    else { G.flags.rourkeLog = true; L.push('Your bunks are full: Rourke gives you her logbook and the fleet\'s codes instead'); } }
  if(e.ghostWake){ G.flags.ghostWake = true; grant('exp_ghost'); if(typeof sagaNote==='function') sagaNote('ghost', `In sector ${G.sector}, the crew woke the lost frigates of the FNS Lantern's fleet. They promised to come when the Flaggship was found.`); }
}
/* the Flaggship fight: the ghost fleet keeps its promise */
function expansionBoss(e, o){
  if(!G.flags.ghostWake) return; const n = (o.phase||0) < 2 ? 6 : 4; e.hull = Math.max(4, e.hull - n);
  o.text = (o.text ? o.text + ' ' : '') + `Six old Fedoration frigates drop out of the dark around the Flaggship, ${G.flags.rourke ? 'Rourke\'s voice on every channel, ' : ''}and open fire: -${n} hull before the fight even starts.`;
}

/* ---------------- events ---------------- */
Object.assign(BASE.events, {
  /* --- the Ghost Fleet (three parts across three sectors) --- */
  gf_signal:{ minSector:2, maxSector:5, once:true, weight:1.4, art:'wreck', text:'A distress code nobody has used in forty years: the FNS Lantern, a Fedoration frigate lost with her whole battle group. Her hull is here, cold and empty. Her computer is still asking for help.', choices:[
    { text:'Board her and pull the logs.', effect:{ text:'The last entry is from Captain Ada Rourke: "Fleet hidden. Crews in cold sleep. Waiting for orders that never came. I\'ve taken a lifeboat to find help." The lifeboat\'s beacon still pings, faintly, from the next sector.', questNext:'gf_lifeboat', scrap:15 } },
    { text:'Strip her for parts.', effect:{ text:'You take what you can carry. It feels a bit like robbing a grave.', scrap:45, parts:2 } },
    { text:'{who} decodes the old Fedoration cipher.', req:{ quirk:'bookworm' }, effect:{ text:'{who} reads the whole log in an hour, including the bits in code. Rourke\'s lifeboat is in the next sector, and her fleet is real.', questNext:'gf_lifeboat', scrap:20, xp:{ skill:'pilot', amt:20 } } } ] },
  gf_lifeboat:{ questOnly:true, title:'The Lantern\'s lifeboat', art:'distress', text:'A tiny lifeboat, frost on every window. Inside, in a cold-sleep pod, a grey-haired woman in a forty-year-old uniform. The pod\'s battery has three days left in it.', choices:[
    { text:'Wake her up.', effect:{ text:'Captain Ada Rourke wakes up, looks at your crew, looks at your ship, and says: "Is this really the best the Fedoration has left?" Then: "Right. My fleet is in the next sector. Let\'s go and get them."', ghostCrew:true, questNext:'gf_fleet' } },
    { text:'Take her logbook and leave her sleeping. She\'ll be found.', effect:{ text:'The logbook has the fleet\'s hiding place and its wake-up codes. You swap the pod\'s battery for a fresh one before you go.', questNext:'gf_fleet', setFlag:'rourkeLog' } } ] },
  gf_fleet:{ questOnly:true, title:'The hidden fleet', art:'fleet', text:'Six frigates, dark and silent, hidden in the shadow of a dead moon. Forty years of dust on the hulls. Their crews are still asleep inside. They have been waiting all this time for somebody to give them an order.', choices:[
    { text:'Send the wake-up codes: the Flaggship is coming.', req:{ flag:'rourke', hide:true }, effect:{ text:'Rourke takes the comms. "Lantern group, this is your captain. Sorry I\'m late." One by one, sixty-year-old engines light up. They will meet you at the last battle.', ghostWake:true, crewHeal:30 } },
    { text:'Use the codes from Rourke\'s logbook.', req:{ flag:'rourkeLog', hide:true }, effect:{ text:'The frigates wake slowly, and answer to your codes. They will find you when you find the Flaggship.', ghostWake:true } },
    { text:'Strip them for parts. Nobody is coming for them.', effect:{ text:'Good guns, old but solid, and enough scrap to fill the hold. The sleeping crews never notice.', scrap:90, weapon:'random', missiles:3 } },
    { text:'Leave them to sleep.', effect:{ text:'Some things are better left as they are. Your crew are quiet for the rest of the day.', crewHeal:20 } } ] },
  /* --- Lucky Vell's crate (two parts) --- */
  sm_offer:{ minSector:1, maxSector:5, once:true, weight:1.3, art:'ship', text:'A nervous smuggler in a very large hat hails you. "Lucky Vell, at your service. I need a crate carried to a buyer in the next sector, and every patrol here knows my ship. Forty scrap now, more on delivery. No questions. Please, no questions."', choices:[
    { text:'Take the crate.', effect:{ text:'The crate is heavy, warm, and hums very slightly. Vell pays up and is gone before you can ask anything.', scrap:40, questNext:'sm_buyer', setFlag:'vellCrate' } },
    { text:'No thanks.', effect:{ text:'"Your loss." Vell is already hailing the next ship.' } },
    { text:'{who} recognises that hum.', req:{ quirk:'expyrate' }, effect:{ text:'"That\'s a Voltan reactor core in there," {who} whispers. "Stolen. Worth a fortune." You take it anyway, with your eyes open.', scrap:40, questNext:'sm_buyer', setFlag:['vellCrate','vellKnow'] } } ] },
  sm_buyer:{ questOnly:true, title:'The buyer', art:'ship', text:'The buyer\'s ship is all smoked glass and polite guns. "You have my crate, I believe." The crate in your hold is humming louder than ever.', choices:[
    { text:'Hand it over and get paid.', effect:{ text:'"A pleasure." The buyer pays more than Vell promised, and asks if you\'d like regular work. You would not.', scrap:110 } },
    { text:'Open it first.', chance:.55, success:{ text:'A Voltan reactor core, still warm. You wire it into your own reactor before the buyer can object, then pay them off with a fraction of what it is worth.', reactor:1, scrap:-20 }, fail:{ text:'The buyer sees the open crate on their screen and stops being polite.', fight:'pyrate_gunship' } },
    { text:'Sell it to the Rebuff instead.', effect:{ text:'A Rebuff customs cutter pays well for evidence, and leads the buyer off on a chase. The Fleet behind you is busy with the paperwork.', scrap:70, fleetPush:-.08 } },
    { text:'Keep it, and tune your reactor with it.', req:{ flag:'vellKnow', hide:true }, effect:{ text:'You knew what it was. You wire it in and jump before the buyer finishes their sentence.', reactor:1, fleetPush:.05 } } ] },
  /* --- one-off events --- */
  x_whale:{ minSector:1, weight:.9, art:'creature', text:'Something huge drifts past the window: a space whale, a mile long, singing at a frequency that makes the coffee ripple.', choices:[
    { text:'Follow it for a while.', effect:{ text:'It leads you through a gas cloud full of fuel-rich ice, then sings once more and dives into the dark.', fuel:3, reveal:true } },
    { text:'Harpoon it for its oil.', chance:.5, success:{ text:'You get a hold full of whale oil. The crew don\'t talk to you much afterwards.', scrap:60, crewHurt:5 }, fail:{ text:'It notices. It is very, very big. You lose some plating getting away.', hull:-5 } },
    { text:'{who} sings back.', req:{ quirk:'poet' }, effect:{ text:'{who} sings, badly, to a mile-long whale. It sings back. Nobody on the ship will ever forget it.', crewHeal:100, xp:{ skill:'pilot', amt:15 } } } ] },
  x_auction:{ minSector:2, weight:.8, art:'station', text:'A drifting auction drone is selling off a dead captain\'s estate. One lot is left: "mystery augment, no refunds, no questions, no warranty."', choices:[
    { text:'Pay the asking price (50 scrap).', req:{ scrap:50 }, cost:{ scrap:50 }, effect:{ text:'SOLD. It is real, and it works.', augment:'random' } },
    { text:'Make a cheeky low bid (20 scrap).', req:{ scrap:20 }, cost:{ scrap:20 }, chance:.4, success:{ text:'The drone accepts, possibly out of boredom.', augment:'random' }, fail:{ text:'The drone keeps your bid as an "insult fee" and flies off.' } },
    { text:'Leave it.', effect:{ text:'Going once, going twice, gone without you.' } } ] },
  x_quarantine:{ minSector:2, weight:.8, art:'distress', text:'A medical frigate under quarantine flags: "Fever aboard. Doctors exhausted. Anyone with a medbay, please." They promise it isn\'t catching. They promise quite a lot.', choices:[
    { text:'Lend your medbay and crew.', req:{ system:'medbay', level:2 }, effect:{ text:'Your medbay works through the night. By morning the fever has broken. One of their nurses asks to come with you.', crew:'random', scrap:30 } },
    { text:'Help as best you can.', chance:.6, success:{ text:'It isn\'t catching, as promised. They pay you in medical supplies and scrap.', scrap:40, crewHeal:30 }, fail:{ text:'It was a little bit catching. Your crew spend three days sneezing.', crewHurt:30 } },
    { text:'Keep your distance.', effect:{ text:'You send good wishes. From very far away.' } } ] },
  x_race:{ minSector:1, weight:.8, art:'asteroid', text:'Three pyrate skiffs are racing round an asteroid field for a pot of scrap. "Fancy a lap, Fedoration? Loser buys the drinks." The asteroids look sharp.', choices:[
    { text:'Race them.', req:{ system:'engines', level:4 }, effect:{ text:'You don\'t just win. You lap them. They pay up, sulking.', scrap:70 } },
    { text:'Race them anyway.', chance:.45, success:{ text:'A photo finish, and the photo says you. They pay up.', scrap:55 }, fail:{ text:'You clip three asteroids and finish last. You buy the drinks.', hull:-4, scrap:-15 } },
    { text:'Decline politely.', effect:{ text:'"Coward!" they shout, cheerfully, and race on.' } } ] },
  x_mines:{ minSector:2, weight:.7, art:'asteroid', text:'An old minefield from some forgotten war blocks the direct route. Most of the mines are probably dead. Probably.', choices:[
    { text:'Go the long way round.', effect:{ text:'It costs you fuel, but nothing goes bang.', fuel:-1 } },
    { text:'Push straight through.', chance:.65, success:{ text:'Nothing goes bang. Everyone breathes out.', fleetPush:-.05 }, fail:{ text:'Something goes bang.', hull:-5, fire:true } },
    { text:'Your defence drone clears a path.', req:{ drone:'defense' }, effect:{ text:'Pop, pop, pop. The drone has the time of its life, and some of the mines were full of salvage.', scrap:35 } } ] },
  x_vending:{ minSector:1, weight:.6, art:'space', text:'A vending machine is floating in empty space, lights still on, humming to itself. Nobody knows how it got here. It has missiles in slot B4.', choices:[
    { text:'Pay for slot B4 (10 scrap).', req:{ scrap:10 }, cost:{ scrap:10 }, effect:{ text:'Clunk. Two missiles drop out, and a free biscuit.', missiles:2 } },
    { text:'Kick it.', chance:.5, success:{ text:'Everything falls out. Everything.', missiles:3, parts:1, goods:'loot' }, fail:{ text:'It kicks back. Somehow.', hull:-1 } },
    { text:'{who} hacks it.', req:{ quirk:'tinkerer' }, effect:{ text:'{who} has it giving away stock and singing the Fedoration anthem in under a minute.', missiles:3, parts:3 } } ] },
  x_library:{ minSector:2, weight:.6, art:'station', text:'A library ship, all lit windows and quiet. The librarian waves you in. "Borrow anything. Bring it back within six months or there will be a fine."', choices:[
    { text:'Borrow the gunnery manuals.', effect:{ text:'Your gunners stay up late reading. It shows.', xp:{ skill:'weapons', amt:20 } } },
    { text:'Borrow the engineering manuals.', effect:{ text:'Your crew learn eleven new ways to fix things and two to break them.', xp:{ skill:'repair', amt:20 } } },
    { text:'{who} reads everything.', req:{ quirk:'bookworm' }, effect:{ text:'{who} reads for nine hours straight and comes back a better pilot, gunner and person. Mostly pilot.', xp:{ skill:'pilot', amt:40 } } } ] },
  x_rival:{ minSector:2, weight:.6, art:'ship', text:'Another Fedoration courier, the Swiftly Gone, drops out of a jump beside you. Her captain grins. "Running from the Fleet too? Want to swap notes?"', choices:[
    { text:'Swap maps.', effect:{ text:'Their charts fill in your map. Yours fill in theirs. Good luck to them.', reveal:true } },
    { text:'Trade fuel for missiles.', req:{ fuel:3 }, effect:{ text:'A fair swap, and a cup of terrible coffee.', fuel:-2, missiles:4 } },
    { text:'Challenge them to a card game.', req:{ quirk:'gambler' }, chance:.6, success:{ text:'{who} wins their scrap, their spare parts, and their captain\'s hat.', scrap:50, parts:2 }, fail:{ text:'{who} loses, badly, and won\'t talk about it.', scrap:-20 } } ] }
});
ACHIEVEMENTS.push(
  { id:'exp_refit',  name:'Fine Tuning',          desc:'Refit a gun all the way to Mk III.' },
  { id:'exp_ghost',  name:'Lantern Group',        desc:'Wake the lost fleet of the FNS Lantern.' },
  { id:'exp_ghostwin', name:'Sorry I\'m Late',    desc:'Win with the ghost fleet at your side.' },
  { id:'exp_situ',   name:'Weathered It',         desc:'Cross five sectors that had a situation in one run.' }
);
