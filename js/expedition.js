'use strict';
/* =========================================================================
   Expedition mode: a hub-and-spoke galaxy with no Rebuff Fleet chasing you.
   Picked in the hangar (Mode: Classic / Expedition). Classic is untouched.
   - No Fleet. Instead heat climbs a little every jump, and the Rebuff hunt
     you harder the hotter you run (hunters from 70, a blockade at 90, and
     a "death stack" of hunters everywhere near 100).
   - Haven's Rest is the hub. Every exit opens the galaxy chart: dock at home,
     then plot your next spoke. Near spokes are calm and cheap; Far ones are
     riskier and cost more fuel; Deep ones are dangerous, cost the most fuel
     and hold a Precursor key at their exit.
   - Three keys open the final assault early. Run out of time and the Last
     Stand comes anyway, but every key you hold weakens the Flaggship.
   ========================================================================= */
function expOn(){ return !!(typeof G!=='undefined' && G && G.expedition); }
function expAllowed(o){ return !(o && (o.daily || o.cup || o.challenge || o.seedDuel || o.practice || o.par)) && !(typeof CAMP!=='undefined' && CAMP) && !(typeof NET!=='undefined' && NET.on && NET.mode); }
(function(){ const n0 = newRun; newRun = function(id, name, o = {}){ n0(id, name, o);
  if(G && SET.runMode==='expedition' && expAllowed(o)){ G.expedition = { keys:0, trips:0, depth:'near', got:{} }; logEntry('Set out on an expedition from Haven\'s Rest.');
    setTimeout(() => { if(expOn()) toast('Expedition: no Fleet behind you. Heat rises as you go. Find three Precursor keys in Deep space, then strike the Flaggship.'); }, 1800); save(); } }; })();
(function(){ const f0 = fleetStep; fleetStep = function(){ return expOn() ? 0 : f0(); }; })();
const EXP_DEPTH = {
  near: { name:'Near', fuel:1, col:'#7be0a0', text:'Calm space close to home. Cheap to reach.' },
  far:  { name:'Far',  fuel:2, col:'#ffb547', text:'Riskier space. Half a Precursor key waits at its exit.' },
  deep: { name:'Deep', fuel:4, col:'#ff5a7a', text:'Dangerous, uncharted space. A whole Precursor key waits at its exit.' } };
function expSpokes(){ return withSeed(`exp${G.sector}`, () => { const types = Object.keys(DATA.sectors).filter(t => !DATA.sectors[t].final && !DATA.sectors[t].secret && t!=='civilian');
  const dang = t => ((DATA.sectors[t].mix || {}).combat || 0); shuffle(types); const sorted = types.slice().sort((a, b) => dang(a) - dang(b)), third = Math.max(1, Math.floor(sorted.length/3));
  const pickOf = arr => arr.length ? pick(arr) : pick(types);
  return [['near', pickOf(sorted.slice(0, third + 1))], ['far', pickOf(sorted.slice(third, 2*third + 1))], ['deep', pickOf(sorted.slice(2*third))]]; }); }
function expCanFinal(){ return G.expedition.keys >= 3 || G.sector + 1 >= R.sectors; }
function expGo(depth, type){ const D = EXP_DEPTH[depth]; if(G.fuel < D.fuel){ toast(`Plotting a ${D.name.toLowerCase()} course takes ${D.fuel} fuel.`); return; }
  G.fuel -= D.fuel; G.expedition.depth = depth; G.expedition.trips++; nextSector(type); }
