/* ==========================================================================
   Spool — icon set (24px grid, 1.8 stroke, round caps)
   --------------------------------------------------------------------------
   ic(name, size?, stroke?) returns an inline SVG string. Filled glyphs set
   their own fill. Shared by the mobile app, the admin panel and the hub.
   ========================================================================== */
(function (root) {
  "use strict";

  const P = {
    /* navigation */
    home: '<path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.6 1.6 0 0 1-1.6 1.6H15v-5.8H9v5.8H5.1A1.6 1.6 0 0 1 3.5 19z"/>',
    scenes: '<rect x="5.5" y="2.8" width="13" height="18.4" rx="3.2"/><path d="M10.4 9.1v5.8l4.6-2.9z" fill="currentColor" stroke="none"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    library: '<path d="M4.5 4v16M9 6.5V20M13.5 4.5V20M16.6 6.2l3.4 13.3"/>',
    user: '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0"/>',
    search: '<circle cx="11" cy="11" r="6.8"/><path d="m20.2 20.2-4.4-4.4"/>',
    bell: '<path d="M6.2 9.4a5.8 5.8 0 1 1 11.6 0c0 5.6 2.4 7.4 2.4 7.4H3.8s2.4-1.8 2.4-7.4"/><path d="M10.2 20.2a2 2 0 0 0 3.6 0"/>',
    back: '<path d="m14.5 5-7 7 7 7"/>',
    fwd: '<path d="m9.5 5 7 7-7 7"/>',
    down: '<path d="m5 9.5 7 7 7-7"/>',
    up: '<path d="m5 14.5 7-7 7 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    more: '<circle cx="5.5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
    morev: '<circle cx="12" cy="5.5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.6" fill="currentColor" stroke="none"/>',
    arrowr: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowl: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowu: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    arrowd: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    external: '<path d="M14 4h6v6M10 14 20 4M18 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H11"/>',
    grip: '<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>',

    /* playback */
    play: '<path d="M7.5 4.9v14.2a1 1 0 0 0 1.53.85l11.1-7.1a1 1 0 0 0 0-1.7L9.03 4.05A1 1 0 0 0 7.5 4.9z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4.5" width="4" height="15" rx="1.3" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1.3" fill="currentColor" stroke="none"/>',
    next: '<path d="M5.5 5.3v13.4a.9.9 0 0 0 1.4.75l9.6-6.7a.9.9 0 0 0 0-1.5L6.9 4.55a.9.9 0 0 0-1.4.75z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>',
    replay: '<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5"/>',
    back10: '<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M10 10.5v5M13 11.5a1 1 0 0 1 1-1h.6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1z"/>',
    fwd10: '<path d="M20 12a8 8 0 1 1-2.6-5.9L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M9 10.5v5M12 11.5a1 1 0 0 1 1-1h.6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H13a1 1 0 0 1-1-1z"/>',
    volume: '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 8.6a4.8 4.8 0 0 1 0 6.8M18.6 5.6a9 9 0 0 1 0 12.8"/>',
    mute: '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    cc: '<rect x="2.8" y="5" width="18.4" height="14" rx="3"/><path d="M10.6 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6"/>',
    speed: '<path d="M12 13.5 16 9"/><path d="M3.6 18.5a9.5 9.5 0 1 1 16.8 0"/><circle cx="12" cy="13.6" r="1.3" fill="currentColor" stroke="none"/>',
    hd: '<rect x="2.8" y="5" width="18.4" height="14" rx="3"/><path d="M7 9.2v5.6M10.6 9.2v5.6M7 12h3.6M13.6 9.2v5.6h1.3a2.8 2.8 0 0 0 0-5.6z"/>',
    expand: '<path d="M8.5 3.8H5.2a1.4 1.4 0 0 0-1.4 1.4v3.3M20.2 8.5V5.2a1.4 1.4 0 0 0-1.4-1.4h-3.3M3.8 15.5v3.3a1.4 1.4 0 0 0 1.4 1.4h3.3M15.5 20.2h3.3a1.4 1.4 0 0 0 1.4-1.4v-3.3"/>',
    rotate: '<rect x="3" y="9" width="12" height="11.5" rx="2"/><path d="M8.5 4.5h5.5a6 6 0 0 1 6 6v1.2"/><path d="m18 9.6 2 2.1 2-2.1"/>',
    headphones: '<path d="M3.5 17.5V13a8.5 8.5 0 0 1 17 0v4.5"/><path d="M20.5 18.2a2 2 0 0 1-2 2h-1.2v-6.5h3.2zM3.5 18.2a2 2 0 0 0 2 2h1.2v-6.5H3.5z"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.2A10 10 0 0 1 12 5c6.2 0 9.5 7 9.5 7a16.7 16.7 0 0 1-2.4 3.4M6.6 6.7C3.9 8.4 2.5 12 2.5 12s3.3 7 9.5 7c1.7 0 3.3-.5 4.6-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    eye: '<path d="M2.5 12S5.8 5 12 5s9.5 7 9.5 7-3.3 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/>',

    /* social */
    heart: '<path d="M12 20.3S3.3 15.3 3.3 9.3A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.7 2.4c0 6-8.7 11-8.7 11z"/>',
    heartf: '<path d="M12 20.3S3.3 15.3 3.3 9.3A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.7 2.4c0 6-8.7 11-8.7 11z" fill="currentColor"/>',
    bookmark: '<path d="M18.5 20.5 12 16.4l-6.5 4.1V5.2a1.7 1.7 0 0 1 1.7-1.7h9.6a1.7 1.7 0 0 1 1.7 1.7z"/>',
    bookmarkf: '<path d="M18.5 20.5 12 16.4l-6.5 4.1V5.2a1.7 1.7 0 0 1 1.7-1.7h9.6a1.7 1.7 0 0 1 1.7 1.7z" fill="currentColor"/>',
    comment: '<path d="M20.5 11.6a8.2 8.2 0 0 1-12 7.3L3.6 20.4l1.5-4.5a8.2 8.2 0 1 1 15.4-4.3z"/>',
    share: '<path d="M13.5 4.5 20 11l-6.5 6.5v-3.8C8.7 13.7 5.6 15.4 4 19c.4-5.6 3.5-9.8 9.5-10.6z"/>',
    send: '<path d="m21 3-7.4 18-3.5-7.6L2.5 9.9z"/><path d="M21 3 10.1 13.4"/>',
    link: '<path d="M10 13.5a4.6 4.6 0 0 0 6.9.5l2.7-2.7a4.6 4.6 0 0 0-6.5-6.5l-1.5 1.5"/><path d="M14 10.5a4.6 4.6 0 0 0-6.9-.5l-2.7 2.7a4.6 4.6 0 0 0 6.5 6.5l1.5-1.5"/>',
    copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.2"/><path d="M15.5 8.5V5.7a2.2 2.2 0 0 0-2.2-2.2H5.7a2.2 2.2 0 0 0-2.2 2.2v7.6a2.2 2.2 0 0 0 2.2 2.2h2.8"/>',
    userplus: '<circle cx="9.5" cy="8.2" r="3.8"/><path d="M2.8 20.2a6.8 6.8 0 0 1 13.4 0M18.8 8v6M15.8 11h6"/>',
    usercheck: '<circle cx="9.5" cy="8.2" r="3.8"/><path d="M2.8 20.2a6.8 6.8 0 0 1 13.4 0M16 11l2 2 3.8-3.8"/>',
    users: '<circle cx="9" cy="8.2" r="3.6"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M15.6 4.8a3.6 3.6 0 0 1 0 6.8M18.2 14.2A6.5 6.5 0 0 1 21.5 20"/>',
    smile: '<circle cx="12" cy="12" r="8.8"/><path d="M8.3 14.2s1.4 2 3.7 2 3.7-2 3.7-2M9.2 9.5h.01M14.8 9.5h.01"/>',
    thumb: '<path d="M7 10.5v10H4.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM7 10.5l3.8-7a2.6 2.6 0 0 1 2.7 2.6v3.4h5a2 2 0 0 1 2 2.3l-1.1 6.9a2 2 0 0 1-2 1.8H7"/>',
    flag: '<path d="M5 21V4M5 4h12.5l-2.2 4.2 2.2 4.3H5"/>',
    quote: '<path d="M9.5 7.5H6a2 2 0 0 0-2 2V13h4v3.5a2 2 0 0 1-2 2M20 7.5h-3.5a2 2 0 0 0-2 2V13h4v3.5a2 2 0 0 1-2 2"/>',

    /* money */
    coin: '<circle cx="12" cy="12" r="9.2" fill="currentColor" fill-opacity=".16"/><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="12" r="6.2" stroke-opacity=".55"/><path d="M10.4 9.2v5.6l4.6-2.8z" fill="currentColor" stroke="none"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.8"/><path d="M3 7v4.5c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8V7"/><path d="M9 14.3v1.9c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4.5c0-1.4-2.3-2.6-5.4-2.8"/>',
    crown: '<path d="M3 8.2 7.4 12 12 5l4.6 7L21 8.2 19.2 17H4.8z"/><path d="M5 20.3h14"/>',
    gift: '<rect x="3.3" y="8" width="17.4" height="4.2" rx="1.1"/><path d="M12 8v12.6M19 12.2v6.7a1.7 1.7 0 0 1-1.7 1.7H6.7A1.7 1.7 0 0 1 5 18.9v-6.7"/><path d="M7.7 8a2.4 2.4 0 0 1 0-4.8C10.2 3.2 12 8 12 8s1.8-4.8 4.3-4.8a2.4 2.4 0 0 1 0 4.8"/>',
    wallet: '<path d="M19.5 7.2V5.6a1.6 1.6 0 0 0-1.6-1.6H5.6A2.1 2.1 0 0 0 3.5 6.1v11.8a2.1 2.1 0 0 0 2.1 2.1h13.9a1.6 1.6 0 0 0 1.6-1.6v-2.6"/><path d="M3.5 6.6c0 .9.8 1.6 1.7 1.6h14.3a1.6 1.6 0 0 1 1.6 1.6v3.3"/><path d="M21 12.4h-4.2a1.8 1.8 0 0 0 0 3.6H21z"/>',
    card: '<rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.2"/><path d="M2.8 9.8h18.4M6.6 15h3.6"/>',
    receipt: '<path d="M5 3.2v17.6l2.3-1.4 2.4 1.4 2.3-1.4 2.3 1.4 2.4-1.4 2.3 1.4V3.2l-2.3 1.4-2.4-1.4L12 4.6 9.7 3.2 7.3 4.6z"/><path d="M8.6 9h6.8M8.6 12.6h6.8M8.6 16.2h4.2"/>',
    tag: '<path d="M20.3 13.3 13.3 20.3a1.9 1.9 0 0 1-2.7 0L3.5 13.2V3.5h9.7l7.1 7.1a1.9 1.9 0 0 1 0 2.7z"/><circle cx="8" cy="8" r="1.5"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.4"/><circle cx="17" cy="17" r="2.4"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.4a4 4 0 0 1 8 0v3.1"/>',
    unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.4a4 4 0 0 1 7.6-1.7"/>',
    ad: '<rect x="2.8" y="5" width="18.4" height="14" rx="3"/><path d="M6.6 15.2 8.8 8.8h.6l2.2 6.4M7.3 13.2h3M14.2 8.8v6.4h1.5a3.2 3.2 0 0 0 0-6.4z"/>',
    pass: '<path d="M3.5 8.4a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v1.5a2.2 2.2 0 0 0 0 4.2v1.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-1.5a2.2 2.2 0 0 0 0-4.2z"/><path d="M14.5 6.6v10.8" stroke-dasharray="1.6 2"/>',

    /* status */
    check: '<path d="M20 6.5 9.5 17 4 11.5"/>',
    checkc: '<circle cx="12" cy="12" r="8.8"/><path d="m8.2 12.2 2.6 2.6 5-5.3"/>',
    xc: '<circle cx="12" cy="12" r="8.8"/><path d="m9 9 6 6M15 9l-6 6"/>',
    info: '<circle cx="12" cy="12" r="8.8"/><path d="M12 16.2v-4.6M12 8.2h.01"/>',
    help: '<circle cx="12" cy="12" r="8.8"/><path d="M9.4 9.4a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.5-2.6 2.5M12 16.6h.01"/>',
    alert: '<path d="M10.3 4.3 2.6 17.6a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
    ban: '<circle cx="12" cy="12" r="8.8"/><path d="m5.8 5.8 12.4 12.4"/>',
    shield: '<path d="M12 3.2 4.8 6v5.6c0 4.4 3 8 7.2 9.2 4.2-1.2 7.2-4.8 7.2-9.2V6z"/>',
    shieldc: '<path d="M12 3.2 4.8 6v5.6c0 4.4 3 8 7.2 9.2 4.2-1.2 7.2-4.8 7.2-9.2V6z"/><path d="m9 12 2.2 2.2L15.3 10"/>',
    clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 7.2V12l3.2 2"/>',
    hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 4.5 4.5 6 4.5 8.5s-4.5 4-4.5 8.5M16.5 3.5c0 4.5-4.5 6-4.5 8.5s4.5 4 4.5 8.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    history: '<path d="M4 12a8 8 0 1 0 2.6-5.9L4 8.5"/><path d="M4 4v4.5h4.5M12 7.8V12l3 1.8"/>',
    refresh: '<path d="M20.2 12a8.2 8.2 0 0 1-14.3 5.5L3.8 15.4M3.8 12a8.2 8.2 0 0 1 14.3-5.5l2.1 2.1"/><path d="M20.2 3.8v4.8h-4.8M3.8 20.2v-4.8h4.8"/>',
    zap: '<path d="M13.2 2.8 4.5 13.5h7l-.9 7.7 8.9-10.8h-7z"/>',
    flame: '<path d="M12 21c-3.9 0-6.6-2.6-6.6-6.2 0-2.9 1.7-4.8 3.3-6.6.4 1.8 1.4 3 2.6 3.4-.5-3.3.8-6.4 3.6-8.6.3 2.9 1.6 4.6 3.2 6.4 1.4 1.6 2.5 3.3 2.5 5.4 0 3.6-2.7 6.2-6.6 6.2z"/><path d="M12 21c-1.7 0-2.9-1.2-2.9-2.8 0-1.7 1.4-2.8 2.9-4.6 1.5 1.8 2.9 2.9 2.9 4.6 0 1.6-1.2 2.8-2.9 2.8z"/>',
    star: '<path d="m12 3.4 2.7 5.5 6 .9-4.35 4.25 1 6L12 17.2l-5.4 2.85 1-6L3.3 9.8l6-.9z"/>',
    starf: '<path d="m12 3.4 2.7 5.5 6 .9-4.35 4.25 1 6L12 17.2l-5.4 2.85 1-6L3.3 9.8l6-.9z" fill="currentColor"/>',
    trophy: '<path d="M8 4h8v5.5a4 4 0 0 1-8 0z"/><path d="M8 6H4.8a3.2 3.2 0 0 0 3.2 3.4M16 6h3.2A3.2 3.2 0 0 1 16 9.4M12 13.5v3.2M8.8 20.5h6.4M10.2 16.7h3.6l.5 3.8h-4.6z"/>',
    target: '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>',
    trendup: '<path d="m3 17 6.2-6.2 4 4L21 7"/><path d="M15 7h6v6"/>',
    trenddown: '<path d="m3 7 6.2 6.2 4-4L21 17"/><path d="M15 17h6v-6"/>',
    sparkle: '<path d="M12 3.2 13.9 8l4.9 2-4.9 2L12 16.8 10.1 12l-4.9-2 4.9-2z"/><path d="M18.6 15.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    poll: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 16.5v-4M12 16.5v-9M16 16.5v-6"/>',
    pulse: '<path d="M2.5 12h4l2.2-5.5 4.6 11 2.4-5.5h5.8"/>',

    /* media & content */
    film: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.4"/><path d="M7.5 3.5v17M16.5 3.5v17M3.5 8h4M3.5 12h17M3.5 16h4M16.5 8h4M16.5 16h4"/>',
    tv: '<rect x="2.5" y="6" width="19" height="13" rx="2.4"/><path d="m8 2.8 4 3.2 4-3.2"/>',
    video: '<rect x="2.5" y="6" width="13.5" height="12" rx="2.4"/><path d="m16 10.4 5.5-3.2v9.6L16 13.6"/>',
    camera: '<path d="M14.6 4.5H9.4L7.6 7H4.4A1.9 1.9 0 0 0 2.5 8.9v8.7a1.9 1.9 0 0 0 1.9 1.9h15.2a1.9 1.9 0 0 0 1.9-1.9V8.9A1.9 1.9 0 0 0 19.6 7h-3.2z"/><circle cx="12" cy="13" r="3.4"/>',
    image: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.4"/><circle cx="9" cy="9" r="1.8"/><path d="m20.5 15-4.6-4.6L5.5 20.5"/>',
    mic: '<rect x="9" y="2.8" width="6" height="11.4" rx="3"/><path d="M5.5 10.4v.8a6.5 6.5 0 0 0 13 0v-.8M12 17.8v3.4"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.4" cy="18" r="2.6"/><circle cx="17.4" cy="16" r="2.6"/>',
    clapper: '<path d="M4 10.8h16v8a1.9 1.9 0 0 1-1.9 1.9H5.9A1.9 1.9 0 0 1 4 18.8z"/><path d="m4 10.8-.7-3.3a1 1 0 0 1 .8-1.2l13.6-2.9a1 1 0 0 1 1.2.8l.6 3.1z"/><path d="m7.6 5.6 2.9 3.6M12.6 4.6l2.9 3.6"/>',
    layers: '<path d="m12 3 9 4.6-9 4.6-9-4.6z"/><path d="m3 12.3 9 4.6 9-4.6M3 16.6l9 4.6 9-4.6"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    list: '<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01"/>',
    rows: '<rect x="3.5" y="4" width="17" height="6.5" rx="1.6"/><rect x="3.5" y="13.5" width="17" height="6.5" rx="1.6"/>',
    layout: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.4"/><path d="M3.5 9h17M9.5 20.5V9"/>',
    upload: '<path d="M12 15.5V3.8M7 8.6l5-4.8 5 4.8"/><path d="M20.5 15v3.4a2.1 2.1 0 0 1-2.1 2.1H5.6a2.1 2.1 0 0 1-2.1-2.1V15"/>',
    download: '<path d="M12 3.8v11.7M7 10.7l5 4.8 5-4.8"/><path d="M20.5 15v3.4a2.1 2.1 0 0 1-2.1 2.1H5.6a2.1 2.1 0 0 1-2.1-2.1V15"/>',
    globe: '<circle cx="12" cy="12" r="8.8"/><path d="M3.2 12h17.6M12 3.2a13.5 13.5 0 0 1 0 17.6M12 3.2a13.5 13.5 0 0 0 0 17.6"/>',
    translate: '<path d="M4 5.5h9M8.5 3.5v2M6 5.5c.7 3.2 2.9 5.8 6 7.2M11 5.5c-.8 4-3.4 6.8-7 8.2"/><path d="m12.5 20.5 4-9.5 4 9.5M14 17h5"/>',
    hash: '<path d="M4.5 9h15M4.5 15h15M10 3.5 8 20.5M16 3.5l-2 17"/>',
    pin: '<path d="M12 21.2s6.8-6 6.8-11.6a6.8 6.8 0 1 0-13.6 0c0 5.6 6.8 11.6 6.8 11.6z"/><circle cx="12" cy="9.6" r="2.4"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.8 18.4h2.4"/>',
    monitor: '<rect x="2.5" y="4" width="19" height="13" rx="2.2"/><path d="M8.5 20.5h7M12 17v3.5"/>',
    inbox: '<path d="M21 12.5h-5.5l-1.8 2.8h-3.4l-1.8-2.8H3"/><path d="M5.4 5.4 3 12.5v5.6A1.9 1.9 0 0 0 4.9 20h14.2a1.9 1.9 0 0 0 1.9-1.9v-5.6l-2.4-7.1A1.9 1.9 0 0 0 16.8 4H7.2a1.9 1.9 0 0 0-1.8 1.4z"/>',
    mail: '<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2.2"/><path d="m3.2 6.6 8.8 6.2 8.8-6.2"/>',
    megaphone: '<path d="M3.5 10v4h3l10 5V5l-10 5z"/><path d="m6.5 14 1.4 5.4h3L9.6 14.6"/><path d="M19.5 9.6a3 3 0 0 1 0 4.8"/>',
    compass: '<circle cx="12" cy="12" r="8.8"/><path d="m15.6 8.4-2.3 4.9-4.9 2.3 2.3-4.9z"/>',
    filter: '<path d="M3.5 5h17l-6.6 8v6.3l-3.8-1.8V13z"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1h-.2a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    edit: '<path d="M12 20.5h8.5"/><path d="M16.4 3.9a2 2 0 0 1 2.9 2.9L7.5 18.6l-3.9 1 1-3.9z"/>',
    trash: '<path d="M3.5 6.5h17M9 6.5V4.6A1.1 1.1 0 0 1 10.1 3.5h3.8A1.1 1.1 0 0 1 15 4.6v1.9M18.5 6.5l-.9 12.7a1.9 1.9 0 0 1-1.9 1.8H8.3a1.9 1.9 0 0 1-1.9-1.8L5.5 6.5"/>',
    archive: '<rect x="2.8" y="3.8" width="18.4" height="4.6" rx="1.2"/><path d="M4.5 8.4v10.1a1.9 1.9 0 0 0 1.9 1.9h11.2a1.9 1.9 0 0 0 1.9-1.9V8.4M10 12.4h4"/>',
    logout: '<path d="M9 20.5H5.6A2.1 2.1 0 0 1 3.5 18.4V5.6a2.1 2.1 0 0 1 2.1-2.1H9M15.8 16.8 20.5 12l-4.7-4.8M20.5 12H9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20.5 13.4A8.6 8.6 0 1 1 10.6 3.5a6.7 6.7 0 0 0 9.9 9.9z"/>',
    server: '<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/>',
    cloud: '<path d="M17.5 19H7.5a5 5 0 1 1 1-9.9 6 6 0 0 1 11.3 2.6A3.7 3.7 0 0 1 17.5 19z"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.2"/><path d="m10.5 12.5 9.5-9.5M16.5 6.5l2.5 2.5M14 9l2 2"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9.5 9.5h5v5h-5zM9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
    code: '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5"/>',
    bars: '<path d="M4 20.5V11M10 20.5V4.5M16 20.5V13M21.5 20.5H2.5"/>',
    pie: '<path d="M20.6 13.3A8.8 8.8 0 1 1 10.7 3.4"/><path d="M14 3.3a8.8 8.8 0 0 1 6.7 6.7H14z"/>',
    activity: '<path d="M21.5 12h-3.8l-2.8 8-5.8-16-2.8 8H2.5"/>',
    scissors: '<circle cx="6" cy="6.5" r="2.8"/><circle cx="6" cy="17.5" r="2.8"/><path d="M8.3 8.2 20 18.5M8.3 15.8 20 5.5"/>',
    wand: '<path d="m15 4.5 4.5 4.5L8 20.5 3.5 16z"/><path d="M12.5 7 17 11.5"/><path d="M19.5 2.5v3M18 4h3"/>',
    building: '<rect x="4" y="3" width="10.5" height="18" rx="1.4"/><path d="M14.5 9H19a1 1 0 0 1 1 1v11M7.5 7h3.5M7.5 11h3.5M7.5 15h3.5M3 21h18"/>',
    rocket: '<path d="M12.5 15.5 8.5 11.5c1.6-4.4 5.2-7.6 11-8 .1 5.8-3.6 9.4-7 12z"/><path d="M8.5 11.5 5 11l2.5-3.4H11M12.5 15.5 13 19l3.4-2.5V13"/><path d="M6 15.5c-1.5.8-2.3 2.6-2.3 4.8 2.2 0 4-.8 4.8-2.3"/>',
    bolt: '<path d="M13.2 2.8 4.5 13.5h7l-.9 7.7 8.9-10.8h-7z"/>',
    dot: '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
    seedling: '<path d="M12 21v-8.5"/><path d="M12 12.5C12 8.4 9 5.8 4.5 5.8c0 4.1 3 6.7 7.5 6.7zM12 11c0-3.6 2.6-6 6.6-6 0 3.6-2.6 6-6.6 6z"/>',
    android: '<path d="M6.5 10.5a5.5 5.5 0 0 1 11 0V18a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z"/><path d="M6.5 11.5h11M9.5 8h.01M14.5 8h.01M8 4.5 9.4 6.3M16 4.5l-1.4 1.8"/>',
    apple: '<path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-1.9-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.9c-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.6 1.3 10.1.9 1.2 1.9 2.6 3.2 2.5 1.3 0 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.2z" fill="currentColor" stroke="none"/><path d="M14 5.4c.7-.9 1.2-2 1-3.2-1 0-2.2.7-2.9 1.6-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" fill="currentColor" stroke="none"/>',
    google: '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3c1.8-1.6 2.8-4 2.8-7z" fill="#4285F4" stroke="none"/><path d="M12 21.4c2.5 0 4.7-.8 6.2-2.3l-3-2.4c-.8.6-1.9.9-3.2.9-2.4 0-4.5-1.6-5.2-3.9H3.7v2.4a9.4 9.4 0 0 0 8.3 5.3z" fill="#34A853" stroke="none"/><path d="M6.8 13.7a5.6 5.6 0 0 1 0-3.4V7.9H3.7a9.4 9.4 0 0 0 0 8.2z" fill="#FBBC05" stroke="none"/><path d="M12 6.4c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.4 9.4 0 0 0 3.7 7.9l3.1 2.4C7.5 8 9.6 6.4 12 6.4z" fill="#EA4335" stroke="none"/>',
    whatsapp: '<path d="M4.2 19.8 5.3 16a8.3 8.3 0 1 1 3.1 3z"/><path d="M9.2 8.6c.2-.4.6-.4.9-.4l.6 1.3c.1.3 0 .5-.2.7l-.4.5c.4 1 1.5 2.1 2.6 2.6l.5-.5c.2-.2.5-.3.7-.2l1.3.6c.1.4 0 .8-.4 1.1-.6.5-1.6.6-2.6.1A8 8 0 0 1 9 10.9c-.4-1-.3-1.8.2-2.3z" fill="currentColor" stroke="none"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.9"/><path d="M17.2 6.8h.01"/>',
    msg: '<path d="M20.5 11.2c0 4.3-3.8 7.8-8.5 7.8-1.2 0-2.3-.2-3.3-.6L3.5 20.5l1.3-4a7.4 7.4 0 0 1-1.3-4.2C3.5 7 7.3 3.5 12 3.5s8.5 3.4 8.5 7.7z"/>'
  };

  function ic(name, size, stroke, cls) {
    const body = P[name];
    if (!body) return "";
    const s = size || 20;
    return '<svg class="i' + (cls ? " " + cls : "") + '" width="' + s + '" height="' + s +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (stroke || 1.8) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  /* The brand mark: a spool seen from above — an outer flange ring, the
     wound core, and the play notch cut through it. */
  function mark(size) {
    const s = size || 20;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="2.2"/>' +
      '<circle cx="12" cy="12" r="5.2" fill="currentColor"/>' +
      '<path d="M10.9 9.7v4.6l3.8-2.3z" fill="var(--accent, #C9F04F)"/>' +
      "</svg>";
  }

  root.ic = ic;
  root.ICONS = P;
  root.brandMark = mark;
})(window);
