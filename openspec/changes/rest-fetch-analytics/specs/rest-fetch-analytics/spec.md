## Purpose

Provide a typed REST client and SWR hooks for the analytics REST controllers (`DashboardController`, `ExportController`).

## API Surface

### `src/modules/api/rest/analytics/types.ts`

```ts
export interface AnalyticsDashboardWidget {
    key: string
    title: string
    series?: Array<Record<string, unknown>>
    value?: unknown
    table?: Array<Record<string, unknown>>
}

export interface AnalyticsDashboard {
    domain: string
    widgets: AnalyticsDashboardWidget[]
    refreshedAt: string
}

export interface AnalyticsExportRequest {
    domain: string
    from: string
    to: string
    userId?: string
}

export interface AnalyticsExportCsvResult {
    kind: "csv"
    csv: string
}

export interface AnalyticsExportJobResult {
    kind: "job"
    jobId: string
}

export type AnalyticsExportResult = AnalyticsExportCsvResult | AnalyticsExportJobResult

export interface AnalyticsExportStatus {
    jobId: string
    status: string
    rowCount: number
    downloadUrl?: string
}

export interface AnalyticsExportDownload {
    storageKey: string
    token: string
}
```

### `src/modules/api/rest/analytics/analytics.ts`

```ts
export const listAnalyticsDashboards = (): Promise<string[]>
export const getAnalyticsDashboard = (domain: string, params?: {
    from?: string
    to?: string
    granularity?: string
    userId?: string
    subjectId?: string
}): Promise<AnalyticsDashboard>
export const requestAnalyticsExport = (request: AnalyticsExportRequest): Promise<AnalyticsExportResult>
export const getAnalyticsExportStatus = (jobId: string): Promise<AnalyticsExportStatus>
export const downloadAnalyticsExport = (params: AnalyticsExportDownload): Promise<ArrayBuffer>
```

Notes:
- `requestAnalyticsExport` uses the shared axios instance (not `restRequest`) because the response may be either inline CSV (`text/csv`) or a JSON accepted envelope (`code=202`).
- `downloadAnalyticsExport` returns raw CSV bytes and uses `responseType: "arraybuffer"`.
- All other functions use `restRequest`.

### SWR Hooks

| Hook | File | Type | Key |
|------|------|------|-----|
| `useGetAnalyticsDashboardsSwr` | `src/hooks/swr/api/rest/queries/useGetAnalyticsDashboardsSwr.ts` | query | `["GET_ANALYTICS_DASHBOARDS_SWR"]` |
| `useGetAnalyticsDashboardSwr` | `src/hooks/swr/api/rest/queries/useGetAnalyticsDashboardSwr.ts` | query | `["GET_ANALYTICS_DASHBOARD_SWR", domain, params]` |
| `useGetAnalyticsExportStatusSwr` | `src/hooks/swr/api/rest/queries/useGetAnalyticsExportStatusSwr.ts` | query | `["GET_ANALYTICS_EXPORT_STATUS_SWR", jobId]` |
| `usePostAnalyticsExportSwr` | `src/hooks/swr/api/rest/mutations/usePostAnalyticsExportSwr.ts` | mutation | `"POST_ANALYTICS_EXPORT_SWR"` |

## Acceptance Criteria

1. `src/modules/api/rest/analytics/analytics.ts` exports typed functions for all analytics controller endpoints.
2. `src/modules/api/rest/analytics/types.ts` mirrors the backend DTO shapes and uses `Analytics` prefixes.
3. `src/modules/api/rest/index.ts` re-exports `./analytics`.
4. Query and mutation SWR hooks exist and correctly call the clients.
5. `npx tsc --noEmit` exits cleanly.
6. `npm run build -- --webpack` exits cleanly.

## Out of Scope

- UI components/pages using analytics.
- Replacing GraphQL `my-dashboard`.
- Backend controller changes.
- New npm dependencies.
