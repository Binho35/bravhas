# Nexus — BravHAS Homologation & Production Readiness

Data: 2026-09-05

## Escopo

Auditoria executiva e técnica da `main` do BravHAS antes de qualquer novo ciclo de desenvolvimento.

## Checkpoint auditado

- Repositório: `Binho35/bravhas`
- Branch padrão: `main`
- HEAD auditado: `8684944553b42d87ecbef656cb67d8a97c821b69`
- Último merge relevante: PR #36 — `feat: conectar Indicadores e Documentos às fontes reais`
- PRs abertos no início da auditoria: 0
- Workflow principal: `.github/workflows/quality.yml`
- Quality no HEAD auditado: SUCCESS
- `main` protegida: NÃO (`protected=false`)

## Evidências de repository readiness

O workflow Quality atual executa, em modo fail-closed:

- `npm ci` determinístico;
- dependency audit de produção;
- Prisma validate;
- Prisma generate;
- migration safety;
- security regression;
- repository readiness regression;
- `prisma migrate deploy`;
- seed protegido por ambiente;
- TypeScript;
- lint;
- build;
- fresh PostgreSQL;
- authenticated browser E2E;
- cross-tenant/RBAC negativo;
- mobile product smoke.

O run de `main` para o HEAD `8684944553b42d87ecbef656cb67d8a97c821b69` concluiu com sucesso.

## Estado dos módulos — evidência disponível

### Dashboard

Estado: FUNCIONAL / HOMOLOGAÇÃO HUMANA PENDENTE.

Evidência: rota principal existe e já é coberta por smoke autenticado/mobile.

### Pessoas / RH / DP

Estado: FUNCIONAL PARCIAL / HOMOLOGAÇÃO PENDENTE.

Evidência: shell de Pessoas e superfícies RH/DP existem e possuem smoke mobile. O escopo estratégico BravHAS × BravHOS permanece deliberadamente não resolvido.

### Documentos

Estado: FUNCIONAL EM HOMOLOGAÇÃO / BLOQUEADO PARA PRODUÇÃO.

Evidência: central usa `/api/hr/documents`, dados persistentes, rota protegida para abertura de arquivo e escopo da empresa autenticada. O próprio produto trata arquivo disponível/metadata de forma distinta.

Bloqueio de produção: não há evidência auditada nesta execução de object storage privado persistente configurado em produção. Filesystem/local storage de homologação não deve ser declarado solução produtiva.

### Financeiro

Estado: FUNCIONAL / HOMOLOGAÇÃO PENDENTE.

Evidência: Quality inclui E2E específico para Financeiro e Fluxo de Caixa; trabalhos recentes incluem tipagem Prisma de status financeiros e saldo inicial persistente.

### Fluxo de Caixa

Estado: FUNCIONAL / HOMOLOGAÇÃO PENDENTE.

Evidência: E2E dedicado existe e o mobile smoke acessa `/financeiro/fluxo-caixa` com saldo inicial visível.

### Obrigações

Estado: FUNCIONAL / HOMOLOGAÇÃO PENDENTE.

Evidência: rota e módulo estão ativos e são cobertos por smoke mobile.

### Agenda

Estado: FUNCIONAL / HOMOLOGAÇÃO DESKTOP DEDICADA PENDENTE.

Evidência: `/agenda` consulta `/api/obrigacoes`, deriva hoje/semana/30 dias/atrasadas e mantém histórico de concluídas a partir de `completedAt`.

### Indicadores

Estado: FUNCIONAL / HOMOLOGAÇÃO DESKTOP DEDICADA PENDENTE.

Evidência: `/indicadores` consulta `/api/indicadores` e apresenta financeiro, pessoas e obrigações usando dados persistentes. A tela declara explicitamente ausência de métricas simuladas.

## Segurança e multi-tenancy

Estado: FORTE NO REPOSITÓRIO / PRODUÇÃO AINDA NÃO HOMOLOGADA.

Evidências:

