(() => {
  "use strict";

  const audio = document.querySelector("#meditation-audio");
  const player = document.querySelector("#player");
  const playerTitle = document.querySelector("#player-title");
  const message = document.querySelector("#player-message");
  const announcement = document.querySelector("#playback-status");
  const tracks = [...document.querySelectorAll(".meditation")];
  const available = tracks.filter(track => track.dataset.audioSrc.trim());
  const recordingNumber = document.body.dataset.recording;
  let current = null;
  let playRequest = 0;

  const titleOf = track => track.dataset.title || track.querySelector(".track-title").textContent.trim();

  function syncLinkedEntry() {
    tracks.forEach(track => track.classList.toggle("is-linked", recordingNumber ? track.id === `meditation-${recordingNumber}` : location.hash === `#${track.id}`));
  }

  function syncState() {
    tracks.forEach(track => {
      if (!track.dataset.audioSrc.trim()) return;
      const selected = track === current;
      const playing = selected && !audio.paused && !audio.ended;
      track.classList.toggle("is-active", selected);
      track.classList.toggle("is-playing", playing);
      track.querySelector(".track-button").setAttribute("aria-label", `${titleOf(track)} – ${playing ? "pausieren" : "anhören"}`);
      track.querySelector(".track-status").textContent = playing ? "Wird abgespielt" : selected ? (audio.ended ? "Erneut anhören" : "Pausiert") : "Jetzt anhören";
    });
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = current ? (audio.paused ? "paused" : "playing") : "none";
    }
  }

  async function play() {
    const request = ++playRequest;
    message.textContent = "";
    try {
      await audio.play();
    } catch (error) {
      if (request !== playRequest || error.name === "AbortError") return;
      message.textContent = error.name === "NotAllowedError"
        ? "Tippe auf die Wiedergabetaste im Player, um die Meditation zu starten."
        : "Die Aufnahme konnte gerade nicht geladen werden. Bitte versuche es noch einmal.";
    }
    if (request === playRequest) syncState();
  }

  function selectTrack(track) {
    if (current === track) {
      if (audio.paused) {
        if (audio.error) audio.load();
        void play();
      } else {
        ++playRequest;
        audio.pause();
      }
      return;
    }

    ++playRequest;
    audio.pause();
    current = track;
    audio.src = track.dataset.audioSrc.trim();
    playerTitle.textContent = `${track.querySelector(".track-number").textContent} · ${titleOf(track)}`;
    player.hidden = false;
    document.body.classList.add("has-player");
    updatePlayerSpace();
    // Keep each numbered QR page's clean URL. Loading it never autoplays.
    if (!recordingNumber) history.replaceState(null, "", `#${track.id}`);
    syncLinkedEntry();
    if ("mediaSession" in navigator && "MediaMetadata" in window) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: titleOf(track), artist: "Nokmali", album: "Dein Rauhnächte-Journal" });
    }
    announcement.textContent = `${titleOf(track)} ausgewählt. Der Audioplayer ist am unteren Bildschirmrand.`;
    syncState();
    void play();
  }

  function updatePlayerSpace() {
    document.body.style.setProperty("--player-height", `${player.offsetHeight}px`);
  }

  available.forEach(track => {
    const button = track.querySelector(".track-button");
    button.disabled = false;
    button.setAttribute("aria-controls", "player");
    button.addEventListener("click", () => selectTrack(track));
  });

  if (available.length === tracks.length) {
    document.querySelector(".availability-note").textContent = recordingNumber
      ? "Tippe auf die Wiedergabetaste, um die Meditation anzuhören. Nimm dir die Zeit, die du brauchst."
      : "Wähle eine Meditation und tippe auf den Titel, um sie anzuhören. Nimm dir die Zeit, die du brauchst.";
  }

  ["play", "pause", "ended"].forEach(event => audio.addEventListener(event, syncState));
  audio.addEventListener("playing", () => { message.textContent = ""; });
  audio.addEventListener("error", () => {
    if (!current) return;
    message.textContent = "Die Aufnahme konnte gerade nicht geladen werden. Bitte prüfe deine Verbindung und tippe zum erneuten Laden auf die Meditation.";
    syncState();
  });

  document.querySelector(".close-player").addEventListener("click", () => {
    const previous = current;
    ++playRequest;
    audio.pause();
    current = null;
    audio.removeAttribute("src");
    audio.load();
    player.hidden = true;
    document.body.classList.remove("has-player");
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
    announcement.textContent = "Wiedergabe beendet.";
    syncState();
    if (previous) previous.querySelector(".track-button").focus({ preventScroll: true });
  });

  // Keep the last entries accessible above the player, including at larger text sizes.
  if ("ResizeObserver" in window) new ResizeObserver(updatePlayerSpace).observe(player);
  window.addEventListener("resize", updatePlayerSpace);
  window.addEventListener("hashchange", syncLinkedEntry);
  document.documentElement.classList.add("meditation-ready");
  syncLinkedEntry();
  syncState();
})();
