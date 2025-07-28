// 🔧 Variables globales para mantener las instancias activas
let chartResumen = null;
let chartTransacciones = null;
let chartPresupuesto = null;

// 🟩 Gráfico de resumen mensual
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
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Resumen del Mes Actual'
        }
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

// 📈 Gráfico de transacciones recientes
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
      plugins: {
        title: {
          display: true,
          text: 'Transacciones Recientes'
        }
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

// 💰 Gráfico de estado del presupuesto
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
      plugins: {
        title: {
          display: true,
          text: 'Estado del Presupuesto Actual'
        },
        legend: {
          position: 'bottom'
        }
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

// 🎯 Inicializar todos los gráficos del dashboard
function inicializarGraficosDashboard(categorias, transacciones, presupuestos) {
  const resumen = calcularResumen(transacciones);
  const recientes = transacciones.slice(-6);
  const fechas = recientes.map(t => t.fecha);
  const montos = recientes.map(t => t.amount);

  const totalPresupuestado = presupuestos.reduce((sum, p) => sum + p.amount, 0);
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

// 🔍 Calcular resumen de ingresos/gastos
function calcularResumen(transacciones) {
  let ingresos = 0;
  let gastos = 0;
  transacciones.forEach(t => {
    if (t.tipo === 'ingreso') ingresos += t.amount;
    if (t.tipo === 'egreso') gastos += t.amount;
  });
  return { ingresos, gastos };
}
