# Rollout de autorização granular

Ordem de substituição de guards genéricos por `hrdpPermission`:

1. Configurações/acessos — OWNER/ADMIN somente.
2. Folha — view/export/approve separados.
3. Desligamentos — create/approve separados.
4. Medidas disciplinares — create/approve separados.
5. Documentos — view/create/edit separados.
6. Ponto e férias — create/edit/approve separados.
7. Benefícios e afastamentos.
8. Admissões, recrutamento, desempenho e Canal RH.
9. Relatórios/auditoria — view/export.

Regra: nenhuma decisão de segurança pode depender exclusivamente do componente visual. Toda mutação deve ser bloqueada no servidor.
