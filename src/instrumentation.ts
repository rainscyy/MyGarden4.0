export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'){
  const {initializeGardenTracing}=await import('./lib/cognitive/telemetry');
  initializeGardenTracing();
 }
}
