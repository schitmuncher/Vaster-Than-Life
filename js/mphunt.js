'use strict';
/* =========================================================================
   Hunter and hunted: the host flies the courier as usual; the guest is the
   Rebuff fleet commander. The commander watches the courier's game and spends
   command points (2 per courier jump) on cards: ambushes and hazards on the
   map, fleet surges and jammed sensors, and in a fight: overcharged guns,
   boarders and shields. The commander can also aim every enemy gun.
   Also here: what viewers (Go live) and commanders may press in someone else's game.
   ========================================================================= */
const HUNT_CARDS = [
  { k:'amb', name:'Ambush', cost:3, map:true, desc:'Pick a beacon ahead. If the courier lands there, a fleet warship is waiting.' },
  { k:'hz', name:'Hazard', cost:2, map:true, desc:'Put a star, asteroids, an ion storm or a pulsar on a beacon.' },
  { k:'surge', name:'Fleet surge', cost:4, desc:'The Rebuff fleet front leaps forward.' },
  { k:'jam', name:'Jam sensors', cost:2, desc:'The courier fights its next battle blind.' },
  { k:'prime', name:'Overcharge', cost:3, fight:true, desc:'Every enemy gun is charged right now.' },
  { k:'board', name:'Boarders', cost:4, fight:true, desc:'Two fleet troopers beam onto the courier.' },
  { k:'shield', name:'Shield surge', cost:3, fight:true, desc:'The enemy gains two super-shield points.' },
];
const HUNT_HZ = ['sun','asteroid','ionstorm','pulsar'];
const HUNT = { aim:null, hz:0 };
function huntOn(){ return NET.on && NET.mode==='hunt'; }
function huntCommander(){ return huntOn() && mpRole()==='commander'; }
function huntState(){ return G && G.hunt; }
/* host: the courier lands on a beacon */
function mpArrive(i, node, first){
  if(typeof raceArrive==='function' && raceArrive(i, node, first)) return true;
  if(!huntOn() || NET.role!=='host' || !G) return false;
  const H_ = G.hunt = G.hunt || { cp:2, played:0 };
  H_.cp = Math.min(10, H_.cp + 2);
  if(node.ambush && first && !['store','exit','base','start'].includes(node.type)){ node.ambush = false;
    startCombat('random', { harder:true, title:'Ambush!', text:'A Rebuff warship drops out of the dark right on top of you. The fleet commander knew you\'d come this way.' }); return true; }
  return false;
}
function mpSector(n){ if(!huntOn() || NET.role!=='host' || !G) return; if(MP.opts.hunt==='short' && n >= 4){ setTimeout(() => { if(G && UI.screen==='game') endRun(true, 'The courier slipped past the fleet into sector 4.'); }, 1200); } }
function mpCombatStart(e){ if(G && G.jamNext){ G.jamNext = false; G.jam = 1; toast('Sensors jammed!'); } if(!huntOn() || !G || !G.hunt) return; if(G.hunt.jamNext){ G.hunt.jamNext = false; G.jam = 1; toast('Sensors jammed! The fleet commander is blinding you.'); } }
/* host: a commander's card */
function huntCmd(c, P){
  if(!G || !huntOn()) return; const H_ = G.hunt = G.hunt || { cp:2, played:0 }; const card = HUNT_CARDS.find(x => x.k===c.c);
  if(c.c==='aim'){ const e = G.enemy; if(!e || e.dead) return; const w = e.weapons[c.wi]; if(!w) return; w.cmdT = c.room==null || !G.ship.rooms[c.room] ? null : c.room; if(w.cmdT!=null) w.target = null; return; }
  if(!card || H_.cp < card.cost) return;
  const fight = G.enemy && !G.enemy.dead;
  if(card.fight && !fight) return;
  switch(c.c){
    case 'amb': { const n = G.map.nodes[c.i]; if(!n || n.visited || ['store','exit','base','start'].includes(n.type) || n.ambush) return; n.ambush = true; toast('Fleet command: an ambush has been laid somewhere ahead.'); break; }
    case 'hz': { const n = G.map.nodes[c.i]; if(!n || n.visited || ['store','exit','base','start'].includes(n.type)) return; n.hazard = HUNT_HZ.includes(c.hz) ? c.hz : 'asteroid'; toast(`Fleet command: ${HZ_NAMES[n.hazard] || n.hazard} ahead.`); break; }
    case 'surge': G.fleetX += .14; toast('Fleet surge! The Rebuff fleet front jumps forward.'); sfx('alarm'); break;
    case 'jam': if(fight){ G.jam = 1; toast('Sensors jammed!'); } else { H_.jamNext = true; toast('Fleet command has jammed your sensors for the next fight.'); } break;
    case 'prime': for(const w of G.enemy.weapons) if(w.on) w.charge = DATA.weapons[w.id]?.charge || w.charge; toast('Fleet command overcharges the enemy guns!'); sfx('alarm'); break;
    case 'board': { const e = G.enemy, race = e.crew.find(x => !x.drone)?.race || 'human'; const room = aiTargetRoom(G.ship);
      for(let k=0;k<2;k++){ const c2 = newCrew(race, 'e'); G.ship.crew.push(c2); placeCrew(G.ship, c2, room); } fxAtRoom(G.ship, room, 'tele'); sfx('tele'); toast('Fleet troopers beam aboard!'); sfx('intruder'); break; }
    case 'shield': G.enemy.super = (G.enemy.super||0) + 2; G.enemy.superMax = Math.max(G.enemy.superMax||0, G.enemy.super); toast('The enemy shields flare with fleet power!'); sfx('shield'); break;
  }
  H_.cp -= card.cost; H_.played++; SYNC.dirty = true;
}
netOn('mx', (m, P) => { if(NET.role!=='host') return; if(huntOn() && mpRole(P.id)==='commander') { SYNC.relay = true; try{ huntCmd(m, P); } finally { SYNC.relay = false; } } else if(typeof mpVersusCmd==='function') mpVersusCmd(m, P); });
function huntSend(c){ netSend(Object.assign({ t:'mx' }, c)); sfx('lock'); }
/* the commander's console: drawn over the courier's weapons panel */
function drawHuntPanel(){
  if(!huntCommander() || !G) return;
  const x = 940, y = 652, w = 636, h = 328, H_ = G.hunt || { cp:0 };
  region(x, y, w, h, () => {}, null, true);
  rr(x, y, w, h, 10); ctx.fillStyle = 'rgba(40,8,18,.97)'; ctx.fill(); ctx.strokeStyle = C.hostile; ctx.lineWidth = 2; ctx.stroke();
  label('Fleet command', x+16, y+28, C.hostile, 'left', 16);
  T(`${H_.cp}/10 command points`, x+w-16, y+28, { s:16, f:FD, w:700, a:'right', c:C.amber }); bar(x+w-216, y+36, 200, 6, H_.cp/10, C.amber);
  const fight = G.enemy && !G.enemy.dead;
  HUNT_CARDS.forEach((cd, i) => { const bx = x+14 + (i%4)*154, by = y+50 + Math.floor(i/4)*66, ok = H_.cp >= cd.cost && (!cd.fight || fight), sel = HUNT.card===cd.k;
    btn(bx, by, 146, 56, `${cd.name} · ${cd.cost}`, () => { if(cd.map){ HUNT.card = sel ? null : cd.k; if(!sel){ SYNC.overlay = { type:'map', ov:true }; toast(cd.k==='amb' ? 'Pick a beacon for the ambush.' : 'Pick a beacon for the hazard.'); } } else { huntSend({ c:cd.k }); } }, { s:13, disabled:!ok, fill:sel, col:C.hostile, loc:true });
    tip(bx, by, 146, 56, `${cd.name} (${cd.cost} points)`, cd.desc + (cd.fight ? ' Only during a fight.' : '')); });
  if(fight){ label('Enemy gunnery: pick a gun, then a room on the courier', x+16, y+200, C.muted, 'left', 12);
    G.enemy.weapons.slice(0, 4).forEach((wp, i) => { const d = DATA.weapons[wp.id]; if(!d) return; const bx = x+14 + i*154, by = y+212, aim = HUNT.aim===i;
      btn(bx, by, 146, 52, `${aim ? 'Aiming…' : wp.cmdT!=null ? 'Aimed ' + (SYSS[G.ship.rooms[wp.cmdT]?.sys] || 'room') : 'Aim'} ${i+1}`, () => { HUNT.aim = aim ? null : i; }, { s:13, col:C.warn, fill:aim, loc:true });
      T(d.name, bx+4, by+70, { s:11, c:C.muted, max:140 }); bar(bx, by+76, 146, 5, wp.on ? wp.charge/d.charge : 0, C.hostile); }); }
  else T('Between fights: plan ambushes and hazards on the map.', x+16, y+240, { s:14, c:C.muted });
  if(HUNT.card==='hz'){ HUNT_HZ.forEach((k, i) => btn(x+14 + i*154, y+282, 146, 36, (HZ_NAMES[k] || k).replace(/^./, c => c.toUpperCase()), () => { HUNT.hz = i; }, { s:12, fill:HUNT.hz===i, col:C.cyan, loc:true })); }
  // aiming: the courier's rooms become targets
  if(HUNT.aim!=null && G.ship._rects){ G.ship._rects.forEach((q, ri) => { ctx.strokeStyle = hexA(C.hostile, .7); ctx.lineWidth = 2; ctx.strokeRect(q.x+2, q.y+2, q.w-4, q.h-4);
    region(q.x, q.y, q.w, q.h, () => { huntSend({ c:'aim', wi:HUNT.aim, room:ri }); HUNT.aim = null; }, null, true); }); }
}
/* markers on the commander's map, and picking a beacon for a card */
function mpMapOverlay(mx, my, nodes, f){
  if(typeof raceMapOverlay==='function') raceMapOverlay(mx, my, nodes, f);
  if(!huntCommander()) return;
  nodes.forEach((n, i) => { const x = mx(n), y = my(n);
    if(n.ambush){ ctx.strokeStyle = C.hostile; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 30, 0, 7); ctx.moveTo(x-38, y); ctx.lineTo(x-22, y); ctx.moveTo(x+22, y); ctx.lineTo(x+38, y); ctx.moveTo(x, y-38); ctx.lineTo(x, y-22); ctx.moveTo(x, y+22); ctx.lineTo(x, y+38); ctx.stroke(); label('AMBUSH', x, y-44, C.hostile, 'center', 11); }
    if(HUNT.card && !n.visited && i!==G.map.cur && !['store','exit','base','start'].includes(n.type)){ glow(x, y, 40, C.hostile, .25 + .15*Math.sin(performance.now()/200));
      region(x-30, y-30, 60, 60, () => { huntSend(HUNT.card==='amb' ? { c:'amb', i } : { c:'hz', i, hz:HUNT_HZ[HUNT.hz||0] }); HUNT.card = null; SYNC.overlay = null; }, null, true); } });
  if(HUNT.card) T(HUNT.card==='amb' ? 'Pick a beacon for the ambush' : 'Pick a beacon for the hazard', f.x + f.w/2, f.y + 110, { s:22, f:FD, w:700, a:'center', c:C.hostile });
}
/* viewers and commanders can look around someone else's game, but not press its buttons */
const LOOK_OK = new Set(['Map','Jump','Ship','Close','Done','Leave','Systems','Crew','Weapons & drones','Augments',"Captain's log",'Weapons','Drones','Supplies','Sell','‹','›']);
function spectAllowed(r){ return !!(r && (r.loc || (r.t && LOOK_OK.has(r.t)))); }
/* the end of a hunt */
function huntResult(){ if(!huntOn() || !G) return null; const win = UI.screen==='win'; const cmd = mpRole()==='commander';
  return win ? (cmd ? 'The courier got away. Better luck next hunt.' : 'You outran the fleet!') : (cmd ? 'Target destroyed. The fleet thanks you, commander.' : 'The fleet commander caught you.'); }

