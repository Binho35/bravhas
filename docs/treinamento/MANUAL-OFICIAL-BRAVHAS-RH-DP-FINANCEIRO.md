# BravHAS — Manual Oficial de Treinamento

**RH, Departamento Pessoal e Financeiro**  
**Versão 1.0 — Setembro de 2026**  
**Uso interno — BravSystems**

> Este arquivo é a fonte versionável do Manual Oficial de Treinamento do BravHAS. O PDF publicado deve ser regenerado a partir desta base sempre que os fluxos funcionais forem alterados durante homologação ou evolução do produto.

## Padrão visual oficial

- Fundo predominantemente branco.
- Azul-marinho BravHAS para títulos e elementos estruturais.
- Dourado apenas como destaque institucional.
- Cinza claro e azul muito claro para caixas, tabelas e apoio visual.
- Alto contraste e leitura confortável em tela, iPhone e impressão.
- Evitar grandes áreas de fundo azul atrás de textos corridos.
- Capa institucional: BravHAS — Head Administration System; Pessoas | Processos | Resultados; Manual de Treinamento RH, DP e Financeiro.

## 1. Como usar este manual

O BravHAS deve conduzir o usuário de uma etapa à seguinte sem exigir conhecimento técnico. Em homologação, cada fluxo deve ser classificado como:

- **APROVADO:** a tarefa funciona, persiste os dados e o próximo passo é claro.
- **AJUSTE:** a tarefa funciona, mas experiência, texto, ordem ou orientação precisam melhorar.
- **BLOQUEIO:** a tarefa não pode ser concluída, os dados não persistem ou há risco operacional/segurança.

## 2. RH — Cadastro de novo colaborador

**Caminho:** Recursos Humanos > Colaboradores > Novo colaborador. Também pode ser iniciado em RH > Admissões > Nova admissão.

**Regra:** Pré-admissão não é erro. É o status correto enquanto os requisitos admissionais e documentais ainda não foram concluídos.

1. Abra Colaboradores e clique em Novo colaborador — deve aparecer Etapa 1 de 3.
2. Preencha nome completo e CPF — obrigatórios.
3. Informe data de admissão e tipo de contrato — obrigatórios.
4. Complete dados pessoais e de contato quando aplicável.
5. Informe salário base, carga horária e regime de trabalho.
6. Defina unidade, departamento, cargo e gestor imediato.
7. Salve o colaborador — status inicial Pré-admissão.
8. Confirme o redirecionamento para Documentos — Etapa 2 de 3.

## 3. RH — Documentos do colaborador

**Caminho:** Dossiê do colaborador > Documentos.

1. Selecione o tipo do documento.
2. Informe um título claro e rastreável.
3. Anexe o arquivo real quando o upload estiver disponível.
4. Informe emissão e validade quando aplicável.
5. Salve o documento — deve aparecer no Arquivo funcional.
6. Abra e valide o arquivo.
7. Clique em Conferir — o status deve mudar de Pendente para Conferido.

**Achado de homologação:** a versão inicial não permitia upload real. A correção do fluxo documental deve ser validada antes de considerar a admissão homologada.

## 4. RH — Concluir admissão

**Caminho:** Recursos Humanos > Admissões.

Para liberar a ativação, o cadastro precisa conter CPF, data de admissão e tipo de contrato, além de pelo menos um documento cadastrado e todos os documentos cadastrados conferidos.

1. Abra RH > Admissões e localize a pessoa em Pré-admissão.
2. Leia as pendências exibidas — a tela deve informar exatamente o que falta.
3. Use Resolver pendências quando necessário.
4. Quando estiver pronto, clique em Concluir admissão.
5. Confirme o status Ativo e a presença do colaborador nas rotinas aplicáveis de RH/DP.

## 5. DP — Rotinas após ativação

- **Ponto e jornada:** validar se o colaborador aparece no escopo correto.
- **Férias:** validar consulta e processo conforme regra do módulo.
- **Benefícios:** validar inclusão e situação.
- **Folha:** validar presença no fluxo previsto.
- **Afastamentos:** validar registro e consulta.
- **Medidas disciplinares:** validar acesso conforme perfil.
- **Desligamentos:** testar somente após consolidar as etapas anteriores.

