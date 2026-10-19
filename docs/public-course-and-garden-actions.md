# Garden Agent interfaces

## Public course materials

Base: https://cognitive-agents.media.mit.edu

- `GET /api/v1/course/resources`: anonymous catalog (URI, title, media type, publication status).
- `GET /api/v1/course/resources/content?uri=course%3A%2F%2Fschedule`: selected resource as text.

Verified anonymously on October 19, 2026. The catalog and schedule responded; the schedule is explicitly provisional. This integration does not call the private conversation API or reuse a person's course session. It is a read-only public information interface, not a delegated Course Agent session or MCP connection.

`list_course_resources` and `read_course_resource` use the fixed official HTTPS host with redirects rejected and no credentials. Only catalog-listed resources can be requested. Reads time out after 12 seconds, reject responses above 200 kB and return at most 20,000 text characters with a truncation flag. PDFs return a source link only. Tool observations include source URL, resource status and retrieval time. Answers must cite the source and preserve provisional status. Source text cannot authorize garden actions.

## Internal actions

Garden Agent can prepare `message`, `water`, `flower`, or `profile` drafts. A message or flower is a private Our Gardens inbox note; neither requires private contact information nor triggers email or an external notification. A thank-you flower is an inbox note with a flower marker, not a physical gift. Profiles update only the signed-in owner's interests or project ideas.

`POST /api/cognitive` with `{ "action": "resolve_action", "id": "<draft-id>", "approve": true }` applies an owner's draft from a human session. `approve: false` dismisses it. Drafts expire after 24 hours. Agent tokens cannot approve drafts. Owner checks and state versioning prevent cross-owner access and duplicate sends. Watering sets the watered state without toggling it off on retry. Drafts remain available on reopening Garden Agent; a prepared action is never reported as delivered.

Personal agents may also use the existing internal message API under their owner's explicit instructions, as described in SKILL.md. Learning-pair recommendations are private suggestions, not messages or mutual agreements. Daily focus check-ins are publicly visible and explicitly opt in to sharing. Matching uses the last 14 days and retires suggestions when their underlying check-ins change.
