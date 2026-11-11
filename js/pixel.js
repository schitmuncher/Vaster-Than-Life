'use strict';
/* =========================================================================
   Pixel Studio: draw your own crew. Pixel art made here (or imported from a
   picture, or pasted back from an AI) becomes a "look" any crew member can
   wear, in the ship, on crew cards, in the hangar and in VR.
   Art lives in PROFILE.pixels: { id, name, w, h, pal:['#rrggbb'], z:'rows, run-length packed', v }.
   Rows use '.' for see-through and PX_CH for palette entries; runs of 3 or more are
   written (n)c, and rows are joined with '/'. Older art kept plain rows:[...]: both read.
   ========================================================================= */
const PX_MAX = 60, PX_MAXSIDE = 128, PX_BUDGET = 2600000;   // pieces, biggest side, characters of art kept in the profile
const PX_SIZES = [[32, 48, 'Classic crew'], [48, 64, 'Detailed'], [64, 96, 'Very detailed'], [96, 128, 'Poster'], [128, 128, 'Huge square'], [64, 64, 'Square'], [32, 32, 'Small square'], [24, 32, 'Tiny'], [16, 24, 'Micro']];
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
function pxRLE(rows){ return rows.map(r => r.replace(/(.)\1{2,}/g, (m, c) => '(' + m.length + ')' + c)).join('/'); }
function pxUnRLE(z){ return String(z || '').split('/').map(r => r.replace(/\((\d+)\)(.)/g, (m, n, c) => c.repeat(Math.min(+n, PX_MAXSIDE)))); }
function pxRows(a){ return a.z != null ? pxUnRLE(a.z) : (a.rows || []); }
function pxStore(a, grid){ a.z = pxRLE(pxEncode(grid, a.w, a.h)); delete a.rows; return a; }
function pxSize(a){ return (a.z != null ? a.z.length : (a.rows || []).join('').length) + 60 + (a.pal || []).length*10; }
function pxBytes(){ return pxLib().reduce((s, p) => s + (p ? pxSize(p) : 0), 0); }
function pxDecode(a){ const g = new Int16Array(a.w*a.h).fill(-1), rows = pxRows(a);
  for(let y = 0; y < a.h; y++){ const row = String(rows[y] || ''); for(let x = 0; x < a.w; x++){ const i = PX_CH.indexOf(row[x]); g[y*a.w + x] = i >= 0 && i < a.pal.length ? i : -1; } } return g; }
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
  g.imageSmoothingEnabled = k < .99; g.imageSmoothingQuality = 'high'; g.translate((SPR_W/2 - 2)*S, (SPR_H - 3)*S);   // detailed art is shrunk smoothly, small art kept crisp
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
  ctx.imageSmoothingEnabled = k < .99; const dw = bb.w*k, dh = ch*k, top = tall ? y - rad*.78 : y - dh/2;
  ctx.drawImage(src, bb.x, bb.y, bb.w, ch, x - dw/2, top, dw, dh); ctx.imageSmoothingEnabled = true;
  if(hostile){ ctx.fillStyle = 'rgba(255,40,70,.25)'; ctx.fillRect(x - rad, y - rad, rad*2, rad*2); }
  ctx.restore(); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.strokeStyle = hostile ? C.hostile : hexA(C.amber, .8); ctx.lineWidth = 2; ctx.stroke();
}
function pxThumb(a, x, y, w, h){ const src = pxCanvas(a), bb = src.bbox, k = Math.min(w/bb.w, h/bb.h);
  ctx.imageSmoothingEnabled = k < .99; ctx.drawImage(src, bb.x, bb.y, bb.w, bb.h, x + (w - bb.w*k)/2, y + h - bb.h*k, bb.w*k, bb.h*k); ctx.imageSmoothingEnabled = true; }
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
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k0 = Math.min(1, Math.max(256, 4*Math.max(w, h))/Math.max(iw, ih));
  const mid = pxShrink(img, iw, ih, Math.max(1, Math.round(iw*k0)), Math.max(1, Math.round(ih*k0))), mw = mid.width, mh = mid.height, mg = mid.getContext('2d'), md = mg.getImageData(0, 0, mw, mh);
  if(o.cut !== false) pxCutBackground(md.data, mw, mh, 70); mg.putImageData(md, 0, 0);
  // crop to what is left, then fit it into the canvas, feet on the floor
  let x0 = mw, y0 = mh, x1 = -1, y1 = -1; for(let y = 0; y < mh; y++) for(let x = 0; x < mw; x++) if(md.data[(y*mw + x)*4 + 3] > 100){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
  if(x1 < 0){ x0 = 0; y0 = 0; x1 = mw - 1; y1 = mh - 1; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = Math.min((w - (o.outline !== false ? 2 : 0))/bw, (h - (o.outline !== false ? 1 : 0))/bh), tw = Math.max(1, Math.round(bw*k)), th = Math.max(1, Math.round(bh*k));
  const crop = mkCanvas(bw, bh); crop.getContext('2d').drawImage(mid, x0, y0, bw, bh, 0, 0, bw, bh);
  const small = pxShrink(crop, bw, bh, tw, th), sd = small.getContext('2d').getImageData(0, 0, tw, th).data, ox = Math.floor((w - tw)/2), oy = h - th;
  const cols = [], spots = []; for(let y = 0; y < th; y++) for(let x = 0; x < tw; x++){ const i = (y*tw + x)*4; if(sd[i + 3] < 128) continue; cols.push([sd[i], sd[i + 1], sd[i + 2]]); spots.push((oy + y)*w + ox + x); }
  const many = cols.length > 6000, pal = pxQuantise(many ? cols.filter((c, i) => i % Math.ceil(cols.length/6000)===0) : cols, clamp(o.colours || 14, 2, 48)), grid = new Int16Array(w*h).fill(-1);
  const near = c => { let bi = 0, bd = 1e12; pal.forEach((p, j) => { const dd = (p[0] - c[0])**2*.3 + (p[1] - c[1])**2*.59 + (p[2] - c[2])**2*.11; if(dd < bd){ bd = dd; bi = j; } }); return bi; };
  if(o.dither){   // Floyd-Steinberg, a little gentler than usual so faces don't go grainy
    const buf = new Float32Array(tw*th*3), solid = new Uint8Array(tw*th); for(let i = 0; i < tw*th; i++){ buf[i*3] = sd[i*4]; buf[i*3 + 1] = sd[i*4 + 1]; buf[i*3 + 2] = sd[i*4 + 2]; solid[i] = sd[i*4 + 3] >= 128 ? 1 : 0; }
    const push = (x, y, e, f) => { if(x < 0 || y < 0 || x >= tw || y >= th) return; const q = y*tw + x; if(!solid[q]) return; for(let c = 0; c < 3; c++) buf[q*3 + c] += e[c]*f; };
    for(let y = 0; y < th; y++) for(let x = 0; x < tw; x++){ const q = y*tw + x; if(!solid[q]) continue; const c = [buf[q*3], buf[q*3 + 1], buf[q*3 + 2]], j = near(c), e = [0, 1, 2].map(k => (c[k] - pal[j][k])*.8);
      grid[(oy + y)*w + ox + x] = j; push(x + 1, y, e, 7/16); push(x - 1, y + 1, e, 3/16); push(x, y + 1, e, 5/16); push(x + 1, y + 1, e, 1/16); }
  } else cols.forEach((c, i) => { grid[spots[i]] = near(c); });
  const art = { id:pxId(), name:o.name || 'Imported', w, h, pal:pal.map(c => pxToHex(...c)), rows:[] };
  if(o.outline !== false) pxOutline(grid, w, h, art.pal);
  pxTidyPal(art, grid); return art;
}
/* drop unused colours, keeping the grid pointing at the right ones */
function pxTidyPal(art, grid){ const used = [...new Set([...grid].filter(v => v >= 0))].sort((a, b) => a - b), map = {}; used.forEach((v, i) => { map[v] = i; });
  art.pal = used.map(v => art.pal[v]); for(let i = 0; i < grid.length; i++) if(grid[i] >= 0) grid[i] = map[grid[i]]; return pxStore(art, grid); }
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
  let rows = typeof o.z==='string' ? pxUnRLE(o.z) : o.rows || o.pixels || o.data || o.grid || o.image;
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
function pxShareCode(a){ const rows = pxRows(a); return JSON.stringify(Object.assign({ vtl:'pixel', name:a.name, w:a.w, h:a.h, palette:a.pal }, a.w*a.h > 4096 ? { z:pxRLE(rows) } : { rows })); }
/* the prompt for an AI that can see pictures. Long on purpose: text AIs drift towards side views, wrong row
   lengths and too few details unless told plainly, so it spells out the pose, a body plan in rows, and a checklist */
const PX_EXAMPLE = { w:12, h:20, palette:['#1a1420', '#e8b48a', '#5a3a22', '#3a6fd8', '#2b2f45', '#4a2e1e', '#241a2a', '#b5544a'],
  rows:['....0000....', '...022220...', '..02222220..', '.0222222220.', '.0211111120.', '.0161111610.', '.0111111110.', '..01177110..', '...011110...', '..00333300..',
    '.0333333330.', '.0313333130.', '.0313333130.', '.0103333010.', '..00444400..', '..04400440..', '..04400440..', '..05500550..', '.0555005550.', '.0000..0000.'] };
function pxAIPrompt(w, h){
  const big = w*h > 64*64, small = h <= 48, nc = big ? 32 : w*h > 32*48 ? 24 : 16, chars = PX_CH.slice(0, nc), last = chars[chars.length - 1];
  const hh = Math.round(h*(small ? .38 : h <= 96 ? .3 : .24)), sh = hh + Math.max(1, Math.round(h*.03)), belt = sh + Math.round(h*(small ? .22 : .26)), knee = belt + Math.round((h - 1 - belt)*.5);
  const headW = Math.round(w*(small ? .56 : .42)), shW = Math.min(w - 2, Math.round(w*(small ? .66 : .56))), mid = w/2;
  const style = small ? 'chunky, cute "chibi" proportions like classic 16-bit RPG sprites: a big head, a small body, short legs'
    : h <= 96 ? 'slightly stylised proportions, like a detailed 16-bit or 32-bit era game portrait sprite: the head a bit big, the body otherwise natural'
    : 'natural proportions with plenty of detail, like high-end modern pixel art';
  return [
`I'm making a character for my browser game, Vaster Than Life, a spaceship crew game. I've attached a picture. Please turn the main person (or creature) in it into a pixel-art crew member, written as text that my game reads. Please read everything below carefully before you start: the details matter.`,
``,
`=== 1. THE POSE: FRONT VIEW, FACING THE VIEWER ===`,
`This is the most important rule, and the one AIs most often get wrong.`,
`- Draw the character from the FRONT, looking straight out of the picture at the viewer, like a passport photo or a character standing to attention in a line-up.`,
`- NOT side-on, NOT in profile, NOT a three-quarter turn, NOT walking, NOT facing left or right. Even if the picture shows them side-on, redraw them facing forwards.`,
`- Both eyes visible, the same size, at the same height, the same distance from the middle. The nose points at the viewer, so it is at most a pixel or two of shading in the middle of the face, never a bump sticking out of one side.`,
`- Shoulders level and square to the viewer. Both arms hang straight down at the sides, slightly away from the body so there is a gap (or an outline) between arm and body. Hands visible at the ends of the arms.`,
`- Legs straight, side by side, with a one- or two-pixel gap between them. Both feet visible, pointing at the viewer (or very slightly outwards).`,
`- The figure is close to mirror-symmetrical down the middle (between columns ${Math.floor(mid) - 1} and ${Math.floor(mid)}, counting from 0). Only things that really are one-sided break the symmetry: a side parting, a badge, an eyepatch, something held in one hand.`,
``,
`=== 2. THE CANVAS ===`,
`- Exactly ${w} pixels wide and ${h} pixels tall. Every row must be exactly ${w} characters, and there must be exactly ${h} rows.`,
`- The whole body fits: head at the top, feet on the bottom row (row ${h - 1}). Use the full height: the top of the head should be on row 0 or 1.`,
`- Centred left to right, with a column or two of see-through space at each side.`,
`- The background is see-through: everything that is not the character is ".".`,
``,
`=== 3. A BODY PLAN FOR THIS SIZE (rows counted from 0 at the top) ===`,
`Style: ${style}. A rough guide, adjust to suit the character:`,
`- Head (hair included): rows 0 to ${hh - 1}, about ${headW} pixels wide.`,
`- Neck and chin: around row ${hh}. Shoulders: row ${sh}, about ${shW} pixels across.`,
`- Body and arms: rows ${sh} to about ${belt}. The hands end around row ${belt + Math.round((knee - belt)*.4)}.`,
`- Waist or belt: around row ${belt}. Knees: around row ${knee}. Feet: the last ${Math.max(2, Math.round(h*.06))} rows, ending on row ${h - 1}.`,
``,
`=== 4. HOW IT SHOULD LOOK ===`,
`- A 1-pixel dark outline all the way round the figure (a very dark version of the nearby colour, or near-black). Use darker lines inside too, to separate the arms from the body, the hair from the face, and so on.`,
`- Light comes from the top left: each colour gets a lighter tone on its upper-left side and a darker tone on its lower-right side.${big ? ' Use 3 or 4 tones per colour (shadow, base, light, highlight) and shade folds in clothes, strands of hair and the shape of the face.' : ' Use 2 or 3 tones per main colour.'}`,
`- Face: ${small ? 'eyes 1 or 2 pixels each, with a pixel or so of skin between them; a mouth of 1 to 3 pixels; maybe a pixel of blush or shadow' : 'eyes with a white and a dark pupil, eyebrows, a hint of a nose in the middle by shading, a mouth, ears at both sides, and shading under the chin and hair'}. Keep the face the friendliest, clearest part.`,
`- Keep what makes the picture recognisable: hair style and colour, skin tone, beard or moustache, glasses, hat, clothes and their colours, logos made simple, scars, markings, accessories.`,
`- Clean pixel art: no blurry in-between pixels against the background, no single stray pixels, no dithering noise unless it is a texture on purpose, no text or letters.`,
`- At most ${nc} colours, including the outline colour.`,
``,
`=== 5. THE FORMAT TO REPLY IN ===`,
`Reply with ONLY this JSON, nothing before it and nothing after it:`,
`{"vtl":"pixel","name":"<a short name, up to 24 letters>","w":${w},"h":${h},"palette":["#RRGGBB", ...],"rows":["<row 0>", "<row 1>", ... "<row ${h - 1}>"]}`,
`- "palette" lists the colours as hex codes. The first one is colour 0, the next colour 1, and so on.`,
`- In "rows", each string is one row of pixels, left to right, top row first. Each character is one pixel: "." means see-through, "0" to "9" then "a" to "${last}" pick palette colours 0 to ${nc - 1} (so "a" is colour 10, "b" is colour 11 and so on).`,
`- Please put each row on its own line inside the list, so the rows line up and are easy to check.`,
``,
`Here is a tiny example (12×20) of the right pose and format. Yours must be ${w}×${h} and far more detailed, but notice it faces the viewer, both eyes show, the arms hang at the sides and each row is a mirror image of itself:`,
JSON.stringify({ vtl:'pixel', name:'Example', w:PX_EXAMPLE.w, h:PX_EXAMPLE.h, palette:PX_EXAMPLE.palette, rows:PX_EXAMPLE.rows }).replace('"rows":[', '"rows":[\n  ').replace(/","/g, (m, o, str) => o > str.indexOf('"rows"') ? '",\n  "' : m).replace(/"\]\}$/, '"\n]}'),
``,
`=== 6. BEFORE YOU REPLY, CHECK ===`,
`1. Front view: both eyes showing, facing the viewer, not side-on? If not, redraw it.`,
`2. Exactly ${h} rows, and every row exactly ${w} characters? Count them. Fix any row that is too long or too short.`,
`3. Feet on the last row, head near the top, figure centred?`,
`4. Only "." and the characters for colours you listed in the palette?`,
`5. Does it still look like the person in the picture?`,
`Then reply with only the JSON.`].join('\n'); }
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
function pxImp(){ return UI.pxImp = UI.pxImp || { cols:16, dither:false, outline:true, cut:true }; }
function pxPickPicture(mode){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if(!f) return; const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => { try{ const E = UI.px;
        if(mode==='ref'){ if(E){ E.ref = img; E.refOn = true; E.refA = E.refA || .45; toast('Tracing picture laid over the canvas. Draw over it, then hide it to see your art.'); } return; }
        const O = pxImp(), w = E ? E.w : 32, h = E ? E.h : 48, art = pxFromImage(img, w, h, { name:String(f.name || 'Picture').replace(/\.[a-z0-9]+$/i, '').slice(0, 24), colours:O.cols, dither:O.dither, outline:O.outline, cut:O.cut });
        if(pxAdd(art)){ pxOpenArt(art.id); toast(`Made "${art.name}" from your picture at ${w}×${h}. Tidy it up with the pen.`); } }catch(e){ toast('That picture would not load.'); } URL.revokeObjectURL(url); };
    img.onerror = () => { toast('That file is not a picture this browser can read.'); URL.revokeObjectURL(url); }; img.src = url; };
  inp.click();
}

