import fs from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
export async function GET(){return new Response(await fs.readFile(path.join(process.cwd(),'public/skills/our-gardens/SKILL.md'),'utf8'),{headers:{'Content-Type':'text/markdown; charset=utf-8'}});}
