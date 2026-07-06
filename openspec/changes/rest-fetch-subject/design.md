## Context

The `rest-fetch-layer` and `rest-fetch-course` changes established a shared REST wrapper and wired the challenges and course domains. The backend subject domain exposes four REST controllers under `/api/v1/subjects/*` with a standard `{code,message,data}` envelope. The frontend currently has no GraphQL operations consuming subject data (`src/modules/api/graphql/queries` contains no subject-specific files), even though the backend provides a `SubjectWorkspaceController` GraphQL resolver. Therefore the REST surface is the only usable contract on the FE side today.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients for the four subject controllers in `src/modules/api/rest/subject/`.
- Add SWR mutation wrappers for every writing endpoint (POST/PUT/DELETE/PATCH).
- Update `src/modules/api/rest/index.ts` to re-export `./subject`.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add REST clients for modules outside the four subject controllers.
- Do not add GraphQL operations; only document why GraphQL is not used for this change.
- Do not add new dependencies.
- Do not build UI components or pages.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping.

### 2. Group all subject clients in one folder
**Rationale:** `src/modules/api/rest/subject/` mirrors the controller cluster name, consistent with `challenges/` and `course/`.

### 3. No GraphQL overlap to skip
**Rationale:** A scan of `src/modules/api/graphql/queries` and `src/modules/api/graphql/mutations` found no subject-specific operations. `mutation-purchase-membership` is marketplace-related, not subject membership. The backend GraphQL resolver `SubjectWorkspaceController` exists but is not yet consumed by the FE, so no REST endpoint is duplicated by FE GraphQL.

### 4. Types inferred from `SubjectDtos.java` and `WorkspaceDtos.java`
**Rationale:** These DTO classes are the backend source of truth. We mirror record shapes, using `string` for UUIDs, ISO dates, BigDecimals, and enums.

### 5. SWR wrappers only for mutations
**Rationale:** Read endpoints (subject list/detail, workspace, members, statistics) are not consumed by UI in this change. Adding query SWR hooks without consumers would be speculative. Mutation hooks are added because they are the canonical way components trigger writes.

## Risks / Trade-offs

- **[Risk]** Some endpoints (e.g., subject create/publish/archive, role change, ban) are admin/moderator-only and may not be needed soon.
  - **Mitigation:** They are included for completeness against the controller contract but are harmless until imported.
- **[Risk]** When the FE eventually consumes the backend `SubjectWorkspaceController` GraphQL resolver, some read endpoints may become redundant.
  - **Mitigation:** The design explicitly notes this possibility; reads are implemented via REST now because no FE GraphQL consumer exists.

## Migration Plan

Not applicable. This is additive infrastructure.

## Open Questions

- Should a future change add GraphQL queries for `SubjectWorkspaceController` and retire the corresponding REST reads? Out of scope here.
