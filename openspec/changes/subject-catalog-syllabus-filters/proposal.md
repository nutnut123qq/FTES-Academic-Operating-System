# subject-catalog-syllabus-filters — Bộ lọc catalog môn theo hệ ngành của syllabus FPT

## Why

Workspace môn hiện đổ **tất cả** môn ra một lưới. Chấp nhận được khi catalog có 5 môn; nhưng
dữ liệu thật của FPT (crawl `syllabase_K20_K21.json`: 159 chương trình đào tạo) có **397 môn**,
và không ai muốn cuộn 397 thẻ để tìm môn kỳ này của mình.

Danh mục ngành hiện có (V336: `SE`, `IC`, `MATH`, `LANG`) là bốn cái tên chép từ
`course.categories` lúc catalog mới có 5 môn — **không phải ngành của trường**, nên không lọc
được theo thứ sinh viên thực sự dùng để tự nhận diện.

Ba sự thật trong dữ liệu syllabus quyết định thiết kế dưới đây:

1. **Ngành có hai cấp.** Khối ngành (BIT — Công nghệ thông tin, BBA — Quản trị kinh doanh…, 8
   khối) rồi tới chuyên ngành trong khối (Kỹ thuật phần mềm, An toàn thông tin, Marketing Số…).
   Sinh viên tự nhận theo **chuyên ngành**, nhưng môn đại cương thì thuộc **cả khối**.
2. **Một môn thuộc NHIỀU ngành** — trung bình 2,6 ngành/môn (`MAE101` nằm trong gần như mọi
   chương trình). Bảng nối `subject.subject_majors` đã là nhiều-nhiều từ V336, không phải sửa.
3. **Cùng một môn được xếp KHÁC KỲ ở mỗi ngành** — 133/1061 cặp (môn, ngành) lệch với kỳ phổ
   biến nhất của chính môn đó. Một cột `recommended_semester` duy nhất làm bộ lọc "ngành X + kỳ
   N" sai chừng ấy.

## What Changes

**Dữ liệu (BE — repo `FTES-AOS-Workspace`, migration `V2__syllabus_catalog_seed.sql`)**

- Sinh bằng `scripts/gen_syllabus_seed.py` (chạy lại được khi có khoá mới) — file SQL là sản
  phẩm, script là cách tái tạo.
- `subject.majors` thêm `parent_id` → cây **2 cấp**: 8 khối + 20 chuyên ngành (chỉ tách cấp 2 ở
  khối có từ 2 chuyên ngành: BIT, BBA, BCT). `SE`/`IC` GIỮ NGUYÊN id của V336 vì hồ sơ người
  dùng đang trỏ tới mã đó; `MATH`/`LANG` chuyển `INACTIVE` (không xoá — hồ sơ cũ vẫn đọc ra tên).
- `subject.subject_majors` thêm `semester` — kỳ mà CHÍNH ngành đó xếp môn.
- Seed **397 môn** (bỏ 135 ô "chọn 1 trong N" của chương trình: chúng là chỗ trống, không phải
  môn) + **1032 cặp môn↔ngành**. `ON CONFLICT DO NOTHING` cho môn: 5 môn đang có nội dung thật
  giữ nguyên id/status/ảnh.
- Cuối migration có khối hậu kiểm: thiếu môn hoặc thiếu dòng nối thì **fail lúc deploy**, không
  để catalog lên thiếu dữ liệu rồi mới phát hiện.

**API (BE)**

- `GET /api/v1/subjects?major=` — mã KHỐI giờ gộp cả chuyên ngành con (`majorIds IN (...)`);
  mã chuyên ngành thì chỉ chính nó, không leo ngược lên cha.
- `semester` đọc từ bảng nối khi có chọn ngành, rơi về `subjects.recommended_semester` khi không.
- `GET /api/v1/majors` thêm `parentCode` để FE gom nhóm. KHÔNG đụng `MajorCatalogApi.MajorRef`
  (hợp đồng trong jar dùng chung — đổi là kéo theo rebuild + vendor lại ở mọi service).

**FE**

- `useQuerySubjectsSwr` chuyển sang **lọc + phân trang ở server** (`useSWRInfinite`, trang 24) —
  bản cũ tải một trang 100 rồi lọc bằng JavaScript, với 397 môn là cắt cụt IM LẶNG.
- Ô tìm kiếm đi qua BE, hoãn bằng `useDeferredValue` (không thêm thư viện debounce).
- Dropdown ngành: chuyên ngành thụt lề dưới khối, dùng đúng thứ tự BE trả.
- Ô chọn môn của form tải tài nguyên tách thành `useQuerySubjectOptionsSwr` (một lượt, trần 500)
  — nếu vẫn dùng chung hook catalog thì nó chỉ thấy 24 môn đầu.

## Non-goals

- **Không** thêm bộ lọc theo khoá (K20/K21): syllabus có dữ liệu, nhưng thêm trục thứ ba vào
  bộ lọc trước khi có ai hỏi là bịa nhu cầu.
- **Không** seed tiên quyết (prerequisites) / lộ trình từ syllabus — dữ liệu có sẵn trong file
  `roadmap`, làm sau nếu tab Lộ trình cần.
- **Không** đụng `MajorPicker` ở onboarding (vẫn danh sách phẳng, chỉ dài thêm).
