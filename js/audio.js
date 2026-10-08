'use strict';
/* =========================================================================
   Audio: everything is synthesised live with Web Audio, so nothing needs
   downloading. A small mixer (sfx, music, ambience) runs through a
   compressor and a generated space reverb. Music is an adaptive
   sequencer: calm exploration themes per sector type, a combat layer
   that fades in during fights, a heavier boss arrangement, and stingers.
   ========================================================================= */
let AC = null, MASTER = null, SFXG = null, MUSG = null, AMBG = null, REVERB = null, NOISE = null, COMP = null;
let hapticFn = null;
function haptic(v, ms){ if(typeof inXR==='function' && inXR() && hapticFn){ try{ hapticFn(v, ms); }catch(e){} } else if(typeof mobileHaptic==='function') mobileHaptic(v, ms); }
function ensureAudio(){
  if(!AC){ try{
    AC = new (window.AudioContext||window.webkitAudioContext)();
    COMP = AC.createDynamicsCompressor(); COMP.threshold.value = -16; COMP.ratio.value = 4; COMP.connect(AC.destination);
    MASTER = AC.createGain(); MASTER.connect(COMP);
    REVERB = AC.createConvolver(); REVERB.buffer = makeImpulse(2.8, 2.2); const rv = AC.createGain(); rv.gain.value = .35; REVERB.connect(rv); rv.connect(MASTER);
    SFXG = AC.createGain(); SFXG.connect(MASTER);
    MUSG = AC.createGain(); MUSG.connect(MASTER);
    AMBG = AC.createGain(); AMBG.connect(MASTER);
    NOISE = AC.createBuffer(1, AC.sampleRate*2, AC.sampleRate); const a = NOISE.getChannelData(0); for(let i=0;i<a.length;i++) a[i] = Math.random()*2-1;
    applyVolumes(); startAmbience(); }catch(e){ AC = null; } }
  if(AC && AC.state==='suspended') AC.resume();
  if(AC) startMusic();
}
function makeImpulse(sec, decay){ const n = Math.floor(AC.sampleRate*sec), b = AC.createBuffer(2, n, AC.sampleRate);
  for(let ch=0; ch<2; ch++){ const d = b.getChannelData(ch); for(let i=0;i<n;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/n, decay); } return b; }
function applyVolumes(){ if(!AC) return; SFXG.gain.value = SET.sfx; MUSG.gain.value = SET.music*.6; AMBG.gain.value = (SET.amb ?? .5); }
const now = () => AC.currentTime;

/* ---------------- synth building blocks ---------------- */
function env(g, t, a, peak, d){ g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
function osc(type, f, t, dur, peak, o={}){ if(!AC) return;
  const s = AC.createOscillator(), g = AC.createGain(); s.type = type; s.frequency.setValueAtTime(f, t);
  if(o.to) s.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.slide || dur));
  if(o.detune) s.detune.value = o.detune;
  env(g, t, o.a ?? .005, peak, dur);
  let node = s; if(o.lp || o.hp || o.bp){ const f_ = AC.createBiquadFilter(); f_.type = o.lp ? 'lowpass' : o.hp ? 'highpass' : 'bandpass'; f_.frequency.value = o.lp || o.hp || o.bp; if(o.q) f_.Q.value = o.q; s.connect(f_); node = f_; }
  node.connect(g); g.connect(o.dest || SFXG); if(o.rev){ const r = AC.createGain(); r.gain.value = o.rev; g.connect(r); r.connect(REVERB); }
  s.start(t); s.stop(t + (o.a ?? .005) + dur + .05); return s; }
function nz(t, dur, peak, o={}){ if(!AC) return;
  const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = NOISE; s.loop = dur > 1.9; s.playbackRate.value = o.rate || 1;
  env(g, t, o.a ?? .003, peak, dur);
  let node = s; if(o.lp || o.hp || o.bp){ const f_ = AC.createBiquadFilter(); f_.type = o.lp ? 'lowpass' : o.hp ? 'highpass' : 'bandpass'; f_.frequency.setValueAtTime(o.lp || o.hp || o.bp, t); if(o.sweep) f_.frequency.exponentialRampToValueAtTime(o.sweep, t + dur); if(o.q) f_.Q.value = o.q; s.connect(f_); node = f_; }
  node.connect(g); g.connect(o.dest || SFXG); if(o.rev){ const r = AC.createGain(); r.gain.value = o.rev; g.connect(r); r.connect(REVERB); }
  s.start(t, Math.random()*1.5); s.stop(t + (o.a ?? .003) + dur + .05); }
