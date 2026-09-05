# BravHAS — Readiness Matrix — Ciclo 2

## Regra de medição

A matriz separa quatro dimensões: Desenvolvimento, Produto, Produção e Comercial. O objetivo é impedir que código funcional seja confundido com produto integralmente pronto.

Estados aceitos por critério:

- `COMPROVADO`: existe evidência verificável no repositório/CI ou ambiente auditado;
- `PARCIAL`: há implementação/evidência, mas a condição integral não foi comprovada;
- `NÃO EXECUTADO`: trabalho/teste ainda não executado;
- `BLOQUEADO`: depende de pré-condição ausente;
- `EXTERNO`: depende de infraestrutura, operação ou decisão fora do repositório.

## Pesos

Não há pesos aprovados pela governança neste ciclo. Para futura metrificação, Nexus propõe **peso unitário igual por critério dentro de cada dimensão** como baseline neutro, porque evita atribuição subjetiva de importância antes de aprovação do Argos. Critérios P0 não devem ser compensados por média: qualquer P0 aberto mantém a dimensão correspondente não pronta para produção, independentemente do percentual.

Até aprovação formal dos pesos e fechamento das evidências externas, o resultado percentual oficial permanece `NÃO AUDITADO COM PRECISÃO`.

## Desenvolvimento

| Critério | Estado | Evidência |
|---|---|---|
| Backend principal | COMPROVADO | APIs e regras persistentes para Financeiro, Obrigações, Indicadores, auth e RH/DP existente |
| Frontend principal | COMPROVADO | rotas operacionais para módulos críticos |
| Persistência | COMPROVADO | Prisma/PostgreSQL, migrations e fresh DB no Quality |
| Testes automatizados | COMPROVADO | auth, security, financeiro, desktop consolidado e mobile no CI do PR |
| Segurança de repositório | COMPROVADO | security regression, server-side auth, RBAC e cross-tenant |
| Documentação técnica | COMPROVADO | readiness, arquitetura e runbooks no repositório |

**Resultado:** `NÃO AUDITADO COM PRECISÃO` até aprovação de pesos e Quality final do HEAD.

## Produto

| Critério | Estado | Evidência |
|---|---|---|
| Fluxo ponta a ponta desktop | PARCIAL | smoke consolidado automatizado; homologação humana integral ainda pendente |
| UX principal | PARCIAL | interfaces funcionais; revisão humana completa de UX não concluída |
| Desktop | COMPROVADO | smoke E2E consolidado adicionado ao Quality |
| Mobile | COMPROVADO | mobile smoke existente no Quality |
| Tratamento de erro | PARCIAL | sanitização e estados de erro existem, sem catálogo integral de falhas homologado |
| Dados reais/persistentes | COMPROVADO | Financeiro, Documentos, Agenda/Obrigações e Indicadores usam fontes persistentes |
| Homologação humana | NÃO EXECUTADO | exige execução/aceite humano em ambiente de homologação |

**Resultado:** `NÃO AUDITADO COM PRECISÃO`.

## Produção

| Critério | Estado | Evidência |
|---|---|---|
| Banco produtivo | EXTERNO | nenhum ambiente produtivo auditado neste ciclo |
| Storage privado persistente | BLOQUEADO | contrato vendor-neutral preparado; provider não configurado |
| Backup | DOCUMENTADO/PARCIAL | runbook criado; execução real não comprovada |
| Restore | DOCUMENTADO/PARCIAL | procedimento criado; restore real não executado |
| Observabilidade | PARCIAL | health existente e readiness fail-closed criado; alertas externos não configurados |
| Deploy | DOCUMENTADO/PARCIAL | runbook criado; deploy real não executado |
| Rollback | DOCUMENTADO/PARCIAL | runbook criado; exercício real não comprovado |
| Secrets | EXTERNO | gestão/rotação dependem do ambiente produtivo |
| Branch protection | BLOQUEADO | `main` auditada sem proteção; alteração depende de autorização |

**Resultado:** `NÃO AUDITADO COM PRECISÃO`. Há P0/P1 externos abertos.

## Comercial

| Critério | Estado | Evidência |
|---|---|---|
| Onboarding de tenant | PARCIAL | estruturas de empresa/usuário existem; operação comercial não homologada |
| Implantação | PARCIAL | runbook técnico em evolução; processo comercial não comprovado |
| Documentação | PARCIAL | manual técnico/operacional existente; pacote de cliente ainda não auditado |
| Treinamento | PARCIAL | manual existente; programa/aceite de treinamento não comprovado |
| Suporte | EXTERNO | processo/SLA não definido no repositório |
| Cobrança | EXTERNO | não faz parte deste ciclo técnico |
| Contrato | EXTERNO | responsabilidade comercial/jurídica |
| SLA | EXTERNO | depende de decisão operacional/comercial |

**Resultado:** `NÃO AUDITADO COM PRECISÃO`.

## Matriz de homologação dos módulos

| Módulo | Código | E2E | Mobile | Segurança | Produto |
|---|---|---|---|---|---|
| Dashboard | COMPROVADO | COMPROVADO | COMPROVADO | PARCIAL | PARCIAL |
| Pessoas | COMPROVADO | COMPROVADO | COMPROVADO | COMPROVADO | PARCIAL |
| Admissão | COMPROVADO | COMPROVADO | PARCIAL | COMPROVADO | PARCIAL |
| Documentos | COMPROVADO | COMPROVADO | PARCIAL | COMPROVADO | PARCIAL |
| Financeiro | COMPROVADO | COMPROVADO | COMPROVADO | COMPROVADO | PARCIAL |
| Fluxo de Caixa | COMPROVADO | COMPROVADO | COMPROVADO | COMPROVADO | PARCIAL |
| Obrigações | COMPROVADO | COMPROVADO | COMPROVADO | COMPROVADO | PARCIAL |
| Agenda | COMPROVADO | COMPROVADO | PARCIAL | PARCIAL | PARCIAL |
| Indicadores | COMPROVADO | COMPROVADO | PARCIAL | COMPROVADO | PARCIAL |

`Produto = PARCIAL` enquanto a homologação humana integral não estiver registrada.

## Gates de produção que não podem ser compensados por percentual

- cross-tenant P0 deve permanecer verde;
- storage produtivo privado deve estar configurado e homologado;
- backup deve ter evidência real;
- restore deve ter sido executado e aprovado;
- readiness deve responder pronto no ambiente alvo;
- deploy/rollback devem ter evidência operacional;
- branch protection deve ser decidida/aplicada pela governança antes da condição final de produção.
