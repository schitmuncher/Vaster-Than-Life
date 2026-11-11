'use strict';
/* =========================================================================
   Pixel Studio: draw your own crew. Pixel art made here (or imported from a
   picture, or pasted back from an AI) becomes a "look" any crew member can
   wear, in the ship, on crew cards, in the hangar and in VR.
   Art lives in PROFILE.pixels: { id, name, w, h, pal:['#rrggbb'], rows:['..01..'], v }.
   Rows use '.' for see-through and PX_CH for palette entries.
   ========================================================================= */
const PX_MAX = 60, PX_MAXSIDE = 64, PX_SIZES = [[32, 48], [32, 32], [24, 32], [16, 24], [48, 64]];
const PX_CH = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PX_PAL0 = ['#14101e', '#3b2c4a', '#6b5a7a', '#a99cb8', '#f2eee8', '#5e3b22', '#a8693d', '#e8b893', '#f3d2b3', '#b8432a', '#e9623b', '#f4a742',
  '#ffe27a', '#4f8a3a', '#9fdc7a', '#2f7fa8', '#6fc3ff', '#3a3f9c', '#7a4bb0', '#c94f8a', '#ff9db0', '#30364f', '#59607e', '#8e95b0'];
const PX_EDGE = 'rgba(8,10,20,.0)';
function pxLib(){ if(!Array.isArray(PROFILE.pixels)) PROFILE.pixels = []; return PROFILE.pixels; }
function pxGet(id){ return id ? pxLib().find(p => p && p.id===id) || null : null; }
function pxId(){ return 'px' + Date.now().toString(36) + Math.floor(Math.random()*1296).toString(36); }
function pxHex(s){ s = String(s || '').trim().toLowerCase(); if(/^#?[0-9a-f]{3}$/.test(s)){ s = s.replace('#', ''); return '#' + s[0] + s[0] + s[1] + s[1] + s[2] + s[2]; }
  const m = /^#?([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(s); if(m) return '#' + m[1];
  const r = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(s); if(r) return '#' + [r[1], r[2], r[3]].map(v => clamp(+v, 0, 255).toString(16).padStart(2, '0')).join('');
  return null; }
function pxRGB(h){ const n = parseInt(String(h).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function pxToHex(r, g, b){ return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
/* encode/decode between stored rows and an editable grid (-1 = see-through) */
function pxDecode(a){ const g = new Int16Array(a.w*a.h).fill(-1);
  for(let y = 0; y < a.h; y++){ const row = String((a.rows || [])[y] || ''); for(let x = 0; x < a.w; x++){ const i = PX_CH.indexOf(row[x]); g[y*a.w + x] = i >= 0 && i < a.pal.length ? i : -1; } } return g; }
function pxEncode(g, w, h){ const rows = []; for(let y = 0; y < h; y++){ let s = ''; for(let x = 0; x < w; x++){ const v = g[y*w + x]; s += v < 0 ? '.' : PX_CH[v]; } rows.push(s); } return rows; }
/* a picture of the art at 1:1, cached by id and version */
const PX_IMG = {};
function pxCanvas(a){ const key = a.id + '|' + (a.v || 0); if(PX_IMG[key]) return PX_IMG[key];
  const c = mkCanvas(a.w, a.h), g = c.getContext('2d'), im = g.createImageData(a.w, a.h), grid = pxDecode(a), rgb = a.pal.map(pxRGB);
  for(let i = 0; i < grid.length; i++){ const v = grid[i]; if(v < 0) continue; const [r, gg, b] = rgb[v]; im.data[i*4] = r; im.data[i*4 + 1] = gg; im.data[i*4 + 2] = b; im.data[i*4 + 3] = 255; }
  g.putImageData(im, 0, 0); c.bbox = pxBBox(grid, a.w, a.h); return PX_IMG[key] = c; }
function pxBBox(g, w, h){ let x0 = w, y0 = h, x1 = -1, y1 = -1; for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) if(g[y*w + x] >= 0){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
  return x1 < 0 ? { x:0, y:0, w:w, h:h, empty:true } : { x:x0, y:y0, w:x1 - x0 + 1, h:y1 - y0 + 1 }; }
function pxSaveArt(a){ a.v = (a.v || 0) + 1; for(const k in PX_IMG) if(k.startsWith(a.id + '|')) delete PX_IMG[k]; for(const k in PX_SPR) if(k.startsWith(a.id + '|')) delete PX_SPR[k]; if(typeof saveProfile==='function') saveProfile(); }

/* ---------------- as a crew sprite ---------------- */
const PX_SPR = {};
function pxSprite(a, pose, hostile){
  const key = a.id + '|' + (a.v || 0) + '|' + pose + '|' + (hostile ? 1 : 0); if(PX_SPR[key]) return PX_SPR[key];
  const src = pxCanvas(a), bb = src.bbox, S = SPR_S, cvs = mkCanvas(SPR_W*S, SPR_H*S), g = cvs.getContext('2d');
  const boxW = (SPR_W - 6)*S, boxH = (SPR_H - 5)*S, k = Math.min(boxW/bb.w, boxH/bb.h), dw = bb.w*k, dh = bb.h*k;
  g.imageSmoothingEnabled = false; g.translate((SPR_W/2 - 2)*S, (SPR_H - 3)*S);
  const walk = pose==='walk0' ? 1 : pose==='walk1' ? -1 : 0, fight = pose==='fight0' ? 1 : pose==='fight1' ? -1 : 0;
  if(walk===1) g.translate(0, -1.6*S); if(walk===-1) g.scale(1.03, .97);
  if(pose==='work') g.rotate(.09); if(fight){ g.translate(fight*1.6*S, 0); g.rotate(fight*.06); }
  g.drawImage(src, bb.x, bb.y, bb.w, bb.h, -dw/2, -dh, dw, dh);
  if(hostile){ g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,40,70,.32)'; g.fillRect(-SPR_W*S, -SPR_H*S, SPR_W*S*2, SPR_H*S*2); }
  return PX_SPR[key] = cvs;
}
function pxPortrait(x, y, rad, a, hostile){
  const src = pxCanvas(a), bb = src.bbox;
  // tall art shows head and shoulders; short or square art shows all of it
  const tall = bb.h > bb.w*1.25, ch = tall ? Math.min(bb.h, Math.round(bb.w*1.05)) : bb.h, k = Math.min(rad*1.7/bb.w, rad*1.7/ch);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.clip();
  const bg = ctx.createRadialGradient(x, y - rad*.3, 1, x, y, rad); bg.addColorStop(0, '#2a3a66'); bg.addColorStop(1, '#0c1226'); ctx.fillStyle = bg; ctx.fillRect(x - rad, y - rad, rad*2, rad*2);
  ctx.imageSmoothingEnabled = false; const dw = bb.w*k, dh = ch*k, top = tall ? y - rad*.78 : y - dh/2;
  ctx.drawImage(src, bb.x, bb.y, bb.w, ch, x - dw/2, top, dw, dh); ctx.imageSmoothingEnabled = true;
  if(hostile){ ctx.fillStyle = 'rgba(255,40,70,.25)'; ctx.fillRect(x - rad, y - rad, rad*2, rad*2); }
  ctx.restore(); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.strokeStyle = hostile ? C.hostile : hexA(C.amber, .8); ctx.lineWidth = 2; ctx.stroke();
}
function pxThumb(a, x, y, w, h){ const src = pxCanvas(a), bb = src.bbox, k = Math.min(w/bb.w, h/bb.h);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(src, bb.x, bb.y, bb.w, bb.h, x + (w - bb.w*k)/2, y + h - bb.h*k, bb.w*k, bb.h*k); ctx.imageSmoothingEnabled = true; }
(function(){
  const s0 = spriteFor; spriteFor = function(c, pose, hostile){ const a = c && c.skin && pxGet(c.skin); if(a){ try{ return pxSprite(a, pose || 'idle', hostile); }catch(e){} } return s0(c, pose, hostile); };
  const p0 = drawPortrait; drawPortrait = function(x, y, rad, c, hostile){ const a = c && c.skin && pxGet(c.skin); if(a){ try{ return pxPortrait(x, y, rad, a, hostile); }catch(e){} } return p0(x, y, rad, c, hostile); };
})();

/* ---------------- making art from a picture ---------------- */
/* shrink in halves so the small version is an average, not a sample */
function pxShrink(src, sw, sh, tw, th){ let cur = src, cw = sw, chh = sh;
  while(cw/2 >= tw && chh/2 >= th){ const n = mkCanvas(Math.ceil(cw/2), Math.ceil(chh/2)), g = n.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cur, 0, 0, cw, chh, 0, 0, n.width, n.height); cur = n; cw = n.width; chh = n.height; }
  const out = mkCanvas(tw, th), g = out.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cur, 0, 0, cw, chh, 0, 0, tw, th); return out; }
/* take away a plain background: the colour most of the border shares, flood-filled in from the edges */
function pxCutBackground(d, w, h, tol){
  const at = (x, y) => (y*w + x)*4, border = [];
  for(let x = 0; x < w; x++){ border.push(at(x, 0), at(x, h - 1)); } for(let y = 1; y < h - 1; y++){ border.push(at(0, y), at(w - 1, y)); }
  if(border.filter(i => d[i + 3] < 128).length > border.length*.3) return false;   // already see-through
  const buckets = {}; for(const i of border){ const k = (d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4); (buckets[k] = buckets[k] || []).push(i); }
  const best = Object.values(buckets).sort((a, b) => b.length - a.length)[0]; if(!best || best.length < border.length*.45) return false;
  const ref = [0, 1, 2].map(c => best.reduce((s, i) => s + d[i + c], 0)/best.length), near = i => Math.abs(d[i] - ref[0]) + Math.abs(d[i + 1] - ref[1]) + Math.abs(d[i + 2] - ref[2]) < tol;
  const seen = new Uint8Array(w*h), stack = [];
  for(const i of border) if(near(i)){ const p = i/4; if(!seen[p]){ seen[p] = 1; stack.push(p); } }
  while(stack.length){ const p = stack.pop(), x = p % w, y = (p - x)/w; d[p*4 + 3] = 0;
    for(const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]){ if(nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const q = ny*w + nx; if(!seen[q] && near(q*4)){ seen[q] = 1; stack.push(q); } } }
  return true;
}
/* k-means colour reduction, seeded by picking colours far apart */
function pxQuantise(cols, k){
  const uniq = [...new Set(cols.map(c => c.join(',')))].map(s => s.split(',').map(Number)); if(uniq.length <= k) return uniq;
  const dist = (a, b) => (a[0] - b[0])**2*.3 + (a[1] - b[1])**2*.59 + (a[2] - b[2])**2*.11;
  const C2 = [uniq.reduce((a, b) => (a[0] + a[1] + a[2] < b[0] + b[1] + b[2] ? a : b))];
  while(C2.length < k){ let bi = 0, bd = -1; uniq.forEach((u, i) => { const dd = Math.min(...C2.map(c => dist(u, c))); if(dd > bd){ bd = dd; bi = i; } }); C2.push(uniq[bi].slice()); }
  for(let it = 0; it < 10; it++){ const sum = C2.map(() => [0, 0, 0, 0]);
    for(const c of cols){ let bi = 0, bd = 1e12; for(let j = 0; j < C2.length; j++){ const dd = dist(c, C2[j]); if(dd < bd){ bd = dd; bi = j; } } const s = sum[bi]; s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; s[3]++; }
    sum.forEach((s, j) => { if(s[3]) C2[j] = [s[0]/s[3], s[1]/s[3], s[2]/s[3]]; }); }
  return C2.map(c => c.map(Math.round));
}
function pxFromImage(img, w, h, o = {}){
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k0 = Math.min(1, 256/Math.max(iw, ih));
  const mid = pxShrink(img, iw, ih, Math.max(1, Math.round(iw*k0)), Math.max(1, Math.round(ih*k0))), mw = mid.width, mh = mid.height, mg = mid.getContext('2d'), md = mg.getImageData(0, 0, mw, mh);
  if(o.cut !== false) pxCutBackground(md.data, mw, mh, 70); mg.putImageData(md, 0, 0);
  // crop to what is left, then fit it into the canvas, feet on the floor
  let x0 = mw, y0 = mh, x1 = -1, y1 = -1; for(let y = 0; y < mh; y++) for(let x = 0; x < mw; x++) if(md.data[(y*mw + x)*4 + 3] > 100){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
  if(x1 < 0){ x0 = 0; y0 = 0; x1 = mw - 1; y1 = mh - 1; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = Math.min((w - (o.outline !== false ? 2 : 0))/bw, (h - (o.outline !== false ? 1 : 0))/bh), tw = Math.max(1, Math.round(bw*k)), th = Math.max(1, Math.round(bh*k));
  const crop = mkCanvas(bw, bh); crop.getContext('2d').drawImage(mid, x0, y0, bw, bh, 0, 0, bw, bh);
  const small = pxShrink(crop, bw, bh, tw, th), sd = small.getContext('2d').getImageData(0, 0, tw, th).data, ox = Math.floor((w - tw)/2), oy = h - th;
  const cols = [], spots = []; for(let y = 0; y < th; y++) for(let x = 0; x < tw; x++){ const i = (y*tw + x)*4; if(sd[i + 3] < 128) continue; cols.push([sd[i], sd[i + 1], sd[i + 2]]); spots.push((oy + y)*w + ox + x); }
  const pal = pxQuantise(cols, clamp(o.colours || 14, 2, 32)), grid = new Int16Array(w*h).fill(-1);
  const near = c => { let bi = 0, bd = 1e12; pal.forEach((p, j) => { const dd = (p[0] - c[0])**2*.3 + (p[1] - c[1])**2*.59 + (p[2] - c[2])**2*.11; if(dd < bd){ bd = dd; bi = j; } }); return bi; };
  cols.forEach((c, i) => { grid[spots[i]] = near(c); });
  const art = { id:pxId(), name:o.name || 'Imported', w, h, pal:pal.map(c => pxToHex(...c)), rows:[] };
  if(o.outline !== false) pxOutline(grid, w, h, art.pal);
  pxTidyPal(art, grid); return art;
}
/* drop unused colours, keeping the grid pointing at the right ones */
function pxTidyPal(art, grid){ const used = [...new Set([...grid].filter(v => v >= 0))].sort((a, b) => a - b), map = {}; used.forEach((v, i) => { map[v] = i; });
  art.pal = used.map(v => art.pal[v]); for(let i = 0; i < grid.length; i++) if(grid[i] >= 0) grid[i] = map[grid[i]]; art.rows = pxEncode(grid, art.w, art.h); return art; }
/* a one-pixel dark edge round everything, in the darkest colour (added if there isn't a dark one) */
function pxOutline(grid, w, h, pal){
  let dark = -1, dl = 1e9; pal.forEach((c, i) => { const [r, g, b] = pxRGB(c), l = r*.3 + g*.59 + b*.11; if(l < dl){ dl = l; dark = i; } });
  if(dl > 60){ if(pal.length >= PX_CH.length) return false; pal.push('#14101e'); dark = pal.length - 1; }
  const add = []; for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ if(grid[y*w + x] >= 0) continue;
    if([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < w && ny < h && grid[ny*w + nx] >= 0 && grid[ny*w + nx] !== dark; })) add.push(y*w + x); }
  add.forEach(i => { grid[i] = dark; }); return add.length > 0;
}
/* someone's ordinary drawn look, as pixel art to start from */
function pxFromCrew(c, w, h){ const cc = Object.assign({}, c, { skin:null }); ensureLook(cc); const img = spriteFor(cc, 'idle', false);
  const art = pxFromImage(img, w, h, { cut:false, outline:false, colours:16, name:(c.name || 'Crew') + ' (copy)' }); return art; }

/* ---------------- pasting art back from an AI (or from a friend) ---------------- */
function pxParse(text){
  let t = String(text || '').replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim(); const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if(a < 0 || b <= a) return { err:'No code found. Paste the whole reply: it should start with { and end with }.' };
  t = t.slice(a, b + 1); let o = null;
  for(const fix of [s => s, s => s.replace(/,\s*([\]}])/g, '$1'), s => s.replace(/,\s*([\]}])/g, '$1').replace(/'/g, '"'), s => s.replace(/\/\/[^\n]*/g, '').replace(/,\s*([\]}])/g, '$1')]){ try{ o = JSON.parse(fix(t)); break; }catch(e){} }
  if(!o || typeof o!=='object') return { err:'That code didn\'t read properly. Ask the AI to reply with only the JSON, then paste it again.' };
  let pal = o.palette || o.pal || o.colors || o.colours; if(pal && !Array.isArray(pal) && typeof pal==='object'){ const ks = Object.keys(pal); const arr = []; ks.forEach(k => { const i = PX_CH.indexOf(k.length===1 ? k : ''); arr[i >= 0 ? i : arr.length] = pal[k]; }); pal = arr; }
  if(!Array.isArray(pal)) pal = [];
  pal = pal.slice(0, PX_CH.length).map(c => pxHex(typeof c==='object' && c ? c.hex || c.color || c.colour : c) || '#ff00ff');
  let rows = o.rows || o.pixels || o.data || o.grid || o.image;
  if(typeof rows==='string') rows = rows.split(/\r?\n|\|/).map(s => s.trim()).filter(Boolean);
  if(!Array.isArray(rows) || !rows.length) return { err:'The code has no rows of pixels.' };
  if(!pal.length && !(Array.isArray(rows) && rows.some(r => Array.isArray(r)))) return { err:'The code has no palette (the list of colours).' };
  const caseless = pal.length <= 36, fixes = { uneven:0, unknown:0 };
  const cell = ch => { if(ch==null || ch==='.' || ch===' ' || ch==='_' || ch==='-' || ch===-1 || ch===null) return -1;
    if(typeof ch==='number') return ch >= 0 && ch < pal.length ? ch : -1;
    let i = PX_CH.indexOf(caseless ? String(ch).toLowerCase() : String(ch)); if(i < 0 || i >= pal.length){ fixes.unknown++; return -1; } return i; };
  rows = rows.slice(0, PX_MAXSIDE).map(r => Array.isArray(r) ? r.map(v => typeof v==='string' && v.length > 1 ? (pxHex(v) ? (pal.indexOf(pxHex(v)) >= 0 ? pal.indexOf(pxHex(v)) : (pal.push(pxHex(v)), pal.length - 1)) : -1) : v) : String(r).replace(/\s+/g, '').split(''));
  const w0 = +o.w || +o.width || 0, wMax = Math.max(...rows.map(r => r.length)), w = clamp(w0 && Math.abs(w0 - wMax) <= 3 ? w0 : wMax, 1, PX_MAXSIDE), h = clamp(rows.length, 1, PX_MAXSIDE);
  const grid = new Int16Array(w*h).fill(-1);
  rows.forEach((r, y) => { if(r.length !== w) fixes.uneven++; for(let x = 0; x < w; x++) grid[y*w + x] = cell(r[x]); });
  const art = { id:pxId(), name:String(o.name || 'From AI').replace(/[^\w '&().,!?-]/g, '').trim().slice(0, 24) || 'From AI', w, h, pal, rows:[] };
  if(!art.pal.length) return { err:'The code has no palette (the list of colours).' };
  pxTidyPal(art, grid); if(pxBBox(grid, w, h).empty) return { err:'That code is all see-through. Nothing to draw.' };
  return { art, fixes };
}
function pxShareCode(a){ return JSON.stringify({ vtl:'pixel', name:a.name, w:a.w, h:a.h, palette:a.pal, rows:a.rows }); }
function pxAIPrompt(w, h){ return [
  `I'm making a character for my browser game, Vaster Than Life (a spaceship crew game). I've attached a picture. Turn its main subject into a small pixel-art crew member.`,
  ``, `Rules:`,
  `- The canvas is exactly ${w} pixels wide and ${h} pixels tall.`,
  `- Draw the whole body, standing, facing right. Feet on the bottom row, centred left to right.`,
  `- See-through background. A 1-pixel dark outline round the figure.`,
  `- At most 16 colours. Keep it readable when small: a big head, simple shapes, strong contrast.`,
  `- Keep what makes the picture recognisable: hair, colours, clothes, glasses, markings and so on.`,
  ``, `Reply with ONLY this JSON and nothing else:`,
  `{"vtl":"pixel","name":"<a short name>","w":${w},"h":${h},"palette":["#RRGGBB", ...],"rows":[ ...${h} strings... ]}`,
  ``, `In "rows", each string is exactly ${w} characters, one per pixel, left to right, top row first. Use "." for see-through and "0" to "9" then "a" to "f" for palette colours 0 to 15. Before you reply, check there are exactly ${h} rows and every row has exactly ${w} characters.`].join('\n'); }
function pxCopy(text, ok){
  const done = () => { if(typeof toast==='function') toast(ok); }, fallback = () => { try{ const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const r = document.execCommand('copy'); ta.remove(); if(r){ done(); return; } }catch(e){}
    if(typeof toast==='function') toast('Your browser blocked copying. The prompt is in the wiki: Help → Pixel Studio.'); };
  try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback(); }catch(e){ fallback(); }
}
function pxPaste(){
  const use = t => { const r = pxParse(t); if(r.err){ toast(r.err); return; } pxAdd(r.art); pxOpenArt(r.art.id);
    toast(`Imported "${r.art.name}", ${r.art.w}×${r.art.h}${r.fixes.uneven ? `. Tidied ${r.fixes.uneven} uneven row${r.fixes.uneven===1 ? '' : 's'}` : ''}.`); };
  const ask = () => openKeyboard({ title:'Paste the AI\'s reply (or a friend\'s code)', value:'', max:60000, min:2, ok:'Import', hint:'Ctrl+V, or the Paste key', onOk:use });
  try{ if(navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { if(t && t.includes('{')) use(t); else ask(); }, ask); else ask(); }catch(e){ ask(); }
}
function pxPickPicture(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if(!f) return; const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => { try{ const E = UI.px, w = E ? E.w : 32, h = E ? E.h : 48, art = pxFromImage(img, w, h, { name:String(f.name || 'Picture').replace(/\.[a-z0-9]+$/i, '').slice(0, 24), colours:UI.pxCols || 14 });
        pxAdd(art); pxOpenArt(art.id); toast(`Made "${art.name}" from your picture. Tidy it up with the pen.`); }catch(e){ toast('That picture would not load.'); } URL.revokeObjectURL(url); };
    img.onerror = () => { toast('That file is not a picture this browser can read.'); URL.revokeObjectURL(url); }; img.src = url; };
  inp.click();
}

/* ---------------- the library ---------------- */
function pxAdd(art){ const L = pxLib(); if(L.length >= PX_MAX){ toast(`The studio holds ${PX_MAX} pieces. Delete one first.`); return false; } art.v = 1; L.unshift(art); if(typeof saveProfile==='function') saveProfile(); return true; }
function pxNew(w, h){ const a = { id:pxId(), name:'New crew ' + (pxLib().length + 1), w, h, pal:PX_PAL0.slice(), rows:pxEncode(new Int16Array(w*h).fill(-1), w, h) }; if(pxAdd(a)) pxOpenArt(a.id); }
function pxOpenArt(id){ const a = pxGet(id); if(!a) return; UI.px = { id, w:a.w, h:a.h, grid:pxDecode(a), undo:[], redo:[], col:Math.min(1, a.pal.length - 1), tool:'pen', mirror:false, del:false }; }
function pxCommit(){ const E = UI.px, a = E && pxGet(E.id); if(!a) return; a.rows = pxEncode(E.grid, a.w, a.h); pxSaveArt(a); }

/* ---------------- the studio ---------------- */
function openPixelStudio(back, target){
  UI.pxBack = back || UI.screen; UI.pxTarget = target || null; UI.pxPick = null; UI.screen = 'pixel'; UI.pxPage = 0;
  if(!pxLib().length){ const c = (G && G.ship && G.ship.crew.find(o => o.owner==='p' && !o.drone)) || { id:'starter', name:'Starter', race:'human' }; const a = pxFromCrew(c, 32, 48); a.name = 'Starter'; pxAdd(a); }
  if(!UI.px || !pxGet(UI.px.id)) pxOpenArt(pxLib()[0].id);
}
function closePixelStudio(){ if(UI.px) pxCommit(); UI.screen = UI.pxBack || 'title'; if(UI.pxReturnPick){ UI.pxPick = UI.pxReturnPick; UI.pxReturnPick = null; } }
const PXG = { x:330, y:112, w:660, h:812 };   // where the grid may sit
function pxGridBox(){ const E = UI.px; if(!E) return null; const cs = Math.max(4, Math.floor(Math.min(PXG.w/E.w, PXG.h/E.h))), gw = cs*E.w, gh = cs*E.h; return { x:PXG.x + Math.floor((PXG.w - gw)/2), y:PXG.y + Math.floor((PXG.h - gh)/2), cs, gw, gh }; }
function pxCellAt(p){ const b = pxGridBox(); if(!b || !p) return null; const cx = Math.floor((p.x - b.x)/b.cs), cy = Math.floor((p.y - b.y)/b.cs); return cx >= 0 && cy >= 0 && cx < UI.px.w && cy < UI.px.h ? { x:cx, y:cy } : null; }
function pxSnap(){ const E = UI.px; E.undo.push(E.grid.slice()); if(E.undo.length > 60) E.undo.shift(); E.redo = []; }
function pxSet(x, y, v){ const E = UI.px; if(x < 0 || y < 0 || x >= E.w || y >= E.h) return; E.grid[y*E.w + x] = v; if(E.mirror) E.grid[y*E.w + (E.w - 1 - x)] = v; }
function pxFill(x, y, v){ const E = UI.px, w = E.w, g = E.grid, from = g[y*w + x]; if(from===v) return; const st = [[x, y]];
  while(st.length){ const [cx, cy] = st.pop(); if(cx < 0 || cy < 0 || cx >= w || cy >= E.h || g[cy*w + cx] !== from) continue; g[cy*w + cx] = v; st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]); }
  if(E.mirror){ const mx = w - 1 - x; if(mx !== x && g[y*w + mx]===from) pxFill(mx, y, v); } }
