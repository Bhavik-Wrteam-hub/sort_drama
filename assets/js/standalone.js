/* ==========================================================================
   Spool — the phone on its own (app.html)
   --------------------------------------------------------------------------
   The standalone counterpart of stage.js. The app only needs two things
   from its host (window.Stage): the device scale, so drag gestures stay
   1:1 with the pointer, and rotate(), which the landscape player calls.
   Everything else — panels, journeys, scenario controls — stays in
   mobile.html.
   ========================================================================== */
(function () {
  "use strict";
  const A = window.App;
  const $ = s => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  };

  /* ---------------- device fit & rotation ---------------- */
  let SCALE = 1;
  function fit() {
    const dev = $("#device"), wrap = $("#deviceWrap"), canvas = $(".canvas");
    const land = dev.classList.contains("land");
    const natW = (land ? 844 : 390) + 26, natH = (land ? 390 : 844) + 26;
    if (window.innerWidth <= 560) { SCALE = 1; dev.style.transform = ""; wrap.style.width = ""; wrap.style.height = ""; return; }
    const cs = getComputedStyle(canvas);
    const availW = canvas.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = canvas.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    SCALE = Math.min(1, availH / natH, availW / natW);
    dev.style.transform = "scale(" + SCALE + ")";
    wrap.style.width = natW * SCALE + "px";
    wrap.style.height = natH * SCALE + "px";
  }
  function rotate(on) {
    const dev = $("#device");
    if (dev.classList.contains("land") === !!on) return;
    dev.classList.toggle("land", !!on);
    fit();
    setTimeout(fit, 520);
  }

  window.Stage = { scale: () => SCALE, rotate };

  const acc = store.get("spool-accent");
  if (acc && acc !== "lime") document.documentElement.dataset.accent = acc;
  A.reset("fan");
  window.addEventListener("resize", fit);
  fit();
  setTimeout(fit, 300);
  A.start();
})();
