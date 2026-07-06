# Proposal — analytics-dashboard

## Why

Checklist STT 24: trang Dashboard chưa có UI. Dựng overview dashboard tham khảo StarCI.

## What Changes

- **`AnalyticsDashboard`** (route `/analytics`): overview 2 cột — trái là card danh tính
  (streak · AI credit · rewards) + quick actions; phải là "Continue learning" +
  "Today's quest" checklist + weekly streak strip + "Weekly goals" progress bars.
- FE-only, mock hooks; skeleton per-widget qua `AsyncContent` + `Skeleton`. i18n gom
  scratch rồi merge.

## Capabilities

### Modified Capabilities

- `analytics-dashboard`: trang overview có nội dung thật (identity/quick-actions +
  continue-learning + quest + streak + weekly goals), thay cho trang trống.

## Impact

- FE-only, thư mục `features/analytics/AnalyticsDashboard` + route + hooks. Mock,
  không BE thật, không dependency mới.
