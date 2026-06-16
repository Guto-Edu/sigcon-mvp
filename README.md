# SIGCON Obras

Protótipo funcional de uma plataforma municipal para gestão integrada, preventiva e inteligente de licitações, contratos, execução, fiscalização, documentos, alertas e transparência.

O SIGCON foi desenhado para atacar um problema real de Prefeitura: informações espalhadas entre secretarias, gabinete, compras, jurídico, fiscalização e controle interno. O resultado desse modelo fragmentado é retrabalho, perda de prazo, contratos vencidos sem providência, fiscalização frágil, documentos soltos e pouca visão estratégica para tomada de decisão.

Este MVP mostra uma solução mais forte que um cadastro de contratos: um sistema com inteligência preditiva aplicada ao cenário municipal.

## A solução

O SIGCON centraliza a carteira de contratos e cruza dados de vigência, documentos, fornecedores, fiscais, execução financeira, aditivos, notas fiscais, empenhos, ocorrências e auditoria.

A partir desse cruzamento, o sistema gera:

- Score preditivo de risco por contrato.
- Ranking de prioridades para gabinete e secretarias.
- Alertas de vencimento, documento pendente, fiscal ausente, saldo baixo e fornecedor irregular.
- Alerta de ressuprimento por item, cruzando saldo, consumo medio, prazo de entrega e estoque minimo.
- Detecção de inconsistências prováveis entre contrato, execução, fiscalização e documentação.
- Mapa de gargalos por secretaria.
- Recomendações automáticas de providência.
- Registro auditável das recomendações geradas.
- Exportação da análise preditiva para apoio gerencial.

## Diferencial do MVP

Sistemas comuns de licitações e contratos costumam funcionar como cadastro, protocolo e relatório. O SIGCON vai além: ele tenta antecipar o problema.

O foco do MVP é demonstrar inteligência de sistema, com regras preditivas e estrutura preparada para IA documental:

- Antes do contrato vencer, o sistema sinaliza risco.
- Antes da fiscalização falhar, o sistema mostra ausência de fiscal, checklist baixo e pendências.
- Antes da execução estourar saldo, o sistema cruza valor atualizado, itens executados e pagamentos.
- Antes de um item acabar, o sistema estima cobertura restante e indica quando abrir novo pedido ou licitacao.
- Antes do gabinete ser surpreendido, o sistema apresenta gargalos por secretaria.
- Antes de uma decisão administrativa se perder, o sistema registra recomendação e auditoria.

## Funcionalidades principais

- Dashboard executivo com indicadores de vigência, saldo, execução, pagamentos e alertas.
- Gestão de licitações concluídas e conversão em contratos.
- Cadastro e acompanhamento de contratos administrativos.
- Execução contratual com ordens, medições, notas fiscais, empenhos, liquidações e pagamentos.
- Fiscalização com checklist, parecer, risco, ocorrências e pendências.
- Aditivos, prorrogações, reajustes, reequilíbrios, supressões, acréscimos e apostilamentos.
- Gestão documental por contrato, obrigatoriedade e status.
- Central de alertas inteligentes.
- Monitor de estoque minimo e pedido preventivo por item contratado.
- Inteligência preditiva municipal com score, evidências, gargalos e recomendação de próxima ação.
- Relatórios gerenciais e exportação CSV.
- Histórico de auditoria por usuário, módulo, registro e ação.
- Portal de transparência simulado com dados públicos resumidos.
- Configurações, perfis simulados e reset da base local.

## Núcleo de inteligência

O módulo **Inteligência** implementa a camada que a Prefeitura precisa para sair do controle reativo e ir para gestão preventiva.

Ele calcula risco usando sinais como:

- Dias até o fim da vigência.
- Contrato já vencido.
- Fiscal titular ausente.
- Documentos obrigatórios pendentes.
- Risco informado pela fiscalização.
- Checklist de fiscalização baixo.
- Saldo contratual baixo ou negativo.
- Item abaixo do ponto de pedido, considerando consumo medio e prazo de entrega do fornecedor.
- Ocorrências registradas.
- Fornecedor irregular ou em atenção.

