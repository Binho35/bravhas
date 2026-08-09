BravHAS — Development Log

Registro oficial e contínuo do desenvolvimento do BravHAS.

09/08/2026 — Autenticação, RBAC e Segurança de Rotas

Objetivo da sessão

Consolidar a camada de autenticação e controle de acesso do BravHAS, validar o comportamento em ambiente local e em produção e estabelecer uma primeira versão funcional de RBAC (Role-Based Access Control).

Horas trabalhadas

Horas oficiais da sessão: 8 horas.

O total de 8 horas foi informado e confirmado pelo responsável pelo projeto como o registro oficial de desenvolvimento da sessão de 09/08/2026.

Desenvolvimento realizado

Durante a sessão foram implementados, ajustados e validados:

autenticação do usuário;

login corporativo;

sessão autenticada;

logout;

identificação do usuário autenticado;

identificação do perfil do usuário;

armazenamento da sessão;

usuários de teste;

perfis e permissões;

controle de visibilidade da Sidebar;

PermissionGuard;

proteção de rotas;

validação de permissões por recurso;

testes em ambiente local;

publicação no GitHub;

deploy no Vercel;

testes do comportamento em produção.

Usuário de teste

Foi utilizado um usuário específico para validação do perfil financeiro:

Login: stoccoFinanceiro01
Perfil: FINANCIAL

O usuário foi utilizado para validar se o sistema consegue restringir o acesso de acordo com o perfil.

RBAC — Role-Based Access Control

Foi estabelecida uma primeira camada funcional de controle de acesso.

O modelo passou a trabalhar com duas camadas:

1. Controle de visibilidade

O usuário visualiza na Sidebar somente os módulos correspondentes ao seu perfil.

2. Controle de rota

O usuário também é impedido de permanecer em uma rota para a qual não possui permissão, mesmo quando tenta acessar diretamente pela URL.

Esse segundo mecanismo foi validado através de tentativa de acesso direto ao módulo de Obrigações utilizando o perfil Financeiro.

Rotas existentes mapeadas

Foi realizado um levantamento das páginas realmente existentes no projeto.

Autenticação

/login

Centro de Controle

/

Financeiro

/financeiro
/financeiro/nova
/financeiro/[id]
/financeiro/fluxo-caixa

Obrigações

/obrigacoes
/obrigacoes/nova
/obrigacoes/[id]

Não foram considerados módulos que aparecem apenas visualmente na Sidebar, mas que ainda não possuem páginas funcionais.

Proteção de rotas

Financeiro

As rotas financeiras existentes foram protegidas utilizando:

<PermissionGuard
  resource="FINANCIAL"
  action="VIEW"
>

Rotas:

/financeiro
/financeiro/nova
/financeiro/[id]
/financeiro/fluxo-caixa

Obrigações

As rotas de Obrigações existentes foram protegidas utilizando:

<PermissionGuard
  resource="OBLIGATIONS"
  action="VIEW"
>

Rotas:

/obrigacoes
/obrigacoes/nova
/obrigacoes/[id]

Testes realizados

Teste local

O fluxo de autenticação foi executado no ambiente local.

Foi validado:

carregamento da aplicação;

tela de login;

autenticação;

redirecionamento;

acesso às áreas autorizadas;

logout;

retorno à tela de login.

Teste de produção

Ambiente:

bravhas.vercel.app

Foi realizado login utilizando o perfil:

stoccoFinanceiro01

Resultado observado:

autenticação realizada;

perfil Financeiro identificado;

Sidebar limitada às áreas financeiras;

acesso ao Financeiro permitido;

acesso ao Fluxo de Caixa permitido;

módulo Obrigações não exibido na Sidebar;

tentativa de acesso direto a rota não autorizada bloqueada após aplicação do PermissionGuard.

Qualidade técnica

Durante as alterações realizadas na sessão, os arquivos foram validados no VS Code.

Resultado final das alterações:

0 Problems

Esse critério foi utilizado antes das publicações das alterações.

Git

Commits relevantes da sessão

2dea2ba

feat: adiciona logout e identificacao do usuario autenticado

cadb4f3

fix: protege rota de obrigacoes por permissao

5ca2c75

fix: protege rotas internas de obrigacoes

58155da

fix: protege rotas internas do financeiro

Último push registrado:

5ca2c75..58155da main -> main

Deploy

Repositório:

https://github.com/Binho35/bravhas

Ambiente de produção:

bravhas.vercel.app

Status:

Publicado e testado

Marco do projeto

RBAC MVP — CONCLUÍDO

Ao final da sessão de 09/08/2026, o BravHAS passou a possuir uma fundação funcional de controle de acesso composta por:

autenticação;

sessão;

login corporativo;

logout;

identificação do usuário;

identificação do perfil;

permissões;

Sidebar condicionada por perfil;

proteção de rotas;

bloqueio de acesso direto a rotas não autorizadas;

validação local;

validação em produção;

integração GitHub → Vercel.

O controle de acesso deixou de ser apenas uma característica visual da interface e passou a fazer parte do comportamento operacional da aplicação.

Situação funcional ao final da sessão

Área

Situação

Centro de Controle

Operacional

Login

Operacional

Autenticação

Operacional

Logout

Operacional

RBAC

MVP concluído

Financeiro

Operacional / em evolução

Fluxo de Caixa

Operacional / em evolução

Obrigações

Operacional / em evolução

Pessoas

Ainda sem página funcional

Departamento Pessoal

Ainda sem página funcional

Agenda

Ainda sem página funcional

Indicadores

Ainda sem página funcional

Documentos

Ainda sem página funcional

Próxima sessão

A próxima sessão deverá continuar a evolução funcional do BravHAS utilizando a fundação de autenticação e permissões já estabelecida.

Diretrizes:

preservar o RBAC já validado;

trabalhar somente com caminhos reais existentes no projeto;

não assumir pastas ou arquivos que não existam;

criar novos módulos somente quando necessário;

definir a permissão correspondente para novas áreas;

validar cada alteração com 0 Problems;

salvar no Git;

publicar no Vercel;

validar o comportamento em produção.

Registro histórico

09/08/2026

Esta sessão representa um marco importante no desenvolvimento do BravHAS.

O sistema passou a reconhecer o usuário autenticado, identificar seu perfil e controlar o acesso às áreas administrativas de acordo com permissões.

O primeiro perfil restrito testado em produção foi o perfil Financeiro.

O RBAC MVP foi validado tanto pela experiência visual da Sidebar quanto pelo bloqueio de acesso direto às rotas protegidas.

Estado de encerramento:

RBAC MVP: CONCLUÍDO
Horas da sessão: 8 horas
Git: 58155da
Deploy: Vercel
Qualidade: 0 Problems