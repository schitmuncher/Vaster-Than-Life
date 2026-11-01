'use strict';
/* =========================================================================
   Personal weapons and armour: kit your crew carry into a fight.
   Every crew member has two slots: a weapon (blunt, blade, gun or something
   weird) and a suit (armour, or a one-shot medpack). Kit wears out with use
   (guns run out of charge, blades blunt, armour dents) and breaks at zero;
   broken kit can be repaired in the Armoury (a drone part) or at a store.
   Enemy crews carry kit too, and drop it when your crew beat them.
     G.arms        spare kit in the ship's locker: [{ id, dur }]
     c.arm, c.suit what a crew member carries:    { id, dur }
   Fields on an item (mods can add their own in an "arms" list):
     kind  blunt | blade | gun | weird | suit       dmg   melee damage multiplier
     dur   durability (seconds of use)              cost  store price
     tier  1-3                                      stun  chance per second to stun the foe
     bleed damage per second for 4s after a cut     knock chance per second to throw a foe out of the room
     reach share of damage it also deals to foes in neighbouring rooms (guns)
     fear  chance per second the foe flees          laugh chance per second every foe in the room is stunned
     leech share of damage dealt that heals the wielder
     heal  health per second for friends in the same room
     repair, fire  multipliers on repairing and firefighting
     armor share of melee damage stopped (suits)    vac  no harm from airless rooms (suits)
     medpack  heals this much once when badly hurt, then it is used up
   ========================================================================= */
