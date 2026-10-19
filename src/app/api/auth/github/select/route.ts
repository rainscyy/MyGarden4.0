import {NextRequest,NextResponse} from 'next/server';
import {openLogin,siteOrigin} from '@/lib/cognitive/github';
import {sessionValue} from '@/lib/cognitive/auth';
import {readState} from '@/lib/cognitive/storage';
export async function POST(req:NextRequest){
 const origin=siteOrigin();try{
  if(req.headers.get('origin')!==origin)throw Error('origin');
  const claim=openLogin<{purpose:string;actors:string[]}>(req.cookies.get('garden_github_choices')?.value||'');
  const form=await req.formData();const actor=String(form.get('actor')||'');
  if(claim.purpose!=='choose'||!claim.actors.includes(actor)||!(await readState()).students.some(s=>s.id===actor))throw Error('actor');
  const response=NextResponse.redirect(origin+'/?joined=1',303);response.cookies.set('garden_session',sessionValue(actor),{httpOnly:true,secure:origin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:7*86400});response.cookies.set('garden_github_choices','',{path:'/',maxAge:0});return response;
 }catch{return NextResponse.redirect(origin+'/join?error=signin',303);}
}
