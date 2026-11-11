/* The Fedoration Gazette: every finished voyage gets a front page, written from its captain's log. The paper is
   made on the spot from the saved log (same voyage, same paper), so nothing extra is stored. Read it from the end
   screen, or Record → Captain's logs → Front page. Loaded after logbook.js. */
function gzRng(seed){ let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
function gzGrown(){ return !(typeof SET!=='undefined' && SET.grownUp===false); }
const GZ_PRICE = ['Price: 2 scrap. 3 on Sundays.', 'Price: one drone part or best offer.', 'Free to anyone who can prove they are still alive.', 'Price: 2 scrap. Rebuff officers: 40 scrap.', 'Price: whatever you\'ve got. Times are hard.'];
const GZ_MOTTO = ['All the news that survived.', 'Often right. Sometimes on purpose.', 'Printed on the same day it happened, more or less.', 'The galaxy\'s second most trusted paper, out of two.', 'If it exploded, we covered it.'];
const GZ_WIN = ['FLAGGSHIP DOWN! {SHIP} SAVES GALAXY, ASKS FOR RECEIPT', 'REBUFF FLAGGSHIP DESTROYED BY "{SHIP}", OF ALL THINGS', 'IT\'S OVER! COURIER SHIP DELIVERS PARCEL AND A WAR', '{SHIP} WINS. BOOKIES IN TEARS', 'GALAXY SAVED BY {N} PEOPLE WHO WERE MOSTLY WINGING IT'];
const GZ_LOSS_HULL = ['{SHIP} LOST WITH ALL HANDS AND MOST OF THE CUTLERY', '"IT\'LL BUFF OUT," SAID CAPTAIN. IT DID NOT', '{SHIP} NOW AVAILABLE IN FOUR HUNDRED CONVENIENT PIECES', 'COURIER SHIP DESTROYED IN SECTOR {S}. PARCEL "SLIGHTLY LATE"', 'HULL OF {SHIP} "GAVE UP FIRST", EXPERTS SAY'];
const GZ_LOSS_CREW = ['GHOST SHIP! {SHIP} FOUND DRIFTING, KETTLE STILL WARM', '{SHIP} RUNS OUT OF CREW BEFORE IT RUNS OUT OF SECTORS', 'EMPTY SHIP FOUND IN SECTOR {S}. LAST LOG ENTRY: "OOPS"', 'NO SURVIVORS ABOARD {SHIP}. PLENTY OF WASHING-UP'];
const GZ_LOSS_FLEET = ['FLEET CATCHES {SHIP}. "THEY STOPPED FOR SNACKS," SAYS WITNESS', '{SHIP} OUTRUN BY A FLEET THAT WAS FRANKLY NOT HURRYING', 'TOO SLOW! COURIER OVERTAKEN IN SECTOR {S}'];
const GZ_LOSS_ANY = ['{SHIP} LOST IN SECTOR {S}. NOBODY SURPRISED', 'ANOTHER COURIER GONE. ADMIRALTY "RUNNING LOW ON COURIERS"', 'VOYAGE OF {SHIP} ENDS BADLY, AS PREDICTED BY EVERYONE'];
const GZ_LEAD_WIN = ['The {ship} limped into Fedoration space last night after {J} jumps and {K}, having destroyed the Rebuff Flaggship and, witnesses say, the mood aboard it. Admiral Hale called the victory "a relief" and "frankly baffling".',
  'After {J} jumps the {ship} has done what the entire navy could not. Its captain, reached by comms, said only: "Is there a medal? There should be a medal." There is a medal. It is quite small.'];
const GZ_LEAD_LOSS = ['The {ship} was lost in sector {S} yesterday, {J} jumps into a voyage that had been going, in the words of one observer, "about how you\'d expect". It had accounted for {K} along the way. The Admiralty has sent flowers to nobody in particular.',
  'Hopes for the galaxy took another knock as the {ship} met its end in sector {S} after {J} jumps and {K}. A spokesman said the Fedoration "remains confident" and "has started interviewing for the next one".',
  'It is with a heavy heart, and a certain sense of routine, that we report the loss of the {ship} in sector {S}. Final score: {K}, {J} jumps, one parcel undelivered.'];
const GZ_FLED = ['BRAVE SIR RUNAWAY', 'TACTICAL WITHDRAWALS: A RECORD?', 'DISCRETION, VALOUR, ETC.'];
const GZ_FLED_T = ['The {ship} was seen leaving {n} at speed, including a meeting with the {x}. "We weren\'t running," said a crew member. "We were advancing in a different direction."',
  'Our shipping correspondent counts {n} this voyage that the {ship} left early. The {x} is said to be "a bit hurt, actually".'];
const GZ_KILLS = ['PYRATES AND WORSE: THE TALLY', 'SALVAGE YARDS REPORT BUMPER WEEK', 'INSURERS "CONCERNED"'];
const GZ_KILLS_T = ['The {ship} put paid to {K} this voyage, among them the {x}. Scrap dealers along the route have declared a public holiday.',
  'Among those beaten by the {ship} was the {x}, whose captain could not be reached for comment, on account of being in several places at once.'];
const GZ_SHOP = ['HIGH STREET BOOSTED BY ONE SHIP', 'BIG SPENDER'];
const GZ_SHOP_T = ['Store owners along the route say the {ship} spent {n} scrap with them. "Lovely people," said one. "Terrible hagglers."', 'The {ship} left {n} scrap in the tills of the galaxy\'s shopkeepers, most of whom have since moved somewhere nicer.'];
const GZ_GRAVE = ['DEAD CREW MEMBER "FEELING MUCH BETTER"', 'CEMETERY REPORTS ONE GRAVE "RETURNED UNUSED"'];
const GZ_GRAVE_T = ['{x}, who died on an earlier voyage, was this week dug up and put back on the rota. Asked how death had been, they said, "Quiet. No meetings."', 'Staff at a cemetery moon confirm that {x} has been "checked out" by a former captain. The headstone has been kept, "in case".'];
const GZ_JOIN = ['NEW FACES', 'SITUATIONS FILLED'];
const GZ_JOIN_T = ['{x} signed on with the {ship} during the voyage. Friends describe the decision as "brave", "sudden" and "not really thought through".', 'The {ship} took on {x} along the way. No references were asked for, and none, we understand, were available.'];
const GZ_ORDERS = ['ADMIRAL "ALMOST PLEASED"', 'ORDERS FOLLOWED, FOR ONCE'];
const GZ_ORDERS_T = ['Admiral Hale has commended the {ship} for carrying out all three of his orders, a thing he says has "never happened before, and frankly unsettles me".', 'The {ship} did everything the Admiralty asked of it this voyage. An inquiry has been opened to find out what went right.'];
const GZ_QUIET = ['NOTHING ELSE HAPPENED', 'SLOW NEWS DAY'];
const GZ_QUIET_T = ['Our reporter followed the {ship} for the whole voyage and has filed four hundred words about the wallpaper. We have not printed them.', 'In other news, there was no other news. The editor would like it known that this is not his fault.'];
const GZ_WEATHER = ['Space: dark, with further dark expected. Outlook: dark.', 'Ion storms in the west. Solar flares by tea time. Take a coat.', 'Mostly vacuum. Some asteroids later. A light drizzle of missiles near Rebuff space.', 'Nebula spreading from the east. Sensors useless. Bring a torch.', 'Cold. It\'s space. It\'s always cold. Stop writing in.'];
const GZ_STARS = ['ARIES: Today you will be shot at. Tomorrow also.', 'TAURUS: A stranger will offer you a deal. It is a bad deal. You will take it.', 'GEMINI: Check the oxygen. No, really. Go and check it now.', 'CANCER: Avoid airlocks, pyrates and anything marked "prototype".', 'LEO: Your lucky number is whatever the hull is on.', 'VIRGO: Somebody aboard has been using your mug. You know who.', 'LIBRA: A good day to repair things. A bad day to find out what broke them.', 'SCORPIO: Love is in the air. So is smoke. Deal with the smoke first.', 'SAGITTARIUS: You will come into some scrap, then lose it at a store.', 'CAPRICORN: The Fleet is closer than you think. It always is.', 'AQUARIUS: Today\'s fire is tomorrow\'s funny story. Probably.', 'PISCES: Do not press the button. You will press the button.'];
const GZ_ADS = ['FOR SALE: one escape pod, never used. Owner wishes it had been.', 'WANTED: pilot. Must have own helmet and low expectations.', 'LOST: one ship\'s cat, answers to nothing. Reward: you can keep it.', 'FOR SALE: 400 tins of space beans. Buyer collects. Please. Soon.', 'LESSONS: learn to haggle with a Sloog. First lesson free. Second lesson 900 scrap.', 'FOUND: left boot, sector 4. Foot still in it. Owner please call.', 'MISSING: the will to carry on. Last seen near the Rebuff Fleet.', 'HOUSE CLEARANCE: late captain\'s effects. Mostly hats.'];
const GZ_ADS_ADULT = ['LONELY HEARTS: Mantlis, 40, own claws, seeks someone who won\'t mind what happened to the last one.', 'LONELY HEARTS: bored hologram seeks solid company. Must be able to open doors.', 'MASSAGE: Pebblekin masseur. Firm. Very firm. Sign the form first.', 'FOR SALE: wedding dress, worn once, in a stag-do, by the groom. No questions.', 'LONELY HEARTS: divorced engineer seeks anyone who has never said "have you tried turning it off and on".', 'PERSONAL: to the Sloog I met at the store in sector 3. The rash has gone. Call me.', 'FOR SALE: one hot tub, slight smell of regret.', 'HANGOVER CURES: none of them work. We just want you to know you\'re not alone.'];
const GZ_FIX = ['CORRECTION: yesterday we called the Admiral "a visionary". We meant "a liability". We regret the error.', 'CORRECTION: the recipe on page 9 should have read "a pinch of salt", not "a pint of fuel". Our thoughts are with the families.', 'CORRECTION: the Rebuff Fleet is not "miles away". It is behind you.', 'CORRECTION: last week\'s obituary of Captain Doyle was early. He has asked us to say he feels fine, for now.'];
const GZ_QUOTE = ['A source close to the captain was heard to say: "{q}"', 'The captain\'s own log puts it best: "{q}"', 'Asked for comment, the captain wrote: "{q}"'];
function gzFacts(e){
  const log = e.log || [], F = { deaths:[], beaten:[], fled:[], joins:[], spent:0, dug:[], notes:[], fights:0, briefs:[] };
  for(const x of log){ const t = String(x.t || ''); let m;
    if(x.k==='death' && (m = /^(.+?) died: (.+?)\. Last words: "(.*)"$/.exec(t))) F.deaths.push({ name:m[1], why:m[2], words:m[3] });
    else if(x.k==='win' && (m = /(?:Destroyed|crew of|surrender of) the (.+?)\. /.exec(t))) F.beaten.push(m[1]);
    else if((m = /^Jumped away from the (.+?)(?: after \d+ seconds)?, /.exec(t)) || (m = /^Lost the (.+?) when they ran/.exec(t))) F.fled.push(m[1]);
    else if(x.k==='crew' && (m = /^(.+?) \(.*\) joined the crew/.exec(t))) F.joins.push(m[1]);
    else if((m = /^Spent (\d+) scrap/.exec(t))) F.spent += +m[1];
    else if((m = /^Dug up (.+?) at the Graveyard/.exec(t))) F.dug.push(m[1]);
    else if(x.k==='note') F.notes.push(t);
    if(/^Engaged the /.test(t)) F.fights++; if(/^All of the Admiral's orders/.test(t)) F.orders = true;
    if(x.k==='event' && t.includes(' → ')){ const [sit, rest] = t.split(' → '), did = String(rest || '').split(/ [–—] | \[/)[0].replace(/^"|"$/g, '').split(/(?<=[.!?]) /)[0].replace(/[."]+$/, '');
      if(sit.length > 20 && did.length > 3) F.briefs.push(`Sector ${x.s}: ${sit.replace(/^"|"$/g, '').slice(0, 120).replace(/\s+\S*$/, '')}… The captain's answer: "${did.slice(0, 80)}."`); } }
  return F;
}
function gzPlural(n, one, many){ return `${n} ${n===1 ? one : many || one + 's'}`; }
function gazetteFor(e){
  if(!e) return null; const r = gzRng((e.t || 1) ^ ((e.jumps || 0)*7919) ^ ((e.kills || 0)*104729)), pk = a => a[Math.floor(r()*a.length)], F = gzFacts(e);
  const ship = String(e.ship || 'ship').replace(/^the /i, ''), SHIP = ship.toUpperCase(), reason = String(e.reason || '').toLowerCase();
  const K = e.kills ? gzPlural(e.kills, 'enemy ship') : 'no enemy ships at all', crewN = Math.max(1, 3 + F.joins.length - F.deaths.length);
  const fill = s => String(s).replace(/\{SHIP\}/g, SHIP).replace(/\{ship\}/g, ship).replace(/\{S\}/g, e.sector || 1).replace(/\{J\}/g, e.jumps || 0).replace(/\{K\}/g, K).replace(/\{N\}/g, crewN);
  const head = fill(pk(e.win ? GZ_WIN : /hull/.test(reason) ? GZ_LOSS_HULL : /crew/.test(reason) ? GZ_LOSS_CREW : /fleet|caught|fuel/.test(reason) ? GZ_LOSS_FLEET : GZ_LOSS_ANY));
  const P = { name:'THE FEDORATION GAZETTE', motto:pk(GZ_MOTTO), price:pk(GZ_PRICE), date:new Date(e.t || Date.now()).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
    head, lead:fill(pk(e.win ? GZ_LEAD_WIN : GZ_LEAD_LOSS)), stories:[], obits:[], side:[] };
  const story = (H, T, x, n) => P.stories.push({ h:pk(H), t:fill(pk(T)).replace(/\{x\}/g, x || '').replace(/\{n\}/g, n || '') });
  if(F.dug.length) story(GZ_GRAVE, GZ_GRAVE_T, F.dug[0]);
  if(F.orders) story(GZ_ORDERS, GZ_ORDERS_T);
  if(F.beaten.length) story(GZ_KILLS, GZ_KILLS_T, pk(F.beaten));
  if(F.fled.length >= 2) story(GZ_FLED, GZ_FLED_T, pk(F.fled), gzPlural(F.fled.length, 'fight'));
  if(F.spent >= 40) story(GZ_SHOP, GZ_SHOP_T, '', F.spent);
  if(F.joins.length) story(GZ_JOIN, GZ_JOIN_T, F.joins.slice(0, 2).join(' and '));
  if(P.stories.length < 2) story(GZ_QUIET, GZ_QUIET_T);
  P.stories = P.stories.slice(0, 3);
  if(F.notes.length) P.quote = pk(GZ_QUOTE).replace('{q}', pk(F.notes).replace(/^"|"$/g, ''));
  P.obits = F.deaths.slice(0, 4).map(d => `${d.name}, ${d.why}. Last words: "${d.words}"`); P.moreObits = Math.max(0, F.deaths.length - 4);
  P.brief = F.briefs.sort(() => r() - .5).slice(0, 5);
  const ads = gzGrown() ? GZ_ADS.concat(GZ_ADS_ADULT) : GZ_ADS, a1 = pk(ads); let a2 = pk(ads), g = 0; while(a2===a1 && g++ < 8) a2 = pk(ads);
  P.side = [['WEATHER', pk(GZ_WEATHER)], ['YOUR STARS', pk(GZ_STARS)], ['SMALL ADS', a1], ['', a2], ['CORRECTIONS', pk(GZ_FIX)]];
  return P;
}
/* ---------------- the page ---------------- */
function openGazette(entry, back){ if(!entry) return; UI.toast = null; UI.gzEntry = entry; UI.gzBack = back || UI.screen; UI.screen = 'gazette'; if(typeof sfx==='function') sfx('map'); }
function drawGazette(){
  const P = gazetteFor(UI.gzEntry); if(!P){ UI.screen = UI.gzBack || 'title'; return; }
  const SER = 'Georgia, "Times New Roman", serif', INK = '#1d1a14', GREY = '#5a5346', x = 190, y = 36, w = 1220, h = 928;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.fillStyle = '#efe6d0'; ctx.fillRect(x, y, w, h); ctx.restore();
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,250,235,.5)'); g.addColorStop(1, 'rgba(190,170,130,.28)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const rule2 = yy => { ctx.fillStyle = INK; ctx.fillRect(x + 36, yy, 772, 1); };
  const rule = (yy, t) => { ctx.fillStyle = INK; ctx.fillRect(x + 36, yy, w - 72, t || 2); };
  T(P.name, x + w/2, y + 78, { s:62, f:SER, w:700, a:'center', c:INK, ls:3 }); rule(y + 100, 4); rule(y + 108, 1);
  T(P.date, x + 40, y + 132, { s:14, f:SER, c:GREY }); T(`"${P.motto}"`, x + w/2, y + 132, { s:14, f:SER, a:'center', c:GREY }); T(P.price, x + w - 40, y + 132, { s:14, f:SER, a:'right', c:GREY }); rule(y + 144, 1);
  // the headline shrinks to fit two lines
  let hs = 54, hl; for(;;){ hl = lines(P.head, w - 100, `700 ${hs}px ${SER}`); if(hl.length <= 2 || hs <= 34) break; hs -= 4; }
  hl.slice(0, 3).forEach((l, i) => T(l, x + w/2, y + 204 + i*(hs + 6), { s:hs, f:SER, w:700, a:'center', c:INK })); let yy = y + 204 + (Math.min(3, hl.length) - 1)*(hs + 6) + 36;
  rule(yy - 12, 1);
  const cw = 760, sx = x + 40 + cw + 40, sw = w - 80 - cw - 40;
  const top = yy;
  yy += para(P.lead, x + 40, yy + 16, cw, { s:19, lh:28, f:SER, c:INK }) + 30;
  if(P.quote){ yy += para(P.quote, x + 70, yy + 4, cw - 60, { s:17, lh:25, f:SER, c:GREY, max:3 }) + 24; }
  const n = P.stories.length, colW = (cw - (n - 1)*28)/n; let maxH = 0;
  P.stories.forEach((s, i) => { const cx = x + 40 + i*(colW + 28);
    const hh = para(s.h, cx, yy + 12, colW, { s:19, lh:23, f:SER, w:700, c:INK, max:3 }); const th = para(s.t, cx, yy + 20 + hh, colW, { s:15, lh:22, f:SER, c:INK, max:9 }); maxH = Math.max(maxH, hh + th + 20); });
  for(let i = 1; i < n; i++){ ctx.fillStyle = 'rgba(29,26,20,.35)'; ctx.fillRect(x + 40 + i*(colW + 28) - 15, yy - 6, 1, maxH); }
  yy += maxH + 22;
  if(P.obits.length && yy < y + h - 120){ rule2(yy - 6); T('OBITUARIES', x + 40, yy + 22, { s:16, f:SER, w:700, c:INK, ls:2 }); yy += 48;
    for(const o of P.obits){ if(yy > y + h - 60) break; yy += para(o, x + 40, yy, cw, { s:14, lh:20, f:SER, c:INK, max:2 }) + 8; }
    if(P.moreObits && yy < y + h - 40){ T(`And ${P.moreObits} more. See inside.`, x + 40, yy + 2, { s:13, f:SER, c:GREY }); yy += 22; } yy += 12; }
  if(P.brief.length && yy < y + h - 110){ rule2(yy - 6); T('IN BRIEF', x + 40, yy + 22, { s:16, f:SER, w:700, c:INK, ls:2 }); yy += 48;
    for(const o of P.brief){ if(yy > y + h - 56) break; yy += para(o, x + 40, yy, cw, { s:14, lh:20, f:SER, c:INK, max:2 }) + 8; } }
  // the side column
  ctx.fillStyle = 'rgba(29,26,20,.35)'; ctx.fillRect(sx - 20, top, 1, y + h - 40 - top); let sy = top + 22;
  for(const [hd, tx] of P.side){ if(hd){ T(hd, sx, sy, { s:15, f:SER, w:700, c:INK, ls:2 }); ctx.fillStyle = INK; ctx.fillRect(sx, sy + 8, sw, 1); sy += 30; }
    sy += para(tx, sx, sy, sw, { s:14, lh:21, f:SER, c:INK, max:7 }) + (hd ? 22 : 26); }
  btn(1432, 46, 130, 50, 'Close', () => { UI.screen = UI.gzBack || 'title'; }, { s:17 });
}
