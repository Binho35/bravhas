# BravHAS — Deploy & Rollback Runbook

## Estado atual

**READY TO EXERCISE EM RUNTIME / NÃO PROVEN EM PRODUÇÃO.** O repositório possui preflight, recovery CI e smoke pós-deploy executáveis. Nenhum deploy ou rollback produtivo foi realizado.

## Pré-condições para deploy

- HEAD exato aprovado em Pull Request;
- workflow `Quality` verde no mesmo HEAD, incluindo `backup-restore-recovery`;
- branch de destino protegida conforme governança aprovada;
- ambiente e responsável operacional identificados;
- secrets/configuração obrigatória presentes fora do repositório;
- PostgreSQL produtivo validado;
- storage privado persistente validado;
- backup recente identificado;
- plano de rollback definido antes da mudança;
- nenhuma migration destrutiva.

## Preflight automatizável

Executar `npm run prod:preflight` com as variáveis do ambiente alvo.

O preflight bloqueia, entre outros:

- `DATABASE_URL` ausente;
- `DATABASE_DIRECT_URL` ausente;
- provider documental ausente em produção;
- storage `local` em produção;
- `BRAVHAS_DEV_AUTH_BYPASS=true` em produção.

O script não imprime valores de secrets.

## Build e artefato

Fluxo esperado:

1. `npm ci --no-audit --no-fund`;
2. `npx prisma validate`;
3. `npx prisma generate`;
4. `npm run test:unit`;
5. `npm run test:contracts`;
6. `npm run test:integration`;
7. `npm run lint`;
8. `npm run typecheck`;
9. `npm run build`;
10. registrar commit SHA/deployment ID.

Não considerar build local isolado como evidência de produção.

## Migrations

Antes da promoção:

1. confirmar backup/snapshot aplicável;
2. revisar migrations novas no diff;
3. executar `npx prisma migrate deploy`;
4. executar `npx prisma migrate status`;
5. executar `npm run test:integrity` quando o ambiente permitir leitura controlada;
6. interromper o deploy em qualquer mismatch ou migration inesperada.

Nunca usar `prisma migrate reset` ou `prisma db push --accept-data-loss` em ambiente relevante.

## Startup

Após migrations:

1. iniciar o artefato aprovado;
2. consultar `/api/health` — liveness;
3. consultar `/api/readiness` — banco + storage e dependências críticas;
4. se readiness responder 503, não promover tráfego;
5. verificar logs sanitizados;
6. executar smoke pós-deploy.

## Smoke pós-deploy

Com credenciais técnicas e ambiente controlado, executar `npm run deploy:smoke`.

O script valida:

- health;
- readiness;
- login real;
- sessão;
- Dashboard;
- API de Indicadores;
- logout;
- boundary tenant documental quando `BRAVHAS_SMOKE_FOREIGN_DOCUMENT_ID` estiver disponível.

Sem runtime configurado, status: `DEFERRED_RUNTIME_VALIDATION`.

## Evidência Vercel auditada

No deployment associado ao HEAD `2612fafb5aaad2f6a1486b47f1e643ddc48332c4`, o Vercel chegou ao comando `npm run build` e falhou ao carregar `prisma.config.ts` com:

`PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_DIRECT_URL.`

Classificação:

`EXTERNAL ENV / PROVIDER CONFIGURATION`

A ausência de `DATABASE_DIRECT_URL` é coerente com o contrato versionado: essa variável é obrigatória para a arquitetura Prisma/migrations e o production preflight já bloqueia sua ausência.

Não corrigir essa falha removendo o requisito, hardcodando credencial, relaxando o preflight ou usando fallback inseguro. O fechamento depende da configuração do ambiente de deployment por governança/infraestrutura.

## Rollback da aplicação

### Trigger

Considerar rollback quando o release introduzir regressão de segurança, tenant isolation, integridade financeira, indisponibilidade relevante ou readiness degradado por código.

### Procedimento

1. interromper promoção de tráfego;
2. registrar motivo, horário, deployment ID e HEAD;
3. promover artefato anterior conhecido como saudável;
4. revalidar health/readiness;
5. executar smoke crítico;
6. executar verificação de integridade de dados quando houver risco de escrita inconsistente;
7. manter incidente aberto até causa-raiz e evidências de recuperação.

## Rollback de banco

`CODE ROLLBACK` e `DATABASE RECOVERY` são operações distintas.

Rollback de aplicação não implica rollback seguro de schema.

Para migration não reversível:

- impedir deploy até existir estratégia explícita;
- preferir alterações aditivas e rollout em etapas;
- manter compatibilidade entre versão anterior e schema novo quando viável;
- se recuperação exigir dados anteriores, seguir Backup/Restore;
- nunca executar SQL destrutivo improvisado.

O job `backup-restore-recovery` comprova o mecanismo de dump/restore em TEST, mas não autoriza restore produtivo.

## Comunicação

Responsável nominal, janela de mudança e SLA de comunicação devem ser definidos operacionalmente:

`BUSINESS/OPERATIONS DECISION REQUIRED`

## Evidência para considerar deploy/rollback comprovado em runtime

- deployment ID e commit SHA;
- Quality do mesmo HEAD;
- preflight PASS;
- migrations/status;
- health/readiness;
- smoke pós-deploy;
- backup aplicável;
- rollback exercitado em ambiente seguro;
- responsável e timestamps.

Sem essas evidências, o estado de runtime é `READY TO EXERCISE`, não `PROVEN`.
