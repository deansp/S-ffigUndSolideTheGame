const messageText = document.querySelector("#messageText");
const messageBox = document.querySelector("#messageBox");
const localFeedback = document.querySelector("#localFeedback");
const storyOverlay = document.querySelector("#storyOverlay");
const storyText = document.querySelector("#storyText");
const boardOverlay = document.querySelector("#boardOverlay");
const posterOverlay = document.querySelector("#posterOverlay");
const stage = document.querySelector("#stage");
const helpButton = document.querySelector("#helpButton");
const musicButton = document.querySelector("#musicButton");
const restartButton = document.querySelector("#restartButton");
const backgroundMusic = document.querySelector("#backgroundMusic");
const rotateHint = document.querySelector("#rotateHint");
const rotateHintClose = document.querySelector("#rotateHintClose");
const hotspots = document.querySelectorAll(".hotspot");
const beerButtons = document.querySelectorAll(".beer");
const songSteps = document.querySelectorAll(".song-step");

const startMessage =
  "Werd kreativ!";

const beatBlockMessage = "Erstmal brauch ich n fetten Beat, sonst macht es keinen Sinn.";
const neededBeers = 5;
const introStory = `Der Proberaum riecht nach kaltem Bier, Staub und schlechten Entscheidungen.
Seit Wochen läuft nichts mehr rund. Jede Probe endet gleich: Diskussionen. Genervte Blicke. Türen knallen.
Vielleicht hat diese Band einfach ihren letzten Akkord gespielt.
Oder vielleicht fehlt nur noch ein verdammter Song.
Ein Hit. Kein Radioschrott. Sondern ein Song, der laut genug ist, um jeden Streit zu übertönen.
Jetzt bist du dran.
Bring die Instrumente wieder zum Laufen, um den Song deines Lebens zu schreiben.
Vielleicht wird daraus der größte Punk-Hit aller Zeiten.
Vielleicht rettest du die Band.
Vielleicht wirst du zur Legende.
Oder du scheiterst glorreich.`;
const beatStory = `Der Beat steht.
Unglaublich.
Irgendwie hast du zwischen Hopfen, Chaos und völliger Selbstüberschätzung tatsächlich einen brauchbaren Schlagzeugbeat zusammengeklickt.
Der Proberaum wackelt, die Wände vibrieren und zum ersten Mal seit Wochen nickt niemand genervt.
Ein guter Anfang.
Aber ein Beat allein macht noch keinen Hit.`;

const items = {
  beers: "Biere intus",
  beat: "Fetter Beat",
  guitar: "Gitarre",
  cable: "Kabel",
  riff: "Riff-Idee",
  groove: "Drum-Groove",
  lyric: "Textzeile",
  tone: "Brettsound",
};

let state = {
  inventory: [],
  solved: [],
  beersDrunk: 0,
  drunkBeers: [],
  isHelping: false,
  musicWanted: true,
  storyOpen: false,
  beatStorySeen: false,
  continuationQueued: false,
  won: false,
};

let feedbackTimer = null;
let lastPointerEvent = null;
let lastPointerPoint = null;

function has(item) {
  return state.inventory.includes(item);
}

function addItem(item) {
  if (!has(item)) {
    state.inventory.push(item);
  }
}

function solve(action) {
  if (!state.solved.includes(action)) {
    state.solved.push(action);
  }
}

function isMobileFeedbackMode() {
  return window.matchMedia("(hover: none) and (pointer: coarse), (max-width: 620px)").matches;
}

function rememberPointerPoint(event) {
  lastPointerPoint = {
    clientX: event.clientX,
    clientY: event.clientY,
  };
}

function showLocalFeedback(text, point) {
  if (!point) {
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const feedbackWidth = 120;
  const feedbackHeight = 34;
  const x = ((point.clientX - stageRect.left) / stageRect.width) * 100;
  const y = ((point.clientY - stageRect.top) / stageRect.height) * 100;
  const minX = (feedbackWidth / stageRect.width) * 50;
  const maxX = 100 - minX;
  const minY = (feedbackHeight / stageRect.height) * 100;
  const maxY = 96;
  const clampedX = Math.min(Math.max(x, minX), maxX);
  const clampedY = Math.min(Math.max(y, minY), maxY);

  localFeedback.textContent = text;
  localFeedback.style.left = `${clampedX}%`;
  localFeedback.style.top = `${clampedY}%`;
  localFeedback.classList.add("is-visible");
  stage.classList.add("has-local-feedback");

  window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => {
    localFeedback.classList.remove("is-visible");
  }, 1800);
}

