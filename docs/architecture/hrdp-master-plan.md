# BravHAS Pessoas — Arquitetura Mestre RH/DP

## Objetivo
Transformar o BravHAS em um núcleo próprio de RH e Departamento Pessoal, mantendo os módulos administrativos existentes e adicionando uma camada de Pessoas com arquitetura modular, auditável, multiempresa e preparada para integração com Universidade BravHas.

## Princípios
- Multiempresa desde a fundação.
- Permissões granulares por ação e escopo.
- Dossiê único do colaborador.
- Linha do tempo funcional e auditoria.
- Workflows de aprovação.
- LGPD por design.
- Integrações desacopladas.
- Universidade como módulo integrado, não acoplado ao domínio de DP.

## Módulos funcionais
1. Dashboard RH/DP
2. Colaboradores
3. Dossiê Digital
4. Admissões
5. Ponto e Jornada
6. Férias
7. Benefícios
8. Folha e Variáveis
9. Atestados e Afastamentos
10. Saúde Ocupacional
11. Medidas Disciplinares
12. Desligamentos
13. Recrutamento e Seleção
14. Cargos, Salários e Estrutura
15. Desempenho, Feedback, 1:1 e PDI
16. Canal RH humano
17. Portal do Colaborador
18. Relatórios e BI
19. Compliance e Auditoria
20. Integrações
21. Universidade BravHas

## Domínios técnicos
- identity
- organization
- people
- employment
- admissions
- attendance
- vacations
- benefits
- payroll
- leaves
- occupational-health
- disciplinary
- terminations
- recruitment
- performance
- communication
- documents
- workflow
- compliance
- audit
- integrations

Cada domínio deve seguir: `domain/`, `application/`, `infrastructure/` e, quando necessário, `presentation/`.

## Árvore alvo
```text
app/
  rh/
  dp/
  colaboradores/
  admissoes/
  ponto/
  ferias/
  beneficios/
  folha/
  afastamentos/
  saude-ocupacional/
  medidas-disciplinares/
  desligamentos/
  recrutamento/
  desempenho/
  canal-rh/
  portal-colaborador/
  relatorios/
  configuracoes/
  api/
modules/
  identity/
  organization/
  people/
  employment/
  admissions/
  attendance/
  vacations/
  benefits/
  payroll/
  leaves/
  occupational-health/
  disciplinary/
  terminations/
  recruitment/
  performance/
  communication/
  documents/
  workflow/
  compliance/
  audit/
  integrations/
docs/
  architecture/
  workflows/
  permissions/
  lgpd/
  integrations/
```

## Perfis e escopos
- OWNER: visão total e configuração.
- ADMIN: administração global delegada.
- HR: RH estratégico e pessoas.
- PAYROLL: rotinas de DP e fechamento.
- MANAGER: somente equipe sob sua gestão e ações autorizadas.
- EMPLOYEE: somente dados e solicitações próprias.
- AUDITOR: leitura de evidências, logs e relatórios autorizados.

Permissões serão separadas de papéis, por exemplo: `employee.read.self`, `employee.read.team`, `attendance.treat.team`, `attendance.close`, `disciplinary.create`, `payroll.variable.write`, `hr.channel.reply`.

## Dossiê do colaborador
A ficha do colaborador será o agregador central para: dados pessoais, vínculo, cargo, salário, jornada, documentos, dependentes, benefícios, ponto, férias, afastamentos, medidas disciplinares, treinamentos, desempenho, movimentações, equipamentos e desligamento.

## Canal RH
Atendimento humano. O sistema deve oferecer conversa privada entre colaborador e RH, fila, responsável, status, prioridade, protocolo, anexos, histórico e SLA interno. Não haverá resposta automática se passando por RH.

## Ordem de execução
### Onda 1 — Fundação
RBAC, estrutura organizacional, People Core, dossiê, auditoria.

### Onda 2 — DP Core
Admissão, ponto, férias, benefícios, afastamentos, folha/variáveis e desligamento.

### Onda 3 — Self-service
Portal do colaborador, solicitações, documentos e Canal RH.

### Onda 4 — RH Estratégico
Recrutamento, desempenho, feedback, PDI, cargos e salários.

### Onda 5 — Integrações e BI
Secullum, folha/contabilidade, Universidade BravHas e dashboards executivos.

## Critério de conclusão do MVP
O MVP está apto para operação quando for possível cadastrar colaborador, manter dossiê, admitir, tratar ponto, controlar férias/benefícios/afastamentos, registrar medidas disciplinares, desligar, atender Canal RH e auditar todas as ações sensíveis.