# Status RBAC

Implementado nesta entrega:

- tabelas persistentes de perfis, permissões e vínculo usuário/perfil;
- CEO e Head Administrativo como perfis MASTER;
- perfis profissionais iniciais;
- matriz por recurso e ações visualizar/criar/editar/aprovar/excluir/exportar;
- motor server-side `requirePermission`;
- isolamento de perfil por empresa;
- central MASTER de perfis/permissões;
- tela MASTER para atribuição de perfil aos profissionais;
- seeds iniciais por categoria;
- catálogo e documentação de governança;
- helper para auditoria de mudanças de acesso.

Ainda necessário no rollout do produto: substituir guards genéricos de todos os server actions existentes pelo novo guard granular e homologar os cenários com usuários reais de cada perfil.
