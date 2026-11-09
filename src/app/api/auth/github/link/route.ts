import {NextRequest,NextResponse} from 'next/server';
import {invitationActor,sessionValue} from '@/lib/cognitive/auth';
import {openLogin,linkGarden,siteOrigin} from '@/lib/cognitive/github';
import {mutateState} from '@/lib/cognitive/storage';

export async function POST(req:NextRequest){
 const origin=siteOrigin();
 try{
  if(req.headers.get('origin')!==origin)throw Error('origin');
  const claim=openLogin<{purpose:string;githubId:number}>(req.cookies.get('garden_github_link')?.value||'');
  if(claim.purpose!=='link'||!Number.isSafeInteger(claim.githubId))throw Error('identity');
  const form=await req.formData();
  const actor=invitationActor(String(form.get('invite')||'').trim());
  await mutateState(state=>linkGarden(state,actor,claim.githubId));
  const response=NextResponse.redirect(origin+'/?joined=1',303);
  response.cookies.set('garden_session',sessionValue(actor),{httpOnly:true,secure:origin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:7*86400});
  response.cookies.set('garden_github_link','',{path:'/',maxAge:0});
  return response;
 }catch{return NextResponse.redirect(origin+'/join?link=1&error=link',303);}
}
