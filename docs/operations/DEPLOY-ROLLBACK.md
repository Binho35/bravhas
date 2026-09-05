# BravHAS — Deploy & Rollback Runbook

## Estado atual

**DOCUMENTADO.** Este runbook não comprova deploy produtivo, domínio, DNS, secrets, observabilidade externa ou rollback exercitado.

## Pré-condições para deploy

- HEAD exato aprovado em Pull Request;
- workflow `Quality` verde no HEAD candidato;
- branch de destino protegida conforme governança aprovada;
- ambiente e owner operacional identificados;
- secrets configurados fora do repositório;
- PostgreSQL produtivo validado;
- storage privado persistente validado;
- backup recente identificado;
- plano de rollback definido antes da mudança;
- nenhuma migration destrutiva.

## Build e artefato

Fluxo esperado:

1. `npm ci --no-audit --no-fund`;
2. `npx prisma validate`;
3. `npx prisma generate`;
4. `npm run lint`;
5. `npx tsc --noEmit`;
6. `npm run build`;
7. registrar commit SHA do artefato/deploy.

Não considerar um build local como evidência de produção.

## Variáveis de ambiente

Validar, sem registrar valores sensíveis:

- `DATABASE_URL`;
- `DATABASE_DIRECT_URL` quando aplicável;
- `BRAVHAS_ENV=PRODUCTION`;
- credenciais do storage produtivo futuro;
- demais secrets definidos pelo ambiente.

`BRAVHAS_DEV_AUTH_BYPASS` deve permanecer desabilitado.

## Migrations

Antes da subida da aplicação:

1. confirmar backup/snapshot quando aplicável;
2. revisar migrations novas no diff do PR;
3. executar `npx prisma migrate deploy` no ambiente alvo;
4. executar `npx prisma migrate status`;
5. interromper o deploy se houver falha ou migration inesperada.

Nunca usar `prisma migrate reset` ou `prisma db push --accept-data-loss` em ambiente relevante.

## Startup

Após migrations:

1. iniciar o artefato da versão aprovada;
2. consultar `/api/health`;
3. consultar `/api/readiness`;
4. se readiness responder 503, o ambiente não deve receber tráfego produtivo;
5. verificar logs sanitizados para erro de aplicação/banco/storage;
6. executar smoke funcional autenticado no tenant de homologação/produção controlado.

## Verificação pós-deploy

- [ ] versão/commit SHA correto;
- [ ] `/api/health` saudável;
- [ ] `/api/readiness` pronto;
- [ ] login funcional;
- [ ] Dashboard abre;
- [ ] Pessoas abre;
- [ ] Documentos abre e arquivo autorizado pode ser lido;
- [ ] Financeiro abre;
- [ ] Fluxo de Caixa abre;
- [ ] Obrigações abre;
- [ ] Agenda abre;
- [ ] Indicadores abre;
- [ ] logout invalida sessão;
- [ ] logs sem erro crítico;
- [ ] cross-tenant smoke negativo aprovado.

## Rollback de aplicação

Rollback de aplicação deve reutilizar artefato/commit anteriormente conhecido como saudável.

1. interromper promoção de tráfego para versão defeituosa;
2. registrar motivo e horário;
3. promover artefato anterior conhecido;
4. revalidar `/api/health` e `/api/readiness`;
5. repetir smoke crítico;
6. manter incidente aberto até causa-raiz e integridade de dados serem verificadas.

## Migrations irreversíveis

Migration de banco não deve ser “desfeita” automaticamente apenas revertendo o código.

Para migration não reversível:

- impedir merge/deploy até existir estratégia explícita de compatibilidade ou recuperação;
- preferir alterações aditivas e rollout em etapas;
- preservar compatibilidade entre versão anterior e schema novo durante a janela de rollback sempre que viável;
- quando recuperação exigir restore, seguir `docs/operations/BACKUP-RESTORE.md`;
- nunca executar SQL destrutivo improvisado para fazer o schema “voltar”.

## Evidência para considerar deploy comprovado

- deployment ID/URL interna do provider;
- commit SHA;
- Quality do mesmo HEAD;
- resultado das migrations;
- health/readiness;
- smoke pós-deploy;
- evidência de rollback testado ou exercício controlado;
- responsável e timestamp.

Sem essas evidências, os estados permanecem `DOCUMENTADO`/`EXTERNO`.
