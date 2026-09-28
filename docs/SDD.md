# SDD — BravHAS

> **Software Design Document — BravSystems**  
> Estado: **BASELINE INICIAL DE GOVERNANÇA**  
> Data: **2026-09-28**  
> Este documento não declara o produto como Production Ready.

## 1. Objetivo

Este SDD consolida a arquitetura, dados, segurança, integrações, qualidade e operação do BravHAS. Mudanças estruturais relevantes devem atualizar este arquivo ou gerar um ADR em `docs/adr/`.

## 2. Propósito do produto

SaaS administrativo multi-tenant para centralizar rotinas de Financeiro, RH, Departamento Pessoal e Obrigações.

## 3. Evidências confirmadas

- **COMPROVADO:** Next.js 16, React 19 e TypeScript.
- **COMPROVADO:** PostgreSQL com Prisma ORM.
- **COMPROVADO:** Playwright e GitHub Actions fazem parte da trilha de qualidade.
- **COMPROVADO:** autenticação server-backed com sessão persistida, token aleatório, hash SHA-256 no banco e cookie `httpOnly`.
- **COMPROVADO:** o produto possui isolamento multi-tenant e RBAC.
- **COMPROVADO:** o histórico em `prisma/migrations` é a fonte de evolução do banco.

## 4. Arquitetura lógica

- Aplicação web Next.js.
- Persistência relacional em PostgreSQL via Prisma.
- Tenant e ator devem ser derivados da sessão no servidor.
- Dados enviados pelo browser não são fonte confiável de tenant ou autoria.
- Repository Ready e Production Ready são estados distintos.

## 5. Domínios e módulos

- Empresas e filiais.
- Usuários e sessões.
- Perfis e RBAC.
- Financeiro.
- RH.
- Departamento Pessoal.
- Obrigações.
- Auditoria e consulta.

## 6. Dados e persistência

Entidades confirmadas no schema incluem `Company`, `Branch`, `User`, `UserSession` e entidades financeiras.

Requisitos:
- migrations versionadas e não destrutivas;
- integridade referencial;
- índices coerentes com consultas críticas;
- isolamento por tenant;
- política explícita de backup, restore e retenção.

## 7. Segurança

- Cookie `httpOnly`.
- `sameSite=lax`.
- `secure` em produção.
- Sessão revogável e com expiração persistida.
- Testes negativos cross-tenant e RBAC.
- Bypass de desenvolvimento não pode ser usado como mecanismo real de autenticação.
- Nenhum secret deve ser versionado.

## 8. Integrações

Toda integração externa deve registrar provider, autenticação, limites, timeout, retry, idempotência, dados enviados, custo e requisito de homologação.

Itens não comprovados nesta baseline permanecem **A AUDITAR**.

## 9. Deploy e ambientes

Ambientes esperados:
- desenvolvimento;
- homologação;
- produção.

Production Ready exige evidência de infraestrutura, banco, secrets, domínio, DNS, TLS, observabilidade, backup, restore, DR e homologação humana.

## 10. Qualidade

O Quality deve cobrir, no mínimo:
- dependências;
- Prisma validate/generate;
- migrations;
- TypeScript;
- lint;
- build;
- banco limpo;
- E2E autenticado;
- E2E cross-tenant/RBAC;
- mobile smoke.

Falhas não devem ser mascaradas com redução de assertions ou bypass de gates.

## 11. Observabilidade e operação

Devem ser documentados:
- logs;
- métricas;
- erros;
- alertas;
- health checks;
- runbook;
- incidentes.

Sem evidência, o item permanece **NÃO AUDITADO**.

## 12. Backup, restore e continuidade

Production Ready exige:
- política de backup;
- retenção;
- restore testado;
- RPO/RTO;
- procedimento de desastre;
- responsável operacional.

## 13. FinOps

Registrar por ambiente:
- infraestrutura;
- PostgreSQL;
- storage;
- APIs;
- observabilidade;
- fornecedores externos.

Ausência de medição = **NÃO MEDIDO**.

## 14. Lacunas atuais

- **A AUDITAR:** infraestrutura real de produção.
- **A AUDITAR:** domínio/DNS/TLS final.
- **A AUDITAR:** observabilidade.
- **A AUDITAR:** backup e restore comprovados.
- **A AUDITAR:** DR exercitado.
- **A AUDITAR:** e-mail transacional.
- **A AUDITAR:** carga e homologação humana final.

## 15. ADR

Decisões arquiteturais relevantes devem ser registradas em `docs/adr/ADR-XXXX-<decisao>.md` com contexto, decisão, alternativas e consequências.

## 16. Atualização obrigatória

Atualizar este SDD quando houver mudança material em arquitetura, schema, autenticação/RBAC, integrações, deploy, segurança, observabilidade, backup/DR ou dependência crítica.

## 17. Histórico

| Data | Versão | Alteração |
|---|---|---|
| 2026-09-28 | 1.0 | Baseline inicial padronizada de SDD BravSystems. |