/* ---------------- the library ---------------- */
function pxAdd(art){ const L = pxLib(); if(L.length >= PX_MAX){ toast(`The studio holds ${PX_MAX} pieces. Delete one first.`); return false; }
  if(art.rows && art.z == null) pxStore(art, pxDecode(art));
  if(pxBytes() + pxSize(art) > PX_BUDGET){ toast('The studio is full: big detailed pieces take a lot of room. Delete one or two first.'); return false; }
  art.v = 1; L.unshift(art); if(typeof saveProfile==='function') saveProfile(); return true; }
function pxNew(w, h){ const a = pxStore({ id:pxId(), name:'New crew ' + (pxLib().length + 1), w, h, pal:PX_PAL0.slice() }, new Int16Array(w*h).fill(-1)); if(pxAdd(a)) pxOpenArt(a.id); }
function pxOpenArt(id){ const a = pxGet(id); if(!a) return; const o = UI.px || {};
  UI.px = { id, w:a.w, h:a.h, grid:pxDecode(a), undo:[], redo:[], col:Math.min(1, a.pal.length - 1), tool:'pen', mirror:false, del:false, zoom:1, panX:0, panY:0,
    brush:o.brush || 1, solid:!!o.solid, tab:o.tab || 'draw', mix:!!o.mix, ref:o.ref || null, refOn:!!o.refOn, refA:o.refA || .45, shadeDir:-1 }; }
