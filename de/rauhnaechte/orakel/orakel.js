(() => {
  const deck = window.oracleDeck;
  const byId = (id) => document.getElementById(id);
  const choices = byId("card-choices");
  let phase = "closed";
  let revealTimer;
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
      button.setAttribute("aria-label", `Verdeckte Karte ${index + 1} wählen`);
      if (!deck.backImage) button.innerHTML = '<span class="back-mark" aria-hidden="true">✧</span><span class="back-word" aria-hidden="true">Nokmali</span>';
      button.addEventListener("click", () => draw(card));
      choices.append(button);
    });
    byId("open-deck").setAttribute("aria-expanded", "true");
    byId("closed-deck").hidden = true;
    choices.hidden = false;
    byId("instruction").textContent = "Welche Karte zieht dich an? Wähle eine Karte.";
    choices.firstElementChild.focus({ preventScroll: true });
  });
  byId("reset").addEventListener("click", () => {
    clearTimeout(revealTimer);
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
