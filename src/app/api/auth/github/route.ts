import crypto from 'node:crypto';
import {NextResponse} from 'next/server';
import {githubConfigured,sealLogin,siteOrigin} from '@/lib/cognitive/github';
export const runtime='nodejs';
export async function GET(){
 const origin=siteOrigin();if(!githubConfigured())return NextResponse.redirect(origin+'/join?error=setup');
 const state=crypto.randomBytes(32).toString('base64url'),verifier=crypto.randomBytes(32).toString('base64url');
 const url=new URL('https://github.com/login/oauth/authorize');
 url.search=new URLSearchParams({client_id:process.env.GITHUB_CLIENT_ID!,redirect_uri:origin+'/api/auth/github/callback',scope:'read:user repo',state,code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
 const response=NextResponse.redirect(url);response.cookies.set('garden_github',sealLogin({purpose:'oauth',state,verifier}),{httpOnly:true,secure:origin.startsWith('https:'),sameSite:'lax',path:'/api/auth/github',maxAge:600});response.headers.set('Cache-Control','no-store');return response;
}