BASE.arms = {
  wrench:   { name:'Heavy Wrench',        kind:'blunt', dmg:1.25, dur:70, cost:20, tier:1, stun:.12, repair:1.15, desc:'A tool first, a weapon second. Fixes things faster, and occasionally knocks someone out.' },
  baton:    { name:'Stun Baton',          kind:'blunt', dmg:1.15, dur:60, cost:35, tier:1, stun:.35, desc:'Security issue. Every few blows, the target stops moving for a moment.' },
  hammer:   { name:'Gravity Hammer',      kind:'blunt', dmg:1.6,  dur:50, cost:70, tier:2, knock:.22, desc:'Each swing weighs about a tonne. Sometimes it throws the target clean out of the room.' },
  knife:    { name:'Combat Knife',        kind:'blade', dmg:1.3,  dur:80, cost:25, tier:1, bleed:3, desc:'Quick and quiet. Every cut keeps bleeding for a few seconds.' },
  cutlass:  { name:'Pyrate Cutlass',      kind:'blade', dmg:1.5,  dur:60, cost:45, tier:2, bleed:4, desc:'Curved, notched and very well used. Cuts that bleed.' },
  axe:      { name:'Fire Axe',            kind:'blade', dmg:1.4,  dur:70, cost:35, tier:1, fire:1.8, desc:'From the emergency locker. Chops boarders, and puts out fires almost twice as fast.' },
  torch:    { name:'Plasma Torch',        kind:'blade', dmg:1.2,  dur:60, cost:40, tier:1, repair:1.4, bleed:2, desc:'A cutting torch. Burns boarders, and repairs systems 40% faster.' },
  mono:     { name:'Monofilament Sword',  kind:'blade', dmg:2.0,  dur:45, cost:90, tier:3, bleed:6, desc:'A blade one molecule thick. Terrifying, fragile and expensive.' },
  pistol:   { name:'Laser Pistol',        kind:'gun',   dmg:1.4,  dur:40, cost:40, tier:1, reach:.35, desc:'A sidearm. Also shoots at boarders in the rooms next door.' },
  shotgun:  { name:'Boarding Shotgun',    kind:'gun',   dmg:1.9,  dur:30, cost:60, tier:2, reach:.2, stun:.1, desc:'Loud, short-ranged and devastating in a corridor.' },
  rifle:    { name:'Pulse Rifle',         kind:'gun',   dmg:1.7,  dur:35, cost:80, tier:3, reach:.6, desc:'A marine\'s rifle. Hits hard, and keeps whole neighbouring rooms under fire.' },
  freeze:   { name:'Freeze Ray',          kind:'weird', dmg:.8,   dur:35, cost:55, tier:2, stun:.6, desc:'Doesn\'t hurt much. Mostly, it just stops people moving.' },
  spore:    { name:'Spore Pistol',        kind:'weird', dmg:1.0,  dur:40, cost:45, tier:2, bleed:5, reach:.25, desc:'Sloog-made. Fires a cloud that keeps eating at whoever it lands on.' },
  whip:     { name:'Tentacle Whip',       kind:'weird', dmg:1.3,  dur:50, cost:50, tier:2, fear:.18, desc:'It is alive. It is not friendly. Foes tend to run away from it.' },
  leech:    { name:'Life-Leech Glove',    kind:'weird', dmg:1.1,  dur:50, cost:60, tier:2, leech:.35, desc:'Every blow heals the wearer a little. Nobody asks how.' },
  mender:   { name:'Mender\'s Staff',     kind:'weird', dmg:.7,   dur:60, cost:50, tier:2, heal:4, desc:'A Sloog healing staff. Everyone on your side in the room heals while it\'s in use.' },
  chicken:  { name:'Rubber Chicken',      kind:'weird', dmg:.6,   dur:99, cost:15, tier:1, laugh:.2, desc:'It squeaks. Every so often the whole room stops fighting to laugh.' },
  vest:     { name:'Flak Vest',           kind:'suit',  armor:.2,  dur:80, cost:30, tier:1, desc:'Stops a fifth of all melee damage.' },
  plate:    { name:'Boarding Plate',      kind:'suit',  armor:.35, dur:100, cost:60, tier:2, desc:'Heavy armour for boarding actions. Stops over a third of melee damage.' },
  voidsuit: { name:'Void Suit',           kind:'suit',  armor:.1,  dur:70, cost:45, tier:1, vac:true, desc:'A light armoured spacesuit. The wearer can breathe in airless rooms.' },
  belt:     { name:'Personal Shield',     kind:'suit',  armor:.5,  dur:45, cost:85, tier:3, desc:'A shield belt. Stops half of all melee damage, until its charge runs out.' },
  medpack:  { name:'Auto-Medpack',        kind:'suit',  medpack:60, dur:1, cost:25, tier:1, desc:'Injects the wearer with 60 health the first time they are badly hurt. Then it\'s used up.' }
};
const ARM_KIND = { blunt:['Blunt','#d8b06a'], blade:['Blade','#e9eefc'], gun:['Gun','#ff7a5a'], weird:['Weird','#c9a0ff'], suit:['Armour','#5fd3e6'] };
function armDef(it){ return it && DATA.arms && DATA.arms[it.id] || null; }
function armLive(it){ return !!(it && it.dur > 0 && armDef(it)); }
function armNew(id, frac){ const d = DATA.arms && DATA.arms[id]; return d ? { id, dur:Math.max(1, Math.round(d.dur * (frac==null ? 1 : frac))) } : null; }
function armName(it){ const d = armDef(it); return d ? d.name + (it.dur <= 0 ? ' (broken)' : '') : ''; }
function armFrac(it){ const d = armDef(it); return d ? clamp(it.dur / d.dur, 0, 1) : 0; }
function armLocker(){ return G ? (G.arms = G.arms || []) : []; }
function armAllowed(c){ return c && !c.drone; }
/* in a fight */
function armMult(c){ const d = armLive(c.arm) ? armDef(c.arm) : null; return d ? d.dmg || 1 : 1; }
function armTake(c){ const d = armLive(c.suit) ? armDef(c.suit) : null; return d && d.armor ? 1 - d.armor : 1; }
function armRepair(c){ const d = armLive(c.arm) ? armDef(c.arm) : null; return d && d.repair ? d.repair : 1; }
function armFire(c){ const d = armLive(c.arm) ? armDef(c.arm) : null; return d && d.fire ? d.fire : 1; }
function armVac(c){ const d = armLive(c.suit) ? armDef(c.suit) : null; return !!(d && d.vac); }
function wear(it, c, n){ if(!it || it.dur <= 0) return; it.dur -= n; if(it.dur <= 0){ it.dur = 0; if(c.owner==='p' && G && G.ship.crew.includes(c)) toast(`${c.name}'s ${armDef(it).name} has broken. Repair it in Ship → Armoury.`); } }
/* one attacker, one target, one tick of melee (called from the fight loop) */
function armHit(a, tgt, dt, dealt, sh, room){
  const d = armLive(a.arm) ? armDef(a.arm) : null;
  if(d){ wear(a.arm, a, dt);
    if(d.stun && Math.random() < d.stun*dt){ tgt.stunT = Math.max(tgt.stunT||0, 1.6); armFx(sh, room, 'STUNNED'); }
    if(d.bleed){ tgt.bleed = Math.max(tgt.bleed||0, d.bleed); tgt.bleedT = 4; }
    if(d.leech) a.hp = Math.min(a.maxHp, a.hp + dealt*d.leech);
    if(d.knock && Math.random() < d.knock*dt){ armShove(sh, tgt, room); armFx(sh, room, 'KNOCKED BACK'); }
    if(d.fear && Math.random() < d.fear*dt){ armShove(sh, tgt, room); armFx(sh, room, 'PANICS'); }
    if(d.laugh && Math.random() < d.laugh*dt){ for(const o of sh.crew) if(o.room===room && crewSide(o)!==crewSide(a)) o.stunT = Math.max(o.stunT||0, 1.2); armFx(sh, room, 'SQUEAK!'); } }
  if(armLive(tgt.suit) && armDef(tgt.suit).armor) wear(tgt.suit, tgt, dt*.8);
}
function armShove(sh, c, room){ const near = sh.rooms.map((r, i) => i).filter(i => i!==room && roomDist(sh, room, i) <= 1.4); if(!near.length) return; try{ orderMove(sh, c, pick(near)); }catch(e){} c.stunT = Math.max(c.stunT||0, .6); }
function armFx(sh, room, t){ if(!sh._rects || !G || Math.random() > .6) return; const q = roomCenter(sh, room); fx('text', q.x, q.y - 40, t); }
/* every tick, for each ship: bleeding, medpacks, healing staffs, guns firing next door */
function armsTick(sh, dt){
  if(!sh || !sh.crew.length) return;
  for(const c of sh.crew){ if(c.drone) continue;
    if(c.bleedT > 0){ c.bleedT -= dt; c.hp -= (c.bleed||0)*dt; if(c.bleedT <= 0) c.bleed = 0; }
    if(c.suit && c.suit.dur > 0){ const d = armDef(c.suit); if(d && d.medpack && c.hp > 0 && c.hp < c.maxHp*.3){ c.hp = Math.min(c.maxHp, c.hp + d.medpack); c.suit.dur = 0; if(c.owner==='p') toast(`${c.name}'s auto-medpack fires. +${d.medpack} health.`); } } }
  if(!G || !G.enemy) return;
  const hostile = sh.rooms.map((r, i) => sh.crew.some(o => o.room===i && o.hp > 0 && !o.drone && crewSide(o)!==sh.side) && sh.crew.some(o => o.room===i && crewSide(o)===sh.side));
  for(const c of sh.crew){ if(c.drone || c.stunT > 0 || c.path.length) continue; const d = armLive(c.arm) ? armDef(c.arm) : null; if(!d) continue;
    if(d.heal && hostile[c.room]){ for(const o of sh.crew) if(o.room===c.room && crewSide(o)===crewSide(c) && !o.drone) o.hp = Math.min(o.maxHp, o.hp + d.heal*dt); }
    if(d.reach){ const near = sh.rooms.map((r, i) => i).filter(i => i!==c.room && roomDist(sh, c.room, i) <= 1.4);
      let tgt = null; for(const i of near) for(const o of sh.crew) if(o.room===i && o.hp > 0 && !o.path.length && crewSide(o)!==crewSide(c) && (!tgt || o.hp < tgt.hp)) tgt = o;
      if(tgt){ const dmg = crewDps(c)*d.dmg*d.reach*armTake(tgt)*dt; tgt.hp -= dmg; tgt.lastByCrew = c.id; wear(c.arm, c, dt*.6);
        if(tgt.hp <= 0 && !tgt._counted){ tgt._counted = true; c.kills++; gainXP(c, 'combat', 1); }
        if(sh._rects && Math.random() < dt*3){ const a = cellXY(sh, c.x, c.y), b = cellXY(sh, tgt.x, tgt.y); G.armShots = G.armShots || []; G.armShots.push({ ax:a.x, ay:a.y, bx:b.x, by:b.y, t:.12, col:d.kind==='weird' ? '#c9a0ff' : '#ff7a5a' }); } } } }
}
/* enemy crews carry kit, more of it (and better) the further you go */
function armEnemyKit(e){
  if(!e || !e.crew) return; const n = G.sector||1, ids = Object.keys(DATA.arms||{}), maxT = n >= 6 ? 3 : n >= 3 ? 2 : 1;
  const ws = ids.filter(k => DATA.arms[k].kind!=='suit' && (DATA.arms[k].tier||1) <= maxT && !DATA.arms[k].noLoot), ss = ids.filter(k => DATA.arms[k].kind==='suit' && !DATA.arms[k].medpack && (DATA.arms[k].tier||1) <= maxT && !DATA.arms[k].noLoot);
  const pw = Math.min(.65, .12 + .07*n) * (e.elite ? 1.4 : 1), ps = pw*.5;
  for(const c of e.crew){ if(c.drone || c.owner!=='e') continue; if(!c.arm && ws.length && Math.random() < pw) c.arm = armNew(pick(ws), .5 + Math.random()*.5); if(!c.suit && ss.length && Math.random() < ps) c.suit = armNew(pick(ss), .5 + Math.random()*.5); }
}
/* when your crew beat an armed foe, their kit is yours */
function armDrop(c){
  if(!G || !c || c.owner!=='e' || !c.lastByCrew) return; const got = [];
  for(const k of ['arm', 'suit']){ const it = c[k]; if(it && it.dur > 0 && armDef(it) && Math.random() < .55){ armLocker().push({ id:it.id, dur:Math.max(1, Math.round(it.dur)) }); got.push(armDef(it).name); } c[k] = null; }
  if(got.length) toast(`Taken from a beaten boarder: ${listText(got)}. It's in Ship → Armoury.`);
}
/* events: "arm": an id, or "random" */
function armsEffect(e, L){
  if(!e || !e.arm) return; const ids = Object.keys(DATA.arms||{}).filter(k => !DATA.arms[k].noLoot);
  for(const a of [].concat(e.arm)){ const id = a==='random' ? pick(ids.filter(k => (DATA.arms[k].tier||1) <= (G.sector >= 5 ? 3 : 2))) : a; const it = armNew(id); if(it){ armLocker().push(it); L.push(`+1 ${armDef(it).name} (Ship → Armoury)`); } }
}
/* fixing kit: a drone part each, out in the field */
function armRepairItem(it){ const d = armDef(it); if(!d || it.dur >= d.dur) return false; if(G.parts < 1){ toast('You need a drone part to repair kit.'); return false; } G.parts--; it.dur = d.dur; sfx('buy'); return true; }
function armRepairPrice(it){ const d = armDef(it); return d ? Math.max(2, Math.round((1 - armFrac(it)) * (d.cost||30) * .35)) : 0; }
function allKit(){ const out = []; for(const it of armLocker()) out.push({ it, where:'locker' }); for(const c of (G.ship.crew||[])) if(c.owner==='p' && !c.drone){ if(c.arm) out.push({ it:c.arm, where:c.name }); if(c.suit) out.push({ it:c.suit, where:c.name }); } return out; }

