# BravHAS — Backup & Restore Runbook

## Status de evidência

Use estes estados com escopo explícito:

- `DOCUMENTADO`: procedimento existe;
- `READY TO EXERCISE`: tooling existe, mas ainda não foi exercitado naquele ambiente;
- `COMPROVADO EM TEST CI`: backup + restore + validações passaram em PostgreSQL efêmero do CI;
- `CONFIGURADO EM RUNTIME`: infraestrutura real configurada e auditada;
- `EXECUTADO EM RUNTIME`: backup real executado com evidência;
- `RESTAURADO EM RUNTIME`: restore real concluído em ambiente isolado de runtime;
- `COMPROVADO EM RUNTIME`: backup + restore + validações aprovadas em infraestrutura representativa/real.

Estado atual interno: **COMPROVADO EM TEST CI** pelo job `backup-restore-recovery` do workflow `Quality`.

Estado de produção: **NÃO CONFIGURADO / NÃO EXECUTADO / NÃO RESTAURADO**.

A prova de CI valida a engenharia do procedimento. Ela não substitui política, storage de backup, credenciais, retenção ou exercício de disaster recovery do provider produtivo.

## Tooling disponível

### Backup

- dry-run: `npm run backup:dry-run`;
- execução: `npm run backup:execute`.

O backup executável:

- usa `pg_dump` custom format;
- não imprime connection string/senha;
- gera nome de artefato com ambiente/timestamp;
- registra identificador sanitizado do banco por hash;
- calcula SHA-256;
- gera manifesto JSON;
- captura contagens críticas antes do dump;
- falha com exit code não zero se artefato, checksum ou contagens não puderem ser obtidos.

### Restore

- guard self-test: `npm run restore:guard:self-test`;
- dry-run: valida artefato/manifesto/checksum sem restaurar;
- execução não produtiva: `npm run restore:execute -- --artifact=/caminho/arquivo.dump`.

Execução de restore exige simultaneamente:

- ambiente NÃO produtivo;
- `BRAVHAS_RESTORE_ALLOWED=true`;
- confirmação explícita `--confirm-non-production` incorporada ao script npm;
- artefato e manifesto válidos;
- checksum SHA-256 válido.

Restore em produção é explicitamente recusado pelo tooling.

## Recovery CI Gate

O job `backup-restore-recovery` usa apenas PostgreSQL efêmero e `BRAVHAS_ENV=TEST`.

Sequência comprovada:

1. cria banco source isolado;
2. aplica migrations;
3. cria fixtures sintéticas Alpha/Beta;
4. adiciona registros representativos de documento, conta/transação financeira e audit history;
5. executa `test:integrity` no source;
6. executa `pg_dump` real;
7. confirma dump, manifesto, checksum e row counts;
8. cria um segundo banco vazio no mesmo serviço efêmero;
9. executa `pg_restore` real no destino;
10. confirma `prisma migrate status`;
11. compara row counts do manifesto;
12. executa invariantes tenant do restore;
13. executa novamente o integrity gate completo;
14. verifica tenants Alpha/Beta, employees, document metadata, obligation, FinancialAccount, FinancialTransaction e audit history restaurados.

O job não acessa infraestrutura de produção e não usa credenciais produtivas.

## Acceptance Contract

A prova interna exige:

- `BACKUP_CREATED=PASS`;
- `CHECKSUM_VALID=PASS`;
- `ROW_COUNTS_CAPTURED=PASS`;
- `RESTORE_COMPLETED=PASS`;
- `MIGRATION_STATUS=PASS`;
- `ROW_COUNTS_VALID=PASS`;
- `TENANT_DATA_VALID=PASS`;
- `DATA_INTEGRITY=PASS` após restore;
- `RECOVERY_CRITICAL_RECORDS=PASS`.

O browser smoke completo não é duplicado dentro do job de restore. O baseline funcional é executado separadamente no mesmo workflow `Quality` e deve permanecer verde no mesmo HEAD.

## RPO / RTO

Nenhum número é definido pelo repositório.

- `RPO = BUSINESS DECISION PENDING`
- `RTO = BUSINESS / INFRA DECISION PENDING`

RPO/RTO só podem virar compromisso operacional depois de decisão formal, provider definido, volume conhecido e exercício cronometrado em infraestrutura representativa.

## Política externa ainda necessária

Antes de produção definir e comprovar:

- provider/serviço de backup;
- frequência e retenção;
- PITR quando aplicável;
- criptografia em trânsito e repouso;
- conta de serviço com privilégio mínimo;
- separação entre credencial da aplicação e credencial de recovery;
- armazenamento seguro de dump/manifesto;
- responsável operacional;
- política legal de retenção;
- exercício periódico de restore.

Estado desses itens: `BUSINESS / INFRA / LEGAL DECISION REQUIRED`.

## Procedimento futuro de runtime

1. identificar HEAD/deployment e ambiente;
2. confirmar política e destino seguro de backup;
3. executar backup oficial;
4. preservar dump + manifesto/checksum;
5. provisionar destino isolado;
6. executar restore protegido;
7. confirmar migrations, contagens e integridade tenant;
8. configurar aplicação de homologação/recovery contra o destino isolado;
9. executar smoke autenticado/cross-tenant;
10. medir RPO/RTO observado;
11. preservar evidências;
12. encerrar ambiente de recovery conforme política.

Nenhum backup/restore de produção é autorizado por este documento.
