## Why

Đợt `workplace-community-full-wire` đóng lại với mục **16. Deferred — BE chưa có, KHÔNG mock**:
ngân hàng đề trắc nghiệm theo môn, bộ thẻ flashcards do giảng viên soạn, lưu tiến độ ôn thẻ, và
lọc hội thoại gia sư AI theo môn đều bị hoãn vì backend chưa có endpoint. Cùng lúc, một loạt
thao tác trong Resource Hub / Community / Groups vẫn thiếu mặt tiền vì cùng lý do: thích bình
luận tài nguyên, sửa/xoá đánh giá của chính mình, ghi chú cho tài nguyên trong bộ sưu tập, gỡ
ảnh nhóm đã lưu, hộp thư lời mời vào nhóm, và đọc trạng thái theo dõi theo LÔ thay vì mỗi
`UserLink` tự hỏi một request.

BE nay đã live các endpoint đó (`/subjects/{code}/practice/*`, `/resources/comments/{id}/like`,
`/resources/{id}/ratings/me`, `/resources/collections/{id}/items/{resourceId}`,
`/community/reports/{id}/escalate`, `/groups/{id}/media/{kind}`, `/invitations/me`, batch
follow-state), nên phần "chờ BE" chuyển thành phần "wire thật".

## What Changes

- **Luyện tập môn học chạy trên dữ liệu thật, bỏ handoff:** `PracticeQuiz` bốc đề từ ngân hàng
  đề của môn (`GET /subjects/{code}/practice/quiz?count=N`) và nộp bài lấy verdict + đáp án +
  giải thích từ BE (`POST …/quiz/submit`) — **luyện tập là phù du, không ghi học bạ**.
  `PracticeFlashcards` ôn trên bộ thẻ curated, mỗi lần chấm gọi
  `POST …/flashcards/{cardId}/review` và **tiến độ SM-2 sống trên máy chủ**, không còn chỉ trong
  phiên; người có quyền curate thêm panel quản lý bộ thẻ (tạo/sửa/xoá deck, thêm/xoá thẻ).
  `PracticeAiHandoff` bị xoá.
- **Gia sư AI lọc theo môn:** danh sách hội thoại gửi `subjectId` (UUID của môn, KHÔNG phải mã
  môn trên route) nên chỉ thấy hội thoại của môn đang xem; "xoá hội thoại" cũng chỉ đụng môn đó.
- **Resource Hub:** thích/bỏ thích bình luận (optimistic, tin `{active, likeCount}` server trả),
  đánh giá của chính mình đọc từ `GET /resources/{id}/ratings/me` để prefill + nút **Cập nhật** /
  **Xoá đánh giá** (có `ConfirmDialog`), ghi chú cho từng tài nguyên trong bộ sưu tập
  (`PATCH …/items/{resourceId}`, giữ nguyên `sortOrder`).
- **Community:** chuyển cấp báo cáo dùng `reportId` (không phải id dòng hàng đợi), 409 = đã
  chuyển cấp trước đó → **không rollback**, chỉ báo cho người kiểm duyệt.
- **Groups:** gỡ ảnh nhóm đã lưu (`DELETE /groups/{id}/media/{AVATAR|COVER}`) phân biệt rõ với
  bỏ ảnh vừa chọn chưa lưu; hộp thư lời mời (`GET /invitations/me`) hiển thị nhóm + người mời +
  hạn trả lời từ chính payload.
- **Identity:** `UserLink` đọc trạng thái theo dõi theo LÔ (một SWR key cho cả danh sách, id đã
  dedupe + sort) thay vì N request.
- Toàn bộ chuỗi mới đi qua `next-intl` (vi + en), lỗi map theo mã (401/403/404/409/429/5xx/
  timeout/mạng) sang key riêng thay vì một câu chung.

## Capabilities

### New Capabilities
- `fe-wire-new-be-endpoints`: các endpoint BE mới (subject practice, resource comment like /
  own-rating / collection item note, community escalate, group media clear + invitations inbox,
  batch follow-state) có mặt tiền FE thật.

### Modified Capabilities
- None — `workplace-community-full-wire` chỉ được **giải phóng mục deferred** (16.1–16.4 trỏ sang
  change này), hợp đồng của các capability `rest-fetch-*` không đổi.

## Impact

- Thêm/sửa ~40 file dưới `src/components/features/{subject,resource,community,group,identity}`,
  `src/components/blocks/feed/PinnedBadge`, `src/modules/api/rest/subject`.
- Bổ sung 96 key i18n vào `src/messages/vi.json` + `src/messages/en.json` (parity vi/en = 0 lệch)
  và **đổi nghĩa** `subjects.practice.modules.quiz.meta` từ "{count} bộ đề" sang "{count} câu hỏi"
  (thẻ module giờ đếm câu hỏi trong ngân hàng đề, không đếm bộ đề).
- Không đổi route, không đổi shape store, không thêm dependency, không sửa BE.
