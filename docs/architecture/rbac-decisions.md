# Decisões RBAC

- Perfis profissionais são dados de negócio, não novos valores rígidos do enum UserRole.
- A matriz é persistente e configurável sem deploy.
- OWNER/ADMIN continuam como papéis técnicos master.
- CEO/Head Administrativo são perfis de negócio master.
- Negação é o padrão quando não existe permissão explícita.
- Permissões são isoladas por empresa.
- Ações suportadas: view, create, edit, approve, delete, export.
