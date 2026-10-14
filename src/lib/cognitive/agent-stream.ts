import type {Run} from './types';

// The response can be split anywhere, including inside a UTF-8 character.
export async function readGardenerStream(response:Response,onProgress:(message:string)=>void):Promise<Run>{
 if(!response.ok){const body=await response.json();throw new Error(body.error||'The gardener could not start. Please retry.');}
 if(!response.headers.get('content-type')?.includes('application/x-ndjson'))return response.json();
 if(!response.body)throw new Error('No response from the gardener. Please retry.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',result:Run|undefined;
 const consume=(line:string)=>{
  if(!line.trim())return;
  const event=JSON.parse(line);
  if(event.type==='progress')onProgress(event.message);
  else if(event.type==='error')throw new Error(event.message);
  else if(event.type==='result')result=event.run;
 };
 try{
  while(true){
   const {value,done}=await reader.read();pending+=decoder.decode(value,{stream:!done});
   let newline:number;while((newline=pending.indexOf('\n'))>=0){consume(pending.slice(0,newline));pending=pending.slice(newline+1);}
   if(done){consume(pending);break;}
  }
 }finally{reader.releaseLock();}
 if(!result)throw new Error('The connection ended before the result arrived. Check My pairs for saved recommendations before trying again.');
 return result;
}
