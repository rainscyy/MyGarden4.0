import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import type {GardenState} from './types';
import seed from './seed.json';
import courseStaff from './course-staff.json';
import catalog from './catalog-builds.json';
import interests from './course-interests.json';
import coverage from './source-coverage.json';
function withCourseStaff(state:GardenState):GardenState{
 const ids=new Set(state.students.map(s=>s.id));
 const students=[...state.students,...courseStaff.filter(s=>!ids.has(s.id)) as GardenState['students']].map(s=>({...interests.find(i=>i.id===s.id),...s,sourceCoverage:coverage.find(c=>c.studentId===s.id)}));
 const existing=new Set(state.builds.map(b=>b.id));
 return {...state,students,builds:[...state.builds,...catalog.filter(b=>!existing.has(b.id)&&!state.builds.some(old=>old.studentId===b.studentId&&old.week===b.week))]};
}
const storePath=process.env.GARDEN_STATE_PATH||path.join(process.cwd(),'.garden-data','state.json');
let connection:Promise<mongoose.Connection>|undefined;
let queue:Promise<unknown>=Promise.resolve();
export const freshState=()=>withCourseStaff(structuredClone(seed) as GardenState);
async function db(){
 if(!process.env.MONGODB_URI||process.env.GARDEN_STORAGE==='file')return null;
 connection??=mongoose.createConnection(process.env.MONGODB_URI,{dbName:process.env.GARDEN_MONGODB_DB||'our_cognitive_gardens',serverSelectionTimeoutMS:5000,autoIndex:false}).asPromise();
 return (await connection).db!;
}
export async function readState():Promise<GardenState>{
 const database=await db();
 if(database){
  const collection=database.collection('environment');
  await collection.updateOne({_id:'classroom' as never},{$setOnInsert:{state:freshState()}},{upsert:true});
  const doc=await collection.findOne({_id:'classroom' as never});
  return withCourseStaff(doc!.state as GardenState);
 }
 try{return withCourseStaff(JSON.parse(await fs.readFile(storePath,'utf8')));}
 catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return freshState();}
}
export async function mutateState<T>(fn:(state:GardenState)=>T):Promise<T>{
 const task=queue.then(async()=>{
  const database=await db();
  for(let attempt=0;attempt<8;attempt++){
   const state=await readState(); const version=state.version;const result=fn(state);state.version=version+1;
   if(database){
    const update=await database.collection('environment').updateOne({_id:'classroom' as never,'state.version':version},{$set:{state}});
    if(update.matchedCount)return result;
   }else{
    await fs.mkdir(path.dirname(storePath),{recursive:true});
    const tmp=storePath+'.tmp';await fs.writeFile(tmp,JSON.stringify(state,null,2));await fs.rename(tmp,storePath);return result;
   }
  }
  throw new Error('The garden changed. Please try again.');
 });
 queue=task.catch(()=>{});return task;
}
export async function legacySummary(){
 if(!process.env.MONGODB_URI)return {available:false,agents:0,plants:0,matches:0};
 const c=await mongoose.createConnection(process.env.MONGODB_URI,{dbName:process.env.MONGODB_DB||'mygardens',serverSelectionTimeoutMS:5000,autoIndex:false}).asPromise();
 try{
  const [agents,plants,matches]=await Promise.all(['agents','plants','matches'].map(name=>c.db!.collection(name).countDocuments()));
  return {available:true,agents,plants,matches};
 }finally{await c.close();}
}
