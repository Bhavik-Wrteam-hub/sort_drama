/* ==========================================================================
   Spool — mobile app core
   --------------------------------------------------------------------------
   State, router, view transitions, sheets, toasts, push banners, the wallet
   and unlock rules, and the player engine. Screens and sheet bodies are
   registered from mobile-screens.js; the stage around the phone lives in
   stage.js and listens through App.on().

   Business rules encoded here (the parts that must survive to production):
   - Bonus coins are spent before paid coins, earliest expiry first.
   - An unlock is idempotent: one key per (viewer, title, episode).
   - Auto-unlock is off by default and always bounded by the daily cap.
   - The price a viewer saw when they started a series is locked for them.
   - A rewarded ad that fails still grants the episode.
   - VIP never sees an ad. The renewal reminder cannot be switched off.
   ========================================================================== */
(function (root) {
  "use strict";

  const S = root.SPOOL;
  const { FMT, T, C } = S;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ---------------- state ---------------- */
  const st = {};
  function resetState(persona) {
    const v = S.VIEWER;
    Object.assign(st, {
      persona: persona || "fan",
      region: st.region || "US",
      name: v.name, handle: v.handle,
      signedIn: true,
      vip: false,
      wallet: clone(v.wallet),
      unlocked: clone(v.unlocked),
      passes: new Set(v.passes),
      priceLock: clone(v.priceLock),
      progress: clone(v.progress),
      myList: new Set(v.myList),
      following: new Set(v.following),
      followingCreators: new Set(v.followingCreators),
      likes: new Set(),
      streak: v.streak, checkedInToday: v.checkedInToday,
      adsToday: v.adsToday,
      spendCap: v.spendCap, spentToday: v.spentToday,
      autoUnlock: v.autoUnlock,
      tropes: new Set(v.tropes),
      ledger: clone(S.LEDGER),
      inbox: clone(S.INBOX),
      calls: {}, votes: new Set(),
      returning: false,
      demoSpeed: st.demoSpeed || 3,
      giftsLeft: 2,
      autoplay: true, dataSaver: false, pin: false, teen: false,
      tasks: clone(S.REWARDS.tasks),
      uploads: [],
      myComments: [],
      settings: { quality: "Auto", audio: "Original", subs: "English", speed: 1 },
      /* per-screen UI state */
      homeTab: "foryou", libTab: "watching", feedTab: "foryou", feedIdx: 0, creatorTab: "videos", chart: "today",
      dropDay: 0, dropsFollowing: false, seriesTab: {}, epRange: {}, ledgerFilter: "all", q: "", sceneSearch: false,
      uopt: null, pack: null, plan: null, draft: null, giftTo: null, rateDraft: 0, clean: false, fyb: 15
    });
    if (persona === "new") {
      Object.assign(st, {
        name: "Guest", handle: "guest_4821", signedIn: false,
        wallet: { paid: 0, bonus: 100, bonusExpires: "16 Oct" },
        unlocked: {}, passes: new Set(), priceLock: {}, progress: {},
        myList: new Set(), following: new Set(), followingCreators: new Set(),
        streak: 0, checkedInToday: false, adsToday: 0, tropes: new Set(),
        ledger: [{ id: "L-90001", day: "Today", time: now(), type: "welcome", label: "Welcome bonus", sub: "New account", bonus: 100, paid: 0, after: [0, 100], ref: "promo:welcome", exp: "16 Oct" }],
        inbox: [], votes: new Set()
      });
    }
    if (persona === "vip") st.vip = true;
  }

  /* ---------------- tiny event bus (the stage listens) ---------------- */
  const subs = {};
  function on(ev, fn) { (subs[ev] = subs[ev] || []).push(fn); }
  function emit(ev, a, b, c) { (subs[ev] || []).forEach(fn => { try { fn(a, b, c); } catch (e) { console.error(e); } }); }
  /* log(kind, message, detail) feeds the Live events panel */
  function log(kind, msg, detail) { emit("log", kind, msg, detail); }

  /* ---------------- helpers ---------------- */
  function now() { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function key() { return Math.random().toString(16).slice(2, 10); }
  const R = () => S.REGIONS[st.region];
  function money(coins) { return FMT.money(coins, st.region); }
  function coin(n, cls) { return '<span class="coin' + (cls ? " " + cls : "") + '">' + ic("coin") + FMT.int(n) + "</span>"; }
  function priceOf(t) {
    if (st.priceLock[t.id]) return st.priceLock[t.id];
    const r = R();
    if (st.region === "US" || t.lang === "hi") return t.price;
    return Math.max(10, Math.round(t.price * r.epPrice / 60));
  }
  function freeOf(t) { return t.free; }
  function passOf(t) {
    if (t.pass) return st.region === "US" || t.lang === "hi" ? t.pass : Math.round(t.pass * R().epPrice / 60);
    const rem = Math.max(0, t.eps - freeOf(t));
    return Math.round(rem * priceOf(t) * .62 / 10) * 10;
  }
  function isPremiere(t) { return false && t; }
  function access(t, n) {
    if (n > t.released) return "soon";
    if (t.kind === "pilot") return "free";
    if (n <= freeOf(t)) return "free";
    if (st.passes.has(t.id)) return "pass";
    if ((st.unlocked[t.id] || 0) >= n) return "unlocked";
    if (st.vip && !isPremiere(t)) return "vip";
    return "locked";
  }
  function canWatch(t, n) { const a = access(t, n); return a !== "locked" && a !== "soon"; }
  function costToFinish(t) {
    let catchUp = 0, whole = 0;
    for (let n = 1; n <= t.eps; n++) {
      if (canWatch(t, n) && n <= t.released) continue;
      if (n <= freeOf(t)) continue;
      whole++;
      if (n <= t.released) catchUp++;
    }
    const p = priceOf(t);
    return { catchUpEps: catchUp, catchUp: catchUp * p, wholeEps: whole, whole: whole * p, pass: passOf(t) };
  }
  function balance() { return st.wallet.paid + st.wallet.bonus; }
  function split(cost) {
    const b = Math.min(st.wallet.bonus, cost);
    return { bonus: b, paid: cost - b, ok: cost - b <= st.wallet.paid };
  }

  function poster(t, o) {
    o = o || {};
    const tags = [];
    if (o.tags !== false) {
      if (t.kind === "pilot") tags.push('<span class="tag pilot">' + ic("clapper", 11) + "Pilot</span>");
      else if (o.newEp) tags.push('<span class="tag new">New ep</span>');
      if (t.kind === "series" && !o.compact) tags.push('<span class="tag">Series</span>');
      if (t.kind === "movie" && !o.compact) tags.push('<span class="tag">Film</span>');
      if (st.vip && t.kind !== "pilot" && t.kind !== "creator" && o.vipTag) tags.push('<span class="tag vip">VIP</span>');
      if (o.free) tags.push('<span class="tag free">Free</span>');
    }
    const ratio = o.wide ? " wide" : o.tall ? " tall" : "";
    const img = o.wide ? Art.wide(t) : Art.poster(t);
    return '<div class="poster' + ratio + '"><img src="' + img + '" alt="" loading="lazy">' +
      (tags.length ? '<div class="corner">' + tags.join("") + "</div>" : "") +
      (o.title === false ? "" : '<div class="pt ' + t.st + '">' + (o.kicker === false ? "" : "<small>" + esc(t.kicker || "") + "</small>") + esc(t.name) + "</div>") +
      "</div>";
  }
  function avaC(c, size) {
    const cr = typeof c === "string" ? C[c] : c;
    return '<span class="ava" style="--s:' + (size || 36) + 'px"><img src="' + Art.avatar(cr.id, { pal: cr.pal, kind: cr.kind, hair: cr.hair }) + '" alt=""></span>';
  }
  function avaSeed(seed, size, o) {
    return '<span class="ava" style="--s:' + (size || 36) + 'px"><img src="' + Art.avatar(seed, o) + '" alt=""></span>';
  }
  function stars(n) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += ic(i <= Math.round(n) ? "starf" : "star", 12);
    return '<span class="st">' + s + "</span>";
  }
  function epTitle(t, n) { return S.episodes(t)[n - 1]; }

  /* ---------------- router ---------------- */
  const SCREENS = {};
  const SHEETS = {};
  let current = null;       // { name, args, path, def, view }
  const stack = [];
  const app = () => $("#app");

  function parse(path) {
    path = String(path || "home").replace(/^#?\/?/, "");
    const [name, ...args] = path.split("/").map(decodeURIComponent);
    return { name: SCREENS[name] ? name : "home", args, path: SCREENS[name] ? path : "home" };
  }
  function go(path, opt) {
    opt = opt || {};
    Sheet.close(true);
    const r = parse(path);
    if (opt.replace && stack.length) stack[stack.length - 1] = r; else stack.push(r);
    render(r, opt.dir || (SCREENS[r.name].rise ? "rise" : "push"));
  }
  function back() {
    Sheet.close(true);
    if (stack.length > 1) { stack.pop(); render(stack[stack.length - 1], "pop"); }
    else render(parse("home"), "fade");
  }
  function tab(name) {
    Sheet.close(true);
    stack.length = 0;
    const r = parse(name);
    stack.push(r);
    render(r, "fade");
  }
  function replace(path) { go(path, { replace: true, dir: "none" }); }

  function render(r, dir) {
    const def = SCREENS[r.name];
    const old = current && current.view;
    if (current && current.def.unmount) { try { current.def.unmount(current.view); } catch (e) { console.error(e); } }
    Player.stop();
    const view = document.createElement("div");
    view.className = "view";
    view.innerHTML = def.render.apply(null, r.args);
    if (old) {
      old.classList.add("leaving");
      if (dir !== "none") old.classList.add("v-leave-" + dir);
      setTimeout(() => old.remove(), dir === "none" ? 0 : 470);
    }
    if (dir !== "none") { view.classList.add("v-enter-" + dir); setTimeout(() => view.classList.remove("v-enter-" + dir), 480); }
    app().appendChild(view);
    $("#screen").classList.remove("scrolled");
    current = { name: r.name, args: r.args, path: r.path, def: def, view: view };
    if (def.mount) def.mount.apply(null, [view].concat(r.args));
    wireScroll(view);
    updateTabbar();
    try { history.replaceState(null, "", "#/" + r.path); } catch (e) { /* file:// in some browsers */ }
    emit("route", current);
    log("view", "screen_view · <b>" + esc(def.title ? def.title.apply(null, r.args) : r.name) + "</b>", "route=/" + r.path);
  }
  /* Re-render the current screen in place after a state change, keeping
     the scroll position. */
  function refresh() {
    if (!current || current.def.noRefresh) return;
    const sc = $(".scroll", current.view);
    const top = sc ? sc.scrollTop : 0;
    if (current.def.unmount) current.def.unmount(current.view);
    current.view.innerHTML = current.def.render.apply(null, current.args);
    if (current.def.mount) current.def.mount.apply(null, [current.view].concat(current.args));
    const sc2 = $(".scroll", current.view);
    if (sc2) sc2.scrollTop = top;
    wireScroll(current.view);
    updateTabbar();
  }

  /* ---------------- tab bar (minimises on scroll down) ---------------- */
  const TABS = [["home", "home", "Home"], ["scenes", "scenes", "Scenes"], ["create", "plus", ""], ["library", "library", "Library"], ["me", "user", "Me"]];
  function updateTabbar() {
    const bar = $("#tabbar");
    const def = current && current.def;
    const show = def && def.tab;
    bar.classList.toggle("hide", !show);
    bar.classList.remove("min");
    const unread = st.inbox.filter(n => n.unread).length;
    bar.innerHTML = TABS.map(([k, icon, label]) => {
      if (k === "create") return '<button class="tb plus" data-go="create" aria-label="Create">' + '<span class="pl">' + ic("plus", 22, 2.4) + "</span></button>";
      const on = show === k;
      return '<button class="tb' + (on ? " on" : "") + '" data-tab="' + k + '" aria-label="' + label + '"' + (on ? ' aria-current="page"' : "") + ">" +
        ic(icon, 23, on ? 2.1 : 1.8) + "<span>" + label + "</span>" +
        (k === "me" && unread ? '<i class="bdg">' + unread + "</i>" : "") + "</button>";
    }).join("");
  }
  function wireScroll(view) {
    const sc = $(".scroll", view);
    if (!sc) return;
    let last = 0;
    sc.addEventListener("scroll", () => {
      const y = sc.scrollTop, bar = $("#tabbar");
      $("#screen").classList.toggle("scrolled", y > 8);
      if (Math.abs(y - last) < 6) return;
      bar.classList.toggle("min", y > last && y > 80);
      last = y;
    }, { passive: true });
  }

  /* ---------------- sheets ---------------- */
  const Sheet = {
    kind: null,
    open(kind) {
      const def = SHEETS[kind];
      if (!def) return;
      const args = Array.prototype.slice.call(arguments, 1);
      const el = $("#sheet");
      if (Sheet.kind && SHEETS[Sheet.kind] && SHEETS[Sheet.kind].unmount) SHEETS[Sheet.kind].unmount(el);
      el.className = "sheet" + (def.full ? " full" : "");
      el.innerHTML = '<div class="grab" data-grab></div>' + def.render.apply(null, args);
      $("#scrim").classList.add("on");
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("on")));
      Sheet.kind = kind;
      Sheet.args = args;
      if (def.mount) def.mount.apply(null, [el].concat(args));
      if (def.pause !== false) Player.pause(true);
      emit("sheet", kind);
      log("view", "sheet_open · <b>" + esc(def.title || kind) + "</b>", args.length ? args.join(" · ") : "");
    },
    refresh() {
      if (!Sheet.kind) return;
      const def = SHEETS[Sheet.kind], el = $("#sheet");
      const sb = $(".sh-b", el), top = sb ? sb.scrollTop : 0;
      el.innerHTML = '<div class="grab" data-grab></div>' + def.render.apply(null, Sheet.args);
      if (def.mount) def.mount.apply(null, [el].concat(Sheet.args));
      const sb2 = $(".sh-b", el); if (sb2) sb2.scrollTop = top;
    },
    close(silent) {
      if (!Sheet.kind) return;
      const def = SHEETS[Sheet.kind];
      const el = $("#sheet");
      if (def && def.unmount) def.unmount(el);
      el.classList.remove("on");
      el.style.transform = "";
      $("#scrim").classList.remove("on");
      const k = Sheet.kind;
      Sheet.kind = null;
      setTimeout(() => { if (!Sheet.kind) el.innerHTML = ""; }, 420);
      if (!silent && def && def.resume !== false) Player.resume();
      emit("sheet", null, k);
    }
  };
  function wireSheetDrag() {
    const el = $("#sheet");
    let y0 = null, dy = 0;
    el.addEventListener("pointerdown", e => {
      if (!e.target.closest("[data-grab]")) return;
      y0 = e.clientY; dy = 0;
      el.style.transition = "none";
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", e => {
      if (y0 == null) return;
      dy = Math.max(0, (e.clientY - y0) / scale());
      el.style.transform = "translateY(" + dy + "px)";
    });
    const end = () => {
      if (y0 == null) return;
      y0 = null;
      el.style.transition = "";
      if (dy > 110) Sheet.close(); else el.style.transform = "";
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    $("#scrim").addEventListener("click", () => Sheet.close());
  }

  /* ---------------- toast & push ---------------- */
  let toastTimer = null;
  function toast(html, icon, tone) {
    const el = $("#toast");
    el.innerHTML = (icon ? '<span class="' + (tone || "ok") + '">' + ic(icon, 18, 2) + "</span>" : "") + "<span>" + html + "</span>";
    el.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("on"), 2600);
  }
  let pushTimer = null;
  function push(p) {
    const el = $("#push");
    el.innerHTML = '<div class="app-ic">' + brandMark(24) + '</div><div class="b"><div class="h"><span>SPOOL</span><span>now</span></div>' +
      '<div class="t">' + esc(p.title) + '</div><div class="s">' + esc(p.body) + "</div></div>";
    el.onclick = () => { el.classList.remove("on"); if (p.go) go(p.go); if (p.after) p.after(); };
    el.classList.add("on");
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => el.classList.remove("on"), 6000);
    log("push", "Push delivered · <b>" + esc(p.title) + "</b>", p.payload || "");
    if (p.inbox !== false) st.inbox.unshift({ id: "n" + key(), icon: p.icon || "bell", kind: "push", t: p.title, s: p.body, ago: "now", go: p.go, unread: true });
    updateTabbar();
  }

  /* ---------------- money movements ---------------- */
  function addLedger(row) {
    row.id = "L-" + (90000 + st.ledger.length * 7);
    row.day = "Today"; row.time = now();
    row.after = [st.wallet.paid, st.wallet.bonus];
    st.ledger.unshift(row);
    emit("wallet");
  }
  function spend(cost, label, ref) {
    const sp = split(cost);
    st.wallet.bonus -= sp.bonus;
    st.wallet.paid -= sp.paid;
    st.spentToday += cost;
    addLedger({ type: "unlock", label: label, sub: sp.bonus && sp.paid ? sp.bonus + " bonus first, then " + sp.paid + " paid" : sp.bonus ? "Bonus coins" : "Paid coins", bonus: -sp.bonus, paid: -sp.paid, ref: ref });
    log("ledger", "<b>−" + cost + "</b> coins · " + (sp.bonus ? sp.bonus + " bonus" : "") + (sp.bonus && sp.paid ? " + " : "") + (sp.paid ? sp.paid + " paid" : ""),
      "balance → " + st.wallet.paid + " paid · " + st.wallet.bonus + " bonus · append-only row " + st.ledger[0].id);
    return sp;
  }
  function credit(paid, bonus, label, sub, type, extra) {
    st.wallet.paid += paid;
    st.wallet.bonus += bonus;
    addLedger(Object.assign({ type: type || "topup", label: label, sub: sub, bonus: bonus, paid: paid, ref: (extra && extra.ref) || "ref:" + key(), exp: bonus ? "16 Oct" : undefined }, extra || {}));
    log("ledger", "<b>+" + (paid + bonus) + "</b> coins · " + (paid ? paid + " paid" : "") + (paid && bonus ? " + " : "") + (bonus ? bonus + " bonus (expires 16 Oct)" : ""),
      "balance → " + st.wallet.paid + " paid · " + st.wallet.bonus + " bonus");
  }

  /* unlock(titleId, ep, method) → true when the episode is now watchable */
  function unlock(id, n, method, quiet) {
    const t = T[id];
    n = +n;
    const idem = "unl_" + st.persona + "_" + id + "_" + n;
    if (canWatch(t, n)) { log("api", "POST /v1/unlocks → <b>200 (already unlocked)</b>", "idempotency_key=" + idem + " · no charge"); return true; }
    if (method === "coins") {
      const cost = priceOf(t);
      const sp = split(cost);
      if (!sp.ok) { Sheet.open("topup", id, n); log("track", "unlock_blocked · insufficient_balance", "needs " + cost + " · has " + balance()); return false; }
      if (st.spentToday + cost > st.spendCap) { Sheet.open("cap", id, n); log("track", "unlock_blocked · daily_cap", "cap " + st.spendCap + " · spent " + st.spentToday); return false; }
      log("api", "POST /v1/unlocks · <b>201 Created</b>", "{title:" + id + ", ep:" + n + ", method:coins, price:" + cost + ", idempotency_key:" + idem + "}");
      spend(cost, "Unlocked · " + t.name + " E" + n, idem);
      if (!st.priceLock[id]) { st.priceLock[id] = cost; log("track", "price_lock_set", t.name + " · " + cost + " coins per episode for this viewer"); }
    } else if (method === "ad") {
      st.adsToday++;
      log("api", "POST /v1/unlocks · <b>201 Created</b>", "{title:" + id + ", ep:" + n + ", method:rewarded_ad, ssv:verified, idempotency_key:" + idem + "}");
    } else if (method === "winback") {
      log("api", "POST /v1/unlocks · <b>201 Created</b>", "{method:winback_offer, campaign:cp-1, once_per_series:true}");
    }
    st.unlocked[id] = Math.max(st.unlocked[id] || 0, n);
    log("track", "unlock_success", "{title:" + id + ", ep:" + n + ", method:" + method + "}");
    if (!quiet) toast("Unlocked E" + n + (method === "coins" ? " · " + priceOf(t) + " coins" : method === "ad" ? " · thanks for watching" : ""), "unlock");
    emit("wallet");
    return true;
  }
  function buyPass(id) {
    const t = T[id], cost = passOf(t), sp = split(cost);
    if (!sp.ok) { Sheet.open("topup", id, 0, cost); return false; }
    log("api", "POST /v1/passes · <b>201 Created</b>", "{title:" + id + ", price:" + cost + ", covers:all future episodes}");
    spend(cost, "Series Pass · " + t.name, "pass_" + id);
    st.passes.add(id);
    toast("Series Pass active · every episode of " + esc(t.name), "pass");
    log("track", "pass_purchase", "{title:" + id + ", coins:" + cost + "}");
    return true;
  }

  /* ---------------- the player engine ----------------
     A "video" here is a set of scene stills that cut and drift, a subtitle
     track and a reaction heat track. Time runs at demo speed (3× by default)
     so a 90-second episode plays in about 30 seconds; labels show real time. */
  const Player = {
    el: null, t: null, n: 0, sc: null, time: 0, playing: false, raf: 0, last: 0,
    fast: false, line: -1, shot: 0, firedPk: {}, quart: {}, preloaded: false, ended: false,
    mount(view, id, n, at) {
      Player.stop();
      Player.el = view;
      Player.t = T[id];
      Player.n = +n;
      Player.sc = S.SCRIPT[id + ":" + n] || S.genericScript(Player.t, +n);
      Player.time = +at || 0;
      Player.line = -1; Player.shot = 0; Player.firedPk = {}; Player.quart = {}; Player.preloaded = false; Player.ended = false;
      Player.drawHeat();
      if (!canWatch(Player.t, Player.n)) { Player.playing = false; return; }
      const p = st.progress[id] || (st.progress[id] = {});
      p.ep = Player.n; p.lastSeen = "Now";
      Player.play(true);
      log("track", "episode_start", "{title:" + id + ", ep:" + n + ", source:" + (at ? "resume" : "tap") + ", lang:" + st.settings.audio + ", q:" + st.settings.quality + "}");
    },
    drawHeat() {
      const heat = $(".pulse .heat", Player.el);
      if (!heat) return;
      const max = Math.max.apply(null, Player.sc.heat);
      heat.innerHTML = Player.sc.heat.map(v => '<i style="height:' + Math.max(8, v / max * 100) + '%"' + (v / max > .55 ? ' class="hot"' : "") + "></i>").join("");
      const pk = $(".pulse .pks", Player.el);
      if (pk) pk.innerHTML = Player.sc.peaks.map(p => '<button class="pk" style="left:' + (p.t / Player.sc.dur * 100) + '%" data-act="seek:' + (p.t - 2) + '" title="' + esc(p.label) + '">' + p.e + "</button>").join("");
    },
    play(first) {
      if (!Player.el || !canWatch(Player.t, Player.n)) return;
      if (Player.ended && !first) { Player.time = 0; Player.ended = false; }
      Player.playing = true;
      Player.el.querySelector(".player") && Player.el.querySelector(".player").classList.remove("paused");
      Player.last = performance.now();
      cancelAnimationFrame(Player.raf);
      Player.raf = requestAnimationFrame(Player.tick);
      if (!first) log("track", "playback_resume", "t=" + FMT.dur(Player.time));
    },
    pause(auto) {
      if (!Player.playing) return;
      Player.playing = false;
      Player.autoPaused = !!auto;
      cancelAnimationFrame(Player.raf);
      const p = Player.el && Player.el.querySelector(".player");
      if (p && !auto) p.classList.add("paused");
    },
    resume() { if (Player.autoPaused && Player.el && !Player.ended) { Player.autoPaused = false; Player.play(); } },
    toggle() { if (Player.playing) { Player.pause(); log("track", "playback_pause", "t=" + FMT.dur(Player.time)); } else Player.play(); },
    stop() { cancelAnimationFrame(Player.raf); Player.playing = false; Player.el = null; },
    seek(t) {
      Player.time = Math.max(0, Math.min(Player.sc.dur - .5, +t));
      Player.line = -1;
      Player.ended = false;
      const end = Player.el && $(".endcard", Player.el);
      if (end) end.remove();
      const pl = Player.el && $(".player", Player.el);
      if (pl) pl.classList.remove("ended");
      Player.paint();
      if (!Player.playing) Player.play();
      log("track", "seek", "t=" + FMT.dur(Player.time));
    },
    tick(ts) {
      if (!Player.playing || !Player.el) return;
      const dt = Math.min(.1, (ts - Player.last) / 1000);
      Player.last = ts;
      Player.time += dt * st.demoSpeed * (Player.fast ? 2 : 1) * (st.settings.speed || 1);
      if (Player.time >= Player.sc.dur) { Player.time = Player.sc.dur; Player.paint(); Player.end(); return; }
      Player.paint();
      Player.raf = requestAnimationFrame(Player.tick);
    },
    paint() {
      const el = Player.el;
      if (!el) return;
      const sc = Player.sc, f = Player.time / sc.dur;
      const line = $(".pulse .line i", el), knob = $(".pulse .knob", el);
      if (line) line.style.width = (f * 100) + "%";
      if (knob) knob.style.left = (f * 100) + "%";
      const bars = $$(".pulse .heat i", el);
      const cut = Math.floor(f * bars.length);
      bars.forEach((b, i) => b.classList.toggle("past", i < cut));
      const tl = $(".ptime .a", el);
      if (tl) tl.textContent = FMT.dur(Player.time);
      // subtitles
      const L = sc.lines.findIndex(l => Player.time >= l[0] && Player.time < l[1]);
      if (L !== Player.line) {
        Player.line = L;
        const sub = $(".subs", el);
        if (sub) {
          if (L < 0 || st.settings.subs === "Off") sub.innerHTML = "";
          else {
            const l = sc.lines[L];
            sub.className = "subs" + (l[2] ? "" : " fx");
            sub.innerHTML = '<div class="line-in">' + (l[2] ? '<span class="who">' + esc(l[2]) + "</span>" : "") + '<span class="ln">' + esc(l[3]) + "</span></div>";
          }
        }
      }
      // cuts between shots every ~7 s of video time
      const shot = Math.floor(Player.time / 7) % 3;
      if (shot !== Player.shot) {
        Player.shot = shot;
        $$(".pslide.cur .vid img.shot", el).forEach((im, i) => im.classList.toggle("on", i === shot));
      }
      // reactions at peaks
      sc.peaks.forEach((p, i) => {
        if (!Player.firedPk[i] && Player.time >= p.t) {
          Player.firedPk[i] = true;
          Player.float(p.e, 7);
          log("track", "pulse_peak · " + p.e + " " + esc(p.label), "t=" + FMT.dur(p.t) + " · reactions/sec spike");
        }
      });
      // quartiles + preload
      [.25, .5, .75].forEach(q => {
        if (!Player.quart[q] && f >= q) { Player.quart[q] = true; log("track", "episode_progress · " + (q * 100) + "%", "{title:" + Player.t.id + ", ep:" + Player.n + "}"); }
      });
      if (!Player.preloaded && f >= .6 && Player.n < Player.t.eps) {
        Player.preloaded = true;
        const nx = Player.n + 1, a = access(Player.t, nx);
        log("api", "GET /v1/episodes/" + Player.t.id + "/" + nx + "/manifest · <b>" + (a === "locked" ? "402 locked" : a === "soon" ? "425 not yet" : "200") + "</b>",
          a === "locked" ? "unlock options prefetched · price " + priceOf(Player.t) + " · balance " + balance() : "preloading first segment · 240p · 0.4 s · signed URL ttl 300 s");
      }
    },
    float(e, n) {
      const box = Player.el && $(".floaters", Player.el);
      if (!box) return;
      for (let i = 0; i < (n || 1); i++) {
        setTimeout(() => {
          if (!box.isConnected) return;
          const s = document.createElement("span");
          s.textContent = e;
          s.style.left = (Math.random() * 30) + "px";
          s.style.fontSize = (18 + Math.random() * 10) + "px";
          box.appendChild(s);
          setTimeout(() => s.remove(), 2700);
        }, i * 140);
      }
    },
    end() {
      Player.playing = false;
      Player.ended = true;
      cancelAnimationFrame(Player.raf);
      log("track", "episode_complete", "{title:" + Player.t.id + ", ep:" + Player.n + "}");
      emit("ended", Player.t, Player.n);
    }
  };

  /* ---------------- gestures for pagers (player, scenes) ---------------- */
  function scale() { return root.Stage ? root.Stage.scale() : 1; }
  function pager(surface, opts) {
    let y0 = null, x0 = 0, dy = 0, moved = false, t0 = 0, press = null, lastTap = 0, tapTimer = null;
    const track = () => $(".ptrack", surface);
    surface.addEventListener("pointerdown", e => {
      if (e.target.closest("button, a, input, .endcard, .lockpane .btn, .pulse")) return;
      y0 = e.clientY; x0 = e.clientX; dy = 0; moved = false; t0 = Date.now();
      const tr = track(); if (tr) tr.style.transition = "none";
      press = setTimeout(() => { if (!moved && opts.onHold) opts.onHold(true); }, 420);
    });
    surface.addEventListener("pointermove", e => {
      if (y0 == null) return;
      dy = (e.clientY - y0) / scale();
      if (Math.abs(dy) > 8 || Math.abs(e.clientX - x0) > 8) { moved = true; clearTimeout(press); }
      const tr = track();
      if (tr && moved) tr.style.transform = "translateY(" + dy * .9 + "px)";
    });
    const up = e => {
      if (y0 == null) return;
      clearTimeout(press);
      if (opts.onHold) opts.onHold(false);
      const tr = track();
      if (tr) tr.style.transition = "";
      const held = Date.now() - t0 > 400;
      y0 = null;
      if (moved && Math.abs(dy) > 70) {
        const dir = dy < 0 ? 1 : -1;
        if (opts.canMove && !opts.canMove(dir)) { if (tr) tr.style.transform = ""; return; }
        if (tr) tr.style.transform = "translateY(" + (dir > 0 ? -100 : 100) + "%)";
        setTimeout(() => opts.onMove(dir), 330);
        return;
      }
      if (tr) tr.style.transform = "";
      if (moved || held) return;
      const nowT = Date.now();
      if (nowT - lastTap < 280) {
        clearTimeout(tapTimer);
        lastTap = 0;
        if (opts.onDouble) {
          const r = surface.getBoundingClientRect();
          opts.onDouble((e.clientX - r.left) / scale(), (e.clientY - r.top) / scale());
        }
      } else {
        lastTap = nowT;
        tapTimer = setTimeout(() => { if (opts.onTap) opts.onTap(); }, 260);
      }
    };
    surface.addEventListener("pointerup", up);
    surface.addEventListener("pointercancel", up);
    let wheelLock = 0;
    surface.addEventListener("wheel", e => {
      if (Math.abs(e.deltaY) < 30 || Date.now() < wheelLock) return;
      e.preventDefault();
      wheelLock = Date.now() + 700;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (opts.canMove && !opts.canMove(dir)) return;
      const tr = track();
      if (tr) tr.style.transform = "translateY(" + (dir > 0 ? -100 : 100) + "%)";
      setTimeout(() => opts.onMove(dir), 330);
    }, { passive: false });
  }

  function heartBurst(container, x, y) {
    const b = document.createElement("div");
    b.className = "burst";
    b.style.left = x + "px"; b.style.top = y + "px";
    b.innerHTML = ic("heartf", 96);
    container.appendChild(b);
    setTimeout(() => b.remove(), 820);
  }

  /* ---------------- click delegation ---------------- */
  const ACT = {};
  function wireClicks() {
    const screen = $("#screen");
    screen.addEventListener("click", e => {
      const el = e.target.closest("[data-go],[data-tab],[data-back],[data-sheet],[data-act],[data-close]");
      if (!el || !screen.contains(el)) return;
      e.preventDefault();
      if (el.hasAttribute("data-back")) return back();
      if (el.hasAttribute("data-close")) return Sheet.close();
      if (el.dataset.tab) return tab(el.dataset.tab);
      if (el.dataset.go) { Sheet.close(true); return go(el.dataset.go); }
      if (el.dataset.sheet) { const a = el.dataset.sheet.split(":"); return Sheet.open.apply(null, a); }
      if (el.dataset.act) {
        const a = el.dataset.act.split(":");
        const fn = ACT[a[0]];
        if (fn) fn.apply(null, [el].concat(a.slice(1)));
        else console.warn("no action", a[0]);
      }
    });
    document.addEventListener("keydown", e => {
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "Escape" && Sheet.kind) { Sheet.close(); return; }
      if (!current) return;
      if (current.def.keys) current.def.keys(e);
    });
  }

  /* ---------------- public API ---------------- */
  const App = {
    st, S, $, $$, esc, ic: (n, s, w) => root.ic(n, s, w), money, coin, priceOf, passOf, freeOf, access, canWatch, costToFinish, balance, split,
    poster, avaC, avaSeed, stars, epTitle, now, key,
    SCREENS, SHEETS, ACT, Sheet, Player, pager, heartBurst,
    go, back, tab, replace, refresh, toast, push, log, on, emit,
    unlock, buyPass, spend, credit, addLedger,
    screen(name, def) { SCREENS[name] = def; },
    sheet(name, def) { SHEETS[name] = def; },
    current: () => current,
    reset(persona) {
      resetState(persona);
      emit("wallet");
      emit("scenario");
    },
    start(path) {
      resetState("fan");
      wireClicks();
      wireSheetDrag();
      const p = path || (location.hash && location.hash.length > 2 ? location.hash.slice(2) : "splash");
      stack.length = 0;
      go(p, { dir: "fade" });
    }
  };
  root.App = App;
})(window);
