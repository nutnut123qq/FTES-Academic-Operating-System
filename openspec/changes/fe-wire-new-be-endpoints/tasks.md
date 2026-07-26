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
- [x] 4.6 **XONG (2026-07-25, đính chính tick sai):** các hàm client tương ứng đã có đủ trong
      `src/modules/api/rest/resource/resource.ts` — `updateCollectionItemNote` (l.388),
      `getMyResourceRating` (l.463), `deleteMyResourceRating` (l.476), `likeResourceComment`
      (l.627), `unlikeResourceComment` (l.642) — kèm field `ResourceCommentView.{likeCount,
      likedByMe}` và `RatingResponse.updatedAt` trong `types.ts`. `tsc --noEmit` sạch ở cụm này.

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
- [x] 5.4 **XONG (2026-07-25, đính chính tick sai):** `PinnedBadge` ĐÃ được feed tiêu thụ —
      `CommunityFeed/index.tsx:221` render `post.pinned ? <PinnedBadge label={t("feed.pinned")}/>`,
      và `FEED_SELECTION` (`query-community-feed.ts:98`, dùng chung cho cả `communitySearch`) đã
      chọn `pinned` + `authorId`. Nhãn CHỈ là nhãn: BE đã đẩy bài ghim lên đầu trang đầu, FE tuyệt
      đối không sắp xếp lại theo cờ này. (`ModerationReport.reportId` đã có.) Còn dư: key
      `communityHub.feed.pinnedBadge` là alias không dùng (bản dùng thật là `feed.pinned`).

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
- [x] 7.4 **XONG (2026-07-25, đính chính tick sai):** `CommunityFeed` gom `authorIds` của mọi bài
      đang hiển thị (`useMemo` trên `posts`) rồi gọi `useQueryFollowedUserIdsSwr(authorIds)` MỘT lần
      (`index.tsx:363-364`), và đẩy `isFollowing` xuống cả `UserLink` avatar lẫn `UserLink` tên tác
      giả — hovercard không còn phải tự hỏi từng avatar. Có test cho cả hook (batch/dedupe/lô) lẫn
      `UserLink` nhận trạng thái từ ngoài (`UserLink/index.test.tsx` mới).

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
- [x] 8.5 **XONG (2026-07-25, đính chính tick sai):** `npx tsc --noEmit` chạy lại trên cây hiện tại
      → **0 lỗi**; 44 lỗi cũ (thiếu export REST + prop component ở cụm 4.6 / 5.4 / 6.5 / 7.3) đã
      được đóng hết. `vitest` cụm subject + identity + CommunityFeed: 13 file / 104 test pass.
- [x] 8.6 **Glue đợt thống kê & nghề (2026-07-25):** thêm 49 key × 2 locale (98 mục) —
      `subjects.statistics.{updatedAt,notComputed,topContributors,popularResources,leaderboard,xp,
      contributions,unknownMember,unknownResource,you,empty.*}` và `subjects.career.{subtitle,
      openCenter,empty,skills*,skillLevel,skillTarget,skillEligible,roadmap*,related,opportunit*,
      opportunityTypes.*,remote,deadline,careerPath*,viewSubject}`. JSON hợp lệ, parity vi/en = 0
      lệch (5512 key mỗi bên). Key ĐỘNG `career.opportunityTypes.${typeKey}` phủ đủ 4 nhánh
      (`INTERNSHIP`→internship · `JOB`→job · `PORTFOLIO_REVIEW`→portfolioReview · fallback `other`).
      Quét lại toàn repo (2506 file ts/tsx, 2731 tham chiếu `t("…")`): **0 key tĩnh thiếu** ở vi/en.

## 9. Deferred — vẫn chờ BE

- [x] 9.1 **ĐÃ GIẢI PHÓNG (2026-07-25):** thống kê môn và định hướng nghề theo môn KHÔNG còn là dữ
      liệu mẫu — `useQuerySubjectStatsSwr` đọc `getSubjectStatistics` (`GET /subjects/{code}/
      statistics`, join tên người/tài nguyên từ `getSubjectMembers` + `getResourceDetail`, không bịa
      tên: không khớp thì hiện `unknownMember` / `unknownResource`) và `useQuerySubjectCareerSwr`
      đọc module career thật (skills / roadmaps / opportunities / recommendations + workspace
      aggregate). Xem `workplace-community-full-wire` §16.5.
