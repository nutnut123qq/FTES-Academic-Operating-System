## Bảng so sánh

### Task 1: Cây bình luận (Comment Thread Trees)
| Hành vi | Bản A (Challenge) | Bản B (FE Image) | Bản C (Resource) |
|---|---|---|---|
| Xử lý bình luận mồ côi (cha bị xoá) | Xoá mềm (tombstone), giữ lại mảng `replies`, gán `authorId: null`, `author: null`, `status: CHALLENGE_COMMENT_DELETED` (`challengeCommentTree.ts:145-149`) | Xoá mềm (tombstone), giữ lại mảng `replies`, gán `userId: null`, `status: FE_IMAGE_COMMENT_DELETED` (`feImageCommentTree.ts:294-297`) | Xoá mềm (tombstone), giữ lại mảng `replies`, gán `userId: null`, `status: RESOURCE_COMMENT_DELETED` (`resourceCommentTree.ts:483-486`) |
| Author fallback khi mồ côi | `authorUsername: ""` để ngăn menu xuất hiện (`ChallengePaperCommentThread.tsx:690`) | `authorUsername: ""` để ngăn menu xuất hiện (`FeImageCommentThread.tsx:914`) | KHÔNG CÓ (UI map không có trong scope) |
| Thứ tự sắp xếp gốc (Roots) | Đầu danh sách / newest-first (`challengeCommentTree.ts:87`) | Đầu danh sách / newest-first (`feImageCommentTree.ts:234`) | Đầu danh sách / newest-first (`resourceCommentTree.ts:384`) |
| Thứ tự sắp xếp con (Replies) | Cuối danh sách / oldest-first (`challengeCommentTree.ts:101`) | Cuối danh sách / oldest-first (`feImageCommentTree.ts:248`) | Cuối danh sách / oldest-first (`resourceCommentTree.ts:400`) |
| Đếm số trả lời (Total count) | Chỉ đếm Roots (`challengeCommentTree.ts:87, 104`) | Chỉ đếm Roots (`feImageCommentTree.ts:234, 251`) | Chỉ đếm Roots (`resourceCommentTree.ts:385, 403`) |
| Con trỏ phân trang | State `page` cục bộ tính từ 1 (`ChallengePaperCommentThread.tsx:107`) | State `page` cục bộ tính từ 1 (`FeImageCommentThread.tsx:64`) | KHÔNG CÓ (UI map không có trong scope) |
| Trạng thái sau khi xoá/sửa | UI optimistically patch, text placeholder do BE thay sau refetch (`challengeCommentTree.ts:133`) | UI optimistically patch, text placeholder do BE thay sau refetch (`feImageCommentTree.ts:282`) | UI optimistically patch, không đề cập việc giữ body (`resourceCommentTree.ts:472`) |
| Phản ứng (Likes/Reactions) | KHÔNG CÓ (BE không hỗ trợ) (`ChallengePaperCommentThread.tsx:77-79`) | KHÔNG CÓ | CÓ (Hỗ trợ like, cập nhật số lượng) (`resourceCommentTree.ts:200`) |

### Task 2: Làm mới sau khi mua qua modal gói (Package Refreshing)
| Hành vi | `CourseDetail` | `ChallengeSubmission` | `ContentMap` / `DocumentReader` | `LessonReader` | `MindMap` |
|---|---|---|---|---|---|
| Làm mới CÁI GÌ | Thông tin khóa học (`course`) + Cập nhật giỏ hàng (`GET_CART_SWR`) (`CourseDetail/index.tsx`) | Bài tập hiện tại (`challenge`) (`ChallengeSubmission/index.tsx`) | Toàn bộ cây dữ liệu học: `Learn Course`, `Learn Lesson`, `Course Progress` (`DocumentReader/index.tsx`) | Bài học hiện tại (`lesson`) (`LessonReader/index.tsx`) | Cấu trúc map khóa học (`modules`) (`MindMap/index.tsx`) |
| Cách gọi refresh | Gọi `mutate()` cục bộ và context global | Gọi `mutate()` cục bộ | Gọi `revalidateLearnData()` (sử dụng SWR `globalMutate`) | Gọi `mutate()` cục bộ | Gọi `mutate()` cục bộ |
| Phản ánh quyền vừa mua | CÓ. Nút "Học thử" chuyển thành "Vào học". | CÓ. Cho phép nhập Form Submit code trực tiếp. | CÓ. Sidebar/Rail bên trái thay đổi biểu tượng khoá học thành đã mở cho toàn bộ các mục bị ảnh hưởng. | NỬA VỜI (Xem điểm lệch). | CÓ. Cập nhật giao diện Map tổng quan khóa học. |