function pxCommit(){ const E = UI.px, a = E && pxGet(E.id); if(!a) return; pxStore(a, E.grid); pxSaveArt(a); }

/* ---------------- the studio ---------------- */
function openPixelStudio(back, target){
  UI.pxBack = back || UI.screen; UI.pxTarget = target || null; UI.pxPick = null; UI.screen = 'pixel'; UI.pxPage = 0; UI.pxChoose = null;
  if(!pxLib().length){ const c = (G && G.ship && G.ship.crew.find(o => o.owner==='p' && !o.drone)) || { id:'starter', name:'Starter', race:'human' }; const a = pxFromCrew(c, 32, 48); a.name = 'Starter'; pxAdd(a); }
  if(!UI.px || !pxGet(UI.px.id)) pxOpenArt(pxLib()[0].id);
  if(!PROFILE.pxSeen){ PROFILE.pxSeen = 1; if(typeof saveProfile==='function') saveProfile(); UI.pxHelp = true; }
}
function closePixelStudio(){ if(UI.px) pxCommit(); UI.pxChoose = null; UI.screen = UI.pxBack || 'title'; if(UI.pxReturnPick){ UI.pxPick = UI.pxReturnPick; UI.pxReturnPick = null; } }
const PXG = { x:330, y:112, w:660, h:790 };   // the window the canvas is seen through
const PX_ZMAX = 24;
function pxBase(E){ const fit = Math.min(PXG.w/E.w, PXG.h/E.h); return fit >= 1 ? Math.floor(fit) : fit; }
function pxClampPan(){ const E = UI.px; if(!E) return; const cs = pxCS(E), mx = Math.max(0, (E.w*cs - PXG.w)/2/cs + 2), my = Math.max(0, (E.h*cs - PXG.h)/2/cs + 2);
  E.panX = E.w*cs <= PXG.w ? 0 : clamp(E.panX, -mx, mx); E.panY = E.h*cs <= PXG.h ? 0 : clamp(E.panY, -my, my); }
function pxCS(E){ return Math.max(1, Math.min(64, Math.floor(pxBase(E)*(E.zoom || 1)))); }
function pxGridBox(){ const E = UI.px; if(!E) return null; const cs = pxCS(E), gw = cs*E.w, gh = cs*E.h;
  return { x:Math.round(PXG.x + PXG.w/2 - (E.w/2 + E.panX)*cs), y:Math.round(PXG.y + PXG.h/2 - (E.h/2 + E.panY)*cs), cs, gw, gh }; }
function pxInView(p){ return p && p.x >= PXG.x && p.y >= PXG.y && p.x < PXG.x + PXG.w && p.y < PXG.y + PXG.h; }
function pxCellAt(p){ const b = pxGridBox(); if(!b || !pxInView(p)) return null; const cx = Math.floor((p.x - b.x)/b.cs), cy = Math.floor((p.y - b.y)/b.cs); return cx >= 0 && cy >= 0 && cx < UI.px.w && cy < UI.px.h ? { x:cx, y:cy } : null; }
/* zoom, keeping the pixel under the pointer (or the middle of the view) where it is */
function pxZoom(f, p){ const E = UI.px; if(!E) return; p = pxInView(p) ? p : { x:PXG.x + PXG.w/2, y:PXG.y + PXG.h/2 }; const b0 = pxGridBox(), cx = (p.x - b0.x)/b0.cs, cy = (p.y - b0.y)/b0.cs;
  const zMax = PX_ZMAX/Math.max(.5, pxBase(E)/8); E.zoom = clamp((E.zoom || 1)*f, 1, Math.max(4, zMax)); if(E.zoom < 1.04) E.zoom = 1; const cs = pxCS(E);
  E.panX = (PXG.x + PXG.w/2 - p.x)/cs + cx - E.w/2; E.panY = (PXG.y + PXG.h/2 - p.y)/cs + cy - E.h/2; pxClampPan(); }
function pxFit(){ const E = UI.px; if(E){ E.zoom = 1; E.panX = 0; E.panY = 0; } }
function pxSnap(){ const E = UI.px; E.undo.push(E.grid.slice()); if(E.undo.length > 60) E.undo.shift(); E.redo = []; }

/* painting. E.wg, when set, is a scratch grid for showing a shape before it is placed */
function pxPut1(x, y, v){ const E = UI.px, g = E.wg || E.grid; if(x < 0 || y < 0 || x >= E.w || y >= E.h) return; const i = y*E.w + x;
  if(E.tool==='dither' && (x + y) % 2) return;
  if(E.tool==='shade'){ const cur = g[i]; if(cur < 0 || (E.shaded && E.shaded.has(i))) return; v = pxShadeIdx(cur, E.shadeDir); if(E.shaded) E.shaded.add(i); }
  g[i] = v; }
function pxPut(x, y, v){ const E = UI.px; pxPut1(x, y, v); if(E.mirror){ const mx = E.w - 1 - x; if(mx !== x) pxPut1(mx, y, v); } }
function pxDab(x, y, v){ const E = UI.px, n = E.brush || 1; if(n===1){ pxPut(x, y, v); return; } const r = (n - 1)/2, o = Math.floor(r);
  for(let dy = -o; dy < n - o; dy++) for(let dx = -o; dx < n - o; dx++){ if(n > 2 && (dx + o - r)**2 + (dy + o - r)**2 > (r + .35)**2) continue; pxPut(x + dx, y + dy, v); } }
function pxLine(a, b, v){ let x0 = a.x, y0 = a.y; const dx = Math.abs(b.x - x0), dy = -Math.abs(b.y - y0), sx = x0 < b.x ? 1 : -1, sy = y0 < b.y ? 1 : -1; let er = dx + dy;
  for(let n = 0; n < 600; n++){ pxDab(x0, y0, v); if(x0===b.x && y0===b.y) break; const e2 = 2*er; if(e2 >= dy){ er += dy; x0 += sx; } if(e2 <= dx){ er += dx; y0 += sy; } } }
function pxShape(tool, a, b, v){ const E = UI.px;
  if(tool==='line'){ pxLine(a, b, v); return; }
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  if(tool==='rect'){ for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){ if(E.solid || x===x0 || x===x1 || y===y0 || y===y1) pxDab(x, y, v); } return; }
  const cx = (x0 + x1)/2, cy = (y0 + y1)/2, rx = (x1 - x0)/2 + .5, ry = (y1 - y0)/2 + .5, inside = (x, y) => ((x - cx)/rx)**2 + ((y - cy)/ry)**2 <= 1;
  for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){ if(!inside(x, y)) continue; if(E.solid || !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1)) pxDab(x, y, v); } }
function pxFill(x, y, v){ const E = UI.px, w = E.w, g = E.grid, from = g[y*w + x]; if(from===v && E.tool!=='dither') return; const st = [[x, y]], seen = new Uint8Array(w*E.h);
  while(st.length){ const [cx, cy] = st.pop(); if(cx < 0 || cy < 0 || cx >= w || cy >= E.h) continue; const i = cy*w + cx; if(seen[i] || g[i] !== from) continue; seen[i] = 1;
    if(!(E.dither && (cx + cy) % 2)) g[i] = v; st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]); }
  if(E.mirror){ const mx = w - 1 - x; if(mx !== x && g[y*w + mx]===from){ const m = E.mirror; E.mirror = false; pxFill(mx, y, v); E.mirror = m; } } }
/* the shade brush: swap a pixel for the palette colour nearest in hue that is a step darker (or lighter) */
function pxLum(c){ return c[0]*.3 + c[1]*.59 + c[2]*.11; }
function pxShadeIdx(v, dir){ const a = pxGet(UI.px.id), rgb = a.pal.map(pxRGB), c = rgb[v]; if(!c) return v; const l = pxLum(c); let best = v, bs = 1e9;
  rgb.forEach((o, j) => { if(j===v) return; const lo = pxLum(o), d = (lo - l)*dir; if(d < 6) return; const ch = ((o[0] - lo) - (c[0] - l))**2 + ((o[1] - lo) - (c[1] - l))**2 + ((o[2] - lo) - (c[2] - l))**2, sc = Math.sqrt(ch)*1.3 + d*.7; if(sc < bs){ bs = sc; best = j; } });
  return best; }
const PX_SHAPES = { line:1, rect:1, oval:1 };
function pxStroke(c, start){
  const E = UI.px; if(!E || !c) return; const a = pxGet(E.id); if(!a) return; const v = E.tool==='eraser' ? -1 : E.col;
  if(E.tool==='hand'){ if(start){ E.panX = c.x + .5 - E.w/2; E.panY = c.y + .5 - E.h/2; pxClampPan(); } return; }
  if(E.tool==='pick'){ if(start){ const got = E.grid[c.y*E.w + c.x]; if(got >= 0){ E.col = got; E.tool = E.prevTool || 'pen'; } } return; }
  if(E.tool==='fill'){ if(start){ pxSnap(); E.dither = false; pxFill(c.x, c.y, v); pxCommit(); } return; }
  if(PX_SHAPES[E.tool]){ if(start){ E.sa = c; E.sb = c; } else if(E.sa) E.sb = c; return; }
  if(start){ pxSnap(); E.shaded = new Set(); E.last = c; pxDab(c.x, c.y, v); }
  else if(E.last){ pxLine(E.last, c, v); E.last = c; }
  E.dirty = true;
}
function pxEndStroke(){ const E = UI.px; if(!E) return; if(E.sa){ pxSnap(); pxShape(E.tool, E.sa, E.sb || E.sa, E.tool==='eraser' ? -1 : E.col); E.sa = E.sb = null; E.dirty = true; }
  if(E.dirty){ E.dirty = false; E.last = null; E.shaded = null; pxCommit(); } }