- [ ] 9.2 Độ khó / tỉ lệ chấp nhận / cờ "đã giải" của thử thách — không có trên payload danh sách.

## 10. Nghiệm thu E2E trên backend thật (2026-07-25, FE `99324b9` · BE `386084c`)

Chạy live với `https://apitest.ftes.vn` bằng token thật (student/lecturer/admin), spec ở `e2e/`:
`workplace-be-smoke.spec.ts` · `subject-practice-ui.spec.ts` · `resource-detail-engagement-ui.spec.ts`
· `subject-career-and-community-ui.spec.ts` · `community-feed-row-actions-ui.spec.ts` ·
`groups-inbox-and-media-ui.spec.ts`.

- [x] 10.1 **§1 quiz luyện tập — PASS.** BE: đề phát ra KHÔNG chứa `correctKeys`/`explanation`
      (assert trên JSON thô), nộp bài trả `correctKeys` + giải thích, `totalQuestions` khớp.
      UI: bốc đề → chọn → nộp → hiện %, "Đáp án đúng", "Giải thích"; DevTools xác nhận có
      `POST …/practice/quiz/submit`. Điều kiện: đã seed 3 câu `status=ready` cho PRF192 qua
      `POST /admin/quiz-questions` (type PHẢI viết HOA `SINGLE_CHOICE`) — trước đó cả 5 môn trên
      apitest đều `count:0`.
- [x] 10.2 **§2 flashcards SM-2 — PASS.** BE: `grade=4` → REVIEWING/interval 1; `grade=2` →
      LEARNING, ease 2.5→2.18, lapses 1; GET lại vẫn còn (`dueCount` 3→2). UI: chấm 1 thẻ trên
      tab Luyện tập rồi soi lại máy chủ thì số thẻ đã ôn TĂNG — tiến độ nằm ở BE, không phải
      state component. Điều kiện: giảng viên đã tạo deck "E2E deck PRF192" + 3 thẻ.
- [x] 10.3 **§3 phiên AI theo môn — PASS.** `GET /ai/sessions?feature=TUTOR_CHAT&subjectId=<UUID>`
      chỉ trả phiên của môn đó (mỗi phiên có `contextRef.subjectId`); `DELETE` cùng filter trả
      `{archived:1}`, gọi lại `{archived:0}`.
      *Quan sát:* danh sách VẪN trả phiên `status:ARCHIVED` sau khi archive — nếu UI không tự lọc
      thì hội thoại đã xoá sẽ hiện lại.
- [x] 10.4 **§4.1 like bình luận — PASS ở tầng ghi.** `PUT` → `{active:true,likeCount:1}`, bấm lại
      vẫn 1 (idempotent), `DELETE` → `{active:false,likeCount:0}` và lặp lại vẫn 200; id lạ → 404.
- [ ] 10.5 **§4.1 `likedByMe` — FAIL (đã có bản vá, chờ deploy).** `GET /resources/{id}/comments`
      trả `likedByMe:false` cho CHÍNH người vừa like (cả comment gốc lẫn reply) → trên UI tim
      sáng lúc bấm nhưng F5 là tắt. Gốc ở BE: `ResourceSecurityConfig` mở chain permitAll cho các
      GET public mà KHÔNG cắm `JwtAuthenticationFilter`, nên request có Bearer vẫn chạy ẩn danh.
      Vá ở BE `386084c` (+ ArchUnit `SecurityChainCarriesJwtFilterTest`); assert đã nằm sẵn trong
      `workplace-be-smoke.spec.ts` và `resource-detail-engagement-ui.spec.ts`, xanh khi apitest
      nhận bản mới.
- [x] 10.6 **§4.2–4.4 đánh giá của tôi — PASS.** Chưa đánh giá → 200 + `data:null` (không 404);
      `POST` → GET lại có dữ liệu, `avgRating/ratingCount` của resource được tính lại (0→4,
      xoá → về 0); `DELETE` idempotent. UI (`/resources/{id}/reviews`): gửi 4★ + nhận xét → F5
      prefill đúng, có "Cập nhật đánh giá" + "Xoá đánh giá".
- [x] 10.7 **§4.5 ghi chú bộ sưu tập — PASS.** `PATCH …/items/{resourceId}` đổi note, `sortOrder`
      giữ nguyên; `note:null` xoá ghi chú. Modal "Thêm vào bộ sưu tập" mở được từ trang chi tiết.
