# BravHAS — Incident Response

## Objetivo

Orientar contenção técnica sem criar burocracia ou autorizar ações destrutivas. Este documento não substitui plano corporativo de continuidade.

## Severidade técnica

- `SEV-1`: vazamento cross-tenant, perda/corrupção de dados, bypass de autorização, indisponibilidade total ou restore emergencial.
- `SEV-2`: indisponibilidade relevante de módulo crítico, erro financeiro consistente, storage/DB degradado sem perda comprovada.
- `SEV-3`: falha funcional com workaround e sem impacto de segurança/integridade.
- `SEV-4`: defeito cosmético ou melhoria sem impacto operacional imediato.

## Fluxo mínimo

1. detectar e registrar horário, ambiente, commit/deployment ID e sintoma;
2. preservar evidências sem copiar secrets, cookies, documentos ou PII desnecessária;
3. conter o impacto: bloquear tráfego/readiness, revogar sessão/credencial quando aplicável ou interromper operação afetada;
4. avaliar integridade com `npm run test:integrity` quando houver acesso seguro ao banco;
5. se o release for causa provável, seguir rollback da aplicação; migration irreversível nunca deve ser revertida por SQL improvisado;
6. se houver suspeita de perda/corrupção, preservar o ambiente e seguir o runbook de backup/restore;
7. executar smoke de recuperação e confirmar isolamento tenant antes de encerrar;
8. comunicar estado, impacto conhecido, ação adotada e próximo checkpoint ao responsável de governança;
9. produzir postmortem proporcional ao incidente, com causa-raiz, detecção, contenção e prevenção.

## Gatilhos de rollback

Rollback deve ser considerado quando o release introduzir:

- regressão de autenticação/RBAC;
- quebra de tenant isolation;
- falha recorrente no fluxo financeiro;
- readiness degradado por regressão de aplicação;
- erro impeditivo sem correção segura imediata.

## Integridade de dados

Nunca declarar incidente resolvido após erro financeiro, cross-tenant ou restore sem verificar integridade. O fechamento técnico deve registrar ao menos:

- migrations em estado esperado;
- invariantes tenant sem mismatch;
- contagens críticas coerentes quando aplicável;
- smoke da aplicação;
- ausência de erro crítico novo nos logs.

## Comunicação

O repositório não define contatos, SLA de comunicação ou obrigações legais. Esses itens exigem decisão de negócio/jurídica:

`BUSINESS/LEGAL DECISION REQUIRED`
