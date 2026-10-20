import Anthropic from '@anthropic-ai/sdk';
import {AnthropicInstrumentation} from '@arizeai/openinference-instrumentation-anthropic';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {LangfuseSpanProcessor,isDefaultExportSpan} from '@langfuse/otel';
import {getActiveTraceId,propagateAttributes,startActiveObservation,startObservation} from '@langfuse/tracing';
import type {Run} from './types';

type Telemetry={sdk:NodeSDK;processor:LangfuseSpanProcessor};
const globalTelemetry=globalThis as typeof globalThis & {gardenTelemetry?:Telemetry};

export function tracingConfigured(){
 return process.env.LANGFUSE_TRACING_ENABLED!=='false' && Boolean(process.env.LANGFUSE_PUBLIC_KEY&&process.env.LANGFUSE_SECRET_KEY&&process.env.LANGFUSE_BASE_URL);
}

// Apply at export, including automatically instrumented model inputs and outputs.
export function maskTelemetry(data:string):string{
 let masked=data;
 for(const [name,value] of Object.entries(process.env)){
  if(value&&value.length>=8&&/(SECRET|TOKEN|API_KEY|MONGODB_URI)/i.test(name))masked=masked.split(value).join('[REDACTED]');
 }
 return masked.replace(/\bcognitive_[a-zA-Z0-9_-]+/g,'[REDACTED_GARDEN_TOKEN]')
  .replace(/\b(?:sk-ant-|sk-lf-|pk-lf-|gh[pousr]_)[a-zA-Z0-9_-]+/g,'[REDACTED_KEY]')
  .replace(/Bearer\s+[a-zA-Z0-9._~+\/-]+/gi,'Bearer [REDACTED]')
  .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[REDACTED_EMAIL]');
}

export function maskTelemetryValue(data:unknown):unknown{
 if(typeof data==='string')return maskTelemetry(data);
 if(Array.isArray(data))return data.map(maskTelemetryValue);
 if(data&&typeof data==='object')return Object.fromEntries(Object.entries(data).map(([key,value])=>
  [key,/^(authorization|cookie|token|tokenHash|apiKey|secret|password)$/i.test(key)?'[REDACTED]':maskTelemetryValue(value)]));
 return data;
}

// The SDK mask hook covers Langfuse fields; OpenInference also exports raw attributes.
class GardenSpanProcessor extends LangfuseSpanProcessor{
 onEnd(span:Parameters<LangfuseSpanProcessor['onEnd']>[0]){
  const attributes=Object.fromEntries(Object.entries(span.attributes).map(([key,value])=>[key,maskTelemetryValue(value)])) as typeof span.attributes;
  if(span.instrumentationScope.name==='@arizeai/openinference-instrumentation-anthropic'){
   const prefix='llm.output_messages.0.';
   const indices=[...new Set(Object.keys(attributes).flatMap(key=>{
    const match=key.match(/^llm\.output_messages\.0\.message\.tool_calls\.(\d+)\./);return match?[match[1]]:[];
   }))];
   const calls=indices.map(index=>{
    const key=prefix+'message.tool_calls.'+index+'.tool_call.';
    return {id:attributes[key+'id'],type:'function',function:{name:attributes[key+'function.name'],arguments:attributes[key+'function.arguments']||'{}'}};
   });
   const reasoning=Object.keys(attributes).filter(key=>key.startsWith(prefix)&&key.endsWith('.message_content.type')&&attributes[key]==='reasoning')
    .map(key=>attributes[key.replace(/\.type$/,'.text')]).filter(Boolean).join('\n');
   if(calls.length||reasoning){
    const output=JSON.stringify([{role:'assistant',content:attributes['output.value']||null,...(calls.length?{tool_calls:calls}:{}),...(reasoning?{reasoning_content:reasoning}:{})}]);
    attributes['langfuse.observation.output']=output;
    attributes['output.value']=output;
   }
  }
  super.onEnd({...span,attributes,spanContext:()=>span.spanContext(),status:{...span.status,message:span.status.message?maskTelemetry(span.status.message):undefined},events:span.events.map(event=>({...event,attributes:maskTelemetryValue(event.attributes) as typeof event.attributes}))});
 }
}

