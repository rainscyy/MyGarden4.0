import {NextRequest,NextResponse} from 'next/server';
import {openLogin,sealLogin,siteOrigin,githubGardens} from '@/lib/cognitive/github';
import {readState} from '@/lib/cognitive/storage';
import {sessionValue} from '@/lib/cognitive/auth';
export const runtime='nodejs';export const maxDuration=60;
export async function GET(req:NextRequest){
 const origin=siteOrigin();let response:NextResponse;
 try{
  const saved=openLogin<{purpose:string;state:string;verifier:string}>(req.cookies.get('garden_github')?.value||'');
  if(saved.purpose!=='oauth'||req.nextUrl.searchParams.get('state')!==saved.state)throw Error('state');
  const code=req.nextUrl.searchParams.get('code');if(!code||req.nextUrl.searchParams.has('error'))throw Error('cancelled');
  const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code,redirect_uri:origin+'/api/auth/github/callback',code_verifier:saved.verifier}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  const token=await tokenResponse.json();if(!tokenResponse.ok||!token.access_token)throw Error('token');
  const state=await readState();const verified=await githubGardens(token.access_token,state.students);
  // The GitHub token is only used during this request, never stored or exposed.
  if(!verified.actors.length){response=NextResponse.redirect(origin+'/join?error=repository');}
  else if(verified.actors.length===1){response=NextResponse.redirect(origin+'/?joined=1');response.cookies.set('garden_session',sessionValue(verified.actors[0]),{httpOnly:true,secure:origin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:7*86400});}
  else{response=NextResponse.redirect(origin+'/join');response.cookies.set('garden_github_choices',sealLogin({purpose:'choose',...verified}),{httpOnly:true,secure:origin.startsWith('https:'),sameSite:'lax',path:'/',maxAge:600});}
 }catch{response=NextResponse.redirect(origin+'/join?error=signin');}
 response.cookies.set('garden_github','',{path:'/api/auth/github',maxAge:0});response.headers.set('Cache-Control','no-store');return response;
}
