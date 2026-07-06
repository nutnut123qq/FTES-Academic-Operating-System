## 1. Scaffold REST client module

- [x] 1.1 Create `src/modules/api/rest/analytics/types.ts` with prefixed DTOs for `AnalyticsDashboard`, `AnalyticsDashboardWidget`, `AnalyticsExportRequest`, `AnalyticsExportResult`, `AnalyticsExportStatus`, and `AnalyticsExportDownload`.
- [x] 1.2 Create `src/modules/api/rest/analytics/analytics.ts` implementing `listAnalyticsDashboards`, `getAnalyticsDashboard`, `requestAnalyticsExport`, `getAnalyticsExportStatus`, and `downloadAnalyticsExport`.
- [x] 1.3 Create `src/modules/api/rest/analytics/index.ts` barrel file.

## 2. Update REST barrel

- [x] 2.1 Add `export * from "./analytics"` to `src/modules/api/rest/index.ts`.

## 3. Add SWR query hooks

- [x] 3.1 Create `src/hooks/swr/api/rest/queries/useGetAnalyticsDashboardsSwr.ts`.
- [x] 3.2 Create `src/hooks/swr/api/rest/queries/useGetAnalyticsDashboardSwr.ts`.
- [x] 3.3 Create `src/hooks/swr/api/rest/queries/useGetAnalyticsExportStatusSwr.ts`.
- [x] 3.4 Update `src/hooks/swr/api/rest/queries/index.ts` barrel.

## 4. Add SWR mutation hook

- [x] 4.1 Create `src/hooks/swr/api/rest/mutations/usePostAnalyticsExportSwr.ts`.
- [x] 4.2 Update `src/hooks/swr/api/rest/mutations/index.ts` barrel.

## 5. Verify

- [x] 5.1 Run `npx tsc --noEmit` and fix any type errors.
- [x] 5.2 Run `npm run build -- --webpack` and fix any build errors.
