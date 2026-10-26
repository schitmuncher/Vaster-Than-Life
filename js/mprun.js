'use strict';
/* =========================================================================
   Race to the Flaggship and Wingmen: everyone flies their own copy of the same
   run (same seed, same game data), at the same time.
   - Race: a strip under the top bar shows how far everyone has got. Winning a
     fight draws a trouble card to play on a rival: fleet surges, ambushes,
     ion storms, jammed sensors, fuel leaks, pirate tolls.
   - Wingmen: the same sectors, so you can meet. Jump to the same beacon as a
     wingmate and you fight the same ship together: each of your shots is
     echoed into their fight as covering fire. You can send each other supplies.
   ========================================================================= */
const PAR = { picks:{}, goAt:0, go:null, prog:{}, res:{}, sendT:0, cardsOpen:false, giftOpen:false, cardSel:null, giftTo:null, waiting:false };
const TROUBLE = [
  { k:'surge', name:'Fleet surge', desc:'Their Rebuff fleet front leaps forward.' },
  { k:'ambush', name:'Ambush', desc:'A pirate waits at their next beacon.' },
  { k:'storm', name:'Ion storm', desc:'Their next beacon sits in an ion storm.' },
  { k:'jam', name:'Sensor jam', desc:'They fight their next battle blind.' },
  { k:'leak', name:'Fuel leak', desc:'They lose 2 fuel.' },
  { k:'toll', name:'Pirate toll', desc:'They lose 25 scrap.' },
  { k:'block', name:'Jammer', desc:'Blocks the next card played on you.', self:true },
];
function parOn(){ return NET.on && (NET.mode==='race' || NET.mode==='wing'); }
function parRacers(){ return NET.players.filter(p => !p.spect); }
function parStatus(id){ return PAR.prog[id] || null; }