/* ---------------- drawing: kit in hand ---------------- */
function drawArmIcon(px, py, rad, c, face){
  if(c.drone) return; const d = c.arm && armDef(c.arm), s = c.suit && armDef(c.suit);
  if(s && c.suit.dur > 0 && !s.medpack){ ctx.beginPath(); ctx.arc(px, py, rad*1.05, Math.PI*1.1, Math.PI*1.9); ctx.strokeStyle = hexA(ARM_KIND.suit[1], .8); ctx.lineWidth = 2; ctx.stroke(); }
  if(!d) return; const broken = c.arm.dur <= 0, col = broken ? '#5b6378' : (ARM_KIND[d.kind] || ARM_KIND.weird)[1];
  const hx = px + face*rad*.95, hy = py + rad*.15, L = rad*1.1;
  ctx.save(); ctx.translate(hx, hy); ctx.scale(face, 1); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
  if(d.kind==='blunt'){ ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L*.4, -L*.8); ctx.stroke(); ctx.fillRect(L*.25, -L*1.05, L*.4, L*.32); }
  else if(d.kind==='blade'){ ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L*.55, -L*1.0); ctx.stroke(); }
  else if(d.kind==='gun'){ ctx.fillRect(0, -L*.35, L*.8, L*.22); ctx.fillRect(0, -L*.2, L*.2, L*.35); }
  else { ctx.beginPath(); ctx.arc(L*.35, -L*.55, L*.22, 0, 7); ctx.fill(); if(!broken) glow(L*.35, -L*.55, L*.6, col, .5); }
  ctx.restore();
}
function drawArmShots(){ const S = G && G.armShots; if(!S || !S.length) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(const s of S){ ctx.strokeStyle = hexA(s.col, Math.min(1, s.t*8)); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.ax, s.ay); ctx.lineTo(s.bx, s.by); ctx.stroke(); s.t -= 1/60; }
  ctx.restore(); G.armShots = S.filter(s => s.t > 0); }

