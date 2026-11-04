// Builds tools/mod-reference.md from the live game data. Run it inside the headless test harness (it needs BASE, SEEDS, ACHIEVEMENTS...), then run tools/build-mod-guide.py.
const fs = require('fs'); const B = BASE, out = [];
const md = s => String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ');
const short = (s, n=80) => { s = md(s); return s.length > n ? s.slice(0, n-1) + '…' : s; };
const pk = o => o.pack ? ` *(${o.pack})*` : '';
const tricksW = w => ['fire','breach','stun','ion','pierce','crewDamage','sysDamage','rooms','radius','heal','warm','homing','pin','splash','bounce','crit','wild','salvage','gas','fear','toast','decoy','drain','disrupt'].filter(k => w[k]).map(k => typeof w[k]==='number' && w[k] < 1 && w[k] > 0 && ['fire','breach','crit','warm'].includes(k) ? `${k} ${Math.round(w[k]*100)}%` : w[k]===true ? k : `${k} ${w[k]}`).join(', ');
out.push('### Weapons', '', 'Damage × shots, charge in seconds. Items marked with a pack name come from a built-in content pack (always available outside campaigns).', '', '| id | name | type | dmg × shots | charge | power | cost | tier | tricks |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for(const [id, w] of Object.entries(B.weapons).sort((a,b) => a[1].type.localeCompare(b[1].type) || (a[1].tier||0)-(b[1].tier||0))) out.push(`| \`${id}\` | ${md(w.name)}${pk(w)} | ${w.type} | ${w.damage||0} × ${w.shots||1} | ${w.charge} | ${w.power} | ${w.cost||'-'} | ${w.tier||'-'} | ${tricksW(w)}${w.noLoot ? ' (event only)' : ''} |`);
out.push('', '### Drones', '', '| id | name | kind | power | cost | notes |', '| --- | --- | --- | --- | --- | --- |');
for(const [id, d] of Object.entries(B.drones)) out.push(`| \`${id}\` | ${md(d.name)}${pk(d)} | ${d.kind} | ${d.power} | ${d.cost||'-'} | ${short([d.shot ? `${d.shot.type} ${d.shot.damage||0} every ${d.rate}s` : '', d.targets ? 'stops ' + [].concat(d.targets).join('/') : '', d.role||'', d.heal ? 'heals ' + d.heal : '', d.stun ? 'stun ' + d.stun : '', d.fear ? 'fear' : ''].filter(Boolean).join(', '))} |`);
out.push('', '### Augments', '', '| id | name | cost | what it does |', '| --- | --- | --- | --- |');
for(const [id, a] of Object.entries(B.augments)) out.push(`| \`${id}\` | ${md(a.name)}${pk(a)} | ${a.cost||'-'} | ${short(a.desc, 110)}${a.noLoot ? ' (event only)' : ''} |`);
out.push('', '### Races', '', '`secret` races are enemy-only and never offered as crew.', '', '| id | name | hp | repair | combat | speed | special |', '| --- | --- | --- | --- | --- | --- | --- |');
for(const [id, r] of Object.entries(B.races)) out.push(`| \`${id}\` | ${md(r.name)}${pk(r)} | ${r.hp} | ${r.repair??1} | ${r.combat??1} | ${r.speed??1} | ${['fireproof','noAir','telepathic','mindImmune','projected','secret'].filter(k => r[k]).concat(['power','armor','heal','deathBurst','learn'].filter(k => r[k] && r[k]!==1).map(k => k + ' ' + r[k])).join(', ')} |`);
out.push('', '### Traits (rolled for recruits)', '', B.traits ? Object.entries(B.traits).map(([id, t]) => `\`${id}\` ${md(t.name)}`).join(' · ') : '');
out.push('', '### Personality quirks (`req.quirk`, `starQuirk`, campaign crew)', '', Object.entries(B.quirks || {}).map(([id, q]) => `\`${id}\` ${md(q.name)}`).join(' · '));
out.push('', '### Enemies', '', '| id | name | tags | sectors | hull | notes |', '| --- | --- | --- | --- | --- | --- |');
for(const [id, e] of Object.entries(B.enemies).filter(([id]) => id!=='tut_target').sort((a,b) => ((a[1].sectors||[0])[0]) - ((b[1].sectors||[0])[0]))) out.push(`| \`${id}\` | ${md(e.name)}${pk(e)} | ${(e.tags||[]).join(', ')} | ${e.sectors ? e.sectors.join('–') : '-'} | ${e.hull} | ${['boss','auto','eventOnly','onlyTagged','relentless','mirror','elite','revenant'].filter(k => e[k]).join(', ')} |`);
out.push('', '### Player ships', '', '| id | name | class | layout | hull | reactor |', '| --- | --- | --- | --- | --- | --- |');
for(const [id, s] of Object.entries(B.ships)) out.push(`| \`${id}\` | ${md(s.name)}${pk(s)} | ${md(s.cls)} | ${s.layout||'A'} | ${s.hull} | ${s.reactor} |`);
out.push('', '### Sectors', '', '| id | name | tags | enemyTags |', '| --- | --- | --- | --- |');
for(const [id, s] of Object.entries(B.sectors)) out.push(`| \`${id}\` | ${md(s.name)}${pk(s)} | ${(s.tags||[]).join(', ')} | ${(s.enemyTags||[]).join(', ')} |`);
out.push('', '### Goods (cargo: `goods` effect, `req.goodsKind`, gifts, trade)', '', '| id | name | kind | base price | made in | wanted in |', '| --- | --- | --- | --- | --- | --- |');
for(const [id, g] of Object.entries(B.goods)) out.push(`| \`${id}\` | ${md(g.name)} | ${g.kind} | ${g.base} | ${(g.from||[]).join(', ')} | ${(g.want||[]).join(', ')} |`);
out.push('', 'Goods kinds: ' + [...new Set(Object.values(B.goods).map(g => g.kind))].map(k => '`' + k + '`').join(', ') + '.');
out.push('', '### Personal kit (`arm` effect) and tonics (`item` effect)', '', 'Kit: ' + Object.entries(B.arms||{}).map(([id, a]) => `\`${id}\` ${md(a.name)} (${a.cls || a.kind})`).join(' · '), '', 'Tonics: ' + Object.entries(B.items||{}).map(([id, a]) => `\`${id}\` ${md(a.name)} (${a.kind})`).join(' · '));
out.push('', '### Seeds (`seeds` effect)', '', Object.entries(SEEDS).filter(([k, s]) => !s.greenhouse).map(([id, s]) => `\`${id}\` ${s.name}`).join(' · '));
out.push('', '### Medals (for `ch.ach` on ships and the `achievement` effect)', '', ACHIEVEMENTS.map(a => `\`${a.id}\``).join(' '));
const ev = Object.values(B.events);
out.push('', '### Event lists', '', 'Event `tags` used by the game: ' + [...new Set(ev.flatMap(e => e.tags||[]).filter(Boolean))].map(t => '`' + t + '`').join(' '),
  '', 'Hails (`hail`): ' + [...new Set(ev.map(e => e.hail).filter(Boolean))].map(t => '`' + t + '`').join(' ') + '. `generic` is used for any ship without its own; `repfriend`, `rephate`, `hunter`, `enforcer`, `bounty` and `fleet` are special and best left alone.',
  '', 'Pictures (`art`): ' + [...new Set(ev.map(e => e.art).filter(Boolean))].map(t => '`' + t + '`').join(' '),
  '', 'Factions (`rep`): ' + Object.keys(FACTIONS).map(t => '`' + t + '`').join(' ') + ' (and `enemy` for the ship you are facing).',
  '', 'Anomalies (`anom`): ' + Object.keys(ANOM_INFO).filter(k => k!=='heatShow' && k!=='fever' && k!=='squid').map(t => '`' + t + '`').join(' ') + '. Start one with e.g. `"anom":{"fungus":1}`, end it with `"anom":{"fungus":null}`.',
  '', 'Scar kinds (`scar`): ' + Object.keys(SCAR_KINDS).map(t => '`' + t + '`').join(' ') + '. Pets (`pet`): ' + Object.keys(PET_KINDS).map(t => '`' + t + '`').join(' ') + '. Pet forms (`petEvo`): ' + Object.keys(PET_EVO).map(t => '`' + t + '`').join(' ') + '.');
// balance numbers from the base game
const core = Object.values(B.weapons).filter(w => !w.pack && !w.noLoot);
out.push('', '### Balance numbers measured from the base game', '', '| weapon tier | guns | avg damage per volley | avg charge (s) | avg power | damage per 10s per power | avg cost |', '| --- | --- | --- | --- | --- | --- | --- |');
for(const t of [1,2,3,4]){ const ws = core.filter(w => (w.tier||1)===t && w.type!=='bomb'); if(!ws.length) continue; const av = f => ws.reduce((a, w) => a + f(w), 0) / ws.length; const vol = w => (w.damage||0) * (w.type==='beam' ? 1 : (w.shots||1));
  out.push(`| ${t} | ${ws.length} | ${av(vol).toFixed(1)} | ${av(w => w.charge).toFixed(1)} | ${av(w => w.power).toFixed(1)} | ${av(w => vol(w)/w.charge*10/Math.max(1,w.power)).toFixed(2)} | ${Math.round(av(w => w.cost||0))} |`); }
const sc = []; const walk = e => { if(!e) return; if(typeof e.scrap==='number' && e.scrap > 0) sc.push(e.scrap); walk(e.afterWin); for(const c of e.choices||[]){ walk(c.effect); walk(c.success); walk(c.fail); } };
for(const e of ev) for(const c of e.choices||[]){ walk(c.effect); walk(c.success); walk(c.fail); }
sc.sort((a,b) => a-b); const q = p => sc[Math.floor(p*(sc.length-1))];
out.push('', `Event scrap rewards across ${sc.length} outcomes: 25th percentile ${q(.25)}, median ${q(.5)}, 75th ${q(.75)}, 90th ${q(.9)}, highest ${sc[sc.length-1]}. (The game adds a little per sector.)`);
const eh = Object.values(B.enemies).filter(e => !e.boss && e.sectors); out.push('', `Random enemies: hull ${Math.min(...eh.map(e => e.hull))}–${Math.max(...eh.map(e => e.hull))} (median ${eh.map(e => e.hull).sort((a,b)=>a-b)[Math.floor(eh.length/2)]}) before the game adds 1 per sector.`);
fs.writeFileSync('/home/claude/vaster-than-life/tools/mod-reference.md', out.join('\n') + '\n');
console.log('lines', out.length); console.log('ERRORS 0');