/* ---------------- the room: settings and the start ---------------- */
function parOptions(opt, sx, sy){
  const host = mpAmHost();
  opt('Ships', 'Everyone flies the same ship, or picks their own', MP.opts.ship==='each' ? 'Each picks' : 'Host picks', () => { MP.opts.ship = MP.opts.ship==='each' ? 'host' : 'each'; mpBroadcastOpts(); });
  opt('Difficulty', 'The same for everyone', (DIFFICULTY[MP.opts.diff]||DIFFICULTY.normal).name, () => { const k = Object.keys(DIFFICULTY); MP.opts.diff = k[(k.indexOf(MP.opts.diff) + 1) % k.length]; mpBroadcastOpts(); });
  if(NET.mode==='race') opt('Trouble cards', 'Win fights to draw cards you play on rivals', MP.opts.cards ? 'On' : 'Off', () => { MP.opts.cards = !MP.opts.cards; mpBroadcastOpts(); });
  return sy;
}
function parStart(host){
  if(PAR.goAt){ const n = Math.ceil((PAR.goAt - performance.now())/1000); T(n > 0 ? `Launching in ${n}…` : 'Launch!', W-80, H-48, { s:26, f:FD, w:700, a:'right', c:C.good }); return true; }
  if(PAR.waiting){ T('Waiting for everyone to pick a ship…', W-80, H-48, { s:18, a:'right', c:C.muted }); return true; }
  if(!host) return false;
  btn(W-410, H-86, 330, 60, NET.players.length < 2 ? 'Waiting for players…' : MP.opts.ship==='each' ? 'Everyone pick a ship' : 'Pick the ship', () => {
    if(MP.opts.ship==='each'){ PAR.picks = {}; netSend({ t:'pp' }); PAR.waiting = true; MP.toHangar = true; openHangar(); }
    else { MP.toHangar = true; openHangar(); } }, { fill:NET.players.length >= 2, disabled:NET.players.length < 2, s:20 });
  return true;
}
/* the hangar's Launch button picks a ship for the race */
function parHangar(sel, open){
  btn(1240, 890, 300, 70, 'Ready', () => {
    const pick = { ship:sel, name:UI.shipName || null };
    if(mpAmHost()){ PAR.picks[NET.id] = pick; if(MP.opts.ship==='each') { UI.screen = 'mp'; MP.view = 'room'; parMaybeGo(); } else parGo(pick); }
    else { netSend({ t:'pk', pick }); UI.screen = 'mp'; MP.view = 'room'; PAR.waiting = true; } }, { fill:true, s:26, disabled:!open });
  btn(1060, 890, 160, 70, 'Back', () => { UI.screen = 'mp'; MP.view = 'room'; });
  return true;
}
netOn('pp', () => { if(NET.role==='guest' && parOn()){ MP.toHangar = true; applyModsKeep(); UI._thumbs = {}; UI.selShip = UI.selShip && DATA.ships[UI.selShip] ? UI.selShip : Object.keys(DATA.ships)[0]; UI.shipName = null; UI.seed = null; UI.screen = 'select'; toast('Pick your ship for the race.'); } });
netOn('pk', (m, P) => { if(!mpAmHost() || !parOn() || !m.pick) return; PAR.picks[P.id] = { ship:String(m.pick.ship), name:m.pick.name ? String(m.pick.name).slice(0, 24) : null }; mpFeed(`${P.name} is ready.`, mpColor(P.id)); parMaybeGo(); });
function applyModsKeep(){ /* guests keep the host's data: nothing to do */ }
function parMaybeGo(){ if(!mpAmHost()) return; const need = parRacers().map(p => p.id); if(need.every(id => PAR.picks[id])) parGo(); }
/* host: everyone launches together, three seconds from now */
function parGo(one){
  const seed = randomSeed(), ships = {};
  for(const p of parRacers()) ships[p.id] = one || PAR.picks[p.id] || { ship:'pestrel', name:null };
  const go = { t:'go', seed, diff:MP.opts.diff || 'normal', ships, inMs:3000 };
  for(const P of NET.peers.values()) if(P.open && P.joined) netSend({ t:'data', data:DATA }, P.id);
  netSend(go); parArm(go); UI.screen = 'mp'; MP.view = 'room';
}
netOn('go', (m) => { if(NET.role==='guest' && parOn()) parArm(m); });
function parArm(m){ PAR.go = m; PAR.goAt = performance.now() + (m.inMs || 3000); PAR.waiting = false; PAR.prog = {}; PAR.res = {}; sfx('ftlready'); UI.screen = 'mp'; MP.view = 'room'; }
function parFrame(dt){
  if(PAR.goAt && performance.now() >= PAR.goAt){ const m = PAR.go; PAR.goAt = 0; PAR.go = null; const pick = (m.ships && m.ships[NET.id]) || { ship:'pestrel' };
    const ship = DATA.ships[pick.ship] ? pick.ship : Object.keys(DATA.ships)[0];
    newRun(ship, pick.name, { seed:m.seed, diff:m.diff, keepData:true, par:NET.mode });
    G.par = NET.mode; G.noInvite = true; G.race = { cards:[], blocked:false }; PAR.sendT = 0; sfx('jump'); }
  if(G && G.par && UI.screen==='game'){ PAR.sendT -= dt; if(PAR.sendT <= 0){ PAR.sendT = 2; parSendProg(); } }
}
function parSendProg(extra){ if(!G || !G.par) return; const n = G.map && G.map.nodes[G.map.cur];
  const p = Object.assign({ t:'pg', id:NET.id, s:G.sector, c:n ? n.col : 0, cols:G.map ? Math.max(...G.map.nodes.map(x => x.col)) : 7, n:G.map ? G.map.cur : 0, h:G.ship.hull, mh:G.ship.maxHull, sc:G.scrap, k:G.stats.kills,
    f:!!(G.enemy && !G.enemy.dead), fh:G.fightsHere||0, ph:G.flag ? G.flag.phase : -1, st:UI.screen, sh:G.shipDef, cards:(G.race?.cards||[]).length }, extra || {});
  PAR.prog[NET.id] = p; netSend(p); }