Cada contrato recebe um score de 0 a 100, classificado como risco baixo, médio ou alto. A tela mostra evidências e uma ação recomendada, como instruir prorrogação, regularizar documento, designar fiscal, revisar saldo, acionar jurídico ou encerrar contrato.

## Indicadores de sucesso

O protótipo mede ou simula indicadores como:

- Contratos cadastrados e monitorados.
- Documentos classificados corretamente.
- Alertas úteis gerados.
- Inconsistências detectadas.
- Contratos vencidos sem providência.
- Aderência das secretarias.
- Redução de retrabalho.
- Recomendações registradas em auditoria.

## Riscos de implantação

O projeto considera riscos reais de uma Prefeitura:

- Baixa qualidade de dados legados.
- Documentos despadronizados.
- Resistência dos usuários.
- Baixa acurácia inicial da IA documental.
- Falsos alertas.
- Riscos de LGPD e acesso indevido.

Cada risco tem impacto, probabilidade, mitigação e responsável sugerido dentro do protótipo.

## LGPD, transparência e auditoria

O SIGCON foi desenhado para demonstrar:

- Controle de acesso por perfil.
- Registro de ações em trilha de auditoria.
- Separação entre dados internos e consulta pública.
- Exportação rastreável.
- Minimização de dados pessoais no portal público.
- Registro das recomendações e decisões humanas.
- Base preparada para backups, retenção e segregação por secretaria em uma versão real.

## Como abrir

Abra `index.html` diretamente no navegador.

Não há build, backend, npm ou instalação obrigatória.

Para testar com servidor estático:

```powershell
python -m http.server 8080
```

Acesse:

```txt
http://localhost:8080
```

## Tecnologias

- HTML.
- CSS.
- JavaScript puro.
- Tailwind CSS via CDN.
- Chart.js via CDN.
- Lucide via CDN.
- LocalStorage para persistência local simulada.

## Estrutura

```txt
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── charts.js
│   ├── data.js
│   ├── storage.js
│   └── utils.js
├── assets/
└── README.md
```

## Dados locais

Os dados ficam no LocalStorage:

```txt
sigcon_obras_data_v2
sigcon_obras_user_v2
```

O botão **Resetar dados** restaura a base simulada.

## Base simulada

A seed inclui contratos de obras, saúde, educação, limpeza, transporte, tecnologia e compras, com fornecedores fictícios, CNPJs fictícios, secretarias, fiscais, aditivos, medições, notas fiscais, empenhos, pagamentos, ocorrências, documentos, auditoria e inteligência preditiva.

## Regras simuladas

- Valor atualizado = valor original + acréscimos - supressões.
- Execução financeira baseada em itens executados.
- Saldo contratual = valor atualizado - valor executado.
- Dias restantes calculados pela data de fim.
- Risco automático por vencimento, fiscal ausente, documento pendente e fiscalização.
- Alertas automáticos para vencimento, prorrogação, certidão, saldo baixo, fiscal ausente, medição atrasada, nota fiscal pendente e documento obrigatório.
- Ressuprimento por item = saldo atual / consumo medio diario para estimar dias ate esgotar.
- Estoque minimo = consumo medio diario x (prazo de entrega do fornecedor + dias de seguranca).
- Alerta de pedido = dias ate esgotar - prazo de entrega - margem de seguranca; se for menor ou igual a zero, o pedido deve ser aberto agora.
- Score preditivo por contrato com base em vigência, documentação, fiscalização, fornecedor, saldo e ocorrências.

## Próximas evoluções

- Upload real de documentos.
- OCR e classificação assistida por IA.
- Extração de cláusulas, vigência, valores e partes contratadas.
- Motor de inconsistências entre edital, contrato, aditivo, nota fiscal e execução.
- Workflow de aprovação por perfil.
- Integração com contabilidade, protocolo, compras e portal da transparência.
- Banco de dados, autenticação real, backups e segregação multi-secretaria.
- Métricas de acurácia, falsos positivos, tempo economizado e adoção por secretaria.

## Observação

Este é um protótipo demonstrável. Ele não substitui parecer jurídico, sistema contábil oficial, processo administrativo formal ou análise de conformidade por autoridade competente.
