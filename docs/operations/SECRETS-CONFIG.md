# BravHAS — Secrets & Configuration Inventory

## Regra

Este inventário contém apenas NOMES, finalidade e comportamento esperado. Nenhum valor de secret deve ser versionado ou copiado para logs.

## Banco

### DATABASE_URL

- classificação: `REQUIRED`;
- finalidade: conexão principal da aplicação;
- ambientes: todos;
- ausência: aplicação deve falhar na inicialização;
- rotação: responsabilidade da operação/infraestrutura.

### DATABASE_DIRECT_URL

- classificação: `REQUIRED` para conexão direta/migrations conforme arquitetura atual;
- finalidade: Prisma/PostgreSQL direto;
- ambientes: homologação/produção e ambientes que executam migrations;
- ausência: preflight produtivo bloqueia;
- rotação: operação/infraestrutura.

### SHADOW_DATABASE_URL

- classificação: `OPTIONAL` no runtime; necessária apenas em fluxos Prisma que exijam shadow database;
- não usar banco produtivo como shadow database.

## Ambiente

### BRAVHAS_ENV

- classificação: configuração não secreta;
- valores operacionais: TEST, HOMOLOGATION, PRODUCTION;
- produção deve ser explicitamente identificável.

### NODE_ENV

- classificação: configuração não secreta;
- produção deve usar `production`.

### BRAVHAS_DEV_AUTH_BYPASS

- classificação: `DEVELOPMENT_ONLY`;
- produção: `FORBIDDEN` quando true;
- fallback: false.

## Storage

### BRAVHAS_DOCUMENT_STORAGE_PROVIDER

- classificação: `PRODUCTION_ONLY` até existir provider real;
- finalidade: identificar adapter documental selecionado;
- `local` é proibido em produção;
- provider desconhecido deve manter readiness bloqueado.

Credenciais específicas do futuro provider ainda não estão definidas porque nenhum fornecedor foi selecionado.

Estado:

`BUSINESS/INFRA DECISION REQUIRED`

Quando um provider for aprovado, documentar apenas os NOMES das credenciais, escopo mínimo e responsável pela rotação.

## Restore

### BRAVHAS_RESTORE_ALLOWED

- classificação: guarda operacional, não secret;
- fallback: false;
- produção: restore permanece proibido mesmo se true;
- execução não produtiva exige também confirmação explícita no comando.

## Post-deploy smoke

### BRAVHAS_BASE_URL

- configuração do alvo; não é secret.

### BRAVHAS_SMOKE_LOGIN_ID

- credencial de conta técnica de smoke;
- tratar como informação de acesso restrito.

### BRAVHAS_SMOKE_PASSWORD

- `SECRET`;
- nunca versionar valor;
- deve pertencer a conta técnica de menor privilégio compatível com o smoke;
- rotação: operação/segurança.

### BRAVHAS_SMOKE_FOREIGN_DOCUMENT_ID

- opcional;
- usar somente ID sintético/controlado de outro tenant de homologação para teste negativo;
- nunca publicar identificador real sensível desnecessariamente.

## Fallback policy

Configuração obrigatória ausente em produção deve resultar em `FAIL CLOSED`, nunca em fixture, memória, filesystem local ou credencial default.

## Responsabilidade

Responsáveis nominais e periodicidade de rotação ainda não foram definidos no repositório:

`BUSINESS/OPERATIONS DECISION REQUIRED`
