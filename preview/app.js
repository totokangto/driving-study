/* Driving decision annotation tool (static, works from file://). Data: window.MANIFEST (data/manifest.js). */
"use strict";
(function () {
  const M = window.MANIFEST;
  const APP_VERSION = M.app_version;
  const MAX_CLICKS = 3;
  const RANK_COLORS = ["#e11d48", "#7c3aed", "#0891b2"];
  const CATS = ["vehicle", "pedestrian", "traffic_light", "stop_sign", "stop_line", "road_shape", "other"];
  const ID_RE = /^[A-Za-z0-9_-]{1,32}$/;
  const SEC_PER_SCENE = 30, SEC_PER_CMP = 15;

  const TEXT = {
    ko: {
      title: "운전 판단 근거 평가", lead: "자율주행 차량이 본 장면에서, 올바른 운전 판단의 근거가 되는 대상을 골라 주세요.",
      smallScreen: "화면이 작습니다. PC나 노트북의 큰 화면에서 진행해 주세요.",
      ex1a: "올바른 판단:", ex1b: "정지",
      s1t: "판단 확인", s1d: "오른쪽 위에 이 장면의 올바른 운전 판단이 나옵니다.",
      s2t: "근거 표시", s2d: "꼭 봐야 하는 대상을 고르세요. 차량·보행자는 클릭, 신호등·표지판·정지선 같은 것은 드래그해서 박스를 그립니다. 중요한 순서로 최대 3개.",
      s3t: "종류 · 확신도 → 다음", s3d: "대상 종류와 확신 정도를 고르고 '다음'을 누르세요.",
      cVehicle: "차량", cPed: "보행자", cEtc: "기타", illClick: "클릭", illDrag: "드래그",
      keynote: "정답은 없습니다. 내가 운전자라면 무엇을 보고 판단할지를 기준으로 골라 주세요.",
      meta: (p, n, min) => [p ? `연습 ${p}개 + 본 평가 ${n}개` : `${n}개 장면`, `약 ${min}분`, "진행 상황 자동 저장", "언제든 '도움말'로 다시 보기"],
      idLabel: "평가자 ID", idHint: "영문과 숫자만 입력할 수 있습니다 (예: A01). 연구자에게 받은 ID를 입력하세요.",
      idBad: "한글·공백·특수문자는 쓸 수 없습니다. 영문과 숫자로 입력해 주세요 (예: A01).",
      start: "시작하기", startResume: "이어서 하기",
      resume: (i, n) => `이 ID로 저장된 진행 상황이 있습니다 (${i} / ${n}). 이어서 진행합니다.`,
      help: "도움말", helpTitle: "진행 방법", tourAgain: "화면 안내 다시 보기", close: "닫기",
      camera: "전방 카메라", bev: "위에서 내려다본 지도", replay: "▶ 직전 1.5초 재생", replaying: t => `재생 중 · ${t} s (클릭 불가)`,
      lgEgo: "내 차 (ego)", lgVeh: "차량", lgPed: "보행자", lgStop: "정지선",
      lgNote: "위쪽이 진행 방향입니다. 지도에서 클릭해도 됩니다.",
      decLabel: "이 장면의 올바른 운전 판단",
      ego: (v, c) => `현재 속도 ${v} km/h · 경로 안내: ${c}`,
      stagePractice: "연습", stageMain: "본 평가",
      yourClicks: "근거 대상", clickHint: "차량·보행자는 클릭, 그 밖의 대상은 드래그로 박스를 그리세요.\n중요한 순서로 최대 3개.",
      clickFull: "최대 3개까지 고를 수 있습니다. 바꾸려면 ×로 지운 뒤 다시 고르세요.",
      viewCam: "카메라", viewBev: "지도", markObj: "대상", markBox: "그린 영역", catPlaceholder: "종류 선택…", del: "지우기",
      popHead: "이 대상은 무엇인가요? (숫자키 1–7)",
      dragHint: "차량·보행자가 아닌 곳은 드래그해서 박스를 그려 주세요.", tooSmall: "박스가 너무 작습니다. 조금 더 크게 그려 주세요.",
      none: "특정 대상 없음", confidence: "확신 정도",
      certain: "확실함", moderate: "보통", unsure: "잘 모르겠음", prev: "← 이전", next: "다음 →", finish: "마치기",
      keys: "<kbd>Enter</kbd> 다음 · <kbd>Ctrl</kbd>+<kbd>Z</kbd> 마지막 표시 취소 · <kbd>M</kbd> 확대 보기",
      needClick: "대상을 클릭하거나 '특정 대상 없음'을 고르세요.",
      needCat: "클릭한 대상의 종류를 골라 주세요.", needConf: "확신 정도를 골라 주세요.",
      practiceDoneTitle: "연습 끝!", practiceDoneGo: "본 평가 시작",
      practiceDoneText: n => `이제 본 평가 ${n}개 장면입니다. 연습과 같은 방식으로 진행하세요. 응답은 자동으로 저장됩니다.`,
      tourSkip: "건너뛰기", tourNext: "다음", tourDone: "직접 해 보기",
      tour: [
        "먼저 이 장면의 <b>올바른 운전 판단</b>을 확인하세요.",
        "<b>전방 카메라</b>입니다. 차량·보행자는 <b>클릭</b>, 신호등·표지판·정지선 같은 것은 <b>드래그해서 박스</b>를 그리세요. <b>직전 1.5초 재생</b>으로 다른 차가 움직이는지 볼 수 있습니다.",
        "<b>위에서 내려다본 지도</b>입니다. 초록색이 내 차이고 위쪽이 진행 방향입니다. 지도에서 클릭해도 됩니다.",
        "클릭한 대상이 <b>중요한 순서대로</b> 여기에 쌓입니다(최대 3개). 종류를 고르고, 잘못 찍었으면 ×로 지우세요. 근거가 되는 특정 대상이 없으면 <b>특정 대상 없음</b>을 고릅니다.",
        "얼마나 <b>확신</b>하는지 고르세요.",
        "다 골랐으면 <b>다음</b>. 지금은 연습 장면이니 직접 해 보세요!"
      ],
      doneTitle: "끝났습니다. 감사합니다!", doneText: "아래 버튼으로 결과 파일을 내려받아 연구자에게 보내 주세요.",
      download: "결과 파일 내려받기", back: "← 마지막 장면으로",
      doneTextOnline: "응답은 장면마다 자동으로 연구자에게 전송됩니다.",
      sendingFinal: "결과를 전송하는 중입니다…",
      sentFinal: "✓ 결과가 전송되었습니다. 이제 창을 닫으셔도 됩니다.",
      failedFinal: "결과를 전송하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요. 계속 실패하면 아래 버튼으로 결과 파일을 내려받아 연구자에게 보내 주세요.",
      retry: "다시 전송", downloadBackup: "결과 파일 내려받기 (백업)",
      syncOk: "✓ 저장됨", syncPending: n => `전송 대기 ${n}`, syncFail: n => `⚠ 전송 실패 ${n} · 다시 시도 중`,
      cats: { vehicle: "차량", pedestrian: "보행자", traffic_light: "신호등", stop_sign: "정지 표지판", stop_line: "정지선·횡단보도",
              road_shape: "도로 모양", other: "기타" },
      commands: { left: "좌회전", straight: "직진", right: "우회전", unknown: "알 수 없음" },
      stage2: "2단계 비교", s2Head: "세 가지 방법이 표시한 근거 영역 (밝은 부분)",
      s2Title: "2단계: 근거 비교",
      s2Intro: n => `1단계가 끝났습니다. 이제 앞에서 본 장면 중 ${n}개를 다시 보여 드립니다. 세 가지 방법이 각각 이 판단의 근거로 표시한 영역이 밝게 보입니다. 운전자가 이 판단을 위해 봐야 할 것을 가장 잘 짚은 것을 골라 주세요.`,
      s2Lock: "2단계를 시작하면 1단계 응답은 더 이상 바꿀 수 없습니다.", s2Go: "2단계 시작",
      s2Q: "운전자가 이 판단을 위해 봐야 할 것을 가장 잘 짚은 것은?",
      s2Hint: "밝게 남은 영역이 각 방법이 근거로 표시한 곳입니다. 줄을 클릭해도 고를 수 있습니다.",
      same: "비슷함 (구별하기 어려움)", needChoice: "하나를 골라 주세요.",
      keys2: "<kbd>1</kbd>–<kbd>3</kbd> A–C · <kbd>4</kbd> 비슷함 · <kbd>Enter</kbd> 다음",
      metaS2: k => `마지막에 짧은 2단계 비교 ${k}개`,
      loupeOff: "🔍 확대 보기", loupeOn: "🔍 확대 끄기",
      svTitle: "거의 끝났습니다", svLead: "평가자 구성을 보고하기 위한 짧은 질문 4개입니다. 이름이나 연락처 같은 개인 정보는 묻지 않습니다.",
      svSubmit: "제출하고 마치기", svNeed: "모든 질문에 답해 주세요.",
      sv: {
        driving_years: ["운전 경력", { none: "없음", lt1: "1년 미만", y1to5: "1–5년", gt5: "5년 이상" }],
        ad_years: ["자율주행 관련 연구·개발 경력", { none: "없음", lt1: "1년 미만", y1to3: "1–3년", gt3: "3년 이상" }],
        cv_years: ["컴퓨터 비전·딥러닝 연구·개발 경력", { none: "없음", lt1: "1년 미만", y1to3: "1–3년", gt3: "3년 이상" }],
        xai: ["설명 가능한 AI(XAI) 방법을 얼마나 아나요?", { never: "처음 들어 봄", heard: "들어 본 적 있음", used: "연구나 업무에 써 봄" }]
      }
    },
    en: {
      title: "Driving Decision Study", lead: "In each scene seen by an automated car, pick what the correct driving decision is based on.",
      smallScreen: "Your screen is small. Please use a PC or laptop.",
      ex1a: "Correct decision:", ex1b: "stop",
      s1t: "Read the decision", s1d: "The correct driving decision for the scene is shown at the top right.",
      s2t: "Mark the reasons", s2d: "Mark what a driver must see. Click vehicles and pedestrians; drag a box around anything else (lights, signs, stop lines). Most important first, up to 3.",
      s3t: "Type · confidence → Next", s3d: "Choose the object type and your confidence, then press Next.",
      cVehicle: "Vehicle", cPed: "Pedestrian", cEtc: "Other", illClick: "click", illDrag: "drag",
      keynote: "There is no single correct choice. Pick what you would look at if you were driving.",
      meta: (p, n, min) => [p ? `${p} practice + ${n} scenes` : `${n} scenes`, `about ${min} min`, "progress saved automatically", "'Help' shows this again"],
      idLabel: "Annotator ID", idHint: "Letters and numbers only (e.g. A01). Use the ID the researcher gave you.",
      idBad: "Spaces, symbols and non-Latin letters are not allowed. Use letters and numbers (e.g. A01).",
      start: "Start", startResume: "Continue",
      resume: (i, n) => `Saved progress found for this ID (${i} / ${n}). You will continue from there.`,
      help: "Help", helpTitle: "How it works", tourAgain: "Show the screen tour again", close: "Close",
      camera: "Front camera", bev: "Top-down map", replay: "▶ Replay last 1.5 s", replaying: t => `replaying · ${t} s (clicks off)`,
      lgEgo: "our car (ego)", lgVeh: "vehicle", lgPed: "pedestrian", lgStop: "stop line",
      lgNote: "Up is the driving direction. You can click on the map too.",
      decLabel: "Correct driving decision",
      ego: (v, c) => `Speed ${v} km/h · Route: ${c}`,
      stagePractice: "Practice", stageMain: "Study",
      yourClicks: "Reasons", clickHint: "Click vehicles and pedestrians; drag a box around anything else.\nMost important first, up to 3.",
      clickFull: "Up to 3 reasons. To change one, remove it with × and click again.",
      viewCam: "Camera", viewBev: "Map", markObj: "object", markBox: "drawn box", catPlaceholder: "Choose type…", del: "Remove",
      popHead: "What is it? (keys 1–7)",
      dragHint: "For anything other than a vehicle or pedestrian, drag to draw a box.", tooSmall: "The box is too small. Draw it a bit larger.",
      none: "No specific object", confidence: "Confidence",
      certain: "Certain", moderate: "Moderate", unsure: "Not sure", prev: "← Back", next: "Next →", finish: "Finish",
      keys: "<kbd>Enter</kbd> next · <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo last mark · <kbd>M</kbd> magnifier",
      needClick: "Click an object or choose \"No specific object\".",
      needCat: "Choose the type of each clicked object.", needConf: "Choose your confidence.",
      practiceDoneTitle: "Practice done!", practiceDoneGo: "Start the study",
      practiceDoneText: n => `Now come ${n} study scenes. Work the same way as in practice. Responses are saved automatically.`,
      tourSkip: "Skip", tourNext: "Next", tourDone: "Try it",
      tour: [
        "First, read the <b>correct driving decision</b> for the scene.",
        "The <b>front camera</b>. <b>Click</b> vehicles and pedestrians; <b>drag a box</b> around lights, signs, stop lines and the like. <b>Replay last 1.5 s</b> shows whether other road users move.",
        "The <b>top-down map</b>. Green is our car and up is the driving direction. You can click here too.",
        "Your clicks stack up here, <b>most important first</b> (up to 3). Choose a type for each; remove a wrong one with ×. If no specific object is the reason, choose <b>No specific object</b>.",
        "Choose how <b>confident</b> you are.",
        "Then press <b>Next</b>. This is a practice scene, so try it now!"
      ],
      doneTitle: "All done. Thank you!", doneText: "Please download the result file below and send it to the researcher.",
      download: "Download result file", back: "← Back to the last scene",
      doneTextOnline: "Your responses are sent to the researcher automatically after every scene.",
      sendingFinal: "Sending your results…",
      sentFinal: "✓ Your results have been sent. You can close this window now.",
      failedFinal: "Your results could not be sent. Check your internet connection and try again. If it keeps failing, download the result file below and send it to the researcher.",
      retry: "Send again", downloadBackup: "Download result file (backup)",
      syncOk: "✓ saved", syncPending: n => `${n} waiting to send`, syncFail: n => `⚠ ${n} not sent · retrying`,
      cats: { vehicle: "Vehicle", pedestrian: "Pedestrian", traffic_light: "Traffic light", stop_sign: "Stop sign",
              stop_line: "Stop line / crosswalk", road_shape: "Road shape", other: "Other" },
      commands: { left: "turn left", straight: "go straight", right: "turn right", unknown: "unknown" },
      stage2: "Stage 2", s2Head: "Reason areas marked by three methods (bright parts)",
      s2Title: "Stage 2: compare",
      s2Intro: n => `Stage 1 is done. You will now see ${n} of the scenes again. In each, three methods have marked the areas they take as the reasons for the decision (shown bright). Pick the one that best marks what a driver must see for this decision.`,
      s2Lock: "Once stage 2 starts, your stage 1 responses can no longer be changed.", s2Go: "Start stage 2",
      s2Q: "Which one best marks what a driver must see for this decision?",
      s2Hint: "Bright areas are what each method marked as the reasons. You can also click a row.",
      same: "About the same (hard to tell)", needChoice: "Pick one.",
      keys2: "<kbd>1</kbd>–<kbd>3</kbd> A–C · <kbd>4</kbd> same · <kbd>Enter</kbd> next",
      metaS2: k => `a short stage 2 of ${k} comparisons at the end`,
      loupeOff: "🔍 Magnifier", loupeOn: "🔍 Magnifier off",
      svTitle: "Almost done", svLead: "Four short questions so we can describe the annotators. No name or contact details are asked.",
      svSubmit: "Submit and finish", svNeed: "Please choose an option for every question.",
      sv: {
        driving_years: ["Driving experience", { none: "None", lt1: "< 1 year", y1to5: "1–5 years", gt5: "> 5 years" }],
        ad_years: ["Research / development experience in autonomous driving", { none: "None", lt1: "< 1 year", y1to3: "1–3 years", gt3: "> 3 years" }],
        cv_years: ["Research / development experience in computer vision or deep learning", { none: "None", lt1: "< 1 year", y1to3: "1–3 years", gt3: "> 3 years" }],
        xai: ["How familiar are you with explainable AI (XAI) methods?", { never: "Never heard of them", heard: "Heard of them", used: "Used them in research or work" }]
      }
    }
  };
  const TOUR_TARGETS = ["decisionBox", "camSec", "bevSec", "clickSec", "confSec", "nextBtn"];

  // ------------------------------------------------------------ state
  let lang = "ko";
  let S = null;    // {annotator_id, order_seed, order, idx, started_at, finished_at, resp: {uid: {...}}, lang, tour_done, stage_seen}
  let enterTime = null;
  let replayTimer = null;
  const byUid = {};
  M.scenes.forEach(s => { byUid[s.scene_uid] = s; });
  const N_PRACTICE = M.scenes.filter(s => s.kind === "practice").length;
  const N_STUDY = M.scenes.length - N_PRACTICE;
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
  const { fnv1a, snap: snapObjects, toImagePx: toPx, normBox, snapBox } = window.AnnotCore;
  const makeOrder = seed => window.AnnotCore.makeOrder(M.scenes, seed);

  // ------------------------------------------------------------ i18n
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach(el => {
      const v = T()[el.dataset.t];
      if (typeof v === "string") { if (v.includes("<")) el.innerHTML = v; else el.textContent = v; }
    });
    document.querySelectorAll(".langbtn").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
    const min = Math.max(5, Math.ceil((M.scenes.length * SEC_PER_SCENE + CMP.length * SEC_PER_CMP) / 60 / 5) * 5);
    const meta = T().meta(N_PRACTICE, N_STUDY, min);
    if (CMP.length) meta.splice(1, 0, T().metaS2(CMP.length));
    $("meta").innerHTML = meta.map(x => `<li>${x}</li>`).join("");
    $("helpSteps").innerHTML = "";
    $("helpSteps").appendChild($("steps").cloneNode(true)).removeAttribute("id");
    onIdInput();
    if (S && !$("task").classList.contains("hidden")) renderScene();
    if (S && !$("survey").classList.contains("hidden")) renderSurvey();
    $("loupeBtn").textContent = loupeOn ? T().loupeOn : T().loupeOff;
    $("loupeBtn").setAttribute("aria-pressed", String(loupeOn));
    if (tourIdx !== null) showTourStep();
    updateSync(); renderDoneSync();
  }

  // ------------------------------------------------------------ start screen
  const idInput = $("annotator");
  idInput.setAttribute("autocapitalize", "characters");
  function onIdInput() {
    const raw = idInput.value;
    const up = raw.toUpperCase();
    if (raw !== up) { const p = idInput.selectionStart; idInput.value = up; idInput.setSelectionRange(p, p); }
    const id = idInput.value.trim();
    const ok = ID_RE.test(id), bad = id.length > 0 && !ok;
    $("startBtn").disabled = !ok;
    idInput.classList.toggle("bad", bad);
    $("idHint").classList.toggle("bad", bad);
    $("idHint").textContent = bad ? T().idBad : T().idHint;
    const old = ok && load(id);
    $("resumeNote").classList.toggle("hidden", !old);
    if (old) {
      const [done, total] = progressOf({ cmp_idx: 0, idx: 0, phase: 1, ...old });
      $("resumeNote").textContent = T().resume(Math.min(done + 1, total), total);
    }
    $("startBtn").textContent = old ? T().startResume : T().start;
  }
  idInput.addEventListener("input", onIdInput);
  idInput.addEventListener("keydown", e => { if (e.key === "Enter" && !$("startBtn").disabled) $("startBtn").click(); });
  document.querySelectorAll(".langbtn").forEach(b => b.addEventListener("click", () => { lang = b.dataset.lang; applyLang(); }));
  const checkScreen = () => $("smallScreen").classList.toggle("hidden", window.innerWidth >= 1000);
  checkScreen(); window.addEventListener("resize", checkScreen);

  $("startBtn").addEventListener("click", () => {
    const id = idInput.value.trim();
    if (!ID_RE.test(id)) return;
    S = load(id);
    if (!S || S.app_version !== APP_VERSION) {
      const seed = fnv1a(`${M.order_salt}|${id}`);
      S = { app_version: APP_VERSION, annotator_id: id, order_seed: seed, order: makeOrder(seed), idx: 0,
            started_at: new Date().toISOString(), finished_at: null, resp: {}, lang };
    }
    S.lang = lang;
    S.phase = S.phase || 1;
    save();
    flush();                                    // anything left from an earlier visit
    $("start").classList.add("hidden");
    if (isDone()) { showDone(); return; }
    if (S.at_survey) { goSurvey(); return; }
    if (S.phase === 2) S.cmp_idx = Math.min(S.cmp_idx, CMP.length - 1);
    else S.idx = Math.min(S.idx, S.order.length - 1);
    $("task").classList.remove("hidden");
    renderScene();
    if (S.phase === 1 && !S.tour_done) setTimeout(() => startTour(), 300);
  });

  // ------------------------------------------------------------ scene
  function cur() { return byUid[S.order[S.idx]]; }
  function resp() {
    const uid = S.order[S.idx];
    if (!S.resp[uid]) S.resp[uid] = { scene_uid: uid, clicks: [], no_specific_target: false, confidence: null, time_spent_sec: 0 };
    return S.resp[uid];
  }
  function leaveScene() {
    if (enterTime !== null && S) {
      const r = S.phase === 2 ? cmpResp() : resp();
      r.time_spent_sec = +(r.time_spent_sec + (performance.now() - enterTime) / 1000).toFixed(1);
    }
    enterTime = null;
    stopReplay();
    hidePop();
  }

  function renderScene() {
    if (S.phase === 2) { renderCompare(); return; }
    $("task").classList.remove("phase2");
    const sc = cur();
    const n = S.order.length, practice = sc.kind === "practice";
    const [done, total] = progressOf(S);
    $("progressFill").style.width = `${100 * done / total}%`;
    $("stageTag").textContent = practice ? T().stagePractice : T().stageMain;
    $("stageTag").className = practice ? "tag practice" : "tag";
    $("progressText").textContent = practice ? `${S.idx + 1} / ${N_PRACTICE}` : `${S.idx + 1 - N_PRACTICE} / ${N_STUDY}`;
    $("decision").textContent = lang === "ko" ? sc.decision_ko : sc.decision_en;
    $("ego").textContent = T().ego(sc.ego_speed_kmh.toFixed(0), T().commands[sc.driving_command] || sc.driving_command);
    const ci = $("camImg"), bi = $("bevImg");
    if (ci.dataset.uid !== sc.scene_uid) {
      ci.dataset.uid = sc.scene_uid; ci.src = sc.camera; bi.src = sc.bev;
      ci.onload = drawOverlays; bi.onload = drawOverlays;
      sc.past.forEach(p => { const im = new Image(); im.src = p; });   // preload
    }
    $("replayBtn").disabled = sc.past.length === 0;
    $("prevBtn").disabled = S.idx === 0;
    $("nextBtn").textContent = S.idx === n - 1 && !CMP.length ? T().finish : T().next;
    renderRespState();
    if (enterTime === null) enterTime = performance.now();
  }

  // ------------------------------------------------------------ stage 2: compare the three methods (SPEC 2.3, 5.3)
  // Starts only after the last stage-1 scene; from then on stage 1 is locked. Scene order and the A/B/C order of the
  // options are shuffled per annotator (seeded), and the shown order is stored with each response.
  const CMP = M.compare || [];
  const cmpByUid = {};
  CMP.forEach(c => { cmpByUid[c.scene_uid] = c; });
  const LETTERS = ["A", "B", "C"];
  function cmpUid() { return S.cmp_order[S.cmp_idx]; }
  function cmpResp() {
    const uid = cmpUid();
    if (!S.cmp_resp[uid]) {
      const ids = cmpByUid[uid].options.map(o => o.option_id);
      const display = window.AnnotCore.shuffle(ids, window.AnnotCore.mulberry32(fnv1a(`${S.order_seed}|${uid}`)));
      S.cmp_resp[uid] = { scene_uid: uid, display, choice: null, time_spent_sec: 0 };
    }
    return S.cmp_resp[uid];
  }
  function startStage2() {
    S.phase = 2;
    S.stage2_started_at = new Date().toISOString();
    S.cmp_order = window.AnnotCore.shuffle(CMP.map(c => c.scene_uid), window.AnnotCore.mulberry32((S.order_seed ^ 0x5bd1e995) >>> 0));
    S.cmp_idx = 0; S.cmp_resp = {};
    save(); renderScene(); window.scrollTo(0, 0);
  }
  function isDone() {
    return !!S.finished_at && (S.phase === 2 ? S.cmp_idx >= CMP.length : S.idx >= S.order.length);
  }
  function progressOf(st) {        // [done, total] over both stages
    const total = st.order.length + CMP.length;
    return [st.phase === 2 ? st.order.length + st.cmp_idx : st.idx, total];
  }
  function renderCompare() {
    const uid = cmpUid(), c = cmpByUid[uid], sc = byUid[uid], r = cmpResp();
    $("task").classList.add("phase2");
    const [done, total] = progressOf(S);
    $("progressFill").style.width = `${100 * done / total}%`;
    $("stageTag").textContent = T().stage2;
    $("stageTag").className = "tag stage2";
    $("progressText").textContent = `${S.cmp_idx + 1} / ${CMP.length}`;
    $("decision").textContent = lang === "ko" ? sc.decision_ko : sc.decision_en;
    $("ego").textContent = T().ego(sc.ego_speed_kmh.toFixed(0), T().commands[sc.driving_command] || sc.driving_command);
    const box = $("cmpOpts");
    if (box.dataset.uid !== uid) {
      box.dataset.uid = uid; box.innerHTML = "";
      r.display.forEach((oid, i) => {
        const o = c.options.find(q => q.option_id === oid);
        const row = document.createElement("div");
        row.className = "cmprow"; row.dataset.oid = oid; row.setAttribute("role", "radio");
        row.innerHTML = `<span class="letter">${LETTERS[i]}</span><img alt="" src="${o.camera}"><img alt="" src="${o.bev}">`;
        row.addEventListener("click", () => choose(oid));
        box.appendChild(row);
      });
    }
    const ch = $("choices");
    ch.innerHTML = "";
    r.display.forEach((oid, i) => {
      const b = document.createElement("button");
      b.textContent = LETTERS[i]; b.dataset.oid = oid;
      b.addEventListener("click", () => choose(oid));
      ch.appendChild(b);
    });
    const same = document.createElement("button");
    same.className = "same"; same.textContent = T().same; same.dataset.oid = "same";
    same.addEventListener("click", () => choose("same"));
    ch.appendChild(same);
    markChoice();
    $("prevBtn").disabled = S.cmp_idx === 0;
    $("nextBtn").textContent = S.cmp_idx === CMP.length - 1 ? T().finish : T().next;
    if (enterTime === null) enterTime = performance.now();
  }
  function choose(oid) { cmpResp().choice = oid; save(); markChoice(); }
  function markChoice() {
    const v = cmpResp().choice;
    document.querySelectorAll("#cmpOpts .cmprow").forEach(el => {
      el.classList.toggle("on", el.dataset.oid === v); el.setAttribute("aria-checked", String(el.dataset.oid === v));
    });
    document.querySelectorAll("#choices button").forEach(el => el.classList.toggle("on", el.dataset.oid === v));
    updateNext();
  }
  function sendCompare(i) {
    const uid = S.cmp_order[i];
    if (S.cmp_resp[uid]) enqueue(Object.assign(envelope("compare"), { order: i, response: S.cmp_resp[uid] }));
  }

  // everything that depends on the current response
  function renderRespState() {
    const r = resp();
    $("noneBox").checked = r.no_specific_target;
    document.querySelectorAll('input[name="conf"]').forEach(x => { x.checked = x.value === r.confidence; });
    renderClicks();
    drawOverlays();
  }

  function renderClicks() {
    const r = resp(), ol = $("clickList");
    ol.innerHTML = "";
    r.clicks.forEach((c, i) => {
      const li = document.createElement("li");
      const rk = document.createElement("span");
      rk.className = "rk"; rk.style.background = RANK_COLORS[i]; rk.textContent = String(i + 1);
      const what = document.createElement("span");
      what.className = "what";
      what.textContent = `${c.view === "camera" ? T().viewCam : T().viewBev} · ${c.object_token || !c.box ? T().markObj : T().markBox}`;
      const del = document.createElement("button");
      del.className = "del"; del.textContent = "×"; del.title = T().del; del.setAttribute("aria-label", T().del);
      del.addEventListener("click", () => removeClick(i));
      const sel = document.createElement("select");
      sel.innerHTML = `<option value="">${T().catPlaceholder}</option>` + CATS.map(k => `<option value="${k}">${T().cats[k]}</option>`).join("");
      sel.value = c.category || "";
      sel.classList.toggle("need", !c.category);
      sel.addEventListener("change", () => { c.category = sel.value || null; save(); renderClicks(); });
      li.append(rk, what, del, document.createElement("span"), sel);
      ol.appendChild(li);
    });
    $("clickCount").textContent = `${r.clicks.length} / ${MAX_CLICKS}`;
    $("clickEmpty").classList.toggle("hidden", r.clicks.length > 0 || r.no_specific_target);
    const full = r.clicks.length >= MAX_CLICKS;
    $("camWrap").classList.toggle("full", full); $("bevWrap").classList.toggle("full", full);
    updateNext();
  }

  function validity() {
    if (S.phase === 2) return cmpResp().choice ? "" : T().needChoice;
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
  function flash(el) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }

  // ------------------------------------------------------------ geometry (core.js)
  function snap(sc, view, x, y) { return snapObjects(sc.objects, view, x, y); }
  function toImagePx(ev, img) { return toPx(ev.clientX, ev.clientY, img.getBoundingClientRect(), img.naturalWidth, img.naturalHeight); }

  // ------------------------------------------------------------ clicks and drawn boxes
  // A click on a GT agent (vehicle / pedestrian) selects it. Anything else is marked by dragging a box. A box that outlines
  // an agent (IoU >= BOX_SNAP_IOU) is snapped to that agent. Every mark keeps x, y (click point or box centre, original
  // image pixels) for the analysis; drawn boxes also keep `box` = [x0, y0, x1, y1].
  const DRAG_START_PX = 5, MIN_BOX_PX = 4, BOX_SNAP_IOU = 0.3;
  let drag = null;   // {view, img, sx, sy (client), p0 (image px), box (image px) | null}
  const imgOf = view => view === "camera" ? $("camImg") : $("bevImg");
  function blocked(ev) {
    if (replayTimer || tourIdx !== null) return true;
    if (resp().clicks.length >= MAX_CLICKS) {
      $("nextHint").textContent = T().clickFull; flash($("clickSec")); toast(T().clickFull, ev); return true;
    }
    return false;
  }
  function onDown(view, ev) {
    if (ev.button !== 0) return;
    const img = imgOf(view);
    if (!img.naturalWidth || blocked(ev)) return;
    ev.preventDefault();
    hidePop();
    ev.target.setPointerCapture(ev.pointerId);
    drag = { view, img, sx: ev.clientX, sy: ev.clientY, p0: toImagePx(ev, img), box: null };
  }
  function onMove(ev) {
    if (!drag) return;
    if (!drag.box && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < DRAG_START_PX) return;
    const p = toImagePx(ev, drag.img);
    drag.box = normBox(drag.p0.x, drag.p0.y, p.x, p.y, drag.img.naturalWidth, drag.img.naturalHeight);
    drawOverlays();
  }
  function onUp(ev) {
    if (!drag) return;
    const d = drag; drag = null;
    // decide click vs drag from the release point too (some input devices send no move events in between)
    if (!d.box && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) >= DRAG_START_PX) {
      const p = toImagePx(ev, d.img);
      d.box = normBox(d.p0.x, d.p0.y, p.x, p.y, d.img.naturalWidth, d.img.naturalHeight);
    }
    const r = resp(), sc = cur();
    let c;
    if (d.box) {
      const s = d.img.clientWidth / d.img.naturalWidth;          // image px -> screen px
      if ((d.box[2] - d.box[0]) * s < MIN_BOX_PX || (d.box[3] - d.box[1]) * s < MIN_BOX_PX) {
        drawOverlays(); toast(T().tooSmall, ev); return;
      }
      const o = snapBox(sc.objects, d.view, d.box, BOX_SNAP_IOU);
      const box = d.box.map(v => +v.toFixed(1));
      c = { rank: r.clicks.length + 1, view: d.view, x: +((box[0] + box[2]) / 2).toFixed(1), y: +((box[1] + box[3]) / 2).toFixed(1),
            box, object_token: o ? o.object_token : null, category: o ? guessCat(o) : null };
    } else {
      const o = snap(sc, d.view, d.p0.x, d.p0.y);
      if (!o) { toast(T().dragHint, ev); return; }
      c = { rank: r.clicks.length + 1, view: d.view, x: +d.p0.x.toFixed(1), y: +d.p0.y.toFixed(1),
            object_token: o.object_token, category: guessCat(o) };
    }
    r.clicks.push(c);
    r.no_specific_target = false;
    save(); renderRespState();
    showCatPop(c, ev.clientX, ev.clientY);
  }
  function guessCat(o) { return o.kind === "pedestrian" ? "pedestrian" : "vehicle"; }
  [["camCanvas", "camera"], ["bevCanvas", "bev"]].forEach(([id, view]) => {
    const cv = $(id);
    cv.addEventListener("pointerdown", ev => onDown(view, ev));
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", () => { drag = null; drawOverlays(); });
  });
  let toastTimer = null;
  function toast(text, ev) {
    const t = $("toast");
    t.textContent = text; t.classList.remove("hidden");
    const w = t.offsetWidth, h = t.offsetHeight;
    t.style.left = `${Math.max(8, Math.min(ev.clientX - w / 2, window.innerWidth - w - 8))}px`;
    t.style.top = `${Math.max(8, ev.clientY - h - 16)}px`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2200);
  }

  function removeClick(i) {
    const r = resp();
    r.clicks.splice(i, 1);
    r.clicks.forEach((c, k) => { c.rank = k + 1; });
    hidePop(); save(); renderRespState();
  }

  let popClick = null;
  function showCatPop(c, cx, cy) {
    const pop = $("catPop");
    popClick = c;
    pop.innerHTML = `<div class="pophead">${T().popHead}</div>`;
    CATS.forEach((k, i) => {
      const b = document.createElement("button");
      b.textContent = `${i + 1}  ${T().cats[k]}`;
      b.classList.toggle("on", c.category === k);
      b.addEventListener("click", e => { e.stopPropagation(); pickCat(k); });
      pop.appendChild(b);
    });
    pop.classList.remove("hidden");
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = `${Math.max(8, Math.min(cx + 12, window.innerWidth - w - 8))}px`;
    pop.style.top = `${Math.max(8, Math.min(cy + 12, window.innerHeight - h - 8))}px`;
  }
  function pickCat(k) {
    if (!popClick) return;
    popClick.category = k; hidePop(); save(); renderClicks();
  }
  function hidePop() { $("catPop").classList.add("hidden"); popClick = null; }
  document.addEventListener("click", e => {
    const pop = $("catPop");
    if (!pop.classList.contains("hidden") && !pop.contains(e.target) && e.target.tagName !== "CANVAS") hidePop();
  });

  $("noneBox").addEventListener("change", () => {
    const r = resp();
    r.no_specific_target = $("noneBox").checked;
    if (r.no_specific_target) r.clicks = [];
    hidePop(); save(); renderRespState();
  });
  document.querySelectorAll('input[name="conf"]').forEach(x => x.addEventListener("change", () => { resp().confidence = x.value; save(); updateNext(); }));

  // ------------------------------------------------------------ keyboard
  document.addEventListener("keydown", e => {
    if (!S || $("task").classList.contains("hidden")) return;
    if (!$("tour").classList.contains("hidden")) {
      if (e.key === "Escape") endTour();
      else if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); $("tourNext").click(); }
      return;
    }
    if (!$("stageModal").classList.contains("hidden")) { if (e.key === "Enter") { e.preventDefault(); $("stageGo").click(); } return; }
    if (!$("stage2Modal").classList.contains("hidden")) {
      if (e.key === "Enter") { e.preventDefault(); $("stage2Go").click(); }
      else if (e.key === "Escape") { $("stage2Modal").classList.add("hidden"); enterTime = performance.now(); }
      return;
    }
    if (!$("helpModal").classList.contains("hidden")) { if (e.key === "Escape") $("helpModal").classList.add("hidden"); return; }
    if (S.phase === 2) {
      if (/^[1-4]$/.test(e.key)) { e.preventDefault(); const r = cmpResp(); choose(e.key === "4" ? "same" : r.display[+e.key - 1]); return; }
      if (e.key === "Enter" && (e.target.tagName || "").toLowerCase() !== "button") {
        e.preventDefault();
        if ($("nextBtn").disabled) flash($("nextHint")); else $("nextBtn").click();
      }
      return;
    }
    const pop = !$("catPop").classList.contains("hidden");
    if (pop && /^[1-7]$/.test(e.key)) { e.preventDefault(); pickCat(CATS[+e.key - 1]); return; }
    if (e.key === "Escape") { hidePop(); return; }
    if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey && !e.altKey) { setLoupe(!loupeOn); return; }   // any keyboard layout
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault(); const r = resp(); if (r.clicks.length) removeClick(r.clicks.length - 1); return;
    }
    const tag = (e.target.tagName || "").toLowerCase();
    if (e.key === "Enter" && tag !== "select" && tag !== "button" && !pop) {
      e.preventDefault();
      if ($("nextBtn").disabled) flash($("nextHint")); else $("nextBtn").click();
    }
  });

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
    // sizes in image pixels, so marks look the same on screen whatever the displayed size
    const scaleC = (ci.naturalWidth || 2048) / Math.max(1, ci.clientWidth), scaleB = (bi.naturalWidth || 512) / Math.max(1, bi.clientWidth);
    const G = { camera: [gc, scaleC], bev: [gb, scaleB] };
    function badge(g, s, x, y, n, col) {           // numbered circle at a box corner
      const rad = 9 * s;
      g.fillStyle = col; g.strokeStyle = "#fff"; g.lineWidth = 2 * s;
      g.beginPath(); g.arc(x, y, rad, 0, 2 * Math.PI); g.fill(); g.stroke();
      g.fillStyle = "#fff"; g.font = `bold ${12 * s}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(String(n), x, y + 0.5 * s);
    }
    function rectMark(g, s, b, col, dashed) {
      g.save();
      if (dashed) { g.setLineDash([6 * s, 4 * s]); g.fillStyle = col + "26"; g.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
      g.strokeStyle = col; g.lineWidth = 2.5 * s; g.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
      g.restore();
    }
    r.clicks.forEach((c, i) => {
      const col = RANK_COLORS[i];
      const o = c.object_token ? sc.objects.find(q => q.object_token === c.object_token) : null;
      if (o) {                                       // the agent, in both views
        o.camera_rects.forEach(rc => rectMark(gc, scaleC, rc, col, false));
        gb.strokeStyle = col; gb.lineWidth = 2.5 * scaleB; gb.beginPath();
        o.bev_polygon.forEach(([x, y], k) => k ? gb.lineTo(x, y) : gb.moveTo(x, y)); gb.closePath(); gb.stroke();
      }
      const [g, s] = G[c.view];
      if (o) {
        const b = c.view === "camera" ? (o.camera_rects[0] || [c.x, c.y]) : AnnotCore.polyBBox(o.bev_polygon);
        badge(g, s, b[0], b[1], i + 1, col);
      } else if (c.box) {
        rectMark(g, s, c.box, col, true); badge(g, s, c.box[0], c.box[1], i + 1, col);
      } else {                                       // a point (results from older versions)
        g.fillStyle = col; g.beginPath(); g.arc(c.x, c.y, 6 * s, 0, 2 * Math.PI); g.fill();
        badge(g, s, c.x + 12 * s, c.y - 12 * s, i + 1, col);
      }
    });
    if (drag && drag.box) {                          // box being drawn
      const [g, s] = G[drag.view];
      rectMark(g, s, drag.box, RANK_COLORS[Math.min(r.clicks.length, MAX_CLICKS - 1)], true);
    }
  }
  window.addEventListener("resize", () => { if (S && !$("task").classList.contains("hidden")) drawOverlays(); });

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
    $("camWrap").classList.add("replaying"); $("replayBtn").disabled = true; hidePop();
    prepCanvas($("camCanvas"), $("camImg")); prepCanvas($("bevCanvas"), $("bevImg"));
    const step = () => {
      if (k >= frames.length) { stopReplay(); drawOverlays(); return; }
      $("camImg").src = frames[k]; $("replayLabel").textContent = T().replaying(times[k].toFixed(1)); k++;
    };
    step();
    replayTimer = setInterval(step, 600);
  });

  // ------------------------------------------------------------ magnifier (camera, stage 1)
  // A zoomed copy of the camera image and of the marks canvas next to the cursor, so small far objects (lights, signs)
  // are easy to click or box. Clicks still land on the camera underneath; the crosshair is the cursor position.
  const LOUPE_ZOOM = 3, LOUPE_W = 300, LOUPE_H = 180;
  let loupeOn = false;
  try { loupeOn = localStorage.getItem("annot_loupe") === "1"; } catch (e) { /* ignore */ }
  function setLoupe(on) {
    loupeOn = on;
    try { localStorage.setItem("annot_loupe", on ? "1" : "0"); } catch (e) { /* ignore */ }
    $("loupeBtn").setAttribute("aria-pressed", String(on));
    $("loupeBtn").textContent = on ? T().loupeOn : T().loupeOff;
    if (!on) $("loupe").classList.add("hidden");
  }
  function drawLoupe(ev) {
    const img = $("camImg"), lp = $("loupe");
    if (!loupeOn || replayTimer || tourIdx !== null || !img.naturalWidth) { lp.classList.add("hidden"); return; }
    const dpr = window.devicePixelRatio || 1;
    if (lp.width !== Math.round(LOUPE_W * dpr)) { lp.width = Math.round(LOUPE_W * dpr); lp.height = Math.round(LOUPE_H * dpr); }
    const p = toImagePx(ev, img);
    const disp = img.clientWidth / img.naturalWidth;                       // screen px per image px
    const sw = LOUPE_W / (disp * LOUPE_ZOOM), sh = LOUPE_H / (disp * LOUPE_ZOOM);
    const g = lp.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#111"; g.fillRect(0, 0, LOUPE_W, LOUPE_H);
    g.imageSmoothingQuality = "high";
    g.drawImage(img, p.x - sw / 2, p.y - sh / 2, sw, sh, 0, 0, LOUPE_W, LOUPE_H);
    g.drawImage($("camCanvas"), p.x - sw / 2, p.y - sh / 2, sw, sh, 0, 0, LOUPE_W, LOUPE_H);
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1;
    g.beginPath();
    g.moveTo(LOUPE_W / 2 - 12, LOUPE_H / 2); g.lineTo(LOUPE_W / 2 - 4, LOUPE_H / 2);
    g.moveTo(LOUPE_W / 2 + 4, LOUPE_H / 2); g.lineTo(LOUPE_W / 2 + 12, LOUPE_H / 2);
    g.moveTo(LOUPE_W / 2, LOUPE_H / 2 - 12); g.lineTo(LOUPE_W / 2, LOUPE_H / 2 - 4);
    g.moveTo(LOUPE_W / 2, LOUPE_H / 2 + 4); g.lineTo(LOUPE_W / 2, LOUPE_H / 2 + 12);
    g.stroke();
    let x = ev.clientX + 24, y = ev.clientY - LOUPE_H - 24;
    if (y < 8) y = ev.clientY + 24;
    if (x + LOUPE_W > window.innerWidth - 8) x = ev.clientX - LOUPE_W - 24;
    lp.style.left = `${x}px`; lp.style.top = `${y}px`;
    lp.classList.remove("hidden");
  }
  $("camCanvas").addEventListener("pointermove", drawLoupe);         // after the drag handler: shows the box being drawn
  $("camCanvas").addEventListener("pointerdown", drawLoupe);
  $("camCanvas").addEventListener("pointerleave", () => $("loupe").classList.add("hidden"));
  $("loupeBtn").addEventListener("click", () => setLoupe(!loupeOn));

  // ------------------------------------------------------------ navigation
  function finish() {
    S.finished_at = S.finished_at || new Date().toISOString();
    if (S.phase === 2) S.cmp_idx = CMP.length; else S.idx = S.order.length;
    S.at_survey = false;
    save(); sendFinal(); showDone();
  }

  // ------------------------------------------------------------ background survey (after the last item, before finishing)
  const SURVEY = ["driving_years", "ad_years", "cv_years", "xai"];
  function goSurvey() {
    S.at_survey = true; S.survey = S.survey || {}; save();
    $("task").classList.add("hidden"); $("survey").classList.remove("hidden");
    renderSurvey(); window.scrollTo(0, 0);
  }
  function renderSurvey() {
    const f = $("svForm");
    f.innerHTML = "";
    SURVEY.forEach(q => {
      const [title, opts] = T().sv[q];
      const box = document.createElement("div");
      box.className = "svq";
      box.innerHTML = `<h3></h3><div class="seg" role="radiogroup" style="--n:${Object.keys(opts).length}"></div>`;
      box.querySelector("h3").textContent = title;
      Object.entries(opts).forEach(([v, label]) => {
        const l = document.createElement("label");
        l.innerHTML = `<input type="radio" name="sv_${q}" value="${v}"><span></span>`;
        l.querySelector("span").textContent = label;
        const inp = l.querySelector("input");
        inp.checked = S.survey[q] === v;
        inp.addEventListener("change", () => { S.survey[q] = v; save(); box.classList.remove("need"); updateSurvey(); });
        box.querySelector(".seg").appendChild(l);
      });
      f.appendChild(box);
    });
    updateSurvey();
  }
  function updateSurvey() {
    const ok = SURVEY.every(q => S.survey[q]);
    $("svSubmit").disabled = !ok;
    $("svHint").textContent = ok ? "" : T().svNeed;
  }
  $("svSubmit").addEventListener("click", () => {
    if (!SURVEY.every(q => S.survey[q])) return;
    $("survey").classList.add("hidden");
    finish();
  });
  $("svBack").addEventListener("click", () => {
    S.at_survey = false; save();
    $("survey").classList.add("hidden"); $("task").classList.remove("hidden"); renderScene();
  });
  $("nextBtn").addEventListener("click", () => {
    if (validity()) return;
    leaveScene();
    if (S.phase === 2) {
      sendCompare(S.cmp_idx);
      if (S.cmp_idx === CMP.length - 1) { goSurvey(); return; }
      S.cmp_idx++; save(); renderScene(); window.scrollTo(0, 0); return;
    }
    sendScene(S.idx);
    if (S.idx === S.order.length - 1) {
      if (!CMP.length) { goSurvey(); return; }
      save();
      $("s2IntroText").textContent = T().s2Intro(CMP.length);
      $("stage2Modal").classList.remove("hidden"); $("stage2Go").focus();
      return;
    }
    const wasPractice = cur().kind === "practice";
    S.idx++; save(); renderScene(); window.scrollTo(0, 0);
    if (wasPractice && cur().kind !== "practice" && !S.stage_seen) {
      $("practiceDoneText").textContent = T().practiceDoneText(N_STUDY);
      $("stageModal").classList.remove("hidden"); $("stageGo").focus();
    }
  });
  $("stageGo").addEventListener("click", () => { S.stage_seen = true; save(); $("stageModal").classList.add("hidden"); });
  $("stage2Go").addEventListener("click", () => { $("stage2Modal").classList.add("hidden"); startStage2(); });
  $("stage2Modal").addEventListener("click", e => {       // closing without starting: stay on the last stage-1 scene
    if (e.target === $("stage2Modal")) { $("stage2Modal").classList.add("hidden"); enterTime = performance.now(); }
  });
  $("prevBtn").addEventListener("click", () => {
    if (S.phase === 2) {                                   // stage 1 stays locked: no way back past the first comparison
      if (S.cmp_idx === 0) return;
      leaveScene(); S.cmp_idx--; save(); renderScene(); window.scrollTo(0, 0); return;
    }
    if (S.idx === 0) return;
    leaveScene();
    S.idx--; save(); renderScene(); window.scrollTo(0, 0);
  });
  $("helpBtn").addEventListener("click", () => {
    $("tourBtn").classList.toggle("hidden", S.phase === 2);
    $("helpModal").classList.remove("hidden");
  });
  $("helpClose").addEventListener("click", () => $("helpModal").classList.add("hidden"));
  $("helpModal").addEventListener("click", e => { if (e.target === $("helpModal")) $("helpModal").classList.add("hidden"); });
  $("tourBtn").addEventListener("click", () => { $("helpModal").classList.add("hidden"); startTour(); });

  // ------------------------------------------------------------ guided tour (first scene, or from Help)
  let tourIdx = null;
  function startTour() { hidePop(); tourIdx = 0; $("tour").classList.remove("hidden"); showTourStep(); }
  function endTour() {
    tourIdx = null; $("tour").classList.add("hidden");
    if (S && !S.tour_done) { S.tour_done = true; save(); }
  }
  function showTourStep() {
    const el = $(TOUR_TARGETS[tourIdx]);
    el.scrollIntoView({ block: "nearest" });
    const last = tourIdx === TOUR_TARGETS.length - 1;
    $("tourStep").textContent = `${tourIdx + 1} / ${TOUR_TARGETS.length}`;
    $("tourText").innerHTML = T().tour[tourIdx];
    $("tourNext").textContent = last ? T().tourDone : T().tourNext;
    $("tourSkip").classList.toggle("hidden", last);
    requestAnimationFrame(placeTour);
  }
  function placeTour() {
    if (tourIdx === null) return;
    const r = $(TOUR_TARGETS[tourIdx]).getBoundingClientRect(), pad = 6;
    const hole = $("tourHole"), tip = $("tourTip");
    Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
    const W = window.innerWidth, H = window.innerHeight, tw = tip.offsetWidth, th = tip.offsetHeight, gap = 14;
    let x, y;
    if (r.left > W * 0.55 && r.left - gap - tw > 8) { x = r.left - gap - tw - pad; y = r.top; }          // left of side panel items
    else if (r.bottom + gap + th < H) { x = r.left; y = r.bottom + gap + pad; }                          // below
    else if (r.top - gap - th > 8) { x = r.left; y = r.top - gap - th - pad; }                           // above
    else { x = r.right - tw - 16; y = r.top + 16; }                                                       // inside, large targets
    tip.style.left = `${Math.max(8, Math.min(x, W - tw - 8))}px`;
    tip.style.top = `${Math.max(8, Math.min(y, H - th - 8))}px`;
  }
  $("tourNext").addEventListener("click", () => {
    if (tourIdx === TOUR_TARGETS.length - 1) { endTour(); return; }
    tourIdx++; showTourStep();
  });
  $("tourSkip").addEventListener("click", endTour);
  window.addEventListener("resize", placeTour);
  window.addEventListener("scroll", placeTour, { passive: true });

  // ------------------------------------------------------------ done
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
    if (S.phase === 2) S.cmp_idx = CMP.length - 1; else S.idx = S.order.length - 1;
    S.at_survey = false;
    save();
    $("done").classList.add("hidden"); $("task").classList.remove("hidden"); renderScene();
  });
  function resultObject() {
    return {
      annotator_id: S.annotator_id, app_version: APP_VERSION, manifest_id: M.manifest_id, order_seed: S.order_seed,
      language: S.lang, started_at: S.started_at, finished_at: S.finished_at,
      responses: S.order.map((uid, i) => Object.assign({ order: i }, S.resp[uid] || { scene_uid: uid, clicks: [],
        no_specific_target: false, confidence: null, time_spent_sec: 0 })),
      stage2_started_at: S.stage2_started_at || null,
      survey: S.survey && SURVEY.every(q => S.survey[q]) ? S.survey : null,
      comparisons: (S.cmp_order || []).map((uid, i) => Object.assign({ order: i }, S.cmp_resp[uid] ||
        { scene_uid: uid, display: null, choice: null, time_spent_sec: 0 }))
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
  if (params.get("id")) idInput.value = params.get("id");
  applyLang();
  if (!idInput.value) idInput.focus();
})();
