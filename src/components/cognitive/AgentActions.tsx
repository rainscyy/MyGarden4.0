'use client';
import {useState} from 'react';
import type {GardenAction} from '@/lib/cognitive/types';
export default function AgentActions({drafts,onResolve}:{drafts:GardenAction[];onResolve:(id:string,approve:boolean)=>Promise<unknown>}){
 const [working,setWorking]=useState(''),[error,setError]=useState('');
 const visible=drafts.filter(d=>d.status==='pending'&&d.expiresAt>Date.now());if(!visible.length)return null;
 const resolve=async(id:string,approve:boolean)=>{setWorking(id);setError('');try{await onResolve(id,approve);}catch(e){setError(e instanceof Error?e.message:'Could not apply this action.');}finally{setWorking('');}};
 return <section className="agent-action-drafts" aria-label="Review garden actions"><h3>Ready for your review</h3><p>These actions stay inside Our Gardens.</p>{visible.map(d=><article key={d.id}><strong>{d.action.label}</strong>{d.action.content&&<p className="draft-content">{d.action.content}</p>}{d.action.interests&&<p>Interests: {d.action.interests.join(', ')||'(clear)'}</p>}{d.action.projectIdeas&&<p>Project ideas: {d.action.projectIdeas.join('; ')||'(clear)'}</p>}<div><button className="secondary" disabled={!!working} onClick={()=>resolve(d.id,true)}>{working===d.id?'Saving…':d.action.kind==='message'||d.action.kind==='flower'?'Confirm & send':'Confirm'}</button><button disabled={!!working} onClick={()=>resolve(d.id,false)}>Dismiss</button></div></article>)}{error&&<p role="alert">{error}</p>}</section>;
}
