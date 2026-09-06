# BravHAS — Backup & Restore Runbook

## Status de evidência

Use apenas estes estados:

- `DOCUMENTADO`: procedimento existe;
- `READY TO EXERCISE`: tooling interno existe e está preparado, mas não foi executado contra infraestrutura real;
- `CONFIGURADO`: infraestrutura real configurada e auditada;
- `EXECUTADO`: backup real executado com evidência;
- `RESTAURADO`: restore real concluído em ambiente isolado;
- `COMPROVADO`: backup + restore + validações aprovadas e evidenciadas.

Estado atual: **READY TO EXERCISE / NÃO EXECUTADO EM INFRA REAL**.

## Tooling disponível

### Backup

- dry-run: `npm run backup:dry-run`;
- execução: `npm run backup:execute`.

O backup real:

- usa `pg_dump` custom format;
- não imprime connection string/senha;
- gera nome de artefato com ambiente/timestamp;
- registra identificador sanitizado do banco por hash;
- calcula SHA-256;
- gera manifesto JSON;
- captura contagens críticas antes do dump;
- falha com exit code não zero se o artefato/contagens não forem obtidos.

### Restore

- guard self-test: `npm run restore:guard:self-test`;
- dry-run: requer artefato/manifesto e valida checksum sem restaurar;
- execução não produtiva: `npm run restore:execute -- --artifact=/caminho/arquivo.dump`.

Execução de restore exige simultaneamente:

- ambiente NÃO produtivo;
- `BRAVHAS_RESTORE_ALLOWED=true`;
- flag explícita `--confirm-non-production` incorporada ao script npm;
- artefato e manifesto válidos;
- checksum SHA-256 válido.

Restore em produção é explicitamente recusado pelo tooling.

## Acceptance Contract

O exercício futuro só pode ser aprovado quando produzir evidência objetiva para:

- `BACKUP_CREATED=PASS`;
- `CHECKSUM_VALID=PASS`;
- `ROW_COUNTS_CAPTURED=PASS`;
- `RESTORE_COMPLETED=PASS`;
- `MIGRATION_STATUS=PASS`;
- `ROW_COUNTS_VALID=PASS`;
- `TENANT_DATA_VALID=PASS`;
- `APPLICATION_SMOKE_PASS=PASS`.

O tooling de restore já compara contagens de Company, User, HrEmployee, HrEmployeeDocument, FinancialAccount, FinancialTransaction e Obligation e valida invariantes tenant críticas.

O smoke da aplicação permanece `DEFERRED_RUNTIME_VALIDATION` até existir ambiente restaurado executável.

## Política proposta

A política deve ser aprovada antes de produção. Nenhum prazo abaixo é regra jurídica.

- PostgreSQL: backup automatizado diário e PITR quando o provider suportar;
- documentos: versionamento/replicação conforme object storage escolhido;
- retenção operacional sugerida: 30 dias de backups diários e checkpoints mensais, sujeita à política formal;
- criptografia em trânsito e repouso;
- conta de serviço com privilégio mínimo;
- nenhuma exclusão manual de backups fora da política aprovada.

Retenção legal final: `BUSINESS/LEGAL DECISION REQUIRED`.

## RPO e RTO propostos

Propostas, não SLA:

- RPO inicial: até 24 horas com backup diário;
- RTO inicial: até 4 horas, condicionado a provider, volume e equipe.

Somente exercício cronometrado pode converter proposta em evidência operacional.

## Procedimento futuro consolidado

1. identificar HEAD/deployment e ambiente;
2. executar backup oficial;
3. preservar dump + manifesto/checksum em local seguro;
4. provisionar destino isolado;
5. executar restore protegido;
6. confirmar migrations, contagens e integridade tenant;
7. configurar aplicação contra o destino isolado;
8. executar smoke autenticado/cross-tenant;
9. medir RPO/RTO;
10. preservar evidências e encerrar ambiente isolado conforme política.

Nenhum backup/restore de produção foi executado neste ciclo.
