'use strict';
/* =========================================================================
   The crew screen: tap Crew (top bar), or tap someone in the crew row twice,
   and everything about them is on one page.
     - who they are, their level and what the next level brings
     - health, food, damage, repair and speed, with where each comes from
     - their class: pick a ready-made one (Assault, Medic, Engineer, Breacher,
       Marksman, Tank), or save their current set-up as your own class and
       apply it to anyone in one tap
     - every slot (weapons, attachments, armour, grenades, perks, abilities)
       is a card: tap it to see every option, with what it does and when it
       unlocks
   Crew levels now make people better at their jobs: each level adds health,
   damage and repair speed, so a veteran is visibly tougher than a recruit.
   Prestige keeps a permanent edge and opens a wildcard perk slot.
   ========================================================================= */

/* ---------------- what levels and prestige give ---------------- */
function loBonus(c){ const L = loLvl(c), P = (c && c.pres) || 0;
  return { hp:(L - 1) + 5*P, dmg:.006*(L - 1), rep:.01*(L - 1), pdmg:.03*P }; }
/* level health is kept in c.lvlHp, so it can be given and taken back exactly (prestige resets the level part) */
function loSyncHp(c){ if(!c || c.drone || c.owner!=='p') return; if(c.lvlHp == null) c.lvlHp = 3*((c && c.pres) || 0);   // older saves: prestige used to add 3 straight on
  const want = loBonus(c).hp, d = want - c.lvlHp; if(!d) return; c.lvlHp = want; c.maxHp += d; c.hp = d > 0 ? c.hp + d : Math.min(c.hp, c.maxHp); }
(function(){
  const m0 = armMult; armMult = function(c){ const m = m0(c); return c && c.owner==='p' && !c.drone ? m * (1 + loBonus(c).dmg) : m; };
  const r0 = armRepair; armRepair = function(c){ const r = r0(c); return c && c.owner==='p' && !c.drone ? r * (1 + loBonus(c).rep) : r; };
  if(typeof armsTick==='function'){ const a0 = armsTick; armsTick = function(sh, dt){ a0(sh, dt); if(sh) for(const c of sh.crew) if(c.owner==='p' && !c.drone && c.lvlHp !== loBonus(c).hp) loSyncHp(c); }; }
})();
function loNextUnlock(c){ const L = loLvl(c); if(L >= LO_MAXL) return (c.pres || 0) < 10 ? 'Prestige is ready' : 'Fully prestiged';
  const n = L + 1, out = [];
  for(const [k, v] of Object.entries(LO_UNLOCK)) if(v===n) out.push({ lethal:'lethal grenades', secondary:'a secondary weapon', perk1:'perk slot 1', tactical:'tactical grenades', perk2:'perk slot 2', perk3:'perk slot 3' }[k]);
  for(const g of Object.values(LO_LETHAL)) if(g.lvl===n && n > LO_UNLOCK.lethal) out.push(g.name); for(const g of Object.values(LO_TACT)) if(g.lvl===n && n > LO_UNLOCK.tactical) out.push(g.name);
  if(LO_ABIL_L.includes(n)) out.push('an ability'); if(n===LO_MAXL) out.push('prestige');
  return `Level ${n}: +1 health, more damage and repair speed${out.length ? ', ' + out.join(', ') : ''}`; }

/* ---------------- classes ---------------- */
const LO_PRESETS = [
  { id:'assault',  name:'Assault',  prim:'ar',       sec:'pistol',   perks:['scavenger','stopping','steady'],   lethal:'frag',    tactical:'flash',  abil:['war_cry','second_wind','breacher','juggernaut'], text:'A rifle, a pistol and more damage. Good at everything.' },
  { id:'medic',    name:'Medic',    prim:'smg',      sec:'pistol',   perks:['medic','hardened','mask'],         lethal:'frag',    tactical:'stim',   abil:['surgeon','second_wind','last_stand','sprinter'], text:'Keeps everyone in the room alive.' },
  { id:'engineer', name:'Engineer', prim:'smg',      sec:'melee',    perks:['engineer','hardened','silence'],   lethal:'fire',    tactical:'smoke',  abil:['quartermaster','second_wind','juggernaut','last_stand'], text:'Fast repairs and firefighting, and hard to kill while doing it.' },
  { id:'breacher', name:'Breacher', prim:'shotgun',  sec:'melee',    perks:['lightweight','bloodlust','silence'], lethal:'semtex', tactical:'concuss', abil:['breacher','war_cry','last_stand','sprinter'], text:'Teleports over and clears rooms.' },
  { id:'marksman', name:'Marksman', prim:'marksman', sec:'pistol',   perks:['scavenger','stopping','steady'],   lethal:'frag',    tactical:'smoke',  abil:['second_wind','quartermaster','war_cry','juggernaut'], text:'Shoots into the next room before boarders reach them.' },
  { id:'tank',     name:'Tank',     prim:'lmg',      sec:'launcher', perks:['engineer','hardened','mask'],      lethal:'cluster', tactical:'smoke',  abil:['juggernaut','last_stand','second_wind','war_cry'], text:'Heavy guns and armour. Holds a door on their own.' } ];