/* ---------------- the Armoury tab (Ship screen) ---------------- */
function drawArmouryTab(f, cx, y0){
  { const v = UI.armView || 'kit'; btn(cx+880, y0-8, 240, 34, 'Weapons & armour', () => { UI.armView = 'kit'; }, { s:13, fill:v==='kit' }); btn(cx+1128, y0-8, 220, 34, 'Tonics & treats', () => { UI.armView = 'tonics'; }, { s:13, fill:v==='tonics', col:C.good });
    if(v==='tonics' && typeof drawTonicsView==='function') return drawTonicsView(f, cx, y0); }
  const s = G.ship, crew = s.crew.filter(c => c.owner==='p' && !c.drone), L = armLocker(), sel = UI.armSel;
  label('Crew kit', cx, y0+10, C.muted, 'left', 14);
  T('Pick a slot, then something from the locker to put in it.', cx+130, y0+10, { s:13, c:C.muted });
  const slot = (c, k, x, y, w) => { const it = c[k], d = armDef(it), on = sel && sel.c===c.id && sel.k===k;
    rr(x, y, w, 52, 8); ctx.fillStyle = on ? hexA(C.amber,.16) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : C.line; ctx.lineWidth = on ? 2.5 : 1.2; ctx.stroke();
    region(x, y, w, 52, () => { UI.armSel = on ? null : { c:c.id, k }; });
    if(d){ T(d.name, x+12, y+22, { s:15, f:FD, w:700, c: it.dur > 0 ? C.ink : C.hostile, max:w-24 }); bar(x+12, y+34, w-24, 7, armFrac(it), it.dur <= 0 ? C.hostile : armFrac(it) > .4 ? C.good : C.warn);
      tip(x, y, w, 52, d.name, `${(ARM_KIND[d.kind]||[''])[0]}. ${d.desc} ${armStatLine(d)} Condition: ${Math.round(armFrac(it)*100)}%.`); }
    else T(k==='arm' ? 'No weapon' : 'No armour', x+12, y+32, { s:14, c:C.muted }); };
  crew.slice(0, 8).forEach((c, i) => { const y = y0+30 + i*62;
    drawPortrait(cx+24, y+26, 20, c, false); T(c.name, cx+54, y+22, { s:16, f:FD, w:700, max:150 }); T(`${(raceOf(c).name||'')} · combat ${['untrained','skilled','expert'][skillLvl(c,'combat')]}`, cx+54, y+42, { s:12, c:C.muted, max:150 });
    slot(c, 'arm', cx+214, y, 270); slot(c, 'suit', cx+494, y, 230); });
  // the locker
  const lx = cx+760, lw = 616; panel(lx, y0+24, lw, 560, 10);
  label(`Locker (${L.length})`, lx+20, y0+56, C.amber, 'left', 15); T(`Drone parts: ${G.parts}`, lx+lw-20, y0+56, { s:14, a:'right', c:C.muted });
  if(!L.length) para('Empty. Buy kit at a store (Armoury tab), take it from beaten boarders, or find it on the way.', lx+20, y0+92, lw-40, { s:15, lh:21, c:C.muted });
  L.slice(0, 7).forEach((it, i) => { const d = armDef(it); if(!d) return; const y = y0+76 + i*70, kind = ARM_KIND[d.kind] || ARM_KIND.weird;
    rr(lx+14, y, lw-28, 62, 8); ctx.fillStyle = C.panel2; ctx.fill();
    T(d.name, lx+30, y+24, { s:16, f:FD, w:700, c: it.dur > 0 ? C.ink : C.hostile, max:220 }); T(kind[0].toUpperCase(), lx+30, y+46, { s:11, f:FD, w:700, c:kind[1] });
    bar(lx+90, y+40, 140, 7, armFrac(it), it.dur <= 0 ? C.hostile : C.good); tip(lx+14, y, 240, 62, d.name, `${d.desc} ${armStatLine(d)}`);
    const want = sel && ((sel.k==='suit') === (d.kind==='suit'));
    btn(lx+262, y+12, 110, 38, 'Equip', () => { const c = s.crew.find(x => x.id===sel.c); if(!c) return; const old = c[sel.k]; c[sel.k] = it; L.splice(L.indexOf(it), 1); if(old) L.push(old); sfx('click'); }, { s:14, disabled:!want, fill:!!want });
    btn(lx+380, y+12, 110, 38, 'Repair · 1 part', () => armRepairItem(it), { s:12, disabled:it.dur >= d.dur || G.parts < 1 });
    btn(lx+498, y+12, 92, 38, 'Strip', () => { L.splice(L.indexOf(it), 1); G.parts += 1; toast(`Stripped the ${d.name} for a drone part.`); }, { s:13, col:C.hostile }); });
  if(L.length > 7) T(`+${L.length - 7} more in the locker`, lx+20, y0+580, { s:13, c:C.muted });
  // the selected slot
  if(sel){ const c = s.crew.find(x => x.id===sel.c), it = c && c[sel.k];
    if(c && it){ const by = y0+600; btn(lx, by, 200, 44, 'Take it off', () => { L.push(it); c[sel.k] = null; UI.armSel = null; }, { s:14 }); btn(lx+210, by, 200, 44, 'Repair · 1 part', () => armRepairItem(it), { s:14, disabled:it.dur >= armDef(it).dur || G.parts < 1 }); } }
  para('Weapons multiply a crew member\'s damage in hand-to-hand fights, and some have tricks: stuns, bleeding, guns that shoot into the next room. Armour soaks up melee damage. Everything wears out with use and breaks at zero. Repair it here with a drone part, or at any store.', cx, y0+570, 720, { s:13, lh:18, c:C.muted, max:4 });
}
function armStatLine(d){ if(!d) return ''; const t = [];
  if(d.dmg) t.push(`${d.dmg >= 1 ? '+' + Math.round((d.dmg-1)*100) : Math.round((d.dmg-1)*100)}% melee damage`);
  if(d.armor) t.push(`stops ${Math.round(d.armor*100)}% of melee damage`); if(d.stun) t.push('stuns'); if(d.bleed) t.push(`cuts bleed ${d.bleed}/s`); if(d.reach) t.push('shoots into neighbouring rooms');
  if(d.knock) t.push('knocks foes out of the room'); if(d.fear) t.push('makes foes flee'); if(d.laugh) t.push('makes everyone laugh'); if(d.leech) t.push('heals the wielder'); if(d.heal) t.push('heals friends in the room');
  if(d.repair) t.push(`repairs ${Math.round((d.repair-1)*100)}% faster`); if(d.fire) t.push('fights fires faster'); if(d.vac) t.push('breathe without air'); if(d.medpack) t.push(`heals ${d.medpack} once when badly hurt`);
  return t.length ? t.join(', ').replace(/^./, m => m.toUpperCase()) + '.' : ''; }

