# BravHAS — Deferred Runtime Test Pack

Status: `TEST PACK PREPARED — NOT REQUESTED TODAY`

Objetivo: concentrar em uma única rodada futura somente validações que exigem Mac/browser/infra/credenciais/ambiente real.

## 1. Install / static quality

- `npm ci --no-audit --no-fund`
- `npx prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run test:contracts`
- `npm run build`

Aceite: todos exit code 0.

## 2. Database / integration

Em banco descartável de homologação:

- `npx prisma migrate deploy`
- `npm run seed`
- `npm run test:integrity`
- `npx prisma migrate status`

Aceite:

- migrations aplicadas;
- seed concluído;
- `DATA_INTEGRITY=PASS`;
- migration status sem pendência inesperada.

## 3. E2E browser

Após fixtures sintéticas:

- `npm run e2e:seed`
- `npm run test:e2e:auth`
- `npm run test:e2e:security`
- `npm run test:e2e:desktop`
- `npm run test:e2e:mobile`

Aceite: auth, RBAC, cross-tenant, desktop e mobile PASS.

## 4. Storage local / homologação

Validar manualmente/automatizado:

- PDF/JPG/PNG/WEBP válidos aceitos;
- MIME/extensão incompatíveis rejeitados;
- conteúdo spoofed rejeitado;
- arquivo >5 MB rejeitado;
- Alpha não lê/exclui Beta;
- upload com falha de metadata não deixa arquivo órfão;
- download autorizado mantém MIME/no-store/nosniff.

Aceite: todos os casos positivos/negativos conforme contrato.

## 5. Backup

Em banco de homologação autorizado:

- executar `npm run backup:execute`;
- preservar dump + manifesto.

Aceite obrigatório:

- `BACKUP_CREATED=PASS`;
- `CHECKSUM_VALID=PASS`;
- `ROW_COUNTS_CAPTURED=PASS`.

## 6. Restore

Em destino isolado e NÃO produtivo:

- definir `BRAVHAS_RESTORE_ALLOWED=true` somente durante o exercício;
- executar `npm run restore:execute -- --artifact=/caminho/arquivo.dump`.

Aceite obrigatório:

- `RESTORE_COMPLETED=PASS`;
- `MIGRATION_STATUS=PASS`;
- `ROW_COUNTS_VALID=PASS`;
- `TENANT_DATA_VALID=PASS`.

Depois configurar a aplicação no banco restaurado e executar os smokes.

## 7. Human browser smoke

Validar ponta a ponta:

- login/logout;
- Dashboard;
- Pessoas;
- Admissões;
- Documentos;
- Financeiro;
- Fluxo de Caixa;
- Obrigações;
- Agenda;
- Indicadores;
- mensagens de erro/empty/loading;
- responsividade desktop/mobile;
- teclado/foco nos fluxos críticos.

Status até execução: `DEFERRED_RUNTIME_VALIDATION`.

## 8. Deploy smoke, se ambiente existir

Antes:

- `npm run prod:preflight` deve retornar PASS;
- Quality deve estar verde no mesmo HEAD;
- migrations e storage reais homologados.

Depois do deploy:

- executar `npm run deploy:smoke` com conta técnica e URL do ambiente;
- fornecer `BRAVHAS_SMOKE_FOREIGN_DOCUMENT_ID` sintético/controlado quando possível.

Aceite:

- `HEALTH=PASS`;
- `READINESS=PASS`;
- `LOGIN=PASS`;
- `DASHBOARD=PASS`;
- `CRITICAL_API=PASS`;
- `TENANT_BOUNDARY=PASS` quando fixture foreign disponível;
- `POST_DEPLOY_SMOKE=PASS`.

## 9. Rollback exercise

Em homologação:

- registrar deployment atual;
- promover versão candidata;
- simular trigger controlado;
- retornar ao artefato conhecido saudável;
- repetir health/readiness/smoke/integrity.

Aceite: versão anterior restaurada sem corrupção e com smoke PASS.

## Resultado esperado da rodada

Uma única evidência consolidada contendo:

- HEAD;
- ambiente;
- timestamps;
- comandos executados;
- PASS/FAIL por categoria;
- RPO/RTO observados no exercício de restore;
- deployment/rollback IDs quando aplicável;
- bloqueios restantes.

Nenhuma execução deste pacote foi solicitada neste ciclo.
