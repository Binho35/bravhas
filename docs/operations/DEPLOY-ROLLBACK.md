# BravHAS — Deploy & Rollback Runbook

## Estado atual

**READY TO EXERCISE / NÃO PROVEN.** O repositório possui preflight e smoke pós-deploy executáveis, porém nenhum deploy ou rollback produtivo foi realizado neste ciclo.

## Pré-condições para deploy

- HEAD exato aprovado em Pull Request;
- workflow `Quality` verde no mesmo HEAD;
- branch de destino protegida conforme governança aprovada;
- ambiente e responsável operacional identificados;
- secrets configurados fora do repositório;
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
6. `npm run lint`;
7. `npm run typecheck`;
8. `npm run build`;
9. registrar commit SHA/deployment ID.

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
3. consultar `/api/readiness` — banco + storage e demais dependências críticas;
4. se readiness responder 503, não promover tráfego;
5. verificar logs sanitizados;
6. executar smoke pós-deploy.

## Smoke pós-deploy

Com credenciais técnicas/ambiente controlado, executar `npm run deploy:smoke`.

O script valida:

- health;
- readiness;
- login real;
- sessão;
- Dashboard;
- API de Indicadores;
- logout;
- boundary tenant documental quando `BRAVHAS_SMOKE_FOREIGN_DOCUMENT_ID` estiver disponível.

Sem ambiente real, status: `DEFERRED_RUNTIME_VALIDATION`.

## Vercel

Falha `build-rate-limit` deve ser classificada como `EXTERNAL INFRA LIMIT`, não como erro de código, até existir evidência contrária no log do build.

Nenhum upgrade de plano ou alteração de provider é autorizado por este runbook.

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

## Migrations irreversíveis

Rollback de aplicação não implica rollback seguro de schema.

Para migration não reversível:

- impedir deploy até existir estratégia explícita;
- preferir alterações aditivas e rollout em etapas;
- manter compatibilidade entre versão anterior e schema novo quando viável;
- se recuperação exigir dados anteriores, seguir Backup/Restore;
- nunca executar SQL destrutivo improvisado.

## Comunicação

Responsável nominal, janela de mudança e SLA de comunicação devem ser definidos operacionalmente:

`BUSINESS/OPERATIONS DECISION REQUIRED`

## Evidência para considerar deploy/rollback comprovado

- deployment ID e commit SHA;
- Quality do mesmo HEAD;
- preflight PASS;
- resultado de migrations;
- health/readiness;
- smoke pós-deploy;
- rollback exercitado em ambiente seguro;
- responsável e timestamps.

Sem essas evidências, o estado é `READY TO EXERCISE`, não `PROVEN`.