- [ ] 10.8 **Đọc bộ sưu tập của chính mình — FAIL (cùng gốc 10.5, đã vá chờ deploy).**
      `GET /resources/collections/me` và `GET /resources/collections/{id}` trả **403
      RESOURCE_ACCESS_DENIED cho chính chủ sở hữu** (bộ sưu tập PRIVATE) — nghĩa là màn "Bộ sưu
      tập của tôi" chết hoàn toàn. Cùng nguyên nhân thiếu `JwtAuthenticationFilter`.
- [x] 10.9 **§5.1 chuyển cấp báo cáo — chưa nghiệm thu, BLOCKED-CREDS-ADMIN-UI.** Hàng đợi kiểm
      duyệt cần vai admin trên UI; helper `e2e/helpers/auth.ts` mới có student/lecturer/ctv.
      (Token admin lấy được cho REST, nhưng `loginAs` chưa hỗ trợ vai này.)
- [x] 10.10 **§7 follow theo lô — PASS.** Không tham số → `[]`; theo dõi rồi thì trả đúng id; bỏ
      theo dõi → rỗng lại; > 100 id → 400 `COMMUNITY_FOLLOW_BATCH_TOO_LARGE`.
- [x] 10.11 **§8.5 verify — PASS.** `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` → 0 lỗi (sau
      khi đổi tên `practiceQuiz.ts` → `practiceQuizLogic.ts`, xem 10.12); `npx vitest run` →
      114 file / 727 test pass.
- [x] 10.12 **Sửa va chạm tên file chỉ khác hoa/thường.** `SubjectPractice/index.tsx` import
      `./PracticeQuiz` (component) trong khi cùng thư mục có `practiceQuiz.ts` (logic) → trên
      máy Windows/macOS (FS không phân biệt hoa thường) `tsc` báo TS1149 + TS2305 và **không
      typecheck được cả repo**; Linux (Vercel) thì không lộ. Đổi tên module logic thành
      `practiceQuizLogic.ts` (+ `.test.ts`) và cập nhật 4 chỗ import.

## 11. Nghiệm thu E2E vòng 2 (2026-07-26, FE `6b7f816` · BE `dc29c86`)

Chạy live apitest + dev server local. Spec mới: `resource-upload-and-access.spec.ts` ·
`resource-ai-qa-with-file.spec.ts` · `community-moderation-admin-ui.spec.ts` ·
`regression-post-and-tutor-ui.spec.ts` · `pinned-badge-and-group-events-ui.spec.ts`.

- [x] 11.1 **Upload Cloudinary — PASS (vòng 1 BLOCKED-MINIO).** `POST /resources/{id}/versions`
      (multipart, field `file`) → `uploadStatus: UPLOADED`, `currentVersionId` được set;
      `GET /download-url` trả URL `res.cloudinary.com` (không còn `minio:9000`) và tải thật được
      200 với `.md`.
- [ ] 11.2 **Tải PDF vẫn 401 — BLOCKED-INFRA (setting Cloudinary).** Cùng đường `raw/upload/...`:
      `.md` → 200, `.pdf` → **401** (Cloudinary trả gif lỗi). Đây là tuỳ chọn "Allow delivery of
      PDF and ZIP files" chưa bật trên tài khoản, KHÔNG phải lỗi code. Test khoá hiện trạng bằng
      `test.fail()` trong `resource-upload-and-access.spec.ts` — bật setting xong thì gỡ.
- [x] 11.3 **Panel ResourceAiQa — PASS (vòng 1 luôn ẩn).** Tài liệu đã có file → panel
      "Hỏi AI về tài liệu này" hiện; `?ask=1` cuộn tới panel và **focus** ô hỏi; gửi câu hỏi thì
      câu hỏi vào thread và panel phản hồi.
- [ ] 11.4 **Trả lời AI thực chất — BLOCKED-INFRA.** `POST /ai/document-qa` với `documentId` của
      tài liệu ĐÃ có file luôn trả `{processing:true}` (thử lại sau 15s/30s vẫn vậy, cả `.md` lẫn
      `.pdf`) → ai-service chưa index tài liệu vào Qdrant. UI xử lý đúng: banner "Đang xử lý tài
      liệu… Thử lại sau ít phút nhé." + nút "Thử lại".
