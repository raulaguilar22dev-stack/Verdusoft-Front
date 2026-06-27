/** Utilidades compartidas entre paginas. */

function formatPrice(price) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(price || 0);
}

function formatDate(date) {
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString("es-AR");
}

function getStockStatus(product) {
  if (product.stock <= product.stock_minimo) return "critical";
  if (product.stock <= product.stock_minimo * 1.5) return "low";
  return "normal";
}

function getStockLabel(product) {
  const status = getStockStatus(product);
  if (status === "critical") return "🔴 Crítico";
  if (status === "low") return "🟡 Bajo";
  return "🟢 Normal";
}

function getPaymentIcon(method) {
  const icons = {
    efectivo: "💵",
    tarjeta: "💳",
    transferencia: "🏦",
    otro: "📱",
  };
  return icons[method] || "💰";
}

/* ============================================================
   Toast Notifications
   ============================================================ */

let toastContainer = null;

function ensureToastContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  toastContainer.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 400px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function showNotification(message, type = "info") {
  const container = ensureToastContainer();

  const el = document.createElement("div");
  const colors = {
    success: "#2e7d32",
    error: "#c62828",
    warning: "#e65100",
    info: "#1565c0",
  };
  const bgColors = {
    success: "#e8f5e9",
    error: "#ffebee",
    warning: "#fff3e0",
    info: "#e3f2fd",
  };
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  el.style.cssText = `
    background: ${bgColors[type]};
    color: ${colors[type]};
    padding: 1rem 1.25rem;
    border-radius: 6px;
    border-left: 4px solid ${colors[type]};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 0.95rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: toast-in 0.3s ease-out;
    pointer-events: auto;
    cursor: pointer;
  `;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;

  el.addEventListener("click", () => removeToast(el));

  container.appendChild(el);

  setTimeout(() => removeToast(el), 4000);
}

function removeToast(el) {
  if (!el.parentNode) return;
  el.style.animation = "toast-out 0.3s ease-in forwards";
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 300);
}

// Keyframes para toasts
(function injectToastStyles() {
  const toastStyles = document.createElement("style");
  toastStyles.textContent = `
    @keyframes toast-in {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
    @keyframes toast-out {
      from { transform: translateX(0);   opacity: 1; }
      to   { transform: translateX(100%); opacity: 0; }
    }
  `;
  if (document.head) {
    document.head.appendChild(toastStyles);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      document.head.appendChild(toastStyles);
    });
  }
})();
