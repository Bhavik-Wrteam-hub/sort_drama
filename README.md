# Spool — short-drama platform UI prototype

A clickable, dependency-free prototype of **Spool** (working name): a short-drama-first streaming
app with a creator video layer, plus the admin panel (“Spool Studio”) that runs it.
It exists so the team can agree on **what to build and why** before any backend work.

Nothing persists. Every number is sample data. Video playback is simulated.

## Run it

- Open `index.html` in a browser (works from `file://`, no server needed), or
- copy the folder into XAMPP's `htdocs` and open `http://localhost/SortDrama/`.

| Entry point | What it is |
|---|---|
| `index.html` | Product brief: research, Google Play teardown, signature features, navigation, design language, screen map |
| `mobile.html` | Mobile prototype. The phone sits in the centre; panels around it carry the journey, the screen map, live events, what to try on this screen, and scenario controls |
| `admin.html` | Admin panel prototype: 20 sections across content, community, audience, money, insights and system |

Tip: in `mobile.html`, pick **The paywall moment** in the Journey panel and press *Next step*.
Press `/` to jump to any screen. Switch **Region → India** to see free-with-ads mode.

## File layout

```
SortDrama/
├── index.html            Product brief + links into both prototypes
├── mobile.html           Stage + phone
├── admin.html            Studio shell
└── assets/
    ├── fonts/            Geist, Geist Mono, Instrument Serif (SIL OFL, self-hosted)
    ├── css/
    │   ├── core.css      Tokens (ink/paper themes, accent), fonts, shared primitives (poster, coin, pills…)
    │   ├── mobile.css    Stage, device frame, every app component
    │   ├── admin.css     Shell, tables, forms, chart tokens, all admin components
    │   └── hub.css       Brief page
    └── js/
        ├── icons.js      Icon set (24px grid) + brand mark
        ├── art.js        Generated key art: posters, scene stills, thumbnails, avatars (SVG → blob URLs)
        ├── data.js       Mock data == data model spec (read this first)
        ├── mobile.js     App core: state, router, sheets, wallet/unlock rules, player engine
        ├── mobile-screens.js  Every screen
        ├── mobile-sheets.js   Sheets (Fair Unlock, top-up, store, recap, cast map…) and actions
        ├── stage.js      Panels around the phone, journeys, scenario, connectors, jump palette
        ├── admin-core.js Shell, router, components, SVG chart kit, tooltip, modal, drawer, palette
        ├── admin-pages.js   Dashboard, Titles + editor, Upload, Schedule, Home builder, UGC, Pilot Season
        └── admin-pages2.js  Creators, Moderation, Users, Campaigns, Monetization, Paywall Lab,
                             Transactions, Analytics, Settings, Team, Audit, Login
```

## The rules that must survive to production

These are the product, not decoration. Each answers a complaint that shows up across the top
Google Play short-drama apps (see `index.html › Google Play`).

1. **Price shown in coins and money** before every unlock, with the bonus/paid split.
2. **Bonus coins are spent first**, earliest expiry first. Paid coins never expire.
3. **Append-only ledger.** Every movement is a row with the balance after it. Refunds are reversal
   rows; admin adjustments need a reason and are audited.
4. **Unlocks are idempotent** — one key per (viewer, title, episode) — and tied to the account.
5. **Price lock:** the per-episode price a viewer started with can't rise for them.
6. **Auto-unlock is off by default** and always bounded by the viewer's daily spend cap.
7. **Rewarded ads:** 1 ad (≤ 30 s, never playable) = 1 reward; a failed ad still grants it.
8. **VIP:** no trial trap, renewal date shown before paying, reminder 24 h before every charge
   (cannot be disabled), cancel in two taps in the app, never an ad.
9. **Promise Guard:** ad deep links carry a server-side offer checked against the title's config.
10. **Episode length floor** (default 45 s) and a *Complete* badge for finished series.

In the code these live in `mobile.js` (`spend`, `unlock`, `buyPass`, `priceOf`, `costToFinish`)
and are shown as locked policies in `admin.html#/monetization?tab=fair`.

## Data model (from `assets/js/data.js`)

