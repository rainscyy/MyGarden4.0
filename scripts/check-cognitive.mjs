import fs from 'node:fs/promises';
const base=process.env.GARDEN_TEST_URL||'http://127.0.0.1:3000';let cookie='';
async function get(){const r=await fetch(base+'/api/cognitive',{headers:{cookie}});if(!r.ok)throw Error('Store not available');return r.json();}
async function post(body,{status=200,bearer}={}){const r=await fetch(base+'/api/cognitive',{method:'POST',headers:{'Content-Type':'application/json',cookie,...(bearer?{Authorization:'Bearer '+bearer}:{})},body:JSON.stringify(body)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const d=await r.json();if(r.status!==status)throw Error(`${body.action}: expected ${status}, received ${r.status}: ${d.error||''}`);return d;}
let s=await get();const initialBuilds=s.builds.length;
await post({action:'interact',kind:'water',target:'jad-w2'},{status:400});
await post({action:'session',studentId:'raine'});
await post({action:'reset'});
await post({action:'interact',kind:'water',target:'raine-w2'},{status:400});
await post({action:'interact',kind:'water',target:'jad-w2'});
s=await get();if(!s.interactions.some(i=>i.actor==='raine'&&i.target==='jad-w2'&&i.kind==='water'))throw Error('Watering not persisted');
await post({action:'interact',kind:'water',target:'jad-w2'});
s=await get();if(s.interactions.some(i=>i.actor==='raine'&&i.target==='jad-w2'&&i.kind==='water'))throw Error('Water toggle failed');
await post({action:'interact',kind:'save',target:'jad-w2'});
await post({action:'interact',kind:'feedback',target:'invalid',value:'inspiring'},{status:400});
const baseline=await post({action:'baseline'});if(!baseline.steps.length||baseline.mode!=='content-baseline')throw Error('Baseline trace absent');
s=await get();const rejected=s.pairs[0].id;
await post({action:'interact',kind:'feedback',target:rejected,value:'not-relevant'});
const second=await post({action:'baseline'});if(second.steps.some(x=>x.input?.id===rejected))throw Error('Rejected pair repeated');
const registration=await post({action:'register_agent',name:'Raine test agent'});
await post({action:'interact',kind:'water',target:'jad-w2'},{bearer:registration.token});
await post({action:'interact',kind:'water',target:'jad-w2'},{bearer:'wrong-token',status:400});
await post({action:'message',to:'jad',content:'Test note: inspired by your storytelling build.'});
s=await get();if(!s.messages.some(m=>m.content.startsWith('Test note:')))throw Error('Message not saved');
await post({action:'session',studentId:'fatak'});s=await get();if(s.messages.some(m=>m.content.startsWith('Test note:')))throw Error('Private thread leaked to other garden');
await post({action:'session',studentId:'raine'});await post({action:'reset'});s=await get();if(s.builds.length!==initialBuilds)throw Error('Reset erased sources');
const result={checks:['session requirement','no self-watering','persisted watering','toggle watering','save','reject unknown targets','source-linked baseline','feedback respected','scoped agent token','invalid token rejected','message persistence','thread isolation','reset preserves sources'],passed:13,builds:s.builds.length,gardens:s.students.length};
await fs.writeFile('/tmp/gardens-platform-checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
