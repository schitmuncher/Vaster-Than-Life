'use strict';
/* =========================================================================
   A gentler start. On the title screen, a "Next step" card says what to do
   now: the tutorial, a first voyage, a tip drawn from how the last run ended,
   or something new to try once the basics are down. Until the first voyage
   is over, the hangar keeps to Classic mode so a new captain isn't choosing
   between four ways to play before they know what a beacon is.
   ========================================================================= */
const NEXT_TIPS = {
  hull:['Your hull gave out. Spend scrap at stores on hull repairs before you go shopping for guns, and put your first upgrades into Shields: two layers stop most early fights cold.',
    'Hull is your life. Each store sells repairs, and running away (Jump once the engines charge) is always allowed. A fight you leave is a fight you can\'t lose.'],
  crew:['You ran out of crew. Keep the Medbay powered and send the hurt there between fights. Stores sell new crew, and distress calls often hand you one for free.',
    'Crew died. Watch the oxygen bar: if the Oxygen room is hit, send someone to fix it first. And boarders are easier in a room with two of your own.'],
  fleet:['The Mandate Fleet caught you. Head for the exit sooner; an unexplored beacon is not worth a fleet on top of you. The dashed line on the map shows where the fleet will be after your next jump.',
    'Caught by the Fleet. Engines upgrades make you dodge more, but the real fix is fewer detours. Two or three beacons on the way to the exit is plenty.'],
  fuel:['You ran out of fuel. Buy fuel at every store until you have eight or so, and never jump into a sector with fewer than four.'],
  other:['Every run teaches you something. Try a different route next time: stores and distress calls pay off more than empty beacons.',
    'Upgrades in order of usefulness: Shields, then Weapons, then Engines. Buy a second weapon when you can afford one.'] };
const NEXT_LATER = [
  ['Try a different ship', 'The hangar has more ships than the Plucky, and each one plays differently. Win, or reach new sectors, to unlock more.', () => openHangar()],
  ['Try the other modes', 'Hangar → Mode: Explorer gives you the open galaxy with Haven\'s Rest as home; Admiral gives you a two-deck capital ship.', () => openHangar()],
  ['Draw your own crew', 'The Pixel Studio lets you draw crew from the front, side and back, or turn any picture into one with an AI.', () => { if(typeof openPixelStudio==='function') openPixelStudio('title'); }],
  ['Read the Archive', 'Record → Codex → Archive: the paperwork of a galaxy at war. More turns up in wrecks.', () => { UI.screen = 'codex'; UI.codexTab = 'lore'; UI.codexBack = 'title'; }],
  ['Today\'s daily run', 'Same ship, same galaxy, same seed for everyone today. How far can you get?', () => { if(typeof startDaily==='function') startDaily(); }],
  ['Take on a challenge', 'Challenges are short, strange runs with their own rules and medals.', () => { if(typeof applyMods==='function') applyMods(); UI.screen = 'challenges'; }],
  ['Restore Haven\'s Rest', 'Send goods home from stores to bring your great-uncle\'s station back to life. Each wing helps every future run.', () => { UI.screen = 'haven'; }] ];
function nextStep(){
  const P = PROFILE, runs = P.runs || 0, wins = Object.values(P.wins || {}).reduce((a, b) => a + (+b || 0), 0), last = (P.history || [])[0];
  if(!P.tutDone && runs===0) return { head:'New here?', text:'The tutorial takes about ten minutes and explains everything as you go. Or jump straight in: your first voyage is on Easy, in the Plucky.', btn:'Start the tutorial', go:() => openTutorial(), btn2:'Just play', go2:() => openHangar() };
  if(runs===0) return { head:'Your first voyage', text:'Take the Plucky, stay on Easy, and head for the exit beacon in each sector. The Mandate Fleet follows one step behind every jump.', btn:'Start your first voyage', go:() => openHangar() };
  if(!wins && last && !last.win){ const r = String(last.reason || '').toLowerCase(), k = /hull/.test(r) ? 'hull' : /crew/.test(r) ? 'crew' : /fleet|caught/.test(r) ? 'fleet' : /fuel|strand/.test(r) ? 'fuel' : 'other', pool = NEXT_TIPS[k];
    return { head:`Last time: sector ${last.sector}`, text:pool[(runs + (last.sector || 0)) % pool.length], btn:'Have another go', go:() => openHangar() }; }
  const d = new Date(), pick_ = NEXT_LATER[(d.getDate() + runs) % NEXT_LATER.length];
  return { head:wins ? `${wins} win${wins===1 ? '' : 's'} so far. Next:` : 'Something to try', text:pick_[1], btn:pick_[0], go:pick_[2] };
}
/* shown in place of the "Last run" panel on the title screen until the first win */
function drawNextStepIn(x, y, w, h){
  if(typeof NET!=='undefined' && NET.on) return false; const wins = Object.values(PROFILE.wins || {}).reduce((a, b) => a + (+b || 0), 0); if(wins > 0) return false;
  const n = nextStep(); if(!n) return false; const t = performance.now()/1000;
  panel(x, y, w, h, 12); ctx.fillStyle = hexA(C.good, .05 + .035*Math.sin(t*2)); rr(x, y, w, h, 12); ctx.fill();
  label('Next step', x + 24, y + 36, C.good, 'left', 16); T(n.head, x + w - 24, y + 36, { s:15, a:'right', c:C.amber, f:FD, w:700, max:w - 160 });
  para(n.text, x + 24, y + 60, w - 48, { s:14, lh:19, c:C.ink, max:4 });
  if(n.btn2){ btn(x + 24, y + h - 58, w - 214, 44, n.btn, n.go, { fill:true, col:C.good, s:15 }); btn(x + w - 180, y + h - 58, 156, 44, n.btn2, n.go2, { s:15 }); }
  else btn(x + 24, y + h - 58, w - 48, 44, n.btn, n.go, { fill:true, col:C.good, s:15 });
  return true; }
(function(){
  // the hangar keeps to Classic until the first voyage is done (anyone who has played before can still pick, via Settings → Unlock all)
  if(typeof drawModePicker==='function'){ const m0 = drawModePicker; drawModePicker = function(x, y){
    if((PROFILE.runs || 0) >= 1 || (SET && SET.unlockAll) || (typeof NET!=='undefined' && NET.on) || (typeof CAMP!=='undefined' && CAMP)) return m0(x, y);
    if(SET.runMode!=='classic' || SET.shipMode==='capital'){ SET.runMode = 'classic'; SET.shipMode = 'standard'; }
    label('Mode', x, y + 24, C.muted, 'left', 14); btn(x + 70, y, 340, 36, 'Classic · more after your first voyage', () => toast('Explorer, Admiral and Grand Voyage open after your first voyage. Classic is the best place to learn.'), { s:13, col:C.muted });
    tip(x, y, 410, 36, 'Game mode', 'Classic: outrun the Mandate Fleet across eight sectors. The other modes open after your first voyage, whatever happens on it.'); }; }
})();