- [x] 11.5 **Nhánh 403 `AI_DOCUMENT_ACCESS_DENIED` — PASS (vòng 1 không dựng được ca).** Tài liệu
      PRIVATE + đã APPROVED: người khác `GET /resources/{id}` → 403 và `POST /ai/document-qa` →
      403 `AI_DOCUMENT_ACCESS_DENIED`; chủ sở hữu vẫn 200.
      *Ghi chú contract:* đổi visibility PUBLIC→PRIVATE sau khi đã có file trả **409** kèm hướng
      dẫn tải lại file — nên ca này phải tạo resource PRIVATE ngay từ đầu.
- [x] 11.6 **Hàng đợi kiểm duyệt học liệu — PASS sau khi vá BE.** Admin thấy bản `PENDING_APPROVAL`
      trong `GET /resources/moderation/pending` và `POST /approve` → `APPROVED`.
- [x] 11.7 **Vai `admin` trong harness — XONG.** `e2e/helpers/auth.ts` thêm `admin` →
      `admin.test@ftes.vn`, mật khẩu đọc từ `FTES_ADMIN_PASSWORD` (xoay riêng, không dùng chung
      `FTES_TEST_PASSWORD`); thiếu biến thì ném lỗi nói rõ tên biến thay vì 401 mờ mịt.
- [x] 11.8 **Hàng đợi kiểm duyệt cộng đồng (mục 20 vòng 1) — PASS.** "Chuyển cấp" chỉ xuất hiện ở
      hàng có `reportId` (số nút ≤ số hàng); bấm xong hiện nhãn "Đã chuyển cấp" và **hàng vẫn ở
      lại** (số hàng không đổi).
- [x] 11.9 **Regression `contentFormat` — PASS.** Đăng bài từ composer cộng đồng (chọn loại +
      tiêu đề + nội dung) vẫn chạy, tải lại trang thấy bài trên bảng tin.
- [x] 11.10 **Regression archive hội thoại AI — PASS.** Xoá 1 cuộc trò chuyện của môn rồi tải lại
      thì `GET /ai/sessions?feature=TUTOR_CHAT&subjectId=…` không còn trả cuộc đó và số cuộc giảm
      đúng 1.
- [x] 11.11 **Badge "Đã ghim" — PASS (vòng 1 BLOCKED-DATA).** Ghim bài qua
      `POST /admin/community/posts/{id}/pin` → dòng bài trên bảng tin hiện nhãn "Đã ghim"; test tự
      bỏ ghim + xoá bài sau khi chạy.
- [x] 11.12 **Sự kiện nhóm + rời nhóm — PASS (vòng 1 chưa nghiệm thu).** Tạo → sửa → xoá sự kiện,
      tab Sự kiện phản ánh đúng sau mỗi bước; nhận lời mời vào nhóm rồi rời nhóm thì biến mất khỏi
      danh sách thành viên. *Contract:* `endsAt` phải SAU `startsAt`, bằng nhau cũng bị
      `GROUP_EVENT_INVALID_TIME`.
- [x] 11.13 **Spec UI vòng 1 chạy được với dev server — PASS.** `resource-detail-engagement-ui`
      3/3 (tim bình luận giữ trạng thái sau F5 — xác nhận bản vá `JwtAuthenticationFilter` đã
      live) và `subject-career-and-community-ui` 4/4, gồm ca "khách xem bảng tin phải mời đăng
      nhập" chạy LẦN ĐẦU và xanh.

## 12. Nghiệm thu E2E vòng 3 (2026-07-26) — hỏi đáp AI tài liệu, bấm tay trên UI

Thao tác thật trên UI (Playwright điều khiển chuột/bàn phím trên dev server local + apitest), spec
mới: `document-qa-manual-walkthrough.spec.ts` · `document-qa-upload-roundtrip.spec.ts`.

- [x] 12.1 **Panel đúng chỗ — PASS.** Thứ tự trong DOM: preview → "Hỏi AI về tài liệu này" → phần
      bình luận.
- [x] 12.2 **Trả lời ĐÚNG NỘI DUNG — PASS (vòng 2 là BLOCKED-INFRA).** "Thi cuối kỳ chiếm bao nhiêu
      phần trăm?" → **50%**; "Nộp bài muộn bị trừ thế nào?" → **10%/ngày, quá 3 ngày không nhận**.
      Assert bằng con số thật trong tài liệu, không nhận trả lời chung chung.
