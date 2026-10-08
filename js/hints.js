'use strict';
/* =========================================================================
   Captain's hints: short, contextual tips that appear the first time each
   mechanic matters, instead of one long tutorial. Each hint shows once per
   profile, can point at the part of the screen it talks about, and pauses
   combat while you read it. Turn them off or reset them in Settings.
   ========================================================================= */
const RECT = {
  map:[1256,26,108,54], ship:[1364,26,100,54], pause:[1466,26,112,54],
  power:[40,654,886,322], armory:[940,654,622,322], roster:[22,570,780,70], hull:[14,6,370,36], shields:[14,44,200,30],
  ftl:[1090,18,160,52], doors:[748,700,160,180]
};
function roomRect(sh, sys){ if(!sh || !sh._rects) return null; const i = roomOf(sh, sys); const q = sh._rects[i]; return q ? [q.x, q.y, q.w, q.h] : null; }
const HINTS = {
  welcome:   { title:'Welcome aboard, Captain', text:'Your goal: cross 8 sectors, staying ahead of the Rebuff Fleet, then defeat the Flaggship. Each jump uses 1 fuel. Press Map (or M) to choose your first beacon.', at:()=>RECT.map },
  vr:        { title:'You\'re on the bridge', text:'Playing seated or lying down? Pause (A) and pick your play position, or choose it in Settings. Walk with the left stick, or aim at the floor and pull the trigger to teleport. Right stick turns. Look at a controller to see what its buttons do. Click the left stick to toggle the magnifier over this console.' },
  interior:  { title:'Your ship is behind you', text:'Walk through the door at the back of the bridge to go down the corridor into your ship. You\'ll see your crew at work. Point at crew and pull the trigger to select them, point at a floor to send them there, and point at doors to open or close them. During fights you can beam over to the enemy ship from your teleporter.' },
  jumpdmg:   { title:'Damage comes with you', text:'Fires, breaches and intruders don\'t stay behind when you jump. Deal with them first unless you\'re fleeing.', at:()=>RECT.map },
  map:       { title:'Reading the map', text:'Beacons are linked by lanes; you can only jump along them. STORE beacons sell repairs and gear. The red edge on the left is the Rebuff Fleet: it advances every jump, so explore what you can but keep heading for EXIT.' },
  combat:    { title:'Battle stations (game paused)', text:'Click a weapon below, then click a room on the enemy ship. Hit their SHIELDS room first: while their shields are up, most of your shots get blocked. Press Space to pause any time.', at:()=>roomRect(G.enemy,'shields') || RECT.armory, pause:true },
  notarget:  { title:'Your guns are idle', text:'Your weapons are charged but have no target. Select a weapon, then click an enemy room. Targets stay set, so weapons keep firing on their own.', at:()=>RECT.armory, pause:true },
  volley:    { title:'Fire together', text:'Each enemy shield layer blocks one shot, then recharges. Press "Hold fire" (V), let all your weapons charge, then release them together so the later shots get through.', at:()=>RECT.armory },
  missile:   { title:'Missiles ignore shields', text:'Missiles fly straight through shields but use 1 missile each, and you only get more from stores and loot. Save them for shields, weapons or a tough fight.' },
  beam:      { title:'Beams need bare hulls', text:'Beams are stopped completely while shields are up and lose 1 damage per layer. Knock the shields down first, then sweep the beam across several rooms.' },
  power:     { title:'Spare reactor power', text:'You have unused reactor power. Use + and - under each system to move power around. More engine power means more dodging; more shields need 2 power per layer.', at:()=>RECT.power },
  fire:      { title:'Fire aboard!', text:'Fire spreads, burns crew and wrecks systems. Crew put it out by standing in the room. Or open the doors and an airlock to vent the air: no air, no fire.', at:()=>RECT.doors, pause:true },
  breach:    { title:'Hull breach', text:'A breach drains the room\'s air. Send crew (or let the autopilot) to patch it before oxygen runs out.' },
  boarders:  { title:'Intruders!', text:'Enemy crew teleported aboard. Fight them with 2 or more of your crew in the same room, or open doors to space to suffocate them (move your crew out first). Hurt crew should retreat to the Medbay.', at:()=>RECT.roster, pause:true },
  o2:        { title:'Running out of air', text:'Crew lose health fast in rooms below 5% oxygen. Keep the Oxygen system powered and repair it first if it\'s hit.', at:()=>roomRect(G.ship,'oxygen'), pause:true },
  mind:      { title:'Mind control!', text:'One of your crew is under enemy control (purple swirl). They\'ll turn on their mates until it wears off in a few seconds; your other crew will restrain them without killing them. Move other crew away or wait it out.' },
  medbay:    { title:'Wounded crew', text:'Crew heal in the Medbay while it\'s powered. Select them and click the Medbay, or leave the crew autopilot on and they\'ll go by themselves.', at:()=>roomRect(G.ship,'medbay') },
  outgunned: { title:'Their shields are too strong', text:'Your guns can\'t fire enough shots at once to get through. Use missiles or bombs on their Shields room, jump away when the drive is charged, and buy another weapon or upgrade Weapons power at the next store.', at:()=>RECT.armory },
  flee:      { title:'You can run', text:'Your VTL drive is charged. If a fight is going badly, open the Map and jump away. It costs fuel, and the enemy keeps its loot, but you keep your ship.', at:()=>RECT.map },
  upgrade:   { title:'Spend that scrap', text:'Scrap buys upgrades anywhere. Open Ship (C) > Systems. A second shield layer (Shields to 4) is the single best early upgrade, then engines and reactor power.', at:()=>RECT.ship },
  store:     { title:'At a store', text:'Good buys, in order: hull repairs if you\'re below about two thirds, fuel up to 6-8, then a weapon that fits your power. Keep some scrap for the next store.' },
  event:     { title:'Choices matter', text:'Some choices risk crew or hull. Options in blue need a particular crew race, system or weapon, and are usually the safest or best outcome.' },
  surrender: { title:'They\'re surrendering', text:'Accepting gives a guaranteed reward now. Refusing lets you keep fighting for the normal (usually bigger) salvage, if you can finish the job.' },
  fleet:     { title:'The fleet is close', text:'The Rebuff Fleet is one jump behind. Beacons it has reached mean a hard fight. Head right towards the EXIT now.' },
  fuel:      { title:'Fuel is low', text:'Each jump burns 1 fuel. Buy fuel at stores (3 scrap each) and pick up loot. Run dry and you\'re stuck waiting for the fleet.' },
  shields2:  { title:'Only one shield layer', text:'Enemies from here on fire several shots at once. Upgrade Shields to 4 (two layers) soon: open Ship (C) > Systems.', at:()=>RECT.ship },
  skills:    { title:'Crew learn on the job', text:'Crew who stay on a station (Helm, Engines, Shields, Weapons) gain skill and boost it. Use "Stations" to send everyone back to their posts.' },
  hull:      { title:'Hull is getting low', text:'Hull repairs cost a few scrap each at stores, and quiet beacons sometimes let your crew patch it. Avoid optional fights until you\'ve repaired.', at:()=>RECT.hull },
  sector:    { title:'New sector', text:'Each sector is a little harder. Visit stores to repair and upgrade, and take blue options when you can.' },
  flagship:  { title:'The final sector', text:'The Flaggship is heading for Fedoration command. It has 3 phases: boarders, then drones with a super shield, then power surges. Arrive repaired, with missiles and fuel. You have to beat it three times.' },
};
function hintsOn(){ return SET.hints !== false; }
function hint(id, force){
  if(!G || UI.screen!=='game' || !HINTS[id]) return false;
  if(!force && (!hintsOn() || (PROFILE.hintsSeen||{})[id])) return false;
  UI.hintQ = UI.hintQ || [];
  if((UI.hint && UI.hint.id===id) || UI.hintQ.includes(id)) return false;
  UI.hintQ.push(id); return true;
}
function showNextHint(){
  if(UI.hint || !UI.hintQ || !UI.hintQ.length || !G) return;
  if(G.warp>0) return;
  const id = UI.hintQ.shift(); const H_ = HINTS[id];
  UI.hint = { id, t:0, paused:false };
  if(H_.pause && G.enemy && !G.enemy.dead && !G.paused && !G.modal){ G.paused = true; UI.hint.paused = true; }
  (PROFILE.hintsSeen = PROFILE.hintsSeen || {})[id] = 1; saveProfile();
}
function closeHint(all){
  if(!UI.hint) return; if(UI.hint.paused && G) G.paused = false;
  UI.hint = null; if(all){ SET.hints = false; saveProfile(); UI.hintQ = []; toast('Hints turned off. Turn them back on in Settings.'); }
}
/* watch the game state for hint triggers (cheap checks, run a few times a second) */
let hintT = 0;
function checkHints(dt){
  if(!G || UI.screen!=='game' || !hintsOn()) { if(UI.hint && !G) UI.hint = null; return; }
  if(UI.hint) UI.hint.t += dt;
  if((hintT -= dt) > 0) { showNextHint(); return; } hintT = .4;
  const s = G.ship, e = G.enemy && !G.enemy.dead ? G.enemy : null, m = G.modal;
  if(!m && G.stats.jumps===0 && !G.enemy) hint('welcome');
  if(m?.type==='map'){ hint('map'); if(s.rooms.some(r=>r.fire>0 || r.breach>0) || s.crew.some(c=>crewSide(c)!=='p')) hint('jumpdmg'); }
  if(typeof inXR==='function' && inXR()){ hint('vr'); if(SET.shipMode!=='classic' && UI.hintQ && !UI.hintQ.includes('vr') && UI.hint?.id!=='vr') hint('interior'); }
  if(m?.type==='store'){ hint('store'); if(s.hull < s.maxHull*.6) hint('hull'); }
  if(m?.type==='event') hint('event');
  if(m?.type==='surrender') hint('surrender');
  if(e && !m){
    hint('combat');
    if(G.combatT > 6 && s.weapons.some(w => w.on && w.target==null && w.charge >= (DATA.weapons[w.id]?.charge||1)*.99 && !DATA.weapons[w.id]?.heal)) hint('notarget');
    if(G.combatT > 20 && e.shield>0 && s.weapons.filter(w=>w.on && ['laser','ion','flak'].includes(DATA.weapons[w.id]?.type)).length > 1) hint('volley');
    if(s.weapons.some(w=>w.on && DATA.weapons[w.id]?.type==='missile')) hint('missile');
    if(s.weapons.some(w=>w.on && DATA.weapons[w.id]?.type==='beam')) hint('beam');
    if(G.combatT > 25){ const shots = s.weapons.filter(w=>w.on).reduce((t,w)=>{ const d = DATA.weapons[w.id]; return t + (!d || d.heal ? 0 : ['missile','bomb','beam'].includes(d.type) ? 9 : (d.shots||1)); }, 0); if(shots>0 && shots <= e.shield && e.hull===e.maxHull) hint('outgunned'); }
    if(G.ftl>=1 && s.hull < s.maxHull*.5 && e.hull > e.maxHull*.5) hint('flee');
  }
  if(!m){
    if(s.rooms.some(r=>r.fire>0)) hint('fire');
    if(s.rooms.some(r=>r.breach>0)) hint('breach');
    if(s.crew.some(c=>crewSide(c)!=='p' && c.owner==='e' && !c.drone)) hint('boarders');
    if(s.crew.some(c=>c.owner==='p' && !c.drone && c.hp < c.maxHp*.45) && s.systems.medbay) hint('medbay');
    if(s.crew.some(c=>c.owner==='p' && c.mcT>0)) hint('mind');
    if(G.stats.jumps>=1 && reactorFree(s) > 0 && Object.values(s.systems).some(y => y.power < y.max - y.dmg)) hint('power');
    if(!e && G.stats.kills>=1){ const sh = s.systems.shields; if(sh && sh.max < 8 && G.scrap >= upgradeCost('shields', sh.max)) hint('upgrade'); hint('skills'); }
    if(s.hull < s.maxHull*.4) hint('hull');
    if(G.fuel <= 3) hint('fuel');
    if(G.sector>=2 && !e) hint('sector');
    if(G.sector>=2 && (s.systems.shields?.max||0) < 4 && !e) hint('shields2');
    if(G.sector>=R.sectors && !e) hint('flagship');
    const cur = G.map?.nodes?.[G.map.cur]; if(cur && !e && cur.x - G.fleetX < R.fleetSpeed*1.6 && cur.type!=='base' && G.sector < R.sectors) hint('fleet');
  }
  showNextHint();
}
function drawHint(){
  const h = UI.hint; if(!h || UI.screen!=='game') return; const H_ = HINTS[h.id]; if(!H_) { UI.hint = null; return; }
  const a = Math.min(1, h.t*4);
  // highlight what the hint talks about
  const at = H_.at && H_.at();
  if(at && !G.modal){ const [x,y,w,hh] = at; const pulse = .5 + .5*Math.sin(performance.now()/180);
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.cyan; ctx.lineWidth = 3 + pulse*2; ctx.setLineDash([12,8]); ctx.lineDashOffset = -performance.now()/40; rr(x-6, y-6, w+12, hh+12, 10); ctx.stroke(); ctx.setLineDash([]); glow(x+w/2, y+hh/2, Math.max(w,hh)*.7, C.cyan, .12*pulse); ctx.restore(); }
  const side = at && !G.modal && at[1] < 560 ? (at[0] + at[2]/2 > W/2 ? -1 : 1) : 0;
  const bw = side ? 700 : 820; ctx.font = `400 20px ${FM}`; const L = lines(H_.text, bw-280, `400 20px ${FM}`);
  const bh = 92 + L.length*27; const bx = side<0 ? 40 : side>0 ? W - bw - 40 : W/2 - bw/2; const by = G.modal ? H - bh - 20 : 96;
  ctx.save(); ctx.globalAlpha = a;
  rr(bx, by, bw, bh, 12); ctx.fillStyle = 'rgba(10,22,40,.97)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.cyan; ctx.stroke();
  ctx.beginPath(); ctx.arc(bx+44, by+46, 24, 0, 7); ctx.fillStyle = hexA(C.cyan,.18); ctx.fill(); ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.stroke();
  T('?', bx+44, by+47, { s:30, f:FD, w:700, a:'center', b:'middle', c:C.cyan });
  label('Captain\'s tip', bx+86, by+32, C.cyan, 'left', 14);
  T(H_.title, bx+86, by+62, { s:24, f:FD, w:700 });
  L.forEach((l,i) => T(l, bx+86, by+94 + i*27, { s:20, c:C.ink }));
  ctx.restore();
  btn(bx+bw-170, by+16, 150, 46, h.paused ? 'Got it · resume' : 'Got it', () => closeHint(false), { s:16, fill:true, col:C.cyan });
  btn(bx+bw-170, by+bh-52, 150, 38, 'No more tips', () => closeHint(true), { s:13 });
}