/* medals for the shared-ship modes */
const SHARED_UI = { fightWon:() => { if(NET.players.length > 1 && mpAmHost()) grant('mp_coop'); },
  hud:(x) => { if(mpRole()==='boarder' && G && G.enemy && !G.enemy.dead && G.ship.systems.teleporter && !G.enemy.crew.some(c => c.owner==='p')){ const t = performance.now()/1000;
      rr(W/2-300, 100, 600, 30, 15); ctx.fillStyle = 'rgba(30,40,8,.9)'; ctx.fill(); ctx.strokeStyle = hexA('#c6e05a', .6 + .4*Math.sin(t*3)); ctx.lineWidth = 2; ctx.stroke();
      T(inXR() ? 'Away team: step onto the teleporter pad and press BEAM ME OVER' : 'Away team: gather crew in the teleporter, then Send them over', W/2, 120, { s:14, f:FD, w:700, a:'center', c:'#c6e05a' }); }
    return x; } };
MP_UI.coop = SHARED_UI; MP_UI.nav = SHARED_UI; MP_UI.away = SHARED_UI; MP_UI.spect = {};
MP_UI.hunt = { options:(opt) => opt('Length', 'How far the courier must get to win', MP.opts.hunt==='short' ? 'Short · sector 4' : 'Full run', () => { MP.opts.hunt = MP.opts.hunt==='short' ? 'full' : 'short'; mpBroadcastOpts(); }),
  runEnded:(win) => { if(mpAmHost()){ if(win) grant('mp_courier'); netSend({ t:'huntEnd', win:!!win }); } } };
netOn('huntEnd', (m) => { if(huntCommander() && !m.win) grant('mp_hunter'); });
