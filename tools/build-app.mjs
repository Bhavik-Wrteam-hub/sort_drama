#!/usr/bin/env node
/* ==========================================================================
   Builds app.html: the Spool mobile app as one self-contained file.
   --------------------------------------------------------------------------
   Same screens, sheets and data as mobile.html, without the stage around
   the phone. Fonts, photos, CSS and JS are inlined, so the file can be
   opened from anywhere or sent on its own.

     node tools/build-app.mjs

   Re-run it after changing anything under assets/. The build fails loudly
   if a section marker it cuts on has moved, rather than shipping stage CSS
   or dropping app CSS by accident.
   ========================================================================== */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "app.html";
const read = p => readFileSync(join(ROOT, p), "utf8");

function fail(msg) {
  console.error("build-app: " + msg);
  process.exit(1);
}

function indexOnce(src, marker, file) {
  const i = src.indexOf(marker);
  if (i < 0) fail(`marker not found in ${file}: ${marker}`);
  if (src.indexOf(marker, i + 1) >= 0) fail(`marker found more than once in ${file}: ${marker}`);
  return i;
}

/* ---------------- CSS ---------------- */
// core.css: swap each self-hosted font for a data URI.
function coreCss() {
  let n = 0;
  const css = read("assets/css/core.css").replace(/url\("\.\.\/fonts\/([\w-]+\.woff2)"\)/g, (_, name) => {
    n++;
    const b64 = readFileSync(join(ROOT, "assets/fonts", name)).toString("base64");
    return `url("data:font/woff2;base64,${b64}")`;
  });
  if (n === 0) fail("no font URLs found in core.css");
  return css;
}

// mobile.css: keep the device frame and the app; drop the stage, the
// device caption, the narrow-canvas drawer and the stage breakpoints.
function mobileCss() {
  const file = "assets/css/mobile.css";
  const css = read(file);
  const stage = indexOnce(css, "/* ---------------- stage ---------------- */", file);
  const device = indexOnce(css, "/* device */", file);
  const cap = indexOnce(css, "\n.device-cap {", file) + 1; // top-level rule, not the one inside @media
  const shell = indexOnce(css, "/* ---------------- app shell ---------------- */", file);
  const drawer = indexOnce(css, "/* ---------------- drawer for narrow canvases ---------------- */", file);
  if (!(stage < device && device < cap && cap < shell && shell < drawer)) fail(`section markers out of order in ${file}`);
  return css.slice(0, stage) + css.slice(device, cap) + css.slice(shell, drawer);
}

/* ---------------- JS ---------------- */
// Same order as mobile.html, with standalone.js in place of stage.js.
const SCRIPTS = [
  "assets/js/icons.js",
  "assets/js/photos.js",
  "assets/js/art.js",
  "assets/js/data.js",
  "assets/js/mobile.js",
  "assets/js/mobile-screens.js",
  "assets/js/mobile-sheets.js",
  "assets/js/standalone.js"
];

// Every photo photos.js names, as base64 keyed by its path. art.js turns
// each into a blob URL the first time it is shown.
function photoData() {
  const sandbox = {};
  new Function("window", read("assets/js/photos.js"))(sandbox);
  const P = sandbox.SPOOL_PHOTOS;
  if (!P) fail("assets/js/photos.js did not define SPOOL_PHOTOS");
  const paths = new Set();
  (function walk(v) {
    if (typeof v === "string") { if (v.endsWith(".webp")) paths.add(v); }
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(P);
  const data = {};
  for (const p of [...paths].sort()) data[p] = readFileSync(join(ROOT, P.base, p)).toString("base64");
  return { src: "window.SPOOL_PHOTO_DATA = " + JSON.stringify(data) + ";", count: paths.size };
}
const photos = photoData();

function inline(tag, src, file) {
  if (new RegExp(`</${tag}|<!--`, "i").test(src)) fail(`${file || tag} contains a sequence that would break an inline <${tag}>`);
  return `<${tag}>\n${file ? `/* ${file} */\n` : ""}${src.trim()}\n</${tag}>`;
}

/* ---------------- page ---------------- */
// The device is lifted from mobile.html so the two can't drift apart; its
// caption (Back / Rotate) sits after it and stays behind.
function deviceMarkup() {
  const file = "mobile.html";
  const page = read(file);
  const start = page.lastIndexOf("\n", indexOnce(page, '<div class="device-wrap" id="deviceWrap">', file)) + 1;
  const end = page.lastIndexOf("\n", indexOnce(page, '<div class="device-cap">', file));
  if (start <= 0 || end <= start) fail(`device markup not found in ${file}`);
  // re-indent from <div class="center"> (6 spaces) to <main> (4 spaces)
  return page.slice(start, end).split("\n").map(l => l.replace(/^ {2}/, "")).join("\n");
}

const css = [
  ["assets/css/core.css", coreCss()],
  ["assets/css/mobile.css", mobileCss()],
  ["assets/css/standalone.css", read("assets/css/standalone.css")]
].map(([file, src]) => `/* ${file} */\n${src.trim()}`).join("\n\n");

const html = `<!doctype html>
<!-- Generated by tools/build-app.mjs from assets/ — do not edit by hand. -->
<html lang="en" data-theme="dark">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0A0A0B">
  <title>Spool App</title>
  <meta name="description" content="Spool, a short-drama-first streaming app: every screen and sheet of the mobile prototype in one file, starting at the splash screen.">
${inline("style", css)}
</head>

<body>
  <main class="canvas" aria-label="Spool app">
${deviceMarkup()}
  </main>

${inline("script", photos.src, `assets/img (${photos.count} photos)`)}
${SCRIPTS.map(f => inline("script", read(f), f)).join("\n")}
</body>

</html>
`;

writeFileSync(join(ROOT, OUT), html);
console.log(`build-app: wrote ${OUT} (${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB, ${photos.count} photos)`);
