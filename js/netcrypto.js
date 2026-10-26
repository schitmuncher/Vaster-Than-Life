'use strict';
/* =========================================================================
   Small crypto helpers for multiplayer, with no libraries:
   - SHA-256 and AES-GCM through the browser's Web Crypto.
   - BIP-340 Schnorr signatures on secp256k1 (what Nostr relays expect),
     written with BigInt. Signing is only needed a few times per session
     (lobby posts, scoreboard entries, a handful of connection messages).
   ========================================================================= */
const NC = (() => {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const subtle = () => (globalThis.crypto && globalThis.crypto.subtle) || null;
  const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  const unhex = h => { const o = new Uint8Array(h.length/2); for(let i=0;i<o.length;i++) o[i] = parseInt(h.substr(i*2, 2), 16); return o; };
  const cat = (...a) => { const o = new Uint8Array(a.reduce((t,x) => t + x.length, 0)); let k = 0; for(const x of a){ o.set(x, k); k += x.length; } return o; };
  const b64 = b => { let s = ''; for(const x of b) s += String.fromCharCode(x); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64url = s => b64(enc.encode(s)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const unb64url = s => dec.decode(unb64(s.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((s.length+3)%4)));
  async function sha256(data){ const b = typeof data==='string' ? enc.encode(data) : data; return new Uint8Array(await subtle().digest('SHA-256', b)); }
  const rand = n => { const b = new Uint8Array(n); globalThis.crypto.getRandomValues(b); return b; };

  /* ---------------- secp256k1 ---------------- */
  const P = 2n**256n - 2n**32n - 977n, N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
  const GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n, GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;
  const mod = (a, m=P) => { const r = a % m; return r >= 0n ? r : r + m; };
  function inv(a, m=P){ let [x, y, u, v] = [mod(a, m), m, 1n, 0n]; while(x !== 0n){ const q = y / x; [x, y, u, v] = [y - q*x, x, v - q*u, u]; } return mod(v, m); }
  function powm(b, e, m=P){ let r = 1n; b = mod(b, m); while(e > 0n){ if(e & 1n) r = r*b % m; b = b*b % m; e >>= 1n; } return r; }
  // Jacobian points [X, Y, Z]; Z = 0 is the point at infinity
  function dbl([X, Y, Z]){ if(Y === 0n || Z === 0n) return [0n, 1n, 0n];
    const A = X*X % P, B = Y*Y % P, C = B*B % P, D = mod(2n*(mod((X+B)*(X+B)) - A - C)), E = 3n*A % P, F = E*E % P;
    const X3 = mod(F - 2n*D), Y3 = mod(E*(D - X3) - 8n*C), Z3 = 2n*Y*Z % P; return [X3, Y3, Z3]; }
  function add(p1, p2){ if(p1[2] === 0n) return p2; if(p2[2] === 0n) return p1;
    const [X1, Y1, Z1] = p1, [X2, Y2, Z2] = p2, Z1Z1 = Z1*Z1 % P, Z2Z2 = Z2*Z2 % P;
    const U1 = X1*Z2Z2 % P, U2 = X2*Z1Z1 % P, S1 = Y1*Z2 % P * Z2Z2 % P, S2 = Y2*Z1 % P * Z1Z1 % P;
    if(U1 === U2) return S1 === S2 ? dbl(p1) : [0n, 1n, 0n];
    const H = mod(U2 - U1), I = (2n*H) ** 2n % P, J = H*I % P, r = mod(2n*(S2 - S1)), V = U1*I % P;
    const X3 = mod(r*r - J - 2n*V), Y3 = mod(r*(V - X3) - 2n*S1*J), Z3 = mod(((Z1+Z2)**2n - Z1Z1 - Z2Z2) * H); return [X3, Y3, Z3]; }
  function mul(k, pt=[GX, GY, 1n]){ let R = [0n, 1n, 0n], Q = pt; while(k > 0n){ if(k & 1n) R = add(R, Q); Q = dbl(Q); k >>= 1n; } return R; }
  function affine([X, Y, Z]){ if(Z === 0n) return null; const zi = inv(Z), z2 = zi*zi % P; return [X*z2 % P, Y*z2 % P * zi % P]; }
  const big = b => BigInt('0x' + (hex(b) || '0'));
  const bytes32 = n => unhex(n.toString(16).padStart(64, '0'));
  const TAGS = {};
  async function tagged(tag, ...msgs){ if(!TAGS[tag]) TAGS[tag] = await sha256(tag); return sha256(cat(TAGS[tag], TAGS[tag], ...msgs)); }
  function pubOf(skHex){ const d = big(unhex(skHex)); const pt = affine(mul(d)); return hex(bytes32(pt[0])); }
  async function sign(msgHex, skHex, auxBytes){
    const m = unhex(msgHex), d0 = big(unhex(skHex)); if(d0 <= 0n || d0 >= N) throw new Error('bad key');
    const Pp = affine(mul(d0)), d = (Pp[1] & 1n) ? N - d0 : d0, px = bytes32(Pp[0]);
    const a = auxBytes || rand(32), t = bytes32(d ^ big(await tagged('BIP0340/aux', a)));
    const k0 = mod(big(await tagged('BIP0340/nonce', t, px, m)), N); if(k0 === 0n) throw new Error('bad nonce');
    const R = affine(mul(k0)), k = (R[1] & 1n) ? N - k0 : k0, rx = bytes32(R[0]);
    const e = mod(big(await tagged('BIP0340/challenge', rx, px, m)), N);
    return hex(cat(rx, bytes32(mod(k + e*d, N))));
  }
  async function verify(sigHex, msgHex, pubHex){
    try{ const x = big(unhex(pubHex)); if(x >= P) return false; const y2 = mod(x*x % P * x + 7n), y0 = powm(y2, (P + 1n)/4n); if(y0*y0 % P !== y2) return false;
      const y = (y0 & 1n) ? P - y0 : y0, s_ = unhex(sigHex), r = big(s_.slice(0, 32)), s = big(s_.slice(32)); if(r >= P || s >= N) return false;
      const e = mod(big(await tagged('BIP0340/challenge', s_.slice(0, 32), unhex(pubHex), unhex(msgHex))), N);
      const R = affine(add(mul(s), mul(N - e, [x, y, 1n]))); return !!R && !(R[1] & 1n) && R[0] === r; }catch(e){ return false; }
  }
  function newKey(){ for(;;){ const k = rand(32), n = big(k); if(n > 0n && n < N) return hex(k); } }

  /* ---------------- Nostr events ---------------- */
  async function signEvent(tpl, skHex){
    const ev = { kind:tpl.kind, created_at:tpl.created_at || Math.floor(Date.now()/1000), tags:tpl.tags || [], content:tpl.content || '', pubkey:pubOf(skHex) };
    ev.id = hex(await sha256(JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content])));
    ev.sig = await sign(ev.id, skHex); return ev;
  }
  async function checkEvent(ev){ const id = hex(await sha256(JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content]))); return id === ev.id && verify(ev.sig, ev.id, ev.pubkey); }

  /* ---------------- AES-GCM with a key made from a room code ---------------- */
  const KEYS = {};
  async function roomKey(code){ if(!KEYS[code]) KEYS[code] = await subtle().importKey('raw', await sha256('vtl-room-key:' + code), 'AES-GCM', false, ['encrypt','decrypt']); return KEYS[code]; }
  async function seal(code, obj){ const iv = rand(12), ct = new Uint8Array(await subtle().encrypt({ name:'AES-GCM', iv }, await roomKey(code), enc.encode(JSON.stringify(obj)))); return b64(cat(iv, ct)); }
  async function open(code, s){ try{ const b = unb64(s); const pt = await subtle().decrypt({ name:'AES-GCM', iv:b.slice(0, 12) }, await roomKey(code), b.slice(12)); return JSON.parse(dec.decode(pt)); }catch(e){ return null; } }

  return { hex, unhex, b64, unb64, b64url, unb64url, sha256, rand, pubOf, sign, verify, newKey, signEvent, checkEvent, seal, open };
})();