/* ---------------- the store's Armoury tab ---------------- */
function storeArms(st){ if(st.armStock) return st.armStock;
  const n = G.sector||1, maxT = n >= 5 ? 3 : n >= 2 ? 2 : 1, ids = Object.keys(DATA.arms||{}).filter(k => !DATA.arms[k].noLoot && (DATA.arms[k].tier||1) <= maxT);
  let pool = ids; const own = typeof campGear==='function' ? campGear('arms') : []; if(own.length) pool = [...own, ...own, ...ids];
  return st.armStock = withSeed(`s${n}n${G.map && G.map.cur}arms`, () => { const w = shuffle(pool.filter(k => DATA.arms[k].kind!=='suit')), s = shuffle(pool.filter(k => DATA.arms[k].kind==='suit')); return [...new Set([...w.slice(0, 4), ...s.slice(0, 2)])]; }); }
function drawStoreArms(st, cx, y0, W2, row){
  const stock = storeArms(st);
  stock.slice(0, 5).forEach((id, i) => { const d = DATA.arms[id]; if(!d) return; const c = Math.round(price(d.cost, st, 'arm', id)), sold = (st.sold||[]).includes('a:' + id) && !d.medpack;
    row(i, d.name, `${(ARM_KIND[d.kind]||['Kit'])[0]}. ${d.desc}`, c, () => spend(c, () => { (st.sold = st.sold||[]).push('a:' + id); armLocker().push(armNew(id)); toast(`${d.name} added to the Armoury locker (Ship → Armoury).`); }), { soldTxt:sold ? 'Sold' : null, stats:armStatLine(d).slice(0, 80), tipT:`${d.desc} ${armStatLine(d)}` }); });
  // repairs
  const worn = allKit().filter(k => armDef(k.it) && k.it.dur < armDef(k.it).dur), total = worn.reduce((t, k) => t + armRepairPrice(k.it), 0), y = y0 + Math.min(5, stock.length)*94 + 10;
  panel(cx, y, W2, 74, 8); T('Repair shop', cx+20, y+30, { s:20, f:FD, w:700 });
  T(worn.length ? `${worn.length} item${worn.length>1?'s':''} worn or broken: ${worn.slice(0, 4).map(k => armDef(k.it).name + ' (' + Math.round(armFrac(k.it)*100) + '%)').join(', ')}${worn.length > 4 ? '…' : ''}` : 'All your kit is in good order.', cx+20, y+56, { s:14, c:C.muted, max:W2-360 });
  btn(cx+W2-300, y+12, 280, 50, worn.length ? `Repair all · ${total}` : 'Nothing to repair', () => spend(total, () => { for(const k of worn) k.it.dur = armDef(k.it).dur; toast('All your kit is repaired.'); }), { disabled:!worn.length || G.scrap < total, fill:worn.length && G.scrap >= total, col:C.good });
}

