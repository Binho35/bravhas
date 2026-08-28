# CI

O Quality existente valida schema Prisma, geração do client, TypeScript e ESLint. As tabelas RBAC são migrations SQL e não alteram o schema Prisma nesta entrega, reduzindo impacto sobre o client legado. Homologação de migration em PostgreSQL continua necessária antes de produção.
