# BravHAS — Storage documental

## Estado atual

O adapter efetivamente implementado para desenvolvimento/homologação é filesystem local em `.bravhas/uploads`. Ele é explicitamente bloqueado em produção.

Produção permanece **BLOQUEADA** até existir provider privado persistente, adapter homologado e credenciais configuradas fora do repositório.

## Contrato vendor-neutral

`modules/hrdp/storage/documentStorage.ts` define:

- `save`;
- `read`;
- `delete`;
- `health`;
- `StorageError` tipado;
- `StorageHealth`;
- metadata de nome, MIME, tamanho e checksum SHA-256;
- escopo obrigatório `companyId + employeeId`.

O contrato não escolhe fornecedor e pode ser implementado por S3-compatible, Cloudflare R2, Vercel Blob ou equivalente privado.

## Runtime / provider selection

`BRAVHAS_DOCUMENT_STORAGE_PROVIDER` identifica o provider esperado.

Comportamento:

- não produção sem valor explícito: `local`;
- produção sem provider: `unconfigured` e readiness bloqueado;
- `local` em produção: bloqueado;
- provider desconhecido/não implementado: bloqueado;
- nenhum fallback silencioso para memória, fixture ou filesystem temporário em produção.

## Segurança de upload

A validação server-side cobre:

- arquivo vazio;
- limite de 5 MB;
- MIME permitido;
- extensão compatível com MIME;
- assinatura real do conteúdo para PDF, JPEG, PNG e WEBP;
- filename sanitizado;
- caracteres/path inseguro;
- checksum SHA-256.

Atributo `accept` do browser é apenas UX; a decisão de segurança ocorre no servidor.

## Checksum e evidência persistida

`validateDocumentUpload()` calcula SHA-256 do conteúdo real antes da persistência.

No fluxo atual de upload:

1. `DocumentStorage.save()` devolve `checksumSha256`;
2. a criação de `HrEmployeeDocument` e o `HrAuditEvent` ocorrem na mesma transação Prisma;
3. o `HrAuditEvent.metadata` persiste `mimeType`, `size` e `checksumSha256` quando houve upload real.

Portanto:

`CHECKSUM PERSISTED = YES`

A persistência ocorre no audit trail transacional, não em uma coluna dedicada de `HrEmployeeDocument`.

Não existe justificativa, neste momento, para migration apenas para duplicar essa evidência. Um futuro adapter produtivo deve preservar metadata/checksum e sua homologação deve provar integridade de leitura. Se a política operacional exigir consulta direta do checksum no registro documental, isso deverá ser tratado como requisito explícito antes de criar nova coluna.

## Escopo e traversal

O adapter local valida:

- IDs de tenant/recurso;
- namespace `companyId/employeeId`;
- `storageKey` local esperado;
- `..` e caminhos absolutos;
- resolução final dentro do root de uploads;
- leitura/exclusão apenas no escopo informado.

A rota de leitura deriva `companyId` da sessão e `employeeId` do registro tenant-scoped antes de chamar o adapter.

## Consistência

No fluxo de criação documental:

1. arquivo é validado e salvo;
2. metadata do documento + audit log são gravados na mesma transação Prisma;
3. se a transação falhar após o upload, o arquivo é excluído em compensação best-effort;
4. falha da compensação é registrada de forma sanitizada para intervenção operacional.

No fluxo de verificação documental, atualização + audit log são atômicos.

## Contract conformance interno

O `Quality` executa teste do adapter local contra o contrato mínimo:

- save;
- read;
- delete;
- checksum estável entre save/read;
- integridade dos bytes;
- isolamento de tenant em read/delete;
- health;
- confirmação de que o adapter local não é persistente nem production-safe.

Esse teste serve como baseline de comportamento do contrato. Ele **não** transforma filesystem local em provider de produção e não substitui homologação do futuro provider real.

## Homologação obrigatória do futuro adapter produtivo

- [ ] upload autorizado;
- [ ] leitura autorizada;
- [ ] exclusão autorizada;
- [ ] Alpha não lê objeto Beta;
- [ ] Alpha não exclui objeto Beta;
- [ ] metadata consistente;
- [ ] checksum/integridade consistente após leitura;
- [ ] limite de tamanho/MIME aplicado;
- [ ] assinatura de conteúdo validada ou proteção equivalente;
- [ ] arquivo vazio rejeitado;
- [ ] path/key normalization segura;
- [ ] falha de upload não cria metadata órfã;
- [ ] falha posterior ao upload possui compensação;
- [ ] health real do provider;
- [ ] readiness verde somente com provider saudável/persistente;
- [ ] backup/versionamento documentado;
- [ ] credenciais fora do repositório e com privilégio mínimo.

Estado produtivo: `EXTERNAL BLOCKER — PROVIDER NOT SELECTED/CONFIGURED`.