/* an armoury in a derelict, a duelling master, a smuggler */
Object.assign(BASE.events, {
  arms_derelict:{ weight:.9, art:'wreck', text:'A wrecked security cutter, its armoury locker still sealed.', choices:[
    { text:'Cut the locker open.', effect:{ text:'Inside: kit, still in its packing.', arm:['random', 'random'] } },
    { text:'Strip the cutter for parts instead.', effect:{ text:'Good parts.', parts:3 } } ] },
  arms_master:{ weight:.8, art:'station', minSector:2, text:'An old Mantlis duelling master runs a school on this station. For a fee, she will teach your crew to fight properly.', choices:[
    { text:'Pay for lessons (25 scrap).', req:{ scrap:25 }, cost:{ scrap:25 }, effect:{ text:'Three days of bruises. Your crew fight like they mean it now.', xp:{ skill:'combat', amt:40 } } },
    { text:'Challenge her to a duel for her blade.', chance:.35, success:{ text:'You win, somehow. She bows, and hands you her blade.', arm:'mono' }, fail:{ text:'She wins. Gently. Your crew are bruised, and better for it.', crewHurt:20, xp:{ skill:'combat', amt:20 } } },
    { text:'Watch a lesson, for free.', effect:{ text:'You pick up a few moves.', xp:{ skill:'combat', amt:10 } } } ] },
  arms_smuggler:{ weight:.8, art:'market', text:'A nervous smuggler hails you. "Sidearms, armour, no questions. Cash only. Quickly, please."', choices:[
    { text:'Buy a crate (30 scrap).', req:{ scrap:30 }, cost:{ scrap:30 }, effect:{ text:'You don\'t ask where it came from.', arm:['random', 'random', 'random'] } },
    { text:'Report him to the authorities.', effect:{ text:'There\'s a small reward.', scrap:15 } } ] }
});
SENDOFF.push({ id:'sidearms', t:1, text:'A crate of sidearms and armour for the crew.', fx:{ arm:['pistol', 'knife', 'vest'] } });
