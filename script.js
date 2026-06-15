const roles = ["MT", "OT", "H1", "H2", "M1", "M2", "R1", "R2"];
const arrows = ["↑", "→", "↓", "←"];
const laneByTether = { LEFT: "outside", RIGHT: "inside" };

// Clockwise placement map. Matching arrows are cardinals; mixed arrows are intercards.
const solutionByPair = {
  "↑+↑": "W",
  "→+→": "N",
  "↓+↓": "E",
  "←+←": "S",
  "↑+→": "NW",
  "→+↑": "NW",
  "→+↓": "NE",
  "↓+→": "NE",
  "↓+←": "SE",
  "←+↓": "SE",
  "←+↑": "SW",
  "↑+←": "SW"
};

let current = null;
let selectedSpot = null;
let selectedLane = null;
let startTime = null;
let timerInterval = null;
let stats = JSON.parse(localStorage.getItem("graven3Stats") || '{"attempts":0,"correct":0,"times":[]}');

const $ = (id) => document.getElementById(id);

function pairKey(pair) { return `${pair[0]}+${pair[1]}`; }
function rand(items) { return items[Math.floor(Math.random() * items.length)]; }

function makeAssignment() {
  const matching = Math.random() < 0.5;
  let pair;
  if (matching) {
    const a = rand(arrows);
    pair = [a, a];
  } else {
    const mixedPairs = [
      ["↑", "→"], ["→", "↓"], ["↓", "←"], ["←", "↑"],
      ["→", "↑"], ["↓", "→"], ["←", "↓"], ["↑", "←"]
    ];
    pair = rand(mixedPairs);
  }
  const tether = Math.random() < 0.5 ? "LEFT" : "RIGHT";
  const role = $("roleSelect").value;
  return {
    role,
    pair,
    tether,
    correctSpot: solutionByPair[pairKey(pair)],
    correctLane: laneByTether[tether],
    type: matching ? "matching" : "mixed"
  };
}

function renderAssignment() {
  $("roleOut").textContent = current.role;
  $("arrowsOut").textContent = `${current.pair[0]} + ${current.pair[1]}`;
  $("tetherOut").textContent = current.tether;
  $("selectedSpotOut").textContent = "None";
  $("resultBox").className = "result-box muted";
  $("resultBox").textContent = "Solve your spot and lane, then check answer.";
  document.querySelectorAll(".spot").forEach(b => b.classList.remove("selected", "correct", "wrong"));
  document.querySelectorAll(".lane").forEach(b => b.classList.remove("selected"));
  selectedSpot = null;
  selectedLane = null;
  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);
  startTime = performance.now();
  timerInterval = setInterval(() => {
    $("timerOut").textContent = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
  return (performance.now() - startTime) / 1000;
}

function updateStats() {
  $("attemptsOut").textContent = stats.attempts;
  $("accuracyOut").textContent = stats.attempts ? `${Math.round((stats.correct / stats.attempts) * 100)}%` : "0%";
  if (stats.times.length) {
    const avg = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
    $("avgOut").textContent = `${avg.toFixed(1)}s`;
  } else {
    $("avgOut").textContent = "—";
  }
  localStorage.setItem("graven3Stats", JSON.stringify(stats));
}

function explain() {
  const arrowRule = current.type === "matching"
    ? "Matching arrows resolve on cardinals."
    : "Mixed arrows resolve on intercards.";
  const tetherRule = current.tether === "LEFT"
    ? "Left tether means outside of cardinal markers."
    : "Right tether means inside of cardinal markers.";
  return `${arrowRule}\nCorrect placement: ${current.correctSpot}.\n${tetherRule}\nCorrect lane: ${current.correctLane.toUpperCase()}.`;
}

$("generateBtn").addEventListener("click", () => {
  current = makeAssignment();
  renderAssignment();
});

$("checkBtn").addEventListener("click", () => {
  if (!current) return;
  if (!selectedSpot || !selectedLane) {
    $("resultBox").className = "result-box warn";
    $("resultBox").textContent = "Pick both a placement spot and inside/outside lane first.";
    return;
  }
  const elapsed = stopTimer();
  const spotOk = selectedSpot === current.correctSpot;
  const laneOk = selectedLane === current.correctLane;
  const ok = spotOk && laneOk;

  stats.attempts += 1;
  if (ok) {
    stats.correct += 1;
    stats.times.push(elapsed);
  }
  updateStats();

  document.querySelectorAll(".spot").forEach(b => {
    b.classList.remove("correct", "wrong");
    if (b.dataset.spot === current.correctSpot) b.classList.add("correct");
    if (b.dataset.spot === selectedSpot && !spotOk) b.classList.add("wrong");
  });

  $("resultBox").className = ok ? "result-box good" : "result-box bad";
  $("resultBox").textContent = `${ok ? "✓ Correct" : "✗ Not quite"}\n${explain()}\nSolved in ${elapsed.toFixed(1)}s.`;
});

$("showBtn").addEventListener("click", () => {
  if (!current) return;
  document.querySelectorAll(".spot").forEach(b => {
    b.classList.toggle("correct", b.dataset.spot === current.correctSpot);
  });
  $("resultBox").className = "result-box warn";
  $("resultBox").textContent = explain();
});

$("resetStatsBtn").addEventListener("click", () => {
  stats = { attempts: 0, correct: 0, times: [] };
  updateStats();
});

document.querySelectorAll(".spot").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedSpot = btn.dataset.spot;
    $("selectedSpotOut").textContent = selectedSpot;
    document.querySelectorAll(".spot").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

document.querySelectorAll(".lane").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedLane = btn.dataset.lane;
    document.querySelectorAll(".lane").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

$("roleSelect").addEventListener("change", () => {
  if (current) {
    current.role = $("roleSelect").value;
    $("roleOut").textContent = current.role;
  }
});

updateStats();
current = makeAssignment();
renderAssignment();
