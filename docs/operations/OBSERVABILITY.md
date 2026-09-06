# BravHAS — Observabilidade mínima

## Estado

**PARCIAL / IMPLEMENTADO INTERNAMENTE.** O repositório possui liveness, readiness, request ID e logging operacional estruturado. Nenhum serviço externo/pago de monitoramento ou alerta foi configurado.

## Liveness

`GET /api/health`

Objetivo: provar apenas que o processo HTTP está vivo.

- responde 200 quando a aplicação atende a requisição;
- não consulta banco nem storage;
- devolve `X-Request-ID`;
- usa `Cache-Control: no-store`.

Banco e storage pertencem ao readiness. Essa separação evita reinicializações indevidas quando uma dependência externa está indisponível.

## Readiness

`GET /api/readiness`

Objetivo: declarar se a instância pode receber tráfego produtivo.

O endpoint verifica:

- PostgreSQL;
- health do storage documental;
- persistência e segurança produtiva do adapter de storage quando o ambiente é produção.

Produção é fail-closed: provider ausente, desconhecido, local ou não homologado mantém 503/`blocked`.

A resposta inclui estado sanitizado das dependências, duração e `X-Request-ID`, sem connection string ou credencial.

## Request / correlation ID

Implementação mínima em `lib/observability.ts`:

- aceita `x-request-id` apenas se respeitar formato restrito;
- caso contrário gera UUID server-side;
- propaga o ID em health/readiness;
- request ID não participa de autenticação ou autorização.

Propagação global por todas as rotas ainda não foi implementada. Estado: `PARTIAL`.

## Logging estruturado

`logOperationalEvent()` emite JSON com:

- timestamp;
- aplicação;
- operação;
- request ID;
- status;
- duração;
- error code;
- referência de tenant/user apenas como hash curto quando explicitamente fornecida.

Nunca registrar:

- password;
- token;
- cookie;
- authorization header;
- secret;
- connection string;
- conteúdo documental;
- PII desnecessária.

`logServerFailure()` omite stack/message de erro em produção e sanitiza diagnósticos em ambientes não produtivos.

## Erros por dependência

### Banco

Readiness retorna `database: unavailable` sem detalhe de conexão. Alerta externo ainda depende da infraestrutura escolhida.

### Storage

`DocumentStorage.health()` fornece provider, persistência e capacidade produtiva. Storage inválido impede readiness verde.

### Aplicação

Erros públicos devem utilizar mensagens sanitizadas e status HTTP coerente; detalhes ficam no diagnóstico server-side sem segredo.

## Evidência externa ainda necessária

- monitor sintético de health/readiness;
- alerta de erro/indisponibilidade;
- retenção de logs definida;
- acesso aos logs restrito;
- teste real de alerta;
- simulação controlada de falha de banco/storage;
- responsável operacional definido.

Até essas evidências existirem, Observabilidade permanece `PARCIAL` e não `COMPROVADO EM PRODUÇÃO`.
