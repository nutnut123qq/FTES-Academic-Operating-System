# subject-discussion-feed-uuid — Feed thảo luận môn học query bằng subject UUID

## Why

Tab "Thảo luận" của subject workspace đọc feed qua GraphQL
`subjectWorkspace(subjectId: ID!).community(scope)` (hook `useQuerySubjectFeedSwr` +
`useQuerySubjectPostCommentsSwr`). Nhưng `subjectId` được lấy thẳng từ route segment
`/subjects/[subjectId]` — vốn là **course code** (`PRF192`), không phải UUID. Các REST
endpoint subject (`/subjects/{code}/...`) key theo code nên FE cố tình carry code làm id
(`toSubjectFromDetail` đặt `id = detail.code`, bỏ `detail.id`). GraphQL `subjectWorkspace`
lại yêu cầu **UUID** — truyền code vào khiến BE resolver ném `"Internal error"` (500),
`subjectWorkspace = null` → tab Thảo luận hiện "Không tải được thảo luận" cho **mọi** môn.

## What Changes

- Thêm field `uuid` vào type `Subject` (`useQuerySubjectSwr`), map từ `detail.id` /
  `summary.id` (UUID thật; giữ nguyên `id = code` để không phá routing/link vốn dùng code).
- `SubjectCommunity` resolve code → UUID qua `useQuerySubjectSwr(code)` rồi truyền `uuid`
  làm `subjectId` xuống `useQuerySubjectFeedSwr` + `SubjectPostRow` (comments + react hooks)
  — các hook GraphQL nhận đúng UUID. `isLoading` gộp cả bước resolve subject.
- **KHÔNG** đổi contract BE, **KHÔNG** đổi route (segment vẫn là code), **KHÔNG** đụng
  overview/members (đang chạy đúng qua REST theo code).

## Capabilities

### New Capabilities
- `subject-discussion-feed`: feed thảo luận môn học SHALL query GraphQL bằng subject UUID
  (resolve từ route code), tách khỏi định danh code dùng cho REST/routing.

### Modified Capabilities
<!-- none -->

## Impact

- FE only. `src/components/features/subject/hooks/useQuerySubjectSwr.ts` (+field `uuid`),
  `src/components/features/subject/SubjectCommunity/index.tsx` (resolve + truyền UUID).
- `npm run build` (webpack) + `tsc --noEmit` xanh; verify E2E: feed load đúng bài viết
  của môn (đã seed) trên FE local nối apitest.
- Latent liên quan (KHÔNG trong scope): mọi consumer GraphQL khác truyền code (subjectMastery,
  statistics...) có thể cùng lỗi; BE resolver không nên 500 trên non-UUID (robustness BE).
