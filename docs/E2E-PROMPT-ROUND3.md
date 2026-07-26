# Prompt E2E vòng 3 — bấm tay trên FE: hỏi đáp AI tài liệu

> Dán phần dưới vào phiên Claude Code ở máy local. Xong dán báo cáo lại cho phiên server review.

---

Bạn nghiệm thu bằng **thao tác thật trên UI** (không chỉ gọi API). Trọng tâm: **hỏi đáp AI tài liệu trong Workplace** — thứ vòng 2 đánh `BLOCKED-INFRA` vì trả `processing:true` mãi. Nay đã sửa xong và chạy được.

## Đã thay đổi kể từ vòng 2 (đọc để biết vì sao giờ khác)

Vòng 2 panel hỏi-đáp không bao giờ trả lời. Nguyên nhân **không phải** worker chậm mà thiếu 2 mắt xích + 1 lỗi thư viện:

1. `retriever._embed` import module `document_qa.embeddings` — **module không tồn tại** → `retrieve_qdrant` luôn rỗng → 404 → BE dịch thành `processing:true`.
2. Không có route nào nạp tài liệu vào Qdrant.
3. `qdrant-client 1.18.0` **đã bỏ `client.search()`** → kể cả có embeddings vẫn `AttributeError` bị nuốt thành rỗng.

Đã sửa và **đã deploy**:
- `ftes-ai-service` `652de6f` — thêm `embeddings.py` (hashing tất định, 0 dep mới), `ingest.py`, `POST /api/ai/v2/document/ingest`, `DELETE /api/ai/v2/document/{ref}`. Deploy **tay** (repo này không có runner).
- BE `107c13d` — `DocumentIndexConsumer`: upload xong → phát Kafka → nạp file sang ai-service bất đồng bộ. Đã deploy qua CI.
- BE `916770a` — `contentFormat` lạ → 400 (trước 500); `GET /ai/sessions` mặc định ẩn hội thoại đã xoá (`status=ALL` để lấy tất cả).
- BE `d164a98` — xoá nhánh duyệt-theo-môn chết trong `DefaultIdentityAdapter` (hành vi không đổi).

Phiên server đã kiểm bằng API (KHÔNG cần làm lại): upload thật → ingest ~12s → hỏi 2 câu đều trả lời đúng kèm trích dẫn. **Việc của bạn là chứng minh nó đúng khi người dùng bấm tay.**

## Dữ liệu có sẵn để dùng ngay

Tài liệu đã upload + đã index trên apitest:

- **resourceId**: `f88dce77-a877-429a-b397-197bf0cb1310`
- URL: `/vi/resources/f88dce77-a877-429a-b397-197bf0cb1310`
- Nội dung (để biết đáp án đúng): đề cương PRF192 — *thi cuối kỳ 50%, lab 30%, bài tập 20%; phải đạt tối thiểu 4.0 điểm thi cuối kỳ; nộp muộn trừ 10%/ngày, quá 3 ngày không nhận; tuần 10-12 học con trỏ và cấp phát động.*

## Chuẩn bị

```bash
git pull
npm ci && npx playwright install chromium
npm run dev                 # cổng 3000
FTES_TEST_PASSWORD='<mật khẩu test>'
```

## Nhãn kết quả

`PASS` · `FAIL` (kèm repro + ảnh/console/network) · `BLOCKED-*` (ghi rõ thiếu gì). Đừng gộp BLOCKED thành FAIL.

---

## Ưu tiên 1 — Hỏi đáp AI tài liệu, bấm tay