function pxUndo(){ const E = UI.px; if(!E || !E.undo.length) return; E.redo.push(E.grid.slice()); E.grid = E.undo.pop(); pxCommit(); }
function pxRedo(){ const E = UI.px; if(!E || !E.redo.length) return; E.undo.push(E.grid.slice()); E.grid = E.redo.pop(); pxCommit(); }
function pxFlip(){ const E = UI.px; pxSnap(); const g = E.grid.slice(); for(let y = 0; y < E.h; y++) for(let x = 0; x < E.w; x++) E.grid[y*E.w + x] = g[y*E.w + (E.w - 1 - x)]; pxCommit(); }
function pxShift(dx, dy){ const E = UI.px; pxSnap(); const g = E.grid.slice(); E.grid.fill(-1); for(let y = 0; y < E.h; y++) for(let x = 0; x < E.w; x++){ const nx = x + dx, ny = y + dy; if(nx >= 0 && ny >= 0 && nx < E.w && ny < E.h) E.grid[ny*E.w + nx] = g[y*E.w + x]; } pxCommit(); }
function pxShade(k){ const E = UI.px, a = pxGet(E.id), c = a.pal[E.col]; if(!c) return; const [r, g, b] = pxRGB(c); a.pal[E.col] = k > 0 ? pxToHex(r + (255 - r)*.18, g + (255 - g)*.18, b + (255 - b)*.18) : pxToHex(r*.82, g*.82, b*.82); pxSaveArt(a); }
function pxEditColour(add){ const E = UI.px, a = pxGet(E.id); if(add && a.pal.length >= PX_CH.length){ toast('That is as many colours as one piece can have.'); return; }
  openKeyboard({ title:add ? 'New colour (hex, like #e9623b)' : 'Change this colour (hex, like #e9623b)', value:add ? '#' : a.pal[E.col], max:9, min:4, ok:'Use', allowed:'#0123456789abcdefABCDEF', hint:'Every pixel in this colour changes with it',
    onOk:v => { const h = pxHex(v); if(!h){ toast('That is not a colour code. Try something like #e9623b.'); return; } if(add){ a.pal.push(h); E.col = a.pal.length - 1; } else a.pal[E.col] = h; pxSaveArt(a); } }); }
/* colour maths for the mixer and ramps */
function pxHSV(hex){ const [r, g, b] = pxRGB(hex).map(v => v/255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if(d){ h = mx===r ? ((g - b)/d) % 6 : mx===g ? (b - r)/d + 2 : (r - g)/d + 4; h *= 60; if(h < 0) h += 360; } return [h, mx ? d/mx : 0, mx]; }
function pxFromHSV(h, s, v){ h = ((h % 360) + 360) % 360; const c = v*s, x = c*(1 - Math.abs((h/60) % 2 - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return pxToHex((r + m)*255, (g + m)*255, (b + m)*255); }
/* a shading ramp from the chosen colour: shadows drift towards blue, highlights towards yellow, as painters do */
function pxRamp(){ const E = UI.px, a = pxGet(E.id), c = a.pal[E.col]; if(!c) return; const [h, s, v] = pxHSV(c), room = PX_CH.length - a.pal.length; if(room < 4){ toast('Not enough room in the palette for a ramp.'); return; }
  const toward = (h0, t, k) => { let d = ((t - h0 + 540) % 360) - 180; return h0 + d*k; };
  const ramp = [pxFromHSV(toward(h, 240, .22), Math.min(1, s*1.1 + .08), v*.42), pxFromHSV(toward(h, 240, .11), Math.min(1, s*1.05 + .04), v*.68),
    pxFromHSV(toward(h, 55, .1), s*.8, Math.min(1, v*1.18 + .05)), pxFromHSV(toward(h, 55, .2), s*.5, Math.min(1, v*1.32 + .12))];
  a.pal.push(...ramp.filter(x => !a.pal.includes(x))); pxSaveArt(a); toast('Added 2 shadows and 2 highlights for that colour.'); }
function pxDelete(){ const E = UI.px, L = pxLib(), i = L.findIndex(p => p.id===E.id); if(i < 0) return; L.splice(i, 1);
  if(G && G.ship) for(const c of G.ship.crew) if(c.skin===E.id) c.skin = null; saveProfile(); UI.px = null; if(L.length) pxOpenArt(L[Math.min(i, L.length - 1)].id); else { UI.screen = UI.pxBack || 'title'; } }
function pxDuplicate(){ const a = pxGet(UI.px.id); if(!a) return; pxCommit(); const b = JSON.parse(JSON.stringify(a)); b.id = pxId(); b.name = (a.name + ' copy').slice(0, 24); if(pxAdd(b)) pxOpenArt(b.id); }
function pxResize(w, h){ const a = pxGet(UI.px.id); pxCommit(); const g0 = pxDecode(a), bb = pxBBox(g0, a.w, a.h), g = new Int16Array(w*h).fill(-1), ox = Math.floor((w - bb.w)/2) - bb.x, oy = h - bb.h - bb.y;
  for(let y = 0; y < a.h; y++) for(let x = 0; x < a.w; x++){ const v = g0[y*a.w + x], nx = x + ox, ny = y + oy; if(v >= 0 && nx >= 0 && ny >= 0 && nx < w && ny < h) g[ny*w + nx] = v; }
  a.w = w; a.h = h; pxStore(a, g); pxSaveArt(a); pxOpenArt(a.id); }
/* scale the drawing up (every pixel becomes 2×2, ready for more detail) or down (each 2×2 becomes its commonest colour) */
function pxScale(up){ const a = pxGet(UI.px.id); pxCommit(); const g0 = pxDecode(a);
  if(up){ const w = a.w*2, h = a.h*2; if(w > PX_MAXSIDE || h > PX_MAXSIDE){ toast(`Too big: the most is ${PX_MAXSIDE} pixels a side.`); return; } const g = new Int16Array(w*h);
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) g[y*w + x] = g0[(y >> 1)*a.w + (x >> 1)]; a.w = w; a.h = h; pxStore(a, g); }
  else { const w = Math.max(4, Math.ceil(a.w/2)), h = Math.max(4, Math.ceil(a.h/2)), g = new Int16Array(w*h).fill(-1);
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const n = {}; for(const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]){ const sx = x*2 + dx, sy = y*2 + dy; if(sx < a.w && sy < a.h){ const v = g0[sy*a.w + sx]; n[v] = (n[v] || 0) + 1; } }
      let best = -1, bn = 0; for(const k in n){ const kv = +k, c = n[k] + (kv >= 0 ? .5 : 0); if(c > bn){ bn = c; best = kv; } } g[y*w + x] = best; }
    a.w = w; a.h = h; pxStore(a, g); }
  pxSaveArt(a); pxOpenArt(a.id); toast(`Now ${a.w}×${a.h}.`); }
function pxLooksHere(){ return (G && G.ship ? G.ship.crew.filter(c => c.owner==='p' && c.skin===UI.px?.id).map(c => c.name) : []); }

/* the canvas, drawn as one picture each frame */
const PXV = { c:null, w:0, h:0, chk:null };
function pxLive(E, grid, pal){ if(!PXV.c || PXV.w!==E.w || PXV.h!==E.h){ PXV.c = mkCanvas(E.w, E.h); PXV.w = E.w; PXV.h = E.h; }
  const g = PXV.c.getContext('2d'), im = g.createImageData(E.w, E.h), d = im.data, rgb = pal.map(pxRGB);
  for(let i = 0; i < grid.length; i++){ const v = grid[i]; if(v < 0 || !rgb[v]) continue; const c = rgb[v]; d[i*4] = c[0]; d[i*4 + 1] = c[1]; d[i*4 + 2] = c[2]; d[i*4 + 3] = 255; }
  g.putImageData(im, 0, 0); return PXV.c; }
