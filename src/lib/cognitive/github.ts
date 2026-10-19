import crypto from 'node:crypto';
import type {Student} from './types';
export const githubConfigured=()=>!!(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET&&process.env.GARDEN_SESSION_SECRET);
export function siteOrigin(){const url=new URL(process.env.GARDEN_PUBLIC_URL||'https://our-cognitive-gardens.vercel.app');if(url.protocol!=='https:'&&!(process.env.NODE_ENV!=='production'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('Invalid garden origin.');return url.origin;}
export function sealLogin(value:object){const key=process.env.GARDEN_SESSION_SECRET;if(!key)throw Error('Sign-in is not configured.');const text=Buffer.from(JSON.stringify({...value,expires:Date.now()+600000})).toString('base64url');return text+'.'+crypto.createHmac('sha256',key).update('github:'+text).digest('base64url');}
export function openLogin<T>(value:string):T{try{const [text,sig,extra]=value.split('.');const expected=crypto.createHmac('sha256',process.env.GARDEN_SESSION_SECRET||'').update('github:'+text).digest('base64url');if(!process.env.GARDEN_SESSION_SECRET||extra||!sig||sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw Error();const data=JSON.parse(Buffer.from(text,'base64url').toString());if(!Number.isFinite(data.expires)||data.expires<Date.now())throw Error();return data;}catch{throw Error('Sign-in expired. Please try GitHub again.');}}
export function courseRepository(student:Student){try{const u=new URL(student.website);const repo=u.pathname.split('/').filter(Boolean)[0];return u.hostname==='mitmedialab.github.io'&&/^agents2026-[a-z0-9-]+$/i.test(repo||'')?`mitmedialab/${repo}`.toLowerCase():null;}catch{return null;}}
// Match authenticated repository permissions, never names or commit authors.
export async function githubGardens(token:string,students:Student[],fetcher:typeof fetch=fetch){
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 const identity=await fetcher('https://api.github.com/user',{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!identity.ok)throw Error('GitHub could not verify your account.');const user=await identity.json();if(!Number.isInteger(user.id))throw Error('Invalid GitHub identity.');
 const writable=new Set<string>();
 for(let page=1;page<=20;page++){
  const response=await fetcher(`https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&page=${page}`,{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('GitHub could not verify access to your course repository.');const repos=await response.json();if(!Array.isArray(repos))throw Error('Invalid repository response.');
  for(const repo of repos)if(repo.permissions?.push===true&&typeof repo.full_name==='string')writable.add(repo.full_name.toLowerCase());
  if(repos.length<100)break;
  if(page===20)throw Error('Too many repositories to verify automatically. Use your existing access code.');
 }
 return {githubId:user.id,login:String(user.login),actors:students.filter(s=>{const repo=courseRepository(s);return repo&&writable.has(repo);}).map(s=>s.id)};
}
