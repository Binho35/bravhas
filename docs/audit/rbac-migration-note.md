# Migration RBAC

A implementação usa tabelas SQL dedicadas sem alterar o enum `UserRole`, preservando compatibilidade com autenticação, financeiro e usuários existentes. O acesso granular é consultado por SQL parametrizado através do Prisma. Isso permite introduzir perfis profissionais sem quebrar os papéis técnicos legados.
