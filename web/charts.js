// web/charts.js
// Chart.js muss vorher geladen sein (CDN oder lokal).
// Wir hängen die API bewusst an window.Charts, damit app.js sie nutzen kann
// ohne Module/Bundler.

function initGpuClockDonut(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) throw new Error(`Canvas #${canvasId} nicht gefunden`);
  const ctx = canvas.getContext("2d");

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Load", "Idle"],
      datasets: [{
        data: [0, 100],
        backgroundColor: ["#60a5fa", "#2b2b2b"], // 🔵 andere Farbe für GPU
        borderWidth: 0
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      animation: false,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

window.Charts = (() => {
  function initCpuLoadDonut(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) throw new Error(`Canvas #${canvasId} nicht gefunden`);
  const ctx = canvas.getContext("2d");

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Load", "Idle"],
      datasets: [{
        data: [0, 100],
        backgroundColor: ["#22c55e", "#2b2b2b"],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: false,
      maintainAspectRatio: true,
      animation: false,
      cutout: "70%",
      plugins: { 
        legend: { display: false }, 
        tooltip: { enabled: false } },
    },
  });
}


function initRamBar(canvasId) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["RAM"],
      datasets: [
        {
          label: "Used",
          data: [0],
          backgroundColor: "#22c55e",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: "Free",
          data: [100],
          backgroundColor: "#2f2f2f",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          display: false,
          stacked: true,
          grid: {
            display: false,
            drawTicks: false,
            drawBorder: false
          },
          border: {
            display: false
          }
        },
        y: {
          min: 0,
          max: 32,
          beginAtZero: true,
          stacked: true,
          ticks: {
            display: true,
            stepSize: 8,
            color: "#888",
            callback: (value) => `${value}`
          },
          grid: {
            display: true,
            drawTicks: false,
            drawBorder: false,      
            color: (context) => context.tick.value === 0 ? "#777" : "#444", lineWidth: (context) => context.tick.value === 0 ? 2 : 1
          },
          border: {
            display: false
          }
        }
      }
    }
  });
}

function initVramBar(canvasId) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["VRAM"],
      datasets: [
        {
          label: "Used",
          data: [0],
          backgroundColor: "#60a5fa",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: "Free",
          data: [0],
          backgroundColor: "#2f2f2f",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          display: false,
          stacked: true,
          grid: {
            display: false,
            drawTicks: false,
            drawBorder: false
          },
          border: {
            display: false
          }
        },
        y: {
          min: 0,
          max: 16, // Startwert, wird dynamisch überschrieben
          beginAtZero: true,
          stacked: true,
          ticks: {
            display: true,
            stepSize: 4,
            color: "#888",
            callback: (value) => `${value}`
          },
          grid: {
            display: true,
            drawTicks: false,
            drawBorder: false,
            color: (ctx) =>
              ctx.tick.value === 0 ? "#777" : "#444",
            lineWidth: (ctx) =>
              ctx.tick.value === 0 ? 2 : 1
          },
          border: {
            display: false
          }
        }
      }
    }
  });
}

function initNetworkChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Down",
          data: [],
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96,165,250,0.15)",
          tension: 0.25,
          pointRadius: 0,
          fill: true
        },
        {
          label: "Up",
          data: [],
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.12)",
          tension: 0.25,
          pointRadius: 0,
          fill: true
        }
      ]
    },
options: {
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }
  },
  scales: {
    x: { display: false },
    y: {
      display: true,
      min: 0,
      suggestedMax: 100,
      grace: "10%",
      ticks: {
        color: "#888",
        callback: (value) => `${Math.round(value)} Mbps`
      },
      grid: {
        color: "#333"
      }
    }
  }
}

  });
}
  //CPU
  function setCpuLoadDonut(chart, cpuPercent) {
  // Defensive checks
  if (cpuPercent === null || cpuPercent === undefined || Number.isNaN(cpuPercent)) {
    cpuPercent = 0;
  }

  // Clamp 0–100
  cpuPercent = Math.max(0, Math.min(100, cpuPercent));

  chart.data.datasets[0].data[0] = cpuPercent;
  chart.data.datasets[0].data[1] = 100 - cpuPercent;

  // Ampel-Farblogik
  const color =
    cpuPercent >= 80 ? "#ef4444" :   // rot
    cpuPercent >= 50 ? "#f59e0b" :   // orange
                       "#22c55e";    // grün

  chart.data.datasets[0].backgroundColor[0] = color;
  chart.update();
}
  //GPU
 function setGpuClockDonut(chart, gpuPercent) {
  if (gpuPercent === null || gpuPercent === undefined || Number.isNaN(gpuPercent)) {
    gpuPercent = 0;
  }

  gpuPercent = Math.max(0, Math.min(100, gpuPercent));

  chart.data.datasets[0].data[0] = gpuPercent;
  chart.data.datasets[0].data[1] = 100 - gpuPercent;

  const color =
    gpuPercent >= 80 ? "#ef4444" :
    gpuPercent >= 50 ? "#f59e0b" :
                       "#60a5fa";  // GPU-Farbe

  chart.data.datasets[0].backgroundColor[0] = color;

  chart.update();
}

