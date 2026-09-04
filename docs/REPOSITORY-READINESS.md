# BravHAS — Repository Readiness

Este documento separa evidência de repositório de evidência de ambiente. Um merge só deve ser considerado tecnicamente concluído quando o HEAD exato do PR e o commit pós-merge da `main` estiverem verdes no workflow `Quality`.

## Gates obrigatórios

O Quality atual cobre:

- instalação determinística com `npm ci`;
- dependency audit de produção em fail-closed;
- `prisma validate` e `prisma generate`;
- migration safety;
- regressões de autenticação/segurança;
- `prisma migrate deploy`;
- seed protegido por ambiente;
- TypeScript;
- lint;
- build;
- fresh PostgreSQL desde zero;
- authenticated browser E2E;
- cross-tenant/RBAC negativo;
- mobile product smoke.

Nenhum desses gates deve ser reduzido a warning para obter verde.

## Política desejada para `main`

Enquanto o GitHub reportar `protected=false` e não houver ruleset equivalente, `GOV-BRANCH-PROTECTION = OPEN`.

Configuração manual recomendada no GitHub:

1. exigir Pull Request para alterações na `main`;
2. exigir o status check `Quality` antes do merge;
3. exigir que o branch esteja atualizado com a base quando houver divergência relevante;
4. bloquear force push;
5. bloquear exclusão da `main`;
6. manter merge por HEAD conhecido e revisar o diff final;
7. não exigir número de aprovações que inviabilize o fluxo de proprietário único, salvo quando houver equipe revisora real;
8. aplicar as mesmas restrições a administradores quando isso for operacionalmente viável.

A proteção só pode ser declarada resolvida após leitura do GitHub mostrar proteção/ruleset efetivamente ativo.

## Isolamento multi-tenant

Regras de código:

- `companyId` confiável vem da sessão no servidor;
- ator/autoria confiáveis vêm da sessão;
- IDs enviados pelo browser são identificadores de recurso, nunca autorização;
- consultas por ID devem combinar recurso + tenant ou passar por helper de autorização equivalente;
- Gestor de Setor respeita vínculo funcional e subordinados quando a política de escopo se aplica.

Os E2E usam Empresa A e Empresa B sintéticas e recursos válidos dos dois tenants para provar negação real de acesso estrangeiro.

## Fixtures

Fixtures E2E são sintéticas e recusam execução fora de TEST/HOMOLOGATION. Elas não são evidência de produção.

## Banco

Migrations históricas são preservadas. Não usar para correção:

- `prisma migrate reset` em ambiente com dados relevantes;
- `prisma db push --accept-data-loss`;
- remoção/regravação de migrations integradas.

O gate `fresh-database` deve continuar provando migrations + seed + status em PostgreSQL vazio.

## Repository Ready

Pode ser considerado completo quando não houver P0/P1 solucionável dentro do repositório e os gates do HEAD final + pós-merge estiverem verdes.

## Homologation Ready

Além do repositório, exige um ambiente de homologação funcional e validação humana dos fluxos principais.

## Production Ready

Exige evidências externas reais, incluindo quando aplicável:

- infraestrutura e PostgreSQL reais;
- storage real;
- secrets e rotação;
- domínio/DNS/TLS;
- e-mail transacional;
- observabilidade/alertas;
- backup VERIFIED;
- restore PASSED;
- DR EXERCISED;
- homologação humana;
- teste de carga/capacidade;
- deploy real com rollback definido.

Nenhum teste sintético deve ser usado para declarar esses itens concluídos.
