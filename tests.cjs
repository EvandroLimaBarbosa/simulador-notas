const assert = require('node:assert/strict');
const E = require('./engine.js');
const fixture = E.example();
const baseline = E.clone(fixture.candidates);
const result = E.run(fixture.candidates,fixture.text);
assert.equal(result.updated,4);
assert.equal(result.ignored,2);
assert.equal(result.blocked,false);
assert.deepEqual(result.vector.map(x=>x.cc),['0007','0012','0025','0030']);
assert.deepEqual(result.vector.map(x=>x.pf),[3,2,4,0]);
assert.deepEqual(result.candidates[2].notas,[80,70,60,270,170,75]);
assert.equal(result.candidates[2].som,725);
assert.deepEqual(result.sums,[300,300,290,335,315,320]);
assert.deepEqual(result.means,[75,75,72.5,83.75,78.75,80]);
assert.deepEqual(result.candidates[1],baseline[1]);
assert.deepEqual(fixture.candidates,baseline,'Trace must not mutate input');
for(const c of result.candidates.filter(c=>c.falta===0))assert.deepEqual([c.clg,c.clc,c.ccl],[0,0,0]);

const rows=fixture.text.split('\n');
for(const [label,text] of [
  ['invalid mark',[E.line(12,[80,70,60,140,85,75]),...rows.slice(1)].join('\n')],
  ['duplicate',[...rows,rows[0]].join('\n')],
  ['missing',rows.filter((_,i)=>i!==3).join('\n')],
  ['wrong length',[...rows,'0012'].join('\n')],
  ['blank mark',[`0012    ${rows[0].slice(8)}`,...rows.slice(1)].join('\n')],
  ['internal blank line',[rows[0],'',...rows.slice(1)].join('\n')],
]) {
  const invalid=E.run(baseline,text);
  assert.equal(invalid.blocked,true,label);
  assert.equal(invalid.updated,0,label);
  assert.deepEqual(invalid.candidates,baseline,label+' must preserve all records');
}
const noPresent=E.run(baseline.map(c=>({...c,falta:1})),fixture.text);
assert.equal(noPresent.updated,0);
assert.equal(noPresent.ignored,6);
assert.equal(noPresent.blocked,false);
assert.deepEqual(noPresent.means,[null,null,null,null,null,null]);
const empty=E.run([], '');
assert.equal(empty.blocked,false);
assert.deepEqual(empty.means,[null,null,null,null,null,null]);
assert.equal(E.run(baseline,fixture.text+'\r\n').updated,4);
assert.equal(E.run(baseline,'').blocked,true);
const noMatch=E.run([], '9999xxxxxxxxxxxxxxxxxxxxxxxx');
assert.equal(noMatch.blocked,false,'Unmatched notes are ignored before mark parsing, as in Pascal');
assert.equal(noMatch.ignored,1);
const second=E.run(result.candidates,fixture.text);
assert.deepEqual(second.candidates,result.candidates,'Rerun must not compound weights');
const replay=E.buildTrace(baseline,fixture.text);
const replayState=E.initialState(baseline);
for(const step of replay){
  if(step.op==='write')assert.equal(replayState.cursor,step.pf,'Write requires the second SEEK');
  E.applyStep(replayState,step);
}
assert.deepEqual(replayState,result);
const tooMany=E.run(Array.from({length:3001},()=>baseline[0]),'');
assert.equal(tooMany.blocked,true);
const duplicateResult=E.run(baseline,[fixture.text,rows[0]].join('\n'));
assert.equal(duplicateResult.duplicates,1);
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('./original-source.js','utf8'),context);
const original=context.window.N08Original;
assert.equal(original.text,fs.readFileSync('./N08EVANDRO.pas','utf8'));
assert.equal(original.blocks.length,24);
for(const block of original.blocks) {
  assert.equal(block.code,original.text.split('\n').slice(block.start-1,block.end).join('\n'));
}
const blockIds=new Set(original.blocks.map(b=>b.id));
for(const step of [...replay,...E.buildTrace(baseline,[fixture.text,rows[0]].join('\n'))]) {
  assert.ok(blockIds.has(step.code)||step.code==='ready','Every step must link to a real source block: '+step.code);
}
for(const step of replay.filter(s=>s.op==='weight')) {
  const row=rows[step.lineIndex];
  assert.equal(Number(row.slice(0,4)),baseline[step.pf].num,'TXT should follow the candidate being updated');
  assert.equal(Number(row.slice(4+step.data.discipline*4,8+step.data.discipline*4)),step.data.original);
}
console.log('OK: weights, means, physical mapping, absent preservation, validation, duplicates, missing notes, empty input, CRLF, reruns and SEEK/WRITE.');
console.log('OK: original Pascal source, all 24 exact line ranges, source mapping and duplicate counter.');
