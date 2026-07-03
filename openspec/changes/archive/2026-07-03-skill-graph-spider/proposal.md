## Why
§21 Career Center names the Skill Graph as a core capability, yet 0% of it exists in src/ — the profile Progress section is a placeholder and the subject Career tab shows only flat skill chips. The user wants the skill graph organized as a spider-web ("mạng nhện") network so learners see skills as an interconnected map, not a list.

## What Changes
- Introduce a skill-graph data model: skill nodes (id, name, domain, level 0–100, status locked/learning/mastered) and typed edges (prerequisite / related), clustered by career domain (BE/FE/Mobile/AI/Data/DevOps per §21 roadmap).
- Build a spider-web force-directed graph visualization (`@xyflow/react` + `d3-force`, both already installed): user at center, skills clustered by domain around it, node size/color encode mastery, edge style encodes relation type.
- Interactions: pan/zoom, click node → detail side panel (progress, related subjects/courses linking into the workspace), hover highlights neighbors, domain filter, legend; simplified list fallback on mobile.
- Surface the graph in two places: profile Progress section (full graph) and subject workspace Career tab (subject-scoped subgraph).
- Mock SWR hook `useQuerySkillGraphSwr` (FE-only, deterministic sample, drop-in BE swap later); i18n vi/en; loading skeleton; a11y (keyboard focus, aria).

## Capabilities

### New Capabilities
- `skill-graph-view`: spider-web network visualization of the learner's skills — data model, force layout, interactions, surfaces, states (loading/empty), i18n and a11y.

### Modified Capabilities
- (none — profile Progress and subject Career tab have no existing spec requirements for a skill graph)

## Impact
- FE only, no BE (mock SWR per house rule). No new dependencies — uses installed `@xyflow/react@^12` and `d3-force@^3`.
- New feature components under `src/components/features/` (skill-graph feature + hook); wired into `ProfileShell` Progress section and `SubjectCareer` tab.
- i18n messages (vi/en). Build must stay green: `npm run build` (webpack) + `tsc --noEmit`.
