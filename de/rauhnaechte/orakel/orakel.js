(() => {
  const deck = window.oracleDeck;
  const byId = (id) => document.getElementById(id);
  const choices = byId("card-choices");
  let phase = "closed";
  let exportFile = null;
  let exportURL = null;
  let exportVersion = 0;
  let revealTimer;
  let shuffleTimer;
  let movements = [];
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
    const image = document.createElement("img"); image.src = card.image; image.alt = ""; image.loading = "lazy";
    const title = document.createElement("span"); title.textContent = card.title;
    button.append(image, title);
    button.addEventListener("click", () => browseCard(index));
    byId("deck-gallery").append(button);
  });
  byId("browse-deck").addEventListener("click", () => {
    const gallery = byId("deck-gallery");
    gallery.hidden = !gallery.hidden;
    byId("browse-deck").setAttribute("aria-expanded", String(!gallery.hidden));
    byId("browse-deck").textContent = gallery.hidden ? "Alle Karten ansehen" : "Kartenübersicht schließen";
  });
  byId("previous-card").addEventListener("click", () => browseCard(browseIndex - 1));
  byId("next-card").addEventListener("click", () => browseCard(browseIndex + 1));
  function stopMovement() {
    clearInterval(shuffleTimer);
    movements.forEach((animation) => {
      animation.commitStyles();
      animation.cancel();
    });
    movements = [];
  }
  function scatter() {
    stopMovement();
    const buttons = [...choices.children];
    const columns = choices.clientWidth < 450 ? 3 : 4;
    const rows = Math.ceil(buttons.length / columns);
    const slots = buttons.map((_, i) => i);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    buttons.forEach((button, i) => {
      const slot = slots[i];
      const cellWidth = choices.clientWidth / columns;
      const cellHeight = choices.clientHeight / rows;
      const x = (slot % columns + .5) * cellWidth - button.offsetWidth / 2 + (Math.random() - .5) * 12;
      const y = (Math.floor(slot / columns) + .5) * cellHeight - button.offsetHeight / 2 + (Math.random() - .5) * 14;
      const transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 24 - 12}deg)`;
      if (reducedMotion.matches) {
        // Keep the table still for visitors who prefer reduced motion.
        if (!button.style.transform) button.style.transform = transform;
      } else {
        const animation = button.animate([
          { transform: getComputedStyle(button).transform }, { transform }
        ], { duration: 1400, easing: "ease-in-out", fill: "forwards" });
        movements.push(animation);
      }
    });
    shuffleTimer = setInterval(scatter, 1400);
  }
  if (deck.backImage) {
    document.documentElement.style.setProperty("--back-image", `url(${JSON.stringify(deck.backImage)})`);
    document.querySelectorAll(".back-mark, .back-word").forEach((element) => { element.hidden = true; });
  }
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
      artwork.src = card.image;
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
    prepareExport(card);
    choices.hidden = true;
    byId("stop-shuffle").hidden = true;
    byId("instruction").textContent = "Deine Karte darf dich in deinem Rhythmus begleiten.";
    byId("front-title").textContent = card.title;
    byId("card-label").textContent = card.title;
    byId("card-title").textContent = card.title;
    byId("prompt-label").textContent = card.promptLabel || "Deine Intention";
    byId("card-meaning").textContent = card.meaning;
    byId("card-intention").textContent = card.intention;
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
      button.setAttribute("aria-label", `Verdeckte Karte ${index + 1} wählen`);
      if (!deck.backImage) button.innerHTML = '<span class="back-mark" aria-hidden="true">✧</span><span class="back-word" aria-hidden="true">Nokmali</span>';
      button.addEventListener("click", () => draw(card));
      choices.append(button);
    });
    byId("open-deck").setAttribute("aria-expanded", "true");
    byId("closed-deck").hidden = true;
    choices.hidden = false;
    byId("stop-shuffle").hidden = false;
    scatter();
    movements.forEach((animation) => animation.finish());
    stopMovement();
    byId("instruction").textContent = "Zum Mischen gedrückt halten. Loslassen und eine Karte wählen.";
  }
  let heldPointer = null;
  let heldKey = null;
  function startShuffle() {
    if (phase === "closed") openDeck();
    if (phase !== "choosing") return;
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
    byId("instruction").textContent = "Welche Karte zieht dich an? Wähle eine Karte. Zum Weitermischen erneut gedrückt halten.";
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
    if (phase === "choosing") {
      movements.forEach((animation) => animation.finish());
      stopMovement();
    }
  });
  byId("reset").addEventListener("click", () => {
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
    byId("instruction").textContent = "Halte das Kartendeck zum Mischen gedrückt. Lass los, um eine Karte zu wählen.";
    byId("open-deck").setAttribute("aria-expanded", "false");
    byId("open-deck").focus({ preventScroll: true });
  });
})();
