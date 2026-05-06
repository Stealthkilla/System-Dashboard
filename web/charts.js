// web/charts.js
// Chart.js muss vorher geladen sein (CDN oder lokal).
// Wir hängen die API bewusst an window.Charts, damit app.js sie nutzen kann
// ohne Module/Bundler.

window.Charts = (() => {
  function initCpuLoadDonut(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) throw new Error(`Canvas #${canvasId} nicht gefunden`);
    const ctx = canvas.getContext("2d");

    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Load", "Idle"],
        datasets: [{
          data: [0, 100],
          backgroundColor: ["#22c55e", "#2b2b2b"], // grün + dunkel
          borderWidth: 0
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });

    return chart;
  }

  function setCpuLoadDonut(chart, cpuPercent) {
    // Defensive: falls null/undefined kommt
    if (cpuPercent === null || cpuPercent === undefined || Number.isNaN(cpuPercent)) {
      cpuPercent = 0;
    }

    // clamp 0..100
    cpuPercent = Math.max(0, Math.min(100, cpuPercent));

    chart.data.datasets[0].data[0] = cpuPercent;
    chart.data.datasets[0].data[1] = 100 - cpuPercent;

    // optional: Farbe je nach Last (einfaches Ampel-System)
    const color =
      cpuPercent >= 80 ? "#ef4444" :   // rot
      cpuPercent >= 50 ? "#f59e0b" :   // orange
                         "#22c55e";    // grün
    chart.data.datasets[0].backgroundColor[0] = color;

    chart.update();
  }

  return {
    initCpuLoadDonut,
    setCpuLoadDonut
  };
})();