function loClasses(){ return (PROFILE.classes = PROFILE.classes || []); }
function loClassById(id){ return LO_PRESETS.find(k => k.id===id) || loClasses().find(k => k.id===id) || null; }
function loBestFor(cls, slot, prefer){ const L = armLocker().filter(o => armDef(o) && loFits(armDef(o), slot) && (!cls || loClass(armDef(o))===cls) && o.dur > 0);
  if(prefer){ const p = L.find(o => o.id===prefer); if(p) return p; }
  return L.sort((a, b) => (armDef(b).tier||1) - (armDef(a).tier||1) || wpnLvl(b.id) - wpnLvl(a.id) || b.dur - a.dur)[0] || null; }
function loEquip(c, key, it){ const L = armLocker(); if(c[key] === it) return; if(c[key]) L.push(c[key]); if(it){ const i = L.indexOf(it); if(i >= 0) L.splice(i, 1); } c[key] = it; }
/* put a class on someone: what's unlocked for them, and the matching kit from the locker if you have it */
function loApplyClass(c, k){
  if(!c || !k) return; const L = loLvl(c), miss = [];
  c.perks = c.perks || []; for(let s = 1; s <= 3; s++){ const p = k.perks && k.perks[s - 1]; if(p && LO_PERKS[p] && LO_PERKS[p].slot===s && perkUnlocked(c, s)) c.perks[s - 1] = p; }
  if((c.pres || 0) >= 1 && k.perks && k.perks[3] && LO_PERKS[k.perks[3]] && !c.perks.slice(0, 3).includes(k.perks[3])) c.perks[3] = k.perks[3];
  const best = (LIST, want) => { if(want && LIST[want] && LIST[want].lvl <= L) return want; const ok = Object.keys(LIST).filter(g => LIST[g].lvl <= L); return ok.length ? ok[ok.length - 1] : null; };
  if(L >= LO_UNLOCK.lethal) c.lethal = best(LO_LETHAL, k.lethal); if(L >= LO_UNLOCK.tactical) c.tactical = best(LO_TACT, k.tactical);
  c.abil = c.abil || []; (k.abil || []).forEach((a, j) => { if(!LO_ABIL[a] || (L < LO_ABIL_L[j] && !c.pres)) return; if(c.abil.some((x, i) => i!==j && x===a)) return; loSetAbil(c, j, a); });
  for(const [key, slot, cls, pid] of [['arm', 'primary', k.prim, k.primId], ['side', 'secondary', k.sec, k.secId]]){ if(!cls) continue; if(slot==='secondary' && L < LO_UNLOCK.secondary) continue;
    const cur = c[key], ok = cur && armLive(cur) && loClass(armDef(cur))===cls && (!pid || cur.id===pid); if(ok) continue;
    const it = loBestFor(cls, slot, pid); if(it) loEquip(c, key, it); else miss.push((LO_CLASS[cls] || {}).name || cls); }
  for(const key of ['arm', 'side']){ const it = c[key]; const want = k.att && it && k.att[it.id]; if(want){ const lv = wpnLvl(it.id); it.att = want.filter(a => LO_ATT[a] && LO_ATT[a].lvl <= lv && attFor(armDef(it)).includes(a)).slice(0, 2); } }
  c.cls = k.id; sfx && sfx('click');
  toast(`${c.name} is now ${/^[AEIOU]/.test(k.name) ? 'an' : 'a'} ${k.name}.${miss.length ? ` No ${miss.join(' or ')} in the locker yet: buy one at a store (Armoury).` : ''}`);
}
function loSaveClass(c){
  const cl = loClasses(); if(cl.length >= 8){ toast('You have 8 classes already. Delete one first.'); return; }
  const k = { id:'u' + Date.now().toString(36), name:`Class ${cl.length + 1}`, prim:c.arm && armDef(c.arm) ? loClass(armDef(c.arm)) : null, primId:c.arm && c.arm.id, sec:c.side && armDef(c.side) ? loClass(armDef(c.side)) : null, secId:c.side && c.side.id,
    perks:(c.perks || []).slice(0, 4), lethal:c.lethal || null, tactical:c.tactical || null, abil:(c.abil || []).slice(0, 4), att:{} };
  for(const it of [c.arm, c.side]) if(it && it.att && it.att.length) k.att[it.id] = it.att.slice();
  cl.push(k); c.cls = k.id; saveProfile();
  if(typeof openRename==='function') openRename({ title:'Name this class', value:k.name, max:18, onOk:v => { k.name = String(v || k.name).slice(0, 18); saveProfile(); } });
  toast(`Saved as ${k.name}. Every crew member can use it, in every run.`); }