function pxChecker(){ if(PXV.chk) return PXV.chk; const c = mkCanvas(24, 24), g = c.getContext('2d'); g.fillStyle = '#151b2e'; g.fillRect(0, 0, 24, 24); g.fillStyle = '#1c2440'; g.fillRect(0, 0, 12, 12); g.fillRect(12, 12, 12, 12); return PXV.chk = ctx.createPattern(c, 'repeat'); }
function pxDrawCanvas(E, a){
  const b = pxGridBox(), cs = b.cs; let grid = E.grid;
  if(E.sa){ E.wg = E.grid.slice(); pxShape(E.tool, E.sa, E.sb || E.sa, E.tool==='eraser' ? -1 : E.col); grid = E.wg; E.wg = null; }
  ctx.save(); ctx.fillStyle = '#080b16'; ctx.fillRect(PXG.x, PXG.y, PXG.w, PXG.h); ctx.beginPath(); ctx.rect(PXG.x, PXG.y, PXG.w, PXG.h); ctx.clip();
  ctx.fillStyle = pxChecker(); ctx.fillRect(b.x, b.y, b.gw, b.gh);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(pxLive(E, grid, a.pal), b.x, b.y, b.gw, b.gh);
  if(E.ref && E.refOn){ const r = E.ref, k = Math.min(b.gw/r.naturalWidth, b.gh/r.naturalHeight), rw = r.naturalWidth*k, rh = r.naturalHeight*k; ctx.imageSmoothingEnabled = true; ctx.globalAlpha = E.refA; ctx.drawImage(r, b.x + (b.gw - rw)/2, b.y + b.gh - rh, rw, rh); ctx.globalAlpha = 1; }
  ctx.imageSmoothingEnabled = true;
  if(cs >= 8){ const x0 = Math.max(0, Math.floor((PXG.x - b.x)/cs)), x1 = Math.min(E.w, Math.ceil((PXG.x + PXG.w - b.x)/cs)), y0 = Math.max(0, Math.floor((PXG.y - b.y)/cs)), y1 = Math.min(E.h, Math.ceil((PXG.y + PXG.h - b.y)/cs));
    ctx.strokeStyle = `rgba(255,255,255,${cs >= 16 ? .09 : .05})`; ctx.lineWidth = 1; ctx.beginPath(); for(let x = x0; x <= x1; x++){ ctx.moveTo(b.x + x*cs + .5, b.y + y0*cs); ctx.lineTo(b.x + x*cs + .5, b.y + y1*cs); } for(let y = y0; y <= y1; y++){ ctx.moveTo(b.x + x0*cs, b.y + y*cs + .5); ctx.lineTo(b.x + x1*cs, b.y + y*cs + .5); } ctx.stroke();
    if(cs >= 10){ ctx.strokeStyle = 'rgba(255,181,71,.14)'; ctx.beginPath(); for(let x = Math.ceil(x0/8)*8; x <= x1; x += 8){ ctx.moveTo(b.x + x*cs + .5, b.y + y0*cs); ctx.lineTo(b.x + x*cs + .5, b.y + y1*cs); } for(let y = Math.ceil(y0/8)*8; y <= y1; y += 8){ ctx.moveTo(b.x + x0*cs, b.y + y*cs + .5); ctx.lineTo(b.x + x1*cs, b.y + y*cs + .5); } ctx.stroke(); } }
  ctx.strokeStyle = hexA(C.amber, .6); ctx.lineWidth = 2; ctx.strokeRect(b.x - 1, b.y - 1, b.gw + 2, b.gh + 2);
  if(E.mirror){ ctx.strokeStyle = hexA(C.cyan, .7); ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(b.x + b.gw/2, b.y - 8); ctx.lineTo(b.x + b.gw/2, b.y + b.gh + 8); ctx.stroke(); ctx.setLineDash([]); }
  const hv = PTR[0].on ? pxCellAt(PTR[0]) : null;
  if(hv && E.tool!=='hand'){ const n = ['pen', 'eraser', 'dither', 'shade', 'line', 'rect', 'oval'].includes(E.tool) ? (E.brush || 1) : 1, o = Math.floor((n - 1)/2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(b.x + (hv.x - o)*cs + 1, b.y + (hv.y - o)*cs + 1, n*cs - 2, n*cs - 2); ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1; ctx.strokeRect(b.x + (hv.x - o)*cs - .5, b.y + (hv.y - o)*cs - .5, n*cs + 1, n*cs + 1); }
  ctx.restore();
  // a map of the whole piece when zoomed in
  if(b.gw > PXG.w + 2 || b.gh > PXG.h + 2){ const mk = Math.min(150/E.w, 150/E.h), mw = E.w*mk, mh = E.h*mk, mx = PXG.x + PXG.w - mw - 12, my = PXG.y + 12;
    ctx.fillStyle = 'rgba(4,6,12,.85)'; ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8); ctx.imageSmoothingEnabled = false; ctx.drawImage(PXV.c, mx, my, mw, mh); ctx.imageSmoothingEnabled = true;
    const vx = (PXG.x - b.x)/cs*mk, vy = (PXG.y - b.y)/cs*mk; ctx.strokeStyle = C.amber; ctx.lineWidth = 1.5; ctx.strokeRect(mx + Math.max(0, vx), my + Math.max(0, vy), Math.min(mw, PXG.w/cs*mk), Math.min(mh, PXG.h/cs*mk));
    region(mx - 4, my - 4, mw + 8, mh + 8, (x, y) => { E.panX = (x - mx)/mk - E.w/2; E.panY = (y - my)/mk - E.h/2; pxClampPan(); }, 'pxmap'); }
  region(PXG.x, PXG.y, PXG.w, PXG.h, (x, y) => { const c = pxCellAt({ x, y }); if(c){ pxStroke(c, true); pxEndStroke(); } }, 'pxgrid');
  return hv;
}
const PX_TOOLS = [['pen', 'Pen', 'B', 'Draw with the chosen colour. Drag to draw lines.'], ['eraser', 'Rubber', 'E', 'Make pixels see-through.'], ['fill', 'Fill', 'F', 'Fill an area of one colour.'],
  ['pick', 'Pick', 'I', 'Click a pixel to pick up its colour. (Alt-click picks with any tool.)'], ['hand', 'Hand', 'H', 'Drag to move round a zoomed-in canvas. Right-drag or hold Space with any tool.'],
  ['line', 'Line', 'L', 'Drag from one end to the other.'], ['rect', 'Box', 'R', 'Drag corner to corner. Solid fills it in.'], ['oval', 'Oval', 'O', 'Drag corner to corner for a circle or oval. Solid fills it in.'],
  ['dither', 'Dither', 'D', 'Paints every other pixel, in a checkerboard: the classic way to blend two colours.'], ['shade', 'Shade', 'S', 'Paint over pixels to swap each for the next darker colour of the same hue in your palette. Shift+S for lighter. Add a Ramp first.']];
