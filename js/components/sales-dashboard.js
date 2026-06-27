/** Componente Alpine: Dashboard de Ventas (historial_ventas.html) */

document.addEventListener("alpine:init", () => {
  Alpine.data("salesDashboard", () => ({
    loading: true,
    activeTab: "overview",
    sales: [],
    productSales: [],

    filters: {
      fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      fecha_fin: new Date().toISOString().split("T")[0],
      metodo_pago: "",
    },

    stats: {
      total_revenue: 0,
      total_sales: 0,
      total_products_sold: 0,
      average_ticket: 0,
      top_product: "",
    },

    async init() {
      await this.loadData();
    },

    async loadData() {
      this.loading = true;
      try {
        await Promise.all([this.loadSales(), this.loadProductSales()]);
        this.calculateStats();
        this.$nextTick(() => {
          this.renderCharts();
        });
      } finally {
        this.loading = false;
      }
    },

    async loadSales() {
      try {
        const params = {};
        if (this.filters.fecha_inicio) {
          params.fecha_inicio = `${this.filters.fecha_inicio}T00:00:00`;
        }
        if (this.filters.fecha_fin) {
          params.fecha_fin = `${this.filters.fecha_fin}T23:59:59`;
        }
        if (this.filters.metodo_pago) {
          params.metodo_pago = this.filters.metodo_pago;
        }
        this.sales = await API.getVentas(params);
      } catch (err) {
        console.error("Error loading sales:", err);
        showNotification("Error al cargar ventas", "error");
        this.sales = [];
      }
    },

    async loadProductSales() {
      try {
        const weekAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const sales = await API.getVentas({ fecha_inicio: weekAgo });

        const productMap = new Map();

        for (const sale of sales) {
          if (!sale.detalles) continue;

          for (const detalle of sale.detalles) {
            const productId = detalle.id_producto;

            if (!productMap.has(productId)) {
              productMap.set(productId, {
                id_producto: productId,
                nombre:
                  detalle.producto?.nombre || "Producto Desconocido",
                cantidad_vendida: 0,
                total_vendido: 0,
                ganancia: 0,
              });
            }

            const product = productMap.get(productId);
            product.cantidad_vendida += detalle.cantidad;
            product.total_vendido += detalle.subtotal;

            const costoTotal =
              (detalle.producto?.precio_costo || 0) * detalle.cantidad;
            product.ganancia += detalle.subtotal - costoTotal;
          }
        }

        this.productSales = Array.from(productMap.values()).sort(
          (a, b) => b.total_vendido - a.total_vendido,
        );
      } catch (err) {
        console.error("Error loading product sales:", err);
        showNotification("Error al cargar ventas por producto", "error");
        this.productSales = [];
      }
    },

    calculateStats() {
      this.stats.total_revenue = this.sales.reduce(
        (sum, sale) => sum + (sale.total || 0),
        0,
      );
      this.stats.total_sales = this.sales.length;

      let totalProducts = 0;
      const productCount = new Map();

      this.sales.forEach((sale) => {
        if (sale.detalles) {
          sale.detalles.forEach((detalle) => {
            totalProducts += detalle.cantidad;
            const productName = detalle.producto?.nombre || "Desconocido";
            productCount.set(
              productName,
              (productCount.get(productName) || 0) + detalle.cantidad,
            );
          });
        }
      });

      this.stats.total_products_sold = totalProducts;
      this.stats.average_ticket =
        this.stats.total_sales > 0
          ? this.stats.total_revenue / this.stats.total_sales
          : 0;

      let maxCount = 0;
      let topProduct = "";
      productCount.forEach((count, name) => {
        if (count > maxCount) {
          maxCount = count;
          topProduct = name;
        }
      });
      this.stats.top_product = topProduct;
    },

    renderCharts() {
      renderDailySalesChart(this.sales);
      renderPaymentMethodChart(this.sales);
      renderTopProductsChart(this.productSales);
    },

    setQuickPeriod(period) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      switch (period) {
        case "today":
          this.filters.fecha_inicio = today.toISOString().split("T")[0];
          this.filters.fecha_fin = today.toISOString().split("T")[0];
          break;
        case "yesterday":
          this.filters.fecha_inicio = yesterday.toISOString().split("T")[0];
          this.filters.fecha_fin = yesterday.toISOString().split("T")[0];
          break;
        case "week": {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          this.filters.fecha_inicio = weekStart.toISOString().split("T")[0];
          this.filters.fecha_fin = today.toISOString().split("T")[0];
          break;
        }
        case "month": {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          this.filters.fecha_inicio = monthStart.toISOString().split("T")[0];
          this.filters.fecha_fin = today.toISOString().split("T")[0];
          break;
        }
        case "last_month": {
          const lastMonthStart = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1,
          );
          const lastMonthEnd = new Date(
            today.getFullYear(),
            today.getMonth(),
            0,
          );
          this.filters.fecha_inicio = lastMonthStart.toISOString().split("T")[0];
          this.filters.fecha_fin = lastMonthEnd.toISOString().split("T")[0];
          break;
        }
      }

      if (period) {
        this.loadData();
      }
    },
  }));
});