netOn('pg', (m, P) => { const id = m.id || P.id; PAR.prog[id] = m; if(NET.role==='host') netSend(m, null, P.id); });
/* the end of someone's run */
function parRunEnded(win, reason){
  if(!G || !G.par) return; const r = { t:'fin', id:NET.id, win:!!win, score:runScore(win), s:G.sector, k:G.stats.kills, time:Math.round(G.time||0), at:Date.now(), why:String(reason||'').slice(0, 80) };
  if(win && G.par==='race' && !Object.values(PAR.res).some(x => x.win)) grant('racewin');
  PAR.res[NET.id] = r; netSend(r); parSendProg({ st:win ? 'win' : 'over' });
}
netOn('fin', (m, P) => { const id = m.id || P.id; if(PAR.res[id]) return; PAR.res[id] = m; if(NET.role==='host') netSend(m, null, P.id);
  const p = mpPlayer(id), name = p ? p.name : 'Someone';
  if(m.win){ const first = Object.values(PAR.res).filter(r => r.win).length===1; toast(`${name} ${NET.mode==='race' && first ? 'won the race' : 'reached Fedoration command'}!`); mpFeed(`${name} won with ${fmtNum(m.score)} points.`, p?.color); sfx('victory', { vol:.4 }); }
  else { toast(`${name} is out: ${m.why || 'their ship was lost'}`); mpFeed(`${name} is out at sector ${m.s} (${fmtNum(m.score)} points).`, p?.color); } });

/* ---------------- trouble cards (race) ---------------- */
function parFightWon(kind){
  if(!G || G.par!=='race' || !MP.opts.cards || kind==='fled') return; const R_ = G.race = G.race || { cards:[] };
  if(R_.cards.length >= 3) return; const c = withSeed(`card${G.stats.kills}`, () => pick(TROUBLE)); R_.cards.push(c.k);
  setTimeout(() => toast(`You drew a trouble card: ${c.name}. Play it from the strip at the top.`), 1500);
}
function parPlay(k, to){
  const R_ = G && G.race; if(!R_) return; const i = R_.cards.indexOf(k); if(i<0) return; R_.cards.splice(i, 1);
  const card = TROUBLE.find(c => c.k===k);
  if(card.self){ R_.blocked = true; toast('Jammer ready: the next card played on you fizzles.'); parSendProg(); PAR.cardsOpen = false; return; }
  const m = { t:'card', k, from:NET.id, to }; netSend(m); const tp = mpPlayer(to);
  mpFeed(`You played ${card.name} on ${tp ? tp.name : 'a rival'}.`, C.amber); toast(`${card.name} sent to ${tp ? tp.name : 'a rival'}!`); sfx('missile');
  PAR.cardsOpen = false; PAR.cardSel = null; parSendProg();
}
netOn('card', (m, P) => {
  if(NET.role==='host' && m.to!==NET.id){ netSend(m, m.to); return; }
  if(m.to!==NET.id || !G || !G.par || UI.screen!=='game') return;
  const card = TROUBLE.find(c => c.k===m.k); if(!card) return; const from = mpPlayer(m.from), fname = from ? from.name : 'A rival';
  if(G.race && G.race.blocked){ G.race.blocked = false; toast(`Your jammer blocked ${fname}'s ${card.name}!`); netSend({ t:'say', i:-1, text:'Blocked!', id:NET.id }); return; }
  switch(m.k){
    case 'surge': G.fleetX += .15; break;
    case 'ambush': G.trAmbush = true; break;
    case 'storm': G.trStorm = true; break;
    case 'jam': if(G.enemy && !G.enemy.dead) G.jam = 1; else G.jamNext = true; break;
    case 'leak': G.fuel = Math.max(1, G.fuel - 2); break;
    case 'toll': G.scrap = Math.max(0, G.scrap - 25); break;
  }
  toast(`${fname} played ${card.name} on you!`); sfx('alarm'); haptic(.4, 200); mpFeed(`${fname} hit you with ${card.name}.`, from?.color);
});
/* a rival's ambush or storm waits at your next beacon */
function raceArrive(i, node, first){
  if(!G || !G.par) return false;
  if(G.trStorm && !['store','exit','base'].includes(node.type)){ G.trStorm = false; G.hazard = 'ionstorm'; toast('A rival\'s ion storm rolls over this beacon!'); }
  if(G.trAmbush && first && ['event','empty','combat'].includes(node.type) && !node.quest){ G.trAmbush = false; startCombat('random', { title:'Ambush!', text:'Pirates were paid to wait for you here.' }); return true; }
  return false;
}

