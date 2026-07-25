## 1. Subject practice — ngân hàng đề trắc nghiệm thật (giải phóng 16.1)

- [x] 1.1 REST client môn học thêm `getPracticeQuiz(code, count)` / `submitPracticeQuiz(code, body)`
      (`GET|POST /api/v1/subjects/{code}/practice/quiz[/submit]`) + types `PracticeQuizView`,
      `PracticeQuizResultView`.
- [x] 1.2 `PracticeQuiz`: chọn số câu (5 / 10 / 20, BE mặc định 10, cap 50) → bốc đề → làm bài →
      nộp; câu nhiều đáp án có gợi ý "chọn tất cả đáp án đúng", thanh tiến độ đếm câu đã trả lời.
- [x] 1.3 Kết quả đọc **verdict của BE** (`correct` / `correctKeys` / `explanation`), KHÔNG tự chấm
      lại ở FE; hiện %, đúng/tổng, điểm, số câu bỏ trống, và "Làm bộ đề khác".
- [x] 1.4 Nói rõ tính phù du: `quiz.intro` + `quiz.ephemeralNote` ("không tính vào học bạ") ở cả
      màn bắt đầu lẫn màn kết quả.
- [x] 1.5 Môn chưa có câu hỏi → empty state riêng (`quiz.empty` / `quiz.emptyDesc`) trỏ sang AI Quiz,
      KHÔNG hiện nút bốc đề.
- [x] 1.6 `practiceQuiz.ts` (logic thuần) + test đơn vị: dựng phiếu trả lời, đếm đã trả lời, map lỗi.
- [x] 1.7 Xoá `PracticeAiHandoff.tsx` — handoff chỉ là chỗ trú tạm khi chưa có endpoint.

## 2. Subject practice — flashcards curated + tiến độ SM-2 trên máy chủ (giải phóng 16.2, 16.3)

- [x] 2.1 REST client: `getSubjectFlashcards`, `reviewFlashcard`, CRUD deck (`create/update/delete`)
      và card (`add/update/delete`).
- [x] 2.2 `PracticeFlashcards` ôn trên bộ thẻ thật, hàng đợi **due-first**, badge "Đến hạn", tóm tắt
      `{count} thẻ đến hạn`.
- [x] 2.3 Mỗi lần chấm gọi `POST …/flashcards/{cardId}/review`; SM-2 (ease · interval · dueAt · due
      count) do BE trả được ghi thẳng vào cache SWR — bỏ câu "chỉ lưu trong phiên", thay bằng
      `flashcards.progressSaved`.
- [x] 2.4 Nhãn trạng thái thẻ theo `NEW` / `LEARNING` / `REVIEWING` (`flashcards.status.*`, key
      lowercase khớp enum BE).
- [x] 2.5 `PracticeFlashcardManager` cho người có quyền curate: tạo deck (dán thẻ theo dòng
      `mặt trước | mặt sau`, đếm thẻ hợp lệ), thêm thẻ, xoá deck có xác nhận.
- [x] 2.6 `flashcardSm2.ts` (preview khoảng lặp + 4 mức chấm) tách khỏi component.

## 3. Subject AI tutor — lọc theo môn (giải phóng 16.4)

- [x] 3.1 Danh sách hội thoại gửi `subjectId` = **UUID của môn**, không phải mã môn trên route;
      test pin đúng tham số truy vấn.
- [x] 3.2 Copy đổi từ "toàn bộ hội thoại" sang `tutor.subjectOnlyHint`; xoá hội thoại chỉ đụng môn
      đang xem (`tutor.clearActionSubject`, `tutor.clearedCount`).

## 4. Resource Hub — like bình luận, đánh giá của chính mình, ghi chú bộ sưu tập

- [x] 4.1 `useMutateLikeResourceCommentSwr`: `PUT|DELETE /resources/comments/{id}/like`, optimistic
      theo cây bình luận, **tin `{active, likeCount}` server trả** thay vì đếm lại ở client;
      rollback đọc cache TẠI THỜI ĐIỂM revert (không phục hồi snapshot cũ).
- [x] 4.2 `useQueryMyResourceRatingSwr`: `GET /resources/{id}/ratings/me`, "chưa đánh giá" là
      `data: null` trên 200 (không phải 404), key `null` cho khách.