1. **Panel hiện đúng chỗ**: mở `/vi/resources/f88dce77-a877-429a-b397-197bf0cb1310` → thấy khối "Hỏi AI về tài liệu này" nằm dưới preview, trên phần bình luận.
2. **Hỏi và nhận câu trả lời ĐÚNG NỘI DUNG**: gõ "Thi cuối kỳ chiếm bao nhiêu phần trăm?" → phải ra **50%**. Hỏi tiếp "Nộp bài muộn bị trừ thế nào?" → **10%/ngày, quá 3 ngày không nhận**. Câu trả lời sai nội dung = FAIL (không phải "AI trả lời chung chung là được").
3. **Trích dẫn**: dưới câu trả lời phải có phần "Trích dẫn" với đoạn trích thật từ tài liệu.
4. **Model picker**: đổi model trong composer → gửi lại → caption dưới bubble đổi theo model đã chọn. **Mở tab Network xác nhận payload gửi `model` là id thật** (vd `openai/gpt-oss-120b`), KHÔNG phải `react-aria-N` (bug cũ, phải regression).
5. **Khách chưa đăng nhập**: mở cùng URL ở cửa sổ ẩn danh → panel vẫn hiện, bấm Gửi → ra **modal đăng nhập**, không phải lỗi đỏ.
6. **Vào từ workspace môn**: tab Tài liệu của môn PRF192 → bấm nút "Hỏi AI" trên dòng tài liệu → điều hướng sang `/resources/{id}?ask=1`, trang **tự cuộn tới panel và focus ô nhập**.

## Ưu tiên 2 — Trọn vòng bằng tay: upload → hỏi

7. Tự upload **tài liệu MỚI** qua UI (`/vi/resources/upload` hoặc nút đăng tài liệu): chọn file `.md` hoặc `.pdf` có nội dung bạn biết trước.
8. Sau khi upload xong, mở trang chi tiết tài liệu đó và hỏi một câu **chỉ có thể trả lời nếu đã đọc file**.
   - Ingest chạy nền, mất **~10-20 giây**. Trong lúc đó panel hiện banner "đang xử lý" + nút **"Thử lại"** — bấm Thử lại sau ~15s phải ra câu trả lời.
   - Nếu sau 2 phút vẫn `processing` → **FAIL**, kèm `resourceId` để phía server soi log consumer.
9. **Tải xuống**: bấm nút Tải xuống trên tài liệu PDF vừa upload → file tải về mở được (vòng 2 mục 1b từng 401; nay đi đường BE-stream).

## Ưu tiên 3 — Regression các bản vá BE mới

10. **Đăng bài community** từ composer → vẫn đăng bình thường (bản vá `contentFormat` không được làm vỡ đường thường).
11. **Gia sư AI của môn**: xoá một hội thoại → **F5 → nó KHÔNG hiện lại** (BE nay mặc định ẩn hội thoại đã xoá).
12. **Duyệt học liệu** (cần vai admin đã thêm ở vòng 2): tài liệu bạn vừa upload ở mục 7 đang PENDING → vào hàng đợi duyệt → duyệt được (không còn 403).

---

## Bẫy đã biết — đọc trước khi kết luận FAIL

- **Ingest là bất đồng bộ**: upload trả 200 ngay, index có sau ~10-20s. Hỏi ngay lập tức mà thấy "đang xử lý" là **đúng thiết kế**, không phải bug. Chỉ FAIL nếu quá 2 phút.
- **Định dạng**: ai-service nhận `.pdf` / `.txt` / `.md` (≤25MB). **PDF scan không có lớp text → 400** (phải OCR trước) — đó là giới hạn đã biết, ghi `BLOCKED-DATA` chứ không phải FAIL. Ảnh/docx/pptx không nạp trực tiếp.
- **Trần tạo nhóm 3/ngày/người**; **tạo nhóm làm token của chính người tạo thành stale**.
- **`tsc --noEmit` là incremental** — luôn `rm -f tsconfig.tsbuildinfo` trước khi kết luận sạch.
- Nhánh `master` nhiều người push → `git fetch && git pull --rebase` trước khi push.

## Quy tắc chốt

- Không sửa code sản phẩm trừ khi lộ bug rõ; sửa thì kèm test + giải thích.
- Trước khi kết luận FAIL, mở **Network tab** xem request/response thật (status + body) rồi mới quy trách nhiệm FE hay BE.
- Verify trước commit: `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` + `npx vitest run`.
- Ghi kết quả vào `openspec/changes/fe-wire-new-be-endpoints/tasks.md`.

## Báo cáo cuối (dán lại cho phiên server)

1. **Bảng** `mục → PASS / FAIL / BLOCKED-*`.
2. **Bug thật**: triệu chứng → request/response thật → nguyên nhân (đã đọc code) → đã vá chưa.
3. **Còn thiếu**: seed / dịch vụ / tài khoản.
4. **Commit đã push** (repo + sha) + trạng thái CI.

Kèm ảnh chụp panel lúc trả lời đúng — đó là bằng chứng tính năng sống.
