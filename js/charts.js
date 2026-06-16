(function () {
  let instances = [];
  const palette = ['#07B56A', '#0B5CAD', '#F59E0B', '#E5484D', '#8B5CF6', '#14B8A6', '#64748B'];

  const destroyAll = () => {
    instances.forEach((chart) => chart.destroy());
    instances = [];
  };

  function makeChart(id, config) {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart) return;
    const chart = new Chart(canvas, config);
    instances.push(chart);
  }

  function moneyTick(value) {
    const n = Number(value || 0);
    if (Math.abs(n) >= 1000000) return `R$ ${(n / 1000000).toFixed(1)} mi`;
    return `R$ ${(n / 1000).toFixed(0)} mil`;
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Inter', weight: '700' } } }
    }
  };

  const ChartService = {
    renderDashboard(data, computeContract) {
      destroyAll();
      const contracts = data.contratos || [];
      const secretarias = data.secretarias || [];

      makeChart('chart-contratado-executado', {
        type: 'bar',
        data: {
          labels: contracts.map((c) => c.numero_contrato),
          datasets: [
            { label: 'Valor atualizado', data: contracts.map((c) => computeContract(c.id).valorAtual), backgroundColor: '#0B5CAD', borderRadius: 10 },
            { label: 'Executado', data: contracts.map((c) => computeContract(c.id).valorExecutado), backgroundColor: '#07B56A', borderRadius: 10 }
          ]
        },
        options: { ...baseOptions, scales: { y: { ticks: { callback: moneyTick }, grid: { color: '#EDF3F8' } }, x: { grid: { display: false } } } }
      });

      const statusCounts = contracts.reduce((acc, c) => {
        const key = Utils.statusLabel(c.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      makeChart('chart-status-contratos', {
        type: 'doughnut',
        data: { labels: Object.keys(statusCounts), datasets: [{ data: Object.values(statusCounts), backgroundColor: palette, borderWidth: 0 }] },
        options: { ...baseOptions, cutout: '70%' }
      });

      const bySecretaria = secretarias.map((s) => ({
        label: s.sigla,
        value: contracts.filter((c) => c.secretaria_id === s.id).reduce((acc, c) => acc + computeContract(c.id).valorAtual, 0)
      })).filter((x) => x.value > 0);
      makeChart('chart-secretarias', {
        type: 'bar',
        data: { labels: bySecretaria.map((x) => x.label), datasets: [{ label: 'Valor contratado', data: bySecretaria.map((x) => x.value), backgroundColor: '#07B56A', borderRadius: 10 }] },
        options: { ...baseOptions, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: moneyTick }, grid: { color: '#EDF3F8' } }, x: { grid: { display: false } } } }
      });

      const categorias = contracts.reduce((acc, c) => {
        const key = Utils.typeLabel(c.categoria || c.tipo);
        acc[key] = (acc[key] || 0) + computeContract(c.id).valorAtual;
        return acc;
      }, {});
      makeChart('chart-categorias', {
        type: 'pie',
        data: { labels: Object.keys(categorias), datasets: [{ data: Object.values(categorias), backgroundColor: palette, borderWidth: 0 }] },
        options: baseOptions
      });

      const paidByContract = contracts.map((c) => {
        const empenhos = (data.empenhos || []).filter((e) => e.contrato_id === c.id);
        return Utils.sum(empenhos, (e) => e.valor_pago);
      });
      makeChart('chart-pagamentos', {
        type: 'line',
        data: {
          labels: contracts.map((c) => c.numero_contrato),
          datasets: [{ label: 'Pago', data: paidByContract, borderColor: '#0B5CAD', backgroundColor: 'rgba(11,92,173,.12)', tension: .36, fill: true, pointRadius: 4 }]
        },
        options: { ...baseOptions, scales: { y: { ticks: { callback: moneyTick }, grid: { color: '#EDF3F8' } }, x: { grid: { display: false } } } }
      });
    },
    destroyAll
  };

  window.ChartService = ChartService;
})();
