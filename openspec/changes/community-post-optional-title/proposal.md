# community-post-optional-title — Không có H1 thì KHÔNG bịa tiêu đề

## Why

Bài viết cộng đồng đang hiện **một dòng thành hai dòng**: gõ "Làm thế nào để ăn cơm" rồi đăng
thì feed in đúng câu đó hai lần, trang chi tiết cũng vậy. Đo trên apitest 2026-08-14: 4/61 bài
trong `community.posts` có `title` trùng khít `content`.

Gốc nằm ở nhánh dự phòng của `splitTitleFromMarkdown`. Composer bỏ ô Tiêu đề riêng, tiêu đề
được suy ra từ H1 dẫn đầu. Nhánh có H1 làm đúng: lấy chữ H1 làm `title` **và cắt dòng đó khỏi**
`body`. Nhánh không có H1 thì lấy dòng đầu làm `title` nhưng **giữ nguyên cả `body`** — hai
trường cùng mang một câu, rồi cả feed lẫn trang chi tiết đều render cả hai.

Chú thích trong mã gọi đây là "chấp nhận được cho một nhãn dự phòng". Đúng khi `title` chỉ là
nhãn nội bộ, nhưng nó được render thành dòng đậm ngay trên nội dung — người đọc thấy lặp, không
thấy nhãn. Với bài kiểu Threads (một, hai dòng, không heading) thì tiêu đề đơn giản là KHÔNG
tồn tại, và bịa ra một cái là sai.

## What Changes

- `splitTitleFromMarkdown` mặc định **không bịa tiêu đề**: không có H1 dẫn đầu ⇒ `title: ""`,
  `body` giữ nguyên toàn văn.
- Thêm tuỳ chọn `fallbackTitle` để bề mặt nào **bắt buộc** có tiêu đề thì opt-in. Chỉ **thông
  báo nhóm** cần: `AnnouncementRequest` phía BE gắn `@NotBlank title`, để rỗng là 400. Mọi bề
  mặt còn lại (bài cộng đồng, bài nhóm, bài môn học, sửa bài) đều gọi endpoint có `title` tuỳ
  chọn (`@Size(max=300)`, không `@NotBlank`) nên không cần.
- Feed và trang chi tiết chỉ render khối tiêu đề khi `title` khác rỗng. Không có tiêu đề thì
  bài đọc như một khối văn bản liền, đúng kiểu Threads.

## Impact

- Sửa: `RichTextEditor/title.ts`, `CommunityFeed`, `CommunityPostDetail/CommunityPostContent`,
  `GroupAnnouncement/AnnouncementForm` (opt-in `fallbackTitle`).
- KHÔNG đụng hợp đồng BE — `title: ""` vốn đã hợp lệ với `POST /community/posts`.
- 4 bài cũ đã lưu trùng `title`/`content` KHÔNG được sửa lùi: sửa dữ liệu người dùng đã đăng là
  việc riêng, và sau thay đổi này chỉ cần tác giả bấm Sửa rồi lưu là hết trùng.
- `joinTitleIntoMarkdown` không đổi: nó đã trả về đúng phần thân khi tiêu đề rỗng, nên vòng
  sửa-bài vẫn khép kín.