- auth server-side;
- cookie HttpOnly;
- SameSite;
- Secure condicionado a produção;
- session API server-side;
- security regression no CI;
- E2E cross-tenant com recursos válidos de Empresa A e Empresa B;
- E2E RBAC negativo;
- bloqueio a SQL unsafe;
- seed E2E recusado fora de TEST/HOMOLOGATION.

## Migrations e banco

Estado do repositório: REPOSITORY READY.

Evidência: `prisma migrate deploy`, fresh database, seed e migration status fazem parte do Quality.

Produção: NÃO AUDITADA COMO PRONTA nesta execução. É necessária evidência do PostgreSQL real, política de backup, restore e operação.

## Branch protection

Risco: ALTO DE GOVERNANÇA.

A `main` está com `protected=false`. O próprio `docs/REPOSITORY-READINESS.md` já determina que isso permaneça aberto enquanto não houver proteção/ruleset equivalente.

Ação recomendada fora deste PR: exigir PR + Quality, bloquear force push e exclusão da `main`, preservando fluxo viável para proprietário único.

## E2E — lacuna identificada

Cobertura atual observada:

- auth;
- security/cross-tenant/RBAC;
- financeiro/fluxo de caixa;
- mobile smoke.

Lacuna P1:

Criar smoke desktop dedicado para consolidar navegação e carregamento de:

- Dashboard;
- Documentos;
- Indicadores;
- Agenda;
- Pessoas;
- Financeiro;
- Fluxo de Caixa;
- Obrigações;
- logout.

A escrita direta desse teste durante esta execução foi bloqueada pela camada de segurança do conector ao detectar material de credencial sintética existente no fixture E2E. Não houve tentativa de contorno. A cobertura deve ser implementada reutilizando um helper/fixture de autenticação sem duplicar segredo no novo arquivo.

## Produção — bloqueios

### P0

1. Storage privado persistente de produção para documentos: SEM EVIDÊNCIA DE PROVIDER REAL HOMOLOGADO.
2. Backup/restore: SEM EVIDÊNCIA DE RESTORE PASSED ou DR EXERCISED.
3. Infraestrutura produtiva real: NÃO AUDITADA nesta execução.

### P1

1. Branch protection/ruleset da `main` está ausente.
2. Homologação humana ponta a ponta ainda é necessária.
3. Smoke desktop consolidado dos módulos de gestão ainda deve ser adicionado.
4. Observabilidade/alertas/health/readiness precisam de evidência operacional externa antes de declarar Production Ready.
5. Deploy real e rollback precisam de evidência externa.

### P2

- revisão de UX/responsividade por matriz de telas além do mobile smoke atual;
- teste de carga/capacidade;
- documentação operacional de incidentes e suporte.

### P3

- expansão comercial avançada;
- billing/pricing sofisticado;
- novos módulos grandes de RH/DP antes da decisão BravHAS × BravHOS.

## Sobreposição BravHAS × BravHOS

Funcionalidades atualmente presentes no BravHAS que potencialmente pertencem também ao domínio BravHOS:

- Pessoas;
- colaboradores;
- pré-admissão/admissões;
- documentos de colaboradores;
- ponto;
- férias;
- afastamentos;
- obrigações de RH/DP;
- indicadores de pessoas e DP.

Nenhum código deve ser movido ou removido até decisão da governança central.

## Avaliação de evolução

Percentuais não são declarados neste documento porque não foi executada uma matriz quantitativa completa de todos os requisitos de produto, produção e comercialização. Declarar números sem denominador auditado violaria a governança do portfólio.

- Desenvolvimento: NÃO AUDITADO COM PRECISÃO
- Produto: NÃO AUDITADO COM PRECISÃO
- Produção: NÃO AUDITADO COM PRECISÃO
- Comercial: NÃO AUDITADO COM PRECISÃO

## Próximo marco recomendado

**BravHAS — Homologation Closure**

Objetivo único: fechar evidência de homologação ponta a ponta sem expansão de escopo, começando por smoke desktop consolidado, validação humana dos fluxos críticos e preparação vendor-neutral de storage/backup/observabilidade, sem contratar infraestrutura ou alterar produção sem autorização.
