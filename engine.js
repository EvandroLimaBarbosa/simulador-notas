/* Núcleo didático independente da interface. O cadastro binário é simulado em memória. */
(function (root) {
  'use strict';
  const names = ['L.E.M.', 'Matemática', 'Lógica', 'Conhecimento específico', 'Informática', 'Atualidades'];
  const weights = [1, 1, 1, 3, 2, 1];
  const clone = value => JSON.parse(JSON.stringify(value));
  const format = n => String(n).padStart(4, '0');
  const line = (n, notes) => format(n) + notes.map(x => String(x).padStart(4, ' ')).join('');
  function example() {
    return {
      candidates: [
        { num: 30, nome: 'Ana Souza', falta: 0, notas: [0,0,0,0,0,0], som: 0, clg: 8, clc: 3, ccl: 1 },
        { num: 10, nome: 'Bruno Costa', falta: 1, notas: [0,0,0,0,0,0], som: 0, clg: 0, clc: 0, ccl: 0 },
        { num: 12, nome: 'Evandro Lima', falta: 0, notas: [0,0,0,0,0,0], som: 0, clg: 4, clc: 2, ccl: 1 },
        { num: 7, nome: 'Carla Santos', falta: 0, notas: [0,0,0,0,0,0], som: 0, clg: 2, clc: 1, ccl: 2 },
        { num: 25, nome: 'Diego Alves', falta: 0, notas: [0,0,0,0,0,0], som: 0, clg: 6, clc: 2, ccl: 2 },
      ],
      text: [line(12,[80,70,60,90,85,75]), line(30,[60,80,70,70,65,85]),
        line(25,[70,60,80,80,75,60]), line(7,[90,90,80,95,90,100]),
        line(10,[0,0,0,0,0,0]), line(9999,[50,50,50,50,50,50])].join('\n'),
    };
  }
  function initialState(candidates) {
    return { candidates: clone(candidates), vector: [], got: {}, sums: [0,0,0,0,0,0],
      errors: [], ignored: 0, duplicates: 0, updated: 0, working: null, cursor: null,
      search: null, focusPf: null, lineIndex: null, note: null, means: null, blocked: false, done: false };
  }
  function applyStep(state, step) {
    const d = step.data || {};
    state.focusPf = step.pf ?? null;
    state.lineIndex = step.lineIndex ?? null;
    state.note = null;
    state.search = step.search || null;
    switch (step.op) {
      case 'append': state.vector.push(d); break;
      case 'sort': state.vector = clone(d); break;
      case 'error': state.errors.push(step.explain); if(step.code==='duplicate')state.duplicates++; break;
      case 'ignore': state.ignored++; break;
      case 'store': state.got[d.index] = d.notes; break;
      case 'blocked': state.blocked = true; state.done = true; break;
      case 'seek': state.cursor = step.pf; break;
      case 'read':
        state.working = clone(state.candidates[step.pf]);
        state.working.som = 0;
        state.cursor = step.pf + 1;
        break;
      case 'weight':
        state.working.notas[d.discipline] = d.original * weights[d.discipline];
        state.working.som += state.working.notas[d.discipline];
        state.sums[d.discipline] += d.original;
        state.note = d;
        break;
      case 'classify': Object.assign(state.working, { clg: 0, clc: 0, ccl: 0 }); break;
      case 'write':
        state.candidates[step.pf] = clone(state.working);
        state.updated++;
        state.cursor = step.pf + 1;
        break;
      case 'done':
        state.means = state.sums.map(n => state.updated ? n / state.updated : null);
        state.done = true;
        break;
    }
    return state;
  }
  function buildTrace(candidates, text) {
    const steps = [];
    const emit = (phase, title, explain, code, extra = {}) => steps.push({ phase, title, explain, code, ...extra });
    const vector = [], got = {}, lineIndices = {}, errors = [];
    const fail = (message, extra = {}) => {
      errors.push(message);
      emit(2, 'A conferência encontrou um erro', message, 'error', { op: 'error', ...extra });
    };
    emit(0, 'Abrir o cadastro', 'ASSIGN liga o nome lógico ao arquivo. RESET abre o cadastro existente. Aqui, cada ficha representa um registro de CAND.IND.', 'open');
    if (candidates.length > 3000) {
      fail('O cadastro excede o limite de 3.000 registros.', {code:'open'});
      emit(2, 'Execução interrompida', 'O limite da unit foi ultrapassado. Nenhum registro foi alterado.', 'halt', {op:'blocked'});
      return steps;
    }
    candidates.forEach((c, pf) => {
      if (c.falta === 0) {
        const entry = { cc: format(c.num), pf };
        emit(0, `formatarInscricao(${c.num}) devolve '${entry.cc}'`, 'Sua função usa STR para transformar o número em texto com quatro posições e WHILE com POS para trocar espaços por zeros à esquerda.', 'format', {pf});
        vector.push(entry);
        emit(0, `${c.nome} entra no vetor`, `FALTA = 0: presente. CC recebe ${entry.cc}; PF recebe ${pf}, sua posição original no cadastro.`, 'filter', {op:'append', data:entry, pf});
      } else {
        emit(0, `${c.nome} fica de fora`, 'FALTA = 1: ausente. O registro é lido, mas não entra no vetor e não receberá atualização.', 'filter', {pf});
      }
    });
    // A unit usa trocas sucessivas; o sort reproduz o resultado da ordenação.
    vector.sort((a,b) => a.cc.localeCompare(b.cc));
    emit(1, 'Ordenar as inscrições', 'O vetor fica em ordem crescente de CC. A PF acompanha a inscrição. A ordem dos registros do cadastro não muda.', 'sort', {op:'sort', data:vector});
    emit(1, 'Inicializar possuiNotas e os acumuladores', 'O FOR marca FALSE para todos os presentes. As seis somas, totalNotasIgnoradas e totalNotasDuplicadas começam em zero. encontrouErro começa em FALSE.', 'initialize');
    let lines = text.replace(/\r\n?/g,'\n').split('\n');
    // READLN não cria um registro extra apenas por existir uma quebra no fim.
    if (lines.at(-1) === '') lines.pop();
    if (text === '') lines = [];
    lines.forEach((raw, lineIndex) => {
      const context = {lineIndex};
      emit(2, `Ler a linha ${lineIndex+1} de NOTAS.TXT`, 'A linha deve ter 28 caracteres: quatro para a inscrição e seis campos de quatro caracteres para as notas.', 'line', context);
      const field = raw.slice(0,4).trim();
      const num = /^[+-]?\d+$/.test(field) ? Number(field) : NaN;
      if (raw.length !== 28 || !Number.isInteger(num) || num < 1 || num > 9999) {
        fail(`Linha ${lineIndex+1} inválida: confira os 28 caracteres e a inscrição de 1 a 9999.`, context);
        return;
      }
      const target = format(num);
      let lo=0, hi=vector.length-1, found=-1;
      while (lo<=hi) {
        const mid=Math.floor((lo+hi)/2), entry=vector[mid];
        const comparison=entry.cc===target ? 'É a inscrição procurada.' : entry.cc<target ? 'A chave do meio é menor: a busca continua à direita.' : 'A chave do meio é maior: a busca continua à esquerda.';
        emit(2, `Pesquisar a inscrição ${target}`, `Índices JS ${lo} a ${hi}; meio = ${mid}. Comparar ${target} com ${entry.cc}. ${comparison}`, 'search',
          {...context, pf:entry.pf, search:{lo,hi,mid,target,found:entry.cc===target}});
        if (entry.cc===target) {found=mid;break;}
        if (entry.cc<target) lo=mid+1; else hi=mid-1;
      }
      if (found===-1) {
        emit(2, `Ignorar a inscrição ${target}`, 'Não está no vetor dos presentes: pode ser um ausente ou uma inscrição inexistente. Como no Pascal, os seis campos de notas dessa linha não são conferidos.', 'ignore', {...context,op:'ignore'});
        return;
      }
      const notes = Array.from({length:6}, (_,d) => {
        const value=raw.slice(4+d*4,8+d*4).trim();
        return /^[+-]?\d+$/.test(value) ? Number(value) : NaN;
      });
      emit(2, `Separar e converter as seis notas de ${target}`, 'COPY extrai cada campo; VAL converte texto em inteiro. No JavaScript, usamos slice e Number, com validação do texto antes da conversão.', 'parse', {...context,pf:vector[found].pf});
      if (notes.some(n=>!Number.isInteger(n)||n<0||n>100)) {
        fail(`Linha ${lineIndex+1}: as seis notas devem ser inteiros entre 0 e 100.`, context);
      } else if (got[found]) {
        fail(`Notas duplicadas para a inscrição ${target}. totalNotasDuplicadas aumenta e encontrouErro recebe TRUE.`, {...context,code:'duplicate'});
      } else {
        got[found]=notes;
        lineIndices[found]=lineIndex;
        emit(2, `Guardar as notas de ${target} na memória`, 'As notas estão válidas. possuiNotas fica verdadeiro para este índice. O cadastro ainda não foi alterado.', 'store', {...context,op:'store',pf:vector[found].pf,data:{index:found,notes}});
      }
    });
    vector.forEach((v,index) => {if (!got[index]) fail(`Presente sem notas: inscrição ${v.cc}.`, {pf:v.pf,code:'missing'});});
    if (errors.length) {
      emit(2, 'Gravação bloqueada', 'Há erros nos dados. HALT encerra o programa antes das gravações. Corrija a entrada e inicie novamente: nenhuma nota do cadastro foi alterada.', 'halt', {op:'blocked'});
      return steps;
    }
    emit(2, 'Conferência concluída', 'Todos os presentes têm exatamente um conjunto válido de notas. Agora a atualização pode começar.', 'ready');
    vector.forEach((v,index) => {
      const c=candidates[v.pf];
      const context={pf:v.pf,lineIndex:lineIndices[index]};
      emit(3, `SEEK: ir à posição física ${v.pf}`, `A inscrição ${v.cc} ocupa o índice JS ${index} do vetor, mas está na PF ${v.pf} do cadastro. SEEK usa a PF, não a inscrição.`, 'seek', {...context,op:'seek'});
      emit(3, `READ: carregar ${c.nome}`, `O registro é copiado para a variável candidato. A soma é zerada. Após READ, o cursor avança de ${v.pf} para ${v.pf+1}.`, 'read', {...context,op:'read'});
      got[index].forEach((original,discipline) => {
        emit(3, `${names[discipline]}: ${original} × ${weights[discipline]}`, `A nota ${original} entra sem peso na soma da disciplina. Para o candidato, grava-se ${original*weights[discipline]} e acumula-se esse valor em SOM.`, 'weight',
          {...context,op:'weight',data:{original,discipline,index}});
      });
      emit(4, 'Zerar as classificações anteriores', 'CLG, CLC e CCL recebem zero. A classificação será calculada no trabalho 09; o N08 apenas prepara os campos.', 'classify', {...context,op:'classify'});
      emit(4, `SEEK de novo para a PF ${v.pf}`, `READ havia avançado o cursor para ${v.pf+1}. É preciso voltar à PF ${v.pf} antes de gravar para atualizar o registro correto.`, 'writeSeek', {...context,op:'seek'});
      emit(4, `WRITE: salvar ${c.nome}`, 'A ficha de trabalho substitui o registro da mesma PF. Os outros campos são preservados. totalAtualizados aumenta em um.', 'write', {...context,op:'write'});
    });
    emit(5, 'Calcular as médias e fechar os arquivos', vector.length ? 'Cada soma SEM PESO é dividida pelo número de presentes atualizados. Os ausentes ficam fora do cálculo. O próximo trabalho fará a classificação.' : 'Não há presentes: exibe SEM PRESENTES e evita divisão por zero.', 'means', {op:'done'});
    return steps;
  }
  function run(candidates,text) {
    return buildTrace(candidates,text).reduce(applyStep,initialState(candidates));
  }
  const api={names,weights,clone,format,line,example,initialState,applyStep,buildTrace,run};
  root.N08Engine=api;
  if (typeof module!=='undefined' && module.exports) module.exports=api;
})(globalThis);