## 6. Financeiro — Visão geral

**Caminho principal:** Financeiro.

A homologação deve cobrir contas a pagar, contas a receber, persistência, classificação e reflexo no fluxo de caixa.

1. Abrir Financeiro — a tela deve carregar sem erro.
2. Consultar contas existentes — validar totais, status e filtros.
3. Abrir Nova Conta Financeira.
4. Criar uma Conta a pagar e validar persistência.
5. Criar uma Conta a receber e validar persistência.
6. Reabrir Financeiro — os lançamentos devem permanecer.
7. Abrir Fluxo de Caixa — os lançamentos devem refletir corretamente.

## 7. Financeiro — Nova Conta Financeira

A tela de lançamento trabalha com Descrição, Tipo, Valor, Vencimento, Documento, Categoria, Centro de custo e Observações.

1. Preencha Descrição.
2. Escolha Tipo: Conta a pagar ou Conta a receber.
3. Informe Valor maior que zero.
4. Informe Vencimento.
5. Informe Documento quando houver.
6. Classifique Categoria.
7. Informe Centro de custo.
8. Inclua Observações úteis.
9. Revise a conferência.
10. Clique em Salvar Conta — o lançamento deve persistir e aparecer na listagem.

**Achado de homologação:** a mensagem **“Não foi possível criar a conta financeira.”** é BLOQUEIO. Enquanto persistir, o Financeiro não pode ser considerado homologado.

## 8. Financeiro — Categoria, Centro de custo e Documento

- **Categoria:** classifica a natureza da receita ou despesa.
- **Centro de custo:** identifica a área ou operação responsável.
- **Documento:** mantém referência de NF, boleto, guia ou documento equivalente.
- **Observações:** registra somente informação necessária à conferência.
- **Validação pós-salvamento:** todos os campos relevantes devem reaparecer corretamente.

## 9. Fluxo de Caixa

1. Crie uma conta a pagar de teste e anote valor e vencimento.
2. Crie uma conta a receber de teste e anote valor e vencimento.
3. Abra Fluxo de Caixa e localize ambos.
4. Confira o sentido financeiro: pagar = saída; receber = entrada.
5. Confira datas e valores.
6. Atualize a página e confirme persistência.
7. Compare indicadores e valide os totais.

## 10. Indicadores, Agenda e Documentos

Esses módulos fazem parte da navegação administrativa do BravHAS. A homologação deve validar que abrem sem 404, respeitam permissões e apresentam caminho funcional coerente. Funcionalidades ainda não conectadas a backend real devem ser registradas como pendência, e não simuladas como concluídas.

## 11. Guia rápido — Estou travado, o que faço?

- **Colaborador ficou em Pré-admissão:** ir para Documentos e verificar pendências.
- **Não consigo anexar arquivo:** tratar como bloqueio documental até a correção estar integrada e validada.
- **Documento aparece Pendente:** abrir/validar e clicar em Conferir.
- **Não aparece Concluir admissão:** ler Pendências em RH > Admissões.
- **Conta financeira não salva:** registrar BLOQUEIO; não repetir lançamentos indefinidamente.
- **Conta salva mas não aparece:** investigar persistência/listagem.
- **Fluxo de Caixa não reflete:** investigar integração financeira.

## 12. Checklist final de homologação

- RH — Cadastro: criar colaborador e chegar à Pré-admissão.
- RH — Documentos: anexar/referenciar, salvar, abrir e conferir.
- RH — Admissões: concluir e tornar Ativo.
- DP: validar presença nas rotinas.
- Financeiro — Conta a pagar: salvar e localizar.
- Financeiro — Conta a receber: salvar e localizar.
- Fluxo de Caixa: validar impacto.
- Persistência: atualizar páginas e confirmar manutenção dos dados.
- Agenda, Indicadores e Documentos: validar navegação, permissões e comportamento real.

## Governança deste documento

Este manual deve evoluir junto com o BravHAS. Mudanças funcionais relevantes devem atualizar este arquivo no mesmo ciclo de desenvolvimento ou homologação. O PDF de treinamento é um artefato publicado derivado desta fonte versionada.

**Meta:** finalizar a homologação com o BravHAS funcional e este manual atualizado como material oficial de implantação e treinamento.