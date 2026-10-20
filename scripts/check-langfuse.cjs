// Exercise real Anthropic streaming + real Garden tools with a local mock provider.
// --live exports this explicitly labeled instrumentation test to Langfuse; no LLM fees.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),assert=require('node:assert/strict');
const live=process.argv.includes('--live');
if(live)process.loadEnvFile(process.env.GARDEN_ENV_FILE||'.env.local');
else process.env.LANGFUSE_TRACING_ENABLED='false';
process.env.GARDEN_TRACE_TEST='true';
process.env.LANGFUSE_TRACING_ENVIRONMENT='instrumentation-test';
process.env.ANTHROPIC_MODEL='instrumentation-test-model';
const tmp=fs.mkdtempSync(path.join(process.cwd(),'node_modules/.garden-tracing-'));
process.env.GARDEN_STORAGE='file';process.env.GARDEN_STATE_PATH=path.join(tmp,'state.json');
for(const f of fs.readdirSync('src/lib/cognitive')){
 if(f.endsWith('.ts'))fs.writeFileSync(path.join(tmp,f.replace(/\.ts$/,'.js')),ts.transpileModule(fs.readFileSync('src/lib/cognitive/'+f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,resolveJsonModule:true}}).outputText);
 if(f.endsWith('.json'))fs.copyFileSync('src/lib/cognitive/'+f,path.join(tmp,f));
}
const {runGardener}=require(path.join(tmp,'agent.js'));
const {maskTelemetry,maskTelemetryValue,initializeGardenTracing}=require(path.join(tmp,'telemetry.js'));
const {readState}=require(path.join(tmp,'storage.js'));
const Anthropic=require('@anthropic-ai/sdk').default;
const sentinel='cognitive_TEST_ONLY_NOT_A_REAL_TOKEN';
assert.ok(!maskTelemetry(sentinel+' test@example.com').includes(sentinel));
assert.ok(!maskTelemetry(sentinel+' test@example.com').includes('test@example.com'));
assert.deepEqual(maskTelemetryValue({nested:[{token:'do-not-export',text:sentinel}],number:4}),{nested:[{token:'[REDACTED]',text:'[REDACTED_GARDEN_TOKEN]'}],number:4});
if(live)assert.ok(initializeGardenTracing(),'Langfuse configuration missing');
let calls=0;
function response(content,stop){
 const events=[];
 const push=(type,data)=>events.push(`event: ${type}\ndata: ${JSON.stringify({type,...data})}\n\n`);
 push('message_start',{message:{id:'mock-'+calls,type:'message',role:'assistant',model:'instrumentation-test-model',content:[],stop_reason:null,stop_sequence:null,usage:{input_tokens:12,output_tokens:0,cache_creation_input_tokens:0,cache_read_input_tokens:0}}});
 content.forEach((b,index)=>{
  push('content_block_start',{index,content_block:b.type==='text'?{type:'text',text:''}:{...b,input:{}}});
  push('content_block_delta',{index,delta:b.type==='text'?{type:'text_delta',text:b.text}:{type:'input_json_delta',partial_json:JSON.stringify(b.input)}});
  push('content_block_stop',{index});
 });
 push('message_delta',{delta:{stop_reason:stop,stop_sequence:null},usage:{output_tokens:8}});push('message_stop',{});
 return new Response(events.join(''),{headers:{'content-type':'text/event-stream'}});
}
const client=new Anthropic({apiKey:'mock-key-never-sent',maxRetries:0,fetch:async(_url,init)=>{
 const body=JSON.parse(init.body);assert.equal(body.model,'instrumentation-test-model');assert.equal(body.stream,true);calls++;
 if(calls===1)return response([{type:'tool_use',id:'test-source',name:'read_source',input:{buildId:'missing-test-build'}}],'tool_use');
 if(calls===2)return response([{type:'tool_use',id:'test-query',name:'query_builds',input:{studentId:'raine'}}],'tool_use');
 assert.equal(calls,3,'Unexpected extra model call');
 return response([{type:'text',text:'Instrumentation test complete. No garden records were changed; this is a simulated model response.'}],'end_turn');
}});
(async()=>{
 try{
  const before=await readState();
  const run=await runGardener('raine','Instrumentation test only: query my builds. Mask this dummy credential: '+sentinel,client);
  assert.equal(run.status,'answered');assert.equal(calls,3);assert.equal(run.steps.length,2);assert.equal(run.steps[0].ok,false);assert.equal(run.steps[1].ok,true);
  const after=await readState();assert.deepEqual(after.builds,before.builds);assert.deepEqual(after.messages,before.messages);assert.equal(after.runs.length,before.runs.length+1);
  if(live){assert.match(run.traceId,/^[a-f0-9]{32}$/);fs.mkdirSync('.garden-data',{recursive:true});fs.writeFileSync('.garden-data/langfuse-smoke.json',JSON.stringify({traceId:run.traceId,runId:run.id,environment:'instrumentation-test',mockModel:true,modelCalls:3,toolCalls:2,paidModelCalls:0},null,2));}
  console.log(JSON.stringify({passed:true,liveExport:live,traceId:run.traceId,paidModelCalls:0,toolFailureCaptured:true,unrelatedStatePreserved:true}));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
})().catch(()=>{console.error('Tracing smoke check failed. Inspect local test assertions; no credentials printed.');process.exitCode=1});