- [x] 4.3 `ResourceRating` prefill sao + nhận xét đã lưu, nút đổi thành **Cập nhật đánh giá**, hiện
      `reviews.editedAt` khi có `updatedAt`.
- [x] 4.4 `useMutateDeleteMyResourceRatingSwr`: `DELETE /resources/{id}/ratings/me` sau
      `ConfirmDialog`; **idempotent** (xoá lại = thành công), revalidate cả danh sách đánh giá lẫn
      cache đánh giá của mình.
- [x] 4.5 Ghi chú cho một tài nguyên trong bộ sưu tập: `PATCH /resources/collections/{id}/items/
      {resourceId}` giữ nguyên `sortOrder`, ghi chú rỗng = xoá ghi chú, lỗi thì trả lại ghi chú cũ.
- [ ] 4.6 **Chưa xong:** các hàm client tương ứng (`likeResourceComment` / `unlikeResourceComment` /
      `getMyResourceRating` / `deleteMyResourceRating` / `updateCollectionItemNote`) và các field
      `ResourceCommentView.{likedByMe,likeCount}` / `RatingResponse.updatedAt` chưa có trong
      `src/modules/api/rest/resource` → `tsc --noEmit` còn đỏ ở cụm này.

## 5. Community — chuyển cấp báo cáo

- [x] 5.1 `useMutateEscalateReportSwr`: `POST /community/reports/{reportId}/escalate`, dùng
      **`ModerationQueueResponse.reportId`** (nullable) chứ không phải id dòng hàng đợi; chỉ hiện
      hành động trên dòng có `reportId`.
- [x] 5.2 **Đổi cách làm (2026-07-25):** KHÔNG gỡ dòng khỏi hàng đợi nữa. BE `escalate` chỉ đổi
      `report.status → IN_REVIEW`, KHÔNG đụng `moderation_queue_items`, mà dòng source=REPORT giữ
      liên kết cứng `report_id` (V265) → gỡ optimistic thì revalidate nào cũng làm dòng sống lại
      KÈM nút "Chuyển cấp" (bấm nữa = 409). Nay dòng **ở lại** (vẫn cần quyết định Giữ/Gỡ) và chỉ
      đổi nút thành chip `moderation.escalatedTag`; id report đã chuyển cấp nhớ trong cache
      `ESCALATED_REPORTS_KEY` nên **sống qua revalidate**.
- [x] 5.3 409 = đã chuyển cấp trước đó → đánh dấu như thành công, báo `moderation.escalateAlready`;
      403 / 404 / 429 đi qua `communityErrorMessageKey` và không đánh dấu gì.
- [ ] 5.4 **Chưa xong:** block `PinnedBadge` mới dựng chưa được feed tiêu thụ — REST feed hiện
      KHÔNG trả field `pinned` nào (`src/modules/api/rest/community` không có), nên key
      `communityHub.feed.pinnedBadge` vẫn là key chết. `CommunityPostCard` (block dùng
      `post.isPinned` của GraphQL cũ) cũng chưa có nơi render. (`ModerationReport.reportId` đã có.)

## 6. Groups Hub — gỡ ảnh nhóm & hộp thư lời mời

- [x] 6.1 `GroupIdentitySection`: "Gỡ ảnh" phân biệt **ảnh vừa chọn chưa lưu** (chỉ bỏ khỏi xem
      trước, không gọi API) với **ảnh đã lưu** (`ConfirmDialog` → `DELETE /groups/{id}/media/{kind}`),
      copy theo `identity.removeHint` + 2 mô tả xác nhận riêng cho avatar / ảnh nền.
- [x] 6.2 Sau khi gỡ, patch cache header nhóm để avatar/cover biến mất mọi nơi không cần refetch;
      gỡ hỏng giữa chừng vẫn coi là **thay đổi chờ lưu** (nút Lưu vẫn bật).
- [x] 6.3 `GroupInvitationsInbox` + `useQueryMyInvitationsSwr`: `GET /invitations/me` (limit 20),
      mỗi dòng tự đủ dữ liệu (nhóm + người mời + hạn) nên không cần request phụ; khách không gọi.
- [x] 6.4 Trạng thái rỗng / lỗi / không hạn trả lời có copy riêng (`invitations.*`).
- [x] 6.5 **Mount thật (2026-07-25):** trang quản lý nhóm render `GroupIdentitySection` (thay khối
      `GroupIdentityFields` trần không truyền `onRemove` → trước đó DELETE không bao giờ chạy) và
      `/groups` render `GroupInvitationsInbox` (accept xong revalidate danh sách nhóm). Export
      `clearGroupMedia` / `getMyInvitations` / `GroupMediaKind` / `GroupMyInvitation` + prop
      `onRemove` đã có sẵn.
