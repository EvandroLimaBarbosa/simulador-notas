'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format=v=>typeof v==='string'?v:JSON.stringify(v,null,2);
  const chapters=['1. Tipos e variáveis','2. Arquivo e READ','3. Vetor e preparação','4. Conferir notas','5. Atualizar fichas','6. Mostrar médias'];
  const lines=window.N08Original.text.split('\n');
  let frames=[],index=0,playing=false,timer=null,voiceToken=0;
  const speech=typeof window.speechSynthesis!=='undefined'&&typeof window.SpeechSynthesisUtterance!=='undefined';
  function stop(){playing=false;clearTimeout(timer);voiceToken++;if(speech)window.speechSynthesis.cancel();$('debug-play').textContent='Reproduzir aula';}
  function load(){stop();frames=window.N08Debug.buildLesson(window.N08Engine,$('debug-scenario').value);index=0;$('debug-timeline').max=frames.length-1;render();}
  function render(){
    const f=frames[index],s=f.state;
    $('debug-title').textContent=f.title;$('debug-say').textContent=f.say;$('debug-why').textContent=f.why;$('debug-why').hidden=!f.why;
    $('debug-count').textContent=`${index+1} / ${frames.length}`;$('debug-chapter').textContent=chapters[f.chapter];
    $('debug-line-label').textContent=f.line===f.end?`Linha ${f.line}`:`Linhas ${f.line}–${f.end}`;
    const start=Math.max(0,f.line-3),end=Math.min(lines.length,f.end+2);
    $('debug-code').innerHTML=lines.slice(start,end).map((line,i)=>`<span class="debug-source-row ${start+i+1>=f.line&&start+i+1<=f.end?'current':''}"><span class="debug-source-no">${start+i+1}</span><span>${esc(line)||' '}</span></span>`).join('');
    $('debug-changes').innerHTML=f.changes.length?f.changes.map(c=>`<div class="debug-change"><div class="debug-change-name">${esc(c.name)}</div><div class="debug-change-values"><div class="debug-value"><span class="debug-value-label">ANTES</span>${esc(format(c.before))}</div><span class="debug-arrow">→</span><div class="debug-value after"><span class="debug-value-label">DEPOIS</span>${esc(format(c.after))}</div></div></div>`).join(''):'<p class="no-change">Este passo explica uma declaração, testa uma condição ou controla o fluxo. Não houve mudança nas variáveis acompanhadas.</p>';
    $('debug-chapters').innerHTML=chapters.map((c,i)=>`<button data-chapter="${i}" ${f.chapter===i?'aria-current="step"':''} ${frames.some(x=>x.chapter===i)?'':'disabled'}>${c}</button>`).join('');
    $('debug-back').disabled=index===0;$('debug-next').disabled=index===frames.length-1;$('debug-play').disabled=index===frames.length-1;
    $('debug-next').textContent=index===frames.length-1?'Fim da aula':'Entendi, próximo →';
    $('debug-play').textContent=playing?'Pausar aula':'Reproduzir aula';
    $('debug-timeline').value=index;$('debug-timeline-label').textContent=`${index+1} de ${frames.length}`;
    $('debug-file-status').textContent=s.fileOpen?'aberto':'fechado';
    $('debug-disk').innerHTML='<div class="table-scroll"><table><thead><tr><th>PF</th><th>FICHA NO ARQUIVO</th><th>SOMA</th></tr></thead><tbody>'+s.disk.map((c,pf)=>`<tr class="${pf===s.focus?'selected':''}"><td class="mono ${pf===s.cursor?'cursor-marker':''}">${pf===s.cursor?'→ ':''}${pf}</td><td>${esc(c.nome)}<br><span class="micro">${window.N08Engine.format(c.num)} · ${c.falta?'ausente':'presente'}</span></td><td class="mono">${c.som}</td></tr>`).join('')+'</tbody></table></div>';
    $('debug-cursor').textContent=s.cursor===null?'O arquivo ainda não foi aberto.':`Cursor na PF ${s.cursor}${s.cursor===s.disk.length?': depois da última ficha.':'. A seta indica o próximo registro a acessar.'}`;
    $('debug-candidate').innerHTML=s.candidate?'<div class="candidate-memory"><dl>'+['num','nome','falta','notas','som'].map(k=>`<div><dt>${k}</dt><dd>${esc(Array.isArray(s.candidate[k])?s.candidate[k].join(', '):s.candidate[k])}</dd></div>`).join('')+'</dl></div>':'<p class="memory-empty">Nenhuma ficha foi lida. A variável candidato ainda não recebeu um registro do arquivo.</p>';
    $('debug-vector').innerHTML=s.vector.length?'<div class="table-scroll"><table><thead><tr><th>ÍNDICE</th><th>CC</th><th>PF</th></tr></thead><tbody>'+s.vector.map((v,i)=>`<tr><td>${i+1}</td><td class="mono">${esc(v.cc||'Ainda não')}</td><td>${v.pf}</td></tr>`).join('')+'</tbody></table></div>':'<p class="memory-empty">Nenhum presente foi inserido no vetor.</p>';
    $('debug-vars').innerHTML='<table><tbody>'+Object.entries(s.vars).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${esc(format(v))}</td></tr>`).join('')+'</tbody></table>';
    $('debug-input').textContent=s.lineIndex===null?'Nenhuma linha de notas lida.':s.rows[s.lineIndex];
    $('debug-output').textContent=s.output.length?s.output.join('\n'):'Nenhuma mensagem de WRITELN neste ponto.';
    $('debug-question').hidden=!f.question;
    $('debug-question').innerHTML=f.question?`<h3>Pausa para pensar</h3><p>${esc(f.question.ask)}</p><details><summary>Mostrar resposta</summary><p>${esc(f.question.answer)}</p></details>`:'';
  }
  function move(target){index=Math.max(0,Math.min(frames.length-1,target));if(index===frames.length-1)stop();render();}
  function speakFrame(onend){
    if(!speech||!$('debug-voice').checked){if(onend)timer=setTimeout(onend,Number($('debug-delay').value));return;}
    const token=++voiceToken;
    window.speechSynthesis.cancel();
    const f=frames[index],utterance=new SpeechSynthesisUtterance(f.title+'. '+f.say+(f.why?' '+f.why:''));
    utterance.lang='pt-BR';utterance.rate=.9;
    const voices=window.speechSynthesis.getVoices();utterance.voice=voices.find(v=>v.lang==='pt-BR')||voices.find(v=>v.lang.startsWith('pt'))||null;
    const finish=()=>{if(token===voiceToken&&playing&&onend)timer=setTimeout(onend,1200);};
    utterance.onend=finish;
    utterance.onerror=()=>{if(token===voiceToken){$('debug-voice-hint').textContent='A voz não ficou disponível. A explicação continua em texto.';finish();}};
    window.speechSynthesis.speak(utterance);
  }
  function auto(){if(!playing)return;speakFrame(()=>{if(playing){move(index+1);if(playing)auto();}});}
  $('debug-next').onclick=()=>{stop();move(index+1);speakFrame();};
  $('debug-back').onclick=()=>{stop();move(index-1);speakFrame();};
  $('debug-play').onclick=()=>{if(playing){stop();render();}else{playing=true;render();auto();}};
  $('debug-restart').onclick=()=>{stop();move(0);};
  $('debug-scenario').onchange=load;
  $('debug-timeline').oninput=e=>{stop();move(Number(e.target.value));};
  $('debug-chapters').onclick=e=>{const b=e.target.closest('[data-chapter]');if(b){stop();move(frames.findIndex(f=>f.chapter===Number(b.dataset.chapter)));}};
  $('debug-voice').onchange=()=>{stop();render();if($('debug-voice').checked)speakFrame();};
  if(!speech){$('debug-voice').disabled=true;$('debug-voice-hint').textContent='Este navegador não oferece narração. Você pode acompanhar a aula em texto e reprodução automática.';}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();render();}});
  window.addEventListener('pagehide',stop);
  load();
})();
