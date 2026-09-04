# BravHas — baseline real de readiness do repositório

Data da auditoria: 2026-09-03

## Estado consolidado

- Repositório oficial: `Binho35/bravhas`.
- Branch principal: `main`.
- Não há branch `develop` consolidada como destino de PRs; o fluxo atual usa `main`.
- PR #21 foi concluído antes deste ciclo.
- Merge do PR #21: `3b258156a1471bc53abaf1980094a542476cb2ed`.
- Quality #169 do HEAD do PR #21 passou com install, dependency audit de produção, Prisma validate/generate, migrations, seed, TypeScript, lint e build.
- `main` permanece sem branch protection efetiva; isso é blocker de governança para go-live.

## Mapa de completude

| Área | Estado | Evidência/limite |
| --- | --- | --- |
| Produto | PARCIAL | RH/DP, Financeiro e Obrigações têm implementação relevante; ainda requer homologação runtime ampla. |
| Front-end | PARCIAL | Telas existem, mas não há browser E2E permanente cobrindo todos os fluxos. |
| Back-end | PARCIAL | APIs e services persistentes existem nos módulos principais revisados. |
| Banco | PARCIAL | Prisma + migrations + PostgreSQL no CI; ambiente real não homologado. |
| Autenticação | PARCIAL | sessão server-side, scrypt e token hash; falta matriz runtime completa. |
| Multitenancy | PARCIAL | guards por companyId nas superfícies revisadas; falta E2E cross-tenant permanente. |
| RBAC | PARCIAL | RBAC profissional e escopo de gestor implementados; falta suíte negativa abrangente. |
| Segurança | PARCIAL | dependency gate e hardening existentes; branch protection e runtime externo pendentes. |
| Auditoria | PARCIAL | eventos persistentes em fluxos críticos revisados. |
| LGPD | PARCIAL | minimização e segregação aparecem na arquitetura; falta validação operacional/retention completa. |
| UX/UI/Mobile | PARCIAL | não há evidência suficiente para classificar como homologado. |
| Performance | NÃO INICIADO | sem baseline mensurado no runner/ambiente alvo. |
| Testes | PARCIAL | Quality forte de build/DB; browser/authenticated E2E ainda não é gate. |
| CI/CD | PARCIAL | Quality existe; branch protection está desligada. |
| Observabilidade | NÃO INICIADO | provider e baseline operacional não definidos. |
| Integrações | PARCIAL | não há evidência de homologação externa real. |
| Administração | PARCIAL | RBAC/configuração existem; falta homologação autenticada completa. |
| Documentação | PARCIAL | auditorias e arquitetura existem, mas parte está defasada frente ao estado atual. |
| Homologação | PARCIAL | CI PostgreSQL existe; runtime/browser por perfis ainda pendente. |
| Infraestrutura | BLOQUEADO EXTERNAMENTE | hosting/runtime, PostgreSQL alvo, storage, secrets, domínio/TLS, e-mail, observabilidade, backup/restore/DR. |
| Produção | BLOQUEADO EXTERNAMENTE | não há evidência suficiente para Production Ready. |

## Dependency audit — evidência do Ciclo 22

O Quality #171 encontrou advisories HIGH de produção. `fast-uri` possui correção compatível e deve ser atualizado pelo lockfile. O outro HIGH observado é `mysql2`, dependência transitiva de `prisma@7.9.1`; o próprio `npm audit` oferece apenas downgrade breaking para Prisma 6.19.3. Não foi aplicado `npm audit fix --force`, downgrade major ou override incompatível.

Até existir correção estável compatível com o stack atual, os advisories `GHSA-3f6p-5ww8-9rcr` e `GHSA-rgwj-5xj2-c3m3` ficam classificados como **MITIGATED / OPEN FOR UPGRADE**, restritos à cadeia transitiva de tooling Prisma, e continuam explicitamente auditados pelo CI. Qualquer HIGH/CRITICAL diferente desses permanece bloqueante.

## Blockers reais

1. `main` com `protected=false` e required status checks sem enforcement.
2. Browser/authenticated E2E e cross-tenant negativo ainda não são gates permanentes.
3. Backup real não verificado.
4. Restore real não testado.
5. DR não exercitado.
6. Infraestrutura alvo e observabilidade não homologadas.
7. Deploys Vercel recentes falharam por limite de recursos; isso não é tratado como falha do Quality, nem como evidência de produção.
8. HIGH transitivo `mysql2` via Prisma 7.9.1 permanece MITIGATED até atualização compatível; não classificar como RESOLVED.

## Regras permanentes

- Não usar `prisma db push --accept-data-loss` como baseline de produção.
- Não executar seed/reset destrutivo em produção.
- Não declarar produção pronta sem evidência operacional real.
- Não remover gates para fazer CI passar.
- Não considerar documentação substituta de teste funcional.
- Não usar `npm audit fix --force` para mascarar advisory transitivo.
