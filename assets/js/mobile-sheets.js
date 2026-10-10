/* ==========================================================================
   Spool — sheets and actions
   --------------------------------------------------------------------------
   Sheets are { title, full?, render(...args) → html, mount?, pause?, resume? }.
   Actions are functions on App.ACT, called from data-act="name:arg:arg".
   ========================================================================== */
(function () {
  "use strict";
  const A = window.App;
  const { st, S, esc, coin, money, poster, avaC, avaSeed, stars, $, $$, Sheet, Player } = A;
  const { FMT, T, C, V } = S;
  const ic = window.ic;
  const ACT = A.ACT;

  function head(title, sub, serif) {
    return '<div class="sh-h"><div class="b"><h3' + (serif ? ' class="serif"' : "") + ">" + title + "</h3>" + (sub ? '<div class="s">' + sub + "</div>" : "") + '</div><button class="ib sm" data-close aria-label="Close">' + ic("x", 20) + "</button></div>";
  }
  const inPlayer = () => { const c = A.current(); return c && c.name === "player"; };
  const castAva = (c, s) => '<span class="ava" style="--s:' + (s || 40) + 'px"><img src="' + Art.avatar("cast" + c.id, { pal: c.pal, kind: c.kind, hair: c.hair }) + '" alt=""></span>';

  /* =====================================================================
     FAIR UNLOCK
     ===================================================================== */
  A.sheet("unlock", {
    title: "Unlock options",
    resume: false,
    render(id, n) {
      const t = T[id]; n = +n;
      const ep = A.epTitle(t, n);
      const price = A.priceOf(t), sp = A.split(price), c = A.costToFinish(t), rg = S.REGIONS[st.region];
      const adsLeft = Math.max(0, rg.adsPerDay - st.adsToday);
      const cur = st.region === "US" ? "$" : rg.cur;
      const def = rg.mode === "ads" && adsLeft ? "ad" : sp.ok ? "coins" : adsLeft ? "ad" : "topup";
      const sel = st.uopt && (st.uopt !== "coins" || sp.ok) ? st.uopt : def;
      st.uopt = sel;
      const opt = (k, icon, cls, title, sub, price2, priceSub) => '<button class="uopt' + (sel === k ? " on" : "") + '" data-act="uopt:' + k + '"><span class="ic ' + cls + '">' + ic(icon, 22) + '</span><span class="b"><span class="t">' + title + '</span><div class="s">' + sub + '</div></span><span class="p">' + price2 + (priceSub ? "<small>" + priceSub + "</small>" : "") + '</span><span class="radio"></span></button>';
      const cta = {
        coins: sp.ok ? "Unlock E" + n + " · " + price + " coins" : "Top up to unlock",
        topup: "Top up to unlock",
        ad: "Watch 1 ad · unlock E" + n,
        pass: "Get Series Pass · " + FMT.int(c.pass) + " coins",
        vip: "See VIP plans"
      }[sel];
      return head("Keep watching", "E" + n + " · " + esc(ep.title) + " · " + esc(t.name), true) +
        '<div class="sh-b">' +
        opt(sp.ok ? "coins" : "topup", "coin", "gold", "Unlock with coins", sp.ok ? (sp.bonus && sp.paid ? "Uses " + sp.bonus + " bonus first, then " + sp.paid + " paid" : sp.bonus ? "Uses your bonus coins" : "Uses paid coins") : "You have " + A.balance() + " · packs from $" + S.PACKS[1].price, coin(price), "≈ " + money(price)) +
        (rg.adsPerDay ? opt("ad", "ad", "acc", "Watch 1 ad", adsLeft ? "≤ 30 s · " + adsLeft + " of " + rg.adsPerDay + " left today · unlocks even if the ad fails" : "Daily ad limit reached — back tomorrow", adsLeft ? "Free" : "—", adsLeft ? "1 ad = 1 episode" : "") : "") +
        (t.kind !== "movie" ? opt("pass", "pass", "violet", "Series Pass", "All " + t.eps + " episodes, including future drops · save " + Math.round((1 - c.pass / Math.max(c.whole, 1)) * 100) + "%", FMT.int(c.pass), "≈ " + money(c.pass)) : "") +
        opt("vip", "crown", "vip", "VIP", "Everything unlocked · no ads, ever · cancel in 2 taps", cur + rg.vip[0], "per week") +
        '<div class="balrow">Balance ' + coin(st.wallet.paid) + ' paid · <span class="coin bonus">' + ic("coin") + st.wallet.bonus + "</span> bonus" + (st.wallet.bonus ? " (exp " + st.wallet.bonusExpires + ")" : "") + '<button class="link" data-sheet="topup:' + id + ":" + n + '">Top up</button></div>' +
        '<div class="autorow"><span class="b">Auto-unlock next episodes<small>Only up to your cap: ' + st.spentToday + " of " + st.spendCap + " coins used today</small></span>" +
        '<button class="switch sm" role="switch" aria-checked="' + st.autoUnlock + '" data-act="toggle:autoUnlock"></button></div></div>' +
        '<div class="sh-f"><button class="btn ' + (sel === "vip" ? "vip" : "pri") + ' block" data-act="doUnlock:' + id + ":" + n + '">' + cta + "</button>" +
        '<div class="fairline">' + ic("shieldc", 14) + "Price locked at " + price + " for you · charged once · unlocked on every device</div></div>";
    },
    mount(el, id, n) {
      A.log("track", "unlock_sheet_view", "{title:" + id + ", ep:" + n + ", default:" + st.uopt + ", balance:" + A.balance() + "}");
    }
  });
  ACT.uopt = (el, k) => { st.uopt = k; Sheet.refresh(); A.log("track", "unlock_option_select", k); };
  ACT.doUnlock = (el, id, n) => {
    n = +n;
    const t = T[id], sel = st.uopt;
    const done = () => { Sheet.close(true); if (inPlayer()) A.replace("player/" + id + "/" + n); else A.go((t.orient === "landscape" ? "landscape/" : "player/") + id + "/" + n); };
    if (sel === "coins") { if (A.unlock(id, n, "coins")) done(); }
    else if (sel === "topup") Sheet.open("topup", id, n);
    else if (sel === "ad") showAd({ label: "Unlock E" + n, onReward: () => { A.unlock(id, n, "ad"); done(); } });
    else if (sel === "pass") { if (A.buyPass(id)) done(); }
    else if (sel === "vip") { Sheet.close(true); A.go("vip"); }
  };

  /* honest rewarded ad: ≤ 30 s, never playable, unlocks even if it fails */
  function showAd(o) {
    const scr = $("#screen");
    const ov = document.createElement("div");
    ov.className = "adov";
    let left = 5;
    ov.innerHTML = '<div class="bar"><span class="pill">Ad</span><span>Reward: ' + esc(o.label) + '</span><span class="cnt" id="adc">0:' + String(left).padStart(2, "0") + "</span></div>" +
      '<div class="creative"><div class="lg">Your brand here<small>Sample 30-second rewarded ad · compressed to 5 s in this prototype</small></div></div>' +
      '<div class="prog"><i id="adp"></i></div><div class="foot"><div class="rules">' + ic("shieldc", 12) + " 1 ad = 1 reward · no playable ads · no ad chains</div>" +
      '<button class="btn ghost block" id="adfail" style="color:#fff">Simulate a failed ad</button></div>';
    scr.appendChild(ov);
    A.log("ad", "rewarded_ad_start · AppLovin MAX → AdMob", "placement=unlock · cap " + S.REGIONS[st.region].adsPerDay + "/day · watched today " + st.adsToday);
    const t0 = performance.now();
    let finished = false;
    const finish = ok => {
      if (finished) return; finished = true;
      clearInterval(iv);
      ov.remove();
      A.log("ad", ok ? "rewarded_ad_complete · <b>reward granted</b>" : "rewarded_ad_failed · <b>reward granted anyway</b>", ok ? "server-side verification ✓ (SSV callback)" : "no_fill/timeout → policy: never charge a viewer for a broken ad");
      if (!ok) A.toast("The ad didn't finish — you get the reward anyway.", "checkc");
      o.onReward();
    };
    const iv = setInterval(() => {
      const el = (performance.now() - t0) / 1000;
      const p = $("#adp", ov); if (p) p.style.width = Math.min(100, el / 5 * 100) + "%";
      const c = $("#adc", ov); if (c) c.textContent = "0:0" + Math.max(0, Math.ceil(5 - el));
      if (el >= 5) finish(true);
    }, 100);
    $("#adfail", ov).onclick = () => finish(false);
  }
  A.showAd = showAd;

  /* top-up straight from the paywall */
  A.sheet("topup", {
    title: "Top up",
    render(id, n, need) {
      const t = id ? T[id] : null;
      const cost = +need || (t ? A.priceOf(t) : 0);
      const short = Math.max(0, cost - A.balance());
      const quick = S.PACKS.filter(p => ["p500", "p1000", "p2000"].indexOf(p.id) >= 0);
      const firstUsed = st.ledger.some(r => r.type === "topup" && /First/.test(r.label));
      const list = (firstUsed ? [] : [S.PACKS[0]]).concat(quick);
      return head("Top up", cost ? "You need " + short + " more coin" + (short === 1 ? "" : "s") + (t && +n ? " for E" + n : "") : "Coins never expire") +
        '<div class="sh-b"><div class="packs">' + list.map(p => '<button class="pack' + (p.first ? " first" : "") + '" data-act="quickBuy:' + p.id + ":" + (id || "") + ":" + (n || "") + '">' + (p.first ? '<span class="rib gold">Once</span>' : p.popular ? '<span class="rib">Popular</span>' : "") +
          '<span class="b" style="flex:1"><div class="cn">' + ic("coin") + FMT.int(p.coins) + '</div><div class="bn">' + (p.bonus ? "+" + FMT.int(p.bonus) + " bonus" : "") + '</div></span><div class="pr">$' + p.price.toFixed(2) + "</div></button>").join("") + "</div>" +
        '<div class="note mt12">' + ic("zap", 18) + "<span>" + (t && +n ? "<b>One step:</b> buy coins and E" + n + " unlocks right after — no going back." : "Coins go straight to your wallet.") + "</span></div>" +
        '<button class="btn ghost block mt12" data-go="store">See all packs</button></div>';
    }
  });
  ACT.quickBuy = (el, pid, id, n) => purchase("pack", pid, id && n ? () => {
    if (A.unlock(id, +n, "coins")) { Sheet.close(true); if (inPlayer()) A.replace("player/" + id + "/" + n); else A.go("player/" + id + "/" + n); }
  } : null);

  /* daily cap reached */
  A.sheet("cap", {
    title: "Daily cap",
    resume: false,
    render(id, n) {
      const t = T[id], price = A.priceOf(t);
      return head("You've hit today's cap", "You set " + st.spendCap + " coins a day. You've used " + st.spentToday + ".") +
        '<div class="sh-b"><div class="note gold">' + ic("shieldc", 18) + "<span>This unlock costs <b>" + price + " coins</b>. Spend guard paused it so nothing happens without you deciding.</span></div>" +
        '<div class="vstack mt12"><button class="btn pri block" data-act="raiseCap:' + id + ":" + n + '">Raise today to ' + (st.spendCap + 300) + " and unlock</button>" +
        '<button class="btn block" data-act="capAd:' + id + ":" + n + '">' + ic("ad", 18) + "Watch 1 ad instead</button>" +
        '<button class="btn ghost block" data-close>Not now</button></div>' +
        (st.pin ? '<div class="tiny center-t mt12">Raising the cap asks for your purchase PIN.</div>' : "") + "</div>";
    }
  });
  ACT.raiseCap = (el, id, n) => { st.spendCap += 300; A.log("track", "spend_cap_raised", "today only → " + st.spendCap); if (A.unlock(id, +n, "coins")) { Sheet.close(true); A.replace("player/" + id + "/" + n); } };
  ACT.capAd = (el, id, n) => showAd({ label: "Unlock E" + n, onReward: () => { A.unlock(id, +n, "ad"); Sheet.close(true); A.replace("player/" + id + "/" + n); } });

  /* =====================================================================
     PURCHASES (sign-in gate → store confirmation → ledger)
     ===================================================================== */
  let pendingPay = null, afterSignin = null;
  function purchase(kind, id, after) {
    if (!st.signedIn) { afterSignin = () => purchase(kind, id, after); Sheet.open("gate"); return; }
    pendingPay = { kind: kind, id: id, after: after };
    Sheet.open("pay", kind, id);
  }
  A.purchase = purchase;
  A.sheet("gate", {
    title: "Sign in before buying",
    render() {
      return head("Sign in to keep what you buy", "So coins and unlocks follow you to a new phone and to spool.tv") +
        '<div class="sh-b"><button class="authbtn apple" data-act="gateSign:Apple">' + ic("apple", 20) + 'Continue with Apple</button><button class="authbtn google" data-act="gateSign:Google">' + ic("google", 20) + "Continue with Google</button>" +
        '<div class="note mt12">' + ic("info", 18) + "<span>Your guest history and welcome bonus move into the account.</span></div></div>";
    }
  });
  ACT.gateSign = (el, m) => {
    st.signedIn = true; st.name = "Maya Rao"; st.handle = "@maya.watches";
    A.log("api", "POST /v1/auth/" + m.toLowerCase() + " · <b>200</b>", "guest merged into account · wallet and unlocks moved");
    A.toast("Signed in with " + m, "checkc");
    const f = afterSignin; afterSignin = null;
    if (f) setTimeout(f, 250); else Sheet.close();
  };
  A.sheet("pay", {
    title: "Store confirmation",
    resume: false,
    render(kind, id) {
      let item = "", price = "";
      const rg = S.REGIONS[st.region];
      if (kind === "pack") { const p = S.PACKS.find(x => x.id === id); item = FMT.int(p.coins) + " coins" + (p.bonus ? " + " + FMT.int(p.bonus) + " bonus" : ""); price = st.region === "IN" ? "₹" + Math.round(p.price * 29.3) : "$" + p.price.toFixed(2); }
      if (kind === "vip") { const i = ["week", "month", "year"].indexOf(id); const p = S.VIP_PLANS[i]; item = "Spool VIP · " + p.name; price = (st.region === "US" ? "$" : rg.cur) + rg.vip[i] + "/" + p.per; }
      return '<div style="background:#fff;color:#111;margin:-26px 0 0;padding:20px 20px 34px;border-radius:30px 30px 0 0">' +
        '<div class="hstack" style="justify-content:space-between"><b style="font-size:15px;color:#3c4043">Google Play</b><button class="ib sm" data-close style="color:#444">' + ic("x", 18) + "</button></div>" +
        '<div class="hstack mt16" style="gap:12px"><span class="mark" style="--s:44px;border-radius:12px">' + brandMark(30) + '</span><div class="sp"><b style="font-size:15px">' + esc(item) + '</b><div style="font-size:12.5px;color:#5f6368">Spool: Dramas & Shorts</div></div><b style="font-size:16px">' + price + "</b></div>" +
        (kind === "vip" ? '<div style="margin-top:12px;font-size:12px;color:#5f6368;line-height:1.5">Renews automatically until cancelled. You\'ll get a reminder 24 hours before each renewal. Cancel any time in the app or in Google Play.</div>' : "") +
        '<div style="margin-top:14px;border-top:1px solid #e8eaed;padding-top:12px;font-size:13px;color:#3c4043" class="vstack"><div class="hstack">' + ic("card", 18) + "Visa ···· 4242</div><div class=\"hstack\">" + ic("user", 18) + "maya.rao@gmail.com</div></div>" +
        '<button class="btn block mt16" id="paybtn" data-act="payConfirm" style="background:#01875f;color:#fff;border-radius:22px">1-tap buy</button></div>';
    }
  });
  ACT.payConfirm = el => {
    const p = pendingPay; if (!p) return;
    el.disabled = true;
    el.innerHTML = ic("refresh", 18) + "Processing…";
    A.log("store", "Google Play Billing · <b>purchase</b>", p.kind === "pack" ? "sku com.spool.coins." + p.id : "sub com.spool.vip." + p.id);
    setTimeout(() => {
      A.log("api", "POST /v1/purchases/verify · <b>200 verified</b>", "receipt checked server-side · order GPA." + Math.floor(1000 + Math.random() * 8999) + "-" + Math.floor(1000 + Math.random() * 8999) + " · idempotent");
      if (p.kind === "pack") {
        const pk = S.PACKS.find(x => x.id === p.id);
        A.credit(pk.coins, pk.bonus, (pk.first ? "First top-up · " : "Top-up · ") + FMT.int(pk.coins) + (pk.bonus ? " + " + FMT.int(pk.bonus) + " bonus" : ""), "$" + pk.price.toFixed(2) + " · Google Play · verified", "topup", { money: "$" + pk.price.toFixed(2) });
        A.toast("+" + FMT.int(pk.coins + pk.bonus) + " coins added", "coin", "gold");
      } else {
        st.vip = true;
        A.log("track", "vip_start", "{plan:" + p.id + ", renews:16 Oct, reminder:15 Oct}");
        A.toast("You're VIP · no ads, every series unlocked", "crown", "gold");
        st.inbox.unshift({ id: "nv", icon: "crown", kind: "vip", t: "VIP is on", s: "Renews 16 Oct · we'll remind you 24 h before", ago: "now", go: "vip", unread: true });
      }
      pendingPay = null;
      Sheet.close(true);
      if (p.after) p.after();
      else { const c = A.current(); if (c && !c.def.noRefresh) A.refresh(); }
    }, 900);
  };
  ACT.buyPack = (el, id) => purchase("pack", id, null);
  ACT.buyVip = (el, id) => purchase("vip", id, null);
  ACT.pack = (el, id) => { st.pack = id; A.refresh(); };
  ACT.plan = (el, id) => { st.plan = id; A.refresh(); };

  A.sheet("cancelVip", {
    title: "Cancel VIP",
    render() {
      return head("Cancel VIP?", "Two taps, no tricks") + '<div class="sh-b"><div class="terms" style="margin:0">' +
        ["VIP stays on until <b>16 Oct</b>. No more charges after that.", "Unlocks you made with coins, and your coins, stay yours.", "You can restart any time at the same price."].map(s => "<div>" + ic("checkc", 16) + "<span>" + s + "</span></div>").join("") + "</div>" +
        '<div class="vstack mt16"><button class="btn danger block" data-act="cancelVip">Cancel VIP</button><button class="btn ghost block" data-close>Keep VIP</button></div></div>';
    }
  });
  ACT.cancelVip = () => {
    A.log("api", "POST /v1/subscriptions/cancel · <b>200</b>", "auto-renew off · access until 16 Oct · store notified");
    st.vip = false;
    Sheet.close(true);
    A.toast("Cancelled. You keep VIP until 16 Oct.", "checkc");
    A.refresh();
  };

  /* =====================================================================
     PLAYER SHEETS
     ===================================================================== */
  A.sheet("episodes", {
    title: "Episodes",
    render(id) {
      const t = T[id], cur = (st.progress[id] || {}).ep || 1;
      let cells = "";
      for (let n = 1; n <= Math.min(t.eps, 60); n++) {
        const a = A.access(t, n);
        let cls = "eps", mk = "";
        if (a === "soon") { cls += " soon"; mk = ic("clock", 11); }
        else if (n === cur) { cls += " now"; mk = ic("play", 10); }
        else if (n < cur) { cls += " seen"; mk = ic("check", 11, 2.6); }
        else if (a === "locked") { cls += " lock"; mk = ic("lock", 11); }
        cells += '<button class="' + cls + '" data-go="player/' + id + "/" + n + '">' + n + '<span class="mk">' + mk + "</span></button>";
      }
      const c = A.costToFinish(t);
      return head(esc(t.name), t.eps + " episodes · " + (t.status === "ongoing" ? esc(t.schedule) : "Complete")) +
        '<div class="sh-b"><div class="epgrid" style="padding:0">' + cells + "</div>" +
        '<div class="eplegend" style="padding:12px 0 0"><span>' + ic("lock", 11) + " " + A.priceOf(t) + " coins each</span><span>" + ic("clock", 11) + " Not yet released</span></div>" +
        (c.catchUpEps ? '<div class="note gold mt12">' + ic("tag", 18) + "<span>To catch up: <b>" + FMT.int(c.catchUp) + " coins</b> (≈ " + money(c.catchUp) + ") for " + c.catchUpEps + " episodes — or the Series Pass for " + FMT.int(c.pass) + ".</span></div>" : "") + "</div>";
    }
  });

  A.sheet("comments", {
    title: "Comments",
    render(id, n) {
      const list = (S.COMMENTS[id + ":" + n] || S.COMMENTS["heiress:7"]).slice();
      const mine = st.myComments.filter(c => c.k === id + ":" + n);
      const sort = st.cSort || "top";
      const rows = mine.concat(sort === "moment" ? list.filter(c => c.t != null).sort((a, b) => a.t - b.t) : list);
      return head(FMT.int(3100 + mine.length) + " comments", "E" + n + " · tap a timestamp to jump there") +
        '<div class="chips" style="padding:0 16px 8px">' + [["top", "Top"], ["moment", "By moment"], ["new", "Newest"]].map(([k, l]) => '<button class="chip sm' + (sort === k ? " on" : "") + '" data-act="cSort:' + k + '">' + l + "</button>").join("") + "</div>" +
        '<div class="sh-b">' + rows.map(c => '<div class="cmt' + (c.pinned ? " pin" : "") + '">' + (c.official ? '<span class="mark" style="--s:34px;border-radius:50%">' + brandMark(22) + "</span>" : avaSeed(c.handle, 34)) +
          '<div class="b"><div class="h"><b>' + esc(c.handle) + "</b>" + (c.pinned ? '<span class="pill accent" style="height:18px">' + ic("pin", 11) + "Pinned</span>" : "") + (c.t != null ? '<button class="ts" data-act="jump:' + c.t + '">' + FMT.dur(c.t) + "</button>" : "") + "<span>" + esc(c.ago) + "</span></div>" +
          '<div class="x' + (c.spoiler ? " spoil" : "") + '"' + (c.spoiler ? ' data-act="spoil" title="Spoiler from ' + esc(c.spoiler) + ' — tap to reveal"' : "") + ">" + esc(c.text) + "</div>" +
          '<div class="f">' + (c.spoiler ? '<span class="pill amber" style="height:18px">Spoiler · ' + esc(c.spoiler) + "</span>" : "") + "<span>Reply" + (c.replies ? " · " + c.replies : "") + "</span><span>Report</span></div></div>" +
          '<button class="lk" data-act="likeC">' + ic("heart", 18) + FMT.n(c.likes) + "</button></div>").join("") + "</div>" +
        '<div class="sh-f"><div class="composer">' + avaSeed("me-" + st.persona, 34, { kind: "woman", hair: "long", pal: ["#24060f", "#8a1f3e", "#ffc06a"] }) + '<input id="cin" placeholder="Add a comment at ' + FMT.dur(Player.time || 0) + '…" maxlength="200"><button class="ib sm" data-act="sendComment:' + id + ":" + n + '" style="color:var(--accent)">' + ic("send", 20) + "</button></div></div>";
    }
  });
  ACT.cSort = (el, k) => { st.cSort = k; Sheet.refresh(); };
  ACT.spoil = el => el.classList.toggle("show");
  ACT.likeC = el => { el.style.color = "var(--rose)"; el.querySelector("svg").outerHTML = ic("heartf", 18); };
  ACT.jump = (el, t) => { Sheet.close(true); Player.seek(+t); };
  ACT.sendComment = (el, id, n) => {
    const inp = $("#cin"); const v = inp && inp.value.trim();
    if (!v) { A.toast("Write something first", "info"); return; }
    st.myComments.unshift({ k: id + ":" + n, handle: st.handle, t: Math.round(Player.time || 0), text: v, likes: 0, ago: "now" });
    A.log("api", "POST /v1/comments · <b>202 Accepted</b>", "auto-mod: clean · new-account hold: " + (st.persona === "new" ? "yes (held for review)" : "no (trusted)"));
    Sheet.refresh();
  };

  /* Who's who: a spoiler-safe relationship map centred on the lead */
  A.sheet("cast", {
    title: "Who's who",
    render(id) {
      const t = T[id];
      const upto = (st.progress[id] || {}).ep || 1;
      const cast = t.cast || [];
      const lead = cast[0];
      const others = cast.slice(1);
      const W = 358, H = 300, cx = W / 2, cy = H / 2 + 4, R = 112;
      const rel = { victor: "ex-fiancé", celeste: "rival", ethan: "protects her", grandma: "grandmother", unknown: "?", kade: "bound by vow" };
      let svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" style="display:block;margin:2px 0 10px">';
      others.forEach((c, i) => {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / others.length);
        const x = cx + Math.cos(a) * R * 1.25, y = cy + Math.sin(a) * R * .95;
        const known = c.since <= upto && !c.hidden;
        svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="' + (known ? "rgba(var(--accent-rgb),.55)" : "rgba(255,255,255,.14)") + '" stroke-width="1.5"' + (known ? "" : ' stroke-dasharray="3 4"') + "/>";
        const mx = (cx + x) / 2, my = (cy + y) / 2;
        if (known) svg += '<rect x="' + (mx - 38) + '" y="' + (my - 9) + '" width="76" height="18" rx="9" fill="#1C1C1F" stroke="rgba(255,255,255,.12)"/><text x="' + mx + '" y="' + (my + 3.5) + '" text-anchor="middle" font-size="9.5" font-weight="650" fill="#B4B1A8" font-family="Geist, sans-serif">' + esc(rel[c.id] || c.role) + "</text>";
        svg += '<clipPath id="cp' + i + '"><circle cx="' + x + '" cy="' + y + '" r="24"/></clipPath>' +
          (known ? '<image href="' + Art.avatar("cast" + c.id, { pal: c.pal, kind: c.kind, hair: c.hair }) + '" x="' + (x - 24) + '" y="' + (y - 24) + '" width="48" height="48" clip-path="url(#cp' + i + ')"/>' : '<circle cx="' + x + '" cy="' + y + '" r="24" fill="#1C1C1F" stroke="rgba(255,255,255,.18)" stroke-dasharray="3 3"/><text x="' + x + '" y="' + (y + 6) + '" text-anchor="middle" font-size="18" fill="#7D7B74">?</text>') +
          '<text x="' + x + '" y="' + (y + 38) + '" text-anchor="middle" font-size="11" font-weight="680" fill="' + (known ? "#F3F1EA" : "#7D7B74") + '" font-family="Geist, sans-serif">' + (known ? esc(c.name) : "E" + c.since + "+") + "</text>";
      });
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="40" fill="none" stroke="var(--accent)" stroke-width="2"/><clipPath id="cpl"><circle cx="' + cx + '" cy="' + cy + '" r="36"/></clipPath>' +
        '<image href="' + Art.avatar("cast" + lead.id, { pal: lead.pal, kind: lead.kind, hair: lead.hair }) + '" x="' + (cx - 36) + '" y="' + (cy - 36) + '" width="72" height="72" clip-path="url(#cpl)"/>' +
        '<text x="' + cx + '" y="' + (cy + 56) + '" text-anchor="middle" font-size="12.5" font-weight="720" fill="#F3F1EA" font-family="Geist, sans-serif">' + esc(lead.name) + "</text></svg>";
      return head("Who's who", "Spoiler-safe up to E" + upto + " · " + esc(t.name)) +
        '<div class="sh-b">' + svg + cast.map(c => {
          const known = c.since <= upto && !c.hidden;
          return '<div class="hstack" style="padding:9px 0;border-bottom:1px solid var(--line);align-items:flex-start;gap:11px;opacity:' + (known ? 1 : .55) + '">' + (known ? castAva(c, 42) : '<span class="ava" style="--s:42px;display:grid;place-items:center">' + ic("eyeoff", 18) + "</span>") +
            '<div class="sp"><b style="font-size:14px">' + (known ? esc(c.name) : "Hidden until E" + c.since) + '</b> <span class="tiny">' + (known ? esc(c.actor) : "") + '</span><div style="font-size:12px;color:var(--accent-text);font-weight:600;margin-top:1px">' + (known ? esc(c.role) : "") + '</div><div class="tiny" style="margin-top:3px;line-height:1.45">' + (known ? esc(c.note) : "Keep watching to meet this character.") + "</div></div></div>";
        }).join("") + "</div>";
    }
  });

  /* Story Rewind */
  A.sheet("recap", {
    title: "Story Rewind",
    render(id) {
      const t = T[id];
      const p = st.progress[id] || { ep: 7 };
      const upto = Math.max(1, (p.ep || 7) - 1);
      const beats = {
        heiress: [[1, "<b>Victor leaves Ava at the altar</b> after Celeste plants fake photos."], [3, "Five years later an <b>anonymous buyer</b> takes 51% of Lin Holdings — it's Ava."], [5, "At the Sterling Gala, <b>Victor doesn't recognise her.</b> Ethan, her bodyguard, does."], [6, "<b>Grandma Lin</b> quietly hands Ava the family ledger."]],
        crown: [[1, "<b>Queen Elise is poisoned</b> on her coronation day."], [2, "She wakes <b>ten years earlier</b> as a palace maid."], [5, "She saves the young prince from the same poison — and <b>the poisoner notices.</b>"], [8, "Elise is promoted to the <b>queen mother's household.</b>"]],
        moonbound: [[1, "Mara <b>hears the pack</b> for the first time under the blood moon."], [3, "<b>Kade swears a vow</b> to hunt the human who can hear them."], [9, "The vow binds them — <b>if one breaks it, both suffer.</b>"]]
      }[id] || [[1, "The story so far, in three beats."], [Math.max(1, upto - 2), "The turning point."], [upto, "Where you left off."]];
      return head("Previously on…", "Story Rewind · E1–E" + upto + " in 20 seconds", true) +
        '<div class="sh-b recap"><div class="recap-vid"><img src="' + Art.scene(t, Math.max(1, upto - 1), 1) + '" alt=""><div class="ov"><span class="pill violet">' + ic("sparkle") + 'AI recap</span><b>' + esc(t.name) + '</b><span class="t">0:20</span></div><div class="pb"></div></div>' +
        beats.map(([ep, txt]) => '<div class="beat"><span class="n"><img src="' + Art.scene(t, ep, 0) + '" alt=""><span>E' + ep + "</span></span><p>" + txt + "</p></div>").join("") +
        '<div class="note violet mt8">' + ic("eye", 18) + "<span><b>No spoilers past E" + upto + ".</b> Written by AI from subtitles and scene notes, checked by an editor before it ships.</span></div>" +
        '<div class="vstack mt12"><button class="btn pri block" data-act="recapGo:' + id + ":" + (p.ep || 7) + '">' + ic("play", 18) + "Continue E" + (p.ep || 7) + '</button><button class="btn ghost block" data-sheet="cast:' + id + '">' + ic("users", 18) + "Who's who</button></div></div>";
    },
    mount(el, id) { A.log("track", "story_rewind_open", "{title:" + id + ", trigger:" + (st.returning ? "returning_scenario" : "manual") + "}"); }
  });
  ACT.recapGo = (el, id, n) => { Sheet.close(true); st.returning = false; if (inPlayer()) A.replace("player/" + id + "/" + n); else A.go("player/" + id + "/" + n); };

  /* Send a Cliffhanger */
  const FRIENDS = [["Riya", "f1", "woman", "long"], ["Dev", "f2", "man", "short"], ["Sam", "f3", "man", "cap"], ["Ana", "f4", "woman", "bun"], ["Mira", "f5", "woman", "bob"], ["Leo", "f6", "man", "short"]];
  A.sheet("share", {
    title: "Send a Cliffhanger",
    render(id, n) {
      const t = T[id]; n = +n || 1;
      const giftEp = Math.max(n, t.free + 1);
      return head("Send a Cliffhanger", "Share " + esc(t.name) + " E" + n) +
        '<div class="sh-b"><div class="gift"><div class="t">' + ic("gift", 20) + "Gift E" + giftEp + ' free</div><div class="s">They watch it free, no account needed to start. You get <b>+100 bonus coins</b> when they finish it. ' + st.giftsLeft + " gifts left this week.</div>" +
        '<div class="ppl">' + FRIENDS.map(([nm, seed, k, h]) => '<button data-act="giftTo:' + nm + '">' + avaSeed(seed, 52, { kind: k, hair: h }).replace('class="ava"', 'class="ava' + (st.giftTo === nm ? " sel" : "") + '"') + nm + "</button>").join("") + "</div>" +
        '<button class="btn pri block mt8" data-act="sendGift:' + id + ":" + giftEp + '"' + (st.giftTo && st.giftsLeft ? "" : " disabled") + ">" + (st.giftTo ? "Send E" + giftEp + " to " + st.giftTo : "Pick a friend") + "</button></div>" +
        '<div class="apps">' + [["msg", "Messages"], ["whatsapp", "WhatsApp"], ["instagram", "Stories"], ["link", "Copy link"]].map(([i, l]) => '<button data-act="shareVia:' + l + '"><span class="c">' + ic(i, 24) + "</span>" + l + "</button>").join("") + "</div>" +
        '<div class="note mt16">' + ic("scissors", 18) + "<span><b>Share the moment:</b> links open " + esc(t.name) + " at " + FMT.dur(Player.time || 0) + " on app or web, with E1–E" + t.free + " free.</span></div></div>";
    }
  });
  ACT.giftTo = (el, who) => { st.giftTo = who; Sheet.refresh(); };
  ACT.sendGift = (el, id, n) => {
    st.giftsLeft--;
    A.log("api", "POST /v1/gifts · <b>201</b>", "{title:" + id + ", ep:" + n + ", to:" + st.giftTo + ", link:spool.tv/g/" + A.key() + ", expires:7d}");
    A.log("push", "→ " + st.giftTo + ": “Maya sent you a cliffhanger 👀”", "deep link opens E" + n + " directly · install attributed to Maya");
    A.toast("Sent! " + st.giftTo + " can watch E" + n + " free.", "gift");
    st.giftTo = null;
    Sheet.close();
  };
  ACT.shareVia = (el, via) => { A.log("track", "share", "{via:" + via + ", deep_link:true, timestamp:" + Math.round(Player.time || 0) + "}"); A.toast(via === "Copy link" ? "Link copied · opens at " + FMT.dur(Player.time || 0) : "Opening " + via + "…", "link"); };

  /* player settings */
  A.sheet("settings", {
    title: "Playback settings",
    render() {
      const c = A.current();
      const t = c && T[c.args[0]] ? T[c.args[0]] : T.heiress;
      const s = st.settings;
      const pills = (arr, cur, act) => '<div class="chips wrap" style="padding:0">' + arr.map(v => '<button class="chip sm' + (String(cur) === String(v[0]) ? " on" : "") + '" data-act="' + act + ":" + v[0] + '">' + v[1] + "</button>").join("") + "</div>";
      return head("Playback", esc(t.name)) + '<div class="sh-b">' +
        '<div class="grp-t" style="margin:4px 2px 8px">Speed</div>' + pills([[.75, "0.75×"], [1, "1×"], [1.25, "1.25×"], [1.5, "1.5×"], [2, "2×"]], s.speed, "speed") +
        '<div class="grp-t" style="margin:16px 2px 8px">Quality</div>' + pills([["Auto", "Auto"], ["240p", "240p · data saver"], ["540p", "540p"], ["720p", "720p"], ["1080p", "1080p" + (st.vip ? "" : " · VIP")]], s.quality, "quality") +
        '<div class="grp-t" style="margin:16px 2px 8px">Audio</div>' + pills(t.audio.map((a, i) => [i === 0 ? "Original" : a.split(" ·")[0], a]), s.audio === "Original" ? "Original" : s.audio, "audio") +
        '<div class="grp-t" style="margin:16px 2px 8px">Subtitles</div>' + pills([["Off", "Off"], ["English", "English"], ["Español", "Español"], ["Português", "Português"], ["हिन्दी", "हिन्दी"]], s.subs, "subs") +
        '<div class="list mt16" style="margin:16px 0 0"><div class="row"><span class="ic">' + ic("eyeoff") + '</span><span class="b"><span class="t">Clean view</span><div class="s">Hide buttons and captions while watching</div></span><button class="switch sm" role="switch" aria-checked="' + !!st.clean + '" data-act="clean"></button></div>' +
        '<button class="row" data-act="report"><span class="ic" style="color:var(--red-ink)">' + ic("flag") + '</span><span class="b"><span class="t">Report a problem</span><div class="s">Playback, audio, subtitles or content</div></span></button></div></div>';
    }
  });
  ACT.speed = (el, v) => { st.settings.speed = +v; Sheet.refresh(); A.log("track", "setting_speed", v + "×"); };
  ACT.quality = (el, v) => { if (v === "1080p" && !st.vip) { A.toast("1080p is part of VIP", "crown", "gold"); return; } st.settings.quality = v; Sheet.refresh(); A.log("api", "ABR · <b>" + v + "</b>", v === "240p" ? "data saver: first segment 240p, cap 360p on cellular" : "rendition switch at next segment boundary"); };
  ACT.audio = (el, v) => { st.settings.audio = v; Sheet.refresh(); A.log("track", "audio_track", v + (v !== "Original" ? " (AI voice, labelled)" : "")); };
  ACT.subs = (el, v) => { st.settings.subs = v; Sheet.refresh(); A.log("track", "subtitle_track", v); };
  ACT.clean = el => { st.clean = !st.clean; el.setAttribute("aria-checked", st.clean); const p = $("#player"); if (p) p.classList.toggle("clean", st.clean); };
  ACT.report = () => { Sheet.close(); A.toast("Thanks — reported to the content team", "flag"); A.log("api", "POST /v1/reports · <b>201</b>", "type=playback · goes to moderation queue"); };

  A.sheet("rate", {
    title: "Rate",
    render(id) {
      const t = T[id], r = st.rateDraft || 0;
      return head("Rate " + esc(t.name), "You've watched enough to rate it") + '<div class="sh-b"><div class="hstack" style="justify-content:center;gap:6px;margin:6px 0 14px">' +
        [1, 2, 3, 4, 5].map(i => '<button class="ib" data-act="rateStar:' + id + ":" + i + '" style="color:' + (i <= r ? "var(--gold)" : "var(--text-3)") + '">' + ic(i <= r ? "starf" : "star", 34) + "</button>").join("") + "</div>" +
        '<div class="field" style="margin:0"><textarea rows="3" placeholder="What worked? (optional)"></textarea></div>' +
        '<div class="row" style="padding:12px 2px;border:0"><span class="b"><span class="t">Contains spoilers</span><div class="s">Blurs your review until someone taps it</div></span><button class="switch sm" role="switch" aria-checked="false" data-act="flip"></button></div>' +
        '<button class="btn pri block" data-act="submitRate:' + id + '"' + (r ? "" : " disabled") + ">Post rating</button></div>";
    }
  });
  ACT.rateStar = (el, id, n) => { st.rateDraft = +n; Sheet.refresh(); };
  ACT.flip = el => el.setAttribute("aria-checked", el.getAttribute("aria-checked") !== "true");
  ACT.submitRate = (el, id) => { A.log("api", "POST /v1/ratings · <b>201</b>", "{title:" + id + ", stars:" + st.rateDraft + ", eligible:watched≥3}"); st.rateDraft = 0; Sheet.close(); A.toast("Thanks — it counts toward the weighted score", "star", "gold"); };

  /* ledger row detail */
  A.sheet("ledger", {
    title: "Ledger entry",
    render(rid) {
      const r = st.ledger.find(x => x.id === rid) || st.ledger[0];
      const tot = r.paid + r.bonus;
      return head(esc(r.label), esc(r.day) + " · " + esc(r.time)) + '<div class="sh-b"><div class="kv">' +
        "<div><span>Change</span><b>" + (tot > 0 ? "+" : "−") + FMT.int(Math.abs(tot)) + " coins</b></div>" +
        "<div><span>Paid coins</span><b>" + (r.paid > 0 ? "+" : "") + r.paid + "</b></div><div><span>Bonus coins</span><b>" + (r.bonus > 0 ? "+" : "") + r.bonus + "</b></div>" +
        "<div><span>Balance after</span><b>" + FMT.int(r.after[0]) + " paid · " + FMT.int(r.after[1]) + " bonus</b></div>" +
        (r.exp ? "<div><span>Bonus expires</span><b>" + esc(r.exp) + "</b></div>" : "") + (r.money ? "<div><span>Charged</span><b>" + esc(r.money) + "</b></div>" : "") +
        '<div><span>Reference</span><b class="mono">' + esc(r.ref || "—") + '</b></div><div><span>Entry</span><b class="mono">' + esc(r.id) + "</b></div></div>" +
        '<div class="note mt12">' + ic("info", 18) + "<span>Entries are never edited. If something is wrong, support adds a correcting entry with a reason you can see here.</span></div>" +
        '<button class="btn ghost block mt12" data-act="toast:Sent to support with this entry attached">Report a problem with this entry</button></div>';
    }
  });

  /* spend guard */
  A.sheet("guard", {
    title: "Spend guard",
    render() {
      return head("Spend guard", "A daily limit on coins — like screen time, for spending") + '<div class="sh-b"><div class="grp-t" style="margin:0 2px 8px">Coins a day</div>' +
        '<div class="chips wrap" style="padding:0">' + [100, 300, 600, 1000].map(v => '<button class="chip' + (st.spendCap === v ? " on" : "") + '" data-act="setCap:' + v + '">' + v + (v === 300 ? " · default" : "") + "</button>").join("") + "</div>" +
        '<div class="tiny mt8">≈ ' + money(st.spendCap) + " a day. Raising it for one day takes one tap; raising it permanently asks for your PIN" + (st.pin ? "" : " (if set)") + ".</div>" +
        '<div class="list mt16" style="margin:16px 0 0"><div class="row"><span class="ic acc">' + ic("zap") + '</span><span class="b"><span class="t">Auto-unlock</span><div class="s">Unlock the next episode without asking — never past this cap</div></span><button class="switch sm" role="switch" aria-checked="' + st.autoUnlock + '" data-act="toggle:autoUnlock"></button></div>' +
        '<div class="row"><span class="ic">' + ic("key") + '</span><span class="b"><span class="t">Purchase PIN</span><div class="s">Ask before every purchase</div></span><button class="switch sm" role="switch" aria-checked="' + st.pin + '" data-act="toggle:pin"></button></div></div>' +
        '<div class="note mt12">' + ic("activity", 18) + "<span>Weekly summary: you'll get one note each Sunday with what you watched and spent.</span></div></div>";
    }
  });
  ACT.setCap = (el, v) => { st.spendCap = +v; A.log("track", "spend_cap_set", v + " coins/day"); Sheet.refresh(); const c = A.current(); if (c && c.name === "wallet") A.refresh(); };

  A.sheet("tip", {
    title: "Tip",
    render(cid) {
      const c = C[cid];
      return head("Tip " + esc(c.name), "100% goes to the creator, minus store fees") + '<div class="sh-b"><div class="hstack" style="gap:8px">' +
        [50, 100, 500].map(v => '<button class="pack" style="flex:1" data-act="tip:' + cid + ":" + v + '"><div class="cn">' + ic("coin") + v + '</div><div class="pe">≈ ' + money(v) + "</div></button>").join("") + "</div>" +
        '<div class="tiny mt12">Tips come from paid coins only, and show in your wallet history.</div></div>';
    }
  });
  ACT.tip = (el, cid, v) => {
    v = +v;
    if (st.wallet.paid < v) { Sheet.open("topup", "", "", v); return; }
    st.wallet.paid -= v;
    A.addLedger({ type: "tip", label: "Tip · " + C[cid].name, sub: "Paid coins", bonus: 0, paid: -v, ref: "tip_" + A.key() });
    A.log("ledger", "<b>−" + v + "</b> paid coins → creator " + C[cid].handle, "creator earnings +" + money(v));
    Sheet.close();
    A.toast("Sent " + v + " coins to " + esc(C[cid].name), "gift");
  };

  /* =====================================================================
     GENERAL ACTIONS
     ===================================================================== */
  const refreshOrPatch = () => { const c = A.current(); if (c && !c.def.noRefresh) A.refresh(); };
  ACT.toast = function (el) { A.toast(esc(Array.prototype.slice.call(arguments, 1).join(":")), "info"); };
  ACT.trope = (el, k) => { st.tropes.has(k) ? st.tropes.delete(k) : st.tropes.add(k); A.refresh(); A.log("track", "onboarding_trope_" + (st.tropes.has(k) ? "add" : "remove"), k); };
  ACT.obSkip = () => { A.log("track", "onboarding_skip", ""); A.tab("home"); };
  ACT.obDone = () => { A.log("track", "onboarding_complete", "{tropes:[" + Array.from(st.tropes).join(", ") + "], audio:" + st.settings.audio + ", subs:" + st.settings.subs + "}"); A.tab("home"); A.toast("Your home is ready", "sparkle"); };
  ACT.obAudio = (el, k) => { st.settings.audio = k; A.refresh(); };
  ACT.obSubs = (el, l) => { st.settings.subs = l; A.refresh(); };
  ACT.toggle = (el, k) => {
    st[k] = !st[k];
    if (el) el.setAttribute("aria-checked", st[k]);
    A.log("track", "setting_changed", k + "=" + st[k]);
    if (k === "autoUnlock") A.toast(st[k] ? "Auto-unlock on · never past " + st.spendCap + " coins a day" : "Auto-unlock off", "zap");
    if (Sheet.kind === "unlock") Sheet.refresh();
  };
  ACT.signedIn = (el, m) => {
    st.signedIn = true;
    if (st.persona === "new") { st.name = "Maya Rao"; st.handle = "@maya.watches"; }
    A.log("api", "POST /v1/auth/" + m.toLowerCase() + " · <b>200</b>", "guest merged → u_10293 · wallet, unlocks and history moved");
    A.toast("Signed in with " + m, "checkc");
    A.tab("me");
  };
  ACT.list = (el, id) => {
    const on = !st.myList.has(id);
    on ? st.myList.add(id) : st.myList.delete(id);
    A.log("track", on ? "my_list_add" : "my_list_remove", id);
    A.toast(on ? "Saved to My List" : "Removed from My List", on ? "bookmarkf" : "bookmark");
    if (el && el.classList.contains("ra")) { el.classList.toggle("saved", on); el.querySelector(".c").innerHTML = ic(on ? "bookmarkf" : "bookmark", 24); }
    else refreshOrPatch();
  };
  ACT.follow = (el, id) => {
    const on = !st.following.has(id);
    on ? st.following.add(id) : st.following.delete(id);
    A.log("api", "PUT /v1/follows/" + id + " · <b>" + (on ? "201" : "204") + "</b>", on ? "drop alert 1 h before each new episode · daily max 3" : "alerts off");
    A.toast(on ? "Drop alerts on for " + esc(T[id].name) : "Drop alerts off", "bell");
    refreshOrPatch();
  };
  ACT.followC = (el, id) => { const on = !st.followingCreators.has(id); on ? st.followingCreators.add(id) : st.followingCreators.delete(id); A.toast(on ? "Following " + esc(C[id].name) : "Unfollowed", on ? "usercheck" : "user"); A.log("track", on ? "creator_follow" : "creator_unfollow", id); A.refresh(); };
  ACT.vote = (el, id) => {
    const t = T[id];
    if (st.votes.has(id)) { A.toast("You've already voted for this pilot", "check"); return; }
    st.votes.add(id);
    const left = t.goal - t.votes - 1;
    A.log("api", "POST /v1/pilots/" + id + "/votes · <b>201</b>", "one vote per viewer · counted after 1 full episode watched");
    A.toast(left > 0 ? "Voted · " + FMT.int(left) + " more to greenlight" : "Voted · it just hit the goal!", "thumb");
    A.refresh();
  };
  ACT.fyb = (el, m) => { st.fyb = +m; A.log("track", "fits_your_break", m + " min"); A.refresh(); };
  ACT.homeTab = (el, k) => { st.homeTab = k; A.refresh(); const sc = $(".scroll", A.current().view); if (sc) sc.scrollTop = 0; };
  ACT.sq = (el, q) => { st.q = q; A.log("track", "search", "{q:\"" + esc(q) + "\", mode:" + (st.sceneSearch ? "scene" : "title") + "}"); A.refresh(); };
  ACT.sceneSearch = () => { st.sceneSearch = !st.sceneSearch; if (st.sceneSearch && !st.q) st.q = "the slap at the gala"; A.log("track", "scene_search_toggle", String(st.sceneSearch)); A.refresh(); };
  ACT.chart = (el, k) => { st.chart = k; A.refresh(); };
  ACT.dropDay = (el, i) => { st.dropDay = +i; A.refresh(); };
  ACT.dropsF = (el, v) => { st.dropsFollowing = v === "1"; A.refresh(); };
  ACT.epRange = (el, id, i) => { st.epRange = st.epRange || {}; st.epRange[id] = +i; A.refresh(); };
  ACT.seriesTab = (el, id, k) => { st.seriesTab = st.seriesTab || {}; st.seriesTab[id] = k; A.refresh(); };
  ACT.libTab = (el, k) => { st.libTab = k; A.refresh(); };
  ACT.creatorTab = (el, k) => { st.creatorTab = k; A.refresh(); };
  ACT.feedTab = (el, k) => { st.feedTab = k; st.feedIdx = 0; A.refresh(); };
  ACT.ledgerF = (el, k) => { st.ledgerFilter = k; A.refresh(); };
  ACT.like = (el, how) => {
    const c = A.current(); if (!c || c.name !== "player") return;
    const k = c.args[0] + ":" + (c.args[1] || 1);
    const on = how === "burst" ? true : !st.likes.has(k);
    on ? st.likes.add(k) : st.likes.delete(k);
    const btn = $('.ra[data-act="like"]', c.view);
    if (btn) { btn.classList.toggle("on", on); btn.querySelector(".c").innerHTML = ic(on ? "heartf" : "heart", 26); }
    if (on) Player.float("❤️", 3);
    A.log("track", on ? "like" : "unlike", "{title:" + c.args[0] + ", ep:" + (c.args[1] || 1) + ", t:" + Math.round(Player.time) + ", via:" + (how || "tap") + "}");
  };
  ACT.likeV = (el, id, force) => {
    const on = force ? true : !st.likes.has(id);
    on ? st.likes.add(id) : st.likes.delete(id);
    if (el) { const cc = el.querySelector(".c"); if (cc) cc.innerHTML = ic(on ? "heartf" : "heart", 26); el.classList.toggle("on", on); }
    A.log("track", on ? "video_like" : "video_unlike", id);
  };
  ACT.cc = () => { st.settings.subs = st.settings.subs === "Off" ? "English" : "Off"; Player.line = -1; A.toast("Subtitles " + (st.settings.subs === "Off" ? "off" : "on"), "cc"); };
  ACT.seek = (el, t) => Player.seek(+t);
  ACT.nextEp = () => { const c = A.current(); A.replace("player/" + c.args[0] + "/" + ((+c.args[1] || 1) + 1)); };
  ACT.call = (el, id, n, opt) => {
    const key = id + ":" + n;
    if (st.calls[key]) return;
    st.calls[key] = opt;
    const box = $("#callopts");
    const sc = S.SCRIPT[key];
    $$(".opt", box).forEach((b, i) => { const o = sc.call.options[i]; b.querySelector(".fill").style.width = Math.round(o.pct * 100) + "%"; if (o.k === opt) b.classList.add("me"); });
    box.classList.add("done");
    A.log("api", "POST /v1/calls · <b>201</b>", "{title:" + id + ", ep:" + n + ", choice:" + opt + ", reveal_ep:" + sc.call.reveal + ", reward_if_right:5}");
    A.toast("Locked in. Revealed in E" + sc.call.reveal + " — +5 coins if you're right", "poll");
    setTimeout(() => { const e = $(".endcard"); if (e) { e.remove(); A.emit("ended", T[id], +n); } }, 2600);
  };
  ACT.skipCall = (el, id, n) => { st.calls[id + ":" + n] = "skip"; const e = $(".endcard"); if (e) e.remove(); A.emit("ended", T[id], +n); };
  ACT.exitLand = () => A.back();
  ACT.lseek = (el, d) => { const v = A.current().view; if (v._ctl) v._ctl.seek(+d); };
  ACT.lplay = () => { const v = A.current().view; if (v._ctl) v._ctl.toggle(); };
  ACT.lnext = (el, id, n) => { const v = A.current().view; if (v._ctl) v._ctl.save(); A.replace("landscape/" + id + "/" + n); };
  ACT.draft = (el, f, v) => {
    const d = st.draft;
    if (f === "subs" || f === "rights") d[f] = !d[f];
    else d[f] = v === undefined ? "" : v;
    A.refresh();
  };
  ACT.postUpload = () => {
    const d = st.draft;
    const u = Object.assign({}, d, { id: "up_" + A.key(), status: "processing", views: 0, fan: 0 });
    st.uploads.unshift(u);
    A.log("api", "POST /v1/uploads · <b>201</b>", "{type:" + d.type + ", orientation:" + (d.clip === "c3" ? "landscape" : "vertical") + ", fan_link:" + (d.link || "none") + ", rights_declared:true, resumable:true}");
    st.draft = null;
    A.go("create/processing", { replace: true });
  };
  ACT.startPilot = () => { st.draft = { type: "pilot", clip: "c6", title: "Night Shift — Pilot E1", desc: "", link: "", age: "16+", vis: "Public", subs: true, rights: false }; A.go("create"); };
  ACT.readAll = () => { st.inbox.forEach(n => { n.unread = false; }); A.refresh(); };
  ACT.openNote = (el, id) => { const n = st.inbox.find(x => x.id === id); if (!n) return; n.unread = false; A.log("track", "notification_open", n.kind || "push"); if (n.go) A.go(n.go); else A.refresh(); };
  ACT.restore = () => {
    A.log("api", "POST /v1/purchases/restore · <b>200</b>", "store receipts re-checked · ledger reconciled · 0 missing deliveries");
    A.toast("Restored · " + (Object.keys(st.unlocked).length + st.passes.size) + " series unlocks and " + st.wallet.paid + " paid coins", "refresh");
  };
  ACT.checkin = () => {
    const amt = S.REWARDS.ladder[st.streak];
    st.streak++; st.checkedInToday = true;
    A.credit(0, amt, "Daily check-in · Day " + st.streak, "Streak " + st.streak + " of 7", "checkin");
    A.toast("+" + amt + " bonus coins · day " + st.streak, "flame", "gold");
    A.refresh();
  };
  ACT.adCoins = () => showAd({ label: "+" + S.REWARDS.adCoins + " bonus coins", onReward: () => { st.adsToday++; A.credit(0, S.REWARDS.adCoins, "Rewarded ad · 30 s", "AdMob · completed", "ad"); A.toast("+" + S.REWARDS.adCoins + " bonus coins", "coin", "gold"); A.refresh(); } });
  ACT.claim = (el, id) => { const t = st.tasks.find(x => x.id === id); t.done = true; A.credit(0, t.coins, "Task · " + t.t, "Reward", "checkin"); A.toast("+" + t.coins + " bonus coins", "coin", "gold"); A.refresh(); };
  ACT.task = (el, id) => {
    const t = st.tasks.find(x => x.id === id);
    if (id === "alerts") { t.done = true; A.credit(0, t.coins, "Task · Drop alerts on", "Reward", "checkin"); A.toast("Drop alerts on · +" + t.coins + " coins", "bell"); A.refresh(); }
    else if (id === "call") A.go("player/heiress/7/76");
    else if (id === "watch") A.go("player/heiress/1");
    else if (id === "rate") { st.seriesTab = st.seriesTab || {}; st.seriesTab.contract = "reviews"; st.progress.contract = st.progress.contract || { ep: 13 }; A.go("series/contract"); }
    else if (id === "invite") Sheet.open("share", "heiress", "7");
    else A.tab("home");
  };
})();
