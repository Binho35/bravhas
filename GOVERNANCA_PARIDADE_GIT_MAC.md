# BravHas — Governança de Paridade Git ↔ Mac

> Regra operacional permanente da BravSystems  
> Instituída em: 24/09/2026  
> Proprietário: Robson  
> Aplicação: desenvolvimento, homologação, documentação e continuidade entre chats/sessões.

---

## 1. Regra-mãe

**GitHub é a fonte durável de verdade do projeto.**

O Mac é uma estação de desenvolvimento. Ele pode ser perdido, roubado, danificado, ficar offline ou ser substituído.

Por isso:

> **Nenhuma tarefa de código é considerada concluída se o resultado validado existir somente no Mac.**

Ao final de uma tarefa concluída, o estado relevante deve estar commitado e enviado ao repositório remoto.

---

## 2. Estado desejado ao concluir uma tarefa

Ao encerrar uma tarefa de desenvolvimento:

```text
WORKING TREE: CLEAN
LOCAL HEAD: igual ao HEAD remoto da branch de trabalho
GITHUB: atualizado
TESTES/QUALITY: validados conforme o projeto
DEPLOY/HOMOLOGAÇÃO: vinculado a código commitado, quando aplicável
DOCUMENTAÇÃO: atualizada
```

O objetivo é permitir que outro computador ou outro chat retome o projeto a partir do GitHub sem depender do disco físico do Mac.

---

## 3. Fluxo obrigatório

Para qualquer alteração relevante:

```text
1. identificar branch e estado real
2. atualizar referências remotas sem destruir WIP
3. editar
4. validar
5. revisar diff
6. commit
7. push
8. confirmar SHA remoto
9. deploy/homologar a partir do estado versionado
10. atualizar documentação de continuidade
11. confirmar paridade local ↔ remoto
```

Não encerrar uma tarefa entre os passos de validação local e push remoto.

---

## 4. Antes de alterar código

Executar ou verificar o equivalente a:

```bash
git status --short
git branch --show-current
git rev-parse HEAD
git fetch origin
git rev-parse origin/<branch-de-trabalho>
git log --oneline --decorate -15
```

Se houver divergência entre local e remoto:

> **PARAR → INSPECIONAR → PRESERVAR → RECONCILIAR → VALIDAR.**

---

## 5. Proibido como rotina

Não usar como fluxo normal:

- deploy de working tree não commitado;
- alterações importantes apenas locais;
- “depois eu subo no Git”;
- reset para forçar igualdade sem auditar;
- apagar arquivos locais porque o remoto parece mais novo;
- sobrescrever trabalho remoto porque o local parece mais novo;
- confiar no Mac como única cópia de trabalho homologado.

Também não executar cegamente:

```text
git reset --hard
git clean
git checkout .
git restore .
git pull --rebase
git rebase
git stash drop
```

Esses comandos podem ser usados somente quando o estado for compreendido e a ação for deliberada.

---

## 6. Git tem prioridade de preservação, não de destruição

Dizer que “GitHub é a fonte principal de verdade” **não significa apagar automaticamente o que estiver diferente no Mac**.

Se o Mac tiver WIP legítimo ainda não enviado:

1. inventariar;
2. comparar;
3. preservar;
4. transformar em commit coerente;
5. enviar ao remoto;
6. confirmar paridade.

Se o remoto tiver commits mais novos:

1. identificar quem/qual sessão criou;
2. preservar o WIP local;
3. reconciliar sem perda;
4. validar;
5. confirmar paridade.

---

## 7. Branches e PRs

Respeitar o fluxo de cada projeto.

Esta regra **não autoriza**:

- merge direto em `main`;
- promoção de branch;
- fechamento de PR;
- rebase;
- mudança de base;
- bypass de Quality.

Quando o projeto possuir branch oficial, PR ou gate de qualidade, eles continuam valendo.

Paridade significa:

> local e remoto da **branch correta** devem representar o mesmo trabalho concluído.

---

## 8. Deploy e homologação

Quando houver ambiente de deploy:

**Preferir:**

```text
Código validado
   ↓
Commit
   ↓
Push GitHub
   ↓
Deploy
   ↓
Homologação
```

Evitar:

```text
Mac com alterações não commitadas
   ↓
Deploy
   ↓
produção/homologação diferente do GitHub
```

Sempre que possível, registrar qual commit/SHA está homologado.

---

## 9. Documentação após cada tarefa

Após uma tarefa relevante, atualizar o documento de continuidade/checkpoint do projeto, quando existir.

Registrar:

- o que mudou;
- decisões tomadas;
- arquivos/áreas afetadas;
- validações realizadas;
- commit/SHA;
- deploy/URL quando aplicável;
- riscos conhecidos;
- ponto exato de retomada.

**Nunca registrar senhas, tokens, cookies, chaves, hashes secretos ou credenciais.**

---

## 10. Quando o Mac estiver offline

É permitido:

- pesquisar;
- revisar documentação;
- criar especificações;
- registrar decisões no GitHub;
- preparar arquitetura.

Não editar código remoto usando uma versão antiga se houver indicação de que o Mac contém WIP mais novo.

Quando o Mac voltar:

1. consultar o remoto;
2. consultar o local;
3. reconciliar;
4. confirmar paridade;
5. somente depois continuar desenvolvimento.

---

## 11. Recuperação de desastre

A regra existe para permitir que, se o Mac for perdido hoje, um novo computador consiga recuperar o último estado concluído com:

```text
GitHub + documentação + infraestrutura versionada/configurada
```

Uma tarefa importante que existe apenas no Mac é considerada **não protegida**.

---

## 12. Gate de conclusão

Antes de afirmar “tarefa concluída”, confirmar:

- [ ] código relevante commitado;
- [ ] push concluído;
- [ ] SHA remoto confirmado;
- [ ] local e remoto reconciliados;
- [ ] testes/checks concluídos;
- [ ] deploy validado, quando aplicável;
- [ ] documentação atualizada;
- [ ] nenhum WIP importante depende exclusivamente do Mac.

---

## 13. Regra para novos chats/agentes

Ao assumir este projeto:

1. ler este documento;
2. localizar documentação de continuidade;
3. consultar estado remoto;
4. consultar estado local quando o Mac estiver disponível;
5. não reconstruir trabalho existente;
6. não resetar divergências sem auditoria;
7. manter GitHub e Mac pareados ao concluir cada tarefa.

---

## 14. Princípio final

> **O Mac é substituível. O histórico do projeto não pode ser.**

Todo trabalho concluído deve sobreviver à perda física da máquina.