function pxStroke(c, start){
  const E = UI.px; if(!E || !c) return; const a = pxGet(E.id); if(!a) return; const v = E.tool==='eraser' ? -1 : E.col;
  if(E.tool==='pick'){ if(start){ const got = E.grid[c.y*E.w + c.x]; if(got >= 0){ E.col = got; E.tool = 'pen'; } } return; }
  if(E.tool==='fill'){ if(start){ pxSnap(); pxFill(c.x, c.y, v); pxCommit(); } return; }
  if(start){ pxSnap(); E.last = c; pxSet(c.x, c.y, v); }
  else if(E.last){ let x0 = E.last.x, y0 = E.last.y; const dx = Math.abs(c.x - x0), dy = -Math.abs(c.y - y0), sx = x0 < c.x ? 1 : -1, sy = y0 < c.y ? 1 : -1; let er = dx + dy;
    for(let n = 0; n < 200; n++){ pxSet(x0, y0, v); if(x0===c.x && y0===c.y) break; const e2 = 2*er; if(e2 >= dy){ er += dy; x0 += sx; } if(e2 <= dx){ er += dx; y0 += sy; } } E.last = c; }
  E.dirty = true;
}
function pxEndStroke(){ const E = UI.px; if(E && E.dirty){ E.dirty = false; E.last = null; pxCommit(); } }
function pxUndo(){ const E = UI.px; if(!E || !E.undo.length) return; E.redo.push(E.grid.slice()); E.grid = E.undo.pop(); pxCommit(); }
function pxRedo(){ const E = UI.px; if(!E || !E.redo.length) return; E.undo.push(E.grid.slice()); E.grid = E.redo.pop(); pxCommit(); }
function pxFlip(){ const E = UI.px; pxSnap(); const g = E.grid.slice(); for(let y = 0; y < E.h; y++) for(let x = 0; x < E.w; x++) E.grid[y*E.w + x] = g[y*E.w + (E.w - 1 - x)]; pxCommit(); }
function pxShift(dx, dy){ const E = UI.px; pxSnap(); const g = E.grid.slice(); E.grid.fill(-1); for(let y = 0; y < E.h; y++) for(let x = 0; x < E.w; x++){ const nx = x + dx, ny = y + dy; if(nx >= 0 && ny >= 0 && nx < E.w && ny < E.h) E.grid[ny*E.w + nx] = g[y*E.w + x]; } pxCommit(); }
function pxShade(k){ const E = UI.px, a = pxGet(E.id), c = a.pal[E.col]; if(!c) return; const [r, g, b] = pxRGB(c); a.pal[E.col] = k > 0 ? pxToHex(r + (255 - r)*.18, g + (255 - g)*.18, b + (255 - b)*.18) : pxToHex(r*.82, g*.82, b*.82); pxSaveArt(a); }
function pxEditColour(add){ const E = UI.px, a = pxGet(E.id); if(add && a.pal.length >= PX_CH.length){ toast('That is as many colours as one piece can have.'); return; }
  openKeyboard({ title:add ? 'New colour (hex, like #e9623b)' : 'Change this colour (hex, like #e9623b)', value:add ? '#' : a.pal[E.col], max:9, min:4, ok:'Use', allowed:'#0123456789abcdefABCDEF', hint:'Every pixel in this colour changes with it',
    onOk:v => { const h = pxHex(v); if(!h){ toast('That is not a colour code. Try something like #e9623b.'); return; } if(add){ a.pal.push(h); E.col = a.pal.length - 1; } else a.pal[E.col] = h; pxSaveArt(a); } }); }
