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
  // two drag corners (any order, may leave the image) -> [x0, y0, x1, y1] inside the image
  function normBox(ax, ay, bx, by, w, h) {
    const cl = (v, m) => Math.max(0, Math.min(m, v));
    return [cl(Math.min(ax, bx), w), cl(Math.min(ay, by), h), cl(Math.max(ax, bx), w), cl(Math.max(ay, by), h)];
  }
  function boxIoU(a, b) {
    const iw = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), ih = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    const inter = iw * ih, area = r => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
    const u = area(a) + area(b) - inter;
    return u > 0 ? inter / u : 0;
  }
  function polyBBox(poly) {
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  // a drawn box -> the object it outlines (IoU >= minIoU with the object's box; best IoU, then nearest), or null
  function snapBox(objects, view, box, minIoU) {
    let best = null, bestIoU = minIoU;
    objects.forEach(o => {
      const rects = view === "camera" ? o.camera_rects : (o.bev_polygon.length ? [polyBBox(o.bev_polygon)] : []);
      const iou = Math.max(0, ...rects.map(r => boxIoU(box, r)));
      if (iou > bestIoU + 1e-9 || (best && Math.abs(iou - bestIoU) < 1e-9 && o.dist < best.dist)) { best = o; bestIoU = iou; }
    });
    return best;
  }
  const api = { fnv1a, mulberry32, shuffle, makeOrder, pointInRect, pointInPoly, snap, toImagePx, normBox, boxIoU, polyBBox, snapBox };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.AnnotCore = api;
})(typeof window !== "undefined" ? window : globalThis);
