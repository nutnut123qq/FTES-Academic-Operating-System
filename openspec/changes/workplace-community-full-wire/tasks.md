## 1. Resource Hub — danh sách, tải xuống, bookmark

- [x] 1.1 `ResourceHub` gọi `GET /api/v1/resources` thật qua `useQueryResourceHubSwr` (chip lọc theo `type`, phân trang, đếm lượt tải).
- [x] 1.2 Nút tải xuống xin presigned URL (`GET /resources/{id}/download-url`) rồi mở tab mới; map 403 / 404 / 429 sang `resourceHub.hub.download*`.
- [x] 1.3 Chuẩn hoá `ResourceType` BE ↔ slug FE (`other` là bucket FE-only, không gửi lên server) để `t("types.<slug>")` không bao giờ nổ.
- [x] 1.4 `SaveButton` cho entity RESOURCE đọc trạng thái thật từ `GET /resources/me/bookmarks` (`useResourceBookmarksSwr`, một SWR key dùng chung cho mọi nút trên trang) thay vì store localStorage.

## 2. Resource detail — like, related, rating hiển thị

- [x] 2.1 Nút thích gọi `PUT/DELETE /resources/{id}/favorite`, optimistic + rollback, tin `active` server trả về.
- [x] 2.2 Khối "Tài liệu liên quan" gọi `GET /resources/{id}/related` (empty/err state riêng).
- [x] 2.3 Hiển thị điểm trung bình + số lượt đánh giá (`detail.ratingCount` / `detail.noRating`).
- [x] 2.4 Bình luận tài nguyên dựng cây từ danh sách phẳng (`resourceCommentTree`) + tạo/xoá bình luận thật.

## 3. Resource — đánh giá (ratings)

- [x] 3.1 `ResourceRating` submit `POST /resources/{id}/ratings` qua `useMutateRateResourceSwr`, revalidate danh sách đánh giá + điểm trung bình.
- [x] 3.2 Phân trang danh sách đánh giá (`reviews.prev/next/pageOf`).
- [x] 3.3 Map lỗi riêng: 409 = đã đánh giá (giữ bản đang lưu), 403, 404, 429, lỗi chung.
- [x] 3.4 Guard đăng nhập bằng `auth.context.rate`.

## 4. Resource — bộ sưu tập (collections)

- [x] 4.1 Tạo bộ sưu tập (`CreateCollectionModal` → `POST /resources/collections`).
- [x] 4.2 Xem chi tiết bộ sưu tập (`CollectionDetailModal` → `GET /resources/collections/{id}`) + trạng thái rỗng/lỗi.
- [x] 4.3 Gỡ tài nguyên khỏi bộ sưu tập + revalidate.
- [x] 4.4 Guest thấy khối mời đăng nhập thay vì danh sách rỗng.
- [x] 4.5 "Thêm vào bộ sưu tập" từ trang chi tiết tài nguyên (`AddToCollectionModal` → `POST /resources/collections/{id}/items`): chọn từ bộ sưu tập sẵn có hoặc tạo mới rồi thêm luôn (`createAndAdd`), 409 = đã có trong bộ sưu tập, guard đăng nhập.
- [x] 4.6 Sửa / xoá bộ sưu tập ngay trên từng dòng: `CollectionFormModal` dùng chung cho tạo lẫn sửa (`PATCH /resources/collections/{id}`), xoá qua `ConfirmDialog` (`DELETE /resources/collections/{id}`); cả hai optimistic + rollback theo cache mới.
- [x] 4.7 Sắp xếp lại tài nguyên trong bộ sưu tập bằng nút lên/xuống (`PATCH /resources/collections/{id}/items/reorder`, gửi TRỌN danh sách đã sắp) — optimistic, lỗi thì re-fetch.

## 5. Resource — gợi ý cá nhân hoá

- [x] 5.1 `ResourceRecommendation` gọi endpoint gợi ý thật; guest thấy khối mời đăng nhập.
- [x] 5.2 Dịch "lý do gợi ý" theo `reason` BE trả (`SAME_SUBJECT`, `TRENDING`, `SIMILAR_USERS`, `POPULAR`) + biến thể có tham số (`{subject}`, `{count}`), fallback `reasons.default`.

