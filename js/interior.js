'use strict';
/* =========================================================================
   The walkable full-scale 3D ship has been retired for now: the flat-screen
   game comes first. VR keeps the bridge, the holotable, the stations and
   mixed reality. These stubs keep the rest of the VR code happy.
   (The old walkable ship is in the git history if it ever comes back.)
   ========================================================================= */
const IN = { own:null, foe:null, aboard:null, beamT:0, beamTo:null, deep:false };
function shipMode(){ return 'classic'; }
function headInOwn(){ return false; }
function interiorPick(){ return null; }
function interiorAct(){ return false; }
function interiorWalk(){ return null; }
function interiorSpark(){}
function roomNeedsHelp(){ return false; }
function beamCaptain(){ if(typeof toast==='function') toast('Use the teleporter on the console to send crew over.'); }
/* the bridge's rear door stays shut: there is nothing behind it any more */
function updateInteriors(){ if(typeof bridge==='undefined' || !bridge) return; bridge.doorOpen = 0; if(bridge.doorLeaves) bridge.doorLeaves.forEach(L => { L.g.position.x = L.sx*.45; }); if(bridge.doorSign) bridge.doorSign.visible = false; }
