'use strict';
/* Auto quality: watches how long frames take, and if the game has been
   running slowly for a while (under about 45 frames a second for 6 seconds
   in a row), steps Effects quality down one notch and says so. It only
   ever steps down; Settings → Graphics puts it back. */
const PERF = { last:0, slow:0, t:0, n:0, sum:0, stepped:0 };
function perfFrame(){
  const now = performance.now(), dt = PERF.last ? now - PERF.last : 0; PERF.last = now;
  if(!dt || dt > 250 || document.hidden || (typeof SET!=='undefined' && SET.autoGfx===false)) return;   // ignore pauses and tab switches
  PERF.sum += dt; PERF.n++; if(PERF.n < 30) return;
  const avg = PERF.sum/PERF.n; PERF.sum = 0; PERF.n = 0;
  if(avg > 22 && typeof UI!=='undefined' && (UI.screen==='game' || UI.screen==='title')) PERF.slow += avg*30/1000; else PERF.slow = Math.max(0, PERF.slow - 1);
  if(PERF.slow >= 6){ PERF.slow = 0; const order = ['ultra', 'high', 'medium', 'low'], i = order.indexOf(SET.gfx || 'high');
    if(i >= 0 && i < order.length - 1 && PERF.stepped < 3){ SET.gfx = order[i + 1]; PERF.stepped++; if(typeof saveProfile==='function') saveProfile();
      if(typeof toast==='function') toast(`The game was running slowly, so effects quality is now ${SET.gfx}. Settings → Graphics to change it.`); } }
}
(function(){ const loop = () => { try{ perfFrame(); }catch(e){} requestAnimationFrame(loop); }; if(typeof requestAnimationFrame==='function') requestAnimationFrame(loop);
  // in VR the page's animation frames stop; hook the XR frame loop if the renderer exposes one
  if(typeof renderer!=='undefined' && renderer && renderer.setAnimationLoop){ /* the XR loop calls draw(); sample there instead */ }
  if(typeof draw==='function'){ const d0 = draw; draw = function(...a){ if(typeof inXR==='function' && inXR()){ try{ perfFrame(); }catch(e){} } return d0(...a); }; }
})();
