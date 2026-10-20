# Garden tracing with Langfuse

Tracing runs on the server. Set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_BASE_URL` in `.env.local`. For the US project use `https://us.cloud.langfuse.com`. Hosted runs need the same variables in the deployment environment and a redeploy; local configuration does not configure Vercel. Node.js 22 or newer is required by Langfuse v6.

## Captured operations

- `run-garden-agent`: one root agent observation per request, with the user goal, final answer, application run ID, status, budgets, and diagnostic counters. The saved run includes its `traceId`.
- Each Anthropic streaming invocation is captured by the official documented OpenInference integration, including messages/system context, tools, model, usage, and returned content.
- Each Garden read is a retriever observation; each write is a tool observation. Tool input, result and failure status appear under the agent, as siblings of model generations.
- `save-daily-check-in`: captures the authenticated check-in fields and saved result for personal-agent API calls or human UI submissions. It does not capture an external personal agent’s LLM calls or claim to be its full trajectory.

Credentials, known secret environment values, Garden tokens and emails are masked before export. Raw HTTP headers, cookies, account tokens and full database state are not added to traces. No conversation session is invented: each current Garden request is independent.

The processor is initialized once per process, only when configured. Failed telemetry setup does not rerun the agent. Exports are flushed before the request ends; export failures do not reverse a saved application result. Set `LANGFUSE_TRACING_ENABLED=false` to disable tracing.

## Verify without a paid model call

```
node scripts/check-langfuse.cjs
node scripts/check-langfuse.cjs --live
```

The first command tests locally with tracing disabled. `--live` sends an explicitly tagged `instrumentation-test` trace to your Langfuse project. Both use the real Anthropic streaming client with an in-process fake HTTP response, real Garden tool execution, and isolated temporary file storage. No Claude request is sent and no live Garden record is changed. Simulated token usage belongs only to this instrumentation test, not evaluation results. The script checks successful reads, a handled tool failure, unchanged business records and masking; inspect the exported observations to verify the wire representation.

These checks do not assign `task_completion` or human quality scores. Formal evaluation still needs a fixed initial state, task-specific before/after checks, a real agent run and a human rubric. Existing recordings are human-observed pilot evidence; they have no reconstructed model traces or episode timings.

## Versions and references

Langfuse tracing / OTEL / client: 6.0.1. OpenInference Anthropic: 0.2.11. Exact installed versions are recorded in package-lock.json.

- Official skill: https://github.com/langfuse/skills/tree/main/skills/langfuse
- Trace structure: https://langfuse.com/docs/observability/best-practices
- Anthropic streaming integration: https://langfuse.com/integrations/model-providers/anthropic-js
- Evaluation: https://langfuse.com/docs/evaluation/overview

## Verified connection

[Audited instrumentation trace](https://us.cloud.langfuse.com/project/cmvg0ns7202uqad0j5lnk4x2f/traces/1201e0e2ffd5cee515147ff1b3c218b2) (project access required): one agent, three simulated model invocations, two real tool reads, one handled error. Read back with the Langfuse observations API and checked for hierarchy, model/usage, meaningful output, and dummy-token masking. No paid LLM calls.

The adapter explicitly allows the Arize JS instrumentation scope through the exporter filter, masks raw OpenInference attributes as well as Langfuse fields, and preserves tool-only streaming outputs in the generation view.
