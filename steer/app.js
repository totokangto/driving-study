/* Neuron set comparison study (SPEC_STEER.md). Static page: data/manifest.js, images/, config.js.
   Online collection (config.js submit_url, the same Apps Script collector as app/, deploy/DEPLOY.md): one "scene" message
   per finished item and one "final" message with the whole result; messages wait in a localStorage outbox until the server
   replies {ok: true}. With an empty submit_url the result is only offered as a file download.
   Screens, Korean/English text, help, guided tour and the practice-done window follow the earlier tool (app/, 2026-11-23). */
"use strict";
(function () {
  const M = window.MANIFEST, C = window.AnnotCore, CFG = window.STUDY_CONFIG || {}, $ = id => document.getElementById(id);
  const APP_VERSION = "steer-2";
  const PB = M.playback;                                   // {speedup, dt, hold_s}
  const ORIG_C = "#f08a4b", STEER_C = "#3b6fd4";
  const CAR = [[4.05, 1.15], [4.05, -1.15], [-1.13, -1.15], [-1.13, 1.15]];   // ego box (forward, left) m, Fig. 6 map
  const ID_RE = /^[A-Za-z0-9_-]{2,32}$/;
  const TIE_ALL = "all_match", TIE_NONE = "none_match";   // Q3 values besides a panel id
  const MINUTES = 15;                                      // shown on the start page (decided 2026-11-23)
  const byUid = Object.fromEntries(M.items.map(it => [it.uid, it]));
  const N_PRACTICE = M.items.filter(it => it.kind === "practice").length, N_STUDY = M.items.length - N_PRACTICE;

  // ------------------------------------------------------------ text (Korean / English; the paper shows the English UI)
  const josa = w => ((w.charCodeAt(w.length - 1) - 0xac00) % 28 ? "을" : "를");   // final consonant -> 을, else 를
  const TEXT = {
    ko: {
      title: "자율주행 모델의 뉴런 묶음 평가",
      lead: "자율주행 모델은 사람의 뇌처럼 수많은 <b>인공 뉴런</b>이 신호를 주고받으며 운전을 결정합니다. 세 연구팀이 각자 \"이 <b>뉴런 묶음</b>이 ○○ 행동을 담당한다\"고 주장합니다. 그 뉴런 묶음을 <b>강하게 켰을 때</b> 차의 계획 경로가 어떻게 바뀌는지 보여 드립니다. 어느 팀의 뉴런 묶음이 <b>정말 그 설명대로</b> 차를 움직이는지 판단해 주세요.",
      smallScreen: "📱 휴대폰으로 참여한다면 화면을 <b>가로</b>로 돌려 주세요. 지도 세 개를 비교해야 하므로 PC나 노트북을 권장합니다.",
      rotate: "📱 휴대폰을 가로로 돌리면 지도를 더 크게 볼 수 있습니다.",
      ex1a: "이 뉴런 묶음은", ex1b: "감속", ex1c: "을 담당한다고 합니다.",
      s1t: "설명 읽기", s1d: "화면 위 파란 칸에 이 뉴런 묶음이 담당한다는 행동이 나옵니다.",
      illOrig: "원래 경로", illSteer: "켠 뒤 경로",
      s2t: "세 결과 보기", s2d: "세 팀의 뉴런 묶음을 각각 켰을 때의 경로가 지도 세 개에 나옵니다. 두 차가 경로를 따라 움직입니다.",
      ex3q: "정말 느려졌나요?", ex3r1: "결과 1", ex3r2: "결과 2", ex3r3: "결과 3",
      s3t: "판단하기 → 다음", s3d: "결과마다 설명대로 움직였는지 예/아니오로 고르고, 셋 중 설명에 가장 맞는 결과를 고른 뒤 '다음'을 누르세요.",
      lgOrig: "주황 선: 원래 계획 경로", lgSteer: "파란 선: 뉴런 묶음을 강하게 켠 뒤의 계획 경로",
      lgDots: "선 위의 점: 0.5초마다 차가 있을 위치 (점 간격이 넓을수록 빠름)",
      lgPlay: "두 차가 두 경로를 따라 <b>2배속</b>으로 움직입니다 (실제 4초를 2초에 재생).",
      lgOrigS: "원래 경로", lgSteerS: "뉴런 묶음을 켠 뒤",
      keynote: "정답이 정해진 문항이 아닙니다. 파란 경로가 설명한 행동대로 바뀌었는지, 보이는 대로 판단해 주세요. 뉴런 묶음을 강하게 켜면 경로가 도로를 벗어나거나 다른 차와 부딪히기도 하는데, <b>안전성은 무시</b>하고 행동만 봐 주세요.",
      meta: (p, n, min) => [`연습 ${p}문항 + 본 문항 ${n}개`, `약 ${min}분`, "마지막에 짧은 설문", "진행 상황 자동 저장", "언제든 '도움말'로 다시 보기"],
      idLabel: "평가자 ID", idHint: "영문과 숫자 2자 이상 (예: P01).",
      idResumeNote: "같은 PC·같은 브라우저에서 같은 ID로 다시 들어오면 이어서 할 수 있습니다. 처음 참여하는데 이어서 한다는 안내가 나오면 이미 다른 사람이 쓰는 ID이니 다른 ID를 입력해 주세요.",
      idBad: "한글·공백·특수문자는 쓸 수 없습니다. 영문과 숫자 2자 이상으로 입력해 주세요 (예: P01).",
      idTaken: "이 ID로 이미 제출된 응답이 있습니다. 처음 참여한다면 다른 ID를 입력해 주세요. 전에 다른 기기에서 진행했다면 그 기기에서 이어서 해 주세요.",
      idChecking: "ID 확인 중…",
      start: "시작하기", startResume: "이어서 하기",
      resume: (i, n) => `이 ID로 저장된 진행 상황이 있습니다 (${i} / ${n}). 본인이 진행한 적이 없다면 다른 ID를 입력해 주세요.`,
      resumeDone: "이 ID는 이미 끝까지 진행했습니다. 시작하면 마지막 화면으로 갑니다.",
      help: "도움말", helpTitle: "진행 방법", tourAgain: "화면 안내 다시 보기", close: "닫기",
      stagePractice: "연습", stageMain: "본 문항",
      claimLine: w => `모델 안의 이 뉴런 묶음은 <span class="claimword">${w}</span>${josa(w)} 담당한다고 합니다.`,
      claimTask: v => `이 뉴런 묶음을 강하게 켰을 때 차가 정말 <span class="verbword">${v}</span> 파란 경로를 보고 확인해 주세요.`,
      safety: "⚠ 도로를 벗어나거나 다른 차와 부딪히는 등 <b>경로의 안전성은 무시</b>하고, 설명한 행동대로 바뀌었는지만 봐 주세요.",
      verb: { "좌회전": "왼쪽으로 꺾는지", "우회전": "오른쪽으로 꺾는지", "정지": "멈추는지", "가속": "빨라지는지", "감속": "느려지는지" },
      q1: { "좌회전": "정말 왼쪽으로 꺾었나요?", "우회전": "정말 오른쪽으로 꺾었나요?", "정지": "정말 멈췄나요?",
            "가속": "정말 빨라졌나요?", "감속": "정말 느려졌나요?" },
      camCap: "전방 카메라 (왼쪽 | 앞 | 오른쪽)", egoSpeed: "현재 속도", egoCmd: "내비 지시", replay: "⟲ 다시 재생",
      result: k => `결과 ${k}`,
      unit: "km/h", spd: v => String(Math.round(v)),
      speed: (a, b) => `4초 뒤 속도: 원래 <b>${a}</b> → <b>${b}</b> km/h`,
      yes: "예", no: "아니오",
      q3: w => `셋 중 "${w}" 설명에 <b>가장 맞는 결과</b>는?`,
      prev: "← 이전", next: "다음 →", check: "정답 확인", last: "마지막 문항 끝내기",
      needQ1: ks => `${ks.map(k => `결과 ${k}`).join(", ")}의 질문(예/아니오)에 답해 주세요.`,
      needQ3: "셋 중 설명에 가장 맞는 결과를 골라 주세요.",
      tieAll: "비교할 수 없음 (모두 맞음)", tieNone: "비교할 수 없음 (모두 틀림)",
      tieNote: "'비교할 수 없음'은 위 세 질문이 모두 '예'이거나 모두 '아니오'일 때만 고를 수 있습니다. 둘이 비슷하면 그중 더 잘 맞는 하나를 골라 주세요.",
      keys: "<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> 가장 맞는 결과 · <kbd>R</kbd> 다시 재생 · <kbd>Enter</kbd> 다음",
      fbOk: "맞았습니다.", fbWrong: k => `이번에는 결과 ${k}${k === 2 ? "가" : "이"} 정답입니다.`,   // 1 일, 3 삼 -> 이; 2 이 -> 가
      fbAfter: "본 문항부터는 정답을 알려 드리지 않습니다. 정답이 정해지지 않은 문항도 있으니 보이는 대로 판단해 주세요.",
      practiceDoneTitle: "연습 끝!", practiceDoneGo: "본 문항 시작",
      practiceDoneText: n => `이제 본 문항 ${n}개입니다. 연습과 같은 방식으로 진행하세요. 응답은 자동으로 저장됩니다.`,
      tourSkip: "건너뛰기", tourNext: "다음", tourDone: "직접 해 보기",
      tour: [
        "먼저 <b>설명</b>을 읽으세요. 이 뉴런 묶음이 어떤 행동을 담당한다고 주장하는지, 무엇을 확인할지가 나옵니다. 경로의 <b>안전성은 무시</b>하고 그 행동만 보면 됩니다.",
        "<b>전방 카메라</b>와 현재 속도, 내비 지시로 상황을 파악하세요. <b>⟲ 다시 재생</b>으로 움직임을 처음부터 다시 볼 수 있습니다.",
        "세 팀의 뉴런 묶음을 각각 켠 <b>결과 세 개</b>입니다. <b>주황 선</b>(원래 경로)과 <b>파란 선</b>(켠 뒤 경로)을 비교하세요. 두 차가 경로를 따라 2배속으로 움직입니다.",
        "결과마다 차가 <b>설명대로 움직였는지</b> 예/아니오로 고르세요.",
        "마지막으로 셋 중 설명에 <b>가장 맞는 결과</b>를 고르세요 (숫자키 1–3). 세 결과가 모두 맞거나 모두 틀렸으면 <b>비교할 수 없음</b>을 고를 수 있습니다.",
        "다 골랐으면 <b>다음</b>. 지금은 연습 문항이라 고른 뒤 정답을 알려 드립니다. 직접 해 보세요!"
      ],
      svTitle: "마지막으로 몇 가지만 알려 주세요", svLead: "결과를 해석할 때만 씁니다. 각 질문에 하나씩 골라 주세요.",
      svFree: "하고 싶은 말이 있으면 적어 주세요 (선택)", svBack: "← 문항으로 돌아가기", svSubmit: "제출하기",
      svNeed: "모든 질문에 하나씩 골라 주세요.",
      sv: {
        driving_years: ["운전 경력", { none: "없음", lt1: "1년 미만", y1to5: "1–5년", gt5: "5년 이상" }],
        ad_years: ["자율주행 관련 연구·개발 경력", { none: "없음", lt1: "1년 미만", y1to3: "1–3년", gt3: "3년 이상" }],
        cv_years: ["컴퓨터 비전·딥러닝 연구·개발 경력", { none: "없음", lt1: "1년 미만", y1to3: "1–3년", gt3: "3년 이상" }],
        xai: ["설명 가능한 AI(XAI) 방법을 얼마나 아나요?", { never: "처음 들어 봄", heard: "들어 본 적 있음", used: "연구나 업무에 써 봄" }]
      },
      doneTitle: "끝났습니다. 감사합니다!",
      doneText: "아래 버튼으로 결과 파일을 내려받아 연구자에게 보내 주세요.",
      doneTextOnline: "응답은 문항마다 자동으로 연구자에게 전송됩니다.",
      sendingFinal: "결과를 전송하는 중입니다… 창을 닫지 말아 주세요.",
      sentFinal: "✓ 결과가 전송되었습니다. 이제 창을 닫으셔도 됩니다.",
      failedFinal: "결과를 전송하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요. 계속 실패하면 아래 버튼으로 결과 파일을 내려받아 연구자에게 보내 주세요.",
      retry: "다시 전송", download: "결과 파일 내려받기", downloadBackup: "결과 파일 내려받기 (백업)", home: "← 처음 화면으로",
      dlNote: "내려받기를 시작했습니다. 파일이 저장되지 않았다면 버튼을 다시 눌러 주세요.",
      syncOk: "✓ 저장됨", syncPending: n => `전송 대기 ${n}`, syncFail: n => `⚠ 전송 실패 ${n} · 다시 시도 중`
    },
    en: {
      title: "Neuron Sets in a Driving Model",
      lead: "A self-driving model decides how to drive through many <b>artificial neurons</b> that pass signals to each other, much like a human brain. Three research teams each claim that \"this <b>neuron set</b> is responsible for a certain behaviour\". We show how the car's planned path changes when that neuron set is <b>strongly activated</b>. Please judge which team's neuron set <b>really moves the car as claimed</b>.",
      smallScreen: "📱 On a phone, please turn the screen <b>sideways</b>. You compare three maps, so a PC or laptop is recommended.",
      rotate: "📱 Turn the phone sideways to see the maps larger.",
      ex1a: "This neuron set is said to be responsible for", ex1b: "slowing down", ex1c: "",
      s1t: "Read the claim", s1d: "The blue box at the top says which behaviour this neuron set is claimed to be responsible for.",
      illOrig: "original path", illSteer: "activated",
      s2t: "Watch the three results", s2d: "Three maps show the path when each team's neuron set is activated. Two cars move along the paths.",
      ex3q: "Did it really slow down?", ex3r1: "Result 1", ex3r2: "Result 2", ex3r3: "Result 3",
      s3t: "Judge → Next", s3d: "For each result, say whether the car moved as claimed (yes/no), pick the result that best matches the claim, then press 'Next'.",
      lgOrig: "Orange line: the original planned path", lgSteer: "Blue line: the planned path after strongly activating the neuron set",
      lgDots: "Dots on a line: where the car will be every 0.5 s (wider spacing = faster)",
      lgPlay: "Two cars move along the two paths at <b>2× speed</b> (4 s shown in 2 s).",
      lgOrigS: "original path", lgSteerS: "neuron set activated",
      keynote: "There is no fixed right or wrong. Judge, as you see it, whether the blue path changed in the claimed way. Strong activation often sends the path off the road or into other cars: <b>ignore safety</b> and look only at the behaviour.",
      meta: (p, n, min) => [`${p} practice + ${n} items`, `about ${min} min`, "a short survey at the end", "progress saved automatically", "'Help' shows this again"],
      idLabel: "Participant ID", idHint: "Letters and digits, at least 2 (e.g. P01).",
      idResumeNote: "Coming back with the same ID on the same computer and browser continues where you left off. If you are new and see a note about continuing, that ID is taken: please enter another one.",
      idBad: "Use letters and digits only, at least 2 (e.g. P01).",
      idTaken: "Responses have already been submitted with this ID. If you are new, please enter another ID. If you started on another device, please continue there.",
      idChecking: "Checking the ID…",
      start: "Start", startResume: "Continue",
      resume: (i, n) => `Saved progress exists for this ID (${i} / ${n}). If it is not yours, please enter another ID.`,
      resumeDone: "This ID has already finished. Starting opens the last page.",
      help: "Help", helpTitle: "How it works", tourAgain: "Show the screen tour again", close: "Close",
      stagePractice: "Practice", stageMain: "Study",
      claimLine: w => `This neuron set in the model is said to be responsible for <span class="claimword">${w}</span>.`,
      claimTask: v => `Check with the blue path whether the car really <span class="verbword">${v}</span> when this neuron set is strongly activated.`,
      safety: "⚠ <b>Ignore whether the path is safe</b> (leaving the road or hitting other cars does not matter here); only check whether it changes as claimed.",
      verb: { "좌회전": "turns left", "우회전": "turns right", "정지": "stops", "가속": "speeds up", "감속": "slows down" },
      q1: { "좌회전": "Did it really turn left?", "우회전": "Did it really turn right?", "정지": "Did it really stop?",
            "가속": "Did it really speed up?", "감속": "Did it really slow down?" },
      claimName: { "좌회전": "turning left", "우회전": "turning right", "정지": "stopping", "가속": "speeding up", "감속": "slowing down" },
      camCap: "Front camera (left | front | right)", egoSpeed: "Current speed", egoCmd: "Route command", replay: "⟲ Replay",
      result: k => `Result ${k}`,
      unit: "m/s", spd: v => (v / 3.6).toFixed(1),
      speed: (a, b) => `Speed after 4 s: original <b>${a}</b> → <b>${b}</b> m/s`,
      yes: "Yes", no: "No",
      q3: w => `Which result <b>best matches</b> the claim "${w}"?`,
      prev: "← Back", next: "Next →", check: "Check", last: "Finish the last item",
      needQ1: ks => `Please reply yes/no for ${ks.map(k => `Result ${k}`).join(", ")}.`,
      needQ3: "Please pick the result that best matches the claim.",
      tieAll: "Can't compare (all match)", tieNone: "Can't compare (none match)",
      tieNote: "'Can't compare' is available only when all three replies above are 'Yes' (or all 'No'). If two look alike, pick the one that matches better.",
      keys: "<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> best match · <kbd>R</kbd> replay · <kbd>Enter</kbd> next",
      fbOk: "Correct.", fbWrong: k => `This time Result ${k} is the correct one.`,
      fbAfter: "From now on no feedback is given. Some items have no single correct result, so judge as you see it.",
      practiceFb: "The correct result is the one where the car turns left. The other two turn right or slow down. Judge every item the same way: did the blue path change as the claim says?",
      practiceDoneTitle: "Practice done!", practiceDoneGo: "Start the study",
      practiceDoneText: n => `Next come the ${n} study items. Work the same way as in the practice. Your responses are saved automatically.`,
      tourSkip: "Skip", tourNext: "Next", tourDone: "Try it",
      tour: [
        "First read the <b>claim</b>: which behaviour this neuron set is said to be responsible for, and what to check. <b>Ignore safety</b>; look only at that behaviour.",
        "Get the situation from the <b>front camera</b>, the current speed and the route command. <b>⟲ Replay</b> restarts the motion.",
        "These are the <b>three results</b>, one per team's neuron set. Compare the <b>orange line</b> (original path) with the <b>blue line</b> (after activation). Two cars move along the paths at 2× speed.",
        "For each result, say whether the car <b>moved as claimed</b> (yes/no).",
        "Finally pick the result that <b>best matches</b> the claim (keys 1–3). If all three match, or none does, you may choose <b>Can't compare</b>.",
        "When done, press <b>Next</b>. This is a practice item, so you will see the correct result. Try it!"
      ],
      svTitle: "A few last questions", svLead: "Used only to interpret the results. Please pick one option for each question.",
      svFree: "Any comments? (optional)", svBack: "← Back to the items", svSubmit: "Submit",
      svNeed: "Please pick one option for every question.",
      sv: {
        driving_years: ["Driving experience", { none: "None", lt1: "< 1 year", y1to5: "1–5 years", gt5: "> 5 years" }],
        ad_years: ["Research or development experience in autonomous driving", { none: "None", lt1: "< 1 year", y1to3: "1–3 years", gt3: "> 3 years" }],
        cv_years: ["Research or development experience in computer vision / deep learning", { none: "None", lt1: "< 1 year", y1to3: "1–3 years", gt3: "> 3 years" }],
        xai: ["How familiar are you with explainable AI (XAI) methods?", { never: "Never heard of them", heard: "Heard of them", used: "Used them in research or work" }]
      },
      doneTitle: "All done. Thank you!",
      doneText: "Please download the result file below and send it to the researcher.",
      doneTextOnline: "Your responses are sent to the researcher automatically after every item.",
      sendingFinal: "Sending your results… please keep this window open.",
      sentFinal: "✓ Your results have been sent. You may close this window.",
      failedFinal: "Your results could not be sent. Please check the internet connection and try again. If it keeps failing, download the result file below and send it to the researcher.",
      retry: "Send again", download: "Download result file", downloadBackup: "Download result file (backup)", home: "← Back to the start",
      dlNote: "The download has started. If no file was saved, press the button again.",
      syncOk: "✓ Saved", syncPending: n => `${n} waiting to send`, syncFail: n => `⚠ ${n} not sent · retrying`
    }
  };
  const SURVEY = ["driving_years", "ad_years", "cv_years", "xai"];
  let lang = "ko";
  try { lang = localStorage.getItem("steer_lang") || ((navigator.language || "").startsWith("ko") ? "ko" : "en"); } catch (e) { /* ignore */ }
  if (!TEXT[lang]) lang = "ko";
  const T = () => TEXT[lang];
  const claimWord = it => (lang === "ko" ? it.claim : T().claimName[it.claim] || it.claim_en);
  const cmdWord = it => (lang === "ko" ? it.command : ({ left: "turn left", right: "turn right", straight: "straight" }[it.command_en] || it.command_en));

  let S = null, clock0 = performance.now(), raf = 0, canvases = [], enterTime = null, tried = false;   // tried: Next pressed with something left

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
             user_agent: navigator.userAgent, lang, tour_done: false };
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
             app_version: APP_VERSION, order_seed: S.order_seed, language: lang, sent_at: new Date().toISOString() };
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
    badge.textContent = n === 0 ? T().syncOk : warn ? T().syncFail(n) : T().syncPending(n);
  }
  function setFinal(st) { finalState = st; renderDone(); }
  function sendTrial(uid, order) {
    const r = S.resp[uid];
    if (r) enqueue(Object.assign(envelope("scene"), { order, response: Object.assign({ scene_uid: uid }, r) }));
  }
  function resultObject() {
    return { manifest_id: S.manifest_id, annotator_id: S.annotator_id, app_version: APP_VERSION, order_seed: S.order_seed,
             language: lang, started_at: S.started_at, finished_at: S.finished_at, user_agent: S.user_agent, order: S.order,
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
      const j = await (await fetch(u)).json();
      return !!(j.ok !== false && j.used);
    } catch (e) { return false; }                // server unreachable: start without the check
  }

  // ------------------------------------------------------------ language
  function applyLang() {
    document.documentElement.lang = lang;
    document.title = T().title;
    document.querySelectorAll("[data-t]").forEach(el => {
      const v = T()[el.dataset.t];
      if (typeof v === "string") { if (v.includes("<")) el.innerHTML = v; else el.textContent = v; }
    });
    document.querySelectorAll(".langbtn").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
    const min = MINUTES;
    $("meta").innerHTML = T().meta(N_PRACTICE, N_STUDY, min).map(x => `<li>${x}</li>`).join("");
    $("helpSteps").innerHTML = "";
    $("helpSteps").appendChild($("steps").cloneNode(true)).removeAttribute("id");
    $("helpLegend").innerHTML = "";
    $("helpLegend").appendChild($("legendBox").cloneNode(true)).removeAttribute("id");
    onId();
    if (S) { S.lang = lang; save(); updateSync(); }
    if (S && !$("trial").classList.contains("hidden")) renderTrial(true);
    if (S && !$("survey").classList.contains("hidden")) renderSurvey();
    if (!$("practiceModal").classList.contains("hidden")) $("practiceDoneText").textContent = T().practiceDoneText(N_STUDY);
    if (tourIdx !== null) showTourStep();
    renderDone();
  }
  document.querySelectorAll(".langbtn").forEach(b => b.addEventListener("click", () => {
    lang = b.dataset.lang;
    try { localStorage.setItem("steer_lang", lang); } catch (e) { /* ignore */ }
    applyLang();
  }));

  // ------------------------------------------------------------ start screen
  const HOVERLESS = window.matchMedia("(hover: none)").matches;
  function checkScreen() {
    $("smallScreen").classList.toggle("hidden", window.innerWidth >= 1000 && !HOVERLESS);
    $("rotateHint").classList.toggle("hidden", !(window.matchMedia("(orientation: portrait)").matches && window.innerWidth < 760));
  }
  function onId() {
    const inp = $("annId"), raw = inp.value, up = raw.toUpperCase();
    if (raw !== up) { const p = inp.selectionStart; inp.value = up; inp.setSelectionRange(p, p); }
    const id = inp.value.trim(), ok = ID_RE.test(id), bad = id.length > 0 && !ok;
    $("idTaken").classList.add("hidden");
    $("startBtn").disabled = !ok;
    inp.classList.toggle("bad", bad);
    $("idHint").classList.toggle("bad", bad);
    $("idHint").textContent = bad ? T().idBad : T().idHint;
    const prev = ok ? load(id) : null;
    $("resumeNote").classList.toggle("hidden", !prev);
    if (prev) $("resumeNote").textContent = prev.phase === "done" ? T().resumeDone : T().resume(Math.min(prev.idx + 1, prev.order.length), prev.order.length);
    $("startBtn").textContent = prev ? T().startResume : T().start;
  }
  async function start() {
    const id = $("annId").value.trim();
    if (!ID_RE.test(id)) return;
    let st = load(id);
    if (!st) {
      $("startBtn").disabled = true;
      $("idHint").textContent = T().idChecking;
      const taken = await idUsedElsewhere(id);
      $("startBtn").disabled = false;
      $("idHint").textContent = T().idHint;
      if (taken) { $("idTaken").textContent = T().idTaken; $("idTaken").classList.remove("hidden"); return; }
      st = fresh(id);
    }
    S = st; S.lang = lang; save(); updateSync(); flush();
    $("start").classList.add("hidden");
    if (S.phase === "done") return showDone();
    if (S.phase === "survey") return showSurvey();
    $("trial").classList.remove("hidden");
    renderTrial();
    if (!S.tour_done && cur().kind === "practice") setTimeout(startTour, 350);
  }

  // ------------------------------------------------------------ item
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
  function renderTrial(keepClock) {
    const it = cur(), r = resp(it), w = claimWord(it);
    if (!keepClock) { enterTime = performance.now(); window.scrollTo(0, 0); tried = false; }
    const practice = it.kind === "practice";
    $("stageTag").textContent = practice ? T().stagePractice : T().stageMain;
    $("stageTag").classList.toggle("practice", practice);
    $("progressText").textContent = `${S.idx + 1} / ${S.order.length}`;
    $("progressFill").style.width = `${100 * S.idx / S.order.length}%`;
    $("claimLine").innerHTML = T().claimLine(w);
    $("claimTask").innerHTML = T().claimTask(T().verb[it.claim]);
    $("claimSafety").innerHTML = T().safety;
    $("q3Label").innerHTML = T().q3(w);
    $("cam").src = "images/" + it.camera;
    $("egoSpeed").textContent = T().spd(it.ego_speed_kmh);
    $("egoUnit").textContent = T().unit;
    $("egoCmd").textContent = cmdWord(it);
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
      d.innerHTML = `<div class="paneltitle"><span class="num">${k + 1}</span>${T().result(k + 1)}</div><canvas></canvas>
        <div class="speed">${T().speed(T().spd(it.orig.vend), T().spd(p.vend))}</div>
        <div class="q1"><span class="q1text">${T().q1[it.claim]}</span><button data-v="yes">${T().yes}</button><button data-v="no">${T().no}</button></div>`;
      d.querySelectorAll(".q1 button").forEach(b => b.addEventListener("click", () => { r.q1[pid] = b.dataset.v; save(); mark(); }));
      pan.appendChild(d);
      canvases.push({ cv: d.querySelector("canvas"), it, p, img });
    });
    const q3 = $("q3btns");
    q3.innerHTML = "";
    S.panelOrder[it.uid].forEach((pid, k) => {
      const b = document.createElement("button");
      b.textContent = T().result(k + 1);
      b.dataset.pid = pid;
      b.setAttribute("role", "radio");
      b.addEventListener("click", () => chooseQ3(pid));
      q3.appendChild(b);
    });
    // ties (2026-11-23): only when the item's own Q1 replies agree (all yes / all no), so they are not an easy way out;
    // two results that look alike still need one pick. Analysis: each method gets 1/3 (steer_analyze.py)
    [[TIE_ALL, T().tieAll], [TIE_NONE, T().tieNone]].forEach(([v, label]) => {
      const b = document.createElement("button");
      b.textContent = label; b.dataset.pid = v; b.className = "tie"; b.title = T().tieNote;
      b.setAttribute("role", "radio");
      b.addEventListener("click", () => { if (!b.disabled) chooseQ3(v); });
      q3.appendChild(b);
    });
    renderFeedback();
    img.onload = () => { sizeCanvases(); if (!keepClock) restart(); };
    img.src = "images/" + it.map;
    sizeCanvases();
    if (!keepClock || !raf) restart();
    mark();
  }
  function chooseQ3(pid) { const r = resp(cur()); r.q3 = pid; save(); mark(); }
  function missing() {
    const it = cur(), r = resp(it), order = S.panelOrder[it.uid];
    const q1 = order.map((pid, k) => (r.q1[pid] ? null : k + 1)).filter(k => k !== null);
    return { q1, q3: !r.q3 };
  }
  function tieAllowed(r, it) {                             // which tie button the Q1 replies allow
    const v = it.panels.map(p => r.q1[p.pid]);
    return { [TIE_ALL]: v.every(x => x === "yes"), [TIE_NONE]: v.every(x => x === "no") };
  }
  function mark() {
    const it = cur(), r = resp(it), ok = tieAllowed(r, it);
    if ((r.q3 === TIE_ALL || r.q3 === TIE_NONE) && !ok[r.q3]) { r.q3 = null; save(); }   // Q1 changed: the tie no longer holds
    const m = missing();
    document.querySelectorAll("#q3btns button.tie").forEach(b => { b.disabled = !ok[b.dataset.pid]; });
    $("tieNote").textContent = T().tieNote;
    document.querySelectorAll(".panel").forEach(d => {
      d.querySelectorAll(".q1 button").forEach(b => b.classList.toggle("on", r.q1[d.dataset.pid] === b.dataset.v));
      d.classList.toggle("chosen", r.q3 === d.dataset.pid);
      if (r.q1[d.dataset.pid]) d.classList.remove("need");
    });
    document.querySelectorAll("#q3btns button").forEach(b => {
      b.classList.toggle("on", r.q3 === b.dataset.pid);
      b.setAttribute("aria-checked", String(r.q3 === b.dataset.pid));
    });
    if (r.q3) $("q3Box").classList.remove("need");
    const ready = !m.q1.length && !m.q3;
    $("nextBtn").textContent = it.kind === "practice" && !r.feedback_shown ? T().check :
      S.idx === S.order.length - 1 ? T().last : T().next;
    $("nextHint").textContent = ready || !tried ? "" : m.q1.length ? T().needQ1(m.q1) : T().needQ3;
  }
  function flashMissing() {
    const it = cur(), r = resp(it);
    tried = true; mark();
    document.querySelectorAll(".panel").forEach(d => { if (!r.q1[d.dataset.pid]) { d.classList.add("need", "flash"); setTimeout(() => d.classList.remove("flash"), 650); } });
    if (!r.q3) { $("q3Box").classList.add("need", "flash"); setTimeout(() => $("q3Box").classList.remove("flash"), 650); }
  }
  function renderFeedback() {
    const it = cur(), r = resp(it), fb = $("feedback");
    if (it.kind !== "practice" || !r.feedback_shown) { fb.classList.add("hidden"); return; }
    const ok = r.q3 === it.target_pid, k = S.panelOrder[it.uid].indexOf(it.target_pid) + 1;
    const text = lang === "ko" ? it.feedback : (it.feedback_en || T().practiceFb);
    fb.className = "feedback" + (ok ? "" : " wrong");
    fb.innerHTML = `<b>${ok ? T().fbOk : T().fbWrong(k)}</b> ${text}<br><span class="hint">${T().fbAfter}</span>`;
  }
  function next() {
    const it = cur(), r = resp(it), m = missing();
    if (m.q1.length || m.q3) { flashMissing(); return; }
    if (it.kind === "practice" && !r.feedback_shown) { r.feedback_shown = true; save(); renderFeedback(); mark(); return; }
    leave();
    sendTrial(it.uid, S.idx);
    if (S.idx === S.order.length - 1) { S.phase = "survey"; save(); cancelAnimationFrame(raf); raf = 0; $("trial").classList.add("hidden"); return showSurvey(); }
    const nextIt = byUid[S.order[S.idx + 1]];
    S.idx += 1; save();
    if (it.kind === "practice" && nextIt.kind !== "practice") {
      $("practiceDoneText").textContent = T().practiceDoneText(N_STUDY);
      $("practiceModal").classList.remove("hidden");
      return;
    }
    renderTrial();
  }
  function prev() { if (S.idx > 0) { leave(); S.idx -= 1; save(); renderTrial(); } }

  // ------------------------------------------------------------ drawing (Fig. 6 style paths + moving cars)
  function sizeCanvases() {
    const dpr = window.devicePixelRatio || 1;
    canvases.forEach(c => { const w = c.cv.clientWidth; c.cv.width = Math.round(w * dpr); c.cv.height = Math.round(w * dpr); });
  }
  const poses = T_ => [[0, 0, 0]].concat(T_);              // plot coords (x = -left, y = forward, yaw)
  function pathLen(T_) { const P = poses(T_); let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; }
  function poseAt(T_, t) {                                 // real time t in [0, 4] s, linear between outputs every dt
    const P = poses(T_), k = Math.min(t / PB.dt, P.length - 1), i = Math.min(Math.floor(k), P.length - 2), f = k - i;
    const a = P[i], b = P[i + 1];
    return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])];
  }
  function draw(c, t) {
    const { cv, it, p, img } = c, g = cv.getContext("2d"), W = cv.width, H = cv.height, [x0, x1, y0, y1] = it.extent;
    if (!W) return;
    const px = (x, y) => [(x - x0) / (x1 - x0) * W, (1 - (y - y0) / (y1 - y0)) * H];
    const sc = W / 480;
    g.clearRect(0, 0, W, H);
    if (img.complete && img.naturalWidth) g.drawImage(img, 0, 0, W, H);
    const lines = [[it.orig.T, ORIG_C, 3.4], [p.T, STEER_C, 5]].sort((a, b) => pathLen(b[0]) - pathLen(a[0]));  // shortest on top
    lines.forEach(([T_, col, lw]) => {
      const P = poses(T_).map(q => px(q[0], q[1]));
      g.globalAlpha = .7; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw * sc; g.lineJoin = "round"; g.lineCap = "round";
      g.beginPath(); P.forEach(([u, v], i) => (i ? g.lineTo(u, v) : g.moveTo(u, v))); g.stroke();
      P.forEach(([u, v]) => { g.beginPath(); g.arc(u, v, (lw * .55 + 1.6) * sc, 0, 2 * Math.PI); g.fill(); });
      g.globalAlpha = 1;
    });
    [[it.orig.T, ORIG_C], [p.T, STEER_C]].forEach(([T_, col]) => {      // cars: original first, activated on top
      const [x, y, yaw] = poseAt(T_, t), fx = -Math.sin(yaw), fy = Math.cos(yaw), lx = -Math.cos(yaw), ly = -Math.sin(yaw);
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
  function replay() { if (S && cur()) { resp(cur()).replays += 1; save(); } restart(); }

  // ------------------------------------------------------------ survey
  function showSurvey() {
    $("survey").classList.remove("hidden");
    window.scrollTo(0, 0);
    renderSurvey();
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
    $("comment").value = S.comment || "";
    updateSurvey();
  }
  function updateSurvey() {
    const ok = SURVEY.every(q => S.survey[q]);
    $("svSubmit").disabled = !ok;
    $("svHint").textContent = ok ? "" : T().svNeed;
  }
  function submitSurvey() {
    if (!SURVEY.every(q => S.survey[q])) return;
    S.comment = $("comment").value;
    S.phase = "done";
    S.finished_at = S.finished_at || new Date().toISOString();
    save();
    $("survey").classList.add("hidden");
    sendFinal();
    showDone();
  }
  function backToTrials() {
    S.comment = $("comment").value;
    S.phase = "trial"; save();
    $("survey").classList.add("hidden"); $("trial").classList.remove("hidden"); renderTrial();
  }

  // ------------------------------------------------------------ done
  function showDone() {
    cancelAnimationFrame(raf); raf = 0;
    $("done").classList.remove("hidden");
    if (ONLINE && finalState === null) finalState = getBox().some(m => m.kind === "final") ? "sending" : "sent";
    $("dlNote").textContent = "";
    renderDone();
    if (ONLINE) flush();
  }
  function renderDone() {
    if (!S || $("done").classList.contains("hidden")) return;
    $("doneText").textContent = ONLINE ? T().doneTextOnline : T().doneText;
    const line = $("doneSync");
    line.className = `syncline ${finalState || ""}` + (!ONLINE || !finalState ? " hidden" : "");
    line.textContent = finalState ? T()[{ sending: "sendingFinal", sent: "sentFinal", failed: "failedFinal" }[finalState]] : "";
    $("retryBtn").classList.toggle("hidden", finalState !== "failed");
    $("dlBtn").textContent = ONLINE ? T().downloadBackup : T().download;
    $("dlBtn").className = ONLINE && finalState !== "failed" ? "ghost" : "primary";
  }
  function download() {
    const blob = new Blob([JSON.stringify(resultObject(), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `steer_result_${S.annotator_id}_${(S.finished_at || new Date().toISOString()).replace(/[:.]/g, "-")}.json`;
    a.click();
    $("dlNote").textContent = T().dlNote;
  }
  // to the start screen: the finished state is kept (the same ID opens the last page again), a new ID starts afresh
  function goHome() {
    $("done").classList.add("hidden"); $("start").classList.remove("hidden");
    $("annId").value = ""; onId(); window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ help and guided tour
  const TOUR_TARGETS = ["claimBox", "egoBox+camBox", "panels", "firstQ1", "q3Box", "nextBtn"];
  const tourEl = id => (id === "firstQ1" ? document.querySelector(".panel .q1") : $(id.split("+")[0]));
  function tourRect(id) {                                   // "a+b": the box around both elements
    const els = id === "firstQ1" ? [tourEl(id)] : id.split("+").map(x => $(x));
    const rs = els.filter(Boolean).map(e => e.getBoundingClientRect());
    if (!rs.length) return null;
    const left = Math.min(...rs.map(r => r.left)), top = Math.min(...rs.map(r => r.top));
    const right = Math.max(...rs.map(r => r.right)), bottom = Math.max(...rs.map(r => r.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }
  let tourIdx = null;
  function startTour() { tourIdx = 0; $("tour").classList.remove("hidden"); showTourStep(); }
  function endTour() {
    tourIdx = null; $("tour").classList.add("hidden");
    if (S && !S.tour_done) { S.tour_done = true; save(); }
  }
  function showTourStep() {
    const el = tourEl(TOUR_TARGETS[tourIdx]);
    if (!el) { endTour(); return; }
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
    const r = tourRect(TOUR_TARGETS[tourIdx]), pad = 6;
    if (!r) return;
    const hole = $("tourHole"), tip = $("tourTip");
    Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + 2 * pad}px`, height: `${r.height + 2 * pad}px` });
    const W = window.innerWidth, H = window.innerHeight, tw = tip.offsetWidth, th = tip.offsetHeight, gap = 14;
    let x, y;
    if (r.bottom + gap + th < H) { x = r.left; y = r.bottom + gap + pad; }                              // below
    else if (r.top - gap - th > 8) { x = r.left; y = r.top - gap - th - pad; }                           // above
    else if (r.right + gap + tw < W) { x = r.right + gap + pad; y = r.top; }                             // right
    else { x = r.right - tw - 16; y = r.top + 16; }                                                       // inside, large targets
    tip.style.left = `${Math.max(8, Math.min(x, W - tw - 8))}px`;
    tip.style.top = `${Math.max(8, Math.min(y, H - th - 8))}px`;
  }
  $("tourNext").addEventListener("click", () => {
    if (tourIdx === TOUR_TARGETS.length - 1) { endTour(); return; }
    tourIdx++; showTourStep();
  });
  $("tourSkip").addEventListener("click", endTour);
  window.addEventListener("scroll", placeTour, { passive: true });
  $("helpBtn").addEventListener("click", () => $("helpModal").classList.remove("hidden"));
  $("helpClose").addEventListener("click", () => $("helpModal").classList.add("hidden"));
  $("helpModal").addEventListener("click", e => { if (e.target === $("helpModal")) $("helpModal").classList.add("hidden"); });
  $("tourBtn").addEventListener("click", () => { $("helpModal").classList.add("hidden"); startTour(); });
  $("practiceGo").addEventListener("click", () => { $("practiceModal").classList.add("hidden"); renderTrial(); });

  // ------------------------------------------------------------ keys
  document.addEventListener("keydown", e => {
    if ($("trial").classList.contains("hidden") || tourIdx !== null) return;
    if (!$("helpModal").classList.contains("hidden") || !$("practiceModal").classList.contains("hidden")) {
      if (e.key === "Escape") $("helpModal").classList.add("hidden");
      return;
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "") || e.ctrlKey || e.metaKey || e.altKey) return;
    const order = S.panelOrder[cur().uid];
    if (["1", "2", "3"].includes(e.key) && order[+e.key - 1]) { chooseQ3(order[+e.key - 1]); e.preventDefault(); }
    else if (e.code === "KeyR") { replay(); e.preventDefault(); }
    else if (e.key === "Enter" && !(e.target && e.target.tagName === "BUTTON")) { next(); e.preventDefault(); }
  });

  // ------------------------------------------------------------ wiring
  const qid = new URLSearchParams(location.search).get("id");
  if (qid) $("annId").value = qid;
  $("annId").addEventListener("input", onId);
  $("annId").addEventListener("keydown", e => { if (e.key === "Enter" && !$("startBtn").disabled) start(); });
  $("startBtn").addEventListener("click", start);
  $("nextBtn").addEventListener("click", next);
  $("prevBtn").addEventListener("click", prev);
  $("replayBtn").addEventListener("click", replay);
  $("svSubmit").addEventListener("click", submitSurvey);
  $("svBack").addEventListener("click", backToTrials);
  $("dlBtn").addEventListener("click", download);
  $("retryBtn").addEventListener("click", () => { fails = 0; setFinal("sending"); clearTimeout(retryTimer); flush(); });
  $("homeBtn").addEventListener("click", goHome);
  window.addEventListener("resize", () => { checkScreen(); if (canvases.length) sizeCanvases(); placeTour(); });
  checkScreen();
  applyLang();
})();
