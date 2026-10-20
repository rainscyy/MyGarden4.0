const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {scoreImport}=require('./score-build-import.cjs');
const source={url:'https://example.test/week05/',text:'Fixture used only to verify the scorer',observedAt:'2026-10-19T00:00:00Z'};source.hash=crypto.createHash('sha256').update(source.text).digest('hex');
const task={owner:'test-owner',week:5,buildId:'test-owner-w5',sourceUrl:source.url,expected:{titleAcceptedVariants:['Test'],objective:'Exact summary'}};
const before={version:0,builds:[{id:'preserved',studentId:'peer',week:4}],runs:[],messages:[],checkIns:[]};
const target={id:task.buildId,studentId:task.owner,week:5,title:'Test',objective:'Exact summary',sourceUrl:source.url,sourceHash:source.hash,sourceExcerpt:source.text,observedAt:source.observedAt};
const run={id:'test-run',status:'saved',steps:[{action:'read_public_source',ok:true,result:source},{action:'save_build',ok:true,result:target}]};
const after={...structuredClone(before),version:2,builds:[...before.builds,target],runs:[run]};
assert.equal(scoreImport(before,after,run,task).task_completion,1);
for(const mutate of [
 s=>s.builds.push(structuredClone(target)),
 s=>s.builds[0].title='unrequested peer change',
 s=>s.builds[1].objective='Wrong summary',
 s=>s.messages.push({content:'extra message'}),
 s=>s.builds[1].sourceHash='incorrect',
]){const broken=structuredClone(after);mutate(broken);assert.equal(scoreImport(before,broken,run,task).task_completion,0);}
const extra=structuredClone(run);extra.steps.push({action:'prepare_garden_action',ok:false});assert.equal(scoreImport(before,after,extra,task).task_completion,0);
const reversed=structuredClone(run);reversed.steps.reverse();assert.equal(scoreImport(before,after,reversed,task).task_completion,0);
console.log('Scorer checks passed: valid state, duplicates, unrelated edits, wrong summary, source integrity and action order. No agent/model calls.');
