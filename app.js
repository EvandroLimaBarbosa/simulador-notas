'use strict';
const E = window.N08Engine;
const original = window.N08Original;
const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const phases = ['Ler presentes', 'Ordenar vetor', 'Conferir notas', 'Aplicar pesos', 'Gravar registros', 'Calcular médias'];
let source = E.example(), steps, current = -1, state, language = 'pascal', timer = null, playing = false;
let draftCandidates = E.clone(source.candidates), toastTimer;
let selectedBlock = 'intro', showFullSource = false;

const snippets = {
  intro: ['// Entrada → conferência → atualização\n// Primeiro entenda o caminho dos dados.','// Entrada → conferência → atualização\n// Use “Começar simulação” para acompanhar.'],
  open: ["ASSIGN(arquivoCandidatos, 'CAND.IND');\nRESET(arquivoCandidatos);",'// No navegador, simulamos o arquivo\n// com uma lista de objetos.\nconst cadastro = candidatos;'],
  filter: ['IF candidato.falta = 0 THEN\nBEGIN\n  vetorCandidatos[totalPresentes].pf := posicaoFisica;\n  vetorCandidatos[totalPresentes].cc :=\n    formatarInscricao(candidato.num);\nEND;', 'if (candidato.falta === 0) {\n  vetor.push({\n    pf: posicaoFisica,\n    cc: String(candidato.num).padStart(4, "0")\n  });\n}'],
  sort: ['IF totalPresentes > 1 THEN\n  ordem(vetorCandidatos, totalPresentes);','vetor.sort((a, b) =>\n  a.cc.localeCompare(b.cc)\n);'],
  line: ['READLN(arquivoNotas, linhaNotas);\nlinhaValida := LENGTH(linhaNotas) = 28;\nVAL(COPY(linhaNotas, 1, 4),\n    numeroInscricao, codigoConversao);','const inscricao = linha.slice(0, 4);\nconst tamanhoValido = linha.length === 28;\n// Validar o texto antes de converter.\nconst numero = Number(inscricao);'],
  search: ['pebin1(vetorCandidatos, inscricaoTexto,\n       totalPresentes, posicaoEncontrada);\n// Dentro de PEBIN1:\nmeio := (ini + fim) DIV 2;','const meio = Math.floor((inicio + fim) / 2);\nif (vetor[meio].cc === inscricao) return meio;\nif (vetor[meio].cc < inscricao) inicio = meio + 1;\nelse fim = meio - 1;'],
  ignore: ['IF posicaoEncontrada = 0 THEN\n  totalNotasIgnoradas :=\n    totalNotasIgnoradas + 1;', 'if (indice === -1) {\n  ignoradas++;\n  continue;\n}'],
  parse: ['VAL(COPY(linhaNotas,\n  5 + (indiceDisciplina - 1) * 4, 4),\n  notasDaLinha[indiceDisciplina],\n  codigoConversao);','const inicio = 4 + disciplina * 4;\nconst campo = linha.slice(inicio, inicio + 4);\n// Só depois de conferir o texto:\nconst nota = Number(campo.trim());'],
  store: ['possuiNotas[posicaoEncontrada] := TRUE;\nnotasSemPeso[posicaoEncontrada, indiceDisciplina]\n  := notasDaLinha[indiceDisciplina];', 'notasSemPeso[indice] = notas;\n// null = ainda não recebeu notas.\n// Uma lista = já recebeu as seis notas.'],
  error: ['encontrouErro := TRUE;\n// Registro inválido, duplicidade\n// ou presente sem notas.', 'erros.push(mensagem);\n// Guardar os problemas da conferência\n// antes de começar qualquer atualização.'],
  halt: ['IF encontrouErro THEN\nBEGIN\n  CLOSE(arquivoCandidatos);\n  HALT;\nEND;', 'if (erros.length > 0) {\n  // Encerrar antes de alterar o cadastro.\n  return { bloqueado: true, erros };\n}'],
  ready: ['// A conferência terminou sem erros.\ntotalAtualizados := 0;\nFOR indiceCandidato := 1 TO totalPresentes DO', '// Todos os presentes têm notas válidas.\nlet totalAtualizados = 0;\nfor (const item of vetor) { /* atualizar */ }'],
  seek: ['SEEK(arquivoCandidatos,\n  vetorCandidatos[indiceCandidato].pf);', 'const pf = vetor[indice].pf;\n// A posição original localiza o registro.\nconst registro = cadastro[pf];'],
  read: ['READ(arquivoCandidatos, candidato);\ncandidato.som := 0;\n// READ avança o cursor para o próximo registro.', 'const candidato = structuredClone(cadastro[pf]);\ncandidato.som = 0;\n// No simulador, o cursor avança para PF + 1.'],
  weight: ['somasSemPeso[d] := somasSemPeso[d] + notaOriginal;\ncandidato.notas[d] :=\n  notaOriginal * pesosDisciplinas[d];\ncandidato.som :=\n  candidato.som + candidato.notas[d];', 'somasSemPeso[d] += notaOriginal;\ncandidato.notas[d] = notaOriginal * pesos[d];\ncandidato.som += candidato.notas[d];'],
  classify: ['candidato.clg := 0;\ncandidato.clc := 0;\ncandidato.ccl := 0;', 'candidato.clg = 0;\ncandidato.clc = 0;\ncandidato.ccl = 0;'],
  writeSeek: ['// READ avançou: voltar antes de gravar.\nSEEK(arquivoCandidatos,\n  vetorCandidatos[indiceCandidato].pf);','// Arrays não têm cursor de arquivo.\n// O simulador mostra o SEEK do Pascal.\nconst pfDestino = vetor[indice].pf;'],
  write: ['WRITE(arquivoCandidatos, candidato);\ntotalAtualizados := totalAtualizados + 1;', 'cadastro[pf] = candidato;\ntotalAtualizados++;'],
  means: ['IF totalAtualizados > 0 THEN\n  media := somasSemPeso[d] / totalAtualizados\nELSE\n  WRITELN(\'SEM PRESENTES\');', 'const media = totalAtualizados > 0\n  ? somasSemPeso[d] / totalAtualizados\n  : null;'],
};
snippets.format = ['', 'function formatarInscricao(valorNumerico) {\n  return String(valorNumerico).padStart(4, "0");\n}'];
snippets.initialize = ['', 'const possuiNotas = Array(totalPresentes).fill(false);\nconst somasSemPeso = [0, 0, 0, 0, 0, 0];\nlet totalNotasIgnoradas = 0;\nlet totalNotasDuplicadas = 0;\nlet encontrouErro = false;'];
snippets.duplicate = ['', 'if (possuiNotas[posicaoEncontrada]) {\n  totalNotasDuplicadas++;\n  encontrouErro = true;\n}'];
snippets.missing = ['', 'for (let i = 0; i < totalPresentes; i++) {\n  if (!possuiNotas[i]) encontrouErro = true;\n}'];
function originalBlock(key) {
  return original.blocks.find(block => block.id === (key === 'ready' ? 'halt' : key)) || original.blocks[0];
}

