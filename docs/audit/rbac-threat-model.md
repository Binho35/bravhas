# Threat model — acessos

Riscos cobertos pela arquitetura:

- acesso por URL direta: autorização deve ocorrer no servidor;
- escalada por alteração de formulário: ação é validada pelo guard server-side;
- perfil de outra empresa: consultas de administração exigem companyId do ator;
- remoção acidental do acesso master: MASTER não depende da matriz de checkboxes;
- usuário desativado/sessão expirada: sessão server-side já rejeita o ator;
- acesso operacional excessivo: defaults seguem menor privilégio.

Risco residual de rollout: server actions legados ainda precisam migrar do guard genérico para o guard granular. Esse item bloqueia a declaração de homologação de segurança completa.