function pxDelete(){ const E = UI.px, L = pxLib(), i = L.findIndex(p => p.id===E.id); if(i < 0) return; L.splice(i, 1);
  if(G && G.ship) for(const c of G.ship.crew) if(c.skin===E.id) c.skin = null; saveProfile(); UI.px = null; if(L.length) pxOpenArt(L[Math.min(i, L.length - 1)].id); else { UI.screen = UI.pxBack || 'title'; } }
function pxDuplicate(){ const a = pxGet(UI.px.id); if(!a) return; pxCommit(); const b = JSON.parse(JSON.stringify(a)); b.id = pxId(); b.name = (a.name + ' copy').slice(0, 24); if(pxAdd(b)) pxOpenArt(b.id); }
function pxResize(w, h){ const a = pxGet(UI.px.id); pxCommit(); const g0 = pxDecode(a), bb = pxBBox(g0, a.w, a.h), g = new Int16Array(w*h).fill(-1), ox = Math.floor((w - bb.w)/2) - bb.x, oy = h - bb.h - bb.y;
  for(let y = 0; y < a.h; y++) for(let x = 0; x < a.w; x++){ const v = g0[y*a.w + x], nx = x + ox, ny = y + oy; if(v >= 0 && nx >= 0 && ny >= 0 && nx < w && ny < h) g[ny*w + nx] = v; }
  a.w = w; a.h = h; a.rows = pxEncode(g, w, h); pxSaveArt(a); pxOpenArt(a.id); }
