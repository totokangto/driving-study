/* Neuron set comparison study (SPEC_STEER.md). Static page: data/manifest.js, images/, config.js.
   Online collection (config.js submit_url, the same Apps Script collector as app/, deploy/DEPLOY.md): one "scene" message
   per finished trial and one "final" message with the whole result; messages wait in a localStorage outbox until the server
   replies {ok: true}. With an empty submit_url the result is only offered as a file download. */
"use strict";
(function () {
  const M = window.MANIFEST, C = window.AnnotCore, CFG = window.STUDY_CONFIG || {}, $ = id => document.getElementById(id);
  const APP_VERSION = "steer-1";
  const PB = M.playback;                                   // {speedup, dt, hold_s}
  const ORIG_C = "#f08a4b", STEER_C = "#3b6fd4";
  const CAR = [[4.05, 1.15], [4.05, -1.15], [-1.13, -1.15], [-1.13, 1.15]];   // ego box (forward, left) m, Fig. 6 map
  const byUid = Object.fromEntries(M.items.map(it => [it.uid, it]));
  const VERB = { "좌회전": "왼쪽으로 꺾는지", "우회전": "오른쪽으로 꺾는지", "정지": "멈추는지", "가속": "빨라지는지", "감속": "느려지는지" };
  const Q1 = { "좌회전": "정말 왼쪽으로 꺾었나요?", "우회전": "정말 오른쪽으로 꺾었나요?", "정지": "정말 멈췄나요?",
               "가속": "정말 빨라졌나요?", "감속": "정말 느려졌나요?" };
  const SURVEY = [
    ["driving_years", "운전 경력", { none: "없음", lt1: "1년 미만", y1to5: "1–5년", gt5: "5년 이상" }],
    ["ad_years", "자율주행 관련 연구·개발 경력", { none: "없음", lt1: "1년 미만", y1to3: "1–3년", gt3: "3년 이상" }],
    ["cv_years", "컴퓨터 비전·딥러닝 연구·개발 경력", { none: "없음", lt1: "1년 미만", y1to3: "1–3년", gt3: "3년 이상" }],
    ["xai", "설명 가능한 AI(XAI) 방법을 얼마나 아나요?", { never: "처음 들어 봄", heard: "들어 본 적 있음", used: "연구나 업무에 써 봄" }]];
  const josa = w => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "을" : "를");   // final consonant -> 을, else 를
  let S = null, clock0 = performance.now(), raf = 0, canvases = [], enterTime = null;

  // ------------------------------------------------------------ state
  const storeKey = id => `steer_${M.manifest_id}_${id}`;
  function save() { try { localStorage.setItem(storeKey(S.annotator_id), JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function load(id) { try { return JSON.parse(localStorage.getItem(storeKey(id)) || "null"); } catch (e) { return null; } }
  function fresh(id) {
    const seed = C.fnv1a(id + "|" + M.manifest_id);
    const scenes = M.items.map(it => ({ scene_uid: it.uid, kind: it.kind === "check" ? "spread" : it.kind }));
    const panelOrder = {};
    M.items.forEach(it => { panelOrder[it.uid] = C.shuffle(it.panels.map(p => p.pid), C.mulberry32(C.fnv1a(id + "|" + it.uid))); });
    return { annotator_id: id, manifest_id: M.manifest_id, order_seed: seed, order: C.makeOrder(scenes, seed), idx: 0, panelOrder,
             resp: {}, started_at: new Date().toISOString(), finished_at: null, phase: "trial", survey: {}, comment: "",
             user_agent: navigator.userAgent };
  }

  // ------------------------------------------------------------ online collection
  const ONLINE = !!CFG.submit_url;
  const SESSION_ID = randId(10);
  const outKey = id => `steer_outbox_${id}`;
  const RETRY_SEC = [2, 5, 10, 15], SHOW_FAIL_AFTER = 3;
  let sending = false, retryTimer = null, fails = 0, finalState = null;     // null | sending | sent | failed
  function randId(n) {
    const a = new Uint8Array(n);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; });
    return Array.from(a, b => (b % 36).toString(36)).join("");
  }
  function getBox() { try { return JSON.parse(localStorage.getItem(outKey(S.annotator_id)) || "[]"); } catch (e) { return []; } }
  function setBox(b) { try { localStorage.setItem(outKey(S.annotator_id), JSON.stringify(b)); } catch (e) { /* ignore */ } }
  function envelope(kind) {
    return { msg_id: `${S.annotator_id}-${SESSION_ID}-${Date.now().toString(36)}-${randId(4)}`, kind,
             study_key: CFG.study_key || "", annotator_id: S.annotator_id, session_id: SESSION_ID, manifest_id: M.manifest_id,
             app_version: APP_VERSION, order_seed: S.order_seed, language: "ko", sent_at: new Date().toISOString() };
  }
  function enqueue(msg) { if (!ONLINE) return; const b = getBox(); b.push(msg); setBox(b); updateSync(); flush(); }
  async function flush() {
    if (!ONLINE || !S || sending) return;
    sending = true; clearTimeout(retryTimer);
    try {
      for (;;) {
        const b = getBox();
        if (!b.length) break;
        const msg = b[0];
        const res = await fetch(CFG.submit_url, { method: "POST", body: JSON.stringify(msg) });   // text/plain: no preflight
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || "server");
        setBox(getBox().filter(m => m.msg_id !== msg.msg_id));
        fails = 0;
        if (msg.kind === "final") setFinal("sent");
      }
    } catch (e) {
      fails++;
      if (fails >= SHOW_FAIL_AFTER && getBox().some(m => m.kind === "final")) setFinal("failed");
      retryTimer = setTimeout(flush, 1000 * RETRY_SEC[Math.min(fails, RETRY_SEC.length) - 1]);
    } finally { sending = false; updateSync(); }
  }
  window.addEventListener("online", flush);
  function updateSync() {
    const badge = $("syncBadge");
    if (!ONLINE || !S) { badge.classList.add("hidden"); return; }
    const n = getBox().length, warn = n > 0 && fails >= SHOW_FAIL_AFTER;
    badge.classList.remove("hidden");
    badge.classList.toggle("warn", warn);
    badge.textContent = n === 0 ? "✓ 저장됨" : warn ? `전송 실패 ${n}건 · 인터넷 연결을 확인해 주세요` : `전송 대기 ${n}`;
  }
  function setFinal(st) { finalState = st; renderDone(); }
  function sendTrial(uid, order) {
    const r = S.resp[uid];
    if (r) enqueue(Object.assign(envelope("scene"), { order, response: Object.assign({ scene_uid: uid }, r) }));
  }
  function resultObject() {
    return { manifest_id: S.manifest_id, annotator_id: S.annotator_id, app_version: APP_VERSION, order_seed: S.order_seed,
             started_at: S.started_at, finished_at: S.finished_at, user_agent: S.user_agent, order: S.order,
             survey: S.survey, comment: S.comment, responses: S.order.map(u => S.resp[u] || null) };
  }
  function sendFinal() {
    if (!ONLINE) return;
    setBox(getBox().filter(m => m.kind !== "final"));
    setFinal("sending");
    enqueue(Object.assign(envelope("final"), { result: resultObject() }));
  }
  async function idUsedElsewhere(id) {
    if (!ONLINE) return false;
    try {
      const u = `${CFG.submit_url}?view=idcheck&id=${encodeURIComponent(id)}&manifest=${encodeURIComponent(M.manifest_id)}`;
      return !!(await (await fetch(u)).json()).used;
    } catch (e) { return false; }                // server unreachable: start without the check
  }

  // ------------------------------------------------------------ start screen
  function onId() {
    const id = $("annId").value.trim();
    const ok = /^[A-Za-z0-9_-]{2,32}$/.test(id);
    $("startBtn").disabled = !ok;
    const prev = ok ? load(id) : null;
    $("idNote").textContent = !ok ? "영문·숫자 2자 이상" :
      prev ? (prev.phase === "done" ? "이 ID는 이미 끝까지 진행했습니다. 시작하면 마지막 화면으로 갑니다." :
        `이 ID로 진행한 기록이 있습니다(${prev.idx + 1}번째 문항). 시작하면 이어서 합니다. 처음이라면 다른 ID를 쓰세요.`) : "";
    $("startBtn").textContent = prev ? "이어서 하기" : "시작";
  }
  async function start() {
    const id = $("annId").value.trim();
    let st = load(id);
    if (!st) {
      $("startBtn").disabled = true;
      $("idNote").textContent = "ID 확인 중…";
      if (await idUsedElsewhere(id)) {
        $("idNote").textContent = "이 ID로 이미 제출된 응답이 있습니다. 다른 ID를 쓰거나 연구자에게 문의해 주세요.";
        return;
      }
      st = fresh(id);
    }
    S = st; save(); updateSync(); flush();
    $("start").classList.add("hidden");
    if (S.phase === "done") return showDone();
    if (S.phase === "survey") return showSurvey();
    $("trial").classList.remove("hidden");
    renderTrial();
  }

  // ------------------------------------------------------------ trial
  const cur = () => byUid[S.order[S.idx]];
  function resp(it) {
    if (!S.resp[it.uid]) S.resp[it.uid] = { uid: it.uid, kind: it.kind, claim: it.claim, panel_order: S.panelOrder[it.uid],
      q1: {}, q3: null, time_spent_sec: 0, replays: 0, feedback_shown: false };
    return S.resp[it.uid];
  }
  function leave() {
    const r = resp(cur());
    if (enterTime !== null) r.time_spent_sec = Math.round((r.time_spent_sec + (performance.now() - enterTime) / 1000) * 10) / 10;
    enterTime = null;
  }
  function renderTrial() {
    const it = cur(), r = resp(it);
    enterTime = performance.now();
    window.scrollTo(0, 0);
    $("claim").textContent = it.claim;
    $("josa").textContent = josa(it.claim);
    $("claimVerb").textContent = VERB[it.claim];
    $("claim2").textContent = it.claim;
    $("prog").textContent = `${S.idx + 1} / ${S.order.length}`;
    $("practiceTag").classList.toggle("hidden", it.kind !== "practice");
    $("cam").src = "images/" + it.camera;
    $("egoSpeed").textContent = it.ego_speed_kmh;
    $("egoCmd").textContent = it.command;
    $("feedback").classList.add("hidden");
    $("prevBtn").disabled = S.idx === 0;
    const pan = $("panels");
    pan.innerHTML = "";
    canvases = [];
    const img = new Image();
    S.panelOrder[it.uid].forEach((pid, k) => {
      const p = it.panels.find(q => q.pid === pid);
      const d = document.createElement("div");
      d.className = "panel";
      d.dataset.pid = pid;
      d.innerHTML = `<div class="panel-title">결과 ${k + 1}</div><canvas></canvas>
        <div class="speed">4초 뒤 속도: 원래 <b>${Math.round(it.orig.vend)}</b> → <b>${Math.round(p.vend)}</b> km/h</div>
        <div class="q1"><span>${Q1[it.claim]}</span><button data-v="yes">예</button><button data-v="no">아니오</button></div>`;
      d.querySelectorAll(".q1 button").forEach(b => b.addEventListener("click", () => { r.q1[pid] = b.dataset.v; save(); mark(); }));
      pan.appendChild(d);
      canvases.push({ cv: d.querySelector("canvas"), it, p, img });
    });
    const q3 = $("q3btns");
    q3.innerHTML = "";
    S.panelOrder[it.uid].forEach((pid, k) => {
      const b = document.createElement("button");
      b.textContent = `결과 ${k + 1}`;
      b.dataset.pid = pid;
      b.addEventListener("click", () => { r.q3 = pid; save(); mark(); });
      q3.appendChild(b);
    });
    img.onload = () => { sizeCanvases(); restart(); };
    img.src = "images/" + it.map;
    sizeCanvases(); restart();
    mark();
  }
  function mark() {
    const it = cur(), r = resp(it);
    document.querySelectorAll(".panel").forEach(d => {
      d.querySelectorAll(".q1 button").forEach(b => b.classList.toggle("on", r.q1[d.dataset.pid] === b.dataset.v));
      d.classList.toggle("chosen", r.q3 === d.dataset.pid);
    });
    document.querySelectorAll("#q3btns button").forEach(b => b.classList.toggle("on", r.q3 === b.dataset.pid));
    $("nextBtn").disabled = !(it.panels.every(p => r.q1[p.pid]) && r.q3);
    $("nextBtn").textContent = it.kind === "practice" && !r.feedback_shown ? "정답 확인" :
      S.idx === S.order.length - 1 ? "마지막 문항 끝내기" : "다음";
  }
  function next() {
    const it = cur(), r = resp(it);
    if (it.kind === "practice" && !r.feedback_shown) {
      r.feedback_shown = true;
      const ok = r.q3 === it.target_pid, k = S.panelOrder[it.uid].indexOf(it.target_pid) + 1, fb = $("feedback");
      fb.className = "feedback" + (ok ? "" : " wrong");
      fb.innerHTML = `${ok ? "맞았습니다." : "이번에는 결과 " + k + "가 정답입니다."} ${it.feedback}<br>
        <span class="note">본 문항부터는 정답을 알려 드리지 않습니다. 정답이 정해지지 않은 문항도 있으니 보이는 대로 답해 주세요.</span>`;
      save(); mark();
      return;
    }
    leave();
    sendTrial(it.uid, S.idx);
    if (S.idx === S.order.length - 1) { S.phase = "survey"; save(); $("trial").classList.add("hidden"); return showSurvey(); }
    S.idx += 1; save(); renderTrial();
  }
  function prev() { if (S.idx > 0) { leave(); S.idx -= 1; save(); renderTrial(); } }

  // ------------------------------------------------------------ drawing (Fig. 6 style paths + moving cars)
  function sizeCanvases() {
    const dpr = window.devicePixelRatio || 1;
    canvases.forEach(c => { const w = c.cv.clientWidth; c.cv.width = Math.round(w * dpr); c.cv.height = Math.round(w * dpr); });
  }
  const poses = T => [[0, 0, 0]].concat(T);               // plot coords (x = -left, y = forward, yaw)
  function pathLen(T) { const P = poses(T); let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; }
  function poseAt(T, t) {                                  // real time t in [0, 4] s, linear between outputs every dt
    const P = poses(T), k = Math.min(t / PB.dt, P.length - 1), i = Math.min(Math.floor(k), P.length - 2), f = k - i;
    const a = P[i], b = P[i + 1];
    return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])];
  }
  function draw(c, t) {
    const { cv, it, p, img } = c, g = cv.getContext("2d"), W = cv.width, H = cv.height, [x0, x1, y0, y1] = it.extent;
    const px = (x, y) => [(x - x0) / (x1 - x0) * W, (1 - (y - y0) / (y1 - y0)) * H];
    const sc = W / 480;
    g.clearRect(0, 0, W, H);
    if (img.complete && img.naturalWidth) g.drawImage(img, 0, 0, W, H);
    const lines = [[it.orig.T, ORIG_C, 3.4], [p.T, STEER_C, 5]].sort((a, b) => pathLen(b[0]) - pathLen(a[0]));  // shortest on top
    lines.forEach(([T, col, lw]) => {
      const P = poses(T).map(q => px(q[0], q[1]));
      g.globalAlpha = .7; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw * sc; g.lineJoin = "round"; g.lineCap = "round";
      g.beginPath(); P.forEach(([u, v], i) => (i ? g.lineTo(u, v) : g.moveTo(u, v))); g.stroke();
      P.forEach(([u, v]) => { g.beginPath(); g.arc(u, v, (lw * .55 + 1.6) * sc, 0, 2 * Math.PI); g.fill(); });
      g.globalAlpha = 1;
    });
    [[it.orig.T, ORIG_C], [p.T, STEER_C]].forEach(([T, col]) => {        // cars: original first, steered on top
      const [x, y, yaw] = poseAt(T, t), fx = -Math.sin(yaw), fy = Math.cos(yaw), lx = -Math.cos(yaw), ly = -Math.sin(yaw);
      g.beginPath();
      CAR.forEach(([f, l], i) => { const [u, v] = px(x + f * fx + l * lx, y + f * fy + l * ly); i ? g.lineTo(u, v) : g.moveTo(u, v); });
      g.closePath(); g.fillStyle = col; g.strokeStyle = "#ffffff"; g.lineWidth = 1.5 * sc; g.fill(); g.stroke();
    });
    const [bu, bv] = [W * .05, H * .94], m5 = 5 / (x1 - x0) * W;           // 5 m bar
    g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(bu - 6 * sc, bv - 22 * sc, m5 + 12 * sc, 28 * sc);
    g.strokeStyle = "#5b6470"; g.lineWidth = 2 * sc; g.beginPath(); g.moveTo(bu, bv); g.lineTo(bu + m5, bv); g.stroke();
    g.fillStyle = "#5b6470"; g.font = `${13 * sc}px sans-serif`; g.fillText("5 m", bu, bv - 6 * sc);
  }
  function frame(now) {
    const move = 4 / PB.speedup, cyc = move + PB.hold_s, tt = (Math.max(0, now - clock0) / 1000) % cyc;   // rAF time can precede clock0
    const t = Math.min(tt * PB.speedup, 4);
    canvases.forEach(c => draw(c, t));
    raf = requestAnimationFrame(frame);
  }
  function restart() { cancelAnimationFrame(raf); clock0 = performance.now(); raf = requestAnimationFrame(frame); }

  // ------------------------------------------------------------ survey
  function showSurvey() {
    cancelAnimationFrame(raf);
    $("survey").classList.remove("hidden");
    window.scrollTo(0, 0);
    const f = $("svForm");
    f.innerHTML = "";
    SURVEY.forEach(([q, title, opts]) => {
      const box = document.createElement("fieldset");
      box.className = "svq";
      box.innerHTML = `<legend></legend><div class="seg"></div>`;
      box.querySelector("legend").textContent = title;
      Object.entries(opts).forEach(([v, label]) => {
        const l = document.createElement("label");
        l.innerHTML = `<input type="radio" name="sv_${q}" value="${v}"><span></span>`;
        l.querySelector("span").textContent = label;
        const inp = l.querySelector("input");
        inp.checked = S.survey[q] === v;
        inp.addEventListener("change", () => { S.survey[q] = v; save(); updateSurvey(); });
        box.querySelector(".seg").appendChild(l);
      });
      f.appendChild(box);
    });
    $("comment").value = S.comment || "";
    updateSurvey();
  }
  function updateSurvey() { $("svSubmit").disabled = !SURVEY.every(([q]) => S.survey[q]); }
  function submitSurvey() {
    S.comment = $("comment").value;
    S.phase = "done";
    S.finished_at = new Date().toISOString();
    save();
    $("survey").classList.add("hidden");
    sendFinal();
    showDone();
  }
  function backToTrials() { S.phase = "trial"; save(); $("survey").classList.add("hidden"); $("trial").classList.remove("hidden"); renderTrial(); }

  // ------------------------------------------------------------ done
  function showDone() { cancelAnimationFrame(raf); $("done").classList.remove("hidden"); renderDone(); }
  function renderDone() {
    if ($("done").classList.contains("hidden")) return;
    const st = $("doneStatus");
    if (!ONLINE) st.textContent = "아래 버튼으로 결과 파일을 내려받아 연구자에게 보내 주세요.";
    else if (finalState === "sent" || (finalState === null && !getBox().length)) st.textContent = "응답이 저장되었습니다. 창을 닫으셔도 됩니다.";
    else if (finalState === "failed") st.textContent = "응답을 보내지 못했습니다. 인터넷 연결을 확인해 주세요. 계속 실패하면 아래 버튼으로 파일을 내려받아 연구자에게 보내 주세요.";
    else st.textContent = "응답을 보내는 중입니다… 창을 닫지 말아 주세요.";
    $("dlBtn").classList.toggle("primary", !ONLINE || finalState === "failed");
  }
  function download() {
    const blob = new Blob([JSON.stringify(resultObject(), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `steer_result_${S.annotator_id}_${(S.finished_at || new Date().toISOString()).replace(/[:.]/g, "-")}.json`;
    a.click();
    $("dlNote").textContent = "내려받기를 시작했습니다. 파일이 저장되지 않았다면 버튼을 다시 눌러 주세요.";
  }

  const qid = new URLSearchParams(location.search).get("id");
  if (qid) { $("annId").value = qid; onId(); }
  $("annId").addEventListener("input", onId);
  $("annId").addEventListener("keydown", e => { if (e.key === "Enter" && !$("startBtn").disabled) start(); });
  $("startBtn").addEventListener("click", start);
  $("nextBtn").addEventListener("click", next);
  $("prevBtn").addEventListener("click", prev);
  $("replayBtn").addEventListener("click", () => { if (S) { resp(cur()).replays += 1; save(); } restart(); });
  $("svSubmit").addEventListener("click", submitSurvey);
  $("svBack").addEventListener("click", backToTrials);
  $("dlBtn").addEventListener("click", download);
  window.addEventListener("resize", () => { if (canvases.length) sizeCanvases(); });
})();
