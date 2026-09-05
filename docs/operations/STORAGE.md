# BravHAS — Storage documental

## Estado atual

O adapter efetivamente usado em homologação é filesystem local em `.bravhas/uploads` e é bloqueado em produção. Produção permanece **BLOQUEADA** até provider privado persistente ser configurado e homologado.

## Contrato vendor-neutral

`modules/hrdp/storage/documentStorage.ts` define `save`, `read`, `delete` e `health`, com escopo obrigatório `companyId + employeeId`, `storageKey` opaco, metadata de nome/MIME/tamanho e política centralizável de tamanho/MIME.

O contrato não escolhe fornecedor e pode ser implementado por S3-compatible, Cloudflare R2, Vercel Blob ou equivalente privado.

## Regras de segurança

- autorização no servidor antes de qualquer operação de storage;
- tenant derivado da sessão, nunca de `companyId` do browser;
- namespace por tenant e recurso;
- leitura/exclusão rejeitam referência estrangeira;
- sem URL pública permanente para documentos sensíveis;
- MIME e tamanho validados antes da persistência;
- falhas de metadata/upload precisam de compensação segura;
- logs não registram conteúdo do arquivo ou credencial do provider.

## Homologação obrigatória do adapter produtivo

- [ ] upload autorizado;
- [ ] leitura autorizada;
- [ ] exclusão autorizada;
- [ ] Alpha não lê objeto Beta;
- [ ] Alpha não exclui objeto Beta;
- [ ] metadata consistente;
- [ ] limite de tamanho e MIME aplicados;
- [ ] arquivo vazio rejeitado;
- [ ] falha de upload não cria metadata órfã;
- [ ] falha posterior ao upload possui compensação definida;
- [ ] health do provider funciona;
- [ ] readiness só fica verde com provider saudável;
- [ ] backup/versionamento documentado;
- [ ] credenciais fora do repositório e com privilégio mínimo.

Nenhuma contratação, conexão de provider ou migração de arquivos é executada por este documento.
