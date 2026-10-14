import fs from 'node:fs/promises';
const base=process.env.GARDEN_TEST_URL||'http://127.0.0.1:3000';
const url=base+'/api/cognitive';
const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'session',studentId:'raine'})});const cookie=r.headers.get('set-cookie').split(';')[0];
async function post(body,status=200){const r=await fetch(url,{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(r.status!==status)throw Error(`${body.action} returned ${r.status}: ${d.error||''}`);return d;}
await post({action:'plant_build',sourceUrl:base,week:2,title:'Blocked source',objective:'Test',methods:[],themes:[]},400);
await post({action:'plant_build',sourceUrl:'https://mitmedialab.github.io/agents2026-jad/',week:2,title:'Blocked source',objective:'Test',methods:[],themes:[]},400);
const before=await(await fetch(url,{headers:{cookie}})).json();const build=before.builds.find(x=>x.id==='raine-w2');
const updated=await post({action:'plant_build',...build});if(updated.id!==build.id||!updated.sourceHash||updated.origin!=='Public website observation')throw Error('Source import not saved');
await post({action:'bouquet',name:'Test bouquet',buildIds:['raine-w2','jad-w3']});
await post({action:'bouquet',name:'Test bouquet',buildIds:['raine-w2','jad-w3']},400);
const after=await(await fetch(url,{headers:{cookie}})).json();if(!after.bouquets.some(x=>x.name==='Test bouquet'))throw Error('Bouquet not stored');if(after.builds.length!==before.builds.length)throw Error('Upsert created duplicate');
const result={passed:6,checks:['private URL blocked','another student source blocked','live public source observed','own weekly build upserted without duplicate','bouquet persisted','duplicate bouquet rejected']};await fs.writeFile('/tmp/gardens-source-checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
