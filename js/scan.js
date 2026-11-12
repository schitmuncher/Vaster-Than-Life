'use strict';
/* =========================================================================
   Ship scans. When a ship turns up, the contact card says what it actually
   is: how tough it is, what it shoots, what tricks it has, a rough threat
   rating against your own ship, and what to watch for. The same scan is on
   hails (a strip over the picture) and in a fight (tap the enemy's name).
   ========================================================================= */
const SCAN_WTYPE = {
  laser:['Laser', 'stopped by shields'], flak:['Flak', 'a spray of shots that strips shields'], missile:['Missile', 'goes straight through shields'],
  bomb:['Bomb', 'teleports past shields into a room'], beam:['Beam', 'cuts across rooms; shields weaken it'], ion:['Ion', 'drains shields and systems'] };
const SCAN_SPECIAL = { teleporter:'Teleporter', cloaking:'Cloak', hacking:'Hacking', mindcontrol:'Mind control', drones:'Drones', clonebay:'Clone bay', battery:'Battery' };
function scanWeps(sh){ return (sh.weapons || []).map(w => Object.assign({ id:w.id }, DATA.weapons[w.id] || {})).filter(d => d.name); }
/* rough hull damage per second from one ship's guns and drones against another */
function scanDps(from, to){ const L = shieldLayers(to), ev = 1 - Math.min(60, evasion(to))/100; let shots = 0, dmgSum = 0, volleys = 0, pierce = 0, beam = 0;
  for(const d of scanWeps(from)){ const per10 = 10/Math.max(2, d.charge || 10), n = d.shots || 1, dm = d.damage || 0;
    if(d.type==='missile' || d.type==='bomb') pierce += n*dm*per10;
    else if(d.type==='beam') beam += Math.max(0, dm - L)*1.5*per10;
    else if(d.type==='ion') { shots += n*per10; volleys = Math.max(volleys, per10); }
    else { shots += n*per10; dmgSum += n*dm*per10; volleys = Math.max(volleys, per10); } }
  for(const dr of (from.drones || [])){ const d = DATA.drones[dr.id || dr] || {}; if(d.kind==='attack' && d.shot){ const per10 = 10/(d.rate || 4); if(d.shot.type==='beam') beam += Math.max(0, (d.shot.damage||1) - L)*per10; else { shots += per10; dmgSum += (d.shot.type==='ion' ? 0 : (d.shot.damage||1))*per10; } } }
  const avg = shots ? dmgSum/shots : 0, through = Math.max(0, shots - L*Math.max(1, volleys))*avg;
  return (through*ev + pierce*ev + beam*ev)/10; }
