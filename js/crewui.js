'use strict';
/* =========================================================================
   Crew at a glance: what each crew member is doing right now, a job icon
   over their head, a detail card for the selected crew member (stats,
   traits, skills and what they do), and a full crew manifest.
   ========================================================================= */
const STATION_NAME = { piloting:'Helm', engines:'Engines', shields:'Shields', weapons:'Weapons' };
const SKILL_OF = { piloting:'pilot', engines:'engines', shields:'shields', weapons:'weapons' };
const SKILL_FX = {
  pilot:   ['+5% evasion at the helm','+7% evasion','+10% evasion'],
  engines: ['+5% evasion in Engines','+7% evasion','+10% evasion'],
  shields: ['Shields recharge 10% faster','20% faster','30% faster'],
  weapons: ['Weapons charge 10% faster','15% faster','20% faster'],
  repair:  ['Normal repair speed','Repairs 10% faster','Repairs 20% faster'],
  combat:  ['Normal melee damage','10% more melee damage','20% more melee damage'],
};
const JOB_COL = { fight:'#ff5a7a', repair:'#ffd166', fire:'#ff8a3d', breach:'#9fe8ff', heal:'#7be0a0', man:'#5fd3e6', move:'#c8ccd8', idle:'#8a95b8', mind:'#b48cff', board:'#ff9aa8', stun:'#5fd3e6' };

