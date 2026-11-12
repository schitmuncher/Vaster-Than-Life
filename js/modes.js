'use strict';
/* =========================================================================
   Game modes: choose the sort of game you want, in the hangar.
   Two switches, and four presets that name the combinations:
   - Galaxy: Chase (the Mandate Fleet hunts you sector by sector) or
     Expedition (no Fleet; Haven's Rest is your hub, heat is the danger).
   - Ship: Standard, or Capital (two decks, and bigger enemies have them too).
   Dailies, challenges, campaign mods and multiplayer always play Classic.
   ========================================================================= */
const GAME_MODES = [
  { id:'classic',  name:'Classic',      galaxy:'chase',      ship:'standard', col:'#ffb547', text:'The original. Outrun the Mandate Fleet across eight sectors and beat the Dreadnought.' },
  { id:'explorer', name:'Explorer',     galaxy:'expedition', ship:'standard', col:'#9fdc7a', text:'No Fleet behind you. Haven\'s Rest is your hub; choose near, far or deep trips, find three Precursor keys, then strike. Heat is the danger.' },
  { id:'admiral',  name:'Admiral',      galaxy:'chase',      ship:'capital',  col:'#5fd3e6', text:'The classic chase, flying a two-deck capital ship. The lower deck is safe from everything but missiles and bombs, and big enemies have one too.' },
  { id:'voyage',   name:'Grand Voyage', galaxy:'expedition', ship:'capital',  col:'#c48bff', text:'The long game: a capital ship, the open galaxy, your station as home. The most to manage, and the most to build.' } ];
function modeNow(){ const g = SET.runMode==='expedition' ? 'expedition' : 'chase', s = SET.shipMode==='capital' ? 'capital' : 'standard'; return GAME_MODES.find(m => m.galaxy===g && m.ship===s) || GAME_MODES[0]; }
function setMode(m){ SET.runMode = m.galaxy==='expedition' ? 'expedition' : 'classic'; SET.shipMode = m.ship; saveProfile(); }
drawModePicker = function(x, y){ if(typeof NET!=='undefined' && NET.on) return; if(typeof CAMP!=='undefined' && CAMP) return; const m = modeNow();
  label('Mode', x, y + 24, C.muted, 'left', 14); btn(x + 70, y, 340, 36, `${m.name}  ▸`, () => { UI.modeOpen = true; }, { s:14, col:m.col, fill:m.id!=='classic' });
  tip(x, y, 410, 36, `Game mode: ${m.name}`, m.text + ' Tap to choose another.'); };
function drawModeOverlay(){
  if(!UI.modeOpen || UI.screen!=='select') return; ctx.fillStyle = 'rgba(4,6,12,.86)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => {}, null, true);
  const f = { x:120, y:70, w:W - 240, h:H - 140 }; rr(f.x, f.y, f.w, f.h, 16); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
  label('Choose your game', f.x + 40, f.y + 50, C.cyan, 'left', 16); T('Game mode', f.x + 40, f.y + 100, { s:40, f:FD, w:700 });
  const cur = modeNow(), cw = (f.w - 80 - 3*20)/4;
  GAME_MODES.forEach((m, i) => { const x = f.x + 40 + i*(cw + 20), y = f.y + 140, h = 400, on = m.id===cur.id;
    rr(x, y, cw, h, 12); ctx.fillStyle = on ? hexA(m.col, .14) : 'rgba(255,255,255,.03)'; ctx.fill(); ctx.strokeStyle = on ? m.col : C.line; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
    T(m.name, x + 20, y + 44, { s:26, f:FD, w:700, c:m.col, max:cw - 40 });
    T(`${m.galaxy==='chase' ? 'Fleet chase' : 'Open galaxy'} · ${m.ship==='capital' ? 'Capital ship' : 'Standard ship'}`, x + 20, y + 74, { s:13, c:C.muted, max:cw - 40 });
    para(m.text, x + 20, y + 108, cw - 40, { s:15, lh:22, c:C.ink, max:9 });
    btn(x + 20, y + h - 70, cw - 40, 50, on ? 'Selected' : 'Choose', () => setMode(m), { fill:on, col:m.col, s:17 }); });
  const y2 = f.y + 570; label('Or mix your own', f.x + 40, y2, C.muted, 'left', 14);
  const g = cur.galaxy, s = cur.ship, pickG = v => setMode({ galaxy:v, ship:s }), pickS = v => setMode({ galaxy:g, ship:v });
  T('Galaxy', f.x + 40, y2 + 46, { s:16, f:FD, w:700 }); btn(f.x + 150, y2 + 20, 200, 44, 'Fleet chase', () => pickG('chase'), { fill:g==='chase', s:15 }); btn(f.x + 360, y2 + 20, 200, 44, 'Open galaxy', () => pickG('expedition'), { fill:g==='expedition', s:15, col:'#9fdc7a' });
  T('Ship', f.x + 640, y2 + 46, { s:16, f:FD, w:700 }); btn(f.x + 720, y2 + 20, 200, 44, 'Standard', () => pickS('standard'), { fill:s==='standard', s:15 }); btn(f.x + 930, y2 + 20, 200, 44, 'Capital (2 decks)', () => pickS('capital'), { fill:s==='capital', s:15, col:C.cyan });
  if(typeof STORY_MIX!=='undefined'){ const sm = SET.storyMix || 'mixed'; T('Stories', f.x + 40, y2 + 116, { s:16, f:FD, w:700 });
    STORY_MIX.forEach(([k, n], i) => btn(f.x + 150 + i*210, y2 + 90, 200, 44, n, () => { SET.storyMix = k; saveProfile(); }, { fill:sm===k, s:15 }));
    T(storyMixText(), f.x + 790, y2 + 118, { s:14, c:C.muted, max:f.w - 1120 + 300 }); }
  drawVoyageRows(f.x + 40, y2 + 150, f.w - 380);
  T('Dailies, challenges, campaigns and multiplayer always use Classic and the standard voyage. Every mode earns renown and medals.', f.x + 40, y2 + 262, { s:13, c:C.muted, max:f.w - 380 });
  btn(f.x + f.w - 280, f.y + f.h - 90, 240, 60, 'Done', () => { UI.modeOpen = false; }, { fill:true, s:20 });
}

