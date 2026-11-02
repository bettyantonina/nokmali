(() => {
  const BASE = "de/rauhnaechte/orakel/";
  const fix = (p) => (p && p.startsWith("./") ? BASE + p.slice(2) : p);
  const CARDS = window.oracleDeck.cards.map((c) => ({ ...c, image: fix(c.image), thumbnail: fix(c.thumbnail) }));
  document.documentElement.style.setProperty("--cover", `url("${fix(window.oracleDeck.backImage)}")`);
  const $ = (id) => document.getElementById(id);
  const stage = $("stage"), table = $("table"), inner = $("inner"), hit = $("hit"), intro = $("intro");
  const say = $("say"), actions = $("actions"), reading = $("reading"), slot = $("slot"), flip = $("flip"), panel = $("panel");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover:hover) and (pointer:fine)");
    const n = CARDS.length;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffleArr = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let phase = "deck", order = shuffleArr([...Array(n).keys()]), shuffled = false, selected = null, timers = [];
  let cw = 150, ch = 225, contentW = 0, slots = [];
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const els = CARDS.map((c, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "card"; b.tabIndex = -1; b.dataset.i = i;
    b.innerHTML = '<span class="back" aria-hidden="true"></span>';
    inner.insertBefore(b, hit);
    return b;
  });
  const st = els.map(() => ({ x: 0, y: 0, r: 0, s: 1, lift: 0 }));
  function place(i, o) {
    Object.assign(st[i], o);
    const s = st[i];
    els[i].style.transform = `translate(${s.x - cw / 2}px,${s.y - ch / 2}px) rotate(${s.r}deg) translateY(${s.lift}px) scale(${s.s})`;
  }
  const instant = (fn) => { inner.classList.add("no-anim"); fn(); void inner.offsetWidth; inner.classList.remove("no-anim"); };

  // ---------- geometry ----------
  function measure() {
    const W = table.clientWidth, H = table.clientHeight;
    const introH = intro.offsetHeight + 12;
    cw = Math.round(clamp(Math.min(W * 0.36, ((H - introH - 32) * 0.8) / 1.5), 56, 172));
    ch = Math.round(cw * 1.5);
    inner.style.setProperty("--cw", cw + "px");
    inner.style.setProperty("--ch", ch + "px");
    return { W, H, introH };
  }
  function deckCenter() {
    const { W, H, introH } = measure();
    const cw0 = contentW || W;
    return { x: cw0 / 2, y: Math.min(introH + (H - introH) / 2 + 6, H - ch / 2 - 18) };
  }
  const tilt = CARDS.map(() => rand(-0.9, 0.9));
  const stackT = (k, c, i = order[k]) => ({ x: c.x - k * 0.25, y: c.y - k * 0.5, r: tilt[i], s: 1, lift: 0 });
  function layoutStack() {
    const c = deckCenter();
    order.forEach((i, k) => { place(i, stackT(k, c)); els[i].style.zIndex = k + 1; els[i].classList.toggle("base", k === 0); });
    const top = stackT(n - 1, c);
    Object.assign(hit.style, { left: top.x - cw / 2 - 6 + "px", top: top.y - ch / 2 - 6 + "px", width: cw + 16 + "px", height: ch + 18 + "px" });
  }
  function computeSlots() {
    const W = table.clientWidth, H = table.clientHeight;
    const out = [];
    {
      contentW = W;
      const aW = W - 32, aH = H - 28;
      let best = null;
      for (let cols = 4; cols <= 8; cols++) {
        const rows = Math.ceil(n / cols);
        let w = Math.min(132, (aW / cols) * 0.9);
        let h = w * 1.5;
        if (h + (rows - 1) * h * 0.6 > aH) { h = aH / (1 + (rows - 1) * 0.6); w = h / 1.5; }
        if (!best || w > best.w + 0.5) best = { cols, rows, w, h };
      }
      const { cols, rows, w, h } = best;
      const rowStep = rows > 1 ? Math.min(h * 1.08, (aH - h) / (rows - 1)) : 0;
      const colStep = Math.min(w * 1.14, aW / cols);
      const top = 14 + (aH - (h + rowStep * (rows - 1))) / 2 + h / 2;
      for (let k = 0; k < n; k++) {
        const r = Math.floor(k / cols), c = k % cols, inRow = Math.min(cols, n - r * cols);
        const j = Math.sin(k * 12.9898) * 43758.5453, jit = j - Math.floor(j);
        out.push({ x: W / 2 + (c - (inRow - 1) / 2) * colStep + (jit - 0.5) * 8, y: top + r * rowStep + (Math.cos(k * 7.1) * 4), r: (jit - 0.5) * 9, s: w / cw, z: k + 1 });
      }
    }
    inner.style.width = contentW + "px";
    table.classList.toggle("scroll", contentW > W + 1);
    return out;
  }
  function placeSlots() {
    order.forEach((i, k) => {
      const s = slots[k];
      place(i, { x: s.x, y: s.y, r: s.r, s: s.s, lift: 0 });
      els[i].style.zIndex = s.z;
    });
  }

  // ---------- dock ----------
  function dock(text, sub, buttons = []) {
    say.innerHTML = text + (sub ? `<small>${sub}</small>` : "");
    actions.replaceChildren(...buttons.map(([label, fn, ghost]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn appear" + (ghost ? " ghost" : ""); b.textContent = label;
      b.addEventListener("click", fn); return b;
    }));
  }
  function setPhase(p) {
    phase = p; stage.dataset.phase = p;
    const step = p === "deck" ? "deck" : p === "reveal" ? "reveal" : "choose";
    const seq = ["deck", "choose", "reveal"];
    document.querySelectorAll("#steps li").forEach((li) => {
      const d = seq.indexOf(li.dataset.s) - seq.indexOf(step);
      li.classList.toggle("on", d === 0); li.classList.toggle("done", d < 0);
    });
    $("restart").hidden = p === "deck";
    $("toMed").hidden = p !== "deck";
  }
  function deckDock() {
    dock("Halte das Deck gedrückt, um zu mischen.", "Lass los, wenn es sich richtig anfühlt.");
  }

  // ---------- shuffle: the deck washes out across the whole table, drifts, then settles into rows ----------
  let holding = false, holdStart = 0, minUntil = 0, raf = 0, washing = false, wash = [], wc = null;
  const ease = (x) => x * x * (3 - 2 * x);
  let tmo = 0;
  // rAF, with a timer fallback for throttled frames (e.g. embedded previews)
  const nextFrame = (fn) => { let done = false; const go = (t) => { if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(tmo); fn(performance.now()); }; raf = requestAnimationFrame(go); tmo = setTimeout(go, 40); };
  const stopFrames = () => { cancelAnimationFrame(raf); clearTimeout(tmo); };
  function startShuffle() {
    if (phase !== "deck" || washing) return;
    holding = true; washing = true; holdStart = performance.now(); minUntil = holdStart + 3000;
    hit.classList.add("held");
    stage.dataset.wash = "1";
    dock("Die Karten mischen sich …", "… solange du hältst.");
    if (reduced.matches) return;
    const c0 = deckCenter();
    slots = computeSlots();
    const W = table.clientWidth, H = table.clientHeight, sw = slots[0].s * 1.04;
    const m = (cw * sw * 1.8) / 2 * 0.62 + 8;
    wc = { c0, W, H, sw, hx: Math.max(20, W / 2 - m), hy: Math.max(20, H / 2 - m) };
    const TAU = Math.PI * 2;
    wash = els.map((_, i) => ({ base: { ...st[i] }, f1: rand(0.07, 0.12) * TAU, f2: rand(0.14, 0.22) * TAU, g1: rand(0.07, 0.12) * TAU, g2: rand(0.14, 0.22) * TAU,
      p1: rand(0, TAU), p2: rand(0, TAU), q1: rand(0, TAU), q2: rand(0, TAU), fr: rand(0.06, 0.14) * TAU, pr: rand(0, TAU), ra: rand(18, 50) * (Math.random() < 0.5 ? -1 : 1) }));
    inner.classList.add("no-anim");
    nextFrame(frame);
  }
  let settling = null;
  function washPos(i, t, a) {
    const { W, H, sw, hx, hy } = wc, w = wash[i], b = w.base;
    const nx = 0.62 * Math.sin(w.f1 * t + w.p1) + 0.38 * Math.sin(w.f2 * t + w.p2);
    const ny = 0.62 * Math.sin(w.g1 * t + w.q1) + 0.38 * Math.sin(w.g2 * t + w.q2);
    return { x: b.x + (W / 2 - b.x + hx * nx) * a, y: b.y + (H / 2 - b.y + hy * ny) * a, r: b.r + w.ra * Math.sin(w.fr * t + w.pr) * a, s: 1 + (sw - 1) * a, lift: 0 };
  }
  // Drift time slows down as cards settle, so motion decelerates instead of stopping.
  let tw = 0, lastNow = 0;
  function frame(now) {
    const dt = Math.min(0.034, (now - (lastNow || now)) / 1000); lastNow = now;
    const a = ease(Math.min(1, (now - holdStart) / 1600));
    if (!settling && !holding && now >= minUntil) beginSettle(now);
    if (settling) {
      const S = settling, g = clamp((now - S.start) / S.total, 0, 1);
      tw += dt * (1 - ease(g));
      let done = true;
      order.forEach((i, k) => {
        const p = clamp((now - S.start - S.delay[k]) / S.dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        if (p < 1) done = false;
        if (p > 0.9 && !S.landed[k]) { S.landed[k] = true; els[i].style.zIndex = slots[k].z; }
        const w = washPos(i, tw, a), sl = slots[k];
        place(i, { x: w.x + (sl.x - w.x) * e, y: w.y + (sl.y - w.y) * e, r: w.r + (sl.r - w.r) * e, s: w.s + (sl.s - w.s) * e, lift: 0 });
      });
      if (done) return finishSettle();
    } else {
      tw += dt;
      els.forEach((_, i) => place(i, washPos(i, tw, a)));
    }
    nextFrame(frame);
  }
  function stopShuffle() {
    if (!holding) return;
    holding = false;
    hit.classList.remove("held");
    if (minUntil - performance.now() > 400) dock("Die Karten mischen sich …", "Einen Moment noch.");
    if (reduced.matches) later(() => { shuffleArr(order); setPhase("spreading"); slots = computeSlots(); instant(placeSlots); finishSettle(); }, 300);
  }
  function beginSettle(now) {
    // Each slot takes the nearest drifting card, so paths stay short and rarely cross.
    const free = new Set(els.map((_, i) => i)), next = [];
    slots.forEach((sl) => {
      let best = -1, bd = Infinity;
      free.forEach((i) => { const d = (st[i].x - sl.x) ** 2 + (st[i].y - sl.y) ** 2; if (d < bd) { bd = d; best = i; } });
      free.delete(best); next.push(best);
    });
    order = next;
    els.forEach((el) => (el.style.zIndex = n + 1 + (parseInt(el.style.zIndex) || 0)));
    const dur = 1500, delay = order.map((_, k) => k * 45 + Math.random() * 120);
    settling = { start: now, dur, delay, total: dur + Math.max(...delay), landed: [] };
    setPhase("spreading");
    dock("Die Karten finden ihren Platz …");
  }
  function finishSettle() {
    stopFrames();
    settling = null; washing = false; shuffled = true; tw = 0; lastNow = 0;
    delete stage.dataset.wash;
    inner.classList.remove("no-anim");
    els.forEach((el) => (el.tabIndex = 0));
    order.forEach((i, k) => els[i].setAttribute("aria-label", `Verdeckte Karte ${k + 1} von ${n}`));
    setPhase("choose");
    chooseDock();
  }
  hit.addEventListener("pointerdown", (e) => { if (!e.isPrimary || e.button !== 0) return; e.preventDefault(); hit.setPointerCapture(e.pointerId); startShuffle(); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => hit.addEventListener(ev, stopShuffle));
  hit.addEventListener("keydown", (e) => { if ((e.code === "Space" || e.code === "Enter") && !e.repeat) { e.preventDefault(); startShuffle(); } });
  hit.addEventListener("keyup", (e) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); stopShuffle(); } });
  hit.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("blur", stopShuffle);

  function chooseDock() {
    dock("Wähle eine Karte, die dich anspricht.", "Tippe sie an, um sie aufzudecken.");
  }

  // ---------- choose ----------
  function select(i) {
    if (phase !== "choose") return;
    selected = i;
    order.forEach((j, k) => {
      const on = j === i;
      els[j].classList.toggle("sel", on);
      els[j].classList.toggle("dim", i !== null && !on);
      place(j, { lift: on ? -Math.round(ch * st[j].s * 0.16) : 0, s: on ? slots[k].s * 1.1 : slots[k].s });
      els[j].style.zIndex = on ? 500 : slots[k].z;
      els[j].setAttribute("aria-pressed", String(on));
    });
    if (i !== null) {
      const sc = table.scrollLeft, W = table.clientWidth, x = st[i].x;
      if (x < sc + 60 || x > sc + W - 60) table.scrollTo({ left: x - W / 2, behavior: reduced.matches ? "auto" : "smooth" });
    }
    chooseDock();
  }
    els.forEach((el, i) => {
    el.addEventListener("click", () => { if (phase !== "choose" || selected !== null) return; select(i); later(reveal, reduced.matches ? 0 : 280); });
    el.addEventListener("keydown", (e) => {
      if (phase !== "choose") return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const k = order.indexOf(i), nk = clamp(k + (e.key === "ArrowRight" ? 1 : -1), 0, n - 1);
        els[order[nk]].focus({ preventScroll: true });
      }
    });
  });

  // ---------- reveal ----------
  function reveal() {
    if (phase !== "choose" || selected === null) return;
    const i = selected, card = CARDS[i];
    setPhase("reveal");
    $("rImg").src = card.image;
    $("rImg").alt = card.title;
    $("rTitle").textContent = card.title;
    const paras = (card.meaning || "").split(/\n\s*\n/).filter(Boolean);
    $("rText").innerHTML = paras.length ? paras.map((p) => `<p>${p}</p>`).join("") : '<p class="empty">Raum für deine eigene Deutung. Was zeigt dir das Bild heute?</p>';
    $("rImpulse").hidden = !card.intention;
    $("rLabel").textContent = card.promptLabel || "Deine Intention";
    $("rIntention").textContent = card.intention || "";
    $("save").href = card.image;
    $("save").download = "nokmali-" + card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".webp";
    flip.classList.remove("turned");
    panel.classList.remove("show");
    reading.hidden = false;
    reading.scrollTop = 0;
    slot.style.transition = "none"; slot.style.transform = "none";
    const sr = slot.getBoundingClientRect(), tr = table.getBoundingClientRect(), s = st[i];
    const rad = (s.r * Math.PI) / 180;
    const cx = tr.left - table.scrollLeft + s.x - Math.sin(rad) * s.lift, cy = tr.top + s.y + Math.cos(rad) * s.lift;
    const scale = (cw * s.s) / sr.width;
    slot.style.transform = `translate(${cx - (sr.left + sr.width / 2)}px,${cy - (sr.top + sr.height / 2)}px) rotate(${s.r}deg) scale(${scale})`;
    els[i].style.transition = "none"; els[i].style.opacity = "0";
    const c = { x: table.scrollLeft + table.clientWidth / 2, y: table.clientHeight / 2 };
    order.forEach((j, k) => { if (j !== i) { els[j].style.transitionDelay = Math.abs(k - order.indexOf(i)) * 12 + "ms"; place(j, { ...stackT(k, c, j), s: 0.6 }); els[j].style.opacity = "0"; } });
    void slot.offsetWidth;
    const rm = reduced.matches;
    slot.style.transition = rm ? "none" : "transform .8s cubic-bezier(.2,.8,.2,1)";
    slot.style.transform = "none";
    later(() => flip.classList.add("turned"), rm ? 0 : 380);
    later(() => { $("cue").classList.add("show"); panel.classList.add("show"); panel.focus({ preventScroll: true }); $("rText").scrollTop = 0; }, rm ? 0 : 1050);
  }

  // ---------- reset ----------
  function reset() {
    clearTimers();
    stopFrames(); holding = false; washing = false; settling = null; tw = 0; lastNow = 0; delete stage.dataset.wash; inner.classList.remove("no-anim"); hit.classList.remove("held");
    reading.hidden = true; panel.classList.remove("show"); $("cue").classList.remove("show"); flip.classList.remove("turned");
    selected = null; shuffled = false; contentW = 0; slots = [];
    inner.style.width = ""; table.classList.remove("scroll"); table.scrollLeft = 0;
    setPhase("deck");
    instant(() => {
      els.forEach((el) => { el.classList.remove("sel", "dim"); el.style.transition = ""; el.style.transitionDelay = ""; el.style.opacity = "0"; el.tabIndex = -1; el.removeAttribute("aria-pressed"); el.removeAttribute("aria-label"); });
      layoutStack();
    });
    order.forEach((i, k) => { els[i].style.transitionDelay = (n - k) * 10 + "ms"; els[i].style.opacity = "1"; });
    later(() => els.forEach((el) => (el.style.transitionDelay = "")), 700);
    deckDock();
    hit.focus({ preventScroll: true });
  }
  $("again").addEventListener("click", reset);
  $("cue").addEventListener("click", () => reading.scrollTo({ top: panel.offsetTop - 12, behavior: reduced.matches ? "auto" : "smooth" }));
  $("restart").addEventListener("click", reset);

  // ---------- resize / tweaks ----------
  let rz;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => {
      if (phase === "deck") instant(layoutStack);
      else if (phase === "choose") instant(() => { measure(); slots = computeSlots(); placeSlots(); const s = selected; selected = null; if (s !== null) select(s); });
    });
  });
  setPhase("deck");
  document.fonts.ready.then(() => instant(layoutStack));
  instant(layoutStack);
  deckDock();
})();
