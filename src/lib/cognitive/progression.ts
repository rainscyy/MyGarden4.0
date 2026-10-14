import type {Build,Interaction} from './types';
export const GARDEN_LEVELS=[{name:'Seedling',xp:0,unlock:'Garden plot'},{name:'Growing',xp:30,unlock:'Flowering fence'},{name:'Established',xp:80,unlock:'Garden lanterns'},{name:'Flourishing',xp:160,unlock:'Lily pond'}];
export function gardenProgress(studentId:string,builds:Build[],interactions:Interaction[]){
 const own=new Set(builds.filter(b=>b.studentId===studentId).map(b=>b.id));
 const seen=new Set<string>();const valid=interactions.filter(i=>{const key=[i.actor,i.kind,i.target].join(':');if(seen.has(key))return false;seen.add(key);return true;});
 const waters=valid.filter(i=>i.kind==='water'&&builds.some(b=>b.id===i.target&&b.studentId!==i.actor));
 const breakdown={builds:own.size*10,watering:waters.filter(i=>i.actor===studentId).length*5,received:waters.filter(i=>own.has(i.target)).length*3,visits:valid.filter(i=>i.actor===studentId&&((i.kind==='visit-garden'&&i.target!==studentId)||(i.kind==='visit-build'&&builds.some(b=>b.id===i.target&&b.studentId!==studentId)))).length*2};
 const xp=Object.values(breakdown).reduce((a,b)=>a+b,0);const index=GARDEN_LEVELS.reduce((level,item,i)=>xp>=item.xp?i:level,0);const next=GARDEN_LEVELS[index+1];
 return {...GARDEN_LEVELS[index],xp,level:index+1,next,breakdown,percent:next?Math.min(100,(xp-GARDEN_LEVELS[index].xp)/(next.xp-GARDEN_LEVELS[index].xp)*100):100};
}