function pxLooksHere(){ return (G && G.ship ? G.ship.crew.filter(c => c.owner==='p' && c.skin===UI.px?.id).map(c => c.name) : []); }
function drawPixelStudio(){
  const E = UI.px, a = E && pxGet(E.id); if(!a){ if(pxLib().length) pxOpenArt(pxLib()[0].id); else { UI.screen = UI.pxBack || 'title'; } return; }
  label('Draw your own crew', 40, 52, C.muted, 'left', 14); T('Pixel Studio', 40, 96, { s:38, f:FD, w:700, c:C.amber });
  btn(1430, 34, 140, 50, UI.pxTarget ? 'Back' : 'Close', closePixelStudio, { s:17 });
  if(UI.pxTarget){ const nm = UI.pxTarget.name || 'them'; btn(1100, 34, 316, 50, `Use this look for ${nm}`, () => { pxCommit(); pxAssign(UI.pxTarget, E.id); UI.pxReturnPick = null; UI.pxTarget = null; UI.screen = UI.pxBack || 'title'; toast(`${nm} has a new look.`); }, { fill:true, s:16, col:C.good }); }
  // library
  const L = pxLib(), per = 8, pages = Math.max(1, Math.ceil(L.length/per)); UI.pxPage = clamp(UI.pxPage || 0, 0, pages - 1);
  panel(28, 112, 284, 812, 10); label(`Your art · ${L.length}/${PX_MAX}`, 44, 140, C.muted, 'left', 13);
  const sz = PX_SIZES[UI.pxSize || 0];
  btn(44, 154, 178, 40, `New ${sz[0]}×${sz[1]}`, () => pxNew(sz[0], sz[1]), { s:14, col:C.good }); btn(228, 154, 68, 40, 'Size', () => { UI.pxSize = ((UI.pxSize || 0) + 1) % PX_SIZES.length; }, { s:13 });
  L.slice(UI.pxPage*per, UI.pxPage*per + per).forEach((p, i) => { const tx = 44 + (i % 2)*130, ty = 206 + Math.floor(i/2)*150, on = p.id===E.id;
    rr(tx, ty, 122, 142, 8); ctx.fillStyle = on ? hexA(C.amber, .16) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : 'rgba(120,135,170,.25)'; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    try{ pxThumb(p, tx + 16, ty + 10, 90, 100); }catch(e){} T(p.name, tx + 61, ty + 130, { s:12, a:'center', c:on ? C.amber : C.ink, max:112 });
    region(tx, ty, 122, 142, () => { pxCommit(); pxOpenArt(p.id); }, 'pxlib:' + p.id); });
  if(pages > 1){ btn(44, 812, 60, 36, '‹', () => UI.pxPage--, { disabled:UI.pxPage <= 0, s:16 }); T(`${UI.pxPage + 1}/${pages}`, 170, 836, { s:13, a:'center', c:C.muted }); btn(236, 812, 60, 36, '›', () => UI.pxPage++, { disabled:UI.pxPage >= pages - 1, s:16 }); }
  btn(44, 858, 120, 40, 'Duplicate', pxDuplicate, { s:13 }); btn(176, 858, 120, 40, E.del ? 'Sure?' : 'Delete', () => { if(E.del) pxDelete(); else E.del = true; }, { s:13, col:C.hostile });
  // the grid
  const b = pxGridBox(), cs = b.cs;
  for(let y = 0; y < E.h; y++) for(let x = 0; x < E.w; x++){ const v = E.grid[y*E.w + x], px = b.x + x*cs, py = b.y + y*cs;
    ctx.fillStyle = v >= 0 ? a.pal[v] : ((x + y) % 2 ? '#1b2238' : '#151b2e'); ctx.fillRect(px, py, cs, cs); }
  if(cs >= 8){ ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1; ctx.beginPath(); for(let x = 0; x <= E.w; x++){ ctx.moveTo(b.x + x*cs + .5, b.y); ctx.lineTo(b.x + x*cs + .5, b.y + b.gh); } for(let y = 0; y <= E.h; y++){ ctx.moveTo(b.x, b.y + y*cs + .5); ctx.lineTo(b.x + b.gw, b.y + y*cs + .5); } ctx.stroke(); }
  ctx.strokeStyle = hexA(C.amber, .6); ctx.lineWidth = 2; ctx.strokeRect(b.x - 1, b.y - 1, b.gw + 2, b.gh + 2);
  if(E.mirror){ ctx.strokeStyle = hexA(C.cyan, .7); ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(b.x + b.gw/2, b.y - 8); ctx.lineTo(b.x + b.gw/2, b.y + b.gh + 8); ctx.stroke(); ctx.setLineDash([]); }
  const hv = PTR[0].on ? pxCellAt(PTR[0]) : null; if(hv){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(b.x + hv.x*cs + 1, b.y + hv.y*cs + 1, cs - 2, cs - 2); }
  region(b.x, b.y, b.gw, b.gh, (x, y) => { const c = pxCellAt({ x, y }); if(c){ pxStroke(c, true); pxEndStroke(); } }, 'pxgrid');
  T(`${a.w}×${a.h}${hv ? `   ·   ${hv.x + 1}, ${hv.y + 1}` : ''}`, b.x + b.gw/2, b.y + b.gh + 26, { s:13, a:'center', c:C.muted });
  // right column
  const rx = 1018, rw = 552; panel(rx - 14, 112, rw + 28, 812, 10);
  btn(rx, 128, 300, 40, '', () => openKeyboard({ title:'Name this look', value:a.name, max:24, ok:'Save', onOk:v => { a.name = v.trim().slice(0, 24) || a.name; pxSaveArt(a); } }), { s:15 });
  T(a.name, rx + 14, 154, { s:17, f:FD, w:700, c:C.amber, max:250 }); T('✎', rx + 284, 154, { s:15, a:'right', c:C.muted });
  btn(rx + 310, 128, 116, 40, 'Resize', () => { const i = PX_SIZES.findIndex(s => s[0]===a.w && s[1]===a.h), n = PX_SIZES[(i + 1) % PX_SIZES.length]; pxResize(n[0], n[1]); }, { s:14 }); tip(rx + 310, 128, 116, 40, 'Resize', 'Change the canvas size. The drawing stays in the middle, feet on the floor.');
  const used = pxLooksHere(); if(used.length) T(`Worn by ${used.join(', ')}`, rx + 440, 154, { s:12, c:C.good, max:110 });
  const tools = [['pen', 'Pen', 'B'], ['eraser', 'Rubber', 'E'], ['fill', 'Fill', 'F'], ['pick', 'Pick', 'I']];
  tools.forEach(([k, n, key], i) => { btn(rx + i*112, 182, 104, 44, n, () => { E.tool = k; }, { fill:E.tool===k, s:15 }); tip(rx + i*112, 182, 104, 44, n, { pen:'Draw with the chosen colour. Drag to draw lines.', eraser:'Make pixels see-through.', fill:'Fill an area of one colour.', pick:'Click a pixel to pick up its colour.' }[k] + ` (key ${key})`); });
  btn(rx + 448, 182, 104, 44, 'Mirror', () => { E.mirror = !E.mirror; }, { fill:E.mirror, s:15, col:C.cyan }); tip(rx + 448, 182, 104, 44, 'Mirror', 'Everything you draw on one side is copied to the other. Good for faces. (key M)');
  const acts = [['Undo', pxUndo, !E.undo.length], ['Redo', pxRedo, !E.redo.length], ['Flip', pxFlip], ['Outline', () => { pxSnap(); const g = E.grid; if(!pxOutline(g, E.w, E.h, a.pal)) toast('Nothing to outline.'); pxCommit(); }], ['Clear', () => { pxSnap(); E.grid.fill(-1); pxCommit(); }]];
  acts.forEach(([n, f, dis], i) => btn(rx + i*111, 236, 103, 40, n, f, { s:14, disabled:!!dis, col:n==='Clear' ? C.hostile : C.amber }));
  [['←', -1, 0], ['→', 1, 0], ['↑', 0, -1], ['↓', 0, 1]].forEach(([n, dx, dy], i) => btn(rx + i*58, 286, 50, 36, n, () => pxShift(dx, dy), { s:15 })); T('Nudge', rx + 240, 310, { s:13, c:C.muted });
  // palette
  label('Colours', rx, 350, C.muted, 'left', 13); const sw = 34, per2 = 15;
  a.pal.forEach((c, i) => { const sx = rx + (i % per2)*(sw + 3), sy = 362 + Math.floor(i/per2)*(sw + 3); ctx.fillStyle = c; ctx.fillRect(sx, sy, sw, sw);
    if(i===E.col){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(sx + 1.5, sy + 1.5, sw - 3, sw - 3); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(sx + 4, sy + 4, sw - 8, sw - 8); }
    region(sx, sy, sw, sw, () => { E.col = i; if(E.tool==='eraser' || E.tool==='pick') E.tool = 'pen'; }, 'pxcol:' + i); });
  const py = 362 + Math.ceil(Math.max(1, a.pal.length)/per2)*(sw + 3) + 6;
  btn(rx, py, 128, 36, 'Change', () => pxEditColour(false), { s:13 }); btn(rx + 136, py, 100, 36, '+ Colour', () => pxEditColour(true), { s:13 }); btn(rx + 244, py, 100, 36, 'Lighter', () => pxShade(1), { s:13 }); btn(rx + 352, py, 100, 36, 'Darker', () => pxShade(-1), { s:13 });
  // preview, at game size
  const pvY = Math.max(py + 54, 540); label('In the game', rx, pvY, C.muted, 'left', 13);
  rr(rx, pvY + 10, 330, 150, 8); ctx.fillStyle = 'rgba(6,9,18,.7)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,135,170,.25)'; ctx.lineWidth = 1; ctx.stroke();
  const pose = ['idle', 'walk0', 'idle', 'walk1', 'fight0', 'fight1'][Math.floor(performance.now()/260) % 6], dummy = { id:'pxprev', name:a.name, race:'human', owner:'p', skin:a.id };
  try{ drawCrewSprite(rx + 60, pvY + 108, 11, dummy, { pose }); drawCrewSprite(rx + 150, pvY + 100, 18, dummy, { pose:'idle' }); drawPortrait(rx + 260, pvY + 84, 46, dummy, false); }catch(e){}
  // getting art in
  const iy = pvY + 178; label('Bring art in', rx, iy, C.muted, 'left', 13);
  btn(rx, iy + 12, 270, 44, '🖼 Import picture', pxPickPicture, { s:15, col:C.cyan }); tip(rx, iy + 12, 270, 44, 'Import picture', `Turns any picture into pixel art at this size: takes away a plain background, cuts it to ${UI.pxCols || 14} colours and adds an outline.`);
  btn(rx + 282, iy + 12, 270, 44, `Colours: ${UI.pxCols || 14}`, () => { const o = [8, 10, 14, 20, 28], i = o.indexOf(UI.pxCols || 14); UI.pxCols = o[(i + 1) % o.length]; }, { s:14 });
  btn(rx, iy + 64, 270, 44, '🤖 Copy AI prompt', () => pxCopy(pxAIPrompt(a.w, a.h), 'Prompt copied. Paste it into an AI that can see pictures, with your picture attached.'), { s:15, col:C.violet || '#c48bff' });
  tip(rx, iy + 64, 270, 44, 'Copy AI prompt', `Copies instructions for an AI (ChatGPT, Gemini, Claude...) to turn a picture into a ${a.w}×${a.h} crew member. Attach your picture, paste the prompt, then copy its whole reply and press Paste.`);
  btn(rx + 282, iy + 64, 270, 44, '📋 Paste AI reply / code', pxPaste, { s:15, col:C.violet || '#c48bff' });
  btn(rx, iy + 116, 270, 40, 'Copy share code', () => pxCopy(pxShareCode(a), `Code for "${a.name}" copied. Send it to a friend: they press Paste.`), { s:14 });
  btn(rx + 282, iy + 116, 270, 40, 'Start from a crew look', () => { const c = (G && G.ship && pick(G.ship.crew.filter(o => o.owner==='p' && !o.drone))) || { id:'r' + Math.random(), name:'Crew', race:pick(Object.keys(DATA.races).filter(r => !DATA.races[r].drone && !DATA.races[r].secret)) }; const n = pxFromCrew(c, a.w, a.h); if(pxAdd(n)) pxOpenArt(n.id); }, { s:14 });
  T('Tip: an AI that makes pictures can draw your character as pixel art. Save that picture and use Import picture.', rx, iy + 180, { s:12, c:C.muted, max:rw });
}
/* paint by dragging, with mouse or touch (VR and gamepads paint a pixel per click through the grid region) */
(function(){ const cv = document.getElementById('game'); if(!cv) return;
  const toG = e => (typeof evGame==='function' ? evGame(e) : screenToGame(e.clientX, e.clientY)); let D = null;
  const busy = () => UI.screen!=='pixel' || (typeof KB!=='undefined' && KB.open) || UI.pxPick;
  cv.addEventListener('pointerdown', e => { if(busy()) return; if(typeof laserPtr==='function' && laserPtr(e)) return; const c = pxCellAt(toG(e)); if(!c) return;
    e.preventDefault(); e.stopImmediatePropagation(); try{ cv.setPointerCapture(e.pointerId); }catch(er){} D = { id:e.pointerId }; pxStroke(c, true); }, true);
  cv.addEventListener('pointermove', e => { if(!D || D.id!==e.pointerId || UI.screen!=='pixel') return; const c = pxCellAt(toG(e)); if(c) pxStroke(c, false); e.stopImmediatePropagation(); }, true);
  const end = e => { if(D && D.id===e.pointerId){ D = null; pxEndStroke(); e.stopImmediatePropagation(); } }; cv.addEventListener('pointerup', end, true); cv.addEventListener('pointercancel', end, true);
  window.addEventListener('keydown', e => { if(UI.screen!=='pixel' || (typeof KB!=='undefined' && KB.open) || !UI.px) return; const k = e.key.toLowerCase(), E = UI.px;
    if((e.ctrlKey || e.metaKey) && k==='z'){ e.preventDefault(); e.shiftKey ? pxRedo() : pxUndo(); return; } if((e.ctrlKey || e.metaKey) && k==='y'){ e.preventDefault(); pxRedo(); return; }
    if((e.ctrlKey || e.metaKey) && k==='v'){ return; }
    const m = { b:'pen', p:'pen', e:'eraser', f:'fill', g:'fill', i:'pick' }; if(m[k] && !e.ctrlKey && !e.metaKey){ E.tool = m[k]; e.preventDefault(); e.stopImmediatePropagation(); }
    if(k==='m' && !e.ctrlKey){ E.mirror = !E.mirror; e.preventDefault(); e.stopImmediatePropagation(); }
    if(k==='escape'){ e.preventDefault(); e.stopImmediatePropagation(); closePixelStudio(); } }, true);
  window.addEventListener('paste', e => { if(UI.screen!=='pixel' || (typeof KB!=='undefined' && KB.open)) return; const t = (e.clipboardData || window.clipboardData)?.getData('text') || ''; if(t && t.includes('{')){ e.preventDefault(); const r = pxParse(t); if(r.err){ toast(r.err); return; } if(pxAdd(r.art)){ pxOpenArt(r.art.id); toast(`Imported "${r.art.name}".`); } } }, true);
})();