function setRamBar(chart, totalBytes, usedBytes) {
  if (totalBytes == null || usedBytes == null) return;

  const totalGB = totalBytes / (1024 ** 3);
  const usedGB = usedBytes / (1024 ** 3);
  const freeGB = totalGB - usedGB;

  let stepSize = 4;
  if (totalGB >= 32) stepSize = 8;
  else if (totalGB >= 16) stepSize = 4;
  else if (totalGB >= 8) stepSize = 2;
  else stepSize = 1;

  chart.options.scales.y.max = Math.ceil(totalGB / stepSize) * stepSize;
  chart.options.scales.y.ticks.stepSize = stepSize;

  chart.data.datasets[0].data[0] = usedGB;
  chart.data.datasets[1].data[0] = freeGB;

  const usedPercent = (usedBytes / totalBytes) * 100;

  const color =
    usedPercent >= 80 ? "#ef4444" :
    usedPercent >= 60 ? "#f59e0b" :
                        "#22c55e";

  chart.data.datasets[0].backgroundColor = color;
  chart.data.datasets[1].backgroundColor = "#2f2f2f";

  chart.update();
}

function setVramBar(chart, totalBytes, usedBytes) {
  if (totalBytes == null || usedBytes == null) return;

  const totalGB = totalBytes / (1024 ** 3);
  const usedGB = usedBytes / (1024 ** 3);
  const freeGB = totalGB - usedGB;

  let stepSize = 4;
  if (totalGB >= 32) stepSize = 8;
  else if (totalGB >= 16) stepSize = 4;
  else if (totalGB >= 8) stepSize = 2;
  else stepSize = 1;

  chart.options.scales.y.max = Math.ceil(totalGB / stepSize) * stepSize;
  chart.options.scales.y.ticks.stepSize = stepSize;

  chart.data.datasets[0].data[0] = usedGB;
  chart.data.datasets[1].data[0] = freeGB;

  const usedPercent = (usedBytes / totalBytes) * 100;

  const color =
    usedPercent >= 80 ? "#ef4444" :
    usedPercent >= 60 ? "#f59e0b" :
                        "#60a5fa";

  chart.data.datasets[0].backgroundColor = color;
  chart.data.datasets[1].backgroundColor = "#2f2f2f";

  chart.update();
}

function setNetworkChart(chart, labels, down, up) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = down;
  chart.data.datasets[1].data = up;

  const maxVal = Math.max(
    0,
    ...(down || []),
    ...(up || [])
  );

  // 🔥 wichtig: KEIN hartes Limiting
  let padded = maxVal * 1.15;

  // 🔥 dynamische Schrittweite
  let step;

  if (padded <= 10) step = 1;
  else if (padded <= 25) step = 5;
  else if (padded <= 50) step = 10;
  else if (padded <= 100) step = 20;
  else if (padded <= 250) step = 50;
  else if (padded <= 500) step = 100;
  else if (padded <= 1000) step = 200;
  else step = 500;

  const niceMax = Math.ceil(padded / step) * step;

  chart.options.scales.y.min = 0;
  chart.options.scales.y.max = niceMax;
  chart.options.scales.y.ticks.stepSize = step;

  // extra Luft oben
  chart.options.scales.y.grace = "10%";
  chart.resize();
  chart.update("none");
}


  return {
    initCpuLoadDonut,
    setCpuLoadDonut,
    initGpuClockDonut,
    setGpuClockDonut,
    initRamBar,
    setRamBar,
    initVramBar,
    setVramBar,
    initNetworkChart,
    setNetworkChart
  };
})();
