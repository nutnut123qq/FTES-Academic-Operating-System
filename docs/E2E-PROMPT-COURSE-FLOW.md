# Prompt E2E — luồng trọn vẹn module Course (2 vai, vòng khép kín)

> Dán phần dưới vào phiên Claude Code ở máy local. Xong dán báo cáo lại cho phiên server review.

---

Bạn nghiệm thu **end-to-end module Course bằng thao tác thật trên UI**, theo **2 vai nối nhau thành vòng khép kín**: giảng viên/admin dựng & sửa khoá → học viên kiểm chứng thấy đúng thứ vừa sửa.

Đây KHÔNG phải kiểm từng nút rời rạc. Giá trị nằm ở chỗ: **thứ vai A thay đổi phải hiện đúng ở vai B**.

## Môi trường

- FE: `npm run dev` (cổng 3000). BE dùng chung: `https://apitest.ftes.vn/api/v1`. **Đừng dựng BE local.**
- Hạ tầng E2E có sẵn: `playwright.config.ts`, `e2e/helpers/auth.ts` (`fetchToken(role)`, role `student | lecturer | ctv | admin`), mật khẩu qua `FTES_TEST_PASSWORD`; vai admin cần `FTES_ADMIN_PASSWORD`.

```bash
git pull && npm ci && npx playwright install chromium
npm run dev
```

## Nhãn kết quả

`PASS` · `FAIL` (kèm repro + request/response thật từ Network tab) · `BLOCKED-DATA` / `BLOCKED-INFRA` / `BLOCKED-CREDS`. **Đừng gộp BLOCKED thành FAIL.**

---

## PHẦN A — Vai giảng viên/admin: dựng khoá

Làm bằng UI (Admin CMS hoặc trang giảng viên của FE — tuỳ chỗ nào có màn hình thật; ghi rõ bạn dùng surface nào).

1. **Tạo khoá mới** — đặt tên có hậu tố thời gian để dễ tìm. Ghi lại `courseId` + slug.
2. **Thêm chương + ít nhất 3 bài học**: 1 bài VIDEO, 1 bài DOCUMENT (có nội dung chữ thật, ≥200 từ — sẽ dùng để hỏi AI), 1 bài bất kỳ.
3. **Dùng AI hỗ trợ soạn bài học** — BE có `POST /api/v1/ai/lesson-document` (proxy sang ai-service `authoring/lesson-document/generate`, vừa deploy hôm nay). Trên UI là chức năng AI soạn nội dung bài trong trang sửa lesson. Kiểm: sinh ra nội dung → **chèn / thay / hoàn tác** đều đúng chỗ.
4. **Cấp quyền cho user**: gán vai trò để học viên/CTV thao tác được (RBAC console). Nếu thiếu quyền admin → `BLOCKED-CREDS`, ghi rõ.
5. **Publish khoá** + đặt giá để mua được.

## PHẦN B — Vai học viên: xem thử → mua → học

6. **Xem miễn phí**: đăng nhập học viên (chưa mua), mở trang chi tiết khoá vừa tạo. Kiểm: bài/phần được phép xem thử thì **xem được**, phần còn lại hiện tường phí (không phải lỗi đỏ, không phải trang trắng).
7. **Video học thử phải bị cắt đúng mốc**: BE mới có **học thử theo % thời lượng** (`previewPercent`) bên cạnh `previewSeconds` (commit `775c23d`). Xem bài VIDEO ở chế độ xem thử → tới mốc phải dừng + hiện overlay khoá + CTA mua; tua vượt mốc phải bị kéo về.
8. **Mua khoá**: qua giỏ hàng → thanh toán (QR VietQR hoặc trả bằng Xu). Sau khi thanh toán xong → khoá mở, vào học được toàn bộ.
9. **Xem khoá / học bài**: mở reader, chuyển bài, đánh dấu hoàn thành, tiến độ cập nhật.

## PHẦN C — AI trên khoá đã mua (học viên)

Sau khi đã sở hữu khoá, thử **cả 3** trên bài DOCUMENT ở bước 2:

10. **Hỏi đáp bài học** — panel AI trong reader (`POST /ai/document-qa` với `lessonId`). Hỏi câu **chỉ trả lời được nếu đã đọc nội dung bài**. Trả lời sai nội dung = FAIL.
11. **Tóm tắt** — `POST /ai/learning/summary` (chạy job nền → poll). Kiểm tóm tắt bám nội dung bài thật.
12. **Flashcard** — `POST /ai/learning/flashcards`. Kiểm thẻ sinh ra từ nội dung bài; chấm một thẻ rồi **F5 → tiến độ SM-2 còn nguyên**.