function resetSimulation() {
  stop();
  steps = E.buildTrace(source.candidates, source.text);
  state = E.initialState(source.candidates);
  current = -1;
  render();
}
function go(index) {
  const target = Math.max(-1, Math.min(steps.length-1, index));
  if (target === current + 1) E.applyStep(state, steps[target]);
  else {
    state = E.initialState(source.candidates);
    for (let i=0; i<=target; i++) E.applyStep(state, steps[i]);
  }
  current = target;
  if (current === steps.length-1) stop();
  render();
}
function stop() { clearTimeout(timer); timer=null; playing=false; if ($('play')) $('play').textContent='Reproduzir'; }
function tick() {
  if (!playing) return;
  go(current+1);
  if (playing) timer=setTimeout(tick, Number($('speed').value));
}
function toast(message) {
  clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false;
  toastTimer=setTimeout(()=>$('toast').hidden=true,3500);
}
function render() {
  const step=steps[current], phase=step?.phase ?? -1;
  $('step-count').textContent=`${current+1} / ${steps.length} passos`;
  $('lesson').innerHTML=step
    ? `<p class="lesson-phase">${String(phase+1).padStart(2,'0')} / ${phases[phase]}</p><h2 id="step-title">${escape(step.title)}</h2><p class="explanation">${escape(step.explain)}</p>`
    : '<p class="lesson-phase">SEU PROGRAM N08EVANDRO</p><h2 id="step-title">O que seu programa<br>faz com as notas?</h2><p class="explanation">Ele lê CAND.IND e NOTAS.TXT, confere os dados, atualiza os presentes e mostra as médias. Avance para conectar cada ação ao trecho exato do seu código.</p><p class="lesson-tip">Comece sem pressa. A aba “Seu código Pascal” explica os 24 blocos.</p>';
  $('next').innerHTML=current<0 ? 'Começar simulação <span aria-hidden="true">→</span>' : 'Próximo passo <span aria-hidden="true">→</span>';
  $('next').disabled=current===steps.length-1;
  $('previous').disabled=current<0;
  $('play').disabled=current===steps.length-1;
  $('play').textContent=playing?'Pausar':'Reproduzir';
  $('finish').disabled=current===steps.length-1;
  $('progress-fill').style.width=`${(current+1)/steps.length*100}%`;
  $('phases').innerHTML=phases.map((p,i)=>`<li class="${phase===i?'current':phase>i?'passed':''} ${state.blocked&&phase===i?'failed':''}"><button data-phase="${i}" ${phase===i?'aria-current="step"':''} title="Ir ao início desta etapa"><span class="phase-number">${String(i+1).padStart(2,'0')}</span>${p}</button></li>`).join('');
  const key=step?.code || 'intro';
  const block=originalBlock(key);
  $('code-snippet').textContent=language==='pascal'?block.code:(snippets[key]||snippets.intro)[1];
  $('code-pascal').setAttribute('aria-pressed',String(language==='pascal'));
  $('code-js').setAttribute('aria-pressed',String(language==='js'));
  $('code-note').textContent=language==='pascal'?`Seu N08EVANDRO.pas · linhas ${block.start}–${block.end} · nomes e texto preservados.`:'Equivalência didática: arrays em JS começam em 0; busca não encontrada retorna −1. O original está na aba Pascal.';
  renderRegistry(); renderVector(); renderLine(); renderCalculation(); renderResults(); renderHistory(); renderLiveVariables();
}
function renderLiveVariables() {
  const initialized=steps.slice(0,current+1).some(s=>s.code==='initialize');
  const step=steps[current];
  const found=step?.search?.found ? step.search.mid+1 : step?.code==='ignore'?0 : step?.phase===2&&step.pf!==undefined&&['parse','store'].includes(step.code)?state.vector.findIndex(v=>v.pf===step.pf)+1:null;
  const value=n=>initialized?n:'Ainda não';
  const rows=[
    ['totalPresentes',step&&(step.phase>=1||['filter','format'].includes(step.code))?state.vector.length:'Ainda não'],
    ['totalAtualizados',step?.phase>=3?state.updated:'Ainda não'],
    ['totalNotasIgnoradas',value(state.ignored)],
    ['totalNotasDuplicadas',value(state.duplicates)],
    ['encontrouErro',initialized?(state.errors.length?'TRUE':'FALSE'):'Ainda não'],
    ['posicaoEncontrada',found===null?'— neste passo':found],
    ['indiceDisciplina',state.note?state.note.discipline+1:'— neste passo'],
    ['candidato.som',state.working?state.working.som:'— ainda sem ficha de atualização'],
    ['possuiNotas',initialized?`${Object.keys(state.got).length} de ${state.vector.length} presentes com TRUE`:'Ainda não'],
    ['somasSemPeso',initialized?`[${state.sums.join(', ')}]`:'Ainda não'],
  ];
  $('live-variables').innerHTML=rows.map(([name,v])=>`<div><dt>${name}</dt><dd>${escape(v)}</dd></div>`).join('');
}
function renderOriginal() {
  const block=originalBlock(selectedBlock);
  $('source-blocks').innerHTML=original.blocks.map((b,i)=>`<button data-block="${b.id}" ${b.id===selectedBlock?'aria-current="true"':''}><span>${String(i+1).padStart(2,'0')}</span><span>${escape(b.title)}<small>Linhas ${b.start}–${b.end}</small></span></button>`).join('');
  $('source-range').textContent=`N08EVANDRO.PAS · LINHAS ${block.start}–${block.end}`;
  $('source-explanation').innerHTML=`<h2>${escape(block.title)}</h2><p>${escape(block.explain)}</p><p class="source-example"><b>Para visualizar:</b> ${escape(block.example)}</p>`;
  const lines=original.text.split('\n');
  const chosen=showFullSource?lines:lines.slice(block.start-1,block.end);
  const offset=showFullSource?0:block.start-1;
  $('source-list').innerHTML=chosen.map((line,i)=>`<span class="source-line ${showFullSource&&i+1>=block.start&&i+1<=block.end?'active-line':''}"><span class="line-no" aria-hidden="true">${i+offset+1}</span><span>${escape(line)||' '}</span></span>`).join('');
  $('source-toggle').textContent=showFullSource?'Mostrar só este bloco':'Mostrar arquivo completo';
  $('source-toggle').setAttribute('aria-pressed',String(showFullSource));
  const hasSimulation=steps.some(s=>s.code===selectedBlock)||(selectedBlock==='halt'&&steps.some(s=>s.code==='ready'));
  $('source-simulate').hidden=!hasSimulation;
}
function renderRegistry() {
  const visible=state.candidates.map((c,pf)=>({c,pf})).filter(({pf})=>pf<20||pf===state.focusPf);
  $('registry-table').innerHTML='<table><thead><tr><th>PF</th><th>INSCRIÇÃO</th><th>CANDIDATO</th><th>PRESENÇA</th><th>SOMA</th></tr></thead><tbody>'+visible.map(({c,pf})=>{
    const changed=JSON.stringify(c)!==JSON.stringify(source.candidates[pf]);
    return `<tr class="${state.focusPf===pf?'highlight':''} ${c.falta?'absent-row':''} ${changed?'saved':''}"><td><span class="pf-cell">${pf}</span></td><td class="mono">${escape(E.format(c.num))}</td><td class="person-name">${escape(c.nome)}</td><td><span class="presence ${c.falta?'absent':''}">${c.falta?'Ausente':'Presente'}</span></td><td class="mono">${c.som??0}${changed?' ✓':''}</td></tr>`;
  }).join('')+'</tbody></table>'+(state.candidates.length>visible.length?`<p class="line-caption">Mostrando ${visible.length} de ${state.candidates.length} registros, incluindo o registro em foco.</p>`:'');
  $('cursor-label').textContent=state.cursor===null?'Cursor aguardando atualização':`Cursor → PF ${state.cursor}${state.cursor>=state.candidates.length?' (fim do arquivo)':''}`;
  $('registry-status').textContent=state.updated?`${state.updated} atualizado${state.updated===1?'':'s'}`:'Sem alterações';
  $('registry-status').className=state.updated?'badge':'badge neutral';
}
function renderVector() {
  $('vector-status').textContent=`${state.vector.length} presentes`;
  $('search-legend').textContent=state.search?'Borda = meio da busca':'';
  if (!state.vector.length) {
    $('vector-content').innerHTML='<div class="vector-empty"><span class="empty-symbol" aria-hidden="true">[ ]</span><p>O vetor começa vazio.<br>Só os presentes entram aqui.</p></div>';
    return;
  }
  const search=state.search;
  const entries=state.vector.map((v,i)=>({v,i})).filter(({i})=>i<30||(search&&Math.abs(i-search.mid)<3));
  $('vector-content').innerHTML='<div class="vector-cards">'+entries.map(({v,i})=>{
    const out=search&&(i<search.lo||i>search.hi), mid=search&&i===search.mid;
    return `<div class="vector-card ${out?'excluded':''} ${mid?'mid':''} ${mid&&search.found?'found':''}"><span class="index">JS [${i}] <span class="got">${state.got[i]?'✓':''}</span></span><strong>${escape(v.cc)}</strong><span class="pf">PF → ${v.pf} · Pascal [${i+1}]</span></div>`;
  }).join('')+(entries.length<state.vector.length?`<span class="more-count">+ ${state.vector.length-entries.length} itens</span>`:'')+'</div>';
}
function inputLines() {const l=source.text.replace(/\r\n?/g,'\n').split('\n');if(l.at(-1)==='')l.pop();return source.text===''?[]:l;}
function renderLine() {
  const lines=inputLines(), li=state.lineIndex ?? 0, raw=lines[li] ?? '';
  $('line-counter').textContent=lines.length?`Linha ${li+1} de ${lines.length} · ${raw.length} caracteres`:'Arquivo vazio';
  const fields=['INSC.','N1','N2','N3','N4','N5','N6'];
  $('line-content').innerHTML='<div class="line-fields">'+fields.map((f,i)=>`<div class="line-field"><span class="field-label">${f}</span><span class="field-value">${escape(raw.slice(i*4,i*4+4).padEnd(4,' ')).replace(/ /g,'·')}</span><span class="field-column">${i*4+1}–${i*4+4}</span></div>`).join('')+'</div>'+`<p class="line-caption"><b>·</b> representa um espaço. Cada campo ocupa quatro colunas.</p><p class="raw-line">${escape(raw||'(nenhuma linha)')}</p>`;
}
function renderCalculation() {
  const note=state.note, discipline=note?.discipline ?? 3, original=note?.original ?? 90;
  const total=state.working?.som;
  $('calculation').innerHTML=`<div class="calculation-inner"><p>${note?escape(E.names[discipline]):'Exemplo: Conhecimento específico'}</p><div class="formula"><div class="formula-part"><strong>${original}</strong><small>NOTA ORIGINAL</small></div><span class="operator">×</span><div class="formula-part"><strong>${E.weights[discipline]}</strong><small>PESO</small></div><span class="operator">=</span><div class="formula-part result"><strong>${original*E.weights[discipline]}</strong><small>NOTA COM PESO</small></div></div><p>${note?`A média recebe <b>${original}</b>; o total do candidato recebe <b>${original*E.weights[discipline]}</b>.`:'Acompanhe a etapa 04 para ver cada multiplicação.'}</p><div class="weight-badges">${E.weights.map((w,i)=>`<span class="${w>1?'special':''}">N${i+1} × ${w}</span>`).join('')}</div>${total!==undefined?`<div class="working-total"><span>Ficha de trabalho: ${escape(state.working.nome)}</span><strong>SOM = ${total}</strong></div>`:''}</div>`;
}
function renderResults() {
  $('results').hidden=!state.done;
  if (!state.done) return;
  $('results').classList.toggle('blocked-panel',state.blocked);
  if (state.blocked) {
    $('results').innerHTML=`<div class="result-heading"><div><span class="file-tag">CONFERÊNCIA BLOQUEADA</span><h2>O cadastro ficou protegido.</h2><p>Nenhuma nota foi alterada. Corrija os dados ou escolha outro cenário.</p></div><button class="button secondary" data-action="edit">Corrigir entrada →</button></div><ul class="error-list">${state.errors.slice(0,100).map(e=>`<li>${escape(e)}</li>`).join('')}</ul>${state.errors.length>100?`<p class="micro">${state.errors.length} erros no total; primeiros 100 exibidos.</p>`:''}`;
    return;
  }
  $('results').innerHTML=`<div class="result-heading"><div><span class="file-tag mint">EXECUÇÃO CONCLUÍDA</span><h2>Notas gravadas. Médias sem peso.</h2><p>Veja como as notas originais formam a média de cada disciplina.</p></div><button class="button secondary" data-action="download">Baixar cadastro atualizado ↓</button></div><div class="result-metrics"><div><strong>${state.updated}</strong><span>presentes atualizados</span></div><div><strong>${state.ignored}</strong><span>linhas ignoradas</span></div><div><strong>0</strong><span>erros de conferência</span></div></div><div class="mean-grid">${E.names.map((name,i)=>{
    const mean=state.means[i];
    return `<div class="mean-item"><span>${name}</span><strong>${mean===null?'—':mean.toFixed(2).replace('.',',')}</strong><div class="mean-track"><div style="width:${mean??0}%"></div></div><small>${mean===null?'SEM PRESENTES':`${state.sums[i]} ÷ ${state.updated} presentes`}</small></div>`;
  }).join('')}</div><p class="micro">CLG, CLC e CCL dos atualizados foram zerados. A classificação pertence ao trabalho 09.</p>`;
}
function renderHistory() {
  $('history-count').textContent=`${current+1} passos percorridos`;
  const start=Math.max(0,current-149);
  $('history-list').innerHTML=steps.slice(start,current+1).map((s,i)=>`<li value="${start+i+1}"><button data-step="${start+i}">${escape(s.title)}</button></li>`).join('');
}
function scenario(name) {
  source=E.example();
  const rows=source.text.split('\n');
  const descriptions={normal:'4 presentes, 1 ausente e 1 inscrição inexistente.',invalid:'A nota 140 deve impedir qualquer gravação.',duplicate:'A inscrição 0012 aparece duas vezes com notas válidas.',missing:'Carla está presente, mas não tem uma linha de notas.',absent:'Nenhum presente: nenhuma atualização e nenhuma divisão por zero.'};
  if(name==='invalid') rows[0]=E.line(12,[80,70,60,140,85,75]);
  if(name==='duplicate') rows.push(rows[0]);
  if(name==='missing') rows.splice(3,1);
  if(name==='absent') source.candidates.forEach(c=>c.falta=1);
  source.text=rows.join('\n');
  $('scenario-hint').textContent=descriptions[name];
  $('scenario').value=name;
  resetSimulation();
  draftCandidates=E.clone(source.candidates); renderEditor();
}
function normalizeCandidates(values) {
  if (!Array.isArray(values)||values.length>3000) throw new Error('Use uma lista JSON com até 3.000 candidatos.');
  const seen=new Set();
  return values.map((c,i)=>{
    if(!c||typeof c!=='object'||!Number.isInteger(c.num)||c.num<1||c.num>9999) throw new Error(`Linha ${i+1}: inscrição inteira de 1 a 9999.`);
    if(seen.has(c.num)) throw new Error(`Inscrição ${c.num} repetida no cadastro.`);
    seen.add(c.num);
    if(typeof c.nome!=='string'||!c.nome.trim()||c.nome.length>35) throw new Error(`Linha ${i+1}: nome com 1 a 35 caracteres.`);
    if(c.falta!==0&&c.falta!==1) throw new Error(`Linha ${i+1}: falta deve ser 0 (presente) ou 1 (ausente).`);
    if(c.notas!==undefined&&(!Array.isArray(c.notas)||c.notas.length!==6||c.notas.some(n=>!Number.isInteger(n)))) throw new Error(`Linha ${i+1}: notas do cadastro devem ser seis inteiros.`);
    for(const field of ['som','clg','clc','ccl']) if(c[field]!==undefined&&!Number.isInteger(c[field])) throw new Error(`Linha ${i+1}: ${field} deve ser inteiro.`);
    return {...c,notas:c.notas??[0,0,0,0,0,0],som:c.som??0,clg:c.clg??0,clc:c.clc??0,ccl:c.ccl??0};
  });
}
function collectEditor() {
  return draftCandidates.map((c,i)=>({...c,num:Number($(`num-${i}`).value),nome:$(`name-${i}`).value,falta:Number($(`absence-${i}`).value)}));
}
function renderCandidateEditor() {
  $('candidate-editor').innerHTML='<table><thead><tr><th>PF</th><th>INSCRIÇÃO</th><th>NOME</th><th>PRESENÇA</th><th></th></tr></thead><tbody>'+draftCandidates.map((c,i)=>`<tr><td><span class="pf-cell">${i}</span></td><td><input id="num-${i}" aria-label="Inscrição do candidato na PF ${i}" type="number" min="1" max="9999" value="${escape(c.num)}"></td><td><input id="name-${i}" aria-label="Nome do candidato na PF ${i}" maxlength="35" value="${escape(c.nome)}"></td><td><select id="absence-${i}" aria-label="Presença do candidato na PF ${i}"><option value="0" ${!c.falta?'selected':''}>Presente</option><option value="1" ${c.falta?'selected':''}>Ausente</option></select></td><td><button class="delete-candidate" data-delete="${i}" aria-label="Excluir candidato na PF ${i}">×</button></td></tr>`).join('')+'</tbody></table>';
}
function renderEditor() {
  renderCandidateEditor();
  $('notes-editor').value=source.text;
  $('editor-feedback').textContent='';
}
function download(name,value,type='application/json') {
  const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type});
  const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function route() {
  const pages=['laboratorio','codigo','dados','guia'];
  const name=location.hash.slice(1), view=pages.includes(name)?name:'laboratorio';
  stop();
  for(const page of pages) {
    $(`view-${page}`).hidden=page!==view;
    const a=document.querySelector(`[data-nav="${page}"]`);
    if(page===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  }
  if(view==='codigo')renderOriginal();
}
function feedback(error) {$('editor-feedback').textContent=error.message||String(error);}

$('next').onclick=()=>{stop();go(current+1);};
$('previous').onclick=()=>{stop();go(current-1);};
$('reset').onclick=()=>{resetSimulation();toast('Simulação reiniciada com os mesmos dados.');};
$('play').onclick=()=>{if(playing){stop();render();}else{playing=true;tick();}};
$('finish').onclick=()=>{stop();go(steps.length-1);$('results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
$('code-pascal').onclick=()=>{language='pascal';render();};
$('code-js').onclick=()=>{language='js';render();};
$('inspect-source').onclick=()=>{selectedBlock=originalBlock(steps[current]?.code||'intro').id;showFullSource=false;renderOriginal();location.hash='codigo';};
$('source-blocks').onclick=event=>{const button=event.target.closest('[data-block]');if(button){selectedBlock=button.dataset.block;renderOriginal();}};
$('source-toggle').onclick=()=>{showFullSource=!showFullSource;renderOriginal();};
$('source-simulate').onclick=()=>{
  const index=steps.findIndex(s=>s.code===selectedBlock||(selectedBlock==='halt'&&s.code==='ready'));
  if(index>=0){language='pascal';go(index);location.hash='laboratorio';}
};
$('download-original').onclick=()=>download('N08EVANDRO.pas',original.text,'text/plain;charset=utf-8');
$('edit-data').onclick=()=>location.hash='dados';
$('guide-start').onclick=()=>location.hash='laboratorio';
$('scenario').onchange=event=>scenario(event.target.value);
$('phases').onclick=event=>{
  const button=event.target.closest('[data-phase]');if(!button)return;
  const index=steps.findIndex(s=>s.phase===Number(button.dataset.phase));
  if(index===-1){toast('Essa etapa não é executada neste cenário. A conferência pode ter bloqueado a gravação.');return;}
  stop();go(index);
};
$('history-list').onclick=event=>{const b=event.target.closest('[data-step]');if(b){stop();go(Number(b.dataset.step));}};
$('results').onclick=event=>{const a=event.target.closest('[data-action]')?.dataset.action;if(a==='edit')location.hash='dados';if(a==='download')download('CAND-atualizado.json',state.candidates);};
$('candidate-editor').onclick=event=>{const b=event.target.closest('[data-delete]');if(b){draftCandidates=collectEditor();draftCandidates.splice(Number(b.dataset.delete),1);renderCandidateEditor();}};
$('add-candidate').onclick=()=>{
  if(draftCandidates.length>=3000){feedback(new Error('Limite de 3.000 candidatos.'));return;}
  draftCandidates=collectEditor();const used=new Set(draftCandidates.map(c=>c.num));let n=1;while(used.has(n))n++;
  draftCandidates.push({num:n,nome:'Novo candidato',falta:0});renderCandidateEditor();
};
$('restore-data').onclick=()=>{scenario('normal');toast('Dados de exemplo restaurados.');};
$('apply-data').onclick=()=>{
  try{
    const candidates=normalizeCandidates(collectEditor());
    if($('notes-editor').value.length>1000000)throw new Error('Use um TXT de até 1 MB para este laboratório.');
    source={candidates,text:$('notes-editor').value};draftCandidates=E.clone(candidates);
    $('scenario').querySelector('[value=custom]').hidden=false;$('scenario').value='custom';
    $('scenario-hint').textContent='Entrada personalizada. A conferência acontecerá passo a passo.';
    resetSimulation();$('editor-feedback').textContent='';location.hash='laboratorio';window.scrollTo(0,0);toast('Seus dados estão prontos para simular.');
  }catch(e){feedback(e);}
};
$('builder-inputs').innerHTML=['Insc.','N1','N2','N3','N4','N5','N6'].map((label,i)=>`<label>${label}<input id="builder-${i}" type="number" min="${i===0?1:0}" max="${i===0?9999:100}" value="${i===0?12:80}" aria-label="${i===0?'Inscrição para gerar linha':`Nota da disciplina ${i}`}"></label>`).join('');
$('append-line').onclick=()=>{
  const raw=Array.from({length:7},(_,i)=>$(`builder-${i}`).value);
  const values=raw.map(Number);
  if(raw.some(v=>!v.trim())||values.some((v,i)=>!Number.isInteger(v)||v<(i===0?1:0)||v>(i===0?9999:100))){feedback(new Error('No gerador, use inscrição de 1 a 9999 e notas inteiras de 0 a 100.'));return;}
  const text=$('notes-editor').value;
  $('notes-editor').value=text+(text&&!text.endsWith('\n')?'\n':'')+E.line(values[0],values.slice(1));
  $('editor-feedback').textContent='';toast('Linha adicionada ao TXT. Aplique os dados para testar.');
};
$('export-candidates').onclick=()=>{try{download('CAND-exemplo.json',normalizeCandidates(collectEditor()));}catch(e){feedback(e);}};
$('export-notes').onclick=()=>download('NOTAS.TXT',$('notes-editor').value,'text/plain;charset=utf-8');
for(const type of ['candidates','notes'])$(`import-${type}`).onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>1000000)throw new Error('Importe arquivos de até 1 MB.');
    const text=await file.text();
    if(type==='candidates'){draftCandidates=normalizeCandidates(JSON.parse(text));renderCandidateEditor();}
    else $('notes-editor').value=text.replace(/^\uFEFF/,'');
    $('editor-feedback').textContent='';toast('Arquivo importado. Clique em Aplicar para simular.');
  }catch(e){feedback(e);}finally{event.target.value='';}
};