## Điểm lệch

### Lệch 1: Phương pháp revalidate dữ liệu bài học sau khi mua
- **Lệch cái gì:** `ContentMap` (và `DocumentReader` qua hàm chung `revalidateLearnData()`) gọi một hàm xóa cache global cho toàn bộ nhánh học tập. Trong khi đó, `LessonReader` và `MindMap` chỉ dùng `mutate()` cục bộ.
  - Ở bản `DocumentReader` (`src/components/features/learn/DocumentReader/index.tsx:3291`): `onPurchased={() => { void revalidateLearnData(courseId) }}`
  - Ở bản `LessonReader` (`src/components/features/learn/LessonReader/index.tsx:3792`): `onPurchased={() => { void mutate() }}`
  - Ở bản `MindMap` (`src/components/features/learn/MindMap/index.tsx:4430-4432`): `onPurchased={() => { void mutate() }}`
- **Nếu điều này quan trọng thì hậu quả là gì:** Nếu người dùng mua qua Paywall Modal xuất hiện bên trong màn hình `LessonReader`, màn hình bài giảng chính hiện tại sẽ được làm mới và mở khoá (do cục bộ `mutate` bài học), NHƯNG thanh điều hướng phụ hoặc thanh rail (sidebar) của `ContentMap` bên trái màn hình có thể sẽ không chạy làm mới quyền lợi đã mua do thiếu lệnh global mutate. Hậu quả là người dùng thấy bài hiện tại mở khóa, nhưng các bài khác trên rail bên cạnh vẫn đang hiển thị icon "bị khoá", trừ phi họ F5 lại trình duyệt.
- **Comment có giải thích không:** KHÔNG CÓ. (Chỉ có chú thích ở `DocumentReader` về chức năng của hàm: "Revalidates the learn course + lesson queries after a purchase from the outline.").

### Lệch 2: Trạng thái Like / Reaction trên bình luận
- **Lệch cái gì:** Trạng thái Like chỉ tồn tại trong `resourceCommentTree.ts`, còn Bản Challenge (A) và Bản FE Image (B) KHÔNG CÓ đoạn code xử lý Like State.
  - Ở bản Resource (`src/components/features/resource/hooks/resourceCommentTree.ts:192-200`):
    ```typescript
    export const toggleResourceCommentLike = (
        comment: ResourceCommentView,
        nextLiked: boolean,
    ): ResourceCommentView => {
    ```
  - Ở bản Challenge (`src/components/features/challenge/ChallengeView/ChallengePaperCommentThread.tsx:77-79`):
    KHÔNG CÓ code implement like, có comment ghi rõ việc bỏ like (xem phần Comment bên dưới).
  - Ở bản FE Image (`src/components/features/subject/SubjectFeAlbum/FeImageCommentThread.tsx`): KHÔNG CÓ logic like.
- **Nếu điều này quan trọng thì hậu quả là gì:** Nếu Frontend vô tình bật một tính năng Like/Heart chung trên Thread dùng cho Challenge hoặc Image, việc ấn vào biểu tượng sẽ thất bại hoặc không thay đổi trạng thái ngay lập tức trên UI (do không có reducer `toggleResourceCommentLike` tương ứng).
- **Comment có giải thích không:** Có giải thích cho Bản A: "- **likes / reactions** — the BE ships no reaction table for this thread (its DTO drops the fields rather than answering a constant zero), and the shared block has no like slot anyway" (`src/components/features/challenge/ChallengeView/ChallengePaperCommentThread.tsx:78`).

### Lệch 3: Mapping đối tượng Author cho UI khi bị mồ côi (xoá)
- **Lệch cái gì:**
  - Ở bản A (`src/components/features/challenge/ChallengeView/ChallengePaperCommentThread.tsx:686`):
    `const author = isDeleted ? null : comment.author`
  - Ở bản B (`src/components/features/subject/SubjectFeAlbum/FeImageCommentThread.tsx`): KHÔNG CÓ việc gán object `author`. Dùng thẳng `userId` vào `authorUsername`:
    `authorUsername: isDeleted ? "" : (comment.userId ?? "")`
