'use strict';
/* =========================================================================
   The shipyard: earning your ships, the way old shooters made you earn guns.
   - Pilot level: every run's renown is experience. Level = 1 + sqrt(renown/4),
     shown next to your Admiralty rank. Each ship needs a pilot level.
   - Ship challenges: most ships also need a challenge, usually done in
     another ship (win with the Plucky, destroy 25 ships flying the Spanner in the Works,
     reach sector 5 in the Lantern...). B layouts are earned in their A ship.
   - Both met: the ship unlocks, and the debrief says so.
   - Or skip ahead: a requisition token (one at each requisition rank:
     Lieutenant, Commander, Commodore, Vice Admiral) unlocks any ship at once;
     or, once you're the right level, buy it with renown (the rank stays).
   - Ships also come from play: Revered factions hand over their designs.
   Mod ships can set "lvl" and "ch" ({ win, sector, kills, ach,
   shipSector:[id,n], shipKills:[id,n] }); older "unlock" fields still work.
   ========================================================================= */
const SHIP_PROG = {
  pestrel:{ lvl:1 },
  fc_courier:{ lvl:2 },
  lanternship:{ lvl:3, ch:{ sector:3 } },
  taurus:{ lvl:4, ch:{ kills:15 } },
  stone:{ lvl:5, ch:{ sector:4 } },
  fc_gunboat:{ lvl:6, ch:{ shipKills:['pestrel', 20] } },
  redtale:{ lvl:7, ch:{ shipSector:['pestrel', 6] } },
  xh_lance:{ lvl:7, ch:{ kills:40 } },
  zap:{ lvl:8, ch:{ sector:5 } },
  fc_courierb:{ lvl:8, ch:{ shipSector:['fc_courier', 4] } },
  tideship:{ lvl:9, ch:{ shipKills:['taurus', 15] } },
  lanternb:{ lvl:9, ch:{ shipSector:['lanternship', 5] } },
  anvil:{ lvl:10, ch:{ kills:60 } },
  bortex:{ lvl:10, ch:{ shipKills:['taurus', 25] } },
  slime:{ lvl:11, ch:{ ach:'boardkill' } },
  rockbottom:{ lvl:11, ch:{ ach:'firestarter' } },
  dh_beehive:{ lvl:12, ch:{ shipKills:['taurus', 30] } },
  fc_gunboatb:{ lvl:12, ch:{ shipKills:['fc_gunboat', 30] } },
  fc_ark:{ lvl:13, ch:{ sector:6 } },
  voltface:{ lvl:13, ch:{ ach:'augs3' } },
  mantlis:{ lvl:14, ch:{ ach:'mind' } },
  tideb:{ lvl:14, ch:{ shipSector:['tideship', 6] } },
  peekaboo:{ lvl:15, ch:{ sector:7 } },
  anvilb:{ lvl:15, ch:{ shipKills:['anvil', 30] } },
  pk_corsair:{ lvl:16, ch:{ kills:120 } },
  gastropod:{ lvl:16, ch:{ win:'slime' } },
  jollyroger:{ lvl:17, ch:{ shipSector:['pk_corsair', 5] } },
  dh_swarm:{ lvl:17, ch:{ shipKills:['dh_beehive', 30] } },
  xh_phantom:{ lvl:18, ch:{ shipSector:['peekaboo', 6] } },
  fc_arkb:{ lvl:18, ch:{ shipSector:['fc_ark', 6] } },
  glasscannon:{ lvl:19, ch:{ ach:'glasswork' } },
  pk_corsairb:{ lvl:19, ch:{ shipKills:['pk_corsair', 30] } },
  bp_crowbar:{ lvl:20, ch:{ ach:'boardkill', kills:150 } },
  basilisk:{ lvl:20, ch:{ win:'mantlis' } },
  bp_crowbarb:{ lvl:21, ch:{ shipKills:['bp_crowbar', 25] } },
  nowyoudont:{ lvl:21, ch:{ win:'peekaboo' } },
  xh_puppet:{ lvl:22, ch:{ shipKills:['mantlis', 30] } },
  paneneck:{ lvl:23, ch:{ win:'glasscannon' } },
  rd_turncoat:{ lvl:24, ch:{ wins:3 } },
  rd_whistle:{ lvl:25, ch:{ shipSector:['rd_turncoat', 7] } },
  xh_juggernaut:{ lvl:26, ch:{ kills:250 } }
};
function pilotLevel(r){ r = r==null ? (PROFILE.renown || 0) : r; return Math.min(50, 1 + Math.floor(Math.sqrt(Math.max(0, r) / 4))); }
function levelAt(L){ return 4 * (L - 1) * (L - 1); }
function shipProg(def){
  if(!def) return { lvl:1 }; if(SHIP_PROG[def.id]) return SHIP_PROG[def.id];
  if(def.lvl || def.ch) return { lvl:def.lvl || 1, ch:def.ch };
  const u = def.unlock; if(!u) return { lvl:1 };
  return u.sector ? { lvl:u.sector*2, ch:{ sector:u.sector } } : u.kills ? { lvl:Math.max(3, Math.round(u.kills/3)), ch:{ kills:u.kills } } : { lvl:10, ch:u };
}
function shipName(id){ return ((DATA.ships && DATA.ships[id]) || (BASE.ships && BASE.ships[id]) || {}).name || id; }
/* each part of a challenge: [have, need, text] */
function chParts(ch){
  if(!ch) return []; const out = [], wins = Object.values(PROFILE.wins || {}).reduce((a, b) => a + (+b || 0), 0), best = id => (PROFILE.best && PROFILE.best[id]) || {};
  if(ch.win) out.push([PROFILE.wins && PROFILE.wins[ch.win] ? 1 : 0, 1, `Win a run flying ${shipName(ch.win)}`]);
  if(ch.wins) out.push([wins, ch.wins, `Win ${ch.wins} runs in any ships`]);
  if(ch.sector) out.push([PROFILE.maxSector || 1, ch.sector, `Reach sector ${ch.sector} in any run`]);
  if(ch.kills) out.push([PROFILE.kills || 0, ch.kills, `Defeat ${ch.kills} ships in total`]);
  if(ch.ach) out.push([PROFILE.ach && PROFILE.ach[ch.ach] ? 1 : 0, 1, `Earn the medal "${((typeof ACHIEVEMENTS!=='undefined' && ACHIEVEMENTS.find(a => a.id===ch.ach)) || {}).name || ch.ach}"`]);
  if(ch.shipSector){ const [id, n] = ch.shipSector; out.push([best(id).sector || 0, n, `Reach sector ${n} flying ${shipName(id)}`]); }
  if(ch.shipKills){ const [id, n] = ch.shipKills; out.push([(PROFILE.shipKills && PROFILE.shipKills[id]) || 0, n, `Destroy ${n} ships flying ${shipName(id)}`]); }
  return out; }
