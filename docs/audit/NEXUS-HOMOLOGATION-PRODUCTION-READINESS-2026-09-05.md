# Nexus — BravHAS Homologation & Production Readiness

Data: 2026-09-05

## Escopo

Auditoria executiva e técnica da `main` do BravHAS e evolução do PR #37 para fechamento de homologação sem expansão de grandes módulos.

## Checkpoint auditado

- Repositório: `Binho35/bravhas`
- Branch padrão: `main`
- HEAD auditado da `main`: `8684944553b42d87ecbef656cb67d8a97c821b69`
- HEAD inicial do Ciclo 2: `13311a20189d220bcb8a347bd46cb789ca42f1d0`
- Último merge relevante: PR #36 — `feat: conectar Indicadores e Documentos às fontes reais`
- Workflow principal: `.github/workflows/quality.yml`
- Quality da `main` no HEAD auditado: SUCCESS
- `main` protegida: NÃO (`protected=false`)

## Evolução técnica do Ciclo 2

O PR #37 deixou de ser apenas documental e passou a conter hardening técnico verificável:

- helper compartilhado de autenticação E2E;
- smoke E2E desktop consolidado para Dashboard, Pessoas, Admissões, Documentos, Financeiro, Fluxo de Caixa, Obrigações, Agenda, Indicadores e logout;
- integração do smoke desktop ao workflow `Quality`;
- fixtures adicionais de readiness restritas a TEST/HOMOLOGATION;
- regressões cross-tenant com recursos Beta válidos para Pessoas, Documentos, Obrigações e Indicadores, preservando a cobertura financeira existente;
- contrato vendor-neutral `DocumentStorage` para provider futuro;
- `/api/readiness` fail-closed em produção enquanto não houver storage produtivo;
- runbook de backup/restore;
- runbook de deploy/rollback;
- documentação mínima de observabilidade;
- matriz objetiva de readiness sem percentual inventado.

## Repository readiness

O Quality permanece fail-closed e cobre:

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
- desktop consolidated product smoke;
- mobile product smoke.

Nenhum gate foi removido ou transformado em warning.

## Estado dos módulos

### Dashboard

Código funcional e incluído no smoke desktop/mobile. Homologação humana integral ainda pendente.

### Pessoas / RH / DP

Funcional e coberto por testes de tenant/escopo. A fronteira estratégica BravHAS × BravHOS continua deliberadamente não alterada.

### Admissões

Fluxo existente preservado. Ativação exige cadastro mínimo e documentos conferidos; smoke desktop cobre a superfície de admissão.

### Documentos

Dados persistentes, tenant scope, rota protegida e upload local de homologação permanecem funcionais. Cross-tenant agora inclui tentativa de Alpha acessar documento Beta válido. Produção continua bloqueada até provider privado persistente real.

### Financeiro / Fluxo de Caixa

Cobertura específica anterior preservada, incluindo cross-tenant financeiro e fluxo de caixa. Smoke desktop e mobile complementam a navegação.

### Obrigações / Agenda

Obrigações possuem regressões de ator/tenant e acesso estrangeiro. Agenda continua derivada de Obrigações persistentes e passa a integrar o smoke desktop consolidado.

### Indicadores

Fonte persistente preservada. O Ciclo 2 adiciona regressão explícita comparando indicadores de Tenant Alpha e Tenant Beta após troca de sessão.

## Storage

Estado atual: local filesystem permitido apenas fora de produção.

O Ciclo 2 adicionou contrato vendor-neutral `DocumentStorage` com:

- save;
- read;
- delete;
- health;
- scope obrigatório de company/employee;
- política centralizável de MIME e tamanho;
- metadata básica do objeto.

Nenhum provider foi contratado ou conectado. O adapter local existente ainda deve ser migrado para o contrato antes de ligar um provider produtivo.

## Health e readiness

`/api/health` continua validando aplicação + banco com erro sanitizado fora de desenvolvimento.

`/api/readiness` foi adicionado para distinguir aplicação viva de aplicação apta a receber tráfego. Em produção, o readiness permanece 503 enquanto o provider produtivo de documentos não estiver configurado/homologado.

## Backup / Restore

Runbook criado em `docs/operations/BACKUP-RESTORE.md`.

Estado: `DOCUMENTADO`.

Não existe alegação de backup executado, restore passado ou DR exercitado sem evidência externa real.

## Deploy / Rollback

Runbook criado em `docs/operations/DEPLOY-ROLLBACK.md` com build, env, migrations, health/readiness, smoke pós-deploy, rollback de aplicação e tratamento de migrations irreversíveis.

Estado: `DOCUMENTADO`.

## Observabilidade

Documento `docs/operations/OBSERVABILITY.md` registra health, readiness, sanitização de logs, estado de request/correlation ID e evidências exigidas para produção.

Estado: `PARCIAL` até monitoramento/alertas externos e testes de falha serem comprovados.

## Branch protection

Risco de governança permanece: `main` auditada com `protected=false`.

Nenhuma configuração foi alterada neste ciclo. A recomendação permanece PR obrigatório + Quality obrigatório + bloqueio de force push/delete + revisão mínima/proteção de administradores quando viável.

## Readiness Matrix

A matriz detalhada está em `docs/audit/NEXUS-READINESS-MATRIX-2026-09-05.md`.

Percentuais continuam `NÃO AUDITADO COM PRECISÃO` até aprovação de pesos pela governança e fechamento das evidências externas. A proposta inicial é peso unitário igual por critério dentro de cada dimensão, com regra adicional de que P0 aberto não pode ser compensado por média.

## Produção — bloqueios ainda abertos

### P0

1. Storage privado persistente de produção sem provider real homologado.
2. Backup/restore sem evidência real de restore aprovado/DR exercitado.
3. Infraestrutura produtiva não auditada como pronta.

### P1

1. `main` sem branch protection/ruleset equivalente.
2. Homologação humana ponta a ponta pendente.
3. Observabilidade externa/alertas pendentes.
4. Deploy real e rollback exercitado pendentes.
5. Secrets/rotação dependem do ambiente produtivo.

### P2

- request/correlation ID global;
- matriz ampliada de UX/acessibilidade;
- teste de carga/capacidade;
- runbook de incidentes/suporte.

### P3

- expansão comercial avançada;
- billing/pricing sofisticado;
- novos módulos grandes de RH/DP antes da decisão BravHAS × BravHOS.

## Sobreposição BravHAS × BravHOS

Permanece potencial sobreposição em Pessoas, colaboradores, admissão, documentos funcionais, ponto, férias, afastamentos e indicadores/obrigações de RH/DP. Nenhum código foi movido, apagado, duplicado ou separado neste ciclo.

## Avaliação de evolução

- Desenvolvimento: NÃO AUDITADO COM PRECISÃO
- Produto: NÃO AUDITADO COM PRECISÃO
- Produção: NÃO AUDITADO COM PRECISÃO
- Comercial: NÃO AUDITADO COM PRECISÃO

## Próximo marco

O próximo marco só deve ser definido pela governança após auditoria do relatório final do Ciclo 2. Nexus não deve iniciar outro ciclo automaticamente.
