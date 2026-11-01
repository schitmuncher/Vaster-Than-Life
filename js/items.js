'use strict';
/* =========================================================================
   Tonics and treats: things you give to one crew member to make them better
   (the way a sim-management game lets you feed a favourite adventurer a stat
   potion). Some are permanent (a little more health, damage, repair or speed,
   up to a cap per person), some are training (a burst of skill), some are a
   boost for the next few fights, and some just heal. Crops from the garden
   and fish from the line can be eaten raw, one at a time, for small gains.
     G.items      { id: count }
     c.bonus      permanent: { hp, dmg, rep, spd }
     c.ibuff      a boost: { dmg, spd, rep, fights }
   ========================================================================= */
BASE.items = {
  muscle:   { name:'Muscle Tonic',       kind:'perm', cost:40, tier:1, dmg:.06, desc:'Thick, pink and fizzing. +6% hand-to-hand damage, for good.' },
  biscuit:  { name:'Iron Biscuit',       kind:'perm', cost:35, tier:1, hp:10, desc:'Hard enough to chip a tooth. +10 max health, for good.' },
  gum:      { name:'Nimble Gum',         kind:'perm', cost:30, tier:1, spd:.06, desc:'Tastes of static. +6% moving speed, for good.' },
  tea:      { name:'Tinker\'s Tea',      kind:'perm', cost:30, tier:1, rep:.08, desc:'Strong enough to stand a spanner up in. +8% repair speed, for good.' },
  elixir:   { name:'Golden Elixir',      kind:'perm', cost:110, tier:3, hp:15, dmg:.08, rep:.08, spd:.04, desc:'Rare and glowing. A little better at everything, for good.' },
  chip_pilot:{ name:'Skill Chip: Piloting', kind:'train', cost:35, tier:1, skill:'pilot', xp:60, desc:'Plug it in, learn to fly. A big jump in piloting.' },
  chip_eng: { name:'Skill Chip: Engines',  kind:'train', cost:35, tier:1, skill:'engines', xp:60, desc:'A big jump in engine work.' },
  chip_shd: { name:'Skill Chip: Shields',  kind:'train', cost:35, tier:1, skill:'shields', xp:60, desc:'A big jump in shield work.' },
  chip_wpn: { name:'Skill Chip: Weapons',  kind:'train', cost:35, tier:1, skill:'weapons', xp:60, desc:'A big jump in gunnery.' },
  chip_rep: { name:'Skill Chip: Repair',   kind:'train', cost:35, tier:1, skill:'repair', xp:60, desc:'A big jump in repairs.' },
  chip_cbt: { name:'Skill Chip: Combat',   kind:'train', cost:35, tier:1, skill:'combat', xp:60, desc:'A big jump in hand-to-hand fighting.' },
  stim:     { name:'Battle Stim',        kind:'buff', cost:20, tier:1, buff:{ dmg:.3, spd:.2 }, fights:2, desc:'For the next two fights: +30% damage and +20% speed. Jittery.' },
  focus:    { name:'Focus Drops',        kind:'buff', cost:20, tier:1, buff:{ rep:.4 }, fights:2, desc:'For the next two fights: repairs 40% faster.' },
  rage:     { name:'Berserker Brew',     kind:'buff', cost:35, tier:2, buff:{ dmg:.6 }, fights:1, desc:'For one fight: +60% hand-to-hand damage. Not recommended by doctors.' },
  medkit:   { name:'Field Medkit',       kind:'heal', cost:12, tier:1, heal:60, desc:'Heals 60 health, anywhere, even mid-fight.' },
  salve:    { name:'Nanite Salve',       kind:'heal', cost:25, tier:2, heal:999, cure:true, desc:'Heals completely and stops any bleeding.' },
  cookies:  { name:'Comfort Cookies',    kind:'treat', cost:15, tier:1, hearts:30, desc:'Home-baked. Somebody\'s new favourite person is you.' },
  feast:    { name:'Birthday Cake',      kind:'treat', cost:30, tier:2, hearts:60, heal:30, desc:'For any occasion. Big hearts, and a little healing.' }
};
/* the garden's crops and the line's fish, eaten raw by one person */
const RAW_FOOD = { star_potato:{ hp:3 }, ion_berry:{ spd:.02 }, void_pepper:{ dmg:.03 }, nebula_bloom:{ rep:.04 }, moon_melon:{ hp:6, heal:20 }, glass_lily:{ hp:4, dmg:.02, rep:.02, spd:.01 }, space_fish:{ dmg:.02, heal:15 }, deep_eel:{ hp:5, dmg:.03 } };
const BONUS_CAP = { hp:60, dmg:.5, rep:.6, spd:.3 };
const ITEM_KIND = { perm:['For good','#ffd166'], train:['Training','#7be0a0'], buff:['Boost','#ff8ad8'], heal:['Healing','#5fd3e6'], treat:['Treat','#ffb0e0'] };
function itemDef(id){ return (DATA.items && DATA.items[id]) || null; }
function itemBag(){ return G ? (G.items = G.items || {}) : {}; }
function itemAdd(id, n){ const b = itemBag(); b[id] = (b[id]||0) + (n||1); }
function crewBonus(c){ return (c.bonus = c.bonus || { hp:0, dmg:0, rep:0, spd:0 }); }
function itemBuff(c, k){ const b = c && c.ibuff; return b && b.fights > 0 ? b[k] || 0 : 0; }
/* give one person a permanent boost, up to their cap. Returns what actually took. */
function boostCrew(c, fx){ const B = crewBonus(c), got = [];
  for(const k of ['hp','dmg','rep','spd']){ const v = fx[k]; if(!v) continue; const room = BONUS_CAP[k] - B[k]; const add = Math.min(v, Math.max(0, room)); if(add <= 0) continue; B[k] += add;
    if(k==='hp'){ c.maxHp += add; c.hp += add; got.push(`+${Math.round(add)} max health`); } else got.push(`+${Math.round(add*100)}% ${{ dmg:'damage', rep:'repair', spd:'speed' }[k]}`); }
  return got; }
