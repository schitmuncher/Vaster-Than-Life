'use strict';
/* =========================================================================
   Playing together without a room:
   - Seed duels: any finished run can be sent as a link or code. Your friend
     flies the same seed (same maps, events and shops) and sees whose score
     wins; their answer comes back the same way.
   - Challenge codes: build a challenge (ship, difficulty, goal, loadout,
     rules), share it as a code, or play one a friend made.
   - The weekly cup and the daily boards: everyone flies the same run, and
     scores are posted to public Nostr relays, signed with a key made on this
     device. Nothing else about you leaves the device.
   ========================================================================= */
const CODES = { tab:'cup', boards:{}, incoming:null, share:null, build:null, msg:'', page:0 };
const CODE_PRE = 'VTL1.';
function codeEnc(obj){ return CODE_PRE + NC.b64url(JSON.stringify(obj)); }
function codeDec(s){
  try{ s = String(s||'').trim(); const m = /[#&?]vtl=([A-Za-z0-9_.-]+)/.exec(s); if(m) s = m[1];
    s = s.replace(/^VTL1?\./i, ''); const o = JSON.parse(NC.unb64url(s)); return o && typeof o==='object' ? o : null; }catch(e){ return null; } }
function codeLink(obj){ return location.origin + location.pathname + '#vtl=' + codeEnc(obj).slice(CODE_PRE.length); }
function copyText(t, what){ if(navigator.clipboard && !inXR()) navigator.clipboard.writeText(t).then(() => toast(`${what} copied.`)).catch(() => toast('Could not copy here.')); else toast('Copying is not available here.'); }
function cleanName(s){ return String(s||'').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 22) || 'Someone'; }
function mpCodesOpen(v){ CODES.msg = ''; if(v==='cup') boardLoadTab(); if(v==='codes' && !CODES.build) CODES.build = buildDefault(); }
/* a link opened the game: …#vtl=… */
function mpCodesCheckLink(){
  const m = /[#&]vtl=([A-Za-z0-9_.-]+)/.exec(location.hash || ''); if(!m) return false;
  history.replaceState(null, '', location.pathname + location.search);
  const o = codeDec(m[1]); if(!o){ toast('That link could not be read.'); return false; }
  codesIncoming(o); return true;
}
function codesIncoming(o){
  if(o.k==='sd'){ CODES.incoming = o; UI.screen = 'mp'; MP.view = 'seed'; if(o.re) seedLogAnswer(o); }
  else if(o.k==='ch'){ CODES.incoming = o; UI.screen = 'mp'; MP.view = 'codes'; if(!CODES.build) CODES.build = buildDefault(); }
  else toast('That code is for a newer version of the game.');
}
function codesPaste(){
  openRename({ title:'Paste a link or code', value:'', max:3000, onOk:(v) => { const o = codeDec(v); if(!o){ toast('That is not a Vaster Than Life code.'); return; } codesIncoming(o); } });
}

/* ---------------- seed duels ---------------- */
function seedPayload(h, re){ return { k:'sd', v:1, seed:h.seed, sh:h.ship, d:h.diff || 'normal', n:mpName(), sc:h.score||0, sec:h.sector||1, w:h.win?1:0, mo:MODS.filter(m => m.enabled).length, re }; }
function seedShare(h){ const o = seedPayload(h); CODES.share = { link:codeLink(o), code:codeEnc(o), short:`${h.seed} · ${(DATA.ships[h.ship]||{}).name || h.ship} · ${(DIFFICULTY[h.diff]||DIFFICULTY.normal).name}`, what:'Seed duel' }; }
function seedAccept(){
  const o = CODES.incoming; if(!o || !o.seed) return; applyMods();
  const ship = DATA.ships[o.sh] ? o.sh : 'pestrel';
  newRun(ship, null, { seed:o.seed, diff:o.d, seedDuel:{ n:cleanName(o.n), sc:+o.sc||0, sec:+o.sec||1, w:o.w?1:0 } });
  CODES.incoming = null;
}
function seedLogAnswer(o){ const L = PROFILE.seedDuels = PROFILE.seedDuels || [];
  L.unshift({ t:Date.now(), seed:o.seed, sh:o.sh, them:{ n:cleanName(o.n), sc:+o.sc||0, sec:+o.sec||1, w:o.w?1:0 }, me:{ sc:+o.re.sc||0, sec:+o.re.sec||1, w:o.re.w?1:0 } });
  PROFILE.seedDuels = L.slice(0, 20); saveProfile(); }
function drawSeedView(){
  mpTitle('SEED DUEL', 'No room needed');
  const o = CODES.incoming;
  if(o && o.k==='sd'){
    panel(80, 200, 900, 420, 14); const shipN = (DATA.ships[o.sh]||{}).name || o.sh, diffN = (DIFFICULTY[o.d]||DIFFICULTY.normal).name;
    if(o.re){ const me = o.re, mine = +me.sc||0, theirs = +o.sc||0;
      label('An answer to your challenge', 110, 244, C.cyan, 'left', 15);
      T(theirs > mine ? `${cleanName(o.n)} wins` : theirs < mine ? 'You win!' : 'A dead heat', 110, 300, { s:44, f:FD, w:700, c: theirs < mine ? C.good : theirs > mine ? C.hostile : C.amber });
      T(`You: ${fmtNum(mine)} pts, sector ${me.sec}${me.w ? ', won' : ''}`, 110, 360, { s:20 }); T(`${cleanName(o.n)}: ${fmtNum(theirs)} pts, sector ${o.sec}${o.w ? ', won' : ''}`, 110, 394, { s:20 });
      T(`${shipN} · ${diffN} · seed ${o.seed}`, 110, 440, { s:16, c:C.muted });
      btn(110, 520, 300, 64, 'Back', () => { CODES.incoming = null; }, { s:18 }); }
    else { label(`${cleanName(o.n)} challenges you`, 110, 244, C.cyan, 'left', 15);
      T(`Beat ${fmtNum(+o.sc||0)} points`, 110, 304, { s:46, f:FD, w:700, c:C.amber });
      T(`${shipN} · ${diffN} · seed ${o.seed}`, 110, 352, { s:20 });
      T(`They reached sector ${o.sec}${o.w ? ' and won' : ''}.`, 110, 386, { s:18, c:C.muted });
      if(o.mo) para(`They flew with ${o.mo} mod${o.mo===1?'':'s'} on. For exactly the same run you need the same mods.`, 110, 420, 820, { s:15, c:C.warn });
      btn(110, 520, 360, 70, 'Accept: fly it now', () => seedAccept(), { fill:true, s:20, col:C.good });
      btn(490, 520, 200, 70, 'Not now', () => { CODES.incoming = null; }, { s:18 }); }
  } else {
    label('Send one of your runs', 80, 214, C.amber, 'left', 16);
    const hist = (PROFILE.history||[]).filter(h => h.seed && !h.daily).slice(0, 8);
    if(!hist.length) T('Finish a run first: then you can send it to a friend.', 80, 260, { s:18, c:C.muted });
    hist.forEach((h, i) => { const y = 228 + i*64; panel(80, y, 900, 56, 8);
      T(`${(DATA.ships[h.ship]||{}).name || h.ship}`, 100, y+24, { s:17, f:FD, w:700, max:260 }); T(`${h.win ? 'Won' : 'Sector ' + h.sector} · ${fmtNum(h.score)} pts · ${(DIFFICULTY[h.diff]||{}).name || ''}`, 100, y+46, { s:13, c:C.muted });
      T(h.seed, 560, y+36, { s:16, c:C.cyan }); btn(820, y+8, 140, 40, 'Send', () => seedShare(h), { s:15, col:C.good }); });
    btn(80, 760, 320, 60, 'Open a link or code', () => codesPaste(), { s:17, col:C.cyan });
  }
  // past duels
  const L = PROFILE.seedDuels || []; label('Past duels', 1020, 214, C.amber, 'left', 16); panel(1020, 228, 500, 520, 12);
  if(!L.length) para('Answers to your challenges show up here.', 1044, 270, 450, { s:15, c:C.muted });
  L.slice(0, 7).forEach((d, i) => { const y = 252 + i*70, win = d.me.sc > d.them.sc; T(`vs ${d.them.n}`, 1044, y+20, { s:17, f:FD, w:700, max:260 }); T(win ? 'You won' : d.me.sc===d.them.sc ? 'Draw' : 'They won', 1496, y+20, { s:15, a:'right', c: win ? C.good : C.hostile });
    T(`${fmtNum(d.me.sc)} vs ${fmtNum(d.them.sc)} · ${(DATA.ships[d.sh]||{}).name || d.sh}`, 1044, y+44, { s:13, c:C.muted, max:440 }); });
  if(CODES.share) drawSharePanel();
  btn(80, H-86, 200, 60, 'Back', () => { MP.view = 'menu'; CODES.incoming = null; CODES.share = null; }, { s:18 });
}
function drawSharePanel(){
  const S = CODES.share, x = 320, y = 300, w = 960, h = 380;
  ctx.fillStyle = 'rgba(4,6,12,.7)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { CODES.share = null; });
  panel(x, y, w, h, 14); region(x, y, w, h, () => {});
  label(`Share your ${S.what.toLowerCase()}`, x+28, y+40, C.amber, 'left', 16);
  para('Send the link: it opens the game with everything set up. On a headset, read out the short version instead.', x+28, y+70, w-56, { s:16, c:C.muted, lh:22 });
  if(S.short){ T(S.short, x+28, y+150, { s:30, f:FD, w:700, c:C.ink, max:w-56 }); label('Short version: enter the seed in the hangar', x+28, y+178, C.muted, 'left', 12); }
  T(S.code.slice(0, 64) + (S.code.length > 64 ? '…' : ''), x+28, y+228, { s:14, c:C.cyan, max:w-56 });
  if(inXR()) para('Copying needs a computer or phone: open this screen there to send the link.', x+28, y+h-62, w-260, { s:15, c:C.muted, lh:20 });
  else { btn(x+28, y+h-84, 260, 60, 'Copy link', () => copyText(S.link, 'Link'), { fill:true, s:18 });
    btn(x+300, y+h-84, 260, 60, 'Copy code', () => copyText(S.code, 'Code'), { s:18 }); }
  btn(x+w-208, y+h-84, 180, 60, 'Done', () => { CODES.share = null; }, { s:18 });
}

/* ---------------- challenge codes ---------------- */
const BUILD_GOALS = ['s3','s4','s5','s6','s7','win'];
const BUILD_ROWS = [
  ['hull', 'Hull', ['def', 8, 12, 15, 20, 40]], ['crew', 'Crew', ['def', 1, 2, 3]], ['scrap', 'Starting scrap', ['def', 0, 50, 100, 200]],
  ['fuel', 'Fuel', ['def', 4, 8, 25]], ['missiles', 'Missiles', ['def', 0, 4, 20]],
  ['fleet', 'Rebuff Fleet', ['normal', 'slow', 'fast', 'faster']], ['sectors', 'Sectors', [8, 4, 6, 10]], ['loot', 'Salvage', [1, .6, 1.5]],
];
function buildDefault(){ return { name:'My challenge', ship:'pestrel', diff:'normal', goal:'s5', hull:'def', crew:'def', scrap:'def', fuel:'def', missiles:'def', fleet:'normal', sectors:8, loot:1, w:['def','def','def'] }; }
function buildToDef(b){
  const ch = { name:cleanName(b.name), tier:2, ship:b.ship, difficulty:b.diff, custom:true, goal: b.goal==='win' ? { win:true } : { sector:+b.goal.slice(1) }, start:{}, rules:{} };
  for(const k of ['hull','scrap','fuel','missiles']) if(b[k]!=='def') ch.start[k] = b[k];
  if(b.crew!=='def') ch.start.crewCount = b.crew;
  if(b.w.some(x => x!=='def')){ ch.start.weapons = b.w.filter(x => x!=='none' && x!=='def' && DATA.weapons[x]); }
  if(b.fleet!=='normal') ch.rules.fleetSpeed = { slow:.08, fast:.16, faster:.2 }[b.fleet];
  if(b.sectors!==8) ch.rules.sectors = b.sectors;
  if(b.loot!==1) ch.scrapMult = b.loot;
  const bits = [`${(DATA.ships[b.ship]||{}).name || b.ship}, ${(DIFFICULTY[b.diff]||DIFFICULTY.normal).name}.`];
  if(ch.start.hull) bits.push(`Hull ${ch.start.hull}.`); if(ch.start.crewCount) bits.push(`${ch.start.crewCount} crew.`); if(ch.start.weapons) bits.push(ch.start.weapons.length ? `Guns: ${ch.start.weapons.map(id => DATA.weapons[id].name).join(', ')}.` : 'No guns.');
  if(ch.rules.fleetSpeed) bits.push(`The fleet is ${b.fleet}.`); if(ch.rules.sectors) bits.push(`${b.sectors} sectors.`); if(ch.scrapMult) bits.push(`${Math.round(b.loot*100)}% salvage.`);
  ch.desc = bits.join(' ');
  return ch;
}
function chToCode(ch){ return { k:'ch', v:1, n:ch.name, sh:ch.ship, d:ch.difficulty, g:ch.goal, st:ch.start, r:ch.rules, m:ch.scrapMult, x:ch.desc }; }
function codeToCh(o){
  const goal = o.g && (o.g.win ? { win:true } : { sector:clamp(+o.g.sector||3, 2, 12) }) || { sector:3 };
  const st = {}; const s0 = o.st || {};
  for(const k of ['hull','scrap','fuel','missiles','parts','crewCount']) if(typeof s0[k]==='number' && isFinite(s0[k])) st[k] = clamp(Math.round(s0[k]), 0, 999);
  if(Array.isArray(s0.weapons)) st.weapons = s0.weapons.filter(id => typeof id==='string').slice(0, 4);
  if(Array.isArray(s0.drones)) st.drones = s0.drones.filter(id => typeof id==='string').slice(0, 3);
  if(Array.isArray(s0.crew)) st.crew = s0.crew.filter(id => typeof id==='string').slice(0, 8);
  if(Array.isArray(s0.augments)) st.augments = s0.augments.filter(id => typeof id==='string').slice(0, 3);
  if(s0.systems && typeof s0.systems==='object'){ st.systems = {}; for(const k in s0.systems) if(SYSN[k]) st.systems[k] = clamp(+s0.systems[k]||1, 1, 8); }
  const rules = {}; const r0 = o.r || {};
  if(typeof r0.fleetSpeed==='number') rules.fleetSpeed = clamp(r0.fleetSpeed, .04, .3); if(typeof r0.sectors==='number') rules.sectors = clamp(Math.round(r0.sectors), 3, 12); if(typeof r0.baseHP==='number') rules.baseHP = clamp(Math.round(r0.baseHP), 1, 10);
  return { name:cleanName(o.n), tier:2, ship:String(o.sh||'pestrel'), difficulty:DIFFICULTY[o.d] ? o.d : 'normal', goal, start:st, rules, scrapMult: typeof o.m==='number' ? clamp(o.m, .2, 3) : undefined, desc:String(o.x||'').slice(0, 240), custom:true };
}
function saveCustom(ch){ const L = PROFILE.customChallenges = PROFILE.customChallenges || {}; const id = 'custom_' + hashStr(JSON.stringify(chToCode(ch))).toString(36); L[id] = ch; saveProfile(); return id; }
function shareChallenge(id){ const ch = challengeDef(id); if(!ch) return; const o = chToCode(ch); CODES.share = { link:codeLink(o), code:codeEnc(o), short:null, what:'Challenge' }; UI.screen = 'mp'; MP.view = 'codes'; if(!CODES.build) CODES.build = buildDefault(); }
function drawCodesView(){
  mpTitle('CHALLENGE CODES', 'No room needed');
  const b = CODES.build || (CODES.build = buildDefault()); const x = 80, y0 = 196;
  label('Build a challenge', x, y0, C.amber, 'left', 16); panel(x, y0+14, 900, 680, 12);
  const cyc = (arr, cur, d) => arr[(arr.indexOf(cur) + d + arr.length) % arr.length];
  T(b.name, x+24, y0+62, { s:24, f:FD, w:700, c:C.amber, max:560 }); btn(x+660, y0+30, 210, 46, 'Name it', () => openRename({ title:'Name your challenge', value:b.name, max:30, onOk:v => { b.name = v; }, random:() => pick(['Glass Cannon','Cold Start','Last Light','Thin Ice','Iron Will','Long Shot','Dead Reckoning','Fumes and Faith']) }), { s:15 });
  // a two-column grid of settings: label above, ‹ value › below
  const cells = []; const ships = Object.keys(DATA.ships), diffs = Object.keys(DIFFICULTY);
  cells.push(['Ship', (DATA.ships[b.ship]||{}).name || b.ship, d => { b.ship = cyc(ships, b.ship, d); }]);
  cells.push(['Difficulty', (DIFFICULTY[b.diff]||{}).name, d => { b.diff = cyc(diffs, b.diff, d); }]);
  cells.push(['Goal', b.goal==='win' ? 'Win the run' : `Reach sector ${b.goal.slice(1)}`, d => { b.goal = cyc(BUILD_GOALS, b.goal, d); }]);
  for(const [k, name, vals] of BUILD_ROWS){ const v = b[k]; const txt = v==='def' ? 'As the ship comes' : k==='loot' ? `${Math.round(v*100)}%` : k==='fleet' ? { normal:'Normal speed', slow:'Slower', fast:'Faster', faster:'Much faster' }[v] : String(v);
    cells.push([name, txt, d => { b[k] = cyc(vals, v, d); }]); }
  const wl = ['def','none', ...Object.keys(DATA.weapons).filter(id => !DATA.weapons[id].noLoot)];
  b.w.forEach((wv, i) => cells.push([`Gun ${i+1}`, wv==='def' ? 'The ship\'s own' : wv==='none' ? 'None' : (DATA.weapons[wv]?.name || wv), d => { b.w[i] = cyc(wl, wv, d); }]));
  cells.forEach(([name, val, step], i) => { const cx = x+24 + (i%2)*432, cy = y0+96 + Math.floor(i/2)*82;
    label(name, cx, cy+16, C.muted, 'left', 12); btn(cx, cy+24, 46, 44, '‹', () => step(-1), { s:18 }); T(val, cx+206, cy+53, { s:16, a:'center', max:300, c:C.cyan }); btn(cx+366, cy+24, 46, 44, '›', () => step(1), { s:18 }); });
  const ch = buildToDef(b);
  // the card, and what to do with it
  const rx = 1020; label('Your challenge', rx, y0, C.amber, 'left', 16); panel(rx, y0+14, 500, 330, 12);
  T(ch.name, rx+24, y0+56, { s:24, f:FD, w:700, c:C.amber, max:450 }); T(challengeGoalText(ch), rx+24, y0+86, { s:16, c:C.cyan });
  para(ch.desc, rx+24, y0+118, 452, { s:15, lh:21, max:6 });
  btn(rx+24, y0+262, 220, 60, 'Play it', () => { const id = saveCustom(ch); startChallenge(id); }, { fill:true, s:18, col:C.good });
  btn(rx+256, y0+262, 220, 60, 'Share code', () => { const o = chToCode(ch); CODES.share = { link:codeLink(o), code:codeEnc(o), short:null, what:'Challenge' }; saveCustom(ch); }, { s:17, col:C.warn });
  // an incoming code
  const inc = CODES.incoming && CODES.incoming.k==='ch' ? codeToCh(CODES.incoming) : null;
  label(inc ? 'A challenge from a friend' : 'Got a code?', rx, y0+380, C.amber, 'left', 16); panel(rx, y0+394, 500, 300, 12);
  if(inc){ T(inc.name, rx+24, y0+436, { s:22, f:FD, w:700, c:C.warn, max:450 }); T(challengeGoalText(inc), rx+24, y0+464, { s:15, c:C.cyan }); para(inc.desc, rx+24, y0+494, 452, { s:14, lh:19, max:5 });
    btn(rx+24, y0+620, 220, 56, 'Play it', () => { const id = saveCustom(inc); CODES.incoming = null; startChallenge(id); }, { fill:true, s:17, col:C.good });
    btn(rx+256, y0+620, 220, 56, 'Save for later', () => { saveCustom(inc); CODES.incoming = null; toast('Saved to Challenges.'); }, { s:16 }); }
  else { para('Paste a challenge code or link from a friend. Saved challenges show up on the Challenges screen.', rx+24, y0+430, 452, { s:15, lh:21, c:C.muted }); btn(rx+24, y0+620, 452, 56, 'Paste a code or link', () => codesPaste(), { s:17, col:C.cyan }); }
  if(CODES.share) drawSharePanel();
  btn(80, H-86, 200, 60, 'Back', () => { MP.view = 'menu'; CODES.share = null; }, { s:18 });
  btn(300, H-86, 260, 60, 'All challenges', () => { applyMods(); UI.screen = 'challenges'; }, { s:17 });
}

/* ---------------- the weekly cup and the daily boards ---------------- */
function weekKey(d){ d = d || new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - y0)/864e5 + 1)/7)).padStart(2, '0'); }
function cupShip(k){ const ids = Object.keys(BASE.ships); return ids[hashStr('cup' + (k || weekKey())) % ids.length]; }
function startCup(){ const k = weekKey(); newRun(cupShip(k), null, { seed:'CUP-' + k, cup:k }); }
function codesRecordRun(entry, win){
  if(G && G.cup){ const C_ = PROFILE.cup = PROFILE.cup || {}, cur = C_[G.cup]; if(!cur || entry.score > cur.score) C_[G.cup] = { score:entry.score, sector:G.sector, win:!!win, kills:G.stats.kills, ship:G.shipDef };
    const keys = Object.keys(C_).sort(); while(keys.length > 20) delete C_[keys.shift()]; saveProfile();
    if(SET.autoPost) boardPost('cup', G.cup, C_[G.cup]); }
  if(G && G.daily && SET.autoPost){ const d = PROFILE.daily?.[G.daily]; if(d) boardPost('daily', G.daily, d); }
  if(G && G.seedDuel){ const L = PROFILE.seedDuels = PROFILE.seedDuels || []; const sd = G.seedDuel;
    L.unshift({ t:Date.now(), seed:G.seed, sh:G.shipDef, them:{ n:sd.n, sc:sd.sc, sec:sd.sec, w:sd.w }, me:{ sc:entry.score, sec:G.sector, w:win?1:0 } }); PROFILE.seedDuels = L.slice(0, 20); saveProfile(); if(entry.score > sd.sc) grant('seedwin'); }
}
function boardTag(kind, key){ return `vtl-${kind}-${key}`; }
function boardLoad(kind, key){
  const tag = boardTag(kind, key); const old = CODES.boards[tag]; if(old && old.stop) old.stop();
  const B = CODES.boards[tag] = { rows:[], state:'loading', by:new Map(), t:performance.now() };
  const me = PROFILE.nostrSk ? NC.pubOf(PROFILE.nostrSk) : null;
  const id = nostrSub([{ kinds:[30078], '#t':[tag], limit:400 }], async ev => {
    if(!ev || ev.kind!==30078 || typeof ev.content!=='string' || ev.content.length > 600) return;
    const prev = B.by.get(ev.pubkey); if(prev && prev.at >= ev.created_at) return;
    let c; try{ c = JSON.parse(ev.content); }catch(e){ return; }
    if(!c || typeof c.s!=='number' || !(c.s >= 0 && c.s <= 80000) || !(await NC.checkEvent(ev))) return;
    B.by.set(ev.pubkey, { at:ev.created_at, n:cleanName(c.n), s:Math.round(c.s), sec:+c.sec||1, w:!!c.w, sh:String(c.sh||''), k:+c.k||0, me:ev.pubkey===me });
    B.rows = [...B.by.values()].sort((a, b) => b.s - a.s); B.state = 'ready';
  }, () => { if(B.state==='loading') B.state = B.by.size ? 'ready' : 'empty'; });
  B.stop = () => nostrClose(id);
  setTimeout(() => { if(B.state==='loading') B.state = B.by.size ? 'ready' : 'offline'; }, 9000);
}
async function boardPost(kind, key, rec){
  if(!rec) return; const tag = boardTag(kind, key), now = Math.floor(Date.now()/1000);
  try{ await nostrPublish({ kind:30078, created_at:now, tags:[['d', tag], ['t', tag], ['expiration', String(now + 45*86400)]],
      content:JSON.stringify({ n:mpName(), s:rec.score, sec:rec.sector, w:rec.win ? 1 : 0, sh:rec.ship, k:rec.kills||0, v:1 }) });
    (PROFILE.posted = PROFILE.posted || {})[tag] = rec.score; saveProfile(); toast('Score posted to the board.'); if(kind==='cup') grant('cuppost');
    setTimeout(() => boardLoad(kind, key), 1500); }
  catch(e){ toast('Could not post the score right now.'); }
}
function boardLoadTab(){ if(CODES.tab==='cup') boardLoad('cup', weekKey()); else boardLoad('daily', todayKey()); }
function drawCupView(){
  mpTitle(CODES.tab==='cup' ? 'WEEKLY CUP' : 'DAILY BOARD', 'No room needed');
  tabs(80, 186, [['cup','Weekly cup'],['daily','Today\'s daily']], CODES.tab, t => { CODES.tab = t; CODES.page = 0; boardLoadTab(); }, 220);
  const cup = CODES.tab==='cup', key = cup ? weekKey() : todayKey(), ship = cup ? cupShip(key) : dailyShip(key), best = cup ? PROFILE.cup?.[key] : PROFILE.daily?.[key], tag = boardTag(cup ? 'cup' : 'daily', key);
  panel(80, 250, 560, 640, 12);
  label(cup ? `Week ${key}` : key, 104, 288, C.cyan, 'left', 15);
  T((DATA.ships[ship] || BASE.ships[ship] || {}).name || ship, 104, 334, { s:30, f:FD, w:700, c:C.amber, max:510 });
  para(cup ? 'Same ship, same seed, the whole week. Normal difficulty, mods off. Fly it as often as you like: your best counts.' : 'A new run every day. Same ship and seed for everyone. Normal difficulty, mods off.', 104, 368, 510, { s:16, lh:23, c:C.muted });
  T(best ? `Your best: ${fmtNum(best.score)} pts${best.win ? ', won' : ', sector ' + best.sector}` : 'No score yet', 104, 480, { s:19, c: best ? C.good : C.muted });
  btn(104, 510, 512, 66, cup ? 'Fly the cup' : 'Fly the daily', () => cup ? startCup() : startDaily(), { fill:true, s:20, col:C.good });
  const posted = PROFILE.posted?.[tag];
  btn(104, 590, 512, 56, !best ? 'Post my best score' : posted===best.score ? 'Posted ✓' : 'Post my best score', () => boardPost(cup ? 'cup' : 'daily', key, best), { s:17, disabled:!best || posted===best.score, col:C.cyan });
  btn(104, 660, 512, 52, `Post scores automatically: ${SET.autoPost ? 'on' : 'off'}`, () => { SET.autoPost = !SET.autoPost; saveProfile(); }, { s:15, fill:!!SET.autoPost, col:C.cyan });
  para(`Boards live on public Nostr relays, under your multiplayer name (${mpName()}). It's on the honour system: no accounts, no servers of ours.`, 104, 750, 510, { s:13, lh:19, c:C.muted });
  // the board
  const B = CODES.boards[tag]; panel(680, 250, 840, 640, 12); label('Board', 704, 288, C.amber, 'left', 15);
  if(!B || B.state==='loading') T('Asking the relays…', 704, 340, { s:18, c:C.muted });
  else if(B.state==='offline') T('Could not reach the scoreboard relays. Try again later.', 704, 340, { s:18, c:C.hostile });
  else if(B.state==='empty') T('No scores yet. Be the first!', 704, 340, { s:18, c:C.muted });
  if(B && B.rows.length){ const per = 12, pages = Math.ceil(B.rows.length/per); CODES.page = clamp(CODES.page, 0, pages-1);
    B.rows.slice(CODES.page*per, CODES.page*per + per).forEach((r, i) => { const n = CODES.page*per + i + 1, y = 310 + i*44;
      if(r.me){ rr(696, y-4, 808, 40, 6); ctx.fillStyle = hexA(C.amber, .14); ctx.fill(); }
      T(`${n}.`, 744, y+24, { s:17, f:FD, w:700, a:'right', c: n<=3 ? C.amber : C.muted }); T(r.n + (r.me ? ' (you)' : ''), 760, y+24, { s:17, max:330, c: r.me ? C.amber : C.ink });
      T(r.w ? 'Won' : `Sector ${r.sec}`, 1180, y+24, { s:15, a:'right', c: r.w ? C.good : C.muted }); T(fmtNum(r.s), 1490, y+24, { s:18, f:FD, w:700, a:'right' }); });
    if(pages > 1){ btn(1300, 832, 80, 44, '‹', () => CODES.page--, { disabled:CODES.page<=0, s:16 }); btn(1400, 832, 80, 44, '›', () => CODES.page++, { disabled:CODES.page>=pages-1, s:16 }); T(`${B.rows.length} pilots`, 704, 860, { s:14, c:C.muted }); } }
  btn(80, H-86, 200, 60, 'Back', () => { MP.view = 'menu'; }, { s:18 });
  btn(300, H-86, 200, 60, 'Refresh', () => boardLoadTab(), { s:17, col:C.cyan });
}
function drawMPCodes(){ if(MP.view==='seed') return drawSeedView(); if(MP.view==='codes') return drawCodesView(); return drawCupView(); }
/* the end of a run: seed duel results, the cup, and sending a run to a friend */
function mpEndExtras(win){
  if(!G || NET.on) return;
  const x = W/2 - 640, y = 26, w = 1280, h = 104;
  const entry = UI.lastRun || { seed:G.seed, ship:G.shipDef, diff:G.diff, score:runScore(win), sector:G.sector, win };
  if(G.seedDuel){ const sd = G.seedDuel, mine = entry.score, theirs = sd.sc; panel(x, y, w, h, 12);
    T(mine > theirs ? `You beat ${sd.n} by ${fmtNum(mine - theirs)}!` : mine < theirs ? `${sd.n} wins by ${fmtNum(theirs - mine)}.` : `A dead heat with ${sd.n}!`, x+28, y+48, { s:28, f:FD, w:700, c: mine > theirs ? C.good : mine < theirs ? C.hostile : C.amber, max:820 });
    T(`You ${fmtNum(mine)} · ${sd.n} ${fmtNum(theirs)}`, x+28, y+82, { s:16, c:C.muted });
    btn(x+w-330, y+22, 300, 60, 'Send your answer', () => { const o = Object.assign(seedPayload(entry), { re:{ sc:theirs, sec:sd.sec, w:sd.w } }); o.n = mpName(); CODES.share = { link:codeLink(o), code:codeEnc(o), short:null, what:'Seed duel answer' }; UI.screen = 'mp'; MP.view = 'seed'; }, { fill:true, s:18, col:C.good });
    return; }
  if(G.cup){ const best = PROFILE.cup?.[G.cup], tag = boardTag('cup', G.cup), posted = PROFILE.posted?.[tag]; panel(x, y, w, h, 12);
    T(`Weekly cup ${G.cup}: ${fmtNum(entry.score)} pts`, x+28, y+48, { s:26, f:FD, w:700, c:C.cyan }); T(best ? `Your best this week: ${fmtNum(best.score)}` : '', x+28, y+82, { s:16, c:C.muted });
    btn(x+w-620, y+22, 280, 60, 'See the board', () => { UI.screen = 'mp'; MP.view = 'cup'; CODES.tab = 'cup'; boardLoadTab(); }, { s:17, col:C.cyan });
    btn(x+w-330, y+22, 300, 60, posted===best?.score ? 'Posted ✓' : 'Post my best', () => boardPost('cup', G.cup, best), { s:17, fill:true, disabled:!best || posted===best?.score }); return; }
  if(G.daily){ const best = PROFILE.daily?.[G.daily], tag = boardTag('daily', G.daily), posted = PROFILE.posted?.[tag];
    btn(W-680, 40, 300, 56, 'Daily board', () => { UI.screen = 'mp'; MP.view = 'cup'; CODES.tab = 'daily'; boardLoadTab(); }, { s:16, col:C.cyan });
    btn(W-360, 40, 300, 56, posted===best?.score ? 'Posted ✓' : 'Post my best', () => boardPost('daily', G.daily, best), { s:16, fill:true, disabled:!best || posted===best?.score }); return; }
  if(G.seed && !G.challenge) btn(W-360, 40, 300, 56, 'Challenge a friend', () => { seedShare(entry); UI.screen = 'mp'; MP.view = 'seed'; }, { s:16, col:C.good });
}
