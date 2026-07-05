## Context

The `rest-fetch-layer` change created the shared REST wrapper (`restRequest`) and a pilot `challenges` client. The backend course domain exposes six REST controllers under `/api/v1/courses`, `/api/v1/lessons`, `/api/v1/quizzes`, `/api/v1/quiz-attempts`, `/api/v1/videos`, and `/api/v1/certificates/verify`. The frontend already reads public course catalogs, course detail, my enrollments, and my course outline through GraphQL (`query-courses`, `query-course`, `query-my-courses`, `query-my-course-outline`, `mutation-course-enroll`).

This change extends the REST client layer to the course cluster, focusing only on actions not covered by GraphQL.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients for the six course controllers in `src/modules/api/rest/course/`.
- Add SWR mutation wrappers for every writing endpoint (POST/PUT/PATCH/DELETE).
- Update `src/modules/api/rest/index.ts` to re-export `./course`.
- Clearly document GraphQL-covered endpoints that are intentionally skipped.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add REST clients for modules outside the six course controllers.
- Do not duplicate GraphQL-covered reads (course list/detail, my courses, my enrollments, course outline, lesson videos).
- Do not add new dependencies.
- Do not build UI components or pages.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Changing it for course-specific needs would couple the generic layer to one domain.

### 2. Group all course clients in one folder
**Rationale:** `src/modules/api/rest/course/` mirrors the controller cluster name and keeps the module boundary clear, just as `challenges/` did.

### 3. Skip GraphQL-covered reads
**Rationale:** Avoid duplicate data layers and conflicting cache semantics. Skipped endpoints:
- `GET /api/v1/courses` (public list) → `query-courses`
- `GET /api/v1/courses/{slug}` (public detail) → `query-course`
- `POST /api/v1/courses/{id}/enroll` → `mutation-course-enroll`
- `GET /api/v1/courses/me/enrollments` → `query-my-courses`
- `GET /api/v1/courses/lessons/{lessonId}/stream` → covered by lesson video GraphQL and presigned flows
- `GET /api/v1/lessons/{lessonId}/content` read path and outline-like data → `query-my-course-outline`, `query-lesson-videos`

All other endpoints (create/update/publish/archive, section/lesson CRUD, video upload completion, progress/complete, bookmarks/notes, freemium config, assignment/quiz CRUD and submission, certificate list/revoke) get REST clients because no equivalent GraphQL operations exist.

### 4. Types inferred from `CourseDtos.java`
**Rationale:** `CourseDtos` is the backend source of truth. We mirror record shapes, using `string` for UUIDs, ISO dates, and BigDecimals.

### 5. SWR wrappers only for mutations
**Rationale:** Read endpoints we keep (e.g., `myCertificates`, `listAssignments`, `mySubmissions`) are not yet consumed by UI in this change. Adding query SWR hooks without consumers would be speculative. Mutation hooks are added because they are the canonical way components trigger writes.

## Risks / Trade-offs

- **[Risk]** Some endpoints (e.g., assignment/quiz creation) are admin-only and may not be needed soon.
  - **Mitigation:** They are included for completeness against the controller contract but are harmless until imported.
- **[Risk]** `mutation-course-enroll` GraphQL returns a checkout flow, while `POST /api/v1/courses/{id}/enroll` performs direct enrollment.
  - **Mitigation:** Documented as a separate REST action for direct enrollment; UI should continue using GraphQL checkout unless explicitly switching.
- **[Risk]** Course REST and GraphQL types may drift.
  - **Mitigation:** Types are generated directly from backend DTOs; future changes should update both layers when needed.

## Migration Plan

Not applicable. This is additive infrastructure.

## Open Questions

- Should public verify certificate (`GET /certificates/verify/{code}`) be consumed from REST directly in a future public page? For now the REST client function is provided but not wired to UI.
