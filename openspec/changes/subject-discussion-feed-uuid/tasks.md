# Tasks — subject-discussion-feed-uuid

## 1. Resolve subject UUID cho feed
- [x] 1.1 `useQuerySubjectSwr`: thêm field `uuid` vào type `Subject`; `toSubjectFromSummary` map `uuid: summary.id`, `toSubjectFromDetail` map `uuid: detail.id` (giữ `id = code`).
- [x] 1.2 `SubjectCommunity`: đổi `useParams().subjectId` → `code`; `useQuerySubjectSwr(code)` lấy `subject.uuid`; truyền `uuid` làm `subjectId` cho `useQuerySubjectFeedSwr` + `SubjectPostRow`; `isLoading = subjectLoading || feedLoading`.

## 2. Verify
- [x] 2.1 `tsc --noEmit` sạch.
- [x] 2.2 `npm run build` (webpack) xanh.
- [x] 2.3 E2E FE local: tab Thảo luận môn đã seed load đúng bài viết (thay vì "Không tải được thảo luận").
