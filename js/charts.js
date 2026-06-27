/** Helpers de Chart.js con update in-place (sin destroy/recreate). */

const chartRegistry = new Map();

function getOrCreateChart(canvasId, type, data, options = {}) {
  let chart = chartRegistry.get(canvasId);

  if (chart) {
    chart.data = data;
    chart.options = { ...chart.options, ...options };
    chart.update("active");
    return chart;
  }

  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  chart = new Chart(ctx, { type, data, options });
  chartRegistry.set(canvasId, chart);
  return chart;
}

function destroyChart(canvasId) {
  const chart = chartRegistry.get(canvasId);
  if (chart) {
    chart.destroy();
    chartRegistry.delete(canvasId);
  }
}

function renderDailySalesChart(sales) {
  const dailyData = new Map();
  sales.forEach((sale) => {
    const date = formatShortDate(sale.fecha);
    dailyData.set(date, (dailyData.get(date) || 0) + (sale.total || 0));
  });

  const sortedDates = Array.from(dailyData.keys()).sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
  });

  return getOrCreateChart("dailySalesChart", "line", {
    labels: sortedDates,
    datasets: [
      {
        label: "Ventas Diarias",
        data: sortedDates.map((date) => dailyData.get(date)),
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => "$" + value.toLocaleString("es-AR"),
        },
      },
    },
  });
}

function renderPaymentMethodChart(sales) {
  const methodData = new Map();
  sales.forEach((sale) => {
    const method = sale.metodo_pago || "otro";
    methodData.set(method, (methodData.get(method) || 0) + (sale.total || 0));
  });

  const labels = Array.from(methodData.keys()).map(
    (m) => m.charAt(0).toUpperCase() + m.slice(1),
  );

  return getOrCreateChart("paymentMethodChart", "doughnut", {
    labels,
    datasets: [
      {
        data: Array.from(methodData.values()),
        backgroundColor: ["#4caf50", "#2196f3", "#ff9800", "#9c27b0"],
      },
    ],
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
    },
  });
}

function renderTopProductsChart(productSales) {
  const top10 = productSales.slice(0, 10);

  return getOrCreateChart("topProductsChart", "bar", {
    labels: top10.map((p) => p.nombre),
    datasets: [
      {
        label: "Ingresos",
        data: top10.map((p) => p.total_vendido),
        backgroundColor: "#4caf50",
      },
    ],
  }, {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => "$" + value.toLocaleString("es-AR"),
        },
      },
    },
  });
}
