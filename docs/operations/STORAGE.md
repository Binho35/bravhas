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

## Homologação obrigatória do futuro adapter produtivo

- [ ] upload autorizado;
- [ ] leitura autorizada;
- [ ] exclusão autorizada;
- [ ] Alpha não lê objeto Beta;
- [ ] Alpha não exclui objeto Beta;
- [ ] metadata consistente;
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
