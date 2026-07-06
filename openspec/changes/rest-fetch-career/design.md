## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, `wallet`, and `blog`. The backend career domain in `vn.ftes.aos.career.web` exposes two REST controllers under `/api/v1/career`:

- `CareerController` — roadmaps, opportunities, applications, mentorships, recommendations.
- `CareerSkillController` — skill graph, skill progress, self/mentor assessments.

The frontend has no GraphQL operations that overlap with the career surface. Generic "jobs" fields in challenge/cv GraphQL types are unrelated to this career domain, so every career endpoint is implemented via REST.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/career/` for all career endpoints.
- Add SWR mutation wrappers for every writing REST endpoint.
- Add SWR query wrappers for every read REST endpoint.
- Update `src/modules/api/rest/index.ts` to re-export `./career`.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.
- Do not rename StarCI fields; keep `starciRoadmapId`, `starciRef`, and `starciSkillId` as named in the backend contract.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap (`code === 200`), and error mapping. Career needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/career/`
**Rationale:** Mirrors the backend package `career.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Implement every career endpoint
**Rationale:** No GraphQL operations exist for roadmaps, opportunities, applications, mentorships, recommendations, skills, or assessments. All reads and writes are exposed via REST.

### 4. Types inferred from controller records and domain entities
**Rationale:** Request bodies are Java records declared inside the controllers; responses reuse JPA entities (`Roadmap`, `Opportunity`, etc.). We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps. JSON fields (`requiredSkills`, `levels`, `sourceBreakdown`, `payload`) are typed as `unknown` / `string` depending on usage, with a comment noting the backend contract.

### 5. Preserve StarCI naming
**Rationale:** The backend design references StarCI (§21/§23). We keep `starciRoadmapId`, `starciRef`, and `starciSkillId` exactly as-is to stay aligned with the contract and avoid semantic drift.

## Risks / Trade-offs

- **[Risk]** Several endpoints require `career.manage`, `career.opportunity.manage`, or `career.mentor`; callers must ensure the UI holds the appropriate permission.
- **[Risk]** Some endpoints return `Map<String, Object>` (`roadmapDetail`, `skillGraph`). We type them as loosely-shaped objects with the known keys documented; exact deep shapes should be tightened when consumed by UI code.
- **[Trade-off]** We expose both public reads (roadmap list, opportunities, skills) and authenticated reads (my roadmaps, my applications, my skills, my recommendations) as separate functions to keep the audience explicit.

## Affected Files / Modules

- `src/modules/api/rest/career/types.ts`
- `src/modules/api/rest/career/career.ts`
- `src/modules/api/rest/career/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