> Ba cái này chạy nền: bấm xong hiện trạng thái "đang xử lý" là **đúng thiết kế**. Chờ tới ~60s; quá 2 phút mới FAIL.

## PHẦN D — Workplace của môn (học viên)

13. **Xem học liệu của khoá trong workplace**: mở workspace môn → tab Tài liệu → thấy học liệu, mở/tải được, nút "Hỏi AI" hoạt động.
14. **Đăng bài discussion trong workplace**: tab Thảo luận của môn → đăng bài mới → hiện ngay trong danh sách; bình luận được; F5 vẫn còn.

## PHẦN E — Vòng khép kín: sửa ở vai giảng viên → học viên thấy đổi

Đây là phần **quan trọng nhất**, đừng bỏ.

15. Quay lại vai giảng viên: **xem danh sách bài học** của khoá, **sửa 1 bài** (đổi tiêu đề + nội dung), **thêm 1 bài mới**.
16. **Chỉnh mức học thử miễn phí**: đổi `previewPercent` (hoặc `previewSeconds`) của bài VIDEO sang giá trị KHÁC rõ rệt — endpoint `PATCH /api/v1/lessons/{lessonId}/preview`, trên UI là ô chỉnh học thử trong trang sửa lesson.
17. **Đổi vai sang học viên và kiểm chứng lại**:
    - Bài vừa sửa hiện **tiêu đề + nội dung mới**.
    - Bài mới thêm **xuất hiện** trong syllabus/reader.
    - Video học thử dừng ở **mốc MỚI**, không phải mốc cũ (đây là chỗ dễ dính cache nhất — nếu phải hard-refresh mới thấy thì ghi rõ, đó là phát hiện có giá trị).

---

## Bẫy đã biết — đọc trước khi kết luận FAIL

- **Job AI chạy nền** (summary/flashcards/ingest tài liệu): 10–60s là bình thường.
- **Tài liệu vừa upload cần ~10–20s để index** mới hỏi AI được; trong lúc đó panel hiện "đang xử lý" + nút "Thử lại".
- **PDF scan không có lớp text** → ingest 400 (chưa OCR) — `BLOCKED-DATA`, không phải FAIL.
- **CTV nay bị siết theo môn**: tài khoản `ctv.test` chỉ duyệt được học liệu **PRF192**, môn khác trả 403 — **đó là ĐÚNG** (vừa siết hôm nay), đừng báo là bug.
- **Trần tạo nhóm 3/ngày/người**; **tạo nhóm/đổi vai làm token cũ thành stale** → lấy token mới sau khi đổi quyền.
- **Đổi quyền có cache 15'**: nếu vừa cấp quyền mà chưa ăn, đó có thể là cache `ftes:identity:perm:{userId}` — ghi lại hiện tượng, đừng kết luận vội là mất quyền.
- **`tsc --noEmit` là incremental** — luôn `rm -f tsconfig.tsbuildinfo` trước khi kết luận sạch.
- Nhánh `master` nhiều người push → `git fetch && git pull --rebase` trước khi push.

## Quy tắc chốt

- Không sửa code sản phẩm trừ khi E2E lộ bug rõ; sửa thì kèm test + giải thích ngắn.
- Trước khi kết luận FAIL: mở **Network tab**, xem status + body thật, rồi mới quy trách nhiệm FE hay BE. Đọc controller BE ở `FTES-AOS-Backend/src/main/java/vn/ftes/aos/...` để chắc gọi đúng contract.
- Verify trước commit: `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` + `npx vitest run`.
- Spec mới đặt trong `e2e/`, đặt tên theo luồng (vd `course-full-journey.spec.ts`).
- **Dọn dữ liệu test** sau khi xong (archive khoá/bài/học liệu đã tạo) hoặc liệt kê rõ những gì để lại.

## Báo cáo cuối (dán lại cho phiên server)

1. **Bảng** `bước 1–17 → PASS / FAIL / BLOCKED-*`, ghi rõ surface đã dùng (Admin CMS hay trang giảng viên).
2. **Bug thật**: triệu chứng → request/response thật → nguyên nhân (đã đọc code) → đã vá chưa, commit nào.
3. **Còn thiếu**: seed / quyền / dịch vụ.
4. **Commit đã push** (repo + sha) + trạng thái CI.
5. **Dữ liệu để lại trên apitest** (courseId, lessonId, tài khoản đã đổi quyền) để phía server dọn hoặc dùng tiếp.

Kèm ảnh chụp 2 mốc: video học thử dừng đúng mốc MỚI (bước 17) và panel AI trả lời đúng nội dung bài (bước 10) — đó là bằng chứng gọn nhất cho thấy vòng khép kín chạy thật.
