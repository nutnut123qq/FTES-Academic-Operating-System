## Context

The frontend already consumes several backend modules through typed REST clients in `src/modules/api/rest/*` (e.g., `recommendation`, `group`, `platform`). The Admin module exposes four REST controllers in `vn.ftes.aos.admin.web`:

- `AdminConsoleController` — banner + announcement command endpoints under `/api/v1/admin`.
- `AdminBulkController` — two-step bulk user lock/unlock under `/api/v1/admin`.
- `AdminContentPublicController` — public banner/announcement reads under `/api/v1/admin-content`.
- `AdminAnalyticsProxyController` — analytics dashboard proxy under `/api/v1/admin/analytics`.

This change adds the corresponding frontend REST module and SWR hooks, following the same patterns already established by `rest-fetch-platform`, `rest-fetch-workflow`, etc.

## Goals / Non-Goals

**Goals:**
- Provide a typed REST client (`src/modules/api/rest/admin`) covering the four admin controllers listed above.
- Provide SWR query hooks for all read endpoints and SWR mutation hooks for all write endpoints.
- Prefix every exported type with `Admin*` to avoid collisions in the top-level barrel export.
- Verify TypeScript and webpack build remain green.

**Non-Goals:**
- No GraphQL read operations for admin lists/details (backend routes those through the GraphQL gateway).
- No backend changes.
- No new runtime dependencies.
- No product UI pages or forms.

## Decisions

1. **One module per domain, one controller per namespace.**
   - `AdminConsoleController` and `AdminBulkController` share the `/api/v1/admin` namespace, but they represent distinct capabilities (console content management vs. bulk operations). We expose them from the same `admin.ts` file to keep the module small, with function names prefixed by capability (e.g., `createAdminBanner`, `bulkLockAdminUsers`).

2. **Use record names as type names.**
   - Java records (`CreateBannerBody`, `PatchBannerBody`, `BulkBody`, etc.) are mapped to TypeScript interfaces prefixed with `Admin` (e.g., `AdminCreateBannerRequest`, `AdminPatchBannerRequest`). This mirrors the established convention in other REST modules.

3. **Delete endpoints accept `ReasonBody`.**
   - Both `DELETE /admin/banners/{id}` and `DELETE /admin/announcements/{id}` require a JSON body containing `reason`. We model this as `AdminDeleteBannerRequest` and `AdminDeleteAnnouncementRequest` even though the method is `DELETE`, matching the backend contract.

4. **Bulk confirm returns `BulkOperation` entity.**
   - The confirm endpoint returns the full `BulkOperation` domain object; we expose it as `AdminBulkOperation` with JSON string fields for `targetIds`, `params`, `dryRunResult`, and `result`, matching the JPA entity shape.

5. **Analytics dashboard payload typed loosely.**
   - `GET /admin/analytics/dashboards/{key}` returns `Map<String, Object>`. We type it as `Record<string, unknown>` to avoid premature structural assumptions.

6. **SWR keys use tuple arrays.**
   - Query keys follow the existing pattern: `["admin", "banners", placement]`, `["admin", "announcements", "active"]`, `["admin", "analytics", "dashboards"]`, `["admin", "analytics", "dashboard", key, { from, to, filter }]`.

## Risks / Trade-offs

- [Risk] Bulk operation domain entity exposes raw JSON strings for `targetIds`, `params`, etc. Consumers must parse them if needed. → Mitigation: type them as `string` and document the raw nature in JSDoc; add helper types only when a concrete consumer emerges.
- [Risk] `AdminConsoleController` comment says read operations live in the GraphQL gateway; we only implement command endpoints here, which is correct.
- [Risk] `DELETE` with a body is non-standard but required by the backend. → Mitigation: call `restRequest` with `method: "DELETE"` and pass the body.

## Migration Plan

No migration needed. This is a new additive module.

## Open Questions

None.
