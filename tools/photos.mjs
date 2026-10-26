#!/usr/bin/env node
/* ==========================================================================
   Builds the prototype's photography: assets/img/**, assets/js/photos.js
   and assets/img/CREDITS.md.
   --------------------------------------------------------------------------
   Every photo is a free-to-use image from Unsplash (Unsplash License; no
   Unsplash+ images). Each entry names the source photo, the crop it needs
   and a focal point, so the set can be rebuilt or re-cropped at any time:

     node tools/photos.mjs                  download what's missing, then crop all
     node tools/photos.mjs --only=heiress,ritu

   Needs cwebp (brew install webp) and macOS sips. Sources are cached in
   .cache/photos/ (git-ignored). In production these are licensed key art
   and real profile pictures; the photos only stand in for them.
   ========================================================================== */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(ROOT, ".cache", "photos");
const IMG = join(ROOT, "assets", "img");

/* Output shapes. q is the WebP quality; posters and scenes fill the screen,
   so they get the most pixels, avatars the fewest. */
const SHAPE = {
  tall: { w: 720, h: 1280, q: 64 },   // 9:16 — posters (cropped to 2:3 by CSS), player, series hero
  wide: { w: 1280, h: 720, q: 64 },   // 16:9 — landscape titles, banners, landscape player
  clip: { w: 540, h: 960, q: 62 },    // 9:16 — creator videos and camera-roll clips
  clipw: { w: 960, h: 540, q: 62 },   // 16:9 — landscape creator videos
  face: { w: 256, h: 256, q: 72 }     // 1:1 — avatars
};

/* [source id, photographer, focal x, focal y, zoom]. Focal points are
   fractions of the source; zoom > 1 crops tighter than the largest box. */
