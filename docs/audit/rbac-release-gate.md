# Gate de release RBAC

A feature pode entrar em `main` quando Prisma validate/generate, TypeScript e ESLint estiverem verdes.

A segurança RBAC só pode ser marcada como totalmente homologada quando todos os server actions RH/DP críticos chamarem `requirePermission`/`hrdpPermission` e os perfis forem testados com sessões reais.
