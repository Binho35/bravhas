# BravHAS — Backup & Restore Runbook

## Status de evidência

Use apenas estes estados:

- `DOCUMENTADO`: procedimento existe no repositório;
- `CONFIGURADO`: infraestrutura real configurada e auditada;
- `EXECUTADO`: backup real executado com evidência;
- `RESTAURADO`: restore real concluído em ambiente isolado;
- `COMPROVADO`: backup + restore + validações aprovadas e evidenciadas.

Estado atual do BravHAS neste documento: **DOCUMENTADO**. Nenhuma infraestrutura externa é presumida.

## Política proposta

A política deve ser validada pela governança antes de produção.

- banco PostgreSQL: backup automatizado diário, com capacidade de recuperação point-in-time quando o provider escolhido oferecer;
- documentos: versionamento/replicação conforme recursos do object storage contratado;
- retenção sugerida: 30 dias para backups diários e pelo menos 12 checkpoints mensais para necessidade administrativa, sujeita a LGPD e política de retenção da BravSystems;
- criptografia: em trânsito e em repouso;
- acesso: conta de serviço mínima, sem credencial compartilhada;
- exclusões: nunca apagar backup para “liberar espaço” sem política de retenção aprovada.

## RPO e RTO propostos

Estes valores são **propostas**, não SLA aprovado:

- RPO alvo inicial: até 24 horas enquanto houver apenas backup diário; reduzir quando houver PITR comprovado;
- RTO alvo inicial: até 4 horas para restauração técnica em incidente crítico, condicionado ao provider, volume e equipe disponível.

A produção só pode declarar RPO/RTO após exercício real cronometrado.

## Procedimento de backup

1. identificar ambiente, banco, storage e versão da aplicação;
2. registrar timestamp, commit SHA e responsável pela execução;
3. executar mecanismo oficial do provider de banco sem expor connection string em log;
4. registrar identificador do backup/snapshot;
5. confirmar integridade/status pelo provider;
6. para documentos, confirmar que objetos e metadata fazem parte da política de proteção;
7. armazenar evidência operacional sem copiar secrets para o repositório.

## Procedimento de restore

Nunca testar restore sobre produção.

1. provisionar destino isolado e descartável;
2. restaurar o backup selecionado;
3. configurar aplicação de homologação para o banco restaurado usando secrets do ambiente;
4. executar `npx prisma migrate status` sem migration destrutiva;
5. validar autenticação, tenant isolation e contagens básicas;
6. validar Financeiro, Obrigações, Pessoas e metadata documental;
7. validar acesso a objetos documentais quando o storage produtivo existir;
8. registrar início/fim do exercício para medir RTO;
9. comparar timestamp do último dado recuperado para medir RPO observado;
10. destruir o ambiente isolado conforme política de segurança após retenção da evidência.

## Checklist de aprovação de restore

- [ ] origem do backup identificada;
- [ ] restore executado em ambiente isolado;
- [ ] banco inicia sem corrupção aparente;
- [ ] migrations em estado esperado;
- [ ] login funcional;
- [ ] Tenant Alpha não acessa Tenant Beta;
- [ ] Financeiro íntegro;
- [ ] Obrigações íntegras;
- [ ] Pessoas íntegras;
- [ ] documentos e metadata íntegros;
- [ ] objetos do storage acessíveis pelo tenant correto;
- [ ] RPO observado registrado;
- [ ] RTO observado registrado;
- [ ] evidências preservadas;
- [ ] resultado aprovado por responsável autorizado.

## Evidência mínima para produção

Para mudar o status para `COMPROVADO`, exigir no mínimo:

- identificação do provider e ambiente;
- timestamp do backup;
- identificador do backup/snapshot;
- timestamp do restore;
- ambiente de restore;
- resultado das verificações pós-restore;
- RPO observado;
- RTO observado;
- responsável e aprovação.

Sem isso, o item permanece no máximo `DOCUMENTADO` ou `CONFIGURADO`.
