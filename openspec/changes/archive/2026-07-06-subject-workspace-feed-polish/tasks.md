# Tasks — subject-workspace-feed-polish

## 1. Ambient (STT 2)

- [ ] 1.1 `InnerLayout`: đổi `isLearnRoute` → guard chung khớp `/learn`, `/community`,
      `/subjects`; AmbientBackground chỉ render khi KHÔNG ở các route đó.

## 2. Progress % (STT 29B)

- [ ] 2.1 `SubjectWorkspaceShell`: bọc `ProgressMeter` header trong flex row + thêm
      `{Math.round(progress)}%` `tabular-nums` sát phải thanh.

## 3. Join banner (STT 29C)

- [ ] 3.1 `SubjectOverview`: dời dòng stats lên đầu (dưới header workspace).
- [ ] 3.2 Notice "đã tham gia" tắt được: nút ×, nhớ qua `localStorage` theo `subjectId`.
- [ ] 3.3 Dời nút "Đăng bài" sang cạnh tiêu đề "Thảo luận gần đây".
- [ ] 3.4 i18n `subjects.overview.dismiss` (vi + en).

## 4. Verify

- [ ] 4.1 `tsc --noEmit` sạch + eslint file đã chạm.
- [ ] 4.2 `npm run build` (webpack) xanh.