/* ---------------- the voyage: how long, how big, how hard they chase ----------------
   Length: 5, 8 or 11 sectors. Sectors: compact (about 6 jumps across) or sprawling (about 9,
   with more beacons, stores and stories, and a Fleet slowed to match). Fleet: relentless,
   standard or patient (30% slower, time to enjoy the garden, the shops and the stories). */
const VOYAGE = { len:[['short','Short (5)',-3],['standard','Standard (8)',0],['long','Long (11)',3]], size:[['compact','Compact',0],['sprawling','Sprawling',3]], pace:[['relentless','Relentless',1.25],['standard','Standard',1],['patient','Patient',.7]] };
function voyOpt(k){ const v = SET['voy_' + k]; return VOYAGE[k].find(o => o[0]===v) || VOYAGE[k][k==='size' ? 0 : 1]; }
function voyageText(){ const L = voyOpt('len'), S = voyOpt('size'), P = voyOpt('pace'), secs = 8 + L[2], jumps = Math.round(secs*(6 + S[2]));
  return `About ${jumps} jumps across ${secs} sectors${P[0]==='patient' ? ', with time to look around' : P[0]==='relentless' ? ', with the Fleet on your heels' : ''}.`; }
function drawVoyageRows(x, y, w){
  T('Voyage', x, y + 26, { s:16, f:FD, w:700 });
  VOYAGE.len.forEach(([k, n], i) => btn(x + 110 + i*150, y, 140, 40, n, () => { SET.voy_len = k; saveProfile(); }, { fill:voyOpt('len')[0]===k, s:14 }));
  T('Map', x + 600, y + 26, { s:15, c:C.muted }); VOYAGE.size.forEach(([k, n], i) => btn(x + 690 + i*150, y, 140, 40, n, () => { SET.voy_size = k; saveProfile(); }, { fill:voyOpt('size')[0]===k, s:14 }));
  T('Fleet', x, y + 78, { s:16, f:FD, w:700 }); VOYAGE.pace.forEach(([k, n], i) => btn(x + 110 + i*150, y + 52, 140, 40, n, () => { SET.voy_pace = k; saveProfile(); }, { fill:voyOpt('pace')[0]===k, s:14 }));
  T(voyageText(), x + 600, y + 78, { s:14, c:C.cyan, max:w - 600 });
  tip(x, y, w, 92, 'Voyage', 'Length: how many sectors. Map: Sprawling makes each sector about half as big again, with more beacons, stores and stories, and slows the Fleet to match. Fleet: Patient gives you about 30% more time in every sector to enjoy the garden, the shops and the stories; Relentless gives you less.'); }
function voyageAllowed(o){ o = o || {}; return !(o.daily || o.cup || o.challenge || o.seedDuel || o.practice || o.tut || o.keepData) && !(typeof CAMP!=='undefined' && CAMP) && !(typeof NET!=='undefined' && NET.on); }
(function(){
  const a0 = applyMods; applyMods = function(...a){ const r = a0(...a); if(UI._voy && R){ const L = voyOpt('len'), S = voyOpt('size'), P = voyOpt('pace');
    if(SET.runMode!=='expedition') R.sectors = clamp((R.sectors || 8) + L[2], 4, 12);
    R.mapExtra = S[2]; R.fleetSpeed = (R.fleetSpeed || .11) * P[2] * (S[2] ? 7/(7 + S[2]) : 1); } return r; };
  const n0 = newRun; newRun = function(id, name, o = {}){ UI._voy = voyageAllowed(o); try{ return n0(id, name, o); } finally { UI._voy = false; if(G && voyageAllowed(o)) G.voyage = { len:voyOpt('len')[0], size:voyOpt('size')[0], pace:voyOpt('pace')[0] }; } };
})();