function scanReport(e){ const me = G.ship, L = shieldLayers(e), myL = shieldLayers(me), ws = scanWeps(e), mine = scanWeps(me);
  const yours = scanDps(me, e), theirs = scanDps(e, me);
  const tThem = yours > 0 ? e.hull/yours : Infinity, tYou = theirs > 0 ? me.hull/theirs : Infinity, r = tYou/tThem;
  let threat;
  if(e.boss) threat = ['The big one', C.hostile];
  else if(!isFinite(tThem) && isFinite(tYou)) threat = ['You can\'t hurt it yet', C.hostile];
  else if(!isFinite(tYou)) threat = ['Harmless', C.good];
  else threat = r >= 3 ? ['Easy prey', C.good] : r >= 1.6 ? ['In your favour', C.good] : r >= .9 ? ['Even fight', C.warn] : r >= .45 ? ['Dangerous', C.hostile] : ['Run for it', C.hostile];
  const sys = Object.keys(e.systems || {}), specials = sys.filter(k => SCAN_SPECIAL[k]).map(k => SCAN_SPECIAL[k]);
  const crew = {}; for(const c of (e.crew || [])) if(!c.drone){ const n = (DATA.races[c.race] || {}).name || c.race; crew[n] = (crew[n] || 0) + 1; }
  const crewTxt = e.auto ? 'None: automated' : Object.entries(crew).map(([n, k]) => `${k} ${n}`).join(', ') || 'None';
  const types = new Set(ws.map(d => d.type)), myTypes = new Set(mine.map(d => d.type)), tips = [];
  if(!isFinite(tThem) && L > 0) tips.push(`Your lasers can't get past ${L} shield layer${L > 1 ? 's' : ''} on their own. Fire everything at once, or put a missile into its Shields room first.`);
  else if(L > 0 && (myTypes.has('laser') || myTypes.has('flak'))) tips.push(`It has ${L} shield layer${L > 1 ? 's' : ''}: fire your guns together, so the first shots pop the shield and the rest land.`);
  if(types.has('missile') || types.has('bomb')) tips.push('Its missiles and bombs ignore your shields. Keep the engines powered and a pilot at the helm to dodge them.');
  if(types.has('ion')) tips.push('Ion shots will knock your shields down. Hit its Weapons room early.');
  if(types.has('beam')) tips.push(`Its beam is weak against shields${myL ? ': keep yours powered' : ', and you have none up'}.`);
  if(sys.includes('teleporter')) tips.push('It has a teleporter: expect boarders. Keep a couple of crew free and use the doors to starve them of air.');
  if(sys.includes('cloaking')) tips.push('It can cloak. Hold your volley until it reappears.');
  if(sys.includes('hacking')) tips.push('It can hack one of your systems for a while.');
  if(sys.includes('mindcontrol')) tips.push('It can turn one of your crew against you for a bit.');
  for(const dr of (e.drones || [])){ const d = DATA.drones[dr.id || dr]; if(d && d.kind==='defense'){ tips.push(`Its ${d.name} shoots down missiles. Save them, or fire lasers first.`); break; } }
  if(e.hull <= 8 && !e.boss) tips.push('Thin hull: one good volley could finish it.');
  if(e.elite) tips.push('Veteran crew: tougher and quicker, but better salvage.');
  if(e.fleet) tips.push('Part of the Mandate Fleet chasing you. Jump away as soon as you can.');
  if(!e.boss && isFinite(tYou) && r < .9 && !sys.includes('teleporter')) tips.push('Aim at its Weapons room first to slow the damage, or charge the jump drive and leave.');
  const weps = ws.map(d => { const t = SCAN_WTYPE[d.type] || [d.type, '']; return { name:d.name, kind:t[0], note:t[1], line:`${d.shots > 1 ? d.shots + ' × ' : ''}${d.damage} dmg every ${Math.round(d.charge || 10)}s` }; });
  for(const dr of (e.drones || [])){ const d = DATA.drones[dr.id || dr]; if(d) weps.push({ name:d.name, kind:'Drone', note:d.kind==='defense' ? 'shoots down incoming fire' : d.kind==='anti' ? 'hunts drones' : 'flies round and shoots', line:'' }); }
  return { threat, why: isFinite(tThem) || isFinite(tYou) ? `Rough guess: your guns take its hull down in about ${isFinite(tThem) ? Math.round(tThem) + 's' : 'never'}; its guns take yours in about ${isFinite(tYou) ? Math.round(tYou) + 's' : 'never'}.` : '',
    hull:`${e.hull}/${e.maxHull}`, shields: L ? `${L} layer${L > 1 ? 's' : ''}${e.super > 0 ? ' + ' + e.super + ' super' : ''}` : (e.super > 0 ? `${e.super} super` : 'None'), evade:`${evasion(e)}%`, crew:crewTxt, specials, weps, tips:tips.slice(0, 4) }; }

