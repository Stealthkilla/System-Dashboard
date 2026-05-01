console.log("app.js geladen");

const MAX_HISTORY = 60;
let cpuChart = null;

// ---------- ViewModel ----------

const viewModel = {
  live: {  //live is for the websocket
    cpu: null
  },
  history: {
    timestamps: [],
    cpu: [],
    ram: [],
    gpu: [],
    gpuTemp: []
  },
  status: "init"
};


// ---------- Helpers ----------
function pushHistory(array, value) {
  array.push(value);
  if (array.length > MAX_HISTORY) {
    array.shift();
  }
}

function getLatestCpu() {
  const arr = viewModel.history.cpu;
  return arr.length > 0 ? arr[arr.length - 1] : null;
}

// ---------- Chart ----------
function initChart() {
  const canvas = document.getElementById("cpuChart");
  const ctx = canvas.getContext("2d");

  cpuChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "CPU %",
          data: [],
          borderColor: "rgb(75, 192, 192)",
          tension: 0.2
        }
      ]
    },
    options: {
      animation: false,
      scales: {
        y: { min: 0, max: 100 }
      }
    }
  });
}

// ---------- Data (Polling) ----------
async function loadStats() {
  try {
    viewModel.status = "loading";

    const res = await fetch("/stats");
    const data = await res.json();

    const now = new Date().toLocaleTimeString();

    pushHistory(viewModel.history.timestamps, now);
    pushHistory(viewModel.history.cpu, data.cpu.load);
    pushHistory(viewModel.history.ram, data.ram.load);

    if (data.gpu) {
      pushHistory(viewModel.history.gpu, data.gpu.load);
      pushHistory(viewModel.history.gpuTemp, data.gpu.temperature);
    }

    viewModel.status = "ok";
  } catch (err) {
    console.error("loadStats error:", err);
    viewModel.status = "error";
  }
}


function getLatest(array) {
  return array.length > 0 ? array[array.length - 1] : null;
}

// ---------- Render ----------
function renderChart() {
  if (!cpuChart) return;

  cpuChart.data.labels = viewModel.history.timestamps;
  cpuChart.data.datasets[0].data = viewModel.history.cpu;
  cpuChart.update();
}

function render() {
  const cpu = getLatest(viewModel.history.cpu);
  const ram = getLatest(viewModel.history.ram);
  const gpu = getLatest(viewModel.history.gpu);
  const gpuTemp = getLatest(viewModel.history.gpuTemp);

  document.getElementById("cpu").textContent =
    cpu !== null ? cpu.toFixed(1) : "--";

  document.getElementById("ram").textContent =
    ram !== null ? ram.toFixed(1) : "--";

  document.getElementById("gpu").textContent =
    gpu !== null ? gpu.toFixed(0) : "--";

  document.getElementById("gpuTemp").textContent =
    gpuTemp !== null ? gpuTemp.toFixed(0) : "--";

  document.getElementById("status").textContent =
    viewModel.status;
}

function renderLive() {
  const bar = document.getElementById("cpuBar");
  if (viewModel.live.cpu !== null) {
    bar.style.width = `${viewModel.live.cpu}%`;
  }
}

// ---------- Orchestration ----------
async function update() {
  await loadStats();
  render();       // ✅ FEHLTE
  renderChart();
}

function initWebSocket() {
  const socket = new WebSocket("ws://127.0.0.1:8765");

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    viewModel.live.cpu = data.cpu;
    renderLive();
  };

  socket.onopen = () => console.log("WebSocket verbunden");
  socket.onclose = () => console.log("WebSocket getrennt");
  socket.onerror = (e) => console.error("WebSocket Fehler", e);
}

// ---------- Start ----------
window.addEventListener("load", () => {
  initChart();        // Polling‑Chart
  initWebSocket();    // Live‑CPU
  update();           // erstes Polling
  setInterval(update, 2000);
});