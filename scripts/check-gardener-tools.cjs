const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const tmp=fs.mkdtempSync(path.join(process.cwd(),'node_modules/.garden-tools-'));
for(const f of fs.readdirSync('src/lib/cognitive')){if(f.endsWith('.ts'))fs.writeFileSync(path.join(tmp,f.replace(/\.ts$/,'.js')),ts.transpileModule(fs.readFileSync('src/lib/cognitive/'+f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,resolveJsonModule:true}}).outputText);if(f.endsWith('.json'))fs.copyFileSync('src/lib/cognitive/'+f,path.join(tmp,f));}
process.env.GARDEN_STORAGE='file';process.env.GARDEN_STATE_PATH=path.join(tmp,'state.json');
const {runGardener}=require(path.join(tmp,'agent.js')),{readState,mutateState}=require(path.join(tmp,'storage.js')),{saveCheckIn}=require(path.join(tmp,'growth.js')),{resolveGardenAction}=require(path.join(tmp,'actions.js'));
const tool=(name,input)=>({type:'tool_use',id:Math.random().toString(),name,input});
const fake=(steps)=>({messages:{stream:()=>({finalMessage:async()=>{const content=steps.shift();assert.ok(content,'Unexpected extra model call');return {content,stop_reason:content[0].type==='tool_use'?'tool_use':'end_turn'};}})}});
(async()=>{
 const run=await runGardener('raine','Draft a note to Jad asking to compare our projects.',fake([[tool('read_garden_context',{})],[tool('prepare_garden_action',{kind:'message',target:'jad',content:'Could we compare our projects?'})],[{type:'text',text:'Your note is drafted. Review it before sending.'}]]));
 assert.equal(run.status,'awaiting-confirmation');assert.equal(run.scores.prepared_actions,1);let state=await readState();const draft=state.actionDrafts[0];assert.equal(state.messages.length,0);
 await mutateState(s=>resolveGardenAction(s,'raine',draft.id,true));assert.equal((await readState()).messages.length,1);
 let a,b;await mutateState(s=>{a=saveCheckIn(s,'raine',{work:'Museum XR',learning:'Spatial audio',offering:'Interaction prototyping',shareWithClass:true});b=saveCheckIn(s,'jad',{work:'Museum audio',learning:'Interaction prototyping',offering:'Spatial audio',shareWithClass:true});});
 const pairInput={fromCheckIn:a.id,toCheckIn:b.id,reason:'Both are exploring museums with complementary methods.',learnFromPeer:'Spatial audio',shareWithPeer:'Interaction prototyping'};
 const pairRun=await runGardener('raine','Find a learning partner',fake([[tool('save_learning_pair',pairInput)],[tool('read_check_ins',{}),tool('read_feedback',{})],[tool('save_learning_pair',pairInput)],[{type:'text',text:'Saved a learning opportunity with Jad.'}]]));
 assert.equal(pairRun.steps[0].ok,false);assert.equal(pairRun.scores.saved_learning_pairs,1);assert.equal(pairRun.status,'saved');
 const original=global.fetch;global.fetch=async url=>new Response(url.includes('/content?')?'Next class: consult the provisional schedule.':JSON.stringify([{uri:'course://schedule',title:'Schedule',media_type:'text/markdown',status:'provisional'}]));
 const course=await runGardener('raine','Check the schedule',fake([[tool('list_course_resources',{})],[tool('read_course_resource',{uri:'course://schedule'})],[{type:'text',text:'The schedule is provisional.'}]]));global.fetch=original;
 assert.equal(course.status,'answered');assert.equal(course.steps[1].result.status,'provisional');assert.equal((await readState()).messages.length,1);
 console.log('Mocked agent loops passed: draft/review/send, check-in evidence gate and reciprocal pairing, public course question; zero model API calls and zero real messages.');fs.rmSync(tmp,{recursive:true});
})().catch(e=>{console.error(e);process.exit(1)});
