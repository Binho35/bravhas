# Homologação RBAC

Antes de produção:

- [ ] migrations AccessProfile/AccessPermission/UserAccessProfile aplicadas;
- [ ] CEO associado ao perfil CEO e confirmado como MASTER;
- [ ] Head Administrativo associado ao perfil Head Administrativo e confirmado como MASTER;
- [ ] cada profissional associado a exatamente um perfil;
- [ ] Analista RH sem acesso indevido à folha/configurações;
- [ ] Analista DP com rotinas DP e sem configurações de segurança;
- [ ] Assistente sem aprovação/exclusão sensível;
- [ ] Gestor de Setor restrito à operação permitida;
- [ ] Auditoria/Consulta sem mutações;
- [ ] tentativa de URL direta validada no servidor;
- [ ] server actions críticos migrados para `requirePermission`;
- [ ] trilha HrAuditEvent registra alterações de segurança;
- [ ] testes de isolamento entre empresas concluídos.

O RBAC só deve ser decretado finalizado após os server actions críticos usarem a autorização granular; esconder navegação não é controle de acesso.