/* what is this crew member doing? { k, text, sys } */
function crewJob(c, sh){
  if(!sh) return { k:'idle', text:'Idle' };
  if(c.mcT>0) return { k:'mind', text:'Mind controlled!' };
  if(c.stunT>0) return { k:'stun', text:'Stunned' };
  const r = sh.rooms[c.room]; const sysName = r?.sys ? (SYSN[r.sys] || r.sys) : 'corridor';
  if(G && sh!==G.ship && c.owner==='p') { if(sh.crew.some(o=>o.room===c.room && crewSide(o)!==crewSide(c))) return { k:'fight', text:'Fighting aboard the enemy' }; return { k:'board', text:`Sabotaging ${sysName}` }; }
  if(c.path && c.path.length){ const dest = sh.cellRoom?.[c.tx+','+c.ty]; const dr = sh.rooms[dest]; return { k:'move', text:`Heading to ${dr?.sys ? (SYSN[dr.sys]||dr.sys) : 'a corridor'}` }; }
  if(sh.crew.some(o=>o.room===c.room && crewSide(o)!==crewSide(c))) return { k:'fight', text:`Fighting in ${sysName}` };
  if(r?.fire>0) return { k:'fire', text:`Putting out a fire in ${sysName}` };
  if(r?.breach>0) return { k:'breach', text:`Patching a breach in ${sysName}` };
  if(r?.sys && sh.systems[r.sys]?.dmg>0) return { k:'repair', text:`Repairing ${sysName}`, sys:r.sys };
  if(r?.sys==='medbay' && c.hp < c.maxHp && eff(sh,'medbay')>0) return { k:'heal', text:'Healing in the Medbay' };
  if(r?.sys && STATION_NAME[r.sys] && mannedCrew(sh, r.sys)===c) return { k:'man', text:`Manning ${STATION_NAME[r.sys]}`, sys:r.sys };
  return { k:'idle', text:`Standing by in ${sysName}` };
}
function drawJobIcon(x, y, job, s=8){
  const col = JOB_COL[job.k] || '#ffffff';
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fillStyle = 'rgba(8,12,24,.85)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = col; ctx.stroke();
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.2, s*.2); ctx.lineCap = 'round'; const u = s*.55;
  switch(job.k){
    case 'fight': ctx.beginPath(); ctx.moveTo(x-u, y+u); ctx.lineTo(x+u, y-u); ctx.moveTo(x+u, y+u); ctx.lineTo(x-u, y-u); ctx.stroke(); break;
    case 'repair': ctx.beginPath(); ctx.moveTo(x-u, y+u); ctx.lineTo(x+u*.3, y-u*.3); ctx.stroke(); ctx.beginPath(); ctx.arc(x+u*.45, y-u*.45, u*.45, 0, 7); ctx.stroke(); break;
    case 'fire': ctx.beginPath(); ctx.moveTo(x, y-u*1.1); ctx.quadraticCurveTo(x+u, y, x, y+u); ctx.quadraticCurveTo(x-u, y, x, y-u*1.1); ctx.fill(); break;
    case 'breach': ctx.beginPath(); ctx.moveTo(x-u, y); ctx.lineTo(x-u*.3, y-u*.6); ctx.lineTo(x+u*.2, y+u*.4); ctx.lineTo(x+u, y-u*.2); ctx.stroke(); break;
    case 'heal': ctx.fillRect(x-u*.25, y-u, u*.5, u*2); ctx.fillRect(x-u, y-u*.25, u*2, u*.5); break;
    case 'man': if(job.sys && typeof drawSysIcon==='function') drawSysIcon(ctx, job.sys, x, y, s*1.5, col); else { ctx.beginPath(); ctx.arc(x, y, u*.6, 0, 7); ctx.fill(); } break;
    case 'move': ctx.beginPath(); ctx.moveTo(x-u, y); ctx.lineTo(x+u, y); ctx.lineTo(x+u*.3, y-u*.6); ctx.moveTo(x+u, y); ctx.lineTo(x+u*.3, y+u*.6); ctx.stroke(); break;
    case 'mind': ctx.beginPath(); ctx.arc(x, y, u*.7, 0, 5); ctx.stroke(); break;
    case 'stun': T('z', x, y+1, { s:Math.round(s*1.4), f:FD, w:700, a:'center', b:'middle', c:col }); break;
    case 'board': ctx.beginPath(); ctx.moveTo(x-u, y+u*.6); ctx.lineTo(x, y-u); ctx.lineTo(x+u, y+u*.6); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.arc(x, y, u*.3, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function raceTraits(r){
  const t = [];
  const m = (v, n) => { if(v!=null && v!==1) t.push(`${n} ×${v}`); };
  m(r.repair, 'Repair'); m(r.combat, 'Combat'); m(r.speed, 'Speed');
  if(r.fireproof) t.push('Fireproof'); if(r.noAir) t.push('No air needed'); if(r.telepathic) t.push('Telepathic'); if(r.mindImmune) t.push('Mind-control immune');
  if(r.power) t.push('+1 power to their room'); if(r.deathBurst) t.push('Explodes on death'); if(r.learn && r.learn>1) t.push('Learns fast'); if(r.armor && r.armor<1) t.push(`Takes ${Math.round(r.armor*100)}% damage`);
  return t.length ? t.join(' · ') : 'No special traits';
}
function skillProgress(c, k){ const lv = skillLvl(c,k), t = SKILLT[k], v = c.sk[k]||0; return lv>=2 ? 1 : lv===1 ? (v-t[0])/(t[1]-t[0]) : v/t[0]; }

/* detail card for the selected crew member (flat and VR) */
function drawCrewCard(){
  const id = UI.selCrew; if(!id || !G || (UI.selCrews||[]).length>1) return;
  let c = null, sh = null; for(const s of [G.ship, G.enemy]) if(s){ const f = s.crew.find(o=>o.id===id); if(f){ c = f; sh = s; } }
  if(!c || c.drone) return;
  const race = DATA.races[c.race] || {}, job = crewJob(c, sh);
  const w = 440, h = 236, x = 24, y = 330;
  rr(x, y, w, h, 12); ctx.fillStyle = 'rgba(9,14,28,.95)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = C.amber; ctx.stroke();
  region(x, y, w, h, () => {});   // swallow clicks on the card itself
  drawPortrait(x+44, y+48, 30, c, false);
  T(c.name, x+86, y+36, { s:22, f:FD, w:700, max:w-140 });
  T(`${race.name||c.race} · ${pronouns(c)} · ${c.kills} kill${c.kills===1?'':'s'}`, x+86, y+58, { s:13, c:C.muted });
  btn(x+w-46, y+10, 34, 30, '×', () => { UI.selCrew = null; }, { s:16 });
  const fr = clamp(c.hp/c.maxHp, 0, 1); bar(x+86, y+68, w-110, 10, fr, fr>.5 ? C.good : fr>.25 ? C.warn : C.hostile); T(`${Math.ceil(c.hp)}/${c.maxHp} HP`, x+w-24, y+64, { s:12, a:'right', c:C.muted });
  drawJobIcon(x+24, y+100, job, 9); T(job.text, x+42, y+105, { s:15, c:JOB_COL[job.k] || C.ink, max:w-60 });
  const post = c.station!=null && sh.rooms[c.station] ? (SYSN[sh.rooms[c.station].sys] || 'a corridor') : 'none';
  T(`Post: ${post}`, x+16, y+128, { s:13, c:C.muted }); para(raceTraits(race), x+150, y+128, w-166, { s:12, lh:15, c:C.cyan, max:1 });
  SKILLS.forEach((k,i) => { const sx = x+16 + (i%3)*150, sy = y+146 + Math.floor(i/3)*32; const lv = skillLvl(c,k);
    T(SKILLN[k], sx, sy+12, { s:12, c:C.ink }); for(let p=0;p<2;p++){ ctx.beginPath(); ctx.arc(sx+92+p*12, sy+8, 4, 0, 7); ctx.fillStyle = p < lv ? C.amber : '#1d2742'; ctx.fill(); }
    bar(sx, sy+17, 128, 5, skillProgress(c,k), lv>=2 ? C.amber : lv===1 ? C.good : C.cyan);
    tip(sx-4, sy-2, 140, 28, `${SKILLN[k]} · ${['untrained','skilled','expert'][lv]}`, `${SKILL_FX[k][lv]}. ${lv<2 ? 'Keeps improving with practice.' : 'Fully trained.'}`); });
  if(sh===G.ship && controlled(c)){
    btn(x+16, y+h-34, 140, 26, 'Make this their post', () => { c.station = c.room; toast(`${c.name} will return to ${post==='none' ? 'this room' : SYSN[sh.rooms[c.room].sys] || 'this room'}.`); }, { s:11 });
    const med = roomOf(sh,'medbay'); if(med>=0) btn(x+166, y+h-34, 120, 26, 'To medbay', () => { orderMove(sh, c, med); c.manualT = 12; }, { s:11, disabled: c.room===med });
    btn(x+296, y+h-34, 128, 26, 'Back to post', () => { if(c.station!=null) orderMove(sh, c, c.station); }, { s:11, disabled: c.station==null || c.room===c.station });
  }
}
