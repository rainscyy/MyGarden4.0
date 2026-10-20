const {isDeepStrictEqual:equal}=require('node:util');
function scoreReview(before,after,run,task){
 const added=after.pairs.filter(p=>!before.pairs.some(b=>b.id===p.id));const p=added[0];
 const builds=p?[p.fromBuild,p.toBuild].map(id=>before.builds.find(b=>b.id===id)):[];
 const saveIndex=run.steps.findIndex(s=>s.action==='save_pair'&&s.ok);
 const checks={saved_one:run.status==='saved'&&added.length===1&&run.steps.filter(s=>s.action==='save_pair'&&s.ok).length===1,
 owner_and_peer:!!p&&p.fromBuild==='raine-w2'&&builds.every(Boolean)&&builds[1].studentId!==task.owner&&p.createdBy===task.owner,
 sources_read_before_save:builds.length===2&&builds.every(b=>b&&run.steps.slice(0,saveIndex).some(s=>s.action==='read_source'&&s.ok&&s.result?.id===b.id&&s.result?.hash===b.sourceHash)),
 citations_match:!!p&&p.sourceUrls.length===2&&builds.every(b=>b&&p.sourceUrls.includes(b.sourceUrl))&&!!p.reason.trim(),
 existing_pairs_preserved:equal(after.pairs.filter(x=>!added.includes(x)),before.pairs),
 other_state_preserved:Object.keys(before).filter(k=>!['runs','version','pairs'].includes(k)).every(k=>equal(before[k],after[k])),
 no_extra_actions:run.steps.every(s=>['read_garden_context','read_feedback','query_builds','read_source','read_check_ins','save_pair'].includes(s.action)),
 run_saved:after.runs.length===before.runs.length+1&&after.runs.some(r=>r.id===run.id)};
 return {task_completion:Object.values(checks).every(Boolean)?1:0,checks};
}module.exports={scoreReview};