- [x] 6.6 **Sửa bẫy (2026-07-25):** bỏ file vừa chọn ≠ gỡ ảnh đã lưu. `useIdentityImagePicker` tách
      `discardPick()` (chỉ bỏ pick) khỏi `remove()` (đánh dấu đã gỡ ảnh server); nhánh local-drop
      dùng `discardPick()` — trước đó bỏ file chọn nhầm làm `needsClear()` bật và bấm Lưu sẽ XOÁ
      THẬT avatar/cover trên server.

## 7. Identity — trạng thái theo dõi theo lô

- [x] 7.1 `useQueryFollowedUserIdsSwr`: dedupe + sort id để một danh sách chỉ sinh MỘT cache entry,
      chia lô theo `FOLLOW_BATCH_LIMIT`, `Promise.allSettled` để một lô hỏng không giết cả danh sách.
- [x] 7.2 Toggle theo dõi optimistic patch đúng những lô CÓ CHỨA user đó (`isFollowedUserIdsKeyFor`)
      — **thực sự nối 2026-07-25**: trước đó `useMutateFollowUserSwr` chỉ patch cache hovercard nên
      nhãn "Đang theo dõi" ở các dòng danh sách đứng im tới 60s (`dedupingInterval`); nay patch cả
      lô và hoàn lại lô khi write hỏng.
- [x] 7.3 `getFollowedUserIds` / `FOLLOW_BATCH_LIMIT` đã export từ `src/modules/api/rest/community`.
- [ ] 7.4 **Chưa xong:** `useQueryFollowedUserIdsSwr` vẫn CHƯA có nơi tiêu thụ — không danh sách tác
      giả nào (feed / bình luận / thành viên) đọc trạng thái theo dõi theo lô, vì `UserLink` chưa
      nhận trạng thái từ ngoài (mỗi avatar vẫn tự hỏi hovercard khi hover).

## 8. i18n & glue

- [x] 8.1 Thêm 96 key vào `src/messages/vi.json` + `src/messages/en.json` (`resourceHub.{comments,
      reviews,collections}`, `communityHub.{feed,moderation}`, `groupsHub.{identity,invitations}`,
      `subjects.aiTools.tutor`, `subjects.practice.{modules,quiz,flashcards,errors}`) — JSON hợp lệ,
      parity vi/en = 0 lệch (5461 key mỗi bên).
- [x] 8.2 Đổi `subjects.practice.modules.quiz.meta`: "{count} bộ đề" → "{count} câu hỏi" (thẻ module
      giờ đếm câu hỏi trong ngân hàng đề).
- [x] 8.3 Rà key ĐỘNG của đợt này đủ mọi nhánh: `practice.errors.${resolvePracticeErrorKey(...)}`
      (10 nhánh: invalid · unauthorized · forbidden · notFound · conflict · rateLimited ·
      unavailable · timeout · network · generic), `practice.quiz.${verdict}` (correct / incorrect /
      skipped), `practice.flashcards.status.${status.toLowerCase()}` (new / learning / reviewing),
      `practice.flashcards.rating.${labelKey}` (again / hard / good / easy),
      `resourceHub.apiErrors.${resolveResourceErrorKey(...)}` (5 nhánh) — tất cả đã có key.
- [x] 8.4 Grep toàn bộ file đã sửa + file mới: 0 key `t("…")` tĩnh còn thiếu ở vi hoặc en.
- [ ] 8.5 **Chưa xong (ngoài phạm vi glue):** `tsc --noEmit` còn 44 lỗi thuộc cụm 4.6 / 5.4 / 6.5 /
      7.3 (thiếu export REST + prop component), phải đóng trước khi build.

## 9. Deferred — vẫn chờ BE

- [ ] 9.1 Thống kê môn (`SubjectStatistics`) và định hướng nghề theo môn (`SubjectCareer`) vẫn là dữ
      liệu mẫu — chưa có endpoint.
- [ ] 9.2 Độ khó / tỉ lệ chấp nhận / cờ "đã giải" của thử thách — không có trên payload danh sách.