function useItem(id, c){
  const d = itemDef(id), bag = itemBag(); if(!d || !c || !(bag[id] > 0)) return false; let msg = [];
  if(d.kind==='perm'){ msg = boostCrew(c, d); if(!msg.length){ toast(`${c.name} can't get any better that way.`); return false; } }
  if(d.kind==='train'){ gainXP(c, d.skill, d.xp); msg.push(`trained in ${SKILLN[d.skill]||d.skill}`); }
  if(d.kind==='buff'){ c.ibuff = Object.assign({}, d.buff, { fights:d.fights||1, name:d.name }); msg.push(`${d.name} for ${d.fights||1} fight${(d.fights||1)>1?'s':''}`); }
  if(d.heal){ if(c.hp >= c.maxHp && !d.hearts && !(d.cure && c.bleedT > 0)){ toast(`${c.name} is already fully healthy.`); return false; } c.hp = Math.min(c.maxHp, c.hp + d.heal); msg.push('healed'); }
  if(d.cure){ c.bleed = 0; c.bleedT = 0; }
  if(d.hearts && typeof addHearts==='function'){ addHearts(c, d.hearts); msg.push(`+${Math.round(d.hearts/10)} hearts`); }
  bag[id]--; if(bag[id] <= 0) delete bag[id];
  sfx('buy'); toast(`${c.name}: ${msg.join(', ')}.`); return true;
}
function feedRaw(gid, c){
  const fx = RAW_FOOD[gid]; if(!fx || !c || !(G.bay && G.bay[gid] > 0)) return false; const got = boostCrew(c, fx);
  if(fx.heal) c.hp = Math.min(c.maxHp, c.hp + fx.heal);
  if(!got.length && !fx.heal){ toast(`${c.name} has had enough of those.`); return false; }
  G.bay[gid]--; if(!G.bay[gid]) delete G.bay[gid]; if(typeof addHearts==='function') addHearts(c, 4);
  sfx('click'); toast(`${c.name} eats the ${(goodsDef(gid)||{}).name || gid}${got.length ? ': ' + got.join(', ') : ''}.`); return true;
}
/* a boost lasts some fights */
function itemsCombatEnd(){ if(!G || !G.ship) return; for(const c of G.ship.crew){ if(c.ibuff && c.ibuff.fights > 0){ c.ibuff.fights--; if(c.ibuff.fights <= 0) c.ibuff = null; } } }
/* events: "item": an id, a list, or "random" */
function itemsEffect(e, L){
  if(!e || !e.item) return; const ids = Object.keys(DATA.items||{}).filter(k => !DATA.items[k].noLoot && (DATA.items[k].tier||1) <= (G.sector >= 5 ? 3 : 2));
  for(const a of [].concat(e.item)){ const id = a==='random' ? pick(ids) : a; if(itemDef(id)){ itemAdd(id); L.push(`+1 ${itemDef(id).name} (Ship → Armoury → Tonics)`); } }
}
/* the Tonics view of the Armoury tab */
function drawTonicsView(f, cx, y0){
  const s = G.ship, crew = s.crew.filter(c => c.owner==='p' && !c.drone), bag = itemBag();
  if(!crew.some(c => c.id===UI.tonicCrew)) UI.tonicCrew = crew[0] && crew[0].id; const who = crew.find(c => c.id===UI.tonicCrew);
  label('Who gets it?', cx, y0+10, C.muted, 'left', 14);
  crew.slice(0, 8).forEach((c, i) => { const y = y0+30 + i*62, on = c===who, B = crewBonus(c);
    rr(cx, y, 724, 54, 8); ctx.fillStyle = on ? hexA(C.amber,.14) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : C.line; ctx.lineWidth = on ? 2.5 : 1.2; ctx.stroke();
    region(cx, y, 724, 54, () => { UI.tonicCrew = c.id; });
    drawPortrait(cx+28, y+27, 20, c, false); T(c.name, cx+58, y+24, { s:16, f:FD, w:700, max:140 });
    const fr = clamp(c.hp/c.maxHp, 0, 1); bar(cx+58, y+34, 120, 7, fr, fr>.5 ? C.good : fr>.25 ? C.warn : C.hostile); T(`${Math.round(c.hp)}/${c.maxHp}`, cx+184, y+42, { s:11, c:C.muted });
    const stats = [['HP', '+' + Math.round(B.hp), B.hp/BONUS_CAP.hp], ['DMG', '+' + Math.round(B.dmg*100) + '%', B.dmg/BONUS_CAP.dmg], ['REP', '+' + Math.round(B.rep*100) + '%', B.rep/BONUS_CAP.rep], ['SPD', '+' + Math.round(B.spd*100) + '%', B.spd/BONUS_CAP.spd]];
    stats.forEach(([k, v, fr2], j) => { const sx = cx+250 + j*96; T(k, sx, y+20, { s:10, f:FD, w:700, c:C.muted }); T(v, sx+30, y+20, { s:13, f:FD, w:700, c: fr2 > 0 ? C.amber : C.muted }); bar(sx, y+30, 82, 5, fr2, fr2 >= 1 ? C.good : C.amber); });
    if(c.ibuff && c.ibuff.fights > 0) T(`${c.ibuff.name} · ${c.ibuff.fights}`, cx+640, y+42, { s:11, c:'#ff8ad8', a:'center', max:150 });
    tip(cx+250, y, 390, 54, `${c.name}'s bonuses`, `Permanent gains from tonics and food: +${Math.round(B.hp)} max health (cap ${BONUS_CAP.hp}), +${Math.round(B.dmg*100)}% damage (cap ${BONUS_CAP.dmg*100}%), +${Math.round(B.rep*100)}% repair (cap ${BONUS_CAP.rep*100}%), +${Math.round(B.spd*100)}% speed (cap ${BONUS_CAP.spd*100}%).`); });
  // what's in the cupboard
  const lx = cx+760, lw = 616; panel(lx, y0+24, lw, 610, 10); label('Tonics & treats', lx+20, y0+56, C.amber, 'left', 15);
  const rows = Object.keys(bag).filter(id => itemDef(id) && bag[id] > 0).map(id => ({ k:'item', id, n:bag[id], d:itemDef(id) }))
    .concat(Object.keys(G.bay||{}).filter(g => RAW_FOOD[g] && G.bay[g] > 0).map(g => ({ k:'food', id:g, n:G.bay[g], d:goodsDef(g) })));
  if(!rows.length) para('Nothing yet. Stores sell tonics (Tonics tab), and crops from your garden or fish from the line can be eaten raw, one at a time, for small permanent gains.', lx+20, y0+92, lw-40, { s:15, lh:21, c:C.muted });
  const per = 7, pages = Math.max(1, Math.ceil(rows.length/per)); UI.tonicPage = clamp(UI.tonicPage||0, 0, pages-1);
  rows.slice(UI.tonicPage*per, UI.tonicPage*per + per).forEach((r, i) => { const y = y0+76 + i*72, d = r.d || {}, kind = r.k==='food' ? ['Raw food','#9fdc7a'] : ITEM_KIND[d.kind] || ITEM_KIND.treat;
    rr(lx+14, y, lw-28, 64, 8); ctx.fillStyle = C.panel2; ctx.fill();
    T(`${d.name || r.id}  ×${r.n}`, lx+30, y+24, { s:16, f:FD, w:700, max:330 }); T(kind[0].toUpperCase(), lx+30, y+46, { s:11, f:FD, w:700, c:kind[1] });
    const fxT = r.k==='food' ? rawText(r.id) : d.desc; T(fxT, lx+120, y+46, { s:12, c:C.muted, max:270 }); tip(lx+14, y, 400, 64, d.name || r.id, fxT);
    btn(lx+lw-200, y+12, 172, 40, who ? (r.k==='food' ? `Feed ${who.name}` : `Give ${who.name}`) : 'Pick someone', () => { if(!who) return; r.k==='food' ? feedRaw(r.id, who) : useItem(r.id, who); }, { s:13, disabled:!who, fill:!!who, col:C.good, max:160 }); });
  if(pages > 1){ btn(lx+20, y0+584, 60, 36, '‹', () => UI.tonicPage--, { disabled:UI.tonicPage<=0 }); T(`${UI.tonicPage+1}/${pages}`, lx+110, y0+608, { s:14, c:C.muted }); btn(lx+150, y0+584, 60, 36, '›', () => UI.tonicPage++, { disabled:UI.tonicPage>=pages-1 }); }
}
function rawText(g){ const f = RAW_FOOD[g] || {}, t = []; if(f.hp) t.push(`+${f.hp} max health`); if(f.dmg) t.push(`+${Math.round(f.dmg*100)}% damage`); if(f.rep) t.push(`+${Math.round(f.rep*100)}% repair`); if(f.spd) t.push(`+${Math.round(f.spd*100)}% speed`); if(f.heal) t.push(`heals ${f.heal}`); return t.join(', ') + ', for good.'; }
/* the store's Tonics tab */
function storeTonics(st){ if(st.tonicStock) return st.tonicStock; const n = G.sector||1, maxT = n >= 5 ? 3 : n >= 3 ? 2 : 1;
  const ids = Object.keys(DATA.items||{}).filter(k => !DATA.items[k].noLoot && (DATA.items[k].tier||1) <= maxT);
  return st.tonicStock = withSeed(`s${n}n${G.map && G.map.cur}tonic`, () => { const out = ['medkit']; for(const k of shuffle(ids)) if(!out.includes(k) && out.length < 6) out.push(k); return out; }); }
