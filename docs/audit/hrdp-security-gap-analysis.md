# BravHAS RH/DP — Security & Homologation Gap Analysis

## Estado atual

A base funcional do RH/DP está implementada e o Quality do repositório valida Prisma, geração de client, TypeScript e ESLint. A homologação local já comprovou conexão com PostgreSQL, migrations aplicadas, inicialização do app e rotas principais respondendo.

## Gaps críticos antes de declarar produção

1. **Autorização server-side por papel**
   - O `AuthGuard` atual é client-side e possui bypass deliberado em desenvolvimento para `/pessoas`, `/rh` e `/dp`.
   - Server Actions ainda precisam de enforcement centralizado de sessão e role antes de qualquer mutação.

2. **Audit log transversal**
   - Ações sensíveis de RH/DP precisam registrar ator, operação, entidade, registro, timestamp e metadados mínimos.
   - Prioridade: admissão, alteração de ponto, férias, afastamento, benefício, medida disciplinar, desligamento e documentos.

3. **Admissão condicionada a documentação**
   - A ativação de pré-admissão deve possuir regra explícita para documentos obrigatórios e conferência.

4. **Folha**
   - O módulo atual funciona como cockpit operacional. Fechamento/reabertura/exportação persistentes exigem modelo próprio antes de uso como fonte oficial de folha.

5. **Recrutamento e desempenho**
   - Atualmente aproveitam `HrTicket`; é aceitável para MVP interno, mas não representa um ATS/performance engine completo.

6. **Deploy Vercel**
   - O Quality do GitHub é o gate de código principal. O deploy Vercel está falhando por configuração/ambiente externo e deve ser tratado separadamente, sem confundir com falha de TypeScript/Prisma/Lint.

## Critério para validação operacional

O sistema pode avançar para **validação interna controlada** quando:

- `main` estiver com Quality verde;
- bootstrap local estiver idempotente;
- cadastro de colaborador persistir corretamente após seed;
- rotas críticas abrirem sem crash não tratado;
- nenhum fluxo mutável for declarado homologado sem teste real no banco.

## Critério para “finalizado para produção”

Somente após:

- homologação browser + banco dos fluxos críticos;
- autorização server-side implantada;
- audit log implantado nos eventos críticos;
- revisão de dados sensíveis/LGPD;
- estratégia de backup e restauração validada;
- ambiente de produção configurado e health check estável.
