# BravHAS

BravHAS é um SaaS administrativo multi-tenant para centralizar rotinas de Financeiro, RH, Departamento Pessoal e Obrigações, com autenticação server-side, RBAC, isolamento por empresa e trilha de qualidade automatizada.

## Stack

- Next.js 16 / React 19 / TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- Playwright
- GitHub Actions

## Pré-requisitos

- Node.js 24 (mesma versão usada no Quality)
- npm
- PostgreSQL 16 ou compatível

## Configuração local

1. Copie `.env.example` para `.env` e informe URLs de banco de desenvolvimento.
2. Instale dependências:

```bash
npm ci
```

3. Gere o Prisma Client e aplique migrations:

```bash
npm run prisma:generate
npm run db:migrate
```

4. Para ambiente de TEST/HOMOLOGATION, execute o seed permitido:

```bash
npm run seed
```

5. Inicie o projeto:

```bash
npm run dev
```

A aplicação local usa `http://localhost:3000` por padrão.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | conexão principal da aplicação |
| `DATABASE_DIRECT_URL` | conexão direta usada pelo Prisma/migrations |
| `SHADOW_DATABASE_URL` | banco shadow quando necessário ao fluxo de desenvolvimento |
| `BRAVHAS_ENV` | classificação de ambiente; fixtures E2E aceitam apenas TEST/HOMOLOGATION |
| `BRAVHAS_DEV_AUTH_BYPASS` | bypass de desenvolvimento; deve permanecer `false` em Quality/ambientes reais |
| `NODE_ENV` | ambiente padrão do Node/Next.js |

Nunca versione credenciais reais.

## Banco e migrations

O histórico em `prisma/migrations` é a fonte de evolução do banco. O repositório não admite atalhos destrutivos para obter um estado verde.

Fluxo suportado:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npx prisma migrate status
```

Não usar como procedimento de correção:

- `prisma migrate reset` em dados relevantes;
- `prisma db push --accept-data-loss`;
- reescrever ou apagar migrations já integradas.

O Quality valida também um PostgreSQL vazio: migrations → seed TEST → migration status.

## Autenticação e sessão

A autenticação é server-backed. O browser não usa `localStorage` como fonte de verdade.

A sessão utiliza:

- token aleatório criptograficamente seguro;
- hash SHA-256 persistido no banco, não o token raw;
- cookie `httpOnly`;
- `sameSite=lax`;
- `secure` em produção;
- expiração e revogação;
- logout com invalidação de sessão.

`/api/auth/session` é a fonte de validação de sessão para o client. Rotas/páginas sensíveis continuam exigindo autorização server-side.

## Multi-tenancy

`companyId` e ator devem ser derivados da sessão no servidor. Parâmetros enviados pelo browser não são fonte confiável de tenant ou autoria.

Os E2E mantêm dois tenants sintéticos e testam IDs reais estrangeiros para evitar falso isolamento baseado somente em UUID inexistente.

## RBAC RH/DP

Perfis profissionais modelados no repositório incluem:

- CEO;
- Head Administrativo;
- Gestor RH/DP;
- Analista de RH;
- Analista de DP;
- Assistente RH/DP;
- Gestor de Setor;
- Auditoria / Consulta.

OWNER/ADMIN permanecem papéis técnicos master dentro do próprio tenant.

Gestor de Setor é limitado pelo vínculo funcional (`UserEmployeeLink`) ao próprio colaborador e subordinados diretos quando a política de escopo se aplica.

## Testes E2E

As fixtures em `scripts/e2e-seed.ts` são exclusivamente sintéticas e recusam execução fora de TEST/HOMOLOGATION.

Scripts principais:

```bash
npm run e2e:seed
npm run test:e2e:auth
npm run test:e2e:security
npm run test:e2e:mobile
```

Cobertura browser inclui:

- login/logout;
- cookie/sessão;
- sessão expirada e revogada;
- token inválido;
- direct URL protection;
- cross-tenant com IDs válidos;
- RBAC negativo;
- Gestor de Setor;
- actor/tenant spoofing;
- mobile product smoke.

## Quality

`.github/workflows/quality.yml` executa gates determinísticos para:

- `npm ci`;
- production dependency audit fail-closed;
- Prisma validate/generate;
- migration safety;
- security regression;
- migrate deploy;
- seed;
- TypeScript;
- lint;
- build;
- fresh database;
- authenticated E2E;
- cross-tenant/RBAC negative E2E;
- mobile product smoke.

Não mascarar falhas com `|| true`, remoção de assertions ou redução de gates.

## Segurança HTTP

`next.config.ts` aplica headers defensivos globais, incluindo proteção contra MIME sniffing/frame embedding e políticas de referrer/permissions/cross-origin. CSP deve ser introduzida apenas com política testada que não dependa de `unsafe-eval` em produção e não quebre os scripts do Next.js.

## Repository Ready x Production Ready

Um Quality verde comprova o estado do código/repositório, não o ambiente de produção.

Ainda exigem evidência externa antes de declarar Production Ready, conforme o ambiente adotado:

- infraestrutura real;
- banco/storage de produção;
- secrets;
- domínio, DNS e TLS;
- e-mail transacional;
- observabilidade;
- backup verificado;
- restore testado;
- DR exercitado;
- homologação humana;
- deploy/carga real.

## Governança da `main`

O repositório espera PR + Quality verde antes de merge. Se branch protection não estiver habilitada no GitHub, isso permanece um blocker de governança e deve ser configurado no nível do repositório, sem ser falsamente tratado como resolvido pelo código.
