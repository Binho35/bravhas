# BravHAS RH/DP — Critical Flow Audit Rollout

## Objetivo

Fechar a lacuna entre a trilha de auditoria já implantada e os fluxos operacionais críticos do RH/DP.

## Fluxos priorizados

1. Cadastro de colaborador — implementado em `EMPLOYEE_CREATED`.
2. Ponto e jornada — criação e tratamento de ocorrência.
3. Férias — criação, aprovação, rejeição e conclusão.
4. Benefícios — inclusão e encerramento.
5. Afastamentos — inclusão, revisão e encerramento.
6. Medidas disciplinares — emissão e ciência.
7. Desligamentos — desligamento e efeitos associados.
8. Documentos — inclusão e verificação.
9. Canal RH — criação e mudança de status.
10. Admissão — ativação de pré-admissão.

## Regra

A auditoria deve registrar somente metadados necessários para rastreabilidade e nunca duplicar conteúdo sensível integral do registro de negócio.

## Gate de homologação

Nenhum fluxo acima deve ser marcado como homologado antes de:

- autorização server-side adequada;
- persistência da mutação;
- registro de evento de auditoria;
- revalidação de rota/dossiê;
- teste de comportamento no banco e navegador.
