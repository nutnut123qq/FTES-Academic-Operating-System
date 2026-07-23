# Tasks — course-reliability-pass

> **Chế độ gấp**: implement → test & fix tại chỗ; phần "đánh giá" (review sâu 2 vòng theo
> quality loop) GHI BACKLOG chạy sau, không chặn pass. Mục checklist FAIL do FE → fix
> ngay trong change này; FAIL do BE thiếu contract → ghi spec-backlog mới, KHÔNG mock.
> Change này chạy SAU khi 5 lane merge main.

## 0. Chuẩn bị

- [x] 0.1 `tsc --noEmit` sạch trên branch fix/improvement-pass (baseline); build chạy ở mục 3.1
- [ ] 0.2 CHỜ SMOKE SERVER: `npm run dev` trỏ `apitest.ftes.vn`; login STUDENT + student mới chưa enroll
- [x] 0.3 PASS (verify bằng code): `grep useLessonReactionMock src/` = NONE (reactions dùng
      `useGetLessonReactionsSwr`/`usePutLessonReactionSwr`/`useDeleteLessonReactionSwr`);
      `CourseQa/mock.ts` KHÔNG còn import (dùng `useQueryCourseQuestionsSwr`); `challengeHref`
      dựng route challenge THẬT (`/challenges/{challengeId}`), hết đuôi mock `-c`

## 1. Pass checklist `course-reliability-verify` (chạy theo thứ tự journey)

> Verify tĩnh BẰNG CODE (đọc code, không chạy server). Mỗi mục: xác nhận file + wiring
> hook/contract tồn tại và đúng đường (không mock). Kịch bản runtime (skeleton kẹt, số
> liệu thật, thanh toán sandbox, resume vị trí…) = CHỜ SMOKE SERVER — không mock để "xanh".

- [x] 1.1 CODE OK: `CourseCatalog/index.tsx` + `browse/{CategoryChipBar,CategoryShelf,FacetSortBar,CatalogCourseCard}` tồn tại; scenario grid/empty = chờ smoke
- [x] 1.2 CODE OK: `useQueryCourseDetailSwr.ts` map `isPurchased` từ contract THẬT (`matched?.isPurchased === true || access?.purchased === true`), KHÔNG hardcode false; rating `CourseRatings/`. Scenario edit/delete rating = chờ smoke
- [x] 1.3 CODE OK: `PackageGateModal/`, `CartShell/`, `PaymentModal/`, `submit-checkout.ts` + hooks resolve product/add-cart/checkout tồn tại. Trọn vòng tiền (sandbox) = chờ smoke
- [x] 1.4 CODE OK: `ContentMap/`, `LessonVideoBlock`+`LessonHlsPlayer`, `DocumentReader/` tồn tại; teaser cắt server-side (change này KHÔNG đụng). Leak-check response = chờ smoke
- [x] 1.5 CODE OK: `LessonCompletion` + `usePostMarkLessonCompleteSwr`; guard seed từ `isCompleted`. Idempotent reload/50%/document-exit = chờ smoke
- [x] 1.6 CODE OK: `useWatchPositionReporter` gắn trong CẢ HLS lẫn YouTube player. Cadence 30s + resume = chờ smoke; BE trả position → backlog nếu thiếu
- [x] 1.7 CODE OK: reactions REST thật (`useGetLessonReactionsSwr`/`usePutLessonReactionSwr`/`useDeleteLessonReactionSwr`), `useLessonReactionMock` GỠ. Persist qua reload = chờ smoke
- [x] 1.8 CODE OK: block quiz dùng `useGetLessonQuizzesSwr`/`usePostStart/SubmitQuizAttemptSwr`/`useGetMyQuizAttemptsSwr` (không mock). Làm+nộp+gate 403 = chờ smoke
- [x] 1.9 CODE OK: block assignment `usePostSubmitAssignmentSwr` + `getMyAssignmentSubmissions`. Nộp+lịch sử = chờ smoke
- [x] 1.10 CODE OK: `ChallengeSubmission/{index,SubmissionRow}`, `challengeHref` route THẬT (hết `-c`), types 3 loại MCQ/CODE/ESSAY. Nộp+chấm+gate entry = chờ smoke
- [x] 1.11 CODE OK: `CourseQa/{index,useQueryCourseQuestionsSwr}`, `mock.ts` KHÔNG import. Roll-up+đăng câu hỏi = chờ smoke
- [x] 1.12 CODE OK: `Leaderboard/{index,LeaderboardCategoryRail,Podium,Table}`. Đổi category runtime = chờ smoke
- [x] 1.13 CODE OK: `MindMap/index.tsx` + layout `isMindMap` full-bleed. Render+điều hướng node = chờ smoke
- [x] 1.14 CODE OK: `CourseCatalog/FeaturedSlider/` + `useQueryFeaturedCoursesSwr.ts`. Auto-slide+ẩn-khi-rỗng = chờ smoke
- [x] 1.15 CODE OK: `MyCoursesSection.tsx`, `AccountMenuAuthed/`, `MyCourses/` + `useQueryMyCoursesSwr`. Nhất quán 3 bề mặt = chờ smoke
- [x] 1.16 CODE OK: `search/{SearchOverlay,SearchResults,hooks/useGlobalSearch.ts}`. Debounce+điều hướng = chờ smoke
- [x] 1.17 Bảng: 16 mục CODE OK (không phát hiện regress/thiếu contract ở tầng code). Kịch bản runtime chờ smoke server; không mục nào FAIL-do-BE mới → không phát sinh spec-backlog

## 2. Pass capability `lesson-ai-fab`

