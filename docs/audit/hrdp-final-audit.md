# Auditoria técnica final — RH/DP

## Estado consolidado

- RBAC profissional com MASTER para CEO e Head Administrativo.
- Permissões granulares por módulo e ação.
- Isolamento server-side por `companyId` nas superfícies críticas revisadas.
- Cadastro de colaborador sempre inicia em pré-admissão.
- Admissão exige cadastro funcional mínimo e documentos conferidos.
- Dossiê funcional e documentos protegidos por RBAC.
- Ponto, férias, afastamentos, benefícios, medidas disciplinares, desligamentos e folha com autorização server-side.
- Auditoria persistente nas mutações críticas revisadas.
- Bypass de autenticação em desenvolvimento explicitamente opt-in.
- Motor RBAC valida o perfil dentro da mesma empresa do usuário.
- Escopo de gestor suportado por vínculo explícito `UserEmployeeLink`, limitado ao próprio registro e subordinados diretos.

## Gate técnico

Os PRs de hardening final (#12 e #13) foram consolidados somente após Quality verde.

## Limites da auditoria GitHub

Esta auditoria confirma estrutura de código, migrations e CI estático. Ainda não substitui homologação runtime contra banco real, aplicação das migrations no ambiente alvo, teste funcional em navegador por perfil de acesso, teste de integração com serviços externos nem validação de dados reais.

## Critério para homologação

Antes de produção, executar:

1. `prisma migrate deploy` no banco alvo e validar `UserEmployeeLink` e tabelas RBAC.
2. Seed/configuração dos perfis e permissões por empresa.
3. Vincular usuários Gestor de Setor ao respectivo colaborador.
4. Testar CEO/Head MASTER, RH/DP, Gestor de Setor e perfil consulta.
5. Confirmar que Gestor de Setor não acessa colaborador fora da própria equipe.
6. Validar fluxos de admissão, documentos, ponto, férias, afastamento, medida disciplinar, desligamento e folha.
7. Conferir persistência dos eventos de auditoria.
8. Validar sessão, logout e expiração no ambiente de homologação.

## Conclusão

O desenvolvimento estrutural do RH/DP está apto para a fase de homologação runtime. O aplicativo não deve ser classificado como produção concluída antes da execução dos testes acima no ambiente real.