const concepts=[
  ['O que cada variável do meu código guarda?','<b>arquivoCandidatos</b>: ligação com CAND.IND. <b>arquivoNotas</b>: ligação com NOTAS.TXT. <b>candidato</b>: uma ficha. <b>vetorCandidatos</b>: CC e PF dos presentes. <b>linhaNotas</b>: a linha atual como texto. <b>notasDaLinha</b>: seis notas convertidas. <b>notasSemPeso</b>: notas originais por índice do vetor. <b>possuiNotas</b>: marcas de recebimento. <b>somasSemPeso</b>: total original de cada disciplina. <b>linhaValida</b> vale para a linha atual; <b>encontrouErro</b> guarda se houve erro na conferência.','notasSemPeso[2, 4]  // Pascal: candidato no índice 2, disciplina 4\npossuiNotas[2]     // Já recebeu um conjunto válido?\nsomasSemPeso[4]    // Soma original da quarta disciplina'],
  ['Objeto e registro: a ficha de uma pessoa','Um <b>registro</b> agrupa os campos de um candidato. Em JavaScript usamos um <b>objeto</b>. O ponto acessa uma informação da ficha.','const candidato = { num: 12, nome: "Evandro", falta: 0 };\ncandidato.nome; // "Evandro"\ncandidato.falta === 0; // true: presente'],
  ['Array e índice: uma lista com posições','Um <b>array</b> guarda vários valores. No Pascal deste programa os vetores começam em 1; em JavaScript começam em 0. A quarta disciplina está em <code>notas[3]</code> no JS.','const notas = [80, 70, 60, 90, 85, 75];\nnotas[0]; // 80: primeira disciplina\nnotas[3]; // 90: quarta disciplina'],
  ['CC, índice e PF: três coisas diferentes','<b>CC</b> é a inscrição formatada. O <b>índice</b> é a posição no vetor. <b>PF</b> é a posição original no arquivo. Ao ordenar o vetor, CC e PF andam juntos. O cadastro mantém sua ordem original.','// Exemplo depois de ordenar:\nvetor[1] = { cc: "0012", pf: 2 };\n// Índice JS 1 → inscrição 0012 → registro na PF 2.'],
  ['ORDEM e PEBIN1: ordenar para encontrar','A pesquisa binária olha o meio da lista ordenada. Se a inscrição procurada é maior, continua na metade da direita; se é menor, na esquerda. Repete até encontrar ou acabar o intervalo. O Pascal devolve 0 se não encontra; esta versão JS usa −1.','const meio = Math.floor((inicio + fim) / 2);\nif (vetor[meio].cc < inscricao) inicio = meio + 1;\nelse fim = meio - 1;'],
  ['COPY, VAL e os 28 caracteres','A linha tem inscrição de 4 caracteres e seis notas de 4 caracteres. <code>COPY</code> separa um campo e <code>VAL</code> converte texto para número. No JS usamos <code>slice</code> e <code>Number</code>, conferindo o texto antes. Espaços fazem parte da largura do campo.','// Pascal: COPY(linha, 5, 4)\n// JS: inclui o índice 4 e exclui o 8.\nconst campo = linha.slice(4, 8);\nconst nota = Number(campo.trim());'],
  ['Conferir antes de gravar','O programa guarda as notas válidas na memória. Detecta linha inválida, notas duplicadas e presente sem notas. Se houver erro, encerra antes de atualizar o cadastro. Linhas de ausentes ou inscrições inexistentes são ignoradas. Essa proteção não é um sistema de recuperação para falhas durante gravações.','if (erros.length > 0) {\n  return; // Nenhuma atualização começa.\n}\n// Só agora o programa pode atualizar os registros.'],
  ['FOR, pesos e acumuladores','O <code>for</code> repete o cálculo para as seis disciplinas. <code>+=</code> soma ao valor que já existe. N4 tem peso 3 e N5 peso 2. Os outros pesos são 1. A soma do candidato começa em zero.','const pesos = [1, 1, 1, 3, 2, 1];\nfor (let d = 0; d < 6; d++) {\n  candidato.notas[d] = notas[d] * pesos[d];\n  candidato.som += candidato.notas[d];\n}'],
  ['SEEK, READ e WRITE: por que voltar?','<code>SEEK</code> posiciona no registro pela PF. <code>READ</code> lê e avança o cursor. Depois de modificar a ficha, o programa precisa fazer outro <code>SEEK</code> para voltar à PF correta antes de <code>WRITE</code>. Arrays JS não têm esse cursor; o laboratório o representa para explicar o Pascal.','SEEK(arquivo, pf);\nREAD(arquivo, candidato);  // Cursor avança.\n// Atualizar os campos de candidato...\nSEEK(arquivo, pf);        // Voltar!\nWRITE(arquivo, candidato);'],
  ['Soma com peso e média sem peso','A soma é o total de <b>um candidato</b>, com os pesos. A média é de <b>uma disciplina</b>, entre os presentes, usando as notas originais. Se dois presentes tiraram 90 e 70 em N4, a média é 80, mesmo com peso 3.','// Total do candidato do exemplo: 725.\n// Média de N4 entre dois presentes:\nconst mediaN4 = (90 + 70) / 2; // 80\n// Sem presentes: mostrar "SEM PRESENTES".'],
  ['O que acontece antes e depois do N08?','Antes, <b>CORRPRO</b> corrige as respostas e gera NOTAS.TXT; <b>MARCAFALTAS</b> marca os ausentes. O N08 atualiza notas, soma e zera CLG (classificação geral), CLC (no cargo) e CCL (cargo de classificação). O trabalho 09 calcula as classificações.','Respostas → CORRPRO → NOTAS.TXT\nCadastro + MARCAFALTAS → FALTA atualizado\nNOTAS.TXT + cadastro → N08 → notas e soma\nDepois → trabalho 09 → classificação'],
];
$('guide-concepts').innerHTML=concepts.map(([title,body,code])=>`<details><summary>${title}</summary><div class="concept-body"><p>${body}</p><pre tabindex="0">${escape(code)}</pre></div></details>`).join('');
window.addEventListener('hashchange',route);
resetSimulation();renderEditor();renderOriginal();route();