- [x] 2.1 CODE OK: `ContentAiFab` render CHỈ phụ thuộc route param `contentId` (`if (!contentId) return null`) — độc lập LOẠI bài → hiện trên MỌI dạng lesson đi qua `contents/<id>` (VIDEO/DOCUMENT full+teaser/SLIDE/link-only/premium khóa); tự ẩn ở dashboard/leaderboard/mind-map (không có `contentId`). Mount vô điều kiện ở `learn/layout.tsx`. Không component nào che góc phải z≥40
- [x] 2.2 CODE OK: nhánh `isMobile` (`useSmViewpoint`) → `FloatingActionButton` + `Drawer` bottom-sheet `h-[80vh]`; desktop → `Popover` 380px `placement="left bottom"`; clamp `MIN_BOTTOM=16`/`TOP_GUARD=80`. Runtime keyboard-che/stream = chờ smoke
- [x] 2.3 CODE OK: `onPointerDown/Move/Up` threshold `DRAG_THRESHOLD=6`, persist `localStorage["contentAiFabBottom"]`, restore on mount; `onOpenChange` swallow toggle khi `draggingRef.current`. Runtime drag = chờ smoke
- [x] 2.4 CODE OK: layout mount FAB + `ContentAiSelectionAsk` + `ContentAiAnchoredChat` song song (FAB không bị ẩn khi panel mở); z đúng tầng FAB `z-40` < nút selection `zIndex:45` < panel neo `zIndex:50`; intent selection không reset-on-mount (đã xử theo draft rule). Verify runtime = chờ smoke
- [x] 2.5 Không phát hiện lệch code ở 2.1–2.4 → không cần fix. Unit test: thêm `usePreviewGate.test.ts` (5 case, vitest xanh) cho gate xem-thử (phần fix trọng tâm của pass này). RTL cho FAB drag = backlog (cần mock pointer-capture)

## 3. Chốt

- [x] 3.1 `npm run build` (webpack) xanh (Compiled successfully 39s) + `tsc --noEmit` sạch + eslint sạch + vitest usePreviewGate xanh
- [x] 3.2 `openspec validate course-reliability-pass --strict` PASS
- [x] 3.3 Backlog ghi ở cuối file (mục "đánh giá 2 vòng quality-loop" + smoke-server E2E). Không phát sinh FAIL-do-BE mới ở tầng code → chưa mở spec-backlog mới

## Backlog (đánh giá ghi lại, không chặn)
- [ ] B.1 SMOKE SERVER: chạy trọn 16 kịch bản runtime của `course-reliability-verify` trên
      `npm run dev` + apitest (STUDENT + student mới chưa enroll) — mục nào runtime-fail ghi
      spec-backlog kèm endpoint/payload kỳ vọng (không mock để "xanh")
- [ ] B.2 Quality-loop vòng 2 (unit+E2E → đánh giá → fix ×2) cho gate xem-thử + FAB sau khi
      BE `freemium-youtube-preview-gate` deploy lên apitest
- [x] B.3 RTL cho `ContentAiFab`: drag-persist + swallow drag-release (cần mock
      `setPointerCapture`/`localStorage`) + render-theo-route-param — ĐÃ TRẢ NỢ 2026-07-22:
      `src/components/features/learn/ContentAiFab/index.test.tsx` (9 case: không contentId
      → null; restore/ignore-corrupt localStorage; drag quá threshold → capture pointer +
      move + persist on release; clamp [16, innerHeight−80]; press micro-jitter → mở chat,
      KHÔNG persist; swallow toggle drag-release đúng 1 lần rồi press sau mở được; mobile
      bottom-sheet render chat) — vitest xanh

## Nghiệm thu E2E 2026-07-23 (spec e2e/course-reliability-pass.spec.ts — B.1: 12/16 kịch bản PASS, rerun cuối 2 test flaky đều PASS sau hydration gate)
- PASS: catalog; detail 2-viewer; mua tới QR (checkout 200 + VietQR render, không thanh toán thật); document reader; completion idempotent; quiz; assignment; Q&A đăng câu hỏi; leaderboard; mindmap; featured slider; my-courses; search (index không trả seed demo theo title — ghi nhận).
- FAIL-KNOWN (không phải bug mới, trỏ learn-exercises-wire/learn-engagement-wire): S04a video player + S10 challenge entry (VIDEO lesson content 404); S07 reactions footer không render; S06 watch-position BLOCKED-DATA.
- Đóng sổ chờ: fix 2 bug learn-* rồi rerun 4 kịch bản còn lại.

## Nghiệm thu E2E 2026-07-24 RẠNG SÁNG — 13/16 kịch bản PASS live, 3 residual có nhãn (GIỮ MỞ)
- ✅ PASS (spec course-reliability-pass.spec.ts, desktop+mobile): catalog, detail, S03 mua→QR VietQR
  (desktop), document reader, completion idempotent, S08 quiz trọn vòng, assignment (chịu race
  hết-lượt), Q&A, leaderboard, S13 mindmap, featured, my-courses, search, S10 (rail challenge nay
  HIỆN — content-404 gap đã hết).
- ⚠️ Residual có nhãn (không phải hồi quy mới):
  - S03 mobile: BLOCKED-DATA — for-course WED201c trả 0 product cho CTV (curl xác nhận), desktop
    cart 200; product-resolve khác giữa 2 layout CTA. Verify luồng mua ở desktop.
  - S06 watch-position: BLOCKED-DATA — không có khoá đã mua videoStatus=READY (storage/video stub).
  - S07 reaction footer: ĐÃ HẾT (fix DocumentReader mount footer) — nay PASS ở learn-engagement.
- 0.2/B.1/B.2: smoke đã chạy (harness Playwright commit); phần video/storage chờ hạ tầng thật.
