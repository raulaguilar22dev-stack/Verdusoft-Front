/** Componente Alpine: Gestion de Productos (admin.html) */

document.addEventListener("alpine:init", () => {
  Alpine.data("productApp", () => ({
    products: [],
    filteredProducts: [],
    categories: [],
    loading: true,
    showCreateModal: false,
    showEditModal: false,
    showSaleModal: false,
    showCategoryModal: false,

    categoryFormData: {
      nombre: "",
      descripcion: "",
    },

    filters: {
      search: "",
      category: "",
      stockStatus: "",
    },

    stats: {
      total: 0,
      normal: 0,
      low: 0,
      critical: 0,
    },

    formData: {
      codigo: "",
      nombre: "",
      descripcion: "",
      id_categoria: "",
      precio_actual: 0,
      precio_costo: 0,
      stock: 0,
      stock_minimo: 0,
      unidad_medida: "unidad",
    },

    editingProductId: null,

    selectedProduct: null,
    saleData: {
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      metodo_pago: "efectivo",
      observaciones: "",
    },
    saleTotal: 0,

    // Paginacion
    page: 0,

    async init() {
      requireAuth();
      startSessionHeartbeat();
      await this.loadCategories();
      await this.loadProducts();
    },

    async loadCategories() {
      try {
        this.categories = await API.getCategorias();
      } catch (err) {
        console.error("Error loading categories:", err);
        showNotification("Error al cargar categorias", "error");
      }
    },

    async loadProducts() {
      this.loading = true;
      try {
        this.products = await API.getProductos();
        this.filterProducts();
        this.calculateStats();
      } catch (err) {
        console.error("Error loading products:", err);
        showNotification("Error al cargar productos", "error");
      } finally {
        this.loading = false;
      }
    },

    filterProducts() {
      let filtered = [...this.products];

      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.nombre.toLowerCase().includes(search) ||
            (p.codigo && p.codigo.toLowerCase().includes(search)),
        );
      }

      if (this.filters.category) {
        filtered = filtered.filter(
          (p) => p.id_categoria == this.filters.category,
        );
      }

      if (this.filters.stockStatus) {
        filtered = filtered.filter(
          (p) => getStockStatus(p) === this.filters.stockStatus,
        );
      }

      this.filteredProducts = filtered;
      this.page = 0;
    },

    calculateStats() {
      this.stats = {
        total: this.products.length,
        normal: 0,
        low: 0,
        critical: 0,
      };

      this.products.forEach((p) => {
        const status = getStockStatus(p);
        if (status === "normal") this.stats.normal++;
        else if (status === "low") this.stats.low++;
        else if (status === "critical") this.stats.critical++;
      });
    },

    // === Paginacion ===
    get paginatedProducts() {
      const start = this.page * CONFIG.ITEMS_PER_PAGE;
      return this.filteredProducts.slice(start, start + CONFIG.ITEMS_PER_PAGE);
    },

    get totalPages() {
      return Math.ceil(this.filteredProducts.length / CONFIG.ITEMS_PER_PAGE);
    },

    get paginationInfo() {
      const start = this.filteredProducts.length > 0 ? this.page * CONFIG.ITEMS_PER_PAGE + 1 : 0;
      const end = Math.min((this.page + 1) * CONFIG.ITEMS_PER_PAGE, this.filteredProducts.length);
      return `Mostrando ${start}-${end} de ${this.filteredProducts.length} productos`;
    },

    nextPage() {
      if (this.page < this.totalPages - 1) this.page++;
    },

    prevPage() {
      if (this.page > 0) this.page--;
    },

    clearFilters() {
      this.filters = {
        search: "",
        category: "",
        stockStatus: "",
      };
      this.filterProducts();
    },

    openCategoryModal() {
      this.categoryFormData = { nombre: "", descripcion: "" };
      this.showCategoryModal = true;
    },

    closeCategoryModal() {
      this.showCategoryModal = false;
      this.categoryFormData = { nombre: "", descripcion: "" };
    },

    async createCategory() {
      try {
        await API.createCategoria(this.categoryFormData);
        showNotification("Categoria creada exitosamente", "success");
        this.closeCategoryModal();
        await this.loadCategories();
      } catch (err) {
        console.error("Error creating category:", err);
        showNotification(err.message || "Error al crear categoria", "error");
      }
    },

    resetForm() {
      this.formData = {
        codigo: "",
        nombre: "",
        descripcion: "",
        id_categoria: "",
        precio_actual: 0,
        precio_costo: 0,
        stock: 0,
        stock_minimo: 0,
        unidad_medida: "unidad",
      };
      this.editingProductId = null;
    },

    closeModals() {
      this.showCreateModal = false;
      this.showEditModal = false;
      this.resetForm();
    },

    async createProduct() {
      try {
        await API.createProducto(this.formData);
        showNotification("Producto creado exitosamente", "success");
        this.closeModals();
        await this.loadProducts();
      } catch (err) {
        console.error("Error creating product:", err);
        showNotification(err.message || "Error al crear producto", "error");
      }
    },

    editProduct(product) {
      this.formData = {
        codigo: product.codigo || "",
        nombre: product.nombre,
        descripcion: product.descripcion || "",
        id_categoria: product.id_categoria,
        precio_actual: product.precio_actual,
        precio_costo: product.precio_costo || 0,
        stock: product.stock,
        stock_minimo: product.stock_minimo,
        unidad_medida: product.unidad_medida,
      };
      this.editingProductId = product.id_producto;
      this.showEditModal = true;
    },

    async updateProduct() {
      try {
        await API.updateProducto(this.editingProductId, this.formData);
        showNotification("Producto actualizado exitosamente", "success");
        this.closeModals();
        await this.loadProducts();
      } catch (err) {
        console.error("Error updating product:", err);
        showNotification(err.message || "Error al actualizar producto", "error");
      }
    },

    async deleteProduct(product) {
      if (!confirm(`¿Estas seguro de eliminar "${product.nombre}"?`)) return;

      try {
        await API.deleteProducto(product.id_producto);
        showNotification("Producto eliminado exitosamente", "success");
        await this.loadProducts();
      } catch (err) {
        console.error("Error deleting product:", err);
        showNotification(err.message || "Error al eliminar producto", "error");
      }
    },

    openSaleModal(product) {
      this.selectedProduct = product;
      this.saleData = {
        cantidad: 1,
        precio_unitario: product.precio_actual,
        descuento: 0,
        metodo_pago: "efectivo",
        observaciones: "",
      };
      this.calculateSaleTotal();
      this.showSaleModal = true;
    },

    closeSaleModal() {
      this.showSaleModal = false;
      this.selectedProduct = null;
      this.saleTotal = 0;
    },

    calculateSaleTotal() {
      const subtotal =
        this.saleData.cantidad * this.saleData.precio_unitario;
      this.saleTotal = Math.max(0, subtotal - (this.saleData.descuento || 0));
    },

    async registerSale() {
      if (this.saleData.cantidad > this.selectedProduct.stock) {
        showNotification("No hay suficiente stock disponible", "error");
        return;
      }

      if (this.saleData.cantidad <= 0) {
        showNotification("La cantidad debe ser mayor a 0", "error");
        return;
      }

      const ventaData = {
        numero_ticket: `TICKET-${Date.now()}`,
        id_cliente: null,
        fecha: new Date().toISOString(),
        metodo_pago: this.saleData.metodo_pago,
        observaciones: this.saleData.observaciones || null,
        estado: "completada",
        detalles: [
          {
            id_producto: this.selectedProduct.id_producto,
            cantidad: this.saleData.cantidad,
            precio_unitario: this.saleData.precio_unitario,
            descuento: this.saleData.descuento || 0,
          },
        ],
      };

      try {
        const venta = await API.createVenta(ventaData);
        showNotification(
          `Venta registrada! Ticket: ${venta.numero_ticket} — Total: ${formatPrice(this.saleTotal)}`,
          "success",
        );
        this.closeSaleModal();
        await this.loadProducts();
      } catch (err) {
        console.error("Error registering sale:", err);
        showNotification(err.message || "Error al registrar la venta", "error");
      }
    },
  }));
});