| Object | Key fields | Notes |
|---|---|---|
| `TITLES` | id, name, kind (`drama` · `series` · `movie` · `creator` · `pilot`), orient, tropes, eps, released, free, price, pass, status, schedule, audio[], subs, cast, admin{revenue30, completion, unlockRate, region[], rights} | One model for every format; a film is a title with one episode |
| `episodes(t)` | n, title, dur (s), released, free, views | Generated; the flagship has named episodes |
| `CAST` | name, actor, role, note, since (first episode), hidden | Drives the spoiler-safe *Who's who* |
| `SCRIPT["title:ep"]` | dur, lines[[start, end, speaker, text]], heat[], peaks[], call{q, options, answer, reveal} | Subtitles, the Pulse Bar track and the Cliffhanger Call |
| `VIEWER`, `LEDGER` | wallet{paid, bonus, bonusExpires}, unlocked, passes, priceLock, progress; ledger rows {type, label, paid, bonus, after[paid, bonus], ref, exp} | The ledger reconciles to the wallet |
| `REGIONS` | mode (`hybrid` · `ads` · `coins`), epPrice, freeEps, adsPerDay, vip[], coinValue, dau, arpdau | Per-country monetisation |
| `PACKS`, `VIP_PLANS`, `REWARDS` | coins, bonus, price, flags; plans; check-in ladder, ad coins, tasks | |
| `CREATORS`, `VIDEOS` | partner, share, fanLinks, earnings30; video status (`live` · `review` · `processing` · `flagged` · `needs-changes`), link (Fan Link), pilot | UGC and creator economy |
| `MOD_QUEUE`, `PIPELINE`, `PAYOUTS`, `EXPERIMENTS`, `CAMPAIGNS`, `TXNS`, `USERS`, `TEAM`, `ROLES`, `PERMS`, `AUDIT` | | Admin operations |
| `SERIES`, `COHORTS`, `DROPOFF`, `FUNNEL`, `UNLOCK_MIX` | 30-day series, weekly cohorts, drop-off by episode | Analytics |

## Design system

- **Themes:** the phone UI is always *ink* (dark). The stage, admin and brief follow the
  system theme with a toggle (*paper* light, *ink* dark).
- **Accent:** one token, `--accent` (default chartreuse `#C9F04F`). `[data-accent]` switches to
  ember, iris, rosé or aqua; text on the accent is always ink, so every option passes contrast.
  Changing it in *Admin › Settings › Branding* or the stage's Scenario panel recolours all three.
- **Fixed meanings:** coins are gold with the play-coin glyph, VIP is champagne with the crown,
  reactions are rose. Money is plain text, never gold.
- **Type:** Instrument Serif Italic for titles and editorial moments; Geist for interface and numbers.
- **Charts** (admin) use a separate, validated data palette — blue `#2a78d6`, orange `#eb6834`,
  aqua `#1baf7a` in light; `#3987e5`, `#d95926`, `#199e70` in dark — plus a one-hue blue ramp for
  funnels and cohort heatmaps. All passed the dataviz six checks on Spool's own surfaces
  (`#FFFFFF`, `#151517`). Aqua sits under 3:1 on white, so every chart that uses it ships direct
  labels and a **Table** view. Every chart has a hover tooltip and a table toggle.

## Mobile stage

- **Live events** shows what the app would send: `TRACK` (analytics), `LEDGER` (coin movements),
  `API` (calls with idempotency keys), `PUSH`, `AD`, `STORE`, `VIEW`.
- **Journeys:** first session, the paywall moment, out of coins, free with ads (India), coming back
  after 12 days, creator upload, pilot vote, scene search, VIP, daily habit, series & films.
- **Scenario:** viewer (new guest / regular / VIP), region, wallet, returning viewer, demo speed,
  push triggers (new drop, win-back, bonus expiring, VIP renewal, pilot greenlit, reply), accent.
- **Gestures in the player:** swipe/scroll/↑↓ for episodes, tap to pause, double-tap to like,
  long-press for 2×, tap a Pulse Bar emoji to jump, `C` comments, `E` episodes.
- Video time runs at 3× by default so an episode plays in ~30 s; labels show real time.
- Under 1180 px the left panels move into a drawer; under 900 px all panels do; under 560 px the
  app fills the screen.

## Porting notes

| Prototype | Production |
|---|---|
| `mobile.html` screens | Flutter (Android + iOS); the stage is prototype-only |
| Series pages, web wallet | Next.js (server-rendered SEO page per series and episode) |
| `admin.html` | Laravel admin on the same REST API |
| `data.js` objects | Database tables; `LEDGER` is append-only |
| `art.js` | Uploaded artwork. Generated art stands in for real posters |

## Known limitations

- No backend, no persistence beyond `localStorage` for theme/accent and panel state.
- Video, ads, store payment sheets and push delivery are simulated.
- Key art is generated; replace with licensed artwork for demos and store listings.
- “Spool” and chartreuse are working choices; both are single config values.
# sort_drama
