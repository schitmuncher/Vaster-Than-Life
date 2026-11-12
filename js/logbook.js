'use strict';
/* =========================================================================
   The captain's log, written properly, and kept.
   - Every jump, beacon, choice, fight (how long, how much it hurt, what it
     paid), purchase spree, new crew member, level-up, death and funeral goes
     in, stamped with the jump and sector, plus the captain's own remarks
     now and then (more candid with Grown-up humour on).
   - Each run's log is kept when it ends (the last 15 runs). Read them on
     Record → Captain's logs, or the current one from Ship → Log.
   ========================================================================= */
const LOG_MAX = 400, LOGS_KEEP = 15;
const LOG_ICON = { jump:'➜', sector:'✦', event:'?', fight:'⚔', win:'✓', loss:'✗', store:'£', crew:'☺', death:'✝', level:'▲', note:'✎', end:'■', start:'⚑' };
(function(){ logEntry = function(t, k){ if(!G) return; const L = (G.log = G.log || []); L.push({ s:G.sector, t:fixThe(String(t)), j:(G.stats && G.stats.jumps) || 0, k:k || 'note', tm:Math.round(G.time || 0) }); if(L.length > LOG_MAX) L.splice(0, L.length - LOG_MAX); }; })();
const firstSentence = t => { t = String(t || '').replace(/\s+/g, ' ').trim(); const m = t.match(/^.{20,180}?[.!?](\s|$)/); return m ? m[0].trim() : t.slice(0, 180); };
const CAPTAIN_NOTES = ['The coffee machine has started making a noise like a dying bird. It still makes better coffee than the cook.', 'Morale is high. Or the crew have found the medical alcohol again.', 'Spent an hour staring out of the viewport. Space is very big. I am very tired.', 'Someone has labelled every cupboard in the galley. Someone else has relabelled them all as "cupboard".', 'Found a sock in the reactor housing. Nobody will admit to it. It is not even a pair.', 'The navigation computer and I have agreed to disagree.', 'Inspected the ship. She is held together by tape, prayer and spite. Mostly spite.', 'Wrote a letter home. Remembered there is nobody at home. Wrote it anyway.', 'The crew asked for a pay rise. I reminded them we are all wanted criminals. They asked for a pay rise anyway.', 'Quiet day. I hate quiet days. Something always happens after a quiet day.', 'Taught the crew a card game. They have taught me I should not play cards.', 'Somebody has drawn a moustache on the Admiral\'s portrait in the briefing room. It suits him.'];
const CAPTAIN_NOTES_ADULT = ['Note to self: never again let the engineer brew anything in the hydroponics bay. Still can\'t feel my teeth.', 'Woke up in the escape pod with a traffic cone and no memory of the last beacon. Crew say I gave a speech. Crew are smirking.', 'Third complaint this week about noises from the crew quarters. Told them the walls are thin and the vents carry. Told them twice.', 'The medic has diagnosed half the crew with "being a bunch of whinging bastards". Not sure that\'s a real condition. Agree with it.', 'Found out what the cook puts in the stew. Wish I hadn\'t. Ate it anyway. It was good. God help me.', 'Somebody used my captain\'s chair as a bed last night. And not alone. I am having it cleaned. Twice.', 'The toilet on deck two has achieved something close to sentience, and it hates us.', 'Hangover. The kind where the stars look personally offended. Flying by memory.', 'Crew held a talent show. I have seen things a captain should not see. The Mullock\'s act will haunt me.', 'Told the crew we\'re low on supplies. They asked which supplies. I said the good gin. Mutiny was narrowly avoided.'];
function logNote(){ if(!G || Math.random() > .25) return; const pool = CAPTAIN_NOTES.concat(typeof grownUp==='function' && grownUp() ? CAPTAIN_NOTES_ADULT : []); const used = new Set((G.log || []).map(e => e.t)); const fresh = pool.filter(t => !used.has('Personal: ' + t)); if(fresh.length) logEntry('Personal: ' + pick(fresh), 'note'); }
const BEACON_WORD = { event:'a beacon with something on it', combat:'a beacon with company', store:'a store', empty:'a quiet beacon', exit:'the sector exit', base:'Commonwealth command', haven:'Haven\'s Rest', start:'the start' };
function logDeath(f){ logEntry(`${f.name} died: ${f.why}. Last words: "${f.words}"`, 'death'); }
(function(){
  // arrivals: where, what, and what it cost to get there
  const a0 = arrive; arrive = function(i){ const n = G && G.map && G.map.nodes[i], sp = G ? (G.spent || 0) - (G._logSpent || 0) : 0;
    // jumping out of a fight that is still going
    if(G && G._logFight && G.enemy && !G.enemy.dead){ const L0 = G._logFight, lost = Math.max(0, L0.hull - G.ship.hull), secs = Math.round((G.combatT || 0) - L0.t);
      logEntry(`Jumped away from the ${L0.name}${secs > 0 ? ' after ' + secs + ' seconds' : ''}, ${lost ? lost + ' hull the worse for it' : 'without a scratch'}.`, 'fight'); }
    if(G) G._logFight = null;
    if(G && sp > 0 && G._logStore){ logEntry(`Spent ${sp} scrap at the store.`, 'store'); } if(G){ G._logSpent = G.spent || 0; G._logStore = false; }
    const r = a0(i);
    if(n && G){ const bits = [BEACON_WORD[n.type] || 'a beacon']; if(n.nebula) bits.push('in a nebula'); if(n.hazard) bits.push(`near ${({ sun:'a star', asteroids:'asteroids', ionstorm:'an ion storm', pulsar:'a pulsar' })[n.hazard] || n.hazard}`); if(n.distress) bits.push('answering a distress call');
      logEntry(`Jump ${G.stats.jumps}: ${bits.join(', ')}. Fuel ${G.fuel}, scrap ${G.scrap}, hull ${G.ship.hull}/${G.ship.maxHull}.`, 'jump');
      if(n.type==='store') G._logStore = true;
      if(n.type==='empty' || n.type==='store') logNote(); }
    return r; };
  // choices: the situation, the decision and how it went
  const c0 = chooseOption; chooseOption = function(ch){ const m = G && G.modal, ev = m && m.type==='event' ? (m.inline || (DATA.events[m.id] || {})) : null, sit = ev ? firstSentence(fillText(ev.text, m.ctx || {})) : '';
    const n0 = G && G.log ? G.log.length : 0; c0(ch);
    if(G && G.log && G.log.length > n0 && sit){ const e = G.log[G.log.length - 1]; e.t = `${sit} → ${e.t}`; e.k = 'event'; const r = G.modal; if(r && r.type==='result' && r.lines && r.lines.length) e.t += ` [${r.lines.slice(0, 5).join(' · ')}]`; } };
  // fights: how long, how much it hurt, what it paid
  const s0 = startCombat; startCombat = function(id, o){ const r = s0(id, o); if(G && G.enemy){ G._logFight = { hull:G.ship.hull, t:G.combatT || 0, crew:G.ship.crew.filter(c => c.owner==='p' && !c.drone).length, name:G.enemy.name };
      const e = G.log && G.log[G.log.length - 1]; if(e && /^Engaged/.test(e.t)){ e.k = 'fight'; e.t += ` Hull ${G.enemy.hull}, ${G.enemy.crew.filter(c => !c.drone).length} crew, ${G.enemy.weapons.filter(Boolean).length} weapons.`; } } return r; };
  const f0 = finishCombat; finishCombat = function(kind, offer){ const L0 = G && G._logFight; f0(kind, offer); if(!L0 || !G) return; G._logFight = null;
    const secs = Math.round((G.combatT || 0) - L0.t), lost = Math.max(0, L0.hull - G.ship.hull), crewNow = G.ship.crew.filter(c => c.owner==='p' && !c.drone).length, m = G.modal;
    const loot = m && m.type==='result' && m.lines ? m.lines.filter(l => /scrap|fuel|missile|part|food|weapon|drone|augment|crew/i.test(l)).slice(0, 4).join(', ') : '';
    const how = { destroyed:'Destroyed', crew:'Killed every last one of the crew of', surrender:'Accepted the surrender of', fled:'Lost' }[kind] || 'Finished with';
    const parts = [secs > 0 ? `${secs} seconds` : '', lost ? `${lost} hull damage` : 'not a scratch on the hull', crewNow < L0.crew ? `${L0.crew - crewNow} crew lost` : ''].filter(Boolean).join(', ');
    logEntry(`${how} the ${L0.name}${kind==='fled' ? ' when they ran' : ''}. ${cap1(parts)}.${loot ? ' Took: ' + loot + '.' : ''}`, kind==='fled' ? 'fight' : 'win'); };
  // people
  if(typeof sagaJoined==='function'){ const j0 = sagaJoined; sagaJoined = function(c, how){ j0(c, how); if(G && c && c.owner==='p') logEntry(`${c.name} (${(DATA.races[c.race] || {}).name || c.race}${c.quirk && typeof quirkDef==='function' && quirkDef(c.quirk) ? ', ' + quirkDef(c.quirk).name.toLowerCase() : ''}) joined the crew${how ? ' ' + how : ''}.`, 'crew'); }; }
  if(typeof loLevelUp==='function'){ const l0 = loLevelUp; loLevelUp = function(c){ l0(c); if(G && c && c.owner==='p' && (loLvl(c) % 5===0 || loLvl(c)===3)) logEntry(`${c.name} reached level ${loLvl(c)}.`, 'level'); }; }
  // runs end: keep the log
  const r0 = recordRun; recordRun = function(win, reason){ r0(win, reason); try{ if(!G || G.tut) return; logEntry(win ? 'The Dreadnought is finished. We made it.' : `The end: ${String(reason || 'the ship was lost').replace(/\.+$/, '')}.`, 'end');
    const entry = { t:Date.now(), ship:G.ship.name, def:G.shipDef, win:!!win, sector:G.sector, diff:G.diff || SET.difficulty, mode:typeof modeNow==='function' ? modeNow().name : '', seed:G.seed || '', time:Math.round(G.time || 0), jumps:G.stats.jumps, kills:G.stats.kills, reason:win ? '' : String(reason || '').slice(0, 80), daily:G.daily || null, log:(G.log || []).slice(-300) };
    PROFILE.logs = [entry, ...(PROFILE.logs || [])].slice(0, LOGS_KEEP); saveProfile(); }catch(e){} };
})();