export function initializeGardenTracing():boolean{
 if(!tracingConfigured())return false;
 if(globalTelemetry.gardenTelemetry)return true;
 try{
  const processor=new GardenSpanProcessor({
   timeout:5,
   // The v6 default scope filter does not include Arize's scoped JS package name.
   shouldExportSpan:({otelSpan})=>isDefaultExportSpan(otelSpan)||otelSpan.instrumentationScope.name==='@arizeai/openinference-instrumentation-anthropic',
   environment:process.env.LANGFUSE_TRACING_ENVIRONMENT||(process.env.NODE_ENV==='production'?'production':'development'),
   mask:({data})=>maskTelemetryValue(data),
  });
  const instrumentation=new AnthropicInstrumentation();
  instrumentation.manuallyInstrument(Anthropic);
  const sdk=new NodeSDK({serviceName:'our-cognitive-gardens',autoDetectResources:false,spanLimits:{attributeCountLimit:2048},spanProcessors:[processor],instrumentations:[instrumentation]});
  sdk.start();
  globalTelemetry.gardenTelemetry={sdk,processor};
  return true;
 }catch{
  console.warn('Garden tracing could not initialize; the agent will continue without telemetry.');
  return false;
 }
}

export async function flushGardenTracing(){
 try{await globalTelemetry.gardenTelemetry?.processor.forceFlush();}
 catch{console.warn('Garden trace export failed; the saved application result is unchanged.');}
}

export async function traceGardenRun(actor:string,goal:string,execute:(traceId?:string)=>Promise<Run>):Promise<Run>{
 if(!initializeGardenTracing())return execute();
 try{
  return await propagateAttributes({userId:actor,tags:['our-gardens','garden-agent',...(process.env.GARDEN_TRACE_TEST==='true'?['instrumentation-test']:[])],metadata:{agent:'Garden Agent',appVersion:process.env.VERCEL_GIT_COMMIT_SHA||'local',testMode:process.env.GARDEN_TRACE_TEST==='true'?'mock-provider':'live-provider'}},()=>
   startActiveObservation('run-garden-agent',async span=>{
    span.update({input:goal,metadata:{turnBudget:6,toolBudget:16,wallClockBudgetMs:150000}});
    const started=performance.now();
    try{
     const run=await execute(getActiveTraceId());
     span.update({output:run.answer,level:run.status==='error'?'ERROR':run.status==='budget-reached'?'WARNING':'DEFAULT',metadata:{runId:run.id,status:run.status,elapsedSeconds:(performance.now()-started)/1000,counters:run.scores}});
     return run;
    }catch(error){
     span.update({level:'ERROR',statusMessage:maskTelemetry(error instanceof Error?error.message:'Garden run failed')});
     throw error;
    }
   },{asType:'agent'})
  );
 }finally{
  // Serverless requests must finish exporting before their execution is frozen.
  await flushGardenTracing();
 }
}

export function startGardenTool(name:string,input:unknown,toolCallId:string){
 if(!tracingConfigured()||!globalTelemetry.gardenTelemetry)return undefined;
 const reads=name.startsWith('read_')||name==='query_builds'||name==='list_course_resources';
 return reads?startObservation(name,{input,metadata:{toolCallId}},{asType:'retriever'}):startObservation(name,{input,metadata:{toolCallId}},{asType:'tool'});
}

// An external personal agent's HTTP update is observable here, not its private LLM reasoning.
export async function traceCheckIn<T>(actor:string,personalAgent:boolean,body:Record<string,unknown>,execute:()=>Promise<T>):Promise<T>{
 if(!initializeGardenTracing())return execute();
 const input=Object.fromEntries(['date','work','focus','interests','learning','offering','shareWithClass'].filter(k=>k in body).map(k=>[k,body[k]]));
 try{
  return await propagateAttributes({userId:actor,tags:['our-gardens','check-in',personalAgent?'personal-agent-api':'human-ui'],metadata:{visibility:'Garden API only; external agent model calls are not captured'}},()=>
   startActiveObservation('save-daily-check-in',async span=>{
    span.update({input});
    const result=await execute();span.update({output:result});return result;
   },{asType:'tool'})
  );
 }finally{await flushGardenTracing();}
}
