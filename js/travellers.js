'use strict';
/* =========================================================================
   Travellers: people who keep crossing your path, like Mags Vetch (market.js).
   - Kestrel Jones, bounty hunter: pays you to hunt one kind of ship. Fill
     enough contracts and she offers you her old rifle, or herself.
   - Doctor Ossian Oddly, travelling surgeon: fits your crew with implants
     (some of them experimental) from a hospital ship painted like a circus.
   - Devotion: crew at ten hearts get a last scene, and refuse to die once.
   ========================================================================= */

/* ---------------- bounties ---------------- */
const BOUNTY_NAMES = { pyrate:'pyrate', rebuff:'Rebuff', auto:'automated', mantlis:'Mantlis', sloog:'Sloog', voltan:'Voltan', enjinn:'Enjinn', pebblekin:'Pebblekin', glass:'Glassborn' };
function bountyFaction(){ const tags = (sectorDef().enemyTags || []).filter(t => BOUNTY_NAMES[t]); return tags.length && Math.random() < .7 ? pick(tags) : pick(['pyrate','rebuff','auto','pyrate']); }
function newBounty(){ const f = bountyFaction(), n = G.sector >= 5 ? 3 : 2; return { faction:f, n, got:0, pay:40 + 14*G.sector + 10*n, by:Math.min(R.sectors, G.sector + 1) }; }
function bountyText(b){ return b ? `${b.n} ${BOUNTY_NAMES[b.faction] || b.faction} ship${b.n===1?'':'s'} (${b.got}/${b.n}) · ${b.pay} scrap · by the end of sector ${b.by}` : ''; }
/* called when you win a fight (run.js finishCombat) */
function bountyKill(e){
  const b = G && G.bounty; if(!b || !e) return null;
  if(b.by < G.sector){ G.bounty = null; toast('Your contract with Kestrel Jones has run out.'); return null; }
  if(e.faction!==b.faction && !(e.hailTag===b.faction)) return null;
  b.got++; if(b.got < b.n) return `Bounty: ${b.got}/${b.n} ${BOUNTY_NAMES[b.faction] || b.faction} ships`;
  G.scrap += b.pay; G.stats.scrap += b.pay; G.bounty = null; const k = (G.kestrel = G.kestrel || { done:0, met:1 }); k.done++;
  if(typeof sagaNote==='function') sagaNote('bounty', `The crew filled a contract for Kestrel Jones in sector ${G.sector}: ${b.n} ${BOUNTY_NAMES[b.faction]} ships, ${b.pay} scrap.`);
  if(k.done >= 3 && !k.gifted){ if(!G.later.some(l => l.event==='k_gift')) G.later.push({ event:'k_gift', jumps:ri(1, 3) }); }
  else if(!G.later.some(l => l.event==='k_again')) G.later.push({ event:'k_again', jumps:ri(3, 6) });
  grant('trav_bounty'); return `Bounty complete! Kestrel Jones wires you ${b.pay} scrap`;
}

/* ---------------- implants ---------------- */
const IMPLANTS = {
  bones:  { name:'Reinforced bones', cost:40, desc:'+25 health, permanently.', hp:25 },
  reflex: { name:'Reflex chip',      cost:45, desc:'Moves 15% faster.', speed:1.15 },
  eye:    { name:'Targeting eye',    cost:50, desc:'Weapons charge 8% faster while they man them.', charge:1.08 },
  grip:   { name:'Hydraulic grip',   cost:45, desc:'Hits 20% harder and repairs 10% faster.', dps:1.2, repair:1.1 },
  nanites:{ name:'Med-nanites',      cost:55, desc:'Slowly heals everyone in the same room.', heal:1 },
  cortex: { name:'Learning cortex',  cost:35, desc:'Learns every skill 25% faster.', xp:1.25 }
};
function implantPerk(c){ if(!c || !c.implants || !c.implants.length) return null; const p = { repair:1, dps:1, charge:1, speed:1, shield:1, evade:0, heal:0 };
  for(const k of c.implants){ const im = IMPLANTS[k]; if(!im) continue; for(const f of ['repair','dps','charge','speed']) if(im[f]) p[f] *= im[f]; if(im.heal) p.heal += im.heal; } return p; }