function loDeleteClass(id){ const cl = loClasses(), i = cl.findIndex(k => k.id===id); if(i >= 0){ cl.splice(i, 1); saveProfile(); } }

/* ---------------- opening it ---------------- */
function crewMineAll(){ const out = []; for(const s of [G.ship, G.enemy]) if(s) for(const c of s.crew) if(c.owner==='p' && !c.drone) out.push(c); return out; }
function openCrewScreen(id){ if(!G || !G.ship) return; const back = G.modal && G.modal.type!=='crew' ? G.modal : null; G.modal = { type:'crew', back }; UI.ccCrew = id || UI.ccCrew || UI.selCrew; UI.ccPick = null; }
function closeCrewScreen(){ const m = G.modal; UI.ccPick = null; G.modal = m && m.back ? m.back : null; }

/* ---------------- drawing ---------------- */
function ccCard(x, y, w, h, o){ const on = !!o.on, col = o.col || C.amber; rr(x, y, w, h, 10); ctx.fillStyle = o.locked ? 'rgba(6,9,18,.45)' : on ? hexA(col, .16) : 'rgba(8,12,24,.8)'; ctx.fill();
  const hov = !o.locked && o.click && hovered(x, y, w, h); ctx.lineWidth = on || hov ? 2.5 : 1.2; ctx.strokeStyle = o.locked ? C.line : on || hov ? col : hexA(col, .45); ctx.stroke();
  if(o.label) label(o.label, x + 14, y + 22, o.locked ? C.muted : col, 'left', 13);
  if(o.title) T(o.title, x + 14, y + (o.label ? 50 : 32), { s:o.ts || 18, f:FD, w:700, c:o.locked ? C.muted : o.tc || C.ink, max:w - 28 });
  if(o.sub) para(o.sub, x + 14, y + (o.label ? 72 : 54), w - 28, { s:13, lh:17, c:o.sc || C.muted, max:o.subMax || 2 });
  if(o.click && !o.locked) region(x, y, w, h, o.click, o.tag || ('cc:' + (o.label || o.title)));
  if(o.tipT) tip(x, y, w, h, o.tipT, o.tipB || ''); }
