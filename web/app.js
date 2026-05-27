console.log("app.js geladen");

const MAX_HISTORY = 60;
let cpuLoadDonutChart = null;
let gpuClockDonutChart = null;
let ramBarChart = null;
let vramBarChart = null;
let networkChart = null;

// ---------- ViewModel ----------

const viewModel = {
  live: {  //live is for the websocket
    cpu: null,
    connected: false
  },
  history: {
    timestamps: [],
    cpu: [],
    ram: [],
    gpu: [],
    gpuTemp: [],
    gpuVramPercent: [],
    gpuVramUsed: [],
    netUp: [],
    netDown: []
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
    pushHistory(viewModel.history.ram, data.ram.load);

    // Fake Network Data (solange Backend noch nichts liefert)
    if (data.network) {
      pushHistory(viewModel.history.netUp, data.network.up);
      pushHistory(viewModel.history.netDown, data.network.down);
      viewModel.live.ping = data.network.ping;
    }
    console.log("FETCH RESPONSE", data);

    if (data.gpu) {
      pushHistory(viewModel.history.gpu, data.gpu.load);
      pushHistory(viewModel.history.gpuTemp, data.gpu.temperature);

      const vramPercent = (data.gpu.used / data.gpu.total) * 100;

      pushHistory(viewModel.history.gpuVramPercent, vramPercent);
      pushHistory(viewModel.history.gpuVramUsed, data.gpu.used);
    }

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

function render() {
  const cpuModelEl = document.getElementById("cpuModel");
  if (cpuModelEl && viewModel.static.cpuModel) {
    cpuModelEl.textContent = viewModel.static.cpuModel;
  }

  const gpuModelEl = document.getElementById("gpuModel");
  if (gpuModelEl && viewModel.static.gpuModel) {
    gpuModelEl.textContent = viewModel.static.gpuModel;
  }

  const cpu = getLatest(viewModel.history.cpu);
  const ram = getLatest(viewModel.history.ram);
  const gpu = getLatest(viewModel.history.gpu);
  const vramPercent = getLatest(viewModel.history.gpuVramPercent);
  const vramUsed = getLatest(viewModel.history.gpuVramUsed);

  // Charts
  if (cpuLoadDonutChart) {
    Charts.setCpuLoadDonut(cpuLoadDonutChart, cpu);
  }

  if (gpuClockDonutChart) {
    Charts.setGpuClockDonut(gpuClockDonutChart, gpu);
  }

  if (ramBarChart && viewModel.static.ramTotal != null && ram != null) {
    const usedBytes = (ram / 100) * viewModel.static.ramTotal;
    Charts.setRamBar(ramBarChart, viewModel.static.ramTotal, usedBytes);
  }

  if (vramBarChart && viewModel.static.gpuVramTotal != null && vramUsed != null) {
    Charts.setVramBar(vramBarChart, viewModel.static.gpuVramTotal, vramUsed);
  }

  if (networkChart) {
    Charts.setNetworkChart(
      networkChart,
      viewModel.history.timestamps,
      viewModel.history.netDown,
      viewModel.history.netUp
    );
  }

  // CPU Text
  const cpuTextEl = document.getElementById("cpuLoadText");
  if (cpuTextEl && cpu != null) {
    cpuTextEl.textContent = `${cpu.toFixed(0)}%`;
  }

  // GPU Text
  const gpuTextEl = document.getElementById("gpuLoadText");
  if (gpuTextEl && gpu != null) {
    gpuTextEl.textContent = `${gpu.toFixed(0)}%`;
  }

  // RAM Text floating
  const ramTextEl = document.getElementById("ramText");
  if (ramTextEl && ram != null) {
    ramTextEl.textContent = `${ram.toFixed(1)}%`;

    const containerHeight = ramTextEl.parentElement.clientHeight;
    const paddingTop = 10;
    const paddingBottom = 15;
    const usableHeight = containerHeight - paddingTop - paddingBottom;
    const rawTop = paddingTop + (1 - ram / 100) * usableHeight - 18;

    const minTop = 5;
    const maxTop = paddingTop + usableHeight;
    const top = Math.max(minTop, Math.min(maxTop, rawTop));

    ramTextEl.style.top = `${top}px`;
    ramTextEl.style.color =
      ram >= 80 ? "#ef4444" :
      ram >= 60 ? "#f59e0b" :
                  "#22c55e";
  }

  // VRAM Text floating
  const vramTextEl = document.getElementById("vramText");
  if (vramTextEl && vramPercent != null) {
    vramTextEl.textContent = `${vramPercent.toFixed(1)}%`;

    const containerHeight = vramTextEl.parentElement.clientHeight;
    const paddingTop = 10;
    const paddingBottom = 15;
    const usableHeight = containerHeight - paddingTop - paddingBottom;
    const rawTop = paddingTop + (1 - vramPercent / 100) * usableHeight - 18;

    const minTop = 5;
    const maxTop = paddingTop + usableHeight;
    const top = Math.max(minTop, Math.min(maxTop, rawTop));

    vramTextEl.style.top = `${top}px`;
    vramTextEl.style.color =
      vramPercent >= 80 ? "#ef4444" :
      vramPercent >= 60 ? "#f59e0b" :
                          "#60a5fa";
  }

  // Ping
  const pingEl = document.getElementById("pingText");
  if (pingEl && viewModel.live.ping != null) {
    const ping = viewModel.live.ping;

    pingEl.textContent = `${ping.toFixed(0)} ms`;
    pingEl.style.color =
      ping < 50 ? "#22c55e" :
      ping < 100 ? "#f59e0b" :
                   "#ef4444";
  }

  const downEl = document.getElementById("netDownText");
  const upEl = document.getElementById("netUpText");

  const down = getLatest(viewModel.history.netDown);
  const up = getLatest(viewModel.history.netUp);

  if (downEl && down != null) {
    downEl.textContent = `↓ ${down.toFixed(0)} Mbps`;
  }

  if (upEl && up != null) {
    upEl.textContent = `↑ ${up.toFixed(0)} Mbps`;
  }

}// End of Render function



  /* Legacy
  document.getElementById("ram").textContent =
    ram !== null ? ram.toFixed(1) : "--";

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
*/

// ---------- Orchestration ----------
window.addEventListener("load", () => {
  cpuLoadDonutChart = Charts.initCpuLoadDonut("cpuLoadDonut");
  gpuClockDonutChart = Charts.initGpuClockDonut("gpuClockDonut");
  ramBarChart = Charts.initRamBar("ramBar");
  vramBarChart = Charts.initVramBar("vramBar");
  networkChart = Charts.initNetworkChart("networkChart");

  initWebSocket();
  update();
  setInterval(update, 1000);
});

async function update() {
  await loadStats();
  render();       
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
    //renderLive(); LEGACY
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
