# Governança MASTER

CEO e Head Administrativo são categorias de negócio com acesso MASTER. O sistema também preserva OWNER/ADMIN como papéis técnicos de recuperação e administração.

Somente MASTER pode administrar a matriz de perfis e associar acessos. Um perfil MASTER não pode ser reduzido por uma combinação acidental de checkboxes.

Para evitar escalada de privilégio, perfis não-master não recebem `configuracoes` nos seeds. Alterações futuras nessa regra devem ser tratadas como mudança de segurança e auditadas.
