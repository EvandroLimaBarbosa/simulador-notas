PROGRAM N08EVANDRO;
// FEITO POR: EVANDRO LIMA BARBOSA

USES TARDENOITE;

CONST
  nomesDisciplinas: ARRAY[1..6] OF STRING[25] =
    ('L.E.M.', 'MATEMATICA', 'LOGICA', 'CONHECIMENTO ESPECIFICO',
     'INFORMATICA', 'ATUALIDADES');
  pesosDisciplinas: ARRAY[1..6] OF INTEGER = (1, 1, 1, 3, 2, 1);

VAR
  arquivoCandidatos: FILE OF regis;
  arquivoNotas: TEXT;
  candidato: regis;

  // CC guarda a inscricao; PF guarda a posicao original em CAND.IND.
  vetorCandidatos: vetor;
  linhaNotas: STRING;
  inscricaoTexto: STRING[4];

  notasSemPeso: ARRAY[1..3000, 1..6] OF INTEGER;

  possuiNotas: ARRAY[1..3000] OF BOOLEAN;

  somasSemPeso: ARRAY[1..6] OF LONGINT;
  notasDaLinha: ARRAY[1..6] OF INTEGER;
  totalPresentes, indiceCandidato, indiceDisciplina, posicaoEncontrada, codigoConversao,
      numeroInscricao, totalAtualizados, totalNotasIgnoradas, totalNotasDuplicadas: INTEGER;
  encontrouErro, linhaValida: BOOLEAN;
  posicaoFisica: LONGINT;

// Completa a inscricao com zeros a esquerda: 12 fica '0012'.
FUNCTION formatarInscricao(valorNumerico: INTEGER): STRING;
VAR numeroTexto: STRING[4];
BEGIN
  STR(valorNumerico:4, numeroTexto);
  WHILE POS(' ', numeroTexto) > 0 DO numeroTexto[POS(' ', numeroTexto)] := '0';
  formatarInscricao := numeroTexto;
END;

