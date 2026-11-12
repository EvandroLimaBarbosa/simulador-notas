window.N08Original = {
  "text": "PROGRAM N08EVANDRO;\n// FEITO POR: EVANDRO LIMA BARBOSA\n\nUSES TARDENOITE;\n\nCONST\n  nomesDisciplinas: ARRAY[1..6] OF STRING[25] =\n    ('L.E.M.', 'MATEMATICA', 'LOGICA', 'CONHECIMENTO ESPECIFICO',\n     'INFORMATICA', 'ATUALIDADES');\n  pesosDisciplinas: ARRAY[1..6] OF INTEGER = (1, 1, 1, 3, 2, 1);\n\nVAR\n  arquivoCandidatos: FILE OF regis;\n  arquivoNotas: TEXT;\n  candidato: regis;\n\n  // CC guarda a inscricao; PF guarda a posicao original em CAND.IND.\n  vetorCandidatos: vetor;\n  linhaNotas: STRING;\n  inscricaoTexto: STRING[4];\n\n  notasSemPeso: ARRAY[1..3000, 1..6] OF INTEGER;\n\n  possuiNotas: ARRAY[1..3000] OF BOOLEAN;\n\n  somasSemPeso: ARRAY[1..6] OF LONGINT;\n  notasDaLinha: ARRAY[1..6] OF INTEGER;\n  totalPresentes, indiceCandidato, indiceDisciplina, posicaoEncontrada, codigoConversao,\n      numeroInscricao, totalAtualizados, totalNotasIgnoradas, totalNotasDuplicadas: INTEGER;\n  encontrouErro, linhaValida: BOOLEAN;\n  posicaoFisica: LONGINT;\n\n// Completa a inscricao com zeros a esquerda: 12 fica '0012'.\nFUNCTION formatarInscricao(valorNumerico: INTEGER): STRING;\nVAR numeroTexto: STRING[4];\nBEGIN\n  STR(valorNumerico:4, numeroTexto);\n  WHILE POS(' ', numeroTexto) > 0 DO numeroTexto[POS(' ', numeroTexto)] := '0';\n  formatarInscricao := numeroTexto;\nEND;\n\nBEGIN\n  ASSIGN(arquivoCandidatos, 'CAND.IND');\n  RESET(arquivoCandidatos);\n  IF FILESIZE(arquivoCandidatos) > 3000 THEN\n  BEGIN\n    WRITELN('CAND.IND excede o limite de 3000 registros da unit.');\n    CLOSE(arquivoCandidatos);\n    HALT;\n  END;\n\n  // Somente os presentes entram no vetor para atualizacao das notas.\n  totalPresentes := 0;\n\n  posicaoFisica := 0;\n  WHILE NOT EOF(arquivoCandidatos) DO\n  BEGIN\n    READ(arquivoCandidatos, candidato);\n    IF candidato.falta = 0 THEN\n    BEGIN\n      totalPresentes := totalPresentes + 1;\n      vetorCandidatos[totalPresentes].pf := posicaoFisica;\n      vetorCandidatos[totalPresentes].cc := formatarInscricao(candidato.num);\n    END;\n    posicaoFisica := posicaoFisica + 1;\n  END;\n\n  // A pesquisa binaria PEBIN1 precisa do vetor ordenado por inscricao.\n  IF totalPresentes > 1 THEN ordem(vetorCandidatos, totalPresentes);\n  FOR indiceCandidato := 1 TO totalPresentes DO possuiNotas[indiceCandidato] := FALSE;\n  FOR indiceDisciplina := 1 TO 6 DO somasSemPeso[indiceDisciplina] := 0;\n  totalNotasIgnoradas := 0;\n  totalNotasDuplicadas := 0;\n  encontrouErro := FALSE;\n\n  // Conferir todas as notas antes de alterar o cadastro.\n  ASSIGN(arquivoNotas, 'NOTAS.TXT');\n  RESET(arquivoNotas);\n  WHILE NOT EOF(arquivoNotas) DO\n  BEGIN\n    READLN(arquivoNotas, linhaNotas);\n\n    linhaValida := LENGTH(linhaNotas) = 28;\n    IF linhaValida THEN\n    BEGIN\n      VAL(COPY(linhaNotas, 1, 4), numeroInscricao, codigoConversao);\n      linhaValida := (codigoConversao = 0) AND (numeroInscricao >= 1) AND (numeroInscricao <= 9999);\n    END;\n    IF linhaValida THEN\n    BEGIN\n      inscricaoTexto := formatarInscricao(numeroInscricao);\n      posicaoEncontrada := 0;\n\n      IF totalPresentes > 0 THEN pebin1(vetorCandidatos, inscricaoTexto, totalPresentes, posicaoEncontrada);\n      IF posicaoEncontrada = 0 THEN\n        totalNotasIgnoradas := totalNotasIgnoradas + 1\n      ELSE\n      BEGIN\n        FOR indiceDisciplina := 1 TO 6 DO\n        BEGIN\n          // Cada nota ocupa 4 colunas, com inicio em 5, 9, 13, 17, 21 e 25.\n          VAL(COPY(linhaNotas, 5 + (indiceDisciplina - 1) * 4, 4), notasDaLinha[indiceDisciplina],\n              codigoConversao);\n          IF (codigoConversao <> 0) OR (notasDaLinha[indiceDisciplina] < 0) OR\n              (notasDaLinha[indiceDisciplina] > 100) THEN\n            linhaValida := FALSE;\n        END;\n        IF linhaValida THEN\n        BEGIN\n          IF possuiNotas[posicaoEncontrada] THEN\n          BEGIN\n            totalNotasDuplicadas := totalNotasDuplicadas + 1;\n            encontrouErro := TRUE;\n            WRITELN('Nota duplicada para a inscricao ', inscricaoTexto, '.');\n          END\n          ELSE\n          BEGIN\n            possuiNotas[posicaoEncontrada] := TRUE;\n            FOR indiceDisciplina := 1 TO 6 DO notasSemPeso[posicaoEncontrada, indiceDisciplina] :=\n                notasDaLinha[indiceDisciplina];\n          END;\n        END;\n      END;\n    END;\n    IF NOT linhaValida THEN\n    BEGIN\n      encontrouErro := TRUE;\n      WRITELN('Registro invalido em NOTAS.TXT: ', linhaNotas);\n    END;\n  END;\n  CLOSE(arquivoNotas);\n\n  FOR indiceCandidato := 1 TO totalPresentes DO\n    IF NOT possuiNotas[indiceCandidato] THEN\n    BEGIN\n      encontrouErro := TRUE;\n      WRITELN('Presente sem notas: inscricao ', vetorCandidatos[indiceCandidato].cc, '.');\n    END;\n  IF encontrouErro THEN\n  BEGIN\n    WRITELN('Corrija NOTAS.TXT. Nenhuma nota foi alterada em CAND.IND.');\n    CLOSE(arquivoCandidatos);\n    HALT;\n  END;\n\n  totalAtualizados := 0;\n  FOR indiceCandidato := 1 TO totalPresentes DO\n  BEGIN\n    SEEK(arquivoCandidatos, vetorCandidatos[indiceCandidato].pf);\n    READ(arquivoCandidatos, candidato);\n    candidato.som := 0;\n    FOR indiceDisciplina := 1 TO 6 DO\n    BEGIN\n      // A media usa notas sem peso; as notas gravadas recebem os pesos 3 em N4 e 2 em N5.\n      somasSemPeso[indiceDisciplina] := somasSemPeso[indiceDisciplina] + notasSemPeso[indiceCandidato,\n          indiceDisciplina];\n      candidato.notas[indiceDisciplina] := notasSemPeso[indiceCandidato, indiceDisciplina] *\n          pesosDisciplinas[indiceDisciplina];\n      candidato.som := candidato.som + candidato.notas[indiceDisciplina];\n    END;\n\n    candidato.clg := 0;\n    candidato.clc := 0;\n    candidato.ccl := 0;\n\n    // READ avancou o arquivo; voltar a mesma PF antes de gravar.\n    SEEK(arquivoCandidatos, vetorCandidatos[indiceCandidato].pf);\n    WRITE(arquivoCandidatos, candidato);\n    totalAtualizados := totalAtualizados + 1;\n  END;\n  CLOSE(arquivoCandidatos);\n\n  WRITELN('TRABALHO 08 - NOTAS ATUALIZADAS');\n  WRITELN('Presentes atualizados: ', totalAtualizados);\n  WRITELN('Notas de ausentes/inscricoes inexistentes ignoradas: ', totalNotasIgnoradas);\n  WRITELN;\n  WRITELN('DISCIPLINA                    MEDIA SEM PESO');\n  FOR indiceDisciplina := 1 TO 6 DO\n    IF totalAtualizados > 0 THEN\n      WRITELN(nomesDisciplinas[indiceDisciplina]:25, '     ', somasSemPeso[indiceDisciplina] /\n          totalAtualizados:8:2)\n    ELSE\n      WRITELN(nomesDisciplinas[indiceDisciplina]:25, '     SEM PRESENTES');\n  WRITELN('Proxima etapa: executar o trabalho 09.');\nEND.\n",
  "blocks": [
    {
      "id": "intro",
      "start": 1,
      "end": 4,
      "title": "O nome do programa e a biblioteca",
      "explain": "PROGRAM N08EVANDRO dá nome ao programa. O comentário identifica o autor. USES TARDENOITE importa os tipos regis e vetor e os procedimentos ordem e pebin1; as implementações deles ficam na unit, fora deste arquivo.",
      "example": "Pense em TARDENOITE como uma caixa de ferramentas que seu programa reutiliza.",
      "code": "PROGRAM N08EVANDRO;\n// FEITO POR: EVANDRO LIMA BARBOSA\n\nUSES TARDENOITE;"
    },
    {
      "id": "constants",
      "start": 6,
      "end": 10,
      "title": "Os nomes e os pesos das seis disciplinas",
      "explain": "CONST define os dois vetores fixos. O índice liga o nome ao peso da mesma disciplina. Em Pascal, os índices vão de 1 a 6. Conhecimento específico, índice 4, recebe peso 3; Informática, índice 5, peso 2.",
      "example": "pesosDisciplinas[4] vale 3. A nota 90 dessa disciplina será gravada como 270.",
      "code": "CONST\n  nomesDisciplinas: ARRAY[1..6] OF STRING[25] =\n    ('L.E.M.', 'MATEMATICA', 'LOGICA', 'CONHECIMENTO ESPECIFICO',\n     'INFORMATICA', 'ATUALIDADES');\n  pesosDisciplinas: ARRAY[1..6] OF INTEGER = (1, 1, 1, 3, 2, 1);"
    },
    {
      "id": "variables",
      "start": 12,
      "end": 31,
      "title": "As variáveis que guardam o trabalho",
      "explain": "arquivoCandidatos representa o arquivo de registros; arquivoNotas é texto. candidato guarda uma ficha por vez. vetorCandidatos liga inscrição e posição física. notasDaLinha guarda seis números temporários; notasSemPeso guarda as notas originais dos presentes. possuiNotas marca quem já recebeu notas. somasSemPeso acumula os totais de cada disciplina. Os contadores e booleanos controlam a execução.",
      "example": "notasSemPeso[2,4] é a quarta nota da pessoa no índice 2 do vetor ordenado; não é a inscrição 2.",
      "code": "VAR\n  arquivoCandidatos: FILE OF regis;\n  arquivoNotas: TEXT;\n  candidato: regis;\n\n  // CC guarda a inscricao; PF guarda a posicao original em CAND.IND.\n  vetorCandidatos: vetor;\n  linhaNotas: STRING;\n  inscricaoTexto: STRING[4];\n\n  notasSemPeso: ARRAY[1..3000, 1..6] OF INTEGER;\n\n  possuiNotas: ARRAY[1..3000] OF BOOLEAN;\n\n  somasSemPeso: ARRAY[1..6] OF LONGINT;\n  notasDaLinha: ARRAY[1..6] OF INTEGER;\n  totalPresentes, indiceCandidato, indiceDisciplina, posicaoEncontrada, codigoConversao,\n      numeroInscricao, totalAtualizados, totalNotasIgnoradas, totalNotasDuplicadas: INTEGER;\n  encontrouErro, linhaValida: BOOLEAN;\n  posicaoFisica: LONGINT;"
    },
    {
      "id": "format",
      "start": 33,
      "end": 40,
      "title": "Sua função formatarInscricao",
      "explain": "A função recebe um INTEGER e devolve STRING. STR converte o número para texto com largura de quatro posições. POS localiza espaços; WHILE troca cada espaço por zero. A atribuição ao nome da função devolve o resultado.",
      "example": "12 → STR produz \"  12\" → o WHILE transforma em \"0012\". Assim, comparar inscrições como texto mantém a ordem numérica.",
      "code": "// Completa a inscricao com zeros a esquerda: 12 fica '0012'.\nFUNCTION formatarInscricao(valorNumerico: INTEGER): STRING;\nVAR numeroTexto: STRING[4];\nBEGIN\n  STR(valorNumerico:4, numeroTexto);\n  WHILE POS(' ', numeroTexto) > 0 DO numeroTexto[POS(' ', numeroTexto)] := '0';\n  formatarInscricao := numeroTexto;\nEND;"
    },
    {
      "id": "open",
      "start": 42,
      "end": 50,
      "title": "Abrir CAND.IND e respeitar o limite",
      "explain": "O BEGIN da linha 42 inicia o programa principal. ASSIGN associa a variável ao arquivo; RESET abre o arquivo existente. FILESIZE informa a quantidade de registros. Acima de 3.000, o programa fecha o arquivo e termina com HALT para não ultrapassar os vetores.",
      "example": "O Pascal depende do arquivo existente e do modo de abertura do ambiente. Neste laboratório, uma lista em memória representa o cadastro.",
      "code": "BEGIN\n  ASSIGN(arquivoCandidatos, 'CAND.IND');\n  RESET(arquivoCandidatos);\n  IF FILESIZE(arquivoCandidatos) > 3000 THEN\n  BEGIN\n    WRITELN('CAND.IND excede o limite de 3000 registros da unit.');\n    CLOSE(arquivoCandidatos);\n    HALT;\n  END;"
    },
    {
      "id": "filter",
      "start": 52,
      "end": 66,
      "title": "Ler o cadastro e separar os presentes",
      "explain": "totalPresentes e posicaoFisica começam em zero. WHILE NOT EOF lê até o fim. READ carrega uma ficha em candidato. Só FALTA = 0 entra no vetor: CC recebe a inscrição e PF recebe sua posição original. posicaoFisica aumenta também para os ausentes.",
      "example": "O candidato de inscrição 0012 pode estar na PF 2, mesmo que, depois de ordenar, esteja no índice 2 do vetor Pascal. São informações diferentes.",
      "code": "  // Somente os presentes entram no vetor para atualizacao das notas.\n  totalPresentes := 0;\n\n  posicaoFisica := 0;\n  WHILE NOT EOF(arquivoCandidatos) DO\n  BEGIN\n    READ(arquivoCandidatos, candidato);\n    IF candidato.falta = 0 THEN\n    BEGIN\n      totalPresentes := totalPresentes + 1;\n      vetorCandidatos[totalPresentes].pf := posicaoFisica;\n      vetorCandidatos[totalPresentes].cc := formatarInscricao(candidato.num);\n    END;\n    posicaoFisica := posicaoFisica + 1;\n  END;"
    },
    {
      "id": "sort",
      "start": 68,
      "end": 69,
      "title": "Ordenar para usar pesquisa binária",
      "explain": "ordem recebe o vetor e o total de presentes. Só é chamada quando há mais de um elemento. Ordena pela inscrição em CC; PF acompanha a chave em cada troca. A ordem do arquivo CAND.IND permanece igual.",
      "example": "0030/PF0, 0012/PF2 → 0012/PF2, 0030/PF0. A PF continua apontando ao registro correto.",
      "code": "  // A pesquisa binaria PEBIN1 precisa do vetor ordenado por inscricao.\n  IF totalPresentes > 1 THEN ordem(vetorCandidatos, totalPresentes);"
    },
    {
      "id": "initialize",
      "start": 70,
      "end": 74,
      "title": "Preparar as marcas e os acumuladores",
      "explain": "O primeiro FOR coloca FALSE em possuiNotas para cada presente. O segundo zera as seis somas. totalNotasIgnoradas e totalNotasDuplicadas começam em zero. encontrouErro começa em FALSE.",
      "example": "FALSE significa “ainda não recebeu notas”. Um erro encontrado depois muda encontrouErro para TRUE e bloqueia a atualização.",
      "code": "  FOR indiceCandidato := 1 TO totalPresentes DO possuiNotas[indiceCandidato] := FALSE;\n  FOR indiceDisciplina := 1 TO 6 DO somasSemPeso[indiceDisciplina] := 0;\n  totalNotasIgnoradas := 0;\n  totalNotasDuplicadas := 0;\n  encontrouErro := FALSE;"
    },
    {
      "id": "line",
      "start": 76,
      "end": 88,
      "title": "Ler uma linha e validar a inscrição",
      "explain": "O programa abre NOTAS.TXT e lê com READLN. LENGTH exige exatamente 28 caracteres. COPY extrai os quatro primeiros; VAL tenta convertê-los em numeroInscricao. codigoConversao = 0 indica sucesso. A inscrição aceita vai de 1 a 9999.",
      "example": "0012 + seis campos de quatro caracteres = 4 + 6 × 4 = 28. Espaços dentro dos campos contam.",
      "code": "  // Conferir todas as notas antes de alterar o cadastro.\n  ASSIGN(arquivoNotas, 'NOTAS.TXT');\n  RESET(arquivoNotas);\n  WHILE NOT EOF(arquivoNotas) DO\n  BEGIN\n    READLN(arquivoNotas, linhaNotas);\n\n    linhaValida := LENGTH(linhaNotas) = 28;\n    IF linhaValida THEN\n    BEGIN\n      VAL(COPY(linhaNotas, 1, 4), numeroInscricao, codigoConversao);\n      linhaValida := (codigoConversao = 0) AND (numeroInscricao >= 1) AND (numeroInscricao <= 9999);\n    END;"
    },
    {
      "id": "search",
      "start": 89,
      "end": 94,
      "title": "Encontrar a inscrição com pebin1",
      "explain": "A inscrição numérica é formatada novamente com quatro dígitos. posicaoEncontrada começa em zero. Se existem presentes, pebin1 pesquisa a inscrição no vetor ordenado e devolve seu índice por referência. Zero significa não encontrada.",
      "example": "No Pascal, índice 2 significa vetorCandidatos[2]. A posição do registro no arquivo está em vetorCandidatos[2].pf. A animação do meio da busca representa o trabalho interno de pebin1 na unit.",
      "code": "    IF linhaValida THEN\n    BEGIN\n      inscricaoTexto := formatarInscricao(numeroInscricao);\n      posicaoEncontrada := 0;\n\n      IF totalPresentes > 0 THEN pebin1(vetorCandidatos, inscricaoTexto, totalPresentes, posicaoEncontrada);"
    },
    {
      "id": "ignore",
      "start": 95,
      "end": 98,
      "title": "Ignorar quem não está entre os presentes",
      "explain": "Se posicaoEncontrada é zero, totalNotasIgnoradas aumenta. A inscrição pode ser de um ausente ou inexistente. O ELSE só é executado quando o candidato foi encontrado entre os presentes.",
      "example": "Uma inscrição ignorada não bloqueia a execução. Nesse ramo, os seis campos de notas não chegam a ser convertidos e validados.",
      "code": "      IF posicaoEncontrada = 0 THEN\n        totalNotasIgnoradas := totalNotasIgnoradas + 1\n      ELSE\n      BEGIN"
    },
    {
      "id": "parse",
      "start": 99,
      "end": 107,
      "title": "Extrair e validar as seis notas",
      "explain": "O FOR repete de 1 a 6. A expressão 5 + (indiceDisciplina - 1) × 4 calcula os inícios 5, 9, 13, 17, 21 e 25. COPY extrai quatro caracteres e VAL converte. Erro na conversão ou nota fora de 0 a 100 deixa linhaValida em FALSE.",
      "example": "Para a disciplina 4: 5 + (4 - 1) × 4 = 17. Seu campo ocupa as colunas 17 a 20.",
      "code": "        FOR indiceDisciplina := 1 TO 6 DO\n        BEGIN\n          // Cada nota ocupa 4 colunas, com inicio em 5, 9, 13, 17, 21 e 25.\n          VAL(COPY(linhaNotas, 5 + (indiceDisciplina - 1) * 4, 4), notasDaLinha[indiceDisciplina],\n              codigoConversao);\n          IF (codigoConversao <> 0) OR (notasDaLinha[indiceDisciplina] < 0) OR\n              (notasDaLinha[indiceDisciplina] > 100) THEN\n            linhaValida := FALSE;\n        END;"
    },
    {
      "id": "duplicate",
      "start": 108,
      "end": 115,
      "title": "Impedir notas duplicadas",
      "explain": "A duplicidade é conferida apenas depois de validar as seis notas. Se possuiNotas já é TRUE para o índice encontrado, a inscrição tem outro conjunto válido de notas. O contador aumenta e encontrouErro recebe TRUE.",
      "example": "Duas linhas válidas para 0012 bloqueiam a gravação. totalNotasDuplicadas é contado no código, embora não apareça no relatório final do Pascal.",
      "code": "        IF linhaValida THEN\n        BEGIN\n          IF possuiNotas[posicaoEncontrada] THEN\n          BEGIN\n            totalNotasDuplicadas := totalNotasDuplicadas + 1;\n            encontrouErro := TRUE;\n            WRITELN('Nota duplicada para a inscricao ', inscricaoTexto, '.');\n          END"
    },
    {
      "id": "store",
      "start": 116,
      "end": 121,
      "title": "Guardar as notas originais na memória",
      "explain": "Quando não há duplicidade, possuiNotas fica TRUE. O FOR copia notasDaLinha para a linha correspondente de notasSemPeso. A chave dessa matriz é o índice do vetor ordenado, não a inscrição e não a PF.",
      "example": "Neste ponto nenhuma nota foi escrita em CAND.IND. As notas originais ficam guardadas para conferir tudo antes de atualizar.",
      "code": "          ELSE\n          BEGIN\n            possuiNotas[posicaoEncontrada] := TRUE;\n            FOR indiceDisciplina := 1 TO 6 DO notasSemPeso[posicaoEncontrada, indiceDisciplina] :=\n                notasDaLinha[indiceDisciplina];\n          END;"
    },
    {
      "id": "error",
      "start": 125,
      "end": 131,
      "title": "Registrar uma linha inválida",
      "explain": "Se linhaValida ficou FALSE, o programa marca encontrouErro e mostra a linha problemática. O laço continua para conferir as outras linhas. CLOSE fecha NOTAS.TXT quando a leitura acaba.",
      "example": "Uma nota 140 torna a linha inválida. Se era a única linha daquele presente, a checagem seguinte também indicará presente sem notas.",
      "code": "    IF NOT linhaValida THEN\n    BEGIN\n      encontrouErro := TRUE;\n      WRITELN('Registro invalido em NOTAS.TXT: ', linhaNotas);\n    END;\n  END;\n  CLOSE(arquivoNotas);"
    },
    {
      "id": "missing",
      "start": 133,
      "end": 138,
      "title": "Verificar se algum presente ficou sem notas",
      "explain": "O programa percorre todos os índices dos presentes. Se possuiNotas continua FALSE, não houve um conjunto válido para aquela pessoa. Mostra a inscrição guardada em CC e marca erro.",
      "example": "Um presente que não aparece em NOTAS.TXT impede a atualização, mesmo que todas as outras linhas estejam corretas.",
      "code": "  FOR indiceCandidato := 1 TO totalPresentes DO\n    IF NOT possuiNotas[indiceCandidato] THEN\n    BEGIN\n      encontrouErro := TRUE;\n      WRITELN('Presente sem notas: inscricao ', vetorCandidatos[indiceCandidato].cc, '.');\n    END;"
    },
    {
      "id": "halt",
      "start": 139,
      "end": 144,
      "title": "Encerrar antes de gravar se houve erro",
      "explain": "Se encontrouErro é TRUE, o programa avisa que nada foi alterado, fecha CAND.IND e termina com HALT. Só se a conferência inteira passar é que o programa chega ao laço de atualização.",
      "example": "É uma conferência prévia. O código não implementa desfazimento caso uma falha aconteça durante as gravações posteriores.",
      "code": "  IF encontrouErro THEN\n  BEGIN\n    WRITELN('Corrija NOTAS.TXT. Nenhuma nota foi alterada em CAND.IND.');\n    CLOSE(arquivoCandidatos);\n    HALT;\n  END;"
    },
    {
      "id": "seek",
      "start": 146,
      "end": 149,
      "title": "Começar a atualização pela posição física",
      "explain": "totalAtualizados começa em zero. O FOR percorre os presentes na ordem do vetor. SEEK vai ao registro indicado por PF, que ainda é sua posição original em CAND.IND.",
      "example": "SEEK recebe a posição física, não o número da inscrição e não o índice do vetor.",
      "code": "  totalAtualizados := 0;\n  FOR indiceCandidato := 1 TO totalPresentes DO\n  BEGIN\n    SEEK(arquivoCandidatos, vetorCandidatos[indiceCandidato].pf);"
    },
    {
      "id": "read",
      "start": 150,
      "end": 151,
      "title": "Ler a ficha e zerar a soma",
      "explain": "READ carrega o registro em candidato e avança o cursor do arquivo. candidato.som recebe zero para acumular o novo total, sem somar ao resultado antigo.",
      "example": "Se o registro está na PF 2, depois do READ o cursor está na PF 3. A ficha em memória continua sendo a da PF 2.",
      "code": "    READ(arquivoCandidatos, candidato);\n    candidato.som := 0;"
    },
    {
      "id": "weight",
      "start": 152,
      "end": 160,
      "title": "Separar a média sem peso da soma com peso",
      "explain": "Para cada disciplina, a nota original entra em somasSemPeso. Em candidato.notas, a mesma nota é multiplicada pelo peso. candidato.som acumula as seis notas já ponderadas.",
      "example": "Uma nota 90 de N4 adiciona 90 à soma da disciplina e 270 ao total do candidato. São dois acumuladores com finalidades diferentes.",
      "code": "    FOR indiceDisciplina := 1 TO 6 DO\n    BEGIN\n      // A media usa notas sem peso; as notas gravadas recebem os pesos 3 em N4 e 2 em N5.\n      somasSemPeso[indiceDisciplina] := somasSemPeso[indiceDisciplina] + notasSemPeso[indiceCandidato,\n          indiceDisciplina];\n      candidato.notas[indiceDisciplina] := notasSemPeso[indiceCandidato, indiceDisciplina] *\n          pesosDisciplinas[indiceDisciplina];\n      candidato.som := candidato.som + candidato.notas[indiceDisciplina];\n    END;"
    },
    {
      "id": "classify",
      "start": 162,
      "end": 164,
      "title": "Zerar as classificações anteriores",
      "explain": "CLG é classificação geral; CLC, classificação no cargo; CCL, cargo de classificação. O N08 zera esses campos dos presentes atualizados. A classificação será refeita pelo trabalho 09.",
      "example": "Zerar não é classificar. Este programa atualiza notas e prepara os campos para a próxima etapa.",
      "code": "    candidato.clg := 0;\n    candidato.clc := 0;\n    candidato.ccl := 0;"
    },
    {
      "id": "writeSeek",
      "start": 166,
      "end": 167,
      "title": "Voltar à mesma PF antes de escrever",
      "explain": "Como READ avançou o cursor, o programa chama SEEK novamente com a PF do vetor. Assim, WRITE atualizará a mesma ficha que foi lida.",
      "example": "READ na PF 2 deixa o cursor na PF 3. O segundo SEEK volta à PF 2 antes da gravação.",
      "code": "    // READ avancou o arquivo; voltar a mesma PF antes de gravar.\n    SEEK(arquivoCandidatos, vetorCandidatos[indiceCandidato].pf);"
    },
    {
      "id": "write",
      "start": 168,
      "end": 171,
      "title": "Gravar e contar os atualizados",
      "explain": "WRITE salva o registro candidato na posição selecionada. totalAtualizados aumenta em um. O END fecha o laço e CLOSE fecha CAND.IND depois de concluir as atualizações.",
      "example": "Somente os presentes que entraram no vetor são gravados. Os registros dos ausentes ficam preservados.",
      "code": "    WRITE(arquivoCandidatos, candidato);\n    totalAtualizados := totalAtualizados + 1;\n  END;\n  CLOSE(arquivoCandidatos);"
    },
    {
      "id": "means",
      "start": 173,
      "end": 185,
      "title": "Mostrar o relatório e as médias",
      "explain": "WRITELN mostra os totais. Cada média é somasSemPeso da disciplina dividida por totalAtualizados. :25 reserva largura para o nome; :8:2 mostra o resultado com largura mínima de oito caracteres e duas casas decimais. Sem presentes, mostra SEM PRESENTES e não divide por zero.",
      "example": "A última mensagem orienta executar o trabalho 09. WRITELN apenas mostra o texto; não chama esse outro programa.",
      "code": "  WRITELN('TRABALHO 08 - NOTAS ATUALIZADAS');\n  WRITELN('Presentes atualizados: ', totalAtualizados);\n  WRITELN('Notas de ausentes/inscricoes inexistentes ignoradas: ', totalNotasIgnoradas);\n  WRITELN;\n  WRITELN('DISCIPLINA                    MEDIA SEM PESO');\n  FOR indiceDisciplina := 1 TO 6 DO\n    IF totalAtualizados > 0 THEN\n      WRITELN(nomesDisciplinas[indiceDisciplina]:25, '     ', somasSemPeso[indiceDisciplina] /\n          totalAtualizados:8:2)\n    ELSE\n      WRITELN(nomesDisciplinas[indiceDisciplina]:25, '     SEM PRESENTES');\n  WRITELN('Proxima etapa: executar o trabalho 09.');\nEND."
    }
  ],
  "author": "EVANDRO LIMA BARBOSA",
  "name": "N08EVANDRO.pas"
};
