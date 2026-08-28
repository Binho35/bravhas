# Modelo de segurança de acesso

O BravHAS usa duas camadas complementares:

1. papel técnico legado (`UserRole`) para bootstrap, administração e compatibilidade;
2. perfil profissional RBAC para autorização funcional granular.

`OWNER` e `ADMIN` são privilégios técnicos master. Na governança de negócio, CEO e Head Administrativo são os perfis MASTER. Perfis MASTER não são restringíveis na matriz.

Para usuários não-master, a decisão de autorização considera vínculo ativo do usuário, empresa, perfil ativo, recurso e ação. A checagem deve ocorrer no servidor.

A matriz não deve armazenar dados pessoais ou conteúdo de documentos; somente decisões de autorização. Mudanças de acesso devem ser registradas na trilha de auditoria.
