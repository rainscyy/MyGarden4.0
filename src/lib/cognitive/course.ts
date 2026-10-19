// Only anonymous reads from the official public catalog. No user cookies or keys.
export const COURSE_BASE='https://cognitive-agents.media.mit.edu';
const ROOT=COURSE_BASE+'/api/v1/course/resources';
type Resource={uri:string;title:string;description:string;media_type:string;status:string};
async function bounded(url:string,fetcher:typeof fetch){
 const response=await fetcher(url,{redirect:'error',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json, text/markdown, text/plain'}});
 if(!response.ok)throw Error('Public course materials are temporarily unavailable.');
 const reader=response.body?.getReader();if(!reader)throw Error('Empty course response.');let bytes=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>200000)throw Error('Course resource is too large; open its source link.');chunks.push(value);}}finally{await reader.cancel();}
 return Buffer.concat(chunks).toString('utf8');
}
export async function listCourseResources(fetcher:typeof fetch=fetch){
 const data=JSON.parse(await bounded(ROOT,fetcher));
 if(!Array.isArray(data))throw Error('Invalid public course catalog.');
 const resources:Resource[]=data.filter(r=>typeof r.uri==='string'&&r.uri.startsWith('course://')&&typeof r.title==='string').slice(0,100).map(r=>({uri:r.uri,title:r.title,description:r.description,media_type:r.media_type,status:r.status}));
 return {resources,sourceUrl:ROOT,fetchedAt:new Date().toISOString()};
}
export async function readCourseResource(uri:string,fetcher:typeof fetch=fetch){
 const {resources}=await listCourseResources(fetcher);const resource=resources.find(r=>r.uri===uri);
 if(!resource)throw Error('Choose a resource from the public course catalog.');
 const sourceUrl=ROOT+'/content?uri='+encodeURIComponent(uri),fetchedAt=new Date().toISOString();
 if(!['text/markdown','text/plain'].includes(resource.media_type))return {...resource,sourceUrl,fetchedAt,content:'Open this source to view the document. Its contents have not been read.',truncated:false};
 const text=await bounded(sourceUrl,fetcher);
 return {...resource,sourceUrl,fetchedAt,content:text.slice(0,20000),truncated:text.length>20000};
}
