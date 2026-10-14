import crypto from 'node:crypto';
import type {GardenState,Build} from './types';
import {needStudent} from './environment';
export async function observePublicSource(s:GardenState,actor:string,url:string){
 const student=needStudent(s,actor);const allowed=new URL(student.website);const parsed=new URL(url);
 if(parsed.protocol!=='https:'||parsed.origin!==allowed.origin||!parsed.pathname.startsWith(allowed.pathname)||parsed.username||parsed.password)throw new Error('Use a project page inside your listed public course website.');
 const response=await fetch(parsed.href,{redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`The public source returned ${response.status}.`);
 const length=Number(response.headers.get('content-length')||0);if(length>500000)throw new Error('This page is too large for the source reader.');
 const html=await response.text();if(html.length>500000)throw new Error('This page is too large for the source reader.');
 const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/<[^>]+>/g,' ').trim();
 const text=html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
 if(text.length<100)throw new Error('This source has too little readable information.');
 return {url:parsed.href,title,text,hash:crypto.createHash('sha256').update(text).digest('hex'),observedAt:new Date().toISOString()};
}
export function upsertObservedBuild(s:GardenState,actor:string,input:{week:number;title:string;objective:string;methods:string[];themes:string[]},observation:Awaited<ReturnType<typeof observePublicSource>>){
 needStudent(s,actor);
 if(!Number.isInteger(input.week)||input.week<1||input.week>14)throw new Error('Choose a course week from 1 to 14.');
 if(!input.title?.trim()||!input.objective?.trim())throw new Error('Add a title and stated objective.');
 if(!Array.isArray(input.methods)||!Array.isArray(input.themes))throw new Error('Methods and themes must be lists.');
 const topics=['Memory','Creativity','Reflection','Attention','Learning','Environments','Social connection'];
 if(!input.themes.length||input.themes.some(t=>!topics.includes(t)))throw new Error('Choose shared themes from: '+topics.join(', '));
 const build:Build={id:`${actor}-w${input.week}`,studentId:actor,week:input.week,title:input.title.trim().slice(0,120),objective:input.objective.trim().slice(0,600),methods:input.methods.slice(0,12).map(String),themes:input.themes.slice(0,5).map(String),sourceUrl:observation.url,sourceExcerpt:observation.text,sourceHash:observation.hash,observedAt:observation.observedAt,origin:'Public website observation'};
 const index=s.builds.findIndex(b=>b.id===build.id);if(index>=0)s.builds[index]=build;else s.builds.push(build);
 return build;
}
