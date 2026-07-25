## Why

Sau các đợt `rest-fetch-*`, FE đã có client REST/SWR cho resource, subject, group, community,
career — nhưng phần lớn **UI vẫn là vỏ**: nút bấm không gọi API, form không submit, panel chỉ
render dữ liệu tĩnh. Kết quả rà soát trước đợt này đếm được **~70 element chưa wire** trải trên
Resource Hub, Subject Workspace, Community và Groups Hub (ví dụ: nút tải xuống không xin
presigned URL, "Đánh giá" không gọi `POST /resources/{id}/ratings`, sửa/xoá/báo cáo bài viết
chỉ là menu, mời/đuổi thành viên nhóm không có mutation, upload tài liệu không chạy đủ 6 bước
hash → create → upload-url → PUT → complete → submit).

Song song, BE đã live `POST /api/v1/ai/document-qa` (hỏi AI trên một tài liệu, kèm citations
và fallback model) nhưng FE chưa có mặt tiền nào cho nó — Resource Hub thiếu hẳn panel
Document-QA.

## What Changes

- Nối 70 element còn treo vào REST/SWR đã có, theo 5 cụm: **Resource Hub**, **Subject
  Workspace**, **Community engagement/moderation**, **Groups Hub**, **Identity/Profile phụ trợ**.
- Thêm panel **Document-QA AI** (`ResourceAiQa`) trên trang chi tiết tài nguyên: thread hỏi/đáp,
  gợi ý câu hỏi, chọn model từ catalog AI, citations, phân biệt `processing` (BE đang index tài
  liệu, đã hoàn quota → cho "Thử lại" miễn phí) với `quota / model / access / lỗi chung`.
- Mọi thao tác ghi đều có: guard đăng nhập (`useRequireAuth` + `auth.context.*`), optimistic
  update hoặc revalidate SWR, và **map lỗi theo mã** (401/403/404/409/413/429/5xx) sang thông
  điệp i18n riêng thay vì một câu "có lỗi xảy ra".
- Toàn bộ chuỗi mới đi qua `next-intl` (vi + en), không hardcode text.
- Không thêm dependency; không sửa BE. Chỗ nào BE chưa có endpoint thì **không mock thêm** —
  ghi rõ ở phần deferred và, nơi hợp lý, chuyển hướng người dùng sang công cụ AI đang có.

## Capabilities

### New Capabilities
- `workplace-community-full-wire`: các element của Resource / Subject / Community / Group gọi
  API thật, cộng panel Document-QA cho tài nguyên.

### Modified Capabilities
- None (các capability `rest-fetch-*` chỉ được tiêu thụ, không đổi hợp đồng).

## Impact

- Sửa ~70 file component/hook hiện có + thêm ~60 file mới (dialog, form, hook mutation, logic
  thuần + test) dưới `src/components/features/{resource,subject,group,community,identity,profile}`
  và `src/components/reuseable/{PostEngagementBar,PostCommentThread,RichCommentEditor}`.
- Bổ sung 454 key i18n vào `src/messages/vi.json` + `src/messages/en.json` (parity vi/en = 0 lệch).
- Không đổi route, không đổi shape store; rủi ro tập trung ở các màn hình đã liệt kê.
