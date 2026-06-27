/** Capa de servicio / API centralizada. */

async function apiRequest(endpoint, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;

  const defaults = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaults, ...options });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = {};
      }
      const message =
        errorBody.detail ||
        errorBody.mensaje ||
        `Error HTTP ${response.status}`;
      throw new ApiError(message, response.status, errorBody);
    }

    // 204 No Content
    if (response.status === 204) return null;

    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica tu conexion.",
      0,
      {},
    );
  }
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/* ============================================================
   Endpoints especificos
   ============================================================ */

const API = {
  // Categorias
  getCategorias: () => apiRequest("/categorias"),

  // Productos
  getProductos: () => apiRequest("/productos"),
  createProducto: (data) =>
    apiRequest("/productos", { method: "POST", body: JSON.stringify(data) }),
  updateProducto: (id, data) =>
    apiRequest(`/productos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProducto: (id) => apiRequest(`/productos/${id}`, { method: "DELETE" }),

  // Ventas
  getVentas: (params = {}) => {
    const query = new URLSearchParams();
    query.append("limit", "1000");
    if (params.fecha_inicio) query.append("fecha_inicio", params.fecha_inicio);
    if (params.fecha_fin) query.append("fecha_fin", params.fecha_fin);
    if (params.metodo_pago) query.append("metodo_pago", params.metodo_pago);
    return apiRequest(`/ventas?${query.toString()}`);
  },
  createVenta: (data) =>
    apiRequest("/ventas", { method: "POST", body: JSON.stringify(data) }),
};
