/* ==========================================================================
   Spool Studio — admin core
   --------------------------------------------------------------------------
   Shell (sidebar, top bar), hash router, shared components (page header,
   cards, stat tiles, tables, tabs, modal, drawer, toasts, command palette)
   and a small SVG chart kit that follows the dataviz rules:
   thin marks, 2px surface gaps, hairline grid, one axis, legend for 2+
   series, selective direct labels, hover tooltips, and a table view for
   every chart. Pages register with Admin.page(name, { title, render, mount }).
   ========================================================================== */
(function (root) {
  "use strict";
  const S = root.SPOOL;
  const { FMT, T, C, V } = S;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ic = (n, s, w) => root.ic(n, s, w);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  const PAGES = {};
  const ACT = {};
  const st = { region: "All", sel: new Set() };

  /* ---------------- small builders ---------------- */
  const UI = {
    ph(title, sub, acts, back) {
      return '<div class="ph"><div class="t">' + (back ? '<a class="backlink" href="#/' + back[0] + '">' + ic("back", 14, 2) + esc(back[1]) + "</a>" : "") +
        "<h1>" + title + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>" + (acts ? '<div class="acts">' + acts + "</div>" : "") + "</div>";
    },
    card(title, sub, body, o) {
      o = o || {};
      return '<section class="card' + (o.cls ? " " + o.cls : "") + '"' + (o.style ? ' style="' + o.style + '"' : "") + ">" +
        (title ? '<div class="ch"><div class="tt"><h3>' + title + "</h3>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>" + (o.acts ? '<div class="ca">' + o.acts + "</div>" : "") + "</div>" : "") +
        '<div class="cb' + (o.flush ? " flush" : "") + '">' + body + "</div>" + (o.foot ? '<div class="cf">' + o.foot + "</div>" : "") + "</section>";
    },
    stat(o) {
      const d = o.d ? '<div class="d">' + (o.dir ? '<span class="' + (o.good === false ? (o.dir === "up" ? "dn" : "up") : (o.dir === "up" ? "up" : "dn")) + '">' + ic(o.dir === "up" ? "trendup" : "trenddown", 13, 2) + " " + esc(o.d) + "</span>" : esc(o.d)) + (o.vs ? " · " + esc(o.vs) : "") + "</div>" : "";
      return '<div class="card stat"><div class="l">' + (o.icon ? ic(o.icon, 15) : "") + esc(o.l) + "</div>" + '<div class="v">' + o.v + "</div>" + d +
        (o.spark ? '<div class="sk">' + Charts.reg({ type: "spark", values: o.spark }) + "</div>" : "") + "</div>";
    },
    pill(s, extra) {
      const map = {
        Live: ["green", "dot", "Live"], Published: ["green", "dot", "Published"], Active: ["green", "dot", "Active"], Completed: ["green", "check", "Completed"], Approved: ["green", "check", "Approved"], Paid: ["green", "check", "Paid"], Shipped: ["green", "check", "Shipped"], Verified: ["green", "shieldc", "Verified"], Ready: ["green", "check", "Ready"], Greenlit: ["green", "clapper", "Greenlit"],
        Scheduled: ["blue", "calendar", "Scheduled"], Running: ["blue", "dot", "Running"], Voting: ["blue", "thumb", "Voting"], Shortlisted: ["violet", "star", "Shortlisted"], "In production": ["violet", "clapper", "In production"],
        Pending: ["amber", "clock", "Pending"], Processing: ["amber", "refresh", "Processing"], Review: ["amber", "eye", "In review"], "In review": ["amber", "eye", "In review"], "Needs changes": ["amber", "edit", "Needs changes"], "On hold": ["amber", "hourglass", "On hold"], "Refund review": ["amber", "hourglass", "Refund review"], "Delivery retried": ["amber", "refresh", "Delivery retried"], Draft: ["", "edit", "Draft"], Stopped: ["", "x", "Stopped"],
        Failed: ["red", "alert", "Failed"], Flagged: ["red", "flag", "Flagged"], Rejected: ["red", "x", "Rejected"], Banned: ["red", "ban", "Banned"], Refunded: ["", "refresh", "Refunded"], Chargeback: ["red", "alert", "Chargeback"], "Deletion requested": ["", "trash", "Deletion requested"], Paused: ["", "pause", "Paused"]
      };
      const m = map[s] || ["", "dot", s];
      return '<span class="pill ' + m[0] + (m[1] === "dot" && (s === "Live" || s === "Running") ? " live" : "") + '">' + (m[1] === "dot" ? '<span class="dot"></span>' : ic(m[1], 12, 2)) + esc(extra || m[2]) + "</span>";
    },
    poster(t, w) { return '<span class="pth" style="width:' + (w || 34) + 'px"><span class="poster' + (t.orient === "landscape" && w > 50 ? " wide" : "") + '"><img src="' + (t.orient === "landscape" && w > 50 ? Art.wide(t) : Art.poster(t)) + '" alt=""></span></span>'; },
    ava(seed, size, o) { return '<span class="ava" style="--s:' + (size || 32) + 'px"><img src="' + Art.avatar(seed, o) + '" alt=""></span>'; },
    avaC(c, size) { return UI.ava(c.id, size, { pal: c.pal, kind: c.kind, hair: c.hair }); },
    tog(on, act, label) { return '<button class="switch sm" role="switch" aria-checked="' + !!on + '"' + (act ? ' data-act="' + act + '"' : "") + (label ? ' aria-label="' + esc(label) + '"' : "") + "></button>"; },
    tabs(items, active, base) {
      return '<nav class="tabs">' + items.map(([k, n, cnt]) => '<a class="' + (k === active ? "on" : "") + '" href="#/' + base + (k ? "?tab=" + k : "") + '">' + n + (cnt != null ? '<span class="n">' + cnt + "</span>" : "") + "</a>").join("") + "</nav>";
    },
    segc(items, active, act) { return '<div class="segc">' + items.map(([k, n]) => '<button class="' + (k === active ? "on" : "") + '" data-act="' + act + ":" + k + '">' + n + "</button>").join("") + "</div>"; },
    chk(on, act) { return '<button class="chk' + (on ? " on" : "") + '" data-act="' + act + '" aria-pressed="' + !!on + '">' + ic("check", 12, 3) + "</button>"; },
    money(v) { return FMT.usd(v); },
    region(code) { return code === "All" ? "All regions" : (S.REGIONS[code] || {}).name || code; },
    modeLabel(m) { return { hybrid: "Coins + VIP + ads", ads: "Free with ads", coins: "Coins + VIP, no ads" }[m] || m; }
  };

  /* ---------------- tooltip ---------------- */
  const Tip = {
    show(x, y, title, rows) {
      const el = $("#tip");
      el.textContent = "";
      if (title) { const h = document.createElement("div"); h.className = "th"; h.textContent = title; el.appendChild(h); }
      rows.forEach(r => {
        const row = document.createElement("div"); row.className = "tr";
        if (r.color) { const k = document.createElement("i"); k.className = "k" + (r.box ? " box" : ""); k.style.background = r.color; row.appendChild(k); }
        const b = document.createElement("b"); b.textContent = r.value; row.appendChild(b);
        if (r.name) { const sp = document.createElement("span"); sp.textContent = r.name; row.appendChild(sp); }
        el.appendChild(row);
      });
      el.classList.add("on");
      const w = el.offsetWidth, h = el.offsetHeight;
      let left = x + 14, top = y - h - 10;
      if (left + w > window.innerWidth - 8) left = x - w - 14;
      if (top < 8) top = y + 16;
      el.style.left = left + "px"; el.style.top = top + "px";
    },
    hide() { $("#tip").classList.remove("on"); }
  };

  /* ---------------- chart kit ---------------- */
  const reg = new Map();
  let vid = 0;
  const fmtFn = f => f === "usd" ? (v => FMT.usdk(v)) : f === "usd2" ? (v => "$" + v.toFixed(3)) : f === "pct" ? (v => FMT.pct(v)) : f === "pct0" ? (v => Math.round(v * 100) + "%") : f === "int" ? (v => FMT.int(v)) : (v => FMT.n(v));
  function nice(max, n) {
    n = n || 4;
    const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    const step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
    const top = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
    return { top, ticks };
  }
  const dfmt = d => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const Charts = {
    reg(spec) { const id = "v" + (++vid); reg.set(id, spec); return '<div class="viz" data-viz="' + id + '"></div>'; },
    tblBtn(id) { return '<button class="tblbtn" data-act="vtbl:' + id + '">' + ic("list", 13) + "Table</button>"; },
    /* reg + header button pair, for cards */
    withTable(spec) { const id = "v" + (++vid); reg.set(id, spec); return { html: '<div class="viz" data-viz="' + id + '"></div>', btn: Charts.tblBtn(id), id }; },
    mountAll(scope) { $$("[data-viz]", scope).forEach(el => Charts.draw(el)); },
    draw(el) {
      const spec = reg.get(el.dataset.viz);
      if (!spec) return;
      const W = Math.max(120, el.clientWidth || el.parentNode.clientWidth || 300);
      const fn = Charts[spec.type];
      if (!fn) return;
      const keepTbl = el.classList.contains("show-tbl");
      el.innerHTML = fn(spec, W, el);
      el.innerHTML += '<div class="viztbl">' + Charts.table(spec) + "</div>";
      if (keepTbl) el.classList.add("show-tbl");
      if (Charts["bind_" + spec.type]) Charts["bind_" + spec.type](spec, el, W);
    },
    table(spec) {
      const f = fmtFn(spec.fmt);
      let head = [], rows = [];
      if (spec.type === "area") { head = ["Date", spec.name || "Value"]; rows = spec.labels.map((l, i) => [dfmt(l), f(spec.values[i])]); }
      else if (spec.type === "stack" || spec.type === "lines") { head = ["Date"].concat(spec.series.map(s => s.name)); rows = spec.labels.map((l, i) => [l instanceof Date ? dfmt(l) : l].concat(spec.series.map(s => f(s.values[i])))); }
      else if (spec.type === "cols") { head = [spec.xname || "Item", spec.name || "Value"]; rows = spec.labels.map((l, i) => [l, f(spec.values[i])]); }
      else if (spec.type === "hbars" || spec.type === "funnel" || spec.type === "stackbar") { head = ["Item", "Value"]; rows = spec.items.map(it => [it.label, f(it.value)]); }
      else if (spec.type === "spark") return "";
      return '<table class="tbl"><thead><tr>' + head.map((h, i) => '<th class="' + (i ? "r" : "") + '">' + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
        rows.map(r => "<tr>" + r.map((c, i) => '<td class="' + (i ? "r" : "") + '">' + esc(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
    },

    spark(spec, W) {
      const v = spec.values, H = 30, max = Math.max.apply(null, v), min = Math.min.apply(null, v);
      const x = i => 2 + i / (v.length - 1) * (W - 6), y = d => H - 3 - (d - min) / Math.max(1e-9, max - min) * (H - 8);
      const pts = v.map((d, i) => x(i).toFixed(1) + "," + y(d).toFixed(1)).join(" ");
      const lx = x(v.length - 1), ly = y(v[v.length - 1]);
      return '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true"><polyline points="' + pts + '" style="fill:none;stroke:var(--deemph);stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>' +
        '<circle cx="' + lx + '" cy="' + ly + '" r="4" style="fill:var(--s1);stroke:var(--surface);stroke-width:2"/></svg>';
    },

    area(spec, W) {
      const H = spec.height || 220, L = 46, R = 14, Tp = 10, B = 26;
      const v = spec.values, n = v.length, f = fmtFn(spec.fmt);
      const { top, ticks } = nice(Math.max.apply(null, v) * 1.05, 4);
      const x = i => L + i / (n - 1) * (W - L - R), y = d => Tp + (1 - d / top) * (H - Tp - B);
      let s = '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(spec.name || "chart") + '">';
      ticks.forEach(t => { s += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="tk" x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + f(t) + "</text>"; });
      const step = Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 80)));
      spec.labels.forEach((d, i) => { if ((i % step === 0 && n - 1 - i >= step * .7) || i === n - 1) s += '<text class="tk" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? "start" : i === n - 1 ? "end" : "middle") + '">' + dfmt(d) + "</text>"; });
      const line = v.map((d, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(d).toFixed(1)).join("");
      s += '<path d="' + line + "L" + x(n - 1) + "," + y(0) + "L" + x(0) + "," + y(0) + 'Z" style="fill:var(--s1);opacity:.1"/>';
      s += '<path d="' + line + '" style="fill:none;stroke:var(--s1);stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>';
      s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      s += '<text class="labv" x="' + (x(n - 1) - 6) + '" y="' + (y(v[n - 1]) - 10) + '" text-anchor="end">' + f(v[n - 1]) + "</text>";
      s += '<circle cx="' + x(n - 1) + '" cy="' + y(v[n - 1]) + '" r="4" class="dotx" style="fill:var(--s1)"/>';
      s += '<line class="xh" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '"/><circle class="hd" r="4.5" cx="-20" cy="-20" style="fill:var(--s1);stroke:var(--surface);stroke-width:2"/>';
      s += '<rect class="hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '"/></svg>';
      return s;
    },
    bind_area(spec, el, W) {
      const H = spec.height || 220, L = 46, R = 14, Tp = 10, B = 26, n = spec.values.length, f = fmtFn(spec.fmt);
      const { top } = nice(Math.max.apply(null, spec.values) * 1.05, 4);
      const svg = $("svg", el), hit = $(".hit", el), xh = $(".xh", el), hd = $(".hd", el);
      const move = e => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * (W / r.width);
        const i = Math.max(0, Math.min(n - 1, Math.round((px - L) / (W - L - R) * (n - 1))));
        const x = L + i / (n - 1) * (W - L - R), y = Tp + (1 - spec.values[i] / top) * (H - Tp - B);
        xh.setAttribute("x1", x); xh.setAttribute("x2", x); hd.setAttribute("cx", x); hd.setAttribute("cy", y);
        el.classList.add("hovering");
        Tip.show(e.clientX, e.clientY, dfmt(spec.labels[i]), [{ color: "var(--s1)", value: f(spec.values[i]), name: spec.name }]);
      };
      hit.addEventListener("pointermove", move);
      hit.addEventListener("pointerleave", () => { el.classList.remove("hovering"); Tip.hide(); hd.setAttribute("cx", -20); });
    },

    stack(spec, W) {
      const H = spec.height || 250, L = 50, R = spec.endLabels === false ? 12 : 96, Tp = 10, B = 26;
      const n = spec.labels.length, f = fmtFn(spec.fmt);
      const tot = spec.labels.map((_, i) => spec.series.reduce((a, s) => a + s.values[i], 0));
      const { top, ticks } = nice(Math.max.apply(null, tot) * 1.04, 4);
      const band = (W - L - R) / n, bw = Math.min(24, band - 2);
      const x = i => L + i * band + (band - bw) / 2, y = d => Tp + (1 - d / top) * (H - Tp - B);
      let s = '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(spec.name || "Stacked columns") + '">';
      ticks.forEach(t => { s += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="tk" x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + f(t) + "</text>"; });
      const step = Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 70)));
      spec.labels.forEach((d, i) => { if ((i % step === 0 && n - 1 - i >= step * .7) || i === n - 1) s += '<text class="tk" x="' + (x(i) + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + (d instanceof Date ? dfmt(d) : esc(d)) + "</text>"; });
      for (let i = 0; i < n; i++) {
        let acc = 0;
        s += '<g class="mk" data-i="' + i + '">';
        spec.series.forEach((se, k) => {
          const v = se.values[i], y0 = y(acc), y1 = y(acc + v);
          const isTop = k === spec.series.length - 1;
          const h = Math.max(0, y0 - y1 - (k ? 2 : 0));
          const yy = y1;
          if (isTop) {
            const r = Math.min(4, h, bw / 2);
            s += '<path d="M' + x(i) + "," + (yy + h) + "V" + (yy + r) + "Q" + x(i) + "," + yy + " " + (x(i) + r) + "," + yy + "H" + (x(i) + bw - r) + "Q" + (x(i) + bw) + "," + yy + " " + (x(i) + bw) + "," + (yy + r) + "V" + (yy + h) + 'Z" style="fill:' + se.color + '"/>';
          } else s += '<rect x="' + x(i) + '" y="' + yy + '" width="' + bw + '" height="' + h + '" style="fill:' + se.color + '"/>';
          acc += v;
        });
        s += "</g>";
      }
      s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      if (spec.endLabels !== false) {
        let acc = 0;
        const i = n - 1, pos = [];
        spec.series.forEach(se => { const v = se.values[i]; pos.push([se, y(acc + v / 2), v]); acc += v; });
        let last = Infinity;
        pos.forEach(([se, yy, v]) => {
          let ty = Math.min(yy + 4, last - 14);
          last = ty;
          s += '<line x1="' + (x(i) + bw + 3) + '" x2="' + (x(i) + bw + 9) + '" y1="' + yy + '" y2="' + (ty - 4) + '" style="stroke:var(--axis);stroke-width:1"/>' +
            '<text class="lab" x="' + (x(i) + bw + 12) + '" y="' + ty + '">' + esc(se.short || se.name) + " " + f(v) + "</text>";
        });
      }
      s += '<rect class="hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '"/></svg>';
      return '<div class="vleg">' + spec.series.map(se => '<span><i style="background:' + se.color + '"></i>' + esc(se.name) + "</span>").join("") + "</div>" + s;
    },
    bind_stack(spec, el, W) {
      const L = 50, R = spec.endLabels === false ? 12 : 96, n = spec.labels.length, f = fmtFn(spec.fmt);
      const svg = $("svg", el), hit = $(".hit", el), band = (W - L - R) / n;
      hit.addEventListener("pointermove", e => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * (W / r.width);
        const i = Math.max(0, Math.min(n - 1, Math.floor((px - L) / band)));
        $$(".mk", el).forEach(g => g.classList.toggle("dim", +g.dataset.i !== i));
        el.classList.add("hovering");
        const total = spec.series.reduce((a, s) => a + s.values[i], 0);
        Tip.show(e.clientX, e.clientY, (spec.labels[i] instanceof Date ? dfmt(spec.labels[i]) : spec.labels[i]) + " · " + f(total), spec.series.slice().reverse().map(s => ({ color: s.color, box: true, value: f(s.values[i]), name: s.name })));
      });
      hit.addEventListener("pointerleave", () => { el.classList.remove("hovering"); Tip.hide(); });
    },

    cols(spec, W) {
      const H = spec.height || 220, L = 44, R = 10, Tp = 22, B = 26;
      const v = spec.values, n = v.length, f = fmtFn(spec.fmt);
      const { top, ticks } = nice(Math.max.apply(null, v), 4);
      const band = (W - L - R) / n, bw = Math.min(24, band - 3);
      const x = i => L + i * band + (band - bw) / 2, y = d => Tp + (1 - d / top) * (H - Tp - B);
      let s = '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(spec.name || "Columns") + '">';
      ticks.forEach(t => { s += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="tk" x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + f(t) + "</text>"; });
      const lstep = Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 34)));
      for (let i = 0; i < n; i++) {
        const h = y(0) - y(v[i]), r = Math.min(4, h, bw / 2), xx = x(i), yy = y(v[i]);
        const em = spec.emphasis == null || spec.emphasis === i;
        s += '<path class="mk" data-i="' + i + '" d="M' + xx + "," + y(0) + "V" + (yy + r) + "Q" + xx + "," + yy + " " + (xx + r) + "," + yy + "H" + (xx + bw - r) + "Q" + (xx + bw) + "," + yy + " " + (xx + bw) + "," + (yy + r) + "V" + y(0) + 'Z" style="fill:' + (em ? "var(--s1)" : "var(--deemph)") + '"/>';
        if (i % lstep === 0 || i === n - 1 || i === spec.emphasis) s += '<text class="tk" x="' + (xx + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle"' + (i === spec.emphasis ? ' style="fill:var(--text);font-weight:700"' : "") + ">" + esc(spec.labels[i]) + "</text>";
        if (spec.label && spec.label.indexOf(i) >= 0) s += '<text class="labv" x="' + (xx + bw / 2) + '" y="' + (yy - 7) + '" text-anchor="middle">' + f(v[i]) + "</text>";
      }
      if (spec.annotate) {
        const a = spec.annotate, bx = x(a.i) + bw / 2, top2 = y(v[a.i]) - 22, ty = Math.max(Tp + 12, y(Math.max.apply(null, v.slice(a.i + 1).concat([0]))) - 34);
        const ax = bx + 10;
        s += '<line x1="' + bx + '" x2="' + bx + '" y1="' + (ty + 6) + '" y2="' + top2 + '" style="stroke:var(--text-3);stroke-width:1"/>' +
          '<text class="lab" x="' + ax + '" y="' + ty + '" style="fill:var(--text);font-weight:700">' + esc(a.t) + '</text><text class="lab" x="' + ax + '" y="' + (ty + 14) + '">' + esc(a.s) + "</text>";
      }
      s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      for (let i = 0; i < n; i++) s += '<rect class="hit" data-i="' + i + '" x="' + (L + i * band) + '" y="0" width="' + band + '" height="' + H + '"/>';
      return s + "</svg>";
    },
    bind_cols(spec, el) {
      const f = fmtFn(spec.fmt);
      $$(".hit", el).forEach(h => {
        h.addEventListener("pointermove", e => {
          const i = +h.dataset.i;
          $$(".mk", el).forEach(m => m.classList.toggle("dim", +m.dataset.i !== i));
          el.classList.add("hovering");
          Tip.show(e.clientX, e.clientY, (spec.xname ? spec.xname + " " : "") + spec.labels[i], [{ color: spec.emphasis == null || spec.emphasis === i ? "var(--s1)" : "var(--deemph)", box: true, value: f(spec.values[i]), name: spec.name }].concat(spec.notes && spec.notes[i] ? [{ value: spec.notes[i] }] : []));
        });
        h.addEventListener("pointerleave", () => { el.classList.remove("hovering"); Tip.hide(); });
      });
    },

    hbars(spec, W) {
      const f = fmtFn(spec.fmt), items = spec.items, LW = spec.labelW || 120, R = 64, rowH = 30;
      const max = Math.max.apply(null, items.map(i => i.value));
      const H = items.length * rowH + 6;
      let s = '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(spec.name || "Bars") + '">';
      items.forEach((it, k) => {
        const y = k * rowH + 6, w = Math.max(2, (W - LW - R) * it.value / max), bh = Math.min(16, rowH - 10);
        const r = Math.min(4, bh / 2, w);
        s += '<text class="lab" x="0" y="' + (y + bh / 2 + 4) + '">' + esc(it.label) + "</text>" +
          '<path class="mk" data-i="' + k + '" d="M' + LW + "," + y + "H" + (LW + w - r) + "Q" + (LW + w) + "," + y + " " + (LW + w) + "," + (y + r) + "V" + (y + bh - r) + "Q" + (LW + w) + "," + (y + bh) + " " + (LW + w - r) + "," + (y + bh) + "H" + LW + 'Z" style="fill:' + (it.color || "var(--s1)") + '"/>' +
          '<text class="labv" x="' + (LW + w + 8) + '" y="' + (y + bh / 2 + 4) + '">' + f(it.value) + "</text>" +
          '<rect class="hit" data-i="' + k + '" x="0" y="' + (y - 4) + '" width="' + W + '" height="' + rowH + '"/>';
      });
      return s + "</svg>";
    },
    bind_hbars(spec, el) {
      const f = fmtFn(spec.fmt);
      $$(".hit", el).forEach(h => {
        h.addEventListener("pointermove", e => {
          const it = spec.items[+h.dataset.i];
          $$(".mk", el).forEach(m => m.classList.toggle("dim", m.dataset.i !== h.dataset.i));
          el.classList.add("hovering");
          Tip.show(e.clientX, e.clientY, it.label, [{ color: it.color || "var(--s1)", box: true, value: f(it.value), name: spec.name }].concat(it.sub ? [{ value: it.sub }] : []));
        });
        h.addEventListener("pointerleave", () => { el.classList.remove("hovering"); Tip.hide(); });
      });
    },

    funnel(spec, W) {
      const items = spec.items, f = fmtFn(spec.fmt), LW = spec.labelW || 170, rowH = 40;
      const max = items[0].value, H = items.length * rowH;
      let s = '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Funnel">';
      items.forEach((it, k) => {
        const y = k * rowH + 4, bh = 22, w = Math.max(4, (W - LW - 110) * it.value / max), r = Math.min(4, w);
        s += '<text class="lab" x="0" y="' + (y + 15) + '">' + esc(it.label) + "</text>" +
          '<path class="mk" data-i="' + k + '" d="M' + LW + "," + y + "H" + (LW + w - r) + "Q" + (LW + w) + "," + y + " " + (LW + w) + "," + (y + r) + "V" + (y + bh - r) + "Q" + (LW + w) + "," + (y + bh) + " " + (LW + w - r) + "," + (y + bh) + "H" + LW + 'Z" style="fill:var(--o' + (k + 1) + ')"/>' +
          '<text class="labv" x="' + (LW + w + 8) + '" y="' + (y + 15) + '">' + f(it.value) + "</text>" +
          (k ? '<text class="tk" x="' + (LW + w + 8 + f(it.value).length * 7.4 + 8) + '" y="' + (y + 15) + '">' + Math.round(it.value / items[k - 1].value * 100) + "% of previous</text>" : "") +
          '<rect class="hit" data-i="' + k + '" x="0" y="' + (y - 6) + '" width="' + W + '" height="' + rowH + '"/>';
      });
      return s + "</svg>";
    },
    bind_funnel(spec, el) {
      const f = fmtFn(spec.fmt);
      $$(".hit", el).forEach(h => {
        h.addEventListener("pointermove", e => {
          const k = +h.dataset.i, it = spec.items[k];
          Tip.show(e.clientX, e.clientY, it.label, [{ color: "var(--o" + (k + 1) + ")", box: true, value: f(it.value), name: "viewers" }, { value: Math.round(it.value / spec.items[0].value * 100) + "%", name: "of the first stage" }]);
        });
        h.addEventListener("pointerleave", Tip.hide);
      });
    },

    stackbar(spec, W) {
      const items = spec.items, tot = items.reduce((a, b) => a + b.value, 0), H = 30, f = fmtFn(spec.fmt);
      let s = '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(spec.name || "Share") + '">';
      let x = 0;
      items.forEach((it, k) => {
        const w = Math.max(2, W * it.value / tot - (k < items.length - 1 ? 2 : 0));
        const first = k === 0, last = k === items.length - 1;
        s += '<rect class="mk" data-i="' + k + '" x="' + x + '" y="0" width="' + w + '" height="' + H + '" rx="' + (first || last ? 4 : 0) + '" style="fill:' + it.color + '"/>';
        if (first && !last) s += '<rect x="' + (x + w - 4) + '" y="0" width="4" height="' + H + '" style="fill:' + it.color + '"/>';
        if (last && !first) s += '<rect x="' + x + '" y="0" width="4" height="' + H + '" style="fill:' + it.color + '"/>';
        const txt = f(it.value);
        if (w > txt.length * 7.5 + 14) s += '<text x="' + (x + 8) + '" y="' + (H / 2 + 4) + '" style="fill:' + (it.ink || "#fff") + ';font-size:11.5px;font-weight:700;font-family:var(--f-ui)">' + txt + "</text>";
        s += '<rect class="hit" data-i="' + k + '" x="' + x + '" y="0" width="' + (w + 2) + '" height="' + H + '"/>';
        x += w + 2;
      });
      s += "</svg>";
      return s + '<div class="vleg" style="margin:10px 0 0">' + items.map(it => '<span><i style="background:' + it.color + '"></i>' + esc(it.label) + " <b style=\"color:var(--text)\">" + f(it.value) + "</b></span>").join("") + "</div>";
    },
    bind_stackbar(spec, el) {
      const f = fmtFn(spec.fmt);
      $$(".hit", el).forEach(h => {
        h.addEventListener("pointermove", e => {
          const it = spec.items[+h.dataset.i];
          $$(".mk", el).forEach(m => m.classList.toggle("dim", m.dataset.i !== h.dataset.i));
          el.classList.add("hovering");
          Tip.show(e.clientX, e.clientY, it.label, [{ color: it.color, box: true, value: f(it.value), name: spec.name }]);
        });
        h.addEventListener("pointerleave", () => { el.classList.remove("hovering"); Tip.hide(); });
      });
    },

    lines(spec, W) {
      const H = spec.height || 220, L = 50, R = 110, Tp = 12, B = 26;
      const n = spec.labels.length, f = fmtFn(spec.fmt);
      const all = spec.series.reduce((a, s) => a.concat(s.values), []);
      const minV = spec.zero === false ? Math.min.apply(null, all) * .9 : 0;
      const { top, ticks } = nice(Math.max.apply(null, all) * 1.06 - minV, 4);
      const x = i => L + i / (n - 1) * (W - L - R), y = d => Tp + (1 - (d - minV) / top) * (H - Tp - B);
      let s = '<svg height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(spec.name || "Lines") + '">';
      ticks.forEach(t => { s += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(t + minV) + '" y2="' + y(t + minV) + '"/><text class="tk" x="' + (L - 8) + '" y="' + (y(t + minV) + 4) + '" text-anchor="end">' + f(t + minV) + "</text>"; });
      const step = Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 70)));
      spec.labels.forEach((d, i) => { if ((i % step === 0 && n - 1 - i >= step * .7) || i === n - 1) s += '<text class="tk" x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="' + (i === n - 1 ? "end" : "middle") + '">' + (d instanceof Date ? dfmt(d) : esc(d)) + "</text>"; });
      const ends = [];
      spec.series.forEach(se => {
        s += '<path d="' + se.values.map((d, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(d).toFixed(1)).join("") + '" style="fill:none;stroke:' + se.color + ';stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>';
        ends.push([se, y(se.values[n - 1])]);
      });
      ends.sort((a, b) => a[1] - b[1]);
      let prev = -Infinity;
      ends.forEach(([se, yy]) => {
        const ty = Math.max(yy + 4, prev + 15); prev = ty;
        s += '<circle cx="' + x(n - 1) + '" cy="' + yy + '" r="4" class="dotx" style="fill:' + se.color + '"/><text class="lab" x="' + (x(n - 1) + 10) + '" y="' + ty + '"><tspan style="font-weight:700;fill:var(--text)">' + f(se.values[n - 1]) + "</tspan> " + esc(se.short || se.name) + "</text>";
      });
      s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
      s += '<line class="xh" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '"/>';
      s += '<rect class="hit" x="' + L + '" y="0" width="' + (W - L - R) + '" height="' + H + '"/></svg>';
      return '<div class="vleg">' + spec.series.map(se => '<span><i class="ln" style="background:' + se.color + '"></i>' + esc(se.name) + "</span>").join("") + "</div>" + s;
    },
    bind_lines(spec, el, W) {
      const L = 50, R = 110, n = spec.labels.length, f = fmtFn(spec.fmt);
      const svg = $("svg", el), hit = $(".hit", el), xh = $(".xh", el);
      hit.addEventListener("pointermove", e => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * (W / r.width);
        const i = Math.max(0, Math.min(n - 1, Math.round((px - L) / (W - L - R) * (n - 1))));
        const x = L + i / (n - 1) * (W - L - R);
        xh.setAttribute("x1", x); xh.setAttribute("x2", x);
        el.classList.add("hovering");
        Tip.show(e.clientX, e.clientY, spec.labels[i] instanceof Date ? dfmt(spec.labels[i]) : String(spec.labels[i]), spec.series.map(s => ({ color: s.color, value: f(s.values[i]), name: s.name })));
      });
      hit.addEventListener("pointerleave", () => { el.classList.remove("hovering"); Tip.hide(); });
    }
  };

  /* cohort heatmap: HTML grid on the sequential blue ramp */
  function heatmap(cohorts, weeks) {
    const ramp = ["--q1", "--q2", "--q3", "--q4", "--q5", "--q6", "--q7"];
    const light = document.documentElement.dataset.theme !== "dark";
    let h = '<div class="heat" style="grid-template-columns:96px 70px repeat(' + weeks + ',minmax(38px,1fr))"><div class="hh">Install week</div><div class="hh">Viewers</div>';
    for (let w = 0; w < weeks; w++) h += '<div class="hh c">W' + w + "</div>";
    cohorts.forEach(c => {
      h += '<div class="hh" style="color:var(--text);font-weight:650">' + esc(c.wk) + '</div><div class="hh">' + FMT.n(c.size) + "</div>";
      for (let w = 0; w < weeks; w++) {
        const v = c.r[w];
        if (v == null) { h += "<div></div>"; continue; }
        const k = w === 0 ? 6 : Math.max(0, Math.min(6, Math.round(v / .4 * 6)));
        const dark = light ? k >= 4 : k <= 3;
        h += '<div class="hc" data-tipt="' + esc(c.wk + " · week " + w) + '" data-tipv="' + Math.round(v * 100) + '% still watching" style="background:var(' + ramp[k] + ");color:" + (dark ? "#fff" : light ? "#0b0b0b" : "#0b0b0b") + '">' + Math.round(v * 100) + "%</div>";
      }
    });
    return h + '</div><div class="scale"><span>Fewer</span><span class="bar" style="background:linear-gradient(90deg,var(--q1),var(--q3),var(--q5),var(--q7))"></span><span>More viewers still watching</span></div>';
  }

  /* ---------------- modal, drawer, toast ---------------- */
  const Modal = {
    open(o) {
      const m = $("#modal");
      m.className = "modal" + (o.size ? " " + o.size : "");
      m.innerHTML = '<div class="mh"><div style="flex:1"><h3>' + o.title + "</h3>" + (o.sub ? "<p>" + o.sub + "</p>" : "") + '</div><button class="b icon sm ghost" data-act="mclose" aria-label="Close">' + ic("x", 18) + "</button></div>" +
        '<div class="mb">' + o.body + "</div>" + (o.foot ? '<div class="mf">' + o.foot + "</div>" : "");
      $("#ovl").classList.add("on");
      requestAnimationFrame(() => m.classList.add("on"));
      if (o.mount) o.mount(m);
      const f = $("input, textarea, select", m); if (f) setTimeout(() => f.focus(), 60);
    },
    close() { $("#modal").classList.remove("on"); if (!$("#drawer").classList.contains("on")) $("#ovl").classList.remove("on"); }
  };
  const Drawer = {
    open(o) {
      const d = $("#drawer");
      d.innerHTML = '<div class="dh"><h3>' + o.title + '</h3><button class="b icon sm ghost" data-act="dclose" aria-label="Close">' + ic("x", 18) + '</button></div><div class="db">' + o.body + "</div>" + (o.foot ? '<div class="df">' + o.foot + "</div>" : "");
      $("#ovl").classList.add("on");
      requestAnimationFrame(() => d.classList.add("on"));
      if (o.mount) o.mount(d);
      Charts.mountAll(d);
    },
    close() { $("#drawer").classList.remove("on"); if (!$("#modal").classList.contains("on")) $("#ovl").classList.remove("on"); }
  };
  function toast(msg, undo) {
    const t = document.createElement("div");
    t.className = "tst";
    t.innerHTML = ic("checkc", 18) + "<span>" + msg + "</span>" + (undo ? '<button type="button">Undo</button>' : "");
    if (undo) $("button", t).onclick = () => { undo(); t.remove(); };
    $("#toasts").appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; setTimeout(() => t.remove(), 320); }, 3600);
  }

  /* ---------------- command palette ---------------- */
  function palette() {
    if ($(".pal")) return;
    const items = [];
    S.SITEMAP.admin.forEach(g => g.items.forEach(([p, n, i]) => items.push({ g: "Go to", n, p: "#/" + p, i })));
    S.TITLES.forEach(t => items.push({ g: "Titles", n: t.name, p: "#/titles/" + t.id, i: "film", sub: t.kind }));
    S.USERS.slice(0, 20).forEach(u => items.push({ g: "Users", n: u.name, p: "#/users/" + u.id, i: "user", sub: u.email }));
    S.CREATORS.forEach(c => items.push({ g: "Creators", n: c.name, p: "#/creators?c=" + c.id, i: "users", sub: c.handle }));
    [["New title", "#/titles?new=1", "plus"], ["Upload episodes", "#/upload", "upload"], ["New experiment", "#/paywall-lab?new=1", "percent"], ["Send a push", "#/campaigns?compose=1", "megaphone"], ["Open the mobile prototype", "mobile.html", "phone"], ["Toggle theme", "theme", "moon"]]
      .forEach(([n, p, i]) => items.push({ g: "Actions", n, p, i }));
    const ov = document.createElement("div");
    ov.className = "ovl on"; ov.style.zIndex = 265;
    const box = document.createElement("div");
    box.className = "pal";
    box.innerHTML = '<span class="pi">' + ic("search", 18) + '</span><input placeholder="Search titles, users, creators, pages…" aria-label="Command palette"><div class="pl"></div>';
    document.body.appendChild(ov); document.body.appendChild(box);
    let sel = 0, list = [];
    const close = () => { ov.remove(); box.remove(); };
    const pick = it => { close(); if (it.p === "theme") ACT.theme(); else if (it.p.indexOf("mobile.html") === 0) window.open(it.p, "_blank"); else location.hash = it.p.slice(1); };
    const paint = () => {
      const q = $("input", box).value.toLowerCase();
      list = items.filter(it => !q || (it.n + " " + (it.sub || "") + " " + it.g).toLowerCase().indexOf(q) >= 0).slice(0, 40);
      sel = Math.min(sel, Math.max(0, list.length - 1));
      let g = "", h = "";
      list.forEach((it, k) => {
        if (it.g !== g) { g = it.g; h += '<div class="pg">' + esc(g) + "</div>"; }
        h += '<button class="po' + (k === sel ? " on" : "") + '" data-k="' + k + '">' + ic(it.i || "arrowr", 16) + esc(it.n) + (it.sub ? "<small>" + esc(it.sub) + "</small>" : "") + "</button>";
      });
      $(".pl", box).innerHTML = h || '<div class="pg">No matches</div>';
      $$(".po", box).forEach(b => b.onclick = () => pick(list[+b.dataset.k]));
    };
    ov.onclick = close;
    $("input", box).oninput = () => { sel = 0; paint(); };
    $("input", box).onkeydown = e => {
      if (e.key === "ArrowDown") { sel = Math.min(list.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === "Enter" && list[sel]) pick(list[sel]);
      else if (e.key === "Escape") close();
    };
    paint();
    $("input", box).focus();
  }

  /* ---------------- shell ---------------- */
  function badges() {
    return {
      moderation: [S.MOD_QUEUE.length + 27, "hot"],
      ugc: [S.VIDEOS.filter(v => ["review", "flagged", "needs-changes"].indexOf(v.status) >= 0).length, ""],
      creators: [S.PAYOUTS.filter(p => p.status === "Pending").length, ""],
      upload: [S.PIPELINE.filter(p => p.stage === "failed").length + " ⚠", "warn"],
      pilots: [S.TITLES.filter(t => t.kind === "pilot").length, ""],
      transactions: ["", ""]
    };
  }
  function renderSide(r) {
    const cur = r.parts[0] === "titles" && r.parts[1] ? "titles/heiress" : r.parts[0];
    const bd = badges();
    $("#side").innerHTML = '<a class="side-brand" href="#/dashboard"><span class="mark" style="--s:30px">' + brandMark(21) + '</span><span class="wordmark">spool</span><span class="ws">Studio</span></a>' +
      '<div class="side-org"><span class="ava" style="--s:28px;border-radius:8px"><img src="' + Art.poster(T.heiress) + '" alt=""></span><div><b>Spool Production</b>spool.tv · 9 regions</div><span class="dot" title="All systems normal"></span></div>' +
      '<nav class="side-nav">' + S.SITEMAP.admin.map(g => '<div class="side-g">' + g.g + "</div>" + g.items.filter(([p]) => p !== "titles/heiress").map(([p, n, i]) => {
        const k = p.split("/")[0];
        const b = bd[k];
        return '<a class="side-a' + (cur === p || cur === k ? " on" : "") + '" href="#/' + p + '" title="' + esc(n) + '">' + ic(i, 18) + "<span>" + esc(n) + "</span>" + (b && b[0] !== "" && b[0] !== 0 ? '<i class="n ' + b[1] + '">' + b[0] + "</i>" : "") + "</a>";
      }).join("")).join("") + "</nav>" +
      '<div class="side-foot"><a class="side-prev" href="mobile.html" target="_blank" rel="noopener">' + ic("phone", 18) + "<span>Open the app prototype<small>Same data, viewer side</small></span></a>" +
      '<div class="side-me">' + UI.ava("riya", 32, { kind: "woman", hair: "long", pal: ["#2a1a3a", "#6b3fa0", "#ffcf8a"] }) + '<div><b>Riya Desai</b>Owner</div><button class="ib2" data-act="logout" title="Sign out">' + ic("logout", 16) + "</button></div></div>";
  }
  function renderTop(r, page) {
    const crumbs = page.crumbs ? page.crumbs(r) : [[page.title ? page.title(r) : r.parts[0]]];
    $("#top").innerHTML = '<button class="ib2 burger" data-act="burger" aria-label="Menu">' + ic("menu", 20) + "</button>" +
      '<div class="crumbs"><a href="#/dashboard" class="cr-mid">Studio</a>' + crumbs.map((c, i) => { const last = i === crumbs.length - 1; return '<span class="' + (last ? "cr-last" : "cr-mid") + '">' + ic("fwd", 12) + (last ? "<b>" + esc(c[0]) + "</b>" : c[1] ? '<a href="#/' + c[1] + '">' + esc(c[0]) + "</a>" : "<span>" + esc(c[0]) + "</span>") + "</span>"; }).join("") + "</div>" +
      '<div class="sp"></div><button class="search" data-act="palette"><svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.8"/><path d="m20.2 20.2-4.4-4.4"/></svg><span>Search or jump to…</span><span class="kbd">⌘K</span></button>' +
      '<select class="regionpick" id="regionpick" aria-label="Region scope"><option value="All">All regions</option>' + Object.keys(S.REGIONS).map(k => '<option value="' + k + '"' + (st.region === k ? " selected" : "") + ">" + S.REGIONS[k].name + "</option>").join("") + "</select>" +
      '<span class="env"><i></i>Live</span>' +
      '<button class="ib2" data-act="notifs" aria-label="Notifications">' + ic("bell", 19) + '<i class="dot"></i></button>' +
      '<button class="ib2" data-act="theme" aria-label="Toggle theme">' + ic(document.documentElement.dataset.theme === "dark" ? "sun" : "moon", 18) + "</button>";
    $("#regionpick").value = st.region;
    $("#regionpick").onchange = e => { st.region = e.target.value; toast("Scope: " + UI.region(st.region) + " — every number on the page now uses this slice"); render(); };
  }

  /* ---------------- router ---------------- */
  function parse() {
    const h = (location.hash || "").replace(/^#\/?/, "") || "dashboard";
    const [path, qs] = h.split("?");
    return { path, parts: path.split("/").map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || "")) };
  }
  let lastPath = "";
  function render() {
    const r = parse();
    const page = PAGES[r.parts[0]] || PAGES.dashboard;
    Tip.hide();
    Modal.close(); Drawer.close();
    $("#bulk").classList.remove("on");
    if (r.parts[0] !== lastPath.split("/")[0]) st.sel = new Set();
    document.body.classList.toggle("bare", !!page.bare);
    renderSide(r);
    renderTop(r, page);
    const pg = $("#page");
    pg.innerHTML = page.render(r);
    pg.style.animation = "none"; void pg.offsetWidth; pg.style.animation = "";
    if (page.mount) page.mount(r, pg);
    Charts.mountAll(pg);
    $$("[data-tipt]", pg).forEach(el => {
      el.addEventListener("pointermove", e => Tip.show(e.clientX, e.clientY, el.dataset.tipt, [{ value: el.dataset.tipv }]));
      el.addEventListener("pointerleave", Tip.hide);
    });
    if (r.path !== lastPath) window.scrollTo(0, 0);
    lastPath = r.path;
    $("#side").classList.remove("open");
    document.title = (page.title ? page.title(r) : "Studio") + " · Spool Studio Admin";
  }
  function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  /* ---------------- global actions ---------------- */
  Object.assign(ACT, {
    mclose: () => Modal.close(),
    dclose: () => Drawer.close(),
    palette: () => palette(),
    burger: () => $("#side").classList.toggle("open"),
    theme() {
      const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      store.set("spool-admin-theme", t);
      rerender();
    },
    notifs() {
      Drawer.open({
        title: "Notifications",
        body: [["shield", "red", "2 moderation items past SLA", "Hate speech on Sindoor Ka Badla E40 · 2 h", "#/moderation"], ["alert", "amber", "Upload failed · Reborn E34", "Audio track missing (stream 1)", "#/upload"], ["percent", "blue", "x-31 reached 94% confidence", "Paywall position · E8 vs E10", "#/paywall-lab/x-31"], ["coins", "gold", "3 payouts waiting", "$20,080 · Zara Q, Mina Park, Ritu Sharma", "#/creators?tab=payouts"], ["calendar", "green", "E24 of The Heiress Returns scheduled", "Tomorrow 8:00 PM · all regions", "#/schedule"]]
          .map(([i, c, t, s, h]) => '<a class="li" href="' + h + '" style="padding:12px 0"><span class="ic ' + c + '">' + ic(i, 17) + '</span><span class="b2"><div class="t">' + t + '</div><div class="s">' + s + "</div></span>" + ic("fwd", 16) + "</a>").join("")
      });
    },
    logout: () => { location.hash = "#/login"; },
    vtbl(el, id) {
      const v = $('[data-viz="' + id + '"]');
      if (!v) return;
      v.classList.toggle("show-tbl");
      el.classList.toggle("on", v.classList.contains("show-tbl"));
    },
    toast: (el, ...m) => toast(esc(m.join(":"))),
    flip: el => { const on = el.getAttribute("aria-checked") !== "true"; el.setAttribute("aria-checked", on); toast((el.getAttribute("aria-label") || "Setting") + (on ? " on" : " off")); },
    tchip: el => el.classList.toggle("on")
  });
  function wire() {
    document.addEventListener("click", e => {
      const el = e.target.closest("[data-act]");
      if (!el) return;
      const a = el.dataset.act.split(":");
      const fn = ACT[a[0]];
      if (fn) { e.preventDefault(); fn.apply(null, [el].concat(a.slice(1))); }
    });
    $("#ovl").addEventListener("click", () => { Modal.close(); Drawer.close(); });
    document.addEventListener("keydown", e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette(); return; }
      if (e.key === "Escape") { Modal.close(); Drawer.close(); }
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "/") { e.preventDefault(); palette(); }
      const page = PAGES[parse().parts[0]];
      if (page && page.keys) page.keys(e);
    });
    window.addEventListener("hashchange", render);
    let rt = 0;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => Charts.mountAll(document), 150); });
  }

  root.Admin = {
    S, FMT, T, C, V, $, $$, esc, ic, store, UI, Charts, Tip, Modal, Drawer, toast, ACT, st, heatmap,
    page(name, def) { PAGES[name] = def; },
    go(path) { location.hash = "#/" + path; },
    render, rerender,
    start() { wire(); render(); }
  };
})(window);
