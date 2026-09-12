# BravHAS

BravHAS é a plataforma administrativa e financeira da BravSystems, com módulos de operação, Pessoas/RH/DP, Financeiro, Fluxo de Caixa, Obrigações, Agenda, Documentos e Indicadores.

## Estado de readiness

O repositório possui gates automatizados para instalação, dependências, Prisma, migrations, fresh database, segurança, contratos unitários, integridade multi-tenant, TypeScript, lint, build, E2E autenticado, cross-tenant/RBAC, smoke desktop consolidado e smoke mobile.

Também existem contratos operacionais para:

- production preflight;
- storage documental vendor-neutral;
- backup e restore protegidos;
- health/readiness;
- smoke pós-deploy;
- incident response;
- privacidade/retenção;
- inventário de configuração/secrets.

**Internal/Repository Ready não significa Production Ready.** Produção exige evidências reais de infraestrutura, storage privado persistente, backup/restore exercitado, observabilidade externa, deploy/rollback exercitado, secrets/rotação, branch protection e homologação humana.

## Documentação principal

- `docs/REPOSITORY-READINESS.md`
- `docs/audit/NEXUS-HOMOLOGATION-PRODUCTION-READINESS-2026-09-05.md`
- `docs/audit/NEXUS-READINESS-MATRIX-2026-09-05.md`
- `docs/operations/STORAGE.md`
- `docs/operations/BACKUP-RESTORE.md`
- `docs/operations/DEPLOY-ROLLBACK.md`
- `docs/operations/OBSERVABILITY.md`
- `docs/operations/INCIDENT-RESPONSE.md`
- `docs/operations/PRIVACY-RETENTION.md`
- `docs/operations/SECRETS-CONFIG.md`

## Desenvolvimento local

Fluxo base:

1. `npm ci`
2. `npx prisma generate`
3. `npx prisma migrate deploy`
4. `npm run seed`
5. `npm run dev`

Use variáveis próprias do ambiente. `BRAVHAS_DEV_AUTH_BYPASS` deve permanecer `false` fora de desenvolvimento controlado.

## Contratos de qualidade

Comandos padronizados:

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run test:contracts`
- `npm run test:integrity`
- `npm run build`
- `npm run test:e2e:auth`
- `npm run test:e2e:security`
- `npm run test:e2e:desktop`
- `npm run test:e2e:mobile`

O workflow `.github/workflows/quality.yml` é a fonte de verdade para os gates automatizados do Pull Request e opera sem side effects de produção.

## Banco de dados

O projeto usa Prisma/PostgreSQL e valores monetários persistidos com `Decimal(15,2)`.

Preserve migrations históricas e use `prisma migrate deploy` em ambientes controlados.

Não usar em banco relevante:

- `prisma migrate reset`;
- `prisma db push --accept-data-loss`.

Operações críticas de pagamento, recebimento, estorno e cancelamento financeiro são executadas em transação Prisma serializable para manter saldo/status e histórico atômicos.

## Health e readiness

- `/api/health`: liveness do processo HTTP;
- `/api/readiness`: aptidão para receber tráfego, incluindo banco e storage essencial.

Readiness é fail-closed em produção quando o storage persistente não está homologado.

## Documentos

O filesystem local é exclusivamente desenvolvimento/homologação e é bloqueado em produção.

O contrato `DocumentStorage` oferece save/read/delete/health, escopo tenant/recurso, erros tipados, checksum e validação de arquivo. O provider produtivo ainda depende de seleção e infraestrutura externa.

## Operação

- `npm run prod:preflight`: valida contrato de configuração produtiva sem imprimir secrets;
- `npm run backup:dry-run`: valida contrato de backup sem criar dump;
- `npm run backup:execute`: cria dump/manifesto/checksum quando executado em ambiente autorizado;
- `npm run restore:guard:self-test`: prova as guardas de restore;
- `npm run restore:execute -- --artifact=/caminho/arquivo.dump`: restore somente em ambiente não produtivo explicitamente autorizado;
- `npm run deploy:smoke`: smoke futuro do ambiente publicado.

Nenhum desses comandos implica autorização para produção.

## Segurança

Princípios obrigatórios:

- autenticação e autorização server-side;
- `companyId` e ator derivados da sessão autenticada;
- IDs do browser nunca substituem autorização;
- cross-tenant tratado como P0;
- RBAC preservado;
- logs e mensagens sanitizados;
- nenhum secret versionado;
- storage e readiness fail-closed;
- nenhuma fixture aceita fora de TEST/HOMOLOGATION.

## Produção

Antes de declarar Production Ready, registrar evidência real de:

- provider/storage;
- backup e restore;
- infraestrutura PostgreSQL;
- observabilidade/alertas;
- preflight/deploy;
- rollback;
- secrets e rotação;
- branch protection;
- homologação humana.

Percentuais de readiness só devem ser publicados quando critérios/pesos forem formalmente aprovados e as evidências externas existirem.
