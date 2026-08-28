# Limitações conhecidas

- server actions legados ainda usam guards genéricos em parte do produto;
- Gestor de Setor ainda precisa de vínculo persistente User ↔ HrEmployee para escopo estrito de subordinados;
- migrations RBAC precisam ser executadas no banco de homologação;
- alterações de matriz/atribuição têm helper de auditoria criado, mas a chamada deve ser integrada às duas actions administrativas.

Esses pontos permanecem bloqueadores para declarar segurança RBAC finalizada.
