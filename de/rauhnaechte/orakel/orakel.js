(() => {
  const deck = window.oracleDeck;
  const byId = (id) => document.getElementById(id);
  const choices = byId("card-choices");
  let phase = "closed";
  let exportFile = null;
  let exportCard = null;
  let exportURL = null;
  let exportVersion = 0;
  let revealTimer;
  let shuffleTimer;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Remove data left by the retired browser-history feature.
  try { localStorage.removeItem("nokmali-oracle-cards-v1"); } catch {}
  let browseIndex = null;
  function browseCard(index) {
    browseIndex = (index + deck.cards.length) % deck.cards.length;
    clearTimeout(revealTimer);
    stopMovement();
    byId("reveal-card").classList.remove("is-revealed");
    byId("meaning").hidden = true;
    byId("closed-deck").hidden = true;
    phase = "choosing";
    draw(deck.cards[browseIndex]);
    byId("browse-controls").hidden = false;
    byId("browse-position").textContent = (browseIndex + 1) + " / " + deck.cards.length;
    [...byId("deck-gallery").children].forEach((button, i) => button.setAttribute("aria-pressed", String(i === browseIndex)));
    byId("result").scrollIntoView({ block: "start", behavior: "instant" });
  }
  deck.cards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "gallery-card" + (card.fullDesign ? " finished-design" : "");
    button.setAttribute("aria-pressed", "false");
    const image = document.createElement("img");
    image.dataset.src = card.thumbnail || card.image;
    image.alt = ""; image.loading = "lazy"; image.decoding = "async";
    image.width = 320; image.height = 480;
    const title = document.createElement("span"); title.textContent = card.title;
    button.append(image, title);
    button.addEventListener("click", () => browseCard(index));
    byId("deck-gallery").append(button);
  });
  byId("browse-deck").addEventListener("click", () => {
    const gallery = byId("deck-gallery");
    gallery.hidden = !gallery.hidden;
    if (!gallery.hidden) gallery.querySelectorAll("img[data-src]").forEach((image) => {
      image.src = image.dataset.src;
      delete image.dataset.src;
    });
    byId("browse-deck").setAttribute("aria-expanded", String(!gallery.hidden));
    byId("browse-deck").textContent = gallery.hidden ? "Alle Karten ansehen" : "Kartenübersicht schließen";
  });
  byId("previous-card").addEventListener("click", () => browseCard(browseIndex - 1));
  byId("next-card").addEventListener("click", () => browseCard(browseIndex + 1));
  function stopMovement() {
    cancelAnimationFrame(shuffleTimer);
  }
  function scatter() {
    stopMovement();
    const buttons = [...choices.children];
    const states = buttons.map((button, index) => {
      // Reserve room for the corners at every angle.
      const radius = Math.hypot(button.offsetWidth, button.offsetHeight) / 2;
      const minX = radius - button.offsetWidth / 2;
      const minY = radius - button.offsetHeight / 2;
      const maxX = Math.max(minX, choices.clientWidth - radius - button.offsetWidth / 2);
      const maxY = Math.max(minY, choices.clientHeight - radius - button.offsetHeight / 2);
      const matrix = new DOMMatrix(getComputedStyle(button).transform);
      const placed = Boolean(button.style.transform);
      const state = {
        button, minX, minY, maxX, maxY,
        x: placed ? Math.max(minX, Math.min(maxX, matrix.e)) : minX + Math.random() * (maxX - minX),
        y: placed ? Math.max(minY, Math.min(maxY, matrix.f)) : minY + Math.random() * (maxY - minY),
        angle: placed ? Math.atan2(matrix.b, matrix.a) * 180 / Math.PI : Math.random() * 76 - 38,
        vx: 0, vy: 0, spin: 0, targetSpin: 0, nextTurn: 0
      };
      button.style.zIndex = index + 1;
      button.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.angle}deg)`;
      return state;
    });
    if (reducedMotion.matches || phase !== "shuffling") return;
    let previousTime;
    function move(time) {
      const dt = Math.min((time - (previousTime ?? time - 16)) / 1000, .04);
      previousTime = time;
      states.forEach((state) => {
        if (time >= state.nextTurn) {
          state.targetX = state.minX + Math.random() * (state.maxX - state.minX);
          state.targetY = state.minY + Math.random() * (state.maxY - state.minY);
          state.targetSpin = (Math.random() - .5) * 150;
          state.nextTurn = time + 380 + Math.random() * 550;
          state.button.style.zIndex = 1 + Math.floor(Math.random() * buttons.length);
        }
        const dx = state.targetX - state.x;
        const dy = state.targetY - state.y;
        const distance = Math.hypot(dx, dy) || 1;
        const speed = Math.min(460, choices.clientWidth * .8);
        const blend = 1 - Math.exp(-4 * dt);
        // Steer gradually: preserve momentum across independent direction changes.
        state.vx += (dx / distance * speed - state.vx) * blend;
        state.vy += (dy / distance * speed - state.vy) * blend;
        state.spin += (state.targetSpin - state.spin) * blend;
        state.x += state.vx * dt;
        state.y += state.vy * dt;
        if (state.x < state.minX || state.x > state.maxX) {
          state.x = Math.max(state.minX, Math.min(state.maxX, state.x));
          state.vx *= -.7;
        }
        if (state.y < state.minY || state.y > state.maxY) {
          state.y = Math.max(state.minY, Math.min(state.maxY, state.y));
          state.vy *= -.7;
        }
        state.angle += state.spin * dt;
        state.button.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.angle}deg)`;
      });
      shuffleTimer = requestAnimationFrame(move);
    }
    shuffleTimer = requestAnimationFrame(move);
  }
  if (deck.backImage) {
    document.documentElement.classList.add("has-card-cover");
    document.documentElement.style.setProperty("--back-image", `url(${JSON.stringify(deck.backImage)})`);
    document.querySelectorAll(".back-mark, .back-word").forEach((element) => { element.hidden = true; });
  }
  // Build the closed deck from the same number of separate cards as the draw.
  const closedDeckButton = byId("open-deck");
  const stackLayers = document.createDocumentFragment();
  deck.cards.forEach((_, index) => {
    const layer = document.createElement("span");
    layer.className = "deck-layer card-back";
    layer.setAttribute("aria-hidden", "true");
    const x = Math.sin(index * 2.4) * 1.2;
    const y = Math.cos(index * 1.7) * .8;
    const angle = Math.sin(index * 1.9) * .45;
    layer.style.transform = `translate3d(${x}px, ${y}px, ${index * .85}px) rotate(${angle}deg)`;
    stackLayers.append(layer);
  });
  closedDeckButton.replaceChildren(stackLayers);
  function clearExport() {
    exportVersion++;
    exportFile = null;
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = null;
    byId("save-card").disabled = true;
    byId("download-card").hidden = true;
    byId("download-card").removeAttribute("href");
    byId("save-status").textContent = "";
  }
  async function prepareExport(card) {
    clearExport();
    const version = exportVersion;
    try {
      const artwork = new Image();
      artwork.src = card.originalImage || card.image;
      await Promise.all([artwork.decode(), document.fonts.ready]);
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1800;
      const ctx = canvas.getContext("2d");
      if (card.fullDesign) {
        canvas.width = artwork.naturalWidth;
        canvas.height = artwork.naturalHeight;
        ctx.drawImage(artwork, 0, 0);
      } else {
      ctx.fillStyle = "#f8f1e2";
      ctx.fillRect(0, 0, 1200, 1800);
      ctx.strokeStyle = "#b59a63";
      ctx.lineWidth = 3;
      ctx.strokeRect(38, 38, 1124, 1724);
      ctx.lineWidth = 1;
      ctx.strokeRect(58, 58, 1084, 1684);
      ctx.textAlign = "center";
      ctx.fillStyle = "#786846";
      ctx.font = '24px "Avenir Next", sans-serif';
      ctx.fillText("N O K M A L I  ·  R A U H N Ä C H T E", 600, 136);
      const scale = Math.min(960 / artwork.naturalWidth, 960 / artwork.naturalHeight);
      const width = artwork.naturalWidth * scale;
      const height = artwork.naturalHeight * scale;
      ctx.drawImage(artwork, (1200 - width) / 2, 200 + (960 - height) / 2, width, height);
      ctx.fillStyle = "#234b44";
      ctx.font = '76px "Fluxisch Else", sans-serif';
      ctx.fillText(card.title, 600, 1260, 1000);
      ctx.fillStyle = "#786846";
      ctx.font = '24px "Avenir Next", sans-serif';
      ctx.fillText((card.promptLabel || "Deine Intention").toUpperCase(), 600, 1340);
      ctx.fillStyle = "#234b44";
      ctx.font = '42px "Fluxisch Else", sans-serif';
      const lines = [];
      let line = "";
      for (const word of card.intention.split(/\s+/)) {
        const next = line ? line + " " + word : word;
        if (line && ctx.measureText(next).width > 930) { lines.push(line); line = word; }
        else line = next;
      }
      if (line) lines.push(line);
      lines.forEach((text, index) => ctx.fillText(text, 600, 1450 + index * 60));
      ctx.fillStyle = "#927746";
      ctx.font = '32px serif';
      ctx.fillText("◇", 600, 1650);
      ctx.font = '22px "Avenir Next", sans-serif';
      ctx.fillText("nokmali.com", 600, 1700);
      }
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG export failed")), "image/png"));
      if (version !== exportVersion) return;
      const filename = "nokmali-impuls-" + card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png";
      exportFile = new File([blob], filename, { type: "image/png" });
      exportURL = URL.createObjectURL(blob);
      byId("download-card").href = exportURL;
      byId("download-card").download = filename;
      byId("save-card").disabled = false;
    } catch (error) {
      if (version !== exportVersion) return;
      byId("save-status").textContent = location.protocol === "file:"
        ? "Zum Speichern bitte das Orakel über die Website oder eine lokale Vorschau öffnen."
        : "Das Kartenbild konnte nicht erstellt werden. Bitte lade die Seite erneut.";
    }
  }
  byId("save-card").addEventListener("click", async () => {
    if (!exportFile && exportCard) await prepareExport(exportCard);
    if (!exportFile) return;
    const files = [exportFile];
    if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({ files });
        byId("save-status").textContent = "";
      } catch (error) {
        if (error.name === "AbortError") return;
        byId("download-card").hidden = false;
        byId("save-status").textContent = "Teilen ist gerade nicht möglich. Du kannst das Bild herunterladen.";
      }
    } else {
      byId("download-card").hidden = false;
      byId("download-card").click();
      byId("save-status").textContent = "Du kannst das Kartenbild speichern und weiterschicken.";
    }
  });
  function draw(card) {
    if (phase !== "choosing") return;
    byId("browse-controls").hidden = true;
    phase = "revealing";
    byId("reveal-card").classList.toggle("finished-design", Boolean(card.fullDesign));
    clearExport();
    exportCard = card;
    byId("save-card").disabled = false;
    choices.hidden = true;
    byId("stop-shuffle").hidden = true;
    byId("instruction").textContent = "Deine Karte darf dich in deinem Rhythmus begleiten.";
    byId("front-title").textContent = card.title;
    byId("card-label").textContent = card.title;
    byId("card-title").textContent = card.title;
    byId("prompt-label").textContent = card.promptLabel || "Deine Intention";
    byId("card-meaning").textContent = card.meaning;
    byId("card-meaning").hidden = !card.meaning;
    byId("prompt-label").hidden = !card.intention;
    byId("card-intention").textContent = card.intention;
    byId("card-intention").hidden = !card.intention;
    const image = byId("card-art");
    image.hidden = true;
    byId("front-placeholder").hidden = false;
    image.onload = () => { image.hidden = false; byId("front-placeholder").hidden = true; };
    image.onerror = () => { image.hidden = true; byId("front-placeholder").hidden = false; };
    if (card.image) image.src = card.image;
    else image.removeAttribute("src");
    byId("result").hidden = false;
    // Allow the back to paint before starting the turn.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      byId("reveal-card").classList.add("is-revealed");
      revealTimer = setTimeout(() => {
        phase = "revealed";
        byId("meaning").hidden = false;
        byId("meaning").focus({ preventScroll: true });
      }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700);
    }));
  }
  const choosingInstruction = "Verschiebe die Karten auf dem Tisch. Doppeltippen oder doppelklicken zum Aufdecken. Mit der Tastatur: Enter oder Leertaste.";
  let lastTap = null;
  let topCardLayer = 10;
  function makeCardMovable(button, card) {
    let drag = null;
    const cancelDrag = () => {
      if (!drag) return;
      const pointerId = drag.pointerId;
      drag = null;
      lastTap = null;
      button.classList.remove("is-dragging");
      if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
    };
    button.addEventListener("pointerdown", (event) => {
      if (phase !== "choosing" || !event.isPrimary || event.button !== 0 || drag) return;
      event.preventDefault();
      button.focus({ preventScroll: true });
      const matrix = new DOMMatrix(getComputedStyle(button).transform);
      drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
        x: matrix.e, y: matrix.f, angle: Math.atan2(matrix.b, matrix.a), moved: false };
      button.style.zIndex = ++topCardLayer;
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 7) return;
      drag.moved = true;
      lastTap = null;
      button.classList.add("is-dragging");
      const halfWidth = (button.offsetWidth * Math.abs(Math.cos(drag.angle)) + button.offsetHeight * Math.abs(Math.sin(drag.angle))) / 2;
      const halfHeight = (button.offsetHeight * Math.abs(Math.cos(drag.angle)) + button.offsetWidth * Math.abs(Math.sin(drag.angle))) / 2;
      const minX = halfWidth - button.offsetWidth / 2;
      const minY = halfHeight - button.offsetHeight / 2;
      const x = Math.max(minX, Math.min(choices.clientWidth - halfWidth - button.offsetWidth / 2, drag.x + dx));
      const y = Math.max(minY, Math.min(choices.clientHeight - halfHeight - button.offsetHeight / 2, drag.y + dy));
      button.style.transform = `translate(${x}px, ${y}px) rotate(${drag.angle}rad)`;
    });
    button.addEventListener("pointerup", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const moved = drag.moved;
      drag = null;
      button.classList.remove("is-dragging");
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
      if (moved || phase !== "choosing") { lastTap = null; return; }
      const now = performance.now();
      if (lastTap && lastTap.button === button && now - lastTap.time < 450 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 24) {
        lastTap = null;
        draw(card);
      } else lastTap = { button, time: now, x: event.clientX, y: event.clientY };
    });
    button.addEventListener("pointercancel", cancelDrag);
    button.addEventListener("lostpointercapture", cancelDrag);
    button.addEventListener("keydown", (event) => {
      if (event.code !== "Enter" && event.code !== "Space") return;
      event.preventDefault();
      if (!event.repeat) { lastTap = null; draw(card); }
    });
    // Assistive-technology activation remains a single action.
    button.addEventListener("click", (event) => {
      if (event.detail === 0) { lastTap = null; draw(card); }
    });
    button.addEventListener("contextmenu", (event) => event.preventDefault());
    button.addEventListener("dragstart", (event) => event.preventDefault());
  }
  function openDeck() {
    if (phase !== "closed") return;
    phase = "choosing";
    const shuffled = [...deck.cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    choices.replaceChildren();
    shuffled.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice card-back";
      button.disabled = false;
      button.setAttribute("aria-label", `Verdeckte Karte ${index + 1}: verschieben oder doppeltippen zum Aufdecken; mit der Tastatur Enter drücken`);
      if (!deck.backImage) button.innerHTML = '<span class="back-mark" aria-hidden="true">✧</span><span class="back-word" aria-hidden="true">Nokmali</span>';
      button.setAttribute("aria-describedby", "instruction");
      makeCardMovable(button, card);
      choices.append(button);
    });
    byId("open-deck").setAttribute("aria-expanded", "true");
    byId("closed-deck").hidden = true;
    choices.hidden = false;
    byId("stop-shuffle").hidden = false;
    scatter();
    stopMovement();
    byId("instruction").textContent = choosingInstruction;
  }
  let heldPointer = null;
  let heldKey = null;
  function startShuffle() {
    if (phase === "closed") openDeck();
    if (phase !== "choosing") return;
    lastTap = null;
    phase = "shuffling";
    [...choices.children].forEach((button) => { button.disabled = true; });
    byId("stop-shuffle").setAttribute("aria-pressed", "true");
    byId("instruction").textContent = "Die Karten mischen sich, solange du gedrückt hältst.";
    scatter();
  }
  function releaseShuffle() {
    heldPointer = null;
    heldKey = null;
    if (phase !== "shuffling") return;
    stopMovement();
    phase = "choosing";
    byId("stop-shuffle").setAttribute("aria-pressed", "false");
    [...choices.children].forEach((button) => { button.disabled = false; });
    byId("instruction").textContent = choosingInstruction;
  }
  [byId("open-deck"), byId("stop-shuffle")].forEach((control) => {
    control.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || heldPointer !== null) return;
      event.preventDefault();
      heldPointer = event.pointerId;
      startShuffle();
      byId("stop-shuffle").focus({ preventScroll: true });
    });
    control.addEventListener("keydown", (event) => {
      if (event.code !== "Space" && event.code !== "Enter") return;
      event.preventDefault();
      if (event.repeat || heldKey !== null) return;
      heldKey = event.code;
      startShuffle();
      byId("stop-shuffle").focus({ preventScroll: true });
    });
    control.addEventListener("click", (event) => {
      // Assistive technology can open the deck without a pointer or key hold.
      event.preventDefault();
      if (phase === "closed") openDeck();
    });
    control.addEventListener("contextmenu", (event) => event.preventDefault());
  });
  window.addEventListener("pointerup", (event) => {
    if (event.pointerId === heldPointer) releaseShuffle();
  });
  window.addEventListener("pointercancel", (event) => {
    if (event.pointerId === heldPointer) releaseShuffle();
  });
  window.addEventListener("keyup", (event) => {
    if (event.code === heldKey) { event.preventDefault(); releaseShuffle(); }
  });
  window.addEventListener("blur", releaseShuffle);
  document.addEventListener("visibilitychange", () => { if (document.hidden) releaseShuffle(); });
  window.addEventListener("resize", () => {
    if (phase !== "choosing" && phase !== "shuffling") return;
    [...choices.children].forEach((button) => { button.style.transform = ""; });
    scatter();
    if (phase === "choosing") stopMovement();
  });
  byId("reset").addEventListener("click", () => {
    exportCard = null;
    clearExport();
    browseIndex = null;
    byId("browse-controls").hidden = true;
    [...byId("deck-gallery").children].forEach((button) => button.setAttribute("aria-pressed", "false"));
    clearTimeout(revealTimer);
    stopMovement();
    byId("stop-shuffle").hidden = true;
    phase = "closed";
    byId("result").hidden = true;
    byId("meaning").hidden = true;
    byId("reveal-card").classList.remove("is-revealed");
    choices.hidden = true;
    byId("closed-deck").hidden = false;
    byId("instruction").textContent = "Halte das Kartendeck zum Mischen gedrückt. Lass los, verschiebe die Karten und tippe zweimal auf eine Karte, um sie aufzudecken.";
    byId("open-deck").setAttribute("aria-expanded", "false");
    byId("open-deck").focus({ preventScroll: true });
  });
})();
