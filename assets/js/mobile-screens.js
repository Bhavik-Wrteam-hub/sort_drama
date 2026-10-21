/* ==========================================================================
   Spool — mobile screens
   --------------------------------------------------------------------------
   Each screen is { tab?, rise?, title(), render(...args) → html,
   mount(view, ...args)?, unmount()?, keys(e)? }. Navigation uses data-go /
   data-tab / data-back / data-sheet / data-act attributes (see mobile.js).
   ========================================================================== */
(function () {
  "use strict";
  const A = window.App;
  const { st, S, esc, coin, money, poster, heat, statusTag, avaC, avaSeed, stars, $, $$ } = A;
  const { FMT, T, C, V } = S;
  const ic = window.ic;

  /* ---------- shared bits ---------- */
  function hdr(title, sub, o) {
    o = o || {};
    return '<header class="hdr' + (o.solid ? " solid" : "") + (o.big ? " big" : "") + '">' +
      (o.noBack ? "" : '<button class="ib" data-back aria-label="Back">' + ic("back", 22, 2) + "</button>") +
      '<div class="ttl"><h1>' + title + "</h1>" + (sub ? '<div class="sub">' + sub + "</div>" : "") + "</div>" + (o.right || "") + "</header>";
  }
  function sec(title, link, sub) {
    return '<div class="sec"><h2>' + title + "</h2>" + (sub ? '<span class="sub">' + sub + "</span>" : "") + (link ? '<button class="link" ' + link + ">See all" + ic("fwd", 14, 2) + "</button>" : "") + "</div>";
  }
  function wchip() {
    if (st.vip) return '<button class="wchip vip" data-go="vip">' + ic("crown", 16) + 'VIP</button>';
    return '<button class="wchip" data-go="rewards" aria-label="Coins and rewards">' + ic("coin") + FMT.int(A.balance()) +
      '<span class="fl">' + ic("flame") + st.streak + "</span></button>";
  }
  function pc(t, o) {
    o = o || {};
    const ep = st.progress[t.id];
    const meta = o.meta === false ? "" : '<div class="meta">' + '<span class="gl">' + esc(S.genre(t)) + "</span>" + (o.metaText || (t.kind === "movie" ? FMT.mins(t.runtime) + " · Film" : t.kind === "series" ? t.eps + " episodes · Series" : t.eps + " eps")) + "</div>";
    return '<button class="pc ' + (o.size || "") + '" data-go="series/' + t.id + '" aria-label="' + esc(t.name) + '">' +
      poster(t, { newEp: o.newEp, compact: o.compact, free: o.free, status: o.status }) +
      (o.progress && ep ? '<div class="prog"><i style="width:' + Math.round(ep.ep / t.eps * 100) + '%"></i></div>' : "") +
      meta + "</button>";
  }
  const dramas = () => S.TITLES.filter(t => t.kind === "drama" && (st.region === "IN" ? true : !t.lang));
  function regional(list) {
    if (st.region === "IN") return list.slice().sort((a, b) => (b.lang === "hi") - (a.lang === "hi"));
    return list.filter(t => t.lang !== "hi" || t.kind === "creator" || t.kind === "series");
  }
  function vt(v, o) {
    o = o || {};
    const c = C[v.by];
    return '<button class="vt" data-go="scenes/' + v.id + '">' +
      '<div class="poster tall bare"><img src="' + Art.thumb(v) + '" alt=""><span class="views">' + ic("play", 12) + FMT.n(v.views) + '</span><span class="dur">' + FMT.dur(v.dur) + "</span></div>" +
      '<div class="t clamp2">' + esc(v.title) + "</div>" +
      (o.by !== false ? '<div class="by">' + avaC(c, 16) + esc(c.handle) + "</div>" : "") + "</button>";
  }

  /* =====================================================================
     FIRST RUN
     ===================================================================== */
  A.screen("splash", {
    title: () => "Splash",
    render: () => '<div class="splash"><div><div class="m">' + brandMark(64) + '</div><div class="w">spool</div><div class="tag">' + esc(S.BRAND.tagline) + "</div></div></div>",
    mount: () => { setTimeout(() => { const c = A.current(); if (c && c.name === "splash") A.go("onboard", { replace: true, dir: "fade" }); }, 1900); }
  });

  const OB_TROPES = [["Revenge", "divorce"], ["Hidden identity", "heiress"], ["Billionaire", "contract"], ["Werewolf", "moonbound"], ["Second chance", "tenyears"],
    ["Royal", "crown"], ["Mafia", "mafia"], ["Rebirth", "rebirth"], ["Thriller", "silent"], ["Fake dating", "fake"], ["Secret baby", "twins"], ["Bodyguard", "bodyguard"]];
  A.screen("onboard", {
    title: (s) => s === "lang" ? "Onboarding · language" : "Onboarding · what hooks you",
    render(step) {
      if (step === "lang") {
        return '<div class="scroll bot-safe"><div class="obhead"><div class="step">Step 2 of 2</div><h1>Watch in your language.</h1>' +
          "<p>Pick how you like to watch. AI-voiced dubs are always labelled, and you can switch per series.</p></div>" +
          '<div class="grp-t">Audio</div><div class="list">' +
          [["Original audio + subtitles", "Hear the actors. Subtitles in 14 languages.", "cc", "Original"], ["Dubbed when available", "Labelled “AI voice”. Switch any time in the player.", "headphones", "Dubbed"]]
            .map(([t, s, i, k]) => '<button class="row" data-act="obAudio:' + k + '"><span class="ic' + (st.settings.audio === k || (k === "Original" && st.settings.audio === "Original") ? " acc" : "") + '">' + ic(i) + '</span><span class="b"><span class="t">' + t + '</span><div class="s">' + s + '</div></span><span class="r">' + (st.settings.audio === k ? ic("checkc", 20) : "") + "</span></button>").join("") + "</div>" +
          '<div class="grp-t">Subtitles</div><div class="chips wrap">' + ["English", "Español", "Português", "हिन्दी", "Bahasa", "Filipino", "Deutsch", "Français"].map(l => '<button class="chip sm' + (st.settings.subs === l ? " on" : "") + '" data-act="obSubs:' + l + '">' + l + "</button>").join("") + "</div>" +
          '<div class="grp-t">Good to know</div><div class="list">' +
          '<div class="row"><span class="ic green">' + ic("bolt") + '</span><span class="b"><span class="t">Data saver</span><div class="s">Start every episode at 240p, then sharpen. Good on slow networks.</div></span><button class="switch sm" role="switch" aria-checked="' + st.dataSaver + '" data-act="toggle:dataSaver" aria-label="Data saver"></button></div>' +
          '<div class="row"><span class="ic acc">' + ic("bell") + '</span><span class="b"><span class="t">Drop alerts</span><div class="s">Only for series you follow. Never more than 3 a day.</div></span><button class="switch sm" role="switch" aria-checked="true"></button></div></div>' +
          '<div class="obfoot"><button class="btn pri block" data-act="obDone">Start watching</button><div class="tiny center-t mt8">You can change all of this in Settings.</div></div></div>';
      }
      const n = st.tropes.size;
      return '<div class="scroll" style="padding-bottom:140px"><div class="obhead"><div class="step">Step 1 of 2</div><h1>What hooks <em>you?</em></h1>' +
        "<p>Pick three or more. We'll shape your home around them — no account needed yet.</p></div>" +
        '<div class="obgrid">' + OB_TROPES.map(([k, id]) => '<button class="obt' + (st.tropes.has(k) ? " on" : "") + '" data-act="trope:' + k + '"><img src="' + Art.poster(T[id]) + '" alt=""><span class="ck">' + ic("check", 14, 2.6) + "</span><span>" + k + "</span></button>").join("") + "</div>" +
        '<div class="obfoot"><button class="btn pri block" data-go="onboard/lang"' + (n < 3 ? " disabled" : "") + ">" + (n < 3 ? "Pick " + (3 - n) + " more" : "Continue · " + n + " picked") + '</button><button class="btn ghost block mt8" data-act="obSkip">Skip for now</button></div></div>';
    }
  });

  A.screen("signin", {
    title: (s) => s === "otp" ? "Sign in · code" : "Sign in",
    rise: true,
    render(step) {
      if (step === "otp") {
        return hdr("", "", {}) + '<div class="scroll pad"><h1 class="serif-i" style="font-size:38px;line-height:1;margin:8px 0 0">Enter the code.</h1>' +
          '<p class="muted" style="font-size:14px">Sent by SMS to +1 (415) 555-0142.</p><div class="otp"><span>4</span><span>8</span><span>2</span><span class="f">1</span><span></span><span></span></div>' +
          '<p class="tiny center-t">Resend in 0:24 · <button class="link" data-act="toast:Code sent again">Send again</button></p>' +
          '<button class="btn pri block mt24" data-act="signedIn:Phone">Verify</button></div>';
      }
      return hdr("", "", {}) + '<div class="scroll pad bot-safe-sm"><div style="padding:10px 4px 0"><div class="mark" style="--s:56px;border-radius:18px">' + brandMark(38) + "</div>" +
        '<h1 class="serif-i" style="font-size:42px;line-height:.98;margin:18px 0 0;letter-spacing:-.02em">Keep your coins and unlocks safe.</h1>' +
        '<p class="muted" style="font-size:14px;line-height:1.5">Sign in before your first purchase so your coins, unlocks and history follow you to a new phone — and to spool.tv.</p></div>' +
        '<div class="mt24"><button class="authbtn apple" data-act="signedIn:Apple">' + ic("apple", 20) + 'Continue with Apple</button>' +
        '<button class="authbtn google" data-act="signedIn:Google">' + ic("google", 20) + 'Continue with Google</button>' +
        '<button class="authbtn phone" data-go="signin/otp">' + ic("phone", 20) + "Continue with phone</button></div>" +
        '<div class="note mt16">' + ic("shieldc", 18) + "<span><b>Guest progress carries over.</b> Your welcome bonus and watch history move into the account.</span></div>" +
        '<button class="btn ghost block mt12" data-back>Keep browsing as guest</button></div>';
    }
  });

  /* =====================================================================
     HOME
     ===================================================================== */
  function heroCards() {
    let ids = ["heiress", "moonbound", "crown", "contract", "rebirth"];
    if (st.region === "IN") ids = ["sindoor", "shaadi", "heiress", "monsoon", "divorce"];
    return ids.map(id => {
      const t = T[id], p = st.progress[id];
      const cont = p && p.ep && A.canWatch(t, p.ep);
      const pill = t.nextDrop && t.status === "ongoing" ? '<span class="pill acc">' + ic("calendar") + "New ep " + (t.nextDrop.indexOf("Today") === 0 ? "tonight" : t.nextDrop.split(" ")[0]) + "</span>" : t.status === "complete" ? '<span class="pill">Complete · ' + t.eps + " eps</span>" : "";
      return '<div class="hcard" role="group" aria-label="' + esc(t.name) + '"><img class="bg" src="' + Art.poster(t) + '" alt="">' +
        '<div class="in"><div class="kick">' + pill + '<span class="pill">' + esc(t.tropes.slice(0, 2).join(" · ")) + "</span></div>" +
        "<h3" + (t.st === "caps" || t.st === "wide" ? ' class="caps"' : "") + ">" + esc(t.name) + "</h3>" +
        '<div class="ln">' + ic("starf", 12) + " " + t.rating + " · " + FMT.n(t.views) + " views · " + (t.free ? "First " + t.free + " free" : "Free") + "</div>" +
        '<div class="row"><button class="btn pri" data-go="player/' + id + "/" + (cont ? p.ep : 1) + '">' + ic("play", 18) + (cont ? "Continue E" + p.ep : "Play E1") + "</button>" +
        '<button class="btn glass" data-act="list:' + id + '" aria-label="My List">' + ic(st.myList.has(id) ? "check" : "plus", 20, 2.2) + "</button>" +
        '<button class="btn glass" data-go="series/' + id + '" aria-label="Details">' + ic("info", 20) + "</button></div></div></div>";
    }).join("");
  }
  function continueRail() {
    const ids = Object.keys(st.progress).filter(id => T[id] && st.progress[id].ep);
    if (!ids.length) return "";
    return sec("Continue watching", 'data-tab="library"') + '<div class="rail">' + ids.map(id => {
      const t = T[id], p = st.progress[id];
      const a = A.access(t, p.ep);
      const next = a === "locked" ? '<span style="color:var(--gold)">' + ic("lock", 12) + " E" + p.ep + " · " + A.priceOf(t) + " coins</span>" : a === "soon" ? "Next drop " + (t.nextDrop || "soon") : "E" + p.ep + " of " + t.eps;
      return '<button class="cw" data-go="player/' + id + "/" + p.ep + '">' + poster(t, { title: false, tags: false }) +
        '<span class="b"><div class="t">' + esc(t.name) + '</div><div class="s">' + esc(p.lastSeen) + '</div><div class="bar"><i style="width:' + Math.round(p.ep / t.eps * 100) + '%"></i></div><div class="c">' + next + "</div></span>" +
        '<span class="play">' + ic("play", 16) + "</span></button>";
    }).join("") + "</div>";
  }
  function fyb() {
    const m = st.fyb || 15;
    const plan = {
      5: { id: "silent", from: 1, to: 3, why: "3 episodes · ends right after a reveal, not on a cliff" },
      15: { id: "divorce", from: 1, to: 10, why: "10 episodes · all free · ends at the end of act one" },
      30: { id: "tenyears", from: 1, to: 12, why: "12 episodes · all free · stops at a natural break" }
    }[m];
    const t = T[plan.id];
    return '<div class="fyb"><div class="top"><span class="ic">' + ic("hourglass") + '</span><span><b>Fits your break</b><span>A session that ends somewhere good.</span></span></div>' +
      '<div class="seg">' + [5, 15, 30].map(x => '<button class="' + (x === m ? "on" : "") + '" data-act="fyb:' + x + '">' + x + " min</button>").join("") + "</div>" +
      '<div class="q"><div class="stack">' + poster(T[plan.id === "divorce" ? "fake" : "divorce"], { title: false, tags: false }) + poster(t, { title: false, tags: false }) + "</div>" +
      '<div class="b"><div class="t">' + esc(t.name) + " · E" + plan.from + "–E" + plan.to + '</div><div class="s">' + plan.why + "</div>" +
      '<span class="ok">' + ic("checkc", 13) + " Ends on time · no unlocks needed</span></div>" +
      '<button class="btn pri sm" data-go="player/' + plan.id + "/" + plan.from + '">' + ic("play", 15) + "Start</button></div></div>";
  }
  function dropsRail() {
    const list = S.TITLES.filter(t => t.nextDrop && (st.region === "IN" ? true : t.lang !== "hi")).slice(0, 6);
    return sec("Drops <em>tonight</em>", 'data-go="drops"') + '<div class="rail">' + list.map(t => {
      const on = st.following.has(t.id);
      return '<div class="drop">' + poster(t, { title: false, tags: false }) + '<div class="b"><span class="when">' + esc(t.nextDrop) + '</span><span class="t">' + esc(t.name) + '</span><span class="s">E' + (t.released + 1) + " · " + esc(t.schedule || "") + "</span>" +
        '<button class="btn xs ' + (on ? "" : "pri") + '" data-act="follow:' + t.id + '">' + ic(on ? "check" : "bell", 14, 2) + (on ? "Reminder on" : "Remind me") + "</button></div></div>";
    }).join("") + "</div>";
  }
  function top10() {
    const list = regional(dramas()).slice().sort((a, b) => heat(b) - heat(a)).slice(0, 10);
    return sec("Top 10 <em>today</em>", 'data-go="charts"', st.region === "IN" ? "India" : "United States") + '<div class="rail">' +
      list.map((t, i) => '<button class="t10" data-go="series/' + t.id + '"><span class="rk">' + (i + 1) + "</span>" + poster(t, { compact: true, status: false }) + "</button>").join("") + "</div>";
  }
  function tropeRow(trope) {
    const list = S.TITLES.filter(t => t.tropes.indexOf(trope) >= 0 && t.kind !== "pilot" && (st.region === "IN" || t.lang !== "hi"));
    return sec("Because you like <em>" + trope.toLowerCase() + "</em>", 'data-go="browse/' + encodeURIComponent(trope) + '"') +
      '<div class="rail">' + list.map(t => pc(t, { size: "md" })).join("") + "</div>";
  }
  function pilotRail() {
    const list = S.TITLES.filter(t => t.kind === "pilot");
    return sec("Pilot <em>Season</em>", 'data-go="scenes/pilots"', "You decide what gets made") + '<div class="rail">' + list.map(t => {
      const c = C[t.creator], votes = t.votes + (st.votes.has(t.id) ? 1 : 0);
      return '<button class="pilot" data-go="series/' + t.id + '">' + poster(t, { tags: true }) + '<div class="b"><div class="by">' + avaC(c, 20) + esc(c.name) + "</div>" +
        '<div class="votes"><div class="vbar"><i style="width:' + Math.min(100, votes / t.goal * 100) + '%"></i></div><div class="vtxt"><span><b>' + FMT.int(votes) + "</b> want more</span><span>" + FMT.n(t.goal) + " to greenlight</span></div></div></div></button>";
    }).join("") + "</div>";
  }
  function creatorsRail() {
    const list = ["v2", "v1", "v4", "v3", "v6", "v9", "v10"].map(id => V[id]);
    return sec("From <em>creators</em>", 'data-tab="scenes"', "Fan edits link to the drama") + '<div class="rail">' + list.map(v => vt(v)).join("") + "</div>";
  }
  function tropeTiles() {
    const tiles = [["Revenge", "divorce"], ["Hidden identity", "heiress"], ["Werewolf", "moonbound"], ["Billionaire", "contract"], ["Royal", "crown"], ["Mafia", "mafia"]];
    return sec("Browse by <em>trope</em>") + '<div class="tropes">' + tiles.map(([k, id]) => '<button class="trope" data-go="browse/' + encodeURIComponent(k) + '"><span>' + k + '</span><img src="' + Art.poster(T[id]) + '" alt=""></button>').join("") + "</div>";
  }
  function longform() {
    const list = ["ledger", "monsoon", "lanterns", "highway"].map(id => T[id]);
    return sec("Series <em>&amp;</em> films", 'data-act="homeTab:series"', "Turn your phone") + '<div class="rail">' + list.map(t =>
      '<button class="pc lg" style="width:240px" data-go="series/' + t.id + '">' + poster(t, { wide: true }) + '<div class="meta"><b>' + esc(t.name) + "</b>" + (t.kind === "movie" ? FMT.mins(t.runtime) + " · Film" : t.eps + " × " + Math.round(t.epLen / 60) + " min · Series") + "</div></button>").join("") + "</div>";
  }
  function completeRow() {
    const list = regional(dramas()).filter(t => t.status === "complete");
    return sec("Complete — binge to the end") + '<div class="rail">' + list.map(t => pc(t, { metaText: t.eps + " eps · cost to finish shown", status: false })).join("") + "</div>";
  }

  A.screen("home", {
    tab: "home",
    title: () => "Home",
    render() {
      const tabk = st.homeTab || "foryou";
      const unread = st.inbox.filter(n => n.unread).length;
      let body = "";
      if (tabk === "foryou") {
        const pick = Array.from(st.tropes)[0] || "Revenge";
        body = '<div class="hero"><div class="hero-track" id="heroTrack">' + heroCards() + '</div><div class="dots" id="heroDots">' + [0, 1, 2, 3, 4].map(i => "<i" + (i === 0 ? ' class="on"' : "") + "></i>").join("") + "</div></div>" +
          continueRail() + '<div class="mt20">' + fyb() + "</div>" + dropsRail() + top10() + tropeRow(pick) + pilotRail() + creatorsRail() + longform() + tropeTiles() + completeRow() +
          '<div class="tiny center-t" style="margin:30px 0 0">' + ic("shieldc", 12) + " Prices are shown before you tap. Nothing auto-unlocks unless you turn it on.</div>";
      } else if (tabk === "dramas") {
        const list = regional(dramas());
        body = '<div class="chips mt12">' + ["All", "Ongoing", "Complete", "Dubbed", "Originals"].map((k, i) => '<button class="chip sm' + (i === 0 ? " on" : "") + '">' + k + "</button>").join("") + "</div>" +
          '<div class="pgrid mt16">' + list.map(t => pc(t, { compact: true })).join("") + "</div>";
      } else if (tabk === "series") {
        body = sec("Web series") + '<div class="vstack pad">' + ["ledger", "monsoon"].map(id => {
          const t = T[id];
          return '<button class="pc" style="width:100%" data-go="series/' + id + '">' + poster(t, { wide: true }) + '<div class="meta"><b>' + esc(t.name) + "</b>" + t.eps + " episodes × " + Math.round(t.epLen / 60) + " min · " + esc(t.tropes.join(" · ")) + "</div></button>";
        }).join("") + "</div>" + sec("Films") + '<div class="vstack pad">' + ["lanterns", "highway"].map(id => {
          const t = T[id];
          return '<button class="pc" style="width:100%" data-go="series/' + id + '">' + poster(t, { wide: true }) + '<div class="meta"><b>' + esc(t.name) + "</b>" + FMT.mins(t.runtime) + " · " + t.price + " coins or VIP</div></button>";
        }).join("") + "</div>";
      } else {
        body = sec("Creators you follow") + '<div class="rail">' + S.CREATORS.slice(0, 6).map(c =>
          '<button class="vt" style="width:92px;text-align:center" data-go="creator/' + c.id + '">' + avaC(c, 76).replace('class="ava"', 'class="ava' + (st.followingCreators.has(c.id) ? " ring" : "") + '"') + '<div class="t" style="margin-top:8px">' + esc(c.name.split(" ")[0]) + "</div></button>").join("") + "</div>" +
          pilotRail() + sec("Trending creator videos") + '<div class="pgrid">' + S.VIDEOS.filter(v => v.status === "live").slice(0, 9).map(v => vt(v, { by: false })).join("") + "</div>";
      }
      return '<div class="scroll bot-safe">' +
        '<header class="hdr" style="min-height:0;padding-bottom:4px;background:transparent;position:relative">' +
        '<span class="wordmark" style="font-size:30px;margin-left:6px">spool</span><span class="sp"></span>' + wchip() +
        '<button class="ib" data-go="search" aria-label="Search">' + ic("search", 22) + "</button>" +
        '<button class="ib" data-go="inbox" aria-label="Notifications">' + ic("bell", 22) + (unread ? '<i class="dot"></i>' : "") + "</button></header>" +
        '<div class="ttabs">' + [["foryou", "For you"], ["dramas", "Dramas"], ["series", "Series & films"], ["creators", "Creators"]].map(([k, n]) => '<button class="' + (k === tabk ? "on" : "") + '" data-act="homeTab:' + k + '">' + n + "</button>").join("") + "</div>" +
        '<div class="mt12">' + body + "</div></div>";
    },
    mount(view) {
      const tr = $("#heroTrack", view), dots = $$("#heroDots i", view);
      if (tr) tr.addEventListener("scroll", () => {
        const i = Math.round(tr.scrollLeft / 346);
        dots.forEach((d, k) => d.classList.toggle("on", k === i));
      }, { passive: true });
    }
  });

  /* =====================================================================
     DISCOVERY
     ===================================================================== */
  const SCENE_HITS = {
    slap: [{ id: "heiress", ep: 7, t: 40, q: "“That was for the wedding.”", m: "Matched “slap at the gala”" }, { id: "divorce", ep: 22, t: 61, q: "“Sign it. Now.”", m: "Matched “slap” · 3 more in this series" }],
    heiress: [{ id: "heiress", ep: 8, t: 6, q: "“Who else knows?”", m: "Matched “reveals she's the heiress”" }, { id: "heiress", ep: 3, t: 44, q: "“The anonymous bidder is in the room.”", m: "Matched “heiress … auction”" }],
    wolf: [{ id: "moonbound", ep: 1, t: 70, q: "“I can hear you. All of you.”", m: "Matched “first time she hears the pack”" }]
  };
  A.screen("search", {
    title: () => "Search",
    render() {
      const q = st.q || "";
      return '<header class="hdr solid"><button class="ib" data-back aria-label="Back">' + ic("back", 22, 2) + "</button>" +
        '<label class="sbox">' + ic("search", 19) + '<input id="sq" placeholder="' + (st.sceneSearch ? "Describe a scene… “the slap at the gala”" : "Titles, tropes, creators") + '" value="' + esc(q) + '" autocomplete="off"></label></header>' +
        '<div class="scroll bot-safe-sm" id="sres">' + searchBody(q) + "</div>";
    },
    mount(view) {
      const inp = $("#sq", view);
      inp.addEventListener("input", () => { st.q = inp.value; $("#sres", view).innerHTML = searchBody(inp.value); });
      inp.addEventListener("keydown", e => { if (e.key === "Enter") A.log("track", "search_submit", "{q:\"" + esc(inp.value) + "\", mode:" + (st.sceneSearch ? "scene" : "title") + "}"); });
    }
  });
  function searchBody(q) {
    q = (q || "").trim().toLowerCase();
    const ai = '<button class="aitoggle" data-act="sceneSearch"><span class="ic">' + ic("sparkle") + '</span><span class="b"><b>Scene Search' + (st.sceneSearch ? " · on" : "") + "</b><span>Find a moment by describing it — dialogue, place or plot beat.</span></span>" +
      '<span class="switch sm" role="switch" aria-checked="' + !!st.sceneSearch + '"></span></button>';
    if (!q) {
      return ai + (st.sceneSearch ? '<div class="grp-t">Try</div><div class="chips wrap">' + ["the slap at the gala", "she reveals she's the heiress", "first time she hears the pack"].map(s => '<button class="chip sm" data-act="sq:' + s + '">' + ic("sparkle", 13) + s + "</button>").join("") + "</div>" : "") +
        '<div class="grp-t">Recent</div><div class="chips wrap">' + ["heiress", "werewolf", "Ritu Sharma"].map(s => '<button class="chip sm" data-act="sq:' + s + '">' + ic("history", 13) + s + "</button>").join("") + "</div>" +
        '<div class="grp-t">Trending searches</div>' + ["The Heiress Returns", "Moonbound", "who sent ava the text", "Glass Crown", "Ghost Signals pilot", "CEO romance", "Sindoor Ka Badla", "Divorce Day slap"].map((s, i) =>
          '<button class="trend" data-act="sq:' + s + '"><span class="n' + (i < 3 ? " top" : "") + '">' + (i + 1) + '</span><span class="t">' + s + '</span><span class="s">' + (i < 3 ? ic("trendup", 14) : "") + "</span></button>").join("") +
        '<div class="grp-t">Tropes</div><div class="chips wrap" style="padding-bottom:20px">' + S.TROPES.slice(0, 12).map(t => '<button class="chip sm" data-go="browse/' + encodeURIComponent(t) + '">' + t + "</button>").join("") + "</div>";
    }
    if (st.sceneSearch) {
      const k = /slap|gala|wedding/.test(q) ? "slap" : /heiress|reveal|ava/.test(q) ? "heiress" : /wolf|pack|moon/.test(q) ? "wolf" : null;
      const hits = k ? SCENE_HITS[k] : [];
      return ai + '<div class="grp-t">' + (hits.length ? hits.length + " moments" : "No moments yet") + "</div>" +
        (hits.length ? hits.map(h => {
          const t = T[h.id];
          return '<button class="scene-hit" data-go="player/' + h.id + "/" + h.ep + "/" + h.t + '"><span class="th"><img src="' + Art.scene(t, h.ep, 0) + '" alt=""><span class="ts">E' + h.ep + " · " + FMT.dur(h.t) + "</span></span>" +
            '<span class="b"><span class="t">' + esc(t.name) + '</span><div class="q">' + esc(h.q) + '</div><div class="m">' + ic("sparkle", 12) + esc(h.m) + "</div></span></button>";
        }).join("") : '<div class="empty"><b>Nothing matched that moment</b>Try a line of dialogue or where it happens.</div>') +
        '<div class="tiny pad mt12">Scene Search reads subtitles and scene notes. Results only show episodes you can see in your region.</div>';
    }
    const titles = S.TITLES.filter(t => (t.name + " " + t.tropes.join(" ") + " " + (t.sub || "")).toLowerCase().indexOf(q) >= 0);
    const creators = S.CREATORS.filter(c => (c.name + c.handle).toLowerCase().indexOf(q) >= 0);
    const vids = S.VIDEOS.filter(v => v.status === "live" && v.title.toLowerCase().indexOf(q) >= 0);
    return ai + (titles.length ? '<div class="grp-t">Titles</div>' + titles.map(t => '<button class="rank" data-go="series/' + t.id + '">' + poster(t, { title: false, tags: false }) + '<span class="b"><span class="t">' + esc(t.name) + '</span><div class="s">' + esc(t.tropes.join(" · ")) + " · " + t.eps + ' eps</div></span><span class="r">' + ic("fwd", 18) + "</span></button>").join("") : "") +
      (creators.length ? '<div class="grp-t">Creators</div>' + creators.map(c => '<button class="rank" data-go="creator/' + c.id + '">' + avaC(c, 48) + '<span class="b"><span class="t">' + esc(c.name) + '</span><div class="s">' + esc(c.handle) + " · " + FMT.n(c.followers) + " followers</div></span></button>").join("") : "") +
      (vids.length ? '<div class="grp-t">Videos</div><div class="rail">' + vids.map(v => vt(v)).join("") + "</div>" : "") +
      (!titles.length && !creators.length && !vids.length ? '<div class="empty"><b>No results for “' + esc(q) + '”</b>Try a trope, or turn on Scene Search to describe a moment.</div>' : "");
  }

  A.screen("charts", {
    title: () => "Charts",
    render() {
      const k = st.chart || "today";
      const base = regional(S.TITLES.filter(t => t.kind === "drama"));
      const sorters = {
        today: (a, b) => heat(b) - heat(a),
        trending: (a, b) => (b.ratings / b.views) - (a.ratings / a.views),
        saved: (a, b) => b.saves - a.saves,
        new: (a, b) => (a.status === "ongoing" ? -1 : 1) - (b.status === "ongoing" ? -1 : 1) || b.rating - a.rating,
        complete: (a, b) => (b.status === "complete") - (a.status === "complete") || b.rating - a.rating
      };
      const list = base.slice().sort(sorters[k]).slice(0, 12);
      const mv = ["up", "nw", "up", "dn", "up", "", "dn", "up", "nw", "", "dn", "up"];
      return hdr("Charts", "Updated hourly · " + S.REGIONS[st.region].name, { solid: true }) +
        '<div class="ttabs" style="margin-top:4px">' + [["today", "Top today"], ["trending", "Trending"], ["saved", "Most saved"], ["new", "New & rising"], ["complete", "Complete"]].map(([kk, n]) => '<button class="' + (kk === k ? "on" : "") + '" data-act="chart:' + kk + '">' + n + "</button>").join("") + "</div>" +
        '<div class="scroll bot-safe-sm" style="padding-top:8px">' + list.map((t, i) =>
          '<button class="rank" data-go="series/' + t.id + '"><span><span class="n">' + (i + 1) + '</span><span class="mv ' + mv[i] + '">' + (mv[i] === "up" ? "▲ " + (i % 3 + 1) : mv[i] === "dn" ? "▼ 1" : mv[i] === "nw" ? "NEW" : "—") + "</span></span>" +
          poster(t, { title: false, tags: false }) + '<span class="b"><span class="t">' + esc(t.name) + '</span><div class="s">' + esc(t.tropes.slice(0, 2).join(" · ")) + '</div><div class="s">' + ic("starf", 11) + " " + t.rating + " · " + FMT.n(k === "saved" ? t.saves : t.views) + (k === "saved" ? " saves" : " views") + "</div></span></button>").join("") + "</div>";
    }
  });

  A.screen("drops", {
    title: () => "Drops calendar",
    render() {
      const day = st.dropDay || 0;
      const days = [["Fri", 9], ["Sat", 10], ["Sun", 11], ["Mon", 12], ["Tue", 13], ["Wed", 14], ["Thu", 15]];
      const pool = S.TITLES.filter(t => t.status === "ongoing" && (st.region === "IN" || t.lang !== "hi"));
      const slots = [["7:00 PM", pool.filter(t => /7:00/.test(t.nextDrop || ""))], ["8:00 PM", pool.filter(t => /8:00/.test(t.nextDrop || "") || (day % 2 && t.id === "crown"))], ["9:00 PM", pool.filter(t => /9:00/.test(t.nextDrop || ""))], ["6:00 PM", day === 2 ? [T.flatmates] : []]]
        .filter(s => s[1].length);
      const onlyF = !!st.dropsFollowing;
      return hdr("Drops", "New episodes, on a schedule you can plan around", { solid: true }) +
        '<div class="scroll bot-safe-sm"><div class="days mt12">' + days.map(([d, n], i) => '<button class="' + (i === day ? "on" : "") + '" data-act="dropDay:' + i + '"><span>' + (i === 0 ? "Today" : d) + "</span><b>" + n + "</b></button>").join("") + "</div>" +
        '<div class="chips mt12"><button class="chip sm' + (onlyF ? "" : " on") + '" data-act="dropsF:0">All series</button><button class="chip sm' + (onlyF ? " on" : "") + '" data-act="dropsF:1">' + ic("bell", 13) + "Following</button></div>" +
        '<div class="tl">' + slots.map(([tm, list]) => {
          const items = list.filter(t => !onlyF || st.following.has(t.id));
          if (!items.length) return "";
          return '<div class="slot"><div class="tm">' + tm + "</div><div>" + items.map(t => {
            const on = st.following.has(t.id);
            return '<div class="it">' + poster(t, { title: false, tags: false }) + '<div class="b"><div class="t">' + esc(t.name) + '</div><div class="s">E' + (t.released + 1 + day) + " · " + (t.kind === "creator" ? "Creator series" : esc(t.tropes[0])) + "</div></div>" +
              '<button class="btn xs' + (on ? "" : " pri") + '" data-act="follow:' + t.id + '">' + ic(on ? "check" : "bell", 13, 2) + (on ? "On" : "Remind") + "</button></div>";
          }).join("") + "</div></div>";
        }).join("") + "</div>" +
        '<div class="note mt16" style="margin:16px">' + ic("info", 18) + "<span>Reminders arrive 1 hour before a drop and never more than 3 a day. VIP gets followed series 24 hours early.</span></div></div>";
    }
  });

  A.screen("browse", {
    title: (tr) => "Browse · " + (tr || "trope"),
    render(trope) {
      trope = trope || "Revenge";
      const list = S.TITLES.filter(t => t.tropes.indexOf(trope) >= 0 && t.kind !== "pilot");
      return hdr(esc(trope), list.length + " titles", { solid: true, big: true }) +
        '<div class="scroll bot-safe-sm"><div class="chips mt8">' + ["Complete", "Ongoing", "Dubbed", "Under 60 eps", "Originals"].map(k => '<button class="chip sm">' + k + "</button>").join("") + "</div>" +
        '<div class="pgrid mt16">' + list.map(t => pc(t, { compact: true })).join("") + "</div></div>";
    }
  });

  /* =====================================================================
     SERIES PAGE
     ===================================================================== */
  function epGrid(t) {
    const cur = (st.progress[t.id] || {}).ep || 0;
    const range = st.epRange && st.epRange[t.id] || 0;
    const per = 30, from = range * per + 1, to = Math.min(t.eps, from + per - 1);
    const ranges = [];
    for (let i = 0; i * per < t.eps; i++) ranges.push(i);
    let cells = "";
    for (let n = from; n <= to; n++) {
      const a = A.access(t, n);
      let cls = "eps", mk = "";
      if (a === "soon") { cls += " soon"; mk = ic("clock", 11); }
      else if (n === cur) { cls += " now"; mk = ic("play", 10); }
      else if (n < cur) { cls += " seen"; mk = ic("check", 11, 2.6); }
      else if (a === "locked") { cls += " lock"; mk = ic("lock", 11); }
      else if (a === "unlocked" || a === "pass") { mk = ic("unlock", 11); }
      cells += '<button class="' + cls + '" data-go="player/' + t.id + "/" + n + '" aria-label="Episode ' + n + " " + a + '">' + n + '<span class="mk">' + mk + "</span></button>";
    }
    return (ranges.length > 1 ? '<div class="chips" style="margin-bottom:12px">' + ranges.map(i => '<button class="chip sm' + (i === range ? " on" : "") + '" data-act="epRange:' + t.id + ":" + i + '">' + (i * per + 1) + "–" + Math.min(t.eps, (i + 1) * per) + "</button>").join("") + "</div>" : "") +
      '<div class="epgrid">' + cells + "</div>" +
      '<div class="eplegend"><span><i style="background:var(--accent)"></i>Now</span><span><i style="background:var(--surface)"></i>' + ic("check", 11, 2.6) + "Watched</span><span>" + ic("lock", 11) + 'Locked · ' + A.priceOf(t) + " coins</span><span>" + ic("clock", 11) + "Not yet released</span></div>";
  }
  function fairCard(t) {
    if (t.kind === "pilot") return "";
    const c = A.costToFinish(t);
    const p = A.priceOf(t);
    if (st.vip) return '<div class="fair"><div class="h">' + ic("crown", 14) + 'Included with VIP<span class="pill green">' + ic("check", 11) + " No ads</span></div>" +
      '<div class="foot">' + ic("checkc", 14) + "<span>Every released episode is unlocked for you. New drops arrive 24 h early.</span></div></div>";
    if (st.passes.has(t.id)) return '<div class="fair"><div class="h">' + ic("pass", 14) + 'Series Pass active<span class="pill green">' + ic("check", 11) + " Paid in full</span></div>" +
      '<div class="foot">' + ic("checkc", 14) + "<span>All " + t.eps + " episodes are yours, including future drops. Nothing else to pay.</span></div></div>";
    if (t.kind === "movie") return '<div class="fair"><div class="h">' + ic("tag", 14) + 'The price, up front</div><div class="grid" style="grid-template-columns:1fr 1fr">' +
      '<div class="cell"><div class="l">Rent this film</div><div class="v gold">' + coin(p) + '</div><div class="m">≈ ' + money(p) + " · 30 days</div></div>" +
      '<div class="cell best"><div class="l">With VIP</div><div class="v">Included</div><div class="m">from $' + S.REGIONS[st.region].vip[0] + "/wk</div></div></div></div>";
    return '<div class="fair"><div class="h">' + ic("tag", 14) + "What it costs" + (st.priceLock[t.id] ? '<span class="pill green">' + ic("lock", 11) + " Price locked</span>" : "") + "</div>" +
      '<div class="grid"><div class="cell"><div class="l">Free</div><div class="v">E1–E' + t.free + '</div><div class="m">no ads to start</div></div>' +
      '<div class="cell"><div class="l">' + (t.status === "ongoing" ? "Catch up · " + c.catchUpEps + " eps" : "Finish · " + c.wholeEps + " eps") + '</div><div class="v gold">' + FMT.int(t.status === "ongoing" ? c.catchUp : c.whole) + '</div><div class="m">≈ ' + money(t.status === "ongoing" ? c.catchUp : c.whole) + "</div></div>" +
      '<div class="cell best"><div class="l">Series Pass</div><div class="v">' + FMT.int(c.pass) + '</div><div class="m">≈ ' + money(c.pass) + " · all " + t.eps + "</div></div></div>" +
      '<div class="foot">' + ic("checkc", 14) + "<span>" + p + " coins (≈ " + money(p) + ") an episode, never more. Or 1 ad ≤ 30 s per episode — the ad unlocks it even if it fails.</span></div></div>";
  }
  function castTab(t) {
    if (!t.cast) return '<div class="empty"><b>Cast list coming soon</b>We add the cast once it is confirmed.</div>';
    return '<div class="castg">' + t.cast.map(c =>
      '<div class="castc"><span class="ava" style="--s:44px"><img src="' + Art.avatar("cast" + c.id, { pal: c.pal, kind: c.kind, hair: c.hair }) + '" alt=""></span><span class="b"><div class="n">' + esc(c.actor) + '</div><div class="r">as ' + esc(c.name) + '</div><div class="a">' + esc(c.role) + "</div></span></div>").join("") + "</div>";
  }
  function reviewsTab(t) {
    const list = S.REVIEWS[t.id] || S.REVIEWS.heiress;
    const watched = (st.progress[t.id] || {}).ep || 0;
    return '<div class="pad"><div class="score"><div class="big">' + t.rating + '<small> / 5</small><div class="tiny" style="font-weight:600;margin-top:6px">' + FMT.int(t.ratings) + ' ratings</div></div><div class="bars">' +
      [[5, .74], [4, .17], [3, .05], [2, .02], [1, .02]].map(([s, v]) => "<div>" + s + "<span><i style=\"width:" + v * 100 + '%"></i></span></div>').join("") + "</div></div>" +
      '<div class="tiny mt8">Weighted score — a title with three 5-star ratings can\'t outrank one with thousands. Only viewers who watched 3+ episodes can rate.</div>' +
      '<button class="btn ' + (watched >= 3 ? "pri" : "ghost") + ' block mt12" ' + (watched >= 3 ? 'data-sheet="rate:' + t.id + '"' : "disabled") + ">" + ic("star", 18) + (watched >= 3 ? "Rate this series" : "Watch 3 episodes to rate") + "</button>" +
      list.map(r => '<div class="rv"><div class="h">' + esc(r.by) + stars(r.stars) + '<span class="w">Watched ' + r.eps + " eps · " + r.ago + "</span></div><p>" + esc(r.text) + "</p>" + (r.reply ? '<div class="rep"><b>Spool team</b> · ' + esc(r.reply.replace(" — Spool team", "")) + "</div>" : "") +
        '<div class="tiny mt8">' + ic("thumb", 12) + " Helpful · " + FMT.int(r.helpful) + "</div></div>").join("") + "</div>";
  }

  A.screen("series", {
    title: (id) => (T[id] || T.heiress).name,
    render(id) {
      const t = T[id] || T.heiress;
      const p = st.progress[t.id];
      const tabk = (st.seriesTab && st.seriesTab[t.id]) || (t.kind === "movie" ? "more" : "eps");
      const resumeEp = p && p.ep ? p.ep : 1;
      const isPilot = t.kind === "pilot";
      const creator = t.creator ? C[t.creator] : null;
      const play = '<button class="btn pri" data-go="' + (t.orient === "landscape" ? "landscape/" : "player/") + t.id + "/" + resumeEp + '">' + ic("play", 18) + (t.kind === "movie" ? "Watch film" : p && p.ep ? "Continue E" + resumeEp : "Play E1") + "</button>";
      const returning = st.returning || (p && /\d+ days ago/.test(p.lastSeen) && parseInt(p.lastSeen, 10) > 3);
      let tabsHtml = "";
      const tabs = isPilot ? [["eps", "Episodes"], ["more", "About the pilot"]] : t.kind === "movie" ? [["more", "Details"], ["reviews", "Reviews"]] : [["eps", "Episodes"], ["cast", "Cast"], ["reviews", "Reviews"], ["more", "More like this"]];
      tabsHtml = '<div class="ttabs mt20">' + tabs.map(([k, n]) => '<button class="' + (k === tabk ? "on" : "") + '" data-act="seriesTab:' + t.id + ":" + k + '">' + n + "</button>").join("") + "</div>";
      let tabBody = "";
      if (tabk === "eps") tabBody = '<div class="mt16">' + epGrid(t) + "</div>";
      else if (tabk === "cast") tabBody = '<div class="mt16">' + castTab(t) + "</div>";
      else if (tabk === "reviews") tabBody = '<div class="mt8">' + reviewsTab(t) + "</div>";
      else {
        const sim = S.TITLES.filter(x => x.id !== t.id && x.kind !== "pilot" && x.tropes.some(tr => t.tropes.indexOf(tr) >= 0) && (st.region === "IN" || x.lang !== "hi")).slice(0, 9);
        tabBody = (isPilot ? '<div class="card mt16"><b style="font-size:15px">How Pilot Season works</b><div class="vstack mt12" style="font-size:13px;color:var(--text-2);line-height:1.5">' +
          "<div>1 · Creators post 2–3 episodes as a pilot. Watching is free.</div><div>2 · Tap <b>Want more</b> if you'd watch a full season. One vote per viewer.</div><div>3 · At " + FMT.int(t.goal) + " votes and a strong finish rate, the Spool team reviews it for a full order.</div><div>4 · Greenlit series are funded, and the creator keeps a revenue share.</div></div></div>" : "") +
          sec(isPilot ? "More pilots" : "More like this") + '<div class="pgrid">' + sim.map(x => pc(x, { compact: true })).join("") + "</div>";
      }
      const votes = isPilot ? t.votes + (st.votes.has(t.id) ? 1 : 0) : 0;
      return '<div class="scroll bot-safe-sm">' +
        '<div class="shero"><img src="' + (t.orient === "landscape" ? Art.wide(t) : Art.poster(t)) + '" alt="">' +
        '<div class="bar"><button class="ib glass" data-back aria-label="Back">' + ic("back", 22, 2) + '</button><span class="sp"></span>' +
        '<button class="ib glass" data-sheet="share:' + t.id + ":" + resumeEp + '" aria-label="Share">' + ic("share", 20) + "</button>" +
        '<button class="ib glass" data-sheet="settings" aria-label="More">' + ic("more", 20) + "</button></div>" +
        '<div class="in"><div class="kick">' + esc(t.kicker || "") + '<span class="labs">' + statusTag(t) + '<span class="tag">' + esc(S.genre(t)) + "</span></span></div><h1" + (t.st === "caps" || t.st === "wide" ? ' class="caps"' : "") + ">" + esc(t.name) + "</h1>" + (t.sub ? '<div class="subt">' + esc(t.sub) + "</div>" : "") +
        '<div class="metaline"><span class="star">' + ic("starf") + t.rating + "</span><span>" + FMT.n(t.ratings) + ' ratings</span><span class="sep"></span><span>' + t.age + '</span><span class="sep"></span><span>' +
        (t.kind === "movie" ? FMT.mins(t.runtime) : t.eps + " episodes") + "</span>" + (t.status === "ongoing" ? '<span class="sep"></span><span>' + esc(t.schedule) + "</span>" : t.status === "complete" ? '<span class="sep"></span><span style="color:var(--green-ink)">Complete</span>' : "") + "</div></div></div>" +
        (returning && t.kind !== "movie" && t.kind !== "pilot" ? '<button class="aitoggle" data-sheet="recap:' + t.id + '" style="margin-top:12px"><span class="ic">' + ic("sparkle") + '</span><span class="b"><b>It\'s been a while — catch up in 20 s</b><span>Story Rewind recaps E1–E' + (p ? p.ep - 1 : 1) + " without spoilers.</span></span>" + ic("fwd", 18) + "</button>" : "") +
        (isPilot ? '<div class="card mt12"><div class="hstack">' + avaC(creator, 36) + '<div class="sp"><b style="font-size:14px">' + esc(creator.name) + '</b><div class="tiny">' + esc(creator.handle) + " · Pilot Season</div></div>" +
          '<button class="btn sm' + (st.votes.has(t.id) ? "" : " pri") + '" data-act="vote:' + t.id + '">' + ic(st.votes.has(t.id) ? "check" : "thumb", 16) + (st.votes.has(t.id) ? "Voted" : "Want more") + "</button></div>" +
          '<div class="mt12"><div class="vbar"><i style="width:' + Math.min(100, votes / t.goal * 100) + '%"></i></div><div class="vtxt"><span><b>' + FMT.int(votes) + "</b> of " + FMT.int(t.goal) + " votes</span><span>" + Math.round(t.completionRate * 100) + "% finish all episodes</span></div></div></div>" : "") +
        '<div class="sacts">' + play +
        '<button class="btn sq' + (st.myList.has(t.id) ? " on" : "") + '" data-act="list:' + t.id + '" aria-label="My List">' + ic(st.myList.has(t.id) ? "bookmarkf" : "bookmark", 20) + "</button>" +
        (t.status === "ongoing" ? '<button class="btn sq' + (st.following.has(t.id) ? " on" : "") + '" data-act="follow:' + t.id + '" aria-label="Follow drops">' + ic("bell", 20) + "</button>" : "") +
        '<button class="btn sq" data-sheet="share:' + t.id + ":" + resumeEp + '" aria-label="Send a Cliffhanger">' + ic("gift", 20) + "</button></div>" +
        fairCard(t) +
        '<div class="syn clamp3" id="syn">' + esc(t.synopsis) + "</div>" +
        '<div class="langs">' + t.audio.map(a => '<span class="pill' + (/AI voice/.test(a) ? " violet" : "") + '">' + ic(/AI voice/.test(a) ? "sparkle" : "headphones") + esc(a) + "</span>").join("") + '<span class="pill">' + ic("cc") + t.subs + " subtitle languages</span></div>" +
        '<div class="chips wrap mt12">' + t.tropes.map(tr => '<button class="chip sm" data-go="browse/' + encodeURIComponent(tr) + '">' + esc(tr) + "</button>").join("") + "</div>" +
        tabsHtml + tabBody + "</div>";
    }
  });

  /* =====================================================================
     PLAYER (vertical)
     ===================================================================== */
  function slide(t, n, cls) {
    const a = A.access(t, n);
    const shots = [0, 1, 2].map(i => '<img class="shot' + (i === 0 ? " on" : "") + '" src="' + Art.scene(t, n, i) + '" alt="">').join("");
    return '<div class="pslide ' + cls + '"><div class="vid' + (a === "locked" || a === "soon" ? " locked" : "") + '">' + shots + '<div class="flick"></div></div><div class="pgrad"></div></div>';
  }
  A.screen("player", {
    title: (id, n) => (T[id] || T.heiress).name + " · E" + (n || 1),
    noRefresh: true,
    render(id, n, at) {
      const t = T[id] || T.heiress;
      n = Math.max(1, Math.min(t.eps, +n || 1));
      const ep = A.epTitle(t, n);
      const a = A.access(t, n);
      const p = st.progress[t.id];
      const returning = st.returning || (p && /\d+ days ago/.test(p.lastSeen || "") && parseInt(p.lastSeen, 10) > 3);
      const liked = st.likes.has(t.id + ":" + n);
      const saved = st.myList.has(t.id);
      const sc = S.SCRIPT[t.id + ":" + n] || S.genericScript(t, n);
      const creator = t.creator ? C[t.creator] : null;
      let pane = "";
      if (a === "locked") {
        pane = '<div class="lockpane"><span class="lk">' + ic("lock", 30) + "</span><h4>E" + n + " · " + esc(ep.title) + "</h4><p>Unlock for " + A.priceOf(t) + " coins (≈ " + money(A.priceOf(t)) + "), one short ad, VIP or the Series Pass.</p>" +
          '<button class="btn pri" data-sheet="unlock:' + t.id + ":" + n + '">' + ic("unlock", 18) + "See unlock options</button>" +
          '<button class="link muted" data-go="series/' + t.id + '">Episode list</button></div>';
      } else if (a === "soon") {
        pane = '<div class="lockpane"><span class="lk">' + ic("calendar", 30) + "</span><h4>E" + n + " drops " + esc((t.nextDrop || "soon").replace("Today ", "tonight at ")) + "</h4><p>We'll remind you an hour before. VIP gets followed series 24 hours early.</p>" +
          '<button class="btn ' + (st.following.has(t.id) ? "" : "pri") + '" data-act="follow:' + t.id + '">' + ic("bell", 18) + (st.following.has(t.id) ? "Reminder on" : "Remind me") + "</button></div>";
      }
      return '<div class="player' + (a === "locked" || a === "soon" ? " paused" : "") + '" id="player">' +
        '<div class="ptrack">' + (n > 1 ? slide(t, n - 1, "prev") : "") + slide(t, n, "cur") + (n < t.eps ? slide(t, n + 1, "next") : "") + "</div>" +
        '<div class="ptop"><button class="ib" data-back aria-label="Back">' + ic("back", 24, 2) + '</button><div class="ttl"><b>' + esc(t.name) + "</b><span>E" + n + " · " + esc(ep.title) + "</span></div>" +
        '<button class="ib" data-act="cc" aria-label="Subtitles">' + ic("cc", 22) + "</button>" +
        '<button class="ib" data-sheet="settings" aria-label="Playback settings">' + ic("morev", 22) + "</button></div>" +
        '<div class="subs"></div><div class="floaters"></div>' +
        '<div class="bigplay">' + ic("play", 34) + '</div><div class="speed2">' + ic("fwd10", 14) + "2× speed</div>" +
        (a === "locked" || a === "soon" ? pane : "") +
        '<div class="prail">' +
        (creator ? '<button class="ra" data-go="creator/' + creator.id + '">' + avaC(creator, 44) + '<span class="fol">' + ic("plus", 12, 3) + "</span></button>" : "") +
        '<button class="ra' + (liked ? " on" : "") + '" data-act="like" aria-label="Like"><span class="c">' + ic(liked ? "heartf" : "heart", 26) + "</span>" + FMT.n(Math.round(t.likes / Math.pow(n, .5) / 10) + (liked ? 1 : 0)) + "</button>" +
        '<button class="ra" data-sheet="comments:' + t.id + ":" + n + '" aria-label="Comments"><span class="c">' + ic("comment", 25) + "</span>" + FMT.n(Math.round(t.views / Math.pow(n, .6) / 1600)) + "</button>" +
        '<button class="ra' + (saved ? " saved" : "") + '" data-act="list:' + t.id + '" aria-label="My List"><span class="c">' + ic(saved ? "bookmarkf" : "bookmark", 24) + "</span>" + FMT.n(t.saves) + "</button>" +
        '<button class="ra" data-sheet="share:' + t.id + ":" + n + '" aria-label="Send a Cliffhanger"><span class="c">' + ic("gift", 24) + "</span>Gift</button>" +
        '<button class="ra" data-sheet="episodes:' + t.id + '" aria-label="Episodes"><span class="c">' + ic("grid", 22) + "</span>" + n + "/" + t.eps + "</button></div>" +
        '<div class="pinfo"><button class="series" data-go="series/' + t.id + '">' + esc(t.name) + ic("fwd", 16, 2.2) + '</button><div class="ep clamp1">E' + n + " · " + esc(ep.title) + "</div>" +
        '<div class="chipsrow">' + (returning && n > 1 ? '<button class="pchip ai" data-sheet="recap:' + t.id + '">' + ic("sparkle") + "Previously on · 20 s</button>" : "") +
        '<button class="pchip" data-sheet="settings">' + ic("headphones") + esc(st.settings.audio === "Original" ? t.audio[0] : t.audio[1] || t.audio[0]).replace(" · AI voice", " · AI") + "</button></div></div>" +
        '<div class="pulse" id="pulse"><div class="pks"></div><div class="heat"></div><div class="line"><i></i></div><div class="knob"></div></div>' +
        '<div class="ptime"><span class="a">' + FMT.dur(+at || 0) + "</span><span>" + FMT.dur(sc.dur) + "</span></div>" +
        (n === 1 && a !== "locked" ? '<div class="swipehint">' + ic("arrowu", 14, 2.2) + "Swipe up for the next episode</div>" : "") +
        "</div>";
    },
    mount(view, id, n, at) {
      const t = T[id] || T.heiress;
      n = Math.max(1, Math.min(t.eps, +n || 1));
      A.Player.mount(view, t.id, n, +at || 0);
      const surface = $("#player", view);
      A.pager(surface, {
        canMove: dir => (dir > 0 ? n < t.eps : n > 1),
        onMove: dir => A.replace("player/" + t.id + "/" + (n + dir)),
        onTap: () => { if (A.canWatch(t, n)) A.Player.toggle(); },
        onDouble: (x, y) => { A.heartBurst(surface, x, y); A.ACT.like(null, "burst"); },
        onHold: on => { A.Player.fast = on; surface.classList.toggle("fast", on); if (on) A.log("track", "speed_hold · 2×", "long-press"); }
      });
      $("#pulse", view).addEventListener("click", e => {
        if (e.target.closest(".pk")) return;
        const r = e.currentTarget.getBoundingClientRect();
        A.Player.seek((e.clientX - r.left) / r.width * A.Player.sc.dur);
      });
      const hint = $(".swipehint", view);
      if (hint) setTimeout(() => hint.remove(), 4200);
      if (A.access(t, n) === "locked") {
        A.log("track", "paywall_view", "{title:" + t.id + ", ep:" + n + ", price:" + A.priceOf(t) + ", balance:" + A.balance() + ", ads_left:" + (S.REGIONS[st.region].adsPerDay - st.adsToday) + "}");
        if (st.autoUnlock && A.split(A.priceOf(t)).ok && st.spentToday + A.priceOf(t) <= st.spendCap) {
          setTimeout(() => {
            if (A.unlock(t.id, n, "coins", true)) {
              A.toast("Auto-unlocked E" + n + " · " + A.priceOf(t) + " coins · " + (st.spendCap - st.spentToday) + " left in today's cap", "zap");
              A.replace("player/" + t.id + "/" + n);
            }
          }, 500);
        } else setTimeout(() => { const c = A.current(); if (c && c.name === "player" && c.args[0] === t.id && +c.args[1] === n) A.Sheet.open("unlock", t.id, n); }, 650);
      }
    },
    unmount() { A.Player.stop(); },
    keys(e) {
      const c = A.current(), t = T[c.args[0]], n = +c.args[1] || 1;
      if (e.key === "ArrowDown" || e.key === "j") { if (n < t.eps) A.replace("player/" + t.id + "/" + (n + 1)); e.preventDefault(); }
      else if (e.key === "ArrowUp" || e.key === "k") { if (n > 1) A.replace("player/" + t.id + "/" + (n - 1)); e.preventDefault(); }
      else if (e.key === " ") { A.Player.toggle(); e.preventDefault(); }
      else if (e.key === "l") A.ACT.like(null, "key");
      else if (e.key === "c") A.Sheet.open("comments", t.id, n);
      else if (e.key === "e") A.Sheet.open("episodes", t.id);
      else if (e.key === "ArrowRight") A.Player.seek(A.Player.time + 10);
      else if (e.key === "ArrowLeft") A.Player.seek(A.Player.time - 10);
    }
  });

  /* end of episode: Cliffhanger Call, or up-next */
  A.on("ended", (t, n) => {
    const c = A.current();
    if (!c || c.name !== "player") return;
    const view = c.view;
    const sc = A.Player.sc;
    const nx = n + 1;
    const nextA = nx <= t.eps ? A.access(t, nx) : null;
    const box = document.createElement("div");
    box.className = "endcard";
    if (sc.call && !st.calls[t.id + ":" + n]) {
      const call = sc.call;
      box.innerHTML = '<div class="k">' + ic("poll", 14) + "Cliffhanger Call</div><h4>" + esc(call.q) + "</h4>" +
        '<div class="opts" id="callopts">' + call.options.map(o => {
          const ch = (t.cast || []).find(x => x.id === o.k);
          return '<button class="opt" data-act="call:' + t.id + ":" + n + ":" + o.k + '"><span class="fill"></span>' + (ch ? '<span class="ava" style="--s:38px"><img src="' + Art.avatar("cast" + ch.id, { pal: ch.pal, kind: ch.kind, hair: ch.hair }) + '" alt=""></span>' : "") + "<span>" + esc(o.n) + '</span><span class="pc2">' + Math.round(o.pct * 100) + "%</span></button>";
        }).join("") + "</div>" +
        '<div class="foot">' + FMT.n(call.calls) + " calls · revealed in E" + call.reveal + ' · +5 coins if you\'re right<button class="btn sm glass" data-act="skipCall:' + t.id + ":" + n + '">Skip</button></div>';
      A.log("track", "cliffhanger_call_shown", "{title:" + t.id + ", ep:" + n + ", question:\"" + esc(call.q) + "\"}");
    } else {
      box.innerHTML = '<div class="k">' + ic("next", 14) + "Up next</div><h4>" + (nextA ? "E" + nx + " · " + esc(A.epTitle(t, nx).title) : "That's the latest episode") + "</h4>" +
        '<div class="foot" style="margin-top:0">' + (nextA === "locked" ? ic("lock", 14) + " " + A.priceOf(t) + " coins · or 1 short ad" : nextA === "soon" ? "Drops " + esc(t.nextDrop || "soon") : nextA ? "Free for you · playing in 3 s" : "Follow for drop alerts") +
        (nextA ? '<button class="btn sm pri" data-act="nextEp">' + (nextA === "locked" ? "Unlock" : "Play") + "</button>" : '<button class="btn sm pri" data-act="follow:' + t.id + '">Follow</button>') + "</div>";
      if (nextA && nextA !== "locked" && nextA !== "soon" && st.autoplay) setTimeout(() => { const cc = A.current(); if (cc && cc.view === view && A.Player.ended) A.replace("player/" + t.id + "/" + nx); }, 3000);
    }
    $("#player", view).classList.add("ended");
    $("#player", view).appendChild(box);
  });

  /* =====================================================================
     LANDSCAPE PLAYER (series & films)
     ===================================================================== */
  A.screen("landscape", {
    title: (id) => (T[id] || T.ledger).name + " · landscape",
    noRefresh: true,
    rise: true,
    render(id, n) {
      const t = T[id] || T.ledger;
      n = +n || 1;
      const a = A.access(t, n);
      const dur = t.kind === "movie" ? t.runtime : t.epLen;
      return '<div class="lplayer" id="lplayer"><div class="vid' + (a === "locked" ? " locked" : "") + '"><img class="shot on" src="' + Art.wide(t) + '" alt=""><div class="flick"></div></div><div class="lg"></div>' +
        '<div class="lt"><button class="ib" data-act="exitLand" aria-label="Back">' + ic("back", 24, 2) + '</button><div class="ttl"><b>' + esc(t.name) + "</b><span>" + (t.kind === "movie" ? "Film · " + FMT.mins(t.runtime) : "E" + n + " of " + t.eps) + "</span></div>" +
        '<button class="pchip" data-sheet="settings">' + ic("headphones") + esc(t.audio[0]) + '</button><button class="pchip" data-sheet="settings">' + ic("cc") + esc(st.settings.subs) + "</button></div>" +
        (a === "locked" ? '<div class="lockpane"><span class="lk">' + ic("lock", 28) + "</span><h4>" + (t.kind === "movie" ? "Rent " + esc(t.name) : "Unlock E" + n) + "</h4><p>" + A.priceOf(t) + " coins (≈ " + money(A.priceOf(t)) + ") · or included with VIP</p>" +
          '<button class="btn pri" data-sheet="unlock:' + t.id + ":" + n + '">' + ic("unlock", 18) + "Unlock options</button></div>" :
          '<div class="lc"><button class="ib" data-act="lseek:-10">' + ic("back10", 30) + '</button><button class="ib main" data-act="lplay" id="lpp">' + ic("pause", 30) + '</button><button class="ib" data-act="lseek:10">' + ic("fwd10", 30) + "</button></div>" +
          '<div class="subs"><span class="ln" id="lsub"></span></div>' +
          '<button class="btn sm glass skip" data-act="lseek:85">Skip intro</button>' +
          '<div class="lb"><div class="pulse" id="lpulse" style="position:relative;left:0;right:0;bottom:0;height:30px"><div class="heat"></div><div class="line"><i></i></div><div class="knob"></div></div>' +
          '<div class="row"><span class="t" id="ltime">0:00 / ' + FMT.dur(dur) + '</span><span class="sp"></span><button class="pchip" data-sheet="settings">' + ic("speed") + '1×</button><button class="pchip" data-sheet="settings">' + ic("hd") + esc(st.settings.quality) + "</button>" +
          (t.kind !== "movie" && n < t.eps ? '<button class="pchip acc" data-act="lnext:' + t.id + ":" + (n + 1) + '">' + ic("next") + "Next episode</button>" : "") + "</div></div>") + "</div>";
    },
    mount(view, id, n) {
      const t = T[id] || T.ledger;
      n = +n || 1;
      if (window.Stage) window.Stage.rotate(true);
      if (A.access(t, n) === "locked") { setTimeout(() => A.Sheet.open("unlock", t.id, n), 700); return; }
      const dur = t.kind === "movie" ? t.runtime : t.epLen;
      const heat = $("#lpulse .heat", view);
      const r = S.rng("lh" + t.id + n);
      heat.innerHTML = Array.from({ length: 80 }, () => { const v = 10 + r() * 40 + (r() < .06 ? 50 : 0); return '<i style="height:' + v + '%"' + (v > 60 ? ' class="hot"' : "") + "></i>"; }).join("");
      const lines = ["[ Rain on the window ]", "You moved the money.", "I moved what they told me to move.", "Then who told you?", "[ A phone rings ]"];
      let time = (st.progress[t.id] && st.progress[t.id].ep === n && st.progress[t.id].t) || 0, last = performance.now(), playing = true;
      const tick = ts => {
        if (!view.isConnected) return;
        const dt = Math.min(.1, (ts - last) / 1000); last = ts;
        if (playing) time = Math.min(dur, time + dt * 12 * st.demoSpeed);
        const f = time / dur;
        const li = $("#lpulse .line i", view), kn = $("#lpulse .knob", view);
        if (li) li.style.width = f * 100 + "%";
        if (kn) kn.style.left = f * 100 + "%";
        $$("#lpulse .heat i", view).forEach((b, i, all) => b.classList.toggle("past", i < f * all.length));
        const tm = $("#ltime", view); if (tm) tm.textContent = FMT.dur(time) + " / " + FMT.dur(dur);
        const s = $("#lsub", view); if (s) s.textContent = lines[Math.floor(time / 40) % lines.length];
        view._raf = requestAnimationFrame(tick);
      };
      view._raf = requestAnimationFrame(tick);
      view._ctl = {
        toggle() { playing = !playing; $("#lpp", view).innerHTML = ic(playing ? "pause" : "play", 30); A.log("track", playing ? "playback_resume" : "playback_pause", "landscape · t=" + FMT.dur(time)); },
        seek(d) { time = Math.max(0, Math.min(dur, d === 85 ? 85 : time + d)); A.log("track", d === 85 ? "skip_intro" : "seek", "t=" + FMT.dur(time)); },
        save() { const p = st.progress[t.id] || (st.progress[t.id] = {}); p.ep = n; p.t = Math.round(time); p.lastSeen = "Now"; }
      };
      $("#lpulse", view).addEventListener("click", e => { const rr = e.currentTarget.getBoundingClientRect(); time = (e.clientX - rr.left) / rr.width * dur; });
      A.log("track", "episode_start", "{title:" + t.id + ", ep:" + n + ", orientation:landscape, rendition:16:9}");
    },
    unmount(view) {
      if (view._ctl) view._ctl.save();
      cancelAnimationFrame(view._raf);
      if (window.Stage) window.Stage.rotate(false);
    }
  });

  /* =====================================================================
     SCENES (vertical feed: trailers, creator videos, pilots, clips)
     ===================================================================== */
  function feedItems() {
    const f = st.feedTab || "foryou";
    const tr = id => ({ kind: "trailer", t: T[id] });
    const vd = id => ({ kind: "video", v: V[id] });
    const pl = id => ({ kind: "pilot", t: T[id] });
    if (f === "pilots") return [pl("lastdelivery"), vd("v5"), pl("ghost"), pl("desk14"), vd("v12"), pl("aunty"), vd("v11")];
    if (f === "following") return [vd("v10"), vd("v1"), vd("v4"), vd("v3"), vd("v6")];
    return st.region === "IN"
      ? [tr("sindoor"), vd("v3"), vd("v7"), tr("shaadi"), pl("aunty"), vd("v9"), tr("monsoon"), vd("v10")]
      : [vd("v2"), tr("heiress"), vd("v1"), pl("lastdelivery"), tr("moonbound"), vd("v4"), vd("v9"), tr("crown"), pl("ghost"), vd("v6"), vd("v8")];
  }
  function feedSlide(it, cls) {
    let img, body = "", rail = "", dur = 30;
    if (it.kind === "video") {
      const v = it.v, c = C[v.by];
      img = Art.thumb(v); dur = v.dur;
      const link = v.link ? T[v.link] : v.pilot ? T[v.pilot] : v.series ? T[v.series] : null;
      body = '<button class="series" data-go="creator/' + c.id + '">' + esc(c.handle) + (c.verified ? ic("checkc", 15) : "") + '</button><div class="ep clamp2">' + esc(v.title) + "</div>" +
        (v.sound ? '<div class="ep" style="font-size:12px">' + ic("music", 12) + " " + esc(v.sound) + "</div>" : "") +
        (link ? '<button class="linkchip" data-go="' + (link.kind === "pilot" ? "series/" + link.id : "player/" + link.id + "/1") + '">' + poster(link, { title: false, tags: false }) + "<span><b>" + esc(link.name) + "</b><span>" + (link.kind === "pilot" ? "Pilot Season · watch free" : link.kind === "creator" ? "Creator series" : "Fan Link · E1–E" + link.free + " free") + '</span></span><span class="go">' + (link.kind === "pilot" ? "Open" : "Watch") + "</span></button>" : "");
      rail = '<button class="ra" data-go="creator/' + c.id + '">' + avaC(c, 44) + (st.followingCreators.has(c.id) ? "" : '<span class="fol">' + ic("plus", 12, 3) + "</span>") + "</button>" +
        '<button class="ra" data-act="likeV:' + v.id + '"><span class="c">' + ic(st.likes.has(v.id) ? "heartf" : "heart", 26) + "</span>" + FMT.n(v.likes + (st.likes.has(v.id) ? 1 : 0)) + "</button>" +
        '<button class="ra" data-act="toast:Comments open in the full app"><span class="c">' + ic("comment", 25) + "</span>" + FMT.n(v.comments) + "</button>" +
        '<button class="ra" data-act="toast:Link copied · spool.tv/v/' + v.id + '"><span class="c">' + ic("share", 24) + "</span>Share</button>";
    } else {
      const t = it.t;
      img = Art.scene(t, 1, 1);
      const isP = it.kind === "pilot";
      const c = t.creator ? C[t.creator] : null;
      const votes = isP ? t.votes + (st.votes.has(t.id) ? 1 : 0) : 0;
      body = '<span class="pill ' + (isP ? "" : "accent") + '" style="margin-bottom:8px;background:' + (isP ? "#fff;color:#111" : "") + '">' + ic(isP ? "clapper" : "film") + (isP ? "Pilot Season" : "Trailer") + "</span>" +
        '<button class="series" data-go="series/' + t.id + '" style="display:flex;margin-top:6px">' + esc(t.name) + ic("fwd", 16, 2.2) + "</button>" +
        '<div class="ep clamp2">' + esc(t.synopsis) + "</div>" +
        (isP ? '<div class="votebox"><div class="top">' + avaC(c, 24) + esc(c.name) + '<button class="btn xs ' + (st.votes.has(t.id) ? "glass" : "pri") + '" data-act="vote:' + t.id + '">' + ic(st.votes.has(t.id) ? "check" : "thumb", 14) + (st.votes.has(t.id) ? "Voted" : "Want more") + "</button></div>" +
          '<div class="vbar"><i style="width:' + Math.min(100, votes / t.goal * 100) + '%"></i></div><div class="vtxt" style="color:rgba(255,255,255,.7)"><span><b style="color:#fff">' + FMT.int(votes) + "</b> / " + FMT.int(t.goal) + "</span><span>" + Math.round(t.completionRate * 100) + "% finish it</span></div></div>"
          : '<div class="fcta"><button class="btn pri" data-go="player/' + t.id + '/1">' + ic("play", 16) + "Watch E1 free</button><button class=\"btn glass\" data-act=\"list:" + t.id + '">' + ic(st.myList.has(t.id) ? "check" : "plus", 18, 2.2) + "My List</button></div>");
      rail = '<button class="ra" data-act="list:' + t.id + '"><span class="c">' + ic(st.myList.has(t.id) ? "bookmarkf" : "bookmark", 24) + "</span>" + FMT.n(t.saves) + "</button>" +
        '<button class="ra" data-sheet="share:' + t.id + ':1"><span class="c">' + ic("share", 24) + "</span>Share</button>";
    }
    return '<div class="pslide ' + cls + '"><div class="vid"><img class="shot on" src="' + img + '" alt=""><div class="flick"></div></div><div class="pgrad"></div>' +
      '<div class="prail" style="bottom:176px">' + rail + '</div><div class="pinfo" style="bottom:118px">' + body + "</div>" +
      '<div class="pulse" style="bottom:100px;height:10px"><div class="line"><i class="fp"></i></div></div></div>';
  }
  A.screen("scenes", {
    tab: "scenes",
    title: () => "Scenes",
    noRefresh: false,
    render(start) {
      if (start === "pilots" && st.feedTab !== "pilots") { st.feedTab = "pilots"; st.feedIdx = 0; }
      if (start && start !== "pilots" && st.feedTab === "pilots") st.feedTab = "foryou";
      const items = feedItems();
      let i = st.feedIdx || 0;
      if (start && start !== "pilots") { const k = items.findIndex(x => x.v && x.v.id === start); if (k >= 0) i = k; }
      i = Math.max(0, Math.min(items.length - 1, i));
      st.feedIdx = i;
      const f = st.feedTab || "foryou";
      return '<div class="feed" id="feed"><div class="ptrack">' + (i > 0 ? feedSlide(items[i - 1], "prev") : "") + feedSlide(items[i], "cur") + (i < items.length - 1 ? feedSlide(items[i + 1], "next") : "") + "</div>" +
        '<div class="feedtabs">' + [["following", "Following"], ["foryou", "For you"], ["pilots", "Pilots"]].map(([k, n]) => '<button class="' + (k === f ? "on" : "") + '" data-act="feedTab:' + k + '">' + n + "</button>").join("") + "</div>" +
        '<button class="ib search" data-go="search" aria-label="Search" style="color:#fff">' + ic("search", 22) + "</button><div class=\"floaters\"></div></div>";
    },
    mount(view) {
      const items = feedItems();
      const i = st.feedIdx || 0;
      const it = items[i];
      const surface = $("#feed", view);
      A.pager(surface, {
        canMove: dir => (dir > 0 ? i < items.length - 1 : i > 0),
        onMove: dir => { st.feedIdx = i + dir; A.refresh(); },
        onDouble: (x, y) => { A.heartBurst(surface, x, y); if (it.v) A.ACT.likeV(null, it.v.id, true); },
        onTap: () => { view._paused = !view._paused; A.log("track", view._paused ? "feed_pause" : "feed_resume", ""); }
      });
      let p = 0, last = performance.now();
      const dur = it.v ? it.v.dur : 30;
      const tick = ts => {
        if (!view.isConnected) return;
        const dt = Math.min(.1, (ts - last) / 1000); last = ts;
        if (!view._paused && !A.Sheet.kind) p = Math.min(1, p + dt * st.demoSpeed / dur);
        const fp = $(".pslide.cur .fp", view); if (fp) fp.style.width = p * 100 + "%";
        if (p >= 1) { p = 0; A.log("track", "feed_loop", it.v ? it.v.id : it.t.id); }
        view._raf = requestAnimationFrame(tick);
      };
      view._raf = requestAnimationFrame(tick);
      A.log("track", "feed_impression", it.kind === "video" ? "{video:" + it.v.id + ", creator:" + it.v.by + (it.v.link ? ", fan_link:" + it.v.link : "") + "}" : "{" + it.kind + ":" + it.t.id + "}");
    },
    unmount(view) { cancelAnimationFrame(view._raf); }
  });

  /* =====================================================================
     CREATORS
     ===================================================================== */
  A.screen("creator", {
    title: (id) => (C[id] || C.ritu).name,
    render(id) {
      const c = C[id] || C.ritu;
      const vids = S.VIDEOS.filter(v => v.by === c.id && v.status === "live");
      const series = S.TITLES.filter(t => t.creator === c.id);
      const fol = st.followingCreators.has(c.id);
      const tabk = st.creatorTab || "videos";
      const cover = vids[0] ? Art.thumb(vids[0]) : Art.avatar(c.id, { pal: c.pal, kind: c.kind, hair: c.hair });
      return '<div class="scroll bot-safe-sm"><div class="cprof"><div class="cover"><img src="' + cover + '" alt=""></div>' +
        '<div class="bar"><button class="ib glass" data-back aria-label="Back">' + ic("back", 22, 2) + '</button><span class="sp"></span><button class="ib glass" data-act="toast:Link copied · spool.tv/' + c.handle.slice(1) + '">' + ic("share", 20) + "</button></div>" +
        '<div class="who">' + avaC(c, 84) + "<h2>" + esc(c.name) + (c.verified ? ic("checkc", 20) : "") + '</h2><div class="h">' + esc(c.handle) + " · " + esc(c.city) + (c.partner ? ' · <span class="accent-text">Partner</span>' : "") + "</div>" +
        '<div class="bio">' + esc(c.bio) + "</div>" +
        '<div class="nums"><div><b>' + FMT.n(c.followers + (fol ? 1 : 0)) + "</b><span>followers</span></div><div><b>" + c.videos + "</b><span>videos</span></div><div><b>" + series.length + "</b><span>series & pilots</span></div></div>" +
        '<div class="acts"><button class="btn ' + (fol ? "" : "pri") + '" data-act="followC:' + c.id + '">' + ic(fol ? "usercheck" : "userplus", 18) + (fol ? "Following" : "Follow") + "</button>" +
        '<button class="btn" data-sheet="tip:' + c.id + '">' + ic("gift", 18) + "Tip</button></div></div></div>" +
        '<div class="ttabs mt20">' + [["videos", "Videos"], ["series", "Series & pilots"]].map(([k, n]) => '<button class="' + (k === tabk ? "on" : "") + '" data-act="creatorTab:' + k + '">' + n + "</button>").join("") + "</div>" +
        (tabk === "videos" ? '<div class="vgrid mt8">' + (vids.length ? vids : S.VIDEOS.slice(0, 6)).map(v => '<button data-go="scenes/' + v.id + '"><img src="' + Art.thumb(v) + '" alt=""><span class="v">' + ic("play") + FMT.n(v.views) + "</span>" + (v.link ? '<span class="tg pill solid" style="height:18px;font-size:9.5px">Fan Link</span>' : "") + "</button>").join("") + "</div>" :
          '<div class="pgrid mt16">' + (series.length ? series.map(t => pc(t, { compact: true, metaText: t.kind === "pilot" ? FMT.int(t.votes) + " votes · pilot" : t.eps + " eps" })).join("") : '<div class="empty" style="grid-column:1/-1"><b>No series yet</b></div>') + "</div>") + "</div>";
    }
  });

  /* ---------- create / upload ---------- */
  const CLIPS = [
    { id: "c1", cat: "theory", dur: 74, art: { pal: ["#1a0710", "#5b0f1f", "#ff8a5c"], motif: "blinds", fig: "over", seed: "mc1" } },
    { id: "c2", cat: "storytime", dur: 52 }, { id: "c3", cat: "travel", dur: 186, orient: "landscape" }, { id: "c4", cat: "dance", dur: 31 },
    { id: "c5", cat: "food", dur: 63 }, { id: "c6", cat: "shortfilm", dur: 98 }, { id: "c7", cat: "comedy", dur: 44 }, { id: "c8", cat: "beauty", dur: 58 }, { id: "c9", cat: "music", dur: 40 }
  ];
  A.screen("create", {
    title: (s) => "Create · " + (s || "pick"),
    rise: true,
    render(step) {
      const d = st.draft || (st.draft = { type: "video", clip: "c1", title: "Ethan sent the text — here's the proof", desc: "", link: "heiress", age: "13+", vis: "Public", subs: true, rights: false, series: "", ep: 1 });
      if (step === "details") {
        const clip = CLIPS.find(c => c.id === d.clip);
        return hdr(d.type === "pilot" ? "Submit a pilot" : d.type === "episode" ? "New episode" : "New video", "Step 2 of 3 · details", { solid: true }) +
          '<div class="scroll bot-safe-sm"><div class="hstack pad mt12" style="align-items:flex-start;gap:12px"><div class="poster tall bare" style="width:96px;flex:none"><img src="' + Art.thumb(Object.assign({ id: "clip" + clip.id }, clip)) + '" alt=""></div>' +
          '<div class="sp"><div class="pill green">' + ic("checkc") + (clip.orient === "landscape" ? "Landscape 16:9" : "Vertical 9:16") + " · " + FMT.dur(clip.dur) + '</div><div class="tiny mt8">Cover frame</div><div class="hstack mt8" style="gap:4px">' +
          [0, 1, 2, 3].map(i => '<span style="width:34px;height:48px;border-radius:6px;overflow:hidden;opacity:' + (i ? .55 : 1) + ";box-shadow:" + (i ? "none" : "0 0 0 2px var(--accent)") + '"><img src="' + Art.thumb(Object.assign({ id: "clip" + clip.id + i }, clip)) + '" style="width:100%;height:100%;object-fit:cover"></span>').join("") + "</div></div></div>" +
          '<div class="field mt16"><label>Title</label><input id="ctitle" value="' + esc(d.title) + '" maxlength="80"></div>' +
          '<div class="field"><label>Description</label><textarea id="cdesc" rows="2" placeholder="What happens, who\'s in it, any spoilers?">' + esc(d.desc) + "</textarea></div>" +
          (d.type !== "pilot" ? '<div class="field"><label>' + ic("link", 13) + ' Fan Link · tag the drama this is about</label><div class="chips" style="padding:0">' + ["", "heiress", "divorce", "moonbound", "mafia"].map(id => '<button class="chip sm' + (d.link === id ? " acc" : "") + '" data-act="draft:link:' + id + '">' + (id ? esc(T[id].name) : "None") + "</button>").join("") + "</div>" +
            '<div class="hint">Viewers get a “Watch E1” button. You earn 10% of coins they spend on that drama for 30 days.</div></div>' : "") +
          (d.type === "episode" ? '<div class="field"><label>Series</label><select><option>Ethan theories (new series)</option><option>Story time with Maya</option></select><div class="hint">Episodes play in order with sequential playback, like a drama.</div></div>' : "") +
          '<div class="field"><label>Audience</label><div class="seg">' + ["All ages", "13+", "16+", "18+"].map(a => '<button class="' + (d.age === a ? "on" : "") + '" data-act="draft:age:' + a + '">' + a + "</button>").join("") + "</div></div>" +
          '<div class="field"><label>Visibility</label><div class="seg">' + ["Public", "Followers", "Private"].map(a => '<button class="' + (d.vis === a ? "on" : "") + '" data-act="draft:vis:' + a + '">' + a + "</button>").join("") + "</div></div>" +
          '<div class="list" style="margin-bottom:12px"><div class="row"><span class="ic violet">' + ic("sparkle") + '</span><span class="b"><span class="t">Auto subtitles</span><div class="s">English now; 6 more languages after review.</div></span><button class="switch sm" role="switch" aria-checked="' + d.subs + '" data-act="draft:subs"></button></div>' +
          '<div class="row"><span class="ic">' + ic("music") + '</span><span class="b"><span class="t">Music check</span><div class="s">We scan audio against licensed tracks before it goes live.</div></span><span class="r"><span class="pill green">On</span></span></div></div>' +
          '<button class="check' + (d.rights ? " on" : "") + '" data-act="draft:rights"><span class="bx">' + ic("check", 14, 3) + "</span><span><b>I own this video or have permission for everything in it.</b> No clips from Spool series beyond 30 seconds, no other people's films. Breaking this removes the video and pauses payouts.</span></button>" +
          (d.type === "pilot" ? '<div class="note acc" style="margin:12px 16px 0">' + ic("clapper", 18) + "<span><b>Pilots get a human review</b> (rights, quality, age rating) within 24 hours, then open for votes for 30 days.</span></div>" : "") +
          '<div class="pad mt16"><button class="btn pri block" data-act="postUpload"' + (d.rights ? "" : " disabled") + ">" + (d.type === "pilot" ? "Submit pilot" : "Post") + "</button></div></div>";
      }
      if (step === "processing") {
        const u = st.uploads[0];
        return hdr("Uploading", "Step 3 of 3", { solid: true }) +
          '<div class="scroll bot-safe-sm"><div class="pad mt12"><div class="hstack" style="gap:12px"><div class="poster tall bare" style="width:64px"><img src="' + Art.thumb(Object.assign({ id: "clip" + u.clip }, CLIPS.find(c => c.id === u.clip))) + '" alt=""></div><div class="sp"><b>' + esc(u.title) + '</b><div class="tiny mt8">' + esc(u.type === "pilot" ? "Pilot · " : "") + esc(u.vis) + " · " + esc(u.age) + "</div></div></div></div>" +
          '<ul class="pipe mt20" id="pipe">' + [["Upload", "Sent in chunks — safe to leave the app"], ["Processing", "Vertical HLS: 240p → 1080p, thumbnails, subtitles"], ["Safety check", "Nudity, violence, music and copyright match"], [u.type === "pilot" ? "Human review" : "Publishing", u.type === "pilot" ? "Rights, quality and age rating · within 24 h" : "Goes live for your followers first"], ["Live", u.type === "pilot" ? "Open for votes for 30 days" : "We'll tell you when it hits 1K views"]]
            .map((s, i) => '<li class="' + (i === 0 ? "now" : "") + '" data-i="' + i + '"><span class="d">' + ic(i === 0 ? "refresh" : "dot", 15) + '</span><span class="b"><div class="t">' + s[0] + '</div><div class="s">' + s[1] + "</div>" + (i < 2 ? '<div class="pb"><i style="width:0"></i></div>' : "") + "</span></li>").join("") + "</ul>" +
          '<div class="pad"><button class="btn block" data-go="studio">Go to Creator Studio</button></div></div>';
      }
      const tp = d.type;
      return hdr("Create", "Step 1 of 3 · pick what you're posting", { solid: true }) +
        '<div class="scroll bot-safe-sm"><div class="typepick mt12">' + [["video", "video", "Video", "A one-off for your profile and Scenes."], ["episode", "layers", "Episode", "Part of your own series, played in order."], ["pilot", "clapper", "Pilot", "Enter Pilot Season. Win a full order."]]
          .map(([k, i, n, s]) => '<button class="' + (tp === k ? "on" : "") + '" data-act="draft:type:' + k + '">' + ic(i, 22) + "<b>" + n + "</b><span>" + s + "</span></button>").join("") + "</div>" +
        '<div class="sec"><h2>Recent</h2><span class="sub">Camera roll</span><button class="link" data-act="toast:Opening camera…">' + ic("camera", 15) + " Record</button></div>" +
        '<div class="gal">' + CLIPS.map((c, i) => '<button class="' + (d.clip === c.id ? "on" : "") + '" data-act="draft:clip:' + c.id + '"><img src="' + Art.thumb(Object.assign({ id: "clip" + c.id }, c)) + '" alt=""><span class="d">' + FMT.dur(c.dur) + '</span><span class="sel">' + (d.clip === c.id ? "1" : "") + "</span></button>").join("") + "</div>" +
        '<div class="pad mt16"><button class="btn pri block" data-go="create/details">Next</button></div></div>';
    },
    mount(view, step) {
      if (step === "details") {
        const t = $("#ctitle", view), dd = $("#cdesc", view);
        t.addEventListener("input", () => { st.draft.title = t.value; });
        dd.addEventListener("input", () => { st.draft.desc = dd.value; });
      }
      if (step === "processing") {
        const u = st.uploads[0];
        let i = 0, p = 0;
        const steps = $$("#pipe li", view);
        const iv = setInterval(() => {
          if (!view.isConnected) return clearInterval(iv);
          p += .2;
          const bar = steps[i] && $(".pb i", steps[i]);
          if (bar) bar.style.width = Math.min(100, p * 100) + "%";
          if (p >= 1 || !bar) {
            steps[i].className = "done"; $(".d", steps[i]).innerHTML = ic("check", 15, 2.6);
            const msgs = ["PUT /v1/uploads/" + u.id + " · <b>chunks 12/12</b>", "transcode job · <b>6 renditions</b> · HLS 2 s segments", "safety · nudity 0.01 · violence 0.04 · music match none · copyright match none", u.type === "pilot" ? "moderation queue · <b>pilot review</b> · SLA 24 h" : "publish · followers first", "live"];
            A.log(i === 2 ? "api" : "api", msgs[i], "upload " + u.id);
            i++; p = 0;
            if (i >= (u.type === "pilot" ? 3 : 4)) {
              if (steps[i]) { steps[i].className = "now"; $(".d", steps[i]).innerHTML = ic(u.type === "pilot" ? "hourglass" : "refresh", 15); }
              u.status = u.type === "pilot" ? "review" : "live";
              const cc = A.current(); if (cc && cc.name === "studio") A.refresh();
              A.toast(u.type === "pilot" ? "Pilot submitted · review within 24 h" : "Posted · it's live", "checkc");
              clearInterval(iv);
              if (u.type !== "pilot") setTimeout(() => { if (steps[4]) { steps[3].className = "done"; steps[4].className = "done"; $(".d", steps[3]).innerHTML = ic("check", 15, 2.6); $(".d", steps[4]).innerHTML = ic("check", 15, 2.6); } }, 900);
              return;
            }
            if (steps[i]) { steps[i].className = "now"; $(".d", steps[i]).innerHTML = ic("refresh", 15); }
          }
        }, 260);
      }
    }
  });

  A.screen("studio", {
    title: () => "Creator Studio",
    render() {
      const mine = st.uploads.concat([
        { title: "Ethan sent the text — the proof", type: "video", status: "live", views: 48200, fan: 1210, clip: "c1", link: "heiress" },
        { title: "Storytime: my sister's fake wedding", type: "video", status: "live", views: 12900, fan: 0, clip: "c2" },
        { title: "Trailer reaction — Glass Crown", type: "video", status: "needs-changes", note: "Clip from Glass Crown runs 41 s (limit 30 s)", views: 0, fan: 0, clip: "c6" }
      ]);
      const pill = s => s === "live" ? '<span class="pill green"><span class="dot"></span>Live</span>' : s === "review" ? '<span class="pill amber">In review</span>' : s === "processing" ? '<span class="pill blue">Processing</span>' : '<span class="pill red">Needs changes</span>';
      return hdr("Creator Studio", esc(st.handle) + " · 2.4K followers", { solid: true, right: '<button class="ib" data-go="create">' + ic("plus", 22, 2.2) + "</button>" }) +
        '<div class="scroll bot-safe-sm"><div class="earn mt12"><div class="l">Earnings · October</div><div class="v">' + FMT.usd(42.3) + '</div><div class="m">From Fan Links (' + FMT.int(1210) + " unlocks driven) and tips. Payout at $50.</div>" +
        '<div class="vbar mt12" style="background:rgba(255,255,255,.1)"><i style="width:85%"></i></div><div class="vtxt"><span>$42.30 of $50.00</span><span>Paid monthly · 1st</span></div>' +
        '<div class="row2"><button class="btn sm" data-act="toast:Earnings report sent to your email">Report</button><button class="btn sm pri" disabled>Request payout</button></div></div>' +
        '<div class="stats mt12"><div class="stat"><div class="l">Views · 28 days</div><div class="v">61.1K</div><div class="d">▲ 38%</div></div><div class="stat"><div class="l">Watch time</div><div class="v">412 h</div><div class="d">▲ 21%</div></div>' +
        '<div class="stat"><div class="l">Fan Link unlocks</div><div class="v">1,210</div><div class="d">→ The Heiress Returns</div></div><div class="stat"><div class="l">New followers</div><div class="v">+386</div><div class="d">▲ 12%</div></div></div>' +
        '<div class="card mt12"><div class="hstack"><span class="row" style="padding:0;min-height:0;border:0;width:auto"><span class="ic acc">' + ic("clapper") + '</span></span><div class="sp"><b>Pilot Season</b><div class="tiny">Got a story? 2–3 episodes, 10K votes, a funded season.</div></div><button class="btn sm pri" data-act="startPilot">Start</button></div></div>' +
        '<div class="sec"><h2>Your uploads</h2></div><div class="pad">' + mine.map(u => '<div class="uprow"><div class="poster tall bare"><img src="' + Art.thumb(Object.assign({ id: "clip" + u.clip }, CLIPS.find(c => c.id === u.clip) || CLIPS[0])) + '" alt=""></div><div class="b"><div class="t">' + esc(u.title) + '</div><div class="s">' + pill(u.status) +
          (u.status === "live" ? "<span>" + FMT.n(u.views || 0) + " views</span>" + (u.fan ? '<span class="accent-text">' + FMT.int(u.fan) + " Fan Link unlocks</span>" : "") : "") + "</div>" + (u.note ? '<div class="tiny mt8" style="color:var(--red-ink)">' + esc(u.note) + "</div>" : "") + "</div>" +
          (u.status === "needs-changes" ? '<button class="btn xs" data-act="toast:Trim tool opened">Fix</button>' : "") + "</div>").join("") + "</div></div>";
    }
  });

  /* =====================================================================
     LIBRARY, INBOX
     ===================================================================== */
  A.screen("library", {
    tab: "library",
    title: () => "Library",
    render() {
      const k = st.libTab || "watching";
      let body = "";
      if (k === "watching") {
        const ids = Object.keys(st.progress).filter(id => T[id] && st.progress[id].ep);
        body = ids.length ? ids.map(id => {
          const t = T[id], p = st.progress[id], a = A.access(t, p.ep);
          return '<button class="lrow" data-go="' + (t.orient === "landscape" ? "landscape/" : "player/") + id + "/" + p.ep + '">' + poster(t, { title: false, tags: false }) +
            '<span class="b"><div class="t">' + esc(t.name) + '</div><div class="s">E' + p.ep + " of " + t.eps + " · " + esc(p.lastSeen) + '</div><div class="bar"><i style="width:' + Math.round(p.ep / t.eps * 100) + '%"></i></div></span>' +
            '<span class="r">' + (a === "locked" ? '<span class="pill gold">' + ic("lock") + A.priceOf(t) + "</span>" : a === "soon" ? '<span class="pill">Next drop</span>' : '<span class="pill accent">' + ic("play") + "Resume</span>") + "</span></button>";
        }).join("") : '<div class="empty"><b>Nothing in progress</b>Start something from Home — it shows up here.</div>';
      } else if (k === "list") {
        const ids = Array.from(st.myList);
        body = ids.length ? '<div class="pgrid mt8">' + ids.map(id => pc(T[id], { compact: true })).join("") + "</div>" : '<div class="empty"><b>Your list is empty</b>Tap the bookmark on any series to save it.</div>';
      } else if (k === "following") {
        body = Array.from(st.following).map(id => {
          const t = T[id];
          return '<div class="lrow">' + poster(t, { title: false, tags: false }) + '<span class="b"><div class="t">' + esc(t.name) + '</div><div class="s">' + esc(t.schedule || "Complete") + '</div><div class="s" style="color:var(--accent-text)">' + esc(t.nextDrop ? "Next: " + t.nextDrop : "") + "</div></span>" +
            '<span class="r"><button class="btn xs" data-act="follow:' + id + '">' + ic("bell", 13) + "On</button></span></div>";
        }).join("") || '<div class="empty"><b>No drop alerts</b>Follow an ongoing series to get one alert per drop.</div>';
      } else if (k === "unlocked") {
        const rows = Object.keys(st.unlocked).map(id => [T[id], st.unlocked[id]]).concat(Array.from(st.passes).map(id => [T[id], "pass"]));
        body = '<div class="note acc" style="margin:12px 16px">' + ic("shieldc", 18) + "<span><b>Unlocks belong to your account,</b> not this phone. They restore on any device and on spool.tv.</span></div>" +
          rows.map(([t, n]) => '<button class="lrow" data-go="series/' + t.id + '">' + poster(t, { title: false, tags: false }) + '<span class="b"><div class="t">' + esc(t.name) + '</div><div class="s">' + (n === "pass" ? "Series Pass · all " + t.eps + " episodes" : "E1–E" + n + " unlocked") + "</div></span></button>").join("");
      } else {
        body = st.vip ? '<div class="lrow">' + poster(T.contract, { title: false, tags: false }) + '<span class="b"><div class="t">Married to the Wrong Billionaire</div><div class="s">E13–E20 · 412 MB · expires in 30 days</div></span></div>' :
          '<div class="empty"><b>Downloads are a VIP feature</b>Save up to 100 episodes for flights and commutes.<div class="mt16"><button class="btn vip sm" data-go="vip">' + ic("crown", 16) + "See VIP</button></div></div>";
      }
      return hdr("Library", "", { noBack: true, big: true, right: '<button class="ib" data-go="search">' + ic("search", 22) + "</button>" }) +
        '<div class="ttabs">' + [["watching", "Watching"], ["list", "My List"], ["following", "Drops"], ["unlocked", "Unlocked"], ["downloads", "Downloads"]].map(([kk, n]) => '<button class="' + (kk === k ? "on" : "") + '" data-act="libTab:' + kk + '">' + n + "</button>").join("") + "</div>" +
        '<div class="scroll bot-safe" style="padding-top:6px">' + body + "</div>";
    }
  });

  A.screen("inbox", {
    title: () => "Notifications",
    render() {
      return hdr("Notifications", st.inbox.filter(n => n.unread).length + " new", { solid: true, right: '<button class="link" data-act="readAll">Mark read</button>' }) +
        '<div class="scroll bot-safe-sm"><div class="list mt12">' + (st.inbox.length ? st.inbox.map(n => '<button class="row" data-act="openNote:' + n.id + '"><span class="ic' + (n.unread ? " acc" : "") + '">' + ic(n.icon || "bell") + '</span><span class="b"><span class="t">' + esc(n.t) + '</span><div class="s">' + esc(n.s) + '</div></span><span class="r" style="flex-direction:column;align-items:flex-end">' + esc(n.ago) + (n.unread ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--accent)"></i>' : "") + "</span></button>").join("") : '<div class="empty"><b>All quiet</b>Drop alerts and replies show up here.</div>') + "</div>" +
        '<div class="note" style="margin:16px">' + ic("sliders", 18) + '<span>You get at most 3 alerts a day. <button class="link" data-go="settings">Notification settings</button></span></div></div>';
    }
  });

  /* =====================================================================
     ME, WALLET, STORE, VIP, REWARDS, SETTINGS
     ===================================================================== */
  A.screen("me", {
    tab: "me",
    title: () => "Profile",
    render() {
      const w = st.wallet;
      return '<div class="scroll bot-safe top-safe"><div class="hstack" style="padding:8px 12px 0;justify-content:flex-end"><button class="ib" data-go="inbox">' + ic("bell", 22) + (st.inbox.some(n => n.unread) ? '<i class="dot"></i>' : "") + '</button><button class="ib" data-go="settings">' + ic("settings", 22) + "</button></div>" +
        '<div class="mehead">' + avaSeed("me-" + st.persona, 64, { kind: "woman", hair: "long", pal: ["#24060f", "#8a1f3e", "#ffc06a"] }) + "<div><h2>" + esc(st.name) + '</h2><div class="s">' + (st.signedIn ? esc(st.handle) + " · " + S.REGIONS[st.region].name : "Guest · progress saved on this phone") + "</div></div></div>" +
        (!st.signedIn ? '<div class="note acc" style="margin:14px 16px 0">' + ic("shieldc", 18) + '<span><b>Sign in to keep your coins safe.</b> <button class="link" data-go="signin">Sign in</button></span></div>' : "") +
        '<div class="walletcard"><div class="l">Wallet</div><div class="tot"><b>' + FMT.int(w.paid + w.bonus) + "</b><span>coins</span></div>" +
        '<div class="split"><div><div class="k">Paid</div><div class="v">' + coin(w.paid) + '</div><div class="x">Never expire</div></div><div><div class="k">Bonus</div><div class="v">' + coin(w.bonus, "bonus") + '</div><div class="x">' + (w.bonus ? "Spent first · exp " + w.bonusExpires : "None right now") + "</div></div></div>" +
        '<div class="acts"><button class="btn gold sm" data-go="store">' + ic("plus", 16, 2.4) + 'Top up</button><button class="btn sm" data-go="wallet">' + ic("receipt", 16) + "History</button></div></div>" +
        (st.vip ? '<button class="vipcard" data-go="vip"><span class="ic">' + ic("crown", 22) + '</span><span class="b"><div class="t">VIP Weekly · active</div><div class="s">Renews 16 Oct for $5.99 · reminder on 15 Oct</div></span>' + ic("fwd", 18) + "</button>" :
          '<button class="vipcard" data-go="vip"><span class="ic">' + ic("crown", 22) + '</span><span class="b"><div class="t">Go VIP — no ads, ever</div><div class="s">Every series unlocked · from $' + S.REGIONS[st.region].vip[0] + "/week · cancel in 2 taps</div></span>" + ic("fwd", 18) + "</button>") +
        '<div class="list mt16">' +
        [["rewards", "gift", "acc", "Rewards", "Check in: day " + (st.streak + (st.checkedInToday ? 0 : 1)) + " of 7 · ads " + st.adsToday + "/" + S.REGIONS[st.region].adsPerDay],
          ["studio", "video", "violet", "Creator Studio", "Earnings $42.30 · 2 videos live"],
          ["library", "library", "", "Library", "Watching, My List, downloads"],
          ["wallet", "shieldc", "green", "Spend guard", st.spendCap + " coins a day · " + st.spentToday + " used today"],
          ["settings", "settings", "", "Settings", "Language, playback, privacy"]]
          .map(([go, i, cls, t, s]) => '<button class="row" ' + (go === "library" ? 'data-tab="library"' : 'data-go="' + go + '"') + '><span class="ic ' + cls + '">' + ic(i) + '</span><span class="b"><span class="t">' + t + '</span><div class="s">' + s + '</div></span><span class="r">' + ic("fwd", 18) + "</span></button>").join("") + "</div>" +
        '<div class="list mt12"><button class="row" data-act="restore"><span class="ic">' + ic("refresh") + '</span><span class="b"><span class="t">Restore purchases</span><div class="s">Re-checks the store and your ledger</div></span></button>' +
        '<button class="row" data-act="toast:Opening help centre"><span class="ic">' + ic("help") + '</span><span class="b"><span class="t">Help & refunds</span><div class="s">Human reply within 24 h</div></span></button></div>' +
        '<div class="tiny center-t mt20">Spool ' + esc(S.BRAND.version) + " · " + esc(st.persona === "new" ? "guest" : st.handle) + "</div></div>";
    }
  });

  const LICON = { unlock: ["unlock", "out"], topup: ["coins", "top"], checkin: ["calendar", "in"], ad: ["ad", "in"], call: ["poll", "in"], expire: ["hourglass", "exp"], welcome: ["gift", "in"], pass: ["pass", "out"], refund: ["refresh", "in"], gift: ["gift", "out"], tip: ["gift", "out"] };
  A.screen("wallet", {
    title: () => "Wallet",
    render() {
      const w = st.wallet;
      const f = st.ledgerFilter || "all";
      const rows = st.ledger.filter(r => f === "all" || (f === "in" ? (r.paid + r.bonus) > 0 : (r.paid + r.bonus) < 0));
      let lastDay = "";
      return hdr("Wallet", "Every coin, in and out", { solid: true }) +
        '<div class="scroll bot-safe-sm"><div class="walletcard" style="margin-top:12px"><div class="l">Balance</div><div class="tot"><b>' + FMT.int(w.paid + w.bonus) + "</b><span>coins · ≈ " + money(w.paid) + " paid value</span></div>" +
        '<div class="split"><div><div class="k">Paid coins</div><div class="v">' + coin(w.paid) + '</div><div class="x">Never expire</div></div><div><div class="k">Bonus coins</div><div class="v">' + coin(w.bonus, "bonus") + '</div><div class="x">' + (w.bonus ? "Spent first · " + w.bonus + " expire " + w.bonusExpires : "—") + "</div></div></div>" +
        '<div class="acts"><button class="btn gold sm" data-go="store">' + ic("plus", 16, 2.4) + 'Top up</button><button class="btn sm" data-act="restore">' + ic("refresh", 16) + "Restore</button></div></div>" +
        '<div class="guard"><div class="h">' + ic("shieldc", 18) + 'Spend guard<button class="link" data-sheet="guard">Edit</button></div><div class="bar"><i style="width:' + Math.min(100, st.spentToday / st.spendCap * 100) + '%"></i></div>' +
        '<div class="s"><span>' + st.spentToday + " of " + st.spendCap + " coins today</span><span>Auto-unlock " + (st.autoUnlock ? "on" : "off") + "</span></div></div>" +
        '<div class="chips mt16">' + [["all", "All"], ["in", "Coins in"], ["out", "Coins out"]].map(([k, n]) => '<button class="chip sm' + (f === k ? " on" : "") + '" data-act="ledgerF:' + k + '">' + n + "</button>").join("") + "</div>" +
        rows.map(r => {
          const day = r.day !== lastDay ? '<div class="lday">' + esc(r.day) + "</div>" : "";
          lastDay = r.day;
          const li = LICON[r.type] || ["coin", "in"];
          const total = r.paid + r.bonus;
          return day + '<button class="lrowx" data-sheet="ledger:' + r.id + '"><span class="ic ' + li[1] + '">' + ic(li[0], 18) + '</span><span class="b"><div class="t">' + esc(r.label) + '</div><div class="s">' + esc(r.time) + " · " + esc(r.sub || "") + "</div></span>" +
            '<span class="amt"><span class="' + (total > 0 ? "pos" : "neg") + '">' + (total > 0 ? "+" : "−") + FMT.int(Math.abs(total)) + "</span><small>" + FMT.int(r.after[0]) + " · " + FMT.int(r.after[1]) + " after</small></span></button>";
        }).join("") +
        '<div class="tiny center-t mt16" style="padding:0 30px">This history is append-only: nothing is edited or deleted. Refunds and corrections appear as new rows with a reason.</div></div>';
    }
  });

  A.screen("store", {
    title: () => "Top up",
    render() {
      const sel = st.pack || "p1000";
      const firstUsed = st.ledger.some(r => r.type === "topup" && /First/.test(r.label));
      const packs = S.PACKS.filter(p => !p.first || !firstUsed);
      const ps = S.PACKS.find(p => p.id === sel) || S.PACKS[2];
      const r = S.REGIONS[st.region];
      const cur = st.region === "US" ? "$" : r.cur;
      const price = v => st.region === "US" ? "$" + v.toFixed(2) : st.region === "IN" ? "₹" + Math.round(v * 29.3) : cur + (v * (r.coinValue / .0099)).toFixed(2);
      return hdr("Top up", "Coins work on app and web", { solid: true, right: '<button class="link" data-act="restore">Restore</button>' }) +
        '<div class="scroll bot-safe-sm"><div class="pad mt12"><div class="packs">' + packs.map(p => {
          const per = Math.round((p.coins + p.bonus) / A.priceOf(T.heiress));
          if (p.first) return '<button class="pack first' + (sel === p.id ? " on" : "") + '" data-act="pack:' + p.id + '"><span class="rib gold">Once</span><span class="ic" style="width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:var(--gold-soft);color:var(--gold)">' + ic("gift", 24) + '</span><span class="b"><div class="cn">' + ic("coin") + FMT.int(p.coins) + '</div><div class="bn">+' + FMT.int(p.bonus) + ' bonus · first top-up</div><div class="pe">≈ ' + per + " episodes</div></span><span class=\"pr\">" + price(p.price) + "</span></button>";
          return '<button class="pack' + (sel === p.id ? " on" : "") + '" data-act="pack:' + p.id + '">' + (p.popular ? '<span class="rib">Popular</span>' : p.best ? '<span class="rib gold">Best value</span>' : "") +
            '<div class="cn">' + ic("coin") + FMT.int(p.coins) + '</div><div class="bn">' + (p.bonus ? "+" + FMT.int(p.bonus) + " bonus" : "&nbsp;") + '</div><div class="pr">' + price(p.price) + '</div><div class="pe">≈ ' + per + " episodes</div></button>";
        }).join("") + "</div>" +
        '<div class="note mt16">' + ic("info", 18) + "<span><b>Paid coins never expire.</b> Bonus coins last 7 days and are spent first. Your balance is shared with spool.tv.</span></div>" +
        '<div class="list mt12" style="margin:12px 0 0"><div class="row"><span class="ic">' + ic(st.region === "IN" ? "zap" : "android") + '</span><span class="b"><span class="t">' + (st.region === "IN" ? "UPI · Google Pay" : "Google Play") + '</span><div class="s">' + (st.region === "IN" ? "Or cards, netbanking on spool.tv" : "Server-verified receipt · refunds go back to the store") + '</div></span><span class="r">' + ic("checkc", 20) + "</span></div></div>" +
        '<button class="btn pri block mt16" data-act="buyPack:' + ps.id + '">Buy ' + FMT.int(ps.coins + ps.bonus) + " coins · " + price(ps.price) + "</button>" +
        '<div class="tiny center-t mt12">Price includes tax. You\'ll confirm with Google Play next.</div></div></div>';
    }
  });

  A.screen("vip", {
    title: () => "VIP",
    render() {
      const sel = st.plan || "week";
      const r = S.REGIONS[st.region];
      const cur = st.region === "US" ? "$" : r.cur;
      const plans = S.VIP_PLANS.map((p, i) => Object.assign({}, p, { price: r.vip[i] }));
      const pp = plans.find(p => p.id === sel);
      if (st.vip) {
        return hdr("VIP", "", { solid: true }) + '<div class="scroll bot-safe-sm"><div class="viphero mt12"><div class="crown">' + ic("crown", 28) + "</div><h2>You're VIP.</h2><p>Weekly plan · renews <b>16 Oct</b> for " + cur + r.vip[0] + ". We'll remind you on 15 Oct.</p></div>" +
          '<ul class="perks">' + S.VIP_PERKS.map(p => '<li><span class="ic">' + ic(p.icon) + "</span><span><b>" + esc(p.t) + "</b><span>" + esc(p.s) + "</span></span></li>").join("") + "</ul>" +
          '<div class="terms">' + ['Renewal reminder 24 h before every charge — this one can\'t be turned off.', "Cancel takes two taps here. You keep VIP until 16 Oct.", "Coins you bought stay yours if VIP ends."].map(s => "<div>" + ic("checkc", 16) + "<span>" + s + "</span></div>").join("") + "</div>" +
          '<div class="pad mt16"><button class="btn danger block" data-sheet="cancelVip">Cancel VIP</button><button class="btn ghost block mt8" data-act="toast:Opening Google Play subscriptions">Manage in Google Play</button></div></div>';
      }
      return hdr("VIP", "", { solid: true }) + '<div class="scroll bot-safe-sm"><div class="viphero mt12"><div class="crown">' + ic("crown", 28) + "</div><h2>Everything. No ads. Ever.</h2>" +
        "<p>One plan, no surprise paywalls. If something isn't included, it's labelled before you start it.</p></div>" +
        '<ul class="perks">' + S.VIP_PERKS.map(p => '<li><span class="ic">' + ic(p.icon) + "</span><span><b>" + esc(p.t) + "</b><span>" + esc(p.s) + "</span></span></li>").join("") + "</ul>" +
        '<div class="plans">' + plans.map(p => '<button class="plan' + (p.id === sel ? " on" : "") + '" data-act="plan:' + p.id + '">' + (p.best ? '<span class="rib">Best value</span>' : "") + '<span class="radio"></span><span class="b"><div class="t">' + p.name + '</div><div class="s">' + esc(p.note) + '</div></span><span class="p">' + cur + p.price + "<small>per " + p.per + "</small></span></button>").join("") + "</div>" +
        '<div class="terms">' + ["Renews " + (sel === "week" ? "every 7 days" : sel === "month" ? "monthly" : "yearly") + " until you cancel. First renewal: <b>" + (sel === "week" ? "16 Oct" : sel === "month" ? "9 Nov" : "9 Oct 2027") + "</b>.", "We remind you 24 hours before every charge.", "Cancel in two taps, right here — not by email."].map(s => "<div>" + ic("checkc", 16) + "<span>" + s + "</span></div>").join("") + "</div>" +
        '<div class="pad mt16"><button class="btn vip block" data-act="buyVip:' + sel + '">' + ic("crown", 18) + "Start " + pp.name + " · " + cur + pp.price + "</button>" +
        '<div class="tiny center-t mt8">No free trial that turns into a charge. You pay today, and you know the next date.</div></div></div>';
    }
  });

  A.screen("rewards", {
    title: () => "Rewards",
    render() {
      const r = S.REWARDS, rg = S.REGIONS[st.region];
      const day = st.streak + (st.checkedInToday ? 0 : 1);
      const adsLeft = Math.max(0, Math.min(r.adCap, rg.adsPerDay) - st.adsToday);
      return hdr("Rewards", "Bonus coins · spent first · last 7 days", { solid: true }) +
        '<div class="scroll bot-safe-sm"><div class="streak mt12"><div class="h"><span class="fl">' + ic("flame", 24) + "</span><span><b>" + (st.checkedInToday ? st.streak + "-day streak" : "Day " + day + " is ready") + "</b><span>" + (st.checkedInToday ? "Come back tomorrow for +" + r.ladder[Math.min(6, st.streak)] : "Check in for +" + r.ladder[day - 1] + " bonus coins") + "</span></span></div>" +
        '<div class="ladder">' + r.ladder.map((c, i) => {
          const done = i < st.streak, today = !st.checkedInToday && i === st.streak;
          return '<div class="' + (done ? "done" : today ? "today" : i === 6 ? "big" : "") + '"><div class="c">' + ic(done ? "checkc" : i === 6 ? "gift" : "coin") + '</div><div class="v">+' + c + '</div><div class="d">Day ' + (i + 1) + "</div></div>";
        }).join("") + "</div>" +
        (st.checkedInToday ? '<button class="btn block mt12" disabled>Checked in today</button>' : '<button class="btn pri block mt12" data-act="checkin">Check in · +' + r.ladder[day - 1] + " coins</button>") + "</div>" +
        '<div class="card mt12"><div class="hstack"><span class="row" style="padding:0;min-height:0;border:0;width:auto"><span class="ic gold">' + ic("ad") + '</span></span><div class="sp"><b>Watch an ad · +' + r.adCoins + ' coins</b><div class="tiny">' + adsLeft + " of " + Math.min(r.adCap, rg.adsPerDay) + " left today · " + r.adLen + " · never a playable ad</div></div>" +
        '<button class="btn sm pri" data-act="adCoins"' + (adsLeft ? "" : " disabled") + ">Watch</button></div></div>" +
        '<div class="sec"><h2>Tasks</h2><span class="sub">Simple, one-time or daily</span></div><div class="card">' + st.tasks.map(t =>
          '<div class="task"><span class="ic">' + ic(t.icon, 18) + '</span><span class="b"><div class="t">' + esc(t.t) + '</div><div class="s">+' + t.coins + " bonus" + (t.note ? " · " + esc(t.note) : "") + "</div>" + (t.progress ? '<div class="mini"><i style="width:' + Math.min(100, t.progress[0] / t.progress[1] * 100) + '%"></i></div>' : "") + "</span>" +
          (t.done ? '<span class="pill green">' + ic("check") + "Done</span>" : t.progress && t.progress[0] >= t.progress[1] ? '<button class="btn xs pri" data-act="claim:' + t.id + '">Claim</button>' : '<button class="btn xs" data-act="task:' + t.id + '">Go</button>') + "</div>").join("") + "</div>" +
        '<div class="tiny pad mt16" style="line-height:1.5">Bonus coins expire 7 days after you earn them and are always spent before paid coins. Ad rewards are verified server-side — if an ad fails to finish, we still give you the reward.</div></div>';
    }
  });

  A.screen("settings", {
    title: () => "Settings",
    render() {
      const tg = (k, on) => '<button class="switch sm" role="switch" aria-checked="' + !!on + '" data-act="toggle:' + k + '"></button>';
      const row = (i, t, s, r, cls) => '<div class="row"><span class="ic ' + (cls || "") + '">' + ic(i) + '</span><span class="b"><span class="t">' + t + "</span>" + (s ? '<div class="s">' + s + "</div>" : "") + '</span><span class="r">' + r + "</span></div>";
      return hdr("Settings", "", { solid: true }) + '<div class="scroll bot-safe-sm">' +
        '<div class="grp-t">Playback</div><div class="list">' +
        row("next", "Autoplay next episode", "Only plays episodes you can already watch", tg("autoplay", st.autoplay)) +
        row("zap", "Auto-unlock", "Off by default. When on, it never passes your daily cap.", tg("autoUnlock", st.autoUnlock), "acc") +
        row("bolt", "Data saver", "Start at 240p on mobile data", tg("dataSaver", st.dataSaver)) +
        row("hd", "Quality", "", esc(st.settings.quality) + ic("fwd", 16)) + "</div>" +
        '<div class="grp-t">Language</div><div class="list">' +
        row("globe", "App language", "", "English" + ic("fwd", 16)) + row("headphones", "Audio", "AI-voiced dubs are labelled", esc(st.settings.audio) + ic("fwd", 16)) + row("cc", "Subtitles", "", esc(st.settings.subs) + ic("fwd", 16)) + "</div>" +
        '<div class="grp-t">Money & safety</div><div class="list">' +
        '<button class="row" data-sheet="guard"><span class="ic green">' + ic("shieldc") + '</span><span class="b"><span class="t">Spend guard</span><div class="s">' + st.spendCap + ' coins a day</div></span><span class="r">' + ic("fwd", 16) + "</span></button>" +
        row("key", "Purchase PIN", "Ask for a PIN before any purchase", tg("pin", st.pin)) +
        row("shield", "Teen mode", "Hides 16+ and 18+ titles; turns off purchases", tg("teen", st.teen)) +
        '<button class="row" data-act="restore"><span class="ic">' + ic("refresh") + '</span><span class="b"><span class="t">Restore purchases</span></span></button></div>' +
        '<div class="grp-t">Notifications</div><div class="list">' +
        row("calendar", "Drop alerts", "Series you follow · max 3 a day", tg("n1", true)) + row("comment", "Replies", "", tg("n2", true)) + row("percent", "Offers", "Win-back offers, at most weekly", tg("n3", false)) +
        row("crown", "VIP renewal reminders", "Always on — required", '<span class="pill green">On</span>') + "</div>" +
        '<div class="grp-t">Account</div><div class="list">' +
        row("globe", "Region", "Prices and payment methods follow your region", esc(S.REGIONS[st.region].name)) +
        '<button class="row" data-act="toast:Your data export will be emailed within 48 h"><span class="ic">' + ic("download") + '</span><span class="b"><span class="t">Download my data</span></span></button>' +
        '<button class="row" data-act="toast:Deletion requested · unused paid coins are refundable for 30 days"><span class="ic" style="color:var(--red-ink)">' + ic("trash") + '</span><span class="b"><span class="t" style="color:var(--red-ink)">Delete account</span><div class="s">In-app, no email needed</div></span></button></div>' +
        '<div class="tiny center-t mt20">Terms · Privacy · Content licences</div></div>';
    }
  });
})();