## 6. Resource — luồng đăng tài liệu 6 bước

- [x] 6.1 `ResourceDropzone`: kéo-thả + chọn tệp, validate theo loại tài nguyên (đuôi, dung lượng, tệp rỗng, độ dài tên) trong `uploadRules.ts`.
- [x] 6.2 `uploadFlow.ts`: hash → `POST /resources` → `POST /resources/{id}/versions/upload-url` → `PUT` lên storage → `POST /versions/{id}/complete` → `POST /resources/{id}/submit`.
- [x] 6.3 `ResourceUploadProgress`: hiện bước đang chạy, bước lỗi (`errorAtStep`) và cho **thử lại từ đúng bước lỗi** (không làm lại từ đầu).
- [x] 6.4 Map lỗi từng bước: 401/403/404/413/409/422/429/5xx/mạng → `resourceHub.upload.error.*`.
- [x] 6.5 Màn thành công: nêu rõ trạng thái CHỜ DUYỆT + link xem tài liệu + đăng tiếp.
- [x] 6.6 Guard đăng nhập bằng `auth.context.uploadResource`.

## 7. Document-QA AI trên tài liệu (mới)

- [x] 7.1 `ResourceAiQa`: thread hỏi/đáp gọi `POST /api/v1/ai/document-qa` với `resourceId` + câu hỏi.
- [x] 7.2 3 câu hỏi gợi ý khi thread rỗng (`aiQa.suggestions.*`).
- [x] 7.3 Chọn model từ catalog AI (`GET /ai/models`), gắn nhãn Miễn phí / Không khả dụng, caption "Trả lời bởi {model}".
- [x] 7.4 Hiện citations của câu trả lời (bỏ mục không có trích dẫn).
- [x] 7.5 Phân biệt 5 trạng thái turn: `pending` / `answer` / `processing` (BE đang index, đã hoàn quota → nút "Thử lại" gửi lại đúng câu hỏi) / `notice` (quota, model không được phép, không có quyền) / `error`.
- [x] 7.6 Guard đăng nhập bằng `auth.context.aiQa`; test đơn vị cho map trạng thái/lỗi.

## 8. Subject workspace — thành viên & quyền

- [x] 8.1 Nút Tham gia / Rời môn gọi mutation thật (`useMutateSubjectMembershipSwr`) + xác nhận trước khi rời.
- [x] 8.2 `useQuerySubjectCallerMembershipSwr` quyết định hiển thị nút và mở khoá tab dành cho thành viên.
- [x] 8.3 `MemberActionsMenu`: đổi vai trò (STUDENT / CONTRIBUTOR / MODERATOR / LECTURER) + cấm thành viên, có hộp xác nhận.
- [x] 8.4 Map lỗi 403 / 404 / 429 cho mọi thao tác thành viên.

## 9. Subject workspace — tài nguyên & tổng quan

- [x] 9.1 Tab Tài nguyên của môn tải danh sách thật, lọc theo loại, hiện lượt tải + điểm đánh giá.
- [x] 9.2 Nút tải xuống dùng chung luồng presigned URL (map 403 / 404 / 429).
- [x] 9.3 Nút "Hỏi AI về tài liệu này" mở đúng panel Document-QA.
- [x] 9.4 Tổng quan môn: link khoá học có `aria-label` theo tên khoá.

## 10. Subject workspace — công cụ AI

- [x] 10.1 Gia sư AI: gửi câu hỏi thật, chọn model, danh sách hội thoại (`useSubjectTutorSwr` phân trang vô hạn), xoá hội thoại.
- [x] 10.2 `useSubjectAiJob`: polling job AI (đang chạy / lâu bất thường / kiểm tra lại) dùng chung cho tóm tắt, quiz, flashcards.
- [x] 10.3 Tóm tắt / Quiz / Flashcards chạy trên tài liệu thật của môn (`useQuerySubjectAiResourceSourcesSwr`).
- [x] 10.4 `SubjectAiOcr`: chọn ảnh/PDF (≤10MB), trích xuất văn bản, sao chép kết quả, trạng thái rỗng.
- [x] 10.5 Map lỗi AI dùng chung: quota, hết phiên, không có quyền, không tìm thấy, tài liệu chưa dùng được, job hỏng.

