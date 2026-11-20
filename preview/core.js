/* Pure functions of the annotation tool (also loaded by user_study/tests/test_app_core.js under node). */
"use strict";
(function (root) {
  function fnv1a(str) { let h = 0x811c9dc5; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // practice scenes first (fixed order), main scenes shuffled, "spread" scenes at evenly spaced positions among them
  function makeOrder(scenes, seed) {
    const rnd = mulberry32(seed);
    const practice = scenes.filter(s => s.kind === "practice").map(s => s.scene_uid);
    const main = shuffle(scenes.filter(s => s.kind === "main").map(s => s.scene_uid), rnd);
    const spread = shuffle(scenes.filter(s => s.kind === "spread").map(s => s.scene_uid), rnd);
    const out = main.slice();
    const n = main.length, k = spread.length;
    for (let i = k - 1; i >= 0; i--) out.splice(Math.round((i + 1) * n / (k + 1)), 0, spread[i]);
    return practice.concat(out);
  }
  function pointInRect(x, y, r) { return x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]; }
  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function snap(objects, view, x, y) {
    const hits = objects.filter(o => view === "camera" ? o.camera_rects.some(r => pointInRect(x, y, r)) : pointInPoly(x, y, o.bev_polygon));
    if (!hits.length) return null;
    hits.sort((a, b) => a.dist - b.dist);        // nearest to the ego
    return hits[0];
  }
  // client (screen) point -> original image pixel, whatever the displayed size
  function toImagePx(clientX, clientY, rect, naturalWidth, naturalHeight) {
    return { x: (clientX - rect.left) * naturalWidth / rect.width, y: (clientY - rect.top) * naturalHeight / rect.height };
  }
  const api = { fnv1a, mulberry32, shuffle, makeOrder, pointInRect, pointInPoly, snap, toImagePx };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.AnnotCore = api;
})(typeof window !== "undefined" ? window : globalThis);
