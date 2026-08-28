# Entrega RBAC profissional

Esta branch introduz a fundação configurável solicitada para categorias profissionais, com CEO e Head Administrativo MASTER, matriz granular por módulo/ação, atribuição de perfil por usuário, defaults de menor privilégio e enforcement server-side reutilizável.

A integração nos server actions legados será feita como rollout controlado, pois alterar simultaneamente todos os fluxos operacionais aumenta o risco de regressão. O merge desta fundação não equivale à homologação final de todos os fluxos.