/* ---------------- choosing a look for someone ---------------- */
function pxAssign(t, id){ if(!t) return;
  if(t.kind==='crew' && G && G.ship){ const c = G.ship.crew.find(o => o.id===t.id); if(c){ c.skin = id || null; if(typeof logEntry==='function' && id) logEntry(`${c.name} has a new look.`, 'crew'); } }
  if(t.kind==='hangar' && UI.hangarCrew){ const hc = UI.hangarCrew; hc.skins = hc.skins || []; hc.skins[t.i] = id || null; } }
function openLookPicker(target){ UI.pxPick = { target, page:0 }; }
function drawPxPick(){
  const P = UI.pxPick; if(!P) return; const t = P.target, L = pxLib(), cur = t.kind==='crew' ? (G && G.ship && (G.ship.crew.find(o => o.id===t.id) || {}).skin) : ((UI.hangarCrew && UI.hangarCrew.skins) || [])[t.i];
  ctx.fillStyle = 'rgba(4,6,12,.82)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => {});
  const w = 1180, h = 760, x = (W - w)/2, y = (H - h)/2; panel(x, y, w, h, 14);
  label(`A look for ${t.name || 'your crew member'}`, x + 32, y + 44, C.amber, 'left', 18);
  T('Pick one of your drawings, or go back to the ordinary look. Make new ones in the Pixel Studio.', x + 32, y + 76, { s:15, c:C.muted, max:w - 360 });
  btn(x + w - 300, y + 26, 130, 46, 'Studio ›', () => { UI.pxReturnPick = null; const back = UI.screen; UI.pxPick = null; openPixelStudio(back, t); }, { s:15, col:C.violet || '#c48bff' });
  btn(x + w - 158, y + 26, 130, 46, 'Close', () => { UI.pxPick = null; }, { s:15 });
  const items = [{ id:null, name:'Ordinary look' }].concat(L), per = 12, pages = Math.max(1, Math.ceil(items.length/per)); P.page = clamp(P.page || 0, 0, pages - 1);
  items.slice(P.page*per, P.page*per + per).forEach((it, i) => { const cx = x + 32 + (i % 6)*186, cy = y + 104 + Math.floor(i/6)*270, on = (it.id || null)===(cur || null);
    rr(cx, cy, 176, 256, 10); ctx.fillStyle = on ? hexA(C.good, .16) : 'rgba(6,9,18,.65)'; ctx.fill(); ctx.strokeStyle = on ? C.good : 'rgba(120,135,170,.3)'; ctx.lineWidth = on ? 3 : 1; ctx.stroke();
    if(it.id){ try{ pxThumb(it, cx + 20, cy + 16, 136, 180); }catch(e){} }
    else { const crew = t.kind==='crew' && G && G.ship ? G.ship.crew.find(o => o.id===t.id) : t.crew; if(crew){ const d = Object.assign({}, crew, { skin:null }); try{ drawCrewSprite(cx + 88, cy + 150, 30, d, { pose:'idle' }); }catch(e){} } else T('—', cx + 88, cy + 120, { s:40, a:'center', c:C.muted }); }
    T(it.name, cx + 88, cy + 226, { s:15, a:'center', c:on ? C.good : C.ink, f:FD, w:600, max:160 }); if(on) T('Wearing', cx + 88, cy + 246, { s:11, a:'center', c:C.good });
    region(cx, cy, 176, 256, () => { pxAssign(t, it.id); UI.pxPick = null; if(typeof toast==='function') toast(it.id ? `${t.name || 'They'} now look${t.name ? 's' : ''} like "${it.name}".` : `${t.name || 'They'} ${t.name ? 'is' : 'are'} back to the ordinary look.`); }, 'pxpick:' + (it.id || 'none')); });
  if(pages > 1){ btn(x + 32, y + h - 66, 150, 44, '‹ Previous', () => P.page--, { disabled:P.page <= 0, s:15 }); T(`Page ${P.page + 1} of ${pages}`, x + w/2, y + h - 38, { s:14, a:'center', c:C.muted }); btn(x + w - 182, y + h - 66, 150, 44, 'Next ›', () => P.page++, { disabled:P.page >= pages - 1, s:15 }); }
  else if(!L.length) T('You have not drawn anyone yet. Press Studio to start.', x + w/2, y + h - 40, { s:15, a:'center', c:C.muted });
}

