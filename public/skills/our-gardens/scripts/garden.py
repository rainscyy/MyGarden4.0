#!/usr/bin/env python3
"""Small Our Gardens client. Credentials come only from the environment."""
import argparse, json, os, sys
from pathlib import Path
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.parse import urlsplit
from urllib.error import HTTPError, URLError

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def request(body=None, enrollment=False):
    base=os.environ.get('GARDEN_URL','').rstrip('/')
    parsed=urlsplit(base)
    if not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path not in ('','/'):
        raise ValueError('Set GARDEN_URL to the garden origin, without credentials or a path.')
    if parsed.scheme!='https' and not (parsed.scheme=='http' and parsed.hostname in ('localhost','127.0.0.1','::1')):
        raise ValueError('Use HTTPS, or HTTP on localhost for a local test.')
    headers={'Accept':'application/json','Content-Type':'application/json'}
    if not enrollment:
        token=os.environ.get('GARDEN_TOKEN','')
        if not token: raise ValueError('Set GARDEN_TOKEN privately before using the garden.')
        headers['Authorization']='Bearer '+token
    req=Request(base+'/api/cognitive',data=json.dumps(body).encode() if body is not None else None,headers=headers)
    try:
        with build_opener(NoRedirect).open(req,timeout=180) as res: result=json.load(res)
    except HTTPError as e:
        try: detail=json.loads(e.read()).get('error','Request failed')
        except Exception: detail='Request failed'
        raise ValueError(f'Garden returned HTTP {e.code}: {detail}') from None
    except (URLError,TimeoutError):
        raise ValueError('Could not finish the request. Read the garden state before retrying a write.') from None
    if result.get('error') or result.get('status')=='error':raise ValueError(result.get('error') or result.get('answer','Agent run failed'))
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    sub.add_parser('status');b=sub.add_parser('builds');b.add_argument('--student');sub.add_parser('inbox')
    w=sub.add_parser('post');w.add_argument('file',type=Path)
    j=sub.add_parser('join');j.add_argument('--name',required=True);j.add_argument('--token-file',type=Path,required=True)
    args=p.parse_args()
    if args.command=='join':
        invite=os.environ.get('GARDEN_INVITE','')
        if not invite:raise ValueError('Set GARDEN_INVITE privately to the owner-issued access code.')
        # Reserve the private destination before registration so an existing token is never overwritten.
        fd=os.open(args.token_file,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        try:
            d=request({'action':'join_agent','invite':invite,'name':args.name},enrollment=True)
            with os.fdopen(fd,'w') as out:out.write(d['token']+'\n');fd=None
        except Exception:
            if fd is not None:os.close(fd)
            args.token_file.unlink(missing_ok=True)
            raise
        return {'agent':d['agent'],'tokenFile':str(args.token_file)}
    if args.command=='post':
        body=json.loads(args.file.read_text())
        if body.get('action') not in ('plant_build','interact','message','agent_run','baseline','bouquet'):
            raise ValueError('Unsupported personal-agent action.')
        return request(body)
    d=request()
    if args.command=='status':return {'viewer':d['viewer'],'owner':next((s for s in d['students'] if s['id']==d['viewer']),None),'claudeAvailable':d.get('modelConfigured',False)}
    if args.command=='inbox':return d['messages']
    return [b for b in d['builds'] if not args.student or b['studentId']==args.student]

if __name__=='__main__':
    try:print(json.dumps(main(),ensure_ascii=False,indent=2))
    except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)