function show(text, isWin = false, mobileText = text) {
  messageText.textContent = text;
  messageBox.classList.toggle("is-win", isWin);

  if (isMobileFeedbackMode() && lastPointerPoint) {
    showLocalFeedback(mobileText, lastPointerPoint);
  }
}

function showStory(text) {
  state.storyOpen = true;
  storyText.textContent = text;
  storyOverlay.classList.add("is-visible");
}

function hideStory() {
  state.storyOpen = false;
  storyOverlay.classList.remove("is-visible");

  if (state.continuationQueued) {
    state.continuationQueued = false;
    showStory("Fortsetzung folgt");
  }
}

function showBoardOverlay() {
  boardOverlay.classList.add("is-visible");
}

function hideBoardOverlay() {
  boardOverlay.classList.remove("is-visible");
}

function showPosterOverlay() {
  posterOverlay.classList.add("is-visible");
}

function hidePosterOverlay() {
  posterOverlay.classList.remove("is-visible");
}

async function startBackgroundMusic() {
  if (!state.musicWanted || !backgroundMusic.paused) {
    return;
  }

  try {
    backgroundMusic.volume = 0.45;
    await backgroundMusic.play();
  } catch {
    render();
  }
}

function stopBackgroundMusic() {
  backgroundMusic.pause();
}

function render() {
  stage.classList.toggle("is-helping", state.isHelping);
  helpButton.setAttribute("aria-pressed", String(state.isHelping));
  helpButton.setAttribute("aria-label", state.isHelping ? "Hilfe ausschalten" : "Hilfe einschalten");
  musicButton.setAttribute("aria-pressed", String(state.musicWanted));
  musicButton.setAttribute("aria-label", state.musicWanted ? "Musik ausschalten" : "Musik einschalten");
  musicButton.classList.toggle("is-playing", state.musicWanted);

  hotspots.forEach((hotspot) => {
    hotspot.classList.toggle("is-done", state.solved.includes(hotspot.dataset.action));
  });

  beerButtons.forEach((beerButton, index) => {
    beerButton.classList.toggle("is-drunk", state.drunkBeers.includes(index));
  });

  songSteps.forEach((songStep) => {
    const isDone = songStep.dataset.songPart === "drums" && hasBeat();
    songStep.classList.toggle("is-done", isDone);
  });
}

function hasBeat() {
  return has("beat");
}

function needsBeat(action) {
  return action !== "drums" && !hasBeat();
}

function handleBeer(index, beerButton) {
  if (state.drunkBeers.includes(index)) {
    return;
  }

  state.drunkBeers.push(index);

  if (beerButton.dataset.beer === "bad") {
    show("Ihhhh Schaal", false, "Ihhhh Schaal");
    return;
  }

  state.beersDrunk += 1;
  addItem("beers");

  if (state.beersDrunk >= neededBeers) {
    solve("beers");
    show("So langsam sitzt die Stimme tiefer. Jetzt koennte am Schlagzeug was gehen.", false, "Jetzt Drums.");
    return;
  }

  show("Das war gut. Ein bisschen weniger schuechtern.", false, "Laeuft.");
}

function handleBoard() {
  solve("board");
  showBoardOverlay();
}

function handleGuitar() {
  if (needsBeat("guitar")) {
    show(beatBlockMessage, false, "Erst Beat.");
    return;
  }

  if (has("guitar")) {
    show("Die Gitarre haengt bereit. Jetzt braucht sie nur noch den richtigen Sound.", false, "Bereit.");
    return;
  }

  addItem("guitar");
  solve("guitar");
  show("Du nimmst die Gitarre. Schwer, leicht verstimmt, aber eindeutig bereit fuer Aerger in Dur.", false, "Gitarre!");
}

function handlePedals() {
  if (needsBeat("pedals")) {
    show(beatBlockMessage, false, "Erst Beat.");
    return;
  }

  if (!has("cable")) {
    addItem("cable");
    solve("pedals");
    show("Zwischen den Pedalen liegt ein Kabel. Nicht schoen aufgewickelt, aber es funktioniert bestimmt.", false, "Kabel!");
    return;
  }

  show("Die Pedale warten auf Strom, Laerm und eine mittelgute Entscheidung.", false, "Pedale.");
}

function handleDrums() {
  if (state.beersDrunk < neededBeers) {
    show("Noch zu schuechtern fuer den Beat. Vielleicht liegt hier irgendwo noch ein gutes Bier.", false, "Zu schuechtern.");
    return;
  }

  if (hasBeat()) {
    show("Der Beat steht schon: Kick, Snare, Kick-Kick, Snare. Genau so.", false, "Beat steht.");
    return;
  }

  addItem("beat");
  addItem("groove");
  solve("drums");
  show("Da ist er: Kick, Snare, Kick-Kick, Snare. Ein fetter Beat, der den ganzen Raum anschiebt.", false, "Fetter Beat!");

  if (!state.beatStorySeen) {
    state.beatStorySeen = true;
    state.continuationQueued = true;
    showStory(beatStory);
  }
}

