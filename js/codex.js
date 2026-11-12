/* The Codex: a spotter's guide that fills in as you play. Every enemy ship you meet, every weapon, drone and augment you
   carry, every people you crew with and every sector you cross is written up; the rest stay as question marks with a
   hint. Filling a section to 25, 50, 75 and 100% earns captain xp. Record → Codex. Kept in PROFILE.codex. */
const CODEX_TABS = [
  { k:'en', name:'Ships',    src:() => DATA.enemies,  verb:'met' },
  { k:'wp', name:'Weapons',  src:() => DATA.weapons,  verb:'carried' },
  { k:'dr', name:'Drones',   src:() => DATA.drones,   verb:'flown' },
  { k:'au', name:'Augments', src:() => DATA.augments, verb:'fitted' },
  { k:'ra', name:'Peoples',  src:() => DATA.races,    verb:'crewed with' },
  { k:'se', name:'Sectors',  src:() => DATA.sectors,  verb:'crossed' } ];
const CODEX_XP = 40;
function codex(){ const c = PROFILE.codex = PROFILE.codex || {}; for(const t of CODEX_TABS) c[t.k] = c[t.k] || {}; c.ev = c.ev || {}; c.won = c.won || {}; c.ms = c.ms || {}; return c; }
function codexIds(t){ try{ return Object.keys(t.src() || {}).filter(id => { const d = t.src()[id]; return d && d.name && !(t.k==='ra' && d.drone); }); }catch(e){ return []; } }
function codexCount(t){ const c = codex()[t.k], ids = codexIds(t); return [ids.filter(id => c[id]).length, ids.length]; }
function codexTotal(){ let a = 0, b = 0; for(const t of CODEX_TABS){ const [x, y] = codexCount(t); a += x; b += y; } return [a, b]; }
function codexMark(k, id, n){
  if(!id || !G || G.tut || typeof PROFILE==='undefined') return; const c = codex(), fresh = !c[k][id]; c[k][id] = (c[k][id] || 0) + (n == null ? 1 : n); if(!fresh) return;
  const t = CODEX_TABS.find(t => t.k===k); if(!t || !(t.src() || {})[id]) return; UI.codexNew = (UI.codexNew || 0) + 1;
  const [a, b] = codexCount(t), pct = b ? a/b : 0;
  for(const m of [25, 50, 75, 100]){ const key = k + m; if(pct*100 >= m && !c.ms[key]){ c.ms[key] = 1; if(typeof capGain==='function') capGain(CODEX_XP*(m===100 ? 3 : 1));
      if(typeof toast==='function') toast(m===100 ? `Codex: every one of the ${t.name.toLowerCase()} written up. +${CODEX_XP*3} captain xp.` : `Codex: ${m}% of ${t.name.toLowerCase()} written up. +${CODEX_XP} captain xp.`); } }
}
/* everything aboard right now goes in the book */
function codexSweep(){ if(!G || !G.ship) return; const s = G.ship, c = codex(), once = (k, id) => { if(id && !c[k][id]) codexMark(k, id); };
  for(const w of s.weapons || []) if(w) codexMark('wp', w.id || w); for(const d of s.drones || []) if(d) once('dr', d.id || d); for(const a of s.augments || []) if(a) once('au', a.id || a);
  for(const m of s.crew || []) if(m.owner==='p' && !m.drone) once('ra', m.race); once('se', G.sectorType); }
(function(){
  const s0 = startCombat; startCombat = function(id, o){ const r = s0(id, o); try{ if(G && G.enemy) codexMark('en', G.enemy.id); }catch(e){} return r; };
  const f0 = finishCombat; finishCombat = function(kind, offer){ const id = G && G.enemy && G.enemy.id; f0(kind, offer); try{ if(id && kind!=='fled' && G && !G.tut){ const c = codex(); c.won[id] = (c.won[id] || 0) + 1; } }catch(e){} };
  const a0 = arrive; arrive = function(i){ const r = a0(i); try{ codexSweep(); if(typeof saveProfile==='function' && UI.codexNew) saveProfile(); }catch(e){} return r; };
  const e0 = startEvent; startEvent = function(id, o){ try{ if(G && !G.tut && DATA.events[id]){ const c = codex(); c.ev[id] = 1; } }catch(e){} return e0(id, o); };
  const n0 = newRun; newRun = function(...a){ const r = n0(...a); try{ codexSweep(); }catch(e){} return r; };
})();