// kept for mods and older code
function tone(f,d,type='square',v=.05,slide=0,dest){ if(!AC) return; osc(type, f, now(), d, v, { to: slide ? f*slide : 0, dest }); }
function noise(d,v,hp=0,dest,when){ if(!AC) return; nz(when ?? now(), d, v, { hp: hp || 0, dest }); }

/* ---------------- sound effects ---------------- */
const SFX_GAP = {}; // stop identical sounds stacking into a wall of noise
function sfx(n, o={}){
  if(!AC) return; const t = now();
  if(SFX_GAP[n] && t - SFX_GAP[n] < .035) return; SFX_GAP[n] = t;
  const v = o.vol ?? 1, p = o.pitch ?? (0.94 + Math.random()*.12);
  switch(n){
    case 'click': osc('square', 1250*p, t, .035, .03*v, { lp:3000 }); osc('sine', 2500*p, t+.01, .03, .015*v); break;
    case 'hover': osc('sine', 1900*p, t, .02, .012*v); break;
    case 'error': osc('square', 220, t, .09, .04*v, { lp:900 }); osc('square', 180, t+.1, .12, .04*v, { lp:900 }); break;
    case 'laser': osc('sawtooth', 1500*p, t, .16, .04*v, { to:380*p, lp:4000, rev:.3 }); osc('square', 760*p, t, .08, .02*v, { to:200 }); nz(t, .05, .03*v, { hp:3000 }); break;
    case 'heavy': osc('sawtooth', 900*p, t, .26, .05*v, { to:160, lp:2600, rev:.35 }); osc('square', 120*p, t, .2, .04*v, { to:60 }); nz(t, .1, .05*v, { bp:1200, q:1 }); break;
    case 'ion': osc('sine', 500*p, t, .32, .05*v, { to:1500, rev:.4 }); osc('sine', 515*p, t, .32, .03*v, { to:1560 }); osc('triangle', 2000*p, t+.05, .2, .015*v, { to:600 }); break;
    case 'missile': nz(t, .5, .07*v, { lp:600, sweep:2400, a:.05, rev:.3 }); osc('triangle', 140*p, t, .45, .05*v, { to:380 }); osc('sawtooth', 60, t, .25, .03*v, { lp:300 }); break;
    case 'beam': osc('sawtooth', 220*p, t, .9, .035*v, { to:320, lp:1800, a:.05, rev:.4 }); osc('sawtooth', 222*p, t, .9, .03*v, { to:325, lp:1400 }); osc('sine', 880*p, t, .7, .015*v); break;
    case 'flak': for(let i=0;i<4;i++){ nz(t+i*.04, .12, .06*v, { bp:900+i*300, q:2 }); } osc('square', 200, t, .1, .03*v, { to:80 }); break;
    case 'bomb': osc('sine', 120*p, t, .4, .06*v, { to:40, rev:.4 }); nz(t+.05, .25, .04*v, { lp:900 }); break;
    case 'hit': nz(t, .5, .16*v, { lp:2400, sweep:200, rev:.35 }); osc('sine', 110*p, t, .4, .1*v, { to:40 }); osc('square', 1800*p, t, .3, .012*v, { to:1500, bp:1800, q:8 }); osc('triangle', 2700*p, t+.02, .5, .008*v); break;
    case 'crunch': nz(t, .35, .12*v, { bp:700, q:1.5, sweep:300 }); nz(t+.06, .2, .08*v, { hp:2000 }); osc('square', 90, t, .2, .05*v, { to:50, lp:400 }); break;
    case 'shield': osc('sine', 420*p, t, .35, .06*v, { to:900, rev:.6 }); osc('sine', 633*p, t, .3, .03*v, { to:1300 }); nz(t, .25, .03*v, { hp:4000 }); break;
    case 'miss': nz(t, .3, .035*v, { bp:1400, q:3, sweep:400 }); break;
    case 'jump': osc('sawtooth', 55, t, 1.4, .05*v, { to:900, slide:1.3, lp:2400, a:.4, rev:.5 }); osc('sine', 110, t, 1.6, .05*v, { to:1760, slide:1.5, a:.3 }); nz(t+.9, 1, .07*v, { hp:600, sweep:6000, rev:.5 }); break;
    case 'ftlready': [0,4,7,12].forEach((s,i) => osc('sine', 523*Math.pow(2,s/12), t+i*.07, .4, .035*v, { rev:.5 })); break;
    case 'buy': osc('square', 660, t, .07, .03*v, { lp:3000 }); osc('square', 990, t+.07, .1, .03*v, { lp:3000 }); osc('sine', 1980, t+.07, .2, .015*v, { rev:.4 }); break;
    case 'sell': osc('square', 990, t, .07, .03*v, { lp:3000 }); osc('square', 660, t+.07, .1, .03*v, { lp:3000 }); break;
    case 'alarm': osc('square', 520, t, .18, .04*v, { lp:1800 }); osc('square', 390, t+.19, .22, .04*v, { lp:1800 }); break;
    case 'klaxon': for(let i=0;i<2;i++) osc('sawtooth', 300, t+i*.5, .4, .035*v, { to:520, lp:1500, a:.05 }); break;
    case 'intruder': for(let i=0;i<3;i++) osc('square', 880, t+i*.16, .09, .03*v, { lp:2500 }); break;
    case 'zap': osc('square', 1800*p, t, .08, .03*v, { to:500 }); nz(t, .06, .02*v, { hp:5000 }); break;
    case 'tele': osc('sine', 300, t, .8, .05*v, { to:1600, rev:.6, a:.1 }); osc('triangle', 600, t+.1, .7, .02*v, { to:2400 }); nz(t, .7, .02*v, { hp:3000, a:.2 }); break;
    case 'cloak': osc('sine', 1100, t, .7, .04*v, { to:200, rev:.7 }); nz(t, .6, .02*v, { bp:2000, q:5, sweep:300 }); break;
    case 'punch': nz(t, .07, .07*v, { bp:900*p, q:1 }); osc('sine', 120*p, t, .08, .05*v, { to:60 }); break;
    case 'fire': nz(t, .3, .04*v, { bp:500, q:.8 }); for(let i=0;i<3;i++) nz(t+Math.random()*.25, .03, .03*v, { hp:3000 }); break;
    case 'door': nz(t, .18, .04*v, { hp:1500, sweep:6000 }); osc('square', 140, t+.16, .06, .03*v, { lp:600 }); break;
    case 'power': osc('square', 520*p, t, .05, .02*v, { lp:2400 }); osc('square', 780*p, t+.05, .05, .02*v, { lp:2400 }); break;
    case 'unpower': osc('square', 780*p, t, .05, .02*v, { lp:2400 }); osc('square', 520*p, t+.05, .05, .02*v, { lp:2400 }); break;
    case 'repair': for(let i=0;i<2;i++) osc('triangle', 2400*p - i*400, t+i*.09, .06, .015*v, { bp:2400, q:6 }); break;
    case 'death': osc('sawtooth', 300, t, .6, .04*v, { to:60, lp:1200, rev:.5 }); nz(t, .2, .03*v, { lp:800 }); break;
    case 'levelup': [0,7,12,19].forEach((s,i) => osc('triangle', 660*Math.pow(2,s/12), t+i*.06, .25, .025*v, { rev:.4 })); break;
    case 'hail': osc('sine', 1320, t, .07, .03*v); osc('sine', 1760, t+.09, .1, .03*v); nz(t, .4, .015*v, { bp:2500, q:2, a:.05 }); break;
    case 'event': nz(t, .3, .02*v, { bp:1800, q:1.5 }); osc('sine', 1046, t+.15, .25, .025*v, { rev:.5 }); osc('sine', 1568, t+.3, .35, .02*v, { rev:.5 }); break;
    case 'map': osc('sine', 392, t, .25, .025*v, { rev:.5 }); osc('sine', 587, t+.08, .3, .02*v, { rev:.5 }); break;
    case 'store': [0,4,7].forEach((s,i) => osc('triangle', 784*Math.pow(2,s/12), t+i*.05, .3, .022*v, { rev:.4 })); break;
    case 'explode': nz(t, 1.6, .2*v, { lp:3000, sweep:120, rev:.6 }); osc('sine', 80, t, 1.2, .12*v, { to:25 }); for(let i=0;i<5;i++) nz(t+.1+Math.random()*.7, .25, .06*v, { bp:400+Math.random()*1200, q:1 }); break;
    case 'victory': [0,4,7,12,16].forEach((s,i) => osc('triangle', 392*Math.pow(2,s/12), t+i*.09, .5, .03*v, { rev:.5 })); osc('sine', 98, t, 1.2, .04*v); break;
    case 'defeat': [0,-3,-7,-12].forEach((s,i) => osc('sawtooth', 330*Math.pow(2,s/12), t+i*.22, .7, .025*v, { lp:900, rev:.6 })); break;
    case 'achieve': [0,4,7,12].forEach((s,i) => osc('square', 880*Math.pow(2,s/12), t+i*.07, .18, .018*v, { lp:3500, rev:.3 })); break;
    case 'drone': osc('sawtooth', 180, t, .5, .025*v, { to:420, lp:1200 }); nz(t, .3, .02*v, { hp:2500 }); break;
    case 'hack': for(let i=0;i<6;i++) osc('square', 400 + Math.random()*1600, t+i*.05, .04, .015*v, { lp:3000 }); break;
    case 'mind': osc('sine', 200, t, 1, .04*v, { to:800, rev:.8 }); osc('sine', 203, t, 1, .04*v, { to:790 }); break;
    case 'shoot_star': nz(t, .9, .012*v, { hp:4000, sweep:9000, a:.2, rev:.8 }); break;
    default: osc('square', 880, t, .04, .02*v);
  }
}

