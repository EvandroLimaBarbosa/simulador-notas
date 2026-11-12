const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const output=path.join(root,'offline');
fs.mkdirSync(output,{recursive:true});
for(const page of ['index.html','debug.html']){
  let html=fs.readFileSync(path.join(root,page),'utf8');
  html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file),'utf8')+'</style>');
  const scripts=[];
  html=html.replace(/<script defer src="([^"]+)"><\/script>/g,(_,file)=>{scripts.push(file);return '';});
  html=html.replace('</body>',()=>scripts.map(file=>'<script>'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>').join('\n')+'</body>');
  fs.writeFileSync(path.join(output,page),html);
}
console.log('Versão offline: offline/index.html e offline/debug.html');
