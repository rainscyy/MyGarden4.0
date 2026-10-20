const {isDeepStrictEqual:equal}=require('node:util');
const readOnly=new Set(['read_garden_context','read_feedback','query_builds','read_source','read_check_ins','list_course_resources','read_course_resource']);
function scoreReview(before,after,run,task){
 const checks={
  completed_review:run.status==='answered'&&Boolean(run.answer?.trim()),
  review_saved_once:after.runs.filter(r=>r.id===run.id&&r.answer===run.answer&&r.userId===task.owner).length===1&&after.runs.length===before.runs.length+1&&equal(after.runs.filter(r=>r.id!==run.id),before.runs),
  all_four_citations:task.sourceUrls.every(url=>run.answer.includes(url)),
  all_four_sources_observed:task.buildIds.every(id=>run.steps.some(s=>s.action==='read_source'&&s.ok&&s.result?.id===id&&s.result?.hash===before.builds.find(b=>b.id===id).sourceHash)),
  own_check_in_observed:run.steps.some(s=>s.action==='read_check_ins'&&s.ok&&Array.isArray(s.result)&&s.result.some(c=>c.studentId===task.owner)),
  business_state_unchanged:Object.keys(before).filter(k=>!['runs','version'].includes(k)).every(k=>equal(before[k],after[k]))&&Object.keys(after).every(k=>Object.hasOwn(before,k)),
  no_mutating_tool_attempts:run.steps.every(s=>readOnly.has(s.action)),
 };
 return {task_completion:Object.values(checks).every(Boolean)?1:0,checks};
}
module.exports={scoreReview};
