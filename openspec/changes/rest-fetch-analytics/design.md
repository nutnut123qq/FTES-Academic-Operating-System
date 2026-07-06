## Context

The shared REST client (`restRequest`) powers multiple domains. The analytics backend (`vn.ftes.aos.analytics.web`) exposes `DashboardController` (`/api/v1/analytics/dashboards`) and `ExportController` (`/api/v1/analytics/exports`). The frontend does not currently have typed REST coverage for analytics; the existing GraphQL `my-dashboard` query is a personal learner dashboard, not the analytics dashboard domain.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/analytics/` for both analytics controllers.
- Add SWR query hooks for reads (dashboard list, dashboard data, export status, export download).
- Add an SWR mutation hook for the export request.
- Prefix every exported analytics type/interface with `Analytics` to avoid collisions in the shared `src/modules/api/rest/index.ts` barrel.
- Update `src/modules/api/rest/index.ts` to re-export `./analytics`.
- Pass `npx tsc --noEmit` and `npm run build -- --webpack`.

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.
- Do not duplicate GraphQL `my-dashboard` (it is unrelated to analytics dashboards).

## Decisions

### 1. Reuse `restRequest` for standard JSON envelope endpoints
**Rationale:** Dashboard list, dashboard data, export status, and export download all return JSON envelopes and fit `restRequest`.

### 2. Handle `POST /analytics/exports` with axios directly
**Rationale:** The endpoint is polymorphic: small exports return `text/csv` inline, large exports return an accepted JSON envelope (`code=202`). `restRequest` is hard-coded for JSON envelopes, so the export request uses `createRestAxiosInstance` and inspects the response content type.

### 3. Prefix all exported analytics types with `Analytics`
**Rationale:** `src/modules/api/rest/index.ts` re-exports every module with `export *`. Generic names such as `Dashboard`, `Widget`, `ExportBody`, or `ExportJob` would collide with other domains. Prefixing keeps the barrel safe without modifying other modules.

### 4. Types inferred from backend records
**Rationale:** `Dashboard.java`, `ExportController.ExportBody`, and `ExportJob` are the source of truth. `Widget` is polymorphic (`series`, `value`, `table`), so `series` and `table` are typed as `Array<Record<string, unknown>>` and `value` as `unknown`.

## Risks / Trade-offs

- **[Risk]** `POST /analytics/exports` can return CSV inline or a JSON accepted payload. The client must detect the response content type; callers must handle both `AnalyticsExportCsvResult` and `AnalyticsExportJobResult`.
- **[Risk]** `GET /analytics/exports/download/{storageKey}` returns raw CSV bytes (`byte[]`), not a JSON envelope. It is implemented with axios and `responseType: "arraybuffer"`.
- **[Risk]** Dashboard endpoints are permission-gated (`analytics.dashboard.{domain}`); callers must ensure the user has the correct authority.
- **[Trade-off]** We keep the export polymorphism in one function rather than splitting it into two separate client functions, because the backend decides inline vs. async based on export size, which the client cannot predict.

## Affected Files / Modules

- `src/modules/api/rest/analytics/types.ts`
- `src/modules/api/rest/analytics/analytics.ts`
- `src/modules/api/rest/analytics/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
