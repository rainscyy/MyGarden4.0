# Our Cognitive Gardens

A shared garden of MAS.S60 weekly builds. It pairs work to support discovery and exchange, without ranking the best projects.

## Run locally

On Windows, double-click START-GARDEN.cmd. The launcher copies source files to LocalAppData and runs the app at http://localhost:3000, avoiding OneDrive dependency delays. CONFIGURE-CLAUDE.cmd opens .env.local. The two launchers in the earlier mygardens directory point here. Keep the terminal open while using the app.

On Mac/Linux: npm install, then npm run dev. npm run build checks the production bundle; npm run typecheck checks types.

## Data and environment

36 student project URLs come from the Course Agent directory supplied by Raine. Two teachers and five teaching assistants share the first classroom island; they have no individual garden plots. Staff roles are sourced from https://github.com/mitmedialab/agents-class-2026/blob/main/class-agent/shared/course/instructors/instructors.md. No staff builds or active agent connections are invented.

The catalog now contains 71 source-reviewed builds from 23 students: 16 original records plus 55 additional records read from public weekly pages, image write-ups and public client-side course records. Each record retains its source URL, short observation excerpt, hash, time and provenance; image/script evidence has a separate source-material link. Source coverage tracks reviewed weeks. Unknown work remains unindexed, not unsubmitted. Final-project proposals supplied in the directory are stored separately from completed weekly builds.

S: source snapshots, build records, saved bouquets, pair cards, interactions, messages and run history.
O: indexed metadata, stored source observations, allowlisted live public page content and explicit feedback.
A: query builds, read sources, import the current user’s build, save bouquets/pairs, water/save, give feedback, and leave garden notes.
Transitions: reads expose observations; validated writes persist state. Feedback excludes rejected recommendations. Other users’ actions can update shared state. Invalid sources, wrong identity, unknown IDs, self-pairs and duplicate recommendations return errors.
Initialization: a fixed sourced classroom snapshot, plus two actual Claude example cards and their traces. Reset removes the current user’s recommendations and interactions without erasing sources.
Stop: objective completed, insufficient evidence, six model turns, sixteen tool calls, or a 150-second run budget.

## Functions

Garden: a horizontally draggable pixel world with 36 river-separated student gardens and a shared classroom island at the start. Bridges join adjacent islands and continue across neighborhood boundaries. The blackboard shortcut and People directory locate staff on the shared island. Student signs open /gardens/{person-id}; old staff garden URLs now show the shared island.
Profiles: 13 permanent plots for Week 1–13. Each sourced build is one labeled flower in its week’s plot; multiple builds in one week share a plot. Missing records remain empty, not marked unsubmitted. People use standing characters; companion agents share their owner’s palette. Unconnected companions are previews. Eight character silhouettes can be saved from a human garden session.
Themes: related owners appear as linked garden islands. Every flower names its actual build, owner and week. These links represent a shared theme, not evidence of a real conversation. Saved groups reuse the existing bouquet storage.
Artwork: original SVG grid drawings; the incompatible generated raster atlas has been removed. Eight animal residents share rounded heads, short bodies and a consistent pixel grid. Standing characters and blob companions move gently, respecting reduced-motion preferences. The interface uses original SVG grid drawings and a self-hosted Pixelify Sans font (SIL Open Font License, included). No third-party sprite sheets are bundled.
My pairs: related and cross-direction connections with both original source links, feedback, and discussion entry points.
Human interaction: watering, saving, feedback, editable contact details and a persisted garden inbox. Messages stay inside this prototype; no email, Slack or external notification is sent.
Agents: the Garden Agent uses Anthropic’s Messages API and custom tools. Personal agents receive garden-scoped bearer tokens; tokens are stored as hashes. The deterministic theme/method matching baseline is labeled separately from Claude.

## Local progression and demo activity

Each indexed build earns 10 XP; watering another build earns 5 XP and its owner receives 3 XP; a first visit to another garden or build earns 2 XP. Duplicate visits do not accumulate XP. Removing a watering removes that contribution. Levels at 30, 80 and 160 XP unlock flowering fences, lanterns and a lily pond; the number of weekly plots remains 13. Inbox examples are labeled Demo, award no XP, and save replies only as unsent previews.

Current checks: typechecking; 36 student gardens and one classroom with seven staff; no raster atlas requests or personal-page banner; 13 plots on student profiles and none for staff; directory selection, mouse dragging, responsive theme bridges and mobile page width; XP deduplication, self-action rejection, watering reversal and level thresholds. Browser checks intercepted writes to avoid modifying live interaction data.

## Earlier verified runs

- 13 core API checks passed: sessions, no self-watering, persistence/toggle, saving, unknown targets, matching trace, feedback, scoped tokens, invalid tokens, messages, thread isolation and source-preserving reset.
- 6 source/grouping checks passed: blocked private URLs and another user’s source, a live public source observation, an own-build upsert without duplicates, bouquet persistence and duplicate rejection.
- Actual Claude pairing: 11 successful tool operations, 5 source records read, 2 pairs saved. Cards connected Creative Canvas with Jad’s reflection interface, and Memory Frog with Egemen’s Goofball Times.
- Actual Claude import: read_public_source then save_build, 1 public source read and 1 build updated. Shared-theme validation was added after a first import produced free-form tags that did not match the interface taxonomy.

Program scores measure tool success and source/ID consistency; they do not establish semantic usefulness or real human cognitive benefit. Full evidence is in scripts/evidence. Test scripts mutate the selected garden; run them against an isolated test store using GARDEN_STATE_PATH, with GARDEN_TEST_URL set to its server URL. Source inspection, structural checks and human judgments remain distinct.

## Storage

Default development uses .garden-data/state.json. Set GARDEN_STORAGE=mongodb with MONGODB_URI to use our_cognitive_gardens, a separate database. The legacy mygardens database is only counted through the new read-only legacy reader. Existing old API routes and UI remain under /legacy and their old paths. The stored legacy MongoDB credentials currently fail authentication; cloud persistence has not been verified in this run.

## Limits and Week 5

Garden selection is a local role switch, not verified student authentication. Before shared use, add verified identities for private conversations. The classroom snapshot is incomplete, and some records use descriptive titles. No actual peer learning or long-term connection outcomes have been measured. The current custom traces are not Langfuse traces.

Week 5: connect Langfuse, create at least five task instances (direct relation, cross-direction inspiration, missing evidence, repeat/rejection, changed needs), repeat stochastic runs, compare with the content baseline, and combine source/constraint scores with classmates’ relevance/inspiration ratings. Record real exchanges separately from intentions.

## AI assistance

OpenAI Codex helped implement the interface, backend, tests and documentation structure. Anthropic Claude generated the recorded pairing and source-import runs. Raine supplied the concept, interaction direction, earlier platform, course directory and reference materials. Personal reflection and interpretations should be reviewed by Raine.
