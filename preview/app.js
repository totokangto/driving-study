/* Driving decision annotation tool (static, works from file://). Data: window.MANIFEST (data/manifest.js). */
"use strict";
(function () {
  const M = window.MANIFEST;
  const APP_VERSION = M.app_version;
  const MAX_CLICKS = 3;
  const RANK_COLORS = ["#e11d48", "#7c3aed", "#0891b2"];
  const CATS = ["vehicle", "pedestrian", "traffic_light", "stop_line", "road_shape", "other"];

  const TEXT = {
    ko: {
      title: "운전 판단 근거 평가", idLabel: "평가자 ID", start: "시작", practice: "연습", help: "안내문",
      camera: "전방 카메라", bev: "위에서 내려다본 지도", replay: "▶ 직전 1.5초 재생", replaying: "재생 중",
      lgEgo: "ego(내 차)", lgVeh: "차량", lgPed: "보행자", lgStop: "정지선",
      yourClicks: "클릭한 대상 (중요한 순서)", clickHint: "카메라나 지도에서 대상을 클릭하세요. 최대 3개.",
      undo: "마지막 클릭 취소", none: "특정 대상 없음", confidence: "확신 정도",
      certain: "확실함", moderate: "보통", unsure: "잘 모르겠음", prev: "← 이전", next: "다음 →", finish: "마치기",
      doneTitle: "끝났습니다. 감사합니다!", doneText: "아래 버튼으로 결과 파일을 내려받아 연구자에게 보내 주세요.",
      download: "결과 파일 내려받기", back: "← 마지막 장면으로", close: "닫기",
      doneTextOnline: "응답은 장면마다 자동으로 연구자에게 전송됩니다.",
      sendingFinal: "결과를 전송하는 중입니다…",
      sentFinal: "✓ 결과가 전송되었습니다. 이제 창을 닫으셔도 됩니다.",
      failedFinal: "결과를 전송하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요. 계속 실패하면 아래 버튼으로 결과 파일을 내려받아 연구자에게 보내 주세요.",
      retry: "다시 전송", downloadBackup: "결과 파일 내려받기 (백업)",
      syncOk: "✓ 저장됨", syncPending: n => `전송 대기 ${n}`, syncFail: n => `⚠ 전송 실패 ${n} · 다시 시도 중`,
      decision: c => `이 장면에서 올바른 운전 판단은 <b>${c}</b> 입니다.`,
      ego: (v, c) => `현재 속도 ${v} km/h · 경로 안내: ${c}`,
      progress: (i, n) => `${i} / ${n}`,
      needClick: "대상을 하나 이상 클릭하거나 \"특정 대상 없음\"을 선택하세요.",
      needCat: "클릭마다 대상 종류를 골라 주세요.", needConf: "확신 정도를 골라 주세요.",
      resume: (i, n) => `저장된 진행 상황이 있습니다 (${i} / ${n}). 시작을 누르면 이어서 합니다.`,
      viewCam: "카메라", viewBev: "지도", objectSel: "대상 선택됨", pointSel: "위치",
      cats: { vehicle: "차량", pedestrian: "보행자", traffic_light: "신호등", stop_line: "정지선·횡단보도",
              road_shape: "도로 모양", other: "기타" },
      commands: { left: "좌회전", straight: "직진", right: "우회전", unknown: "알 수 없음" },
      instructions: `<p>각 장면은 자율주행 차량(ego)이 지금 보고 있는 상황입니다. 화면 위쪽은 전방 카메라, 아래쪽은 위에서 내려다본 지도이며, 지도의 가운데 초록색 차량이 ego입니다.</p>
<p>화면 맨 위에 이 장면에서 올바른 운전 판단이 적혀 있습니다. 여러분이 운전자라면 그 판단을 내리기 위해 무엇을 반드시 봐야 하는지 생각해 보고, 그 대상을 클릭해 주세요. 가장 중요한 대상부터 최대 3개까지 클릭할 수 있습니다.</p>
<p>정답이 정해져 있지 않습니다. 본인이 운전한다면 무엇을 보고 판단할지를 기준으로 답해 주세요. 근거가 되는 특정 대상이 없다고 생각하면 "특정 대상 없음"을 눌러 주세요.</p>
<p class="muted small">클릭할 때마다 대상 종류를 고릅니다. "직전 1.5초 재생"으로 다른 차가 움직이는지 볼 수 있습니다(재생 중에는 클릭할 수 없습니다). 진행 상황은 자동으로 저장되므로 창을 닫았다가 같은 ID로 다시 열면 이어서 할 수 있습니다. 처음 몇 장면은 연습입니다.</p>`
    },
    en: {
      title: "Driving Decision Study", idLabel: "Annotator ID", start: "Start", practice: "Practice", help: "Instructions",
      camera: "Front camera", bev: "Top-down map", replay: "▶ Replay last 1.5 s", replaying: "replaying",
      lgEgo: "ego (our car)", lgVeh: "vehicle", lgPed: "pedestrian", lgStop: "stop line",
      yourClicks: "Your clicks (most important first)", clickHint: "Click objects in the camera or the map. Up to 3.",
      undo: "Undo last click", none: "No specific object", confidence: "Confidence",
      certain: "Certain", moderate: "Moderate", unsure: "Not sure", prev: "← Back", next: "Next →", finish: "Finish",
      doneTitle: "All done. Thank you!", doneText: "Please download the result file below and send it to the researcher.",
      download: "Download result file", back: "← Back to the last scene", close: "Close",
      doneTextOnline: "Your responses are sent to the researcher automatically after every scene.",
      sendingFinal: "Sending your results…",
      sentFinal: "✓ Your results have been sent. You can close this window now.",
      failedFinal: "Your results could not be sent. Check your internet connection and try again. If it keeps failing, download the result file below and send it to the researcher.",
      retry: "Send again", downloadBackup: "Download result file (backup)",
      syncOk: "✓ saved", syncPending: n => `${n} waiting to send`, syncFail: n => `⚠ ${n} not sent · retrying`,
      decision: c => `The correct driving decision in this scene is to <b>${c}</b>.`,
      ego: (v, c) => `Current speed ${v} km/h · Route command: ${c}`,
      progress: (i, n) => `${i} / ${n}`,
      needClick: "Click at least one object or choose \"No specific object\".",
      needCat: "Choose an object type for every click.", needConf: "Choose your confidence.",
      resume: (i, n) => `Saved progress found (${i} / ${n}). Press Start to continue.`,
      viewCam: "camera", viewBev: "map", objectSel: "object selected", pointSel: "point",
      cats: { vehicle: "Vehicle", pedestrian: "Pedestrian", traffic_light: "Traffic light",
              stop_line: "Stop line / crosswalk", road_shape: "Road shape", other: "Other" },
      commands: { left: "turn left", straight: "go straight", right: "turn right", unknown: "unknown" },
      instructions: `<p>Each scene shows what the automated vehicle (ego) currently sees. The top image is the front camera; the bottom image is a top-down map, where the green car in the centre is the ego.</p>
<p>The correct driving decision for the scene is written at the top. Imagine you are the driver: what must you see to make that decision? Click those objects, most important first, up to three.</p>
<p>There is no single correct choice. Respond based on what you would look at if you were driving. If you think no specific object is the reason, press "No specific object".</p>
<p class="muted small">Choose an object type for each click. "Replay last 1.5 s" shows whether other road users are moving (clicks are disabled while it plays). Progress is saved automatically: close the window and reopen it with the same ID to continue. The first few scenes are practice.</p>`
    }
  };

  // ------------------------------------------------------------ state
  let lang = "ko";
  let S = null;           // {annotator_id, order_seed, order: [uid], idx, started_at, finished_at, resp: {uid: {...}}, lang}
  let enterTime = null;
  let replayTimer = null;
  const byUid = {};
  M.scenes.forEach(s => { byUid[s.scene_uid] = s; });
  const T = () => TEXT[lang];
  const $ = id => document.getElementById(id);
  const storeKey = id => `annot_state_v1_${id}`;

  function save() { try { localStorage.setItem(storeKey(S.annotator_id), JSON.stringify(S)); } catch (e) { /* ignore */ } }
  function load(id) { try { return JSON.parse(localStorage.getItem(storeKey(id)) || "null"); } catch (e) { return null; } }

  // ------------------------------------------------------------ online collection (config.js; off when submit_url is empty)
  // Every message goes to an outbox in localStorage first and leaves it only when the server replies {ok: true}, so a
  // closed tab or a lost connection delays a message but never drops it. The server ignores a msg_id it has seen.
  const CFG = window.STUDY_CONFIG || {};
  const ONLINE = !!CFG.submit_url;
  const SESSION_ID = randId(10);                 // one per page load: tells two devices with the same ID apart
  const outKey = id => `annot_outbox_v1_${id}`;
  let sending = false, retryTimer = null, fails = 0, finalState = null;   // finalState: null|sending|sent|failed
  const RETRY_SEC = [2, 5, 10, 15], SHOW_FAIL_AFTER = 3;                   // consecutive failures before warning
  function randId(n) {
    const a = new Uint8Array(n);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; });
    return Array.from(a, b => (b % 36).toString(36)).join("");
  }
  function getBox() { try { return JSON.parse(localStorage.getItem(outKey(S.annotator_id)) || "[]"); } catch (e) { return []; } }
  function setBox(b) { try { localStorage.setItem(outKey(S.annotator_id), JSON.stringify(b)); } catch (e) { /* ignore */ } }
  function envelope(kind) {
    return { msg_id: `${S.annotator_id}-${SESSION_ID}-${Date.now().toString(36)}-${randId(4)}`, kind,
             study_key: CFG.study_key || "", annotator_id: S.annotator_id, session_id: SESSION_ID,
             manifest_id: M.manifest_id, app_version: APP_VERSION, order_seed: S.order_seed, language: S.lang,
             sent_at: new Date().toISOString() };
  }
  function enqueue(msg) {
    if (!ONLINE) return;
    const b = getBox(); b.push(msg); setBox(b); updateSync(); flush();
  }
  async function flush() {
    if (!ONLINE || !S || sending) return;
    sending = true; clearTimeout(retryTimer);
    try {
      for (;;) {
        const b = getBox();
        if (!b.length) break;
        const msg = b[0];
        // a text/plain body keeps this a "simple" request: Apps Script does not handle a CORS preflight
        const res = await fetch(CFG.submit_url, { method: "POST", body: JSON.stringify(msg) });
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
    } finally {
      sending = false; updateSync();
    }
  }
  window.addEventListener("online", flush);
  function updateSync() {
    const badge = $("syncBadge");
    if (!ONLINE || !S) { badge.classList.add("hidden"); return; }
    const n = getBox().length;
    badge.classList.remove("hidden");
    const warn = n > 0 && fails >= SHOW_FAIL_AFTER;
    badge.classList.toggle("warn", warn);
    badge.textContent = n === 0 ? T().syncOk : warn ? T().syncFail(n) : T().syncPending(n);
  }
  function setFinal(state) { finalState = state; renderDoneSync(); }
  function sendScene(i) {
    const uid = S.order[i];
    if (S.resp[uid]) enqueue(Object.assign(envelope("scene"), { order: i, response: S.resp[uid] }));
  }
  function sendFinal() {
    if (!ONLINE) return;
    setBox(getBox().filter(m => m.kind !== "final"));        // only the latest final matters
    setFinal("sending");
    enqueue(Object.assign(envelope("final"), { result: resultObject() }));
  }

  // ------------------------------------------------------------ seeded order (core.js)
  const { fnv1a, snap: snapObjects, toImagePx: toPx } = window.AnnotCore;
  const makeOrder = seed => window.AnnotCore.makeOrder(M.scenes, seed);

  // ------------------------------------------------------------ i18n
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach(el => { const v = T()[el.dataset.t]; if (typeof v === "string") el.textContent = v; });
    document.querySelectorAll(".langbtn").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
    $("instructions").innerHTML = T().instructions;
    $("helpText").innerHTML = T().instructions;
    if (S && !$("task").classList.contains("hidden")) renderScene();
    updateSync(); renderDoneSync();
  }

  // ------------------------------------------------------------ start screen
  $("annotator").addEventListener("input", () => {
    const id = $("annotator").value.trim();
    $("startBtn").disabled = !/^[A-Za-z0-9_-]{1,32}$/.test(id);
    const old = id && load(id);
    $("resumeNote").textContent = old ? T().resume(Math.min(old.idx + 1, old.order.length), old.order.length) : "";
  });
  document.querySelectorAll(".langbtn").forEach(b => b.addEventListener("click", () => { lang = b.dataset.lang; applyLang(); }));
  $("startBtn").addEventListener("click", () => {
    const id = $("annotator").value.trim();
    S = load(id);
    if (!S || S.app_version !== APP_VERSION) {
      const seed = fnv1a(`${M.order_salt}|${id}`);
      S = { app_version: APP_VERSION, annotator_id: id, order_seed: seed, order: makeOrder(seed), idx: 0,
            started_at: new Date().toISOString(), finished_at: null, resp: {}, lang };
    }
    S.lang = lang;
    save();
    flush();                                    // anything left from an earlier visit
    $("start").classList.add("hidden");
    if (S.finished_at && S.idx >= S.order.length) { showDone(); return; }
    S.idx = Math.min(S.idx, S.order.length - 1);
    $("task").classList.remove("hidden");
    renderScene();
  });

  // ------------------------------------------------------------ scene
  function cur() { return byUid[S.order[S.idx]]; }
  function resp() {
    const uid = S.order[S.idx];
    if (!S.resp[uid]) S.resp[uid] = { scene_uid: uid, clicks: [], no_specific_target: false, confidence: null, time_spent_sec: 0 };
    return S.resp[uid];
  }
  function leaveScene() {
    if (enterTime !== null && S) { resp().time_spent_sec = +(resp().time_spent_sec + (performance.now() - enterTime) / 1000).toFixed(1); }
    enterTime = null;
    stopReplay();
  }

  function renderScene() {
    const sc = cur(), r = resp();
    const n = S.order.length;
    $("progressFill").style.width = `${100 * S.idx / n}%`;
    $("progressText").textContent = T().progress(S.idx + 1, n);
    $("practiceTag").classList.toggle("hidden", sc.kind !== "practice");
    $("decision").innerHTML = T().decision(lang === "ko" ? sc.decision_ko : sc.decision_en);
    $("ego").textContent = T().ego(sc.ego_speed_kmh.toFixed(0), T().commands[sc.driving_command] || sc.driving_command);
    const ci = $("camImg"), bi = $("bevImg");
    if (ci.dataset.uid !== sc.scene_uid) {
      ci.dataset.uid = sc.scene_uid; ci.src = sc.camera; bi.src = sc.bev;
      ci.onload = drawOverlays; bi.onload = drawOverlays;
      sc.past.forEach(p => { const im = new Image(); im.src = p; });   // preload
    }
    $("replayBtn").disabled = sc.past.length === 0;
    $("noneBox").checked = r.no_specific_target;
    document.querySelectorAll('input[name="conf"]').forEach(x => { x.checked = x.value === r.confidence; });
    $("prevBtn").disabled = S.idx === 0;
    $("nextBtn").textContent = S.idx === n - 1 ? T().finish : T().next;
    renderClicks();
    drawOverlays();
    if (enterTime === null) enterTime = performance.now();
  }

  function renderClicks() {
    const r = resp(), ol = $("clickList");
    ol.innerHTML = "";
    r.clicks.forEach((c, i) => {
      const li = document.createElement("li");
      li.className = `rk${i + 1}`;
      const what = c.object_token ? T().objectSel : T().pointSel;
      li.innerHTML = `<span>${c.view === "camera" ? T().viewCam : T().viewBev} · ${what}</span>`;
      const sel = document.createElement("select");
      sel.innerHTML = `<option value="">—</option>` + CATS.map(k => `<option value="${k}">${T().cats[k]}</option>`).join("");
      sel.value = c.category || "";
      sel.addEventListener("change", () => { c.category = sel.value || null; save(); updateNext(); });
      li.appendChild(sel);
      ol.appendChild(li);
    });
    $("undoBtn").disabled = r.clicks.length === 0;
    updateNext();
  }

  function validity() {
    const r = resp();
    if (!r.no_specific_target && r.clicks.length === 0) return T().needClick;
    if (!r.no_specific_target && r.clicks.some(c => !c.category)) return T().needCat;
    if (!r.confidence) return T().needConf;
    return "";
  }
  function updateNext() {
    const v = validity();
    $("nextBtn").disabled = !!v;
    $("nextHint").textContent = v;
  }

  // ------------------------------------------------------------ geometry (core.js)
  function snap(sc, view, x, y) { return snapObjects(sc.objects, view, x, y); }
  function toImagePx(ev, img) { return toPx(ev.clientX, ev.clientY, img.getBoundingClientRect(), img.naturalWidth, img.naturalHeight); }

  // ------------------------------------------------------------ clicks
  function onClick(view, ev) {
    if (replayTimer) return;
    const r = resp();
    if (r.clicks.length >= MAX_CLICKS) return;
    const img = view === "camera" ? $("camImg") : $("bevImg");
    if (!img.naturalWidth) return;
    const p = toImagePx(ev, img);
    const o = snap(cur(), view, p.x, p.y);
    const guess = o ? (o.kind === "pedestrian" ? "pedestrian" : "vehicle") : null;
    const c = { rank: r.clicks.length + 1, view, x: +p.x.toFixed(1), y: +p.y.toFixed(1),
                object_token: o ? o.object_token : null, category: guess };
    r.clicks.push(c);
    if (r.no_specific_target) { r.no_specific_target = false; $("noneBox").checked = false; }
    save(); renderClicks(); drawOverlays();
    showCatPop(c, ev.clientX, ev.clientY);
  }
  $("camCanvas").addEventListener("click", ev => onClick("camera", ev));
  $("bevCanvas").addEventListener("click", ev => onClick("bev", ev));

  function showCatPop(c, cx, cy) {
    const pop = $("catPop");
    pop.innerHTML = "";
    CATS.forEach(k => {
      const b = document.createElement("button");
      b.textContent = T().cats[k] + (c.category === k ? " ✓" : "");
      b.addEventListener("click", e => { e.stopPropagation(); c.category = k; pop.classList.add("hidden"); save(); renderClicks(); });
      pop.appendChild(b);
    });
    pop.classList.remove("hidden");
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = `${Math.min(cx + 10, window.innerWidth - w - 8)}px`;
    pop.style.top = `${Math.min(cy + 10, window.innerHeight - h - 8)}px`;
  }
  document.addEventListener("click", e => {
    const pop = $("catPop");
    if (!pop.classList.contains("hidden") && !pop.contains(e.target) && e.target.tagName !== "CANVAS") pop.classList.add("hidden");
  });

  $("undoBtn").addEventListener("click", () => { resp().clicks.pop(); $("catPop").classList.add("hidden"); save(); renderClicks(); drawOverlays(); });
  $("noneBox").addEventListener("change", () => {
    const r = resp();
    r.no_specific_target = $("noneBox").checked;
    if (r.no_specific_target) r.clicks = [];
    save(); renderClicks(); drawOverlays();
  });
  document.querySelectorAll('input[name="conf"]').forEach(x => x.addEventListener("change", () => { resp().confidence = x.value; save(); updateNext(); }));

  // ------------------------------------------------------------ drawing
  function prepCanvas(cv, img) {
    cv.width = img.naturalWidth || 1; cv.height = img.naturalHeight || 1;
    const g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height); return g;
  }
  function drawOverlays() {
    const sc = cur(), r = resp();
    const ci = $("camImg"), bi = $("bevImg");
    const gc = prepCanvas($("camCanvas"), ci), gb = prepCanvas($("bevCanvas"), bi);
    if (replayTimer) return;
    const scaleC = (ci.naturalWidth || 2048) / 1024, scaleB = (bi.naturalWidth || 512) / 256;
    r.clicks.forEach((c, i) => {
      const col = RANK_COLORS[i];
      const o = c.object_token ? sc.objects.find(q => q.object_token === c.object_token) : null;
      if (o) {
        gc.strokeStyle = col; gc.lineWidth = 1.5 * scaleC;
        o.camera_rects.forEach(rc => gc.strokeRect(rc[0], rc[1], rc[2] - rc[0], rc[3] - rc[1]));
        gb.strokeStyle = col; gb.lineWidth = 1.2 * scaleB; gb.beginPath();
        o.bev_polygon.forEach(([x, y], k) => k ? gb.lineTo(x, y) : gb.moveTo(x, y)); gb.closePath(); gb.stroke();
      }
      const g = c.view === "camera" ? gc : gb, s = c.view === "camera" ? scaleC : scaleB;
      g.fillStyle = col; g.beginPath(); g.arc(c.x, c.y, 3.5 * s, 0, 2 * Math.PI); g.fill();
      g.font = `bold ${9 * s}px sans-serif`; g.lineWidth = 2.5 * s; g.strokeStyle = "#fff";
      g.strokeText(String(i + 1), c.x + 4 * s, c.y - 4 * s); g.fillText(String(i + 1), c.x + 4 * s, c.y - 4 * s);
    });
  }
  window.addEventListener("resize", drawOverlays);

  // ------------------------------------------------------------ replay (D-4)
  function stopReplay() {
    if (!replayTimer) return;
    clearInterval(replayTimer); replayTimer = null;
    $("camImg").src = cur().camera; $("camWrap").classList.remove("replaying"); $("replayLabel").textContent = "";
    $("replayBtn").disabled = false;
  }
  $("replayBtn").addEventListener("click", () => {
    const sc = cur();
    if (!sc.past.length || replayTimer) return;
    const frames = sc.past.concat([sc.camera]);
    const times = sc.past_times.concat([0]);
    let k = 0;
    $("camWrap").classList.add("replaying"); $("replayBtn").disabled = true; $("catPop").classList.add("hidden");
    drawOverlaysClear();
    const step = () => {
      if (k >= frames.length) { stopReplay(); drawOverlays(); return; }
      $("camImg").src = frames[k]; $("replayLabel").textContent = `${T().replaying} ${times[k].toFixed(1)} s`; k++;
    };
    step();
    replayTimer = setInterval(step, 600);
  });
  function drawOverlaysClear() { prepCanvas($("camCanvas"), $("camImg")); prepCanvas($("bevCanvas"), $("bevImg")); }

  // ------------------------------------------------------------ navigation
  $("nextBtn").addEventListener("click", () => {
    if (validity()) return;
    leaveScene();
    $("catPop").classList.add("hidden");
    sendScene(S.idx);
    if (S.idx === S.order.length - 1) {
      S.finished_at = S.finished_at || new Date().toISOString(); S.idx = S.order.length; save();
      sendFinal(); showDone(); return;
    }
    S.idx++; save(); renderScene(); window.scrollTo(0, 0);
  });
  $("prevBtn").addEventListener("click", () => {
    if (S.idx === 0) return;
    leaveScene(); $("catPop").classList.add("hidden");
    S.idx--; save(); renderScene(); window.scrollTo(0, 0);
  });
  $("helpBtn").addEventListener("click", () => $("helpModal").classList.remove("hidden"));
  $("helpClose").addEventListener("click", () => $("helpModal").classList.add("hidden"));

  function showDone() {
    $("task").classList.add("hidden"); $("done").classList.remove("hidden");
    // reopened after finishing: a final that already left the outbox was sent
    if (ONLINE && finalState === null) setFinal(getBox().some(m => m.kind === "final") ? "sending" : "sent");
    renderDoneSync();
  }
  function renderDoneSync() {
    if (!S) return;
    $("doneText").textContent = ONLINE ? T().doneTextOnline : T().doneText;
    $("downloadBtn").textContent = ONLINE ? T().downloadBackup : T().download;
    $("downloadBtn").className = ONLINE ? "ghost" : "primary";
    const line = $("doneSync");
    line.className = `syncline ${finalState || ""}` + (!ONLINE || !finalState ? " hidden" : "");
    line.textContent = finalState ? T()[{ sending: "sendingFinal", sent: "sentFinal", failed: "failedFinal" }[finalState]] : "";
    $("retryBtn").classList.toggle("hidden", finalState !== "failed");
  }
  $("retryBtn").addEventListener("click", () => { fails = 0; setFinal("sending"); clearTimeout(retryTimer); flush(); });
  $("backBtn").addEventListener("click", () => {
    S.idx = S.order.length - 1; save();
    $("done").classList.add("hidden"); $("task").classList.remove("hidden"); renderScene();
  });
  function resultObject() {
    return {
      annotator_id: S.annotator_id, app_version: APP_VERSION, manifest_id: M.manifest_id, order_seed: S.order_seed,
      language: S.lang, started_at: S.started_at, finished_at: S.finished_at,
      responses: S.order.map((uid, i) => Object.assign({ order: i }, S.resp[uid] || { scene_uid: uid, clicks: [],
        no_specific_target: false, confidence: null, time_spent_sec: 0 }))
    };
  }
  $("downloadBtn").addEventListener("click", () => {
    const out = resultObject();
    const ts = (S.finished_at || new Date().toISOString()).replace(/[:.]/g, "-");
    const blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `result_${S.annotator_id}_${ts}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  });

  // personal links: index.html?id=A01&lang=en
  const params = new URLSearchParams(location.search);
  if (params.get("lang") in TEXT) lang = params.get("lang");
  applyLang();
  if (params.get("id")) { $("annotator").value = params.get("id"); $("annotator").dispatchEvent(new Event("input")); }
})();