/* ---------------- wingmen: covering fire and supplies ---------------- */
function parLaunch(p){
  if(!G || G.par!=='wing' || p.from!=='p' || p.to!=='e' || !G.enemy || p.kind==='hack' || p.kind==='bdrone' || !p.d || p.d.heal) return;
  netSend({ t:'as', id:NET.id, s:G.sector, n:G.map.cur, f:G.fightsHere||0, d:{ type:p.d.type, damage:p.d.damage||0, name:p.d.name, fire:p.d.fire, breach:p.d.breach, sysDamage:p.d.sysDamage, ion:p.d.ion, stun:p.d.stun, crewDamage:p.d.crewDamage, pierce:p.d.pierce, shots:1 }, room:p.room, rooms:p.rooms });
}
netOn('as', (m, P) => { const id = m.id || P.id; if(NET.role==='host') netSend(m, null, P.id);
  if(!G || G.par!=='wing' || !G.enemy || G.enemy.dead || G.sector!==m.s || G.map.cur!==m.n || (G.fightsHere||0)!==m.f || UI.screen!=='game') return;
  const e = G.enemy, room = e.rooms[m.room] ? m.room : 0;
  launch('w', 'e', m.d, room, { rooms:m.d.type==='beam' ? (m.rooms||[room]).filter(r => e.rooms[r]) : undefined });
  PAR.ally = { id, t:performance.now() }; });
function parGift(to, k){
  if(!G) return; const amt = { scrap:15, fuel:2, missiles:2, parts:2 }[k]; if(!amt || (G[k]||0) < amt){ toast(`You don't have ${amt} ${k} to spare.`); return; }
  G[k] -= amt; netSend({ t:'gift', from:NET.id, to, k, n:amt }); grant('mp_wing'); const tp = mpPlayer(to); toast(`Sent ${amt} ${k} to ${tp ? tp.name : 'your wingmate'}.`); sfx('buy'); save();
}
netOn('gift', (m, P) => {
  if(NET.role==='host' && m.to!==NET.id){ netSend(m, m.to); return; }
  if(m.to!==NET.id || !G || !G.par) return; const k = m.k, n = clamp(+m.n||0, 0, 50); if(!['scrap','fuel','missiles','parts'].includes(k)) return;
  G[k] = (G[k]||0) + n; const from = mpPlayer(m.from); toast(`${from ? from.name : 'Your wingmate'} sent you ${n} ${k}!`); sfx('buy'); mpFeed(`${from ? from.name : 'A wingmate'} sent ${n} ${k}.`, from?.color);
});

