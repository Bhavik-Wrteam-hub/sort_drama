/* ==========================================================================
   Spool — mock data == data model spec
   --------------------------------------------------------------------------
   Everything the mobile app and the admin panel show comes from here, so the
   shape of each object is the contract for the API. Field notes sit next to
   the fields that need a decision. Nothing persists; the app mutates copies
   in memory to show state changes.
   ========================================================================== */
(function (root) {
  "use strict";

  /* ---------- deterministic random for generated rows ---------- */
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

  /* ---------- formatting ---------- */
  const FMT = {
    n(v) {
      if (v >= 1e9) return (v / 1e9).toFixed(v >= 1e10 ? 0 : 1).replace(/\.0$/, "") + "B";
      if (v >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
      if (v >= 1e3) return (v / 1e3).toFixed(v >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K";
      return String(v);
    },
    int(v) { return Math.round(v).toLocaleString("en-US"); },
    dur(sec) {
      sec = Math.max(0, Math.round(sec));
      const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
      return h ? h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") : m + ":" + String(s).padStart(2, "0");
    },
    mins(sec) {
      const h = Math.floor(sec / 3600), m = Math.round(sec % 3600 / 60);
      return h ? h + "h " + (m ? m + "m" : "") : m + " min";
    },
    pct(v, d) { return (v * 100).toFixed(d == null ? 1 : d).replace(/\.0$/, "") + "%"; },
    usd(v, d) { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); },
    usdk(v) {
      if (v >= 1e6) return "$" + (v / 1e6).toFixed(2).replace(/0$/, "") + "M";
      if (v >= 1e3) return "$" + (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
      return "$" + v.toFixed(0);
    },
    /* Coins → the viewer's money, using the region's coin value. Always
       prefixed with "≈" in UI because store prices round per country. */
    money(coins, regionCode) {
      const r = REGIONS[regionCode || "US"];
      const v = coins * r.coinValue;
      if (r.cur === "₹") return "₹" + (v < 10 ? v.toFixed(1).replace(/\.0$/, "") : Math.round(v));
      if (r.cur === "R$") return "R$ " + v.toFixed(2).replace(".", ",");
      return r.cur + v.toFixed(2);
    }
  };

  /* ---------- brand & product config (white-label) ---------- */
  const BRAND = {
    name: "Spool",
    tagline: "Stories that hook you. Prices that don't.",
    accent: "lime",
    supportEmail: "help@spool.tv",
    domain: "spool.tv",
    version: "1.0 prototype",
    builtOn: "9 Oct 2026"
  };

  /* ---------- regions (per-country monetisation mode) ----------
     mode: "hybrid" = coins + VIP + rewarded ads; "ads" = free with ads first,
     coins optional; "coins" = coins + VIP, ads off. coinValue = local money
     per coin at the standard pack rate. */
  const REGIONS = {
    US: { code: "US", name: "United States", cur: "$", coinValue: 0.0099, mode: "hybrid", epPrice: 60, freeEps: 10, adsPerDay: 6, vip: [5.99, 19.99, 119.99], lang: "English", dau: 412000, arpdau: 0.41 },
    GB: { code: "GB", name: "United Kingdom", cur: "£", coinValue: 0.0089, mode: "hybrid", epPrice: 60, freeEps: 10, adsPerDay: 6, vip: [4.99, 16.99, 99.99], lang: "English", dau: 96000, arpdau: 0.33 },
    CA: { code: "CA", name: "Canada", cur: "C$", coinValue: 0.0129, mode: "hybrid", epPrice: 60, freeEps: 10, adsPerDay: 6, vip: [7.99, 25.99, 159.99], lang: "English", dau: 71000, arpdau: 0.36 },
    IN: { code: "IN", name: "India", cur: "₹", coinValue: 0.29, mode: "ads", epPrice: 30, freeEps: 15, adsPerDay: 20, vip: [49, 149, 999], lang: "Hindi", dau: 588000, arpdau: 0.031 },
    ID: { code: "ID", name: "Indonesia", cur: "Rp", coinValue: 49, mode: "ads", epPrice: 30, freeEps: 15, adsPerDay: 20, vip: [19000, 59000, 399000], lang: "Bahasa", dau: 214000, arpdau: 0.052 },
    PH: { code: "PH", name: "Philippines", cur: "₱", coinValue: 0.29, mode: "hybrid", epPrice: 40, freeEps: 12, adsPerDay: 12, vip: [99, 299, 1990], lang: "English", dau: 168000, arpdau: 0.078 },
    BR: { code: "BR", name: "Brazil", cur: "R$", coinValue: 0.049, mode: "hybrid", epPrice: 40, freeEps: 12, adsPerDay: 10, vip: [14.9, 44.9, 269.9], lang: "Português", dau: 131000, arpdau: 0.094 },
    MX: { code: "MX", name: "Mexico", cur: "MX$", coinValue: 0.17, mode: "hybrid", epPrice: 40, freeEps: 12, adsPerDay: 10, vip: [79, 249, 1490], lang: "Español", dau: 92000, arpdau: 0.11 },
    DE: { code: "DE", name: "Germany", cur: "€", coinValue: 0.0099, mode: "coins", epPrice: 60, freeEps: 8, adsPerDay: 0, vip: [5.99, 19.99, 119.99], lang: "Deutsch", dau: 38000, arpdau: 0.29 }
  };

  /* ---------- tropes & moods (taxonomy, admin-managed) ---------- */
  const TROPES = ["Hidden identity", "Revenge", "Billionaire", "Contract marriage", "Werewolf", "Second chance", "Secret baby",
    "Mafia", "Rebirth", "Enemies to lovers", "Fake dating", "Royal", "Bodyguard", "Thriller", "Family drama", "Small town", "Office romance", "Comedy"];
  const MOODS = [
    { k: "revenge", n: "Sweet revenge", icon: "zap" },
    { k: "swoon", n: "Swoon", icon: "heart" },
    { k: "gasp", n: "Gasp", icon: "alert" },
    { k: "cry", n: "Good cry", icon: "smile" },
    { k: "laugh", n: "Laugh", icon: "smile" }
  ];

  /* ---------- titles ----------
     kind: drama (vertical micro-drama) | series (landscape web series) |
     movie | creator (creator series) | pilot (Pilot Season entry).
     A movie is a title with one episode; every kind shares one wallet and
     one paywall through the per-title access fields (free, price, vip). */
  const CAST = {
    heiress: [
      { id: "ava", name: "Ava Lin", actor: "Lena Zhou", role: "The heiress", note: "Left at the altar five years ago. Now quietly owns 51% of Lin Holdings.", since: 1, kind: "woman", hair: "long", pal: ["#2a0f16", "#7a2335", "#ffb08a"] },
      { id: "victor", name: "Victor Hale", actor: "Marcus Reid", role: "The ex-fiancé", note: "CEO of Hale Group. Hasn't recognised Ava — until the gala.", since: 1, kind: "man", hair: "short", pal: ["#101c33", "#2a4f8a", "#ffe0b0"] },
      { id: "celeste", name: "Celeste Hale", actor: "Sofía Marín", role: "The rival", note: "Victor's sister. Planned the wedding sabotage.", since: 4, kind: "woman", hair: "bob", pal: ["#2b1230", "#8a3a7a", "#ffd0e8"] },
      { id: "ethan", name: "Ethan Cross", actor: "Daniel Okafor", role: "The bodyguard", note: "Has worked for Ava all along. Knows who she really is.", since: 3, kind: "man", hair: "short", pal: ["#0f2a2a", "#1f6b62", "#ffd9a0"] },
      { id: "grandma", name: "Grandma Lin", actor: "Helen Park", role: "The matriarch", note: "Holds the deciding vote on the Lin board.", since: 6, kind: "woman", hair: "bun", pal: ["#2a1f0c", "#7a5520", "#fff0c8"] },
      { id: "unknown", name: "Unknown texter", actor: "—", role: "Revealed in E8", note: "Sent “I know who you really are.”", since: 7, kind: "man", hair: "cap", pal: ["#111", "#222", "#666"], hidden: true }
    ],
    moonbound: [
      { id: "mara", name: "Mara Vale", actor: "Ivy Carter", role: "The outsider", note: "A human who can hear the pack.", since: 1, kind: "woman", hair: "long", pal: ["#050b18", "#0f2340", "#cfe3ff"] },
      { id: "kade", name: "Kade Thorne", actor: "Rafe Holm", role: "The Alpha", note: "Bound by a vow he didn't choose.", since: 1, kind: "man", hair: "short", pal: ["#101c33", "#2a4f8a", "#cfe3ff"] }
    ]
  };

  const TITLES = [
    {
      id: "heiress", name: "The Heiress Returns", kind: "drama", orient: "portrait", st: "serif", kicker: "Spool Original", original: true,
      tropes: ["Hidden identity", "Revenge", "Billionaire"], mood: "revenge", age: "16+", year: 2026,
      eps: 60, released: 24, free: 7, price: 60, pass: 1990, status: "ongoing", schedule: "New episode daily · 8 PM", nextDrop: "Today 8:00 PM",
      rating: 4.8, ratings: 18240, views: 48600000, saves: 1210000, likes: 3400000,
      audio: ["English", "Hindi · AI voice", "Spanish · AI voice", "Portuguese · AI voice"], subs: 14, avgLen: 92,
      synopsis: "Humiliated at her own wedding and left with nothing, Ava Lin disappears. Five years later she walks into the Sterling Gala as the anonymous buyer who now owns half the room — and the man who betrayed her doesn't recognise her. Yet.",
      art: { pal: ["#1a0710", "#5b0f1f", "#ff8a5c"], motif: "bokeh", fig: "woman", lead: "woman", hair: "long", seed: "h1" },
      admin: { revenue30: 482300, completion: .41, unlockRate: .118, region: ["US", "GB", "CA", "PH", "BR", "IN"], status: "Live", owner: "Spool Studios", rights: "Owned · worldwide" }
    },
    {
      id: "contract", name: "Married to the Wrong Billionaire", kind: "drama", orient: "portrait", st: "caps", kicker: "Spool Original", original: true,
      tropes: ["Contract marriage", "Billionaire", "Hidden identity"], mood: "swoon", age: "13+", year: 2026,
      eps: 64, released: 64, free: 8, price: 55, status: "complete",
      rating: 4.6, ratings: 31420, views: 92100000, saves: 2040000, likes: 5100000,
      audio: ["English", "Spanish · AI voice"], subs: 12, avgLen: 84,
      synopsis: "Wedding planner June signs a one-year contract to marry a reclusive billionaire — and finds out on the honeymoon that she married his twin.",
      art: { pal: ["#07121f", "#13324a", "#ffd27a"], motif: "city", fig: "couple", lead: "woman", seed: "c1" },
      admin: { revenue30: 361200, completion: .47, unlockRate: .104, region: ["US", "GB", "CA", "PH", "BR", "MX"], status: "Live", owner: "Spool Studios", rights: "Owned · worldwide" }
    },
    {
      id: "moonbound", name: "Moonbound", sub: "The Alpha's Vow", kind: "drama", orient: "portrait", st: "serif", kicker: "Exclusive",
      tropes: ["Werewolf", "Enemies to lovers", "Second chance"], mood: "swoon", age: "16+", year: 2026,
      eps: 80, released: 46, free: 10, price: 60, status: "ongoing", schedule: "Mon · Wed · Fri", nextDrop: "Fri 9:00 PM",
      rating: 4.7, ratings: 22870, views: 61300000, saves: 1640000, likes: 4200000,
      audio: ["English", "Portuguese · AI voice"], subs: 10, avgLen: 88,
      synopsis: "Mara can hear the pack's thoughts — and so can the Alpha who swore to hunt her. A vow made under a blood moon ties them together until one of them breaks it.",
      art: { pal: ["#050b18", "#0f2340", "#cfe3ff"], motif: "moon", fig: "woman", lead: "woman", hair: "long", seed: "m1" },
      admin: { revenue30: 298700, completion: .38, unlockRate: .121, region: ["US", "GB", "CA", "PH", "BR"], status: "Live", owner: "Northlight Media", rights: "Licensed · to Dec 2028" }
    },
    {
      id: "divorce", name: "Divorce Day", kind: "drama", orient: "portrait", st: "caps", kicker: "Spool Original", original: true,
      tropes: ["Revenge", "Second chance", "Family drama"], mood: "revenge", age: "16+", year: 2026,
      eps: 58, released: 58, free: 10, price: 50, status: "complete",
      rating: 4.5, ratings: 14310, views: 37800000, saves: 880000, likes: 2600000,
      audio: ["English", "Hindi · AI voice"], subs: 12, avgLen: 80,
      synopsis: "On the morning she signs the divorce papers, Nora finds the second set — the ones her husband filed to take the company too. She has 58 days to take it back.",
      art: { pal: ["#120607", "#3a0d10", "#ff4d3d"], motif: "shards", fig: "woman", lead: "woman", hair: "bob", seed: "d1" },
      admin: { revenue30: 188400, completion: .52, unlockRate: .097, region: ["US", "GB", "CA", "IN", "PH"], status: "Live", owner: "Spool Studios", rights: "Owned · worldwide" }
    },
    {
      id: "sindoor", name: "Sindoor Ka Badla", sub: "The Vermilion Vow", kind: "drama", orient: "portrait", st: "serif", kicker: "Hindi Original", original: true,
      tropes: ["Revenge", "Family drama", "Second chance"], mood: "revenge", age: "13+", year: 2026,
      eps: 90, released: 61, free: 15, price: 30, status: "ongoing", schedule: "New episode daily · 7 PM", nextDrop: "Today 7:00 PM",
      rating: 4.6, ratings: 40210, views: 118000000, saves: 2900000, likes: 7400000,
      audio: ["Hindi", "English · AI voice", "Tamil · AI voice"], subs: 8, avgLen: 110, lang: "hi",
      synopsis: "Married into a family that wanted her dowry, not her, Gauri is thrown out on her wedding night. She returns as the lawyer representing the village they cheated.",
      art: { pal: ["#1a0505", "#6b0d0d", "#ff5a2c"], motif: "curtain", fig: "woman", lead: "woman", hair: "bun", seed: "s1" },
      admin: { revenue30: 61800, completion: .44, unlockRate: .26, region: ["IN"], status: "Live", owner: "Spool Studios India", rights: "Owned · worldwide" }
    },
    {
      id: "crown", name: "Glass Crown", kind: "drama", orient: "portrait", st: "wide", kicker: "Exclusive",
      tropes: ["Royal", "Rebirth", "Revenge"], mood: "gasp", age: "13+", year: 2026,
      eps: 75, released: 40, free: 10, price: 60, status: "ongoing", schedule: "Tue · Thu · Sat", nextDrop: "Sat 8:00 PM",
      rating: 4.6, ratings: 9120, views: 22400000, saves: 640000, likes: 1500000,
      audio: ["English"], subs: 9, avgLen: 95,
      synopsis: "Poisoned on her coronation day, Queen Elise wakes up ten years earlier as a palace maid — with every secret of the court still in her head.",
      art: { pal: ["#0c0a05", "#3b2a0a", "#ffd76a"], motif: "crown", fig: "woman", lead: "woman", hair: "bun", seed: "g1" },
      admin: { revenue30: 141900, completion: .36, unlockRate: .112, region: ["US", "GB", "CA", "PH"], status: "Live", owner: "Gilt Pictures", rights: "Licensed · to Jun 2027" }
    },
    {
      id: "mafia", name: "Vows of the Don", kind: "drama", orient: "portrait", st: "caps", kicker: "Exclusive",
      tropes: ["Mafia", "Contract marriage", "Enemies to lovers"], mood: "gasp", age: "18+", year: 2026,
      eps: 70, released: 70, free: 8, price: 60, status: "complete",
      rating: 4.4, ratings: 12880, views: 33200000, saves: 790000, likes: 2100000,
      audio: ["English", "Spanish · AI voice"], subs: 11, avgLen: 86,
      synopsis: "To end a war between two families, Isabella must marry the man who killed her brother. He swears he didn't. She has one wedding night to find out.",
      art: { pal: ["#06080a", "#1b2228", "#c7d3dd"], motif: "rain", fig: "couple", lead: "woman", seed: "v1" },
      admin: { revenue30: 156300, completion: .43, unlockRate: .109, region: ["US", "GB", "CA", "MX", "BR"], status: "Live", owner: "Corvo Films", rights: "Licensed · to Mar 2028" }
    },
    {
      id: "rebirth", name: "Reborn, I Chose Myself", kind: "drama", orient: "portrait", st: "serif", kicker: "Spool Original", original: true,
      tropes: ["Rebirth", "Revenge", "Second chance"], mood: "revenge", age: "13+", year: 2026,
      eps: 60, released: 33, free: 10, price: 60, status: "ongoing", schedule: "New episode daily · 9 PM", nextDrop: "Today 9:00 PM",
      rating: 4.7, ratings: 7410, views: 19800000, saves: 560000, likes: 1300000,
      audio: ["English"], subs: 9, avgLen: 90,
      synopsis: "She gave her family everything and died alone. Waking up on her twenty-first birthday, Wen makes one rule for her second life: never again.",
      art: { pal: ["#0a0712", "#2d1a4f", "#c6a4ff"], motif: "spot", fig: "woman", lead: "woman", hair: "long", seed: "r1" },
      admin: { revenue30: 98200, completion: .4, unlockRate: .116, region: ["US", "GB", "CA", "PH"], status: "Live", owner: "Spool Studios", rights: "Owned · worldwide" }
    },
    {
      id: "twins", name: "The Twins He Never Knew", kind: "drama", orient: "portrait", st: "serif", kicker: "Exclusive",
      tropes: ["Secret baby", "Billionaire", "Second chance"], mood: "cry", age: "13+", year: 2025,
      eps: 66, released: 66, free: 10, price: 55, status: "complete",
      rating: 4.5, ratings: 20650, views: 54000000, saves: 1100000, likes: 3300000,
      audio: ["English", "Spanish · AI voice"], subs: 12, avgLen: 82,
      synopsis: "Six years after one night in Monaco, a CEO meets two children who have his eyes — and a mother who wants nothing from him.",
      art: { pal: ["#0d0b14", "#2a1f3d", "#ffb3c7"], motif: "split", fig: "man", lead: "man", seed: "t1" },
      admin: { revenue30: 120500, completion: .5, unlockRate: .101, region: ["US", "GB", "CA", "MX", "BR"], status: "Live", owner: "Bluebell Shorts", rights: "Licensed · to Jan 2028" }
    },
    {
      id: "bodyguard", name: "The Bodyguard Clause", kind: "drama", orient: "portrait", st: "caps", kicker: "Exclusive",
      tropes: ["Bodyguard", "Enemies to lovers", "Billionaire"], mood: "swoon", age: "16+", year: 2026,
      eps: 54, released: 54, free: 10, price: 55, status: "complete",
      rating: 4.6, ratings: 8930, views: 26100000, saves: 610000, likes: 1700000,
      audio: ["English"], subs: 8, avgLen: 84,
      synopsis: "Clause 14 of his contract: never fall for the client. Clause 15, added by her: never let anyone find out he already has.",
      art: { pal: ["#0b0b0b", "#2a2016", "#f0b35a"], motif: "blinds", fig: "man", lead: "man", seed: "b1" },
      admin: { revenue30: 87600, completion: .48, unlockRate: .099, region: ["US", "GB", "CA"], status: "Live", owner: "Corvo Films", rights: "Licensed · to Mar 2028" }
    },
    {
      id: "silent", name: "Silent Witness", kind: "drama", orient: "portrait", st: "caps", kicker: "Spool Original", original: true,
      tropes: ["Thriller", "Hidden identity", "Small town"], mood: "gasp", age: "16+", year: 2026,
      eps: 42, released: 42, free: 10, price: 50, status: "complete",
      rating: 4.7, ratings: 6020, views: 14100000, saves: 420000, likes: 980000,
      audio: ["English"], subs: 10, avgLen: 98,
      synopsis: "The only witness to a murder can't speak. The detective on the case can't hear. Forty-two minutes to solve it, one at a time.",
      art: { pal: ["#030608", "#0e1c1f", "#5ce1e6"], motif: "rain+blinds", fig: "man", lead: "man", seed: "w1" },
      admin: { revenue30: 54100, completion: .58, unlockRate: .094, region: ["US", "GB", "CA", "DE"], status: "Live", owner: "Spool Studios", rights: "Owned · worldwide" }
    },
    {
      id: "fake", name: "The Fake Fiancée Deal", kind: "drama", orient: "portrait", st: "serif", kicker: "Exclusive",
      tropes: ["Fake dating", "Office romance", "Comedy"], mood: "laugh", age: "13+", year: 2025,
      eps: 48, released: 48, free: 12, price: 50, status: "complete",
      rating: 4.4, ratings: 11400, views: 29700000, saves: 720000, likes: 2000000,
      audio: ["English", "Hindi · AI voice"], subs: 12, avgLen: 76,
      synopsis: "She needs a date for her sister's wedding. He needs a fiancée for his grandmother's will. Neither of them reads the fine print.",
      art: { pal: ["#2a0f1f", "#8a2c5a", "#ffd1e1"], motif: "petals", fig: "couple", lead: "woman", seed: "f1" },
      admin: { revenue30: 76300, completion: .55, unlockRate: .092, region: ["US", "GB", "CA", "IN", "PH"], status: "Live", owner: "Bluebell Shorts", rights: "Licensed · to Jan 2028" }
    },
    {
      id: "tenyears", name: "Ten Years Later", kind: "drama", orient: "portrait", st: "serif", kicker: "Exclusive",
      tropes: ["Second chance", "Small town", "Family drama"], mood: "cry", age: "13+", year: 2025,
      eps: 50, released: 50, free: 12, price: 50, status: "complete",
      rating: 4.6, ratings: 5210, views: 11200000, saves: 300000, likes: 760000,
      audio: ["English"], subs: 8, avgLen: 88,
      synopsis: "A reunion, a lake house, and the boy who left without saying goodbye. This time she's the one with a secret.",
      art: { pal: ["#140a05", "#5a2a10", "#ffb067"], motif: "sun", fig: "couple", lead: "woman", seed: "y1" },
      admin: { revenue30: 31200, completion: .6, unlockRate: .088, region: ["US", "GB", "CA"], status: "Live", owner: "Lakeview Shorts", rights: "Licensed · to Aug 2027" }
    },
    {
      id: "shaadi", name: "Shaadi Contract", kind: "drama", orient: "portrait", st: "caps", kicker: "Hindi Original", original: true,
      tropes: ["Contract marriage", "Comedy", "Family drama"], mood: "laugh", age: "13+", year: 2026,
      eps: 64, released: 64, free: 15, price: 30, status: "complete",
      rating: 4.5, ratings: 28800, views: 76000000, saves: 1900000, likes: 4800000, lang: "hi",
      audio: ["Hindi", "English · AI voice"], subs: 6, avgLen: 100,
      synopsis: "Two strangers fake a marriage to stop their families' matchmaking — and then both families move in.",
      art: { pal: ["#24060f", "#8a1f3e", "#ffc06a"], motif: "petals", fig: "couple", lead: "woman", seed: "k1" },
      admin: { revenue30: 43900, completion: .51, unlockRate: .24, region: ["IN"], status: "Live", owner: "Spool Studios India", rights: "Owned · worldwide" }
    },
    {
      id: "monsoon", name: "Monsoon Hostel", kind: "series", orient: "landscape", st: "caps", kicker: "Web series",
      tropes: ["Comedy", "Small town", "Second chance"], mood: "laugh", age: "13+", year: 2026,
      eps: 8, released: 8, free: 2, price: 120, status: "complete", epLen: 24 * 60,
      rating: 4.5, ratings: 4310, views: 6100000, saves: 210000, likes: 520000,
      audio: ["Hindi", "English · AI voice"], subs: 6, avgLen: 1440, lang: "hi",
      synopsis: "Eight students, one leaking hostel and a warden who has never once lost an argument. A monsoon season nobody will forget.",
      art: { pal: ["#04121a", "#0d3b4a", "#7fe0d0"], motif: "rain", fig: "trio", lead: "woman", seed: "mh" },
      admin: { revenue30: 22800, completion: .62, unlockRate: .2, region: ["IN", "US", "GB"], status: "Live", owner: "Tin Roof Films", rights: "Licensed · to Oct 2027" }
    },
    {
      id: "ledger", name: "Cold Ledger", kind: "series", orient: "landscape", st: "wide", kicker: "Web series",
      tropes: ["Thriller", "Hidden identity", "Billionaire"], mood: "gasp", age: "16+", year: 2026,
      eps: 6, released: 6, free: 1, price: 180, status: "complete", epLen: 38 * 60,
      rating: 4.6, ratings: 2980, views: 3400000, saves: 140000, likes: 260000,
      audio: ["English"], subs: 9, avgLen: 2280,
      synopsis: "A forensic accountant finds one number that shouldn't exist in the books of the bank that employs her.",
      art: { pal: ["#06090f", "#162030", "#9ab8ff"], motif: "city", fig: "man", lead: "man", seed: "cl" },
      admin: { revenue30: 18400, completion: .57, unlockRate: .14, region: ["US", "GB", "CA", "DE"], status: "Live", owner: "Meridian TV", rights: "Licensed · to May 2028" }
    },
    {
      id: "lanterns", name: "Paper Lanterns", kind: "movie", orient: "landscape", st: "serif", kicker: "Film",
      tropes: ["Second chance", "Small town"], mood: "cry", age: "13+", year: 2025,
      eps: 1, released: 1, free: 0, price: 300, status: "complete", runtime: 106 * 60,
      rating: 4.7, ratings: 3820, views: 2100000, saves: 98000, likes: 190000,
      audio: ["English", "Hindi · AI voice"], subs: 12, avgLen: 6360,
      synopsis: "Two strangers miss the last ferry on the night of the lantern festival and have until sunrise to decide if it was an accident.",
      art: { pal: ["#120b05", "#4a2410", "#ffc46b"], motif: "lanterns", fig: "couple", lead: "woman", seed: "pl" },
      admin: { revenue30: 9800, completion: .71, unlockRate: .08, region: ["US", "GB", "CA", "IN"], status: "Live", owner: "Lantern House", rights: "Licensed · to Feb 2029" }
    },
    {
      id: "highway", name: "Highway Nights", kind: "movie", orient: "landscape", st: "caps", kicker: "Film",
      tropes: ["Thriller"], mood: "gasp", age: "16+", year: 2026,
      eps: 1, released: 1, free: 0, price: 300, status: "complete", runtime: 112 * 60,
      rating: 4.3, ratings: 2210, views: 1500000, saves: 71000, likes: 120000,
      audio: ["English"], subs: 10, avgLen: 6720,
      synopsis: "A night-shift driver picks up a passenger who knows exactly where she's going — and where she's been.",
      art: { pal: ["#06060a", "#1d1030", "#ff4f9a"], motif: "road", fig: "none", lead: "woman", seed: "hn" },
      admin: { revenue30: 7600, completion: .64, unlockRate: .07, region: ["US", "GB", "CA"], status: "Live", owner: "Neon Reel", rights: "Licensed · to Jul 2028" }
    },
    {
      id: "flatmates", name: "Flatmates", sub: "Season 2", kind: "creator", orient: "portrait", st: "caps", kicker: "Creator series", creator: "ritu",
      tropes: ["Comedy"], mood: "laugh", age: "13+", year: 2026,
      eps: 24, released: 14, free: 6, price: 20, status: "ongoing", schedule: "Sundays", nextDrop: "Sun 6:00 PM",
      rating: 4.8, ratings: 6410, views: 14800000, saves: 380000, likes: 1900000,
      audio: ["Hindi", "English · AI voice"], subs: 4, avgLen: 70, lang: "hi",
      synopsis: "Four flatmates, one fridge, zero rules. Ritu's hit sketch series, now with a story arc.",
      art: { pal: ["#1a0f2e", "#40206e", "#ffd84d"], motif: "confetti", fig: "trio", lead: "woman", seed: "fm" },
      admin: { revenue30: 12400, completion: .66, unlockRate: .15, region: ["IN", "US", "GB"], status: "Live", owner: "Ritu Sharma", rights: "Creator · 50% share" }
    },
    {
      id: "ghost", name: "Ghost Signals", kind: "pilot", orient: "portrait", st: "caps", kicker: "Pilot Season", creator: "kofi",
      tropes: ["Thriller"], mood: "gasp", age: "16+", year: 2026,
      eps: 3, released: 3, free: 3, price: 0, status: "pilot", votes: 8214, goal: 10000, completionRate: .74,
      rating: 4.7, ratings: 1220, views: 1400000, saves: 96000, likes: 210000,
      audio: ["English"], subs: 3, avgLen: 98,
      synopsis: "A night-shift radio host starts hearing calls from listeners who died the year before. Three episodes shot for $300.",
      art: { pal: ["#030504", "#101a14", "#9dff8a"], motif: "scanlines", fig: "far", lead: "man", seed: "gs" },
      admin: { revenue30: 0, completion: .74, unlockRate: 0, region: ["US", "GB", "CA", "IN"], status: "Voting", owner: "Kofi Mensah", rights: "Creator · pilot terms" }
    },
    {
      id: "lastdelivery", name: "The Last Delivery", kind: "pilot", orient: "portrait", st: "caps", kicker: "Pilot Season", creator: "diego",
      tropes: ["Thriller"], mood: "gasp", age: "16+", year: 2026,
      eps: 3, released: 3, free: 3, price: 0, status: "pilot", votes: 9642, goal: 10000, completionRate: .81,
      rating: 4.8, ratings: 1910, views: 2200000, saves: 140000, likes: 330000,
      audio: ["English", "Spanish"], subs: 4, avgLen: 102,
      synopsis: "A food courier is paid triple to deliver one bag before midnight. He is told not to look inside.",
      art: { pal: ["#08060a", "#24121c", "#ff7a59"], motif: "road", fig: "far", lead: "man", seed: "ld" },
      admin: { revenue30: 0, completion: .81, unlockRate: 0, region: ["US", "GB", "CA", "MX"], status: "Shortlisted", owner: "Diego Álvarez", rights: "Creator · pilot terms" }
    },
    {
      id: "desk14", name: "Desk 14", kind: "pilot", orient: "portrait", st: "serif", kicker: "Pilot Season", creator: "lola",
      tropes: ["Office romance", "Comedy"], mood: "swoon", age: "13+", year: 2026,
      eps: 2, released: 2, free: 2, price: 0, status: "pilot", votes: 5960, goal: 10000, completionRate: .69,
      rating: 4.5, ratings: 880, views: 940000, saves: 61000, likes: 150000,
      audio: ["English"], subs: 2, avgLen: 88,
      synopsis: "She's been leaving anonymous notes on Desk 14 for a year. Today the new hire sitting there writes back.",
      art: { pal: ["#0b0d12", "#24324a", "#ffcf9e"], motif: "city", fig: "woman", lead: "woman", hair: "bob", seed: "dk" },
      admin: { revenue30: 0, completion: .69, unlockRate: 0, region: ["US", "GB", "CA"], status: "Voting", owner: "Lola Bennett", rights: "Creator · pilot terms" }
    },
    {
      id: "aunty", name: "Aunty Knows Best", kind: "pilot", orient: "portrait", st: "serif", kicker: "Pilot Season", creator: "ritu",
      tropes: ["Comedy", "Family drama"], mood: "laugh", age: "13+", year: 2026,
      eps: 2, released: 2, free: 2, price: 0, status: "pilot", votes: 3120, goal: 10000, completionRate: .63,
      rating: 4.4, ratings: 540, views: 610000, saves: 33000, likes: 98000, lang: "hi",
      audio: ["Hindi"], subs: 2, avgLen: 76,
      synopsis: "The building's matchmaking aunty has a 100% success rate. Then she's asked to match her own son.",
      art: { pal: ["#1f0b06", "#6b2a12", "#ffcf6b"], motif: "spot+confetti", fig: "couple", lead: "woman", seed: "ak" },
      admin: { revenue30: 0, completion: .63, unlockRate: 0, region: ["IN"], status: "Voting", owner: "Ritu Sharma", rights: "Creator · pilot terms" }
    }
  ];
  TITLES.forEach(t => { t.cast = CAST[t.id] || null; });
  const T = Object.fromEntries(TITLES.map(t => [t.id, t]));

  /* ---------- episodes ----------
     Episode titles for the flagship; others are numbered. Durations are in
     seconds. The admin rule "episode length floor" (default 45 s) keeps the
     tail of a series from being cut into 5-second pieces. */
  const EP_NAMES = {
    heiress: ["The Wedding That Wasn't", "Five Years Gone", "The Anonymous Bidder", "Champagne and Knives", "He Doesn't Recognise Me",
      "Grandmother's Ledger", "The Slap Heard Round the Gala", "Who Is Ava Lin?", "The Bodyguard Knows", "Celeste Makes Her Move",
      "The Sterling Shares", "A Ring in the River", "Board Meeting", "The Second Witness", "Victor Remembers", "Old Photographs",
      "The Proxy Vote", "Rain at the Pier", "Celeste's Alibi", "The Lin Family Dinner", "Ethan's Offer", "Paper Trail", "The Engagement Rumour", "Gala, Again"],
    moonbound: ["The Blood Moon", "Hear Me", "The Alpha's Vow", "Silver", "Pack Law", "Run"]
  };
  function episodes(t) {
    const r = rng("eps" + t.id);
    const out = [];
    for (let i = 1; i <= t.eps; i++) {
      const base = t.kind === "movie" ? t.runtime : t.epLen || t.avgLen;
      const dur = t.kind === "movie" || t.epLen ? base : Math.round(base * (.78 + r() * .42));
      const names = EP_NAMES[t.id];
      out.push({
        n: i,
        title: names && names[i - 1] ? names[i - 1] : t.kind === "movie" ? t.name : "Episode " + i,
        dur: dur,
        released: i <= t.released,
        free: i <= t.free,
        views: Math.round(t.views / Math.pow(i, .55) / 6),
        drop: i === 1 ? 1 : null
      });
    }
    return out;
  }

  /* The flagship's demo episode (E7) carries a subtitle track, a reaction
     heat track (the Pulse Bar) and a Cliffhanger Call. */
  const SCRIPT = {
    "heiress:7": {
      dur: 88,
      lines: [
        [2, 7, "CELESTE", "You shouldn't be here. This gala is for family."],
        [7.5, 12.5, "AVA", "Then it's a good thing I bought the family."],
        [13, 17.5, "VICTOR", "…Ava?"],
        [18, 24, "AVA", "You remember my name. You forgot my face."],
        [25, 30, "CELESTE", "Security! Get this woman out of here."],
        [31, 37, "ETHAN", "Touch her and you answer to the Lin board."],
        [38, 41.5, "", "[ The room goes silent ]"],
        [42, 44, "", "[ SLAP ]"],
        [44.2, 49.5, "AVA", "That was for the wedding."],
        [50, 54.5, "VICTOR", "You can't just come back and—"],
        [55, 62, "AVA", "I didn't come back, Victor. I came to collect."],
        [63, 70, "GRANDMA LIN", "Let her speak. She has the votes."],
        [71, 78, "AVA", "Five years ago you took everything. Tonight I take it back."],
        [79, 84, "", "[ Phone buzzes ] “I know who you really are.”"]
      ],
      heat: [2, 2, 3, 2, 3, 4, 7, 9, 6, 5, 4, 5, 4, 3, 5, 6, 5, 4, 6, 9, 12, 26, 18, 11, 8, 9, 13, 16, 11, 8, 7, 9, 10, 8, 7, 9, 11, 13, 15, 20, 30, 34, 24, 12],
      peaks: [{ t: 13.5, e: "😮", label: "He knows her" }, { t: 42.5, e: "😱", label: "The slap" }, { t: 57, e: "🔥", label: "“I came to collect”" }, { t: 80, e: "👀", label: "The text" }],
      call: {
        q: "Who sent Ava the text?",
        options: [{ k: "celeste", n: "Celeste", pct: .46 }, { k: "ethan", n: "Ethan", pct: .33 }, { k: "victor", n: "Victor", pct: .21 }],
        answer: "ethan", reveal: 8, calls: 182400
      }
    },
    "heiress:8": {
      dur: 94,
      lines: [
        [2, 7, "AVA", "Who else knows?"],
        [8, 14, "ETHAN", "Only me. And now whoever is reading your messages."],
        [15, 21, "AVA", "You sent it. To make me careful."],
        [22, 28, "ETHAN", "To make you scared. Careful wasn't working."]
      ],
      heat: [3, 4, 6, 9, 14, 22, 17, 12, 9, 8, 10, 12, 9, 8, 7, 9, 8, 7, 9, 10, 9, 8, 7, 6, 8, 9, 11, 12, 10, 8, 7, 8, 9, 10, 9, 8, 7, 9, 12, 15, 18, 22, 16, 9, 7, 6, 5],
      peaks: [{ t: 11, e: "🤯", label: "Ethan confesses" }]
    }
  };
  function genericScript(t, n) {
    const r = rng("scr" + t.id + n);
    const d = (t.avgLen || 80);
    const len = Math.min(60, Math.max(10, Math.round(d / 2)));
    const heat = Array.from({ length: len }, (_, i) => Math.round(3 + r() * 6 + (i > len * .85 ? 14 * r() : 0)));
    const pk = Math.floor(len * (.4 + r() * .4));
    heat[pk] += 18;
    return {
      dur: d,
      lines: [[2, 6, "", "[ " + t.name + " · Episode " + n + " ]"], [d * .45, d * .45 + 4, "", "…"], [d - 8, d - 3, "", "[ To be continued ]"]],
      heat: heat,
      peaks: [{ t: Math.round((pk + .5) / len * d), e: ["😱", "🔥", "😭", "🤯"][n % 4], label: "Big moment" }]
    };
  }

  /* ---------- the viewer (mobile prototype persona) ---------- */
  const VIEWER = {
    id: "u_10293", name: "Maya Rao", handle: "@maya.watches", region: "US", since: "Sep 2026",
    wallet: { paid: 290, bonus: 20, bonusExpires: "16 Oct" },
    vip: false,
    /* highest unlocked episode per title (free episodes are implicit) */
    unlocked: { contract: 12, moonbound: 13 },
    passes: ["divorce"],
    priceLock: { heiress: 60, moonbound: 60, contract: 55 },
    progress: { heiress: { ep: 7, t: 0, lastSeen: "Yesterday" }, moonbound: { ep: 13, t: 34, lastSeen: "Yesterday" }, contract: { ep: 13, t: 0, lastSeen: "2 days ago" }, crown: { ep: 9, t: 40, lastSeen: "12 days ago" }, monsoon: { ep: 3, t: 812, lastSeen: "Last week" }, flatmates: { ep: 9, t: 20, lastSeen: "2 days ago" } },
    myList: ["heiress", "moonbound", "crown", "rebirth", "ledger"],
    following: ["heiress", "moonbound", "crown", "flatmates"],
    followingCreators: ["ritu", "mina"],
    streak: 2, checkedInToday: false,
    adsToday: 2,
    spendCap: 300, spentToday: 0,
    autoUnlock: false,
    tropes: ["Revenge", "Hidden identity", "Werewolf"]
  };

  /* Ledger: append-only. Every row is one movement with the balance after.
     Bonus coins are spent before paid coins, earliest expiry first. */
  const LEDGER = [
    { id: "L-88231", day: "Today", time: "13:10", type: "call", label: "Cliffhanger Call · you called it", sub: "Married to the Wrong Billionaire E12", bonus: 5, paid: 0, after: [290, 20], ref: "call:contract:12", exp: "16 Oct" },
    { id: "L-88219", day: "Today", time: "12:30", type: "ad", label: "Rewarded ad · 27 s", sub: "AdMob · completed", bonus: 15, paid: 0, after: [290, 15], ref: "ad:admob:9f2c41", exp: "16 Oct" },
    { id: "L-88104", day: "Yesterday", time: "21:44", type: "unlock", label: "Unlocked · Moonbound E13", sub: "50 bonus first, then 10 paid", bonus: -50, paid: -10, after: [290, 0], ref: "unl:7f3a19c2" },
    { id: "L-88101", day: "Yesterday", time: "21:40", type: "ad", label: "Rewarded ad · 30 s", sub: "AppLovin · completed", bonus: 15, paid: 0, after: [300, 50], ref: "ad:max:44e0aa", exp: "15 Oct" },
    { id: "L-88090", day: "Yesterday", time: "21:26", type: "unlock", label: "Unlocked · Moonbound E12", sub: "Bonus coins", bonus: -60, paid: 0, after: [300, 35], ref: "unl:6b21f0e8" },
    { id: "L-88071", day: "Yesterday", time: "21:20", type: "unlock", label: "Unlocked · Moonbound E11", sub: "Bonus coins", bonus: -60, paid: 0, after: [300, 95], ref: "unl:5a9c33d1" },
    { id: "L-88002", day: "Yesterday", time: "08:01", type: "checkin", label: "Daily check-in · Day 2", sub: "Streak 2 of 7", bonus: 10, paid: 0, after: [300, 155], ref: "streak:2", exp: "15 Oct" },
    { id: "L-87988", day: "7 Oct", time: "22:09", type: "unlock", label: "Unlocked · Married to the Wrong Billionaire E12", sub: "Bonus coins", bonus: -55, paid: 0, after: [300, 145], ref: "unl:4e10b7a2" },
    { id: "L-87984", day: "7 Oct", time: "22:05", type: "unlock", label: "Unlocked · Married to the Wrong Billionaire E11", sub: "Bonus coins", bonus: -55, paid: 0, after: [300, 200], ref: "unl:3d77c9f4" },
    { id: "L-87981", day: "7 Oct", time: "22:02", type: "unlock", label: "Unlocked · Married to the Wrong Billionaire E10", sub: "Bonus coins", bonus: -55, paid: 0, after: [300, 255], ref: "unl:2c08e1b6" },
    { id: "L-87977", day: "7 Oct", time: "21:58", type: "topup", label: "First top-up · 300 + 300 bonus", sub: "$1.99 · Google Play · verified", bonus: 300, paid: 300, after: [300, 310], ref: "GPA.3381-2204-7719-04512", money: "$1.99", exp: "14 Oct" },
    { id: "L-87901", day: "7 Oct", time: "09:00", type: "checkin", label: "Daily check-in · Day 1", sub: "Streak 1 of 7", bonus: 10, paid: 0, after: [0, 10], ref: "streak:1", exp: "14 Oct" },
    { id: "L-87120", day: "3 Oct", time: "00:00", type: "expire", label: "Bonus coins expired", sub: "From the welcome bonus (26 Sep)", bonus: -45, paid: 0, after: [0, 0], ref: "exp:batch:0926" },
    { id: "L-86733", day: "27 Sep", time: "21:10", type: "unlock", label: "Unlocked · Married to the Wrong Billionaire E9", sub: "Bonus coins", bonus: -55, paid: 0, after: [0, 45], ref: "unl:1a6f02d9" },
    { id: "L-86004", day: "26 Sep", time: "20:15", type: "welcome", label: "Welcome bonus", sub: "New account", bonus: 100, paid: 0, after: [0, 100], ref: "promo:welcome", exp: "3 Oct" }
  ];

  /* ---------- store ---------- */
  const PACKS = [
    { id: "first", coins: 300, bonus: 300, price: 1.99, first: true, label: "First top-up · once" },
    { id: "p500", coins: 500, bonus: 50, price: 4.99 },
    { id: "p1000", coins: 1000, bonus: 200, price: 9.99, popular: true },
    { id: "p2000", coins: 2000, bonus: 600, price: 19.99 },
    { id: "p5000", coins: 5000, bonus: 2000, price: 49.99, best: true }
  ];
  const VIP_PLANS = [
    { id: "week", name: "Weekly", price: 5.99, per: "week", note: "Renews every 7 days" },
    { id: "month", name: "Monthly", price: 19.99, per: "month", note: "≈ $4.61 a week · save 23%" },
    { id: "year", name: "Yearly", price: 119.99, per: "year", note: "≈ $2.31 a week · save 61%", best: true }
  ];
  const VIP_PERKS = [
    { icon: "unlock", t: "Every drama and series unlocked", s: "Except Premieres — new Originals are VIP-free after 7 days. We label them." },
    { icon: "ban", t: "No ads. Ever.", s: "Not between episodes, not on the paywall, not anywhere." },
    { icon: "download", t: "Downloads for offline", s: "Up to 100 episodes on two devices." },
    { icon: "hd", t: "1080p and early drops", s: "New episodes 24 hours early on followed series." },
    { icon: "coin", t: "Double check-in coins", s: "Useful for creator series and gifts." }
  ];
  const REWARDS = {
    ladder: [10, 10, 15, 15, 20, 25, 60],
    adCoins: 15, adCap: 6, adLen: "≤ 30 s",
    tasks: [
      { id: "alerts", icon: "bell", t: "Turn on drop alerts", coins: 30, done: false },
      { id: "follow", icon: "bookmark", t: "Follow 3 series", coins: 20, progress: [4, 3], done: true },
      { id: "call", icon: "poll", t: "Make a Cliffhanger Call", coins: 5, progress: [0, 3], done: false, note: "Up to 3 a day" },
      { id: "watch", icon: "clock", t: "Watch 15 minutes today", coins: 20, progress: [9, 15], done: false },
      { id: "rate", icon: "star", t: "Rate a series you've watched", coins: 10, done: false },
      { id: "invite", icon: "gift", t: "Send a Cliffhanger to a friend", coins: 100, done: false, note: "When they finish the episode" }
    ]
  };

  /* ---------- creators & UGC ---------- */
  const CREATORS = [
    { id: "ritu", name: "Ritu Sharma", handle: "@ritu.makes", followers: 412000, verified: true, partner: true, share: .5, city: "Mumbai", region: "IN", bio: "Sketch comedy about flatmates, families and fridges.", earnings30: 4120, fanLinks: 380, pal: ["#2b1230", "#8a3a7a", "#ffd0e8"], kind: "woman", hair: "long", videos: 186 },
    { id: "mina", name: "Mina Park", handle: "@minaplays", followers: 520000, verified: true, partner: true, share: .4, city: "Los Angeles", region: "US", bio: "Fan edits, theories and slap rankings. Not affiliated with your favourite CEO.", earnings30: 6840, fanLinks: 5210, pal: ["#101c33", "#2a4f8a", "#ffe0b0"], kind: "woman", hair: "bob", videos: 241 },
    { id: "kofi", name: "Kofi Mensah", handle: "@kofi.films", followers: 61200, verified: false, partner: false, share: .5, city: "Accra", region: "GH", bio: "Horror on a $300 budget. Pilot Season: Ghost Signals.", earnings30: 0, fanLinks: 0, pal: ["#0f2a2a", "#1f6b62", "#ffd9a0"], kind: "man", hair: "short", videos: 34 },
    { id: "lola", name: "Lola Bennett", handle: "@lolawrites", followers: 233000, verified: true, partner: true, share: .45, city: "London", region: "GB", bio: "Storytimes and office romcoms. Writing Desk 14.", earnings30: 2210, fanLinks: 640, pal: ["#2a0f16", "#7a2335", "#ffc0a8"], kind: "woman", hair: "long", videos: 128 },
    { id: "diego", name: "Diego Álvarez", handle: "@diegoframes", followers: 98400, verified: true, partner: false, share: .5, city: "Mexico City", region: "MX", bio: "One-take short films. The Last Delivery is my pilot.", earnings30: 0, fanLinks: 0, pal: ["#2a1f0c", "#7a5520", "#fff0c8"], kind: "man", hair: "cap", videos: 41 },
    { id: "arjun", name: "Arjun Mehta", handle: "@arjun.vlogs", followers: 156000, verified: false, partner: true, share: .5, city: "Delhi", region: "IN", bio: "₹500-a-day travel. Chai, trains, chaos.", earnings30: 940, fanLinks: 22, pal: ["#14260f", "#3f6b2a", "#f8f0c0"], kind: "man", hair: "short", videos: 97 },
    { id: "zara", name: "Zara Q", handle: "@zaraq.moves", followers: 1300000, verified: true, partner: true, share: .4, city: "Manila", region: "PH", bio: "Choreo to every drama theme song.", earnings30: 9120, fanLinks: 7400, pal: ["#160624", "#4a0f5c", "#ff5cc8"], kind: "woman", hair: "bun", videos: 312 },
    { id: "neel", name: "Neel Joshi", handle: "@neel.jokes", followers: 88000, verified: false, partner: false, share: .5, city: "Pune", region: "IN", bio: "Stand-up. Broke, but in HD.", earnings30: 0, fanLinks: 40, pal: ["#120a04", "#3a2108", "#ffc44d"], kind: "man", hair: "short", videos: 52 }
  ];
  const C = Object.fromEntries(CREATORS.map(c => [c.id, c]));

  /* status: live | review | processing | flagged | rejected | needs-changes
     link: a drama this video is tagged with (Fan Link). When a viewer taps
     "Watch E1" from it and later unlocks, the creator earns the share. */
  const VIDEOS = [
    { id: "v1", by: "mina", title: "Every slap in Divorce Day, ranked", cat: "fanedit", dur: 72, views: 2100000, likes: 310000, comments: 8200, status: "live", link: "divorce", posted: "2d", art: { pal: ["#120607", "#3a0d10", "#ff4d3d"], motif: "shards", fig: "close", lead: "woman", hair: "bob", seed: "v1" } },
    { id: "v2", by: "zara", title: "The Heiress theme — full choreo", cat: "dance", dur: 32, views: 3300000, likes: 540000, comments: 12100, status: "live", link: "heiress", posted: "5h", sound: "“Collect” — Heiress OST" },
    { id: "v3", by: "ritu", title: "When your mom finds your coin balance", cat: "sketch", dur: 48, views: 860000, likes: 120000, comments: 3100, status: "live", posted: "1d" },
    { id: "v4", by: "mina", title: "Who sent Ava the text? My theory", cat: "theory", dur: 90, views: 980000, likes: 88000, comments: 14300, status: "live", link: "heiress", posted: "18h", art: { pal: ["#1a0710", "#5b0f1f", "#ff8a5c"], motif: "blinds", fig: "over", lead: "woman", seed: "v4" } },
    { id: "v5", by: "kofi", title: "Ghost Signals · Pilot E1", cat: "horror", dur: 98, views: 1400000, likes: 210000, comments: 9100, status: "live", pilot: "ghost", posted: "6d" },
    { id: "v6", by: "lola", title: "Storytime: I was the fake fiancée (for real)", cat: "storytime", dur: 125, views: 540000, likes: 61000, comments: 2400, status: "live", link: "fake", posted: "3d" },
    { id: "v7", by: "arjun", title: "₹500 a day in Old Delhi", cat: "travel", dur: 400, views: 312000, likes: 29000, comments: 880, status: "live", orient: "landscape", posted: "4d" },
    { id: "v8", by: "diego", title: "One Take: The Rooftop", cat: "shortfilm", dur: 200, views: 211000, likes: 34000, comments: 1200, status: "live", posted: "1w" },
    { id: "v9", by: "neel", title: "Drama apps explained by a broke man", cat: "standup", dur: 64, views: 670000, likes: 92000, comments: 5100, status: "live", posted: "2d" },
    { id: "v10", by: "ritu", title: "Flatmates S2 · E14 “The Fridge Treaty”", cat: "comedy", dur: 65, views: 1100000, likes: 170000, comments: 6600, status: "live", series: "flatmates", posted: "3d" },
    { id: "v11", by: "kofi", title: "How we shot Ghost Signals for $300", cat: "behind", dur: 140, views: 88000, likes: 9100, comments: 640, status: "live", pilot: "ghost", posted: "5d" },
    { id: "v12", by: "lola", title: "Desk 14 · Pilot E2", cat: "storytime", dur: 88, views: 410000, likes: 52000, comments: 3900, status: "live", pilot: "desk14", posted: "2d", art: { pal: ["#0b0d12", "#24324a", "#ffcf9e"], motif: "city", fig: "woman", hair: "bob", seed: "v12" } },
    /* moderation & pipeline examples (admin) */
    { id: "v13", by: "neel", title: "Heiress E23 LEAKED full episode", cat: "fanedit", dur: 96, views: 0, likes: 0, comments: 0, status: "flagged", flag: "Content match · The Heiress Returns E23 (96%)", posted: "12m", art: { pal: ["#1a0710", "#5b0f1f", "#ff8a5c"], motif: "bokeh", fig: "woman", hair: "long", seed: "v13" } },
    { id: "v14", by: "arjun", title: "Gym prank on my brother", cat: "comedy", dur: 41, views: 18200, likes: 900, comments: 410, status: "review", flag: "Reported 14× · Dangerous acts", posted: "3h" },
    { id: "v15", by: "zara", title: "Moonbound howl challenge", cat: "dance", dur: 28, views: 0, likes: 0, comments: 0, status: "processing", link: "moonbound", posted: "4m", progress: .64 },
    { id: "v16", by: "mina", title: "Vows of the Don — ending explained", cat: "theory", dur: 110, views: 0, likes: 0, comments: 0, status: "review", flag: "Spoiler label missing", link: "mafia", posted: "40m" },
    { id: "v17", by: "diego", title: "The Last Delivery · Pilot E3", cat: "shortfilm", dur: 104, views: 0, likes: 0, comments: 0, status: "review", pilot: "lastdelivery", flag: "Pilot episode · human review", posted: "1h", art: { pal: ["#08060a", "#24121c", "#ff7a59"], motif: "road", fig: "far", lead: "man", seed: "v17" } },
    { id: "v18", by: "ritu", title: "Aunty Knows Best · Pilot E2", cat: "sketch", dur: 76, views: 0, likes: 0, comments: 0, status: "needs-changes", pilot: "aunty", flag: "Music not cleared (00:12–00:31)", posted: "1d" }
  ];
  const V = Object.fromEntries(VIDEOS.map(v => [v.id, v]));

  /* ---------- community ---------- */
  const COMMENTS = {
    "heiress:7": [
      { id: "c0", by: "Spool", handle: "@spool", official: true, pinned: true, t: null, text: "E8 drops tonight at 8 PM. Make your Cliffhanger Call before then 👀", likes: 9100, ago: "2h" },
      { id: "c1", by: "Ava Stan", handle: "@ava_stan", t: 42, text: "THE SLAP. I screamed so loud my cat left the room", likes: 4200, ago: "1h", replies: 132 },
      { id: "c2", by: "Kim Jun", handle: "@k_jun", t: 14, text: "Victor really didn't recognise her because of a haircut? 😂", likes: 3100, ago: "3h", replies: 88 },
      { id: "c3", by: "Dev", handle: "@devnotdavid", t: 57, text: "“I didn't come back, I came to collect” is going on my gravestone", likes: 2600, ago: "2h", replies: 41 },
      { id: "c4", by: "Mira K", handle: "@mira.k", t: 81, text: "Ethan sent it. Calling it now.", likes: 1800, ago: "50m", replies: 96 },
      { id: "c5", by: "Luz María", handle: "@luzmaria", t: null, spoiler: "E12", text: "Grandma Lin knew the whole time — watch her hands at the dinner", likes: 650, ago: "4h", replies: 23 },
      { id: "c6", by: "Priya", handle: "@priya.reads", t: 33, text: "the bodyguard's face when she walked in 🫠", likes: 1200, ago: "5h", replies: 17 }
    ]
  };
  const REVIEWS = {
    heiress: [
      { by: "Hannah M.", stars: 5, eps: 22, text: "Better acting than most of these apps, and the gala episode is worth it on its own.", helpful: 1240, ago: "2d" },
      { by: "Aisha K.", stars: 5, eps: 24, text: "Finally an app that tells you what finishing a series costs. I bought the pass and knew exactly what I paid.", helpful: 980, ago: "4d" },
      { by: "Jorge R.", stars: 4, eps: 18, text: "Love it. I just wish drops were twice a day.", helpful: 410, ago: "1w" },
      { by: "Mark T.", stars: 3, eps: 14, text: "The middle drags a bit (11–14) but it picks up.", helpful: 220, ago: "1w", reply: "Thanks Mark — E15 is where it turns. — Spool team" }
    ]
  };

  const INBOX = [
    { id: "n1", icon: "calendar", kind: "drop", t: "E23 of The Heiress Returns drops in 1 hour", s: "You follow this series · Tonight 8:00 PM", ago: "now", go: "series/heiress", unread: true },
    { id: "n2", icon: "poll", kind: "call", t: "You called it on Married to the Wrong Billionaire", s: "+5 bonus coins · 31% of viewers got it right", ago: "2h", go: "wallet", unread: true },
    { id: "n3", icon: "hourglass", kind: "expiry", t: "20 bonus coins expire on 16 Oct", s: "They're spent first, before your paid coins", ago: "5h", go: "wallet", unread: true },
    { id: "n4", icon: "clapper", kind: "pilot", t: "The Last Delivery is 358 votes from Greenlight", s: "Pilot Season · 81% of viewers finish all 3 episodes", ago: "8h", go: "series/lastdelivery" },
    { id: "n5", icon: "video", kind: "creator", t: "Ritu Sharma posted Flatmates S2 E14", s: "“The Fridge Treaty” · 1:05", ago: "1d", go: "creator/ritu" },
    { id: "n6", icon: "comment", kind: "reply", t: "@mira.k replied to your comment", s: "“no way it's Celeste, she was on stage”", ago: "1d", go: "player/heiress/7" },
    { id: "n7", icon: "activity", kind: "recap", t: "Your week: 2 h 14 m across 4 series", s: "You spent 240 coins · cap 300/day never reached", ago: "3d", go: "wallet" }
  ];

  /* ---------- admin: operations ---------- */
  const TEAM = [
    { id: "riya", name: "Riya Desai", email: "riya@spool.tv", role: "Owner", last: "Now", kind: "woman", hair: "long" },
    { id: "omar", name: "Omar Haddad", email: "omar@spool.tv", role: "Content manager", last: "12 min ago", kind: "man", hair: "short" },
    { id: "grace", name: "Grace Liu", email: "grace@spool.tv", role: "Moderator", last: "Now", kind: "woman", hair: "bob" },
    { id: "tomas", name: "Tomás Ruiz", email: "tomas@spool.tv", role: "Finance", last: "1 h ago", kind: "man", hair: "short" },
    { id: "ana", name: "Ana Pereira", email: "ana@spool.tv", role: "Growth", last: "Yesterday", kind: "woman", hair: "bun" },
    { id: "sam", name: "Sam Okoro", email: "sam@spool.tv", role: "Admin", last: "3 h ago", kind: "man", hair: "cap" },
    { id: "lee", name: "Hyun Lee", email: "lee@spool.tv", role: "Support", last: "20 min ago", kind: "man", hair: "short" }
  ];
  const ROLES = [
    { k: "Owner", n: 1, d: "Everything, including billing and deleting the workspace." },
    { k: "Admin", n: 1, d: "Everything except billing and ownership." },
    { k: "Content manager", n: 1, d: "Titles, episodes, uploads, schedule, home layout." },
    { k: "Moderator", n: 1, d: "Moderation queue, UGC review, comment and review actions." },
    { k: "Finance", n: 1, d: "Transactions, refunds, payouts, ledger adjustments." },
    { k: "Growth", n: 1, d: "Campaigns, push, experiments, pricing proposals." },
    { k: "Support", n: 1, d: "Users, ledger view, restore purchases, refunds up to $20." }
  ];
  const PERMS = [
    ["Titles & episodes", [2, 2, 2, 0, 0, 1, 1]],
    ["Uploads & pipeline", [2, 2, 2, 0, 0, 0, 0]],
    ["Home layout", [2, 2, 2, 0, 0, 1, 0]],
    ["Moderation", [2, 2, 1, 2, 0, 0, 1]],
    ["Creators & payouts", [2, 2, 1, 1, 2, 0, 0]],
    ["Users & ledger", [2, 2, 0, 1, 2, 1, 1]],
    ["Ledger adjustments", [2, 2, 0, 0, 2, 0, 1]],
    ["Refunds", [2, 2, 0, 0, 2, 0, 1]],
    ["Pricing & regions", [2, 2, 0, 0, 1, 1, 0]],
    ["Paywall Lab", [2, 2, 1, 0, 1, 2, 0]],
    ["Campaigns & push", [2, 2, 1, 0, 0, 2, 0]],
    ["Settings & keys", [2, 1, 0, 0, 0, 0, 0]],
    ["Billing", [2, 0, 0, 0, 1, 0, 0]]
  ];

  const FIRST = ["Maya", "Liam", "Aarav", "Sofia", "Noah", "Ananya", "Lucas", "Isabella", "Kabir", "Emma", "Mateo", "Zoe", "Rohan", "Camila", "Ethan", "Priya", "Gabriel", "Chloe", "Vihaan", "Mia", "Diego", "Aisha", "Leo", "Nina", "Arjun", "Hana", "Omar", "Grace", "Rafael", "Ivy", "Tara", "Jonah", "Meera", "Elena", "Sam", "Rina", "Felix", "Ada", "Kiran", "Luna"];
  const LAST = ["Rao", "Smith", "Sharma", "García", "Johnson", "Iyer", "Silva", "Rossi", "Kapoor", "Brown", "Torres", "Lee", "Mehta", "Santos", "Clark", "Nair", "Costa", "Martin", "Gupta", "Lopez", "Reyes", "Khan", "Wright", "Park", "Das", "Tanaka", "Haddad", "Liu", "Pereira", "Carter", "Okafor", "Bell", "Pillai", "Novak", "Ward", "Cruz", "Weber", "Lin", "Bose", "Moreno"];
  const RC = ["US", "US", "US", "IN", "IN", "IN", "PH", "BR", "GB", "CA", "MX", "ID", "DE"];
  const USERS = (function () {
    const r = rng("users");
    const out = [];
    for (let i = 0; i < 48; i++) {
      const region = i === 0 ? "US" : RC[Math.floor(r() * RC.length)];
      const seg = i === 0 ? "Payer" : r() < .12 ? "VIP" : r() < .32 ? "Payer" : r() < .85 ? "Free" : "Creator";
      const ltv = seg === "VIP" ? 40 + r() * 260 : seg === "Payer" ? 5 + r() * 120 : seg === "Creator" ? r() * 20 : 0;
      out.push({
        id: "u_" + (10293 + i * 37),
        name: i === 0 ? "Maya Rao" : FIRST[i % FIRST.length] + " " + LAST[(i * 7) % LAST.length],
        email: i === 0 ? "maya.rao@gmail.com" : (FIRST[i % FIRST.length] + "." + LAST[(i * 7) % LAST.length]).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + (r() < .5 ? "@gmail.com" : "@icloud.com"),
        region: region,
        seg: seg,
        status: i === 7 ? "Banned" : i === 13 ? "Refund review" : i === 21 ? "Deletion requested" : "Active",
        paid: i === 0 ? 165 : Math.round(seg === "Free" ? 0 : r() * 1800),
        bonus: i === 0 ? 45 : Math.round(r() * 120),
        ltv: i === 0 ? 14.97 : Math.round(ltv * 100) / 100,
        joined: ["26 Sep 2026", "3 Aug 2026", "14 Jul 2026", "1 Oct 2026", "21 May 2026", "8 Sep 2026"][i % 6],
        last: ["Now", "2 min ago", "1 h ago", "Yesterday", "3 days ago", "2 weeks ago"][Math.floor(r() * 6)],
        device: r() < .62 ? "Android" : r() < .9 ? "iOS" : "Web",
        watch: Math.round(r() * 3200),
        sign: ["Google", "Apple", "Phone", "Guest"][Math.floor(r() * 4)],
        kind: r() < .55 ? "woman" : "man"
      });
    }
    return out;
  })();

  const TXNS = (function () {
    const r = rng("txns");
    const items = [
      ["Coin pack · 1,000 + 200", 9.99, "coins"], ["Coin pack · 500 + 50", 4.99, "coins"], ["VIP Weekly", 5.99, "vip"],
      ["VIP Yearly", 119.99, "vip"], ["Series Pass · The Heiress Returns", 24.9, "pass"], ["First top-up · 300 + 300", 1.99, "coins"],
      ["Coin pack · 2,000 + 600", 19.99, "coins"], ["VIP Monthly", 19.99, "vip"], ["Coin pack · 5,000 + 2,000", 49.99, "coins"]
    ];
    const stores = ["Google Play", "App Store", "Web · Stripe", "Web · Razorpay", "Web · PayPal"];
    const out = [];
    for (let i = 0; i < 40; i++) {
      const it = items[Math.floor(r() * items.length)];
      const u = USERS[Math.floor(r() * USERS.length)];
      const st = i === 3 ? "Refunded" : i === 9 ? "Delivery retried" : i === 15 ? "Chargeback" : i === 22 ? "Pending" : "Completed";
      out.push({
        id: "T-" + (530912 - i * 13),
        user: u.id, userName: u.name, region: u.region,
        item: it[0], amount: it[1], kind: it[2],
        store: u.region === "IN" && r() < .6 ? "Web · Razorpay" : stores[Math.floor(r() * (i % 4 ? 2 : 5))],
        status: st,
        verified: st !== "Pending",
        when: i < 6 ? (2 + i * 7) + " min ago" : i < 18 ? (i - 5) + " h ago" : "Yesterday"
      });
    }
    return out;
  })();

  const PIPELINE = [
    { id: "up-2291", file: "heiress_s1_e25_master.mov", title: "The Heiress Returns · E25", size: "2.4 GB", stage: "transcode", progress: .62, renditions: ["240p", "360p", "540p", "720p"], eta: "3 min", by: "Omar Haddad" },
    { id: "up-2290", file: "heiress_s1_e24_master.mov", title: "The Heiress Returns · E24", size: "2.3 GB", stage: "ready", progress: 1, renditions: ["240p", "360p", "540p", "720p", "1080p"], scheduled: "Tomorrow 8:00 PM", by: "Omar Haddad" },
    { id: "up-2289", file: "moonbound_e47.mp4", title: "Moonbound · E47", size: "1.9 GB", stage: "subtitles", progress: .4, renditions: ["240p", "360p", "540p", "720p", "1080p"], eta: "AI subtitles · 6 languages", by: "Omar Haddad" },
    { id: "up-2288", file: "crown_e41.mp4", title: "Glass Crown · E41", size: "2.0 GB", stage: "upload", progress: .28, renditions: [], eta: "8 min", by: "Omar Haddad" },
    { id: "up-2287", file: "sindoor_e62_hi.mp4", title: "Sindoor Ka Badla · E62", size: "1.4 GB", stage: "dubbing", progress: .55, renditions: ["240p", "360p", "540p", "720p", "1080p"], eta: "English AI voice", by: "Omar Haddad" },
    { id: "up-2286", file: "rebirth_e34.mov", title: "Reborn, I Chose Myself · E34", size: "2.6 GB", stage: "failed", progress: .1, renditions: [], error: "Audio track missing (stream 1)", by: "Omar Haddad" },
    { id: "up-2285", file: "import_batch_ten_years.csv", title: "CSV import · 50 episodes", size: "48 KB", stage: "ready", progress: 1, renditions: [], note: "50 rows · 0 errors · linked to 50 files", by: "Omar Haddad" }
  ];

  const MOD_QUEUE = [
    { id: "m1", type: "video", ref: "v13", reason: "Content match", detail: "96% match with The Heiress Returns E23 (unreleased)", score: .96, reports: 0, age: "12 min", sla: "ok", auto: "Hidden automatically" },
    { id: "m2", type: "video", ref: "v14", reason: "Reported · Dangerous acts", detail: "14 reports in 3 h · auto-mod: low risk", score: .38, reports: 14, age: "3 h", sla: "warn", auto: "Still visible — below hide threshold (20)" },
    { id: "m3", type: "comment", reason: "Harassment", text: "nobody asked for your opinion, delete your account loser", by: "@tr0llface", on: "Moonbound E22", score: .88, reports: 6, age: "25 min", sla: "ok", auto: "Held for review" },
    { id: "m4", type: "comment", reason: "Spoiler without label", text: "lol Celeste dies in E31 btw", by: "@spoilerking", on: "The Heiress Returns E7", score: .71, reports: 22, age: "40 min", sla: "ok", auto: "Blurred automatically" },
    { id: "m5", type: "review", reason: "Off-topic / spam", text: "Free coins here → spoo1-coins.biz", by: "@coins4u", on: "Glass Crown", score: .99, reports: 3, age: "1 h", sla: "ok", auto: "Hidden · link blocklist" },
    { id: "m6", type: "video", ref: "v16", reason: "Spoiler label missing", detail: "Creator theory video about a series ending", score: .52, reports: 4, age: "40 min", sla: "ok", auto: "Waiting for label" },
    { id: "m7", type: "video", ref: "v17", reason: "Pilot episode", detail: "Pilot Season entries get a human check: rights, quality, age rating", score: .05, reports: 0, age: "1 h", sla: "ok", auto: "Passed auto-checks" },
    { id: "m8", type: "comment", reason: "Hate speech", text: "[redacted by auto-mod]", by: "@anon_8812", on: "Sindoor Ka Badla E40", score: .97, reports: 9, age: "2 h", sla: "breach", auto: "Hidden · account restricted" },
    { id: "m9", type: "review", reason: "Fake review pattern", text: "Best app!!! 5 stars!!! download now!!!", by: "12 accounts", on: "Divorce Day", score: .83, reports: 0, age: "3 h", sla: "warn", auto: "Excluded from score" },
    { id: "m10", type: "creator", reason: "Payout identity check", detail: "Kofi Mensah — first payout request, ID document submitted", score: 0, reports: 0, age: "5 h", sla: "warn", auto: "Manual" }
  ];

  const PAYOUTS = [
    { id: "po-118", creator: "zara", amount: 9120, method: "Bank · PHP", status: "Pending", requested: "Today", fanLinks: 7400 },
    { id: "po-117", creator: "mina", amount: 6840, method: "PayPal", status: "Pending", requested: "Today", fanLinks: 5210 },
    { id: "po-116", creator: "ritu", amount: 4120, method: "Bank · UPI", status: "Pending", requested: "Yesterday", fanLinks: 380 },
    { id: "po-115", creator: "lola", amount: 2210, method: "Bank · GBP", status: "Approved", requested: "2 Oct", fanLinks: 640 },
    { id: "po-114", creator: "arjun", amount: 940, method: "Bank · UPI", status: "Paid", requested: "28 Sep", fanLinks: 22 },
    { id: "po-113", creator: "kofi", amount: 300, method: "Mobile money · GHS", status: "On hold", requested: "Today", fanLinks: 0, note: "Identity check" }
  ];

  const EXPERIMENTS = [
    { id: "x-31", name: "Paywall position · E8 vs E10", title: "contract", status: "Running", started: "28 Sep", traffic: "50 / 50", metric: "Revenue per viewer (14 d)", a: { n: "E10 (control)", v: 0.412, conv: .104 }, b: { n: "E8", v: 0.438, conv: .118 }, lift: .063, conf: .94, guard: "Day-7 retention −0.4 pts (within limit)" },
    { id: "x-30", name: "Series Pass discount · 30% vs 40%", title: "heiress", status: "Shipped", started: "12 Sep", traffic: "50 / 50", metric: "Pass purchases per 1K paywall views", a: { n: "30% off", v: 8.1, conv: .0081 }, b: { n: "40% off", v: 11.9, conv: .0119 }, lift: .47, conf: .99, guard: "Coin revenue per viewer +3.1%" },
    { id: "x-29", name: "Ad unlocks per day · 10 vs 20 (India)", title: "sindoor", status: "Running", started: "2 Oct", traffic: "50 / 50", metric: "Episodes watched per DAU", a: { n: "10 / day", v: 6.4, conv: .21 }, b: { n: "20 / day", v: 8.9, conv: .26 }, lift: .39, conf: .88, guard: "eCPM −6% (fill drops after 12 ads)" },
    { id: "x-28", name: "Free episodes · 8 vs 12 (Brazil)", title: "mafia", status: "Stopped", started: "15 Aug", traffic: "50 / 50", metric: "Revenue per viewer (14 d)", a: { n: "8 free", v: 0.091, conv: .081 }, b: { n: "12 free", v: 0.084, conv: .077 }, lift: -.077, conf: .9, guard: "No retention gain" }
  ];

  const CAMPAIGNS = [
    { id: "cp-1", name: "Cliffhanger win-back", kind: "Automation", trigger: "Stopped at a locked episode · no unlock in 24 h", offer: "Next episode free (once per series)", status: "Active", sent: 182400, conv: .182, revenue: 61200 },
    { id: "cp-2", name: "Bonus coins expiring", kind: "Automation", trigger: "Bonus coins expire in 48 h", offer: "Reminder only", status: "Active", sent: 96100, conv: .31, revenue: 0 },
    { id: "cp-3", name: "New episode drops", kind: "Automation", trigger: "Followed series publishes an episode", offer: "—", status: "Active", sent: 1204000, conv: .44, revenue: 0 },
    { id: "cp-4", name: "VIP renewal reminder", kind: "Automation", trigger: "24 h before any VIP renewal", offer: "Manage or cancel link", status: "Active · required", sent: 41800, conv: 0, revenue: 0, locked: true },
    { id: "cp-5", name: "Diwali Binge Weekend", kind: "Campaign", trigger: "IN · 31 Oct – 2 Nov", offer: "48 h Binge Pass ₹49", status: "Scheduled", sent: 0, conv: 0, revenue: 0 },
    { id: "cp-6", name: "Meta ad · “The Heiress Returns” (US)", kind: "Ad deep link", trigger: "spool.tv/r/heiress-e1", offer: "Promise: E1–E10 free · checked ✓", status: "Active", sent: 0, conv: .09, revenue: 0, promise: true }
  ];

  const AUDIT = [
    { who: "System", what: "Auto-hid video", obj: "v13 “Heiress E23 LEAKED…”", detail: "Content match 96% · creator notified", when: "Today 10:58" },
    { who: "Tomás Ruiz", what: "Adjusted wallet", obj: "Maya Rao (u_10293)", detail: "+60 paid coins · “Double charge on GPA.3381 — store refund pending”", when: "Today 10:41" },
    { who: "Grace Liu", what: "Removed comment", obj: "Moonbound E22", detail: "Harassment · user warned", when: "Today 10:12" },
    { who: "Omar Haddad", what: "Scheduled episode", obj: "The Heiress Returns E24", detail: "Release Tomorrow 8:00 PM (all regions)", when: "Today 09:55" },
    { who: "Ana Pereira", what: "Started experiment", obj: "x-29 Ad unlocks per day", detail: "India · 50/50 · guardrail eCPM", when: "2 Oct 15:20" },
    { who: "Riya Desai", what: "Changed region mode", obj: "Germany", detail: "Hybrid → Coins + VIP (ads off)", when: "1 Oct 11:02" },
    { who: "Sam Okoro", what: "Rotated API key", obj: "Payments webhook (Stripe)", detail: "Old key valid for 24 h", when: "30 Sep 18:44" },
    { who: "Grace Liu", what: "Approved pilot episode", obj: "Ghost Signals E3", detail: "Rights ✓ · Quality ✓ · 16+", when: "29 Sep 14:10" },
    { who: "Tomás Ruiz", what: "Approved payout", obj: "po-115 Lola Bennett", detail: "$2,210.00 · Bank GBP", when: "2 Oct 09:30" },
    { who: "Omar Haddad", what: "Edited pricing", obj: "Glass Crown", detail: "Free episodes 8 → 10 · price lock kept for current viewers", when: "28 Sep 12:00" }
  ];

  /* ---------- admin: analytics ---------- */
  const DAYS = 30;
  const SERIES = (function () {
    const r = rng("series");
    const dates = [];
    const d0 = new Date(2026, 8, 10);
    for (let i = 0; i < DAYS; i++) { const d = new Date(d0); d.setDate(d0.getDate() + i); dates.push(d); }
    const dau = [], coins = [], vip = [], ads = [], web = [];
    for (let i = 0; i < DAYS; i++) {
      const wk = [1, .97, .96, .98, 1.04, 1.12, 1.1][dates[i].getDay()];
      const trend = 1 + i * .009;
      dau.push(Math.round(1.52e6 * trend * wk * (.97 + r() * .06)));
      coins.push(Math.round(176e3 * trend * wk * (.92 + r() * .14)));
      vip.push(Math.round(102e3 * (1 + i * .006) * (.97 + r() * .06)));
      ads.push(Math.round(46e3 * trend * wk * (.9 + r() * .2)));
      web.push(Math.round(6.2e3 * (1 + i * .016) * (.85 + r() * .3)));
    }
    return { dates, dau, coins, vip, ads, web };
  })();

  /* Weekly cohorts: share of each install week still watching in week n. */
  const COHORTS = [
    { wk: "11 Aug", size: 402000, r: [1, .31, .22, .17, .14, .12, .11, .1] },
    { wk: "18 Aug", size: 436000, r: [1, .32, .23, .18, .15, .13, .12] },
    { wk: "25 Aug", size: 418000, r: [1, .33, .24, .19, .16, .14] },
    { wk: "1 Sep", size: 451000, r: [1, .34, .25, .2, .17] },
    { wk: "8 Sep", size: 478000, r: [1, .36, .27, .22] },
    { wk: "15 Sep", size: 497000, r: [1, .37, .28] },
    { wk: "22 Sep", size: 512000, r: [1, .38] },
    { wk: "29 Sep", size: 538000, r: [1] }
  ];

  /* Share of E1 starters who started each episode (The Heiress Returns). */
  /* E1–E7 free, paywall at E8: the drop there is the price moment. */
  const DROPOFF = [1, .9, .85, .81, .78, .75, .73, .47, .45, .44, .43, .42, .41, .405, .4, .395, .39, .385, .38, .375, .37, .365, .36, .355];

  const FUNNEL = [
    { k: "Reached a locked episode", v: 412000 },
    { k: "Saw unlock options", v: 405800 },
    { k: "Chose an option", v: 268300 },
    { k: "Unlocked", v: 249100 },
    { k: "Watched to the end", v: 231600 }
  ];
  const UNLOCK_MIX = [
    { k: "Rewarded ad", v: .44 },
    { k: "Coins", v: .37 },
    { k: "VIP", v: .13 },
    { k: "Series Pass", v: .04 },
    { k: "Win-back free", v: .02 }
  ];

  const AD_NETWORKS = [
    { id: "admob", name: "Google AdMob", status: "Live", regions: "All", ecpm: 11.4, fill: .97, share: .46 },
    { id: "max", name: "AppLovin MAX (mediation)", status: "Live", regions: "All", ecpm: 12.9, fill: .99, share: .31 },
    { id: "unity", name: "Unity Ads", status: "Live", regions: "IN · ID · PH · BR", ecpm: 4.1, fill: .92, share: .13 },
    { id: "meta", name: "Meta Audience Network", status: "Live", regions: "US · GB · CA · MX", ecpm: 13.6, fill: .81, share: .08 },
    { id: "pangle", name: "Pangle", status: "Paused", regions: "ID · PH", ecpm: 3.2, fill: .9, share: .02 }
  ];
  const GATEWAYS = [
    { id: "gplay", name: "Google Play Billing", kind: "In-app", on: true, regions: "All · Android", note: "Server-side receipt check" },
    { id: "apple", name: "Apple In-App Purchase", kind: "In-app", on: true, regions: "All · iOS", note: "App Store Server API v2" },
    { id: "stripe", name: "Stripe", kind: "Web", on: true, regions: "US · GB · CA · DE · MX", note: "Cards, Apple Pay, Google Pay" },
    { id: "razorpay", name: "Razorpay", kind: "Web", on: true, regions: "IN", note: "UPI, cards, netbanking" },
    { id: "paypal", name: "PayPal", kind: "Web", on: true, regions: "US · GB · DE · BR", note: "" },
    { id: "mp", name: "Mercado Pago", kind: "Web", on: false, regions: "BR · MX", note: "Pix, boleto" }
  ];

  /* ---------- sitemap (used by the hub, the stage and the admin nav) ---------- */
  const SITEMAP = {
    mobile: [
      { g: "First run", items: [["splash", "Splash"], ["onboard", "Pick what hooks you"], ["signin", "Save your progress"]] },
      { g: "Discover", items: [["home", "Home"], ["search", "Search & Scene Search"], ["charts", "Charts"], ["drops", "Drops calendar"], ["browse/Revenge", "Browse by trope"]] },
      { g: "Watch", items: [["series/heiress", "Series page"], ["player/heiress/7", "Vertical player"], ["player/heiress/8", "Paywall moment"], ["landscape/ledger/1", "Landscape player"]] },
      { g: "Scenes & creators", items: [["scenes", "Scenes feed"], ["creator/ritu", "Creator profile"], ["create", "Upload a video"], ["studio", "Creator Studio"], ["series/lastdelivery", "Pilot Season entry"]] },
      { g: "Library", items: [["library", "Library"], ["inbox", "Notifications"]] },
      { g: "Wallet & me", items: [["me", "Profile"], ["wallet", "Wallet & ledger"], ["store", "Top up"], ["vip", "VIP"], ["rewards", "Rewards"], ["settings", "Settings"]] }
    ],
    admin: [
      { g: "Overview", items: [["dashboard", "Dashboard", "home"]] },
      { g: "Content", items: [["titles", "Titles", "film"], ["titles/heiress", "Title editor", "edit"], ["upload", "Upload & pipeline", "upload"], ["schedule", "Release schedule", "calendar"], ["home-builder", "Home builder", "layout"]] },
      { g: "Community", items: [["ugc", "Creator videos", "video"], ["pilots", "Pilot Season", "clapper"], ["creators", "Creators & payouts", "users"], ["moderation", "Moderation", "shield"]] },
      { g: "Audience", items: [["users", "Users", "user"], ["campaigns", "Campaigns & push", "megaphone"]] },
      { g: "Money", items: [["monetization", "Monetization", "coins"], ["paywall-lab", "Paywall Lab", "percent"], ["transactions", "Transactions", "receipt"]] },
      { g: "Insights", items: [["analytics", "Analytics", "bars"]] },
      { g: "System", items: [["settings", "Settings", "settings"], ["team", "Team & roles", "key"], ["audit", "Audit log", "history"]] }
    ]
  };

  root.SPOOL = {
    rng, FMT, BRAND, REGIONS, TROPES, MOODS, TITLES, T, CAST, episodes, SCRIPT, genericScript,
    VIEWER, LEDGER, PACKS, VIP_PLANS, VIP_PERKS, REWARDS,
    CREATORS, C, VIDEOS, V, COMMENTS, REVIEWS, INBOX,
    TEAM, ROLES, PERMS, USERS, TXNS, PIPELINE, MOD_QUEUE, PAYOUTS, EXPERIMENTS, CAMPAIGNS, AUDIT,
    SERIES, COHORTS, DROPOFF, FUNNEL, UNLOCK_MIX, AD_NETWORKS, GATEWAYS, SITEMAP
  };
})(window);
