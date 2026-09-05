# BravHAS — Observabilidade mínima

## Estado

**PARCIAL / DOCUMENTADO.** O repositório possui `/api/health` e `/api/readiness`; nenhum serviço pago de monitoramento foi configurado neste ciclo.

## Sinais mínimos

### Health

`GET /api/health`

Objetivo: provar que a aplicação está viva e que o PostgreSQL responde.

- 200: aplicação e banco respondem;
- 503: banco indisponível/degradação;
- mensagens de erro de banco devem permanecer sanitizadas fora de desenvolvimento.

### Readiness

`GET /api/readiness`

Objetivo: impedir promoção produtiva quando pré-condições obrigatórias não estão comprovadas.

O endpoint permanece fail-closed em produção enquanto o BravHAS não possui provider produtivo de documentos configurado.

## Logs

Regras obrigatórias:

- não registrar connection strings, tokens, cookies, senhas ou payloads documentais;
- não despejar objetos de erro completos em handlers públicos quando puderem conter dados sensíveis;
- preferir mensagem operacional sanitizada + código/identificador de evento;
- erros de banco e storage devem ser distinguíveis operacionalmente sem vazar detalhes ao cliente.

## Request / correlation ID

Estado: **NÃO IMPLEMENTADO GLOBALMENTE**.

Proposta para próximo hardening, se necessário:

- aceitar `x-request-id` apenas como correlação não confiável ou gerar UUID server-side;
- devolver o identificador em resposta/headers quando seguro;
- propagar o mesmo ID nos logs server-side;
- nunca usar request ID como autenticação/autorização.

Não é P0 para homologação atual, mas é recomendado antes de operação com suporte multi-tenant em escala.

## Erros por domínio

### Aplicação

- resposta ao cliente: mensagem sanitizada;
- log: contexto mínimo (rota, operação, request ID futuro, tenant ID quando necessário e sem PII excessiva).

### Banco

- health/readiness retornam `database: unavailable` sem connection string;
- alertas externos devem ser configurados no provider escolhido antes de produção.

### Storage

- provider futuro deve implementar `health()` no contrato `DocumentStorage`;
- falhas de upload/leitura/exclusão devem manter tenant e autorização no servidor;
- readiness produtivo só pode ficar verde quando o adapter real estiver configurado e homologado.

## Evidência para produção

- health monitorado externamente;
- readiness monitorado externamente;
- alerta de erro/indisponibilidade configurado;
- retenção de logs definida;
- acesso a logs restrito;
- teste de alerta realizado;
- erro de banco simulado/observado em ambiente controlado;
- erro de storage simulado/observado em ambiente controlado;
- responsável operacional definido.

Sem essas evidências, Observabilidade permanece `PARCIAL`.
