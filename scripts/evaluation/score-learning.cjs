const {isDeepStrictEqual:equal}=require('node:util');
function scoreReview(before,after,run,task){
 const added=after.learningPairs.filter(p=>!before.learningPairs.some(b=>b.id===p.id));const p=added[0];const ix=run.steps.findIndex(s=>s.action==='save_learning_pair'&&s.ok);
 const checks={one_correct_pair:run.status==='saved'&&added.length===1&&p?.fromStudent===task.owner&&p?.toStudent==='stacey'&&p?.createdBy===task.owner&&p?.fromCheckIn===task.ownerCheckIn&&p?.toCheckIn===task.peerCheckIn,
 current_evidence_observed:[task.ownerCheckIn,task.peerCheckIn].every(id=>run.steps.slice(0,ix).some(s=>s.action==='read_check_ins'&&s.ok&&Array.isArray(s.result)&&s.result.some(c=>c.id===id&&equal(c,before.checkIns.find(x=>x.id===id))))),
 both_directions_present:!!p&&['reason','learnFromPeer','shareWithPeer'].every(k=>!!p[k]?.trim()),
 simulation_visible:!!p&&p.reason.startsWith('[SIMULATED PEER CHECK-IN]')&&before.checkIns.find(c=>c.id===task.peerCheckIn).work.includes('[SIMULATED PEER CHECK-IN]'),
 existing_pairs_preserved:equal(after.learningPairs.filter(x=>!added.includes(x)),before.learningPairs),
 other_state_preserved:Object.keys(before).filter(k=>!['runs','version','learningPairs'].includes(k)).every(k=>equal(before[k],after[k])),
 no_unrequested_actions:run.steps.every(s=>['read_garden_context','read_feedback','query_builds','read_source','read_check_ins','save_learning_pair'].includes(s.action))&&run.steps.filter(s=>s.action==='save_learning_pair').length===1,
 run_saved:after.runs.length===before.runs.length+1&&after.runs.some(r=>r.id===run.id)};
 return {task_completion:Object.values(checks).every(Boolean)?1:0,checks};
}module.exports={scoreReview};