## 11. Subject workspace — luyện tập

- [x] 11.1 Danh sách thử thách code thật (lọc theo loại + vòng đời running/upcoming/closed); ghi chú khi môn chưa có thử thách riêng.
- [x] 11.2 Chi tiết thử thách: chạy thử với test case tự nhập, nộp bài, xem kết quả chấm AI + kết quả chấm hệ thống.
- [x] 11.3 Map lỗi chấm code: hết lượt nộp, ngoài thời gian mở, cần ghi danh khoá, dịch vụ tạm ngưng, timeout, mạng.
- [x] 11.4 `PracticeAiHandoff`: quiz/flashcards của môn chuyển hướng sang công cụ AI tương ứng (xem mục 15.1).

## 12. Community — tương tác & kiểm duyệt

- [x] 12.1 `PostActionsMenu`: sửa / xoá / báo cáo bài viết với hộp xác nhận (`ConfirmDialog`).
- [x] 12.2 `PostEditDialog`: sửa tiêu đề + nội dung Markdown, revalidate feed và trang chi tiết.
- [x] 12.3 `ReportDialog`: 5 lý do (`SPAM`, `HARASSMENT`, `NSFW`, `MISINFORMATION`, `OTHER`) + mô tả thêm; 409 = đã có báo cáo đang chờ.
- [x] 12.4 Bình luận: sửa / xoá tại chỗ + chấp nhận câu trả lời (Q&A), gợi ý @mention gọi search thật.
- [x] 12.5 `CommunityModeration`: nút chuyển cấp báo cáo + link mở nội dung bị báo cáo.
- [x] 12.6 Gom map lỗi community vào `community-error-message.ts` (403 / 404 / 429 / chung).
- [x] 12.7 Menu ⋯ trên TỪNG dòng feed (không chỉ trang chi tiết): tác giả thấy Sửa / Xoá, người khác thấy Báo cáo — dùng lại `PostEditDialog` / `ConfirmDialog` / `ReportDialog`; xoá là optimistic ở mức dòng, sửa nạp nội dung gốc qua `useQueryPostMetaSwr` (dòng feed chỉ có `snippet` cắt ngắn) và đóng kèm `engagement.editLoadFailed` nếu nạp hỏng.
- [x] 12.8 Báo cáo BÌNH LUẬN trong `PostCommentThread` (`targetType: "COMMENT"`): hiện với người đã đăng nhập và không phải tác giả bình luận, gate qua `useRequireAuth`, có `onReportComment` để surface khác/test tự cắm.

## 13. Groups Hub

- [x] 13.1 Tham gia / rời nhóm (có xác nhận) + trạng thái nút theo vai trò người xem.
- [x] 13.2 `GroupFeedComposer`: đăng bài vào nhóm (403 = chưa phải thành viên, 429 = đăng quá nhanh).
- [x] 13.3 `GroupResources`: gắn / gỡ tài liệu vào nhóm (nhận cả link `/resources/…` lẫn ID) + hydrate tiêu đề tài liệu.
- [x] 13.4 `GroupAnnouncement`: tạo / sửa / xoá / ghim thông báo.
- [x] 13.5 `GroupEvents`: tạo / sửa / xoá sự kiện (thời gian bắt đầu–kết thúc, địa điểm).
- [x] 13.6 `GroupMembers`: mời (tìm người dùng hoặc dán ID), đổi vai trò, xoá khỏi nhóm — có gate quyền theo vai trò người xem.
- [x] 13.7 `GroupInvitationResponder`: chấp nhận / từ chối lời mời.
- [x] 13.8 `GroupManagement`: lưu thông tin nhóm, đổi join policy / visibility; `GroupDangerZone`: chuyển quyền sở hữu + lưu trữ nhóm (gõ đúng tên để xác nhận).
- [x] 13.9 Yêu cầu tham gia hiện DANH TÍNH thật (`UserLink`: avatar + tên hiển thị + hovercard) thay vì in raw user id — `toJoinRequest` đọc thủ thế profile card BE mới gắn (`displayName` / `username` / `avatarUrl`), fallback chuỗi `displayName ?? username ?? userId`, không có username thì render text phẳng; kèm lời nhắn của người xin vào.

