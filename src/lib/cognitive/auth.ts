import crypto from 'node:crypto';
import type {GardenState} from './types';
const shared=globalThis as typeof globalThis & {gardenSecret?:string};
const secret=()=>process.env.GARDEN_SESSION_SECRET||(shared.gardenSecret??=crypto.randomBytes(32).toString('hex'));
export function sessionValue(actor:string){const text=Buffer.from(JSON.stringify({actor,expires:Date.now()+7*86400000})).toString('base64url');return text+'.'+crypto.createHmac('sha256',secret()).update(text).digest('base64url');}
export function sessionActor(req:Request){
 const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('garden_session='))?.slice(15);
 if(!token)return null;
 try{const [text,sig]=token.split('.');const expected=crypto.createHmac('sha256',secret()).update(text).digest('base64url');if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(text,'base64url').toString());return data.expires>Date.now()?data.actor:null;}catch{return null;}
}
export function hashToken(token:string){return crypto.createHash('sha256').update(token).digest('hex');}
export function requestActor(req:Request,s:GardenState){
 const bearer=req.headers.get('authorization');
 if(bearer?.startsWith('Bearer ')){const hash=hashToken(bearer.slice(7));const account=s.agents.find(a=>a.tokenHash===hash);if(account)return {actor:account.studentId,agent:account.name};throw new Error('Invalid agent token.');}
 const actor=sessionActor(req);if(!actor||!s.students.some(x=>x.id===actor))throw new Error('Choose your garden to participate.');return {actor,agent:undefined};
}