- **Nếu điều này quan trọng thì hậu quả là gì:** Khi hiển thị bình luận ở bản B (FE Image), UI sẽ không có ảnh avatar và thay vì tên hiển thị, người dùng có thể thấy mã UUID trên màn hình nếu UI Component không chặn việc render chuỗi UUID.
- **Comment có giải thích không:** Có giải thích: "The FE-image comment view carries NO author card — only a `userId` — so nothing about the author is invented here: `authorUsername` is set to that raw id" (`src/components/features/subject/SubjectFeAlbum/FeImageCommentThread.tsx:39-40`).

### Lệch 4: Giới hạn Owner Gate khi Moderator muốn xoá Comment
- **Lệch cái gì:** Ở bản A, Frontend dựa vào API chứ không có code xác thực quyền của duyệt bộ môn. Ở bản B, frontend dựa trên `userId`.
  - Ở Bản A (`src/components/features/challenge/ChallengeView/ChallengePaperCommentThread.tsx:84-88`): Logic cấp quyền không được code ở Frontend, để lại cho Backend xử lý (`403`).
- **Nếu điều này quan trọng thì hậu quả là gì:** Moderator (Người duyệt bộ môn) có thể thấy mình không có nút xoá cho bình luận của người dùng khác trên màn hình của Frontend. Họ phải dùng biện pháp gọi API thủ công hoặc tool Admin ngoài.
- **Comment có giải thích không:** "The BE also lets a SUBJECT APPROVER delete, but approval rights are granted per subject and never appear in the JWT authorities, so the FE cannot decide moderator-ness here without inventing a permission read; a moderator deleting from this surface is left to the BE, which answers 403 to anyone else." (`src/components/features/challenge/ChallengeView/ChallengePaperCommentThread.tsx:85-88`).


## Lệch có chủ ý

- **Không đếm Reply vào Total Count của Thread:**
  - Bản A: "`total` counts ROOTS only (what the pager pages over), so a reply never bumps it." (`src/components/features/challenge/hooks/challengeCommentTree.ts:104`)
  - Bản B: "`total` counts ROOTS only... Bumping it for a REPLY drifted the 'Bình luận ảnh này (n)' heading upward on every reply and could invent a page that does not exist." (`src/components/features/resource/hooks/feImageCommentTree.ts:251-254`)
  - Bản C: "`total` counts ROOTS only (`ResourceCommentService` reports `roots.getTotalElements()` off the parent-is-null query), so a reply must not bump it" (`src/components/features/resource/hooks/resourceCommentTree.ts:403-405`)

- **Loại bỏ nút Report ở Component không thuộc Module Community:**
  - Bản A: "the thread's built-in report posts `targetType: "COMMENT"` into the COMMUNITY module, and a challenge comment id does not resolve there" (`src/components/features/challenge/ChallengeView/ChallengePaperCommentThread.tsx:81-82`).
  - Bản B: Tương tự (`src/components/features/subject/SubjectFeAlbum/FeImageCommentThread.tsx:55`).

- **Cập nhật cả SWR Giỏ Hàng khi CourseDetail làm mới sau khi mua:**
  - Bản Course Detail: "…and the detail page revalidates, so the CTA flips to "Vào học" instead of still inviting a second payment for a package just bought" (`src/components/features/course/CourseDetail/index.tsx:1097-1098`). Việc update có chủ ý đổi chữ nút bấm để tránh gọi payment API lần 2.

## Không đọc được
- Bản C (`resourceCommentTree.ts`) không có file React Component UI tương ứng được đưa vào trong danh sách SCOPE. Do đó, tôi không thể so sánh phần ánh xạ thông tin tác giả (author mapping), con trỏ phân trang (pagination pointers) hay Owner Gate của bản C trên giao diện React (chỉ so sánh được mức Data Model / Tree State cục bộ).

- Báo cáo đã phân tích 8 hành vi cho Task 1 và 5 Component cho Task 2. Ghi nhận 4 điểm lệch, 3 nhóm lệch có chủ ý dựa trên giải thích trong docblock. Lệnh tsc, lint và test đã được chạy nhưng thất bại do thiếu module hoặc lệnh, exit status đều là lỗi khác 0.