function oddlyPrice(k){ const h = (G.oddly && G.oddly.hearts) || 0; return Math.round(IMPLANTS[k].cost * (1 + .03*(G.sector-1)) * (h >= 4 ? .8 : 1)); }
function fitImplant(c, k){
  const im = IMPLANTS[k]; if(!im || !c) return false; c.implants = c.implants || []; if(c.implants.length >= 2 || c.implants.includes(k)) return false;
  c.implants.push(k); if(im.hp){ c.maxHp += im.hp; c.hp += im.hp; } (G.oddly = G.oddly || { met:1, hearts:0 }).hearts += 1; if(c.implants.length >= 2) grant('trav_oddly'); return true;
}
/* the experimental treatment: cheap, and you never quite know */
function experiment(c){
  const r = Math.random(); c.implants = c.implants || [];
  if(r < .6){ const free = Object.keys(IMPLANTS).filter(k => !c.implants.includes(k)); shuffle(free); const got = free.slice(0, Math.max(0, Math.min(2, 2 - c.implants.length)));
    for(const k of got){ c.implants.push(k); if(IMPLANTS[k].hp){ c.maxHp += IMPLANTS[k].hp; c.hp += IMPLANTS[k].hp; } }
    return got.length ? `It works! ${c.name} wakes up with ${got.map(k => IMPLANTS[k].name.toLowerCase()).join(' and ')}, and a strong craving for pickles.` : `${c.name} feels "zingy". Nothing else changes.`; }
  if(r < .85){ const old = c.quirk; c.quirk = typeof rollQuirk==='function' ? rollQuirk([old]) : old; c.quirkSet = true;
    if(typeof sagaNote==='function') sagaNote('oddly', `An experimental treatment from Doctor Oddly turned ${c.name} from ${aN(((quirkDef(old)||{}).name || 'crew member').toLowerCase())} into ${aN(((quirkDef(c.quirk)||{}).name || 'new person').toLowerCase())}.`);
    return `Side effect: ${c.name} wakes up a completely different person. They are now ${aN((quirkDef(c.quirk)||{}).name.toLowerCase())}. They seem happy about it.`; }
  c.maxHp = Math.max(50, c.maxHp - 10); c.hp = Math.min(c.hp, c.maxHp); return `It goes wrong. ${c.name} loses some strength (-10 health) and now glows faintly in the dark. Doctor Oddly takes notes.`;
}
function drawClinic(m){
  const f = mframe(1360, 860, 'Doctor Oddly\'s travelling clinic', C.violet, m), crew = G.ship.crew.filter(c => c.owner==='p' && !c.drone), ks = Object.keys(IMPLANTS);
  para('"Step right up! Bones, eyes, reflexes, all the latest models. Two per patient, ethics strictly optional." Pick an implant for each crew member: they keep it for the rest of the run.', f.x+32, f.y+100, f.w-260, { s:16, lh:21, c:C.muted, max:2 });
  T(`Scrap ${G.scrap}`, f.x+f.w-230, f.y+52, { s:24, f:FD, w:700, c:C.amber });
  ks.forEach((k, i) => { const x = f.x+300 + i*168; T(IMPLANTS[k].name, x+80, f.y+168, { s:14, f:FD, w:700, a:'center', c:C.violet, max:160 }); T(`${oddlyPrice(k)} scrap`, x+80, f.y+188, { s:13, a:'center', c:C.amber }); tip(x, f.y+150, 160, 44, IMPLANTS[k].name, IMPLANTS[k].desc); });
  crew.slice(0, 8).forEach((c, r) => { const y = f.y+204 + r*64, has = c.implants || [];
    const pick_ = UI.selCrewOddly===c.id; panel(f.x+32, y, f.w-64, 56, 8); if(pick_){ rr(f.x+32, y, 250, 56, 8); ctx.strokeStyle = C.hostile; ctx.lineWidth = 2.5; ctx.stroke(); }
    region(f.x+32, y, 250, 56, () => { UI.selCrewOddly = c.id; }, 'patient:' + c.name); drawPortrait(f.x+60, y+28, 20, c, false); T(c.name, f.x+92, y+24, { s:17, f:FD, w:700, max:180 });
    T(has.length ? has.map(k => IMPLANTS[k].name).join(', ') : 'No implants', f.x+92, y+44, { s:11, c: has.length ? C.violet : C.muted, max:190 });
    ks.forEach((k, i) => { const x = f.x+300 + i*168, own = has.includes(k), full = has.length >= 2, p = oddlyPrice(k);
      btn(x, y+8, 160, 40, own ? 'Fitted' : full ? 'Full' : 'Fit', () => { if(G.scrap < p){ toast('Not enough scrap.'); return; } if(fitImplant(c, k)){ G.scrap -= p; sfx('buy'); toast(`${c.name}: ${IMPLANTS[k].name} fitted.`); save(); } }, { s:14, disabled:own || full || G.scrap < p, col:C.violet }); }); });
  const ex = 25;
  const pat = crew.find(x => x.id===UI.selCrewOddly && (x.implants||[]).length < 2);
  btn(f.x+32, f.y+f.h-84, 420, 56, m.expDone ? 'One experiment per visit' : pat ? `Experiment on ${pat.name} · ${ex}` : 'Experimental: pick a patient', () => { if(!pat){ toast('Tap a crew member\'s name to pick a patient.'); return; } if(G.scrap < ex){ toast('Not enough scrap.'); return; } G.scrap -= ex; m.note = experiment(pat); m.expDone = true; sfx('buy'); save(); }, { s:16, col:C.hostile, disabled:G.scrap < ex || m.expDone || !pat });
  tip(f.x+32, f.y+f.h-84, 420, 56, 'Experimental treatment', 'Cheap, and anything can happen: usually two free implants, sometimes a new personality, occasionally a glow-in-the-dark crew member.');
  if(m.note) para(m.note, f.x+480, f.y+f.h-74, f.w-760, { s:15, lh:20, c:C.cyan, max:2 });
  btn(f.x+f.w-232, f.y+f.h-84, 200, 56, 'Leave', () => { G.modal = null; save(); });
}