/* ---------------- the hangar remembers who wore what ---------------- */
(function(){
  if(typeof hangarCrew==='function'){ const h0 = hangarCrew; hangarCrew = function(sel, temp){ const hc = h0(sel, temp); if(hc && !hc.skins) hc.skins = (SET.lastCrew && Array.isArray(SET.lastCrew.skins) ? SET.lastCrew.skins.slice(0, hc.names.length) : []).map(id => pxGet(id) ? id : null); return hc; }; }
  if(typeof rememberCrew==='function'){ const r0 = rememberCrew; rememberCrew = function(hc){ r0(hc); try{ if(hc && SET.lastCrew && hc.skins){ SET.lastCrew.skins = hc.skins.slice(0, 8); saveProfile(); } }catch(e){} }; }
  const n0 = newRun; newRun = function(...a){ const hc = UI.hangarCrew, r = n0(...a);
    try{ if(G && hc && hc.skins && hc.skins.some(Boolean) && !G.daily && !G.cup && !(typeof NET!=='undefined' && NET.on)){ const mine = G.ship.crew.filter(c => c.owner==='p' && !c.drone);
      hc.names.forEach((nm, i) => { const id = hc.skins[i]; if(!id || !pxGet(id)) return; const c = mine.find(o => o.name===nm && !o.skin) || mine[i]; if(c) c.skin = id; }); } }catch(e){}
    return r; };
})();
