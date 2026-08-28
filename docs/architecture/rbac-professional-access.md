# RBAC profissional — BravHAS

## Regra de governança

- CEO: MASTER.
- Head Administrativo: MASTER.
- OWNER e ADMIN técnicos preservam privilégio integral para administração e recuperação do sistema.
- Demais profissionais recebem um perfil configurável pelo MASTER.

## Perfis iniciais

CEO, Head Administrativo, Gestor RH/DP, Analista de RH, Analista de DP, Assistente RH/DP, Gestor de Setor e Auditoria / Consulta.

## Granularidade

Cada perfil não-master pode receber, por recurso, as ações: visualizar, criar, editar, aprovar, excluir e exportar.

Recursos iniciais: colaboradores, admissões, recrutamento, desempenho, Canal RH, ponto, férias, benefícios, afastamentos, medidas disciplinares, desligamentos, folha, organização, relatórios, auditoria e configurações.

## Segurança

A autorização efetiva deve ser verificada no servidor com `requirePermission`. Ocultar botões no front-end não substitui autorização server-side. Perfis e vínculos são isolados por empresa.

## Próxima etapa de rollout

Substituir gradualmente as autorizações genéricas dos server actions RH/DP por `requirePermission(recurso, ação)`, começando por folha, desligamentos, medidas disciplinares, documentos e aprovações.
