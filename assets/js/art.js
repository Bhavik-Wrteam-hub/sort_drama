/* ==========================================================================
   Spool — generated key art
   --------------------------------------------------------------------------
   Every poster, scene still, thumbnail and avatar in the prototype is drawn
   here as SVG: a graded backdrop, a light motif, backlit silhouettes, grain
   and a vignette. Output is a cached data: URL used in <img>, so each image
   rasterises once and scrolls cheaply. In production these are uploaded
   artwork; the art spec on each title only exists for the prototype.

   Art.poster(title)          2:3 key art
   Art.scene(title, ep, shot) 9:16 "video" frame for the player
   Art.wide(title)            16:9 banner / landscape thumbnail
   Art.thumb(video)           UGC thumbnail from a category preset
   Art.avatar(seed, opts)     1:1 portrait
   ========================================================================== */
(function (root) {
  "use strict";

  const cache = new Map();
  const f = n => Math.round(n * 10) / 10;

  function rng(seed) {
    let h = 2166136261;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hex(c) {
    c = c.replace("#", "");
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    const m = A.map((v, i) => Math.round(v + (B[i] - v) * t));
    return "#" + m.map(v => v.toString(16).padStart(2, "0")).join("");
  }

  /* ---------- figures ----------
     One bust, drawn once in a 392 x 518 local box (head top at 0,0), then
     placed with a transform. Hair variants change the outline only — every
     figure is a silhouette, so it reads from any angle. */
  const BUST = "M0,0c-44,0-70,34-70,80c0,30,8,56,22,74c4,12,10,24,18,30l0,22c-30,12-86,24-112,44c-36,26-52,120-54,268l392,0c-2,-148-18,-242-54,-268c-26,-20-82,-32-112,-44l0,-22c8,-6,14,-18,18,-30c14,-18,22,-44,22,-74c0,-46-26,-80-70,-80z";
  const HAIR = {
    long: "M0,-8c-58,0-88,40-86,96c2,60-10,110-40,150c30,8,70,4,96,-10l60,0c26,14,66,18,96,10c-30,-40-42,-90-40,-150c2,-56-28,-96-86,-96z",
    bob: "M0,-8c-58,0-86,40-84,96c1,34-4,56-14,72c22,6,48,2,66,-8l64,0c18,10,44,14,66,8c-10,-16-15,-38-14,-72c2,-56-26,-96-84,-96z",
    short: "M-72,74c-6,-52,22,-90,72,-90c50,0,80,38,72,90c-8,-26-26,-46-72,-46c-46,0-64,20-72,46z",
    bun: "M-26,-8a26,26,0,1,0,52,0a26,26,0,1,0,-52,0z M-72,74c-6,-52,22,-86,72,-86c50,0,80,34,72,86c-8,-26-26,-44-72,-44c-46,0-64,18-72,44z",
    cap: "M-80,52c0,-50,30,-74,80,-74c50,0,80,24,80,74l40,8c-10,10-40,10-60,6c-14,-30-34,-42-60,-42c-30,0-52,14-60,34z",
    none: ""
  };

  function figure(kind, cx, top, s, p, opt) {
    opt = opt || {};
    const hair = HAIR[opt.hair || (kind === "woman" ? "long" : kind === "man" ? "short" : "bob")] || "";
    const sw = 1 / s;
    const glow = opt.rim === false ? "" :
      '<g filter="url(#rimblur)" opacity="' + (opt.glow || 0.6) + '" fill="none" stroke="' + p[2] + '" stroke-width="' + f(16 * sw) + '">' +
      (hair ? '<path d="' + hair + '"/>' : "") + '<path d="' + BUST + '"/></g>';
    const rim = opt.rim === false ? "" :
      '<g fill="none" stroke="url(#rim)" stroke-width="' + f(5 * sw) + '">' +
      (hair ? '<path d="' + hair + '"/>' : "") + '<path d="' + BUST + '"/></g>';
    const fill = '<g fill="url(#figfill)">' + (hair ? '<path d="' + hair + '"/>' : "") + '<path d="' + BUST + '"/></g>';
    let extra = "";
    if (kind === "man" && opt.suit !== false) {
      extra += '<path d="M-30,206L0,292L30,206z" fill="' + mix(p[2], "#ffffff", .3) + '" opacity=".2"/>' +
        '<path d="M-7,214L7,214L11,284L0,298L-11,284z" fill="#030304"/>';
    }
    /* No earrings or necklace: in close-ups they read as a face. */
    return '<g transform="translate(' + f(cx) + "," + f(top) + ") scale(" + f(s * 1000) / 1000 + ')">' + glow + rim + fill + extra + "</g>";
  }

  /* ---------- motifs ---------- */
  const M = {
    bokeh(W, H, r, p) {
      let s = "";
      for (let i = 0; i < 20; i++) {
        const x = r() * W, y = r() * H * .72, rad = (10 + r() * 52) * W / 600;
        s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(rad) + '" fill="' + (i % 3 ? p[2] : "#fff6e8") + '" opacity="' + f(.08 + r() * .32) + '" filter="url(#blur)"/>';
      }
      for (let i = 0; i < 26; i++) {
        s += '<circle cx="' + f(r() * W) + '" cy="' + f(r() * H * .6) + '" r="' + f((1.5 + r() * 3) * W / 600) + '" fill="#fff" opacity="' + f(.2 + r() * .6) + '"/>';
      }
      return s;
    },
    city(W, H, r, p) {
      let s = "";
      const k = W / 600, base = H * .8;
      [[.62, .5, .28], [.82, .36, .5]].forEach(([depth, hmax, dark], li) => {
        let x = -10 - r() * 40;
        while (x < W) {
          const w = (34 + r() * 66) * k, h = H * (.12 + r() * hmax);
          const top = base - h * depth - (li ? 0 : H * .06);
          s += '<rect x="' + f(x) + '" y="' + f(top) + '" width="' + f(w) + '" height="' + f(H - top) + '" fill="' + mix(p[1], "#000000", .3 + dark) + '"/>';
          if (li === 1) {
            for (let wy = top + 10 * k; wy < base - 6 * k; wy += 13 * k) {
              for (let wx = x + 6 * k; wx < x + w - 8 * k; wx += 10 * k) {
                if (r() < .3) s += '<rect x="' + f(wx) + '" y="' + f(wy) + '" width="' + f(4 * k) + '" height="' + f(6 * k) + '" fill="' + p[2] + '" opacity="' + f(.25 + r() * .7) + '"/>';
              }
            }
          }
          x += w + (2 + r() * 8) * k;
        }
      });
      return s;
    },
    moon(W, H, r, p) {
      const cx = W * .7, cy = H * .2, R = W * .19;
      let s = '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R * 2.4) + '" fill="' + p[2] + '" opacity=".16" filter="url(#soft)"/>' +
        '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R) + '" fill="url(#orb)"/>';
      for (let i = 0; i < 5; i++) s += '<circle cx="' + f(cx - R * .5 + r() * R) + '" cy="' + f(cy - R * .5 + r() * R) + '" r="' + f(R * (.06 + r() * .14)) + '" fill="#000" opacity=".07"/>';
      let x = -30;
      const g = H * .86;
      while (x < W + 30) {
        const h = (70 + r() * 150) * H / 900, w = h * .42;
        s += '<path d="M' + f(x) + "," + f(g) + "L" + f(x + w / 2) + "," + f(g - h) + "L" + f(x + w) + "," + f(g) + 'z" fill="#040509"/>';
        x += (16 + r() * 22) * W / 600;
      }
      s += '<rect x="0" y="' + f(g - 2) + '" width="' + W + '" height="' + f(H - g + 2) + '" fill="#040509"/>';
      return s;
    },
    rain(W, H, r, p) {
      let s = '<circle cx="' + f(W * .18) + '" cy="' + f(H * .1) + '" r="' + f(W * .32) + '" fill="' + p[2] + '" opacity=".2" filter="url(#soft)"/>';
      for (let i = 0; i < 170; i++) {
        const x = r() * W * 1.2, y = r() * H, l = (18 + r() * 34) * H / 900;
        s += '<path d="M' + f(x) + "," + f(y) + "l" + f(-l * .22) + "," + f(l) + '" stroke="#e8f2ff" stroke-opacity="' + f(.06 + r() * .16) + '" stroke-width="' + f(.8 + r() * 1.1) + '"/>';
      }
      return s;
    },
    shards(W, H, r, p) {
      const cx = W * (.42 + r() * .16), cy = H * .3;
      let s = "", a = r() * .5;
      while (a < Math.PI * 2) {
        const b = a + .32 + r() * .5, R1 = W * (.5 + r() * .7), R2 = W * (.5 + r() * .7);
        s += '<path d="M' + f(cx) + "," + f(cy) + "L" + f(cx + Math.cos(a) * R1) + "," + f(cy + Math.sin(a) * R1) + "L" + f(cx + Math.cos(b) * R2) + "," + f(cy + Math.sin(b) * R2) +
          'z" fill="#fff" fill-opacity="' + f(.02 + r() * .09) + '" stroke="' + p[2] + '" stroke-opacity="' + f(.25 + r() * .4) + '" stroke-width="1.4"/>';
        a = b;
      }
      for (let i = 0; i < 14; i++) {
        const x = r() * W, y = r() * H * .7, z = (6 + r() * 16) * W / 600;
        s += '<path d="M' + f(x) + "," + f(y) + "l" + f(z) + "," + f(z * .4) + "l" + f(-z * .5) + "," + f(z) + 'z" fill="' + p[2] + '" opacity="' + f(.3 + r() * .5) + '"/>';
      }
      return s;
    },
    petals(W, H, r, p) {
      let s = '<circle cx="' + f(W * .5) + '" cy="' + f(H * .28) + '" r="' + f(W * .5) + '" fill="' + p[2] + '" opacity=".14" filter="url(#soft)"/>';
      for (let i = 0; i < 30; i++) {
        const x = r() * W, y = r() * H * .78, z = (.5 + r() * 1.1) * W / 600, rot = r() * 360;
        s += '<path d="M0,0c7,-10,22,-10,24,0c-2,9,-17,11,-24,0z" transform="translate(' + f(x) + "," + f(y) + ") rotate(" + f(rot) + ") scale(" + f(z) + ')" fill="' + (i % 4 ? p[2] : mix(p[2], "#ffffff", .45)) + '" opacity="' + f(.45 + r() * .5) + '"/>';
      }
      return s;
    },
    crown(W, H, r, p) {
      const cx = W * .5, y = H * .3, w = W * .52, h = H * .13;
      const pts = [[-w / 2, 0], [-w / 2, -h * .55], [-w / 4, -h * .1], [0, -h], [w / 4, -h * .1], [w / 2, -h * .55], [w / 2, 0]].map(([x, yy]) => f(cx + x) + "," + f(y + yy)).join(" ");
      let s = '<polygon points="' + pts + '" fill="' + p[2] + '" fill-opacity=".14" stroke="' + p[2] + '" stroke-width="' + f(12 * W / 600) + '" stroke-opacity=".5" filter="url(#blur)"/>' +
        '<polygon points="' + pts + '" fill="' + p[2] + '" fill-opacity=".1" stroke="' + p[2] + '" stroke-width="' + f(3.5 * W / 600) + '" stroke-linejoin="round"/>';
      [[-w / 2, -h * .55], [0, -h], [w / 2, -h * .55]].forEach(([x, yy]) => {
        s += '<circle cx="' + f(cx + x) + '" cy="' + f(y + yy) + '" r="' + f(9 * W / 600) + '" fill="' + mix(p[2], "#ffffff", .4) + '"/>';
      });
      for (let i = 0; i < 24; i++) s += '<circle cx="' + f(r() * W) + '" cy="' + f(r() * H * .55) + '" r="' + f((1 + r() * 2.6) * W / 600) + '" fill="' + p[2] + '" opacity="' + f(.3 + r() * .6) + '"/>';
      return s;
    },
    ring(W, H, r, p) {
      const cx = W * .5, cy = H * .36, R = W * .36;
      return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R) + '" fill="none" stroke="' + p[2] + '" stroke-width="' + f(14 * W / 600) + '" opacity=".45" filter="url(#blur)"/>' +
        '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R) + '" fill="none" stroke="' + mix(p[2], "#ffffff", .25) + '" stroke-width="' + f(3 * W / 600) + '"/>' +
        '<path d="M' + f(cx) + "," + f(cy - R - 26 * W / 600) + "l" + f(18 * W / 600) + "," + f(16 * W / 600) + "l" + f(-18 * W / 600) + "," + f(26 * W / 600) + "l" + f(-18 * W / 600) + "," + f(-26 * W / 600) + 'z" fill="#fff" opacity=".95"/>' +
        '<circle cx="' + f(cx) + '" cy="' + f(cy - R) + '" r="' + f(40 * W / 600) + '" fill="#fff" opacity=".35" filter="url(#blur)"/>';
    },
    blinds(W, H, r, p) {
      let s = "";
      for (let i = 0; i < 9; i++) {
        const y = H * (-.1 + i * .11), t = H * (.035 + r() * .02);
        s += '<path d="M0,' + f(y) + "L" + W + "," + f(y + H * .22) + "L" + W + "," + f(y + H * .22 + t) + "L0," + f(y + t) + 'z" fill="' + p[2] + '" opacity="' + f(.08 + r() * .1) + '"/>';
      }
      return s + '<rect width="' + W + '" height="' + H + '" fill="' + p[2] + '" opacity=".05"/>';
    },
    spot(W, H, r, p) {
      let s = '<path d="M' + f(W * .43) + ",0L" + f(W * .57) + ",0L" + f(W * .92) + "," + H + "L" + f(W * .08) + "," + H + 'z" fill="url(#cone)"/>';
      for (let i = 0; i < 46; i++) s += '<circle cx="' + f(W * .3 + r() * W * .4) + '" cy="' + f(r() * H * .8) + '" r="' + f((.8 + r() * 2.2) * W / 600) + '" fill="#fff" opacity="' + f(.08 + r() * .4) + '"/>';
      return s + '<ellipse cx="' + f(W * .5) + '" cy="' + f(H * .97) + '" rx="' + f(W * .5) + '" ry="' + f(H * .06) + '" fill="' + p[2] + '" opacity=".25" filter="url(#blur)"/>';
    },
    split(W, H, r, p) {
      return '<path d="M0,0L' + f(W * .64) + ",0L" + f(W * .36) + "," + H + "L0," + H + 'z" fill="' + p[2] + '" opacity=".16"/>' +
        '<path d="M' + f(W * .64) + ",0L" + f(W * .36) + "," + H + '" stroke="' + p[2] + '" stroke-width="' + f(10 * W / 600) + '" opacity=".4" filter="url(#blur)"/>' +
        '<path d="M' + f(W * .64) + ",0L" + f(W * .36) + "," + H + '" stroke="' + mix(p[2], "#ffffff", .4) + '" stroke-width="' + f(2 * W / 600) + '"/>';
    },
    sun(W, H, r, p) {
      const cx = W * .5, cy = H * .42, R = W * .32;
      let s = '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R * 1.6) + '" fill="' + p[2] + '" opacity=".2" filter="url(#soft)"/>' +
        '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R) + '" fill="url(#orb)"/>';
      for (let i = 0; i < 6; i++) {
        const y = cy + R * (.12 + i * .15), hh = R * (.03 + i * .018);
        s += '<rect x="' + f(cx - R - 4) + '" y="' + f(y) + '" width="' + f(R * 2 + 8) + '" height="' + f(hh) + '" fill="' + p[1] + '"/>';
      }
      return s + '<rect x="0" y="' + f(cy + R * .98) + '" width="' + W + '" height="' + f(H) + '" fill="' + mix(p[1], "#000000", .35) + '"/>';
    },
    lanterns(W, H, r, p) {
      let s = "";
      for (let i = 0; i < 15; i++) {
        const w = (14 + r() * 26) * W / 600, h = w * 1.25, x = r() * W, y = r() * H * .62;
        s += '<rect x="' + f(x - w) + '" y="' + f(y - h) + '" width="' + f(w * 3) + '" height="' + f(h * 3) + '" rx="' + f(w) + '" fill="' + p[2] + '" opacity=".2" filter="url(#blur)"/>' +
          '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" rx="' + f(w * .3) + '" fill="' + mix(p[2], "#ffffff", r() * .3) + '" opacity="' + f(.65 + r() * .35) + '"/>' +
          '<rect x="' + f(x + w * .2) + '" y="' + f(y + h * .82) + '" width="' + f(w * .6) + '" height="' + f(h * .12) + '" fill="#000" opacity=".35"/>';
      }
      return s;
    },
    road(W, H, r, p) {
      const vy = H * .5, vx = W * .5;
      let s = '<rect x="0" y="' + f(vy - H * .2) + '" width="' + W + '" height="' + f(H * .2) + '" fill="url(#horizon)"/>';
      let x = 0;
      while (x < W) {
        const w = (40 + r() * 90) * W / 600, h = (20 + r() * 70) * H / 900;
        s += '<path d="M' + f(x) + "," + f(vy) + "L" + f(x + w / 2) + "," + f(vy - h) + "L" + f(x + w) + "," + f(vy) + 'z" fill="' + mix(p[0], "#000000", .5) + '"/>';
        x += w * .7;
      }
      s += '<path d="M0,' + f(vy) + "L" + W + "," + f(vy) + "L" + W + "," + H + "L0," + H + 'z" fill="#060608"/>' +
        '<path d="M' + f(vx - 4) + "," + f(vy) + "L" + f(vx + 4) + "," + f(vy) + "L" + f(W * .95) + "," + H + "L" + f(W * .05) + "," + H + 'z" fill="#101014"/>' +
        '<path d="M' + f(vx - 4) + "," + f(vy) + "L" + f(W * .05) + "," + H + "M" + f(vx + 4) + "," + f(vy) + "L" + f(W * .95) + "," + H + '" stroke="' + p[2] + '" stroke-opacity=".7" stroke-width="2"/>';
      for (let i = 0; i < 7; i++) {
        const t1 = Math.pow(i / 7, 1.8), t2 = Math.pow((i + .45) / 7, 1.8);
        const y1 = vy + (H - vy) * t1, y2 = vy + (H - vy) * t2;
        s += '<path d="M' + f(vx) + "," + f(y1) + "L" + f(vx) + "," + f(y2) + '" stroke="#fff3c4" stroke-opacity=".75" stroke-width="' + f(1 + t2 * 7) + '"/>';
      }
      return s + '<circle cx="' + f(vx) + '" cy="' + f(vy) + '" r="' + f(W * .1) + '" fill="' + p[2] + '" opacity=".55" filter="url(#soft)"/>';
    },
    curtain(W, H, r, p) {
      let s = "";
      [[0, W * .3], [W * .7, W]].forEach(([a, b]) => {
        const n = 6, w = (b - a) / n;
        for (let i = 0; i < n; i++) s += '<rect x="' + f(a + i * w) + '" y="0" width="' + f(w + 1) + '" height="' + H + '" fill="url(#fold)"/>';
      });
      let v = "M0,0L" + W + ",0L" + W + "," + f(H * .07);
      const sc = 8;
      for (let i = sc; i > 0; i--) v += "Q" + f(W * (i - .5) / sc) + "," + f(H * .13) + "," + f(W * (i - 1) / sc) + "," + f(H * .07);
      s += '<path d="' + v + 'z" fill="' + mix(p[1], "#000000", .2) + '"/>';
      return s + '<ellipse cx="' + f(W * .5) + '" cy="' + f(H * .45) + '" rx="' + f(W * .3) + '" ry="' + f(H * .3) + '" fill="' + p[2] + '" opacity=".22" filter="url(#soft)"/>';
    },
    mountains(W, H, r, p) {
      let s = '<circle cx="' + f(W * .66) + '" cy="' + f(H * .34) + '" r="' + f(W * .14) + '" fill="url(#orb)"/>' +
        '<circle cx="' + f(W * .66) + '" cy="' + f(H * .34) + '" r="' + f(W * .3) + '" fill="' + p[2] + '" opacity=".22" filter="url(#soft)"/>';
      [[.48, .28, .3], [.6, .2, .52], [.72, .14, .78]].forEach(([y0, amp, dk]) => {
        let d = "M0," + H + "L0," + f(H * y0);
        let x = 0;
        while (x < W) { x += (40 + r() * 80) * W / 600; d += "L" + f(x) + "," + f(H * (y0 - r() * amp * .5)); x += (30 + r() * 60) * W / 600; d += "L" + f(x) + "," + f(H * (y0 + r() * .04)); }
        s += '<path d="' + d + "L" + W + "," + H + 'z" fill="' + mix(p[1], "#000000", dk) + '"/>';
      });
      return s;
    },
    confetti(W, H, r, p) {
      const cols = [p[2], "#ffffff", "#FF5C8A", "#5AD8FF", "#FFD24A", "#C9F04F"];
      let s = "";
      for (let i = 0; i < 52; i++) {
        const x = r() * W, y = r() * H * .82, z = (6 + r() * 12) * W / 600, c = cols[i % cols.length];
        s += r() < .5
          ? '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(z) + '" height="' + f(z * .45) + '" rx="1" fill="' + c + '" opacity="' + f(.6 + r() * .4) + '" transform="rotate(' + f(r() * 180) + " " + f(x) + " " + f(y) + ')"/>'
          : '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(z * .35) + '" fill="' + c + '" opacity="' + f(.6 + r() * .4) + '"/>';
      }
      return s;
    },
    plate(W, H, r, p) {
      const cx = W * .5, cy = H * .5, R = Math.min(W, H) * .36;
      let s = '<ellipse cx="' + f(cx + R * .08) + '" cy="' + f(cy + R * .12) + '" rx="' + f(R * 1.04) + '" ry="' + f(R) + '" fill="#000" opacity=".4" filter="url(#blur)"/>' +
        '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R) + '" fill="#F3EEE4"/>' +
        '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R * .74) + '" fill="#E7E0D3"/>' +
        '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(R * .52) + '" fill="' + p[2] + '"/>';
      for (let i = 0; i < 16; i++) {
        const a = r() * Math.PI * 2, d = r() * R * .45;
        s += '<circle cx="' + f(cx + Math.cos(a) * d) + '" cy="' + f(cy + Math.sin(a) * d) + '" r="' + f(R * (.03 + r() * .06)) + '" fill="' + (i % 3 ? "#3E8E3A" : "#FFF5D6") + '" opacity=".9"/>';
      }
      return s;
    },
    scanlines(W, H, r, p) {
      let s = '<rect width="' + W + '" height="' + H + '" fill="' + p[2] + '" opacity=".06"/>';
      for (let y = 0; y < H; y += 5) s += '<rect x="0" y="' + y + '" width="' + W + '" height="1.6" fill="#000" opacity=".22"/>';
      for (let i = 0; i < 8; i++) s += '<rect x="' + f(r() * W) + '" y="' + f(r() * H) + '" width="' + f(40 + r() * 140) + '" height="' + f(2 + r() * 5) + '" fill="' + p[2] + '" opacity="' + f(.15 + r() * .3) + '"/>';
      return s;
    },
    waves(W, H, r, p) {
      let s = "";
      for (let i = 0; i < 7; i++) {
        const y = H * (.25 + i * .09), a = (12 + r() * 20) * H / 900;
        let d = "M-20," + f(y);
        for (let x = -20; x <= W + 40; x += 60) d += "Q" + f(x + 30) + "," + f(y + (x / 60 % 2 ? a : -a)) + "," + f(x + 60) + "," + f(y);
        s += '<path d="' + d + '" fill="none" stroke="' + p[2] + '" stroke-opacity="' + f(.15 + i * .06) + '" stroke-width="2"/>';
      }
      return s;
    },
    mic(W, H, r, p) {
      const cx = W * .5;
      return M.spot(W, H, r, p) +
        '<rect x="' + f(cx - 3) + '" y="' + f(H * .42) + '" width="6" height="' + f(H * .5) + '" fill="#050506"/>' +
        '<rect x="' + f(cx - 16 * W / 600) + '" y="' + f(H * .34) + '" width="' + f(32 * W / 600) + '" height="' + f(64 * W / 600) + '" rx="' + f(16 * W / 600) + '" fill="#09090b" stroke="' + p[2] + '" stroke-opacity=".6" stroke-width="2"/>';
    }
  };

  /* ---------- composition ---------- */
  const SHOTS = {
    woman: (W, H) => [["woman", W * .5, H * .36, H / 900 * 1.2]],
    man: (W, H) => [["man", W * .5, H * .33, H / 900 * 1.24]],
    couple: (W, H) => [["man", W * .37, H * .3, H / 900 * 1.14], ["woman", W * .64, H * .41, H / 900 * 1.04]],
    rivals: (W, H) => [["man", W * .26, H * .36, H / 900 * 1.02], ["woman", W * .74, H * .36, H / 900 * 1.02], ["woman", W * .5, H * .42, H / 900 * 1.1]],
    trio: (W, H) => [["man", W * .22, H * .36, H / 900 * .95], ["man", W * .79, H * .38, H / 900 * .9], ["woman", W * .5, H * .43, H / 900 * 1.02]],
    close: (W, H, k) => [[k || "woman", W * .5, H * .27, H / 900 * 1.95]],
    over: (W, H, k) => [[k === "man" ? "woman" : "man", W * .56, H * .3, H / 900 * 1.08], [k || "woman", W * .1, H * .52, H / 900 * 2.4]],
    far: (W, H, k) => [[k || "woman", W * .5, H * .64, H / 900 * .5]],
    none: () => []
  };

  function defs(W, H, p, spec) {
    const gx = spec.glow ? spec.glow[0] : .5, gy = spec.glow ? spec.glow[1] : .32;
    const b = W / 60;
    return "<defs>" +
      '<linearGradient id="bg" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset=".58" stop-color="' + p[1] + '"/><stop offset="1" stop-color="' + mix(p[0], "#000000", .55) + '"/></linearGradient>' +
      '<radialGradient id="glow" cx="' + gx + '" cy="' + gy + '" r=".62"><stop offset="0" stop-color="' + p[2] + '" stop-opacity=".95"/><stop offset=".32" stop-color="' + p[2] + '" stop-opacity=".34"/><stop offset="1" stop-color="' + p[2] + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="orb" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="' + mix(p[2], "#ffffff", .45) + '"/><stop offset="1" stop-color="' + p[2] + '"/></radialGradient>' +
      '<radialGradient id="vig" cx=".5" cy=".45" r=".78"><stop offset=".52" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".66"/></radialGradient>' +
      '<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>' +
      '<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[2] + '" stop-opacity=".62"/><stop offset="1" stop-color="' + p[2] + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[2] + '" stop-opacity="0"/><stop offset="1" stop-color="' + p[2] + '" stop-opacity=".75"/></linearGradient>' +
      '<linearGradient id="fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + mix(p[1], "#000000", .7) + '"/><stop offset=".5" stop-color="' + mix(p[1], p[2], .25) + '"/><stop offset="1" stop-color="' + mix(p[1], "#000000", .7) + '"/></linearGradient>' +
      '<linearGradient id="figfill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#040405"/><stop offset=".72" stop-color="' + mix(p[0], "#000000", .62) + '"/><stop offset="1" stop-color="' + mix(p[1], "#000000", .42) + '"/></linearGradient>' +
      '<linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + p[2] + '" stop-opacity="0"/><stop offset=".55" stop-color="' + p[2] + '" stop-opacity=".1"/><stop offset="1" stop-color="' + mix(p[2], "#ffffff", .25) + '" stop-opacity=".95"/></linearGradient>' +
      '<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="' + f(b) + '"/></filter>' +
      '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="' + f(b * 3) + '"/></filter>' +
      '<filter id="rimblur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="' + f(900 / W * .9 * 100) / 100 + '" numOctaves="2" seed="' + (spec.seed || 3) + '" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>' +
      "</defs>";
  }

  function compose(spec, W, H, opt) {
    opt = opt || {};
    const p = spec.pal;
    const r = rng((spec.seed || "x") + ":" + (opt.key || ""));
    const motif = (opt.motif || spec.motif || "bokeh").split("+");
    let shot = opt.shot || spec.fig || "woman";
    const lead = spec.lead || (shot === "man" ? "man" : "woman");
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" preserveAspectRatio="xMidYMid slice">' +
      defs(W, H, p, Object.assign({}, spec, opt.glow ? { glow: opt.glow } : {})) +
      '<rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#glow)"/>';
    motif.forEach(m => { if (M[m]) s += M[m](W, H, r, p); });
    // wide frames: place portrait-scaled figures relative to height
    const figs = (SHOTS[shot] || SHOTS.none)(W, H, lead);
    figs.forEach(([kind, x, y, sc], i) => {
      const hair = spec.hair && kind === "woman" ? spec.hair : spec.hairMan && kind === "man" ? spec.hairMan : undefined;
      s += figure(kind, x, y, sc, p, { hair: i > 0 && spec.hair2 && kind === "woman" ? spec.hair2 : hair, glow: opt.rimGlow });
    });
    if (opt.front) s += opt.front(W, H, r, p);
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#fade)"/>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#vig)"/>' +
      '<rect width="' + W + '" height="' + H + '" filter="url(#grain)" opacity=".26" style="mix-blend-mode:overlay"/>' +
      "</svg>";
    return s;
  }

  /* Blob URLs keep the src short, so re-rendering a screen full of posters
     does not re-parse megabytes of markup. Data URLs are the fallback. */
  function url(key, build) {
    if (cache.has(key)) return cache.get(key);
    const svg = build();
    let u;
    try { u = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); }
    catch (e) { u = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }
    cache.set(key, u);
    return u;
  }

  /* ---------- UGC presets ---------- */
  const UGC = {
    comedy: { pal: ["#1a0f2e", "#40206e", "#ffd84d"], motif: "confetti", fig: "trio" },
    sketch: { pal: ["#2b1408", "#6b3312", "#ffb35c"], motif: "spot+confetti", fig: "couple" },
    dance: { pal: ["#160624", "#4a0f5c", "#ff5cc8"], motif: "spot", fig: "woman" },
    travel: { pal: ["#0b2233", "#1d5a6e", "#ffcf7a"], motif: "mountains", fig: "far" },
    food: { pal: ["#2a1608", "#5c2e10", "#e8752e"], motif: "plate", fig: "none" },
    vlog: { pal: ["#0d1a14", "#1f4a3a", "#ffd08a"], motif: "city", fig: "woman" },
    storytime: { pal: ["#1c0c14", "#4e1a33", "#ff8fb3"], motif: "bokeh", fig: "close" },
    fanedit: { pal: ["#14060c", "#5c0f26", "#ff4f6e"], motif: "shards", fig: "close" },
    theory: { pal: ["#050a12", "#132c48", "#7fc4ff"], motif: "blinds", fig: "over" },
    standup: { pal: ["#120a04", "#3a2108", "#ffc44d"], motif: "mic", fig: "none" },
    shortfilm: { pal: ["#06090f", "#1a2638", "#c8d8ff"], motif: "rain", fig: "far" },
    horror: { pal: ["#030504", "#0f1d14", "#9dff8a"], motif: "scanlines", fig: "far" },
    music: { pal: ["#08041a", "#251054", "#8c7cff"], motif: "waves+bokeh", fig: "woman" },
    beauty: { pal: ["#24100f", "#6b2f2a", "#ffc2a8"], motif: "bokeh", fig: "close" },
    gaming: { pal: ["#03080f", "#0c2440", "#4fe3ff"], motif: "scanlines+city", fig: "man" },
    behind: { pal: ["#0d0b08", "#2e2618", "#ffe0a3"], motif: "spot", fig: "trio" }
  };

  const AV = [
    ["#2a1a3a", "#6b3fa0", "#ffcf8a"], ["#0f2a2a", "#1f6b62", "#ffd9a0"], ["#2a0f16", "#7a2335", "#ffc0a8"],
    ["#101c33", "#2a4f8a", "#ffe0b0"], ["#2a1f0c", "#7a5520", "#fff0c8"], ["#14260f", "#3f6b2a", "#f8f0c0"],
    ["#2b1230", "#8a3a7a", "#ffd0e8"], ["#0c1f2b", "#21607a", "#c8f0ff"]
  ];

  const Art = {
    poster(t) {
      return url("p:" + t.id, () => compose(t.art, 600, 900, { key: "poster" }));
    },
    wide(t) {
      return url("w:" + t.id, () => {
        const shot = t.art.wideFig || (t.art.fig === "woman" || t.art.fig === "man" ? t.art.fig : t.art.fig);
        return compose(Object.assign({}, t.art, { glow: [.7, .4] }), 960, 540, { key: "wide", shot: shot });
      });
    },
    /* A 9:16 still standing in for a video frame. Shots rotate through the
       episode so a playing "video" cuts between angles like an edit would. */
    scene(t, ep, i) {
      const shots = t.art.shots || ["two", "close", "over", "closeM"];
      const pick = shots[((ep || 1) + (i || 0)) % shots.length];
      return url("s:" + t.id + ":" + ep + ":" + pick, () => {
        const r = rng(t.id + ep + pick);
        let shot = pick, lead = t.art.lead;
        if (pick === "two") shot = t.art.fig === "man" || t.art.fig === "woman" ? "couple" : t.art.fig;
        if (pick === "closeM") { shot = "close"; lead = t.art.lead === "man" ? "woman" : "man"; }
        const spec = Object.assign({}, t.art, { lead: lead, seed: (t.art.seed || t.id) + ep });
        return compose(spec, 540, 960, { key: "scene" + ep + pick, shot: shot, glow: [.25 + r() * .5, .18 + r() * .2] });
      });
    },
    thumb(v) {
      const spec = v.art || Object.assign({ seed: v.id }, UGC[v.cat] || UGC.vlog);
      const wide = v.orient === "landscape";
      return url("t:" + v.id, () => compose(Object.assign({ seed: v.id }, spec), wide ? 960 : 540, wide ? 540 : 960, { key: "thumb" }));
    },
    avatar(seed, opt) {
      opt = opt || {};
      const r = rng("av" + seed);
      const pal = opt.pal || AV[Math.floor(r() * AV.length)];
      const kind = opt.kind || (r() < .55 ? "woman" : "man");
      const hair = opt.hair || (kind === "woman" ? ["long", "bob", "bun"][Math.floor(r() * 3)] : ["short", "short", "cap"][Math.floor(r() * 3)]);
      return url("a:" + seed + ":" + kind + ":" + hair, () => {
        const W = 200, H = 200, p = pal;
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">' +
          defs(W, H, p, { glow: [.62, .3], seed: 4 }) +
          '<rect width="200" height="200" fill="url(#bg)"/><rect width="200" height="200" fill="url(#glow)"/>' +
          figure(kind, 100, 44, .34, p, { hair: hair, glow: .5 }) +
          '<rect width="200" height="200" fill="url(#vig)" opacity=".6"/></svg>';
      });
    },
    ugcPresets: UGC,
    mix: mix
  };

  root.Art = Art;
})(window);
