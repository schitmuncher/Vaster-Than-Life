'use strict';
/* =========================================================================
   Game modes: choose the sort of game you want, in the hangar.
   Two switches, and four presets that name the combinations:
   - Galaxy: Chase (the Rebuff Fleet hunts you sector by sector) or
     Expedition (no Fleet; Haven's Rest is your hub, heat is the danger).
   - Ship: Standard, or Capital (two decks, and bigger enemies have them too).
   Dailies, challenges, campaign mods and multiplayer always play Classic.
   ========================================================================= */
const GAME_MODES = [
  { id:'classic',  name:'Classic',      galaxy:'chase',      ship:'standard', col:'#ffb547', text:'The original. Outrun the Rebuff Fleet across eight sectors and beat the Flaggship.' },
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
  para('Dailies, challenges, campaign mods and multiplayer always play the classic way. Every mode earns renown, medals and Haven\'s Rest progress.', f.x + 40, y2 + 160, f.w - 380, { s:14, lh:20, c:C.muted });
  btn(f.x + f.w - 280, f.y + f.h - 90, 240, 60, 'Done', () => { UI.modeOpen = false; }, { fill:true, s:20 });
}