const TITLES = {
  heiress: ["photo-1765229279946-f265fa703385", "FOTOGRAFÍA EDITORIAL", .5, .4],
  contract: ["photo-1646380917239-b886f592db46", "Dmitry Rodionov", .45, .5],
  moonbound: ["photo-1557855765-c61eaa53c3ee", "Joshua Rondeau", .36, .5],
  divorce: ["photo-1627305412843-61b0824e6f59", "Julia Taubitz", .48, .5],
  sindoor: ["photo-1617633150878-7df1d12a9a57", "SKG Photography", .5, .4],
  crown: ["photo-1673278206771-6146fc7f9e13", "Lance Reis", .5, .4],
  mafia: ["photo-1769628027250-d2a7a5a4eb64", "Bennie Bates", .5, .4],
  rebirth: ["photo-1723390944514-9b117fae8f57", "Tan Kaninthanond", .5, .4],
  twins: ["photo-1609220136736-443140cffec6", "Nathan Dumlao", .5, .5],
  bodyguard: ["photo-1618371731836-2b9bff9ac72a", "Job Moses", .39, .5],
  silent: ["photo-1555655139-6098ba690004", "Mohammad Hoseini Rad", .5, .45],
  fake: ["photo-1782790378851-6ee2dfb17706", "Elist Nguyen", .5, .4],
  tenyears: ["photo-1561240055-102e7eaa2961", "Jonathan Borba", .5, .45],
  shaadi: ["photo-1722952934708-749c22eb2e58", "ARTO SURAJ", .5, .45],
  monsoon: ["photo-1753269045290-82003f40ff7b", "Saad Ahmad", .68, .5],
  ledger: ["photo-1722864728098-3bf5b68cf716", "Nguyen Phan Nam Anh", .55, .5],
  lanterns: ["photo-1763128062830-8684f89eb064", "sayan Nath", .5, .4],
  highway: ["photo-1690288783255-62dca1d09b19", "Akin Cakiner", .55, .5],
  flatmates: ["photo-1772724317667-afe2d40f6158", "Apartment Life", .45, .5],
  ghost: ["photo-1788847077567-16e1b21deb74", "Parimal Jain", .5, .5],
  lastdelivery: ["photo-1762513792717-9e8b574a9c08", "Solomon Dredzen", .49, .5],
  desk14: ["photo-1758520144750-dd3cbde6a689", "Vitaly Gariev", .47, .5],
  aunty: ["photo-1624354865912-fdf2f0e09a21", "Neil de Souza", .5, .45]
};
// 16:9 versions, for titles that play in landscape
const WIDE = {
  monsoon: [.5, .5], ledger: [.5, .5], lanterns: [.5, .3], highway: [.5, .55]
};
// extra player stills for the flagship, so the "video" cuts between angles
const SCENES = {
  heiress: [
    ["photo-1765229279829-2d761e6cc816", "FOTOGRAFÍA EDITORIAL", .5, .4],
    ["photo-1765870973894-c54ef78ed76b", "FOTOGRAFÍA EDITORIAL", .48, .5],
    ["photo-1768609956986-7c1776f70454", "FOTOGRAFÍA EDITORIAL", .5, .5]
  ]
};
// creator videos (by id) and camera-roll clips; videos tied to a title use its art instead
const VIDEOS = {
  v2: ["photo-1535525153412-5a42439a210d", "Aditya Ali", .48, .5],
  v3: ["photo-1639979511572-ff346bc5b3b7", "Anil Sharma", .5, .5],
  v6: ["photo-1758874384555-de68b8035c24", "Vitaly Gariev", .55, .5],
  v7: ["photo-1513014576558-921f00d80b77", "Aquib Akhter", .5, .5, 1, "clipw"],
  v8: ["photo-1546016036-897c7c6f41c5", "Josh Hild", .5, .5],
  v9: ["photo-1662644287860-ba9f2ee65ec9", "Alekon pictures", .47, .5],
  v11: ["photo-1681137063068-081072cf04b4", "Huong Do", .55, .5],
  v14: ["photo-1651911163752-040d6b3f52f6", "Aaron Brogden", .5, .5],
  v15: ["photo-1583244532610-2a234e7c3eca", "Aleksandr Popov", .45, .5]
};
const CLIPS = {
  c1: ["photo-1765229279829-2d761e6cc816", "FOTOGRAFÍA EDITORIAL", .45, .45],
  c2: ["photo-1758273706454-b85bc7796b5e", "Vitaly Gariev", .45, .5],
  c3: ["photo-1595931848923-43c037a114d1", "Amit Gaur", .5, .5, 1, "clipw"],
  c4: ["photo-1543893424-907f9ebc6a5d", "Leon JL", .5, .5],
  c5: ["photo-1742281257687-092746ad6021", "Zoshua Colah", .35, .5],
  c6: ["photo-1524450239752-ddd212cac0b4", "Yiran Ding", .5, .5],
  c7: ["photo-1730130596425-197566414dc4", "CR", .5, .5],
  c8: ["photo-1758272421340-8422e87a3458", "Vitaly Gariev", .45, .5],
  c9: ["photo-1460723237483-7a6dc9d0b212", "Melanie van Leeuwen", .45, .5]
};
/* People: creators by id, cast as "cast<id>", the viewer as "me". The
   pools give everyone else (commenters, friends, the admin team) a face
   that stays the same for the same name. */
