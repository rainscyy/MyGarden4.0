'use client';
import {useState} from 'react';
export default function AccessCodeForm(){
 const [code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <details className="source-evidence"><summary>Use an existing access code</summary><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const response=await fetch('/api/cognitive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'session',invite:code.trim()})});const data=await response.json();if(!response.ok)throw Error(data.error||'Could not enter your garden.');window.location.assign('/');}catch(e){setError(e instanceof Error?e.message:'Could not enter your garden.');setBusy(false);}}}><label className="field-label">Garden access code<input type="password" autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} /></label>{error&&<p role="alert">{error}</p>}<button className="primary" type="submit" disabled={busy||!code.trim()}>{busy?'Entering…':'Enter garden →'}</button></form></details>;
}
