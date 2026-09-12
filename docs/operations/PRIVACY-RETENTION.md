# BravHAS — Privacy & Data Retention Engineering

## Escopo

Documento técnico. Não constitui parecer jurídico nem define prazo legal de guarda.

## Controles técnicos já exigidos

- isolamento por tenant em consultas e operações críticas;
- autorização server-side;
- cookies de sessão `httpOnly`, `sameSite=lax` e `secure` em produção;
- logs sem senha, token, cookie, secret ou conteúdo documental;
- documentos sem fallback produtivo para filesystem local;
- leitura documental vinculada a `companyId + employeeId`;
- backup/restore com validação de integridade tenant;
- readiness fail-closed quando dependência essencial não estiver homologada.

## Dados sensíveis

O domínio de Pessoas contém campos como CPF, RG, contato, salário e documentos funcionais. Regras de engenharia:

- não registrar valores desses campos em logs operacionais;
- não inserir PII em request/correlation ID;
- evitar payloads completos em exceções;
- restringir exportações e visualização por RBAC;
- preservar auditabilidade de ações críticas sem duplicar conteúdo sensível.

## Retenção

O repositório não possui base jurídica suficiente para determinar prazo final de retenção de:

- documentos funcionais;
- dados de colaboradores desligados;
- logs operacionais;
- eventos de auditoria;
- backups.

Estado:

`BUSINESS/LEGAL DECISION REQUIRED`

O runbook de backup contém apenas uma proposta operacional de retenção; ela não deve ser tratada como prazo jurídico.

## Exclusão e exportação

Capacidades de exclusão/exportação devem respeitar:

- tenant scope;
- RBAC server-side;
- integridade referencial;
- auditabilidade;
- retenção legal/contratual definida fora do código.

Não implementar purge automático de dados pessoais antes da política formal.

## Evidência necessária antes de produção plena

- política de retenção aprovada;
- responsáveis por solicitações de acesso/correção/exclusão definidos;
- matriz de dados e finalidade aprovada;
- procedimento de exportação/exclusão homologado quando aplicável;
- retenção de logs e backups alinhada à política aprovada;
- acesso administrativo auditável.
