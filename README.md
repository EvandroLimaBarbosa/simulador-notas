# N08EVANDRO Visual

Simulador interativo para entender o programa **N08EVANDRO.pas**, de **Evandro Lima Barbosa**, desenvolvido para o trabalho 08 da disciplina DS110.

A página mostra como as notas de `NOTAS.TXT` encontram o candidato correto em `CAND.IND`, como os dados são conferidos e como o programa calcula as notas com peso e as médias sem peso. Cada passo pode ser relacionado a um trecho do código Pascal original.

## O que você pode fazer

- Avançar, voltar e reproduzir a execução automaticamente.
- Acompanhar a formação e a ordenação do vetor de candidatos presentes.
- Observar a pesquisa binária e a relação entre inscrição, índice e posição física.
- Ver a separação dos sete campos de cada linha de notas.
- Conferir a aplicação dos pesos e a soma de cada candidato.
- Entender o reposicionamento de `SEEK` antes de `WRITE`.
- Experimentar notas inválidas, duplicidades, presentes sem notas e ausência de presentes.
- Editar candidatos e notas e importar ou exportar JSON e TXT.
- Estudar o Pascal original em 24 blocos, com números de linha e exemplos.
- Comparar os trechos Pascal com equivalências didáticas em JavaScript.
- Acompanhar contadores com os mesmos nomes do programa original.

## Como abrir no computador

1. Baixe o repositório em **Code → Download ZIP**, ou clone-o.
2. Extraia o ZIP, se necessário.
3. Abra o arquivo `index.html` no navegador.

Não é necessário instalar dependências, iniciar um servidor ou ter conexão com a internet para usar a página depois de baixá-la.

## Começando a estudar

1. Na aba **Laboratório**, mantenha o cenário **Tudo certo · exemplo completo**.
2. Clique em **Começar simulação**.
3. Use **Próximo passo** e observe a explicação, o código e os dados.
4. Abra **Variáveis do seu programa** para acompanhar os valores conhecidos naquele ponto.
5. Use **Entender este bloco do meu código** para ler a explicação do trecho original.
6. Depois, experimente um cenário com erro ou modifique a entrada na aba **Dados de entrada**.

Na aba **Seu código Pascal**, você também pode escolher um dos 24 blocos e, quando existir um passo correspondente no cenário atual, clicar em **Ver este bloco em ação**.

## Como funciona

O projeto usa **HTML, CSS e JavaScript puro**, sem framework e sem bibliotecas externas.

Toda a simulação é executada no navegador. Não há backend nem banco de dados. Os candidatos e as notas ficam em objetos e arrays na memória da aba. Recarregar ou fechar a página descarta as edições; use a exportação para guardar seus dados e importá-los em outra execução.

O `CAND.IND` mostrado na tela é uma representação visual do cadastro. O simulador não lê nem modifica o arquivo binário original do Pascal. Para a entrada do laboratório, o cadastro usa JSON e as notas usam TXT.

### Caminho do algoritmo

```text
Ler o cadastro e separar os presentes
                  ↓
Guardar inscrição (CC) e posição física (PF)
                  ↓
Ordenar o vetor pela inscrição
                  ↓
Ler NOTAS.TXT e pesquisar as inscrições
                  ↓
Conferir formato, notas, duplicidades e faltas de notas
                  ↓
Se houver erro: encerrar antes de gravar
                  ↓
Se estiver correto: localizar cada registro pela PF
                  ↓
Aplicar pesos, somar e zerar classificações
                  ↓
Voltar à mesma PF e gravar
                  ↓
Mostrar as médias das disciplinas sem peso
```

### Disciplinas e pesos

| Disciplina | Peso |
| --- | ---: |
| L.E.M. | 1 |
| Matemática | 1 |
| Lógica | 1 |
| Conhecimento específico | 3 |
| Informática | 2 |
| Atualidades | 1 |

A soma do candidato utiliza os pesos. As médias das disciplinas utilizam as notas originais dos presentes atualizados.

### Formato de NOTAS.TXT

Cada linha contém exatamente **28 caracteres**:

| Colunas | Conteúdo |
| --- | --- |
| 1–4 | Inscrição |
| 5–8 | Nota 1 |
| 9–12 | Nota 2 |
| 13–16 | Nota 3 |
| 17–20 | Nota 4 |
| 21–24 | Nota 5 |
| 25–28 | Nota 6 |

Exemplo com inscrição `0012` e seis notas:

```text
0012  80  70  60  90  85  75
```