/* ---------------- the reader ---------------- */
function openLogbook(back, idx){ UI.logBack = back || UI.screen; UI.logIdx = idx == null ? (G && UI.screen==='game' ? -1 : 0) : idx; UI.logPage = null; UI.logWas = UI.screen; UI.screen = 'logs'; }
function logSource(i){ if(i===-1 && G && G.log) return { ship:G.ship.name, live:true, sector:G.sector, jumps:G.stats.jumps, time:Math.round(G.time || 0), log:G.log, t:Date.now() }; return (PROFILE.logs || [])[i] || null; }
function drawLogbook(){
  const L = PROFILE.logs || [], live = !!(G && G.log && UI.logWas==='game'), list = (live ? [-1] : []).concat(L.map((_, i) => i));
  if(!list.includes(UI.logIdx)) UI.logIdx = list[0];
  label('Captain\'s logs', 60, 64, C.muted, 'left', 15); T('The ship\'s log', 60, 116, { s:44, f:FD, w:700, c:C.amber });
  btn(1400, 40, 160, 52, 'Close', () => { UI.screen = UI.logBack || 'record'; if(UI.screen==='game' && G && UI.logModal){ G.modal = UI.logModal; UI.logModal = null; } }, { s:17 });
  if(!list.length){ para('No logs yet. Every run you finish from now on keeps its log here.', 60, 200, 900, { s:20, c:C.muted }); return; }
  // the runs
  panel(60, 150, 420, 820, 12); label('Voyages', 84, 186, C.amber, 'left', 14);
  list.slice(0, 16).forEach((i, k) => { const s = logSource(i); if(!s) return; const y = 204 + k*46, on = i===UI.logIdx, d = new Date(s.t || 0);
    rr(76, y, 388, 40, 8); ctx.fillStyle = on ? hexA(C.amber, .16) : 'rgba(6,9,18,.5)'; ctx.fill(); if(on){ ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5; ctx.stroke(); }
    T(s.live ? `${mcap(theName(s.ship))} · now` : mcap(theName(s.ship)), 90, y + 18, { s:15, f:FD, w:700, c:on ? C.amber : C.ink, max:240 });
    T(s.live ? `sector ${s.sector}, in progress` : `${d.getDate()} ${d.toLocaleString('en-GB', { month:'short' })} · ${s.win ? 'won' : 'lost in sector ' + s.sector}${s.daily ? ' · daily' : ''}`, 90, y + 34, { s:12, c:s.win ? C.good : C.muted, max:360 });
    region(76, y, 388, 40, () => { UI.logIdx = i; UI.logPage = null; }, 'log:' + i); });
  // the pages
  const s = logSource(UI.logIdx); if(!s) return; const x = 510, w = 1030;
  panel(x, 150, w, 820, 12);
  if(!s.live && typeof openGazette==='function') btn(x + w - 204, 164, 180, 40, '📰 Front page', () => openGazette(s, 'logs'), { s:14, col:C.amber });
  T(`${mcap(theName(s.ship))}${s.live ? ' · this run so far' : s.win ? ' · victory' : ' · lost'}`, x + 24, 192, { s:24, f:FD, w:700, c:s.win ? C.good : C.amber, max:w - 48 });
  T([s.mode, s.diff && cap1(s.diff), `${s.jumps || 0} jumps`, s.kills != null ? `${s.kills} kill${s.kills===1 ? '' : 's'}` : '', s.time ? `${typeof fmtTime==='function' ? fmtTime(s.time) : s.time + 's'} in action` : '', s.seed ? 'seed ' + s.seed : ''].filter(Boolean).join(' · '), x + 24, 218, { s:13, c:C.muted, max:w - 48 });
  // pages by height, so a long entry never pushes another one off the page
  const rows = s.log || [], sz = MINF && 15 < MINF ? Math.max(18, Math.min(MINF, 15*1.35)) : 15, lh = Math.round(19*sz/15), font = `400 ${sz}px ${FM}`,
    hOf = e => Math.max(26, Math.min(3, lines(e.t || '', w - 160, font).length)*lh) + 6, P = [[]]; let used = 0;
  for(const e of rows){ const h = hOf(e); if(used + h > 640 && P[P.length - 1].length){ P.push([]); used = 0; } P[P.length - 1].push(e); used += h; }
  const pages = P.length; if(UI.logPage == null) UI.logPage = s.live ? pages - 1 : 0; const pg = clamp(UI.logPage, 0, pages - 1);
  let y = 252;
  for(const e of P[pg]){ const col = { death:C.hostile, win:C.good, fight:C.warn, sector:C.cyan, store:'#9fdc7a', crew:C.cyan, level:C.amber, note:'#c9b7ff', end:C.hostile, start:C.amber }[e.k] || C.ink;
    T(LOG_ICON[e.k] || '·', x + 34, y + 1, { s:16, a:'center', c:col }); T(`S${e.s}${e.j != null ? ' J' + e.j : ''}`, x + 56, y + 1, { s:12, f:FD, w:700, c:C.muted });
    para(e.t, x + 130, y, w - 160, { s:15, lh:19, max:3, c:e.k==='note' ? '#d9ccff' : C.ink }); y += hOf(e); }
  if(pages > 1){ btn(x + 24, 912, 160, 44, '‹ Earlier', () => { UI.logPage = pg - 1; }, { s:15, disabled:pg <= 0 }); T(`Page ${pg + 1} of ${pages}`, x + w/2, 942, { s:14, a:'center', c:C.muted }); btn(x + w - 184, 912, 160, 44, 'Later ›', () => { UI.logPage = pg + 1; }, { s:15, disabled:pg >= pages - 1 }); }
}
function cap1(t){ return t ? String(t)[0].toUpperCase() + String(t).slice(1) : ''; }
// average run length on the Record screen (here, not modes.js: drawRecord lives in ui.js, which loads later)
(function(){ if(typeof drawRecord!=='function') return; const d0 = drawRecord; drawRecord = function(){ d0(); const h = (PROFILE.history || []).filter(e => !e.daily).slice(0, 10); if(h.length < 2) return;
  const avgT = h.reduce((t, e) => t + (e.time || 0), 0)/h.length, avgS = h.reduce((t, e) => t + (e.sector || 0), 0)/h.length, avgJ = h.reduce((t, e) => t + (e.jumps || 0), 0)/h.length;
  T(`Your last ${h.length} runs: ${fmtTime(avgT)} of action on average (not counting pauses and reading), ${avgJ.toFixed(0)} jumps, reaching sector ${avgS.toFixed(1)}.`, 132, 722, { s:13, c:C.muted, max:850 }); }; })();