function shipLevelOk(def){ return pilotLevel() >= shipProg(def).lvl; }
function shipChOk(def){ return chParts(shipProg(def).ch).every(([h, n]) => h >= n); }
shipUnlocked = function(def){
  if(!def) return false; if(SET.unlockAll || (PROFILE.unlocked && PROFILE.unlocked[def.id])) return true;
  return shipLevelOk(def) && shipChOk(def); };
unlockText = function(x){ const def = x && x.id && DATA.ships && DATA.ships[x.id] ? x : null; if(!def) return ''; const P = shipProg(def), parts = chParts(P.ch);
  return [`Pilot level ${P.lvl}`, ...parts.map(p => p[2])].join(' · '); };
/* requisition tokens: one per requisition rank reached */
function tokensEarned(){ if(typeof RANKS==='undefined' || typeof rankIdx!=='function') return 0; const ri = rankIdx(); return RANKS.filter((r, i) => r.ship && i <= ri).length; }
function tokensLeft(){ return Math.max(0, tokensEarned() - (PROFILE.tokensUsed || 0)); }
function shipPrice(def){ return 100 + 30 * shipProg(def).lvl; }
function shipGrant(def, how){ PROFILE.unlocked = PROFILE.unlocked || {}; PROFILE.unlocked[def.id] = how || true; PROFILE.shipKnown = PROFILE.shipKnown || {}; PROFILE.shipKnown[def.id] = 1; saveProfile(); if(typeof sfx==='function') sfx('buy'); toast(`${def.name} is yours.`); UI._thumbs = {}; }
function shipUseToken(def){ if(tokensLeft() < 1 || shipUnlocked(def)) return; PROFILE.tokensUsed = (PROFILE.tokensUsed || 0) + 1; shipGrant(def, 'token'); }
function shipBuy(def){ const p = shipPrice(def), free = typeof renownFree==='function' ? renownFree() : 0; if(shipUnlocked(def) || !shipLevelOk(def) || free < p) return; PROFILE.renownSpent = (PROFILE.renownSpent || 0) + p; shipGrant(def, 'bought'); }
/* ships that came free since we last looked (the debrief lists them) */
function shipNewlyOpen(){ const all = Object.values(DATA.ships || {}).filter(d => d && !d.secret);
  if(!PROFILE.shipKnown){ PROFILE.shipKnown = {}; for(const d of all) if(shipUnlocked(d)) PROFILE.shipKnown[d.id] = 1; saveProfile(); return []; }
  const out = []; for(const d of all) if(!PROFILE.shipKnown[d.id] && shipUnlocked(d)){ PROFILE.shipKnown[d.id] = 1; out.push(d); } if(out.length) saveProfile(); return out; }