/* ---------------- ship ambience: hum, fire, breaches, alarms ---------------- */
const AMB = { hum:null, fire:null, wind:null, beep:0 };
function loopNoise(filterType, freq, q){ const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = NOISE; s.loop = true; f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AMBG); s.start(); return { s, f, g }; }
function startAmbience(){
  if(!AC || AMB.hum) return;
  const o1 = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
  o1.type = 'sawtooth'; o1.frequency.value = 48; o2.type = 'sawtooth'; o2.frequency.value = 48.6; f.type = 'lowpass'; f.frequency.value = 160; g.gain.value = 0;
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(AMBG); o1.start(); o2.start(); AMB.hum = { g, f };
  AMB.fire = loopNoise('bandpass', 600, .7); AMB.wind = loopNoise('highpass', 1800, .5);
}
function updateAmbience(dt){
  if(!AC || !AMB.hum) return; const t = now();
  const inGame = typeof UI!=='undefined' && UI.screen==='game' && typeof G!=='undefined' && G;
  const s = inGame ? G.ship : null;
  const eng = s && s.systems.engines ? eff(s,'engines') : 0;
  AMB.hum.g.gain.setTargetAtTime(inGame ? .05 + eng*.008 : 0, t, .4); AMB.hum.f.frequency.setTargetAtTime(140 + eng*25 + (G?.warp>0 ? 600 : 0), t, .3);
  const fires = s ? s.rooms.reduce((a,r)=>a+r.fire,0) : 0, breaches = s ? s.rooms.reduce((a,r)=>a+r.breach,0) : 0;
  AMB.fire.g.gain.setTargetAtTime(Math.min(.12, fires*.03), t, .3); AMB.fire.f.frequency.setTargetAtTime(450 + Math.random()*300, t, .05);
  AMB.wind.g.gain.setTargetAtTime(Math.min(.08, breaches*.03), t, .3);
  // a soft warning chirp while the hull is critical
  if(s && s.hull <= s.maxHull*.25 && !G.paused){ AMB.beep -= dt; if(AMB.beep<=0){ AMB.beep = 1.6; osc('square', 990, t, .07, .02, { lp:2500, dest:AMBG }); } }
}