## 14. Identity, profile & phụ trợ

- [x] 14.1 Hovercard người dùng: theo dõi / bỏ theo dõi thật, phân biệt hồ sơ riêng tư / không tồn tại / bị giới hạn tần suất; guard `auth.context.follow`.
- [x] 14.2 Tóm tắt cộng đồng trên hồ sơ đọc dữ liệu thật (bài viết gần đây, nhãn "chưa có tiêu đề").
- [x] 14.3 `skillGraphModel`: dựng đồ thị kỹ năng từ `GET /career/skills` + `/career/me/skills` (gấp `category` BE thành 6 domain UI, đọc quan hệ theo cả snake_case lẫn camelCase).

## 15. i18n & glue

- [x] 15.1 Thêm 454 key vào `src/messages/vi.json` + `src/messages/en.json` (resourceHub, subjects, communityHub, groupsHub, hovercard, auth.context, profile) — JSON hợp lệ, parity vi/en = 0 lệch.
- [x] 15.2 Rà key động (`t(\`types.${x}\`)`, `apiErrors.*`, `upload.*`, `reasons.*`, `roles.*`) đủ mọi nhánh enum; bổ sung `communityHub.engagement.replyPlaceholder` bị thiếu.
- [x] 15.3 Không cần barrel trung tâm: các feature ở đây không có file barrel (`index.ts` gom) — component import trực tiếp theo đường dẫn.
- [x] 15.4 `tsc --noEmit` sạch sau khi vá 8 lỗi kiểu còn sót của đợt implement (`toast.error` → `toast.danger`, `Typography color="current"`, key tuple của `useSWRInfinite`, 4 lỗi trong file test).
- [x] 15.5 Thêm 21 key của đợt đóng này vào `vi.json` + `en.json` (`communityHub.engagement.editLoadFailed`, `resourceHub.detail.addToCollection`, `resourceHub.collections.{add*,createAndAdd,edit*,submitSave,saving,delete*,move*,reorderError}`) — JSON hợp lệ, parity vi/en = 0 lệch, thứ tự key trong 3 namespace khớp nhau.
- [x] 15.6 Dọn file mồ côi sau khi wire xong: xoá `useQueryGroupAnnouncementsSwr.ts` (không nơi nào import), `CreateCollectionModal.tsx` (đã bị `CollectionFormModal` gộp tạo + sửa) và `useMockAiStream.ts` (mock còn sót của công cụ AI môn học) — grep toàn `src/` + `e2e/` xác nhận 0 tham chiếu.

## 16. Deferred — BE chưa có, KHÔNG mock

- [ ] 16.1 Ngân hàng đề trắc nghiệm theo môn — BE không có endpoint quiz bank; tạm chuyển hướng sang AI Quiz (`practice.quizHandoff.*`).
- [ ] 16.2 Bộ thẻ flashcards do giảng viên soạn theo môn — chưa có endpoint; chuyển hướng sang AI Flashcards (`practice.flashcardsHandoff.*`).
- [ ] 16.3 Lưu tiến độ ôn flashcards — BE chưa có endpoint review, kết quả chỉ sống trong phiên (`flashcards.localOnlyHint`).
- [ ] 16.4 Lọc/xoá hội thoại gia sư AI theo môn — `SessionView` không trả `contextRef` và không nhận query `subjectId`; danh sách hiện là toàn bộ hội thoại TUTOR_CHAT của người dùng (`tutor.allSubjectsHint`, `tutor.clearHintAll`).
- [ ] 16.5 Thống kê môn (`SubjectStatistics`) và định hướng nghề theo môn (`SubjectCareer`) vẫn là dữ liệu mẫu — chưa có endpoint tương ứng.
- [ ] 16.6 Độ khó / tỉ lệ chấp nhận / cờ "đã giải" của thử thách — không có trên payload danh sách của BE nên đã gỡ khỏi UI thay vì bịa.
