/* ==========================================================================
   Spool Studio — pages, part 2
   Creators & payouts · Moderation · Users · Campaigns · Monetization ·
   Paywall Lab · Transactions · Analytics · Settings · Team · Audit · Login
   ========================================================================== */
(function () {
  "use strict";
  const A = window.Admin;
  const { S, FMT, T, C, V, $, $$, esc, ic, UI, Charts, Modal, Drawer, toast, ACT, st, heatmap } = A;
  const SUM = a => a.reduce((x, y) => x + y, 0);

  /* =====================================================================
     CREATORS & PAYOUTS
     ===================================================================== */
  A.page("creators", {
    title: () => "Creators & payouts",
    crumbs: () => [["Community"], ["Creators & payouts"]],
    render(r) {
      const tab = r.q.tab || "creators";
      const pays = st.pays || (st.pays = S.PAYOUTS.map(p => Object.assign({}, p)));
      let body = "";
      if (tab === "creators") {
        body = '<section class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Creator</th><th class="r">Followers</th><th class="r">Videos</th><th>Program</th><th class="r">Share</th><th class="r">Fan Link unlocks · 30d</th><th class="r">Earnings · 30d</th><th class="w0"></th></tr></thead><tbody>' +
          S.CREATORS.slice().sort((a, b) => b.earnings30 - a.earnings30).map(c => '<tr' + (r.q.c === c.id ? ' class="sel"' : "") + '><td><div class="who">' + UI.avaC(c, 34) + "<div><b>" + esc(c.name) + (c.verified ? " " + ic("checkc", 13) : "") + "</b><small>" + esc(c.handle) + " · " + esc(c.city) + "</small></div></div></td>" +
            '<td class="r">' + FMT.n(c.followers) + '</td><td class="r">' + c.videos + "</td><td>" + (c.partner ? '<span class="pill accent">' + ic("star", 12) + "Partner</span>" : '<span class="pill">Standard</span>') + '</td><td class="r">' + Math.round(c.share * 100) + '%</td><td class="r">' + FMT.int(c.fanLinks) + '</td><td class="r"><b>' + (c.earnings30 ? FMT.usd(c.earnings30, 0) : "—") + '</b></td><td><a class="b sm" href="mobile.html#/creator/' + c.id + '" target="_blank" rel="noopener">Profile ' + ic("external", 12) + "</a></td></tr>").join("") + "</tbody></table></div></section>";
      } else if (tab === "payouts") {
        const pending = pays.filter(p => p.status === "Pending");
        body = '<div class="grid g4" style="margin-bottom:16px">' + UI.stat({ l: "Waiting for approval", v: FMT.usd(SUM(pending.map(p => p.amount)), 0), d: pending.length + " requests" }) + UI.stat({ l: "Paid this month", v: "$48.2K", d: "62 creators" }) + UI.stat({ l: "On hold", v: String(pays.filter(p => p.status === "On hold").length), d: "identity checks" }) + UI.stat({ l: "Next batch", v: "1 Nov", d: "monthly · $50 minimum" }) + "</div>" +
          '<section class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Creator</th><th>Request</th><th class="r">Amount</th><th>Method</th><th class="r">From Fan Links</th><th>Status</th><th class="w0"></th></tr></thead><tbody>' +
          pays.map(p => { const c = C[p.creator]; return '<tr><td><div class="who">' + UI.avaC(c, 32) + "<div><b>" + esc(c.name) + "</b><small>" + esc(c.handle) + "</small></div></div></td><td>" + esc(p.id) + " · " + esc(p.requested) + '</td><td class="r"><b>' + FMT.usd(p.amount, 2) + "</b></td><td>" + esc(p.method) + '</td><td class="r">' + FMT.int(p.fanLinks) + " unlocks</td><td>" + UI.pill(p.status) + (p.note ? '<div class="xs-t t3" style="margin-top:3px">' + esc(p.note) + "</div>" : "") + "</td><td>" +
            (p.status === "Pending" ? '<div class="row" style="gap:6px"><button class="b sm" data-act="payHold:' + p.id + '">Hold</button><button class="b sm pri" data-act="payOk:' + p.id + '">Approve</button></div>' : p.status === "On hold" ? '<button class="b sm" data-act="payOk:' + p.id + '">Release</button>' : "") + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
      } else if (tab === "fanlinks") {
        const fl = Charts.withTable({ type: "hbars", name: "Unlocks driven", fmt: "int", labelW: 180, items: S.VIDEOS.filter(v => v.link && v.status === "live").map(v => ({ label: v.title.length > 26 ? v.title.slice(0, 25) + "…" : v.title, value: Math.round(v.views * .006), sub: "→ " + T[v.link].name + " · by " + C[v.by].handle })).sort((a, b) => b.value - a.value) });
        body = '<div class="nt acc" style="margin-bottom:16px">' + ic("link", 16) + "<span><b>Fan Links:</b> when a creator tags a drama, viewers get a “Watch E1” chip. If they unlock within 30 days, the creator earns 10% of those coins. Fandom becomes acquisition, and creators are paid for it.</span></div>" +
          '<div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)">' + UI.card("Top Fan Link videos", "Unlocks of the tagged drama within 30 days of a tap", fl.html, { acts: fl.btn }) +
          UI.card("Fan Links by drama", "Last 30 days", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Drama</th><th class="r">Taps</th><th class="r">Unlocks</th><th class="r">Creator share</th></tr></thead><tbody>' +
            [["heiress", 211000, 38400, 2304], ["divorce", 96000, 15200, 760], ["fake", 41000, 5100, 255], ["moonbound", 22000, 2700, 162]].map(([id, tp, un, sh]) => "<tr><td><div class=\"who\">" + UI.poster(T[id]) + "<b>" + esc(T[id].name) + '</b></div></td><td class="r">' + FMT.n(tp) + '</td><td class="r">' + FMT.n(un) + '</td><td class="r">' + FMT.usd(sh, 0) + "</td></tr>").join("") + "</tbody></table></div>", { flush: true }) + "</div>";
      } else {
        body = '<div class="grid g2">' + UI.card("Revenue share", "Defaults — override per creator", '<div class="form"><div class="fld"><label>Creator series (coins spent on their episodes)</label><div class="inp-pre"><span>%</span><input value="50"></div></div><div class="fld"><label>Fan Link commission</label><div class="inp-pre"><span>%</span><input value="10"></div><div class="hint">Of coins spent on the tagged drama, for 30 days after a tap.</div></div><div class="fld"><label>Greenlit series (net revenue)</label><div class="inp-pre"><span>%</span><input value="30"></div></div></div>') +
          UI.card("Payouts", "", '<div class="form"><div class="fld"><label>Minimum payout</label><div class="inp-pre"><span>$</span><input value="50"></div></div><div class="fld"><label>Schedule</label><select class="sel"><option>Monthly · 1st</option><option>Twice a month</option></select></div><div class="fld"><label>Methods</label><div class="chipset">' + ["Bank transfer", "PayPal", "UPI (India)", "Mobile money", "Pix (Brazil)"].map(k => '<button class="tchip on" data-act="tchip">' + k + "</button>").join("") + '</div></div><div class="row"><span class="sp"><b class="sm-t">Identity check before first payout</b><div class="xs-t t3">Required by most payment providers</div></span>' + UI.tog(true, "flip", "Identity check") + "</div></div>") + "</div>";
      }
      return UI.ph("Creators & payouts", S.CREATORS.length + " active creators · " + S.CREATORS.filter(c => c.partner).length + " partners · creators are paid from coins spent on their work, never from ad guesses",
        '<button class="b" data-act="toast:Invite link copied">' + ic("userplus", 15) + "Invite creator</button>") +
        UI.tabs([["creators", "Creators", S.CREATORS.length], ["payouts", "Payout requests", pays.filter(p => p.status === "Pending").length], ["fanlinks", "Fan Links"], ["program", "Program settings"]], tab, "creators") + body;
    }
  });
  ACT.payOk = (el, id) => { const p = st.pays.find(x => x.id === id); const prev = p.status; p.status = "Approved"; toast("Approved " + FMT.usd(p.amount, 2) + " for " + esc(C[p.creator].name) + " · goes out in the 1 Nov batch", () => { p.status = prev; A.rerender(); }); A.rerender(); };
  ACT.payHold = (el, id) => { const p = st.pays.find(x => x.id === id); p.status = "On hold"; p.note = "Held by Riya · needs review"; toast("Payout held"); A.rerender(); };

  /* =====================================================================
     MODERATION
     ===================================================================== */
  A.page("moderation", {
    title: () => "Moderation",
    crumbs: () => [["Community"], ["Moderation"]],
    render(r) {
      const tab = r.q.tab || "queue";
      const q = st.modq || (st.modq = S.MOD_QUEUE.map(m => Object.assign({}, m)));
      const open = q.filter(m => !m.done);
      if (tab === "rules") return head(open) + rules();
      const f = st.modf || "all";
      const list = open.filter(m => f === "all" || m.type === f);
      const sel = list.find(m => m.id === st.modSel) || list[0];
      return head(open) +
        '<div class="row" style="margin-bottom:12px">' + UI.segc([["all", "All · " + open.length], ["video", "Videos"], ["comment", "Comments"], ["review", "Reviews"], ["creator", "Creators"]], f, "modf") + '<span class="sp"></span><span class="xs-t t3 kbhint">Keys: <span class="kbd">J</span> <span class="kbd">K</span> move · <span class="kbd">A</span> approve · <span class="kbd">R</span> remove</span></div>' +
        (sel ? '<div class="mq"><div class="ql">' + list.map(m => '<button class="qi' + (m === sel ? " on" : "") + '" data-act="modSel:' + m.id + '"><span class="ic" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--' + (m.sla === "breach" ? "red" : m.sla === "warn" ? "amber" : "surface-3") + (m.sla === "ok" ? "" : "-soft") + ');color:var(--' + (m.sla === "breach" ? "red" : m.sla === "warn" ? "amber" : "text-2") + (m.sla === "ok" ? "" : "-ink") + ')">' + ic({ video: "video", comment: "comment", review: "star", creator: "user" }[m.type], 15) + '</span><span class="b2"><div class="t">' + esc(m.reason) + '</div><div class="s ellip">' + esc(m.text || m.detail || "") + '</div><div class="s">' + esc(m.age) + " ago" + (m.reports ? " · " + m.reports + " reports" : "") + (m.sla === "breach" ? ' · <b style="color:var(--red-ink)">past SLA</b>' : "") + "</div></span></button>").join("") + "</div>" +
          '<div class="qd">' + detail(sel) + '</div><div class="qa">' + actions(sel) + "</div></div>" : '<div class="card pad" style="text-align:center;padding:60px"><div class="serif-i" style="font-size:30px">Queue clear.</div><p class="t3 sm-t">Nice work. New reports land here in real time.</p></div>');
    },
    keys(e) {
      if (location.hash.indexOf("tab=rules") >= 0) return;
      const list = st.modq.filter(m => !m.done && ((st.modf || "all") === "all" || m.type === st.modf));
      const i = list.findIndex(m => m.id === (st.modSel || (list[0] && list[0].id)));
      if (e.key === "j" && list[i + 1]) { st.modSel = list[i + 1].id; A.rerender(); }
      if (e.key === "k" && list[i - 1]) { st.modSel = list[i - 1].id; A.rerender(); }
      if (e.key === "a" && list[i]) ACT.modDo(null, list[i].id, "approve");
      if (e.key === "r" && list[i]) ACT.modDo(null, list[i].id, "remove");
    }
  });
  function head(open) {
    return UI.ph("Moderation", "Machines catch the obvious; people decide the rest. Every action is logged with who, what and why.",
      '<a class="b" href="#/moderation?tab=rules">' + ic("sliders", 15) + 'Rules</a><a class="b" href="#/audit">' + ic("history", 15) + "Audit log</a>") +
      '<div class="grid g4" style="margin-bottom:16px">' + UI.stat({ l: "Open items", v: String(open.length + 27), d: open.filter(m => m.sla === "breach").length + " past SLA" }) + UI.stat({ l: "Auto-handled · 24 h", v: "12,480", d: "92% of all reports" }) + UI.stat({ l: "Median time to decision", v: "38 min", d: "SLA 2 h" }) + UI.stat({ l: "Appeals overturned", v: "3.1%", d: "last 30 days" }) + "</div>" +
      UI.tabs([["queue", "Queue", open.length], ["rules", "Rules"]], location.hash.indexOf("tab=rules") >= 0 ? "rules" : "queue", "moderation");
  }
  function detail(m) {
    let body = "";
    if (m.type === "video") {
      const v = S.V[m.ref];
      body = '<div class="row start" style="gap:16px"><div style="width:150px;flex:none"><div class="poster tall"><img src="' + Art.thumb(v) + '" alt=""></div></div><div class="sp"><h3 style="margin:0;font-size:16px">' + esc(v.title) + '</h3><div class="who mt">' + UI.avaC(C[v.by], 30) + "<div><b>" + esc(C[v.by].name) + "</b><small>" + esc(C[v.by].handle) + " · " + FMT.n(C[v.by].followers) + " followers</small></div></div>" +
        '<div class="nt ' + (m.score > .7 ? "red" : "amber") + ' mt">' + ic("info", 16) + "<span><b>" + esc(m.detail) + ".</b> " + esc(m.auto) + ".</span></div></div></div>";
    } else if (m.type === "creator") {
      body = '<div class="nt amber">' + ic("user", 16) + "<span><b>" + esc(m.detail) + ".</b> First payout of $300.00 via mobile money.</span></div><div class=\"grid g2 mt\"><div class=\"card pad\"><div class=\"lbl\">Document</div><div style=\"height:120px;border-radius:10px;margin-top:8px;background:repeating-linear-gradient(45deg,var(--surface-3),var(--surface-3) 8px,var(--surface-2) 8px,var(--surface-2) 16px);display:grid;place-items:center\" class=\"t3 sm-t\">National ID · front</div></div><div class=\"card pad\"><dl class=\"kvs\"><dt>Name match</dt><dd>✓ Kofi Mensah</dd><dt>Country</dt><dd>Ghana</dd><dt>Account age</dt><dd>214 days</dd><dt>Prior strikes</dt><dd>0</dd></dl></div></div>";
    } else {
      body = '<div class="lbl" style="margin-bottom:8px">' + (m.type === "review" ? "Review" : "Comment") + " by " + esc(m.by) + " on " + esc(m.on) + '</div><div class="quote">' + esc(m.text) + "</div>" +
        (m.type === "comment" ? '<div class="lbl" style="margin:16px 0 8px">Context · the thread</div><div class="card"><div class="li"><span class="ic">' + ic("comment", 15) + '</span><div class="b2"><div class="t">@mira.k</div><div class="s">Ethan sent it. Calling it now.</div></div></div><div class="li" style="background:var(--red-soft)"><span class="ic red">' + ic("flag", 15) + '</span><div class="b2"><div class="t">' + esc(m.by) + '</div><div class="s">' + esc(m.text) + '</div></div></div><div class="li"><span class="ic">' + ic("comment", 15) + '</span><div class="b2"><div class="t">@ava_stan</div><div class="s">can we not do this here</div></div></div></div>' : "") +
        '<div class="nt mt">' + ic("info", 16) + "<span>Automatic action: <b>" + esc(m.auto) + "</b></span></div>";
    }
    const sc = m.type === "comment" ? [["Toxicity", m.score], ["Harassment", m.reason === "Harassment" ? m.score : .1], ["Spoiler", m.reason.indexOf("Spoiler") >= 0 ? .93 : .05]] : m.type === "review" ? [["Spam / links", m.score], ["Fake pattern", m.reason.indexOf("Fake") >= 0 ? .83 : .1]] : [["Overall risk", m.score]];
    return '<div class="row" style="margin-bottom:14px"><span class="pill ' + (m.sla === "breach" ? "red" : m.sla === "warn" ? "amber" : "") + '">' + ic("clock", 12) + esc(m.age) + " in queue</span>" + (m.reports ? '<span class="pill">' + ic("flag", 12) + m.reports + " reports</span>" : "") + '<span class="pill">' + esc(m.reason) + "</span></div>" + body +
      '<div class="lbl" style="margin:18px 0 8px">Signals</div>' + sc.map(([n, s]) => '<div class="score" style="margin-bottom:7px"><span class="sm-t" style="width:110px">' + n + '</span><span class="meter ' + (s > .7 ? "bad" : s > .3 ? "warn" : "ok") + '"><i style="width:' + Math.max(3, s * 100) + '%"></i></span><b>' + Math.round(s * 100) + "%</b></div>").join("");
  }
  function actions(m) {
    return '<div class="lbl">Decision</div><button class="b pri" data-act="modDo:' + m.id + ':approve">' + ic("check", 15) + 'Approve · keep it</button><button class="b" data-act="modDo:' + m.id + ':remove">' + ic("trash", 15) + 'Remove</button><button class="b" data-act="modDo:' + m.id + ':warn">' + ic("alert", 15) + 'Remove + warn user</button><button class="b danger" data-act="modDo:' + m.id + ':restrict">' + ic("ban", 15) + "Restrict account (7 days)</button>" +
      '<div class="fld"><label>Reason (shown to the user)</label><select class="sel"><option>' + esc(m.reason) + "</option><option>Hate speech</option><option>Harassment</option><option>Spam</option><option>Copyright</option></select></div>" +
      '<div class="fld"><label>Internal note</label><textarea class="ta" rows="2" placeholder="Visible to moderators only"></textarea></div>' +
      '<div class="xs-t t3">The user can appeal once. Appeals go to a different moderator.</div>';
  }
  ACT.modf = (el, k) => { st.modf = k; st.modSel = null; A.rerender(); };
  ACT.modSel = (el, id) => { st.modSel = id; A.rerender(); };
  ACT.modDo = (el, id, what) => {
    const list = st.modq.filter(m => !m.done);
    const i = list.findIndex(m => m.id === id);
    const m = list[i];
    m.done = what;
    st.modSel = list[i + 1] ? list[i + 1].id : list[i - 1] ? list[i - 1].id : null;
    toast({ approve: "Approved · kept", remove: "Removed · reason sent", warn: "Removed and user warned", restrict: "Account restricted for 7 days" }[what] + " · logged", () => { m.done = false; st.modSel = m.id; A.rerender(); });
    A.rerender();
  };
  function rules() {
    return '<div class="grid g2">' + UI.card("Automatic filters", "Run before anything is posted", '<div class="form">' +
      '<div class="fld"><label>Blocked words · English</label><div class="chipset">' + ["slur list (412)", "self-harm terms", "scam phrases", "+ custom (38)"].map(k => '<span class="tchip on">' + k + "</span>").join("") + "</div></div>" +
      '<div class="fld"><label>Blocked words · Hindi, Bahasa, Português, Español</label><div class="chipset">' + ["हिन्दी (288)", "Bahasa (190)", "Português (231)", "Español (264)"].map(k => '<span class="tchip on">' + k + "</span>").join("") + "</div></div>" +
      '<div class="row"><span class="sp"><b class="sm-t">Block links and phone numbers</b><div class="xs-t t3">Comments and reviews</div></span>' + UI.tog(true, "flip", "Block links") + "</div>" +
      '<div class="row"><span class="sp"><b class="sm-t">AI moderation service</b><div class="xs-t t3">Scores toxicity, harassment, spoilers</div></span>' + UI.tog(true, "flip", "AI moderation") + "</div>" +
      '<div class="row"><span class="sp"><b class="sm-t">Auto-blur unlabelled spoilers</b><div class="xs-t t3">Comments that mention later episodes</div></span>' + UI.tog(true, "flip", "Spoiler blur") + "</div></div>") +
      UI.card("Thresholds & limits", "", '<div class="form two"><div class="fld"><label>Hide after reports</label><input class="inp" value="20"><div class="hint">Until a moderator decides</div></div><div class="fld"><label>New-account hold</label><input class="inp" value="24 hours"><div class="hint">Comments wait for approval</div></div>' +
        '<div class="fld"><label>Comments per minute</label><input class="inp" value="5"></div><div class="fld"><label>Review SLA</label><input class="inp" value="2 hours"></div>' +
        '<div class="fld full"><label>Copyright match</label><select class="sel"><option>≥ 90% match with any Spool episode → hide and notify</option></select><div class="hint">Catches leaks of unreleased episodes before they spread.</div></div></div>') + "</div>";
  }

  /* =====================================================================
     USERS
     ===================================================================== */
  A.page("users", {
    title: r => r.parts[1] ? (S.USERS.find(u => u.id === r.parts[1]) || S.USERS[0]).name : "Users",
    crumbs: r => r.parts[1] ? [["Users", "users"], [(S.USERS.find(u => u.id === r.parts[1]) || S.USERS[0]).name]] : [["Audience"], ["Users"]],
    render(r) { return r.parts[1] ? userDetail(r) : userList(); },
    mount(r) {
      const q = $("#uq");
      if (q) q.addEventListener("input", () => { st.uq = q.value; const pos = q.selectionStart; A.rerender(); const n = $("#uq"); n.focus(); n.setSelectionRange(pos, pos); });
    }
  });
  function userList() {
    const seg = st.useg || "all", q = (st.uq || "").toLowerCase();
    const list = S.USERS.filter(u => (seg === "all" || u.seg === seg) && (!q || (u.name + u.email + u.id).toLowerCase().indexOf(q) >= 0) && (st.region === "All" || u.region === st.region));
    return UI.ph("Users", "9.7M monthly viewers · search by name, email or ID. Wallet changes always need a reason and are logged.",
      '<button class="b" data-act="toast:Export of ' + list.length + ' users queued">' + ic("download", 15) + "Export</button>") +
      '<section class="card"><div class="tbar"><label class="tsearch">' + ic("search", 15) + '<input class="inp" id="uq" placeholder="Name, email or u_ ID" value="' + esc(st.uq || "") + '" style="width:260px;min-height:34px;height:34px"></label>' +
      UI.segc([["all", "All"], ["VIP", "VIP"], ["Payer", "Payers"], ["Free", "Free"], ["Creator", "Creators"]], seg, "useg") + '<span class="sp"></span><span class="xs-t t3">' + list.length + " shown</span></div>" +
      '<div class="tblwrap"><table class="tbl"><thead><tr><th>User</th><th>Region</th><th>Segment</th><th class="r">Paid coins</th><th class="r">Bonus</th><th class="r">Lifetime spend</th><th>Sign-in</th><th>Device</th><th>Last active</th><th>Status</th></tr></thead><tbody>' +
      list.map(u => '<tr class="clickable" data-act="goUser:' + u.id + '"><td><div class="who">' + UI.ava(u.id, 32, { kind: u.kind }) + '<div><b>' + esc(u.name) + "</b><small>" + esc(u.email) + "</small></div></div></td><td>" + u.region + "</td><td>" + (u.seg === "VIP" ? '<span class="vipmark">' + ic("crown") + "VIP</span>" : '<span class="pill">' + u.seg + "</span>") + '</td><td class="r">' + FMT.int(u.paid) + '</td><td class="r t2">' + FMT.int(u.bonus) + '</td><td class="r">' + (u.ltv ? FMT.usd(u.ltv) : "—") + "</td><td>" + u.sign + "</td><td>" + u.device + '</td><td class="t2">' + u.last + "</td><td>" + UI.pill(u.status) + "</td></tr>").join("") + "</tbody></table></div></section>";
  }
  ACT.useg = (el, k) => { st.useg = k; A.rerender(); };
  ACT.goUser = (el, id) => A.go("users/" + id);
  function userDetail(r) {
    const u = S.USERS.find(x => x.id === r.parts[1]) || S.USERS[0];
    const tab = r.q.tab || "wallet";
    const isMaya = u.id === "u_10293";
    const ledger = isMaya ? (st.mayaLedger || (st.mayaLedger = S.LEDGER.slice())) : S.LEDGER.slice(0, 5).map(l => Object.assign({}, l, { after: [u.paid, u.bonus] }));
    let body = "";
    if (tab === "wallet") {
      body = '<div class="grid g3">' + UI.stat({ l: "Paid coins", icon: "coin", v: FMT.int(isMaya ? ledger[0].after[0] : u.paid), d: "never expire" }) + UI.stat({ l: "Bonus coins", icon: "gift", v: FMT.int(isMaya ? ledger[0].after[1] : u.bonus), d: "spent first · expire 16 Oct" }) + UI.stat({ l: "Lifetime spend", icon: "receipt", v: FMT.usd(u.ltv), d: isMaya ? "1 purchase · Google Play" : "" }) + "</div>" +
        '<div class="mt">' + UI.card("Ledger", "Append-only · every movement with the balance after it · references link to receipts and unlocks", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Entry</th><th>When</th><th>What</th><th class="r">Paid</th><th class="r">Bonus</th><th class="r">Balance after</th><th>Reference</th></tr></thead><tbody>' +
          ledger.map(l => '<tr><td class="mono xs-t t3">' + esc(l.id) + '</td><td class="t2 nowrap">' + esc(l.day) + " " + esc(l.time) + "</td><td><b>" + esc(l.label) + '</b><div class="xs-t t3">' + esc(l.sub || "") + (l.exp ? " · bonus expires " + esc(l.exp) : "") + '</div></td><td class="r num">' + (l.paid ? (l.paid > 0 ? "+" : "") + l.paid : "—") + '</td><td class="r num">' + (l.bonus ? (l.bonus > 0 ? "+" : "") + l.bonus : "—") + '</td><td class="r num">' + l.after[0] + " · " + l.after[1] + '</td><td class="mono xs-t t3">' + esc(l.ref || "") + "</td></tr>").join("") + "</tbody></table></div>", { flush: true, acts: '<button class="b sm" data-act="adjust:' + u.id + '">' + ic("edit", 14) + "Adjust balance</button>" }) + "</div>";
    } else if (tab === "unlocks") {
      body = UI.card("Unlocks", "Tied to the account — they restore on any device and on the web", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Title</th><th>Episodes</th><th>How</th><th>When</th></tr></thead><tbody>' +
        [["contract", "E9–E12", "Coins (bonus)", "27 Sep – 7 Oct"], ["moonbound", "E11–E13", "Coins + rewarded ad", "Yesterday"], ["divorce", "All 58", "Series Pass", "2 Oct"]].map(([id, e, h, w]) => "<tr><td><div class=\"who\">" + UI.poster(T[id]) + "<b>" + esc(T[id].name) + "</b></div></td><td>" + e + "</td><td>" + h + '</td><td class="t2">' + w + "</td></tr>").join("") + "</tbody></table></div>", { flush: true, acts: '<button class="b sm" data-act="grant">' + ic("gift", 14) + "Grant an episode</button>" });
    } else if (tab === "purchases") {
      const tx = S.TXNS.filter(t => t.user === u.id);
      const rows = isMaya ? [{ id: "T-530012", item: "First top-up · 300 + 300", amount: 1.99, store: "Google Play", status: "Completed", when: "7 Oct 21:58" }] : tx;
      body = UI.card("Purchases", "Receipts are verified server-side", rows.length ? '<div class="tblwrap"><table class="tbl"><thead><tr><th>ID</th><th>Item</th><th>Store</th><th class="r">Amount</th><th>Status</th><th>When</th><th class="w0"></th></tr></thead><tbody>' + rows.map(t => '<tr><td class="mono xs-t">' + esc(t.id) + "</td><td>" + esc(t.item) + "</td><td>" + esc(t.store) + '</td><td class="r">' + FMT.usd(t.amount) + "</td><td>" + UI.pill(t.status) + '</td><td class="t2">' + esc(t.when) + '</td><td><button class="b sm" data-act="refund:' + t.id + '">Refund</button></td></tr>').join("") + "</tbody></table></div>" : '<p class="t3 sm-t">No purchases.</p>', { flush: !!rows.length });
    } else if (tab === "sub") {
      body = UI.card("Subscription", "", u.seg === "VIP" ? '<dl class="kvs"><dt>Plan</dt><dd>VIP Weekly · $5.99</dd><dt>Renews</dt><dd>16 Oct</dd><dt>Reminder</dt><dd>15 Oct · scheduled</dd><dt>Store</dt><dd>Google Play</dd></dl><div class="row mt"><button class="b sm">Cancel at period end</button><button class="b sm">Refund last charge</button></div>' : '<p class="t3 sm-t">Not subscribed. Saw the VIP page 2× this week.</p>');
    } else {
      body = UI.card("Recent activity", "", [["play", "Watched The Heiress Returns E7", "Yesterday 21:44 · 1:28 of 1:28"], ["poll", "Made a Cliffhanger Call", "Who sent the text? → Ethan"], ["unlock", "Unlocked Moonbound E13", "60 coins · 50 bonus first"], ["gift", "Sent a Cliffhanger", "Heiress E8 → Riya"], ["search", "Scene Search", "“the slap at the gala”"]].map(([i, t, s]) => '<div class="li"><span class="ic">' + ic(i, 16) + '</span><div class="b2"><div class="t">' + t + '</div><div class="s">' + s + "</div></div></div>").join(""), { flush: true });
    }
    return '<div class="ph"><div class="t"><a class="backlink" href="#/users">' + ic("back", 14, 2) + 'Users</a><div class="row" style="gap:14px">' + UI.ava(u.id === "u_10293" ? "me-fan" : u.id, 52, u.id === "u_10293" ? { kind: "woman", hair: "long", pal: ["#24060f", "#8a1f3e", "#ffc06a"] } : { kind: u.kind }) +
      "<div><h1>" + esc(u.name) + '</h1><p class="row" style="gap:8px;margin-top:6px">' + UI.pill(u.status) + "<span>" + esc(u.email) + " · " + u.id + " · " + S.REGIONS[u.region].name + " · joined " + u.joined + "</span></p></div></div></div>" +
      '<div class="acts"><button class="b" data-act="restoreU">' + ic("refresh", 15) + 'Restore purchases</button><button class="b" data-act="adjust:' + u.id + '">' + ic("coins", 15) + 'Adjust balance</button><button class="b danger" data-act="restrictU">' + ic("ban", 15) + "Restrict</button></div></div>" +
      UI.tabs([["wallet", "Wallet & ledger"], ["unlocks", "Unlocks"], ["purchases", "Purchases"], ["sub", "Subscription"], ["activity", "Activity"]], tab, "users/" + u.id) + body;
  }
  ACT.adjust = (el, uid) => Modal.open({
    title: "Adjust balance", sub: "Creates a new ledger entry. Nothing is edited or deleted.",
    body: '<div class="form two"><div class="fld"><label>Coin type</label>' + UI.segc([["paid", "Paid"], ["bonus", "Bonus"]], "paid", "noop") + '</div><div class="fld"><label>Amount</label><input class="inp" id="adjAmt" value="+60"></div>' +
      '<div class="fld full"><label>Reason (required, visible to the user)</label><select class="sel" id="adjWhy"><option>Double charge — store refund pending</option><option>Episode failed to play</option><option>Goodwill</option><option>Correction</option></select></div>' +
      '<div class="fld full"><label>Internal note</label><textarea class="ta" rows="2">GPA.3381 charged twice; store refund requested.</textarea></div></div>' +
      '<div class="nt mt">' + ic("info", 16) + "<span>Adjustments over 1,000 coins need a second approver (Finance).</span></div>",
    foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="adjGo:' + uid + '">Add ledger entry</button>'
  });
  ACT.adjGo = (el, uid) => {
    const amt = parseInt(($("#adjAmt").value || "0").replace(/[^-\d]/g, ""), 10) || 0;
    if (uid === "u_10293") {
      const L = st.mayaLedger || (st.mayaLedger = S.LEDGER.slice());
      const prev = L[0].after;
      L.unshift({ id: "L-9" + (1000 + L.length), day: "Today", time: "10:41", type: "adjust", label: "Support adjustment", sub: $("#adjWhy").value + " · by Riya Desai", paid: amt, bonus: 0, after: [prev[0] + amt, prev[1]], ref: "adj:" + Math.random().toString(16).slice(2, 8) });
    }
    Modal.close(); toast("Ledger entry added · " + (amt > 0 ? "+" : "") + amt + " paid coins · logged in Audit log"); A.rerender();
  };
  ACT.restoreU = () => toast("Restore run · store receipts re-checked · nothing missing");
  ACT.restrictU = () => Modal.open({ title: "Restrict account", sub: "The user can still watch what they unlocked; they can't comment, upload or buy.", body: '<div class="form"><div class="fld"><label>Duration</label>' + UI.segc([["1", "1 day"], ["7", "7 days"], ["perm", "Until lifted"]], "7", "noop") + '</div><div class="fld"><label>Reason</label><select class="sel"><option>Repeated harassment</option><option>Payment fraud</option><option>Spam</option></select></div></div>', foot: '<button class="b" data-act="mclose">Cancel</button><button class="b danger solid" data-act="mclose">Restrict</button>' });
  ACT.grant = () => Modal.open({ title: "Grant an episode", sub: "No coins move. Recorded as a grant in the ledger.", body: '<div class="form two"><div class="fld"><label>Title</label><select class="sel"><option>The Heiress Returns</option><option>Moonbound</option></select></div><div class="fld"><label>Episode</label><input class="inp" value="8"></div><div class="fld full"><label>Reason</label><input class="inp" value="Playback failed twice on E8"></div></div>', foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="grantGo">Grant</button>' });
  ACT.grantGo = () => { Modal.close(); toast("Granted E8 · the viewer gets a push"); };

  /* =====================================================================
     CAMPAIGNS & PUSH
     ===================================================================== */
  A.page("campaigns", {
    title: () => "Campaigns & push",
    crumbs: () => [["Audience"], ["Campaigns & push"]],
    render(r) {
      const auto = S.CAMPAIGNS.filter(c => c.kind === "Automation");
      const others = S.CAMPAIGNS.filter(c => c.kind !== "Automation");
      return UI.ph("Campaigns & push", "Automations bring people back at the right moment. Every viewer gets at most 3 notifications a day, and money notices are never marketing.",
        '<button class="b" data-act="deeplink">' + ic("link", 15) + 'New deep link</button><button class="b pri" data-act="compose">' + ic("megaphone", 15) + "New push</button>") +
        '<div class="grid g2">' + auto.map(c => '<section class="card pad"><div class="row start"><span class="ic" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent-text);flex:none">' + ic(c.id === "cp-1" ? "gift" : c.id === "cp-2" ? "hourglass" : c.id === "cp-3" ? "calendar" : "crown", 19) + '</span><div class="sp"><h3 style="margin:0;font-size:15px">' + esc(c.name) + '</h3><div class="xs-t t3" style="margin-top:3px">' + esc(c.trigger) + "</div></div>" +
          (c.locked ? '<span class="lock">' + ic("lock", 12) + "Required</span>" : UI.tog(true, "flip", c.name)) + "</div>" +
          '<div class="nt" style="margin-top:12px">' + ic("send", 15) + "<span><b>Offer:</b> " + esc(c.offer) + "</span></div>" +
          '<div class="grid g3" style="gap:8px;margin-top:12px"><div><div class="xs-t t3">Sent · 30d</div><b>' + FMT.n(c.sent) + '</b></div><div><div class="xs-t t3">' + (c.id === "cp-3" ? "Opened" : c.id === "cp-4" ? "Cancelled after" : "Came back") + "</div><b>" + (c.id === "cp-4" ? "2.1%" : FMT.pct(c.conv)) + '</b></div><div><div class="xs-t t3">Revenue</div><b>' + (c.revenue ? FMT.usdk(c.revenue) : "—") + "</b></div></div></section>").join("") + "</div>" +
        '<div class="mt">' + UI.card("Campaigns & ad deep links", "Promise Guard checks that what an ad promises is what the app delivers", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Name</th><th>Type</th><th>Target</th><th>Offer / promise</th><th>Status</th><th class="r">Conversion</th></tr></thead><tbody>' +
          others.map(c => "<tr><td><b>" + esc(c.name) + '</b></td><td><span class="pill">' + esc(c.kind) + '</span></td><td class="mono xs-t">' + esc(c.trigger) + "</td><td>" + (c.promise ? '<span class="pill green">' + ic("shieldc", 12) + esc(c.offer) + "</span>" : esc(c.offer)) + "</td><td>" + UI.pill(c.status === "Active" ? "Live" : c.status) + '</td><td class="r">' + (c.conv ? FMT.pct(c.conv) : "—") + "</td></tr>").join("") + "</tbody></table></div>", { flush: true }) + "</div>" +
        '<div class="nt acc mt">' + ic("shieldc", 16) + "<span><b>Why Promise Guard:</b> ShortMax and PineDrama reviewers clicked ads promising “free for 24 hours” or a specific show, and landed somewhere else. A deep link here is tied to a server-side offer, so the ad's promise is checked before the campaign can go live.</span></div>";
    },
    mount(r) { if (r.q.compose) ACT.compose(); }
  });
  ACT.compose = () => Modal.open({
    title: "New push", sub: "Counts toward the 3-a-day cap · respects quiet hours", size: "lg",
    body: '<div class="row start" style="gap:20px"><div class="form sp"><div class="fld"><label>Audience</label><select class="sel"><option>Followers of The Heiress Returns · 2.1M</option><option>Lapsed 7–30 days · 412K</option><option>VIP · 118K</option></select></div>' +
      '<div class="fld"><label>Title</label><input class="inp" id="pt" value="E24 drops tonight at 8 👀"></div><div class="fld"><label>Body</label><input class="inp" id="pb" value="Ava faces the Lin board. You asked to be reminded."></div>' +
      '<div class="fld"><label>Opens</label><input class="inp" value="spool://series/heiress"></div><div class="fld"><label>Send</label>' + UI.segc([["now", "Now"], ["drop", "1 h before drop"], ["local", "Viewer local 7 PM"]], "drop", "noop") + "</div></div>" +
      '<div style="width:230px;flex:none"><div class="mini-phone" style="--pw:230px;aspect-ratio:auto;height:300px"><div class="scr" style="background:linear-gradient(160deg,#3b2a5a,#0d0b14);padding:44px 10px 0"><div style="text-align:center;font-size:44px;font-weight:300;letter-spacing:-.02em">9:41</div><div style="margin-top:22px;padding:10px;border-radius:16px;background:rgba(40,40,44,.75);backdrop-filter:blur(10px);display:flex;gap:8px"><span class="mark" style="--s:26px;border-radius:7px">' + brandMark(17) + '</span><div style="min-width:0"><div style="font-size:9px;color:rgba(255,255,255,.6)">SPOOL · now</div><div style="font-size:11px;font-weight:650" id="ppt">E24 drops tonight at 8 👀</div><div style="font-size:10.5px;color:rgba(255,255,255,.8)" id="ppb">Ava faces the Lin board. You asked to be reminded.</div></div></div></div></div></div></div>',
    foot: '<span class="xs-t t3">Estimated reach 1.6M after caps and quiet hours</span><span class="sp"></span><button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="pushGo">Schedule push</button>',
    mount: m => { ["pt", "pb"].forEach(k => $("#" + k, m).addEventListener("input", e => { $("#p" + k, m).textContent = e.target.value; })); }
  });
  ACT.pushGo = () => { Modal.close(); toast("Push scheduled for 7:00 PM viewer time"); };
  ACT.deeplink = () => Modal.open({
    title: "New ad deep link", sub: "The link carries an offer. Promise Guard checks the ad copy against it.",
    body: '<div class="form"><div class="fld"><label>Opens</label><select class="sel"><option>The Heiress Returns · E1</option><option>Moonbound · E1</option></select></div><div class="fld"><label>Ad says</label><input class="inp" value="Watch the first 7 episodes free"></div>' +
      '<div class="nt green">' + ic("shieldc", 16) + "<span><b>Promise check passed.</b> E1–E7 are free in every targeted region. If someone lowers the free count, this campaign pauses automatically.</span></div>" +
      '<div class="fld"><label>Link</label><input class="inp mono" value="https://spool.tv/r/heiress-e1?c=meta_us_oct" readonly></div></div>',
    foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="mclose">Create link</button>'
  });

  /* =====================================================================
     MONETIZATION
     ===================================================================== */
  A.page("monetization", {
    title: () => "Monetization",
    crumbs: () => [["Money"], ["Monetization"]],
    render(r) {
      const tab = r.q.tab || "regions";
      let body = "";
      if (tab === "regions") body = mRegions();
      else if (tab === "packs") body = mPacks();
      else if (tab === "vip") body = mVip();
      else if (tab === "ads") body = mAds();
      else if (tab === "rewards") body = mRewards();
      else body = mFair();
      return UI.ph("Monetization", "Coins, VIP and ads — mixed per country. The fair-play rules are locked so no one can switch them off by accident.", '<a class="b" href="#/paywall-lab">' + ic("percent", 15) + "Paywall Lab</a>") +
        UI.tabs([["regions", "Regions"], ["packs", "Coin packs"], ["vip", "VIP plans"], ["ads", "Ads"], ["rewards", "Rewards"], ["fair", "Fair-play rules"]], tab, "monetization") + body;
    }
  });
  function mRegions() {
    return '<div class="stack"><section class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Region</th><th>Mode</th><th class="r">Episode price</th><th class="r">Free eps</th><th class="r">Ad unlocks / day</th><th class="r">VIP / week</th><th class="r">ARPDAU</th></tr></thead><tbody>' +
      Object.values(S.REGIONS).map(r => "<tr><td><div class=\"who\"><span class=\"pill\">" + r.code + "</span><b>" + esc(r.name) + '</b></div></td><td><select class="sel" style="min-height:32px;height:32px;width:auto" data-act2="mode"><option' + (r.mode === "hybrid" ? " selected" : "") + ">Hybrid</option><option" + (r.mode === "ads" ? " selected" : "") + ">Free with ads</option><option" + (r.mode === "coins" ? " selected" : "") + '>Coins + VIP, no ads</option></select></td><td class="r"><span class="coin">' + ic("coin") + r.epPrice + '</span></td><td class="r">' + r.freeEps + '</td><td class="r">' + (r.adsPerDay || "Off") + '</td><td class="r">' + (r.cur === "$" ? "$" : r.cur + " ") + r.vip[0] + '</td><td class="r">$' + r.arpdau.toFixed(3) + "</td></tr>").join("") + "</tbody></table></div></section>" +
      '<div class="grid g2">' + UI.card("What the modes do", "", [["layers", "Hybrid", "Coins, VIP and rewarded ads. Unlock sheet defaults to coins when the balance covers it."], ["ad", "Free with ads", "Rewarded ads first, low coin prices, cheap VIP. India earns ~$0.03 per download vs $0.20+ in Southeast Asia and LatAm."], ["coin", "Coins + VIP, no ads", "For markets where ads under-perform or regulation is strict."]].map(([i, t, s]) => '<div class="policy"><span class="ic" style="background:var(--accent-soft);color:var(--accent-text)">' + ic(i, 15) + '</span><div class="b2"><div class="t">' + t + '</div><div class="s">' + s + "</div></div></div>").join("")) +
      UI.card("Web checkout", "Store rules on linking out differ by country", '<div class="row"><span class="sp"><b class="sm-t">Show “top up on the web” in the app</b><div class="xs-t t3">US only, per current store policy</div></span>' + UI.tog(true, "flip", "Web checkout link") + '</div><div class="xs-t t3 mt">Check store policy for each market before turning this on elsewhere.</div>') + "</div></div>";
  }
  function mPacks() {
    return '<section class="card"><div class="tblwrap"><table class="tbl"><thead><tr><th>Pack</th><th class="r">Coins</th><th class="r">Bonus</th><th class="r">Price (US)</th><th class="r">Per coin</th><th class="r">≈ Episodes</th><th>Flags</th><th>Store SKU</th></tr></thead><tbody>' +
      S.PACKS.map(p => "<tr><td><b>" + (p.first ? "First top-up" : FMT.int(p.coins) + " coins") + '</b></td><td class="r"><input class="inp" style="width:90px;min-height:30px;height:30px;text-align:right" value="' + p.coins + '"></td><td class="r"><input class="inp" style="width:80px;min-height:30px;height:30px;text-align:right" value="' + p.bonus + '"></td><td class="r">' + FMT.usd(p.price) + '</td><td class="r t2">$' + (p.price / (p.coins + p.bonus)).toFixed(4) + '</td><td class="r">' + Math.floor((p.coins + p.bonus) / 60) + "</td><td>" + (p.first ? '<span class="pill gold">Once per account</span>' : p.popular ? '<span class="pill accent">Popular</span>' : p.best ? '<span class="pill gold">Best value</span>' : "") + '</td><td class="mono xs-t t3">com.spool.coins.' + p.id + "</td></tr>").join("") +
      '</tbody></table></div><div class="cf">' + ic("info", 15) + "Paid coins never expire. Bonus coins expire after 7 days and are always spent first. Prices per country follow each store's price tiers.</div></section>";
  }
  function mVip() {
    return '<div class="grid g3">' + S.VIP_PLANS.map((p, i) => '<section class="card pad"><div class="row"><span class="vipmark">' + ic("crown") + "VIP</span><b style=\"font-size:16px\">" + p.name + '</b><span class="sp"></span>' + (p.best ? '<span class="pill gold">Best value</span>' : "") + '</div><div style="font-size:30px;font-weight:720;letter-spacing:-.03em;margin-top:14px">' + FMT.usd(p.price) + '<span class="sm-t t3" style="font-weight:600"> / ' + p.per + '</span></div><div class="xs-t t3">' + esc(p.note) + '</div><div class="hr"></div><dl class="kvs"><dt>Subscribers</dt><dd>' + ["71,200", "29,900", "17,300"][i] + "</dd><dt>Renewal rate</dt><dd>" + ["78%", "86%", "—"][i] + "</dd><dt>Refund rate</dt><dd>" + ["0.4%", "0.3%", "0.2%"][i] + "</dd></dl></section>").join("") + "</div>" +
      '<div class="grid g2 mt">' + UI.card("What VIP includes", "", S.VIP_PERKS.map(p => '<div class="policy"><span class="ic" style="background:var(--gold-soft);color:var(--gold-ink)">' + ic(p.icon, 15) + '</span><div class="b2"><div class="t">' + esc(p.t) + '</div><div class="s">' + esc(p.s) + "</div></div></div>").join("")) +
      UI.card("Subscription rules", "", [["No free trial that turns into a charge", "Kuku TV and QuickTV reviewers describe ₹1 trials becoming ₹699–700 charges."], ["Renewal reminder 24 h before every charge", "Can't be turned off."], ["Cancel in two taps, in the app", "ReelShort and ShortMax reviewers couldn't find a way to cancel."], ["VIP never sees an ad", "A Kuku TV reviewer saw unskippable ads after buying a plan."]].map(([t, s]) => '<div class="policy"><span class="ic">' + ic("lock", 15) + '</span><div class="b2"><div class="t">' + t + ' <span class="lock">' + ic("lock", 11) + 'Locked</span></div><div class="s">' + s + "</div></div></div>").join("")) + "</div>";
  }
  function mAds() {
    return '<section class="card"><div class="ch"><div class="tt"><h3>Networks</h3><p>Mediated through AppLovin MAX · keys per region</p></div><div class="ca"><button class="b sm">' + ic("plus", 14) + 'Add network</button></div></div><div class="cb flush"><div class="tblwrap"><table class="tbl"><thead><tr><th>Network</th><th>Status</th><th>Regions</th><th class="r">eCPM</th><th>Fill rate</th><th class="r">Share</th></tr></thead><tbody>' +
      S.AD_NETWORKS.map(n => "<tr><td><b>" + esc(n.name) + "</b></td><td>" + UI.pill(n.status) + '</td><td class="t2">' + esc(n.regions) + '</td><td class="r">' + FMT.usd(n.ecpm) + '</td><td><div class="row" style="gap:8px"><span class="meter" style="width:90px"><i style="width:' + n.fill * 100 + '%"></i></span><span class="xs-t">' + Math.round(n.fill * 100) + '%</span></div></td><td class="r">' + Math.round(n.share * 100) + "%</td></tr>").join("") + "</tbody></table></div></div></section>" +
      '<div class="grid g2 mt">' + UI.card("Rewarded ads", "Rules for the unlock path", [["1 ad = 1 reward", "Never two ads that turn into six — NetShort's top review (1,396 helpful) describes exactly that.", true], ["Maximum length 30 seconds", "", true], ["No playable or interactive ads in the unlock path", "DramaBox reviewers (2,625 helpful) were bounced to the Play Store by playable ads.", true], ["A failed ad still grants the reward", "“The video keeps repeating after watching ads” — ReelShort, 3,641 helpful.", true]].map(([t, s]) => '<div class="policy"><span class="ic">' + ic("lock", 15) + '</span><div class="b2"><div class="t">' + t + ' <span class="lock">' + ic("lock", 11) + 'Locked</span></div><div class="s">' + s + "</div></div></div>").join("")) +
      UI.card("Interstitials & banners", "Free viewers only", '<div class="form"><div class="fld"><label>Interstitial frequency</label><select class="sel"><option>After every 3rd episode</option><option>After every 5th episode</option><option>Off</option></select></div><div class="fld"><label>Maximum length</label><select class="sel"><option>15 seconds, skippable after 5</option></select></div><div class="row"><span class="sp"><b class="sm-t">Never show ads to VIP</b></span><span class="lock">' + ic("lock", 11) + "Locked</span></div></div>") + "</div>";
  }
  function mRewards() {
    return '<div class="grid g2">' + UI.card("Daily check-in ladder", "Bonus coins per day of a 7-day streak", '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">' + S.REWARDS.ladder.map((c, i) => '<div class="fld"><label style="text-align:center">Day ' + (i + 1) + '</label><input class="inp" style="text-align:center;padding:8px 4px" value="' + c + '"></div>').join("") + '</div><div class="xs-t t3 mt">Streak resets after a missed day. Day 7 total: ' + SUM(S.REWARDS.ladder) + " bonus coins (≈ 2.5 episodes).</div>") +
      UI.card("Rewarded ads for coins", "", '<div class="form two"><div class="fld"><label>Coins per ad</label><input class="inp" value="15"></div><div class="fld"><label>Ads per day</label><input class="inp" value="6"><div class="hint">India and Indonesia use their region cap (20)</div></div></div>') +
      UI.card("Tasks", "", S.REWARDS.tasks.map(t => '<div class="li" style="padding:9px 0"><span class="ic">' + ic(t.icon, 15) + '</span><div class="b2"><div class="t">' + esc(t.t) + '</div><div class="s">+' + t.coins + " bonus" + (t.note ? " · " + esc(t.note) : "") + "</div></div>" + UI.tog(true, "flip", t.t) + "</div>").join("")) +
      UI.card("Bonus coin rules", "", [["Expire 7 days after they're earned", false], ["Spent before paid coins, earliest expiry first", true], ["Can't be used for tips or creator payouts", true]].map(([t, l]) => '<div class="policy"><span class="ic">' + ic(l ? "lock" : "clock", 15) + '</span><div class="b2"><div class="t">' + t + (l ? ' <span class="lock">' + ic("lock", 11) + "Locked</span>" : "") + "</div></div></div>").join("")) + "</div>";
  }
  function mFair() {
    const rows = [["tag", "Price shown in coins and money, before every unlock", "The coin wall is the #1 complaint (29% of 1–3★ reviews).", "Unstar analysis"],
      ["lock", "Price lock per viewer", "Once a viewer starts a series, their per-episode price can't rise.", "Sikayetvar · Play reviews"],
      ["coins", "Cost to finish on every series page", "A FlexTV reviewer had to work out ~$30 to finish one story.", "Play review, 157 helpful"],
      ["zap", "Auto-unlock off by default, always capped", "“Autoplay charges the next episode without a confirmation tap.”", "Play review guide"],
      ["shieldc", "Daily spend cap (default 300 coins)", "Screen-time-style control over spending.", "Spool original"],
      ["receipt", "Append-only ledger the viewer can see", "18% of 1–3★ reviews say paid coins vanished or wouldn't restore.", "Unstar analysis"],
      ["refresh", "Unlocks tied to the account, restorable anywhere", "PineDrama reviewers lost history after a restart.", "Play reviews"],
      ["crown", "VIP: reminder before renewal, cancel in two taps, no ads", "23% of 1-star reviews cite auto-renew surprises.", "Unstar analysis"]];
    return '<div class="nt acc" style="margin-bottom:16px">' + ic("shieldc", 16) + "<span><b>These are the product.</b> Each one answers a complaint that shows up across the top Google Play short-drama apps. They're locked in the admin so a pricing change can't quietly undo them.</span></div>" +
      UI.card("Fair-play defaults", "", rows.map(([i, t, s, src]) => '<div class="policy"><span class="ic">' + ic(i, 15) + '</span><div class="b2"><div class="t">' + t + ' <span class="lock">' + ic("lock", 11) + 'Locked</span></div><div class="s">' + s + ' <span class="mono" style="font-size:10.5px">' + src + "</span></div></div></div>").join(""));
  }

  /* =====================================================================
     PAYWALL LAB
     ===================================================================== */
  A.page("paywall-lab", {
    title: r => r.parts[1] ? (S.EXPERIMENTS.find(x => x.id === r.parts[1]) || S.EXPERIMENTS[0]).name : "Paywall Lab",
    crumbs: r => r.parts[1] ? [["Paywall Lab", "paywall-lab"], [r.parts[1]]] : [["Money"], ["Paywall Lab"]],
    render(r) {
      if (r.parts[1]) return expDetail(S.EXPERIMENTS.find(x => x.id === r.parts[1]) || S.EXPERIMENTS[0]);
      return UI.ph("Paywall Lab", "Test where the paywall sits, what an episode costs and how passes are priced — on part of new viewers, with retention and refund guardrails.",
        '<button class="b pri" data-act="newExp">' + ic("plus", 15, 2.2) + "New experiment</button>") +
        '<div class="grid g2">' + S.EXPERIMENTS.map(x => {
          const t = T[x.title];
          return '<a class="card pad" href="#/paywall-lab/' + x.id + '" style="text-decoration:none;color:inherit;display:block"><div class="row">' + UI.poster(t) + '<div class="sp"><b>' + esc(x.name) + '</b><div class="xs-t t3">' + esc(t.name) + " · since " + x.started + " · " + x.traffic + "</div></div>" + UI.pill(x.status) + "</div>" +
            '<div class="grid g3" style="gap:8px;margin-top:14px"><div><div class="xs-t t3">' + esc(x.a.n) + "</div><b>" + (x.a.v < 1 ? "$" + x.a.v.toFixed(3) : x.a.v) + '</b></div><div><div class="xs-t t3">' + esc(x.b.n) + "</div><b>" + (x.b.v < 1 ? "$" + x.b.v.toFixed(3) : x.b.v) + '</b></div><div><div class="xs-t t3">Lift · confidence</div><b style="color:var(--' + (x.lift >= 0 ? "green" : "red") + '-ink)">' + (x.lift >= 0 ? "+" : "") + FMT.pct(x.lift) + "</b> · " + Math.round(x.conf * 100) + "%</div></div>" +
            '<div class="xs-t t3" style="margin-top:10px">' + ic("shield", 12) + " Guardrail: " + esc(x.guard) + "</div></a>";
        }).join("") + "</div>";
    },
    mount(r) { if (r.q.new) ACT.newExp(); }
  });
  function expDetail(x) {
    const t = T[x.title];
    const days = Array.from({ length: 14 }, (_, i) => "Day " + (i + 1));
    const curve = (end, i) => +(end * (1 - Math.pow(1 - (i + 1) / 14, 1.7))).toFixed(4);
    const lines = Charts.withTable({ type: "lines", name: "Revenue per viewer", labels: days, fmt: x.a.v < 1 ? "usd2" : "n", series: [{ name: x.a.n, short: "A", color: "var(--deemph)", values: days.map((_, i) => curve(x.a.v, i)) }, { name: x.b.n, short: "B", color: "var(--s1)", values: days.map((_, i) => curve(x.b.v, i)) }], height: 240 });
    return '<div class="ph"><div class="t"><a class="backlink" href="#/paywall-lab">' + ic("back", 14, 2) + "Paywall Lab</a><h1>" + esc(x.name) + '</h1><p class="row" style="gap:8px;margin-top:6px">' + UI.pill(x.status) + "<span>" + esc(t.name) + " · " + x.traffic + " of new viewers · since " + x.started + "</span></p></div>" +
      '<div class="acts">' + (x.status === "Running" ? '<button class="b" data-act="toast:Extended by 7 days">Extend 7 days</button><button class="b" data-act="toast:Stopped — everyone back on A">Stop</button><button class="b pri" data-act="shipB:' + x.id + '">Ship B to everyone</button>' : '<button class="b" data-act="newExp">Run a follow-up</button>') + "</div></div>" +
      '<div class="grid g4">' + UI.stat({ l: x.metric + " · A", v: x.a.v < 1 ? "$" + x.a.v.toFixed(3) : String(x.a.v), d: esc(x.a.n) }) + UI.stat({ l: x.metric + " · B", v: x.b.v < 1 ? "$" + x.b.v.toFixed(3) : String(x.b.v), d: esc(x.b.n) }) + UI.stat({ l: "Lift", v: (x.lift >= 0 ? "+" : "") + FMT.pct(x.lift), d: "B vs A" }) + UI.stat({ l: "Confidence", v: Math.round(x.conf * 100) + "%", d: x.conf >= .95 ? "ready to decide" : "keep running" }) + "</div>" +
      '<div class="grid mt" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">' + UI.card("Cumulative " + x.metric.toLowerCase(), "Per viewer who reached the paywall, by day since first view", lines.html, { acts: lines.btn }) +
      UI.card("Guardrails", "Auto-stops if any goes red", [["Day-7 retention", "−0.4 pts", "Within ±1 pt", "ok"], ["Refund requests", "+0.02%", "Within +0.1%", "ok"], ["1–2★ reviews mentioning price", "+3", "Within +10", "ok"], ["Unlock sheet exits", "+1.8%", "Within +5%", "ok"]].map(([n, v, lim]) => '<div class="li" style="padding:10px 0"><span class="ic green">' + ic("check", 15) + '</span><div class="b2"><div class="t">' + n + '</div><div class="s">' + lim + "</div></div><b class=\"sm-t\">" + v + "</b></div>").join("") +
        '<div class="nt mt">' + ic("info", 16) + "<span>Price lock means viewers in B keep B's price even after the test ends.</span></div>") + "</div>";
  }
  ACT.shipB = () => Modal.open({ title: "Ship variant B", sub: "Applies to new viewers. Existing viewers keep their locked price.", body: '<div class="nt green">' + ic("checkc", 16) + "<span>94% confidence · guardrails green · +6.3% revenue per viewer.</span></div>", foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="shipGo">Ship</button>' });
  ACT.shipGo = () => { Modal.close(); toast("Shipped · paywall now at E8 for new viewers · logged"); };
  ACT.newExp = () => Modal.open({
    title: "New experiment", sub: "One variable at a time keeps results readable.", size: "lg",
    body: '<div class="form two"><div class="fld full"><label>Hypothesis</label><input class="inp" value="Moving the paywall to E8 raises revenue per viewer without hurting day-7 retention."></div>' +
      '<div class="fld"><label>Title</label><select class="sel"><option>The Heiress Returns</option><option>Moonbound</option><option>Glass Crown</option></select></div><div class="fld"><label>Variable</label><select class="sel"><option>Paywall position</option><option>Price per episode</option><option>Series Pass discount</option><option>Ad unlocks per day</option><option>Free episodes by region</option></select></div>' +
      '<div class="fld"><label>Variant B</label><input class="inp" value="Free E1–E7 (paywall at E8)"></div><div class="fld"><label>Traffic</label><select class="sel"><option>50 / 50 of new viewers</option><option>20 / 80</option></select></div>' +
      '<div class="fld"><label>Primary metric</label><select class="sel"><option>Revenue per viewer (14 d)</option><option>Unlock rate</option><option>Episodes per viewer</option></select></div><div class="fld"><label>Duration</label><input class="inp" value="14 days"></div>' +
      '<div class="fld full"><label>Guardrails (auto-stop)</label><div class="chipset">' + ["Day-7 retention ±1 pt", "Refunds +0.1%", "Price complaints +10", "Unlock exits +5%"].map(k => '<button class="tchip on" data-act="tchip">' + ic("check", 13, 2.4) + k + "</button>").join("") + "</div></div></div>",
    foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="expGo">Start experiment</button>'
  });
  ACT.expGo = () => { Modal.close(); toast("Experiment x-32 started · results after 3 days"); };

  /* =====================================================================
     TRANSACTIONS
     ===================================================================== */
  A.page("transactions", {
    title: () => "Transactions",
    crumbs: () => [["Money"], ["Transactions"]],
    render() {
      const f = st.txf || "all";
      const tx = st.tx || (st.tx = S.TXNS.map(t => Object.assign({}, t)));
      const list = tx.filter(t => (f === "all" || (f === "issues" ? ["Refunded", "Chargeback", "Delivery retried", "Pending"].indexOf(t.status) >= 0 : t.kind === f)) && (st.region === "All" || t.region === st.region));
      return UI.ph("Transactions", "Every purchase across Google Play, the App Store and web checkout. Receipts are verified on the server before coins land.",
        '<button class="b" data-act="toast:Export queued">' + ic("download", 15) + "Export</button>") +
        '<div class="grid g4" style="margin-bottom:16px">' + UI.stat({ l: "Gross today", icon: "receipt", v: "$412.6K", d: "8.2%", dir: "up", vs: "vs last Fri" }) + UI.stat({ l: "Refund rate", icon: "refresh", v: "0.6%", d: "0.1 pts", dir: "dn", good: false, vs: "30 days" }) + UI.stat({ l: "Chargebacks", icon: "alert", v: "3", d: "this week" }) + UI.stat({ l: "Deliveries auto-retried", icon: "zap", v: "1", d: "0 still missing" }) + "</div>" +
        '<section class="card"><div class="tbar">' + UI.segc([["all", "All"], ["coins", "Coins"], ["vip", "VIP"], ["pass", "Passes"], ["issues", "Needs attention"]], f, "txf") + '<span class="sp"></span><span class="xs-t t3">' + list.length + " shown · newest first</span></div>" +
        '<div class="tblwrap"><table class="tbl"><thead><tr><th>ID</th><th>User</th><th>Item</th><th>Store</th><th class="r">Amount</th><th>Status</th><th>Receipt</th><th>When</th></tr></thead><tbody>' +
        list.map(t => '<tr class="clickable" data-act="txOpen:' + t.id + '"><td class="mono xs-t">' + t.id + '</td><td><a href="#/users/' + t.user + '" style="color:inherit;text-decoration:none"><b>' + esc(t.userName) + '</b></a> <span class="xs-t t3">' + t.region + "</span></td><td>" + esc(t.item) + '</td><td class="t2">' + esc(t.store) + '</td><td class="r"><b>' + FMT.usd(t.amount) + "</b></td><td>" + UI.pill(t.status) + "</td><td>" + (t.verified ? '<span class="pill green">' + ic("shieldc", 12) + "Verified</span>" : '<span class="pill amber">Awaiting store</span>') + '</td><td class="t2 nowrap">' + esc(t.when) + "</td></tr>").join("") + "</tbody></table></div></section>";
    }
  });
  ACT.txf = (el, k) => { st.txf = k; A.rerender(); };
  ACT.txOpen = (el, id) => {
    const t = st.tx.find(x => x.id === id);
    Drawer.open({
      title: id + " · " + esc(t.item),
      body: '<dl class="kvs"><dt>User</dt><dd>' + esc(t.userName) + " (" + t.user + ")</dd><dt>Amount</dt><dd>" + FMT.usd(t.amount) + "</dd><dt>Store</dt><dd>" + esc(t.store) + "</dd><dt>Status</dt><dd>" + UI.pill(t.status) + '</dd><dt>Order</dt><dd class="mono xs-t">GPA.3381-' + id.slice(2) + "</dd><dt>When</dt><dd>" + esc(t.when) + "</dd></dl>" +
        '<div class="lbl" style="margin:18px 0 8px">Verification</div>' + [["Receipt signature valid", "ok"], ["Purchase token unused (no replay)", "ok"], ["Coins delivered to the ledger", t.status === "Delivery retried" ? "warn" : "ok"], ["Store notification received", "ok"]].map(([n, s]) => '<div class="li" style="padding:8px 0"><span class="ic ' + (s === "ok" ? "green" : "amber") + '">' + ic(s === "ok" ? "check" : "refresh", 15) + '</span><div class="b2"><div class="t">' + n + "</div>" + (s === "warn" ? '<div class="s">First attempt timed out · retried after 4 s · delivered</div>' : "") + "</div></div>").join("") +
        '<div class="lbl" style="margin:18px 0 8px">Ledger rows</div><div class="nt mono" style="font-size:12px">L-' + (90000 + parseInt(id.slice(-3), 10)) + " · +" + (t.kind === "coins" ? "1,000 paid +200 bonus" : t.kind === "vip" ? "VIP entitlement" : "Series Pass") + "</div>",
      foot: t.status === "Refunded" ? '<span class="xs-t t3">Refunded · reversal entry written</span>' : '<button class="b" data-act="dclose">Close</button><span class="sp"></span><button class="b danger" data-act="refund:' + id + '">Refund…</button>'
    });
  };
  ACT.refund = (el, id) => Modal.open({
    title: "Refund " + id, sub: "Refunds go back through the original store. A reversal entry is written to the viewer's ledger.",
    body: '<div class="form"><div class="fld"><label>Reason</label><select class="sel"><option>Charged twice</option><option>Coins not delivered</option><option>Accidental purchase</option><option>Subscription not wanted</option></select></div>' +
      '<div class="nt">' + ic("info", 16) + "<span>Reversal preview: <b>−1,000 paid, −200 bonus</b>. If the viewer already spent them, their balance can go negative; new unlocks are blocked until topped up.</span></div></div>",
    foot: '<button class="b" data-act="mclose">Cancel</button><button class="b danger solid" data-act="refundGo:' + id + '">Refund</button>'
  });
  ACT.refundGo = (el, id) => { const t = st.tx && st.tx.find(x => x.id === id); if (t) t.status = "Refunded"; Modal.close(); Drawer.close(); toast("Refund issued · reversal entry written · viewer notified"); A.rerender(); };

  /* =====================================================================
     ANALYTICS
     ===================================================================== */
  A.page("analytics", {
    title: () => "Analytics",
    crumbs: () => [["Insights"], ["Analytics"]],
    render(r) {
      const tab = r.q.tab || "audience";
      const s = S.SERIES;
      let body = "";
      if (tab === "audience") {
        const dau = Charts.withTable({ type: "area", name: "Daily active viewers", labels: s.dates, values: s.dau, fmt: "n", height: 220 });
        const src = Charts.withTable({ type: "hbars", name: "New viewers", fmt: "pct0", labelW: 150, items: [["Meta ads", .34], ["TikTok ads", .22], ["SEO series pages", .14], ["Fan Links", .11], ["Google App campaigns", .09], ["Cliffhanger gifts", .07], ["Other", .03]].map(([l, v]) => ({ label: l, value: v })) });
        body = '<div class="grid g4">' + UI.stat({ l: "Daily active viewers", v: "1.84M", d: "6.2%", dir: "up" }) + UI.stat({ l: "Monthly viewers", v: "9.7M", d: "11%", dir: "up" }) + UI.stat({ l: "Stickiness · DAU/MAU", v: "19%", d: "1.2 pts", dir: "up" }) + UI.stat({ l: "Watch time per viewer", v: "26 min", d: "vs 25 min category" }) + "</div>" +
          '<div class="grid mt" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">' + UI.card("Daily active viewers", "Last 30 days", dau.html, { acts: dau.btn }) + UI.card("Where new viewers come from", "Last 30 days", src.html, { acts: src.btn }) + "</div>" +
          '<div class="mt">' + UI.card("Retention by install week", "Share of each week's new viewers still watching n weeks later", '<div class="tblwrap">' + heatmap(S.COHORTS, 8) + "</div>") + "</div>";
      } else if (tab === "content") {
        const wt = Charts.withTable({ type: "hbars", name: "Watch hours", fmt: "n", labelW: 210, items: S.TITLES.filter(t => t.kind === "drama").sort((a, b) => b.views - a.views).slice(0, 8).map(t => ({ label: t.name, value: Math.round(t.views * t.avgLen / 3600 / 30) })) });
        const drop = Charts.withTable({ type: "cols", name: "Kept vs E1 starters", labels: S.DROPOFF.map((_, i) => "E" + (i + 1)), values: S.DROPOFF, fmt: "pct0", emphasis: 7, label: [0, 7, 23], height: 220, annotate: { i: 7, t: "Paywall · E8", s: "−36% vs E7" } });
        body = '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">' + UI.card("Most watched dramas", "Watch hours per day, last 30 days", wt.html, { acts: wt.btn }) + UI.card("Drop-off · The Heiress Returns", "Share of E1 starters who started each episode", drop.html, { acts: drop.btn }) + "</div>" +
          '<div class="grid g2 mt">' + UI.card("Top Scene Search queries", "What viewers describe when they can't remember a title", ["the slap at the gala", "she reveals she's the heiress", "wolf howling first time", "wedding ring in the river", "ceo finds out about twins"].map((q, i) => '<div class="li"><span class="ic violet">' + ic("sparkle", 15) + '</span><div class="b2"><div class="t">' + esc(q) + '</div><div class="s">' + FMT.n([18200, 9400, 6100, 4800, 3900][i]) + " searches · " + [92, 88, 81, 77, 90][i] + "% opened a result</div></div></div>").join(""), { flush: true }) +
          UI.card("Cliffhanger Calls", "Predictions at episode ends", '<dl class="kvs"><dt>Calls this week</dt><dd>1.2M</dd><dt>Viewers who return for the reveal</dt><dd>68%</dd><dt>…vs those who skip the call</dt><dd>41%</dd><dt>Coins paid for correct calls</dt><dd>2.9M bonus</dd></dl>') + "</div>";
      } else if (tab === "revenue") {
        const coins = s.coins.map((v, i) => v + s.web[i]);
        const st2 = Charts.withTable({ type: "stack", name: "Revenue by source", labels: s.dates, fmt: "usd", height: 250, series: [{ name: "Coins & passes", short: "Coins", color: "var(--s1)", values: coins }, { name: "VIP subscriptions", short: "VIP", color: "var(--s2)", values: s.vip }, { name: "Ads", short: "Ads", color: "var(--s3)", values: s.ads }] });
        const arp = Charts.withTable({ type: "hbars", name: "ARPDAU", fmt: "usd2", labelW: 130, items: Object.values(S.REGIONS).sort((a, b) => b.arpdau - a.arpdau).map(r => ({ label: r.name, value: r.arpdau, sub: UI.modeLabel(r.mode) })) });
        const fun = Charts.withTable({ type: "funnel", name: "Paywall funnel", fmt: "n", items: S.FUNNEL.map(f => ({ label: f.k, value: f.v })) });
        body = '<div class="grid g4">' + UI.stat({ l: "Revenue · 30 days", v: "$9.9M", d: "18.4%", dir: "up" }) + UI.stat({ l: "ARPDAU", v: "$0.183", d: "3.1%", dir: "up" }) + UI.stat({ l: "Paying viewers", v: "4.1%", d: "of monthly viewers" }) + UI.stat({ l: "Web checkout share", v: "2.3%", d: "of coin revenue" }) + "</div>" +
          '<div class="mt">' + UI.card("Revenue by source", "Daily, last 30 days", st2.html, { acts: st2.btn }) + "</div>" +
          '<div class="grid g2 mt">' + UI.card("Revenue per daily viewer, by region", "India runs ads-first by design", arp.html, { acts: arp.btn }) + UI.card("Paywall funnel", "Last 30 days", fun.html, { acts: fun.btn }) + "</div>";
      } else {
        const up = Charts.withTable({ type: "area", name: "Creator uploads", labels: s.dates, values: s.dates.map((_, i) => Math.round(3900 + i * 32 + Math.sin(i) * 300)), fmt: "n", height: 200 });
        body = '<div class="grid g4">' + UI.stat({ l: "Creators posting", v: "28.4K", d: "14%", dir: "up" }) + UI.stat({ l: "Fan Link unlocks", v: "61.4K", d: "22%", dir: "up" }) + UI.stat({ l: "Paid to creators · 30d", v: "$48.2K", d: "62 creators" }) + UI.stat({ l: "Pilot votes", v: "26.9K", d: "41%", dir: "up" }) + "</div>" +
          '<div class="mt">' + UI.card("Creator uploads per day", "Last 30 days", up.html, { acts: up.btn }) + "</div>";
      }
      return UI.ph("Analytics", "One date range and region apply to every chart on the page.", UI.segc([["30", "Last 30 days"], ["7", "Last 7 days"], ["90", "Last 90 days"]], "30", "noop") + '<button class="b" data-act="toast:Scheduled weekly report for Monday 9 AM">' + ic("mail", 15) + "Schedule report</button>") +
        UI.tabs([["audience", "Audience"], ["content", "Content"], ["revenue", "Revenue"], ["creators", "Creators"]], tab, "analytics") + body;
    }
  });

  /* =====================================================================
     SETTINGS
     ===================================================================== */
  const SECTIONS = [["branding", "Branding", "sparkle"], ["regions", "Regions & languages", "globe"], ["payments", "Payments", "card"], ["storage", "Storage & CDN", "cloud"], ["video", "Video pipeline", "film"], ["signin", "Sign-in", "key"], ["apps", "App versions", "phone"], ["legal", "Legal pages", "shield"], ["notifications", "Notifications", "bell"], ["api", "API & webhooks", "code"]];
  A.page("settings", {
    title: () => "Settings",
    crumbs: r => [["System"], ["Settings"], [(SECTIONS.find(x => x[0] === (r.q.s || "branding")) || SECTIONS[0])[1]]],
    render(r) {
      const s = r.q.s || "branding";
      return UI.ph("Settings", "Everything an operator configures without touching code.", "") +
        '<div class="grid" style="grid-template-columns:220px minmax(0,1fr);align-items:start"><nav class="subnav">' + SECTIONS.map(([k, n, i]) => '<a class="' + (k === s ? "on" : "") + '" href="#/settings?s=' + k + '">' + ic(i, 16) + n + "</a>").join("") + "</nav><div>" + settingsBody(s) + "</div></div>";
    }
  });
  function settingsBody(s) {
    if (s === "branding") {
      const acc = st.brandAcc || document.documentElement.dataset.accent || "lime";
      return '<div class="split" style="--side:300px"><div class="stack">' + UI.card("Identity", "", '<div class="form two"><div class="fld"><label>App name</label><input class="inp" id="bName" value="Spool"></div><div class="fld"><label>Tagline</label><input class="inp" value="' + esc(S.BRAND.tagline) + '"></div>' +
        '<div class="fld"><label>Logo</label><div class="row"><span class="mark" style="--s:40px">' + brandMark(28) + '</span><button class="b sm">' + ic("upload", 14) + 'Upload SVG</button></div></div><div class="fld"><label>Wordmark font</label><select class="sel"><option>Instrument Serif Italic</option><option>Geist Bold</option></select></div></div>') +
        UI.card("Accent colour", "One token recolours buttons, progress, selection and highlights in the app, web and this panel", '<div class="row" style="gap:10px">' + [["lime", "#C9F04F", "Greenlight (default)"], ["ember", "#FF6A45", "Ember"], ["iris", "#9C8CFF", "Iris"], ["rose", "#FF7FA6", "Rosé"], ["aqua", "#46DDD3", "Aqua"]].map(([k, c, n]) => '<button class="swatch' + (acc === k ? " on" : "") + '" style="background:' + c + '" title="' + n + '" data-act="brandAcc:' + k + '"></button>').join("") + "</div>" +
          '<div class="nt mt">' + ic("info", 16) + "<span>Text on the accent is always ink, so every option passes contrast. Data charts keep their own palette — the accent is for actions, not data.</span></div>") + "</div>" +
        '<div class="stack" style="position:sticky;top:80px">' + UI.card("Preview", "", '<div data-accent="' + acc + '"><div class="mini-phone" style="--pw:240px"><div class="scr"><div class="isl"></div><div style="padding:38px 12px 0"><div style="display:flex;align-items:center;gap:8px"><span class="serif-i" style="font-size:22px" id="bPrev">spool</span><span style="margin-left:auto;font-size:9px;padding:3px 7px;border-radius:999px;background:rgba(242,194,91,.12);color:var(--gold);font-weight:700">310</span></div>' +
          '<div style="margin-top:10px;border-radius:14px;overflow:hidden;position:relative;height:190px"><img src="' + Art.poster(T.heiress) + '" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.9))"></div><div class="serif-i" style="position:absolute;left:12px;bottom:40px;font-size:22px;line-height:.9">The Heiress Returns</div><div style="position:absolute;left:12px;bottom:10px;height:22px;padding:0 10px;border-radius:7px;background:var(--accent);color:var(--accent-ink);font-size:10px;font-weight:700;display:grid;place-items:center">▶ Continue E7</div></div>' +
          '<div style="margin-top:12px;height:4px;border-radius:4px;background:#27272B;overflow:hidden"><i style="display:block;width:62%;height:100%;background:var(--accent)"></i></div>' +
          '<div style="margin-top:12px;padding:10px;border-radius:12px;border:1.5px solid var(--accent);background:rgba(var(--accent-rgb),.07);font-size:10px"><b>Unlock with coins</b><div style="color:#7D7B74;margin-top:2px">60 coins · ≈ $0.59</div></div>' +
          '<div style="margin-top:10px;height:30px;border-radius:9px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:11px;font-weight:700">Unlock E8 · 60 coins</div></div></div></div></div>', { acts: '<a class="b sm" href="mobile.html" target="_blank" rel="noopener">Open app ' + ic("external", 12) + "</a>" }) + "</div></div>";
    }
    if (s === "payments") return UI.card("Payment gateways", "In-app purchases go through the stores; web checkout uses these", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Gateway</th><th>Type</th><th>Regions</th><th>Notes</th><th>On</th></tr></thead><tbody>' + S.GATEWAYS.map(g => "<tr><td><b>" + esc(g.name) + '</b></td><td><span class="pill">' + g.kind + '</span></td><td class="t2">' + esc(g.regions) + '</td><td class="t2 sm-t">' + esc(g.note) + "</td><td>" + UI.tog(g.on, "flip", g.name) + "</td></tr>").join("") + "</tbody></table></div>", { flush: true }) +
      '<div class="mt">' + UI.card("Webhooks", "Verified before any coins move", [["Google Play real-time developer notifications", "Active"], ["App Store Server Notifications v2", "Active"], ["Stripe", "Active"], ["Razorpay", "Active"]].map(([n, s2]) => '<div class="li" style="padding:9px 0"><span class="ic green">' + ic("shieldc", 15) + '</span><div class="b2"><div class="t">' + n + '</div><div class="s">Signature checked · idempotent</div></div>' + UI.pill(s2 === "Active" ? "Live" : s2) + "</div>").join("")) + "</div>";
    if (s === "storage") return UI.card("Storage provider", "Pluggable — buyers bring their own", '<div class="grid g3">' + [["Local disk", "Small catalogues"], ["Amazon S3", ""], ["Cloudflare R2", "No egress fees · selected"], ["Wasabi", ""], ["DigitalOcean Spaces", ""], ["Bunny Storage", ""]].map(([n, d], i) => '<button class="card pad" style="text-align:left;border-color:' + (i === 2 ? "var(--text)" : "var(--line)") + '"><b>' + n + '</b><div class="xs-t t3" style="margin-top:4px">' + (d || "&nbsp;") + "</div></button>").join("") + "</div>") +
      '<div class="grid g2 mt">' + UI.card("CDN", "", '<div class="form"><div class="fld"><label>Provider</label><select class="sel"><option>Bunny CDN</option><option>Cloudflare</option><option>CloudFront</option></select></div><div class="fld"><label>Signed URL lifetime</label><input class="inp" value="300 seconds"></div></div>') + UI.card("Usage", "", '<dl class="kvs"><dt>Stored</dt><dd>18.4 TB</dd><dt>Egress this month</dt><dd>412 TB</dd><dt>Cache hit</dt><dd>97.8%</dd></dl>') + "</div>";
    if (s === "video") return UI.card("Renditions", "HLS ladder per orientation", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Rendition</th><th>9:16 size</th><th>16:9 size</th><th class="r">Bitrate</th><th>Who gets it</th></tr></thead><tbody>' + [["240p", "240×426", "426×240", "350 kbps", "First segment · data saver"], ["360p", "360×640", "640×360", "700 kbps", "Everyone"], ["540p", "540×960", "960×540", "1.4 Mbps", "Everyone"], ["720p", "720×1280", "1280×720", "2.4 Mbps", "Everyone"], ["1080p", "1080×1920", "1920×1080", "4.5 Mbps", "VIP"]].map(r => "<tr>" + r.map((c, i) => '<td class="' + (i === 3 ? "r" : "") + '">' + c + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>", { flush: true }) +
      '<div class="grid g2 mt">' + UI.card("Playback protection", "", '<div class="row"><span class="sp"><b class="sm-t">Block screen recording (Android)</b></span>' + UI.tog(true, "flip", "Screen recording block") + '</div><div class="row mt"><span class="sp"><b class="sm-t">Detect capture (iOS)</b></span>' + UI.tog(true, "flip", "Capture detection") + '</div><div class="row mt"><span class="sp"><b class="sm-t">DRM (Widevine / FairPlay)</b><div class="xs-t t3">Phase 2</div></span><span class="pill">Planned</span></div>') + UI.card("Segments", "", '<dl class="kvs"><dt>Segment length</dt><dd>2 s</dd><dt>Preload next episode at</dt><dd>60% watched</dd><dt>Thumbnails</dt><dd>every 2 s</dd></dl>') + "</div>";
    if (s === "signin") return UI.card("Sign-in", "Guests can watch first; an account is asked for at the first purchase", [["Guest mode", true, "Watch without an account"], ["Apple", true, ""], ["Google", true, ""], ["Phone (OTP)", true, "Twilio · 40 countries"], ["Email magic link", false, ""], ["Require an account before the first purchase", true, "So coins and unlocks can be restored"]].map(([n, on, d]) => '<div class="li" style="padding:11px 0"><div class="b2"><div class="t">' + n + '</div><div class="s">' + d + "</div></div>" + UI.tog(on, "flip", n) + "</div>").join(""));
    if (s === "apps") return UI.card("App versions", "Force an update when an old build breaks something", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Platform</th><th>Latest</th><th>Minimum supported</th><th class="r">On latest</th><th>Force update</th></tr></thead><tbody>' + [["Android", "1.0.3", "1.0.0", "81%"], ["iOS", "1.0.3", "1.0.1", "88%"], ["Web", "1.0.3", "—", "100%"]].map(r => "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + '</td><td><input class="inp" style="width:100px;min-height:30px;height:30px" value="' + r[2] + '"></td><td class="r">' + r[3] + "</td><td>" + UI.tog(false, "flip", "Force update " + r[0]) + "</td></tr>").join("") + "</tbody></table></div>", { flush: true });
    if (s === "legal") return UI.card("Legal pages", "Shown in the app and on spool.tv", ["Terms of service", "Privacy policy", "Content licences & credits", "Refund policy", "Community guidelines", "Takedown requests (DMCA)"].map(n => '<div class="li" style="padding:10px 0"><span class="ic">' + ic("shield", 15) + '</span><div class="b2"><div class="t">' + n + '</div><div class="s">Updated 1 Oct 2026</div></div><button class="b sm">Edit</button></div>').join(""));
    if (s === "notifications") return UI.card("Push", "", '<div class="form two"><div class="fld"><label>Firebase (Android)</label><input class="inp mono" value="spool-prod · connected" readonly></div><div class="fld"><label>APNs (iOS)</label><input class="inp mono" value="Key ID 8XK2… · connected" readonly></div><div class="fld"><label>Maximum per viewer per day</label><input class="inp" value="3"></div><div class="fld"><label>Quiet hours</label><input class="inp" value="11 PM – 8 AM viewer time"></div></div>');
    if (s === "api") return UI.card("API keys", "One REST API for app, web and admin", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Name</th><th>Key</th><th>Created</th><th>Last used</th><th class="w0"></th></tr></thead><tbody>' + [["Mobile app", "pk_live_8f2c…a91d", "26 Aug", "now"], ["Web (Next.js)", "pk_live_31aa…7c02", "26 Aug", "now"], ["Analytics export", "sk_live_0d4e…19bb", "2 Sep", "3 h ago"]].map(r => "<tr><td><b>" + r[0] + '</b></td><td class="mono xs-t">' + r[1] + '</td><td class="t2">' + r[2] + '</td><td class="t2">' + r[3] + '</td><td><button class="b sm" data-act="toast:Key rotated · old key valid for 24 h">Rotate</button></td></tr>').join("") + "</tbody></table></div>", { flush: true });
    return UI.card("Regions & languages", "", '<div class="form two"><div class="fld"><label>Default region</label><select class="sel"><option>Detect from store country</option></select></div><div class="fld"><label>App languages</label><div class="chipset">' + ["English", "हिन्दी", "Español", "Português", "Bahasa", "Filipino", "Deutsch", "Français", "தமிழ்", "తెలుగు", "العربية", "Tiếng Việt", "ไทย", "한국어"].map(k => '<span class="tchip on">' + k + "</span>").join("") + '</div></div><div class="fld full"><label>Subtitle fallback</label><select class="sel"><option>English when a language is missing</option></select></div></div>') +
      '<div class="mt">' + UI.card("Per-region settings", "Prices, modes and ad caps live in Monetization", '<a class="b" href="#/monetization">Open Monetization › Regions</a>') + "</div>";
  }
  ACT.brandAcc = (el, k) => {
    st.brandAcc = k;
    if (k === "lime") delete document.documentElement.dataset.accent; else document.documentElement.dataset.accent = k;
    A.store.set("spool-accent", k);
    toast("Accent → " + k + " · the app prototype uses it too");
    A.rerender();
  };

  /* =====================================================================
     TEAM & ROLES, AUDIT LOG, LOGIN
     ===================================================================== */
  A.page("team", {
    title: () => "Team & roles",
    crumbs: () => [["System"], ["Team & roles"]],
    render() {
      return UI.ph("Team & roles", "Everyone gets the least access their job needs. Every change is in the audit log.", '<button class="b pri" data-act="invite">' + ic("userplus", 15) + "Invite</button>") +
        UI.card("Members", S.TEAM.length + " people", '<div class="tblwrap"><table class="tbl"><thead><tr><th>Member</th><th>Role</th><th>Last active</th><th>2FA</th><th class="w0"></th></tr></thead><tbody>' + S.TEAM.map(m => '<tr><td><div class="who">' + UI.ava("team" + m.id, 32, { kind: m.kind, hair: m.hair }) + "<div><b>" + esc(m.name) + "</b><small>" + esc(m.email) + '</small></div></div></td><td><select class="sel" style="width:auto;min-height:32px;height:32px">' + S.ROLES.map(r => "<option" + (r.k === m.role ? " selected" : "") + ">" + r.k + "</option>").join("") + '</select></td><td class="t2">' + esc(m.last) + '</td><td><span class="pill green">' + ic("check", 12) + 'On</span></td><td><button class="b sm ghost">' + ic("more", 16) + "</button></td></tr>").join("") + "</tbody></table></div>", { flush: true }) +
        '<div class="mt">' + UI.card("Permissions", "E = edit · V = view · — = no access", '<div class="tblwrap"><table class="tbl matrix"><thead><tr><th>Area</th>' + S.ROLES.map(r => '<th class="c">' + r.k + "</th>").join("") + "</tr></thead><tbody>" + S.PERMS.map(([n, p]) => "<tr><td><b>" + n + "</b></td>" + p.map(v => '<td class="c"><span class="perm ' + ["n", "v", "e"][v] + '">' + ["—", "V", "E"][v] + "</span></td>").join("") + "</tr>").join("") + "</tbody></table></div>", { flush: true }) + "</div>";
    }
  });
  ACT.invite = () => Modal.open({ title: "Invite a teammate", body: '<div class="form"><div class="fld"><label>Email</label><input class="inp" placeholder="name@company.com"></div><div class="fld"><label>Role</label><select class="sel">' + S.ROLES.map(r => "<option>" + r.k + "</option>").join("") + '</select><div class="hint">' + esc(S.ROLES[2].d) + "</div></div></div>", foot: '<button class="b" data-act="mclose">Cancel</button><button class="b pri" data-act="invGo">Send invite</button>' });
  ACT.invGo = () => { Modal.close(); toast("Invite sent · expires in 7 days"); };

  A.page("audit", {
    title: () => "Audit log",
    crumbs: () => [["System"], ["Audit log"]],
    render() {
      return UI.ph("Audit log", "Append-only. Who did what, to which record, and why. Kept for 2 years.", '<button class="b" data-act="toast:Export queued">' + ic("download", 15) + "Export</button>") +
        UI.card("", "", '<div class="tblwrap"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Detail</th></tr></thead><tbody>' + S.AUDIT.map(a => '<tr><td class="t2 nowrap">' + esc(a.when) + '</td><td><div class="who">' + (a.who === "System" ? '<span class="mark" style="--s:26px">' + brandMark(16) + "</span>" : UI.ava("team" + (S.TEAM.find(m => m.name === a.who) || { id: "x" }).id, 26, { kind: (S.TEAM.find(m => m.name === a.who) || {}).kind })) + "<b>" + esc(a.who) + "</b></div></td><td>" + esc(a.what) + "</td><td><b>" + esc(a.obj) + '</b></td><td class="t2 sm-t">' + esc(a.detail) + "</td></tr>").join("") + "</tbody></table></div>", { flush: true });
    }
  });

  A.page("login", {
    title: () => "Sign in",
    bare: true,
    render() {
      const ids = ["heiress", "moonbound", "crown", "divorce", "mafia", "rebirth", "contract", "sindoor", "twins", "bodyguard", "silent", "fake", "tenyears", "shaadi", "lastdelivery"];
      return '<div class="login"><div class="art"><div class="wall">' + ids.concat(ids).map(id => '<div class="poster"><img src="' + Art.poster(T[id]) + '" alt=""></div>').join("") + "</div>" +
        '<div class="row"><span class="mark" style="--s:34px">' + brandMark(24) + '</span><span class="wordmark" style="font-size:30px">spool</span><span class="pill solid" style="margin-left:6px">Studio</span></div>' +
        '<div><div class="serif-i" style="font-size:52px;line-height:.95;letter-spacing:-.02em;max-width:520px">Run the stories. Keep the prices fair.</div><p style="color:#B4B1A8;max-width:440px;margin-top:14px">Content, creators, moderation, money and analytics — one place for the whole platform.</p></div></div>' +
        '<div class="frm"><div><h1 style="margin:0;font-size:26px;letter-spacing:-.02em">Sign in to Studio</h1><p class="t3" style="margin:6px 0 24px">spool.tv · Production</p><div class="form"><div class="fld"><label>Work email</label><input class="inp" value="riya@spool.tv"></div><div class="fld"><label>Password</label><input class="inp" type="password" value="prototype"></div>' +
        '<a class="b pri" href="#/dashboard" style="height:42px">Sign in</a><button class="b" style="height:42px" data-act="toast:SSO is configured per workspace">' + ic("google", 16) + 'Continue with Google Workspace</button><div class="xs-t t3">Two-factor code is asked next. Sessions end after 12 hours.</div></div></div></div></div>';
    }
  });
})();
