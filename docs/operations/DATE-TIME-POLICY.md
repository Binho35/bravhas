# BravHAS — Date / Time Policy

## Objetivo

Evitar mudança silenciosa de dia por timezone sem introduzir biblioteca externa ou refatoração ampla.

## Classificações

### DATE_ONLY

Representa um dia civil de negócio; horário e timezone não fazem parte do significado.

- `HrEmployee.hireDate`
- `HrEmployee.terminationDate`
- `Obligation.dueDate`
- `FinancialAccount.issueDate`
- `FinancialAccount.dueDate`
- `CashFlowOpeningBalance.asOfDate`

Regra de transporte: preferir `YYYY-MM-DD`. Quando um `DateTime` é usado como persistência por legado de schema, consumidores de data civil devem preservar a parte `YYYY-MM-DD` em vez de converter meia-noite UTC para horário local.

### UTC_INSTANT

Representa um instante efetivo e pode ser ordenado cronologicamente entre fusos.

- `FinancialAccount.paymentDate` no comportamento atual de baixa
- `FinancialTransaction.performedAt`
- `HrAuditEvent.createdAt`
- `Obligation.completedAt`
- campos `createdAt` / `updatedAt`
- timestamps de autenticação e sessão

Regra: persistir como `DateTime`, serializar em ISO 8601 e converter para timezone de apresentação apenas na UI.

### BUSINESS_LOCAL_DATETIME

Não há campo crítico do escopo do Ciclo 7 que exija hoje um datetime local sem offset como fonte autoritativa. Se surgir agendamento com hora civil de uma unidade, o timezone da unidade deverá ser armazenado explicitamente antes de adotar esta categoria.

## Correção material do Ciclo 7

`calculateCashFlow` tratava `dueDate` por `new Date(...).getFullYear()/getMonth()/getDate()`. Um `DATE_ONLY` serializado em UTC poderia cair no dia anterior em timezone negativo.

O cálculo agora:

- trata `startDate`, `endDate` e `dueDate` como data civil;
- preserva a chave `YYYY-MM-DD`;
- usa horário local apenas para determinar o dia de hoje;
- não altera timestamps reais de pagamento, recebimento, estorno ou auditoria.

## Não realizado neste ciclo

- nenhuma biblioteca de datas adicionada;
- nenhuma migration apenas por timezone;
- nenhuma conversão em massa de dados históricos;
- nenhuma alteração de fuso baseada em suposição de infraestrutura.
