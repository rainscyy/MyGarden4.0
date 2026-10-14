import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const source=await fs.readFile(new URL('../src/lib/cognitive/agent-stream.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {readGardenerStream}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));
const run={id:'test',status:'saved',answer:'Two recommendations saved.',steps:[]};
function response(events,{complete=true}={}){
 const bytes=new TextEncoder().encode(events.map(e=>JSON.stringify(e)).join('\n')+(complete?'\n':''));
 return new Response(new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=3)c.enqueue(bytes.slice(i,i+3));c.close();}}),{headers:{'content-type':'application/x-ndjson'}});
}
const progress=[];
assert.deepEqual(await readGardenerStream(response([{type:'progress',message:'Reading 🌱 sources…'},{type:'result',run}],{complete:false}),m=>progress.push(m)),run);
assert.deepEqual(progress,['Reading 🌱 sources…']);
await assert.rejects(readGardenerStream(response([{type:'error',message:'Model service unavailable'}]),()=>{}),/Model service unavailable/);
await assert.rejects(readGardenerStream(response([{type:'progress',message:'Reading'}]),()=>{}),/connection ended/);
await assert.rejects(readGardenerStream(new Response(JSON.stringify({error:'Not connected'}),{status:503}),()=>{}),/Not connected/);
assert.deepEqual(await readGardenerStream(new Response(JSON.stringify(run),{headers:{'content-type':'application/json'}}),()=>{}),run);
console.log('5 stream checks passed: fragmented Unicode, final record without newline, server errors, incomplete streams, JSON compatibility.');
