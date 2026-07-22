## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, `wallet`, and `blog`. The career domain exposes two REST controllers in `vn.ftes.aos.career.web` — `CareerController` for roadmaps, opportunities, mentors, recommendations, and applications, and `CareerSkillController` for skills and assessments. The frontend currently has no typed REST layer for career features, and there are no equivalent GraphQL operations covering this surface.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/career/` covering:
  - `CareerController` — roadmaps, opportunities, applications, mentorships, recommendations.
  - `CareerSkillController` — skill graph, skill progress, self/mentor assessments.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint.
- Add `useGet*Swr` query hooks for read endpoints.
- Update `src/modules/api/rest/index.ts` to re-export `./career`.
- Keep StarCI identifiers (e.g. `starciRoadmapId`, `starciRef`, `starciSkillId`) exactly as named in the backend contract.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-career`: REST client + SWR wrappers for the career web controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/career/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