function ccStat(x, y, w, name, val, sub, col){ T(name.toUpperCase(), x, y, { s:12, f:FD, w:600, c:C.muted, ls:1 }); T(val, x, y + 30, { s:24, f:FD, w:700, c:col || C.ink, max:w }); if(sub) T(sub, x, y + 50, { s:12, c:C.muted, max:w }); }
function drawCrewScreen(m){
  const crew = crewMineAll(); if(!crew.length){ G.modal = null; return; }
  let c = crew.find(o => o.id===UI.ccCrew) || crew[0]; UI.ccCrew = c.id;
  const f = mframe(1500, 900, 'Crew', C.amber, m);
  btn(f.x + f.w - 150, f.y + 12, 126, 44, 'Close', closeCrewScreen, { s:16 });
  // the crew list
  const lx = f.x + 20, lw = 250, rh = Math.min(84, (f.h - 110)/Math.max(1, crew.length) - 8);
  crew.forEach((o, i) => { const y = f.y + 84 + i*(rh + 8), on = o===c, ht = typeof hungerTier==='function' ? hungerTier(o) : null;
    rr(lx, y, lw, rh, 10); ctx.fillStyle = on ? hexA(C.amber, .16) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : C.line; ctx.lineWidth = on ? 2.5 : 1; ctx.stroke();
    drawPortrait(lx + 32, y + rh/2, Math.min(22, rh/2 - 6), o, false);
    T(o.name, lx + 62, y + rh/2 - 8, { s:17, f:FD, w:700, max:lw - 70 });
    T(`Lv ${loLvl(o)}${o.pres ? ' ★' + o.pres : ''}${o.cls && loClassById(o.cls) ? ' · ' + loClassById(o.cls).name : ''}`, lx + 62, y + rh/2 + 12, { s:13, c:C.amber, max:lw - 70 });
    bar(lx + 62, y + rh/2 + 20, lw - 76, 5, o.hp/Math.max(1, o.maxHp), o.hp/o.maxHp > .5 ? C.good : o.hp/o.maxHp > .25 ? C.warn : C.hostile);
    if(ht && ht.pen > 0){ ctx.beginPath(); ctx.arc(lx + lw - 14, y + 14, 6, 0, 7); ctx.fillStyle = ht.col; ctx.fill(); tip(lx + lw - 24, y + 4, 20, 20, ht.name, ht.text); }
    region(lx, y, lw, rh, () => { UI.ccCrew = o.id; UI.ccPick = null; }, 'ccl:' + o.id); });
  const x = lx + lw + 24, w = f.x + f.w - 24 - x; let y = f.y + 84;
  if(UI.ccPick){ drawCrewPicker(UI.ccPick, c, x, y, w, f.y + f.h - 20 - y); return; }
  // header
  const L = loLvl(c), race = DATA.races[c.race] || {}, qd = typeof quirkDef==='function' && quirkDef(c.quirk), tr = c.trait && DATA.traits && DATA.traits[c.trait];
  drawPortrait(x + 44, y + 44, 40, c, false);
  T(c.name, x + 100, y + 32, { s:30, f:FD, w:700, max:380 });
  if(typeof openLookPicker==='function' && c.owner==='p' && !c.drone){ region(x + 4, y + 4, 80, 80, () => openLookPicker({ kind:'crew', id:c.id, name:c.name }), 'cclook'); rr(x + 64, y + 64, 26, 26, 13); ctx.fillStyle = C.panel2 || '#1a2342'; ctx.fill(); ctx.strokeStyle = C.violet || '#c48bff'; ctx.lineWidth = 2; ctx.stroke(); T('🎨', x + 77, y + 83, { s:13, a:'center' }); tip(x + 4, y + 4, 80, 80, 'Change their look', 'Dress them in pixel art from the Pixel Studio, or go back to their ordinary look.'); }
  T([race.name || c.race, qd && qd.name, tr && tr.name, `${c.kills || 0} kills`].filter(Boolean).join(' · '), x + 100, y + 58, { s:14, c:C.muted, max:420 });
  if(qd) tip(x + 100, y + 44, 420, 20, qd.name, qd.desc);
  // level badge and xp
  const bx = x + 540; rr(bx, y + 4, 92, 80, 12); ctx.fillStyle = hexA(C.amber, .14); ctx.fill(); ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.stroke();
  T('LEVEL', bx + 46, y + 26, { s:12, f:FD, w:700, a:'center', c:C.amber, ls:2 }); T(String(L), bx + 46, y + 68, { s:38, f:FD, w:700, a:'center', c:C.ink });
  if(c.pres){ T('★'.repeat(Math.min(5, c.pres)) + (c.pres > 5 ? '+' + (c.pres - 5) : ''), bx + 46, y + 100, { s:15, a:'center', c:C.violet || '#c48bff' }); tip(bx, y + 4, 92, 100, `Prestige ${c.pres}`, `+${5*c.pres} health and +${3*c.pres}% damage for good${c.pres >= 1 ? ', and a wildcard perk slot' : ''}.`); }
  const need = loNeed(L), fr = L >= LO_MAXL ? 1 : clamp((c.cxp || 0)/need, 0, 1), xw = w - (bx - x) - 120;
  rr(bx + 112, y + 24, xw, 14, 7); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fill(); rr(bx + 112, y + 24, Math.max(14, xw*fr), 14, 7); ctx.fillStyle = C.amber; ctx.fill();
  T(L >= LO_MAXL ? 'Max level' : `${Math.floor(c.cxp || 0)} / ${need} xp`, bx + 112, y + 18, { s:13, c:C.muted });
  T(loNextUnlock(c), bx + 112, y + 60, { s:14, c:C.ink, max:xw });
  T('Crew earn xp by fighting, repairing and manning stations.', bx + 112, y + 82, { s:12, c:C.muted, max:xw });
  if(L >= LO_MAXL && (c.pres || 0) < 10) tip(bx + 112 + xw - 200, y + 78, 200, 36, 'Prestige', 'Back to level 1: they lose the level bonus and perk slots and earn them again, but keep their abilities and gain +5 health, +3% damage for good (and a wildcard perk slot the first time).');
  if(L >= LO_MAXL && (c.pres || 0) < 10) btn(bx + 112 + xw - 200, y + 78, 200, 36, UI.presAsk===c.id ? 'Sure? Tap again' : '★ Prestige', () => { if(UI.presAsk!==c.id){ UI.presAsk = c.id; return; } UI.presAsk = null; loPrestige(c); }, { s:15, col:C.violet || '#c48bff', fill:UI.presAsk===c.id });
  y += 122;
  // vitals
  const B = loBonus(c), ht = typeof hungerTier==='function' ? hungerTier(c) : null, cw = (w - 40)/5;
  rr(x, y, w, 96, 10); ctx.fillStyle = 'rgba(6,9,18,.55)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
  const hpCol = c.hp/c.maxHp > .5 ? C.good : c.hp/c.maxHp > .25 ? C.warn : C.hostile;
  ccStat(x + 16, y + 24, cw - 16, 'Health', `${Math.ceil(c.hp)} / ${c.maxHp}`, c.hungerHp > 0 ? `−${c.hungerHp} from hunger` : c.hungerHp < 0 ? `+${-c.hungerHp} from being well fed` : B.hp ? `+${B.hp} from level${c.pres ? ' and prestige' : ''}` : 'Medbay heals it', hpCol);
  tip(x, y, cw, 96, 'Health', `Maximum ${c.maxHp + (c.hungerHp || 0)}${B.hp ? `, of which +${B.hp} from level and prestige` : ''}.${c.hungerHp > 0 ? ` Hunger is taking ${c.hungerHp} off until they eat.` : c.hungerHp < 0 ? ` Being well fed adds ${-c.hungerHp}.` : ''} The medbay heals up to the maximum; it can't feed anyone.`);
  if(ht){ const fx = x + 16 + cw; ccStat(fx, y + 24, cw - 16, 'Food', ht.name, null, ht.col); bar(fx, y + 62, cw - 40, 8, fullness(c)/100, ht.col, 'rgba(255,255,255,.08)');
    T(`${Math.round(fullness(c))}/100 · ship has ${G.food || 0}`, fx, y + 84, { s:12, c:C.muted, max:cw - 20 });
    tip(fx - 8, y, cw, 96, `Food: ${ht.name}`, `${ht.text} Fighting and repairs make them hungrier. The crew eat by themselves between jumps.`);
    if(fullness(c) < 95 && ((G.food || 0) > 0 || hungerPantry(false).length)) btn(fx + cw - 96, y + 10, 80, 34, 'Feed', () => { const w_ = hungerEatOne(c, false); if(w_) toast(`${c.name} eats ${w_}.`); }, { s:14, col:C.good }); }
  else { const fx = x + 16 + cw; ccStat(fx, y + 24, cw - 16, 'Food', 'Never eats', race.name ? `${race.name} don't need food` : '', C.muted); }
  const fT = c._fT; c._fT = 99; const dm = armMult(c); c._fT = fT; const rp = armRepair(c), sp = 1 + itemBuff(c, 'spd');   // the steady figure, not the opening-seconds burst
  ccStat(x + 16 + 2*cw, y + 24, cw - 16, 'Damage', `×${dm.toFixed(2)}`, `+${Math.round(B.dmg*100)}% level${B.pdmg ? `, +${Math.round(B.pdmg*100)}% prestige` : ''}`, C.hostile);
  tip(x + 2*cw, y, cw, 96, 'Hand-to-hand damage', 'Everything together: the weapon in hand, attachments, perks, level, prestige and food.');
  ccStat(x + 16 + 3*cw, y + 24, cw - 16, 'Repair', `×${rp.toFixed(2)}`, `+${Math.round(B.rep*100)}% from level`, C.warn);
  ccStat(x + 16 + 4*cw, y + 24, cw - 16, 'Speed', `×${sp.toFixed(2)}`, 'weapons, perks, food', C.cyan);
  y += 108;
  // skills
  SKILLS.forEach((k, i) => { const sx = x + i*(w/6), lv = skillLvl(c, k); T(SKILLN[k], sx, y + 14, { s:13, c: lv ? C.amber : C.muted });
    for(let p = 0; p < 2; p++){ ctx.beginPath(); ctx.arc(sx + 100 + p*14, y + 9, 5, 0, 7); ctx.fillStyle = p < lv ? C.amber : '#1d2742'; ctx.fill(); }
    bar(sx, y + 22, w/6 - 24, 5, skillProgress(c, k), lv >= 2 ? C.amber : lv===1 ? C.good : C.cyan, 'rgba(255,255,255,.06)');
    tip(sx, y, w/6 - 10, 30, `${SKILLN[k]} · ${['untrained','skilled','expert'][lv]}`, `${SKILL_FX[k][lv]}.`); });
  y += 42;
  // class bar
  label('Class', x, y + 18, C.amber, 'left', 14);
  const all = [...LO_PRESETS, ...loClasses()]; let cx_ = x + 80;
  for(const k of all){ const bw = Math.max(96, Math.min(150, k.name.length*11 + 30)); if(cx_ + bw > x + w - 190) break; btn(cx_, y, bw, 36, k.name, () => loApplyClass(c, k), { s:14, fill:c.cls===k.id, col:k.id.startsWith('u') ? C.cyan : C.amber });
    tip(cx_, y, bw, 36, k.name, `${k.text || 'Your own class.'} Tap to give it to ${c.name}: ${[k.prim && (LO_CLASS[k.prim] || {}).name, k.sec && (LO_CLASS[k.sec] || {}).name].filter(Boolean).join(' and ')}, its perks, grenades and abilities, as far as their level allows.`); cx_ += bw + 8; }
  btn(x + w - 180, y, 124, 36, '+ Save class', () => loSaveClass(c), { s:14, col:C.cyan }); tip(x + w - 180, y, 124, 36, 'Save as a class', `Saves ${c.name}'s weapons, attachments, perks, grenades and abilities as a class of your own, for anyone, in any run.`);
  if(c.cls && c.cls.startsWith('u') && loClassById(c.cls)){ btn(x + w - 48, y, 48, 36, '✕', () => { if(UI.clsDel!==c.cls){ UI.clsDel = c.cls; toast('Tap ✕ again to delete this class.'); return; } loDeleteClass(c.cls); c.cls = null; UI.clsDel = null; }, { s:15, col:C.hostile }); tip(x + w - 48, y, 48, 36, 'Delete class', 'Deletes your class (tap twice). Nobody loses their kit.'); }
  y += 52;
  // loadout cards
  const lw5 = (w - 4*12)/5, KH = 128, locker = armLocker();
  const wcard = (i, key, slot) => { const cx2 = x + i*(lw5 + 12), it = c[key], d = it && armDef(it), lockL = slot==='secondary' && L < LO_UNLOCK.secondary ? LO_UNLOCK.secondary : 0;
    ccCard(cx2, y, lw5, KH, { label:slot==='primary' ? 'Primary' : slot==='secondary' ? 'Secondary' : 'Armour', title:lockL ? `Level ${lockL}` : d ? d.name : 'Empty', locked:!!lockL, tc: d ? (armWorn(it) ? C.warn : C.ink) : C.muted,
      subMax:d ? 1 : 2, sub: d ? `${(LO_CLASS[loClass(d)] || {}).name || (d.kind==='suit' ? 'Armour' : '')}${d.kind!=='suit' ? ' · Lv ' + wpnLvl(it.id) : ''}${armWorn(it) ? ' · WORN' : ''}` : `${locker.filter(o => armDef(o) && loFits(armDef(o), slot==='armour' ? 'suit' : slot)).length} in the locker`,
      click:() => { UI.ccPick = { kind:'kit', key, slot }; }, tipT:d ? d.name : null, tipB:d ? `${d.desc || ''} ${armStatLine(d)}` : '' });
    if(d){ bar(cx2 + 14, y + 98, lw5 - 28, 5, armFrac(it), armWorn(it) ? C.warn : C.good, 'rgba(255,255,255,.08)');
      if(slot!=='armour'){ it.att = it.att || []; for(let j = 0; j < 2; j++){ const A = it.att[j] && LO_ATT[it.att[j]], ax = cx2 + 10 + j*((lw5 - 20)/2), aw = (lw5 - 20)/2 - 4;
        btn(ax, y + KH - 22, aw, 26, A ? A.name : '+ Add', () => { UI.ccPick = { kind:'att', key, j }; }, { s:11, col:A ? C.good : C.muted }); } } } };
  wcard(0, 'arm', 'primary'); wcard(1, 'side', 'secondary'); wcard(2, 'suit', 'armour');
  [['lethal', LO_LETHAL, LO_UNLOCK.lethal, 'Lethal grenade', C.hostile], ['tactical', LO_TACT, LO_UNLOCK.tactical, 'Tactical grenade', C.cyan]].forEach(([key, LIST, need_, nm, col], j) => { const gx = x + (3 + j)*(lw5 + 12), G_ = c[key] && LIST[c[key]];
    ccCard(gx, y, lw5, KH, { label:nm, col, title:L < need_ ? `Level ${need_}` : G_ ? G_.name : 'None', locked:L < need_, sub:G_ ? G_.text : 'Thrown as a fight starts in their room.', subMax:3, click:() => { UI.ccPick = { kind:'nade', key }; } }); });
  y += KH + 14;
  // perks and abilities
  const p4 = (w - 3*12)/4, PH = 104; c.perks = c.perks || []; c.abil = c.abil || [];
  [1, 2, 3, 4].forEach(sl => { const px = x + (sl - 1)*(p4 + 12), wild = sl===4, need_ = wild ? 0 : LO_UNLOCK['perk' + sl], locked = wild ? !(c.pres >= 1) : L < need_, cur = c.perks[sl - 1], P = cur && LO_PERKS[cur];
    ccCard(px, y, p4, PH, { label:wild ? 'Wildcard perk' : `Perk ${sl}`, col:wild ? (C.violet || '#c48bff') : ['', '#5fd3e6', '#ff5a7a', '#ffd166'][sl], locked, title:locked ? (wild ? 'Prestige once' : `Level ${need_}`) : P ? P.name + (perkPro(cur) ? '  PRO' : '') : 'Choose…',
      sub:P ? (perkPro(cur) ? P.pro : P.text) : wild ? 'Any perk, on top of the other three.' : '', click:() => { UI.ccPick = { kind:'perk', sl }; } }); });
  y += PH + 12;
  LO_ABIL_L.forEach((need_, j) => { const ax = x + j*(p4 + 12), locked = L < need_ && !c.abil[j] && !c.pres, A = c.abil[j] && LO_ABIL[c.abil[j]];
    ccCard(ax, y, p4, PH, { label:`Ability ${j + 1}`, col:C.violet || '#c48bff', locked, title:locked ? `Level ${need_}` : A ? A.name : 'Choose…', sub:A ? A.text : '', click:() => { UI.ccPick = { kind:'abil', j }; } }); });
  y += PH + 10;
  // footer
  const fy = f.y + f.h - 30; T(`Tip: tap someone in the crew row twice to open this. ${typeof rosterSave==='function' ? '' : ''}`, x, fy, { s:13, c:C.muted, max:w - 420 });
  if(typeof rosterSave==='function') btn(x + w - 400, fy - 30, 190, 40, 'Save to roster', () => rosterSave(c), { s:14, col:C.cyan });
  if(typeof openRename==='function') btn(x + w - 200, fy - 30, 200, 40, 'Rename', () => openRename('crew', c), { s:14 });
}
/* the picker: every option for one slot, with what it does and when it unlocks */
function drawCrewPicker(P, c, x, y, w, h){
  const L = loLvl(c); let title = '', opts = [];
  if(P.kind==='kit'){ const slot = P.slot==='armour' ? 'suit' : P.slot, cur = c[P.key];
    title = P.slot==='primary' ? 'Primary weapon' : P.slot==='secondary' ? 'Secondary weapon' : 'Armour';
    opts.push({ id:null, name:'Nothing', sub:cur ? 'Put it back in the locker.' : '', on:!cur, pick:() => loEquip(c, P.key, null) });
    if(cur && armDef(cur)) opts.push({ id:cur.id, name:armDef(cur).name, sub:`Equipped. ${armStatLine(armDef(cur))}`, on:true, pick:() => {} });
    for(const it of armLocker()){ const d = armDef(it); if(!d || !loFits(d, slot)) continue;
      opts.push({ id:it.id, name:d.name + (armWorn(it) ? ' (worn)' : ''), tag:`${(LO_CLASS[loClass(d)] || {}).name || ''}${slot!=='suit' ? ' · Lv ' + wpnLvl(it.id) : ''}`, sub:`${d.desc || ''} ${armStatLine(d)}`, pick:() => loEquip(c, P.key, it) }); }
    if(opts.length <= 2) opts.push({ id:'_none', name:'The locker is empty', sub:'Buy weapons and armour at stores (Armoury tab), or win them from boarders.', locked:true }); }
  else if(P.kind==='att'){ const it = c[P.key], d = it && armDef(it); if(!d){ UI.ccPick = null; return; } it.att = it.att || []; const lv = wpnLvl(it.id), cur = it.att[P.j];
    title = `${d.name}: attachment ${P.j + 1}`;
    opts.push({ id:null, name:'None', on:!cur, pick:() => { it.att.splice(P.j, 1); } });
    for(const k of attFor(d)){ const A = LO_ATT[k], other = it.att.includes(k) && it.att[P.j]!==k;
      opts.push({ id:k, name:A.name, sub:A.text, on:cur===k, locked:A.lvl > lv || other, lock:A.lvl > lv ? `Weapon level ${A.lvl} (now ${lv})` : 'On the other slot', pick:() => { it.att[P.j] = k; it.att = it.att.filter(Boolean); } }); } }
  else if(P.kind==='nade'){ const LIST = P.key==='lethal' ? LO_LETHAL : LO_TACT; title = P.key==='lethal' ? 'Lethal grenade' : 'Tactical grenade';
    opts.push({ id:null, name:'None', on:!c[P.key], pick:() => { c[P.key] = null; } });
    for(const [k, G_] of Object.entries(LIST)) opts.push({ id:k, name:G_.name, sub:G_.text, on:c[P.key]===k, locked:G_.lvl > L, lock:`Level ${G_.lvl}`, pick:() => { c[P.key] = k; } }); }
  else if(P.kind==='perk'){ const sl = P.sl, wild = sl===4; title = wild ? 'Wildcard perk (any perk)' : `Perk ${sl}`; c.perks = c.perks || [];
    opts.push({ id:null, name:'None', on:!c.perks[sl - 1], pick:() => { c.perks[sl - 1] = null; } });
    for(const [k, Pk] of Object.entries(LO_PERKS)){ if(!wild && Pk.slot!==sl) continue; const used = c.perks.some((x, i) => x===k && i!==sl - 1), prog = (PROFILE.perkProgress || {})[k] || 0;
      opts.push({ id:k, name:Pk.name + (perkPro(k) ? '  PRO' : ''), sub:`${Pk.text} ${perkPro(k) ? Pk.pro : `${Pk.pro} (${Math.floor(prog)}/${Pk.goal} ${Pk.stat==='heal' ? 'healed' : Pk.stat==='fixes' ? 'repairs' : 'kills'})`}`, on:c.perks[sl - 1]===k, locked:used, lock:'Already chosen', pick:() => { c.perks[sl - 1] = k; } }); } }
  else if(P.kind==='abil'){ title = `Ability ${P.j + 1}`; c.abil = c.abil || [];
    opts.push({ id:null, name:'None', on:!c.abil[P.j], pick:() => loSetAbil(c, P.j, null) });
    for(const [k, A] of Object.entries(LO_ABIL)){ const used = c.abil.some((x, i) => x===k && i!==P.j); opts.push({ id:k, name:A.name, sub:A.text, on:c.abil[P.j]===k, locked:used, lock:'Already chosen', pick:() => loSetAbil(c, P.j, k) }); } }
  T(`${c.name}: ${title}`, x, y + 26, { s:24, f:FD, w:700, max:w - 200 });
  btn(x + w - 160, y, 160, 44, '‹ Back', () => { UI.ccPick = null; }, { s:16 });
  const cols = opts.length > 8 ? 3 : 2, gw = (w - (cols - 1)*12)/cols, gh = 110, per = cols*Math.floor((h - 70)/(gh + 12)); P.page = P.page || 0; const pages = Math.max(1, Math.ceil(opts.length/per)); if(P.page >= pages) P.page = 0;
  opts.slice(P.page*per, P.page*per + per).forEach((o, i) => { const ox = x + (i%cols)*(gw + 12), oy = y + 60 + Math.floor(i/cols)*(gh + 12);
    ccCard(ox, oy, gw, gh, { title:o.name + (o.tag ? '' : ''), label:o.locked ? o.lock || 'Locked' : o.tag || (o.on ? 'Current' : ''), on:o.on, locked:o.locked, sub:o.sub, subMax:cols===2 ? 3 : 2, col:o.on ? C.good : C.amber, ts:17,
      click:o.pick ? () => { o.pick(); UI.ccPick = null; sfx && sfx('click'); } : null, tipT:o.sub ? o.name : null, tipB:o.sub }); });
  if(pages > 1){ btn(x, y + h - 44, 140, 40, '‹ Prev', () => { P.page = (P.page + pages - 1) % pages; }, { s:14 }); T(`${P.page + 1} / ${pages}`, x + 200, y + h - 18, { s:14, c:C.muted }); btn(x + 280, y + h - 44, 140, 40, 'More ›', () => { P.page = (P.page + 1) % pages; }, { s:14 }); }
}

