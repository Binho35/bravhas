# RH/DP — estágio final de hardening

## Gate
Nenhuma consolidação deste estágio deve ocorrer sem CI Quality verde.

## Escopo
- eliminar leituras de tenant implícito (`first active company`) em superfícies RH/DP;
- garantir RBAC server-side nas leituras e mutações sensíveis;
- validar IDs relacionados sempre dentro de `actor.companyId`;
- preservar trilha de auditoria nas mutações críticas;
- revisar escopo de gestor por equipe;
- revisar persistência e fechamento de folha;
- executar auditoria final antes de homologação.

## Primeiro fechamento
A listagem mestre de Colaboradores passa a exigir `colaboradores:view` e todas as consultas são executadas exclusivamente em `actor.companyId`, removendo a seleção implícita da primeira empresa ativa.