BEGIN
  ASSIGN(arquivoCandidatos, 'CAND.IND');
  RESET(arquivoCandidatos);
  IF FILESIZE(arquivoCandidatos) > 3000 THEN
  BEGIN
    WRITELN('CAND.IND excede o limite de 3000 registros da unit.');
    CLOSE(arquivoCandidatos);
    HALT;
  END;

  // Somente os presentes entram no vetor para atualizacao das notas.
  totalPresentes := 0;

  posicaoFisica := 0;
  WHILE NOT EOF(arquivoCandidatos) DO
  BEGIN
    READ(arquivoCandidatos, candidato);
    IF candidato.falta = 0 THEN
    BEGIN
      totalPresentes := totalPresentes + 1;
      vetorCandidatos[totalPresentes].pf := posicaoFisica;
      vetorCandidatos[totalPresentes].cc := formatarInscricao(candidato.num);
    END;
    posicaoFisica := posicaoFisica + 1;
  END;

  // A pesquisa binaria PEBIN1 precisa do vetor ordenado por inscricao.
  IF totalPresentes > 1 THEN ordem(vetorCandidatos, totalPresentes);
  FOR indiceCandidato := 1 TO totalPresentes DO possuiNotas[indiceCandidato] := FALSE;
  FOR indiceDisciplina := 1 TO 6 DO somasSemPeso[indiceDisciplina] := 0;
  totalNotasIgnoradas := 0;
  totalNotasDuplicadas := 0;
  encontrouErro := FALSE;

  // Conferir todas as notas antes de alterar o cadastro.
  ASSIGN(arquivoNotas, 'NOTAS.TXT');
  RESET(arquivoNotas);
  WHILE NOT EOF(arquivoNotas) DO
  BEGIN
    READLN(arquivoNotas, linhaNotas);

    linhaValida := LENGTH(linhaNotas) = 28;
    IF linhaValida THEN
    BEGIN
      VAL(COPY(linhaNotas, 1, 4), numeroInscricao, codigoConversao);
      linhaValida := (codigoConversao = 0) AND (numeroInscricao >= 1) AND (numeroInscricao <= 9999);
    END;
    IF linhaValida THEN
    BEGIN
      inscricaoTexto := formatarInscricao(numeroInscricao);
      posicaoEncontrada := 0;

      IF totalPresentes > 0 THEN pebin1(vetorCandidatos, inscricaoTexto, totalPresentes, posicaoEncontrada);
      IF posicaoEncontrada = 0 THEN
        totalNotasIgnoradas := totalNotasIgnoradas + 1
      ELSE
      BEGIN
        FOR indiceDisciplina := 1 TO 6 DO
        BEGIN
          // Cada nota ocupa 4 colunas, com inicio em 5, 9, 13, 17, 21 e 25.
          VAL(COPY(linhaNotas, 5 + (indiceDisciplina - 1) * 4, 4), notasDaLinha[indiceDisciplina],
              codigoConversao);
          IF (codigoConversao <> 0) OR (notasDaLinha[indiceDisciplina] < 0) OR
              (notasDaLinha[indiceDisciplina] > 100) THEN
            linhaValida := FALSE;
        END;
        IF linhaValida THEN
        BEGIN
          IF possuiNotas[posicaoEncontrada] THEN
          BEGIN
            totalNotasDuplicadas := totalNotasDuplicadas + 1;
            encontrouErro := TRUE;
            WRITELN('Nota duplicada para a inscricao ', inscricaoTexto, '.');
          END
          ELSE
          BEGIN
            possuiNotas[posicaoEncontrada] := TRUE;
            FOR indiceDisciplina := 1 TO 6 DO notasSemPeso[posicaoEncontrada, indiceDisciplina] :=
                notasDaLinha[indiceDisciplina];
          END;
        END;
      END;
    END;
    IF NOT linhaValida THEN
    BEGIN
      encontrouErro := TRUE;
      WRITELN('Registro invalido em NOTAS.TXT: ', linhaNotas);
    END;
  END;
  CLOSE(arquivoNotas);

  FOR indiceCandidato := 1 TO totalPresentes DO
    IF NOT possuiNotas[indiceCandidato] THEN
    BEGIN
      encontrouErro := TRUE;
      WRITELN('Presente sem notas: inscricao ', vetorCandidatos[indiceCandidato].cc, '.');
    END;
  IF encontrouErro THEN
  BEGIN
    WRITELN('Corrija NOTAS.TXT. Nenhuma nota foi alterada em CAND.IND.');
    CLOSE(arquivoCandidatos);
    HALT;
  END;

  totalAtualizados := 0;
  FOR indiceCandidato := 1 TO totalPresentes DO
  BEGIN
    SEEK(arquivoCandidatos, vetorCandidatos[indiceCandidato].pf);
    READ(arquivoCandidatos, candidato);
    candidato.som := 0;
    FOR indiceDisciplina := 1 TO 6 DO
    BEGIN
      // A media usa notas sem peso; as notas gravadas recebem os pesos 3 em N4 e 2 em N5.
      somasSemPeso[indiceDisciplina] := somasSemPeso[indiceDisciplina] + notasSemPeso[indiceCandidato,
          indiceDisciplina];
      candidato.notas[indiceDisciplina] := notasSemPeso[indiceCandidato, indiceDisciplina] *
          pesosDisciplinas[indiceDisciplina];
      candidato.som := candidato.som + candidato.notas[indiceDisciplina];
    END;

    candidato.clg := 0;
    candidato.clc := 0;
    candidato.ccl := 0;

    // READ avancou o arquivo; voltar a mesma PF antes de gravar.
    SEEK(arquivoCandidatos, vetorCandidatos[indiceCandidato].pf);
    WRITE(arquivoCandidatos, candidato);
    totalAtualizados := totalAtualizados + 1;
  END;
  CLOSE(arquivoCandidatos);

  WRITELN('TRABALHO 08 - NOTAS ATUALIZADAS');
  WRITELN('Presentes atualizados: ', totalAtualizados);
  WRITELN('Notas de ausentes/inscricoes inexistentes ignoradas: ', totalNotasIgnoradas);
  WRITELN;
  WRITELN('DISCIPLINA                    MEDIA SEM PESO');
  FOR indiceDisciplina := 1 TO 6 DO
    IF totalAtualizados > 0 THEN
      WRITELN(nomesDisciplinas[indiceDisciplina]:25, '     ', somasSemPeso[indiceDisciplina] /
          totalAtualizados:8:2)
    ELSE
      WRITELN(nomesDisciplinas[indiceDisciplina]:25, '     SEM PRESENTES');
  WRITELN('Proxima etapa: executar o trabalho 09.');
END.
