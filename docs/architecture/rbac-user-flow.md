# Fluxo MASTER de configuração

1. MASTER acessa `/rh/configuracoes`.
2. Em `/rh/configuracoes/perfis`, revisa a matriz do perfil profissional.
3. Marca/desmarca ações por módulo e salva.
4. Em `/rh/configuracoes/acessos`, associa cada usuário ao perfil desejado.
5. Na execução de uma ação, o servidor resolve sessão, empresa, perfil, recurso e permissão.
6. Se não houver permissão explícita, a operação é negada.

CEO e Head Administrativo aparecem como MASTER e não usam restrições da matriz.