Os espaços completam os campos e contam no tamanho da linha. A aba **Dados de entrada** inclui um gerador para montar linhas no formato correto.

## Arquivos do projeto

```text
n08evandro-visual/
├── index.html               Estrutura da página e das telas
├── styles.css               Estilos e adaptação a telas menores
├── app.js                   Interface, navegação e controles
├── engine.js                Lógica da simulação e passos de execução
├── original-source.js       Pascal original e explicação dos 24 blocos
├── N08EVANDRO.pas           Código Pascal enviado pelo autor
├── scripts/
│   └── prepare-source.cjs   Gera os trechos mostrados pela página
├── tests.cjs                Verificações da lógica e do código original
├── package.json             Comandos de verificação, sem dependências
├── vercel.json              Configuração para hospedagem estática
├── .vercelignore            Arquivos auxiliares excluídos da publicação
├── .gitignore               Arquivos locais ignorados pelo Git
├── .gitattributes           Padronização das quebras de linha
└── README.md                Este documento
```

## Publicar no GitHub

1. Crie um repositório chamado **n08evandro-visual**.
2. Envie o **conteúdo desta pasta** para a raiz do repositório. O `index.html` deve aparecer diretamente na raiz.
3. Inclua os arquivos de configuração que começam com ponto. Se usar a interface do GitHub, confira se também foram enviados.
4. Faça o commit dos arquivos.

Se preferir enviar pelo terminal, execute dentro desta pasta, substituindo `SEU-USUARIO` pelo seu usuário do GitHub:

```bash
git init
git add .
git commit -m "feat: adiciona simulador visual do N08EVANDRO"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/n08evandro-visual.git
git push -u origin main
```

Esses comandos são para uma pasta nova. Se ela já for um repositório, confira a branch e o remoto existente antes de configurar outro.

## Hospedar no Vercel

1. Entre no Vercel e selecione **Add New → Project**.
2. Importe o repositório do GitHub.
3. Mantenha a raiz do repositório como **Root Directory**.
4. O arquivo `vercel.json` já define a publicação estática:

| Configuração | Valor |
| --- | --- |
| Framework | Other |
| Build Command | Vazio |
| Install Command | Vazio |
| Output Directory | `.` |

5. Clique em **Deploy**.

Não são necessárias variáveis de ambiente, credenciais de Sites ou configuração de banco de dados. A publicação no Vercel é independente da hospedagem usada para demonstrar o projeto nesta conversa.

## Verificar o código

Para abrir e usar o site, Node.js não é necessário. Para executar as verificações, instale Node.js e rode na raiz do projeto:

```bash
npm test
```

Ou, diretamente:

```bash
node tests.cjs
```

Os testes verificam pesos, médias, correspondência entre inscrição e PF, preservação dos ausentes, validação, duplicidades, presentes sem notas, nova execução sem multiplicar os pesos novamente e reposicionamento antes de gravar. Também verificam os trechos e números de linha do Pascal original.

## Atualizar as explicações

- Para mudar a interface ou as equivalências em JavaScript, edite `app.js`.
- Para mudar a lógica e os eventos da simulação, edite `engine.js`.
- Para mudar as explicações dos blocos Pascal, edite os textos em `scripts/prepare-source.cjs` e execute:

```bash
npm run source
```

O comando lê `N08EVANDRO.pas` e recria `original-source.js`. Os intervalos de linha foram definidos para o código fornecido: se alterar a estrutura do Pascal, ajuste também esses intervalos e execute os testes.

## Limites da simulação

- O Pascal é apresentado como material de estudo; a página não é um compilador Pascalzim.
- Os índices do Pascal começam em 1 nos vetores deste programa; os arrays JavaScript começam em 0. A interface explicita essa diferença.
- A ordenação reproduz o resultado de `ORDEM`; as trocas internas dessa rotina não são animadas.
- A busca binária representa o trabalho de `PEBIN1`, cuja implementação pertence à unit `TARDENOITE`.
- O cursor de `SEEK`, `READ` e `WRITE` é simulado para explicar o acesso ao arquivo original.
- A conferência antes de gravar não representa uma transação com recuperação de falhas durante gravações.
- A classificação dos candidatos pertence ao trabalho 09; o N08 apenas zera os campos correspondentes dos registros atualizados.

## Autoria

Código Pascal original: **Evandro Lima Barbosa**.

Simulador web preparado com auxílio do Codex para estudo e apresentação da lógica do programa.