function handlePoster() {
  showPosterOverlay();

  if (needsBeat("poster")) {
    return;
  }

  addItem("lyric");
  solve("poster");
}

function handleAmp() {
  if (needsBeat("amp")) {
    show(beatBlockMessage, false, "Erst Beat.");
    return;
  }

  if (!has("guitar")) {
    show("Der Amp brummt beleidigt. Vielleicht erst die Gitarre holen.", false, "Erst Gitarre.");
    return;
  }

  if (!has("cable")) {
    show("Gitarre ist da, aber ohne Kabel bleibt der Amp nur teure Deko.", false, "Kabel fehlt.");
    return;
  }

  addItem("tone");
  addItem("riff");
  solve("amp");
  show("Du steckst ein, drehst Gain auf und findest ein Riff, das nach kleinem Raum und grossem Plan klingt.", false, "Riff!");
}

function handleNotebook() {
  if (needsBeat("notebook")) {
    show(beatBlockMessage, false, "Erst Beat.");
    return;
  }

  const missing = [];

  if (!has("guitar")) missing.push("Gitarre");
  if (!has("riff")) missing.push("Riff");
  if (!has("groove")) missing.push("Groove");
  if (!has("lyric")) missing.push("Textzeile");
  if (!has("tone")) missing.push("Sound");

  if (missing.length > 0) {
    show(`Noch fehlt: ${missing.join(", ")}.`, false, "Da fehlt was.");
    return;
  }

  state.won = true;
  solve("notebook");
  show(
    "Fertig. Der Song heisst 'Zu spaet, aber niemals zu leise'. Die Tuer geht auf, weil sogar das Schloss den Refrain mitsingt.",
    true,
    "Song fertig!",
  );
}

const actions = {
  board: handleBoard,
  guitar: handleGuitar,
  pedals: handlePedals,
  drums: handleDrums,
  poster: handlePoster,
  amp: handleAmp,
  notebook: handleNotebook,
};

hotspots.forEach((hotspot) => {
  hotspot.addEventListener("pointerdown", rememberPointerPoint);
  hotspot.addEventListener("click", (event) => {
    lastPointerEvent = event;
    rememberPointerPoint(event);

    if (state.won && hotspot.dataset.action !== "notebook") {
      show("Der Song ist fertig. Der Proberaum hat seine Schuldigkeit getan.", true, "Fertig.");
      return;
    }

    actions[hotspot.dataset.action]();
    render();
  });
});

beerButtons.forEach((beerButton, index) => {
  beerButton.addEventListener("pointerdown", rememberPointerPoint);
  beerButton.addEventListener("click", (event) => {
    lastPointerEvent = event;
    rememberPointerPoint(event);

    if (state.won) {
      show("Der Song ist fertig. Mehr Bier waere jetzt nur noch Deko.", true, "Fertig.");
      return;
    }

    handleBeer(index, beerButton);
    render();
  });
});

helpButton.addEventListener("click", () => {
  lastPointerEvent = null;
  lastPointerPoint = null;
  state.isHelping = !state.isHelping;
  render();
});

musicButton.addEventListener("click", async () => {
  state.musicWanted = !state.musicWanted;

  if (state.musicWanted) {
    await startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }

  render();
});

stage.addEventListener("pointerdown", () => {
  startBackgroundMusic();
});

storyOverlay.addEventListener("click", hideStory);
boardOverlay.addEventListener("click", hideBoardOverlay);
posterOverlay.addEventListener("click", hidePosterOverlay);
backgroundMusic.addEventListener("play", render);
backgroundMusic.addEventListener("pause", render);
rotateHintClose.addEventListener("click", () => {
  rotateHint.classList.add("is-hidden");
});

restartButton.addEventListener("click", () => {
  const keepHelpMode = state.isHelping;
  const keepMusicMode = state.musicWanted;

  state = {
    inventory: [],
    solved: [],
    beersDrunk: 0,
    drunkBeers: [],
    isHelping: keepHelpMode,
    musicWanted: keepMusicMode,
    storyOpen: false,
    beatStorySeen: false,
    continuationQueued: false,
    won: false,
  };
  lastPointerEvent = null;
  lastPointerPoint = null;
  stage.classList.remove("has-local-feedback");
  localFeedback.classList.remove("is-visible");
  hideBoardOverlay();
  hidePosterOverlay();
  show(startMessage);
  render();
  showStory(introStory);
});

show(startMessage);
render();
showStory(introStory);
