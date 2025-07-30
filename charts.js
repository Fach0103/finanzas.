// 🔧 Instancias globales de gráficos
let chartResumen = null;
let chartTransacciones = null;
let chartPresupuesto = null;

/**
 * 📊 Gráfico de resumen mensual (barras)
 */
function renderResumenMensual(ctx, datos) {
  const config = {
    type: 'bar',
    data: {
      labels: ['Ingresos', 'Gastos', 'Balance'],
      datasets: [{
        label: 'Resumen Mensual',
        data: [datos.ingresos, datos.gastos, datos.balance],
        backgroundColor: ['#4CAF50', '#F44336', '#2196F3']
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Resumen del Mes Actual' }
      }
    }
  };

  if (chartResumen) {
    chartResumen.data.datasets[0].data = config.data.datasets[0].data;
    chartResumen.update();
  } else {
    chartResumen = new Chart(ctx, config);
  }
}

/**
 * 📈 Gráfico de transacciones recientes (línea)
 */
function renderTransaccionesRecientes(ctx, datos) {
  const config = {
    type: 'line',
    data: {
      labels: datos.fechas,
      datasets: [{
        label: 'Transacciones',
        data: datos.montos,
        borderColor: '#673AB7',
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 500 },
      plugins: {
        title: { display: true, text: 'Transacciones Recientes' }
      }
    }
  };

  if (chartTransacciones) {
    chartTransacciones.data.labels = config.data.labels;
    chartTransacciones.data.datasets[0].data = config.data.datasets[0].data;
    chartTransacciones.update();
  } else {
    chartTransacciones = new Chart(ctx, config);
  }
}

/**
 * 💰 Gráfico de presupuesto actual (donut)
 */
function renderEstadoPresupuesto(ctx, datos) {
  const config = {
    type: 'doughnut',
    data: {
      labels: ['Gastado', 'Restante'],
      datasets: [{
        label: 'Presupuesto',
        data: [datos.gastado, datos.restante],
        backgroundColor: ['#E91E63', '#00BCD4']
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 500 },
      plugins: {
        title: { display: true, text: 'Estado del Presupuesto Actual' },
        legend: { position: 'bottom' }
      }
    }
  };

  if (chartPresupuesto) {
    chartPresupuesto.data.datasets[0].data = config.data.datasets[0].data;
    chartPresupuesto.update();
  } else {
    chartPresupuesto = new Chart(ctx, config);
  }
}

/**
 * 🚀 Renderiza todos los gráficos del dashboard con protección de datos
 */
export function inicializarGraficosDashboard(categorias, transacciones = [], presupuestos = {}) {
  const resumen = calcularResumen(transacciones);

  const recientes = transacciones.slice(-6);
  const fechas = recientes.map(t => t?.fecha ?? 'Sin fecha');
  const montos = recientes.map(t => typeof t?.amount === 'number' ? t.amount : 0);

  // 🛡️ Aseguramos que presupuestos sea un array válido
  const presupuestosArray = Array.isArray(presupuestos)
    ? presupuestos
    : Object.values(presupuestos || {});

  const totalPresupuestado = presupuestosArray.reduce((sum, p) => {
    const monto = typeof p?.amount === 'number' ? p.amount : 0;
    return sum + monto;
  }, 0);

  const totalGastado = resumen.gastos;
  const restante = Math.max(0, totalPresupuestado - totalGastado);

  const ctxResumen = document.getElementById('chart-resumen');
  const ctxTransacciones = document.getElementById('chart-transacciones');
  const ctxPresupuesto = document.getElementById('chart-presupuesto');

  if (ctxResumen && ctxTransacciones && ctxPresupuesto) {
    renderResumenMensual(ctxResumen, {
      ingresos: resumen.ingresos,
      gastos: resumen.gastos,
      balance: resumen.ingresos - resumen.gastos
    });

    renderTransaccionesRecientes(ctxTransacciones, { fechas, montos });

    renderEstadoPresupuesto(ctxPresupuesto, {
      gastado: totalGastado,
      restante
    });
  }
}

/**
 * 📌 Calcula resumen total de ingresos y gastos con fallback
 */
function calcularResumen(transacciones = []) {
  return transacciones.reduce(
    (acc, t) => {
      if (t?.tipo === 'ingreso') acc.ingresos += typeof t.amount === 'number' ? t.amount : 0;
      if (t?.tipo === 'egreso') acc.gastos += typeof t.amount === 'number' ? t.amount : 0;
      return acc;
    },
    { ingresos: 0, gastos: 0 }
  );
}
