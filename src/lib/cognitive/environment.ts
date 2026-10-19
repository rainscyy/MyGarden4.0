import crypto from 'node:crypto';
import type {GardenState,Build,Pair} from './types';
const id=()=>crypto.randomUUID();
export function needStudent(s:GardenState,actor:string){const student=s.students.find(x=>x.id===actor);if(!student)throw new Error('Choose a garden first.');return student;}
export function gardenView(s:GardenState){return {...s,agents:s.agents.map(({tokenHash,...a})=>a),modelConfigured:!!process.env.ANTHROPIC_API_KEY,storage:process.env.GARDEN_STORAGE==='file'||!process.env.MONGODB_URI?'file':'mongodb'};}
export function buildTokens(b:Build){return new Set([...b.themes,...b.methods].map(x=>x.toLowerCase()));}
export function suggestPairs(s:GardenState,actor:string,theme='',history=true){
 needStudent(s,actor);
 const from=s.builds.filter(b=>b.studentId===actor);
 const ignored=new Set(s.interactions.filter(i=>i.actor===actor&&i.kind==='feedback'&&i.value==='not-relevant').map(i=>i.target));
 const candidates=s.builds.filter(b=>b.studentId!==actor&&(!theme||b.themes.includes(theme)));
 const all=from.flatMap(a=>candidates.map(b=>{
  const common=[...buildTokens(a)].filter(t=>buildTokens(b).has(t));
  const pairId=[a.id,b.id].sort().join('::');
  return {a,b,common,pairId,score:common.length+(a.week===b.week?0.1:0)};
 })).filter(x=>x.common.length&&!ignored.has(x.pairId)&&(!history||!s.pairs.some(p=>p.id===x.pairId&&p.createdBy===actor))).sort((a,b)=>b.score-a.score);
 const owners=new Set<string>();return all.filter(x=>{if(owners.has(x.b.studentId))return false;owners.add(x.b.studentId);return true;}).slice(0,3);
}
export function savePair(s:GardenState,input:{fromBuild:string;toBuild:string;kind?:Pair['kind'];reason:string;sourceUrls:string[]},actor:string,creator=actor){
 needStudent(s,actor);
 const from=s.builds.find(b=>b.id===input.fromBuild),to=s.builds.find(b=>b.id===input.toBuild);
 if(!from||!to)throw new Error('Both build records must exist.');
 if(from.studentId!==actor||from.studentId===to.studentId)throw new Error('Pair your own build with another garden.');
 const validSources=new Set([from.sourceUrl,to.sourceUrl]);
 if(!input.sourceUrls||input.sourceUrls.length!==2||input.sourceUrls.some(u=>!validSources.has(u))||new Set(input.sourceUrls).size!==2)throw new Error('A pair must cite both build sources.');
 if(!input.reason?.trim())throw new Error('Add a source-based connection.');
 if(input.reason.length>4000)throw new Error('Keep the connection under 4000 characters.');
 const pairId=[from.id,to.id].sort().join('::');
 if(s.pairs.some(p=>p.id===pairId&&p.createdBy===creator))throw new Error('This pair is already in your garden.');
 if(s.interactions.some(i=>i.actor===actor&&i.target===pairId&&i.kind==='feedback'&&i.value==='not-relevant'))throw new Error('This pair was rejected.');
 const pair:Pair={id:pairId,fromBuild:from.id,toBuild:to.id,kind:input.kind||'related',reason:input.reason.trim(),sourceUrls:input.sourceUrls,createdAt:new Date().toISOString(),createdBy:creator};s.pairs.push(pair);return pair;
}
export function baselineRun(s:GardenState,actor:string){
 const candidates=suggestPairs(s,actor,'',true);const pairs=candidates.map(x=>savePair(s,{fromBuild:x.a.id,toBuild:x.b.id,reason:`Shared themes or methods: ${x.common.join(', ')}. Explore how ${x.b.title} approaches a related question.`,sourceUrls:[x.a.sourceUrl,x.b.sourceUrl]},actor));
 const run={id:id(),userId:actor,mode:'content-baseline',goal:'Find related work from the indexed snapshot.',steps:[{action:'query_builds',input:{actor},result:{candidateCount:candidates.length},at:new Date().toISOString(),ok:true},...pairs.map(p=>({action:'save_pair',input:p,result:{saved:p.id},at:new Date().toISOString(),ok:true}))],status:pairs.length?'saved':'insufficient-evidence',answer:pairs.length?`${pairs.length} connections saved from shared themes and methods.`:'No new source-supported matches. Add work or change your needs.',scores:{valid_sources:pairs.every(p=>p.sourceUrls.length===2)?1:0,no_self_pairs:1,saved_pairs:pairs.length},at:new Date().toISOString()};s.runs.push(run);return run;
}
export function interact(s:GardenState,actor:string,kind:string,target:string,value?:string){
 needStudent(s,actor);
 if(kind==='visit-garden'||kind==='visit-build'){
  const owner=kind==='visit-garden'?needStudent(s,target).id:s.builds.find(b=>b.id===target)?.studentId;
  if(!owner)throw new Error('This work is not in the garden.');
  if(owner===actor||s.interactions.some(i=>i.actor===actor&&i.kind===kind&&i.target===target))return;
  s.interactions.push({id:id(),actor,kind,target,at:new Date().toISOString()});return;
 }
 if(!['water','save','feedback'].includes(kind))throw new Error('Unknown interaction.');
 const build=s.builds.find(b=>b.id===target),pair=s.pairs.find(p=>p.id===target)||s.learningPairs?.find(p=>p.id===target&&p.createdBy===actor);
 if(!build&&!pair)throw new Error('This work is not in the garden.');
 if(kind==='water'&&(!build||build.studentId===actor))throw new Error('Water another classmate’s work.');
 if(kind==='feedback'&&!['inspiring','not-relevant','want-to-talk'].includes(value||''))throw new Error('Choose a feedback option.');
 const existing=s.interactions.find(i=>i.actor===actor&&i.kind===kind&&i.target===target);
 if(existing){if(kind==='feedback')existing.value=value;else s.interactions.splice(s.interactions.indexOf(existing),1);return;}
 s.interactions.push({id:id(),actor,kind:kind as 'water'|'save'|'feedback',target,value,at:new Date().toISOString()});
}
export function postMessage(s:GardenState,actor:string,to:string,content:string){
 needStudent(s,actor);needStudent(s,to);
 if(actor===to)throw new Error('Choose another classmate.');
 if(!content?.trim()||content.length>1000)throw new Error('Write a message of 1–1000 characters.');
 const message={id:id(),from:actor,to,content:content.trim(),at:new Date().toISOString()};s.messages.push(message);return message;
}

export function saveBouquet(s:GardenState,actor:string,name:string,buildIds:string[]){
 needStudent(s,actor);const ids=[...new Set(buildIds)];
 if(!name?.trim()||ids.length<2||ids.some(id=>!s.builds.some(b=>b.id===id)))throw new Error('A bouquet needs a name and at least two indexed builds.');
 s.bouquets??=[];
 if(s.bouquets.some(b=>b.createdBy===actor&&b.name===name.trim()))throw new Error('This bouquet is already saved.');
 const bouquet={id:id(),name:name.trim().slice(0,80),buildIds:ids,createdBy:actor,createdAt:new Date().toISOString()};s.bouquets.push(bouquet);return bouquet;
}
