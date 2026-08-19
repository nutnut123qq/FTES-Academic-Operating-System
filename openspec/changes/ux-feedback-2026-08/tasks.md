# Tasks — ux-feedback-2026-08

Đánh số theo đúng số mục trong `test01.docx` để đối chiếu ngược được.

## 1. Onboarding / vỏ ứng dụng
- [x] 1.1 (#1) `MascotCoachMark`: `whitespace-nowrap shrink-0` cho bộ đếm `{current} / {total}` — chuỗi có dấu cách nên wrap thành cột trong bubble hẹp
- [x] 1.2 (#4) `InnerLayout`: `defaultTheme` `dark` → `system`; `ModeSection` mặc định hiển thị `system`
- [x] 1.3 (#4) Block mới `Navbar/ThemeToggle` (đọc `resolvedTheme`, chỉ render sau mount để không nháy sai icon); gắn vào navbar desktop + drawer mobile; i18n `nav.toggleTheme`
- [x] 1.4 (#5) `MascotAssistant`: gỡ `onPointerEnter`/`onPointerLeave` + `HOVER_CLOSE_DELAY_MS` + timer đóng; chỉ còn click/Enter mở

## 2. Thanh toán
- [x] 2.1 (#2) `PaymentModal/CoinApplyField`: `Slider` → `TextField`+`Input type="number"` (min 0, max = trần BE), tách "Dùng tối đa" / "Bỏ dùng Xu" thành hai nút rõ nghĩa
- [x] 2.2 (#3) Bỏ `SegmentedControl` Tóm tắt/Thanh toán; thêm link "Quay lại tóm tắt" (ẩn khi `isSummaryLocked`); i18n `payment.checkout.backToSummary`, gỡ `summaryTab`/`paymentTab`

## 3. AI
- [x] 3.1 (#6) Gỡ `AiModelPicker` khỏi `PlannerForm`, `GradeCodePanel`, `ChallengeMethodSolver` + `ChallengeSubmission`; mọi submit bỏ trống `model` → BE dùng mặc định
- [x] 3.2 (#6) Xoá component `reuseable/AiModelPicker` (không còn nơi dùng); sửa docblock `CampusPicker` tham chiếu tới nó
- [x] 3.3 (#6) Sửa copy `codeGrading.modelHint*` — câu cũ hứa "model BẠN CHỌN" trong khi không còn gì để chọn
- [x] 3.4 (#7) `PlanTimeline`: `resource_hint` chứa URL → render link (`noopener noreferrer`), chỉ nhận `http(s)`; kèm test helper thuần
- [ ] 3.5 (#7) NGOÀI TẦM: prompt sinh lộ trình ở `ftes-ai-service` (không có trong workspace)

## 4. Xem đề / workspace môn
- [x] 4.1 (#11) `ExamImageViewer`: trang TEXT phóng theo `font-size` (`em`) thay vì `scale()` chỉ có trên `<img>`; + test hồi quy
- [x] 4.2 (#10) `SubjectWorkspaceRail`: đọc `useSidebarCollapsed`, thu nhỏ thì đổi sang cột icon thay vì để chữ vỡ dọc
- [x] 4.3 (#22) Rail challenge: chip chữ lifecycle → chấm màu + `title`/`sr-only` giữ nguyên nghĩa cho screen reader
- [x] 4.4 (#9) Dọn overlay đè mặt giấy + nội dung nở ra khi rail thu nhỏ

## 5. Cộng đồng / nhóm / blog
- [x] 5.1 (#12) `ReportDialog` → block `SelectableCardGroup`; test mock đổi sang mock block (mock cũ tự vẽ radio nên che mất chính con bug)
- [x] 5.2 (#14) `GroupDetailShell`: thêm `BackLink fallbackHref="/groups"`
- [x] 5.3 (#15) `titleEchoesBody` + ẩn tiêu đề khi nó chỉ là dòng đầu của thân bài; 6 test
- [x] 5.4 (#16) Trang chi tiết bài viết: truyền `onRepost` (cùng `openQuote` với feed)
- [x] 5.5 (#17) Đăng xong về `/community` + cuộn lên đầu; giữ nhánh nhảy vào chi tiết cho bài KHẢO SÁT
- [x] 5.6 (#20) Bình luận blog: `CommentSort` (mới nhất / cũ nhất / nhiều tym nhất), `repliesByParent`, nút "Trả lời" một cấp, i18n vi+en
- [x] 5.7 (#21) Tách rail cộng đồng thành shell dùng chung, áp cho `/groups`, `/events`, `/blog`
- [x] 5.8 (#19) Cuộn thẳng xuống bình luận: tiptap coi `autofocus: undefined` KHÁC `false` (guard `!== false && !== null`) nên tự `focus()` + `scrollIntoView()`; vá `CommentComposer` bằng `autoFocus ?? false`
- [ ] 5.9 (#19) GỐC RỄ còn nguyên: `RichTextEditor:104`, `RichCommentEditor:134`, `Discussion/CommentComposer:84` cùng dính bẫy đó cho MỌI bề mặt khác — chưa vá đợt này

## 6. Sự kiện
- [x] 6.1 (#18) `withMyRegistrationStatus` ghép trạng thái từ `GET /event/registrations/me`; BE vẫn được ưu tiên nếu trả thật; 4 test
- [x] 6.2 (#18) `useMutateEventRegistrationSwr` revalidate thêm key `MY_EVENT_REGISTRATIONS_SWR` — không có bước này thì đăng ký xong nút vẫn đứng nguyên
- [ ] 6.3 (#18) BE `EventController.list()` nên tự phân giải `myRegistrationStatus` (repo `FTES-AOS-Backend`, chưa làm đợt này)

## 7. Trang chủ
- [x] 7.1 (#23) `HomeLanding`: đã đăng nhập → `router.replace("/dashboard")`; chốt ở trang vì cờ `session_hint` của edge không bao giờ được set
- [x] 7.2 (#23) Sửa docblock sai sự thật ở `proxy.ts` + `resources/path/index.ts` (cả hai đang mô tả một luật edge chưa từng tồn tại)

## 8. Backend (repo khác)
- [x] 8.1 (#13) `FTES-AOS-Community`: `storageKey` khi verify phải là định danh THẬT do dịch vụ upload cấp, không phải UUID tự sinh lúc presign
- [x] 8.2 (#13) FE theo contract mới: `uploadGroupMediaFile` trả định danh ảnh (trước đây VỨT phản hồi đi), `GroupMediaVerifyRequest.uploadedRef`, nối ở `useMutateGroupMediaSwr` + `GroupCreate`; helper `readUploadedRef` + 7 test
- [ ] 8.3 (#13) CHƯA XÁC MINH ĐƯỢC: tên trường định danh trong phản hồi `POST /api/images` của upload.ftes.vn (service không có trên máy). FE đang dò theo danh sách tên ứng viên và ném lỗi rõ nếu không khớp — cần người có tay trên service đó chốt lại

## 9. Verify
- [x] 9.1 `npx tsc --noEmit` sạch
- [x] 9.2 `npx eslint` sạch trên MỌI file đợt này đụng tới (`npx eslint src` toàn repo vẫn đỏ 484 lỗi indent/quotes có sẵn từ trước, nằm ở file không ai chạm — đã đối chiếu từng đường dẫn)
- [x] 9.3 `npx vitest run` xanh: 224 file / 1688 test
- [ ] 9.4 `npm run build` — chưa chạy (6 phút trên máy này); người dùng chạy trước khi deploy