const PEOPLE = {
  ritu: ["photo-1662850886700-4ec19bd30d11", "Nolan Manning", .52, .33, 1.6],
  mina: ["photo-1758600587815-b654d1405e83", "Vitaly Gariev", .55, .41, 1.6],
  kofi: ["photo-1522529599102-193c0d76b5b6", "Elizeu Dias", .49, .29, 1.6],
  lola: ["photo-1628266857311-f759c7a73bc6", "Dominik Day", .45, .48, 1.6],
  diego: ["photo-1734830268394-6c4a1f165af1", "Alef Morais", .5, .32, 1.6],
  arjun: ["photo-1757744705465-ea08b0ddc38a", "Josias Garibay", .5, .34, 1.6],
  zara: ["photo-1695757002354-8bca71d087c7", "Dynamic Wang", .49, .22, 2.2],
  neel: ["photo-1625241152315-4a698f74ceb7", "Nicolas Horn", .5, .42, 1.6],
  me: ["photo-1745434159123-4908d0b9df94", "Brooke Balentine", .5, .3, 1.8],
  castava: ["photo-1765229279829-2d761e6cc816", "FOTOGRAFÍA EDITORIAL", .44, .29, 1.7],
  castvictor: ["photo-1648757766966-43d24bf7a264", "Tim Mossholder", .5, .2, 2],
  castceleste: ["photo-1494790108377-be9c29b29330", "Michael Dam", .49, .28, 1.6],
  castethan: ["photo-1605980776566-0486c3ac7617", "Veroll Sterling", .46, .24, 2],
  castgrandma: ["photo-1778174903051-0b15d54bb451", "Pete Walls", .5, .28, 1.6],
  castmara: ["photo-1438761681033-6461ffad8d80", "Christopher Campbell", .49, .39, 1.6],
  castkade: ["photo-1612214070475-1e73f478188c", "Kingsley Osei-Abrah", .68, .31, 1.6]
};
const POOL = {
  woman: [
    ["photo-1580489944761-15a19d654956", "Jake Nackos", .5, .48, 1.6],
    ["photo-1508002366005-75a695ee2d17", "Isaiah McClean", .44, .3, 1.8],
    ["photo-1604072366595-e75dc92d6bdc", "Jorik Kleen", .4, .33, 1.6],
    ["photo-1507152832244-10d45c7eda57", "Eye for Ebony", .48, .46, 1.6],
    ["photo-1534528741775-53994a69daeb", "Aiony Haust", .55, .4, 1.6],
    ["photo-1758600587839-56ba05596c69", "Vitaly Gariev", .6, .26, 2],
    ["photo-1534751516642-a1af1ef26a56", "Mathias Huysmans", .5, .35, 1.6],
    ["photo-1600481176431-47ad2ab2745d", "panitan punpuang", .5, .52, 1.5],
    ["photo-1589553009868-c7b2bb474531", "Hussan Amir", .49, .3, 1.6],
    ["photo-1780396700817-2ec700591808", "Grace Anne Bobadilla", .44, .3, 1.6],
    ["photo-1489424731084-a5d8b219a5bb", "Gabriel Silvério", .49, .5, 1.5],
    ["photo-1589525231707-f2de2428f59c", "Thanh Duc PHAN", .6, .4, 1.6],
    ["photo-1624486217002-846e654ac969", "Tim Mossholder", .54, .36, 1.6]
  ],
  man: [
    ["photo-1568602471122-7832951cc4c5", "Christian Buehner", .65, .36, 1.6],
    ["photo-1705645930353-0e335311ef20", "Danny Postma", .5, .33, 1.8],
    ["photo-1562124638-724e13052daf", "Christian Buehner", .44, .3, 1.6],
    ["photo-1651684215020-f7a5b6610f23", "The Connected Narrative", .49, .34, 1.6],
    ["photo-1507003211169-0a1dd7228f2d", "Joseph Gonzalez", .46, .33, 1.8],
    ["photo-1564564244660-5d73c057f2d2", "Irene Strong", .51, .35, 1.6],
    ["photo-1566753323558-f4e0952af115", "Samuel Raita", .48, .32, 1.6],
    ["photo-1527980965255-d3b416303d12", "Nicolas Horn", .48, .29, 1.6],
    ["photo-1583123810408-23e7b5d1af9f", "Marcos Paulo Prado", .49, .32, 1.6],
    ["photo-1592234789031-94bf65f630ed", "sergey mikheev", .39, .52, 1.4],
    ["photo-1531339413195-cc6c17163974", "Wilfred Sequeira", .47, .48, 1.6],
    ["photo-1712425718137-491250cfde88", "ARTO SURAJ", .42, .27, 2.2],
    ["photo-1518725522904-4b3939358342", "Arjunsyah", .47, .34, 1.8]
  ]
};

/* ---------------- pipeline ---------------- */
const only = (process.argv.find(a => a.startsWith("--only=")) || "").slice(7);
const ONLY = only ? new Set(only.split(",")) : null;
const credits = new Map(); // source id → photographer
const jobs = [];
function job(out, [id, by, fx, fy, zoom = 1, shape], defShape, key) {
  credits.set(id, by);
  jobs.push({ out, id, fx, fy, zoom, shape: SHAPE[shape || defShape], key });
}
const manifest = { base: "assets/img/", titles: {}, videos: {}, clips: {}, people: {}, pool: { woman: [], man: [] } };

