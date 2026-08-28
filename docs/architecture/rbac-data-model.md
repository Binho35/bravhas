# Modelo de dados RBAC

`AccessProfile`: perfil profissional por empresa, flags master/system/active.

`AccessPermission`: uma linha por perfil + recurso, contendo as seis capacidades.

`UserAccessProfile`: vínculo 1:1 entre usuário e perfil profissional.

O vínculo 1:1 evita composição ambígua de perfis nesta fase. Caso o produto evolua para múltiplos perfis simultâneos, a política de resolução deverá ser definida explicitamente antes de alterar a cardinalidade.
