import type {GardenState,CheckIn,LearningPair} from './types';
import {needStudent} from './environment';
const text=(value:unknown,max:number)=>{if(value===undefined)return '';if(typeof value!=='string'||value.length>max)throw Error(`Use text of at most ${max} characters.`);return value.trim();};
export function recentCheckIns(s:GardenState,studentId?:string,now=Date.now()){
 const earliest=new Date(now-14*86400000).toISOString().slice(0,10);
 return (s.checkIns||[]).filter(c=>(!studentId||c.studentId===studentId)&&c.date>=earliest).sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt));
}
export function saveCheckIn(s:GardenState,actor:string,input:Record<string,unknown>,agentName?:string,now=Date.now()){
 needStudent(s,actor);if(input.shareWithClass!==true)throw Error('Confirm shareWithClass: true to publish this check-in to garden visitors.');
 const date=text(input.date,10)||new Date(now).toISOString().slice(0,10);
 const parsed=new Date(date+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||parsed.getTime()>now+86400000||parsed.getTime()<now-31*86400000)throw Error('Choose a date within the last 30 days, using YYYY-MM-DD.');
 if(input.interests!==undefined&&(!Array.isArray(input.interests)||input.interests.length>8))throw Error('Use at most eight interests.');
 const interests=[...new Set(((input.interests||[]) as unknown[]).map(t=>text(t,60)).filter(Boolean))];
 const work=text(input.work,1000),focus=text(input.focus,400),learning=text(input.learning,400),offering=text(input.offering,400);
 if(!work&&!focus)throw Error('Add today’s work or a current focus.');
 const checkIn:CheckIn={id:`checkin:${actor}:${date}`,studentId:actor,date,work,focus,interests,learning,offering,source:agentName?'agent':'human',...(agentName?{agentName}:{}),updatedAt:new Date(now).toISOString()};
 s.checkIns??=[];const index=s.checkIns.findIndex(c=>c.id===checkIn.id);if(index>=0)s.checkIns[index]=checkIn;else s.checkIns.push(checkIn);
 // Editing the evidence retires any recommendation based on its previous text.
 s.learningPairs=(s.learningPairs||[]).filter(p=>p.fromCheckIn!==checkIn.id&&p.toCheckIn!==checkIn.id);
 return checkIn;
}
export function removeCheckIn(s:GardenState,actor:string,id:string){
 if(!(s.checkIns||[]).some(c=>c.id===id&&c.studentId===actor))throw Error('Check-in not found in your garden.');
 s.checkIns=s.checkIns!.filter(c=>c.id!==id);s.learningPairs=(s.learningPairs||[]).filter(p=>p.fromCheckIn!==id&&p.toCheckIn!==id);return {ok:true};
}
export function saveLearningPair(s:GardenState,actor:string,input:Record<string,unknown>,now=Date.now()){
 needStudent(s,actor);const recent=recentCheckIns(s,undefined,now);const from=recent.find(c=>c.id===input.fromCheckIn),to=recent.find(c=>c.id===input.toCheckIn);
 if(!from||!to)throw Error('Cite two check-ins from the last 14 days.');
 if(from.studentId!==actor||from.studentId===to.studentId)throw Error('Pair your own check-in with another garden.');
 const reason=text(input.reason,1200),learnFromPeer=text(input.learnFromPeer,600),shareWithPeer=text(input.shareWithPeer,600);
 if(!reason||!learnFromPeer||!shareWithPeer)throw Error('Describe the connection and a specific learning opportunity in each direction.');
 const id=`learning:${actor}:${to.studentId}`;
 if(s.interactions.some(i=>i.actor===actor&&i.target===id&&i.kind==='feedback'&&i.value==='not-relevant'))throw Error('This learning pair was rejected.');
 s.learningPairs??=[];if(s.learningPairs.some(p=>p.id===id))throw Error('This learning pair is already saved.');
 const pair:LearningPair={id,fromStudent:actor,toStudent:to.studentId,fromCheckIn:from.id,toCheckIn:to.id,reason,learnFromPeer,shareWithPeer,createdAt:new Date(now).toISOString(),createdBy:actor};s.learningPairs.push(pair);return pair;
}