for (const [k, src] of Object.entries(TITLES)) {
  manifest.titles[k] = { tall: `titles/${k}.webp` };
  job(manifest.titles[k].tall, src, "tall", k);
  if (WIDE[k]) {
    manifest.titles[k].wide = `titles/${k}-wide.webp`;
    job(manifest.titles[k].wide, [src[0], src[1], WIDE[k][0], WIDE[k][1]], "wide", k);
  }
  if (SCENES[k]) {
    manifest.titles[k].scenes = SCENES[k].map((s, i) => {
      const out = `scenes/${k}-${i + 2}.webp`;
      job(out, s, "tall", k);
      return out;
    });
  }
}
for (const [k, src] of Object.entries(VIDEOS)) { manifest.videos[k] = `videos/${k}.webp`; job(manifest.videos[k], src, "clip", k); }
for (const [k, src] of Object.entries(CLIPS)) { manifest.clips[k] = `clips/${k}.webp`; job(manifest.clips[k], src, "clip", k); }
for (const [k, src] of Object.entries(PEOPLE)) { manifest.people[k] = `people/${k}.webp`; job(manifest.people[k], src, "face", k); }
for (const kind of ["woman", "man"]) {
  POOL[kind].forEach((src, i) => {
    const out = `people/${kind}-${i + 1}.webp`;
    manifest.pool[kind].push(out);
    job(out, src, "face", kind + "-" + (i + 1));
  });
}

mkdirSync(CACHE, { recursive: true });
async function source(id) {
  const file = join(CACHE, id + ".jpg");
  if (existsSync(file)) return file;
  const r = await fetch(`https://images.unsplash.com/${id}?w=2200&q=88&fm=jpg`);
  if (!r.ok) throw new Error(`download failed ${id}: ${r.status}`);
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return file;
}
function size(file) {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file], { encoding: "utf8" });
  return [+/pixelWidth: (\d+)/.exec(out)[1], +/pixelHeight: (\d+)/.exec(out)[1]];
}
// the largest box of the output's aspect ratio, shrunk by zoom, centred on the focal point
function cropBox(W, H, { w, h }, fx, fy, zoom) {
  const a = w / h;
  let cw = W / H > a ? H * a : W, ch = cw / a;
  cw /= zoom; ch /= zoom;
  const x = Math.min(W - cw, Math.max(0, fx * W - cw / 2));
  const y = Math.min(H - ch, Math.max(0, fy * H - ch / 2));
  return [x, y, cw, ch].map(Math.round);
}

const todo = jobs.filter(j => !ONLY || ONLY.has(j.key));
const ids = [...new Set(todo.map(j => j.id))];
for (let i = 0; i < ids.length; i += 6) await Promise.all(ids.slice(i, i + 6).map(source));
for (const j of todo) {
  const file = join(CACHE, j.id + ".jpg");
  const [W, H] = size(file);
  const [x, y, cw, ch] = cropBox(W, H, j.shape, j.fx, j.fy, j.zoom);
  const out = join(IMG, j.out);
  mkdirSync(dirname(out), { recursive: true });
  execFileSync("cwebp", ["-quiet", "-metadata", "none", "-q", String(j.shape.q), "-m", "6", "-sharp_yuv",
    "-crop", String(x), String(y), String(cw), String(ch), "-resize", String(j.shape.w), String(j.shape.h), file, "-o", out]);
}

writeFileSync(join(ROOT, "assets", "js", "photos.js"),
  "/* Generated by tools/photos.mjs — do not edit by hand. Paths are relative to\n" +
  "   `base`; art.js falls back to generated art for anything missing. */\n" +
  "window.SPOOL_PHOTOS = " + JSON.stringify(manifest, null, 1).replace(/\n\s*/g, " ") + ";\n");

const rows = [...credits].map(([id, by]) => `| ${by} | https://images.unsplash.com/${id} |`).join("\n");
writeFileSync(join(IMG, "CREDITS.md"),
  "# Photo credits\n\nEvery photo in this folder is from [Unsplash](https://unsplash.com) and used under the\n" +
  "[Unsplash License](https://unsplash.com/license) (free to use, no permission needed). They stand in\n" +
  "for licensed key art and real profile pictures in this prototype. Rebuild or re-crop them with\n" +
  "`node tools/photos.mjs`.\n\n| Photographer | Source |\n|---|---|\n" + rows + "\n");
console.log(`photos: ${todo.length} images from ${ids.length} sources → assets/img/`);