function scanSub(e){ const d = DATA.enemies && Object.values(DATA.enemies).find(x => x.name && e.name.includes(x.name)); return d ? d.name : ''; }
/* the scan itself; returns its height */
function drawScanBody(x, y, w, e){ const R = scanReport(e), y0 = y, half = Math.floor(w*.56);
  // left: name, threat, the numbers
  T(e.name, x, y + 26, { s:26, f:FD, w:700, c: e.elite ? C.warn : C.hostile, max:half - 10 });
  ctx.font = `700 15px ${FD}`; const tw = ctx.measureText(R.threat[0].toUpperCase()).width + 28; rr(x, y + 42, tw, 30, 15); ctx.fillStyle = hexA(R.threat[1], .18); ctx.fill(); ctx.strokeStyle = R.threat[1]; ctx.lineWidth = 1.5; ctx.stroke();
  T(R.threat[0].toUpperCase(), x + tw/2, y + 62, { s:15, f:FD, w:700, a:'center', c:R.threat[1], ls:1 });
  tip(x, y + 42, tw, 30, 'Threat', 'A rough guess from both ships\' guns, shields, dodging and hull. Crew, drones you can\'t see and luck all change it.');
  if(R.why) para(R.why, x + tw + 14, y + 54, half - tw - 24, { s:13, lh:17, c:C.muted, max:2 });
  let yy = y + 104; const cols = [['HULL', R.hull], ['SHIELDS', R.shields], ['EVADE', R.evade]], cw = (half - 10)/3;
  cols.forEach(([k, v], i) => { label(k, x + i*cw, yy, C.muted, 'left', 12); T(v, x + i*cw, yy + 24, { s:19, f:FD, w:700, c: k==='SHIELDS' ? C.cyan : C.ink, max:cw - 8 }); });
  yy += 54; label('CREW', x, yy, C.muted, 'left', 12); T(R.crew, x + 70, yy, { s:16, c:C.ink, max:half - 80 });
  if(R.specials.length){ yy += 28; label('KIT', x, yy, C.muted, 'left', 12); T(R.specials.join(' · '), x + 70, yy, { s:16, c:C.warn, max:half - 80 }); }
  // right: the ship and its guns
  const rx = x + half + 10, rw = w - half - 10;
  if(e._art && e._art.c){ const a = e._art.c, sc = Math.min(rw/a.width, 120/a.height), aw = a.width*sc, ah = a.height*sc; ctx.drawImage(a, rx + (rw - aw)/2, y + (120 - ah)/2, aw, ah); }
  let wy = y + 140; label('WEAPONS', rx, wy, C.muted, 'left', 12); wy += 8;
  if(!R.weps.length){ T('None that you can see.', rx, wy + 20, { s:16, c:C.muted }); wy += 28; }
  for(const wp of R.weps.slice(0, 5)){ T(wp.name, rx, wy + 20, { s:16, w:600, c:C.ink, max:rw*.55 }); T(`${wp.kind}${wp.line ? ' · ' + wp.line : ''}`, rx + rw, wy + 20, { s:13, a:'right', c:C.hostile, max:rw*.45 });
    T(wp.note, rx, wy + 38, { s:12, c:C.muted, max:rw }); wy += 44; }
  yy = Math.max(yy + 26, wy + 6);
  // what to watch for
  if(R.tips.length){ ctx.fillStyle = hexA(C.line, .8); ctx.fillRect(x, yy, w, 1); yy += 26; label('WATCH FOR', x, yy, C.amber, 'left', 12); yy += 10;
    for(const t of R.tips){ const h = para('• ' + t, x, yy + 18, w, { s:15, lh:20, c:C.ink }); yy += Math.max(22, h) + 6; } }
  return yy - y0; }
function scanHeight(e){ const R = scanReport(e); let h = 104 + 54 + (R.specials.length ? 28 : 0) + 26; const wh = 148 + Math.max(1, Math.min(5, R.weps.length))*44 + 6; h = Math.max(h, wh);
  if(R.tips.length){ h += 36; ctx.font = `400 15px ${FM}`; for(const t of R.tips) h += Math.max(22, lines('• ' + t, 1080, `400 15px ${FM}`).length*20) + 6; } return h; }

/* the contact card */
function drawContact(m){ const e = G.enemy, w = 1180, txt = m.text || '';
  const th = lines(txt, w - 64, `400 18px ${FM}`).length*26, h = clamp(84 + scanHeight(e) + 32 + th + 110, 420, 980);
  const f = mframe(w, h, m.title || 'Hostile contact', C.hostile, m);
  const bh = drawScanBody(f.x + 32, f.y + 84, f.w - 64, e);
  para(txt, f.x + 32, f.y + 84 + bh + 34, f.w - 64, { s:18, lh:26, c:C.ink });
  btn(f.x + f.w - 332, f.y + f.h - 86, 300, 60, m.btn || 'Battle stations', () => { G.modal = null; if(m.then) m.then(); }, { fill:true });
  T('You can see this again any time: tap the enemy\'s name.', f.x + 32, f.y + f.h - 50, { s:13, c:C.muted }); }