function expFinal(){ G.expedition.depth = 'final'; nextSector('laststand'); }
/* the galaxy chart, shown at every exit instead of the two-route card */
function drawExpeditionChart(m){
  const E = G.expedition, f = mframe(1440, 820, 'Galaxy chart · the hub', '#9fdc7a'), cx = f.x + 32, W2 = f.w - 64;
  const keys = E.keys, full = Math.floor(keys), half = keys - full >= .5;
  T('Precursor keys', cx, f.y + 108, { s:18, f:FD, w:700, c:C.amber });
  for(let i = 0; i < 3; i++){ const x = cx + 190 + i*44, y = f.y + 100; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI/4); rr(-13, -13, 26, 26, 4); ctx.fillStyle = i < full ? C.amber : i===full && half ? hexA(C.amber, .45) : 'rgba(255,255,255,.06)'; ctx.fill(); ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
  T(`Trip ${E.trips + 1} · heat ${typeof heat==='function' ? heat() : 0} · fuel ${G.fuel}`, cx + W2, f.y + 108, { s:18, a:'right', c:C.ink });
  para(expCanFinal() && E.keys >= 3 ? 'Three keys. The Precursor gate to the Flaggship\'s route is open: strike now, or keep exploring to grow stronger.' : G.sector + 1 >= R.sectors ? `Time is up: the Flaggship moves on Fedoration command. Every key you hold weakens it (${full} of 3).` : 'Dock at Haven\'s Rest, then plot your next spoke. Deep space holds the Precursor keys; the further out, the more fuel it takes and the harder it gets.', cx, f.y + 150, W2, { s:16, lh:22, c:C.muted });
  const spokes = G.sector + 1 >= R.sectors ? [] : expSpokes(), cw = (W2 - 40) / 3, by = f.y + 220, ch = 380;
  spokes.forEach(([depth, t], i) => { const D = EXP_DEPTH[depth], sd = DATA.sectors[t], bx = cx + i*(cw + 20); if(!sd) return;
    rr(bx, by, cw, ch, 12); ctx.fillStyle = C.panel2 || C.panel; ctx.fill(); ctx.strokeStyle = D.col; ctx.lineWidth = 2; ctx.stroke();
    const art = typeof eventArt==='function' ? eventArt(sd.nebula > .3 ? 'nebula' : 'planet', t, Math.floor(cw), 90) : null; if(art){ ctx.save(); rr(bx, by, cw, 90, 12); ctx.clip(); ctx.drawImage(art, bx, by); ctx.restore(); }
    label(`${D.name} spoke`, bx + 18, by + 118, D.col, 'left', 15); T(sd.name, bx + 18, by + 150, { s:22, f:FD, w:700, c:sd.color || C.ink, max:cw - 36 });
    para(sd.blurb || '', bx + 18, by + 178, cw - 36, { s:14, lh:18, c:C.ink, max:2 }); para(D.text, bx + 18, by + 228, cw - 36, { s:14, lh:18, c:C.muted, max:2 });
    const mix = sd.mix || {}; T(`Fights ${mix.combat || 0}% · Events ${mix.event || 0}%`, bx + 18, by + 284, { s:13, c:C.muted });
    btn(bx + 16, by + ch - 64, cw - 32, 48, `Plot course · ${D.fuel} fuel`, () => expGo(depth, t), { fill:G.fuel >= D.fuel, col:D.col, s:16, disabled:G.fuel < D.fuel }); });
  if(expCanFinal()){ const fy = spokes.length ? f.y + f.h - 90 : by + 40; btn(spokes.length ? cx + W2/2 - 220 : cx, fy, spokes.length ? 440 : W2, 60, `Final assault: the Last Stand${E.keys < 3 ? ` (${full} key${full===1 ? '' : 's'})` : ''}`, () => expFinal(), { fill:true, col:C.hostile, s:18 }); }
  if(G.sector + 1 < R.sectors && typeof havenPerksOn==='function' && havenPerksOn()) btn(cx, f.y + f.h - 90, 320, 60, 'Dock at Haven\'s Rest', () => { const i = G.map.cur; havenArrive(G.map.nodes[i], i); G.havenVisit.fromExit = true; }, { col:'#9fdc7a', s:17 });
  btn(f.x + f.w - 232, f.y + f.h - 90, 200, 60, 'Stay here', () => { G.modal = null; });
}
/* keys at the exits of far and deep spokes; heat creeps up as you go */
function expArrive(node, first){ if(!expOn()) return; const E = G.expedition;
  if(first){ G.heat = Math.min(100, (G.heat || 0) + (E.depth==='deep' ? 3 : 2)); if(typeof syncHeatChip==='function') syncHeatChip(); }
  if(node.type==='exit' && !E.got[G.sector] && (E.depth==='deep' || E.depth==='far')){ E.got[G.sector] = 1; const add = E.depth==='deep' ? 1 : .5; E.keys = Math.min(3, E.keys + add);
    toast(add >= 1 ? `A Precursor key, humming in its cradle at the exit beacon. Keys: ${Math.floor(E.keys)} of 3.` : `Half a Precursor key, wedged in the exit beacon. Keys: ${E.keys} of 3.`); if(typeof sfx==='function') sfx('achieve'); }
  if(E.depth==='deep' && first) G.away = (G.away || 0) + .5;   // deep space wears on the crew
}
(function(){ if(typeof heatIntercept!=='function') return; const h0 = heatIntercept;
  heatIntercept = function(node, first){ const r = h0(node, first); if(r || !expOn() || !first || G.flag) return r;
    if(heat() >= 95 && ['event','combat','empty'].includes(node.type) && !node.quest && Math.random() < .3){ startCombat('rb_hunter', { hail:'hunter' }); if(G.enemy) G.enemy.hunter = true; toast('The death stack: Rebuff hunters are everywhere. Cool your heat.'); return true; }
    return false; }; })();
(function(){ if(typeof livingCombatStart!=='function') return; const l0 = livingCombatStart;
  livingCombatStart = function(e, def, o){ l0(e, def, o); if(expOn() && def && def.boss && !(o && o.phase) && G.expedition.keys >= 1){ const k = Math.floor(G.expedition.keys); e.hull = Math.max(8, e.hull - 3*k); if(k >= 2 && e.systems.shields) e.systems.shields.max = Math.max(0, e.systems.shields.max - 2); toast(`Your Precursor keys unlock the Flaggship's codes: it starts weakened (${k} key${k===1 ? '' : 's'}).`); } }; })();
function expeditionArrive(node, first){ expArrive(node, first); }
/* the hangar: pick the mode */
function drawModePicker(x, y){ if(typeof NET!=='undefined' && NET.on) return; if(typeof CAMP!=='undefined' && CAMP) return; const cur = SET.runMode==='expedition' ? 'expedition' : 'classic';
  label('Mode', x, y + 24, C.muted, 'left', 14);
  btn(x + 70, y, 150, 36, 'Classic', () => { SET.runMode = 'classic'; saveProfile(); }, { fill:cur==='classic', s:14 });
  btn(x + 230, y, 170, 36, 'Expedition', () => { SET.runMode = 'expedition'; saveProfile(); }, { fill:cur==='expedition', s:14, col:'#9fdc7a' });
  tip(x, y, 400, 36, 'Mode', 'Classic: the Rebuff Fleet chases you sector by sector. Expedition: no Fleet. Haven\'s Rest is your hub; pick near, far or deep spokes, gather three Precursor keys, and strike the Flaggship when you are ready. Heat is the danger.'); }