function drawStoreTonics(st, cx, y0, W2, row){
  storeTonics(st).forEach((id, i) => { const d = itemDef(id); if(!d) return; const c = Math.round(price(d.cost, st, 'item', id));
    row(i, d.name, d.desc, c, () => spend(c, () => { itemAdd(id); toast(`${d.name} added to Ship → Armoury → Tonics.`); }), { stats:(ITEM_KIND[d.kind]||[''])[0], tipT:`${d.desc} Give it to one crew member from Ship → Armoury → Tonics.` }); });
}
SENDOFF.push({ id:'tonics', t:2, text:'A medical crate: tonics, stims and medkits.', fx:{ item:['muscle', 'biscuit', 'stim', 'medkit', 'medkit'] } });
Object.assign(BASE.events, {
  items_gym:{ weight:.8, art:'station', text:'A zero-gravity gym on this station is offering a free trial session. The instructor is a Pebblekin with arms like girders.', choices:[
    { text:'Send the whole crew.', effect:{ text:'Everyone aches for a day. Everyone is a little stronger.', xp:{ skill:'combat', amt:15 }, crewHurt:10 } },
    { text:'Buy their protein supply (20 scrap).', req:{ scrap:20 }, cost:{ scrap:20 }, effect:{ text:'Three tubs of Muscle Tonic. It tastes of strawberries and regret.', item:['muscle', 'muscle', 'biscuit'] } } ] },
  items_herbalist:{ weight:.8, art:'planet', text:'A Sloog herbalist has a stall at this beacon: jars of glowing things, all labelled in a handwriting nobody can read.', choices:[
    { text:'Buy a jar of "the good stuff" (15 scrap).', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'It is, genuinely, the good stuff.', item:'random' } },
    { text:'Ask for her rarest brew.', chance:.3, success:{ text:'She sighs, and hands you a tiny golden bottle. "Don\'t waste it."', item:'elixir' }, fail:{ text:'She laughs and gives you some cookies instead.', item:'cookies' } } ] }
});