/* ---------------- devotion: ten hearts ---------------- */
function devotedSave(c){ if(!c || c.owner!=='p' || c.drone || !c.devoted || c.devUsed) return false;
  c.devUsed = true; c.hp = Math.max(15, c.maxHp*.2); toast(`${c.name} refuses to die. "Not today. Not while the captain needs me."`);
  if(typeof sagaNote==='function') sagaNote('devoted', `In sector ${G.sector} ${c.name} should have died, and simply refused to, for the captain's sake.`); return true; }

/* ---------------- scheduling: who turns up when ---------------- */
function travellersJump(){
  if(!G || G.daily || G.cup) return;
  if(G.sector >= 2 && !G.kestrel && !G.kestrelPlanned){ G.kestrelPlanned = true; if(Math.random() < .6) G.later.push({ event:'k_meet', jumps:ri(3, 7) }); }
  if(G.sector >= 2 && !G.oddly && !G.oddlyPlanned){ G.oddlyPlanned = true; if(Math.random() < .55) G.later.push({ event:'o_meet', jumps:ri(4, 9) }); }
  if(G.bounty && G.bounty.by < G.sector){ G.bounty = null; toast('Your contract with Kestrel Jones has run out.'); }
}
function travellerEffect(e, L){
  if(e.devote && G.evCtx && G.evCtx.starId){ const c = crewById(G.evCtx.starId); if(c){ c.devoted = true; L.push(`${c.name} is devoted to you: once, they will refuse to die`); } }
  if(e.bountyTake){ G.kestrel = G.kestrel || { done:0, met:0 }; G.kestrel.met++; G.bounty = newBounty(); L.push(`Contract: ${bountyText(G.bounty)}`);
    if(G.kestrel.met===1 && typeof sagaNote==='function') sagaNote('bounty', `In sector ${G.sector} the crew met Kestrel Jones, bounty hunter, and started taking her contracts.`); }
  if(e.kestrelMet){ G.kestrel = G.kestrel || { done:0, met:0 }; G.kestrel.met++; if(!G.later.some(l => l.event==='k_again')) G.later.push({ event:'k_again', jumps:ri(5, 8) }); }
  if(e.kestrelGift && G.kestrel){ G.kestrel.gifted = true; const pool = Object.values(DATA.weapons).filter(w => !w.noLoot && (w.tier||1) >= 3); L.push(giveWeapon(pool.length ? pick(pool).id : 'random')); grant('trav_kestrel'); }
  if(e.kestrelJoins && G.kestrel){ G.kestrel.gifted = true; if(G.ship.crew.filter(c => c.owner==='p' && !c.drone).length < R.maxCrew){ const k = addCrew(G.ship, 'human', 'p', 'Kestrel'); k.quirk = 'daredevil'; k.quirkSet = true; k.gender = 'f'; k.sk.weapons = 200; k.sk.combat = 200; k.sk.pilot = 120; k.vet = true; k.maxHp += 20; k.hp = k.maxHp;
    L.push('Kestrel Jones joins your crew'); if(typeof sagaJoined==='function') sagaJoined(k, 'after years of hunting alone'); grant('trav_kestrel'); } else { L.push('No bunk free: Kestrel leaves you her rifle instead'); L.push(giveWeapon('random')); } }
  if(e.clinic){ G.oddly = G.oddly || { met:0, hearts:0 }; G.oddly.met++; G.openClinic = true; if(G.oddly.met < 3 && !G.later.some(l => l.event==='o_again')) G.later.push({ event:'o_again', jumps:ri(6, 10) });
    if(G.oddly.met===1 && typeof sagaNote==='function') sagaNote('oddly', `In sector ${G.sector} the crew met Doctor Ossian Oddly, travelling surgeon, whose hospital ship was painted like a circus.`); }
  if(e.oddlyFree){ const c = pick(G.ship.crew.filter(x => x.owner==='p' && !x.drone && (x.implants||[]).length < 2)); if(c){ const k = pick(Object.keys(IMPLANTS).filter(x => !(c.implants||[]).includes(x))); fitImplant(c, k); L.push(`${c.name} gets a free ${IMPLANTS[k].name.toLowerCase()}`); } }
}

