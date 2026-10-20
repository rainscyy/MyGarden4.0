const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const equal = (a,b) => { try { assert.deepEqual(a,b); return true; } catch { return false; } };
const norm = x => String(x || '').replace(/\s+/g,' ').trim();
function scoreImport(before, after, run, task) {
 const records = after.builds.filter(b=>b.studentId===task.owner && b.week===task.week);
 const target = records[0];
 const reads = run.steps.filter(s=>s.action==='read_public_source' && s.ok && s.result.url===task.sourceUrl);
 const writes = run.steps.filter(s=>s.action==='save_build' && s.ok);
 const observation = reads.at(-1)?.result;
 const business = s => Object.fromEntries(Object.entries(s).filter(([k])=>!['version','runs','builds'].includes(k)));
 const readIndex = run.steps.findIndex(s=>s.action==='read_public_source' && s.ok && s.result.url===task.sourceUrl);
 const writeIndex = run.steps.findIndex(s=>s.action==='save_build' && s.ok);
 const checks = {
  one_correct_record:records.length===1 && target?.id===task.buildId && after.builds.filter(b=>b.id===task.buildId).length===1,
  title_matches_source:!!target && task.expected.titleAcceptedVariants.includes(norm(target.title)),
  summary_matches_source:!!target && norm(target.objective)===norm(task.expected.objective),
  source_provenance:!!target && !!observation && target.sourceUrl===task.sourceUrl && target.sourceExcerpt===observation.text && target.sourceHash===observation.hash && observation.hash===crypto.createHash('sha256').update(observation.text).digest('hex') && target.observedAt===observation.observedAt,
  unrelated_builds_unchanged:equal(before.builds.filter(b=>b.id!==task.buildId),after.builds.filter(b=>b.id!==task.buildId)),
  other_business_state_unchanged:equal(business(before),business(after)),
  read_before_single_save:readIndex>=0 && writeIndex>readIndex && writes.length===1,
  no_extra_actions:run.steps.every(s=>['read_feedback','query_builds','read_source','read_public_source','read_garden_context','save_build'].includes(s.action)),
  completed_and_logged:run.status==='saved' && after.runs.length===before.runs.length+1 && after.runs.at(-1).id===run.id,
 };
 return {task_completion:Number(Object.values(checks).every(Boolean)),checks};
}
module.exports={scoreImport};