/* ---------------- adaptive music ---------------- */
const MUS = { timer:null, next:0, step:0, combat:0, boss:0, mood:null, bar:0, layers:null };
const MOODS = {
  civilian: { scale:[0,2,4,7,9], prog:[[0,4,7,11],[-3,0,4,7],[5,9,12,16],[7,11,14,17]], root:110, tempo:.30, pad:'triangle', lead:'sine' },
  pyrate:   { scale:[0,3,5,7,10], prog:[[0,3,7,10],[-4,0,3,7],[-2,2,5,9],[-5,-1,2,5]], root:98, tempo:.28, pad:'sawtooth', lead:'triangle' },
  nebula:   { scale:[0,2,3,7,8], prog:[[0,3,7,14],[-4,0,3,10],[1,5,8,12],[-2,2,5,9]], root:92, tempo:.36, pad:'sine', lead:'sine' },
  rebuff:   { scale:[0,1,3,7,8], prog:[[0,3,7,10],[1,5,8,12],[-2,1,5,8],[-4,-1,3,7]], root:104, tempo:.27, pad:'sawtooth', lead:'square' },
  alien:    { scale:[0,2,6,7,11], prog:[[0,4,6,11],[2,6,9,13],[-1,2,6,9],[4,7,11,14]], root:116, tempo:.32, pad:'triangle', lead:'triangle' },
  final:    { scale:[0,1,3,6,7], prog:[[0,3,6,10],[-1,3,6,9],[1,4,8,11],[-2,1,6,9]], root:87, tempo:.25, pad:'sawtooth', lead:'square' },
};
function currentMood(){
  if(typeof G==='undefined' || !G) return 'nebula';
  const t = G.sectorType || 'civilian'; const sd = (typeof DATA!=='undefined' && DATA.sectors?.[t]) || {};
  if(sd.final) return 'final'; if(sd.nebula > .3 || /nebula/.test(t)) return 'nebula';
  if(/pyrate|pirate/.test(t)) return 'pyrate'; if(/rebuff|rebel/.test(t)) return 'rebuff'; if(/civil|home/.test(t)) return 'civilian';
  return 'alien';
}
function startMusic(){ if(!AC || MUS.timer) return; MUS.next = now() + .2; MUS.timer = setInterval(musicTick, 50); }
function musicTick(){
  if(!AC) return; if(SET.music<=0){ MUS.next = now() + .1; return; }
  const inGame = typeof G!=='undefined' && G && typeof UI!=='undefined' && UI.screen==='game';
  const fighting = inGame && G.enemy && !G.enemy.dead; const boss = fighting && G.boss;
  MUS.combat += ((fighting ? 1 : 0) - MUS.combat) * .04; MUS.boss += ((boss ? 1 : 0) - MUS.boss) * .04;
  MUS.mood = currentMood();
  const M = MOODS[MUS.mood]; const step = M.tempo * (1 - .12*MUS.combat);
  while(MUS.next < now() + .3){ playStep(MUS.step, MUS.next, M, step); MUS.next += step; MUS.step++; }
}
function mnote(f, t, d, type, v, o={}){ osc(type, f, t, d, v, Object.assign({ dest:MUSG, a:o.a ?? Math.min(1.2, d*.3) }, o)); }
function playStep(s, t, M, step){
  const sector = (typeof G!=='undefined' && G) ? G.sector : 1;
  const root = M.root * Math.pow(2, ((sector*5) % 12 - 5)/12 * .5);
  const bar = Math.floor(s/16), chord = M.prog[bar % 4], c = MUS.combat, b = MUS.boss;
  const hz = n => root*Math.pow(2, n/12);
  // pad: detuned pair through a soft filter, fades back during combat
  if(s % 16 === 0) chord.forEach(n => { mnote(hz(n)*2, t, step*16.5, M.pad, .022*(1-.4*c), { lp:700 + 500*c, rev:.6 }); mnote(hz(n)*2, t, step*16.5, M.pad, .016*(1-.4*c), { lp:700, detune:9 }); });
  // bells / arpeggio from the mood's scale
  if(s % 2 === 0 && Math.random() < .55 - .2*c){ const deg = M.scale[Math.floor(Math.random()*M.scale.length)] + chord[0]; mnote(hz(deg + (Math.random()<.4 ? 24 : 12)), t, .9, M.lead, .018, { a:.005, rev:.7 }); }
  // slow bass line in exploration
  if(s % 8 === 0) mnote(hz(chord[0])/2, t, step*7.5, 'sine', .05*(1-.5*c), { lp:300 });
  // combat layer: driving bass, kick, snare, hats, tension arp
  if(c > .05){
    if(s % 2 === 0) mnote(hz(chord[s % 4 === 0 ? 0 : 0] + (s % 8 === 6 ? 7 : 0))/2, t, step*1.6, 'sawtooth', .045*c, { lp:420 + 300*b, a:.005 });
    if(s % 4 === 0){ osc('sine', 150, t, .22, .12*c, { to:45, dest:MUSG }); }
    if(s % 8 === 4){ nz(t, .16, .06*c, { bp:1800, q:.8, dest:MUSG }); osc('triangle', 220, t, .08, .03*c, { to:140, dest:MUSG }); }
    if(s % 2 === 1) nz(t, .035, .02*c, { hp:7000, dest:MUSG });
    if(s % 4 === 2 && Math.random()<.7){ const n = chord[(s/2) % 4]; mnote(hz(n+12), t, step*1.2, 'square', .012*c, { lp:2400, a:.003 }); }
  }
  // boss layer: low brass stabs and a second kick
  if(b > .05){
    if(s % 16 === 0 || s % 16 === 10) chord.slice(0,3).forEach(n => mnote(hz(n), t, step*3, 'sawtooth', .03*b, { lp:900, a:.01 }));
    if(s % 4 === 3) osc('sine', 120, t, .18, .08*b, { to:40, dest:MUSG });
  }
}
function stinger(kind){ if(!AC) return; sfx(kind); }
