(function () {
  const today = new Date();
  const iso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  const dt = (offsetHours) => new Date(today.getTime() + offsetHours * 60 * 60 * 1000).toISOString();
  const id = (prefix, n) => `${prefix}-${String(n).padStart(3, '0')}`;

  window.SIGCON_INITIAL_DATA = {
    meta: {
      appName: 'SIGCON Obras',
      subtitle: 'Gestão de contratos públicos, execução, fiscalização e transparência',
      municipio: 'Prefeitura Municipal de São João del-Rei',
      versao: '2.0.0-prototipo-premium'
    },
    usuarios: [
      { id: 'u-admin', nome: 'Aurélio Admin', perfil: 'Administrador', email: 'admin@sjdr.mg.gov.br' },
      { id: 'u-gestor', nome: 'Marcos Lima', perfil: 'Gestor de Contratos', email: 'gestor.contratos@sjdr.mg.gov.br' },
      { id: 'u-fiscal', nome: 'Renata Costa', perfil: 'Fiscal de Contrato', email: 'fiscal@sjdr.mg.gov.br' },
      { id: 'u-controle', nome: 'Silvana Prado', perfil: 'Controle Interno', email: 'controleinterno@sjdr.mg.gov.br' },
      { id: 'u-juridico', nome: 'Dr. Rafael Duarte', perfil: 'Jurídico', email: 'juridico@sjdr.mg.gov.br' },
      { id: 'u-saude', nome: 'Helena Martins', perfil: 'Secretaria Solicitante', email: 'saude@sjdr.mg.gov.br' },
      { id: 'u-consulta', nome: 'Consulta Pública', perfil: 'Consulta/Transparência', email: 'transparencia@sigcon.local' }
    ],
    secretarias: [
      { id: 'sec-obras', nome: 'Secretaria Municipal de Obras', sigla: 'SMO' },
      { id: 'sec-saude', nome: 'Secretaria Municipal de Saúde', sigla: 'SMS' },
      { id: 'sec-educacao', nome: 'Secretaria Municipal de Educação', sigla: 'SME' },
      { id: 'sec-adm', nome: 'Secretaria Municipal de Administração', sigla: 'SMA' },
      { id: 'sec-transporte', nome: 'Secretaria Municipal de Transporte', sigla: 'SMT' },
      { id: 'sec-assistencia', nome: 'Secretaria Municipal de Assistência Social', sigla: 'SMAS' }
    ],
    fornecedores: [
      { id: 'f-pneus', razao_social: 'Pneus Forte Distribuidora Ltda', nome_fantasia: 'Pneus Forte', cnpj: '12.345.678/0001-90', responsavel: 'Rogério Batista', telefone: '(32) 3333-1010', email: 'contratos@pneusforte.com.br', endereco: 'Av. Industrial, 450 - Distrito Empresarial', certidoes: 'Regular até 20/08/2026', situacao: 'regular', sancoes: 'Sem sanções', prazo_medio_entrega_dias: 14 },
      { id: 'f-construtora', razao_social: 'Construtora Pedra do Sino Ltda', nome_fantasia: 'Pedra do Sino Engenharia', cnpj: '22.456.111/0001-30', responsavel: 'João Pedro Maia', telefone: '(32) 3333-3030', email: 'obras@pedradosino.eng.br', endereco: 'Rua das Acácias, 77 - Centro', certidoes: 'Regular até 28/07/2026', situacao: 'regular', sancoes: 'Advertência em contrato anterior encerrada' },
      { id: 'f-limpeza', razao_social: 'Minas Limpa Serviços Terceirizados Ltda', nome_fantasia: 'Minas Limpa', cnpj: '31.987.654/0001-55', responsavel: 'Camila Rezende', telefone: '(32) 3333-8787', email: 'licitacoes@minaslimpa.com.br', endereco: 'Rua Rio Grande, 88 - Matosinhos', certidoes: 'FGTS vence em 9 dias', situacao: 'atenção', sancoes: 'Sem sanções' },
      { id: 'f-merenda', razao_social: 'Nutri Escola Alimentos Ltda', nome_fantasia: 'Nutri Escola', cnpj: '47.665.120/0001-04', responsavel: 'Eduardo Paiva', telefone: '(32) 3333-4044', email: 'contratos@nutriescola.com.br', endereco: 'Av. Brasil, 1200 - Colônia', certidoes: 'Regular até 11/10/2026', situacao: 'regular', sancoes: 'Sem sanções', prazo_medio_entrega_dias: 7 },
      { id: 'f-tech', razao_social: 'GovCloud Tecnologia S.A.', nome_fantasia: 'GovCloud', cnpj: '08.112.998/0001-73', responsavel: 'Patrícia Lacerda', telefone: '(31) 4002-9090', email: 'publico@govcloud.com.br', endereco: 'Alameda Digital, 240 - Belo Horizonte', certidoes: 'CNDT vencida', situacao: 'irregular', sancoes: 'Sem sanções' },
      { id: 'f-transporte', razao_social: 'Via Minas Transporte Escolar Ltda', nome_fantasia: 'Via Minas Escolar', cnpj: '55.009.221/0001-18', responsavel: 'André Faria', telefone: '(32) 3333-7110', email: 'operacao@viaminas.com.br', endereco: 'Rodovia BR-265, km 3', certidoes: 'Regular até 30/09/2026', situacao: 'regular', sancoes: 'Multa leve em análise' },
      { id: 'f-saude', razao_social: 'Vida Sul Equipamentos Hospitalares Ltda', nome_fantasia: 'Vida Sul Hospitalar', cnpj: '19.887.441/0001-66', responsavel: 'Luciana Torres', telefone: '(32) 3333-6545', email: 'saude@vidasul.com.br', endereco: 'Rua das Palmeiras, 40 - Centro', certidoes: 'Regular até 02/09/2026', situacao: 'regular', sancoes: 'Sem sanções', prazo_medio_entrega_dias: 21 }
    ],
    licitacoes: [
      { id: 'lic-pneus', processo_administrativo: 'PA 087/2026', modalidade: 'Pregão Eletrônico', numero_licitacao: 'PE 014/2026', objeto: 'Aquisição parcelada de pneus novos para manutenção da frota municipal.', secretaria_solicitante: 'sec-transporte', data_homologacao: iso(-45), data_adjudicacao: iso(-42), fornecedor_vencedor: 'f-pneus', valor_homologado: 248500, status: 'homologada' },
      { id: 'lic-praca', processo_administrativo: 'PA 044/2026', modalidade: 'Concorrência', numero_licitacao: 'CC 003/2026', objeto: 'Revitalização da Praça do Pontilhão com drenagem, passeio, iluminação e acessibilidade.', secretaria_solicitante: 'sec-obras', data_homologacao: iso(-130), data_adjudicacao: iso(-126), fornecedor_vencedor: 'f-construtora', valor_homologado: 380000, status: 'concluida' },
      { id: 'lic-merenda', processo_administrativo: 'PA 102/2026', modalidade: 'Pregão Eletrônico', numero_licitacao: 'PE 021/2026', objeto: 'Fornecimento de gêneros alimentícios para merenda escolar.', secretaria_solicitante: 'sec-educacao', data_homologacao: iso(-62), data_adjudicacao: iso(-59), fornecedor_vencedor: 'f-merenda', valor_homologado: 1280000, status: 'homologada' },
      { id: 'lic-limpeza', processo_administrativo: 'PA 036/2026', modalidade: 'Pregão Eletrônico', numero_licitacao: 'PE 007/2026', objeto: 'Serviços continuados de limpeza, conservação e higienização de prédios públicos.', secretaria_solicitante: 'sec-adm', data_homologacao: iso(-96), data_adjudicacao: iso(-92), fornecedor_vencedor: 'f-limpeza', valor_homologado: 910000, status: 'concluida' },
      { id: 'lic-tech', processo_administrativo: 'PA 011/2025', modalidade: 'Inexigibilidade', numero_licitacao: 'IN 002/2025', objeto: 'Licenciamento e suporte de plataforma em nuvem para gestão administrativa.', secretaria_solicitante: 'sec-adm', data_homologacao: iso(-350), data_adjudicacao: iso(-348), fornecedor_vencedor: 'f-tech', valor_homologado: 420000, status: 'concluida' },
      { id: 'lic-saude', processo_administrativo: 'PA 075/2026', modalidade: 'Dispensa Emergencial', numero_licitacao: 'DE 006/2026', objeto: 'Aquisição emergencial de monitores multiparamétricos e bombas de infusão.', secretaria_solicitante: 'sec-saude', data_homologacao: iso(-18), data_adjudicacao: iso(-17), fornecedor_vencedor: 'f-saude', valor_homologado: 615000, status: 'homologada' }
    ],
    contratos: [
      { id: 'c-pneus', licitacao_id: 'lic-pneus', fornecedor_id: 'f-pneus', numero_contrato: 'CT 087/2026', ano: 2026, processo_administrativo: 'PA 087/2026', modalidade: 'Pregão Eletrônico', numero_licitacao: 'PE 014/2026', objeto: 'Aquisição parcelada de pneus novos para manutenção da frota municipal.', categoria: 'transporte', tipo: 'compras', valor_original: 248500, data_assinatura: iso(-38), data_inicio: iso(-35), data_fim: iso(84), status: 'active', secretaria_id: 'sec-transporte', unidade_gestora: 'Fundo Municipal de Transporte', gestor_id: 'u-gestor', fiscal_titular_id: 'u-fiscal', fiscal_suplente_id: 'u-controle', dotacao_orcamentaria: '02.12.01.26.782.0018.2.078.3.3.90.30', fonte_recurso: '1.500 Recursos não vinculados', numero_empenho: '2026NE000431', garantia: 'Não exigida', observacoes: 'Contrato com entrega parcelada e saldo monitorado por item.' },
      { id: 'c-praca', licitacao_id: 'lic-praca', fornecedor_id: 'f-construtora', numero_contrato: 'CT 044/2026', ano: 2026, processo_administrativo: 'PA 044/2026', modalidade: 'Concorrência', numero_licitacao: 'CC 003/2026', objeto: 'Execução de obra de revitalização da Praça do Pontilhão, incluindo drenagem, passeio e acessibilidade.', categoria: 'obras', tipo: 'obra', valor_original: 380000, data_assinatura: iso(-122), data_inicio: iso(-115), data_fim: iso(43), status: 'near_expiration', secretaria_id: 'sec-obras', unidade_gestora: 'Secretaria Municipal de Obras', gestor_id: 'u-gestor', fiscal_titular_id: 'u-fiscal', fiscal_suplente_id: 'u-controle', dotacao_orcamentaria: '02.08.01.15.451.0011.1.007.4.4.90.51', fonte_recurso: '1.700 Convênios da União', numero_empenho: '2026NE000212', garantia: 'Seguro garantia R$ 20.900,00 até ' + iso(53), observacoes: 'Prorrogação tratada como aditivo, destacada por criticidade de vencimento.' },
      { id: 'c-limpeza', licitacao_id: 'lic-limpeza', fornecedor_id: 'f-limpeza', numero_contrato: 'CT 036/2026', ano: 2026, processo_administrativo: 'PA 036/2026', modalidade: 'Pregão Eletrônico', numero_licitacao: 'PE 007/2026', objeto: 'Serviços continuados de limpeza, conservação e higienização de prédios públicos municipais.', categoria: 'limpeza', tipo: 'servicos', valor_original: 910000, data_assinatura: iso(-88), data_inicio: iso(-80), data_fim: iso(24), status: 'near_expiration', secretaria_id: 'sec-adm', unidade_gestora: 'Secretaria Municipal de Administração', gestor_id: 'u-gestor', fiscal_titular_id: 'u-fiscal', fiscal_suplente_id: '', dotacao_orcamentaria: '02.04.01.04.122.0003.2.019.3.3.90.39', fonte_recurso: '1.500 Recursos não vinculados', numero_empenho: '2026NE000389', garantia: 'Caução R$ 45.500,00 vence em ' + iso(18), observacoes: 'Certidão de FGTS próxima do vencimento.' },
      { id: 'c-merenda', licitacao_id: 'lic-merenda', fornecedor_id: 'f-merenda', numero_contrato: 'CT 102/2026', ano: 2026, processo_administrativo: 'PA 102/2026', modalidade: 'Pregão Eletrônico', numero_licitacao: 'PE 021/2026', objeto: 'Fornecimento de gêneros alimentícios para merenda escolar da rede municipal.', categoria: 'educacao', tipo: 'compras', valor_original: 1280000, data_assinatura: iso(-58), data_inicio: iso(-55), data_fim: iso(155), status: 'active', secretaria_id: 'sec-educacao', unidade_gestora: 'Fundo Municipal de Educação', gestor_id: 'u-saude', fiscal_titular_id: 'u-fiscal', fiscal_suplente_id: 'u-controle', dotacao_orcamentaria: '02.06.01.12.306.0007.2.044.3.3.90.30', fonte_recurso: '1.552 PNAE', numero_empenho: '2026NE000501', garantia: 'Não exigida', observacoes: 'Entregas semanais com checklist de qualidade.' },
      { id: 'c-tech', licitacao_id: 'lic-tech', fornecedor_id: 'f-tech', numero_contrato: 'CT 011/2025', ano: 2025, processo_administrativo: 'PA 011/2025', modalidade: 'Inexigibilidade', numero_licitacao: 'IN 002/2025', objeto: 'Licenciamento e suporte de plataforma em nuvem para gestão administrativa municipal.', categoria: 'tecnologia', tipo: 'servicos', valor_original: 420000, data_assinatura: iso(-345), data_inicio: iso(-335), data_fim: iso(-12), status: 'expired', secretaria_id: 'sec-adm', unidade_gestora: 'Secretaria Municipal de Administração', gestor_id: 'u-gestor', fiscal_titular_id: '', fiscal_suplente_id: '', dotacao_orcamentaria: '02.04.01.04.126.0003.2.020.3.3.90.40', fonte_recurso: '1.500 Recursos não vinculados', numero_empenho: '2025NE001144', garantia: 'Não exigida', observacoes: 'Contrato vencido com pendência documental e fornecedor irregular.' },
      { id: 'c-saude', licitacao_id: 'lic-saude', fornecedor_id: 'f-saude', numero_contrato: 'CT 075/2026', ano: 2026, processo_administrativo: 'PA 075/2026', modalidade: 'Dispensa Emergencial', numero_licitacao: 'DE 006/2026', objeto: 'Aquisição emergencial de equipamentos hospitalares para unidades de pronto atendimento.', categoria: 'saude', tipo: 'compras', valor_original: 615000, data_assinatura: iso(-15), data_inicio: iso(-14), data_fim: iso(76), status: 'active', secretaria_id: 'sec-saude', unidade_gestora: 'Fundo Municipal de Saúde', gestor_id: 'u-saude', fiscal_titular_id: 'u-fiscal', fiscal_suplente_id: 'u-juridico', dotacao_orcamentaria: '02.05.01.10.302.0006.2.036.4.4.90.52', fonte_recurso: '1.600 SUS Bloco Custeio', numero_empenho: '2026NE000622', garantia: 'Garantia técnica 12 meses', observacoes: 'Processo emergencial exige publicação e justificativa robusta.' },
      { id: 'c-transporte', licitacao_id: '', fornecedor_id: 'f-transporte', numero_contrato: 'CT 014/2025', ano: 2025, processo_administrativo: 'PA 014/2025', modalidade: 'Pregão Eletrônico', numero_licitacao: 'PE 003/2025', objeto: 'Prestação de serviço de transporte escolar rural em rotas municipais.', categoria: 'transporte', tipo: 'servicos', valor_original: 1780000, data_assinatura: iso(-310), data_inicio: iso(-300), data_fim: iso(7), status: 'near_expiration', secretaria_id: 'sec-educacao', unidade_gestora: 'Fundo Municipal de Educação', gestor_id: 'u-gestor', fiscal_titular_id: 'u-fiscal', fiscal_suplente_id: '', dotacao_orcamentaria: '02.06.01.12.361.0007.2.041.3.3.90.39', fonte_recurso: '1.553 PNATE', numero_empenho: '2025NE000970', garantia: 'Seguro dos veículos obrigatório', observacoes: 'Prorrogação precisa ser instruída antes do vencimento.' }
    ],
    contrato_itens: [
      { id: 'ci-pneu-175', contrato_id: 'c-pneus', descricao: 'Pneu 175/70 R14', unidade_medida: 'unidade', quantidade_contratada: 120, valor_unitario: 420, quantidade_executada: 92, consumo_medio_dia: 2.6, prazo_entrega_fornecedor_dias: 12, dias_seguranca_estoque: 5 },
      { id: 'ci-pneu-1000', contrato_id: 'c-pneus', descricao: 'Pneu 1000x20 borrachudo', unidade_medida: 'unidade', quantidade_contratada: 40, valor_unitario: 1950, quantidade_executada: 35, consumo_medio_dia: 0.75, prazo_entrega_fornecedor_dias: 18, dias_seguranca_estoque: 7 },
      { id: 'ci-praca-obra', contrato_id: 'c-praca', descricao: 'Medição global da obra - Praça do Pontilhão', unidade_medida: 'percentual', quantidade_contratada: 100, valor_unitario: 4180, quantidade_executada: 84, consumo_medio_dia: 0 },
      { id: 'ci-limpeza-postos', contrato_id: 'c-limpeza', descricao: 'Postos de serviço de limpeza predial', unidade_medida: 'posto/mês', quantidade_contratada: 96, valor_unitario: 9479.17, quantidade_executada: 72, consumo_medio_dia: 0 },
      { id: 'ci-merenda-cestas', contrato_id: 'c-merenda', descricao: 'Gêneros alimentícios perecíveis e não perecíveis', unidade_medida: 'lote', quantidade_contratada: 40, valor_unitario: 32000, quantidade_executada: 18, consumo_medio_dia: 0.45, prazo_entrega_fornecedor_dias: 7, dias_seguranca_estoque: 5 },
      { id: 'ci-tech-licenca', contrato_id: 'c-tech', descricao: 'Licenciamento e suporte mensal da plataforma', unidade_medida: 'mês', quantidade_contratada: 12, valor_unitario: 35000, quantidade_executada: 12 },
      { id: 'ci-saude-monitor', contrato_id: 'c-saude', descricao: 'Monitor multiparamétrico com instalação', unidade_medida: 'unidade', quantidade_contratada: 18, valor_unitario: 18500, quantidade_executada: 6, consumo_medio_dia: 0.32, prazo_entrega_fornecedor_dias: 21, dias_seguranca_estoque: 10 },
      { id: 'ci-saude-bomba', contrato_id: 'c-saude', descricao: 'Bomba de infusão volumétrica', unidade_medida: 'unidade', quantidade_contratada: 45, valor_unitario: 6266.67, quantidade_executada: 20, consumo_medio_dia: 0.6, prazo_entrega_fornecedor_dias: 21, dias_seguranca_estoque: 10 },
      { id: 'ci-transporte-rota', contrato_id: 'c-transporte', descricao: 'Rotas de transporte escolar rural', unidade_medida: 'rota/mês', quantidade_contratada: 120, valor_unitario: 14833.33, quantidade_executada: 112, consumo_medio_dia: 0 }
    ],
    ordens: [
      { id: 'of-pneus-001', contrato_id: 'c-pneus', secretaria_id: 'sec-transporte', solicitante_id: 'u-gestor', numero: 'OF 087-001/2026', data_solicitacao: iso(-24), data_prevista: iso(-14), status: 'entregue_total', observacao: 'Reposição de pneus para caminhonetes da fiscalização.' },
      { id: 'of-pneus-002', contrato_id: 'c-pneus', secretaria_id: 'sec-transporte', solicitante_id: 'u-gestor', numero: 'OF 087-002/2026', data_solicitacao: iso(-8), data_prevista: iso(-2), status: 'enviada_ao_fornecedor', observacao: 'Entrega de pneus para máquinas pesadas ainda pendente.' },
      { id: 'os-praca-004', contrato_id: 'c-praca', secretaria_id: 'sec-obras', solicitante_id: 'u-gestor', numero: 'OS 044-004/2026', data_solicitacao: iso(-35), data_prevista: iso(8), status: 'entregue_parcial', observacao: 'Boletim de medição acumulado da obra.' },
      { id: 'os-limpeza-005', contrato_id: 'c-limpeza', secretaria_id: 'sec-adm', solicitante_id: 'u-gestor', numero: 'OS 036-005/2026', data_solicitacao: iso(-21), data_prevista: iso(-5), status: 'entregue_parcial', observacao: 'Ateste mensal com pendência em duas unidades.' },
      { id: 'of-merenda-009', contrato_id: 'c-merenda', secretaria_id: 'sec-educacao', solicitante_id: 'u-saude', numero: 'OF 102-009/2026', data_solicitacao: iso(-5), data_prevista: iso(3), status: 'autorizada', observacao: 'Entrega semanal da merenda escolar.' },
      { id: 'of-saude-001', contrato_id: 'c-saude', secretaria_id: 'sec-saude', solicitante_id: 'u-saude', numero: 'OF 075-001/2026', data_solicitacao: iso(-9), data_prevista: iso(12), status: 'enviada_ao_fornecedor', observacao: 'Primeira entrega de equipamentos hospitalares.' }
    ],
    ordem_itens: [
      { id: id('oi', 1), ordem_id: 'of-pneus-001', contrato_item_id: 'ci-pneu-175', quantidade_solicitada: 50, quantidade_entregue: 50, valor_total: 21000 },
      { id: id('oi', 2), ordem_id: 'of-pneus-002', contrato_item_id: 'ci-pneu-1000', quantidade_solicitada: 8, quantidade_entregue: 0, valor_total: 15600 },
      { id: id('oi', 3), ordem_id: 'os-praca-004', contrato_item_id: 'ci-praca-obra', quantidade_solicitada: 84, quantidade_entregue: 84, valor_total: 351120 },
      { id: id('oi', 4), ordem_id: 'os-limpeza-005', contrato_item_id: 'ci-limpeza-postos', quantidade_solicitada: 12, quantidade_entregue: 10, valor_total: 113750.04 },
      { id: id('oi', 5), ordem_id: 'of-merenda-009', contrato_item_id: 'ci-merenda-cestas', quantidade_solicitada: 2, quantidade_entregue: 0, valor_total: 64000 },
      { id: id('oi', 6), ordem_id: 'of-saude-001', contrato_item_id: 'ci-saude-monitor', quantidade_solicitada: 8, quantidade_entregue: 6, valor_total: 148000 }
    ],
    execucoes: [
      { id: 'ex-pneus-001', contrato_id: 'c-pneus', ordem_id: 'of-pneus-001', tipo: 'entrega', data_execucao: iso(-15), responsavel_ateste: 'u-fiscal', status: 'aprovado', valor_executado: 21000, observacoes: 'Entrega conferida e aprovada conforme ordem.', percentual: 100 },
      { id: 'ex-praca-004', contrato_id: 'c-praca', ordem_id: 'os-praca-004', tipo: 'medicao', data_execucao: iso(-7), responsavel_ateste: 'u-fiscal', status: 'aprovado', valor_executado: 351120, observacoes: 'Boletim de Medição 04/2026 aprovado.', percentual: 84 },
      { id: 'ex-limpeza-005', contrato_id: 'c-limpeza', ordem_id: 'os-limpeza-005', tipo: 'servico', data_execucao: iso(-5), responsavel_ateste: 'u-fiscal', status: 'parcial', valor_executado: 94791.7, observacoes: 'Glosa prevista por ausência de reposição em duas unidades.', percentual: 83 },
      { id: 'ex-saude-001', contrato_id: 'c-saude', ordem_id: 'of-saude-001', tipo: 'entrega', data_execucao: iso(-2), responsavel_ateste: 'u-saude', status: 'recebido_provisoriamente', valor_executado: 111000, observacoes: 'Equipamentos recebidos provisoriamente, aguardando instalação.', percentual: 75 },
      { id: 'ex-transporte-011', contrato_id: 'c-transporte', ordem_id: '', tipo: 'servico', data_execucao: iso(-12), responsavel_ateste: 'u-fiscal', status: 'aprovado', valor_executado: 166133.3, observacoes: 'Rotas do mês executadas com duas ocorrências.', percentual: 93 }
    ],
    recebimentos: [
      { id: 'rec-pneus', ordem_id: 'of-pneus-001', contrato_id: 'c-pneus', tipo_recebimento: 'definitivo', data_recebimento: iso(-14), responsavel_id: 'u-fiscal', status: 'aprovado', observacao: 'Ateste definitivo realizado.', termo_arquivo_url: 'termo-pneus-definitivo.pdf' },
      { id: 'rec-limpeza', ordem_id: 'os-limpeza-005', contrato_id: 'c-limpeza', tipo_recebimento: 'definitivo', data_recebimento: iso(-4), responsavel_id: 'u-fiscal', status: 'pendente', observacao: 'Aguardando justificativa da contratada sobre duas unidades.', termo_arquivo_url: '' },
      { id: 'rec-saude', ordem_id: 'of-saude-001', contrato_id: 'c-saude', tipo_recebimento: 'provisorio', data_recebimento: iso(-2), responsavel_id: 'u-saude', status: 'parcial', observacao: 'Recebimento parcial por falta de instalação completa.', termo_arquivo_url: 'termo-saude-provisorio.pdf' }
    ],
    notas_fiscais: [
      { id: 'nf-pneus-001', contrato_id: 'c-pneus', execucao_id: 'ex-pneus-001', numero_nf: 'NF 92837567', data_emissao: iso(-13), valor_bruto: 21000, valor_glosa: 0, valor_liquido: 21000, status: 'paga', arquivo_url: 'nf-pneus-001.xml' },
      { id: 'nf-praca-004', contrato_id: 'c-praca', execucao_id: 'ex-praca-004', numero_nf: 'NF 2026-0008', data_emissao: iso(-6), valor_bruto: 351120, valor_glosa: 0, valor_liquido: 351120, status: 'liquidada', arquivo_url: 'nf-praca-004.pdf' },
      { id: 'nf-limpeza-005', contrato_id: 'c-limpeza', execucao_id: 'ex-limpeza-005', numero_nf: 'NF 005421', data_emissao: iso(-8), valor_bruto: 113750.04, valor_glosa: 18958.34, valor_liquido: 94791.7, status: 'em_analise', arquivo_url: 'nf-limpeza-005.xml' },
      { id: 'nf-saude-001', contrato_id: 'c-saude', execucao_id: 'ex-saude-001', numero_nf: 'NF 77109', data_emissao: iso(-1), valor_bruto: 111000, valor_glosa: 0, valor_liquido: 111000, status: 'recebida', arquivo_url: 'nf-saude-001.xml' }
    ],
    empenhos: [
      { id: 'emp-pneus', contrato_id: 'c-pneus', numero_empenho: '2026NE000431', data_empenho: iso(-34), valor_empenhado: 180000, valor_liquidado: 21000, valor_pago: 21000, fonte_recurso: '1.500 Recursos não vinculados', dotacao_orcamentaria: '02.12.01.26.782.0018.2.078.3.3.90.30' },
      { id: 'emp-praca', contrato_id: 'c-praca', numero_empenho: '2026NE000212', data_empenho: iso(-110), valor_empenhado: 418000, valor_liquidado: 351120, valor_pago: 250000, fonte_recurso: '1.700 Convênios da União', dotacao_orcamentaria: '02.08.01.15.451.0011.1.007.4.4.90.51' },
      { id: 'emp-limpeza', contrato_id: 'c-limpeza', numero_empenho: '2026NE000389', data_empenho: iso(-76), valor_empenhado: 455000, valor_liquidado: 312000, valor_pago: 217208.3, fonte_recurso: '1.500 Recursos não vinculados', dotacao_orcamentaria: '02.04.01.04.122.0003.2.019.3.3.90.39' },
      { id: 'emp-merenda', contrato_id: 'c-merenda', numero_empenho: '2026NE000501', data_empenho: iso(-52), valor_empenhado: 640000, valor_liquidado: 576000, valor_pago: 512000, fonte_recurso: '1.552 PNAE', dotacao_orcamentaria: '02.06.01.12.306.0007.2.044.3.3.90.30' },
      { id: 'emp-saude', contrato_id: 'c-saude', numero_empenho: '2026NE000622', data_empenho: iso(-12), valor_empenhado: 615000, valor_liquidado: 0, valor_pago: 0, fonte_recurso: '1.600 SUS Bloco Custeio', dotacao_orcamentaria: '02.05.01.10.302.0006.2.036.4.4.90.52' }
    ],
    liquidacoes: [
      { id: 'liq-pneus-001', empenho_id: 'emp-pneus', nota_fiscal_id: 'nf-pneus-001', data_liquidacao: iso(-11), valor_liquidado: 21000 },
      { id: 'liq-praca-004', empenho_id: 'emp-praca', nota_fiscal_id: 'nf-praca-004', data_liquidacao: iso(-3), valor_liquidado: 351120 },
      { id: 'liq-limpeza-005', empenho_id: 'emp-limpeza', nota_fiscal_id: 'nf-limpeza-005', data_liquidacao: iso(-2), valor_liquidado: 94791.7 }
    ],
    pagamentos: [
      { id: 'pag-pneus-001', liquidacao_id: 'liq-pneus-001', data_pagamento: iso(-9), valor_pago: 21000, ordem_cronologica: 12, comprovante_url: 'comprovante-pneus-001.pdf' },
      { id: 'pag-praca-001', liquidacao_id: 'liq-praca-004', data_pagamento: iso(-1), valor_pago: 250000, ordem_cronologica: 18, comprovante_url: 'comprovante-praca-parcial.pdf' }
    ],
    aditivos: [
      { id: 'ad-praca-001', contrato_id: 'c-praca', tipo: 'acrescimo', numero: '1º Aditivo', data_aditivo: iso(-44), valor_anterior: 380000, novo_valor: 418000, valor_acrescimo: 38000, valor_supressao: 0, prazo_anterior: iso(12), nova_data_fim: iso(43), justificativa: 'Acréscimo de quantitativo para acessibilidade e drenagem complementar.', arquivo_url: 'aditivo-praca-001.pdf' },
      { id: 'ad-limpeza-001', contrato_id: 'c-limpeza', tipo: 'prorrogacao', numero: 'Minuta 1º Termo Aditivo', data_aditivo: iso(-2), valor_anterior: 910000, novo_valor: 910000, valor_acrescimo: 0, valor_supressao: 0, prazo_anterior: iso(24), nova_data_fim: iso(389), justificativa: 'Prorrogação de vigência prevista no art. 107 da Lei 14.133/2021. Em análise jurídica.', arquivo_url: 'minuta-prorrogacao-limpeza.pdf' },
      { id: 'ad-transporte-002', contrato_id: 'c-transporte', tipo: 'reequilibrio', numero: '2º Aditivo', data_aditivo: iso(-38), valor_anterior: 1620000, novo_valor: 1780000, valor_acrescimo: 160000, valor_supressao: 0, prazo_anterior: iso(7), nova_data_fim: iso(7), justificativa: 'Reequilíbrio por aumento comprovado de combustível e quilometragem de rotas.', arquivo_url: 'aditivo-transporte-reequilibrio.pdf' }
    ],
    fiscalizacoes: [
      { id: 'fis-praca', contrato_id: 'c-praca', fiscal_id: 'u-fiscal', periodo: 'Junho/2026', checklist: 82, risco: 'medio', situacao_execucao: 'Regular com atenção ao prazo', pendencias_abertas: 2, parecer: 'Obra evolui, mas exige instrução de prorrogação e relatório fotográfico final.', fotos: 8 },
      { id: 'fis-limpeza', contrato_id: 'c-limpeza', fiscal_id: 'u-fiscal', periodo: 'Junho/2026', checklist: 64, risco: 'alto', situacao_execucao: 'Parcial', pendencias_abertas: 4, parecer: 'Equipe reduzida em duas unidades. Recomendado notificar contratada e glosar parcialmente.', fotos: 3 },
      { id: 'fis-merenda', contrato_id: 'c-merenda', fiscal_id: 'u-saude', periodo: 'Junho/2026', checklist: 91, risco: 'baixo', situacao_execucao: 'Regular', pendencias_abertas: 1, parecer: 'Entregas dentro do padrão. Uma escola registrou divergência de peso em lote.', fotos: 5 },
      { id: 'fis-tech', contrato_id: 'c-tech', fiscal_id: '', periodo: 'Maio/2026', checklist: 38, risco: 'alto', situacao_execucao: 'Vencido', pendencias_abertas: 5, parecer: 'Sem fiscal designado e com certidão vencida. Necessário encerramento formal ou nova contratação.', fotos: 0 }
    ],
    ocorrencias: [
      { id: 'oc-pneus-001', contrato_id: 'c-pneus', tipo: 'atraso', descricao: 'Ordem OF 087-002/2026 enviada ao fornecedor e ainda não entregue.', criado_por: 'u-gestor', data_ocorrencia: iso(-2) },
      { id: 'oc-limpeza-001', contrato_id: 'c-limpeza', tipo: 'notificacao', descricao: 'Notificação à contratada por ausência de equipe em duas unidades administrativas.', criado_por: 'u-fiscal', data_ocorrencia: iso(-4) },
      { id: 'oc-tech-001', contrato_id: 'c-tech', tipo: 'documentacao_pendente', descricao: 'Contrato vencido sem termo de encerramento e com certidão CNDT vencida.', criado_por: 'u-controle', data_ocorrencia: iso(-6) },
      { id: 'oc-transporte-001', contrato_id: 'c-transporte', tipo: 'penalidade', descricao: 'Registro de multa leve em análise por atraso em rota rural.', criado_por: 'u-fiscal', data_ocorrencia: iso(-12) }
    ],
    documentos: [
      { id: 'doc-pneus-contrato', contrato_id: 'c-pneus', nome: 'Contrato assinado - CT 087/2026', tipo: 'Contrato assinado', url: 'contrato-pneus.pdf', obrigatorio: true, status: 'ok' },
      { id: 'doc-pneus-empenho', contrato_id: 'c-pneus', nome: 'Empenho 2026NE000431', tipo: 'Empenho', url: 'empenho-pneus.pdf', obrigatorio: true, status: 'ok' },
      { id: 'doc-praca-aditivo', contrato_id: 'c-praca', nome: '1º Termo Aditivo - Praça do Pontilhão', tipo: 'Aditivo', url: 'aditivo-praca-001.pdf', obrigatorio: true, status: 'ok' },
      { id: 'doc-praca-bm', contrato_id: 'c-praca', nome: 'Boletim de Medição 04/2026', tipo: 'Relatório de fiscalização', url: 'boletim-medicao-praca.pdf', obrigatorio: true, status: 'ok' },
      { id: 'doc-limpeza-minuta', contrato_id: 'c-limpeza', nome: 'Minuta de prorrogação de vigência', tipo: 'Aditivo', url: 'minuta-prorrogacao-limpeza.pdf', obrigatorio: false, status: 'analise' },
      { id: 'doc-tech-parecer', contrato_id: 'c-tech', nome: 'Parecer de controle interno pendente', tipo: 'Parecer controle interno', url: '', obrigatorio: true, status: 'pendente' },
      { id: 'doc-saude-publicacao', contrato_id: 'c-saude', nome: 'Publicação do extrato da contratação emergencial', tipo: 'Publicação', url: '', obrigatorio: true, status: 'pendente' }
    ],
    inteligencia: {
      resumo: {
        proposito: 'Centralizar a gestão municipal de licitações e contratos com inteligência preditiva, análise automática de evidências e recomendações auditáveis.',
        contexto: 'Secretarias, gabinete, compras, jurídico, fiscalização e controle interno passam a enxergar prazos, documentos, riscos e gargalos em uma visão única.',
        diferencial: 'O MVP cruza vigência, fiscalização, documentos, fornecedores, execução financeira e ocorrências para antecipar problemas antes que contratos vençam ou falhas virem crise administrativa.'
      },
      capacidades: [
        { nome: 'Score preditivo de risco contratual', estagio: 'MVP', descricao: 'Calcula risco por contrato combinando vencimento, fiscal ausente, documentos pendentes, saldo, ocorrências e regularidade do fornecedor.', saida: 'Ranking de prioridade para gabinete, secretarias e controle interno.' },
        { nome: 'Detector de inconsistências', estagio: 'MVP', descricao: 'Cruza documentos obrigatórios, status contratual, execução, saldo e fiscalização para apontar sinais de falha administrativa.', saida: 'Lista de evidências e providências sugeridas.' },
        { nome: 'Mapa de gargalos por secretaria', estagio: 'MVP', descricao: 'Agrupa risco por secretaria para mostrar onde há mais vencimentos, documentos pendentes e contratos sem fiscal.', saida: 'Painel executivo por secretaria.' },
        { nome: 'Recomendador de providências', estagio: 'MVP', descricao: 'Gera próximo passo recomendado com base no problema detectado: prorrogar, encerrar, designar fiscal, anexar documento ou acionar jurídico.', saida: 'Recomendação registrada em auditoria.' },
        { nome: 'Classificação documental assistida', estagio: 'Próxima fase', descricao: 'Preparado para classificar contratos, aditivos, pareceres, publicações, notas fiscais e relatórios de fiscalização.', saida: 'Documentos organizados por tipo, obrigatoriedade e risco.' },
        { nome: 'Leitura inteligente de documentos reais', estagio: 'Próxima fase', descricao: 'Evolução prevista para extrair vigência, valores, partes, cláusulas críticas e divergências entre documentos.', saida: 'Inconsistências documentais com revisão humana.' }
      ],
      riscos: [
        { risco: 'Baixa qualidade dos dados legados', impacto: 'Alto', probabilidade: 'Alta', mitigacao: 'Saneamento inicial, dicionário de dados e validação por secretaria.', dono: 'Administração' },
        { risco: 'Documentos despadronizados', impacto: 'Alto', probabilidade: 'Alta', mitigacao: 'Classificação assistida, fila de revisão humana e modelo incremental.', dono: 'Jurídico/Compras' },
        { risco: 'Baixa acurácia inicial da IA documental', impacto: 'Alto', probabilidade: 'Média', mitigacao: 'Pilotos controlados, métricas de precisão e aprovação humana obrigatória.', dono: 'Núcleo de Inteligência' },
        { risco: 'Falsos alertas ou alertas pouco úteis', impacto: 'Médio', probabilidade: 'Média', mitigacao: 'Feedback dos usuários, pesos de criticidade e auditoria das recomendações.', dono: 'Controle Interno' },
        { risco: 'Resistência dos usuários', impacto: 'Médio', probabilidade: 'Alta', mitigacao: 'Treinamento curto, painéis por perfil e ganhos rápidos por secretaria.', dono: 'Gabinete' },
        { risco: 'LGPD e acesso indevido', impacto: 'Alto', probabilidade: 'Média', mitigacao: 'Perfis, logs, minimização de dados, segregação por secretaria e política de retenção.', dono: 'DPO/Controle Interno' }
      ],
      indicadores: [
        { nome: 'Contratos cadastrados e monitorados', atual: 7, meta: 50, unidade: 'contratos', fonte: 'Carteira contratual' },
        { nome: 'Documentos classificados corretamente', atual: 5, meta: 200, unidade: 'documentos', fonte: 'GED/Documentos' },
        { nome: 'Alertas úteis gerados', atual: 0, meta: 30, unidade: 'alertas', fonte: 'Motor de alertas' },
        { nome: 'Itens com pedido preventivo acionado', atual: 0, meta: 10, unidade: 'itens', fonte: 'Estoque minimo/lead time' },
        { nome: 'Inconsistências detectadas', atual: 0, meta: 20, unidade: 'ocorrências', fonte: 'Fiscalização/Controle' },
        { nome: 'Contratos vencidos sem providência', atual: 1, meta: 0, unidade: 'contratos', fonte: 'Vigência' },
        { nome: 'Secretarias aderentes', atual: 5, meta: 6, unidade: 'secretarias', fonte: 'Uso do sistema' },
        { nome: 'Redução de retrabalho', atual: 0, meta: 30, unidade: '% estimado', fonte: 'Pesquisa interna' }
      ],
      decisoes: [
        { id: 'ia-rec-001', data_hora: dt(-2), usuario_id: 'u-controle', tipo: 'Recomendação preditiva', titulo: 'Priorizar contrato vencido sem fiscal', descricao: 'O núcleo inteligente identificou contrato vencido, fornecedor irregular, documento obrigatório pendente e ausência de fiscal titular.', status: 'Aberta' },
        { id: 'ia-rec-002', data_hora: dt(-1), usuario_id: 'u-juridico', tipo: 'Recomendação preventiva', titulo: 'Antecipar análise de prorrogação', descricao: 'Contratos com vencimento inferior a 30 dias devem gerar fluxo de instrução, parecer e decisão antes do término da vigência.', status: 'Em análise' }
      ]
    },
    auditoria: [
      { id: 'aud-001', usuario_id: 'u-admin', data_hora: dt(-8), acao: 'Dados simulados carregados', modulo: 'Sistema', registro_id: 'seed', descricao: 'Base premium de demonstração criada no LocalStorage.' },
      { id: 'aud-002', usuario_id: 'u-controle', data_hora: dt(-5), acao: 'Alerta crítico revisado', modulo: 'Alertas', registro_id: 'c-tech', descricao: 'Contrato CT 011/2025 marcado como vencido sem fiscal e com documento pendente.' },
      { id: 'aud-003', usuario_id: 'u-fiscal', data_hora: dt(-3), acao: 'Ocorrência registrada', modulo: 'Fiscalização', registro_id: 'c-limpeza', descricao: 'Notificação de equipe reduzida e glosa parcial em análise.' },
      { id: 'aud-004', usuario_id: 'u-juridico', data_hora: dt(-1), acao: 'Minuta analisada', modulo: 'Aditivos', registro_id: 'ad-limpeza-001', descricao: 'Prorrogação pode seguir como termo aditivo, com destaque nos alertas de vencimento.' }
    ]
  };
})();
