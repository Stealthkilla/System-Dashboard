console.log("app.js geladen");

const MAX_HISTORY = 60;
let cpuChart = null;

// ---------- ViewModel ----------

const viewModel = {
  live: {  //live is for the websocket
    cpu: null,
    connected: false
  },
  history: {
    timestamps: [],
    cpu: [],
    cpuTemp: [],
    ram: [],
    gpu: [],
    gpuTemp: [],
    gpuVramPercent: []
  },
  static : {
    cpuModel: null,
    gpuModel: null,
    ramTotal: null,
    gpuVramTotal: null

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

// ---------- Data (Polling) ----------
async function loadStats() {
  try {
    viewModel.status = "loading";

    const res = await fetch("/stats");
    const data = await res.json();

    const now = new Date().toLocaleTimeString();

    pushHistory(viewModel.history.timestamps, now);
    pushHistory(viewModel.history.cpu, data.cpu.load);
    pushHistory(viewModel.history.cpuTemp, data.cpu.temp);
    pushHistory(viewModel.history.ram, data.ram.load);

    if (data.gpu) {
      pushHistory(viewModel.history.gpu, data.gpu.load);
      pushHistory(viewModel.history.gpuTemp, data.gpu.temperature);
      pushHistory(viewModel.history.gpuVramPercent, data.gpu.gpu_percent);
    }

    
    // Static (Fill in once)
    if (!viewModel.static.cpuModel) {
      viewModel.static.cpuModel = data.cpu.info.model;
      viewModel.static.gpuModel = data.gpu.info.model;
      viewModel.static.ramTotal = data.ram.info.total;
      viewModel.static.gpuVramTotal = data.gpu.info.vram_total;
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
  const cpuTemp = getLatest(viewModel.history.cpuTemp);
  const ram = getLatest(viewModel.history.ram);
  const gpu = getLatest(viewModel.history.gpu);
  const gpuTemp = getLatest(viewModel.history.gpuTemp);
  const gpuVram = getLatest(viewModel.history.gpuVramPercent);

  document.getElementById("cpu").textContent =
    cpu !== null ? cpu.toFixed(1) : "--";

  document.getElementById("ram").textContent =
    ram !== null ? ram.toFixed(1) : "--";

  document.getElementById("gpu").textContent =
    gpu !== null ? gpu.toFixed(0) : "--";

  document.getElementById("gpuTemp").textContent =
    gpuTemp !== null ? gpuTemp.toFixed(0) : "--";

  document.getElementById("gpuVram").textContent =
    gpuVram !== null ? gpuVram.toFixed(1) : "--";

  document.getElementById("status").textContent = viewModel.status;
}

function renderLive() {
  const bar = document.getElementById("cpuBar");

  if (viewModel.live.cpu !== null && viewModel.live.connected) {
    bar.style.width = `${viewModel.live.cpu}%`;
    bar.style.opacity = "1";
  } else {
    bar.style.opacity = "0.3"; // sichtbar, aber "offline"
  }
}


// ---------- Orchestration ----------
async function update() {
  await loadStats();
  render();       // ✅ FEHLTE
  renderChart();
}

let socket = null;
let reconnectTimer = null;
let reconnectDelay = 1000;       // Start: 1s
const MAX_RECONNECT_DELAY = 10000; // Max: 10s

function initWebSocket() {
  connectWebSocket();
}

function connectWebSocket() {
  console.log("WebSocket: attempting connect");
  socket = new WebSocket("ws://127.0.0.1:8765");

  socket.onopen = () => {
    console.log("WebSocket: connected");
    viewModel.live.connected = true;
    reconnectDelay = 1000; // Reset Backoff
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    viewModel.live.cpu = data.cpu;
    renderLive();
  };

  socket.onerror = (err) => {
    console.error("WebSocket error", err);
    socket.close();
  };

  socket.onclose = () => {
    console.warn("WebSocket closed");
    viewModel.live.connected = false;
    scheduleReconnect();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;

  console.log(`WebSocket: reconnect in ${reconnectDelay}ms`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
    reconnectDelay = Math.min(
      reconnectDelay * 2,
      MAX_RECONNECT_DELAY
    );
  }, reconnectDelay);
}

// ---------- Start ----------
window.addEventListener("load", () => {
  initChart();        // Polling
  initWebSocket();    // Live (mit Reconnect)
  update();           // erstes Polling
  setInterval(update, 2000);
});