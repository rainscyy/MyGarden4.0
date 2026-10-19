import crypto from 'node:crypto';
import {needStudent,interact,postMessage} from './environment';
import type {GardenState,GardenAction} from './types';
function strings(value:unknown){if(!Array.isArray(value)||value.length>8||value.some(v=>typeof v!=='string'||!v.trim()||v.length>180))throw Error('Use up to eight short profile entries.');return value.map(v=>String(v).trim());}
function normalize(s:GardenState,actor:string,input:Record<string,unknown>){
 needStudent(s,actor);const kind=String(input.kind),target=String(input.target||'');
 if(kind==='water'){const build=s.builds.find(b=>b.id===target);if(!build||build.studentId===actor)throw Error('Choose another garden’s build.');return {kind,target,label:`Water ${build.title} · ${needStudent(s,build.studentId).name}`} as const;}
 if(kind==='message'||kind==='flower'){
  const recipient=needStudent(s,target);if(target===actor)throw Error('Choose another person.');
  if(kind==='flower'&&recipient.role!=='teacher'&&recipient.role!=='ta')throw Error('Choose a teacher or TA for a thank-you flower.');
  const content=String(input.content||'').trim();if(!content||content.length>900)throw Error('Write a note of 1–900 characters.');
  return {kind,target,content,label:`${kind==='flower'?'Send a thank-you flower':'Message'} · ${recipient.name}`} as const;
 }
 if(kind==='profile'){
  const interests=input.interests===undefined?undefined:strings(input.interests),projectIdeas=input.projectIdeas===undefined?undefined:strings(input.projectIdeas);
  if(!interests&&!projectIdeas)throw Error('Specify interests or project ideas to update.');
  return {kind,target:actor,interests,projectIdeas,label:'Update your public interests / project ideas'} as const;
 }
 throw Error('Unknown garden action.');
}
export function prepareGardenAction(s:GardenState,actor:string,input:Record<string,unknown>){
 const action=normalize(s,actor,input);s.actionDrafts??=[];
 const same=s.actionDrafts.find(a=>a.actor===actor&&a.status==='pending'&&a.expiresAt>Date.now()&&JSON.stringify(a.action)===JSON.stringify(action));if(same)return same;
 if(s.actionDrafts.filter(a=>a.actor===actor&&a.status==='pending'&&a.expiresAt>Date.now()).length>=10)throw Error('Review your existing drafts first.');
 const draft:GardenAction={id:crypto.randomUUID(),actor,action,status:'pending',expiresAt:Date.now()+86400000};s.actionDrafts.push(draft);return draft;
}
export function resolveGardenAction(s:GardenState,actor:string,id:string,approve:boolean){
 const draft=s.actionDrafts?.find(a=>a.id===id&&a.actor===actor);if(!draft)throw Error('Draft not found in your garden.');
 if(draft.status!=='pending')return draft;
 if(!approve){draft.status='dismissed';return draft;}
 if(draft.expiresAt<Date.now())throw Error('This draft expired. Ask for a new one.');
 const a=normalize(s,actor,draft.action);
 if(a.kind==='water'){if(!s.interactions.some(i=>i.actor===actor&&i.kind==='water'&&i.target===a.target))interact(s,actor,'water',a.target);}
 else if(a.kind==='message'||a.kind==='flower')postMessage(s,actor,a.target,(a.kind==='flower'?'🌼 A thank-you flower\n':'')+a.content);
 else {const person=needStudent(s,actor);if(a.interests)person.interests=a.interests;if(a.projectIdeas)person.projectIdeas=a.projectIdeas;person.ideaSource='Shared by the garden owner';}
 draft.status='applied';return draft;
}