- [x] 12.3 **Trích dẫn — PASS.** Dưới câu trả lời có mục "Trích dẫn" kèm đoạn trích nguyên văn của
      đề cương.
- [x] 12.4 **Model picker — PASS (regression bug cũ).** Đổi sang Nemotron → payload gửi
      `"model":"nvidia/nemotron-nano-12b-v2-vl:free"` (id THẬT dạng `provider/model`, không phải
      `react-aria-N`) và caption dưới bubble đổi thành "Trả lời bởi nvidia/nemotron-…".
- [x] 12.5 **Khách chưa đăng nhập — PASS.** Panel vẫn hiện, bấm Gửi ra modal đăng nhập, không rơi
      vào nhánh lỗi đỏ.
- [x] 12.6 **Vào từ workspace môn — PASS.** Nút "Hỏi AI về tài liệu này" trên dòng tài liệu →
      `/resources/{id}?ask=1`, trang tự cuộn tới panel và focus ô nhập.
- [x] 12.7 **Trọn vòng upload → hỏi — PASS sau 3 bản vá FE (xem 12.9–12.11).** Upload `.md` qua
      wizard → mở tài liệu → hỏi câu chỉ trả lời được nếu đã đọc file → ra đúng số bịa riêng cho
      lượt chạy ("137 phút"). Ingest ~10-20s; lượt đầu ra banner "đang xử lý" + "Thử lại" là đúng
      thiết kế.
- [x] 12.8 **Tải xuống — PASS sau bản vá.** Bấm "Tải" trên tài liệu PDF nhận về file thật
      (`%PDF-`, đúng tên file).
- [x] 12.9 **BUG ĐÃ VÁ — nút Tải mở URL Cloudinary nên PDF luôn 401.** BE đã có
      `GET /resources/{id}/download` (stream bytes) và ghi rõ `/download-url` không dùng được cho
      PDF/slide/zip, nhưng 3 call site FE vẫn `window.open(download-url)`. Đo: `/download` → 200
      `application/pdf`; URL Cloudinary của đúng file đó → 401. Sửa: `downloadResourceFile()` tải
      blob qua BE-stream + đặt tên từ `Content-Disposition`; đổi cả 3 chỗ (ResourceDetail,
      ResourceHub, SubjectResources).
- [x] 12.10 **BUG ĐÃ VÁ — wizard upload đi luồng presign đã bị BE gỡ.** `POST
      /resources/{id}/versions/upload-url` nay trả **404 PLATFORM_NOT_FOUND**, nên mọi lượt upload
      trên UI tạo ra học liệu RỖNG (không version ⇒ không tải được, panel hỏi AI bị ẩn). Sửa:
      chuỗi rút từ 6 bước còn **create → upload (multipart) → submit**, thêm client
      `uploadResourceVersion()`; test `uploadFlow.test.ts` viết lại theo chain mới; i18n
      `upload.steps` còn 3 khoá (vi/en).
- [x] 12.11 **BUG ĐÃ VÁ — read-path resource không gửi token.** 5 hàm đọc (`getResourceDetail`,
      `listResources`, `getResourceVersions`, `getResourceDownloadUrl`, `getRelatedResources`) đặt
      `authenticated: false` ⇒ học liệu **MEMBERS** — đúng mặc định của wizard — trả 403, chính
      người vừa đăng cũng không mở được tài liệu của mình. Đo: cùng id, có token → 200, không token
      → 403. Sửa: bỏ `authenticated: false` (khách vẫn đọc PUBLIC nhờ chain public đã cắm
      `JwtAuthenticationFilter`).
- [x] 12.12 **Regression BE — PASS.** Đăng bài từ composer vẫn chạy (bản vá `contentFormat` không
      làm vỡ đường thường); xoá 1 hội thoại gia sư AI → tải lại KHÔNG hiện lại; admin duyệt được
      học liệu đang chờ.
- [ ] 12.13 **Còn lại — BLOCKED-INFRA.** URL Cloudinary của PDF vẫn 401 (chưa bật "Allow delivery
      of PDF and ZIP files"); không chặn người dùng nữa vì UI đã đi BE-stream, nhưng bất kỳ chỗ nào
      còn phát URL provider cho PDF sẽ hỏng. Test khoá hiện trạng bằng `test.fail()`.
