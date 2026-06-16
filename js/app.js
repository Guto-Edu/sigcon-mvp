(function () {
  let data = StorageService.load();
  let currentView = 'dashboard';
  let currentSearch = '';
  let currentContractId = null;
  let currentContractTab = 'resumo';
  let reportRows = [];
  let filters = { status: '', secretaria: '', categoria: '', fornecedor: '' };

  const navItems = [
    ['dashboard', 'layout-dashboard', 'Dashboard'],
    ['licitacoes', 'badge-check', 'Licitações'],
    ['contratos', 'file-stack', 'Contratos'],
    ['execucao', 'workflow', 'Execução'],
    ['fiscalizacao', 'clipboard-check', 'Fiscalização'],
    ['aditivos', 'file-pen-line', 'Aditivos'],
    ['fornecedores', 'building-2', 'Fornecedores'],
    ['alertas', 'bell-ring', 'Alertas'],
    ['documentos', 'folder-open', 'Documentos'],
    ['relatorios', 'bar-chart-3', 'Relatórios'],
    ['inteligencia', 'brain-circuit', 'Inteligência'],
    ['auditoria', 'history', 'Auditoria'],
    ['transparencia', 'globe-2', 'Transparência'],
    ['configuracoes', 'settings', 'Configurações']
  ];

  const contractStatuses = ['draft', 'pending_signature', 'active', 'near_expiration', 'expired', 'suspended', 'terminated', 'closed'];
  const aditivoTypes = ['prorrogacao', 'acrescimo', 'supressao', 'reequilibrio', 'reajuste', 'repactuacao', 'apostilamento', 'rescisao', 'suspensao'];

  const $ = (id) => document.getElementById(id);
  const icon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`;
  const hydrateIcons = () => setTimeout(() => window.lucide?.createIcons({ attrs: { 'aria-hidden': 'true' } }), 0);

  ensureDataShape();

  function ensureDataShape() {
    const fallback = Utils.copyDeep(window.SIGCON_INITIAL_DATA?.inteligencia || {});
    let changed = false;
    if (!data.inteligencia) {
      data.inteligencia = fallback;
      changed = true;
    } else {
      Object.entries(fallback).forEach(([key, value]) => {
        if (data.inteligencia[key] === undefined) {
          data.inteligencia[key] = value;
          changed = true;
        }
      });
    }
    if (!Array.isArray(data.inteligencia.decisoes)) {
      data.inteligencia.decisoes = [];
      changed = true;
    }
    const legacyKey = ['e', 't', 'e', 'c'].join('');
    if (data[legacyKey]) {
      delete data[legacyKey];
      changed = true;
    }
    if (changed) StorageService.save(data);
  }

  function currentUser() { return Utils.getById(data.usuarios, StorageService.getCurrentUserId()) || data.usuarios[0]; }
  function save() { StorageService.save(data); }
  function fornecedor(id) { return Utils.getById(data.fornecedores, id); }
  function usuario(id) { return Utils.getById(data.usuarios, id); }
  function secretaria(id) { return Utils.getById(data.secretarias, id); }
  function contrato(id) { return Utils.getById(data.contratos, id); }
  function licitacao(id) { return Utils.getById(data.licitacoes, id); }
  function itemContrato(id) { return Utils.getById(data.contrato_itens, id); }
  function ordem(id) { return Utils.getById(data.ordens, id); }
  function nf(id) { return Utils.getById(data.notas_fiscais, id); }
  function empenho(id) { return Utils.getById(data.empenhos, id); }

  function logAction(acao, modulo, registro_id, descricao) {
    data.auditoria.unshift({
      id: Utils.uuid('aud'),
      usuario_id: currentUser().id,
      data_hora: new Date().toISOString(),
      acao,
      modulo,
      registro_id,
      descricao
    });
    save();
  }

  function toast(message, type = 'success') {
    const root = $('toast-root');
    const tone = type === 'error' ? 'bg-red-600' : type === 'warn' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950';
    const name = type === 'error' ? 'circle-alert' : type === 'warn' ? 'triangle-alert' : 'check-circle-2';
    const el = document.createElement('div');
    el.className = `toast ${tone} text-white px-5 py-4 font-bold max-w-md`;
    el.innerHTML = `<div class="flex gap-3 items-start">${icon(name, 'mt-0.5 shrink-0')}<span>${Utils.escape(message)}</span></div>`;
    root.appendChild(el);
    hydrateIcons();
    setTimeout(() => el.remove(), 3600);
  }

  function requirePermission(action) {
    if (!Utils.canRole(currentUser().perfil, action)) {
      toast(`Perfil ${currentUser().perfil} teria restrição no sistema real. A ação será simulada e auditada.`, 'warn');
    }
    return true;
  }

  function enrichItem(item) {
    const valorTotal = Number(item.quantidade_contratada || 0) * Number(item.valor_unitario || 0);
    const valorExecutado = Number(item.quantidade_executada || 0) * Number(item.valor_unitario || 0);
    const saldoQuantidade = Number(item.quantidade_contratada || 0) - Number(item.quantidade_executada || 0);
    const saldoValor = saldoQuantidade * Number(item.valor_unitario || 0);
    return {
      ...item,
      valor_total: valorTotal,
      valor_executado: valorExecutado,
      saldo_quantidade: saldoQuantidade,
      saldo_valor: saldoValor,
      percentual_execucao: Utils.perc(item.quantidade_executada, item.quantidade_contratada),
      percentual_saldo: 100 - Utils.perc(item.quantidade_executada, item.quantidade_contratada)
    };
  }

  function computeContract(contractId) {
    const c = contrato(contractId);
    if (!c) return { valorAtual: 0, valorExecutado: 0, valorPago: 0, valorLiquidado: 0, saldoContratual: 0, progresso: 0, itens: [], aditivos: [] };
    const aditivos = data.aditivos.filter((a) => a.contrato_id === contractId);
    const valorAtual = Number(c.valor_original || 0) + Utils.sum(aditivos, (a) => a.valor_acrescimo || 0) - Utils.sum(aditivos, (a) => a.valor_supressao || 0);
    const itens = data.contrato_itens.filter((i) => i.contrato_id === contractId).map(enrichItem);
    const valorExecutado = Utils.sum(itens, (i) => i.valor_executado);
    const empenhos = data.empenhos.filter((e) => e.contrato_id === contractId);
    const valorLiquidado = Utils.sum(empenhos, (e) => e.valor_liquidado);
    const valorPago = Utils.sum(empenhos, (e) => e.valor_pago);
    const saldoContratual = valorAtual - valorExecutado;
    return { valorAtual, valorExecutado, valorLiquidado, valorPago, saldoContratual, progresso: Utils.perc(valorExecutado, valorAtual), itens, aditivos };
  }

  function calcEmpenho(e) {
    return {
      saldo_empenho: Number(e.valor_empenhado || 0) - Number(e.valor_liquidado || 0),
      saldo_a_pagar: Number(e.valor_liquidado || 0) - Number(e.valor_pago || 0)
    };
  }

  function contractRisk(c) {
    const days = Utils.daysUntil(c.data_fim);
    const docsPending = data.documentos.some((d) => d.contrato_id === c.id && d.obrigatorio && d.status === 'pendente');
    const fiscal = data.fiscalizacoes.find((f) => f.contrato_id === c.id);
    if (c.status === 'expired' || docsPending || !c.fiscal_titular_id || fiscal?.risco === 'alto') return 'alto';
    if (days <= 30 || fiscal?.risco === 'medio' || data.ocorrencias.some((o) => o.contrato_id === c.id)) return 'medio';
    return 'baixo';
  }

  function visibleText(obj, extra = '') {
    return Utils.normalizeText(`${Object.values(obj || {}).join(' ')} ${extra}`);
  }

  function matchesSearch(obj, extra = '') {
    return !currentSearch || visibleText(obj, extra).includes(Utils.normalizeText(currentSearch));
  }

  function filteredContracts() {
    return data.contratos.filter((c) => {
      const extra = `${fornecedor(c.fornecedor_id)?.razao_social} ${fornecedor(c.fornecedor_id)?.nome_fantasia} ${secretaria(c.secretaria_id)?.nome} ${licitacao(c.licitacao_id)?.numero_licitacao}`;
      if (!matchesSearch(c, extra)) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.secretaria && c.secretaria_id !== filters.secretaria) return false;
      if (filters.categoria && c.categoria !== filters.categoria) return false;
      if (filters.fornecedor && c.fornecedor_id !== filters.fornecedor) return false;
      return true;
    });
  }

  function dashboardMetrics() {
    const contracts = data.contratos;
    const active = contracts.filter((c) => ['active', 'near_expiration'].includes(c.status)).length;
    const vencer30 = contracts.filter((c) => Utils.daysUntil(c.data_fim) >= 0 && Utils.daysUntil(c.data_fim) <= 30).length;
    const vencer60 = contracts.filter((c) => Utils.daysUntil(c.data_fim) > 30 && Utils.daysUntil(c.data_fim) <= 60).length;
    const vencer90 = contracts.filter((c) => Utils.daysUntil(c.data_fim) > 60 && Utils.daysUntil(c.data_fim) <= 90).length;
    const valorTotal = Utils.sum(contracts, (c) => computeContract(c.id).valorAtual);
    const executado = Utils.sum(contracts, (c) => computeContract(c.id).valorExecutado);
    const liquidado = Utils.sum(contracts, (c) => computeContract(c.id).valorLiquidado);
    const pago = Utils.sum(contracts, (c) => computeContract(c.id).valorPago);
    const saldo = valorTotal - executado;
    const semFiscal = contracts.filter((c) => !c.fiscal_titular_id).length;
    const aditivosPendentes = data.aditivos.filter((a) => a.numero.toLowerCase().includes('minuta')).length;
    const docsPendentes = data.documentos.filter((d) => d.obrigatorio && d.status === 'pendente').length;
    const pagamentosPendentes = Utils.sum(data.liquidacoes, (l) => Math.max(0, Number(l.valor_liquidado) - Utils.sum(data.pagamentos.filter((p) => p.liquidacao_id === l.id), (p) => p.valor_pago)));
    return { active, vencer30, vencer60, vencer90, valorTotal, executado, liquidado, pago, saldo, semFiscal, aditivosPendentes, docsPendentes, pagamentosPendentes };
  }

  function buildAlerts() {
    const alerts = [];
    data.contratos.forEach((c) => {
      const calc = computeContract(c.id);
      const f = fornecedor(c.fornecedor_id)?.nome_fantasia || 'Fornecedor';
      const days = Utils.daysUntil(c.data_fim);
      if (days >= 0 && days <= 30) alerts.push({ tipo: 'Contrato vencendo', titulo: `${c.numero_contrato} vence em ${days} dia(s)`, detalhe: `${f} - ${secretaria(c.secretaria_id)?.sigla}. Prorrogação pode ser aditivo e exige instrução antecipada.`, nivel: days <= 10 ? 'alto' : 'medio', contrato_id: c.id });
      if (days < 0 && c.status !== 'closed') alerts.push({ tipo: 'Contrato vencido', titulo: `${c.numero_contrato} está vencido`, detalhe: `Vencimento em ${Utils.date(c.data_fim)} com saldo ${Utils.currency(calc.saldoContratual)}.`, nivel: 'alto', contrato_id: c.id });
      if (!c.fiscal_titular_id) alerts.push({ tipo: 'Fiscal não designado', titulo: `${c.numero_contrato} sem fiscal titular`, detalhe: 'A designação formal é obrigatória para rastreabilidade da execução.', nivel: 'alto', contrato_id: c.id });
      if (calc.saldoContratual <= calc.valorAtual * .12 && c.status !== 'closed') alerts.push({ tipo: 'Saldo baixo', titulo: `${c.numero_contrato} com saldo contratual baixo`, detalhe: `Saldo disponível de ${Utils.currency(calc.saldoContratual)}.`, nivel: 'medio', contrato_id: c.id });
    });
    data.fornecedores.forEach((f) => {
      if (f.situacao === 'irregular' || Utils.normalizeText(f.certidoes).includes('vence')) alerts.push({ tipo: 'Certidão', titulo: `${f.nome_fantasia}: ${f.certidoes}`, detalhe: 'Regularidade cadastral impacta pagamento, prorrogação e nova contratação.', nivel: f.situacao === 'irregular' ? 'alto' : 'medio', fornecedor_id: f.id });
    });
    data.notas_fiscais.filter((n) => ['recebida', 'em_analise'].includes(n.status) && Utils.daysUntil(n.data_emissao) <= -5)
      .forEach((n) => alerts.push({ tipo: 'Nota fiscal', titulo: `${n.numero_nf} aguarda tratamento`, detalhe: `${contrato(n.contrato_id)?.numero_contrato} emitida em ${Utils.date(n.data_emissao)}.`, nivel: 'medio', contrato_id: n.contrato_id }));
    data.documentos.filter((d) => d.obrigatorio && d.status === 'pendente')
      .forEach((d) => alerts.push({ tipo: 'Documento obrigatório', titulo: d.nome, detalhe: `${contrato(d.contrato_id)?.numero_contrato} sem documento obrigatório anexado.`, nivel: 'alto', contrato_id: d.contrato_id }));
    data.ordens.filter((o) => !['entregue_total', 'cancelada'].includes(o.status) && Utils.daysUntil(o.data_prevista) < 0)
      .forEach((o) => alerts.push({ tipo: 'Medição/entrega atrasada', titulo: `${o.numero} está atrasada`, detalhe: `Prevista para ${Utils.date(o.data_prevista)}.`, nivel: 'alto', contrato_id: o.contrato_id }));
    return alerts.sort((a, b) => (a.nivel === 'alto' ? -1 : 1) - (b.nivel === 'alto' ? -1 : 1));
  }

  function activeFilterChips() {
    const chips = [];
    if (filters.status) chips.push(`Status: ${Utils.statusLabel(filters.status)}`);
    if (filters.secretaria) chips.push(`Secretaria: ${secretaria(filters.secretaria)?.sigla}`);
    if (filters.categoria) chips.push(`Categoria: ${Utils.typeLabel(filters.categoria)}`);
    if (filters.fornecedor) chips.push(`Fornecedor: ${fornecedor(filters.fornecedor)?.nome_fantasia}`);
    if (currentSearch) chips.push(`Busca: ${Utils.escape(currentSearch)}`);
    return chips.length ? `<div class="flex flex-wrap gap-2 mt-3">${chips.map((c) => `<span class="badge badge-blue">${c}</span>`).join('')}<button class="btn btn-mini btn-soft" onclick="clearFilters()">Limpar filtros</button></div>` : '';
  }

  function pageTitle(kicker, title, subtitle, actions = '') {
    return `
      <div class="mb-6 flex flex-col 2xl:flex-row gap-4 2xl:items-end justify-between">
        <div>
          <p class="text-xs uppercase tracking-[.24em] text-slate-400 font-black">${kicker}</p>
          <h2 class="text-3xl font-black tracking-tight mt-1">${title}</h2>
          <p class="text-slate-500 font-semibold mt-1 max-w-4xl">${subtitle}</p>
        </div>
        <div class="flex flex-wrap gap-2">${actions}</div>
      </div>`;
  }

  function filterPanel(inner) {
    return `<div class="sig-card p-4 mb-5">${inner}${activeFilterChips()}</div>`;
  }

  function kpiCard(label, value, iconName, tone = 'blue', note = '') {
    const bg = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', yellow: 'bg-amber-50 text-amber-700', red: 'bg-rose-50 text-rose-700', purple: 'bg-violet-50 text-violet-700' }[tone] || 'bg-slate-50 text-slate-700';
    return `<div class="sig-card-sm hover-lift p-5"><div class="flex items-start justify-between gap-4"><div><p class="text-sm font-bold text-slate-500">${label}</p><p class="mt-2 text-2xl font-black tracking-tight">${value}</p>${note ? `<p class="text-xs font-bold text-slate-400 mt-1">${note}</p>` : ''}</div><div class="kpi-icon ${bg}">${icon(iconName)}</div></div></div>`;
  }

  function actionButton(label, onclick, cls = 'btn-soft', iconName = 'arrow-right', mini = true) {
    return `<button class="btn ${mini ? 'btn-mini' : ''} ${cls}" onclick="${onclick}">${icon(iconName)}${label}</button>`;
  }

  function emptyState(title, desc, action = '') {
    return `<div class="sig-card p-8 text-center"><div class="mx-auto kpi-icon bg-slate-50 text-slate-500">${icon('inbox')}</div><h3 class="font-black text-lg mt-3">${title}</h3><p class="text-sm text-slate-500 font-semibold mt-1">${desc}</p>${action ? `<div class="mt-4">${action}</div>` : ''}</div>`;
  }

  function statBox(label, value, detail = '') {
    return `<div class="rounded-2xl bg-slate-50 p-4"><p class="text-xs uppercase tracking-[.12em] font-black text-slate-400">${label}</p><p class="font-black mt-1">${value}</p>${detail ? `<p class="text-xs font-semibold text-slate-500 mt-1">${detail}</p>` : ''}</div>`;
  }

  function renderShell() {
    const app = $('app');
    if ($('content')) {
      renderNav();
      $('current-user-card').innerHTML = `<p class="text-sm font-black">${Utils.escape(currentUser().nome)}</p><p class="text-xs text-white/75">${Utils.escape(currentUser().perfil)}</p>`;
      $('user-select').value = currentUser().id;
      const globalInput = $('global-search');
      if (globalInput && document.activeElement !== globalInput) globalInput.value = currentSearch;
      hydrateIcons();
      return;
    }
    app.innerHTML = `
      <aside id="sidebar" class="sidebar sidebar-gradient fixed left-0 top-0 bottom-0 w-[292px] text-white flex flex-col">
        <div class="p-6 border-b border-white/15">
          <div class="h-14 flex items-center"><img src="assets/logo-comprida.png" alt="SIGCON" class="w-[210px] max-h-14 object-contain" /></div>
        </div>
        <nav class="flex-1 overflow-y-auto p-4 space-y-1" id="nav-list" aria-label="Navegação principal"></nav>
      </aside>
      <main class="main-with-sidebar ml-[292px] min-h-screen">
        <header class="sticky top-0 z-30 bg-[#F4F8FB]/88 backdrop-blur-xl border-b border-[#DDE8F4]">
          <div class="px-5 xl:px-8 py-4 flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
            <div class="flex items-center gap-4">
              <button class="btn btn-soft lg:hidden" aria-label="Abrir menu" onclick="toggleSidebar()">${icon('menu')}</button>
              <div>
                <p class="text-xs uppercase tracking-[.22em] text-slate-400 font-black">${Utils.escape(data.meta.municipio)}</p>
                <h1 class="text-2xl font-black tracking-tight">${Utils.escape(data.meta.appName)}</h1>
                <p class="text-sm text-slate-500 font-semibold">${Utils.escape(data.meta.subtitle)}</p>
              </div>
            </div>
            <div class="flex flex-col md:flex-row gap-3 md:items-center">
              <div class="relative">
                <input id="global-search" class="input pl-10 min-w-[280px]" placeholder="Busca global: contrato, fornecedor, processo..." value="${Utils.escape(currentSearch)}" oninput="globalSearch(this.value)">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">${icon('search')}</span>
              </div>
              <select id="user-select" class="select min-w-[235px]" onchange="changeUser(this.value)" aria-label="Perfil simulado">
                ${data.usuarios.map((u) => `<option value="${u.id}" ${u.id === currentUser().id ? 'selected' : ''}>${Utils.escape(u.nome)} - ${Utils.escape(u.perfil)}</option>`).join('')}
              </select>
              <button class="btn btn-soft" onclick="exportJSON()">${icon('download')}Exportar</button>
            </div>
          </div>
        </header>
        <section id="content" class="p-5 xl:p-8"></section>
      </main>`;
    renderNav();
    hydrateIcons();
  }

  function renderNav() {
    const nav = $('nav-list');
    if (!nav) return;
    nav.innerHTML = navItems.map(([key, iconName, label]) => `
      <button class="nav-item ${currentView === key ? 'active' : ''}" onclick="navigate('${key}')">
        <span class="nav-icon">${icon(iconName)}</span><span class="truncate">${label}</span>${navBadge(key)}
      </button>`).join('');
    hydrateIcons();
  }

  function navBadge(key) {
    if (key === 'alertas') {
      const count = buildAlerts().filter((a) => a.nivel === 'alto').length;
      return count ? `<span class="ml-auto rounded-full bg-red-500 text-white text-xs px-2 py-1">${count}</span>` : '';
    }
    if (key === 'aditivos') {
      const count = data.aditivos.filter((a) => a.numero.toLowerCase().includes('minuta')).length;
      return count ? `<span class="ml-auto rounded-full bg-amber-300 text-slate-950 text-xs px-2 py-1">${count}</span>` : '';
    }
    if (key === 'inteligencia') {
      const count = predictiveInsights().filter((i) => i.nivel === 'alto').length;
      return count ? `<span class="ml-auto rounded-full bg-red-500 text-white text-xs px-2 py-1">${count}</span>` : '';
    }
    return '';
  }

  function setContent(html) {
    $('content').innerHTML = html;
    hydrateIcons();
  }

  function renderDashboard() {
    const m = dashboardMetrics();
    const alerts = buildAlerts();
    const upcoming = data.contratos
      .filter((c) => Utils.daysUntil(c.data_fim) >= 0)
      .sort((a, b) => Utils.daysUntil(a.data_fim) - Utils.daysUntil(b.data_fim))
      .slice(0, 6);
    setContent(`
      ${pageTitle('Painel executivo', 'Visão geral de contratos públicos', 'Indicadores de vigência, execução financeira, alertas críticos, aditivos e fiscalização contratual.', `<button class="btn btn-primary" onclick="openContractForm()">${icon('plus')}Novo contrato</button><button class="btn btn-soft" onclick="navigate('alertas')">${icon('bell-ring')}Central de alertas</button>`)}
      <div id="print-zone">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          ${kpiCard('Contratos ativos', m.active, 'file-check-2', 'green')}
          ${kpiCard('Vencem em 30 dias', m.vencer30, 'timer', 'yellow', `${m.vencer60} em 60 dias, ${m.vencer90} em 90 dias`)}
          ${kpiCard('Valor total contratado', Utils.currency(m.valorTotal), 'landmark', 'blue')}
          ${kpiCard('Saldo contratual', Utils.currency(m.saldo), 'wallet-cards', m.saldo < 0 ? 'red' : 'green')}
          ${kpiCard('Executado', Utils.currency(m.executado), 'activity', 'purple', `${Utils.number(Utils.perc(m.executado, m.valorTotal), 1)}% do contratado`)}
          ${kpiCard('Liquidado / pago', Utils.currency(m.liquidado), 'receipt', 'blue', `${Utils.currency(m.pago)} pago`)}
          ${kpiCard('Aditivos pendentes', m.aditivosPendentes, 'file-clock', 'yellow', 'Minutas ou análise em aberto')}
          ${kpiCard('Sem fiscal / doc. pendente', `${m.semFiscal} / ${m.docsPendentes}`, 'shield-alert', 'red')}
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div class="sig-card p-5 xl:col-span-2"><div class="flex items-center justify-between mb-4"><h3 class="font-black">Contratado x executado</h3><span class="badge badge-blue">Financeiro</span></div><div class="h-[310px]"><canvas id="chart-contratado-executado"></canvas></div></div>
          <div class="sig-card p-5"><div class="flex items-center justify-between mb-4"><h3 class="font-black">Status dos contratos</h3><span class="badge badge-green">Carteira</span></div><div class="h-[310px]"><canvas id="chart-status-contratos"></canvas></div></div>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
          <div class="sig-card p-5 xl:col-span-2"><h3 class="font-black mb-4">Valores por secretaria</h3><div class="h-[260px]"><canvas id="chart-secretarias"></canvas></div></div>
          <div class="sig-card p-5"><h3 class="font-black mb-4">Categorias</h3><div class="h-[260px]"><canvas id="chart-categorias"></canvas></div></div>
          <div class="sig-card p-5"><h3 class="font-black mb-4">Pagamentos</h3><div class="h-[260px]"><canvas id="chart-pagamentos"></canvas></div></div>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div class="sig-card p-5 xl:col-span-2">
            <div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">Alertas inteligentes</h3><span class="badge badge-red">${alerts.length} alertas</span></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${alerts.slice(0, 8).map(alertCard).join('') || emptyState('Sem alertas', 'Nenhum alerta automático identificado.')}
            </div>
          </div>
          <div class="sig-card p-5">
            <h3 class="font-black text-lg mb-4">Próximos vencimentos</h3>
            <div class="space-y-3">${upcoming.map((c) => `<button class="w-full text-left rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 p-4 transition" onclick="openContractDetails('${c.id}')"><div class="flex justify-between gap-3"><strong>${c.numero_contrato}</strong><span class="badge ${Utils.daysUntil(c.data_fim) <= 30 ? 'badge-yellow' : 'badge-blue'}">${Utils.daysUntil(c.data_fim)} dias</span></div><p class="text-sm text-slate-500 font-semibold mt-1">${fornecedor(c.fornecedor_id)?.nome_fantasia} - ${secretaria(c.secretaria_id)?.sigla}</p></button>`).join('')}</div>
          </div>
        </div>
      </div>`);
    ChartService.renderDashboard(data, computeContract);
  }

  function alertCard(a) {
    const cls = a.nivel === 'alto' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50';
    return `<div class="rounded-2xl border ${cls} p-4"><div class="flex gap-3"><div class="kpi-icon ${a.nivel === 'alto' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">${icon(a.nivel === 'alto' ? 'circle-alert' : 'triangle-alert')}</div><div><p class="text-xs uppercase tracking-[.12em] font-black text-slate-500">${a.tipo}</p><p class="font-black mt-1">${Utils.escape(a.titulo)}</p><p class="text-sm text-slate-600 font-semibold mt-1">${Utils.escape(a.detalhe)}</p>${a.contrato_id ? `<button class="btn btn-mini btn-soft mt-3" onclick="openContractDetails('${a.contrato_id}')">${icon('eye')}Ver contrato</button>` : ''}</div></div></div>`;
  }

  function renderContratos() {
    const rows = filteredContracts();
    const categorias = [...new Set(data.contratos.map((c) => c.categoria))];
    setContent(`
      ${pageTitle('Gestão contratual', 'Contratos administrativos', 'Controle completo de vigência, valores, fiscais, saldo, aditivos, documentos e execução contratual.', `<button class="btn btn-primary" onclick="openContractForm()">${icon('plus')}Novo contrato</button><button class="btn btn-soft" onclick="sortContractsByEndDate()">${icon('arrow-up-down')}Ordenar vencimento</button>`)}
      ${filterPanel(`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3"><input class="input xl:col-span-2" placeholder="Buscar por número, objeto, fornecedor, processo..." value="${Utils.escape(currentSearch)}" oninput="globalSearch(this.value)"><select class="select" onchange="setFilter('status', this.value)"><option value="">Todos status</option>${contractStatuses.map((s) => `<option value="${s}" ${filters.status === s ? 'selected' : ''}>${Utils.statusLabel(s)}</option>`).join('')}</select><select class="select" onchange="setFilter('secretaria', this.value)"><option value="">Todas secretarias</option>${data.secretarias.map((s) => `<option value="${s.id}" ${filters.secretaria === s.id ? 'selected' : ''}>${s.sigla}</option>`).join('')}</select><select class="select" onchange="setFilter('categoria', this.value)"><option value="">Todas categorias</option>${categorias.map((c) => `<option value="${c}" ${filters.categoria === c ? 'selected' : ''}>${Utils.typeLabel(c)}</option>`).join('')}</select><select class="select" onchange="setFilter('fornecedor', this.value)"><option value="">Todos fornecedores</option>${data.fornecedores.map((f) => `<option value="${f.id}" ${filters.fornecedor === f.id ? 'selected' : ''}>${f.nome_fantasia}</option>`).join('')}</select></div><p class="text-sm text-slate-500 font-bold mt-3">${rows.length} resultado(s)</p>`)}
      <div class="table-wrap"><table class="sig-table"><thead><tr><th>Contrato</th><th>Fornecedor</th><th>Secretaria</th><th>Vigência</th><th>Valor / saldo</th><th>Execução</th><th>Risco</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        ${rows.map(contractRow).join('') || `<tr><td colspan="9">${emptyState('Nenhum contrato encontrado', 'Ajuste os filtros para ampliar a busca.')}</td></tr>`}
      </tbody></table></div>`);
  }

  function renderLicitacoes() {
    const modalidades = [...new Set(data.licitacoes.map((l) => l.modalidade))];
    const rows = data.licitacoes.filter((l) => matchesSearch(l, `${fornecedor(l.fornecedor_vencedor)?.razao_social} ${secretaria(l.secretaria_solicitante)?.nome}`));
    setContent(`
      ${pageTitle('Pós-licitação', 'Licitações concluídas', 'Certames homologados, adjudicados ou concluídos, prontos para formalização e acompanhamento contratual.', `<button class="btn btn-soft" onclick="exportCSV('licitacoes')">${icon('download')}Exportar CSV</button>`)}
      ${filterPanel(`<div class="grid grid-cols-1 md:grid-cols-5 gap-3"><input class="input md:col-span-2" placeholder="Buscar licitação, processo, objeto ou fornecedor" value="${Utils.escape(currentSearch)}" oninput="globalSearch(this.value)"><select class="select" onchange="globalSearch(this.value)"><option value="">Todas modalidades</option>${modalidades.map((m) => `<option>${m}</option>`).join('')}</select><select class="select" onchange="globalSearch(this.value)"><option value="">Todas secretarias</option>${data.secretarias.map((s) => `<option>${s.sigla}</option>`).join('')}</select><button class="btn btn-soft" onclick="clearFilters()">${icon('x')}Limpar</button></div><p class="text-sm text-slate-500 font-bold mt-3">${rows.length} resultado(s)</p>`)}
      <div class="table-wrap"><table class="sig-table"><thead><tr><th>Licitação</th><th>Processo / modalidade</th><th>Objeto</th><th>Secretaria</th><th>Fornecedor vencedor</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead><tbody>${rows.map((l) => {
        const existing = data.contratos.find((c) => c.licitacao_id === l.id);
        return `<tr><td><p class="font-black">${l.numero_licitacao}</p><p class="text-xs text-slate-500">${Utils.date(l.data_homologacao)}</p></td><td><p class="font-bold">${l.processo_administrativo}</p><p class="text-xs text-slate-500">${l.modalidade}</p></td><td class="max-w-xl">${Utils.escape(l.objeto)}</td><td>${secretaria(l.secretaria_solicitante)?.sigla}</td><td>${fornecedor(l.fornecedor_vencedor)?.nome_fantasia}</td><td class="font-black">${Utils.currency(l.valor_homologado)}</td><td>${Utils.badge(l.status)}</td><td>${existing ? actionButton('Abrir contrato', `openContractDetails('${existing.id}')`, 'btn-blue', 'eye') : actionButton('Criar contrato', `createContractFromLicitation('${l.id}')`, 'btn-primary', 'plus')}</td></tr>`;
      }).join('')}</tbody></table></div>`);
  }

  function contractRow(c) {
    const calc = computeContract(c.id);
    const days = Utils.daysUntil(c.data_fim);
    return `<tr>
      <td><p class="font-black">${c.numero_contrato}</p><p class="text-xs text-slate-500 font-bold max-w-xl">${Utils.escape(c.objeto)}</p><p class="text-xs text-slate-400 font-semibold mt-1">${c.processo_administrativo} - ${c.numero_licitacao || 'sem licitação'}</p></td>
      <td><p class="font-bold">${fornecedor(c.fornecedor_id)?.nome_fantasia || '-'}</p><p class="text-xs text-slate-500">${fornecedor(c.fornecedor_id)?.cnpj || '-'}</p></td>
      <td><span class="badge badge-blue">${secretaria(c.secretaria_id)?.sigla || '-'}</span><p class="text-xs text-slate-500 mt-1">${Utils.typeLabel(c.categoria)}</p></td>
      <td><p class="font-bold">${Utils.date(c.data_inicio)} a ${Utils.date(c.data_fim)}</p><p class="text-xs font-bold ${days <= 30 ? 'text-amber-600' : 'text-slate-400'}">${days < 0 ? `${Math.abs(days)} dias vencido` : `${days} dias restantes`}</p></td>
      <td><p class="font-black">${Utils.currency(calc.valorAtual)}</p><p class="text-xs font-bold ${calc.saldoContratual < 0 ? 'text-red-600' : 'text-emerald-700'}">Saldo ${Utils.currency(calc.saldoContratual)}</p></td>
      <td><div class="w-32"><div class="progress ${calc.progresso > 90 ? 'danger' : ''}"><span style="width:${calc.progresso}%"></span></div><p class="text-xs font-bold text-slate-500 mt-1">${Utils.number(calc.progresso, 1)}%</p></div></td>
      <td>${Utils.badge(contractRisk(c))}</td>
      <td><select class="select text-xs py-2" onchange="changeContractStatus('${c.id}', this.value)">${contractStatuses.map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${Utils.statusLabel(s)}</option>`).join('')}</select></td>
      <td><div class="flex flex-wrap gap-2">${actionButton('Ver', `openContractDetails('${c.id}')`, 'btn-blue', 'eye')}${actionButton('Editar', `openContractForm('${c.id}')`, 'btn-soft', 'pencil')}${actionButton('Aditivo', `openAditivoForm('${c.id}')`, 'btn-soft', 'file-pen-line')}${actionButton('Fiscal', `designateFiscal('${c.id}')`, 'btn-soft', 'user-check')}</div></td>
    </tr>`;
  }

  function renderExecucao() {
    setContent(`
      ${pageTitle('Execução contratual', 'Ordens, medições, notas e pagamentos', 'Fluxo simulado de ordem de fornecimento/serviço, medição, ateste, liquidação e pagamento.', `<button class="btn btn-primary" onclick="openOrderForm()">${icon('plus')}Nova ordem</button><button class="btn btn-soft" onclick="openExecutionForm()">${icon('clipboard-plus')}Registrar medição</button><button class="btn btn-soft" onclick="openNFForm()">${icon('receipt')}Nova NF</button>`)}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        ${executionSummaryCard('Ordens de serviço/fornecimento', data.ordens.map((o) => ({ Ordem: o.numero, Contrato: contrato(o.contrato_id)?.numero_contrato, Prevista: Utils.date(o.data_prevista), Status: Utils.statusLabel(o.status), Valor: Utils.currency(Utils.sum(data.ordem_itens.filter((i) => i.ordem_id === o.id), (i) => i.valor_total)) })), 'truck')}
        ${executionSummaryCard('Medições e entregas', data.execucoes.map((e) => ({ Registro: e.id, Contrato: contrato(e.contrato_id)?.numero_contrato, Tipo: Utils.typeLabel(e.tipo), Valor: Utils.currency(e.valor_executado), Status: Utils.statusLabel(e.status) })), 'clipboard-check')}
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        ${executionSummaryCard('Notas fiscais', data.notas_fiscais.map((n) => ({ NF: n.numero_nf, Contrato: contrato(n.contrato_id)?.numero_contrato, Líquido: Utils.currency(n.valor_liquido), Emissão: Utils.date(n.data_emissao), Status: Utils.statusLabel(n.status) })), 'receipt')}
        ${executionSummaryCard('Empenhos, liquidações e pagamentos', data.empenhos.map((e) => ({ Empenho: e.numero_empenho, Contrato: contrato(e.contrato_id)?.numero_contrato, Empenhado: Utils.currency(e.valor_empenhado), Liquidado: Utils.currency(e.valor_liquidado), Pago: Utils.currency(e.valor_pago), 'A pagar': Utils.currency(calcEmpenho(e).saldo_a_pagar) })), 'banknote')}
      </div>`);
  }

  function executionSummaryCard(title, rows, iconName) {
    return `<div class="sig-card p-5"><div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">${title}</h3><div class="kpi-icon bg-slate-50 text-slate-600">${icon(iconName)}</div></div>${miniTable(rows)}</div>`;
  }

  function renderFiscalizacao() {
    const rows = data.fiscalizacoes.filter((f) => matchesSearch(f, `${contrato(f.contrato_id)?.numero_contrato} ${contrato(f.contrato_id)?.objeto}`));
    setContent(`
      ${pageTitle('Fiscalização contratual', 'Acompanhamento dos fiscais', 'Checklist mensal, parecer do fiscal, risco contratual, ocorrências, fotos e pendências abertas.', `<button class="btn btn-primary" onclick="openOccurrenceForm()">${icon('plus')}Adicionar ocorrência</button>`)}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">${rows.map((f) => {
        const c = contrato(f.contrato_id);
        return `<div class="sig-card hover-lift p-5"><div class="flex justify-between gap-4"><div><p class="text-xs uppercase tracking-[.18em] text-slate-400 font-black">${f.periodo}</p><h3 class="font-black text-xl">${c?.numero_contrato}</h3><p class="text-sm text-slate-500 font-bold">${Utils.escape(c?.objeto || '')}</p></div>${Utils.badge(f.risco)}</div><div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">${statBox('Fiscal', usuario(f.fiscal_id)?.nome || 'Não designado')}${statBox('Checklist', `${f.checklist}%`)}${statBox('Pendências', f.pendencias_abertas)}${statBox('Fotos/anexos', f.fotos)}</div><div class="mt-4"><div class="progress ${f.checklist < 70 ? 'danger' : ''}"><span style="width:${f.checklist}%"></span></div></div><p class="mt-4 text-sm text-slate-600 font-semibold">${Utils.escape(f.parecer)}</p><div class="flex flex-wrap gap-2 mt-4">${actionButton('Ocorrência', `openOccurrenceForm('${f.contrato_id}')`, 'btn-soft', 'message-square-warning')}${actionButton('Detalhes', `openContractDetails('${f.contrato_id}')`, 'btn-blue', 'eye')}</div></div>`;
      }).join('')}</div>`);
  }

  function renderAditivos() {
    const rows = data.aditivos.filter((a) => matchesSearch(a, `${contrato(a.contrato_id)?.numero_contrato} ${a.justificativa}`));
    setContent(`
      ${pageTitle('Alterações contratuais', 'Aditivos, prorrogações e apostilamentos', 'Prorrogação pode ser tratada como tipo de aditivo, mas aparece destacada nos alertas por ser rotina crítica antes do vencimento.', `<button class="btn btn-primary" onclick="openAditivoForm()">${icon('plus')}Novo aditivo</button>`)}
      <div class="sig-card p-4 mb-5 flex gap-3 items-start bg-amber-50 border-amber-200"><div class="kpi-icon bg-amber-100 text-amber-700">${icon('triangle-alert')}</div><p class="text-sm font-semibold text-amber-900">Aditivos de prazo, valor, prazo e valor, supressão, acréscimo, reequilíbrio, reajuste, repactuação, apostilamento, prorrogação, rescisão e suspensão ficam auditados e recalculam o contrato.</p></div>
      <div class="table-wrap"><table class="sig-table"><thead><tr><th>Aditivo</th><th>Contrato</th><th>Tipo</th><th>Data</th><th>Valor anterior</th><th>Novo valor</th><th>Prazo anterior</th><th>Novo prazo</th><th>Ações</th></tr></thead><tbody>${rows.map((a) => `<tr><td><p class="font-black">${a.numero}</p><p class="text-xs text-slate-500 max-w-lg">${Utils.escape(a.justificativa)}</p></td><td>${contrato(a.contrato_id)?.numero_contrato}</td><td>${Utils.typeLabel(a.tipo)}</td><td>${Utils.date(a.data_aditivo)}</td><td>${Utils.currency(a.valor_anterior)}</td><td class="font-black">${Utils.currency(a.novo_valor)}</td><td>${Utils.date(a.prazo_anterior)}</td><td>${Utils.date(a.nova_data_fim)}</td><td>${actionButton('Excluir', `deleteAditivo('${a.id}')`, 'btn-danger', 'trash-2')}</td></tr>`).join('')}</tbody></table></div>`);
  }

  function renderFornecedores() {
    const rows = data.fornecedores.filter((f) => matchesSearch(f));
    setContent(`
      ${pageTitle('Cadastro base', 'Fornecedores', 'Razão social, CNPJ, certidões, situação cadastral, contratos vinculados, ocorrências e sanções simuladas.', `<button class="btn btn-primary" onclick="openFornecedorForm()">${icon('plus')}Novo fornecedor</button>`)}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">${rows.map((f) => {
        const cons = data.contratos.filter((c) => c.fornecedor_id === f.id);
        const saldo = Utils.sum(cons, (c) => Math.max(0, computeContract(c.id).saldoContratual));
        const ocorrencias = data.ocorrencias.filter((o) => cons.some((c) => c.id === o.contrato_id)).length;
        return `<div class="sig-card hover-lift p-5"><div class="flex justify-between gap-4"><div><p class="text-xs uppercase tracking-[.18em] text-slate-400 font-black">Fornecedor</p><h3 class="font-black text-xl">${f.razao_social}</h3><p class="text-sm text-slate-500 font-bold">${f.cnpj} - ${f.responsavel}</p></div>${Utils.badge(f.situacao)}</div><div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">${statBox('Contratos', cons.length)}${statBox('Saldo aberto', Utils.currency(saldo))}${statBox('Ocorrências', ocorrencias)}${statBox('Certidões', f.certidoes)}</div><p class="text-sm text-slate-600 font-semibold mt-4">${f.email}<br>${f.telefone} - ${f.endereco}<br><strong>Sanções:</strong> ${f.sancoes}</p><div class="flex flex-wrap gap-2 mt-4">${actionButton('Editar', `openFornecedorForm('${f.id}')`, 'btn-soft', 'pencil')}${actionButton('Vínculos', `viewFornecedor('${f.id}')`, 'btn-blue', 'link')}</div></div>`;
      }).join('')}</div>`);
  }

  function renderAlertas() {
    const alerts = buildAlerts();
    setContent(`
      ${pageTitle('Central de alertas', 'Alertas inteligentes', 'Vencimentos, prorrogação, certidões, saldo baixo, fiscal ausente, pagamento, medição, garantia e documentos obrigatórios.', `<button class="btn btn-soft" onclick="toast('Alertas recalculados com base nos dados mockados.')">${icon('refresh-cw')}Recalcular</button>`)}
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        ${kpiCard('Críticos', alerts.filter((a) => a.nivel === 'alto').length, 'circle-alert', 'red')}
        ${kpiCard('Atenção', alerts.filter((a) => a.nivel !== 'alto').length, 'triangle-alert', 'yellow')}
        ${kpiCard('Contratos monitorados', data.contratos.length, 'radar', 'blue')}
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${alerts.map(alertCard).join('') || emptyState('Sem alertas', 'Nenhuma regra automática acionada.')}</div>`);
  }

  function renderDocumentos() {
    const rows = data.documentos.filter((d) => matchesSearch(d, contrato(d.contrato_id)?.numero_contrato));
    setContent(`
      ${pageTitle('Gestão documental', 'Documentos por contrato', 'Contrato assinado, publicação, termo de referência, edital, proposta, ata, empenho, nota fiscal, relatório, aditivos e pareceres.', `<button class="btn btn-primary" onclick="openDocForm()">${icon('paperclip')}Anexar documento</button>`)}
      <div class="table-wrap"><table class="sig-table"><thead><tr><th>Documento</th><th>Contrato</th><th>Tipo</th><th>Obrigatório</th><th>Status</th><th>Arquivo</th><th>Ações</th></tr></thead><tbody>${rows.map((d) => `<tr><td class="font-black">${d.nome}</td><td>${contrato(d.contrato_id)?.numero_contrato}</td><td>${d.tipo}</td><td>${d.obrigatorio ? 'Sim' : 'Não'}</td><td>${Utils.badge(d.status)}</td><td><code>${d.url || 'não anexado'}</code></td><td><div class="flex flex-wrap gap-2">${actionButton('Visualizar', `viewDoc('${d.id}')`, 'btn-blue', 'eye')}${actionButton('Baixar', `downloadDoc('${d.id}')`, 'btn-soft', 'download')}${actionButton('Remover', `removeDoc('${d.id}')`, 'btn-danger', 'trash-2')}</div></td></tr>`).join('')}</tbody></table></div>`);
  }

  function renderRelatorios() {
    const reports = ['Contratos por secretaria', 'Contratos por fornecedor', 'Contratos vencendo', 'Contratos vencidos', 'Valores por categoria', 'Execução financeira', 'Aditivos por período', 'Pendências de fiscalização', 'Relatório para transparência'];
    setContent(`
      ${pageTitle('Inteligência pública', 'Relatórios', 'Relatórios simulados para gestão, controle interno, jurídico, fiscalização e transparência.', `<button class="btn btn-soft" onclick="printReport()">${icon('printer')}Imprimir</button><button class="btn btn-primary" onclick="downloadReportCSV()">${icon('file-spreadsheet')}Exportar CSV</button>`)}
      <div class="sig-card p-5 mb-6"><div class="grid grid-cols-1 md:grid-cols-5 gap-3"><select id="report-type" class="select md:col-span-2">${reports.map((r) => `<option>${r}</option>`).join('')}</select><input id="report-start" type="date" class="input"><input id="report-end" type="date" class="input"><button class="btn btn-primary" onclick="generateReport()">${icon('play')}Gerar relatório</button></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3"><select id="report-contract" class="select"><option value="">Todos contratos</option>${data.contratos.map((c) => `<option value="${c.id}">${c.numero_contrato}</option>`).join('')}</select><select id="report-fornecedor" class="select"><option value="">Todos fornecedores</option>${data.fornecedores.map((f) => `<option value="${f.id}">${f.nome_fantasia}</option>`).join('')}</select><select id="report-status" class="select"><option value="">Todos status</option>${contractStatuses.map((s) => `<option value="${s}">${Utils.statusLabel(s)}</option>`).join('')}</select><select id="report-secretaria" class="select"><option value="">Todas secretarias</option>${data.secretarias.map((s) => `<option value="${s.id}">${s.nome}</option>`).join('')}</select></div></div>
      <div id="report-output" class="sig-card p-5">${emptyState('Relatório ainda não gerado', 'Escolha um relatório e clique em Gerar relatório.')}</div>`);
  }

  function inteligenciaDynamicIndicators() {
    const alerts = buildAlerts();
    const pendentes = data.documentos.filter((d) => d.obrigatorio && d.status === 'pendente').length;
    const docsClassificados = data.documentos.filter((d) => d.status && d.status !== 'pendente').length;
    const inconsistencias = data.ocorrencias.length + pendentes + data.contratos.filter((c) => contractRisk(c) === 'alto').length;
    const vencidos = data.contratos.filter((c) => Utils.daysUntil(c.data_fim) < 0 && c.status !== 'closed').length;
    const secretariasAderentes = new Set(data.contratos.map((c) => c.secretaria_id).filter(Boolean)).size;
    const live = {
      'Contratos cadastrados e monitorados': data.contratos.length,
      'Documentos classificados corretamente': docsClassificados,
      'Alertas úteis gerados': alerts.length,
      'Inconsistências detectadas': inconsistencias,
      'Contratos vencidos sem providência': vencidos,
      'Secretarias aderentes': secretariasAderentes
    };
    return (data.inteligencia.indicadores || []).map((item) => ({ ...item, atual: live[item.nome] ?? item.atual }));
  }

  function intelligenceProgress(item) {
    if (Number(item.meta) === 0) return Number(item.atual) === 0 ? 100 : 0;
    return Utils.perc(item.atual, item.meta);
  }

  function intelligenceScore(c) {
    const calc = computeContract(c.id);
    const days = Utils.daysUntil(c.data_fim);
    const docsPendentes = data.documentos.filter((d) => d.contrato_id === c.id && d.obrigatorio && d.status === 'pendente').length;
    const ocorrencias = data.ocorrencias.filter((o) => o.contrato_id === c.id).length;
    const fiscal = data.fiscalizacoes.find((f) => f.contrato_id === c.id);
    const fornecedorAtual = fornecedor(c.fornecedor_id);
    let score = 12;
    if (days < 0) score += 34;
    else if (days <= 15) score += 26;
    else if (days <= 30) score += 18;
    else if (days <= 60) score += 10;
    if (!c.fiscal_titular_id) score += 22;
    if (docsPendentes) score += docsPendentes * 12;
    if (fiscal?.risco === 'alto') score += 18;
    if (fiscal?.risco === 'medio') score += 9;
    if (fiscal?.checklist < 70) score += 10;
    if (calc.saldoContratual <= calc.valorAtual * .12 && c.status !== 'closed') score += 10;
    if (calc.saldoContratual < 0) score += 18;
    if (ocorrencias) score += Math.min(18, ocorrencias * 6);
    if (fornecedorAtual?.situacao === 'irregular') score += 18;
    if (fornecedorAtual?.situacao === 'atenção') score += 8;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function predictiveLevel(score) {
    if (score >= 75) return 'alto';
    if (score >= 45) return 'medio';
    return 'baixo';
  }

  function predictiveInsightForContract(c) {
    const calc = computeContract(c.id);
    const days = Utils.daysUntil(c.data_fim);
    const docsPendentes = data.documentos.filter((d) => d.contrato_id === c.id && d.obrigatorio && d.status === 'pendente');
    const fiscal = data.fiscalizacoes.find((f) => f.contrato_id === c.id);
    const ocorrencias = data.ocorrencias.filter((o) => o.contrato_id === c.id);
    const fornecedorAtual = fornecedor(c.fornecedor_id);
    const evidencias = [];
    const acoes = [];
    if (days < 0) { evidencias.push(`vigência vencida há ${Math.abs(days)} dia(s)`); acoes.push('abrir providência de encerramento, regularização ou nova contratação'); }
    else if (days <= 30) { evidencias.push(`vigência termina em ${days} dia(s)`); acoes.push('iniciar análise de prorrogação ou substituição contratual'); }
    if (!c.fiscal_titular_id) { evidencias.push('sem fiscal titular designado'); acoes.push('designar fiscal titular e suplente'); }
    if (docsPendentes.length) { evidencias.push(`${docsPendentes.length} documento(s) obrigatório(s) pendente(s)`); acoes.push('completar instrução documental'); }
    if (fiscal?.risco === 'alto') { evidencias.push('fiscalização marcou risco alto'); acoes.push('solicitar parecer do controle interno'); }
    if (fiscal?.checklist < 70) { evidencias.push(`checklist de fiscalização em ${fiscal.checklist}%`); acoes.push('revisar pendências da fiscalização'); }
    if (calc.saldoContratual <= calc.valorAtual * .12 && c.status !== 'closed') { evidencias.push(`saldo contratual baixo: ${Utils.currency(calc.saldoContratual)}`); acoes.push('validar saldo antes de nova ordem ou medição'); }
    if (calc.saldoContratual < 0) { evidencias.push('execução acima do valor contratual atualizado'); acoes.push('bloquear nova execução até revisão financeira'); }
    if (ocorrencias.length) { evidencias.push(`${ocorrencias.length} ocorrência(s) registrada(s)`); acoes.push('consolidar ocorrência em despacho ou notificação'); }
    if (fornecedorAtual?.situacao === 'irregular') { evidencias.push(`fornecedor irregular: ${fornecedorAtual.certidoes}`); acoes.push('impedir pagamento/prorrogação sem análise jurídica'); }
    if (!evidencias.length) {
      evidencias.push('sem inconsistência crítica detectada com os dados atuais');
      acoes.push('manter monitoramento preventivo');
    }
    const score = intelligenceScore(c);
    return {
      contrato: c,
      score,
      nivel: predictiveLevel(score),
      evidencias,
      acao: [...new Set(acoes)][0],
      acoes: [...new Set(acoes)]
    };
  }

  function predictiveInsights() {
    return data.contratos.map(predictiveInsightForContract).sort((a, b) => b.score - a.score);
  }

  function departmentBottlenecks() {
    return data.secretarias.map((s) => {
      const contracts = data.contratos.filter((c) => c.secretaria_id === s.id);
      const alerts = predictiveInsights().filter((i) => i.contrato.secretaria_id === s.id && i.nivel === 'alto').length;
      const docs = data.documentos.filter((d) => contracts.some((c) => c.id === d.contrato_id) && d.obrigatorio && d.status === 'pendente').length;
      const vencimentos = contracts.filter((c) => Utils.daysUntil(c.data_fim) >= 0 && Utils.daysUntil(c.data_fim) <= 30).length;
      const semFiscal = contracts.filter((c) => !c.fiscal_titular_id).length;
      const score = Math.min(100, alerts * 30 + docs * 15 + vencimentos * 12 + semFiscal * 18);
      return { secretaria: s, contratos: contracts.length, alertas: alerts, documentos: docs, vencimentos, semFiscal, score };
    }).filter((row) => row.contratos || row.score).sort((a, b) => b.score - a.score);
  }

  function renderIntelligenceIndicators(indicators) {
    return `<div class="table-wrap"><table class="sig-table"><thead><tr><th>Indicador</th><th>Atual</th><th>Meta</th><th>Progresso</th><th>Fonte</th></tr></thead><tbody>${indicators.map((i) => {
      const progress = intelligenceProgress(i);
      return `<tr><td><p class="font-black">${Utils.escape(i.nome)}</p><p class="text-xs text-slate-500">${Utils.escape(i.unidade)}</p></td><td class="font-black">${Utils.number(i.atual)}</td><td>${Utils.number(i.meta)}</td><td><div class="w-40"><div class="progress ${progress < 35 ? 'danger' : ''}"><span style="width:${progress}%"></span></div><p class="text-xs font-bold text-slate-500 mt-1">${Utils.number(progress, 1)}%</p></div></td><td>${Utils.escape(i.fonte)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function renderInteligencia() {
    const inteligencia = data.inteligencia;
    const alerts = buildAlerts();
    const indicators = inteligenciaDynamicIndicators();
    const insights = predictiveInsights();
    const highRisk = insights.filter((i) => i.nivel === 'alto');
    const bottlenecks = departmentBottlenecks();
    setContent(`
      ${pageTitle('Núcleo inteligente', 'Inteligência preditiva municipal', 'IA simulada e regras de negócio para antecipar vencimentos, inconsistências, gargalos, risco documental e providências prioritárias no cenário da Prefeitura.', `<button class="btn btn-primary" onclick="recordIntelligenceRecommendation()">${icon('sparkles')}Registrar recomendação</button><button class="btn btn-soft" onclick="exportIntelligenceReport()">${icon('download')}Exportar análise</button>`)}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        ${kpiCard('Contratos em risco alto', highRisk.length, 'siren', highRisk.length ? 'red' : 'green', 'Priorização automática')}
        ${kpiCard('Score médio da carteira', `${Utils.number(Utils.sum(insights, (i) => i.score) / Math.max(1, insights.length), 0)}`, 'radar', 'blue', '0 baixo, 100 crítico')}
        ${kpiCard('Inconsistências prováveis', indicators.find((i) => i.nome === 'Inconsistências detectadas')?.atual || 0, 'scan-search', 'yellow', 'Documentos, fiscais e execução')}
        ${kpiCard('Alertas monitorados', alerts.length, 'bell-ring', 'purple', `${alerts.filter((a) => a.nivel === 'alto').length} críticos`)}
      </div>
      <section class="sig-card p-6 mb-6">
        <div class="flex flex-col xl:flex-row gap-5 xl:items-start xl:justify-between">
          <div class="max-w-5xl">
            <p class="text-xs uppercase tracking-[.2em] text-slate-400 font-black">MVP com inteligência aplicada</p>
            <h3 class="text-2xl font-black mt-1">${Utils.escape(inteligencia.resumo.proposito)}</h3>
            <p class="text-slate-600 font-semibold mt-3">${Utils.escape(inteligencia.resumo.diferencial)}</p>
          </div>
          <div class="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 min-w-[260px]">
            <p class="text-xs uppercase tracking-[.14em] text-emerald-700 font-black">Cenário municipal</p>
            <p class="text-sm text-emerald-900 font-bold mt-2">${Utils.escape(inteligencia.resumo.contexto)}</p>
          </div>
        </div>
      </section>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <section class="sig-card p-5">
          <div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">Prioridades preditivas</h3><span class="badge badge-red">${highRisk.length} alto risco</span></div>
          <div class="space-y-3">${insights.slice(0, 6).map((i) => `<button class="w-full text-left rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 p-4 transition" onclick="openContractDetails('${i.contrato.id}')"><div class="flex justify-between gap-3"><div><p class="font-black">${i.contrato.numero_contrato}</p><p class="text-sm text-slate-600 font-semibold mt-1">${Utils.escape(i.acao)}</p></div>${Utils.badge(i.nivel)}</div><p class="text-xs text-slate-500 font-bold mt-2">${Utils.escape(i.evidencias.join(' | '))}</p><div class="mt-3"><div class="progress ${i.score >= 75 ? 'danger' : ''}"><span style="width:${i.score}%"></span></div><p class="text-xs font-bold text-slate-500 mt-1">Score preditivo ${i.score}/100</p></div></button>`).join('')}</div>
        </section>
        <section class="sig-card p-5">
          <div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">Gargalos por secretaria</h3><span class="badge badge-blue">Gestão</span></div>
          <div class="space-y-3">${bottlenecks.map((b) => `<div class="rounded-2xl bg-slate-50 p-4"><div class="flex justify-between gap-3"><div><p class="font-black">${Utils.escape(b.secretaria.sigla)} - ${Utils.escape(b.secretaria.nome)}</p><p class="text-xs text-slate-500 font-bold mt-1">${b.contratos} contrato(s), ${b.vencimentos} vencimento(s), ${b.documentos} doc(s) pendente(s), ${b.semFiscal} sem fiscal</p></div><span class="badge ${b.score >= 70 ? 'badge-red' : b.score >= 35 ? 'badge-yellow' : 'badge-green'}">${b.score}/100</span></div></div>`).join('')}</div>
        </section>
      </div>
      <section class="sig-card p-5 mb-6"><div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">Capacidades inteligentes do MVP</h3><span class="badge badge-purple">IA + regras</span></div><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${(inteligencia.capacidades || []).map((c) => `<article class="rounded-2xl bg-slate-50 p-4"><div class="flex justify-between gap-3"><h4 class="font-black">${Utils.escape(c.nome)}</h4><span class="badge badge-blue">${Utils.escape(c.estagio)}</span></div><p class="text-sm text-slate-600 font-semibold mt-2">${Utils.escape(c.descricao)}</p><p class="text-xs text-slate-500 font-bold mt-3">${Utils.escape(c.saida)}</p></article>`).join('')}</div></section>
      <section class="sig-card p-5 mb-6"><div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">Indicadores operacionais</h3><span class="badge badge-blue">Medição</span></div>${renderIntelligenceIndicators(indicators)}</section>
      <section class="sig-card p-5 mb-6"><div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">Riscos de implantação da inteligência</h3><span class="badge badge-red">Mitigação</span></div>${miniTable((inteligencia.riscos || []).map((r) => ({ Risco: r.risco, Impacto: r.impacto, Probabilidade: r.probabilidade, Mitigação: r.mitigacao, Dono: r.dono })))}</section>
      <section class="mb-6">
        <div class="flex items-center justify-between mb-4"><h3 class="font-black text-lg">Recomendações registradas</h3><span class="badge badge-slate">${(inteligencia.decisoes || []).length} registros</span></div>
        ${miniTimeline((inteligencia.decisoes || []).map((d) => ({ data: d.data_hora, tipo: `${d.tipo} - ${d.status}`, descricao: `${d.titulo}: ${d.descricao}`, usuario: usuario(d.usuario_id)?.nome || '-' })))}
      </section>`);
  }

  function renderAuditoria() {
    const rows = data.auditoria.filter((a) => matchesSearch(a, usuario(a.usuario_id)?.nome));
    setContent(`
      ${pageTitle('Rastreabilidade', 'Histórico e auditoria', 'Quem criou, quem alterou, data, módulo, registro afetado, status anterior/novo e descrição da ação.', `<button class="btn btn-soft" onclick="exportCSV('auditoria')">${icon('download')}Exportar CSV</button>`)}
      ${filterPanel(`<div class="grid grid-cols-1 md:grid-cols-4 gap-3"><input class="input md:col-span-2" placeholder="Buscar ação, usuário ou módulo" value="${Utils.escape(currentSearch)}" oninput="globalSearch(this.value)"><select class="select" onchange="filterAuditModule(this.value)"><option value="">Todos módulos</option>${[...new Set(data.auditoria.map((a) => a.modulo))].map((m) => `<option>${m}</option>`).join('')}</select></div>`)}
      ${miniTable(rows.map((a) => ({ 'Data/hora': Utils.datetime(a.data_hora), Usuário: usuario(a.usuario_id)?.nome || '-', Perfil: usuario(a.usuario_id)?.perfil || '-', Ação: a.acao, Módulo: a.modulo, Registro: a.registro_id, Descrição: a.descricao })))}`);
  }

  function renderTransparencia() {
    const publicRows = data.contratos.filter((c) => matchesSearch(c, `${fornecedor(c.fornecedor_id)?.nome_fantasia} ${secretaria(c.secretaria_id)?.nome}`));
    setContent(`
      ${pageTitle('Portal público', 'Transparência pública simulada', 'Consulta pública de contratos com dados resumidos, sem informações internas sensíveis.', `<button class="btn btn-soft" onclick="exportCSV('transparencia')">${icon('download')}Exportar consulta</button>`)}
      ${filterPanel(`<div class="grid grid-cols-1 md:grid-cols-3 gap-3"><input class="input md:col-span-2" placeholder="Buscar contrato, objeto, fornecedor ou secretaria" value="${Utils.escape(currentSearch)}" oninput="globalSearch(this.value)"><button class="btn btn-soft" onclick="clearFilters()">${icon('x')}Limpar</button></div>`)}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">${publicRows.map((c) => { const calc = computeContract(c.id); return `<article class="sig-card hover-lift p-5"><div class="flex justify-between gap-4"><div><p class="text-xs uppercase tracking-[.18em] text-slate-400 font-black">${secretaria(c.secretaria_id)?.nome}</p><h3 class="font-black text-xl">${c.numero_contrato}</h3><p class="text-sm text-slate-600 font-semibold mt-1">${Utils.escape(c.objeto)}</p></div>${Utils.badge(c.status)}</div><div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">${statBox('Fornecedor', fornecedor(c.fornecedor_id)?.nome_fantasia)}${statBox('Valor', Utils.currency(calc.valorAtual))}${statBox('Executado', Utils.currency(calc.valorExecutado))}${statBox('Vigência', `${Utils.date(c.data_inicio)} a ${Utils.date(c.data_fim)}`)}</div></article>`; }).join('')}</div>`);
  }

  function renderConfiguracoes() {
    setContent(`
      ${pageTitle('Administração', 'Configurações do protótipo', 'Perfis simulados, LocalStorage, identidade visual, dados mockados e ações administrativas.', `<button class="btn btn-danger" onclick="confirmReset()">${icon('rotate-ccw')}Resetar dados</button><button class="btn btn-soft" onclick="exportJSON()">${icon('download')}Exportar JSON</button>`)}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="sig-card p-6"><h3 class="font-black text-lg mb-3">Identidade visual</h3><p class="text-slate-600 font-semibold">O menu usa <code>assets/logo-comprida.png</code>. A interface foi preparada com Lucide, Tailwind CDN, Chart.js e CSS próprio.</p><div class="mt-5 rounded-3xl bg-emerald-600 p-6"><img src="assets/logo-comprida.png" class="max-w-xs" alt="Logo"></div></div>
        <div class="sig-card p-6"><h3 class="font-black text-lg mb-3">LocalStorage</h3><p class="text-slate-600 font-semibold">Os dados ficam na chave <code>${StorageService.key}</code>. O reset recria a base premium simulada.</p><div class="mt-5 space-y-2"><button class="btn btn-primary w-full" onclick="toast('Toast elegante funcionando.')">${icon('message-circle')}Testar toast</button><button class="btn btn-soft w-full" onclick="showStorageInfo()">${icon('database')}Ver tamanho dos dados</button></div></div>
        <div class="sig-card p-6 xl:col-span-2"><h3 class="font-black text-lg mb-3">Perfis de usuário</h3><div class="grid grid-cols-1 md:grid-cols-4 gap-3">${data.usuarios.map((u) => `<button class="rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-emerald-100 p-4 text-left transition" onclick="changeUser('${u.id}')"><p class="font-black">${u.nome}</p><p class="text-sm text-slate-500 font-bold">${u.perfil}</p><p class="text-xs text-slate-400">${u.email}</p></button>`).join('')}</div></div>
      </div>`);
  }

  function render() {
    renderShell();
    ChartService.destroyAll();
    if (currentView === 'dashboard') renderDashboard();
    if (currentView === 'licitacoes') renderLicitacoes();
    if (currentView === 'contratos') renderContratos();
    if (currentView === 'execucao') renderExecucao();
    if (currentView === 'fiscalizacao') renderFiscalizacao();
    if (currentView === 'aditivos') renderAditivos();
    if (currentView === 'fornecedores') renderFornecedores();
    if (currentView === 'alertas') renderAlertas();
    if (currentView === 'documentos') renderDocumentos();
    if (currentView === 'relatorios') renderRelatorios();
    if (currentView === 'inteligencia') renderInteligencia();
    if (currentView === 'auditoria') renderAuditoria();
    if (currentView === 'transparencia') renderTransparencia();
    if (currentView === 'configuracoes') renderConfiguracoes();
  }

  function openModal(title, body, width = '900px') {
    const root = $('modal-root');
    root.classList.remove('hidden');
    root.innerHTML = `<div class="modal-backdrop" onclick="closeModal()"></div><div class="min-h-full flex items-center justify-center p-4"><div class="modal-panel" style="width:min(${width}, calc(100vw - 32px))"><div class="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10"><h3 class="font-black text-xl">${title}</h3><button class="btn btn-soft btn-mini" onclick="closeModal()">${icon('x')}Fechar</button></div><div class="p-6">${body}</div></div></div>`;
    hydrateIcons();
  }

  function closeModal() {
    $('modal-root').classList.add('hidden');
    $('modal-root').innerHTML = '';
  }

  function closeDrawer() {
    $('drawer-root').classList.add('hidden');
    $('drawer-root').innerHTML = '';
    currentContractId = null;
  }

  function renderContractDrawer() {
    const c = contrato(currentContractId);
    if (!c) return;
    const calc = computeContract(c.id);
    const tabs = ['resumo', 'linha_tempo', 'execucao', 'fiscalizacao', 'aditivos', 'documentos', 'ocorrencias', 'auditoria'];
    const root = $('drawer-root');
    root.classList.remove('hidden');
    root.innerHTML = `<div class="drawer-backdrop" onclick="closeDrawer()"></div><aside class="drawer-panel"><div class="drawer-head p-6"><div class="flex flex-col xl:flex-row justify-between gap-4"><div><p class="text-xs uppercase tracking-[.22em] text-slate-400 font-black">Dossiê contratual</p><h2 class="text-2xl font-black">${c.numero_contrato} - ${Utils.statusLabel(c.status)}</h2><p class="text-sm text-slate-500 font-semibold max-w-4xl">${Utils.escape(c.objeto)}</p></div><div class="flex flex-wrap gap-2 items-start"><button class="btn btn-primary" onclick="openContractForm('${c.id}')">${icon('pencil')}Editar</button><button class="btn btn-soft" onclick="contractReport('${c.id}')">${icon('printer')}Relatório</button><button class="btn btn-soft" onclick="closeDrawer()">${icon('x')}Fechar</button></div></div><div class="mt-5 flex gap-2 overflow-x-auto pb-1">${tabs.map((t) => `<button class="tab-btn ${currentContractTab === t ? 'active' : ''}" onclick="setContractTab('${t}')">${tabIcon(t)}${tabLabel(t)}</button>`).join('')}</div></div><div class="p-6">${contractTabContent(c, calc)}</div></aside>`;
    hydrateIcons();
  }

  function tabIcon(t) {
    return icon({ resumo: 'panel-top', linha_tempo: 'git-branch', execucao: 'workflow', fiscalizacao: 'clipboard-check', aditivos: 'file-pen-line', documentos: 'folder-open', ocorrencias: 'message-square-warning', auditoria: 'history' }[t] || 'circle');
  }

  function tabLabel(t) {
    return { resumo: 'Resumo', linha_tempo: 'Linha do tempo', execucao: 'Execução', fiscalizacao: 'Fiscalização', aditivos: 'Aditivos', documentos: 'Documentos', ocorrencias: 'Ocorrências', auditoria: 'Auditoria' }[t] || t;
  }

  function contractTabContent(c, calc) {
    if (currentContractTab === 'resumo') {
      return `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">${kpiCard('Valor original', Utils.currency(c.valor_original), 'landmark', 'blue')}${kpiCard('Valor atualizado', Utils.currency(calc.valorAtual), 'wallet', 'green')}${kpiCard('Liquidado / pago', Utils.currency(calc.valorLiquidado), 'receipt', 'purple', `${Utils.currency(calc.valorPago)} pago`)}${kpiCard('Saldo', Utils.currency(calc.saldoContratual), 'wallet-cards', calc.saldoContratual < 0 ? 'red' : 'green')}</div><div class="sig-card p-5"><h3 class="font-black mb-4">Resumo administrativo</h3><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm font-semibold">${statBox('Processo', c.processo_administrativo)}${statBox('Modalidade', c.modalidade)}${statBox('Licitação', c.numero_licitacao || '-')}${statBox('Fornecedor', fornecedor(c.fornecedor_id)?.razao_social)}${statBox('Secretaria', secretaria(c.secretaria_id)?.nome)}${statBox('Unidade gestora', c.unidade_gestora)}${statBox('Gestor', usuario(c.gestor_id)?.nome || '-')}${statBox('Fiscal titular', usuario(c.fiscal_titular_id)?.nome || 'Não designado')}${statBox('Fiscal suplente', usuario(c.fiscal_suplente_id)?.nome || 'Não designado')}${statBox('Dotação', c.dotacao_orcamentaria)}${statBox('Fonte', c.fonte_recurso)}${statBox('Garantia', c.garantia || '-')}</div><div class="mt-5"><div class="progress ${calc.progresso > 90 ? 'danger' : ''}"><span style="width:${calc.progresso}%"></span></div><p class="text-xs font-bold text-slate-500 mt-1">Execução financeira simulada ${Utils.number(calc.progresso, 1)}%</p></div><p class="text-sm text-slate-600 font-semibold mt-4">${Utils.escape(c.observacoes || '')}</p></div>`;
    }
    if (currentContractTab === 'linha_tempo') return miniTimeline(contractTimeline(c));
    if (currentContractTab === 'execucao') return miniTable([
      ...data.ordens.filter((o) => o.contrato_id === c.id).map((o) => ({ Tipo: 'Ordem', Registro: o.numero, Data: Utils.date(o.data_solicitacao), Status: Utils.statusLabel(o.status), Valor: Utils.currency(Utils.sum(data.ordem_itens.filter((i) => i.ordem_id === o.id), (i) => i.valor_total)) })),
      ...data.execucoes.filter((e) => e.contrato_id === c.id).map((e) => ({ Tipo: Utils.typeLabel(e.tipo), Registro: e.id, Data: Utils.date(e.data_execucao), Status: Utils.statusLabel(e.status), Valor: Utils.currency(e.valor_executado) })),
      ...data.notas_fiscais.filter((n) => n.contrato_id === c.id).map((n) => ({ Tipo: 'Nota fiscal', Registro: n.numero_nf, Data: Utils.date(n.data_emissao), Status: Utils.statusLabel(n.status), Valor: Utils.currency(n.valor_liquido) }))
    ]);
    if (currentContractTab === 'fiscalizacao') return miniTable(data.fiscalizacoes.filter((f) => f.contrato_id === c.id).map((f) => ({ Período: f.periodo, Fiscal: usuario(f.fiscal_id)?.nome || '-', Checklist: `${f.checklist}%`, Risco: Utils.statusLabel(f.risco), Pendências: f.pendencias_abertas, Parecer: f.parecer })));
    if (currentContractTab === 'aditivos') return miniTable(data.aditivos.filter((a) => a.contrato_id === c.id).map((a) => ({ Número: a.numero, Tipo: Utils.typeLabel(a.tipo), Data: Utils.date(a.data_aditivo), ValorAnterior: Utils.currency(a.valor_anterior), NovoValor: Utils.currency(a.novo_valor), NovoPrazo: Utils.date(a.nova_data_fim), Justificativa: a.justificativa })));
    if (currentContractTab === 'documentos') return miniTable(data.documentos.filter((d) => d.contrato_id === c.id).map((d) => ({ Documento: d.nome, Tipo: d.tipo, Obrigatório: d.obrigatorio ? 'Sim' : 'Não', Status: Utils.statusLabel(d.status), Arquivo: d.url || '-' })));
    if (currentContractTab === 'ocorrencias') return `<div class="mb-4">${actionButton('Adicionar ocorrência', `openOccurrenceForm('${c.id}')`, 'btn-primary', 'plus', false)}</div>${miniTimeline(data.ocorrencias.filter((o) => o.contrato_id === c.id).map((o) => ({ data: o.data_ocorrencia, tipo: o.tipo, descricao: o.descricao, usuario: usuario(o.criado_por)?.nome || '-' })))}`;
    if (currentContractTab === 'auditoria') return miniTimeline(data.auditoria.filter((a) => a.registro_id === c.id || (a.descricao || '').includes(c.numero_contrato)).map((a) => ({ data: a.data_hora, tipo: a.modulo, descricao: `${a.acao}: ${a.descricao}`, usuario: usuario(a.usuario_id)?.nome || '-' })));
    return '';
  }

  function contractTimeline(c) {
    const l = licitacao(c.licitacao_id);
    const events = [];
    if (l) {
      events.push({ data: l.data_homologacao, tipo: 'Homologação', descricao: `${l.numero_licitacao} homologada.` });
      events.push({ data: l.data_adjudicacao, tipo: 'Adjudicação', descricao: `Objeto adjudicado ao fornecedor ${fornecedor(l.fornecedor_vencedor)?.nome_fantasia}.` });
    }
    events.push({ data: c.data_assinatura, tipo: 'Assinatura', descricao: `Contrato ${c.numero_contrato} assinado.` });
    events.push({ data: c.data_inicio, tipo: 'Início da vigência', descricao: 'Início formal da execução contratual.' });
    data.ordens.filter((o) => o.contrato_id === c.id).forEach((o) => events.push({ data: o.data_solicitacao, tipo: 'Ordem de serviço/fornecimento', descricao: `${o.numero}: ${Utils.statusLabel(o.status)}.` }));
    data.execucoes.filter((e) => e.contrato_id === c.id).forEach((e) => events.push({ data: e.data_execucao, tipo: Utils.typeLabel(e.tipo), descricao: `${Utils.currency(e.valor_executado)} - ${Utils.statusLabel(e.status)}.` }));
    data.aditivos.filter((a) => a.contrato_id === c.id).forEach((a) => events.push({ data: a.data_aditivo, tipo: Utils.typeLabel(a.tipo), descricao: `${a.numero}: ${a.justificativa}` }));
    data.ocorrencias.filter((o) => o.contrato_id === c.id).forEach((o) => events.push({ data: o.data_ocorrencia, tipo: o.tipo, descricao: o.descricao }));
    events.push({ data: c.data_fim, tipo: 'Fim da vigência', descricao: `Vencimento previsto em ${Utils.date(c.data_fim)}.` });
    return events.sort((a, b) => new Date(a.data) - new Date(b.data));
  }

  function miniTable(rows) {
    if (!rows.length) return emptyState('Nenhum registro encontrado', 'Ainda não há dados simulados para esta seção.');
    const cols = Object.keys(rows[0]);
    return `<div class="table-wrap"><table class="sig-table"><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? '-'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function miniTimeline(rows) {
    if (!rows.length) return emptyState('Sem histórico', 'Nenhum evento encontrado para os filtros atuais.');
    return `<div class="sig-card p-5"><div class="space-y-5">${rows.map((o) => `<div class="timeline-item"><div class="flex justify-between gap-4"><div><p class="font-black">${Utils.escape(o.tipo || '-')}</p><p class="text-sm text-slate-600 font-semibold mt-1">${Utils.escape(o.descricao || '')}</p>${o.usuario ? `<p class="text-xs text-slate-400 font-bold mt-2">Responsável: ${Utils.escape(o.usuario)}</p>` : ''}</div><span class="text-xs font-black text-slate-400">${Utils.date(o.data)}</span></div></div>`).join('')}</div></div>`;
  }

  function optionsFrom(list, selected = '', labelFn = (x) => x.nome || x.numero_contrato) {
    return list.map((x) => `<option value="${x.id}" ${x.id === selected ? 'selected' : ''}>${Utils.escape(labelFn(x))}</option>`).join('');
  }

  window.navigate = function (key) { currentView = key; currentSearch = ''; filters = { status: '', secretaria: '', categoria: '', fornecedor: '' }; render(); };
  window.globalSearch = function (value) { currentSearch = value; render(); };
  window.toggleSidebar = function () { $('sidebar')?.classList.toggle('open'); };
  window.changeUser = function (id) { StorageService.setCurrentUserId(id); toast('Perfil simulado alterado. As próximas ações serão auditadas com esse usuário.'); render(); };
  window.setFilter = function (key, value) { filters[key] = value; render(); };
  window.clearFilters = function () { currentSearch = ''; filters = { status: '', secretaria: '', categoria: '', fornecedor: '' }; render(); };
  window.filterAuditModule = function (value) { currentSearch = value; render(); };
  window.closeModal = closeModal;
  window.closeDrawer = closeDrawer;
  window.toast = toast;
  window.exportJSON = function () { StorageService.exportJSON(data); toast('JSON exportado.'); };
  window.confirmReset = function () { openModal('Resetar dados simulados', `<p class="font-semibold text-slate-600 mb-5">Isso apagará alterações salvas no LocalStorage e restaurará a base premium do protótipo.</p><div class="flex justify-end gap-2"><button class="btn btn-soft" onclick="closeModal()">${icon('x')}Cancelar</button><button class="btn btn-danger" onclick="resetData()">${icon('rotate-ccw')}Resetar agora</button></div>`); };
  window.resetData = function () { data = StorageService.reset(); closeModal(); toast('Dados simulados restaurados.'); render(); };
  window.showStorageInfo = function () { const bytes = new Blob([JSON.stringify(data)]).size; toast(`Dados salvos: ${(bytes / 1024).toFixed(1)} KB no LocalStorage.`); };
  window.sortContractsByEndDate = function () { data.contratos.sort((a, b) => new Date(a.data_fim) - new Date(b.data_fim)); save(); render(); toast('Contratos ordenados por vencimento.'); };

  window.recordIntelligenceRecommendation = function () {
    const insights = predictiveInsights().slice(0, 5);
    const decision = {
      id: Utils.uuid('ia-rec'),
      data_hora: new Date().toISOString(),
      usuario_id: currentUser().id,
      tipo: 'Recomendação preditiva',
      titulo: 'Prioridades geradas pelo núcleo inteligente',
      descricao: insights.map((i) => `${i.contrato.numero_contrato}: ${i.acao} (${i.evidencias.join(', ')})`).join(' | '),
      status: 'Aberta'
    };
    data.inteligencia.decisoes.unshift(decision);
    logAction('Recomendação preditiva registrada', 'Inteligência', decision.id, decision.titulo);
    toast('Recomendação da inteligência registrada e auditada.');
    render();
  };

  window.exportIntelligenceReport = function () {
    const payload = {
      gerado_em: new Date().toISOString(),
      municipio: data.meta.municipio,
      app: data.meta.appName,
      resumo: data.inteligencia.resumo,
      capacidades: data.inteligencia.capacidades,
      riscos_implantacao: data.inteligencia.riscos,
      indicadores: inteligenciaDynamicIndicators(),
      insights_contratuais: predictiveInsights().map((i) => ({
        contrato: i.contrato.numero_contrato,
        secretaria: secretaria(i.contrato.secretaria_id)?.sigla,
        score: i.score,
        nivel: i.nivel,
        evidencias: i.evidencias,
        acoes_recomendadas: i.acoes
      })),
      gargalos_secretaria: departmentBottlenecks().map((b) => ({
        secretaria: b.secretaria.sigla,
        contratos: b.contratos,
        score: b.score,
        vencimentos_30_dias: b.vencimentos,
        documentos_pendentes: b.documentos,
        contratos_sem_fiscal: b.semFiscal
      })),
      alertas: buildAlerts(),
      recomendacoes_registradas: data.inteligencia.decisoes,
      auditoria_inteligencia: data.auditoria.filter((a) => a.modulo === 'Inteligência')
    };
    Utils.download(`analise-preditiva-sigcon-${Utils.todayISO()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    logAction('Análise preditiva exportada', 'Inteligência', 'analise-preditiva', 'Exportação da análise preditiva em JSON.');
    toast('Análise preditiva exportada.');
  };

  window.createContractFromLicitation = function (id) {
    requirePermission('create');
    const l = licitacao(id);
    const existing = data.contratos.find((c) => c.licitacao_id === id);
    if (existing) { toast(`Já existe contrato vinculado: ${existing.numero_contrato}.`, 'warn'); openContractDetails(existing.id); return; }
    const payload = {
      id: Utils.uuid('c'),
      licitacao_id: l.id,
      fornecedor_id: l.fornecedor_vencedor,
      numero_contrato: `CT ${l.processo_administrativo.replace('PA ', '')}`,
      ano: new Date().getFullYear(),
      processo_administrativo: l.processo_administrativo,
      modalidade: l.modalidade,
      numero_licitacao: l.numero_licitacao,
      objeto: l.objeto,
      categoria: 'compras',
      tipo: 'compras',
      valor_original: l.valor_homologado,
      data_assinatura: Utils.todayISO(),
      data_inicio: Utils.todayISO(),
      data_fim: Utils.todayISO(),
      status: 'draft',
      secretaria_id: l.secretaria_solicitante,
      unidade_gestora: secretaria(l.secretaria_solicitante)?.nome || '',
      gestor_id: currentUser().id,
      fiscal_titular_id: '',
      fiscal_suplente_id: '',
      dotacao_orcamentaria: '',
      fonte_recurso: '',
      numero_empenho: '',
      garantia: '',
      observacoes: 'Contrato criado a partir da licitação homologada.'
    };
    data.contratos.push(payload);
    save(); logAction('Contrato criado a partir da licitação', 'Contratos', payload.id, `${payload.numero_contrato} criado a partir de ${l.numero_licitacao}.`); toast('Contrato criado como rascunho.'); currentView = 'contratos'; render();
  };

  window.openContractDetails = function (id) { currentContractId = id; currentContractTab = 'resumo'; renderContractDrawer(); };
  window.setContractTab = function (tab) { currentContractTab = tab; renderContractDrawer(); };
  window.changeContractStatus = function (id, status) { requirePermission('statusContract'); const c = contrato(id); c.status = status; save(); logAction('Status alterado', 'Contratos', id, `${c.numero_contrato} alterado para ${Utils.statusLabel(status)}.`); toast('Status do contrato atualizado.'); render(); if (currentContractId === id) renderContractDrawer(); };

  window.openContractForm = function (id = '') {
    requirePermission(id ? 'edit' : 'create');
    const c = id ? contrato(id) : null;
    openModal(c ? 'Editar contrato' : 'Novo contrato', `<form onsubmit="saveContractForm(event, '${id}')" class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="label">Licitação</label><select name="licitacao_id" class="select"><option value="">Sem vínculo</option>${optionsFrom(data.licitacoes, c?.licitacao_id, (l) => `${l.numero_licitacao} - ${l.processo_administrativo}`)}</select></div><div><label class="label">Fornecedor</label><select name="fornecedor_id" class="select" required>${optionsFrom(data.fornecedores, c?.fornecedor_id, (f) => f.razao_social)}</select></div><div><label class="label">Número contrato</label><input name="numero_contrato" class="input" value="${Utils.escape(c?.numero_contrato || '')}" required></div><div><label class="label">Ano</label><input name="ano" type="number" class="input" value="${c?.ano || new Date().getFullYear()}" required></div><div><label class="label">Processo administrativo</label><input name="processo_administrativo" class="input" value="${Utils.escape(c?.processo_administrativo || '')}" required></div><div><label class="label">Modalidade</label><input name="modalidade" class="input" value="${Utils.escape(c?.modalidade || 'Pregão Eletrônico')}" required></div><div><label class="label">Número licitação</label><input name="numero_licitacao" class="input" value="${Utils.escape(c?.numero_licitacao || '')}"></div><div><label class="label">Categoria</label><select name="categoria" class="select">${['obras','servicos','compras','locacao','tecnologia','saude','educacao','limpeza','transporte'].map((x) => `<option value="${x}" ${c?.categoria === x ? 'selected' : ''}>${Utils.typeLabel(x)}</option>`).join('')}</select></div><div class="md:col-span-2"><label class="label">Objeto</label><textarea name="objeto" class="textarea" rows="3" required>${Utils.escape(c?.objeto || '')}</textarea></div><div><label class="label">Valor original</label><input name="valor_original" type="number" step="0.01" class="input" value="${c?.valor_original || 0}"></div><div><label class="label">Secretaria</label><select name="secretaria_id" class="select">${optionsFrom(data.secretarias, c?.secretaria_id, (s) => s.nome)}</select></div><div><label class="label">Unidade gestora</label><input name="unidade_gestora" class="input" value="${Utils.escape(c?.unidade_gestora || '')}"></div><div><label class="label">Status</label><select name="status" class="select">${contractStatuses.map((s) => `<option value="${s}" ${c?.status === s ? 'selected' : ''}>${Utils.statusLabel(s)}</option>`).join('')}</select></div><div><label class="label">Assinatura</label><input name="data_assinatura" type="date" class="input" value="${c?.data_assinatura || Utils.todayISO()}"></div><div><label class="label">Início</label><input name="data_inicio" type="date" class="input" value="${c?.data_inicio || Utils.todayISO()}"></div><div><label class="label">Fim</label><input name="data_fim" type="date" class="input" value="${c?.data_fim || Utils.todayISO()}"></div><div><label class="label">Gestor</label><select name="gestor_id" class="select">${optionsFrom(data.usuarios, c?.gestor_id, (u) => `${u.nome} - ${u.perfil}`)}</select></div><div><label class="label">Fiscal titular</label><select name="fiscal_titular_id" class="select"><option value="">Não designado</option>${optionsFrom(data.usuarios, c?.fiscal_titular_id, (u) => `${u.nome} - ${u.perfil}`)}</select></div><div><label class="label">Fiscal suplente</label><select name="fiscal_suplente_id" class="select"><option value="">Não designado</option>${optionsFrom(data.usuarios, c?.fiscal_suplente_id, (u) => `${u.nome} - ${u.perfil}`)}</select></div><div><label class="label">Dotação</label><input name="dotacao_orcamentaria" class="input" value="${Utils.escape(c?.dotacao_orcamentaria || '')}"></div><div><label class="label">Fonte de recurso</label><input name="fonte_recurso" class="input" value="${Utils.escape(c?.fonte_recurso || '')}"></div><div><label class="label">Número do empenho</label><input name="numero_empenho" class="input" value="${Utils.escape(c?.numero_empenho || '')}"></div><div><label class="label">Garantia</label><input name="garantia" class="input" value="${Utils.escape(c?.garantia || '')}"></div><div class="md:col-span-2"><label class="label">Observações</label><textarea name="observacoes" class="textarea">${Utils.escape(c?.observacoes || '')}</textarea></div><div class="md:col-span-2 flex justify-end gap-2"><button type="button" onclick="closeModal()" class="btn btn-soft">${icon('x')}Cancelar</button><button class="btn btn-primary">${icon('save')}Salvar contrato</button></div></form>`, '1080px');
  };

  window.saveContractForm = function (event, id) {
    event.preventDefault();
    const f = new FormData(event.target);
    const payload = {
      id: id || Utils.uuid('c'), licitacao_id: f.get('licitacao_id'), fornecedor_id: f.get('fornecedor_id'), numero_contrato: f.get('numero_contrato'), ano: Number(f.get('ano')), processo_administrativo: f.get('processo_administrativo'), modalidade: f.get('modalidade'), numero_licitacao: f.get('numero_licitacao'), objeto: f.get('objeto'), categoria: f.get('categoria'), tipo: f.get('categoria'), valor_original: Number(f.get('valor_original')), data_assinatura: f.get('data_assinatura'), data_inicio: f.get('data_inicio'), data_fim: f.get('data_fim'), status: f.get('status'), secretaria_id: f.get('secretaria_id'), unidade_gestora: f.get('unidade_gestora'), gestor_id: f.get('gestor_id'), fiscal_titular_id: f.get('fiscal_titular_id'), fiscal_suplente_id: f.get('fiscal_suplente_id'), dotacao_orcamentaria: f.get('dotacao_orcamentaria'), fonte_recurso: f.get('fonte_recurso'), numero_empenho: f.get('numero_empenho'), garantia: f.get('garantia'), observacoes: f.get('observacoes')
    };
    if (!payload.numero_contrato || !payload.objeto || !payload.fornecedor_id) { toast('Preencha os campos obrigatórios do contrato.', 'error'); return; }
    if (id) Object.assign(contrato(id), payload); else data.contratos.push(payload);
    save(); logAction(id ? 'Contrato editado' : 'Contrato criado', 'Contratos', payload.id, `${payload.numero_contrato} salvo.`); closeModal(); toast('Contrato salvo com sucesso.'); render(); if (currentContractId === payload.id) renderContractDrawer();
  };

  window.designateFiscal = function (id) {
    const c = contrato(id);
    openModal('Designar fiscal', `<form onsubmit="saveFiscalDesignation(event,'${id}')" class="space-y-4"><div><label class="label">Contrato</label><input class="input" value="${c.numero_contrato}" disabled></div><div><label class="label">Fiscal titular</label><select name="fiscal_titular_id" class="select">${optionsFrom(data.usuarios, c.fiscal_titular_id, (u) => `${u.nome} - ${u.perfil}`)}</select></div><div><label class="label">Fiscal suplente</label><select name="fiscal_suplente_id" class="select"><option value="">Não designado</option>${optionsFrom(data.usuarios, c.fiscal_suplente_id, (u) => `${u.nome} - ${u.perfil}`)}</select></div><button class="btn btn-primary w-full">${icon('user-check')}Salvar designação</button></form>`);
  };

  window.saveFiscalDesignation = function (event, id) {
    event.preventDefault();
    const f = new FormData(event.target);
    Object.assign(contrato(id), { fiscal_titular_id: f.get('fiscal_titular_id'), fiscal_suplente_id: f.get('fiscal_suplente_id') });
    save(); logAction('Fiscal designado', 'Contratos', id, `Fiscal designado para ${contrato(id).numero_contrato}.`); closeModal(); toast('Fiscal designado.'); render();
  };

  window.openAditivoForm = function (contractId = '') {
    requirePermission('aditivo');
    const c = contractId ? contrato(contractId) : null;
    const calc = c ? computeContract(c.id) : null;
    openModal('Adicionar aditivo', `<form onsubmit="saveAditivoForm(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="label">Contrato</label><select name="contrato_id" class="select" required>${optionsFrom(data.contratos, contractId, (x) => `${x.numero_contrato} - ${fornecedor(x.fornecedor_id)?.nome_fantasia}`)}</select></div><div><label class="label">Tipo</label><select name="tipo" class="select">${aditivoTypes.map((t) => `<option value="${t}">${Utils.typeLabel(t)}</option>`).join('')}</select></div><div><label class="label">Número</label><input name="numero" class="input" placeholder="1º Termo Aditivo" required></div><div><label class="label">Data</label><input name="data_aditivo" type="date" class="input" value="${Utils.todayISO()}"></div><div><label class="label">Valor anterior</label><input name="valor_anterior" type="number" step="0.01" class="input" value="${calc?.valorAtual || 0}"></div><div><label class="label">Novo valor</label><input name="novo_valor" type="number" step="0.01" class="input" value="${calc?.valorAtual || 0}"></div><div><label class="label">Prazo anterior</label><input name="prazo_anterior" type="date" class="input" value="${c?.data_fim || Utils.todayISO()}"></div><div><label class="label">Novo prazo</label><input name="nova_data_fim" type="date" class="input"></div><div><label class="label">Arquivo</label><input name="arquivo_url" class="input" placeholder="termo-aditivo.pdf"></div><div class="md:col-span-2"><label class="label">Justificativa</label><textarea name="justificativa" class="textarea" required></textarea></div><div class="md:col-span-2"><button class="btn btn-primary w-full">${icon('save')}Salvar aditivo</button></div></form>`);
  };

  window.saveAditivoForm = function (event) {
    event.preventDefault();
    const f = new FormData(event.target);
    const valorAnterior = Number(f.get('valor_anterior') || 0);
    const novoValor = Number(f.get('novo_valor') || 0);
    const a = { id: Utils.uuid('ad'), contrato_id: f.get('contrato_id'), tipo: f.get('tipo'), numero: f.get('numero'), data_aditivo: f.get('data_aditivo'), valor_anterior: valorAnterior, novo_valor: novoValor, valor_acrescimo: Math.max(0, novoValor - valorAnterior), valor_supressao: Math.max(0, valorAnterior - novoValor), prazo_anterior: f.get('prazo_anterior'), nova_data_fim: f.get('nova_data_fim'), justificativa: f.get('justificativa'), arquivo_url: f.get('arquivo_url') };
    data.aditivos.push(a);
    if (a.nova_data_fim) contrato(a.contrato_id).data_fim = a.nova_data_fim;
    save(); logAction('Aditivo criado', 'Aditivos', a.id, `${a.numero} vinculado a ${contrato(a.contrato_id)?.numero_contrato}.`); closeModal(); toast('Aditivo salvo e contrato recalculado.'); render(); if (currentContractId) renderContractDrawer();
  };

  window.deleteAditivo = function (id) {
    const a = data.aditivos.find((x) => x.id === id);
    data.aditivos = data.aditivos.filter((x) => x.id !== id);
    save(); logAction('Aditivo excluído', 'Aditivos', id, a?.numero || id); toast('Aditivo excluído.'); render();
  };

  window.openOccurrenceForm = function (contractId = '') {
    openModal('Adicionar ocorrência', `<form onsubmit="saveOccurrenceForm(event)" class="space-y-4"><div><label class="label">Contrato</label><select name="contrato_id" class="select">${optionsFrom(data.contratos, contractId, (c) => c.numero_contrato)}</select></div><div><label class="label">Tipo</label><select name="tipo" class="select"><option value="atraso">Atraso</option><option value="divergencia">Divergência</option><option value="notificacao">Notificação</option><option value="penalidade">Penalidade</option><option value="documentacao_pendente">Documentação pendente</option><option value="outros">Outros</option></select></div><div><label class="label">Descrição</label><textarea name="descricao" class="textarea" required></textarea></div><button class="btn btn-primary w-full">${icon('save')}Salvar ocorrência</button></form>`);
  };

  window.saveOccurrenceForm = function (event) {
    event.preventDefault();
    const f = new FormData(event.target);
    const o = { id: Utils.uuid('oc'), contrato_id: f.get('contrato_id'), tipo: f.get('tipo'), descricao: f.get('descricao'), criado_por: currentUser().id, data_ocorrencia: Utils.todayISO() };
    data.ocorrencias.push(o); save(); logAction('Ocorrência criada', 'Fiscalização', o.contrato_id, o.descricao); closeModal(); toast('Ocorrência registrada.'); render(); if (currentContractId) renderContractDrawer();
  };

  window.openOrderForm = function () {
    openModal('Nova ordem de fornecimento ou serviço', `<form onsubmit="saveOrderForm(event)" class="space-y-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="label">Contrato</label><select name="contrato_id" class="select" required>${optionsFrom(data.contratos, '', (c) => `${c.numero_contrato} - ${fornecedor(c.fornecedor_id)?.nome_fantasia}`)}</select></div><div><label class="label">Data prevista</label><input name="data_prevista" type="date" class="input" value="${Utils.todayISO()}" required></div><div class="md:col-span-2"><label class="label">Observação</label><textarea name="observacao" class="textarea"></textarea></div></div><button class="btn btn-primary w-full">${icon('save')}Criar ordem simulada</button></form>`);
  };

  window.saveOrderForm = function (event) {
    event.preventDefault();
    const f = new FormData(event.target);
    const c = contrato(f.get('contrato_id'));
    const order = { id: Utils.uuid('of'), contrato_id: c.id, secretaria_id: c.secretaria_id, solicitante_id: currentUser().id, numero: `OF ${c.numero_contrato.replace(/\D/g, '').slice(0, 3)}-${String(data.ordens.filter((o) => o.contrato_id === c.id).length + 1).padStart(3, '0')}/${new Date().getFullYear()}`, data_solicitacao: Utils.todayISO(), data_prevista: f.get('data_prevista'), status: 'solicitada', observacao: f.get('observacao') };
    data.ordens.push(order); save(); logAction('Ordem criada', 'Execução', order.id, `${order.numero} criada.`); closeModal(); toast('Ordem criada.'); render();
  };

  window.openExecutionForm = function () {
    openModal('Registrar medição ou entrega', `<form onsubmit="saveExecutionForm(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="label">Contrato</label><select name="contrato_id" class="select">${optionsFrom(data.contratos, '', (c) => c.numero_contrato)}</select></div><div><label class="label">Tipo</label><select name="tipo" class="select"><option value="entrega">Entrega</option><option value="medicao">Medição</option><option value="servico">Serviço</option></select></div><div><label class="label">Data</label><input name="data_execucao" type="date" class="input" value="${Utils.todayISO()}"></div><div><label class="label">Valor executado</label><input name="valor_executado" type="number" step="0.01" class="input" required></div><div><label class="label">Status</label><select name="status" class="select"><option value="recebido_provisoriamente">Recebido provisoriamente</option><option value="aprovado">Aprovado</option><option value="parcial">Parcial</option><option value="rejeitado">Rejeitado</option></select></div><div><label class="label">Percentual</label><input name="percentual" type="number" step="0.01" class="input" value="0"></div><div class="md:col-span-2"><label class="label">Observações</label><textarea name="observacoes" class="textarea"></textarea></div><div class="md:col-span-2"><button class="btn btn-primary w-full">${icon('save')}Registrar execução</button></div></form>`);
  };

  window.saveExecutionForm = function (event) {
    event.preventDefault();
    const f = new FormData(event.target);
    const e = { id: Utils.uuid('ex'), contrato_id: f.get('contrato_id'), ordem_id: '', tipo: f.get('tipo'), data_execucao: f.get('data_execucao'), responsavel_ateste: currentUser().id, status: f.get('status'), valor_executado: Number(f.get('valor_executado')), observacoes: f.get('observacoes'), percentual: Number(f.get('percentual')) };
    data.execucoes.push(e); save(); logAction('Execução registrada', 'Execução', e.id, `${Utils.typeLabel(e.tipo)} registrada.`); closeModal(); toast('Execução registrada.'); render();
  };

  window.openNFForm = function () {
    openModal('Nova nota fiscal', `<form onsubmit="saveNFForm(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="label">Contrato</label><select name="contrato_id" class="select">${optionsFrom(data.contratos, '', (c) => c.numero_contrato)}</select></div><div><label class="label">Número NF</label><input name="numero_nf" class="input" required></div><div><label class="label">Emissão</label><input name="data_emissao" type="date" class="input" value="${Utils.todayISO()}"></div><div><label class="label">Valor bruto</label><input name="valor_bruto" type="number" step="0.01" class="input" required></div><div><label class="label">Glosa</label><input name="valor_glosa" type="number" step="0.01" class="input" value="0"></div><div><label class="label">Arquivo</label><input name="arquivo_url" class="input" placeholder="nf.xml ou nf.pdf"></div><div class="md:col-span-2"><button class="btn btn-primary w-full">${icon('save')}Salvar nota fiscal</button></div></form>`);
  };

  window.saveNFForm = function (event) {
    event.preventDefault();
    const f = new FormData(event.target);
    const bruto = Number(f.get('valor_bruto')); const glosa = Number(f.get('valor_glosa') || 0);
    const n = { id: Utils.uuid('nf'), contrato_id: f.get('contrato_id'), execucao_id: '', numero_nf: f.get('numero_nf'), data_emissao: f.get('data_emissao'), valor_bruto: bruto, valor_glosa: glosa, valor_liquido: bruto - glosa, status: 'recebida', arquivo_url: f.get('arquivo_url') };
    data.notas_fiscais.push(n); save(); logAction('Nota fiscal cadastrada', 'Execução', n.id, n.numero_nf); closeModal(); toast('Nota fiscal salva.'); render();
  };

  window.openDocForm = function () {
    openModal('Anexar documento simulado', `<form onsubmit="saveDocForm(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="label">Contrato</label><select name="contrato_id" class="select">${optionsFrom(data.contratos, '', (c) => c.numero_contrato)}</select></div><div><label class="label">Tipo</label><input name="tipo" class="input" placeholder="Parecer jurídico, edital, NF..." required></div><div class="md:col-span-2"><label class="label">Nome</label><input name="nome" class="input" required></div><div><label class="label">Arquivo</label><input name="url" class="input" placeholder="arquivo.pdf"></div><div><label class="label">Obrigatório</label><select name="obrigatorio" class="select"><option value="true">Sim</option><option value="false">Não</option></select></div><div class="md:col-span-2"><button class="btn btn-primary w-full">${icon('paperclip')}Anexar</button></div></form>`);
  };

  window.saveDocForm = function (event) {
    event.preventDefault();
    const f = new FormData(event.target);
    const d = { id: Utils.uuid('doc'), contrato_id: f.get('contrato_id'), nome: f.get('nome'), tipo: f.get('tipo'), url: f.get('url'), obrigatorio: f.get('obrigatorio') === 'true', status: f.get('url') ? 'ok' : 'pendente' };
    data.documentos.push(d); save(); logAction('Documento anexado', 'Documentos', d.id, d.nome); closeModal(); toast('Documento anexado.'); render(); if (currentContractId) renderContractDrawer();
  };

  window.viewDoc = function (id) { const d = data.documentos.find((x) => x.id === id); openModal('Documento simulado', `<div class="space-y-3">${statBox('Documento', d.nome)}${statBox('Tipo', d.tipo)}${statBox('Arquivo', d.url || 'Não anexado')}${statBox('Status', Utils.statusLabel(d.status))}<p class="text-sm text-slate-500 font-semibold">Visualização simulada. Em um sistema real este botão abriria o arquivo no GED ou storage seguro.</p></div>`); };
  window.downloadDoc = function (id) { const d = data.documentos.find((x) => x.id === id); toast(d.url ? `Download simulado de ${d.url}.` : 'Documento sem arquivo anexado.', d.url ? 'success' : 'warn'); };
  window.removeDoc = function (id) { const d = data.documentos.find((x) => x.id === id); data.documentos = data.documentos.filter((x) => x.id !== id); save(); logAction('Documento removido', 'Documentos', id, d?.nome || id); toast('Documento removido.'); render(); };

  window.openFornecedorForm = function (id = '') {
    const f = id ? fornecedor(id) : null;
    openModal(f ? 'Editar fornecedor' : 'Novo fornecedor', `<form onsubmit="saveFornecedorForm(event,'${id}')" class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="label">Razão social</label><input name="razao_social" class="input" value="${Utils.escape(f?.razao_social || '')}" required></div><div><label class="label">Nome fantasia</label><input name="nome_fantasia" class="input" value="${Utils.escape(f?.nome_fantasia || '')}"></div><div><label class="label">CNPJ</label><input name="cnpj" class="input" value="${Utils.escape(f?.cnpj || '')}"></div><div><label class="label">Responsável</label><input name="responsavel" class="input" value="${Utils.escape(f?.responsavel || '')}"></div><div><label class="label">Telefone</label><input name="telefone" class="input" value="${Utils.escape(f?.telefone || '')}"></div><div><label class="label">E-mail</label><input name="email" class="input" value="${Utils.escape(f?.email || '')}"></div><div class="md:col-span-2"><label class="label">Endereço</label><input name="endereco" class="input" value="${Utils.escape(f?.endereco || '')}"></div><div><label class="label">Certidões</label><input name="certidoes" class="input" value="${Utils.escape(f?.certidoes || '')}"></div><div><label class="label">Situação</label><select name="situacao" class="select"><option value="regular">Regular</option><option value="atenção" ${f?.situacao === 'atenção' ? 'selected' : ''}>Atenção</option><option value="irregular" ${f?.situacao === 'irregular' ? 'selected' : ''}>Irregular</option></select></div><div class="md:col-span-2"><label class="label">Sanções</label><input name="sancoes" class="input" value="${Utils.escape(f?.sancoes || 'Sem sanções')}"></div><div class="md:col-span-2"><button class="btn btn-primary w-full">${icon('save')}Salvar fornecedor</button></div></form>`);
  };

  window.saveFornecedorForm = function (event, id) {
    event.preventDefault();
    const f = new FormData(event.target);
    const payload = { id: id || Utils.uuid('f'), razao_social: f.get('razao_social'), nome_fantasia: f.get('nome_fantasia'), cnpj: f.get('cnpj'), responsavel: f.get('responsavel'), telefone: f.get('telefone'), email: f.get('email'), endereco: f.get('endereco'), certidoes: f.get('certidoes'), situacao: f.get('situacao'), sancoes: f.get('sancoes') };
    if (id) Object.assign(fornecedor(id), payload); else data.fornecedores.push(payload);
    save(); logAction(id ? 'Fornecedor editado' : 'Fornecedor criado', 'Fornecedores', payload.id, payload.razao_social); closeModal(); toast('Fornecedor salvo.'); render();
  };

  window.viewFornecedor = function (id) {
    const f = fornecedor(id);
    const rows = data.contratos.filter((c) => c.fornecedor_id === id).map((c) => ({ Contrato: c.numero_contrato, Secretaria: secretaria(c.secretaria_id)?.sigla, Status: Utils.statusLabel(c.status), Valor: Utils.currency(computeContract(c.id).valorAtual), Saldo: Utils.currency(computeContract(c.id).saldoContratual) }));
    openModal(`Vínculos de ${f.nome_fantasia}`, miniTable(rows), '1000px');
  };

  window.contractReport = function (id) {
    const c = contrato(id); const calc = computeContract(id);
    openModal(`Relatório do contrato ${c.numero_contrato}`, `<div id="print-zone" class="print-area"><h2 class="text-2xl font-black mb-2">Relatório contratual</h2><p class="font-semibold text-slate-600 mb-5">${Utils.escape(c.objeto)}</p><div class="grid grid-cols-2 gap-3 mb-5">${kpiCard('Valor atualizado', Utils.currency(calc.valorAtual), 'wallet', 'green')}${kpiCard('Saldo', Utils.currency(calc.saldoContratual), 'wallet-cards', calc.saldoContratual < 0 ? 'red' : 'blue')}</div>${miniTable(calc.itens.map((i) => ({ Item: i.descricao, Contratado: `${Utils.number(i.quantidade_contratada)} ${i.unidade_medida}`, Executado: Utils.number(i.quantidade_executada), Saldo: Utils.number(i.saldo_quantidade), Valor: Utils.currency(i.valor_total) })))}</div><div class="flex justify-end gap-2 mt-5 no-print"><button class="btn btn-soft" onclick="window.print()">${icon('printer')}Imprimir</button><button class="btn btn-primary" onclick="closeModal()">${icon('check')}Concluir</button></div>`, '1000px');
  };

  function rowsForReport(type) {
    if (type === 'Contratos por secretaria') return data.secretarias.map((s) => ({ Secretaria: s.nome, Contratos: data.contratos.filter((c) => c.secretaria_id === s.id).length, Valor: Utils.currency(Utils.sum(data.contratos.filter((c) => c.secretaria_id === s.id), (c) => computeContract(c.id).valorAtual)) }));
    if (type === 'Contratos por fornecedor') return data.fornecedores.map((f) => ({ Fornecedor: f.nome_fantasia, CNPJ: f.cnpj, Contratos: data.contratos.filter((c) => c.fornecedor_id === f.id).length, Situação: Utils.statusLabel(f.situacao) }));
    if (type === 'Contratos vencendo') return data.contratos.filter((c) => Utils.daysUntil(c.data_fim) >= 0 && Utils.daysUntil(c.data_fim) <= 90).map((c) => ({ Contrato: c.numero_contrato, Fornecedor: fornecedor(c.fornecedor_id)?.nome_fantasia, Vencimento: Utils.date(c.data_fim), Dias: Utils.daysUntil(c.data_fim), Status: Utils.statusLabel(c.status) }));
    if (type === 'Contratos vencidos') return data.contratos.filter((c) => Utils.daysUntil(c.data_fim) < 0).map((c) => ({ Contrato: c.numero_contrato, Fornecedor: fornecedor(c.fornecedor_id)?.nome_fantasia, Vencimento: Utils.date(c.data_fim), Saldo: Utils.currency(computeContract(c.id).saldoContratual) }));
    if (type === 'Valores por categoria') return [...new Set(data.contratos.map((c) => c.categoria))].map((cat) => ({ Categoria: Utils.typeLabel(cat), Contratos: data.contratos.filter((c) => c.categoria === cat).length, Valor: Utils.currency(Utils.sum(data.contratos.filter((c) => c.categoria === cat), (c) => computeContract(c.id).valorAtual)) }));
    if (type === 'Execução financeira') return data.contratos.map((c) => ({ Contrato: c.numero_contrato, Atualizado: Utils.currency(computeContract(c.id).valorAtual), Executado: Utils.currency(computeContract(c.id).valorExecutado), Liquidado: Utils.currency(computeContract(c.id).valorLiquidado), Pago: Utils.currency(computeContract(c.id).valorPago), Saldo: Utils.currency(computeContract(c.id).saldoContratual) }));
    if (type === 'Aditivos por período') return data.aditivos.map((a) => ({ Contrato: contrato(a.contrato_id)?.numero_contrato, Número: a.numero, Tipo: Utils.typeLabel(a.tipo), Data: Utils.date(a.data_aditivo), NovoValor: Utils.currency(a.novo_valor), NovoPrazo: Utils.date(a.nova_data_fim) }));
    if (type === 'Pendências de fiscalização') return data.fiscalizacoes.filter((f) => f.pendencias_abertas > 0).map((f) => ({ Contrato: contrato(f.contrato_id)?.numero_contrato, Fiscal: usuario(f.fiscal_id)?.nome || 'Não designado', Risco: Utils.statusLabel(f.risco), Pendências: f.pendencias_abertas, Parecer: f.parecer }));
    return data.contratos.map((c) => ({ Contrato: c.numero_contrato, Objeto: c.objeto, Fornecedor: fornecedor(c.fornecedor_id)?.nome_fantasia, Secretaria: secretaria(c.secretaria_id)?.sigla, Valor: Utils.currency(computeContract(c.id).valorAtual), Vigência: `${Utils.date(c.data_inicio)} a ${Utils.date(c.data_fim)}`, Status: Utils.statusLabel(c.status) }));
  }

  window.generateReport = function () {
    const type = $('report-type').value;
    reportRows = rowsForReport(type);
    const contractId = $('report-contract').value;
    const fornecedorId = $('report-fornecedor').value;
    const status = $('report-status').value;
    const secId = $('report-secretaria').value;
    const hay = (row) => Utils.normalizeText(Object.values(row).join(' '));
    if (contractId) reportRows = reportRows.filter((row) => hay(row).includes(Utils.normalizeText(contrato(contractId)?.numero_contrato || '')));
    if (fornecedorId) reportRows = reportRows.filter((row) => hay(row).includes(Utils.normalizeText(fornecedor(fornecedorId)?.nome_fantasia || fornecedor(fornecedorId)?.razao_social || '')));
    if (status) reportRows = reportRows.filter((row) => hay(row).includes(Utils.normalizeText(Utils.statusLabel(status))) || hay(row).includes(Utils.normalizeText(status)));
    if (secId) reportRows = reportRows.filter((row) => hay(row).includes(Utils.normalizeText(secretaria(secId)?.sigla || secretaria(secId)?.nome || '')));
    $('report-output').innerHTML = `<div id="print-zone"><div class="flex justify-between gap-4 mb-5"><div><p class="text-xs uppercase tracking-[.2em] font-black text-slate-400">Relatório</p><h2 class="text-2xl font-black">${type}</h2><p class="text-sm text-slate-500 font-semibold">Gerado em ${Utils.datetime(new Date())}</p></div><span class="badge badge-blue">${reportRows.length} registros</span></div>${miniTable(reportRows)}</div>`;
    logAction('Relatório gerado', 'Relatórios', type, `${type} com ${reportRows.length} registros.`);
    hydrateIcons();
  };

  window.downloadReportCSV = function () { if (!reportRows.length) { toast('Gere um relatório primeiro.', 'warn'); return; } Utils.download(`relatorio-sigcon-${Utils.todayISO()}.csv`, Utils.toCSV(reportRows), 'text/csv;charset=utf-8'); toast('CSV exportado.'); };
  window.printReport = function () { window.print(); };
  window.exportCSV = function (type) {
    let rows = [];
    if (type === 'licitacoes') rows = data.licitacoes;
    if (type === 'auditoria') rows = data.auditoria;
    if (type === 'transparencia') rows = data.contratos.map((c) => ({ contrato: c.numero_contrato, objeto: c.objeto, fornecedor: fornecedor(c.fornecedor_id)?.nome_fantasia, secretaria: secretaria(c.secretaria_id)?.sigla, valor: computeContract(c.id).valorAtual, status: Utils.statusLabel(c.status) }));
    Utils.download(`${type}-sigcon-${Utils.todayISO()}.csv`, Utils.toCSV(rows), 'text/csv;charset=utf-8');
    toast('CSV exportado.');
  };

  render();
})();
