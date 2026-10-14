(() => {
  const deck = window.oracleDeck;
  const byId = (id) => document.getElementById(id);
  const choices = byId("card-choices");
  let phase = "closed";
  let revealTimer;
  let shuffleTimer;
  let movements = [];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
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
  function draw(card) {
    if (phase !== "choosing") return;
    phase = "revealing";
    choices.hidden = true;
    byId("instruction").textContent = "Deine Karte darf dich heute begleiten.";
    byId("front-title").textContent = card.title;
    byId("card-title").textContent = card.title;
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
  byId("open-deck").addEventListener("click", () => {
    if (phase !== "closed") return;
    phase = "shuffling";
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
      button.disabled = true;
      button.setAttribute("aria-label", `Verdeckte Karte ${index + 1} wählen`);
      if (!deck.backImage) button.innerHTML = '<span class="back-mark" aria-hidden="true">✧</span><span class="back-word" aria-hidden="true">Nokmali</span>';
      button.addEventListener("click", () => draw(card));
      choices.append(button);
    });
    byId("open-deck").setAttribute("aria-expanded", "true");
    byId("closed-deck").hidden = true;
    choices.hidden = false;
    byId("stop-shuffle").hidden = false;
    byId("instruction").textContent = "Die Karten mischen sich. Stoppe, wenn es sich für dich richtig anfühlt.";
    scatter();
    byId("stop-shuffle").focus({ preventScroll: true });
  });
  byId("stop-shuffle").addEventListener("click", () => {
    if (phase !== "shuffling") return;
    stopMovement();
    phase = "choosing";
    byId("stop-shuffle").hidden = true;
    [...choices.children].forEach((button) => { button.disabled = false; });
    byId("instruction").textContent = "Welche Karte zieht dich an? Wähle eine Karte.";
    choices.firstElementChild.focus({ preventScroll: true });
  });
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
    clearTimeout(revealTimer);
    stopMovement();
    byId("stop-shuffle").hidden = true;
    phase = "closed";
    byId("result").hidden = true;
    byId("meaning").hidden = true;
    byId("reveal-card").classList.remove("is-revealed");
    choices.hidden = true;
    byId("closed-deck").hidden = false;
    byId("instruction").textContent = "Berühre das Kartendeck, um es zu öffnen.";
    byId("open-deck").setAttribute("aria-expanded", "false");
    byId("open-deck").focus({ preventScroll: true });
  });
})();