/* ---------------- the ways in ---------------- */
(function(){
  // a modal of its own
  const d0 = drawModal; drawModal = function(){ const m = G && G.modal; if(m && m.type==='crew'){ drawCrewScreen(m); return; } d0(); };
  // the crew row: tap once to select, tap the selected person again for their page
  const r0 = drawRoster; drawRoster = function(){ const sel0 = UI.selCrew; r0(); for(const r of HR){ if(r.y===572 && r.h===66 && r.x < 800 && r.cb && !r._cc){ const cb = r.cb; r._cc = true; r.cb = (...a) => { const was = UI.selCrew; cb(...a); if(was && !UI.selCrew && was===sel0 && G && !G.modal){ openCrewScreen(was); } }; } }
    // the hunger dot on each chip
    if(typeof hungerTier!=='function' || !hungerOn()) return; const list = crewMineAll(), n = list.length, cw = Math.min(160, (760 - 6*(n - 1))/Math.max(1, n));
    list.forEach((c, i) => { const t = hungerTier(c); if(!t || !(t.pen > 0)) return; const x = 24 + i*(cw + 6) + cw - 12; ctx.beginPath(); ctx.arc(x, 572 + 12, 6, 0, 7); ctx.fillStyle = t.col; ctx.fill(); ctx.strokeStyle = '#0b1020'; ctx.lineWidth = 2; ctx.stroke(); }); };
  // the small card's "more" button opens the full page
  if(typeof drawCrewStrip==='function'){ const s0 = drawCrewStrip; drawCrewStrip = function(c, sh, race, job){ s0(c, sh, race, job); for(const r of HR) if(r.t==='ⓘ' && !r._cc){ r._cc = true; r.cb = () => { if(c.owner==='p') openCrewScreen(c.id); else UI.crewMore = true; }; } }; }
  // the Armoury's Loadouts view and the Ship → Crew tab point here
  if(typeof drawArmouryTab==='function'){ const a0 = drawArmouryTab; drawArmouryTab = function(f, cx, y0){ if((UI.armView || 'loadout')==='loadout'){ UI.armView = 'kit'; } a0(f, cx, y0);
    btn(cx + 640, y0 - 8, 220, 34, 'Loadouts & classes', () => openCrewScreen(), { s:13, col:C.amber, fill:true }); }; }
})();
