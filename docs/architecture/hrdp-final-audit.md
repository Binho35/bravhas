# Auditoria final — BravHAS RH/DP

Status: pré-homologação

## Critérios obrigatórios antes de declarar concluído

- [ ] Build de produção aprovado
- [ ] Prisma validate aprovado
- [ ] Prisma generate aprovado
- [ ] TypeScript aprovado
- [ ] ESLint aprovado
- [ ] Seed/bootstrap executado com sucesso em ambiente local limpo
- [ ] Empresa ativa, unidade e departamentos-base criados sem duplicidade
- [ ] Cadastro de colaborador validado ponta a ponta
- [ ] Dossiê do colaborador validado
- [ ] Documentos do colaborador validados
- [ ] Admissão validada
- [ ] Recrutamento validado
- [ ] Desempenho validado
- [ ] Canal RH validado
- [ ] Ponto/jornada validado
- [ ] Férias validadas
- [ ] Benefícios validados
- [ ] Afastamentos validados
- [ ] Medidas disciplinares validadas
- [ ] Desligamento validado
- [ ] Estrutura organizacional validada
- [ ] Relatórios validados
- [ ] Cockpit de folha validado
- [ ] Permissões e autenticação revisadas
- [ ] Tratamento de erro revisado
- [ ] Dados sensíveis e exposição de rotas revisados
- [ ] Logs/auditoria operacional revisados
- [ ] Deploy de produção validado ou causa externa documentada

## Pendências arquiteturais conhecidas

1. Permissões por função ainda precisam de enforcement completo nas server actions.
2. O bypass de AuthGuard em desenvolvimento deve permanecer restrito a desenvolvimento.
3. Recrutamento e desempenho usam HrTicket como estrutura transitória; avaliar modelos dedicados antes de expansão comercial.
4. Folha funciona como cockpit operacional; fechamento persistente, reabertura e exportação devem ser tratados como evolução própria.
5. Ainda não existe um modelo dedicado de audit log transversal.
6. A admissão deve ser revisada para impedir ativação indevida quando documentos obrigatórios estiverem pendentes, se essa for a política operacional adotada.

## Regra de encerramento

O produto só deve receber status "finalizado" depois da homologação funcional dos fluxos acima e da auditoria de segurança/arquitetura. Build verde isoladamente não é critério suficiente.
