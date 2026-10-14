import crypto from 'node:crypto';
import {NextResponse} from 'next/server';
import {readState,mutateState,legacySummary} from '@/lib/cognitive/storage';
import {gardenView,interact,postMessage,baselineRun,needStudent,saveBouquet} from '@/lib/cognitive/environment';
import {requestActor,sessionActor,sessionValue,hashToken} from '@/lib/cognitive/auth';
import {runGardener} from '@/lib/cognitive/agent';
import {observePublicSource,upsertObservedBuild} from '@/lib/cognitive/sources';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=180;
export async function GET(req:Request){
 try{
  const state=await readState();const actor=req.headers.get('authorization')?requestActor(req,state).actor:sessionActor(req);
  if(new URL(req.url).searchParams.get('legacy')==='1')return NextResponse.json(await legacySummary());
  return NextResponse.json({...gardenView(state),messages:state.messages.filter(m=>m.from===actor||m.to===actor),viewer:actor});
 }catch{return NextResponse.json({error:'The garden store is unavailable. Check the database connection or use GARDEN_STORAGE=file for local development.'},{status:503});}
}
export async function POST(req:Request){
 try{
  const body=await req.json();
  if(body.action==='session'){
   const s=await readState();needStudent(s,body.studentId);const response=NextResponse.json({ok:true,viewer:body.studentId});
   response.cookies.set('garden_session',sessionValue(body.studentId),{httpOnly:true,sameSite:'strict',path:'/',secure:new URL(req.url).protocol==='https:'});return response;
  }
  const state=await readState();const {actor,agent}=requestActor(req,state);
  if(body.action==='agent_run'){
   if(!body.stream)return NextResponse.json(await runGardener(actor,String(body.goal||'')));
   const encoder=new TextEncoder();let disconnected=false;
   const stream=new ReadableStream({
    async start(controller){
     const send=(event:unknown)=>{if(!disconnected)try{controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));}catch{disconnected=true;}};
     try{
      send({type:'progress',message:'Starting Garden Agent…'});
      const run=await runGardener(actor,String(body.goal||''),undefined,message=>send({type:'progress',message}));
      send({type:'result',run});
     }catch(e){send({type:'error',message:e instanceof Error?e.message:'The gardener could not finish. Please retry.'});}
     finally{if(!disconnected)controller.close();}
    },
    cancel(){disconnected=true;}
   });
   return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'}});
  }
  if(body.action==='plant_build'){const observation=await observePublicSource(state,actor,String(body.sourceUrl||''));return NextResponse.json(await mutateState(s=>upsertObservedBuild(s,actor,body,observation)));}
  const result=await mutateState(s=>{
   if(body.action==='interact'){if(agent&&String(body.kind).startsWith('visit-'))throw new Error('Garden visits require a human session.');interact(s,actor,body.kind,body.target,body.value);return {ok:true};}
   if(body.action==='message')return postMessage(s,actor,body.to,body.content);
   if(body.action==='baseline')return baselineRun(s,actor);
   if(body.action==='bouquet')return saveBouquet(s,actor,body.name,body.buildIds);
   if(body.action==='needs'){if(agent)throw new Error('Only a human session can change a garden profile.');const student=needStudent(s,actor);if(body.avatar!==undefined){if(!Number.isInteger(body.avatar)||body.avatar<0||body.avatar>7)throw new Error('Unknown character.');student.avatar=body.avatar;}student.contact=typeof body.contact==='string'?body.contact.trim().slice(0,180):student.contact;return {ok:true};}
   if(body.action==='register_agent'){
    if(agent)throw new Error('Only a human session can register a personal agent.');
    if(!body.name?.trim())throw new Error('Give your agent a name.');
    const token='cognitive_'+crypto.randomBytes(32).toString('hex');const account={id:crypto.randomUUID(),studentId:actor,name:String(body.name).trim().slice(0,60),tokenHash:hashToken(token)};s.agents.push(account);return {token,agent:{id:account.id,name:account.name,studentId:actor}};
   }
   if(body.action==='reset'){
    s.pairs=s.pairs.filter(p=>!s.builds.some(b=>b.id===p.fromBuild&&b.studentId===actor));s.interactions=s.interactions.filter(i=>i.actor!==actor);return {ok:true};
   }
   throw new Error('Unknown garden action.');
  });
  return NextResponse.json(result);
 }catch(e){const message=e instanceof Error?e.message:'Could not complete the action.';return NextResponse.json({error:message.slice(0,300)},{status:message.includes('key')||message.includes('Claude')?503:400});}
}
