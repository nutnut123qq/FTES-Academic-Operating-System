/**
 * Request/response DTOs for the analytics REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.analytics.web.DashboardController`,
 * `ExportController`, and `vn.ftes.aos.analytics.dashboard.Dashboard`.
 *
 * All exported names are prefixed with `Analytics` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

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