function drawPixelStudio(){
  const E = UI.px, a = E && pxGet(E.id); if(!a){ if(pxLib().length) pxOpenArt(pxLib()[0].id); else { UI.screen = UI.pxBack || 'title'; } return; }
  label('Draw your own crew', 40, 52, C.muted, 'left', 14); T('Pixel Studio', 40, 96, { s:38, f:FD, w:700, c:C.amber });
  btn(1430, 34, 140, 50, UI.pxTarget ? 'Back' : 'Close', closePixelStudio, { s:17 }); btn(1300, 34, 118, 50, 'Help', () => { UI.pxHelp = true; }, { s:16, col:C.cyan });
  if(UI.pxTarget){ const nm = UI.pxTarget.name || 'them'; btn(970, 34, 316, 50, `Use this look for ${nm}`, () => { pxCommit(); pxAssign(UI.pxTarget, E.id); UI.pxReturnPick = null; UI.pxTarget = null; UI.screen = UI.pxBack || 'title'; toast(`${nm} has a new look.`); }, { fill:true, s:16, col:C.good }); }
  // library
  const L = pxLib(), per = 8, pages = Math.max(1, Math.ceil(L.length/per)); UI.pxPage = clamp(UI.pxPage || 0, 0, pages - 1);
  panel(28, 112, 284, 812, 10); label(`Your art · ${L.length}/${PX_MAX}`, 44, 140, C.muted, 'left', 13);
  const full = pxBytes()/PX_BUDGET; if(full > .5) T(`${Math.round(full*100)}% full`, 296, 140, { s:12, a:'right', c:full > .85 ? C.hostile : C.warn });
  btn(44, 154, 252, 40, '+ New canvas', () => { UI.pxChoose = 'new'; }, { s:15, col:C.good });
  L.slice(UI.pxPage*per, UI.pxPage*per + per).forEach((p, i) => { const tx = 44 + (i % 2)*130, ty = 206 + Math.floor(i/2)*150, on = p.id===E.id;
    rr(tx, ty, 122, 142, 8); ctx.fillStyle = on ? hexA(C.amber, .16) : 'rgba(6,9,18,.6)'; ctx.fill(); ctx.strokeStyle = on ? C.amber : 'rgba(120,135,170,.25)'; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
    try{ pxThumb(p, tx + 16, ty + 10, 90, 100); }catch(e){} T(p.name, tx + 61, ty + 124, { s:12, a:'center', c:on ? C.amber : C.ink, max:112 }); T(`${p.w}×${p.h}`, tx + 116, ty + 138, { s:9, a:'right', c:C.muted });
    region(tx, ty, 122, 142, () => { pxCommit(); pxOpenArt(p.id); }, 'pxlib:' + p.id); });
  if(pages > 1){ btn(44, 812, 60, 36, '‹', () => UI.pxPage--, { disabled:UI.pxPage <= 0, s:16 }); T(`${UI.pxPage + 1}/${pages}`, 170, 836, { s:13, a:'center', c:C.muted }); btn(236, 812, 60, 36, '›', () => UI.pxPage++, { disabled:UI.pxPage >= pages - 1, s:16 }); }
  btn(44, 858, 120, 40, 'Duplicate', pxDuplicate, { s:13 }); btn(176, 858, 120, 40, E.del ? 'Sure?' : 'Delete', () => { if(E.del) pxDelete(); else E.del = true; }, { s:13, col:C.hostile });
  // the canvas
  const hv = pxDrawCanvas(E, a);
  const zl = Math.round(pxCS(E)/Math.max(1, pxBase(E))*10)/10;
  btn(PXG.x, 908, 44, 34, '−', () => pxZoom(1/1.5), { s:18 }); btn(PXG.x + 50, 908, 64, 34, 'Fit', pxFit, { s:13, fill:(E.zoom || 1)===1 }); btn(PXG.x + 120, 908, 44, 34, '+', () => pxZoom(1.5), { s:18 });
  T(`${a.w}×${a.h}  ·  zoom ${zl}×${hv ? `  ·  ${hv.x + 1}, ${hv.y + 1}` : ''}`, PXG.x + 180, 931, { s:13, c:C.muted });
  if(!hv) T(MOB.touch ? 'Pinch to zoom · Hand to move' : 'Scroll to zoom · right-drag or Space to move', PXG.x + PXG.w, 931, { s:12, a:'right', c:C.muted });
  // right column
  const rx = 1018, rw = 552; panel(rx - 14, 112, rw + 28, 812, 10);
  btn(rx, 124, 300, 40, '', () => openKeyboard({ title:'Name this look', value:a.name, max:24, ok:'Save', onOk:v => { a.name = v.trim().slice(0, 24) || a.name; pxSaveArt(a); } }), { s:15 });
  T(a.name, rx + 14, 150, { s:17, f:FD, w:700, c:C.amber, max:250 }); T('✎', rx + 284, 150, { s:15, a:'right', c:C.muted });
  btn(rx + 310, 124, 116, 40, 'Size…', () => { UI.pxChoose = 'resize'; }, { s:14 }); tip(rx + 310, 124, 116, 40, 'Size', 'Change the canvas size, or scale the drawing up for more detail.');
  const used = pxLooksHere(); if(used.length) T(`Worn by ${used.join(', ')}`, rx + 440, 150, { s:12, c:C.good, max:110 });
  btn(rx, 172, 272, 40, '✏ Draw', () => { E.tab = 'draw'; }, { fill:E.tab==='draw', s:15 }); btn(rx + 280, 172, 272, 40, '🖼 Bring art in', () => { E.tab = 'in'; }, { fill:E.tab==='in', s:15, col:C.cyan });
  if(E.tab==='in') drawPxImport(E, a, rx, rw); else drawPxDraw(E, a, rx, rw);
  if(UI.pxChoose) drawPxChoose(E, a);
  if(UI.pxHelp) drawPxHelp();
}
function drawPxDraw(E, a, rx, rw){
  PX_TOOLS.forEach(([k, n, key, d], i) => { const x = rx + (i % 5)*111, y = 222 + Math.floor(i/5)*48; btn(x, y, 103, 42, n, () => { if(k==='pick' && E.tool!=='pick') E.prevTool = E.tool; E.tool = k; }, { fill:E.tool===k, s:14 }); tip(x, y, 103, 42, n, `${d} (key ${key})`); });
  label('Brush', rx, 342, C.muted, 'left', 13);
  [1, 2, 3, 5, 8].forEach((n, i) => btn(rx + 56 + i*48, 322, 42, 34, String(n), () => { E.brush = n; }, { fill:(E.brush || 1)===n, s:13 }));
  btn(rx + 306, 322, 116, 34, E.solid ? '■ Solid' : '□ Outline', () => { E.solid = !E.solid; }, { fill:E.solid, s:13 }); tip(rx + 306, 322, 116, 34, 'Solid', 'Whether Box and Oval are filled in. (key Q)');
  btn(rx + 430, 322, 122, 34, 'Mirror', () => { E.mirror = !E.mirror; }, { fill:E.mirror, s:13, col:C.cyan }); tip(rx + 430, 322, 122, 34, 'Mirror', 'Everything you draw on one side is copied to the other. Good for faces. (key M)');
  const acts = [['Undo', pxUndo, !E.undo.length], ['Redo', pxRedo, !E.redo.length], ['Flip', pxFlip], ['Outline', () => { pxSnap(); if(!pxOutline(E.grid, E.w, E.h, a.pal)) toast('Nothing to outline.'); pxCommit(); }], ['Clear', () => { pxSnap(); E.grid.fill(-1); pxCommit(); }]];
  acts.forEach(([n, f, dis], i) => btn(rx + i*111, 366, 103, 36, n, f, { s:13, disabled:!!dis, col:n==='Clear' ? C.hostile : C.amber }));
  label('Nudge', rx, 432, C.muted, 'left', 13); [['←', -1, 0], ['→', 1, 0], ['↑', 0, -1], ['↓', 0, 1]].forEach(([n, dx, dy], i) => btn(rx + 56 + i*50, 412, 44, 32, n, () => pxShift(dx, dy), { s:14 }));
  if(E.ref){ btn(rx + 270, 412, 140, 32, E.refOn ? 'Hide tracing' : 'Show tracing', () => { E.refOn = !E.refOn; }, { s:12, fill:E.refOn, col:C.cyan }); btn(rx + 418, 412, 134, 32, `See-through ${Math.round(E.refA*100)}%`, () => { const o = [.25, .45, .65, .85], i = o.indexOf(E.refA); E.refA = o[(i + 1) % o.length]; }, { s:12 }); }
  // palette
  label(`Colours · ${a.pal.length}/${PX_CH.length}`, rx, 470, C.muted, 'left', 13); const sw = 26, per2 = 19;
  a.pal.forEach((c, i) => { const sx = rx + (i % per2)*(sw + 3), sy = 480 + Math.floor(i/per2)*(sw + 3); ctx.fillStyle = c; ctx.fillRect(sx, sy, sw, sw);
    if(i===E.col){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(sx + 1.5, sy + 1.5, sw - 3, sw - 3); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(sx + 4, sy + 4, sw - 8, sw - 8); }
    region(sx, sy, sw, sw, () => { E.col = i; if(E.tool==='eraser' || E.tool==='pick' || E.tool==='hand') E.tool = 'pen'; }, 'pxcol:' + i); });
  const py = 480 + Math.ceil(Math.max(1, a.pal.length)/per2)*(sw + 3) + 4;
  [['Mixer', () => { E.mix = !E.mix; }, E.mix], ['+ Colour', () => pxEditColour(true)], ['Ramp', pxRamp], ['Lighter', () => pxShade(1)], ['Darker', () => pxShade(-1)]].forEach(([n, f, on], i) => btn(rx + i*111, py, 103, 34, n, f, { s:13, fill:!!on }));
  tip(rx + 222, py, 103, 34, 'Ramp', 'Adds two shadow and two highlight colours made from the chosen one, shifted in hue the way painters do. Then use the Shade brush.');
  let y = py + 46;
  if(E.mix){ drawPxMixer(E, a, rx, y); y += 168; }
  // preview, at game size
  const ph = Math.min(150, 916 - y - 16); if(ph < 70) return; label('In the game', rx, y + 6, C.muted, 'left', 13);
  rr(rx, y + 14, rw, ph, 8); ctx.fillStyle = 'rgba(6,9,18,.7)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,135,170,.25)'; ctx.lineWidth = 1; ctx.stroke();
  const pose = ['idle', 'walk0', 'idle', 'walk1', 'fight0', 'fight1'][Math.floor(performance.now()/260) % 6], dummy = { id:'pxprev', name:a.name, race:'human', owner:'p', skin:a.id }, sc = ph/150;
  try{ drawCrewSprite(rx + 60, y + 14 + ph*.68, 11*sc, dummy, { pose }); drawCrewSprite(rx + 160, y + 14 + ph*.62, 18*sc, dummy, { pose:'idle' }); drawPortrait(rx + 290, y + 14 + ph/2, Math.min(56, ph*.4), dummy, false);
    pxThumb(a, rx + 380, y + 22, 160, ph - 16); }catch(e){}
}
/* hue bar and a saturation/brightness square, editing the chosen palette colour */
const PXM = { hue:-1, sv:null, bar:null };
function drawPxMixer(E, a, x, y){
  const c = a.pal[E.col] || '#ffffff', [h, s, v] = E.mixHSV && E.mixFor===c ? E.mixHSV : pxHSV(c), S = 150;
  if(!PXM.bar){ PXM.bar = mkCanvas(24, S); const g = PXM.bar.getContext('2d'); for(let i = 0; i < S; i++){ g.fillStyle = pxFromHSV(i/S*360, 1, 1); g.fillRect(0, i, 24, 1); } }
  if(Math.round(h)!==PXM.hue){ PXM.hue = Math.round(h); PXM.sv = PXM.sv || mkCanvas(S, S); const g = PXM.sv.getContext('2d'); g.fillStyle = pxFromHSV(h, 1, 1); g.fillRect(0, 0, S, S);
    let gr = g.createLinearGradient(0, 0, S, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, S, S); }
  ctx.drawImage(PXM.sv, x, y); ctx.drawImage(PXM.bar, x + S + 12, y);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + s*S, y + (1 - v)*S, 6, 0, 7); ctx.stroke(); ctx.strokeRect(x + S + 10, y + h/360*S - 3, 28, 6);
  UI.pxMixBox = { sv:{ x, y, w:S, h:S }, bar:{ x:x + S + 12, y, w:24, h:S } };
  const set = (hh, ss, vv) => { const hex = pxFromHSV(hh, ss, vv); E.mixHSV = [hh, ss, vv]; E.mixFor = hex; a.pal[E.col] = hex; E.palDirty = true; };
  UI.pxMixSet = (p, part) => { const B = UI.pxMixBox[part]; if(!B) return; const hsv = E.mixHSV && E.mixFor===a.pal[E.col] ? E.mixHSV : pxHSV(a.pal[E.col]);
    if(part==='sv') set(hsv[0], clamp((p.x - B.x)/B.w, 0, 1), clamp(1 - (p.y - B.y)/B.h, 0, 1)); else set(clamp((p.y - B.y)/B.h, 0, .999)*360, hsv[1], hsv[2]); };
  region(x, y, S, S, (px, py) => { UI.pxMixSet({ x:px, y:py }, 'sv'); pxSaveArt(a); E.palDirty = false; }, 'pxsv'); region(x + S + 12, y, 24, S, (px, py) => { UI.pxMixSet({ x:px, y:py }, 'bar'); pxSaveArt(a); E.palDirty = false; }, 'pxhue');
  rr(x + S + 52, y, 120, 70, 8); ctx.fillStyle = a.pal[E.col]; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1; ctx.stroke();
  btn(x + S + 52, y + 80, 120, 34, a.pal[E.col], () => pxEditColour(false), { s:13 }); tip(x + S + 52, y + 80, 120, 34, 'Colour code', 'Type a colour code instead.');
  para('Drag in the square for shade and in the bar for hue. Every pixel in this colour changes with it.', x + S + 186, y + 8, 186, { s:12, lh:16, c:C.muted });
}
function drawPxImport(E, a, rx, rw){
  const O = pxImp(); let y = 230;
  label('From a picture', rx, y, C.muted, 'left', 13);
  btn(rx, y + 12, 360, 50, `🖼 Turn a picture into ${a.w}×${a.h} art`, () => pxPickPicture(), { s:15, col:C.cyan, fill:true });
  tip(rx, y + 12, 360, 50, 'Import picture', 'Makes a new piece from any picture at this canvas size. For more detail, pick a bigger size first (Size…).');
  btn(rx + 372, y + 12, 180, 50, 'Size…', () => { UI.pxChoose = 'resize'; }, { s:14 });
  const opt = [[`Colours: ${O.cols}`, () => { const o = [6, 8, 12, 16, 24, 32, 48], i = o.indexOf(O.cols); O.cols = o[(i + 1) % o.length]; }, false, 'How many colours the picture is cut down to. More is more detailed; fewer looks more like classic pixel art.'],
    [O.dither ? 'Dither: on' : 'Dither: off', () => { O.dither = !O.dither; }, O.dither, 'Blends colours with a fine checkerboard, for smooth gradients and photos.'],
    [O.outline ? 'Outline: on' : 'Outline: off', () => { O.outline = !O.outline; }, O.outline, 'Adds a dark one-pixel edge round the figure.'],
    [O.cut ? 'Cut out: on' : 'Cut out: off', () => { O.cut = !O.cut; }, O.cut, 'Takes away a plain background so only the character is left.']];
  opt.forEach(([n, f, on, d], i) => { btn(rx + i*139, y + 72, 131, 38, n, f, { s:13, fill:on }); tip(rx + i*139, y + 72, 131, 38, n, d); });
  y += 136; label('Trace over a picture', rx, y, C.muted, 'left', 13);
  btn(rx, y + 12, 272, 44, E.ref ? 'Change tracing picture' : 'Lay a picture over the canvas', () => pxPickPicture('ref'), { s:14, col:C.cyan });
  tip(rx, y + 12, 272, 44, 'Tracing', 'Shows a picture over your canvas, partly see-through, so you can draw over it by hand. It is not saved with the art.');
  if(E.ref){ btn(rx + 280, y + 12, 130, 44, E.refOn ? 'Hide' : 'Show', () => { E.refOn = !E.refOn; }, { s:14, fill:E.refOn }); btn(rx + 418, y + 12, 134, 44, 'Remove', () => { E.ref = null; E.refOn = false; }, { s:14, col:C.hostile }); }
  y += 76; label('With an AI', rx, y, C.muted, 'left', 13);
  btn(rx, y + 12, 272, 44, '🤖 Copy AI prompt', () => pxCopy(pxAIPrompt(a.w, a.h), 'Prompt copied. Paste it into an AI that can see pictures, with your picture attached.'), { s:15, col:C.violet || '#c48bff' });
  tip(rx, y + 12, 272, 44, 'Copy AI prompt', `Copies instructions for an AI (ChatGPT, Gemini, Claude...) to turn a picture into a ${a.w}×${a.h} crew member. Attach your picture, paste the prompt, then copy its whole reply and press Paste.`);
  btn(rx + 280, y + 12, 272, 44, '📋 Paste AI reply / code', pxPaste, { s:15, col:C.violet || '#c48bff' });
  const tipH = para(a.w*a.h > 64*64 ? 'AIs that write text lose track of very big grids. For big canvases, ask an AI that makes pictures for "pixel art of …, plain background", save it, then use Turn a picture into art.' : 'Tip: an AI that makes pictures can draw your character as pixel art too. Save that picture and use Turn a picture into art.', rx, y + 70, rw, { s:13, lh:18, c:C.muted, max:3 });
  y += Math.max(132, 84 + tipH); label('Share and start over', rx, y, C.muted, 'left', 13);
  btn(rx, y + 12, 272, 40, 'Copy share code', () => pxCopy(pxShareCode(a), `Code for "${a.name}" copied. Send it to a friend: they press Paste.`), { s:14 });
  btn(rx + 280, y + 12, 272, 40, 'Start from a crew look', () => { const c = (G && G.ship && pick(G.ship.crew.filter(o => o.owner==='p' && !o.drone))) || { id:'r' + Math.random(), name:'Crew', race:pick(Object.keys(DATA.races).filter(r => !DATA.races[r].drone && !DATA.races[r].secret)) }; const n = pxFromCrew(c, a.w, a.h); if(pxAdd(n)) pxOpenArt(n.id); }, { s:14 });
  y += 70; label('In the game', rx, y, C.muted, 'left', 13); const ph = 916 - y - 22;
  rr(rx, y + 12, rw, ph, 8); ctx.fillStyle = 'rgba(6,9,18,.7)'; ctx.fill(); ctx.strokeStyle = 'rgba(120,135,170,.25)'; ctx.lineWidth = 1; ctx.stroke();
  const pose = ['idle', 'walk0', 'idle', 'walk1', 'fight0', 'fight1'][Math.floor(performance.now()/260) % 6], dummy = { id:'pxprev', name:a.name, race:'human', owner:'p', skin:a.id };
  try{ drawCrewSprite(rx + 70, y + 12 + ph*.7, 13, dummy, { pose }); drawPortrait(rx + 220, y + 12 + ph/2, Math.min(60, ph*.42), dummy, false); pxThumb(a, rx + 320, y + 20, 220, ph - 16); }catch(e){}
}
function drawPxChoose(E, a){
  const mode = UI.pxChoose; ctx.fillStyle = 'rgba(4,6,12,.8)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { UI.pxChoose = null; });
  const w = 900, h = mode==='resize' ? 560 : 470, x = (W - w)/2, y = (H - h)/2; panel(x, y, w, h, 14); region(x, y, w, h, () => {});
  label(mode==='new' ? 'New canvas' : `Size of "${a.name}" · now ${a.w}×${a.h}`, x + 32, y + 44, C.amber, 'left', 18);
  T(mode==='new' ? 'Bigger canvases take more detail. Crew stand on the bottom row; tall shapes fit the ship best.' : 'Changing the size keeps the drawing as it is, feet on the floor. Scaling makes the drawing itself bigger or smaller.', x + 32, y + 76, { s:15, c:C.muted, max:w - 64 });
  PX_SIZES.forEach(([sw, sh, nm], i) => { const bx = x + 32 + (i % 3)*282, by = y + 100 + Math.floor(i/3)*96, on = mode==='resize' && sw===a.w && sh===a.h;
    btn(bx, by, 270, 84, '', () => { UI.pxChoose = null; if(mode==='new') pxNew(sw, sh); else if(!on) pxResize(sw, sh); }, { fill:on, s:14 });
    T(`${sw} × ${sh}`, bx + 20, by + 38, { s:22, f:FD, w:700, c:on ? '#1a1206' : C.amber }); T(nm, bx + 20, by + 64, { s:14, c:on ? '#1a1206' : C.muted });
    const k = 50/Math.max(sw, sh); ctx.strokeStyle = on ? '#1a1206' : hexA(C.cyan, .7); ctx.lineWidth = 1.5; ctx.strokeRect(bx + 230 - sw*k/2, by + 42 - sh*k/2, sw*k, sh*k); });
  if(mode==='resize'){ const by = y + h - 160; label('Scale the drawing', x + 32, by, C.muted, 'left', 13);
    btn(x + 32, by + 14, 400, 52, `Scale up ×2 → ${a.w*2}×${a.h*2}`, () => { UI.pxChoose = null; pxScale(true); }, { s:15, col:C.good, disabled:a.w*2 > PX_MAXSIDE || a.h*2 > PX_MAXSIDE });
    tip(x + 32, by + 14, 400, 52, 'Scale up', 'Every pixel becomes a 2×2 block: same picture, twice the pixels, ready for you to add detail.');
    btn(x + 444, by + 14, 400, 52, `Scale down ½ → ${Math.max(4, Math.ceil(a.w/2))}×${Math.max(4, Math.ceil(a.h/2))}`, () => { UI.pxChoose = null; pxScale(false); }, { s:15, disabled:a.w <= 8 || a.h <= 8 }); }
  btn(x + w - 182, y + h - 70, 150, 48, 'Cancel', () => { UI.pxChoose = null; }, { s:15 });
}
function drawPxHelp(){
  ctx.fillStyle = 'rgba(4,6,12,.84)'; ctx.fillRect(0, 0, W, H); region(0, 0, W, H, () => { UI.pxHelp = false; });
  const w = 1060, h = 720, x = (W - w)/2, y = (H - h)/2; panel(x, y, w, h, 14); label('Pixel Studio', x + 32, y + 44, C.amber, 'left', 18);
  T('Draw anyone you like, and any crew member can wear it.', x + 32, y + 80, { s:22, f:FD, w:700, max:w - 64 });
  const L = [['Start', 'Press + New canvas and pick a size. 32×48 is classic; 64×96 and up leave room for faces, folds and shading. Size… → Scale up ×2 turns a small drawing into a bigger one to add detail to.'],
    ['Draw', 'Pen, Rubber and Fill as you would expect. Line, Box and Oval: drag. Brush sizes 1 to 8. Mirror copies one side to the other. Dither paints a checkerboard to blend colours.'],
    ['Shade', 'Pick a colour and press Ramp: you get two shadows and two highlights. The Shade brush then darkens what you paint over (Shift+S lightens).'],
    ['Colours', 'Up to 62 per piece. Mixer edits the chosen colour by eye; every pixel in that colour changes with it.'],
    ['Move round', 'Scroll or pinch to zoom, right-drag, Space-drag or the Hand to move. The little map in the corner jumps you anywhere.'],
    ['Bring art in', 'Turn any picture into art (with colours, dithering and outline to taste), lay a picture over the canvas to trace by hand, or copy a prompt for an AI and paste its reply back.'],
    ['Wear it', 'Press 🎨 on any crew member (in the hangar, on Ship → Crew, or on their card) and pick a drawing.'],
    ['Keys', 'B pen · E rubber · F fill · I pick · H hand · L line · R box · O oval · D dither · S shade · Q solid · M mirror · [ ] brush · + − 0 zoom · Ctrl+Z undo']];
  let yy = y + 120; for(const [k, d] of L){ T(k, x + 32, yy + 18, { s:16, f:FD, w:700, c:C.cyan }); yy += Math.max(30, para(d, x + 190, yy, w - 230, { s:15, lh:20 })) + 12; }
  btn(x + w - 182, y + h - 70, 150, 48, 'Got it', () => { UI.pxHelp = false; }, { fill:true, s:16 });
}
/* paint by dragging, with mouse or touch (VR and gamepads paint a pixel per click through the grid region) */
(function(){ const cv = document.getElementById('game'); if(!cv) return;
  const toG = e => (typeof evGame==='function' ? evGame(e) : screenToGame(e.clientX, e.clientY)); let D = null, space = false; const touches = new Map();
  const busy = () => UI.screen!=='pixel' || (typeof KB!=='undefined' && KB.open) || UI.pxPick || UI.pxChoose || UI.pxHelp || !UI.px;
  const inMix = p => { const M = UI.pxMixBox; if(!M || !UI.px || !UI.px.mix || UI.px.tab!=='draw') return null; for(const k of ['sv', 'bar']){ const B = M[k]; if(p.x >= B.x - 4 && p.y >= B.y - 4 && p.x < B.x + B.w + 4 && p.y < B.y + B.h + 4) return k; } return null; };
  cv.addEventListener('pointerdown', e => { if(busy()) return; if(typeof laserPtr==='function' && laserPtr(e)) return; const p = toG(e), E = UI.px;
    const mk = inMix(p); if(mk){ e.preventDefault(); e.stopImmediatePropagation(); try{ cv.setPointerCapture(e.pointerId); }catch(er){} D = { id:e.pointerId, mix:mk }; UI.pxMixSet(p, mk); return; }
    if(!pxInView(p)) return; e.preventDefault(); e.stopImmediatePropagation(); try{ cv.setPointerCapture(e.pointerId); }catch(er){}
    if(e.pointerType==='touch'){ touches.set(e.pointerId, p); if(touches.size===2){   // second finger: undo the dab the first one made, and pinch instead
        if(D && D.paint){ if(E.dirty || E.sa){ E.sa = E.sb = null; E.dirty = false; if(E.undo.length) E.grid = E.undo.pop(); } }
        const [a, b] = [...touches.values()]; D = { pinch:true, d0:Math.hypot(a.x - b.x, a.y - b.y) || 1, z0:E.zoom || 1, m0:{ x:(a.x + b.x)/2, y:(a.y + b.y)/2 }, px:E.panX, py:E.panY }; return; } }
    if(E.tool==='hand' || e.button===1 || e.button===2 || space){ D = { id:e.pointerId, pan:true, p0:p, px:E.panX, py:E.panY }; return; }
    const c = pxCellAt(p); if(!c) return;
    if(e.altKey){ const got = E.grid[c.y*E.w + c.x]; if(got >= 0) E.col = got; return; }
    if(E.tool==='shade') E.shadeDir = e.shiftKey ? 1 : -1;
    D = { id:e.pointerId, paint:true }; pxStroke(c, true); }, true);
  cv.addEventListener('pointermove', e => { if(UI.screen!=='pixel' || !UI.px) return; const p = toG(e), E = UI.px;
    if(touches.has(e.pointerId)) touches.set(e.pointerId, p);
    if(D && D.pinch){ if(touches.size < 2) return; const [a, b] = [...touches.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = { x:(a.x + b.x)/2, y:(a.y + b.y)/2 };
      const want = clamp(D.z0*d/D.d0, 1, 40), f = want/(E.zoom || 1); if(Math.abs(f - 1) > .02) pxZoom(f, m); const cs = pxCS(E); E.panX -= (m.x - D.m0.x)/cs; E.panY -= (m.y - D.m0.y)/cs; D.m0 = m; pxClampPan(); e.stopImmediatePropagation(); return; }
    if(!D || D.id!==e.pointerId) return; e.stopImmediatePropagation();
    if(D.mix){ UI.pxMixSet(p, D.mix); return; }
    if(D.pan){ const cs = pxCS(E); E.panX = D.px - (p.x - D.p0.x)/cs; E.panY = D.py - (p.y - D.p0.y)/cs; pxClampPan(); return; }
    const c = pxCellAt(p) || (() => { const b = pxGridBox(); return { x:clamp(Math.floor((p.x - b.x)/b.cs), 0, E.w - 1), y:clamp(Math.floor((p.y - b.y)/b.cs), 0, E.h - 1) }; })(); pxStroke(c, false); }, true);
  const end = e => { touches.delete(e.pointerId); if(D && D.pinch){ if(!touches.size) D = null; e.stopImmediatePropagation(); return; }
    if(D && D.id===e.pointerId){ const d = D; D = null; e.stopImmediatePropagation(); if(d.mix){ const E = UI.px, a = E && pxGet(E.id); if(a && E.palDirty){ E.palDirty = false; pxSaveArt(a); } } else if(d.paint) pxEndStroke(); } };
  cv.addEventListener('pointerup', end, true); cv.addEventListener('pointercancel', end, true);
  cv.addEventListener('contextmenu', e => { if(UI.screen==='pixel') e.preventDefault(); });
  cv.addEventListener('wheel', e => { if(busy()) return; const p = toG(e); if(!pxInView(p)) return; e.preventDefault(); pxZoom(e.deltaY < 0 ? 1.25 : 1/1.25, p); }, { passive:false });
  window.addEventListener('keyup', e => { if(e.code==='Space') space = false; });
  window.addEventListener('keydown', e => { if(UI.screen!=='pixel' || (typeof KB!=='undefined' && KB.open) || !UI.px) return; const k = e.key.toLowerCase(), E = UI.px;
    if(UI.pxChoose || UI.pxHelp){ if(k==='escape'){ UI.pxChoose = null; UI.pxHelp = false; e.preventDefault(); e.stopImmediatePropagation(); } return; }
    if((e.ctrlKey || e.metaKey) && k==='z'){ e.preventDefault(); e.shiftKey ? pxRedo() : pxUndo(); return; } if((e.ctrlKey || e.metaKey) && k==='y'){ e.preventDefault(); pxRedo(); return; }
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    const stop = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if(e.code==='Space'){ space = true; stop(); return; }
    const m = { b:'pen', p:'pen', e:'eraser', f:'fill', g:'fill', i:'pick', h:'hand', l:'line', r:'rect', o:'oval', d:'dither', s:'shade' };
    if(m[k]){ if(k==='i' && E.tool!=='pick') E.prevTool = E.tool; E.tool = m[k]; if(k==='s') E.shadeDir = e.shiftKey ? 1 : -1; stop(); return; }
    if(k==='m'){ E.mirror = !E.mirror; stop(); return; } if(k==='q'){ E.solid = !E.solid; stop(); return; }
    if(k==='['){ const o = [1, 2, 3, 5, 8], i = o.indexOf(E.brush || 1); E.brush = o[Math.max(0, i - 1)]; stop(); return; }
    if(k===']'){ const o = [1, 2, 3, 5, 8], i = o.indexOf(E.brush || 1); E.brush = o[Math.min(o.length - 1, i + 1)]; stop(); return; }
    if(k==='+' || k==='='){ pxZoom(1.5, PTR[0]); stop(); return; } if(k==='-' || k==='_'){ pxZoom(1/1.5, PTR[0]); stop(); return; } if(k==='0'){ pxFit(); stop(); return; }
    if(k==='escape'){ stop(); closePixelStudio(); } }, true);
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