/* the same scan over a fight or a hail */
function drawScanOverlay(m){ const e = G && G.enemy, close = () => { G.modal = m.back || null; }; if(!e){ close(); return; } const w = 1180, h = clamp(84 + scanHeight(e) + 110, 420, 980);
  const f = mframe(w, h, 'Sensor scan', C.cyan, null); region(0, 0, W, H, close, 'scanbg'); region(f.x, f.y, f.w, f.h, () => {}, 'scanbox');
  drawScanBody(f.x + 32, f.y + 84, f.w - 64, e);
  btn(f.x + f.w - 252, f.y + f.h - 86, 220, 60, 'Close', close, { fill:true }); }
function openScan(){ if(!G || !G.enemy || (G.modal && G.modal.type==='scan')) return; G.modal = { type:'scan', back:G.modal || null }; }
/* a one-line summary for hails */
function drawScanStrip(x, y, w, e){ const R = scanReport(e), bits = [`Hull ${e.hull}`, `Shields ${R.shields}`, `Evade ${R.evade}`, R.weps.filter(x => x.kind!=='Drone').map(x => x.kind).join(', ') || 'unarmed', ...R.specials];
  ctx.font = `700 14px ${FD}`; const tw = ctx.measureText(R.threat[0].toUpperCase()).width + 24, txt = bits.join(' · ');
  rr(x, y, w, 40, 10); ctx.fillStyle = 'rgba(6,9,18,.86)'; ctx.fill(); ctx.strokeStyle = hexA(R.threat[1], .7); ctx.lineWidth = 1.5; ctx.stroke();
  rr(x + 8, y + 7, tw, 26, 13); ctx.fillStyle = hexA(R.threat[1], .2); ctx.fill(); T(R.threat[0].toUpperCase(), x + 8 + tw/2, y + 25, { s:14, f:FD, w:700, a:'center', c:R.threat[1] });
  T(txt, x + tw + 20, y + 26, { s:15, c:C.ink, max:w - tw - 150 });
  btn(x + w - 118, y + 5, 110, 30, '📡 Scan', openScan, { s:13, col:C.cyan }); }

(function(){
  if(typeof drawModal==='function'){ const d0 = drawModal; drawModal = function(...a){ const m = G && G.modal;
    if(m && m.type==='scan'){ try{ drawScanOverlay(m); }catch(err){ G.modal = m.back || null; } return; }
    if(m && m.type==='msg' && m.scan && G.enemy){ try{ drawContact(m); }catch(err){ m.scan = false; return d0(...a); } }
    else { const r = d0(...a);
      try{ if(m && m.type==='event' && m.combat && G.enemy && UI.modalRect){ const fx = UI.modalRect.x + 8, fy = UI.modalRect.y + 8, fw = UI.modalRect.w - 16, K = readScale(), AH = K > 1 ? 84 : 150;
        drawScanStrip(fx + 40, fy + 84 + AH - 48, Math.min(fw - 80, 820), G.enemy); } }catch(err){}
      return r; } }; }
  // tap the enemy's name in a fight to scan it
  if(typeof drawEnemyStrip==='function'){ const s0 = drawEnemyStrip; drawEnemyStrip = function(...a){ const r = s0(...a);
    try{ const e = G.enemy, x = 816, y = 572; if(e && !G.modal){ ctx.font = `700 19px ${FD}`; const nw = Math.min(560, ctx.measureText(e.name).width);
      T('📡', x + 26 + nw, y + 28, { s:15 }); region(x, y + 6, nw + 50, 30, openScan, 'scan'); tip(x, y + 6, nw + 50, 30, 'Sensor scan', 'Tap for what this ship has: shields, guns, tricks and a rough threat rating.'); } }catch(err){}
    return r; }; }
})();
