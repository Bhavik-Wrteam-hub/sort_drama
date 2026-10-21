/* ==========================================================================
   Spool Studio — pages, part 1
   Dashboard · Titles · Title editor · Upload & pipeline · Release schedule ·
   Home builder · Creator videos · Pilot Season
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Admin;
  const { S, FMT, T, C, V, $, $$, esc, ic, UI, Charts, Modal, Drawer, toast, ACT, st } = A;

  /* ---------- region-scoped metrics ---------- */
  const SUM = a => a.reduce((x, y) => x + y, 0);
  const TOTAL_REV = 302074, TOTAL_DAU = 1810000;
  function scoped() {
    const s = S.SERIES;
    const coins = s.coins.map((v, i) => v + s.web[i]);
    if (st.region === "All") return { dau: s.dau, coins, vip: s.vip, ads: s.ads, dates: s.dates };
    const r = S.REGIONS[st.region];
    const f = r.dau * r.arpdau / TOTAL_REV, fd = r.dau / TOTAL_DAU;
    const mix = r.mode === "ads" ? [.24, .1, .66] : r.mode === "coins" ? [.66, .34, 0] : [.55, .31, .14];
    return {
      dau: s.dau.map(v => Math.round(v * fd)),
      coins: coins.map(v => Math.round(v * f * mix[0] / .555)),
      vip: s.vip.map(v => Math.round(v * f * mix[1] / .31)),
      ads: s.ads.map(v => Math.round(v * f * mix[2] / .14)),
      dates: s.dates
    };
  }
  function slice(arr) { const n = st.range === "7d" ? 7 : st.range === "mtd" ? 9 : 30; return arr.slice(arr.length - n); }
  const SER = () => [{ name: "Coins & passes", short: "Coins", color: "var(--s1)" }, { name: "VIP subscriptions", short: "VIP", color: "var(--s2)" }, { name: "Ads", short: "Ads", color: "var(--s3)" }];
  ACT.range = (el, k) => { st.range = k; A.rerender(); };

  /* =====================================================================
     DASHBOARD
     ===================================================================== */
  A.page("dashboard", {
    title: () => "Dashboard",
    crumbs: () => [["Dashboard"]],
    render() {
      st.range = st.range || "30d";
      const m = scoped();
      const coins = slice(m.coins), vip = slice(m.vip), ads = slice(m.ads), dau = slice(m.dau), dates = slice(m.dates);
      const rev = SUM(coins) + SUM(vip) + SUM(ads);
      const parts = [SUM(coins), SUM(vip), SUM(ads)];
      const rangeLbl = { "7d": "last 7 days", "30d": "last 30 days", mtd: "October to date" }[st.range];
      const today = m.coins[29] + m.vip[29] + m.ads[29];
      const ar = today / m.dau[29];
      const reg = st.region === "All" ? null : S.REGIONS[st.region];
      const conv = reg && reg.mode === "ads" ? .262 : .078;
      const stack = Charts.withTable({ type: "stack", name: "Revenue by source", labels: dates, fmt: "usd", height: 250, series: SER().map((s, i) => Object.assign(s, { values: [coins, vip, ads][i] })) });
      const area = Charts.withTable({ type: "area", name: "Daily active viewers", labels: dates, values: dau, fmt: "n", height: 190 });
      const fun = Charts.withTable({ type: "funnel", name: "Paywall funnel", fmt: "n", labelW: 168, items: S.FUNNEL.map(f => ({ label: f.k, value: Math.round(f.v * (reg ? reg.dau / TOTAL_DAU : 1)) })) });
      const mix = Charts.withTable({ type: "stackbar", name: "Share of unlocks", fmt: "pct0", items: S.UNLOCK_MIX.map((u, i) => ({ label: u.k, value: u.v, color: "var(--s" + (i + 1) + ")", ink: i === 3 || i === 2 ? "#0b0b0b" : "#fff" })) });
      const top = S.TITLES.filter(t => t.admin.revenue30 > 0 && (st.region === "All" || t.admin.region.indexOf(st.region) >= 0)).sort((a, b) => b.admin.revenue30 - a.admin.revenue30).slice(0, 7);
      const maxRev = top.length ? top[0].admin.revenue30 : 1;
      const hr = new Date().getHours();
      const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
      return UI.ph('<span class="serif-i">' + greet + ",</span> Riya", "Friday 9 October 2026 · " + esc(UI.region(st.region)) + " · numbers below use the same slice and range",
        UI.segc([["7d", "7 days"], ["30d", "30 days"], ["mtd", "October to date"]], st.range, "range") +
        '<button class="b" data-act="toast:Export queued — CSV and PDF land in your inbox">' + ic("download", 15) + "Export</button>" +
        '<a class="b pri" href="mobile.html" target="_blank" rel="noopener">' + ic("phone", 15) + "Open app prototype</a>") +
        '<div class="grid" style="grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:stretch">' +
        '<section class="card hero-fig"><div><div class="l">Revenue · ' + rangeLbl + '</div><div class="v" style="margin-top:10px">' + FMT.usdk(rev).replace(/([KM])$/, "<small>$1</small>") + '</div>' +
        '<div class="d" style="margin-top:10px"><b>▲ ' + (st.range === "7d" ? "4.1%" : st.range === "mtd" ? "11.2%" : "18.4%") + "</b> vs the previous " + (st.range === "mtd" ? "9 days" : rangeLbl.replace("last ", "")) + " · " + FMT.usdk(today) + " today so far</div></div>" +
        '<div><div class="mix">' + parts.map((p, i) => '<i style="width:' + (p / rev * 100) + "%;background:var(--s" + (i + 1) + ')"></i>').join("") + "</div>" +
        '<div class="mixleg" style="margin-top:10px">' + ["Coins & passes", "VIP", "Ads"].map((n, i) => '<span><i style="background:var(--s' + (i + 1) + ')"></i>' + n + " <b>" + Math.round(parts[i] / rev * 100) + "%</b></span>").join("") + '<span style="color:var(--text-3)">Web checkout 2.3% of coins</span></div></div></section>' +
        '<div class="grid g2">' +
        UI.stat({ l: "Daily active viewers", icon: "users", v: FMT.n(m.dau[29]), d: "6.2%", dir: "up", vs: "vs last week", spark: m.dau.slice(16) }) +
        UI.stat({ l: "Unlock conversion", icon: "unlock", v: FMT.pct(conv), d: "0.6 pts", dir: "up", vs: "paywall → unlock", spark: [7.1, 7.2, 7.0, 7.4, 7.3, 7.5, 7.6, 7.4, 7.7, 7.6, 7.8, 7.7, 7.9, 7.8] }) +
        UI.stat({ l: "Revenue per daily viewer", icon: "coins", v: "$" + ar.toFixed(3), d: "3.1%", dir: "up", vs: "ARPDAU", spark: m.coins.slice(16).map((v, i) => (v + m.vip[16 + i] + m.ads[16 + i]) / m.dau[16 + i]) }) +
        UI.stat({ l: "Day-7 retention", icon: "refresh", v: "11.2%", d: "0.8 pts", dir: "up", vs: "category ≈ 6%", spark: [9.8, 10.1, 10.0, 10.4, 10.3, 10.6, 10.8, 10.7, 11.0, 10.9, 11.1, 11.2, 11.0, 11.2] }) +
        "</div></div>" +
        '<div class="grid mt" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">' +
        UI.card("Revenue by source", "Daily, " + rangeLbl + " · stacked: coins & passes, VIP, ads", stack.html, { acts: stack.btn }) +
        UI.card("Needs attention", "Things only a person can decide", attention(), { flush: true }) + "</div>" +
        '<div class="grid mt" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">' +
        UI.card("Top titles", "Revenue, last 30 days · " + esc(UI.region(st.region)), '<div class="tblwrap"><table class="tbl"><thead><tr><th>Title</th><th>Status</th><th class="r">Revenue</th><th class="r">Unlock rate</th><th class="r">Completion</th></tr></thead><tbody>' +
          top.map(t => '<tr class="clickable" data-act="goTitle:' + t.id + '"><td><div class="who">' + UI.poster(t) + '<div><b class="ellip">' + esc(t.name) + "</b><small>" + esc(t.tropes.slice(0, 2).join(" · ")) + " · " + t.eps + " eps</small></div></div></td><td>" + UI.pill(t.admin.status) + '</td><td class="r"><div class="cellbar"><b>' + FMT.usdk(t.admin.revenue30) + '</b><span class="meter"><i style="width:' + (t.admin.revenue30 / maxRev * 100) + '%"></i></span></div></td><td class="r">' + FMT.pct(t.admin.unlockRate) + '</td><td class="r">' + FMT.pct(t.admin.completion, 0) + "</td></tr>").join("") + "</tbody></table></div>", { flush: true, acts: '<a class="b sm" href="#/titles">All titles</a>' }) +
        UI.card("Live activity", "Last few minutes", activity(), { flush: true }) + "</div>" +
        '<div class="grid g3 mt">' +
        UI.card("Daily active viewers", rangeLbl, area.html, { acts: area.btn }) +
        UI.card("Paywall funnel", "Viewers who reached a locked episode, last 30 days", fun.html, { acts: fun.btn }) +
        UI.card("How viewers unlock", "Share of unlocks by method, last 30 days", mix.html + '<div class="nt mt" style="margin-top:14px">' + ic("info", 16) + "<span>Rewarded ads lead in India and Indonesia; coins lead in the US. Region modes set the default option on the unlock sheet.</span></div>", { acts: mix.btn }) + "</div>" +
        UI.card("Regions", "Each country runs its own mode — set in Monetization", regionsTable(), { flush: true, cls: "mt", acts: '<a class="b sm" href="#/monetization">Edit regions</a>' });
    }
  });
  function attention() {
    return [["shield", "red", "2 moderation items past SLA", "Hate speech on Sindoor Ka Badla E40", "#/moderation"],
      ["alert", "amber", "1 upload failed", "Reborn, I Chose Myself E34 · audio track missing", "#/upload"],
      ["coins", "gold", "3 payouts waiting · $20,080", "Zara Q, Mina Park, Ritu Sharma", "#/creators?tab=payouts"],
      ["clapper", "violet", "The Last Delivery is near greenlight", "9,642 / 10,000 votes · 81% finish", "#/pilots"],
      ["percent", "blue", "x-31 reached 94% confidence", "Paywall at E8 lifts revenue/viewer 6.3%", "#/paywall-lab/x-31"],
      ["flag", "red", "Unreleased episode leaked", "Heiress E23 · 96% content match · auto-hidden", "#/ugc?tab=flagged"]]
      .map(([i, c, t, s, h]) => '<a class="li" href="' + h + '"><span class="ic ' + c + '">' + ic(i, 17) + '</span><span class="b2"><div class="t">' + t + '</div><div class="s">' + s + '</div></span><span class="r">' + ic("fwd", 16) + "</span></a>").join("");
  }
  function activity() {
    return '<div class="feed">' + [["2s", "unlock", "Unlock · Heiress E8", "Maya R. · 60 coins · US"], ["9s", "crown", "VIP weekly started", "Lucas S. · BR · R$ 14,90"], ["14s", "ad", "Rewarded ad → Sindoor E16", "Aarav K. · IN · AppLovin"], ["31s", "upload", "Upload processing", "Heiress E25 · 62% · transcode"], ["48s", "gift", "Cliffhanger gift sent", "Heiress E8 → new install · US"], ["1m", "thumb", "Pilot vote", "The Last Delivery · 9,642"], ["2m", "refresh", "Refund processed", "T-530873 · $4.99 · reversal row L-90213"], ["3m", "flag", "Report filed", "Comment on Moonbound E22 · harassment"]]
      .map(([tm, i, t, s]) => '<div class="li"><span class="ic">' + ic(i, 16) + '</span><span class="b2"><div class="t">' + t + '</div><div class="s">' + s + '</div></span><span class="tm">' + tm + "</span></div>").join("") + "</div>";
  }
  function regionsTable() {
    return '<div class="tblwrap"><table class="tbl"><thead><tr><th>Region</th><th>Mode</th><th class="r">Daily viewers</th><th class="r">ARPDAU</th><th class="r">Revenue / day</th><th class="r">Episode price</th><th class="r">Free eps</th><th class="r">Ad unlocks / day</th></tr></thead><tbody>' +
      Object.values(S.REGIONS).sort((a, b) => b.dau * b.arpdau - a.dau * a.arpdau).map(r => '<tr class="clickable" data-act="regionScope:' + r.code + '"><td><div class="who"><span class="pill">' + r.code + "</span><b>" + esc(r.name) + "</b></div></td><td>" + (r.mode === "ads" ? '<span class="pill blue">' + ic("ad", 12) + "Free with ads</span>" : r.mode === "coins" ? '<span class="pill gold">' + ic("coin", 12) + "Coins + VIP · no ads</span>" : '<span class="pill violet">' + ic("layers", 12) + "Hybrid</span>") + "</td>" +
        '<td class="r">' + FMT.n(r.dau) + '</td><td class="r">$' + r.arpdau.toFixed(3) + '</td><td class="r">' + FMT.usdk(r.dau * r.arpdau) + '</td><td class="r">' + r.epPrice + ' coins</td><td class="r">' + r.freeEps + '</td><td class="r">' + (r.adsPerDay || "Off") + "</td></tr>").join("") + "</tbody></table></div>";
  }
  ACT.goTitle = (el, id) => A.go("titles/" + id);
  ACT.regionScope = (el, code) => { st.region = code; toast("Scope: " + UI.region(code)); A.rerender(); };

  /* =====================================================================
     TITLES
     ===================================================================== */
  const KIND = { drama: "Drama · vertical", series: "Web series", movie: "Film", creator: "Creator series", pilot: "Pilot" };
  const KSHORT = { drama: ["Drama", "phone"], series: ["Series", "tv"], movie: ["Film", "film"], creator: ["Creator", "video"], pilot: ["Pilot", "clapper"] };
  A.page("titles", {
    title: r => r.parts[1] ? (T[r.parts[1]] || T.heiress).name : "Titles",
    crumbs: r => r.parts[1] ? [["Titles", "titles"], [(T[r.parts[1]] || T.heiress).name]] : [["Titles"]],
    render(r) { return r.parts[1] ? editor(r) : titlesList(r); },
    mount(r) {
      if (r.parts[1]) return editorMount(r);
      const q = $("#tq");
      if (q) q.addEventListener("input", () => { st.tq = q.value; const pos = q.selectionStart; A.rerender(); const n = $("#tq"); n.focus(); n.setSelectionRange(pos, pos); });
      if (r.q.new) newTitle();
      syncBulk();
    }
  });
  function titlesList() {
    const k = st.tkind || "all", q = (st.tq || "").toLowerCase();
    let list = S.TITLES.filter(t => (k === "all" || t.kind === k) && (!q || (t.name + t.tropes.join(" ")).toLowerCase().indexOf(q) >= 0) && (st.region === "All" || t.admin.region.indexOf(st.region) >= 0));
    const sort = st.tsort || "revenue";
    list = list.slice().sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "views" ? b.views - a.views : b.admin.revenue30 - a.admin.revenue30);
    const counts = k2 => S.TITLES.filter(t => k2 === "all" || t.kind === k2).length;
    const allSel = list.length && list.every(t => st.sel.has(t.id));
    return UI.ph("Titles", S.TITLES.length + " titles · dramas, web series, films, creator series and pilots share one content model",
      '<button class="b" data-act="importCsv">' + ic("upload", 15) + 'Import CSV</button><button class="b pri" data-act="newTitle">' + ic("plus", 15, 2.2) + "New title</button>") +
      '<section class="card"><div class="tbar"><label class="tsearch">' + ic("search", 15) + '<input class="inp" id="tq" placeholder="Search titles or tropes" value="' + esc(st.tq || "") + '" style="width:240px;min-height:34px;height:34px"></label>' +
      UI.segc([["all", "All · " + counts("all")], ["drama", "Dramas · " + counts("drama")], ["series", "Series · " + counts("series")], ["movie", "Films · " + counts("movie")], ["creator", "Creator · " + counts("creator")], ["pilot", "Pilots · " + counts("pilot")]], k, "tkind") +
      '<span class="sp"></span><select class="sel" style="width:auto;min-height:34px;height:34px" data-ch="tsort"><option value="revenue"' + (sort === "revenue" ? " selected" : "") + '>Sort: revenue</option><option value="views"' + (sort === "views" ? " selected" : "") + '>Sort: views</option><option value="name"' + (sort === "name" ? " selected" : "") + ">Sort: name</option></select></div>" +
      '<div class="tblwrap"><table class="tbl"><thead><tr><th class="w0">' + UI.chk(allSel, "selAll") + '</th><th>Title</th><th>Type</th><th class="r">Episodes</th><th>Access</th><th>Status</th><th>Regions</th><th class="r">Views</th><th class="r">Revenue 30d</th><th>Completion</th><th class="w0"></th></tr></thead><tbody>' +
      list.map(t => '<tr class="clickable' + (st.sel.has(t.id) ? " sel" : "") + '" data-act="rowGo:' + t.id + '"><td>' + UI.chk(st.sel.has(t.id), "sel:" + t.id) + '</td><td><div class="who">' + UI.poster(t) + '<div><b class="ellip">' + esc(t.name) + "</b><small>" + esc(t.tropes.slice(0, 2).join(" · ")) + "</small></div></div></td>" +
        '<td class="nowrap"><span class="row" style="gap:6px">' + ic(KSHORT[t.kind][1], 14) + KSHORT[t.kind][0] + '</span></td><td class="r nowrap">' + (t.released < t.eps ? t.released + " / " + t.eps : t.eps) + "</td>" +
        '<td class="nowrap">' + (t.kind === "pilot" ? '<span class="t3">Free · voting</span>' : (t.free ? '<span class="t2">' + t.free + " free</span> · " : "") + '<span class="coin">' + ic("coin") + t.price + "</span>") + "</td>" +
        '<td class="nowrap">' + UI.pill(t.admin.status) + '</td><td class="nowrap"><span class="t3">' + t.admin.region.slice(0, 3).join(" ") + (t.admin.region.length > 3 ? " +" + (t.admin.region.length - 3) : "") + "</span></td>" +
        '<td class="r">' + FMT.n(t.views) + '</td><td class="r">' + (t.admin.revenue30 ? FMT.usdk(t.admin.revenue30) : "—") + '</td><td><div class="row" style="gap:8px"><span class="meter" style="width:70px"><i style="width:' + t.admin.completion * 100 + '%"></i></span><span class="xs-t t2">' + Math.round(t.admin.completion * 100) + '%</span></div></td><td><button class="b icon sm ghost" data-act="rowMenu:' + t.id + '" aria-label="More">' + ic("more", 16) + "</button></td></tr>").join("") +
      "</tbody></table></div>" + (list.length ? "" : '<div class="cf">No titles match. Clear the search or switch type.</div>') + '<div class="pager">Showing ' + list.length + " of " + S.TITLES.length + '<span class="sp"></span><button class="b sm" disabled>Previous</button><button class="b sm" disabled>Next</button></div></section>';
  }
  ACT.tkind = (el, k) => { st.tkind = k; A.rerender(); };
  ACT.sel = (el, id) => { st.sel.has(id) ? st.sel.delete(id) : st.sel.add(id); A.rerender(); };
  ACT.selAll = () => {
    const rows = $$("tbody tr[data-act^='rowGo']").map(tr => tr.dataset.act.split(":")[1]);
    const all = rows.every(id => st.sel.has(id));
    rows.forEach(id => all ? st.sel.delete(id) : st.sel.add(id));
    A.rerender();
  };
  ACT.rowGo = (el, id) => A.go("titles/" + id);
  document.addEventListener("change", e => {
    const k = e.target.dataset && e.target.dataset.ch;
    if (k) { st[k] = e.target.value; A.rerender(); }
  });
  function syncBulk() {
    const b = $("#bulk");
    if (!st.sel.size) { b.classList.remove("on"); return; }
    b.innerHTML = "<b>" + st.sel.size + " selected</b>" + '<button class="b sm" data-act="bulk:schedule">' + ic("calendar", 14) + 'Schedule</button><button class="b sm" data-act="bulk:price">' + ic("tag", 14) + 'Change price</button><button class="b sm" data-act="bulk:rail">' + ic("layout", 14) + 'Add to home rail</button><button class="b sm" data-act="bulk:unpublish">' + ic("eyeoff", 14) + 'Unpublish</button><button class="b sm" data-act="bulk:clear">' + ic("x", 14) + "</button>";
    b.classList.add("on");
  }
  ACT.bulk = (el, k) => {
    const n = st.sel.size;
    if (k === "clear") { st.sel.clear(); A.rerender(); return; }
    if (k === "price") return priceModal(Array.from(st.sel));
    const msg = { schedule: "Opened the release schedule for " + n + " titles", rail: n + " titles added to “Because you like…” rails", unpublish: n + " titles unpublished" }[k];
    toast(msg, k === "unpublish" ? () => toast("Restored") : null);
    if (k === "schedule") A.go("schedule");
  };
  ACT.rowMenu = (el, id) => {
    const t = T[id];
    Modal.open({ title: esc(t.name), sub: KIND[t.kind] + " · " + t.eps + " episodes", body: '<div class="stack" style="gap:6px">' + [["edit", "Edit details", "titles/" + id], ["layers", "Episodes", "titles/" + id + "?tab=episodes"], ["tag", "Pricing & paywall", "titles/" + id + "?tab=money"], ["bars", "Analytics", "titles/" + id + "?tab=analytics"], ["translate", "Localization", "titles/" + id + "?tab=loc"]].map(([i, n, h]) => '<a class="li" href="#/' + h + '" style="border:1px solid var(--line);border-radius:10px"><span class="ic">' + ic(i, 16) + '</span><span class="b2"><div class="t">' + n + "</div></span>" + ic("fwd", 16) + "</a>").join("") + "</div>" });
  };
  function priceModal(ids) {
    Modal.open({
      title: "Change price for " + ids.length + " title" + (ids.length > 1 ? "s" : ""),
      sub: "Price lock applies: viewers who already started a series keep the price they saw.",
      body: '<div class="form two"><div class="fld"><label>Price per episode</label><div class="inp-pre"><span>' + ic("coin", 14) + '</span><input value="60"></div><div class="hint">≈ $0.59 in the US</div></div><div class="fld"><label>Free episodes</label><input class="inp" value="8"></div>' +
        '<div class="fld full"><label>Applies from</label><select class="sel"><option>New viewers only (recommended)</option><option>Everyone — existing viewers keep their locked price</option></select></div></div>' +
        '<div class="nt amber mt">' + ic("alert", 16) + "<span>Raising prices mid-series is the #2 complaint in Play reviews. Consider running it in <b>Paywall Lab</b> first.</span></div>",
      foot: '<a class="b ghost" href="#/paywall-lab?new=1">Test in Paywall Lab</a><span class="sp"></span><button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="savePrice">Save prices</button>'
    });
  }
  ACT.savePrice = () => { Modal.close(); toast("Prices updated · locked for existing viewers · logged in Audit log"); };
  ACT.importCsv = () => A.go("upload");
  ACT.newTitle = () => newTitle();
  function newTitle() {
    Modal.open({
      title: "New title", sub: "Every format uses the same model: a title has seasons, a season has episodes.", size: "lg",
      body: '<div class="form two"><div class="fld full"><label>Format</label><div class="chipset">' + [["drama", "Vertical drama"], ["series", "Web series (16:9)"], ["movie", "Film"], ["creator", "Creator series"]].map(([k, n], i) => '<button class="tchip' + (i ? "" : " on") + '" data-act="tchip">' + n + "</button>").join("") + "</div></div>" +
        '<div class="fld"><label>Title</label><input class="inp" placeholder="e.g. The Heiress Returns"></div><div class="fld"><label>Language</label><select class="sel"><option>English</option><option>Hindi</option><option>Spanish</option><option>Portuguese</option></select></div>' +
        '<div class="fld"><label>Episodes planned</label><input class="inp" value="60"></div><div class="fld"><label>Release</label><select class="sel"><option>Daily · 8 PM viewer time</option><option>Mon · Wed · Fri</option><option>All at once</option></select></div>' +
        '<div class="fld full"><label>Rights</label><select class="sel"><option>Owned · worldwide</option><option>Licensed · choose territories and end date</option></select><div class="hint">A licence document is required before the first episode can go live.</div></div></div>',
      foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="createTitle">Create draft</button>'
    });
  }
  ACT.createTitle = () => { Modal.close(); toast("Draft created — add episodes next"); A.go("titles/heiress?tab=episodes"); };

  /* ---------------- title editor ---------------- */
  function editor(r) {
    const t = T[r.parts[1]] || T.heiress;
    const tab = r.q.tab || "overview";
    const eps = S.episodes(t);
    let body = "";
    if (tab === "overview") body = tOverview(t);
    else if (tab === "episodes") body = tEpisodes(t, eps);
    else if (tab === "money") body = tMoney(t);
    else if (tab === "cast") body = tCast(t);
    else if (tab === "loc") body = tLoc(t);
    else if (tab === "analytics") body = tAnalytics(t);
    else body = tReviews(t);
    return '<div class="ph"><div class="t"><a class="backlink" href="#/titles">' + ic("back", 14, 2) + 'Titles</a><div class="row" style="gap:14px">' + UI.poster(t, 46) +
      "<div><h1>" + esc(t.name) + '</h1><p class="row" style="gap:8px;margin-top:6px">' + UI.pill(t.admin.status) + "<span>" + KIND[t.kind] + " · " + t.eps + " episodes · " + esc(t.admin.rights) + "</span></p></div></div></div>" +
      '<div class="acts"><a class="b" href="mobile.html#/series/' + t.id + '" target="_blank" rel="noopener">' + ic("phone", 15) + "Preview in app" + ic("external", 13) + '</a><button class="b" data-act="toast:Duplicated as a draft">' + ic("copy", 15) + 'Duplicate</button><button class="b pri" data-act="saveTitle">Save changes</button></div></div>' +
      UI.tabs([["overview", "Overview"], ["episodes", "Episodes", t.released], ["money", "Monetization"], ["cast", "Cast"], ["loc", "Localization", t.subs], ["analytics", "Analytics"], ["reviews", "Reviews", FMT.n(t.ratings)]], tab, "titles/" + t.id) + body;
  }
  ACT.saveTitle = () => toast("Saved · changes are live in the app in under a minute", () => toast("Reverted"));
  function phonePreview(t) {
    const p = t.price, c = Math.max(0, t.released - t.free) * p;
    return '<div class="mini-phone" style="--pw:260px"><div class="scr"><div class="isl"></div>' +
      '<div style="position:relative;height:58%"><img src="' + (t.orient === "landscape" ? Art.wide(t) : Art.poster(t)) + '" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,#0A0A0B)"></div>' +
      '<div style="position:absolute;left:14px;right:14px;bottom:8px"><div style="font-size:8px;font-weight:750;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-text)">' + esc(t.kicker) + '</div><div class="' + (t.st === "serif" ? "serif-i" : "") + '" style="font-size:' + (t.st === "serif" ? 28 : 19) + "px;line-height:.95;font-weight:" + (t.st === "serif" ? 400 : 800) + ";text-transform:" + (t.st === "serif" ? "none" : "uppercase") + ';letter-spacing:-.03em;margin-top:4px">' + esc(t.name) + "</div>" +
      '<div style="font-size:9px;color:#B4B1A8;margin-top:6px">★ ' + t.rating + " · " + t.age + " · " + t.eps + ' episodes</div></div></div>' +
      '<div style="padding:8px 12px"><div style="height:30px;border-radius:9px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:11px;font-weight:700">▶ Play E1</div>' +
      '<div style="margin-top:8px;padding:8px;border-radius:10px;border:1px solid rgba(242,194,91,.25);background:rgba(242,194,91,.06)"><div style="font-size:8px;font-weight:750;letter-spacing:.1em;color:var(--gold)">WHAT IT COSTS</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-top:6px;font-size:9px">' +
      '<div style="background:rgba(0,0,0,.3);border-radius:6px;padding:5px"><div style="color:#7D7B74">Free</div><b style="font-size:11px">E1–E' + t.free + '</b></div><div style="background:rgba(0,0,0,.3);border-radius:6px;padding:5px"><div style="color:#7D7B74">Catch up</div><b style="font-size:11px;color:var(--gold)">' + FMT.int(c) + '</b></div><div style="background:rgba(0,0,0,.3);border-radius:6px;padding:5px"><div style="color:#7D7B74">Pass</div><b style="font-size:11px">' + FMT.int(t.pass || Math.round((t.eps - t.free) * p * .62 / 10) * 10) + "</b></div></div></div></div></div></div>";
  }
  function tOverview(t) {
    return '<div class="split wide"><div class="stack">' +
      UI.card("Details", "Shown on the series page, search and SEO pages", '<div class="form two">' +
        '<div class="fld full"><label>Title</label><input class="inp" value="' + esc(t.name) + '"></div>' +
        '<div class="fld"><label>Subtitle</label><input class="inp" value="' + esc(t.sub || "") + '" placeholder="Optional"></div><div class="fld"><label>Kicker</label><select class="sel"><option>' + esc(t.kicker) + "</option><option>Exclusive</option><option>New season</option></select></div>" +
        '<div class="fld full"><label>Synopsis</label><textarea class="ta" rows="3">' + esc(t.synopsis) + '</textarea><div class="hint">' + t.synopsis.length + " / 280 · no spoilers past E3 — it shows before people pay</div></div>" +
        '<div class="fld full"><label>Tropes</label><div class="chipset">' + S.TROPES.map(tr => '<button class="tchip' + (t.tropes.indexOf(tr) >= 0 ? " on" : "") + '" data-act="tchip">' + (t.tropes.indexOf(tr) >= 0 ? ic("check", 13, 2.4) : "") + esc(tr) + "</button>").join("") + '</div><div class="hint">Tropes drive Home rails, Browse and Scene Search. Pick up to 3.</div></div>' +
        '<div class="fld"><label>Age rating</label>' + UI.segc([["all", "All"], ["13+", "13+"], ["16+", "16+"], ["18+", "18+"]], t.age, "noop") + '</div><div class="fld"><label>Orientation</label>' + UI.segc([["portrait", "Vertical 9:16"], ["landscape", "Landscape 16:9"]], t.orient, "noop") + "</div></div>") +
      UI.card("Artwork", "Poster, banner and trailer · the app crops for each surface", '<div class="row start" style="gap:16px;flex-wrap:wrap"><div style="width:120px"><div class="poster">' + '<img src="' + Art.poster(t) + '" alt=""><div class="pt ' + t.st + '"><small>' + esc(t.kicker) + "</small>" + esc(t.name) + '</div></div><div class="xs-t t3 mt" style="margin-top:6px">Poster 2:3 · 1200×1800</div></div>' +
        '<div style="width:240px"><div class="poster wide"><img src="' + Art.wide(t) + '" alt=""></div><div class="xs-t t3" style="margin-top:6px">Banner 16:9 · 1920×1080</div></div>' +
        '<div style="width:96px"><div class="poster tall"><img src="' + Art.scene(t, 1, 1) + '" alt=""></div><div class="xs-t t3" style="margin-top:6px">Trailer 9:16 · 0:42</div></div></div>' +
        '<div class="row mt"><button class="b sm">' + ic("upload", 14) + 'Replace poster</button><button class="b sm">' + ic("upload", 14) + 'Replace banner</button><button class="b sm">' + ic("video", 14) + "Trailer</button></div>") +
      '<div class="grid g2">' + UI.card("Release", "", '<div class="form"><div class="fld"><label>Status</label><select class="sel"><option>' + t.admin.status + "</option><option>Scheduled</option><option>Draft</option><option>Unlisted</option></select></div>" +
        '<div class="fld"><label>Drop schedule</label><input class="inp" value="' + esc(t.schedule || "All episodes available") + '"><div class="hint">In each viewer\'s local time. Reminders go out 1 h before.</div></div></div>') +
      UI.card("Availability & rights", "", '<div class="form"><div class="fld"><label>Regions</label><div class="chipset">' + Object.keys(S.REGIONS).map(k => '<button class="tchip' + (t.admin.region.indexOf(k) >= 0 ? " on" : "") + '" data-act="tchip">' + k + "</button>").join("") + "</div></div>" +
        '<div class="fld"><label>Rights</label><input class="inp" value="' + esc(t.admin.rights) + '"><div class="hint">Owner: ' + esc(t.admin.owner) + " · licence PDF attached · takedown contact set</div></div></div>") + "</div></div>" +
      '<div class="stack" style="position:sticky;top:80px">' + UI.card("In the app", "Live preview of the series page", phonePreview(t), { acts: '<a class="b sm" href="mobile.html#/series/' + t.id + '" target="_blank" rel="noopener">Open ' + ic("external", 13) + "</a>" }) + "</div></div>";
  }
  function tEpisodes(t, eps) {
    const shown = eps.slice(0, Math.min(t.released + 2, 30));
    const floor = eps.filter(e => e.dur < 45).length;
    return '<div class="nt ' + (floor ? "amber" : "green") + '" style="margin-bottom:14px">' + ic(floor ? "alert" : "checkc", 16) + "<span><b>Episode length floor: 45 s.</b> " + (floor ? floor + " episode is below it — viewers complain when late episodes are cut into seconds-long pieces." : "Every episode clears it. Viewers complain on Play when late episodes are cut into seconds-long pieces.") + "</span></div>" +
      '<section class="card"><div class="tbar"><b class="sm-t">' + t.released + " of " + t.eps + ' released</b><span class="sp"></span><button class="b sm" data-act="toast:Bulk edit: select episodes first">' + ic("edit", 14) + 'Bulk edit</button><a class="b sm" href="#/schedule">' + ic("calendar", 14) + 'Schedule</a><a class="b sm pri" href="#/upload">' + ic("upload", 14) + "Upload episodes</a></div>" +
      '<div class="tblwrap"><table class="tbl"><thead><tr><th class="w0">#</th><th>Episode</th><th class="r">Length</th><th>Status</th><th>Access</th><th>Subtitles</th><th>Audio</th><th class="r">Views</th><th class="r">Kept vs E1</th><th class="w0"></th></tr></thead><tbody>' +
      shown.map((e, i) => {
        const st2 = e.n <= t.released ? "Published" : e.n === t.released + 1 ? "Scheduled" : "Processing";
        const keep = S.DROPOFF[i] != null ? S.DROPOFF[i] : null;
        return '<tr><td class="num t3">' + e.n + '</td><td><div class="who"><span class="wth" style="width:30px"><span class="poster tall" style="border-radius:5px"><img src="' + Art.scene(t, e.n, 0) + '" alt=""></span></span><div><b>' + esc(e.title) + "</b><small>" + (e.n === 7 && t.id === "heiress" ? "Cliffhanger Call attached · 182K calls" : e.n <= t.free ? "Free" : "") + "</small></div></div></td>" +
          '<td class="r num">' + FMT.dur(e.dur) + "</td><td>" + UI.pill(st2, st2 === "Scheduled" ? "Tonight 8:00 PM" : null) + "</td><td>" + (e.n <= t.free ? '<span class="pill green">Free</span>' : '<span class="coin">' + ic("coin") + t.price + "</span>") + "</td>" +
          '<td><span class="t2 sm-t">' + (st2 === "Processing" ? "Generating…" : t.subs + " languages") + '</span></td><td><span class="t2 sm-t">' + t.audio.length + ' tracks</span></td><td class="r num">' + (e.n <= t.released ? FMT.n(e.views) : "—") + '</td><td class="r">' + (keep != null && e.n <= t.released ? '<div class="cellbar"><span class="xs-t' + (i === 7 && t.id === "heiress" ? " b6" : " t2") + '">' + Math.round(keep * 100) + '%</span><span class="meter"><i style="width:' + keep * 100 + "%" + (i === 7 && t.id === "heiress" ? ";background:var(--s2)" : "") + '"></i></span></div>' : "—") +
          '</td><td><button class="b icon sm ghost" data-act="epMenu:' + t.id + ":" + e.n + '">' + ic("more", 16) + "</button></td></tr>";
      }).join("") + "</tbody></table></div></section>";
  }
  ACT.epMenu = (el, id, n) => {
    const t = T[id], e = S.episodes(t)[+n - 1];
    Drawer.open({
      title: "E" + n + " · " + esc(e.title),
      body: '<div class="row start" style="gap:16px"><div style="width:120px"><div class="poster tall"><img src="' + Art.scene(t, +n, 0) + '" alt=""></div></div><div class="sp"><dl class="kvs"><dt>Length</dt><dd>' + FMT.dur(e.dur) + "</dd><dt>Renditions</dt><dd>240p → 1080p</dd><dt>Segments</dt><dd>HLS · 2 s</dd><dt>Subtitles</dt><dd>" + t.subs + "</dd><dt>Views</dt><dd>" + FMT.n(e.views) + "</dd></dl></div></div>" +
        '<div class="form mt"><div class="fld"><label>Title</label><input class="inp" value="' + esc(e.title) + '"></div><div class="fld"><label>Access</label>' + UI.segc([["free", "Free"], ["coins", "Coins"], ["vip", "VIP only"]], +n <= t.free ? "free" : "coins", "noop") + "</div>" +
        '<div class="fld"><label>Cliffhanger Call</label><input class="inp" placeholder="Question, e.g. Who sent Ava the text?" value="' + (t.id === "heiress" && +n === 7 ? "Who sent Ava the text?" : "") + '"><div class="hint">Shown at the end card. Answer is revealed when the next episode drops; correct callers get +5 bonus coins.</div></div>' +
        '<div class="fld"><label>Scene notes for Scene Search</label><textarea class="ta" rows="3">' + (t.id === "heiress" && +n === 7 ? "Gala ballroom. Ava confronts Celeste. Victor recognises her. The slap at 0:42. Text message at 1:20." : "") + "</textarea></div></div>",
      foot: '<button class="b" data-act="dclose">Close</button><span class="sp"></span><button class="b pri" data-act="dsave">Save episode</button>'
    });
  };
  ACT.dsave = () => { Drawer.close(); toast("Episode saved"); };
  ACT.noop = el => { const p = el.parentNode; $$("button", p).forEach(b => b.classList.toggle("on", b === el)); };

  function tMoney(t) {
    const free = st.freeEps != null && st.freeFor === t.id ? st.freeEps : t.free;
    const price = t.price;
    const remain = Math.max(0, t.released - free), whole = Math.max(0, t.eps - free);
    return '<div class="split wide"><div class="stack">' +
      UI.card("Paywall", "Where the first locked episode sits, and what it costs", '<div class="form">' +
        '<div class="fld"><div class="row"><label class="lbl">Free episodes</label><span class="sp"></span><b id="freeVal">E1–E' + free + "</b></div>" +
        '<input type="range" class="rng" min="0" max="20" value="' + free + '" id="freeRng"><div class="hint" id="freeHint">Paywall at <b>E' + (free + 1) + "</b>. 47% of E1 starters reach it today. Each extra free episode costs ~3% of unlocks and adds ~1.6% day-7 retention (x-28).</div></div>" +
        '<div class="form two"><div class="fld"><label>Price per episode</label><div class="inp-pre"><span>' + ic("coin", 14) + '</span><input value="' + price + '"></div><div class="hint">≈ ' + FMT.money(price, "US") + " · " + FMT.money(Math.round(price / 2), "IN") + " in India</div></div>" +
        '<div class="fld"><label>Series Pass</label><div class="inp-pre"><span>' + ic("coin", 14) + '</span><input value="' + (t.pass || Math.round(whole * price * .62 / 10) * 10) + '"></div><div class="hint">' + Math.round((1 - (t.pass || whole * price * .62) / Math.max(1, whole * price)) * 100) + "% off finishing at full price · includes future episodes</div></div></div>" +
        '<div class="fld"><label>VIP access</label>' + UI.segc([["all", "Included"], ["7", "After 7-day premiere"], ["14", "After 14 days"]], "all", "noop") + '<div class="hint">Anything not included is labelled “Premiere” in the app before a viewer starts it.</div></div>' +
        '<div class="row"><span class="sp" style="flex:1"><b class="sm-t">Allow rewarded-ad unlocks</b><div class="xs-t t3">1 ad ≤ 30 s per episode · regional caps apply</div></span>' + UI.tog(true, "flip", "Ad unlocks") + "</div></div>") +
      UI.card("Fair-play locks", "These can't be switched off per title", ['Price lock — viewers keep the per-episode price they started with', "Unlocks never charge twice (idempotent)", "A failed rewarded ad still unlocks the episode", "Auto-unlock is off unless the viewer turns it on"].map(s => '<div class="policy"><span class="ic">' + ic("lock", 15) + '</span><div class="b2"><div class="t">' + s + "</div></div></div>").join("")) + "</div>" +
      '<div class="stack">' + UI.card("What viewers see", "The cost card on the series page, live", '<div class="mini-phone" style="--pw:240px;aspect-ratio:auto;height:auto"><div class="scr" style="padding:16px 12px"><div style="font-size:9px;font-weight:750;letter-spacing:.1em;color:var(--gold)">WHAT IT COSTS</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:8px;font-size:10px" id="costCard">' + costCells(free, price, remain, t) + "</div>" +
        '<div style="font-size:9.5px;color:#B4B1A8;margin-top:8px;line-height:1.4">' + price + " coins an episode, never more. Or 1 ad ≤ 30 s per episode.</div></div></div>") +
      UI.card("Test before you change", "", '<p class="sm-t t2" style="margin:0 0 12px">Run the new paywall position on 50% of new viewers for 14 days, with retention and refund guardrails.</p><a class="b pri" href="#/paywall-lab?new=1">' + ic("percent", 15) + "Run in Paywall Lab</a>") + "</div></div>";
  }
  function costCells(free, price, remain, t) {
    return '<div style="background:#151517;border-radius:7px;padding:6px"><div style="color:#7D7B74">Free</div><b style="font-size:12px">E1–E' + free + '</b></div><div style="background:#151517;border-radius:7px;padding:6px"><div style="color:#7D7B74">Catch up</div><b style="font-size:12px;color:var(--gold)">' + FMT.int(remain * price) + "</b></div>" +
      '<div style="background:rgba(var(--accent-rgb),.1);border-radius:7px;padding:6px;box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.4)"><div style="color:#7D7B74">Pass</div><b style="font-size:12px">' + FMT.int(t.pass || Math.round((t.eps - free) * price * .62 / 10) * 10) + "</b></div>";
  }
  function tCast(t) {
    const cast = t.cast || [];
    return UI.card("Cast", "Shown as the Cast list on the series page", cast.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>Actor</th><th>Character</th><th>Role line</th></tr></thead><tbody>' +
      cast.map(c => '<tr><td><div class="who">' + UI.ava("cast" + c.id, 32, { pal: c.pal, kind: c.kind, hair: c.hair }) + "<b>" + esc(c.actor) + "</b></div></td><td>" + esc(c.name) + "</td><td>" + esc(c.role) + "</td></tr>").join("") + "</tbody></table></div>" :
      '<div class="nt">' + ic("info", 16) + "<span>No cast yet. Add each actor and the character they play; the list appears on the series page.</span></div>", { flush: !!cast.length, acts: '<button class="b sm">' + ic("plus", 14) + "Add cast member</button>" }) +
      (cast.length ? '<div class="mt">' + UI.card("Story Rewind", "AI recap, checked by an editor", '<div class="nt violet">' + ic("sparkle", 16) + "<span>Recaps are generated from subtitles and scene notes for E1–E(n−1), never beyond. <b>Last reviewed by Omar · 2 days ago.</b></span></div><div class=\"row mt\"><button class=\"b sm\">Regenerate</button><button class=\"b sm\">Edit text</button></div>") + "</div>" : "");
  }
  function tLoc(t) {
    const langs = [["English", "Human", "Original", 1, "—"], ["Hindi", "Human", "AI voice · ready", 1, "Reviewed"], ["Spanish", "Human", "AI voice · ready", 1, "Reviewed"], ["Portuguese", "AI draft", "AI voice · processing", .62, "Needs review"], ["Bahasa Indonesia", "AI draft", "—", .4, "Needs review"], ["Filipino", "AI draft", "—", .4, "Needs review"], ["German", "Human", "—", 1, "Reviewed"], ["French", "AI draft", "—", .3, "Needs review"]];
    return '<div class="nt violet" style="margin-bottom:14px">' + ic("sparkle", 16) + '<span><b>AI voices are always labelled “AI voice”</b> next to the language in the app. Robotic dubbing and voice clones are a top trust complaint, so every AI track needs a human QA pass before it ships.</span></div>' +
      UI.card("Languages", t.subs + " subtitle languages · " + t.audio.length + " audio tracks", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Language</th><th>Subtitles</th><th>Audio</th><th>Coverage</th><th>QA</th><th class="w0"></th></tr></thead><tbody>' +
        langs.map(([l, sub, au, cov, qa]) => "<tr><td><b>" + l + "</b></td><td>" + (sub === "Human" ? '<span class="pill green">' + ic("check", 12) + "Human</span>" : '<span class="pill violet">' + ic("sparkle", 12) + "AI draft</span>") + "</td><td>" + (/AI voice/.test(au) ? '<span class="pill violet">' + ic("headphones", 12) + esc(au) + "</span>" : esc(au)) + '</td><td><div class="row" style="gap:8px"><span class="meter" style="width:90px"><i style="width:' + cov * 100 + '%"></i></span><span class="xs-t t2">' + Math.round(cov * t.released) + "/" + t.released + "</span></div></td><td>" + (qa === "Reviewed" ? UI.pill("Approved", "Reviewed") : qa === "—" ? "—" : UI.pill("Review", "Needs review")) + '</td><td><button class="b sm">' + (qa === "Needs review" ? "Review" : "Open") + "</button></td></tr>").join("") +
        "</tbody></table></div>", { flush: true, acts: '<button class="b sm">' + ic("plus", 14) + "Add language</button>" });
  }
  function tAnalytics(t) {
    const isH = t.id === "heiress";
    const drop = Charts.withTable({ type: "cols", name: "Kept vs E1 starters", xname: "E", labels: S.DROPOFF.map((_, i) => "E" + (i + 1)), values: S.DROPOFF, fmt: "pct0", emphasis: isH ? 7 : null, label: [0, 7, 23], height: 230, annotate: isH ? { i: 7, t: "Paywall · E8", s: "−36% vs E7" } : null, notes: S.DROPOFF.map((_, i) => i === 7 ? "First locked episode" : i < 7 ? "Free" : "") });
    const sc = S.SCRIPT["heiress:7"];
    const pulse = Charts.withTable({ type: "cols", name: "Reactions per 2 s", xname: "", labels: sc.heat.map((_, i) => FMT.dur(i * 2)), values: sc.heat, fmt: "int", emphasis: 21, label: [21, 41], height: 170, notes: sc.heat.map((_, i) => { const p = sc.peaks.find(pp => Math.floor(pp.t / 2) === i); return p ? p.e + " " + p.label : ""; }) });
    const mix = Charts.withTable({ type: "stackbar", name: "Unlocks", fmt: "pct0", items: [{ label: "Coins", value: .48, color: "var(--s1)" }, { label: "Rewarded ad", value: .31, color: "var(--s2)" }, { label: "VIP", value: .14, color: "var(--s3)", ink: "#0b0b0b" }, { label: "Series Pass", value: .07, color: "var(--s4)", ink: "#0b0b0b" }] });
    return '<div class="grid g4">' + UI.stat({ l: "Views · 30 days", v: FMT.n(t.views / 3), d: "12%", dir: "up", vs: "vs prior" }) + UI.stat({ l: "Finish rate", v: FMT.pct(t.admin.completion, 0), d: "2 pts", dir: "up", vs: "of E1 starters" }) +
      UI.stat({ l: "Unlock rate at paywall", v: FMT.pct(t.admin.unlockRate), d: "0.4 pts", dir: "up" }) + UI.stat({ l: "Revenue · 30 days", v: FMT.usdk(t.admin.revenue30), d: "18%", dir: "up" }) + "</div>" +
      '<div class="grid mt" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">' + UI.card("Where viewers drop off", "Share of E1 starters who started each episode", drop.html, { acts: drop.btn }) +
      UI.card("How this title is unlocked", "Last 30 days", mix.html + '<div class="nt mt" style="margin-top:14px">' + ic("info", 16) + "<span>Series Pass buyers finish " + (isH ? "2.4×" : "2×") + " as often as per-episode buyers.</span></div>", { acts: mix.btn }) + "</div>" +
      (isH ? '<div class="mt">' + UI.card("Pulse · E7 “The Slap Heard Round the Gala”", "Reactions per 2 seconds — the same track drives the Pulse Bar in the player", pulse.html, { acts: pulse.btn }) + "</div>" : "");
  }
  function tReviews(t) {
    const list = S.REVIEWS[t.id] || S.REVIEWS.heiress;
    const dist = Charts.withTable({ type: "hbars", name: "Ratings", fmt: "pct0", labelW: 40, items: [[5, .74], [4, .17], [3, .05], [2, .02], [1, .02]].map(([s, v]) => ({ label: s + " ★", value: v })) });
    return '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,2fr)">' +
      UI.card("Weighted score", "", '<div class="row" style="align-items:flex-end;gap:10px"><div style="font-size:48px;font-weight:720;letter-spacing:-.04em;line-height:1">' + t.rating + '</div><div class="t3 sm-t" style="padding-bottom:6px">from ' + FMT.int(t.ratings) + " ratings</div></div>" +
        '<div class="nt mt" style="font-family:var(--f-mono);font-size:12px">score = (C·m + Σr) ÷ (C + n)</div><div class="form two mt"><div class="fld"><label>C (prior weight)</label><input class="inp" value="10"></div><div class="fld"><label>m (catalogue mean)</label><input class="inp" value="4.41" disabled></div></div>' +
        '<div class="hint mt" style="font-size:11.5px;color:var(--text-3)">Only viewers who watched 3+ episodes can rate. One rating per account.</div><div class="hr"></div>' + dist.html, { acts: dist.btn }) +
      UI.card("Reviews", "Newest first · reply as the Spool team", list.map(r => '<div class="li" style="align-items:flex-start;padding:14px 18px"><span class="ic">' + ic("quote", 16) + '</span><div class="b2"><div class="t">' + esc(r.by) + ' <span class="coin" style="margin-left:6px">' + "★".repeat(r.stars) + '</span> <span class="xs-t t3">· watched ' + r.eps + " eps · " + r.ago + '</span></div><div class="s" style="color:var(--text-2);font-size:13px;margin-top:4px">' + esc(r.text) + "</div>" + (r.reply ? '<div class="nt" style="margin-top:8px">' + ic("comment", 15) + "<span>" + esc(r.reply) + "</span></div>" : "") + '</div><div class="r"><button class="b sm">' + (r.reply ? "Edit reply" : "Reply") + '</button><button class="b sm ghost">Hide</button></div></div>').join(""), { flush: true }) + "</div>";
  }
  function editorMount(r) {
    const t = T[r.parts[1]] || T.heiress;
    const rng = $("#freeRng");
    if (rng) rng.addEventListener("input", () => {
      const f = +rng.value;
      st.freeEps = f; st.freeFor = t.id;
      $("#freeVal").textContent = "E1–E" + f;
      const keep = S.DROPOFF[Math.min(f, S.DROPOFF.length - 1)] || .3;
      $("#freeHint").innerHTML = "Paywall at <b>E" + (f + 1) + "</b>. About " + Math.round((f >= 7 ? S.DROPOFF[Math.min(f, 6)] : S.DROPOFF[f]) * 100) + "% of E1 starters would reach it. Each extra free episode costs ~3% of unlocks and adds ~1.6% day-7 retention (x-28).";
      $("#costCard").innerHTML = costCells(f, t.price, Math.max(0, t.released - f), t);
      void keep;
    });
  }

  /* =====================================================================
     UPLOAD & PIPELINE
     ===================================================================== */
  const STAGES = ["upload", "transcode", "subtitles", "dubbing", "ready"];
  A.page("upload", {
    title: () => "Upload & pipeline",
    crumbs: () => [["Content"], ["Upload & pipeline"]],
    render() {
      const rows = (st.pipe || (st.pipe = S.PIPELINE.slice()));
      return UI.ph("Upload & pipeline", "Upload → transcode to vertical/landscape HLS → AI subtitles → dubbing → ready to schedule. Everything runs in background queues.",
        '<button class="b" data-act="csvModal">' + ic("list", 15) + 'Bulk import (CSV)</button><button class="b" data-act="urlModal">' + ic("link", 15) + "Import from URL / HLS</button>") +
        '<div class="split wide"><div class="stack">' +
        '<div class="dz" id="dz"><div class="ic">' + ic("upload", 22) + "</div><b>Drop episode files here</b><span>MP4 or MOV, up to 20 GB each · resumable · or <button class=\"b sm\" data-act=\"fakeUpload\" style=\"margin-left:4px\">Choose files</button></span></div>" +
        UI.card("Pipeline", rows.filter(p => p.stage !== "ready").length + " in progress · " + rows.filter(p => p.stage === "failed").length + " failed · stages: upload, transcode, subtitles, dubbing, ready", '<div class="tblwrap"><table class="tbl"><thead><tr><th>File</th><th style="width:150px">Stages</th><th>Status</th><th>Detail</th><th class="w0"></th></tr></thead><tbody>' +
          rows.map(p => {
            const si = p.stage === "failed" ? 1 : STAGES.indexOf(p.stage);
            const pill = p.stage === "ready" ? UI.pill("Ready") : p.stage === "failed" ? UI.pill("Failed") : UI.pill("Processing", p.stage[0].toUpperCase() + p.stage.slice(1) + " · " + Math.round(p.progress * 100) + "%");
            return '<tr><td><div class="who"><span class="ic" style="width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--surface-3)">' + ic(p.file.endsWith(".csv") ? "list" : "film", 16) + '</span><div><b class="ellip">' + esc(p.title) + "</b><small>" + esc(p.file) + " · " + esc(p.size) + "</small></div></div></td>" +
              '<td><div class="stagebar2">' + STAGES.map((s, i) => '<i class="' + (p.stage === "failed" && i === 1 ? "fail" : i < si || p.stage === "ready" ? "done" : i === si ? "now" : "") + '" title="' + s + '"></i>').join("") + "</div></td>" +
              "<td class=\"nowrap\">" + pill + '</td><td class="sm-t t2">' + esc(p.error || p.scheduled && "Scheduled " + p.scheduled || p.note || (p.renditions.length ? p.renditions[0] + "–" + p.renditions[p.renditions.length - 1] + " · " + p.renditions.length + " renditions" : "") || "") + (p.eta && p.stage !== "ready" && !p.error ? '<div class="xs-t t3">' + esc(p.eta) + "</div>" : "") + "</td>" +
              "<td>" + (p.stage === "failed" ? '<button class="b sm" data-act="retry:' + p.id + '">' + ic("refresh", 14) + "Retry</button>" : p.stage === "ready" && !p.scheduled ? '<a class="b sm" href="#/schedule">Schedule</a>' : "") + "</td></tr>";
          }).join("") + "</tbody></table></div>", { flush: true }) + "</div>" +
        '<div class="stack">' + UI.card("Encoding ladder", "Vertical-first, preload-friendly", '<dl class="kvs"><dt>Segments</dt><dd>HLS · 2 s</dd><dt>First rendition</dt><dd>240p (instant start)</dd><dt>9:16 ladder</dt><dd>240 · 360 · 540 · 720 · 1080</dd><dt>16:9 ladder</dt><dd>360 · 540 · 720 · 1080</dd><dt>Thumbnails</dt><dd>every 2 s · sprite</dd><dt>Playback URLs</dt><dd>signed · 300 s</dd><dt>DRM</dt><dd><span class="pill">Phase 2</span></dd></dl>') +
        UI.card("Storage & delivery", "", '<dl class="kvs"><dt>Storage</dt><dd>Cloudflare R2 · 18.4 TB</dd><dt>CDN</dt><dd>Bunny · 412 TB this month</dd><dt>Cache hit</dt><dd>97.8%</dd></dl><a class="b sm mt" href="#/settings?s=storage">Change provider</a>') +
        UI.card("Workers", "", '<div class="score"><span class="sm-t" style="width:110px">Transcode</span><span class="meter"><i style="width:75%"></i></span><b>6/8</b></div><div class="score" style="margin-top:8px"><span class="sm-t" style="width:110px">Subtitles (AI)</span><span class="meter"><i style="width:40%"></i></span><b>2/5</b></div><div class="score" style="margin-top:8px"><span class="sm-t" style="width:110px">Dubbing (AI)</span><span class="meter warn"><i style="width:90%"></i></span><b>9/10</b></div><div class="xs-t t3 mt">Queue: 14 jobs · transcode runs at 3.2× real time</div>') +
        UI.card("Rights checklist", "Required before an episode can go live", ["Licence or ownership document attached", "Territories match the title's regions", "Takedown contact on file", "Music cleared (auto-checked)"].map(s => '<div class="policy" style="padding:8px 0"><span class="ic" style="width:26px;height:26px">' + ic("check", 13, 2.4) + '</span><div class="b2"><div class="t" style="font-size:13px">' + s + "</div></div></div>").join("")) + "</div></div>";
    },
    mount() {
      const dz = $("#dz");
      ["dragenter", "dragover"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("over"); }));
      ["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("over"); }));
      dz.addEventListener("drop", e => { const n = e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files.length : 1; ACT.fakeUpload(null, n); });
    }
  });
  ACT.fakeUpload = (el, n) => {
    const id = "up-" + (2300 + Math.floor(Math.random() * 90));
    st.pipe.unshift({ id, file: "heiress_s1_e26_master.mov", title: "The Heiress Returns · E26", size: "2.5 GB", stage: "upload", progress: .05, renditions: [], eta: "Uploading · 9 min left", by: "Riya Desai" });
    toast((n > 1 ? n + " files" : "1 file") + " added · uploading in chunks, safe to leave this page");
    A.rerender();
    let p = .05;
    const iv = setInterval(() => {
      const row = st.pipe.find(x => x.id === id);
      if (!row) return clearInterval(iv);
      p += .18;
      row.progress = Math.min(1, p % 1);
      if (p >= 1 && row.stage === "upload") { row.stage = "transcode"; row.eta = "Transcode · 3 min"; p = 0; }
      if (location.hash.indexOf("upload") >= 0) A.rerender();
      if (row.stage === "transcode" && p > .8) clearInterval(iv);
    }, 900);
  };
  ACT.retry = (el, id) => { const p = st.pipe.find(x => x.id === id); p.stage = "transcode"; p.error = null; p.progress = .1; p.eta = "Retrying with audio from mezzanine"; toast("Retrying " + esc(p.title)); A.rerender(); };
  ACT.csvModal = () => Modal.open({
    title: "Bulk import from CSV", sub: "One row per episode — the file links metadata to uploaded or remote video files.", size: "lg",
    body: '<div class="dz" style="padding:20px"><div class="ic">' + ic("list", 20) + '</div><b>Drop a CSV</b><span>Columns: title_id, episode, title, file_or_url, free, price, release_at, subtitles</span></div>' +
      '<div class="nt mt">' + ic("info", 16) + '<span>Last import: <b>Ten Years Later</b> · 50 rows · 0 errors · linked to 50 files. <button class="b xs" data-act="toast:Template downloaded">Download template</button></span></div>',
    foot: '<button class="b" data-act="mclose">Close</button>'
  });
  ACT.urlModal = () => Modal.open({
    title: "Import from URL or HLS", sub: "For catalogues already hosted elsewhere — we re-package to our ladder.",
    body: '<div class="form"><div class="fld"><label>Source</label><input class="inp" placeholder="https://… .m3u8 or .mp4"></div><div class="fld"><label>Attach to</label><select class="sel"><option>The Heiress Returns · next episode</option><option>New title</option></select></div><div class="nt amber">' + ic("alert", 16) + "<span>Only import content you own or license. Imports without a rights document stay in Draft.</span></div></div>",
    foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="urlGo">Import</button>'
  });
  ACT.urlGo = () => { Modal.close(); ACT.fakeUpload(null, 1); };

  /* =====================================================================
     RELEASE SCHEDULE
     ===================================================================== */
  const DAYS = [["Fri", "9 Oct"], ["Sat", "10 Oct"], ["Sun", "11 Oct"], ["Mon", "12 Oct"], ["Tue", "13 Oct"], ["Wed", "14 Oct"], ["Thu", "15 Oct"]];
  const SLOTS = ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];
  function seedDrops() {
    const d = [];
    for (let i = 0; i < 7; i++) {
      d.push({ id: "h" + i, t: "heiress", ep: 24 + i, day: i, slot: 2 });
      d.push({ id: "s" + i, t: "sindoor", ep: 62 + i, day: i, slot: 1 });
      d.push({ id: "r" + i, t: "rebirth", ep: 34 + i, day: i, slot: 3 });
      if (i % 2 === 0) d.push({ id: "m" + i, t: "moonbound", ep: 47 + i / 2, day: i, slot: 3 });
      if (i === 1 || i === 4 || i === 6) d.push({ id: "c" + i, t: "crown", ep: 41 + (i > 3 ? 1 : 0) + (i > 5 ? 1 : 0), day: i, slot: 2 });
    }
    d.push({ id: "f2", t: "flatmates", ep: 15, day: 2, slot: 0 });
    return d;
  }
  A.page("schedule", {
    title: () => "Release schedule",
    crumbs: () => [["Content"], ["Release schedule"]],
    render() {
      const drops = st.drops || (st.drops = seedDrops());
      let cal = '<div class="cal"><div class="hd" style="border-left:0"></div>' + DAYS.map((d, i) => '<div class="hd' + (i === 0 ? " today" : "") + '">' + d[0] + "<small>" + d[1] + (i === 0 ? " · today" : "") + "</small></div>").join("");
      SLOTS.forEach((s, si) => {
        cal += '<div class="tm">' + s + "</div>";
        DAYS.forEach((d, di) => {
          const here = drops.filter(x => x.day === di && x.slot === si);
          const clash = here.length > 1 && here.some(x => T[x.t].admin.region.some(rg => here.some(y => y !== x && T[y.t].admin.region.indexOf(rg) >= 0)));
          cal += '<div class="cell" data-day="' + di + '" data-slot="' + si + '">' + here.map(x => { const t = T[x.t]; return '<div class="dropb' + (clash ? " warn" : "") + '" draggable="true" data-drop="' + x.id + '">' + UI.poster(t, 22).replace('class="pth"', 'class="pth" style="width:22px"') + "<span>" + esc(t.name.length > 16 ? t.name.slice(0, 15) + "…" : t.name) + "<small>E" + x.ep + "</small></span></div>"; }).join("") + "</div>";
        });
      });
      cal += "</div>";
      return UI.ph("Release schedule", "Drops go out in each viewer's local time. Drag an episode to move it. Reminders send 1 h before; VIP gets followed series 24 h early.",
        UI.segc([["local", "Viewer local time"], ["utc", "UTC"]], st.tz || "local", "tz") + '<button class="b">' + ic("calendar", 15) + "Week of 9 Oct</button>") +
        '<div class="nt amber" style="margin-bottom:14px">' + ic("alert", 16) + "<span><b>Amber blocks overlap</b> in at least one region — two drops in the same hour split attention and reminders. Drag one to another slot.</span></div>" +
        '<div class="tblwrap">' + cal + "</div>" +
        '<div class="grid g3 mt">' + UI.card("Ready to schedule", "Processed and waiting", S.PIPELINE.filter(p => p.stage === "ready").map(p => '<div class="li" style="padding:9px 0"><span class="ic green">' + ic("check", 16) + '</span><span class="b2"><div class="t">' + esc(p.title) + '</div><div class="s">' + esc(p.scheduled ? "Scheduled " + p.scheduled : p.note || "") + "</div></span></div>").join("")) +
        UI.card("Reminders", "", '<dl class="kvs"><dt>Before a drop</dt><dd>1 hour</dd><dt>Max per viewer</dt><dd>3 a day</dd><dt>Quiet hours</dt><dd>11 PM – 8 AM</dd><dt>VIP early access</dt><dd>24 h</dd></dl>') +
        UI.card("This week", "", '<dl class="kvs"><dt>Episodes dropping</dt><dd>' + drops.length + "</dd><dt>Series</dt><dd>6</dd><dt>Followers to remind</dt><dd>2.4M</dd></dl>") + "</div>";
    },
    mount() {
      let dragId = null;
      $$("[data-drop]").forEach(b => { b.addEventListener("dragstart", e => { dragId = b.dataset.drop; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", dragId); } catch (x) { /* */ } }); });
      $$(".cal .cell").forEach(c => {
        c.addEventListener("dragover", e => { e.preventDefault(); c.classList.add("drop"); });
        c.addEventListener("dragleave", () => c.classList.remove("drop"));
        c.addEventListener("drop", e => {
          e.preventDefault(); c.classList.remove("drop");
          const d = st.drops.find(x => x.id === dragId);
          if (!d) return;
          const prev = { day: d.day, slot: d.slot };
          d.day = +c.dataset.day; d.slot = +c.dataset.slot;
          A.rerender();
          toast("Moved " + esc(T[d.t].name) + " E" + d.ep + " to " + DAYS[d.day][0] + " " + SLOTS[d.slot] + " · followers will be re-notified", () => { d.day = prev.day; d.slot = prev.slot; A.rerender(); });
        });
      });
    }
  });
  ACT.tz = (el, k) => { st.tz = k; A.rerender(); };

  /* =====================================================================
     HOME BUILDER (with live phone preview)
     ===================================================================== */
  const RAILS = [
    { id: "hero", n: "Hero carousel", src: "Manual · 5 titles", icon: "film", on: true, auto: false },
    { id: "continue", n: "Continue watching", src: "Automatic · per viewer", icon: "play", on: true, auto: true },
    { id: "fyb", n: "Fits your break", src: "Automatic · 5 / 15 / 30 min", icon: "hourglass", on: true, auto: true },
    { id: "drops", n: "Drops tonight", src: "Automatic · ongoing series", icon: "calendar", on: true, auto: true },
    { id: "top10", n: "Top 10 today", src: "Automatic · by region", icon: "trendup", on: true, auto: true },
    { id: "trope", n: "Because you like…", src: "Personalised · top trope", icon: "sparkle", on: true, auto: true },
    { id: "pilots", n: "Pilot Season", src: "Automatic · voting pilots", icon: "clapper", on: true, auto: true },
    { id: "creators", n: "From creators", src: "Curated · Fan Link videos", icon: "video", on: true, auto: false },
    { id: "long", n: "Series & films", src: "Manual · 4 titles", icon: "tv", on: true, auto: false },
    { id: "tropes", n: "Browse by trope", src: "Taxonomy · 6 tiles", icon: "grid", on: true, auto: false },
    { id: "complete", n: "Complete — binge to the end", src: "Automatic · completed series", icon: "checkc", on: false, auto: true }
  ];
  function homePreview(rails, region) {
    const posters = ids => '<div style="display:flex;gap:5px;overflow:hidden;padding:0 10px">' + ids.map(id => '<span style="flex:none;width:44px;border-radius:5px;overflow:hidden;aspect-ratio:2/3"><img src="' + Art.poster(T[id]) + '" style="width:100%;height:100%;object-fit:cover"></span>').join("") + "</div>";
    const head = n => '<div style="font-size:9.5px;font-weight:700;padding:10px 10px 5px;color:#F3F1EA">' + n + "</div>";
    const IN = region === "IN";
    const blocks = {
      hero: '<div style="margin:6px 10px 2px;border-radius:12px;overflow:hidden;position:relative;height:150px"><img src="' + Art.poster(T[IN ? "sindoor" : "heiress"]) + '" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.9))"></div><div class="serif-i" style="position:absolute;left:10px;bottom:24px;font-size:19px;line-height:.9">' + esc(T[IN ? "sindoor" : "heiress"].name) + '</div><div style="position:absolute;left:10px;bottom:8px;height:13px;padding:0 6px;border-radius:4px;background:var(--accent);color:var(--accent-ink);font-size:7px;font-weight:700;display:grid;place-items:center">▶ Play E1</div></div>',
      continue: head("Continue watching") + posters(["heiress", "moonbound", "contract", "crown"]),
      fyb: '<div style="margin:8px 10px 0;padding:8px;border-radius:9px;background:#151517;font-size:8.5px;color:#B4B1A8"><b style="color:#F3F1EA;font-size:9.5px">Fits your break</b> · 5 / 15 / 30 min</div>',
      drops: head("Drops tonight") + posters(IN ? ["sindoor", "heiress", "rebirth"] : ["heiress", "rebirth", "moonbound", "crown"]),
      top10: head("Top 10 today") + posters(IN ? ["sindoor", "shaadi", "divorce", "fake", "heiress"] : ["contract", "moonbound", "heiress", "twins", "divorce"]),
      trope: head("Because you like revenge") + posters(["divorce", "rebirth", "sindoor", "crown"]),
      pilots: head("Pilot Season") + posters(["lastdelivery", "ghost", "desk14", "aunty"]),
      creators: head("From creators") + '<div style="display:flex;gap:5px;padding:0 10px">' + ["v2", "v1", "v4", "v3"].map(id => '<span style="flex:none;width:44px;border-radius:5px;overflow:hidden;aspect-ratio:9/16"><img src="' + Art.thumb(V[id]) + '" style="width:100%;height:100%;object-fit:cover"></span>').join("") + "</div>",
      long: head("Series & films") + '<div style="display:flex;gap:5px;padding:0 10px">' + ["ledger", "monsoon"].map(id => '<span style="flex:none;width:96px;border-radius:5px;overflow:hidden;aspect-ratio:16/9"><img src="' + Art.wide(T[id]) + '" style="width:100%;height:100%;object-fit:cover"></span>').join("") + "</div>",
      tropes: head("Browse by trope") + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:0 10px">' + ["Revenge", "Hidden identity", "Werewolf", "Billionaire"].map(k => '<span style="height:26px;border-radius:6px;background:#151517;font-size:8.5px;font-weight:650;display:flex;align-items:center;padding:0 7px">' + k + "</span>").join("") + "</div>",
      complete: head("Complete — binge to the end") + posters(["contract", "divorce", "twins", "bodyguard"])
    };
    return '<div class="mini-phone" style="--pw:270px"><div class="scr"><div class="isl"></div><div style="padding-top:34px;height:100%;overflow:hidden">' +
      '<div style="display:flex;align-items:center;padding:0 10px 4px"><span class="serif-i" style="font-size:19px">spool</span><span style="margin-left:auto;font-size:8px;padding:3px 6px;border-radius:999px;background:rgba(242,194,91,.12);color:var(--gold);font-weight:700">310</span></div>' +
      rails.filter(r => r.on).map(r => '<div data-prev="' + r.id + '" style="' + (st.railSel === r.id ? "outline:1.5px solid var(--accent);outline-offset:2px;border-radius:8px;" : "") + '">' + blocks[r.id] + "</div>").join("") + "</div></div></div>";
  }
  A.page("home-builder", {
    title: () => "Home builder",
    crumbs: () => [["Content"], ["Home builder"]],
    render() {
      const reg = st.hbRegion || "US";
      const rails = st.rails || (st.rails = RAILS.map(r => Object.assign({}, r)));
      const sel = rails.find(r => r.id === st.railSel) || rails[0];
      return UI.ph("Home builder", "Arrange the rails viewers see on Home, per region. Drag to reorder; the phone updates live.",
        '<span class="pill amber">' + ic("edit", 12) + 'Unpublished changes</span><a class="b" href="mobile.html#/home" target="_blank" rel="noopener">' + ic("phone", 15) + 'Open in app</a><button class="b pri" data-act="publishHome">Publish layout</button>') +
        '<div class="split" style="--side:330px"><div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start">' +
        UI.card("Rails · " + S.REGIONS[reg].name, rails.filter(r => r.on).length + " of " + rails.length + " on", '<div class="row" style="margin-bottom:12px">' + UI.segc([["US", "US"], ["IN", "India"], ["BR", "Brazil"]], reg, "hbRegion") + "</div>" +
          '<div id="railList">' + rails.map((r, i) => '<div class="rail-row' + (r.on ? "" : " off") + (sel.id === r.id ? " sel" : "") + '" draggable="true" data-rail="' + r.id + '"><span class="gr">' + ic("grip", 16) + '</span><span class="ic">' + ic(r.icon, 16) + '</span><span class="b2" data-act="railSel:' + r.id + '"><div class="t">' + (i + 1) + ". " + esc(r.n) + '</div><div class="s">' + esc(r.src) + "</div></span>" + UI.tog(r.on, "railTog:" + r.id, r.n) + "</div>").join("") + "</div>") +
        UI.card(esc(sel.n), "Rail settings", '<div class="form"><div class="fld"><label>Heading</label><input class="inp" value="' + esc(sel.n) + '"></div>' +
          '<div class="fld"><label>Source</label>' + UI.segc([["auto", "Automatic"], ["pers", "Personalised"], ["manual", "Manual"]], sel.auto ? "auto" : "manual", "noop") + "</div>" +
          '<div class="fld"><label>Items</label><input class="inp" value="' + (sel.id === "top10" ? 10 : 12) + '"></div>' +
          '<div class="fld"><label>Show to</label><div class="chipset">' + ["Everyone", "New viewers", "Payers", "VIP", "Lapsed 7d+"].map((k, i) => '<button class="tchip' + (i === 0 ? " on" : "") + '" data-act="tchip">' + k + "</button>").join("") + "</div></div>" +
          '<div class="fld"><label>Schedule</label><select class="sel"><option>Always</option><option>Weekends only</option><option>Diwali week (IN)</option></select></div>' +
          '<div class="nt">' + ic("info", 16) + "<span>Rails that are empty for a viewer collapse automatically — no blank rows.</span></div></div>") + "</div>" +
        '<div class="stack" style="position:sticky;top:80px">' + UI.card("Preview · " + S.REGIONS[reg].name, "What a returning viewer sees", homePreview(rails, reg)) + "</div></div>";
    },
    mount() {
      let drag = null;
      $$("[data-rail]").forEach(row => {
        row.addEventListener("dragstart", () => { drag = row.dataset.rail; row.classList.add("dragging"); });
        row.addEventListener("dragend", () => row.classList.remove("dragging"));
        row.addEventListener("dragover", e => { e.preventDefault(); row.classList.add("over"); });
        row.addEventListener("dragleave", () => row.classList.remove("over"));
        row.addEventListener("drop", e => {
          e.preventDefault();
          const from = st.rails.findIndex(r => r.id === drag), to = st.rails.findIndex(r => r.id === row.dataset.rail);
          if (from < 0 || to < 0 || from === to) return;
          const [m] = st.rails.splice(from, 1);
          st.rails.splice(to, 0, m);
          A.rerender();
          toast("Moved “" + esc(m.n) + "” to position " + (to + 1));
        });
      });
    }
  });
  ACT.hbRegion = (el, k) => { st.hbRegion = k; A.rerender(); };
  ACT.railSel = (el, id) => { st.railSel = id; A.rerender(); };
  ACT.railTog = (el, id) => { const r = st.rails.find(x => x.id === id); r.on = !r.on; A.rerender(); };
  ACT.publishHome = () => Modal.open({
    title: "Publish Home layout", sub: "Goes live for " + S.REGIONS[st.hbRegion || "US"].name + " in about a minute. The previous layout is kept as version 18.",
    body: '<div class="form"><div class="fld"><label>When</label>' + UI.segc([["now", "Now"], ["later", "Schedule"]], "now", "noop") + '</div><div class="fld"><label>Note for the team</label><input class="inp" placeholder="e.g. Pilot Season up for the weekend"></div></div>',
    foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="pubGo">Publish</button>'
  });
  ACT.pubGo = () => { Modal.close(); toast("Home layout v19 published · rollback available in Audit log"); };

  /* =====================================================================
     CREATOR VIDEOS (UGC review)
     ===================================================================== */
  const UGC_TABS = [["review", "Needs review"], ["flagged", "Flagged"], ["processing", "Processing"], ["live", "Live"], ["changes", "Needs changes"]];
  function ugcOf(tab) {
    const vids = st.vids || (st.vids = S.VIDEOS.map(v => Object.assign({}, v)));
    return vids.filter(v => tab === "review" ? v.status === "review" : tab === "flagged" ? v.status === "flagged" : tab === "processing" ? v.status === "processing" : tab === "changes" ? v.status === "needs-changes" || v.status === "rejected" : v.status === "live");
  }
  A.page("ugc", {
    title: () => "Creator videos",
    crumbs: () => [["Community"], ["Creator videos"]],
    render(r) {
      const tab = r.q.tab || "review";
      const list = ugcOf(tab);
      return UI.ph("Creator videos", "Everything viewers upload passes automatic checks first. Pilots and anything flagged come here for a person to decide.",
        '<a class="b" href="#/moderation">' + ic("shield", 15) + 'Moderation queue</a><a class="b" href="#/moderation?tab=rules">' + ic("sliders", 15) + "Rules</a>") +
        '<div class="grid g4" style="margin-bottom:18px">' + UI.stat({ l: "Uploads today", v: "4,812", d: "9%", dir: "up" }) + UI.stat({ l: "Auto-approved", v: "96.4%", d: "of uploads" }) + UI.stat({ l: "Median review time", v: "38 min", d: "SLA 2 h" }) + UI.stat({ l: "Fan Link unlocks · 30d", v: "61.4K", d: "22%", dir: "up", vs: "→ $41.2K drama revenue" }) + "</div>" +
        UI.tabs(UGC_TABS.map(([k, n]) => [k, n, ugcOf(k).length]), tab, "ugc") +
        (list.length ? '<div class="vcards">' + list.map(v => {
          const c = C[v.by];
          const link = v.link ? T[v.link] : v.pilot ? T[v.pilot] : null;
          return '<button class="vcard" data-act="ugcOpen:' + v.id + '"><div class="poster bare" style="aspect-ratio:9/13"><img src="' + Art.thumb(v) + '" alt="">' +
            '<div class="corner">' + (v.pilot ? '<span class="tag pilot">' + ic("clapper", 11) + "Pilot</span>" : "") + (v.link ? '<span class="tag">' + ic("link", 11) + "Fan Link</span>" : "") + "</div>" +
            (v.flag ? '<div class="flag">' + ic(v.status === "flagged" ? "flag" : "alert", 12) + " " + esc(v.flag) + "</div>" : "") + "</div>" +
            '<div class="vb"><b class="clamp2">' + esc(v.title) + '</b><div class="row" style="gap:6px;margin-top:8px">' + UI.avaC(c, 20) + '<span class="xs-t t3 ellip">' + esc(c.handle) + " · " + esc(v.posted) + " ago</span></div>" +
            (link ? '<div class="xs-t t3" style="margin-top:6px">→ ' + esc(link.name) + "</div>" : "") + "</div></button>";
        }).join("") + "</div>" : '<div class="card pad" style="text-align:center;padding:50px"><div class="serif-i" style="font-size:26px">All clear.</div><p class="t3 sm-t">Nothing waiting in this tab.</p></div>');
    }
  });
  ACT.ugcOpen = (el, id) => {
    const v = st.vids.find(x => x.id === id), c = C[v.by];
    const link = v.link ? T[v.link] : v.pilot ? T[v.pilot] : null;
    const checks = [["Nudity", v.id === "v14" ? .03 : .01], ["Violence", v.id === "v14" ? .41 : .04], ["Copyright match", v.id === "v13" ? .96 : .02], ["Music match", v.id === "v18" ? .88 : .05], ["Spam / scam", .01]];
    Drawer.open({
      title: "Review · " + esc(v.title),
      body: '<div class="row start" style="gap:16px"><div style="width:150px;flex:none"><div class="mini-phone" style="--pw:150px;padding:6px;border-radius:24px"><div class="scr" style="border-radius:19px"><img src="' + Art.thumb(v) + '" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px;border-radius:50%;background:rgba(0,0,0,.4);display:grid;place-items:center">' + ic("play", 20) + "</div></div></div></div>" +
        '<div class="sp"><div class="who">' + UI.avaC(c, 36) + "<div><b>" + esc(c.name) + "</b><small>" + esc(c.handle) + " · " + FMT.n(c.followers) + " followers" + (c.partner ? " · Partner" : "") + "</small></div></div>" +
        '<dl class="kvs mt"><dt>Length</dt><dd>' + FMT.dur(v.dur) + "</dd><dt>Posted</dt><dd>" + esc(v.posted) + " ago</dd><dt>Type</dt><dd>" + (v.pilot ? "Pilot episode" : v.series ? "Series episode" : "Video") + "</dd><dt>Fan Link</dt><dd>" + (link ? esc(link.name) : "—") + "</dd><dt>Rights</dt><dd>Declared ✓</dd><dt>Reports</dt><dd>" + (v.id === "v14" ? "14" : "0") + "</dd></dl></div></div>" +
        (v.flag ? '<div class="nt ' + (v.status === "flagged" ? "red" : "amber") + ' mt">' + ic(v.status === "flagged" ? "flag" : "alert", 16) + "<span><b>" + esc(v.flag) + ".</b> " + (v.id === "v13" ? "Hidden automatically until a moderator decides. The creator has been notified." : "") + "</span></div>" : "") +
        '<div class="lbl" style="margin:18px 0 8px">Automatic checks</div>' + checks.map(([n, s]) => '<div class="score" style="margin-bottom:7px"><span class="sm-t" style="width:120px">' + n + '</span><span class="meter ' + (s > .7 ? "bad" : s > .3 ? "warn" : "ok") + '"><i style="width:' + Math.max(3, s * 100) + '%"></i></span><b>' + Math.round(s * 100) + "%</b></div>").join("") +
        '<div class="fld mt"><label>Reason (sent to the creator)</label><select class="sel" id="ugcReason"><option>—</option><option>Copyright: uses an unreleased Spool episode</option><option>Music not cleared</option><option>Dangerous acts</option><option>Spoiler label missing</option><option>Age rating too low</option></select></div>',
      foot: '<button class="b danger" data-act="ugcDo:' + id + ':remove">' + ic("trash", 15) + 'Remove</button><button class="b" data-act="ugcDo:' + id + ':changes">' + ic("edit", 15) + 'Request changes</button><span class="sp"></span><button class="b pri" data-act="ugcDo:' + id + ':approve">' + ic("check", 15) + "Approve</button>"
    });
  };
  ACT.ugcDo = (el, id, what) => {
    const v = st.vids.find(x => x.id === id);
    const prev = v.status;
    v.status = what === "approve" ? "live" : what === "changes" ? "needs-changes" : "rejected";
    Drawer.close();
    toast({ approve: "Approved · live for followers first", changes: "Changes requested · the creator sees the exact reason", remove: "Removed · strike recorded · creator notified" }[what], () => { v.status = prev; A.rerender(); });
    A.rerender();
  };

  /* =====================================================================
     PILOT SEASON
     ===================================================================== */
  A.page("pilots", {
    title: () => "Pilot Season",
    crumbs: () => [["Community"], ["Pilot Season"]],
    render() {
      const stage = st.pilotStage || (st.pilotStage = { lastdelivery: "Shortlisted", ghost: "Voting", desk14: "Voting", aunty: "Voting" });
      const cols = [["Voting", "Open for votes · 30 days"], ["Shortlisted", "Hit the goal · team review"], ["Greenlit", "Offer sent"], ["In production", "Funded season"]];
      const card = t => {
        const c = C[t.creator], s = stage[t.id];
        return '<div class="kcard"><div class="top2">' + UI.poster(t, 54).replace('class="pth"', 'class="pth" style="width:54px"') + '<div style="min-width:0"><b class="ellip" style="display:block">' + esc(t.name) + '</b><div class="xs-t t3" style="margin-top:3px">' + esc(c.name) + " · " + t.eps + ' eps</div><div class="xs-t t3">' + Math.round(t.completionRate * 100) + "% finish all episodes</div></div></div>" +
          '<div style="margin-top:10px"><div class="meter"><i style="width:' + Math.min(100, t.votes / t.goal * 100) + "%;background:" + (t.votes >= t.goal * .95 ? "var(--st-good)" : "var(--s1)") + '"></i></div><div class="row xs-t t3" style="margin-top:5px"><b style="color:var(--text)">' + FMT.int(t.votes) + "</b> of " + FMT.int(t.goal) + '<span class="sp"></span>' + FMT.n(t.views) + " views</div></div>" +
          '<div class="row" style="margin-top:10px;gap:6px">' + (s === "Voting" ? '<button class="b xs" data-act="pilotMove:' + t.id + ':Shortlisted">Shortlist</button>' : s === "Shortlisted" ? '<button class="b xs pri" data-act="greenlight:' + t.id + '">' + ic("clapper", 12) + "Greenlight</button>" : s === "Greenlit" ? '<button class="b xs" data-act="pilotMove:' + t.id + ':In production">Mark funded</button>' : "") +
          '<a class="b xs ghost" href="mobile.html#/series/' + t.id + '" target="_blank" rel="noopener">Watch</a></div></div>';
      };
      const pilots = S.TITLES.filter(t => t.kind === "pilot");
      return UI.ph("Pilot Season", "Creators post 2–3 episode pilots. Viewers vote “Want more”. Pilots that hit the goal with a strong finish rate get reviewed for a funded season.",
        '<button class="b" data-act="pilotRules">' + ic("sliders", 15) + 'Rules</button><a class="b pri" href="mobile.html#/scenes/pilots" target="_blank" rel="noopener">' + ic("phone", 15) + "See it in the app</a>") +
        '<div class="grid g4" style="margin-bottom:18px">' + UI.stat({ l: "Pilots voting", v: pilots.filter(t => stage[t.id] === "Voting").length + 3 }) + UI.stat({ l: "Votes this month", v: "26.9K", d: "41%", dir: "up" }) + UI.stat({ l: "Average finish rate", v: "72%", d: "vs 41% for Originals" }) + UI.stat({ l: "Greenlit to date", v: "3", d: "Flatmates S2 is one" }) + "</div>" +
        '<div class="kan">' + cols.map(([k, sub]) => {
          const items = pilots.filter(t => stage[t.id] === k);
          const extra = k === "In production" ? '<div class="kcard" style="cursor:default"><div class="top2">' + UI.poster(T.flatmates, 54).replace('class="pth"', 'class="pth" style="width:54px"') + '<div><b>Flatmates S2</b><div class="xs-t t3" style="margin-top:3px">Ritu Sharma · 24 eps · greenlit May</div><div class="xs-t" style="margin-top:3px;color:var(--green-ink)">14 of 24 released</div></div></div></div>' : "";
          return '<div class="kcol"><h4>' + k + '<span class="n">' + (items.length + (extra ? 1 : 0)) + '</span></h4><div class="xs-t t3" style="margin:-6px 6px 10px">' + sub + "</div>" + items.map(card).join("") + extra + (items.length || extra ? "" : '<div class="xs-t t3" style="padding:20px 6px;text-align:center">Nothing here yet</div>') + "</div>";
        }).join("") + "</div>";
    }
  });
  ACT.pilotMove = (el, id, to) => { st.pilotStage[id] = to; toast(esc(T[id].name) + " → " + to); A.rerender(); };
  ACT.greenlight = (el, id) => {
    const t = T[id], c = C[t.creator];
    Modal.open({
      title: "Greenlight " + esc(t.name), sub: esc(c.name) + " · " + FMT.int(t.votes) + " votes · " + Math.round(t.completionRate * 100) + "% finish rate", size: "lg",
      body: '<div class="form two"><div class="fld"><label>Season budget</label><div class="inp-pre"><span>$</span><input value="25,000"></div></div><div class="fld"><label>Episodes</label><input class="inp" value="30"></div>' +
        '<div class="fld"><label>Creator revenue share</label><div class="inp-pre"><span>%</span><input value="30"></div><div class="hint">Of net revenue from this series, paid monthly</div></div><div class="fld"><label>Delivery</label><input class="inp" value="15 Dec 2026"></div>' +
        '<div class="fld full"><label>Message to the creator</label><textarea class="ta" rows="3">Congrats Diego — viewers want more of The Last Delivery. Here are our terms for a 30-episode season.</textarea></div></div>' +
        '<div class="nt mt">' + ic("info", 16) + "<span>Voters get a push when the season is announced (they asked for it). The pilot stays free.</span></div>",
      foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="glGo:' + id + '">' + ic("clapper", 15) + "Send offer</button>"
    });
  };
  ACT.glGo = (el, id) => { st.pilotStage[id] = "Greenlit"; Modal.close(); toast("Offer sent to " + esc(C[T[id].creator].name) + " · voters will be notified on announcement"); A.rerender(); };
  ACT.pilotRules = () => Modal.open({
    title: "Pilot Season rules", sub: "Applied to every pilot automatically",
    body: '<div class="form two"><div class="fld"><label>Votes to shortlist</label><input class="inp" value="10,000"></div><div class="fld"><label>Minimum finish rate</label><div class="inp-pre"><span>%</span><input value="60"></div></div>' +
      '<div class="fld"><label>Voting window</label><input class="inp" value="30 days"></div><div class="fld"><label>Episodes per pilot</label><input class="inp" value="2–3"></div>' +
      '<div class="fld full"><label>Vote eligibility</label><select class="sel"><option>Watched at least 1 full episode · 1 vote per account</option></select><div class="hint">New accounts under 24 h can\'t vote — stops vote farming.</div></div></div>',
    foot: '<button class="b" data-act="mclose">Close</button><button class="b pri" data-act="mclose">Save rules</button>'
  });
})();
