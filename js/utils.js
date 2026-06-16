(function () {
  const statusMap = {
    draft: ['Rascunho', 'badge-slate'],
    pending_signature: ['Pendente de assinatura', 'badge-yellow'],
    active: ['Vigente', 'badge-green'],
    near_expiration: ['A vencer', 'badge-yellow'],
    expired: ['Vencido', 'badge-red'],
    suspended: ['Suspenso', 'badge-purple'],
    terminated: ['Rescindido', 'badge-red'],
    closed: ['Encerrado', 'badge-slate'],
    homologada: ['Homologada', 'badge-blue'],
    concluida: ['Concluída', 'badge-green'],
    cancelada: ['Cancelada', 'badge-red'],
    solicitada: ['Solicitada', 'badge-blue'],
    autorizada: ['Autorizada', 'badge-green'],
    enviada_ao_fornecedor: ['Enviada ao fornecedor', 'badge-yellow'],
    entregue_parcial: ['Entregue parcial', 'badge-yellow'],
    entregue_total: ['Entregue total', 'badge-green'],
    recebido_provisoriamente: ['Recebido provisoriamente', 'badge-blue'],
    aprovado: ['Aprovado', 'badge-green'],
    rejeitado: ['Rejeitado', 'badge-red'],
    parcial: ['Parcial', 'badge-yellow'],
    pendente: ['Pendente', 'badge-yellow'],
    recebida: ['Recebida', 'badge-blue'],
    em_analise: ['Em análise', 'badge-yellow'],
    liquidada: ['Liquidada', 'badge-purple'],
    paga: ['Paga', 'badge-green'],
    rejeitada: ['Rejeitada', 'badge-red'],
    ok: ['Regular', 'badge-green'],
    analise: ['Em análise', 'badge-yellow'],
    regular: ['Regular', 'badge-green'],
    atenção: ['Atenção', 'badge-yellow'],
    irregular: ['Irregular', 'badge-red'],
    baixo: ['Risco baixo', 'badge-green'],
    medio: ['Risco médio', 'badge-yellow'],
    alto: ['Risco alto', 'badge-red']
  };

  const typeMap = {
    compras: 'Compras',
    servicos: 'Serviços',
    servico: 'Serviço',
    obra: 'Obra',
    locacao: 'Locação',
    tecnologia: 'Tecnologia',
    transporte: 'Transporte',
    limpeza: 'Limpeza',
    educacao: 'Educação',
    saude: 'Saúde',
    entrega: 'Entrega',
    medicao: 'Medição',
    prorrogacao: 'Prorrogação de vigência',
    acrescimo: 'Acréscimo',
    supressao: 'Supressão',
    reequilibrio: 'Reequilíbrio econômico-financeiro',
    reajuste: 'Reajuste',
    repactuacao: 'Repactuação',
    apostilamento: 'Apostilamento',
    rescisao: 'Rescisão',
    suspensao: 'Suspensão'
  };

  const Utils = {
    currency(value) {
      return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
    number(value, digits = 0) {
      return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    },
    date(value) {
      if (!value) return '-';
      const [y, m, d] = String(value).slice(0, 10).split('-');
      if (!y || !m || !d) return value;
      return `${d}/${m}/${y}`;
    },
    datetime(value) {
      if (!value) return '-';
      return new Date(value).toLocaleString('pt-BR');
    },
    todayISO() {
      return new Date().toISOString().slice(0, 10);
    },
    daysUntil(value) {
      if (!value) return 9999;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(value);
      end.setHours(0, 0, 0, 0);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    },
    uuid(prefix = 'id') {
      return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    },
    escape(value) {
      return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
    },
    statusLabel(status) {
      return (statusMap[status] || [status || '-', 'badge-slate'])[0];
    },
    badge(status) {
      const [label, cls] = statusMap[status] || [status || '-', 'badge-slate'];
      return `<span class="badge ${cls}"><span class="inline-block w-2 h-2 rounded-full bg-current opacity-70"></span>${label}</span>`;
    },
    typeLabel(type) {
      return typeMap[type] || type || '-';
    },
    perc(part, total) {
      if (!Number(total)) return 0;
      return Math.max(0, Math.min(100, (Number(part || 0) / Number(total)) * 100));
    },
    getById(list, id) {
      return (list || []).find((item) => item.id === id) || null;
    },
    sum(list, selector) {
      return (list || []).reduce((acc, item) => acc + Number(selector(item) || 0), 0);
    },
    normalizeText(value) {
      return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
    includes(value, search) {
      return Utils.normalizeText(value).includes(Utils.normalizeText(search));
    },
    download(filename, content, type = 'text/plain;charset=utf-8') {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    toCSV(rows) {
      if (!rows.length) return '';
      const cols = Object.keys(rows[0]);
      const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      return [cols.join(';'), ...rows.map((r) => cols.map((c) => escape(r[c])).join(';'))].join('\n');
    },
    copyDeep(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    canRole(role, action) {
      const blocked = {
        'Consulta/Transparência': ['delete', 'pay', 'liquidate', 'aditivo', 'statusContract', 'create', 'edit'],
        'Secretaria Solicitante': ['delete', 'pay', 'liquidate', 'aditivo'],
        'Fiscal de Contrato': ['pay', 'liquidate', 'aditivo'],
        'Controle Interno': ['pay', 'liquidate'],
        Jurídico: ['pay', 'liquidate']
      };
      return !(blocked[role] || []).includes(action);
    }
  };

  window.Utils = Utils;
})();
