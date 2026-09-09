(function () {
  "use strict";

  const grid = document.getElementById("marketSnapshotGrid");
  const published = document.getElementById("marketSnapshotPublished");
  if (!grid || !published) return;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const formatValue = (metric) => Number(metric.value).toLocaleString("en-SG", {
    minimumFractionDigits: Number(metric.decimals) || 0,
    maximumFractionDigits: Number(metric.decimals) || 0,
  });

  fetch("data/market-snapshot.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((snapshot) => {
      if (!Array.isArray(snapshot.metrics) || snapshot.metrics.length !== 4) throw new Error("Invalid snapshot");
      grid.innerHTML = snapshot.metrics.map((metric) => `
        <div data-market-metric="${escapeHtml(metric.key)}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(formatValue(metric))}</strong>
          <small>${escapeHtml(metric.unit)}</small>
        </div>
      `).join("");
      published.textContent = snapshot.published;
    })
    .catch(() => {
      published.textContent = "--";
    });
}());
