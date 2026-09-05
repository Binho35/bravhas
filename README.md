# BravHAS

BravHAS é a plataforma administrativa e financeira da BravSystems, com módulos de operação, Pessoas/RH/DP existente, Financeiro, Obrigações, Agenda, Documentos e Indicadores.

## Estado de readiness

O repositório possui gates automatizados para instalação, dependências, Prisma, migrations, fresh database, segurança, TypeScript, lint, build, E2E autenticado, cross-tenant/RBAC, smoke desktop consolidado e smoke mobile.

**Repository Ready não significa Production Ready.** Produção exige evidências reais de infraestrutura, storage privado persistente, backup/restore, observabilidade, deploy/rollback, secrets e homologação humana.

Documentação principal:

- `docs/REPOSITORY-READINESS.md`
- `docs/audit/NEXUS-HOMOLOGATION-PRODUCTION-READINESS-2026-09-05.md`
- `docs/audit/NEXUS-READINESS-MATRIX-2026-09-05.md`
- `docs/operations/BACKUP-RESTORE.md`
- `docs/operations/DEPLOY-ROLLBACK.md`
- `docs/operations/OBSERVABILITY.md`

## Desenvolvimento local

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Use variáveis de ambiente próprias do ambiente. O bypass de autenticação deve permanecer desabilitado.

## Quality

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e:auth
npm run test:e2e:security
npm run test:e2e:desktop
npm run test:e2e:mobile
```

O workflow `.github/workflows/quality.yml` é a fonte de verdade para os gates automatizados do Pull Request.

## Banco de dados

O projeto usa Prisma/PostgreSQL. Preserve migrations históricas e use `prisma migrate deploy` nos ambientes controlados.

Não usar em banco relevante:

- `prisma migrate reset`;
- `prisma db push --accept-data-loss`.

## Health e readiness

- `/api/health`: liveness e conectividade básica com o banco;
- `/api/readiness`: aptidão do ambiente para receber tráfego. O endpoint permanece fail-closed em produção enquanto o storage documental produtivo não estiver homologado.

## Documentos

O filesystem local é exclusivamente uma solução de desenvolvimento/homologação e é bloqueado em produção. O Ciclo 2 introduziu um contrato `DocumentStorage` vendor-neutral para futuro adapter privado persistente, sem contratação ou acoplamento a fornecedor.

## Segurança

Princípios obrigatórios:

- autenticação e autorização no servidor;
- `companyId` e ator derivados da sessão autenticada;
- IDs do browser nunca substituem autorização;
- cross-tenant tratado como P0;
- RBAC preservado;
- mensagens e logs sanitizados;
- nenhum secret no repositório.

## Produção

Antes de declarar produção pronta, seguir os runbooks de backup/restore, deploy/rollback e observabilidade e registrar evidências reais. Percentuais de readiness só devem ser publicados quando os critérios e pesos forem aprovados pela governança e as dependências externas auditadas.
