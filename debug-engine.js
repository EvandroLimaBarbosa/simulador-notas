/* Depuração didática: cada quadro registra uma instrução e seu efeito. */
(function(root){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const fmt=n=>String(n).padStart(4,'0');
  function buildLesson(engine,scenario='normal'){
    const data=engine.example();
    const candidates=data.candidates.slice(0,3);
    let rows=[engine.line(12,[80,70,60,90,85,75]),engine.line(30,[60,80,70,70,65,85]),engine.line(10,[0,0,0,0,0,0])];
    if(scenario==='invalid')rows[0]=engine.line(12,[80,70,60,140,85,75]);
    if(scenario==='duplicate')rows.push(rows[0]);
    if(scenario==='missing')rows.splice(0,1);
    if(scenario==='absent')candidates.forEach(c=>c.falta=1);
    const state={vars:{},disk:copy(candidates),candidate:null,vector:[],got:{},originalNotes:{},sums:[],cursor:null,focus:null,lineIndex:null,rows,output:[],fileOpen:false,notesOpen:false,formula:null};
    const frames=[];
    let chapter=0;
    function step(line,title,say,change=()=>{},why='',end=line,question=null){
      const before=copy(state.vars);change();
      if(state.candidate){
        state.vars.candidato=copy(state.candidate);
        for(const key of Object.keys(state.vars)){
          if(key.startsWith('candidato.')&&Object.hasOwn(state.candidate,key.slice(10)))state.vars[key]=copy(state.candidate[key.slice(10)]);
        }
      }
      const keys=new Set([...Object.keys(before),...Object.keys(state.vars)]);
      const changed=[...keys].filter(k=>JSON.stringify(before[k])!==JSON.stringify(state.vars[k]));
      const changes=changed.filter(k=>k!=='candidato'||!changed.some(name=>name.startsWith('candidato.'))).map(name=>({name,before:before[name]??'Não definido',after:state.vars[name]}));
      frames.push({line,end,title,say,why,chapter,changes,state:copy(state),question});
    }
    const set=(name,value)=>{state.vars[name]=value;};
    const rememberError=()=>set('encontrouErro',true);
    step(1,'Este é o programa que vamos acompanhar','PROGRAM N08EVANDRO dá nome ao seu programa. Vamos ler uma instrução por vez e observar seu efeito. Os candidatos deste exemplo são fictícios.',()=>{},'Os primeiros quadros explicam as declarações. Elas descrevem os dados; ainda não leem arquivos.',4);
    step(4,'Buscar as ferramentas da biblioteca','USES TARDENOITE permite usar definições feitas em outro arquivo: o tipo regis, o tipo vetor e as rotinas ordem e pebin1.',()=>{},'regis é o molde de uma ficha de candidato. A implementação da unit não está neste arquivo.');
    step(7,'Preparar os nomes das disciplinas','nomesDisciplinas é uma lista fixa com seis nomes. O índice 1 indica L.E.M.; o índice 4 indica Conhecimento específico.',()=>set('nomesDisciplinas',engine.names), '',9);
    step(10,'Preparar os pesos','pesosDisciplinas guarda os multiplicadores. A quarta disciplina tem peso 3 e a quinta tem peso 2. Os outros pesos valem 1.',()=>set('pesosDisciplinas',engine.weights));
    step(13,'FILE OF regis: um arquivo de fichas','arquivoCandidatos é uma variável que representa um arquivo formado por registros do tipo regis. Imagine um arquivo com várias fichas de candidatos.',()=>set('arquivoCandidatos','Arquivo de regis; ainda sem associação'),'Essa declaração informa o formato dos registros. Ela não escolhe o nome do arquivo nem lê candidatos.');
    step(14,'TEXT: um arquivo de linhas de texto','arquivoNotas representa um arquivo de texto. Mais tarde, READLN trará uma linha por vez para linhaNotas.',()=>set('arquivoNotas','Arquivo TEXT; ainda sem associação'));
    step(15,'candidato: espaço para uma única ficha','candidato tem o tipo regis. Ao contrário do arquivo, essa variável guarda apenas uma ficha por vez na memória. Um novo READ substitui a ficha anterior.',()=>set('candidato','Uma ficha; ainda não lida'),'FILE OF regis descreve um arquivo de fichas. regis descreve uma ficha.',15,{ask:'Qual variável representa o arquivo com várias fichas?',answer:'arquivoCandidatos. A variável candidato guarda uma única ficha por vez.'});
    step(18,'Vetor: inscrição e endereço da ficha','vetorCandidatos será uma lista auxiliar. Cada item guarda CC, a inscrição, e PF, a posição original do registro no arquivo. Ainda não há candidatos nessa lista.',()=>set('vetorCandidatos',[]));
    step(22,'Guardar notas e marcas temporárias','notasSemPeso será uma tabela: candidato por disciplina. possuiNotas marca quem já recebeu notas. somasSemPeso acumula as notas originais por disciplina.',()=>{},'Essas estruturas ficam na memória. Não são novos arquivos.',31);
    step(34,'Declarar uma função não é executá-la','Este bloco define formatarInscricao. Ele só será executado quando o programa chamar a função. Vamos entrar nele mais adiante, quando aparecer uma inscrição.',()=>{},'Por enquanto, a execução principal segue para o BEGIN da linha 42.',40);
    chapter=1;
    step(43,'ASSIGN: escolher o arquivo','ASSIGN associa a variável arquivoCandidatos ao nome CAND.IND. É como dizer: quando eu usar essa variável, estou falando desse arquivo.',()=>set('arquivoCandidatos','CAND.IND; associado, ainda fechado'),'ASSIGN não lê e não apaga o arquivo.');
    step(44,'RESET: abrir no começo','RESET abre o arquivo existente e posiciona o cursor no primeiro registro, a posição física zero. Nenhuma ficha foi copiada para candidato ainda.',()=>{state.fileOpen=true;state.cursor=0;set('arquivoCandidatos','CAND.IND aberto');set('cursor de CAND.IND',0);},'Apesar do nome, RESET não zera as notas nem apaga o arquivo.');
    step(45,'Conferir a quantidade de registros',`FILESIZE encontrou ${candidates.length} registros. A condição maior que 3000 é falsa; o programa pula o bloco de erro e continua.`,()=>set('FILESIZE(arquivoCandidatos)',candidates.length),'Se fosse maior que 3000, CLOSE e HALT encerrariam o programa.',50);
    step(53,'Começar a contagem dos presentes','A atribuição coloca zero em totalPresentes. O símbolo := significa guardar o valor da direita na variável da esquerda.',()=>set('totalPresentes',0));
    step(55,'Começar na posição física zero','posicaoFisica recebe zero. Ela acompanha a posição de cada ficha no arquivo, inclusive a dos ausentes.',()=>set('posicaoFisica',0));
    function formatCall(num){
      step(37,`STR: transformar ${num} em texto`,`STR converte ${num} para um texto com largura de quatro caracteres. Os espaços completam o começo.`,()=>set('numeroTexto',String(num).padStart(4,' ')),'numeroTexto é uma variável local da função formatarInscricao.');
      while(state.vars.numeroTexto.includes(' '))step(38,'Trocar um espaço por zero','POS encontra a posição do primeiro espaço. O WHILE substitui esse espaço por zero e repete enquanto ainda houver espaços.',()=>set('numeroTexto',state.vars.numeroTexto.replace(' ','0')));
      step(39,'Devolver a inscrição formatada',`A função devolve '${fmt(num)}'. Em Pascal, atribuir ao nome da função define o valor que será devolvido.`,()=>set('retorno de formatarInscricao',fmt(num)));
    }
    candidates.forEach((c,pf)=>{
      step(56,'WHILE: ainda existem fichas?','NOT EOF significa que ainda não chegamos ao fim do arquivo. Como há uma ficha para ler, entramos no laço.');
      step(58,`READ: copiar a ficha de ${c.nome}`,`READ pega a ficha na PF ${pf} e a coloca na variável candidato. O cursor do arquivo avança para ${pf+1}. A ficha anterior, se existia, é substituída.`,()=>{state.candidate=copy(c);state.focus=pf;state.cursor=pf+1;set('candidato',copy(c));set('cursor de CAND.IND',pf+1);},'O arquivo continua contendo todas as fichas. candidato contém apenas a ficha que acabou de ser lida.',58,pf===1?{ask:'Depois de dois READ, candidato guarda duas fichas?',answer:'Não. Guarda somente a segunda. O novo READ substituiu a primeira ficha na variável.'}:null);
      step(59,`IF: ${c.nome} está presente?`,c.falta===0?'candidato.falta vale 0. A comparação = 0 é verdadeira: vamos executar o bloco que inclui essa pessoa no vetor.':'candidato.falta vale 1. A comparação = 0 é falsa: pulamos o bloco e essa pessoa não entra no vetor.',()=>set('candidato.falta = 0',c.falta===0));
      if(c.falta===0){
        step(61,'Contar mais um presente','O programa pega totalPresentes, soma um e guarda o resultado na mesma variável.',()=>set('totalPresentes',state.vars.totalPresentes+1));
        step(62,'Guardar a posição original','O item do vetor recebe a posição física da ficha. Assim saberemos onde voltar para atualizar essa mesma pessoa depois.',()=>{state.vector.push({cc:'',pf});set('vetorCandidatos',copy(state.vector));});
        formatCall(c.num);
        step(63,'Guardar a inscrição em CC','O resultado de formatarInscricao é guardado no campo CC. Agora o item do vetor tem uma inscrição para pesquisar e uma PF para localizar a ficha.',()=>{state.vector.at(-1).cc=fmt(c.num);set('vetorCandidatos',copy(state.vector));});
      }
      step(65,'Avançar a posição física','posicaoFisica aumenta um. Isso acontece tanto para presentes quanto para ausentes, porque todas as fichas ocupam posições no arquivo.',()=>set('posicaoFisica',pf+1));
    });
    step(56,'EOF: o cadastro chegou ao fim','Agora EOF é verdadeiro. NOT EOF é falso, por isso o WHILE termina. Todas as fichas foram lidas.');
    chapter=2;
    step(69,'Ordenar apenas o vetor','Se existe mais de um presente, ordem organiza o vetor por CC. A PF acompanha a inscrição. A ordem do arquivo de candidatos não muda.',()=>{state.vector.sort((a,b)=>a.cc.localeCompare(b.cc));set('vetorCandidatos',copy(state.vector));},'ORDEM é uma rotina da unit. Aqui mostramos o resultado da ordenação, sem executar suas trocas internas.');
    step(70,'Marcar que ninguém recebeu notas','O FOR percorre os índices dos presentes e coloca FALSE em possuiNotas. Isso significa: ainda não recebemos seis notas válidas para essa pessoa.',()=>{state.vector.forEach((_,i)=>state.got[i]=false);set('possuiNotas',Object.values(state.got));});
    step(71,'Zerar os totais por disciplina','O FOR de 1 a 6 coloca zero em cada posição de somasSemPeso. Essas somas serão usadas para calcular as médias.',()=>{state.sums=[0,0,0,0,0,0];set('somasSemPeso',copy(state.sums));});
    step(72,'Zerar o contador de linhas ignoradas','totalNotasIgnoradas começa em zero. Mais tarde contará inscrições que não estão no vetor dos presentes.',()=>set('totalNotasIgnoradas',0));
    step(73,'Zerar o contador de duplicidades','totalNotasDuplicadas começa em zero. Conta quando um presente recebe um segundo conjunto válido de notas.',()=>set('totalNotasDuplicadas',0));
    step(74,'Começar a conferência sem erro','encontrouErro recebe FALSE. Qualquer erro encontrado depois mudará essa marca para TRUE.',()=>set('encontrouErro',false));
    step(77,'ASSIGN para o arquivo de notas','Agora associamos arquivoNotas ao nome NOTAS.TXT. É outra variável, para outro arquivo.',()=>set('arquivoNotas','NOTAS.TXT; associado, ainda fechado'));
    step(78,'RESET para abrir as notas','O arquivo de notas existente é aberto no começo. Vamos ler suas linhas com READLN.',()=>{state.notesOpen=true;set('arquivoNotas','NOTAS.TXT aberto');});
    chapter=3;
    rows.forEach((raw,li)=>{
      step(79,'Continuar enquanto existem linhas','NOT EOF(arquivoNotas) é verdadeiro: ainda existe uma linha a conferir.');
      step(81,`READLN: trazer a linha ${li+1}`,'A linha inteira é colocada em linhaNotas como texto. Ainda não são seis números separados.',()=>{state.lineIndex=li;set('linhaNotas',raw);state.focus=null;});
      step(83,'Contar os caracteres da linha','LENGTH mede o texto. O resultado precisa ser 28: quatro caracteres da inscrição e seis campos de quatro caracteres.',()=>set('linhaValida',raw.length===28));
      const number=Number(raw.slice(0,4));
      step(86,'COPY separa; VAL converte','COPY pega as colunas 1 a 4. VAL transforma esse trecho em numeroInscricao e informa em codigoConversao se a conversão funcionou.',()=>{set('numeroInscricao',number);set('codigoConversao',0);},'Neste exemplo, a inscrição é numérica. codigoConversao = 0 significa que a conversão funcionou.');
      step(87,'Confirmar a inscrição','As três condições precisam ser verdadeiras: conversão sem erro, número pelo menos 1 e número no máximo 9999.',()=>set('linhaValida',number>=1&&number<=9999));
      formatCall(number);
      step(91,'Guardar a inscrição padronizada','inscricaoTexto recebe o retorno da função. É esse texto com quatro posições que será procurado no vetor.',()=>set('inscricaoTexto',fmt(number)));
      step(92,'Preparar o resultado da pesquisa','posicaoEncontrada começa em zero. Zero significa que nenhuma posição foi encontrada.',()=>set('posicaoEncontrada',0));
      let lo=0,hi=state.vector.length-1,found=-1;
      if(state.vector.length){
        while(lo<=hi){const mid=Math.floor((lo+hi)/2),v=state.vector[mid];
          step(94,'PEBIN1: comparar com o meio do vetor',`Procuramos ${fmt(number)}. O meio é o índice Pascal ${mid+1}, cuja CC é ${v.cc}. ${v.cc===fmt(number)?'A inscrição é igual: encontramos.':v.cc<fmt(number)?'A inscrição procurada é maior: continuamos na metade da direita.':'A inscrição procurada é menor: continuamos na metade da esquerda.'}`,()=>{state.focus=v.pf;},'A comparação é uma ilustração do interior de PEBIN1, na unit TARDENOITE. No seu arquivo, esta linha chama a rotina.');
          if(v.cc===fmt(number)){found=mid;break;}if(v.cc<fmt(number))lo=mid+1;else hi=mid-1;
        }
      }
      step(94,'Receber o índice encontrado',found<0?'A pesquisa devolveu zero: a inscrição não está entre os presentes.':`A pesquisa devolveu ${found+1}, um índice do vetor Pascal. A PF guardada nesse item é ${state.vector[found].pf}.`,()=>set('posicaoEncontrada',found+1));
      if(found<0){step(96,'Ignorar essa linha','A pessoa é ausente ou não existe no cadastro. O programa aumenta o contador e passa à próxima linha, sem validar as seis notas desse registro.',()=>set('totalNotasIgnoradas',state.vars.totalNotasIgnoradas+1));return;}
      const notes=[];
      for(let d=0;d<6;d++){
        const start=5+d*4,note=Number(raw.slice(start-1,start+3));notes.push(note);
        step(99,`FOR: disciplina ${d+1} de 6`,'indiceDisciplina identifica qual nota está sendo tratada nesta repetição.',()=>set('indiceDisciplina',d+1));
        step(102,`Converter a nota ${d+1}`,`COPY extrai as colunas ${start} a ${start+3}: '${raw.slice(start-1,start+3)}'. VAL converte esse texto para o número ${note}.`,()=>{set('notasDaLinha',copy(notes));set('codigoConversao',0);},'',103);
        step(104,'A nota está no intervalo permitido?',`${note} ${note>=0&&note<=100?'está':'não está'} entre 0 e 100. ${note>=0&&note<=100?'A linha continua com a validade que tinha.':'linhaValida recebe FALSE.'}`,()=>{if(note<0||note>100)set('linhaValida',false);},'Uma nota posterior válida não transforma uma linha inválida em válida.',106);
      }
      if(!state.vars.linhaValida){step(127,'Registrar que houve erro','A linha é inválida. encontrouErro recebe TRUE e o programa mostra o registro problemático. A leitura continua para conferir o restante.',()=>{rememberError();state.output.push('Registro invalido em NOTAS.TXT: '+raw);},'',128);return;}
      step(110,'Já recebemos notas para essa pessoa?',state.got[found]?'possuiNotas já é TRUE. Este é um segundo conjunto de notas: há duplicidade.':'possuiNotas é FALSE. Podemos guardar este primeiro conjunto de notas.');
      if(state.got[found]){step(112,'Contar a duplicidade','totalNotasDuplicadas aumenta um e encontrouErro recebe TRUE. O programa não substitui o primeiro conjunto de notas.',()=>{set('totalNotasDuplicadas',state.vars.totalNotasDuplicadas+1);rememberError();state.output.push('Nota duplicada para a inscricao '+fmt(number)+'.');},'',114);return;}
      step(118,'Marcar que as notas chegaram','possuiNotas fica TRUE no índice encontrado. A marca será usada para detectar duplicidades e presentes sem notas.',()=>{state.got[found]=true;set('possuiNotas',Object.values(state.got));});
      step(119,'Copiar as notas para a memória','O FOR copia os seis valores para notasSemPeso, no índice do vetor. O arquivo de candidatos ainda não sofreu nenhuma atualização.',()=>{state.originalNotes[found]=notes;set('notasSemPeso',copy(state.originalNotes));},'A tabela usa o índice do vetor ordenado, não o número da inscrição.',120);
    });
    step(131,'Fechar NOTAS.TXT','Todas as linhas foram conferidas. CLOSE fecha esse arquivo; as notas válidas continuam guardadas na memória.',()=>{state.notesOpen=false;set('arquivoNotas','NOTAS.TXT fechado');});
    state.vector.forEach((v,i)=>{
      step(134,`O presente ${v.cc} recebeu notas?`,state.got[i]?'possuiNotas é TRUE. Não há falta de notas para esse presente.':'possuiNotas é FALSE. O programa marca erro e informa esse presente sem notas.');
      if(!state.got[i])step(136,'Marcar presente sem notas','encontrouErro recebe TRUE. Não é permitido atualizar apenas parte dos presentes.',()=>{rememberError();state.output.push('Presente sem notas: inscricao '+v.cc+'.');},'',137);
    });
    step(139,'Decidir se a atualização pode começar',state.vars.encontrouErro?'encontrouErro é TRUE: vamos entrar no bloco que encerra o programa.':'encontrouErro é FALSE: pulamos o bloco de erro e seguimos para a atualização.');
    if(state.vars.encontrouErro){
      step(141,'Avisar que nada foi alterado','O programa informa que NOTAS.TXT precisa ser corrigido. Nenhuma nota foi gravada no cadastro.',()=>state.output.push('Corrija NOTAS.TXT. Nenhuma nota foi alterada em CAND.IND.'));
      step(142,'Fechar o cadastro','CLOSE fecha CAND.IND.',()=>{state.fileOpen=false;set('arquivoCandidatos','CAND.IND fechado');});
      step(143,'HALT: parar aqui','HALT encerra a execução. O cadastro permanece com seus valores iniciais. Escolha outro cenário ou volte aos passos para entender o erro.');
      return frames;
    }
    chapter=4;
    step(146,'Zerar o total de atualizados','Agora a conferência passou. totalAtualizados recebe zero antes de começarmos a gravar.',()=>set('totalAtualizados',0));
    state.vector.forEach((v,i)=>{
      step(147,`FOR: atualizar o presente ${i+1}`,'indiceCandidato indica o item atual do vetor ordenado. A PF desse item localiza o registro no arquivo.',()=>{set('indiceCandidato',i+1);state.focus=v.pf;state.lineIndex=rows.findIndex(r=>r.slice(0,4)===v.cc);});
      step(149,`SEEK: ir à PF ${v.pf}`,`O registro de inscrição ${v.cc} está na posição física ${v.pf}. SEEK move o cursor até essa posição.`,()=>{state.cursor=v.pf;set('cursor de CAND.IND',v.pf);});
      step(150,'READ: copiar a ficha para atualizar','A ficha é copiada do arquivo para candidato. O cursor avança uma posição. Ainda estamos modificando uma cópia em memória, não o registro no arquivo.',()=>{state.candidate=copy(state.disk[v.pf]);state.cursor=v.pf+1;set('candidato',copy(state.candidate));set('cursor de CAND.IND',v.pf+1);});
      step(151,'Zerar a soma da ficha','candidato.som recebe zero. Isso evita acrescentar as novas notas a uma soma antiga.',()=>{state.candidate.som=0;set('candidato.som',0);});
      state.originalNotes[i].forEach((note,d)=>{
        step(152,`FOR: calcular a disciplina ${d+1}`,'O mesmo conjunto de instruções será repetido para as seis disciplinas.',()=>set('indiceDisciplina',d+1));
        step(155,'Acumular a nota original para a média',`somasSemPeso[${d+1}] recebe o valor anterior mais ${note}. Aqui não multiplicamos pelo peso.`,()=>{state.sums[d]+=note;set('somasSemPeso',copy(state.sums));},'',156);
        step(157,'Multiplicar a nota pelo peso',`${note} vezes ${engine.weights[d]} é ${note*engine.weights[d]}. Esse resultado vai para candidato.notas[${d+1}].`,()=>{state.candidate.notas[d]=note*engine.weights[d];state.formula={note,weight:engine.weights[d],result:note*engine.weights[d]};set('candidato.notas',copy(state.candidate.notas));},'',158);
        step(159,'Acrescentar a nota com peso ao total','candidato.som recebe a soma anterior mais a nota ponderada desta disciplina.',()=>{state.candidate.som+=state.candidate.notas[d];set('candidato.som',state.candidate.som);});
      });
      for(const [field,line] of [['clg',162],['clc',163],['ccl',164]])step(line,`Zerar candidato.${field}`,'O campo de classificação recebe zero. A nova classificação será calculada no trabalho 09.',()=>{state.candidate[field]=0;set('candidato.'+field,0);});
      step(167,'SEEK outra vez: voltar antes de gravar',`READ deixou o cursor em ${v.pf+1}. Agora voltamos à PF ${v.pf} para gravar a mesma ficha que foi lida.`,()=>{state.cursor=v.pf;set('cursor de CAND.IND',v.pf);},'Sem esse reposicionamento, WRITE usaria a posição seguinte.');
      step(168,'WRITE: atualizar a ficha no arquivo','Agora a ficha da memória é gravada na mesma posição do cadastro. Observe a soma mudar no arquivo, não apenas na variável candidato.',()=>{state.disk[v.pf]=copy(state.candidate);state.cursor=v.pf+1;set('registro gravado na PF '+v.pf,copy(state.candidate));set('cursor de CAND.IND',v.pf+1);});
      step(169,'Contar mais um atualizado','totalAtualizados aumenta um depois da gravação.',()=>set('totalAtualizados',state.vars.totalAtualizados+1));
    });
    step(171,'Fechar o cadastro atualizado','Todas as atualizações terminaram. CLOSE fecha o arquivo de candidatos.',()=>{state.fileOpen=false;set('arquivoCandidatos','CAND.IND fechado');});
    chapter=5;
    step(173,'Mostrar o relatório','WRITELN escreve mensagens na saída. O programa mostra o total atualizado e quantas linhas de notas foram ignoradas.',()=>{state.output.push('TRABALHO 08 - NOTAS ATUALIZADAS','Presentes atualizados: '+state.vars.totalAtualizados,'Notas ignoradas: '+state.vars.totalNotasIgnoradas);},'',177);
    for(let d=0;d<6;d++){
      step(178,`FOR: média de ${engine.names[d]}`,'indiceDisciplina percorre novamente as seis posições, agora para mostrar as médias.',()=>set('indiceDisciplina',d+1));
      step(179,'Evitar divisão por zero',state.vars.totalAtualizados?'Existe pelo menos um atualizado. Podemos dividir a soma da disciplina pelo total de atualizados.':'Não houve presentes atualizados. Vamos mostrar SEM PRESENTES.');
      if(state.vars.totalAtualizados)step(180,'Calcular e mostrar a média sem peso',`${state.sums[d]} dividido por ${state.vars.totalAtualizados} é ${(state.sums[d]/state.vars.totalAtualizados).toFixed(2)}. O :8:2 pede largura mínima de oito caracteres e duas casas decimais.`,()=>state.output.push(engine.names[d]+': '+(state.sums[d]/state.vars.totalAtualizados).toFixed(2)),'Os pesos não entram nessa divisão.',181);
      else step(183,'Mostrar SEM PRESENTES','Não fazemos a divisão. O programa mostra o nome da disciplina e a mensagem SEM PRESENTES.',()=>state.output.push(engine.names[d]+': SEM PRESENTES'));
    }
    step(184,'Fim: a próxima etapa é outro programa','WRITELN mostra a orientação para executar o trabalho 09. Essa linha não executa o outro programa automaticamente.',()=>state.output.push('Proxima etapa: executar o trabalho 09.'));
    return frames;
  }
  root.N08Debug={buildLesson};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.N08Debug;
})(globalThis);
