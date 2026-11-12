'use strict';
/* =========================================================================
   Report a problem: keeps the last few errors, and puts together everything
   needed to fix a bug (version, device, settings, the run, the log, the
   errors) in one bit of text the player can copy, save, or send straight to
   the game's GitHub issues. Settings → Report a problem, or the pause menu.
   Also nudges players to back up now and then, since everything lives in
   this browser and clearing site data wipes it.
   ========================================================================= */
const REPORT = { errs:[], warned:false, url:'https://github.com/schitmuncher/Vaster-Than-Life/issues/new' };
function reportVersion(){ try{ const s = document.querySelector('script[src*="js/core.js"]'); const m = s && /[?&]v=([^&]+)/.exec(s.getAttribute('src')); return m ? m[1] : '?'; }catch(e){ return '?'; } }
(function(){
  const add = (msg, where) => { REPORT.errs.push({ t:new Date().toISOString().slice(11, 19), msg:String(msg).slice(0, 300), where:String(where || '').slice(0, 300), screen:typeof UI!=='undefined' ? UI.screen : '' }); if(REPORT.errs.length > 20) REPORT.errs.shift();
    if(!REPORT.warned && typeof toast==='function'){ REPORT.warned = true; setTimeout(() => { try{ toast('Something went wrong behind the scenes. If the game misbehaves, Settings → Report a problem has the details.'); }catch(e){} }, 50); } };
  if(typeof window!=='undefined' && window.addEventListener){
    window.addEventListener('error', e => add(e.message || e.error, (e.filename || '').replace(/^.*\/js\//, 'js/') + ':' + (e.lineno || '') + (e.error && e.error.stack ? ' | ' + e.error.stack.split('\n').slice(1, 3).map(s => s.trim()).join(' | ') : '')));
    window.addEventListener('unhandledrejection', e => add('Promise: ' + (e.reason && e.reason.message || e.reason), e.reason && e.reason.stack ? e.reason.stack.split('\n')[1] : '')); }
})();
function reportText(){
  const L = [], g = typeof G!=='undefined' ? G : null, P = typeof PROFILE!=='undefined' ? PROFILE : {}, S = typeof SET!=='undefined' ? SET : {};
  L.push(`Vaster Than Life, version ${reportVersion()}`, `When: ${new Date().toString().slice(0, 33)}`);
  try{ L.push(`Device: ${navigator.userAgent}`, `Screen: ${innerWidth}×${innerHeight} @${devicePixelRatio || 1}x${typeof inXR==='function' && inXR() ? ', in VR' : ''}${typeof MOB!=='undefined' && MOB.touch ? ', touch' : ''}`); }catch(e){}
  L.push(`Where: ${typeof UI!=='undefined' ? UI.screen : '?'}${g && g.modal ? ' (window: ' + g.modal.type + ')' : ''}`);
  L.push(`Settings: difficulty ${S.difficulty || 'normal'}, speed ${S.speed || 1}, music ${S.musicSrc || 'ost'}, grown-up ${S.grownUp !== false}, campaign ${S.campaign || 'none'}, mods ${(P.mods || []).filter && (P.mods || []).filter(m => m && m.on !== false).length || 0}`);
  L.push(`Record: ${P.runs || 0} runs, best sector ${P.maxSector || 0}, ${typeof P.kills==='number' ? P.kills : 0} kills`);
  if(g && g.ship){ const s = g.ship; L.push(`Run: ${s.name} (${g.shipDef}), sector ${g.sector}, jump ${g.stats && g.stats.jumps}, hull ${s.hull}/${s.maxHull}, crew ${s.crew.filter(c => c.owner==='p' && !c.drone).length}, scrap ${g.scrap}, fuel ${g.fuel}${g.enemy && !g.enemy.dead ? ', fighting ' + g.enemy.name : ''}${g.daily ? ', daily' : ''}${typeof NET!=='undefined' && NET.on ? ', multiplayer' : ''}`);
    const log = (g.log || []).slice(-12); if(log.length){ L.push('', 'Last log entries:'); for(const e of log) L.push(`  [s${e.s} j${e.j}] ${String(e.t).slice(0, 160)}`); } }
  L.push('', REPORT.errs.length ? `Errors (${REPORT.errs.length}):` : 'Errors: none caught this session.');
  for(const e of REPORT.errs) L.push(`  ${e.t} on ${e.screen}: ${e.msg}`, `      ${e.where}`);
  return L.join('\n');
}
function reportOpen(){ UI.report = { text:reportText(), note:'' }; }
function reportIssueUrl(){ const R = UI.report, first = REPORT.errs[REPORT.errs.length - 1];
  const title = `Bug: ${first ? first.msg.slice(0, 70) : 'something went wrong'} (v${reportVersion()})`;
  let body = `**What happened?**\n${R.note || '(please describe what you were doing and what went wrong)'}\n\n**Details from the game**\n\`\`\`\n${R.text}\n\`\`\``; if(body.length > 6000) body = body.slice(0, 5900) + '\n...(cut short: paste the rest from your clipboard)\n```';
  return `${REPORT.url}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`; }
function drawReport(){
  const R = UI.report; if(!R) return; ctx.fillStyle = 'rgba(4,6,12,.86)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => {});
  const w = 1200, h = 800, x = (W - w)/2, y = (H - h)/2; panel(x, y, w, h, 14);
  label('Report a problem', x + 32, y + 44, C.amber, 'left', 18); T('Thanks for helping. This is what will be sent: nothing private, just the game\'s state.', x + 32, y + 78, { s:16, c:C.muted, max:w - 64 });
  btn(x + 32, y + 98, w - 64, 56, '', () => openKeyboard({ title:'What happened? (optional)', value:R.note, max:600, ok:'Done', hint:'What were you doing, and what went wrong?', onOk:v => { R.note = v; } }), { s:15 });
  T(R.note ? R.note : '✎  Tap to say what happened (optional)', x + 52, y + 132, { s:16, c:R.note ? C.ink : C.muted, max:w - 104 });
  rr(x + 32, y + 168, w - 64, 500, 8); ctx.fillStyle = 'rgba(4,6,14,.85)'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
  const lines_ = R.text.split('\n'); let yy = y + 192; for(const ln of lines_){ if(yy > y + 656) { T('…', x + 48, yy, { s:13, c:C.muted }); break; } T(ln || ' ', x + 48, yy, { s:13, f:FM, c:/^\s*\d\d:\d\d/.test(ln) ? C.hostile : C.ink, max:w - 100 }); yy += 18; }
  const full = () => (R.note ? 'What happened: ' + R.note + '\n\n' : '') + R.text;
  btn(x + 32, y + 690, 280, 54, '📋 Copy to clipboard', () => { try{ navigator.clipboard.writeText(full()).then(() => toast('Copied. Paste it wherever you\'re reporting the problem.'), () => toast('Your browser would not copy. Try Save as file.')); }catch(e){ toast('Your browser would not copy. Try Save as file.'); } }, { s:15, fill:true });
  btn(x + 324, y + 690, 280, 54, '🐞 Open a GitHub issue', () => { try{ window.open(reportIssueUrl(), '_blank'); }catch(e){} try{ navigator.clipboard.writeText(full()); }catch(e){} toast('Opened GitHub in a new tab (you\'ll need a free account). The full details are on your clipboard too.'); }, { s:15, col:C.cyan });
  btn(x + 616, y + 690, 240, 54, '💾 Save as file', () => { try{ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([full()], { type:'text/plain' })); a.download = `vtl-problem-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`; document.body.appendChild(a); a.click(); a.remove(); }catch(e){ toast('Could not save a file here.'); } }, { s:15 });
  btn(x + w - 212, y + 690, 180, 54, 'Close', () => { UI.report = null; }, { s:15 });
}
/* the buttons: Settings (top right) and the pause menu */
(function(){
  if(typeof drawSettings==='function'){ const d0 = drawSettings; drawSettings = function(){ d0(); btn(1240, 60, 300, 52, '🐞 Report a problem', reportOpen, { s:16, col:C.cyan }); tip(1240, 60, 300, 52, 'Report a problem', 'Puts together what\'s needed to fix a bug (version, device, the run, any errors) for you to copy, save, or send as a GitHub issue.'); if(UI.report) drawReport(); }; }
  if(typeof draw==='function'){ const dr = draw; draw = function(...a){ const r = dr(...a); try{ if(UI.report && UI.screen!=='settings') drawReport(); }catch(e){} return r; }; }
  if(typeof downloadAll==='function'){ const d0 = downloadAll; downloadAll = function(...a){ const r = d0(...a); try{ PROFILE.lastBackup = Date.now(); PROFILE.backupRuns = PROFILE.runs || 0; saveProfile(); }catch(e){} return r; }; }
  // every five voyages without a backup, a gentle reminder
  if(typeof endRun==='function'){ const e0 = endRun; endRun = function(...a){ const r = e0(...a); try{ const since = (PROFILE.runs || 0) - (PROFILE.backupRuns || 0);
      if(since >= 5 && since % 5===0 && typeof toast==='function') setTimeout(() => toast('Your progress only lives in this browser. Settings → Profile → Download all data makes a backup you can load anywhere.'), 2500); }catch(e){} return r; }; }
})();
