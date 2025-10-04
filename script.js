/* script.js - corrected with goalie behavior
   - If you replace goalie, old goalie goes to the bench
   - Current goalie never shown in bench display
*/

const positionsList = ["goalie","def1","def2","mid1","mid2","off1","off2"];
let players = [];
let bench = [];
let currentPositions = {
  goalie: "", def1: "", def2: "", mid1: "", mid2: "", off1: "", off2: ""
};

let timerInterval = null, seconds = 0;

// Helper: dedupe while preserving order
function dedupePreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

// Add players (comma separated or single)
function addPlayers() {
  const input = document.getElementById("player-input").value;
  if (!input) return;

  const newPlayers = input.split(",").map(p => p.trim()).filter(Boolean);

  newPlayers.forEach(p => {
    if (!players.includes(p)) players.push(p);
    // Add to bench only if not already on the field
    if (!Object.values(currentPositions).includes(p) && !bench.includes(p)) bench.push(p);
  });

  document.getElementById("player-input").value = "";
  bench = dedupePreserveOrder(bench);
  updateSelectors();
}

// Build the dropdowns
function updateSelectors() {
  positionsList.forEach(id => {
    const sel = document.getElementById(id);
    const current = currentPositions[id] || "";
    sel.innerHTML = "";

    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "-- empty --";
    sel.appendChild(emptyOpt);

    players.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      sel.appendChild(opt);
    });

    sel.value = current;
    sel.onchange = () => overridePosition(id, sel.value);
  });

  updateBench();
}

// When a position dropdown changes
function overridePosition(pos, newPlayer) {
  const oldPlayer = currentPositions[pos] || "";

  if (newPlayer === oldPlayer) return;

  // If the newPlayer was assigned somewhere else on the field, vacate that slot
  if (newPlayer) {
    const prevPos = positionsList.find(k => currentPositions[k] === newPlayer);
    if (prevPos && prevPos !== pos) {
      currentPositions[prevPos] = "";
      const prevSel = document.getElementById(prevPos);
      if (prevSel) prevSel.value = "";
    }
  }

  // Remove new player from bench (if they were there)
  bench = bench.filter(p => p !== newPlayer);

  // Move the old player (including goalie!) back to bench if they existed
  if (oldPlayer) bench.push(oldPlayer);

  // Update this slot
  currentPositions[pos] = newPlayer || "";

  bench = dedupePreserveOrder(bench);

  updateSelectors();
}

// Render the bench (exclude the *current* goalie only)
function updateBench() {
  const ul = document.getElementById("bench");
  ul.innerHTML = "";
  const displayBench = bench.filter(p => p !== currentPositions.goalie);
  displayBench.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    ul.appendChild(li);
  });
}

// Substitution rotation
function makeSub() {
  const usableBench = bench.filter(p => p !== currentPositions.goalie);
  if (usableBench.length < 2) {
    alert("Not enough players on the bench!");
    return;
  }

  const newDef1 = usableBench[0];
  const newDef2 = usableBench[1];
  bench = bench.filter(p => p !== newDef1 && p !== newDef2);

  const oldDef1 = currentPositions.def1 || "";
  const oldDef2 = currentPositions.def2 || "";
  const oldMid1 = currentPositions.mid1 || "";
  const oldMid2 = currentPositions.mid2 || "";
  const oldOff1 = currentPositions.off1 || "";
  const oldOff2 = currentPositions.off2 || "";

  currentPositions.def1 = newDef1;
  currentPositions.def2 = newDef2;
  currentPositions.mid1 = oldDef1;
  currentPositions.mid2 = oldDef2;
  currentPositions.off1 = oldMid1;
  currentPositions.off2 = oldMid2;

  if (oldOff1) bench.push(oldOff1);
  if (oldOff2) bench.push(oldOff2);

  bench = dedupePreserveOrder(bench);
  updateSelectors();
}

/* Timer */
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").textContent = formatTime(seconds);
  }, 1000);
}
function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  seconds = 0;
  document.getElementById("timer").textContent = "00:00";
}
function formatTime(s) {
  const m = Math.floor(s/60).toString().padStart(2,"0");
  const sec = (s%60).toString().padStart(2,"0");
  return `${m}:${sec}`;
}

/* Drag & drop bench */
new Sortable(document.getElementById("bench"), {
  animation: 150,
  onEnd: () => {
    bench = Array.from(document.getElementById("bench").children).map(li => li.textContent);
  }
});

updateSelectors();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js')
      .then((reg) => console.log('Service worker registered:', reg))
      .catch((err) => console.error('Service worker failed:', err));
  });
}

