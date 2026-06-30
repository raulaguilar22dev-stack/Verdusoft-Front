/** Componente Alpine para el catalogo publico de productos. */

document.addEventListener("alpine:init", () => {
  Alpine.data("catalogoApp", () => ({
    products: [],
    filtered: [],
    loading: true,
    error: null,
    search: "",

    async init() {
      try {
        this.products = await API.getCatalogo();
        this.filtered = this.products;
      } catch (err) {
        this.error = err.message || "Error al cargar el catalogo";
      } finally {
        this.loading = false;
      }
    },

    filter() {
      const q = this.search.toLowerCase().trim();
      if (!q) {
        this.filtered = this.products;
        return;
      }
      this.filtered = this.products.filter((p) =>
        p.nombre.toLowerCase().includes(q),
      );
    },

    formatPrice(value) {
      if (value == null) return "$0.00";
      return "$" + Number(value).toFixed(2);
    },
  }));
});