/* ---------------- the scenes ---------------- */
Object.assign(BASE.events, {
  k_meet:{ moment:true, noStar:true, star:'any', art:'ship', text:'A sleek black ship drops in beside you, guns cold but very visible. The woman on screen has a scar, a long rifle and no patience. "Kestrel Jones. I hunt ships for money. You lot shoot ships for free, which offends me professionally. Want to get paid for it?"', choices:[
    { text:'Take a contract.', effect:{ text:'"Good. Bring me proof, I pay on the nail. Don\'t die, it\'s bad for business."', bountyTake:true } },
    { text:'Ask about the scar.', effect:{ text:'"Pyrate king. He\'s got a worse one." She sends you a contract anyway, "for asking nicely".', bountyTake:true, starHearts:10 } },
    { text:'"We\'re not mercenaries."', effect:{ text:'"Everyone\'s a mercenary, love. Some just don\'t charge." She leaves, but you have a feeling she\'ll be back.', kestrelMet:true } } ] },
  k_again:{ moment:true, noStar:true, questOnly:true, once:false, star:'any', art:'ship', text:'The sleek black ship again. Kestrel Jones, cleaning her rifle. "Got work, if you want it. Pays better than whatever you\'re doing."', choices:[
    { text:'Take the contract.', effect:{ text:'"Same rules. Proof, payment, don\'t die."', bountyTake:true } },
    { text:'"Not right now."', effect:{ text:'"Your loss." She leaves you a box of rifle rounds that fit your missile racks, somehow.', missiles:2, kestrelMet:true } } ] },
  k_gift:{ moment:true, noStar:true, questOnly:true, star:'any', art:'ship', text:'Kestrel Jones docks with you for the first time, and comes aboard without her rifle. "Three contracts. Nobody\'s done three for me. I\'m getting old for this, and you lot are... alright." She looks at the floor. "I could use a crew. Or you could use my old rifle. Your choice."', choices:[
    { text:'"Join us."', effect:{ text:'She salutes, badly, and drops her bag in the bunk room. "Don\'t make it weird."', kestrelJoins:true, saga:'Kestrel Jones, bounty hunter, hung up her contracts and joined the crew.' } },
    { text:'Take the rifle.', effect:{ text:'She hands it over like a newborn. "Look after her. She\'s killed more pyrates than the plague."', kestrelGift:true, saga:'Kestrel Jones gave the crew her old rifle, and her blessing.' } } ] },
  o_meet:{ moment:true, noStar:true, star:'any', art:'station', text:'A hospital ship painted like a circus tent pulls alongside, playing an organ tune over every channel. "Doctor Ossian Oddly, travelling surgeon, at your service! Bones, eyes, reflexes, all the latest models. First check-up is free!"', choices:[
    { text:'Visit the clinic.', effect:{ text:'The airlock opens onto a waiting room full of tropical fish and a very calm skeleton.', clinic:true, crewHeal:20 } },
    { text:'Just the free check-up, thanks.', effect:{ text:'Doctor Oddly checks everyone, pronounces them "mostly alive", and hands out lollipops.', crewHeal:50 } } ] },
  o_again:{ moment:true, noStar:true, questOnly:true, once:false, star:'any', art:'station', text:'The organ music is back. Doctor Oddly\'s circus ship, and the doctor himself, waving a bone saw cheerfully. "My favourite patients! I\'ve had some exciting new ideas."', choices:[
    { text:'Visit the clinic.', effect:{ text:'"Come in, come in. Mind the skeleton, he bites."', clinic:true } },
    { text:'Let him try out one new idea, for free.', chance:.7, success:{ text:'It works! He is as surprised as anyone.', oddlyFree:true }, fail:{ text:'It does not work. {crew} has hiccups for a week. Doctor Oddly writes a paper about it.', crewHurt:5 } } ] },
  m_heart10:{ moment:true, questOnly:true, star:'any', once:false, text:'{crew} stops you in a corridor and says, all in one breath: "I just want you to know, captain, I\'d follow you into a sun. I mean that. Whatever happens out there, I\'m not leaving you." Then they walk off very fast before you can answer.', choices:[
    { text:'Call after them: "Same."', effect:{ text:'They do not turn around, but you can tell they are grinning. {crew} is devoted to you now: once, when it counts, they will refuse to die.', devote:true, saga:'{crew} told the captain they would follow them into a sun, and meant it.' } } ] },

  /* --- more strange things on the road --- */
  m_mirror:{ moment:true, star:'any', minSector:2, weight:.7, text:'A ship drops out of hyperspace that is exactly like yours. Exactly. On screen, your own crew, all with little beards, including {crew}, who is also on screen with a little beard. "Greetings from the other universe," says the other you. "We\'re the evil ones."', choices:[
    { text:'Fight your evil selves.', effect:{ text:'They fight exactly like you do, which is to say, quite badly. It is very confusing.', fight:'random', afterWin:{ text:'Their hold is full of your own stuff, but evil.', scrap:35, goods:'random' }, saga:'The crew fought their own evil twins from a mirror universe, and won, narrowly.' } },
    { text:'Swap stories over a drink.', effect:{ text:'It turns out being evil is mostly paperwork. They give you a crate of evil wine and leave. Evil {crew} winks.', goods:{ space_wine:2 }, crewHeal:15 } } ] },
  m_baby:{ moment:true, star:'any', text:'There is a basket in the airlock. In the basket, an alien baby: green, very round, gurgling, with a note: "Please look after Squib. Back in three beacons. Probably."', choices:[
    { text:'Look after Squib.', effect:{ text:'{crew} becomes Squib\'s main carer, mostly because Squib will not let go of their finger.', later:{ event:'m_baby_back', jumps:3 }, setFlag:'squib', starHearts:30 } },
    { text:'Hand Squib to the nearest station\'s lost property.', effect:{ text:'The lost property office already has eleven alien babies. They sigh, and give you a receipt.', scrap:5 } } ] },
  m_baby_back:{ moment:true, questOnly:true, star:'any', flag:'squib', text:'Squib\'s parents arrive in a ship the size of a moon. They are also green, very round, and very grateful. Squib does not want to let go of {crew}.', choices:[
    { text:'Hand Squib back.', effect:{ text:'Squib\'s parents give you a reward that would make a pyrate king blush. {crew} cries, a little, in the galley.', scrap:60, clearFlag:'squib', saga:'The crew babysat an alien baby called Squib for three beacons. {crew} still has a photo.' } },
    { text:'Ask them to visit sometimes.', effect:{ text:'They promise. They leave a gift, and a seed from their homeworld.', scrap:35, seeds:{ moon_melon:2 }, clearFlag:'squib', crewHeal:20 } } ] },
  m_band:{ moment:true, star:'any', minCrew:3, text:'{crew} has formed a band with the rest of the crew. They practise in the cargo hold every night. They are terrible. They call themselves "{crew} and the Hull Breaches".', choices:[
    { text:'Encourage them.', effect:{ text:'They get slightly less terrible. A booking agent heard them through the hull at the last beacon and wants them for a gig.', later:{ event:'m_band_gig', jumps:3 }, setFlag:'band', crewHeal:10 } },
    { text:'Soundproof the cargo hold. (1 drone part)', req:{ parts:1 }, cost:{ parts:1 }, effect:{ text:'Peace returns. The band plays on, unheard, happier than ever.' } } ] },
  m_band_gig:{ moment:true, questOnly:true, star:'any', flag:'band', text:'The gig! A packed space bar, a sticky stage, and {crew} and the Hull Breaches about to play their first and possibly last show.', choices:[
    { text:'Play the hits. (Both of them.)', chance:.6, success:{ text:'The crowd goes wild. Someone throws underwear. The bar pays double and books them for next year.', scrap:45, crewHeal:30, clearFlag:'band', saga:'{crew} and the Hull Breaches played their first gig in a space bar, and someone threw underwear.' }, fail:{ text:'The crowd throws things that are not underwear. The band escapes with their lives and a small fee.', scrap:10, crewHurt:5, clearFlag:'band' } },
    { text:'Play the slow one {crew} wrote about the ship.', effect:{ text:'The whole bar goes quiet. A Mantlis cries. You are not paid much, but nobody aboard will forget it.', scrap:15, crewHeal:40, clearFlag:'band', saga:'At their only gig, {crew} sang a song about the ship, and made a Mantlis cry.' } } ] },
  m_inspection:{ moment:true, star:'any', garden:true, minSector:2, text:'A Rebuff health inspector in a hazmat suit boards to inspect your "unlicensed agricultural and catering operation". She has a clipboard. She has two clipboards.', choices:[
    { text:'Let {who} handle it.', req:{ quirk:'cook' }, effect:{ text:'{who} gives her a tour, a tasting menu and a lecture on seasoning. She awards five stars and asks for the recipes.', scrap:20, saga:'{who} charmed a Rebuff health inspector with a tasting menu.' } },
    { text:'Pay the "licence fee". (15 scrap)', req:{ scrap:15 }, cost:{ scrap:15 }, effect:{ text:'She stamps everything twice and leaves. The licence is framed next to the coffee machine.' } },
    { text:'Hide the planters.', chance:.5, success:{ text:'She does not find them. She does find {crew} in a cupboard, holding a melon. She lets it go.' }, fail:{ text:'She finds them. She confiscates a crop "for testing" and fines you.', gardenBoost:-1, scrap:-10 } } ] },
  m_triangle:{ moment:true, bond:true, bondKind:'sweethearts', minCrew:3, minSector:2, text:'{friend} caught {crew} flirting with a very handsome Pebblekin at the last station. There has been shouting. There has been a slammed door. A door on a spaceship, which takes effort.', choices:[
    { text:'Sit them both down and make them talk.', chance:.65, success:{ text:'It was a misunderstanding: the Pebblekin was selling insurance. They make up, loudly, behind the same door.', starHearts:20, crewHeal:10, saga:'{crew} and {friend} survived a misunderstanding involving a handsome Pebblekin insurance salesman.' }, fail:{ text:'It was not a misunderstanding. They break up. They are civil about it, mostly, except at dinner.', bondFix:'rivals' } },
    { text:'Stay well out of it.', effect:{ text:'The door stays slammed for a day, then quietly opens. Nobody mentions it again.' } } ] },
  m_heist:{ moment:true, star:'expyrate', minSector:3, weight:.8, text:'{crew} has a plan. There is a pyrate casino at this beacon, its vault is guarded by one sleepy Sloog, and {crew} "knows a guy". The plan has eleven steps. Step seven is "improvise".', choices:[
    { text:'Pull the heist.', chance:.5, success:{ text:'It goes perfectly, except step seven, which goes even better. You leave with a fortune and the Sloog\'s hat.', scrap:90, saga:'{crew} planned and pulled off a heist on a pyrate casino. Step seven was improvise.' }, fail:{ text:'Step four goes wrong, and so do five to eleven. You leave fast, with the casino\'s security ship close behind.', fight:'pyrate_gunship' } },
    { text:'Let {who} count the cards instead.', req:{ quirk:'gambler' }, effect:{ text:'{who} counts cards until security politely asks you to leave. You leave, politely, much richer.', scrap:50 } },
    { text:'"No heists."', effect:{ text:'{crew} sulks, then admits step seven was "a bit vague".' } } ] }
});
ACHIEVEMENTS.push(
  { id:'trav_bounty',  name:'Bounty Hunter',       desc:'Complete a contract for Kestrel Jones.' },
  { id:'trav_kestrel', name:'Kestrel\'s Crew',      desc:'Earn Kestrel Jones\'s trust.' },
  { id:'trav_oddly',   name:'Mostly Organic',       desc:'Fit a crew member with two implants.' }
);
