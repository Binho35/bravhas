# BravHAS — Repository Readiness

Este documento separa evidência de repositório de evidência de ambiente. Um merge só deve ser considerado tecnicamente concluído quando o HEAD exato do PR e, após autorização, o commit pós-merge da `main` estiverem verdes no workflow `Quality`.

## Gates obrigatórios

O Quality atual cobre:

- instalação determinística com `npm ci`;
- dependency audit de produção em fail-closed;
- `prisma validate` e `prisma generate`;
- migration safety;
- regressões de autenticação/segurança;
- repository-readiness regression;
- unit contracts de storage/upload;
- self-tests de production preflight/restore e dry-run de backup;
- `prisma migrate deploy`;
- seed protegido por ambiente;
- invariantes de integridade multi-tenant no banco;
- TypeScript;
- lint;
- build;
- fresh PostgreSQL desde zero;
- authenticated browser E2E;
- cross-tenant/RBAC negativo;
- desktop consolidated product smoke;
- mobile product smoke.

O workflow usa `permissions: contents: read`, timeouts e concurrency com cancelamento de runs obsoletos. Nenhum gate deve ser reduzido a warning para obter verde.

## Política desejada para `main`

Enquanto o GitHub reportar `protected=false` e não houver ruleset equivalente comprovado, `GOV-BRANCH-PROTECTION = OPEN`.

Configuração manual recomendada:

1. Pull Request obrigatório;
2. status check `Quality` obrigatório;
3. branch atualizado quando houver divergência relevante;
4. bloquear force push;
5. bloquear exclusão da `main`;
6. revisar HEAD/diff final;
7. revisão mínima compatível com a estrutura operacional real;
8. aplicar restrições a administradores quando viável.

A proteção só pode ser declarada resolvida após evidência real do GitHub.

## Isolamento multi-tenant

Regras:

- `companyId` confiável vem da sessão server-side;
- autoria/ator vêm da sessão;
- IDs do browser identificam recursos, não concedem autorização;
- consultas por ID combinam recurso + tenant ou helper de autorização equivalente;
- storage documental valida escopo `companyId + employeeId` dentro do próprio adapter;
- Gestor de Setor respeita vínculo funcional/subordinados quando a política se aplica.

Os E2E usam tenants sintéticos Alpha/Beta e recursos válidos para provar negação real em Pessoas, Documentos, Financeiro, Obrigações e Indicadores.

Além do E2E, `npm run test:integrity` falha quando encontra mismatch entre tenants em relações críticas de usuário/filial, documento/colaborador, financeiro/filial, transação/ator, obrigação/responsável e perfil/usuário.

## Fixtures

Fixtures E2E são sintéticas e recusam execução fora de TEST/HOMOLOGATION. Elas não são evidência de produção.

## Integridade financeira

Pagamento, recebimento, cancelamento e estorno usam transação Prisma com isolamento `Serializable`, mantendo atualização da conta e registro da transação financeira no mesmo commit lógico.

O banco persiste valores monetários com `Decimal(15,2)`.

## Banco e migrations

Migrations históricas são preservadas. Não usar:

- `prisma migrate reset` em ambiente relevante;
- `prisma db push --accept-data-loss`;
- reescrita de migrations integradas.

O gate `fresh-database` prova migrations + seed + status em PostgreSQL vazio.

Constraints compostas tenant-aware adicionais podem ser consideradas no futuro somente após `test:integrity` provar zero mismatch em dados reais. Não criar constraint que possa falhar sobre dados não auditados.

## Storage documental

O contrato vendor-neutral implementa save/read/delete/health, erros tipados, checksum, validação MIME/extensão/assinatura, limite de tamanho, sanitização de filename e proteção de traversal.

O adapter local é não produtivo e fail-closed em produção. Provider real continua dependência externa.

## Health e readiness

- `/api/health`: liveness do processo HTTP;
- `/api/readiness`: banco + storage essencial e aptidão para tráfego.

Produção só pode ficar `ready` com storage saudável, persistente e marcado como production-safe.

## Tooling operacional

O repositório contém tooling para:

- production preflight;
- backup com dump/manifesto/checksum/row counts;
- restore protegido e proibido em produção;
- validação pós-restore de migrations, contagens e integridade tenant;
- post-deploy smoke;
- incident response.

Esses mecanismos estão `READY TO EXERCISE`, não `PROVEN`, enquanto não forem executados em infraestrutura real.

## Repository / Internal Engineering Ready

Só pode ser declarado quando:

- não houver P0/P1 interno executável pendente;
- Quality do HEAD final estiver verde;
- auto-auditoria do diff não encontrar regressão/security weakening.

## Homologation Ready

Além do repositório, exige ambiente funcional e validação humana dos fluxos principais.

## Production Ready

Exige evidências externas reais, incluindo:

- infraestrutura e PostgreSQL;
- storage privado persistente;
- secrets/rotação;
- branch protection;
- observabilidade/alertas;
- backup executado;
- restore comprovado;
- DR/rollback exercitado;
- deploy real;
- homologação humana;
- capacidade/carga conforme necessidade.

Nenhum teste sintético deve ser usado para declarar esses itens concluídos.