/* ---------------- the book ---------------- */
function openCodex(back){ UI.codexBack = back || UI.screen; UI.codexTab = UI.codexTab || 'en'; UI.codexPage = 0; UI.codexNew = 0; UI.screen = 'codex'; }
function codexLines(t, id, d, known){
  const c = codex();
  if(t.k==='en'){ const S = Object.keys(d.systems || {}), w = (d.weapons || []).map(x => (DATA.weapons[x] || {}).name || x);
    if(!known) return [`Seen in sectors ${(d.sectors || [1, 8]).join(' to ')}.`, 'Not yet met.'];
    return [`Hull ${d.hull} · ${S.length} systems · shields ${(d.systems || {}).shields ? Math.floor(d.systems.shields/2) : 0} · crew ${(d.crew || []).length}`, w.length ? `Guns: ${[...new Set(w)].join(', ')}` : 'Unarmed', `Met ${c.en[id]} · beaten ${c.won[id] || 0}`]; }
  if(t.k==='wp'){ if(!known) return [`A${/^[aeiou]/.test(d.type || '') ? 'n' : ''} ${d.type || 'weapon'}${d.tier ? ', tier ' + d.tier : ''}.`, 'Not yet carried.'];
    return [`${cap(d.type || 'weapon')} · ${d.damage != null ? d.damage + ' dmg' : ''}${d.shots > 1 ? ' ×' + d.shots : ''} · ${d.charge}s · ${d.power} power`, d.desc || (typeof weaponBlurb==='function' ? weaponBlurb(d) : ''), `Carried through ${c.wp[id]} jump${c.wp[id]===1 ? '' : 's'}`]; }
  if(t.k==='dr'){ if(!known) return [`A${/^[aeiou]/.test(d.kind || '') ? 'n' : ''} ${d.kind || 'utility'} drone.`, 'Not yet flown.']; return [`${cap(d.kind || 'drone')} · ${d.power} power`, d.desc || '', '']; }
  if(t.k==='au'){ if(!known) return ['Sold in stores and found in wrecks.', 'Not yet fitted.']; return [d.desc || '', '', '']; }
  if(t.k==='ra'){ if(!known) return [d.secret ? 'A people few captains ever meet.' : 'Hire one at a store or rescue one.', 'Not yet aboard.']; return [`${d.hp || 100} health`, d.desc || '', '']; }
  if(t.k==='se'){ if(!known) return ['Somewhere out there.', 'Not yet crossed.']; return [d.blurb || '', '', '']; }
  return [];
}
function drawCodex(){
  const c = codex(), [ta, tb] = codexTotal(), evAll = Object.keys(DATA.events).filter(id => !/^(tut|fun|g3_graveyard)/.test(id)).length, evSeen = Object.keys(c.ev).filter(id => DATA.events[id]).length;
  label('What you have seen so far', 60, 64, C.muted, 'left', 15); T('The Codex', 60, 116, { s:44, f:FD, w:700, c:C.amber });
  btn(1360, 46, 150, 50, 'Close', () => { UI.screen = UI.codexBack || 'record'; }, { s:17 });
  T(`${ta} of ${tb} written up`, 1330, 70, { s:18, a:'right', c:C.ink, f:FD, w:600 }); bar(1050, 84, 280, 8, tb ? ta/tb : 0, C.amber);
  T(`Stories seen: ${evSeen} of ${evAll}`, 1330, 116, { s:13, a:'right', c:C.muted });
  let x = 60; const w = typeof drawArchive==='function' ? 196 : 232; for(const t of CODEX_TABS){ const [a, b] = codexCount(t), on = UI.codexTab===t.k;
    btn(x, 142, w, 54, '', () => { UI.codexTab = t.k; UI.codexPage = 0; }, { fill:on, s:16 });
    T(t.name, x + 16, 166, { s:17, f:FD, w:700, c:on ? '#1a1206' : C.amber }); T(`${a}/${b}`, x + w - 16, 166, { s:13, a:'right', c:on ? '#1a1206' : C.muted });
    bar(x + 16, 178, w - 32, 5, b ? a/b : 0, on ? '#1a1206' : (a===b && b ? C.good : C.cyan), on ? 'rgba(0,0,0,.18)' : C.panel2); x += w + 8; }
  if(typeof drawArchive==='function'){ const on = UI.codexTab==='lore', L = loreList(), a = L.filter(e => loreBook()[e.id]).length, unread = L.filter(e => loreBook()[e.id] && !PROFILE.loreRead[e.id]).length;
    btn(x, 142, w, 54, '', () => { UI.codexTab = 'lore'; }, { fill:on, s:16, col:C.cyan }); T('📜 Archive', x + 14, 166, { s:17, f:FD, w:700, c:on ? '#1a1206' : C.cyan });
    T(unread ? `${unread} new` : `${a}/${L.length}`, x + w - 12, 166, { s:13, a:'right', c:on ? '#1a1206' : unread ? C.amber : C.muted }); bar(x + 14, 178, w - 28, 5, a/L.length, on ? '#1a1206' : C.cyan, on ? 'rgba(0,0,0,.18)' : C.panel2);
    if(on){ drawArchive(); return; } }
  const t = CODEX_TABS.find(t => t.k===UI.codexTab) || CODEX_TABS[0], src = t.src() || {}, known = c[t.k];
  const ids = codexIds(t).sort((p, q) => (known[q] ? 1 : 0) - (known[p] ? 1 : 0) || String(src[p].name).localeCompare(String(src[q].name)));
  const cols = 3, rows = 5, per = cols*rows, pages = Math.max(1, Math.ceil(ids.length/per)); UI.codexPage = clamp(UI.codexPage || 0, 0, pages - 1);
  const cw = 480, chh = 122, gx = 12, gy = 10;
  ids.slice(UI.codexPage*per, UI.codexPage*per + per).forEach((id, i) => { const d = src[id], k = !!known[id], cx = 60 + (i % cols)*(cw + gx), cy = 212 + Math.floor(i/cols)*(chh + gy), L = codexLines(t, id, d, k);
    rr(cx, cy, cw, chh, 8); ctx.fillStyle = k ? 'rgba(18,24,44,.92)' : 'rgba(12,16,30,.7)'; ctx.fill(); ctx.strokeStyle = k ? hexA(d.color || C.amber, .45) : 'rgba(120,135,170,.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    if(k && (d.color || t.k==='en')){ ctx.fillStyle = d.color || C.hostile; ctx.fillRect(cx, cy + 14, 4, chh - 28); }
    T(k ? d.name : '? ? ?', cx + 20, cy + 32, { s:19, f:FD, w:700, c:k ? (t.k==='en' ? '#ff9db0' : C.amber) : C.muted, max:cw - 40 });
    if(k && t.k==='en' && c.won[id]) T('✓', cx + cw - 22, cy + 32, { s:17, a:'center', c:C.good });
    let y = cy + 54; for(const [j, ln] of L.entries()){ if(!ln) continue; const last = j===L.length - 1 && k && L.length===3 && t.k!=='au' && t.k!=='se' && t.k!=='ra';
      if(last){ T(ln, cx + 20, cy + chh - 14, { s:12, c:C.muted, max:cw - 40 }); continue; }
      const h = para(ln, cx + 20, y, cw - 40, { s:13, lh:17, max:k && L.filter(Boolean).length===1 ? 4 : 2, c:k ? C.ink : C.muted }); y += (typeof h==='number' && h > 0 ? h : 17*Math.min(2, Math.ceil(String(ln).length/56))) + 2; } });
  if(pages > 1){ btn(60, 884, 150, 46, '‹ Previous', () => UI.codexPage--, { disabled:UI.codexPage <= 0, s:15 }); T(`Page ${UI.codexPage + 1} of ${pages}`, 800, 912, { s:14, a:'center', c:C.muted }); btn(1368, 884, 150, 46, 'Next ›', () => UI.codexPage++, { disabled:UI.codexPage >= pages - 1, s:15 }); }
  else T(`Fill a section to 25, 50, 75 and 100% for captain xp.`, 800, 912, { s:14, a:'center', c:C.muted });
}
