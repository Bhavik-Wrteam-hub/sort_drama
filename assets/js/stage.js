/* ==========================================================================
   Spool — the stage around the phone
   --------------------------------------------------------------------------
   The phone is the centre. Around it:
     left   Journey (guided flows) · Screens (every screen, jumpable)
     right  Live events (what the app sends and records)
            On this screen (what to try + why it's designed that way)
            Scenario (persona, region, wallet, pushes, accent, speed)
   Connector lines run from the phone to each panel and pulse when that
   panel changes. Under 1180px the left panels move into a drawer; under
   900px all panels do; under 560px the phone fills the viewport.
   ========================================================================== */
(function () {
  "use strict";
  const A = window.App, S = window.SPOOL;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = A.esc;
  const FMT = S.FMT;
  const ic = window.ic;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  /* ---------------- research-backed notes per screen ---------------- */
  const SRC = s => '<span class="src">' + s + "</span>";
  const NOTES = {
    splash: { t: "Splash", d: "A short brand moment, then straight into choosing tropes. No account wall.",
      tries: [["auto", "Moves on to onboarding by itself"]],
      why: [["<b>No sign-up first.</b> The leaders let people watch before registering and ask for an account at the first purchase.", "ReelShort · DramaBox teardown"]] },
    onboard: { t: "Pick what hooks you", d: "Three or more tropes shape Home from the first session. Step 2 sets audio, subtitles and data saver.",
      tries: [["tap", "Toggle tropes · button counts down to 3"], ["→", "Continue to language", "go:onboard/lang"]],
      why: [["<b>Tropes, not genres.</b> Short-drama audiences search by trope; DramaWave and ShortMax expose trope filters.", "Play listings"], ["<b>Dubs are labelled “AI voice”.</b> Robotic dubbing and voice clones erode trust.", "H1 2026 AI drama roundup"], ["<b>Data saver at 240p.</b> FreeReels markets 240p playback for slow networks.", "Play listing"]] },
    signin: { t: "Save your progress", d: "Asked at the first purchase, not at launch. Guest history merges into the account.",
      tries: [["tap", "Continue with Apple or Google", "act:signedIn:Apple"]],
      why: [["<b>Link before paying.</b> Unlocks must follow the account to a new phone and the web.", "MVP research doc"], ["<b>In-app account deletion</b> is a store requirement and is in Settings.", "App Store / Play policy"]] },
    home: { t: "Home", d: "One clear decision at the top, then rows that each answer a different intent.",
      tries: [["swipe", "Swipe the hero carousel"], ["tap", "Fits your break · 5 / 15 / 30 min"], ["scroll", "Scroll down — the glass tab bar shrinks"], ["tap", "“Remind me” on a drop"], ["tap", "Switch to Series & films", "act:homeTab:series"]],
      why: [["<b>Drops row with Remind me.</b> ReelShort and NetShort both show coming-soon cards with reminders.", "Play screenshots"], ["<b>Top 10 by region.</b> Rankings are a top discovery surface in every leading app.", "DramaWave · ShortMax"], ["<b>Fits your break</b> builds a session that ends at a natural stop — no other app sizes a session to your time.", "Spool original"], ["<b>Creator rail with Fan Links</b> turns fan edits into a route to the drama.", "Spool original"]] },
    search: { t: "Search & Scene Search", d: "Normal search for titles, tropes and creators — plus Scene Search for describing a moment.",
      tries: [["tap", "Turn on Scene Search", "act:sceneSearch"], ["tap", "Try “the slap at the gala”", "act:sq:the slap at the gala"], ["tap", "Open a moment — the player jumps to it"]],
      why: [["<b>People remember scenes, not titles.</b> PineDrama reviewers couldn't find the show from an ad; describing the scene fixes that.", "Play reviews"], ["<b>Region-aware results.</b> Only episodes available in the viewer's region show.", "Licensing"]] },
    charts: { t: "Charts", d: "Ranked lists by period with movement, updated hourly per region.",
      tries: [["tap", "Switch Top today / Most saved / Complete"]],
      why: [["<b>Daily, weekly, monthly rankings</b> are standard in DramaWave and ReelShort.", "Play screenshots"]] },
    drops: { t: "Drops calendar", d: "A TV-style schedule for ongoing series, with reminders that are capped.",
      tries: [["tap", "Pick a day"], ["tap", "Filter to Following"], ["tap", "Remind me"]],
      why: [["<b>Never more than 3 alerts a day.</b> Retention comes from appointments, not spam — day-30 retention is only 2% in the category.", "Adjust 2026"]] },
    browse: { t: "Browse by trope", d: "The trope taxonomy is managed in the admin and drives rows, filters and Scene Search.",
      tries: [["tap", "Open any title"]], why: [["<b>Admin-managed taxonomy</b> means no app release to add a trope.", "Admin · Titles"]] },
    series: { t: "Series page", d: "Everything needed to decide: price to finish, what's free, languages, cast and reviews.",
      tries: [["tap", "Episode grid — locked episodes show the coin price"], ["tap", "Cast tab — who plays whom"], ["tap", "Reviews — weighted score"], ["tap", "Gift icon · Send a Cliffhanger"]],
      why: [["<b>Cost to finish, up front.</b> A FlexTV reviewer worked out ~$30 to finish one story — 157 people found it helpful.", "Play reviews"], ["<b>Price lock.</b> “The coin cost often increases with each new episode” is a top complaint.", "Sikayetvar · Play"], ["<b>Weighted ratings</b> stop three 5★ ratings outranking thousands of 4.6s.", "MVP research doc"]] },
    player: null, // computed — see playerNotes()
    landscape: { t: "Landscape player", d: "The same player for web series and films, at 16:9. The phone rotates.",
      tries: [["tap", "Skip intro"], ["tap", "Audio · subtitles · quality"], ["tap", "Next episode"], ["‹", "Back rotates the phone upright", "act:exitLand"]],
      why: [["<b>One content model for every format.</b> A film is a title with one episode; it uses the same wallet and paywall.", "MVP research doc"], ["<b>Mixed catalogues are normal now.</b> Netflix added a vertical feed; drama kits sell web series too.", "Netflix Clips · CodeCanyon"]] },
    scenes: { t: "Scenes", d: "A vertical feed of trailers, creator videos, clips and Pilot Season entries.",
      tries: [["swipe", "Swipe or scroll to the next item"], ["2× tap", "Double-tap to like"], ["tap", "Fan Link chip → straight into E1"], ["tap", "Pilots tab · vote “Want more”", "act:feedTab:pilots"]],
      why: [["<b>Netflix Clips</b> (Apr 2026) and <b>YouTube Shorts Series</b> (Sep 2026) prove clips and episodic creator shows sell long-form.", "Engadget · Tubefilter"], ["<b>Fan Links:</b> creators earn when their edit drives unlocks — fandom becomes acquisition.", "Spool original"], ["<b>Pilot Season</b> turns UGC into a pipeline of Originals, voted by viewers.", "Spool original"]] },
    creator: { t: "Creator profile", d: "Videos, series and pilots in one place, with follow and tip.",
      tries: [["tap", "Follow"], ["tap", "Tip (paid coins only)"], ["tap", "Series & pilots tab"]],
      why: [["<b>Tips only from paid coins</b> so promo coins can't be cashed out through a friend.", "Ledger rules"]] },
    create: { t: "Upload a video", d: "Three steps: what you're posting, details and rights, then a visible pipeline.",
      tries: [["tap", "Pick Video, Episode or Pilot"], ["tap", "Tag a drama (Fan Link)"], ["tap", "Tick the rights declaration to enable Post"]],
      why: [["<b>Rights before posting.</b> A rival author told buyers to cut films from video sites — the fastest route to store removal.", "CodeCanyon comments"], ["<b>Pilots get a human review</b> for rights, quality and age rating within 24 h.", "Moderation rules"], ["<b>Auto subtitles</b> reach more regions; YouTube's microdrama views grew 50%+ in H1 2026.", "YouTube"]] },
    studio: { t: "Creator Studio", d: "Earnings, Fan Link unlocks, upload status — and an exact reason when something needs changes.",
      tries: [["tap", "Start a pilot", "act:startPilot"], ["tap", "Fix on “Needs changes”"]],
      why: [["<b>Say exactly what's wrong</b> (clip runs 41 s, limit 30 s) instead of a vague rejection.", "Moderation UX"], ["<b>Payout at $50</b>, monthly — admin sets share and threshold.", "Admin · Creators"]] },
    library: { t: "Library", d: "Watching, My List, Drops, Unlocked and Downloads.",
      tries: [["tap", "Unlocked — every unlock is tied to the account"], ["tap", "Downloads (VIP)"]],
      why: [["<b>History and unlocks live on the server.</b> PineDrama reviewers lost their history after a restart.", "Play reviews"]] },
    inbox: { t: "Notifications", d: "Drops, replies, Cliffhanger Call results and money notices — capped and controllable.",
      tries: [["tap", "Open a notification"], ["tap", "Fire a push from Scenario →"]],
      why: [["<b>Money notices are never marketing.</b> Expiring bonus and renewal reminders are separate from offers.", "Fair-play defaults"]] },
    me: { t: "Profile", d: "Wallet split, VIP, rewards, studio and the spend guard in one place.",
      tries: [["tap", "Top up"], ["tap", "Go VIP"], ["tap", "Spend guard"]],
      why: [["<b>Paid and bonus shown separately</b> with the expiry date — 18% of 1–3★ reviews say paid coins vanished.", "Unstar analysis"]] },
    wallet: { t: "Wallet & ledger", d: "An append-only history: every coin in and out with the balance after it.",
      tries: [["tap", "Open any row for its reference"], ["tap", "Edit the spend guard"], ["tap", "Filter coins in / out"]],
      why: [["<b>Auditable ledger.</b> Coins that “vanished or would not restore” drive refunds and 1★ reviews.", "Unstar · Play reviews"], ["<b>Bonus first, earliest expiry first; paid never expires.</b>", "Ledger rules"]] },
    store: { t: "Top up", d: "Packs with the episode equivalent, the first-top-up offer once, and the store named before you tap.",
      tries: [["tap", "Pick a pack"], ["tap", "Buy → store confirmation → ledger row"]],
      why: [["<b>“≈ N episodes”</b> on every pack makes coins legible as money.", "Fair-play defaults"], ["<b>Receipts checked server-side.</b> A FlexTV reviewer was charged twice and got no coins.", "Play reviews"]] },
    vip: { t: "VIP", d: "One plan, no trial trap, renewal date before you pay and cancel in two taps.",
      tries: [["tap", "Pick a plan"], ["tap", "Start VIP"], ["tap", "Then try Cancel VIP"]],
      why: [["<b>No ₹1 trial that turns into ₹700.</b> Kuku TV and QuickTV reviews describe exactly that.", "Play reviews"], ["<b>Cancel in the app.</b> ReelShort and ShortMax reviewers couldn't find how to cancel.", "Play reviews"], ["<b>VIP means no paywalls.</b> A MoboReels reviewer paid $35/week and hit another paywall.", "Play reviews"]] },
    rewards: { t: "Rewards", d: "Daily check-in ladder, honest rewarded ads and simple tasks. All rewards are bonus coins.",
      tries: [["tap", "Check in", "act:checkin"], ["tap", "Watch an ad · try “Simulate a failed ad”"]],
      why: [["<b>1 ad = 1 reward, ≤ 30 s, never playable.</b> NetShort “2 ads” became six; DramaBox's playable ads bounced users to the Play Store.", "Play reviews (1,396 and 2,625 helpful)"], ["<b>Fair payouts.</b> GoodShort's 4 coins per ad drew 882 helpful votes in complaints.", "Play reviews"]] },
    settings: { t: "Settings", d: "Auto-unlock, data saver, purchase PIN, teen mode and in-app deletion.",
      tries: [["tap", "Turn on Auto-unlock — note the cap"]],
      why: [["<b>Auto-unlock is off by default.</b> “Autoplay charges the next episode without a confirmation tap.”", "Play review guide"], ["<b>VIP renewal reminders can't be turned off.</b>", "Fair-play defaults"]] }
  };
  function playerNotes(args) {
    const t = S.T[args[0]] || S.T.heiress, n = +args[1] || 1;
    const a = A.access(t, n);
    if (a === "locked") return { t: "Fair Unlock", d: "The paywall moment, designed to be the most honest screen in the app.",
      tries: [["tap", "Unlock with coins — watch the ledger events", "act:uoptGo:coins"], ["tap", "Watch 1 ad — then “Simulate a failed ad”"], ["tap", "Series Pass — all episodes, one price"], ["toggle", "Auto-unlock — only within your daily cap"], ["ctl", "Wallet → Low, then try again →"]],
      why: [["<b>The coin wall is the #1 complaint (29%).</b> So the price shows in coins <i>and</i> money, with the bonus/paid split.", "Unstar analysis"], ["<b>Ad unlocks that fail still unlock.</b> “The video keeps repeating the same part after watching ads” — 3,641 helpful.", "ReelShort Play review"], ["<b>Price lock</b> keeps the per-episode price fixed for this viewer.", "Spool original"]] };
    return { t: "Vertical player", d: "Full-screen 9:16 playback with the Pulse Bar, subtitles, a reaction rail and the Cliffhanger Call at the end.",
      tries: [["↑ ↓", "Swipe, scroll or arrow keys for next / previous episode"], ["tap", "Tap to pause · double-tap to like"], ["hold", "Long-press for 2× speed"], ["tap", "Pulse Bar emoji → jump to that moment"], ["→", "Jump to the cliffhanger", "act:seek:" + (S.SCRIPT[t.id + ":" + n] ? S.SCRIPT[t.id + ":" + n].dur - 8 : 70)], ["C · E", "Comments · Episodes"]],
      why: [["<b>Pulse Bar:</b> the progress bar shows where everyone reacted. PineDrama sells “react in real time”; we make it navigable.", "PineDrama listing"], ["<b>Preload at 60%</b> so the swipe to the next episode starts instantly.", "Player spec"], ["<b>Cliffhanger Call</b> keeps people coming back without a paywall — light, free, +5 coins if right.", "Spool original"], ["<b>Story Rewind</b> appears for returning viewers. Turn on “Returning” in Scenario.", "Spool original"]] };
  }
  NOTES.player = null;

  /* ---------------- journeys ---------------- */
  const FLOWS = [
    { id: "first", n: "First session as a guest", persona: "new", steps: [["splash", "Splash"], ["onboard", "Pick what hooks you", "No account needed"], ["onboard/lang", "Language & data saver"], ["home", "Home, shaped by the picks"], ["series/heiress", "Series page", "Cost to finish, up front"], ["player/heiress/1", "First episode", "Swipe hint, Pulse Bar"]] },
    { id: "paywall", n: "The paywall moment", persona: "fan", steps: [["player/heiress/7/62", "E7 · the gala", "Reaction peaks, subtitles"], ["@end", "Cliffhanger Call", "Predict the twist"], ["player/heiress/8", "E8 is locked", "The Fair Unlock sheet"], ["@unlock", "Unlock with coins", "Bonus first · ledger row"], ["wallet", "Wallet", "See exactly what was spent"]] },
    { id: "broke", n: "Out of coins", persona: "fan", wallet: "low", steps: [["player/heiress/8", "E8 locked, balance low"], ["@sheet:topup:heiress:8", "Top up from the paywall", "One step"], ["@buy", "Store confirmation", "Google Play sheet"], ["@pay", "Tap 1-tap buy", "Coins land, E8 unlocks itself"], ["wallet", "Wallet", "Top-up and unlock rows"]] },
    { id: "ads", n: "Free with ads · India", region: "IN", steps: [["home", "Home in India", "Hindi Originals first"], ["series/sindoor", "Sindoor Ka Badla", "15 free episodes"], ["player/sindoor/16", "E16 locked", "Ad is the default option"], ["@ad", "Watch 1 ad", "Try “Simulate a failed ad”"]] },
    { id: "return", n: "Coming back after 12 days", steps: [["@returning", "Mark as returning", "Scenario toggle"], ["@push:winback", "Win-back push arrives", "Cliffhanger offer"], ["@tappush", "Tap it", "E8 free, once per series"], ["@sheet:recap:heiress", "Story Rewind", "Previously on, 20 s"], ["@cast:heiress", "Cast", "Who plays whom"]] },
    { id: "creator", n: "Creator: post a video", steps: [["scenes", "Scenes feed"], ["create", "Create · pick a clip"], ["create/details", "Details, Fan Link, rights"], ["@post", "Post", "Watch the pipeline"], ["studio", "Creator Studio"]] },
    { id: "pilot", n: "Vote a pilot into production", steps: [["scenes/pilots", "Pilots feed"], ["series/lastdelivery", "Pilot page", "358 votes to go"], ["@vote:lastdelivery", "Want more"], ["@push:greenlit", "Greenlit push"]] },
    { id: "scene", n: "Find a scene by describing it", steps: [["search", "Search"], ["@scenesearch", "Scene Search on", "“the slap at the gala”"], ["player/heiress/7/40", "Player opens at 0:40"]] },
    { id: "vip", n: "Go VIP, fairly", steps: [["me", "Profile"], ["vip", "VIP plans", "Renewal date shown"], ["@buyvip", "Store confirmation"], ["@pay", "Tap 1-tap buy", "VIP on, no ads"], ["@push:renewal", "Renewal reminder", "24 h before"], ["@sheet:cancelVip", "Cancel in two taps"]] },
    { id: "daily", n: "Daily habit", steps: [["rewards", "Rewards"], ["@checkin", "Check in", "+15 bonus"], ["@adcoins", "Watch an ad", "+15 bonus"], ["wallet", "See the rows"]] },
    { id: "long", n: "Series & films", steps: [["home", "Home"], ["series/ledger", "Cold Ledger", "Web series"], ["landscape/ledger/1", "Landscape player", "The phone rotates"]] }
  ];
  let flow = FLOWS[0], stepIdx = -1;

  /* ---------------- device fit & rotation ---------------- */
  let SCALE = 1;
  function fit() {
    const dev = $("#device"), wrap = $("#deviceWrap"), center = $(".center");
    const land = dev.classList.contains("land");
    const natW = (land ? 844 : 390) + 26, natH = (land ? 390 : 844) + 26;
    if (window.innerWidth <= 560) { SCALE = 1; dev.style.transform = ""; wrap.style.width = ""; wrap.style.height = ""; return; }
    const stage = $("#stage");
    const sr = stage.getBoundingClientRect();
    const availH = sr.height - 36 - 44;
    let side = 0;
    $$(".orbit").forEach(o => { if (getComputedStyle(o).display !== "none") side += o.getBoundingClientRect().width + 40; });
    const availW = Math.max(300, sr.width - side - 40);
    SCALE = Math.min(1, availH / natH, availW / natW);
    dev.style.transform = "scale(" + SCALE + ")";
    wrap.style.width = natW * SCALE + "px";
    wrap.style.height = natH * SCALE + "px";
    requestAnimationFrame(drawLinks);
  }
  function rotate(on) {
    const dev = $("#device");
    if (dev.classList.contains("land") === !!on) return;
    dev.classList.toggle("land", !!on);
    A.log("view", on ? "orientation → <b>landscape</b>" : "orientation → <b>portrait</b>", "");
    fit();
    setTimeout(fit, 520);
  }

  /* ---------------- connectors ---------------- */
  function drawLinks() {
    const svg = $("#links");
    if (!svg || getComputedStyle(svg).display === "none") return;
    const stage = $("#stage").getBoundingClientRect();
    const dev = $("#device").getBoundingClientRect();
    let out = "";
    $$(".orbit .sat").forEach(sat => {
      if (sat.closest(".drawer") || !sat.offsetParent) return;
      const r = sat.getBoundingClientRect();
      const left = r.right < dev.left;
      const y = Math.max(dev.top + 70, Math.min(dev.bottom - 70, r.top + Math.min(r.height / 2, 60)));
      const x1 = (left ? dev.left - 6 : dev.right + 6) - stage.left, y1 = y - stage.top;
      const x2 = (left ? r.right : r.left) - stage.left, y2 = r.top + Math.min(r.height / 2, 60) - stage.top;
      const mx = (x1 + x2) / 2;
      out += '<path data-for="' + sat.id + '" d="M' + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2 + '"/>' +
        '<circle class="anchor" cx="' + x2 + '" cy="' + y2 + '" r="3.5"/><circle class="anchor" cx="' + x1 + '" cy="' + y1 + '" r="3"/>';
    });
    svg.innerHTML = out;
  }
  function pulse(id) {
    const sat = document.getElementById(id);
    if (sat) { sat.classList.add("flash"); clearTimeout(sat._ft); sat._ft = setTimeout(() => sat.classList.remove("flash"), 700); }
    const path = $('#links path[data-for="' + id + '"]');
    if (!path || !path.getTotalLength) return;
    const L = path.getTotalLength();
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("r", "4");
    $("#links").appendChild(dot);
    path.classList.add("hot");
    const t0 = performance.now();
    const step = ts => {
      const k = Math.min(1, (ts - t0) / 650);
      const p = path.getPointAtLength(L * k);
      dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
      if (k < 1) requestAnimationFrame(step);
      else { dot.remove(); path.classList.remove("hot"); }
    };
    requestAnimationFrame(step);
  }

  /* ---------------- panels ---------------- */
  function satHead(icon, title, sub, act) {
    return '<div class="sat-h" title="Click to collapse or expand"><span class="ic">' + ic(icon, 15) + '</span><div><h3>' + title + "</h3>" + (sub ? '<div class="sub">' + sub + "</div>" : "") + "</div>" + (act ? '<div class="act">' + act + "</div>" : "") +
      '<span class="chev">' + ic("down", 16, 2) + "</span></div>";
  }
  /* Panels collapse from their header; the choice is remembered per panel. */
  function wireCollapse() {
    $$(".sat").forEach(sat => {
      const saved = store.get("spool-sat-" + sat.id);
      const short = window.innerHeight < 960;
      if (saved === "1" || (saved == null && short && sat.id === "sat-scenario")) sat.classList.add("collapsed");
      sat.addEventListener("click", e => {
        const h = e.target.closest(".sat-h");
        if (!h || e.target.closest(".act")) return;
        sat.classList.toggle("collapsed");
        store.set("spool-sat-" + sat.id, sat.classList.contains("collapsed") ? "1" : "0");
        requestAnimationFrame(drawLinks);
      });
    });
  }
  function renderJourney() {
    const el = $("#sat-journey");
    el.innerHTML = satHead("compass", "Journey", flow.steps.length + " steps · guided") +
      '<div class="sat-b"><select class="flowpick" id="flowpick" aria-label="Choose a journey">' + FLOWS.map(f => '<option value="' + f.id + '"' + (f === flow ? " selected" : "") + ">" + esc(f.n) + "</option>").join("") + "</select>" +
      '<ol class="jsteps">' + flow.steps.map((s, i) => '<li class="' + (i < stepIdx ? "done" : i === stepIdx ? "now" : "") + '"><span class="d">' + (i < stepIdx ? "✓" : i + 1) + '</span><button data-step="' + i + '">' + esc(s[1]) + (s[2] ? "<small>" + esc(s[2]) + "</small>" : "") + "</button></li>").join("") + "</ol>" +
      '<button class="jnext" id="jnext">' + (stepIdx < 0 ? "Start journey" : stepIdx >= flow.steps.length - 1 ? "Restart journey" : "Next step") + ic("arrowr", 14, 2.2) + "</button></div>";
    $("#flowpick", el).onchange = e => { flow = FLOWS.find(f => f.id === e.target.value); stepIdx = -1; renderJourney(); runStep(0); };
    $$("[data-step]", el).forEach(b => b.onclick = () => runStep(+b.dataset.step));
    $("#jnext", el).onclick = () => runStep(stepIdx >= flow.steps.length - 1 ? 0 : stepIdx + 1);
  }
  function cleanOverlays() {
    A.Sheet.close(true);
    $$(".adov").forEach(o => o.remove());
    const p = $("#push"); if (p) p.classList.remove("on");
  }
  function runStep(i) {
    if (flow.steps[i][0] !== "@pay") cleanOverlays();
    if (i === 0) {
      setPersona(flow.persona || "fan", true);
      setRegion(flow.region || "US", true);
      if (flow.wallet) setWallet(flow.wallet, true);
    }
    stepIdx = i;
    const s = flow.steps[i][0];
    A.log("view", "journey · <b>" + esc(flow.n) + "</b> · step " + (i + 1), flow.steps[i][1]);
    if (s[0] !== "@") {
      if (s === "home" || s === "scenes" || s === "library" || s === "me") A.tab(s); else A.go(s);
    } else doAction(s.slice(1));
    renderJourney();
    pulse("sat-journey");
  }
  function doAction(a) {
    const [k, ...args] = a.split(":");
    const Sh = A.Sheet;
    if (k === "end") { const P = A.Player; if (P.el) P.seek(P.sc.dur - 3); }
    else if (k === "unlock") { A.st.uopt = "coins"; if (Sh.kind !== "unlock") Sh.open("unlock", "heiress", 8); setTimeout(() => A.ACT.doUnlock(null, "heiress", 8), 450); }
    else if (k === "sheet") Sh.open.apply(null, args);
    else if (k === "cast") A.ACT.castGo(null, args[0]);
    else if (k === "buy") A.ACT.quickBuy(null, "p1000", "heiress", "8");
    else if (k === "ad") { A.st.uopt = "ad"; if (Sh.kind !== "unlock") Sh.open("unlock", "sindoor", 16); setTimeout(() => A.ACT.doUnlock(null, "sindoor", 16), 450); }
    else if (k === "returning") { A.st.returning = true; renderScenario(); A.toast("Viewer marked as returning after 12 days", "history"); }
    else if (k === "push") firePush(args[0]);
    else if (k === "tappush") { const p = $("#push"); if (!p.classList.contains("on")) firePush("winback"); setTimeout(() => p.click(), 300); }
    else if (k === "pay") { A.ACT.payConfirm(document.getElementById("paybtn") || document.createElement("button")); }
    else if (k === "post") { const b = $('[data-act="postUpload"]'); if (A.st.draft) { A.st.draft.rights = true; } A.ACT.postUpload(); if (b) b.disabled = false; }
    else if (k === "vote") A.ACT.vote(null, args[0]);
    else if (k === "scenesearch") { A.st.sceneSearch = false; A.ACT.sceneSearch(); }
    else if (k === "buyvip") A.purchase("vip", "week", null);
    else if (k === "checkin") { if (!A.st.checkedInToday) A.ACT.checkin(); }
    else if (k === "adcoins") A.ACT.adCoins();
  }
  A.ACT.uoptGo = (el, k) => { A.st.uopt = k; const c = A.current(); if (A.Sheet.kind === "unlock") A.Sheet.refresh(); else if (c && c.name === "player") A.Sheet.open("unlock", c.args[0], c.args[1]); };

  function renderScreens(filter) {
    const el = $("#sat-screens");
    const cur = A.current() ? A.current().path : "";
    const f = (filter || "").toLowerCase();
    const extras = [{ g: "Sheets & overlays", items: [["@sheet:unlock:heiress:8", "Fair Unlock sheet"], ["@sheet:topup:heiress:8", "Top up from paywall"], ["@sheet:recap:heiress", "Story Rewind"], ["@sheet:comments:heiress:7", "Comments by moment"], ["@sheet:share:heiress:8", "Send a Cliffhanger"], ["@sheet:guard", "Spend guard"], ["@adcoins", "Rewarded ad (honest)"]] }];
    const groups = S.SITEMAP.mobile.concat(extras);
    const count = groups.reduce((a, g) => a + g.items.length, 0);
    el.innerHTML = satHead("grid", "Screens", count + " screens & sheets") +
      '<div class="sat-b"><input class="sfind" id="sfind" placeholder="Filter screens…" value="' + esc(filter || "") + '">' +
      groups.map(g => {
        const items = g.items.filter(([p, n]) => !f || n.toLowerCase().indexOf(f) >= 0 || p.indexOf(f) >= 0);
        if (!items.length) return "";
        return '<div class="sgroup"><h4>' + esc(g.g) + "</h4>" + items.map(([p, n]) => '<button class="slink' + (p === cur ? " on" : "") + '" data-path="' + esc(p) + '">' + esc(n) + '<span class="r">' + esc(p[0] === "@" ? "sheet" : "/" + p.split("/")[0]) + "</span></button>").join("") + "</div>";
      }).join("") + "</div>";
    const inp = $("#sfind", el);
    inp.oninput = () => { const pos = inp.selectionStart; renderScreens(inp.value); const n = $("#sfind"); n.focus(); n.setSelectionRange(pos, pos); };
    $$("[data-path]", el).forEach(b => b.onclick = () => openPath(b.dataset.path));
  }
  function openPath(p) {
    if (p[0] === "@") { doAction(p.slice(1)); return; }
    if (["home", "scenes", "library", "me"].indexOf(p) >= 0) A.tab(p); else A.go(p);
  }

  /* live events */
  const EVENTS = [];
  let evFilter = "all";
  const KINDS = { all: "All", track: "Analytics", ledger: "Ledger", api: "API", push: "Push", view: "Views" };
  function renderEvents() {
    const el = $("#sat-events");
    el.innerHTML = satHead("activity", "Live events", "What the app sends and records", '<button id="evclear" type="button">Clear</button>') +
      '<div class="evfilters">' + Object.keys(KINDS).map(k => '<button class="' + (k === evFilter ? "on" : "") + '" data-k="' + k + '">' + KINDS[k] + "</button>").join("") + "</div>" +
      '<div class="sat-b" id="evbody"><ul class="evlist" id="evlist"></ul></div>';
    $$(".evfilters button", el).forEach(b => b.onclick = () => { evFilter = b.dataset.k; renderEvents(); });
    $("#evclear", el).onclick = () => { EVENTS.length = 0; paintEvents(); };
    paintEvents();
  }
  function evRow(e) {
    const k = { track: "TRACK", ledger: "LEDGER", api: "API", push: "PUSH", view: "VIEW", ad: "AD", store: "STORE" }[e.kind] || e.kind.toUpperCase();
    return '<li class="ev"><span class="k k-' + e.kind + '">' + k + '</span><span class="m">' + e.msg + "</span>" + (e.detail ? '<span class="x">' + esc(e.detail) + "</span>" : "") + '<span class="tm">' + e.tm + "</span></li>";
  }
  function paintEvents() {
    const list = $("#evlist");
    if (!list) return;
    const rows = EVENTS.filter(e => evFilter === "all" || e.kind === evFilter || (evFilter === "api" && (e.kind === "store" || e.kind === "ad")));
    list.innerHTML = rows.length ? rows.slice(0, 80).map(evRow).join("") : '<li class="evempty">Interact with the phone — every event lands here.</li>';
  }
  const t0 = Date.now();
  function onLog(kind, msg, detail) {
    const s = Math.floor((Date.now() - t0) / 1000);
    const e = { kind: kind, msg: msg, detail: detail, tm: Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") };
    EVENTS.unshift(e);
    if (EVENTS.length > 200) EVENTS.pop();
    const list = $("#evlist");
    if (list && (evFilter === "all" || evFilter === kind)) {
      const empty = $(".evempty", list); if (empty) empty.remove();
      list.insertAdjacentHTML("afterbegin", evRow(e));
      while (list.children.length > 80) list.lastChild.remove();
    }
    if (kind !== "view") pulse("sat-events");
  }

  /* on this screen */
  function renderScreenNotes() {
    const c = A.current();
    const el = $("#sat-screen");
    if (!c) return;
    const n = c.name === "player" ? playerNotes(c.args) : NOTES[c.name] || { t: c.name, d: "", tries: [], why: [] };
    el.innerHTML = satHead("target", "On this screen", "Try it · and why it's built this way") +
      '<div class="sat-b"><div class="osh">' + esc(n.t) + '</div><p class="osd">' + esc(n.d) + "</p>" +
      (n.tries.length ? '<div class="oslabel">Try</div><div class="tries">' + n.tries.map(t => t[2] ? '<button class="try" data-do="' + esc(t[2]) + '"><span class="g">' + esc(t[0]) + "</span>" + esc(t[1]) + '<span class="go">Do it</span></button>' : '<div class="try"><span class="g">' + esc(t[0]) + "</span>" + esc(t[1]) + "</div>").join("") + "</div>" : "") +
      (n.why.length ? '<div class="oslabel">Why</div><ul class="whys">' + n.why.map(w => "<li>" + w[0] + SRC(esc(w[1])) + "</li>").join("") + "</ul>" : "") + "</div>";
    $$("[data-do]", el).forEach(b => b.onclick = () => {
      const d = b.dataset.do;
      if (d.indexOf("go:") === 0) A.go(d.slice(3));
      else if (d.indexOf("act:") === 0) { const a = d.slice(4).split(":"); const fn = A.ACT[a[0]]; if (fn) fn.apply(null, [null].concat(a.slice(1))); }
    });
  }

  /* scenario */
  const PUSHES = {
    drop: { title: "E23 of The Heiress Returns is out", body: "Ava faces the Lin board. Your reminder, as asked.", go: "series/heiress", icon: "calendar", payload: "campaign cp-3 · followed series · 1 of max 3 today" },
    winback: { title: "Who sent the text? 👀", body: "E8 of The Heiress Returns is free for you today.", go: "player/heiress/8", icon: "gift", payload: "campaign cp-1 Cliffhanger win-back · stopped at locked E8 > 24 h · offer once per series", after: () => { A.unlock("heiress", 8, "winback", true); A.toast("E8 is free for you · once per series", "gift"); A.go("player/heiress/8"); } },
    expiry: { title: "20 bonus coins expire tomorrow", body: "They're spent first on any episode. Paid coins never expire.", go: "wallet", icon: "hourglass", payload: "campaign cp-2 · 48 h before expiry · not marketing" },
    renewal: { title: "VIP renews tomorrow · $5.99", body: "Nothing to do if you're staying. Cancel in two taps.", go: "vip", icon: "crown", payload: "campaign cp-4 · required · cannot be disabled" },
    greenlit: { title: "The Last Delivery got greenlit 🎬", body: "You voted for it. Season 1 drops in December.", go: "series/lastdelivery", icon: "clapper", payload: "pilot lastdelivery · 10,000 votes · 81% finish rate" },
    reply: { title: "@mira.k replied to you", body: "“no way it's Celeste, she was on stage”", go: "player/heiress/7", icon: "comment", payload: "reply notification · in-app inbox too" }
  };
  function firePush(k) {
    const p = PUSHES[k];
    if (!p) return;
    const real = Object.assign({}, p);
    if (k === "winback") real.go = null;
    A.push(real);
    pulse("sat-scenario");
  }
  function setPersona(p, quiet) {
    A.reset(p);
    if (!quiet) {
      A.log("view", "scenario · persona → <b>" + p + "</b>", "");
      if (p === "new") A.go("onboard"); else A.tab("home");
    }
    renderScenario();
  }
  function setRegion(code, quiet) {
    A.st.region = code;
    A.log("api", "GET /v1/config?region=" + code + " · <b>200</b>", "mode=" + S.REGIONS[code].mode + " · ep price " + S.REGIONS[code].epPrice + " · free eps " + S.REGIONS[code].freeEps + " · ads/day " + S.REGIONS[code].adsPerDay);
    if (!quiet) { const c = A.current(); if (c && !c.def.noRefresh) A.refresh(); else if (c) A.replace(c.path); }
    renderScenario();
  }
  function setWallet(k, quiet) {
    const w = A.st.wallet;
    if (k === "plenty") { w.paid = 290; w.bonus = 20; }
    if (k === "low") { w.paid = 20; w.bonus = 0; }
    if (k === "empty") { w.paid = 0; w.bonus = 0; }
    if (k === "add") { A.credit(500, 0, "Support credit (test)", "Prototype control", "refund"); }
    A.log("ledger", "scenario · wallet → <b>" + w.paid + " paid · " + w.bonus + " bonus</b>", "prototype control, not a real ledger row");
    if (!quiet) { const c = A.current(); if (c && !c.def.noRefresh) A.refresh(); if (A.Sheet.kind) A.Sheet.refresh(); }
    renderScenario();
  }
  function renderScenario() {
    const el = $("#sat-scenario");
    const st = A.st;
    const seg = (name, cur, opts) => '<div class="segs" data-seg="' + name + '">' + opts.map(([v, l]) => '<button class="' + (String(cur) === String(v) ? "on" : "") + '" data-v="' + v + '">' + l + "</button>").join("") + "</div>";
    const wk = st.wallet.paid === 290 && st.wallet.bonus === 20 ? "plenty" : st.wallet.paid === 20 && st.wallet.bonus === 0 ? "low" : st.wallet.paid === 0 && st.wallet.bonus === 0 ? "empty" : "";
    const acc = document.documentElement.dataset.accent || "lime";
    const summary = { new: "New guest", fan: "Regular", vip: "VIP" }[st.persona] + " · " + st.region + " · " + FMT.int(st.wallet.paid + st.wallet.bonus) + " coins · " + st.demoSpeed + "×";
    el.innerHTML = satHead("sliders", "Scenario", el.classList.contains("collapsed") ? summary : "Change who's watching and what happens") +
      '<div class="sat-b"><div class="scen">' +
      '<div class="scen-row"><span>Viewer</span>' + seg("persona", st.persona, [["new", "New guest"], ["fan", "Regular"], ["vip", "VIP"]]) + "</div>" +
      '<div class="scen-row"><span>Region</span>' + seg("region", st.region, [["US", "US · hybrid"], ["IN", "India · ads"], ["BR", "Brazil"]]) + "</div>" +
      '<div class="scen-row"><span>Wallet</span>' + seg("wallet", wk, [["plenty", "310"], ["low", "20"], ["empty", "0"], ["add", "+500"]]) + "</div>" +
      '<div class="scen-row"><span>Returning</span>' + seg("returning", st.returning ? 1 : 0, [[0, "No"], [1, "After 12 days"]]) + "</div>" +
      '<div class="scen-row"><span>Speed</span>' + seg("speed", st.demoSpeed, [[1, "1×"], [3, "3× demo"], [6, "6×"]]) + "</div>" +
      '<div class="scen-row" style="align-items:start"><span style="padding-top:5px">Push</span><div class="pushes">' + [["drop", "New drop"], ["winback", "Win-back"], ["expiry", "Bonus expiring"], ["renewal", "VIP renewal"], ["greenlit", "Pilot greenlit"], ["reply", "Reply"]].map(([k, l]) => '<button data-push="' + k + '">' + ic("bell", 12) + l + "</button>").join("") + "</div></div>" +
      '<div class="scen-row"><span>Accent</span><div class="swatches">' + [["lime", "#C9F04F"], ["ember", "#FF6A45"], ["iris", "#9C8CFF"], ["rose", "#FF7FA6"], ["aqua", "#46DDD3"]].map(([k, c]) => '<button class="' + (acc === k ? "on" : "") + '" data-acc="' + k + '" title="' + k + '" style="background:' + c + '"></button>').join("") + '</div></div></div></div>';
    $$("[data-seg]", el).forEach(g => $$("button", g).forEach(b => b.onclick = () => {
      const v = b.dataset.v, k = g.dataset.seg;
      if (k === "persona") setPersona(v);
      else if (k === "region") setRegion(v);
      else if (k === "wallet") setWallet(v);
      else if (k === "returning") { st.returning = v === "1"; A.log("view", "scenario · returning viewer → <b>" + st.returning + "</b>", ""); const c = A.current(); if (c) A.replace(c.path); renderScenario(); }
      else if (k === "speed") { st.demoSpeed = +v; renderScenario(); }
      pulse("sat-scenario");
    }));
    $$("[data-push]", el).forEach(b => b.onclick = () => firePush(b.dataset.push));
    $$("[data-acc]", el).forEach(b => b.onclick = () => { setAccent(b.dataset.acc); renderScenario(); });
  }
  function setAccent(k) {
    if (k === "lime") delete document.documentElement.dataset.accent; else document.documentElement.dataset.accent = k;
    store.set("spool-accent", k);
    A.log("view", "white-label accent → <b>" + k + "</b>", "one token: --accent · admin › Settings › Branding");
  }

  /* ---------------- jump palette ---------------- */
  function jump() {
    if ($("#jumpov")) return;
    const ov = document.createElement("div");
    ov.id = "jumpov";
    ov.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.45);display:grid;place-items:start center;padding-top:12vh";
    const items = S.SITEMAP.mobile.reduce((a, g) => a.concat(g.items.map(i => [i[0], i[1], g.g])), []).concat(FLOWS.map(f => ["flow:" + f.id, "Journey · " + f.n, "Journeys"]));
    ov.innerHTML = '<div style="width:min(520px,92vw);background:var(--surface);border:1px solid var(--line-2);border-radius:16px;box-shadow:var(--shadow-3);overflow:hidden">' +
      '<input id="jq" placeholder="Jump to a screen or journey…" style="width:100%;height:52px;border:0;border-bottom:1px solid var(--line);background:transparent;padding:0 18px;font-size:15px;outline:none">' +
      '<div id="jl" style="max-height:52vh;overflow:auto;padding:6px"></div></div>';
    document.body.appendChild(ov);
    let sel = 0;
    const paint = () => {
      const q = $("#jq").value.toLowerCase();
      const list = items.filter(i => !q || (i[1] + i[0] + i[2]).toLowerCase().indexOf(q) >= 0);
      sel = Math.min(sel, Math.max(0, list.length - 1));
      $("#jl").innerHTML = list.map((i, k) => '<button data-p="' + esc(i[0]) + '" style="display:flex;width:100%;align-items:center;gap:10px;height:38px;padding:0 12px;border:0;border-radius:9px;background:' + (k === sel ? "var(--accent-soft)" : "none") + ';color:var(--text);font-size:13.5px;text-align:left"><span style="flex:1">' + esc(i[1]) + '</span><span style="font-size:11px;color:var(--text-3)">' + esc(i[2]) + "</span></button>").join("");
      $$("#jl button").forEach(b => b.onclick = () => pick(b.dataset.p));
      return list;
    };
    const close = () => ov.remove();
    const pick = p => { close(); if (p.indexOf("flow:") === 0) { flow = FLOWS.find(f => f.id === p.slice(5)); stepIdx = -1; renderJourney(); runStep(0); } else openPath(p); };
    ov.onclick = e => { if (e.target === ov) close(); };
    $("#jq").oninput = () => { sel = 0; paint(); };
    $("#jq").onkeydown = e => {
      const list = paint();
      if (e.key === "ArrowDown") { sel = Math.min(list.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === "Enter" && list[sel]) pick(list[sel][0]);
      else if (e.key === "Escape") close();
    };
    paint();
    $("#jq").focus();
  }

  /* ---------------- drawer (narrow canvases) ---------------- */
  const DTABS = [["sat-journey", "Journey"], ["sat-screens", "Screens"], ["sat-events", "Events"], ["sat-screen", "Notes"], ["sat-scenario", "Scenario"]];
  let drawerTab = "sat-screen";
  function openDrawer() {
    const d = $("#drawer");
    $("#dtabs").innerHTML = DTABS.map(([id, n]) => '<button class="' + (id === drawerTab ? "on" : "") + '" data-t="' + id + '">' + n + "</button>").join("");
    const body = $("#dbody");
    DTABS.forEach(([id]) => { const s = document.getElementById(id); body.appendChild(s); s.style.display = id === drawerTab ? "" : "none"; });
    $$("#dtabs button").forEach(b => b.onclick = () => { drawerTab = b.dataset.t; openDrawer(); });
    d.classList.add("on");
  }
  function closeDrawer() {
    const d = $("#drawer");
    if (!d.classList.contains("on")) return;
    d.classList.remove("on");
    const L = $(".orbit.left"), Rr = $(".orbit.right");
    ["sat-journey", "sat-screens"].forEach(id => { const s = document.getElementById(id); s.style.display = ""; L.appendChild(s); });
    ["sat-events", "sat-screen", "sat-scenario"].forEach(id => { const s = document.getElementById(id); s.style.display = ""; Rr.appendChild(s); });
    fit();
  }

  /* ---------------- stage bar ---------------- */
  function routeLabel(c) {
    let group = "", name = c.def.title ? c.def.title.apply(null, c.args) : c.name;
    S.SITEMAP.mobile.forEach(g => g.items.forEach(i => { if (i[0].split("/")[0] === c.name) group = g.g; }));
    return { group: group || "App", name: name };
  }
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    store.set("spool-canvas-theme", t);
    $("#sbTheme").innerHTML = ic(t === "dark" ? "sun" : "moon", 17);
  }

  /* ---------------- boot ---------------- */
  const Stage = {
    scale: () => SCALE,
    rotate: rotate,
    log: onLog,
    pulse: pulse,
    init() {
      $("#sbMark").innerHTML = brandMark(19);
      const th = store.get("spool-canvas-theme");
      setTheme(th === "light" ? "light" : "dark");
      const acc = store.get("spool-accent");
      if (acc && acc !== "lime") document.documentElement.dataset.accent = acc;
      $("#sbTheme").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
      $("#sbJump").onclick = jump;
      $("#sbPanels").onclick = () => { drawerTab = "sat-journey"; $("#drawer").classList.contains("on") ? closeDrawer() : openDrawer(); };
      $("#fabCtl").onclick = () => ($("#drawer").classList.contains("on") ? closeDrawer() : openDrawer());
      $("#capBack").onclick = () => A.back();
      $("#capRotate").onclick = () => { const c = A.current(); if (c && c.name === "landscape") A.back(); else A.go("landscape/ledger/1"); };
      document.addEventListener("keydown", e => {
        if (e.target.closest("input, textarea, select")) return;
        if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); jump(); }
        if (e.key === "]") runStep(Math.min(flow.steps.length - 1, stepIdx + 1));
        if (e.key === "[") runStep(Math.max(0, stepIdx - 1));
      });
      A.on("log", onLog);
      A.on("route", c => {
        const l = routeLabel(c);
        $("#sbRoute").innerHTML = '<span class="crumb">Mobile</span>' + ic("fwd", 12) + '<span class="crumb">' + esc(l.group) + "</span>" + ic("fwd", 12) + "<b>" + esc(l.name) + "</b>";
        $("#capWhere").textContent = "/" + c.path;
        renderScreenNotes();
        renderScreens($("#sfind") ? $("#sfind").value : "");
        // keep the journey in sync when the user navigates by hand
        const k = flow.steps.findIndex(s => s[0] === c.path);
        if (k > stepIdx) { stepIdx = k; renderJourney(); }
        pulse("sat-screen");
      });
      A.on("sheet", () => { const c = A.current(); if (c && c.name === "player") renderScreenNotes(); });
      A.on("wallet", () => renderScenario());
      A.reset("fan");
      wireCollapse();
      renderJourney();
      renderScreens();
      renderEvents();
      renderScenario();
      $("#sat-scenario").addEventListener("click", e => { if (e.target.closest(".sat-h") && !e.target.closest(".act")) setTimeout(renderScenario, 0); });
      $("#fabCtl").innerHTML = ic("sliders", 18) + "Prototype panels";
      window.addEventListener("resize", () => { if (window.innerWidth > 1180) closeDrawer(); fit(); });
      fit();
      setTimeout(fit, 300);
      A.start();
      renderScenario();
      onLog("view", "Prototype ready · <b>" + S.TITLES.length + " titles</b>, " + S.VIDEOS.length + " creator videos, " + S.CREATORS.length + " creators", "all data is mock · nothing is sent anywhere");
    }
  };
  window.Stage = Stage;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawLinks());
  Stage.init();
})();