/* ---------------- what you see in the game ---------------- */
function parHud(x){
  if(!G || !G.par) return x;
  for(const p of parRacers()){ if(p.id===NET.id) continue; const g = PAR.prog[p.id], r = PAR.res[p.id];
    const txt = r ? `${p.name} · ${r.win ? 'WON' : 'out'} · ${fmtNum(r.score)}` : g ? `${p.name} · S${g.s} ${'▰'.repeat(clamp(g.c,0,8))}${'▱'.repeat(clamp((g.cols||7)-g.c,0,8))} · ${g.h}/${g.mh}${g.f ? ' ⚔' : ''}` : `${p.name} · launching`;
    x = mpChip(x, p.color, txt, false); }
  if(G.par==='race' && MP.opts.cards){ const n = (G.race?.cards||[]).length; btn(x+6, 77, 110, 19, `Cards ${n}${G.race?.blocked ? ' 🛡' : ''}`, () => { PAR.cardsOpen = !PAR.cardsOpen; PAR.cardSel = null; }, { s:11, loc:true, col:C.warn, fill:n>0 }); x += 116; }
  if(G.par==='wing'){ btn(x+6, 77, 110, 19, 'Supplies', () => { PAR.giftOpen = !PAR.giftOpen; }, { s:11, loc:true, col:C.good }); x += 116;
    const al = PAR.ally && performance.now() - PAR.ally.t < 3000 ? mpPlayer(PAR.ally.id) : null;
    if(al){ rr(PBOX.x + PBOX.w - 200, PBOX.y + 8, 190, 34, 8); ctx.fillStyle = 'rgba(8,20,40,.9)'; ctx.fill(); ctx.strokeStyle = al.color; ctx.lineWidth = 2; ctx.stroke(); T(`Covering fire: ${al.name}`, PBOX.x + PBOX.w - 105, PBOX.y + 30, { s:13, f:FD, w:700, a:'center', c:al.color, max:180 }); } }
  if(PAR.cardsOpen) drawCardsPanel(); if(PAR.giftOpen) drawGiftPanel();
  return x;
}
function drawCardsPanel(){
  const x = W/2 - 450, y = 160, w = 900, h = 360, R_ = G.race || { cards:[] };
  ctx.fillStyle = 'rgba(4,6,12,.55)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { PAR.cardsOpen = false; }, null, true);
  panel(x, y, w, h, 14); region(x, y, w, h, () => {}, null, true); label('Trouble cards', x+24, y+40, C.warn, 'left', 16); label('Win fights to draw more (3 max)', x+w-24, y+40, C.muted, 'right', 12);
  if(!R_.cards.length) T('No cards yet. Win a fight to draw one.', x+24, y+100, { s:18, c:C.muted });
  R_.cards.forEach((k, i) => { const c = TROUBLE.find(q => q.k===k); const bx = x+24 + i*290, sel = PAR.cardSel===i;
    rr(bx, y+64, 270, 150, 10); ctx.fillStyle = sel ? hexA(C.warn,.18) : 'rgba(30,24,10,.9)'; ctx.fill(); ctx.strokeStyle = C.warn; ctx.lineWidth = sel ? 3 : 1.5; ctx.stroke();
    T(c.name, bx+16, y+100, { s:20, f:FD, w:700, c:C.warn }); para(c.desc, bx+16, y+128, 238, { s:14, lh:19, c:C.ink, max:3 });
    region(bx, y+64, 270, 150, () => { if(c.self) parPlay(k); else PAR.cardSel = sel ? null : i; }, null, true); });
  if(PAR.cardSel!=null){ const k = R_.cards[PAR.cardSel]; label('Play it on', x+24, y+250, C.muted, 'left', 13);
    parRacers().filter(p => p.id!==NET.id && !PAR.res[p.id]).forEach((p, i) => btn(x+24 + i*220, y+266, 206, 60, p.name, () => parPlay(k, p.id), { s:17, col:p.color, loc:true })); }
}
function drawGiftPanel(){
  const x = W/2 - 420, y = 160, w = 840, h = 330;
  ctx.fillStyle = 'rgba(4,6,12,.55)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { PAR.giftOpen = false; }, null, true);
  panel(x, y, w, h, 14); region(x, y, w, h, () => {}, null, true); label('Send supplies to a wingmate', x+24, y+40, C.good, 'left', 16);
  const mates = parRacers().filter(p => p.id!==NET.id && !PAR.res[p.id]); if(!PAR.giftTo || !mates.some(p => p.id===PAR.giftTo)) PAR.giftTo = mates[0]?.id || null;
  if(!mates.length){ T('Nobody to send to right now.', x+24, y+100, { s:18, c:C.muted }); return; }
  mates.forEach((p, i) => btn(x+24 + i*200, y+60, 186, 50, p.name, () => { PAR.giftTo = p.id; }, { s:16, col:p.color, fill:PAR.giftTo===p.id, loc:true }));
  [['scrap',15],['fuel',2],['missiles',2],['parts',2]].forEach(([k, n], i) => btn(x+24 + i*200, y+140, 186, 70, `${n} ${k}`, () => parGift(PAR.giftTo, k), { s:18, col:C.good, disabled:(G[k]||0) < n, loc:true }));
  para('Supplies arrive at once, wherever they are.', x+24, y+260, w-48, { s:14, c:C.muted });
}
/* other racers on your sector map */
function raceMapOverlay(mx, my, nodes, f){
  if(!G || !G.par) return;
  let k = 0; for(const p of parRacers()){ if(p.id===NET.id) continue; const g = PAR.prog[p.id]; if(!g || g.s!==G.sector || !nodes[g.n]) continue; const n = nodes[g.n], x = mx(n) + 30, y = my(n) - 26 - (k++ % 3)*16;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = p.color; ctx.fill(); ctx.strokeStyle = '#0b0f1c'; ctx.lineWidth = 2; ctx.stroke();
    T(p.name + (g.f ? ' ⚔' : ''), x + 14, y + 5, { s:13, f:FD, w:700, c:p.color }); }
}
/* the end of a race */
function parEndButtons(win){
  if(!G || !G.par) return false;
  const rows = parRacers().map(p => ({ p, r:PAR.res[p.id] || (p.id===NET.id ? { win, score:runScore(win), s:G.sector } : null), g:PAR.prog[p.id] }));
  rows.sort((a, b) => ((b.r && b.r.win) - (a.r && a.r.win)) || ((b.r ? b.r.score : (b.g ? b.g.s*1000 : 0)) - (a.r ? a.r.score : (a.g ? a.g.s*1000 : 0))));
  const x = W/2 + 200, y = 552; rr(x-4, y-4, 448, 308, 14); ctx.fillStyle = '#0a0f1e'; ctx.fill(); panel(x, y, 440, 300, 12); label(NET.mode==='race' ? 'Race standings' : 'Wing', x+24, y+36, C.good, 'left', 15);
  rows.slice(0, 4).forEach((q, i) => { T(`${i+1}. ${q.p.name}`, x+24, y+80 + i*48, { s:18, f:FD, w:700, c:q.p.color, max:220 }); T(q.r ? (q.r.win ? `Won · ${fmtNum(q.r.score)}` : `Out S${q.r.s} · ${fmtNum(q.r.score)}`) : q.g ? `Flying · sector ${q.g.s}` : '…', x+416, y+80 + i*48, { s:15, a:'right', c: q.r && q.r.win ? C.good : C.muted }); });
  btn(W/2-640, 884, 300, 72, 'Back to the room', () => { G = null; UI.screen = 'mp'; MP.view = 'room'; }, { s:20 });
  btn(W/2+340, 884, 300, 72, 'Leave', () => { mpLeave(); UI.screen = 'title'; G = null; }, { s:20, col:C.hostile });
  return true;
}
const PAR_UI = { options:parOptions, start:parStart, hangar:parHangar, frame:parFrame, hud:parHud, launch:parLaunch, fightWon:parFightWon, runEnded:parRunEnded, endButtons:parEndButtons,
  left:(P) => { delete PAR.picks[P.id]; if(PAR.waiting) parMaybeGo(); },
  ended:() => { PAR.goAt = 0; PAR.waiting = false; if(G && G.par){ toast('Disconnected from the other pilots. Your run goes on.'); } } };
MP_UI.race = PAR_UI; MP_UI.wing = PAR_UI;
