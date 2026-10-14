import crypto from 'node:crypto';
import fs from 'node:fs/promises';
const [output]=process.argv.slice(2);
if(!output||!process.env.GARDEN_SESSION_SECRET)throw Error('Provide a private output path and GARDEN_SESSION_SECRET.');
const state=JSON.parse(await fs.readFile(new URL('../public/course-snapshot.json',import.meta.url),'utf8'));
const expires=Date.now()+30*86400000;
const invitations=state.students.map(s=>{const text=Buffer.from(JSON.stringify({actor:s.id,expires})).toString('base64url');return {studentId:s.id,name:s.name,expires:new Date(expires).toISOString(),code:text+'.'+crypto.createHmac('sha256',process.env.GARDEN_SESSION_SECRET).update('invite:'+text).digest('base64url')};});
await fs.writeFile(output,JSON.stringify({website:process.env.APP_URL,invitations},null,2),{mode:0o600,flag:'wx'});
console.log(`Saved ${invitations.length} private garden access codes. Share each code only with its named owner.`);