function shipCountKill(){ if(!G || !G.shipDef || G.tut) return; PROFILE.shipKills = PROFILE.shipKills || {}; PROFILE.shipKills[G.shipDef] = (PROFILE.shipKills[G.shipDef] || 0) + 1; }
/* the debrief: level ups and new ships */
function shipyardDebrief(unlocks, before, after){
  const l0 = pilotLevel(before), l1 = pilotLevel(after); if(l1 > l0) unlocks.push(`Pilot level ${l1}!`);
  for(const d of shipNewlyOpen()) unlocks.push(`New ship: ${d.name} (${d.cls || ''})`);
  if(l1 > l0){ const ready = Object.values(DATA.ships || {}).filter(d => d && !d.secret && !shipUnlocked(d) && shipProg(d).lvl > l0 && shipProg(d).lvl <= l1);
    for(const d of ready.slice(0, 3)) unlocks.push(`${d.name}: level reached. Still needs: ${chParts(shipProg(d).ch).filter(p => p[0] < p[1]).map(p => p[2]).join(', ')}`); }
}
/* the hangar's locked panel */
function drawShipLock(def, x, y, w, h){
  const P = shipProg(def), L = pilotLevel(), parts = chParts(P.ch), lvOk = L >= P.lvl;
  ctx.fillStyle = 'rgba(7,10,20,.78)'; rr(x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
  T('🔒 LOCKED', x + 24, y + 44, { s:28, f:FD, w:700, c:C.muted, ls:3 }); T(`You: level ${L}`, x + w - 24, y + 42, { s:15, a:'right', c:C.cyan });
  const bar = (yy, have, need, text, ok) => { T((ok ? '✓ ' : '') + text, x + 24, yy, { s:16, c: ok ? C.good : C.ink, max:w - 150 }); T(`${Math.min(have, need)}/${need}`, x + w - 24, yy, { s:14, a:'right', c: ok ? C.good : C.muted });
    rr(x + 24, yy + 8, w - 48, 8, 4); ctx.fillStyle = '#141b31'; ctx.fill(); rr(x + 24, yy + 8, (w - 48) * clamp(have / need, 0, 1), 8, 4); ctx.fillStyle = ok ? C.good : C.amber; ctx.fill(); };
  let yy = y + 82; bar(yy, L, P.lvl, `Pilot level ${P.lvl}`, lvOk); yy += 40;
  for(const [hv, n, t] of parts){ bar(yy, hv, n, t, hv >= n); yy += 40; }
  if(!parts.length){ T('No challenge: just reach the level.', x + 24, yy, { s:14, c:C.muted }); yy += 30; }
  const by = y + h - 60, tk = tokensLeft(), pr = shipPrice(def), free = typeof renownFree==='function' ? renownFree() : 0;
  btn(x + 24, by, 300, 46, `Use a requisition token (${tk})`, () => shipUseToken(def), { s:14, disabled:tk < 1, col:C.cyan, fill:tk > 0 });
  tip(x + 24, by, 300, 46, 'Requisition tokens', `Unlocks any ship at once, skipping its level and challenge. You earn one at each requisition rank: Lieutenant, Commander, Commodore and Vice Admiral. You have ${tk}.`);
  btn(x + 340, by, 300, 46, lvOk ? `Buy · ${fmtNum(pr)} renown` : `Buy from level ${P.lvl}`, () => shipBuy(def), { s:14, disabled:!lvOk || free < pr, col:C.amber });
  tip(x + 340, by, 300, 46, 'Buy with renown', `Once you're level ${P.lvl}, you can skip the challenge and buy it for ${fmtNum(pr)} renown. Spending renown doesn't lower your rank or level. You have ${fmtNum(free)} to spend.`);
}
