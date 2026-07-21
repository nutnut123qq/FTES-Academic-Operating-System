## Context

FE đọc cộng đồng bằng GraphQL (`feed`, `post(id)`, `subjectWorkspace.community`) nhưng **ghi bằng
REST** (`/community/posts`, `/community/posts/{id}/comments`) vì gateway GraphQL là read-only. Đường
ghi comment ở `/community` đã đúng (`useMutateCreatePostCommentSwr`); riêng tab Thảo luận môn học
(`SubjectCommunity`) còn `onSubmit` giả — chỉ patch cache rồi `return true`.

BE vừa mở `POST /api/v1/community/media` (multipart, part `file`, gate `community.post.create`) và
thêm `Post.media` vào GraphQL. Trần: 4 ảnh/post, 10MB/ảnh, mime png/jpeg/webp/gif. BE chỉ nhận
`storageKey` là URL do chính hệ phát hành, nên FE **bắt buộc** phải upload trước rồi dán `secureUrl`.

## Goals / Non-Goals

**Goals:**
- Đăng bài kèm ảnh ở cả `/community` và tab Thảo luận môn học.
- Ảnh hiển thị lại ở feed + trang chi tiết + tab Thảo luận.
- Bình luận ở tab Thảo luận lưu thật, hỏng thì rollback.

**Non-Goals:**
- Không làm ảnh trong bình luận (chỉ bài đăng).
- Không làm trình xem ảnh phóng to / carousel — v1 chỉ lưới thumbnail bấm mở tab mới.
- Không đụng group discussion (`/groups/[id]/discussion`) — hệ thread riêng, không có media.
- Không sửa/xoá ảnh của bài đã đăng.

## Decisions

### 1. Upload NGAY khi chọn ảnh, không dồn tới lúc submit
Người dùng thấy ảnh lên xong mới bấm đăng → lỗi upload lộ ra sớm, và lúc submit chỉ còn một request
tạo post (không có cảnh "đăng bài" treo lâu vì đang tải 4 ảnh).

*Đánh đổi:* ảnh đã upload mà người dùng bỏ ngang thì mồ côi trên Cloudinary. BE đã ghi nhận việc dọn
ảnh mồ côi là nợ kỹ thuật; FE không tự dọn (không có endpoint xoá cho người dùng thường).

*Thay thế đã cân nhắc:* upload lúc submit — gom được ảnh thật sự dùng, nhưng lỗi upload lộ ra muộn
và phải xử lý "post tạo rồi nhưng ảnh hỏng".

### 2. Một component chọn ảnh dùng chung cho cả hai composer
`PostImagePicker` (blocks) giữ trạng thái danh sách ảnh (đang tải / đã có URL / lỗi) và tự gọi
upload; composer chỉ nhận `media: MediaInput[]` và cờ `isUploading`. Tránh chép logic ở hai nơi.

### 3. Validate ở client TRƯỚC khi gọi mạng
Kích thước/định dạng kiểm ngay: người dùng biết lý do tức thì thay vì chờ 400 từ server. Server vẫn
là chốt chặn thật — client chỉ là lớp lịch sự.

### 4. Bình luận subject: tái dùng đúng đường của `/community`
Comment của tab Thảo luận là comment của **cùng một post cộng đồng** (post có `subjectId`), nên gọi
thẳng `addComment` REST. Chỉ khác cache: optimistic patch vào `subjectPostCommentsKey(...)` thay vì
`postDetailKey(...)`, kèm rollback bằng snapshot — cùng khuôn `useMutateCreatePostCommentSwr`.

*Vì sao không dùng lại nguyên `useMutateCreatePostCommentSwr`:* hook đó patch cache post-detail và
feed cộng đồng, không biết cache của subject. Viết hook anh em `useMutateCreateSubjectPostCommentSwr`
rõ ràng hơn là nhồi tham số cache vào hook cũ.

### 5. `subjectId` phải là UUID
Route segment là **mã môn**; `subjectWorkspace` query bằng UUID. Composer lấy `subject.uuid` từ
`useQuerySubjectSwr` (feed hiện tại đã làm đúng vậy) và **không** submit khi UUID chưa resolve xong.

### 6. Ảnh render thành lưới đơn giản
1 ảnh → một khối rộng; 2–4 ảnh → lưới 2 cột. `object-cover`, bo góc, `loading="lazy"`, `alt` lấy từ
i18n (ảnh đính kèm không có mô tả riêng). Bấm ảnh mở tab mới (không dựng lightbox ở v1).

## Risks / Trade-offs

- **[Ảnh mồ côi khi bỏ ngang composer]** → đã nêu ở Decision 1; nợ về phía BE.
- **[Không có tiến độ upload theo %]** → chỉ có trạng thái "đang tải" trên từng thumbnail; đủ cho
  ảnh ≤10MB, tránh phức tạp hoá.
- **[Feed subject đọc GraphQL, ghi REST]** → sau khi đăng phải `mutate` key feed subject; nếu quên,
  bài mới không hiện. Đã đưa vào tasks.
- **[BE chưa deploy kịp]** → upload trả 404/403; picker hiện lỗi và composer vẫn đăng được bài không
  ảnh. Không chặn luồng cũ.

## Open Questions

- Có cần lightbox/carousel khi bấm vào ảnh không? Tạm mở tab mới.
- Có cho ảnh trong bình luận không? Ngoài phạm vi đợt này.
