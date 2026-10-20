// Real model evaluation against a frozen public-source response and isolated state.
// Defaults to preparation only; --live authorizes two paid isolated repetitions, after the user’s live trial.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
const {scoreReview}=require('./score-learning.cjs');
const fixture=path.resolve(process.env.GARDEN_EVAL_FIXTURE||'.garden-data/task05');
const task=JSON.parse(fs.readFileSync(path.join(fixture,'definition.json'),'utf8'));
const snapshot=JSON.parse(fs.readFileSync(path.join(fixture,'public-snapshot.json'),'utf8'));
const live=process.argv.includes('--live');
const runDir=path.join(fixture,'runs',new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(runDir,{recursive:true});
process.loadEnvFile(process.env.GARDEN_ENV_FILE||'.env.local');
process.env.GARDEN_STORAGE='file';process.env.GARDEN_STATE_PATH=path.join(runDir,'state.json');
process.env.LANGFUSE_TRACING_ENVIRONMENT='week05-evaluation';delete process.env.GARDEN_TRACE_TEST;
if(!live)process.env.LANGFUSE_TRACING_ENABLED='false';
const compiled=fs.mkdtempSync(path.join(process.cwd(),'node_modules/.garden-eval-'));
for(const file of fs.readdirSync('src/lib/cognitive')){
 if(file.endsWith('.ts'))fs.writeFileSync(path.join(compiled,file.replace(/\.ts$/,'.js')),ts.transpileModule(fs.readFileSync('src/lib/cognitive/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText);
 if(file.endsWith('.json'))fs.copyFileSync('src/lib/cognitive/'+file,path.join(compiled,file));
}
const {readState}=require(path.join(compiled,'storage.js'));
const {runGardener}=require(path.join(compiled,'agent.js'));
const {initializeGardenTracing,flushGardenTracing}=require(path.join(compiled,'telemetry.js'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const realFetch=global.fetch;
// Replay only the selected public page. Anthropic and telemetry remain real network calls.
// All indexed sources already live in the frozen state; model/network calls remain real.
const initial={version:0,students:snapshot.students,builds:snapshot.builds,pairs:snapshot.pairs||[],bouquets:snapshot.bouquets||[],interactions:snapshot.interactions||[],checkIns:snapshot.checkIns||[],messages:[],runs:[],agents:[],actionDrafts:[],learningPairs:[]};
const results=[];
(async()=>{
 try {
  fs.writeFileSync(process.env.GARDEN_STATE_PATH,JSON.stringify(initial));
  const before=await readState();
  for(const id of task.buildIds)assert.ok(before.builds.find(b=>b.id===id)?.sourceExcerpt,'Missing source snapshot');
  const source={hash:hash(JSON.stringify(before.builds.filter(b=>task.buildIds.includes(b.id))))};
  fs.writeFileSync(path.join(runDir,'initial-state.json'),JSON.stringify(before,null,2));
  const metadata={taskId:task.id,peerData:'SIMULATED PEER CHECK-IN: Stacey; user-provided hypothetical learning/offering',model:process.env.ANTHROPIC_MODEL||'claude-opus-4-6',stateHash:hash(JSON.stringify(before)),sourceHash:source.hash,sourceMode:'frozen real indexed source snapshots and check-ins; no source network replay',privateHistory:'Empty in isolated fixture; no claim about actual private history',agentCodeHash:hash(fs.readFileSync('src/lib/cognitive/agent.ts')),toolSourceCodeHash:hash(fs.readFileSync('src/lib/cognitive/sources.ts')),maxTurns:6,maxTools:16,maxOutputTokens:4096,thinking:'adaptive',sampling:'provider default; no temperature override',providerRetries:1,nominalRunBudgetSeconds:150,trialReset:true};
  fs.writeFileSync(path.join(runDir,'configuration.json'),JSON.stringify(metadata,null,2));
  fs.writeFileSync(path.join(fixture,'latest-run-path.txt'),runDir);
  if(!live){console.log(JSON.stringify({prepared:true,modelCalls:0,runDir,sourceHash:source.hash}));return;}
  assert.ok(process.env.ANTHROPIC_API_KEY,'Missing model API key');assert.ok(initializeGardenTracing(),'Tracing unavailable');
  const {LangfuseClient}=require('@langfuse/client');
  const {propagateAttributes}=require('@langfuse/tracing');
  const langfuse=new LangfuseClient();
  for(const trial of task.trials){
   let row;
   const result=await langfuse.experiment.run({name:'Our Gardens — Reciprocal learning — simulated Stacey',runName:'task05-'+path.basename(runDir)+'-trial-'+trial,maxConcurrency:1,
    description:'One real task, reset state per trial; source replay; no production mutations.',metadata:{...metadata,trial},
    data:[{id:task.id,input:{prompt:task.prompt,owner:task.owner},expectedOutput:task.expected,metadata:{...metadata,trial}}],
    task:async(item)=>{
     fs.writeFileSync(process.env.GARDEN_STATE_PATH,JSON.stringify(before));
     assert.deepEqual(await readState(),before,'Reset failed');
     const start=performance.now();
     const run=await propagateAttributes({tags:['week05-evaluation','task05','trial-'+trial],metadata:{taskId:task.id,trial:String(trial),sourceHash:source.hash}},()=>runGardener(task.owner,item.input.prompt,undefined,message=>console.log(JSON.stringify({trial,progress:message}))));
     const seconds=(performance.now()-start)/1000;
     const after=await readState();
     const graded=scoreReview(before,after,run,task);
     row={trial,traceId:run.traceId,status:run.status,completion_time_seconds:seconds,...graded,output_quality:null,answer:run.answer,steps:run.steps,review:after.runs.find(r=>r.id===run.id)?.answer};
     fs.writeFileSync(path.join(runDir,'trial-'+trial+'.json'),JSON.stringify({row,run,before,after},null,2));
     return {answer:run.answer,traceId:run.traceId,status:run.status,task_completion:graded.task_completion,checks:graded.checks,completion_time_seconds:seconds,review:row.review};
    },
    evaluators:[async({output})=>({name:'task_completion',value:output.task_completion,comment:JSON.stringify(output.checks)}),async({output})=>({name:'completion_time_seconds',value:output.completion_time_seconds,comment:'Full Garden Agent request through termination and export; fixture reset and grading excluded.'})]
   });
   await flushGardenTracing();await langfuse.flush();
   if(!row)throw new Error('Experiment did not execute task');
   row.experimentId=result.experimentId;row.experimentUrl=result.experimentUrl;results.push(row);
   fs.writeFileSync(path.join(runDir,'results.json'),JSON.stringify({task,metadata,results},null,2));
   console.log(JSON.stringify({trial,status:row.status,task_completion:row.task_completion,seconds:row.completion_time_seconds,traceId:row.traceId,experimentUrl:row.experimentUrl}));
   // A provider-wide authorization/billing/rate issue is not fixed by repeating paid requests.
   if(row.status==='error' && /credit|billing|rate.limit|authenticate|401|429/i.test(row.answer)){console.log('Remaining trials stopped for provider availability; failed attempt retained.');break;}
  }
  console.log(JSON.stringify({finished:true,runDir,trials:results.length,passed:results.filter(x=>x.task_completion===1).length}));
 } finally {global.fetch=realFetch;fs.rmSync(compiled,{recursive:true,force:true});}
})().catch(error=>{console.error('Evaluation stopped:',String(error.message).replace(/(?:sk-ant-|sk-lf-|pk-lf-)[a-zA-Z0-9_-]+/g,'[REDACTED]'));process.exitCode=1;});
