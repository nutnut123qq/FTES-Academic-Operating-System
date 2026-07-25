# Prompt E2E vòng 2 — chạy ở LOCAL

> Dán phần dưới vào phiên Claude Code ở máy local. Xong dán báo cáo lại cho phiên trên server review.

---

Bạn là agent nghiệm thu E2E vòng 2. Vòng 1 đã xong; vòng này chỉ làm **phần còn lại + phần vừa được mở khoá**.

## Trạng thái đã biết (ĐỪNG chạy lại)

Phiên server đã chạy và XÁC NHẬN XANH trên `apitest.ftes.vn` lúc 2026-07-26:

- `npx playwright test workplace-be-smoke --project=desktop` → **11/11 pass**, gồm 2 assert từng đỏ (`GET /resources/collections/me` trả 200 cho chủ sở hữu; `likedByMe` đúng theo người gọi). Bản vá `JwtAuthenticationFilter` đã live.
- `POST /community/posts` với `contentFormat:"PLAIN"` → **400 `COMMUNITY_CONTENT_FORMAT_INVALID`** (trước 500).
- Archive hội thoại → `GET /ai/sessions` giảm 9→8, `?status=ALL` vẫn 12 → đã ẩn thật.

Commit liên quan đã push: FE `d51246e`, BE `916770a` (đang chạy trên apitest trong image `e729487`).

## Chuẩn bị

```bash
git pull                      # lấy d51246e (helper ownedGroup + fix bảng tin khách)
npm ci && npx playwright install chromium
npm run dev                   # cổng 3000, để chạy các spec UI
```

Token: `FTES_TEST_PASSWORD='<mật khẩu test>'`. Helper `e2e/helpers/auth.ts` hiện có vai `student | lecturer | ctv`.

## Nhãn kết quả (giữ nguyên quy ước vòng 1)

`PASS` · `FAIL` (lỗi code — kèm repro + response thật) · `BLOCKED-DATA` (thiếu seed) · `BLOCKED-INFRA` (dịch vụ ngoài) · `BLOCKED-CREDS` (thiếu tài khoản). **Đừng gộp BLOCKED thành FAIL.**

---

## Ưu tiên 1 — Nhóm BLOCKED-MINIO vừa được MỞ KHOÁ (giá trị cao nhất)

Cloudinary đã lên apitest: `CloudinaryStorageProvider` live, 4 biến env đã set, và upload đổi sang **multipart server-side** — endpoint thật là:

```
POST /api/v1/resources/{id}/versions   (multipart/form-data, field "file")
```

KHÔNG còn luồng presign → PUT → complete như vòng 1. Vòng 1 đánh `BLOCKED-MINIO-PUBLIC` cho các mục dưới; giờ chạy lại:

1. **Tải tài liệu**: tạo resource → upload file thật qua endpoint trên → `GET /resources/{id}/download-url` → tải được, URL trỏ Cloudinary (không phải host nội bộ).
2. **Panel ResourceAiQa** (mục 16 vòng 1): mở `/vi/resources/{id}` của tài liệu ĐÃ có file → panel "Hỏi AI về tài liệu này" phải hiện (vòng 1 nó ẩn vì tài liệu không có file). Hỏi 1 câu → có trả lời + trích dẫn. Nếu trả `processing:true` mãi → `BLOCKED-INFRA` (ai-service chưa index Qdrant), ghi rõ.
3. **Nhánh 403 `AI_DOCUMENT_ACCESS_DENIED`** (vòng 1 chặn vì approve đòi version UPLOADED): giờ upload được rồi → tạo resource của tài khoản A, approve, đặt visibility hẹp → tài khoản B hỏi `POST /ai/document-qa` với `documentId` đó → phải **403**.
4. **Nút "Hỏi AI"** trên dòng tài liệu trong workspace môn → điều hướng `/resources/{id}?ask=1` và tự cuộn + focus vào panel.

## Ưu tiên 2 — Spec UI cần dev server

5. `npx playwright test resource-detail-engagement-ui --project=desktop` — spec vòng 1 chưa chạy được ở phiên server (không có dev server).
6. **Bảng tin cho khách — VỪA VÁ, CHƯA AI CHẠY**: `npx playwright test subject-career-and-community-ui --project=desktop`. Ca `khách xem bảng tin: phải mời đăng nhập, không phải báo lỗi tải` đã bỏ `test.fail()` và **thêm assert dương** (phải THẤY chữ "Đăng nhập để xem bảng tin"). Đây là lần chạy đầu tiên — nếu đỏ thì là bug thật của bản vá, báo ngay.
7. Các mục UI vòng 1 còn dở: mục 18 phần **sự kiện nhóm** và **rời nhóm** (vòng 1 ghi "chưa nghiệm thu"), mục 17 phần **badge "Đã ghim"** (cần seed 1 bài ghim — nếu không có thì `BLOCKED-DATA`).

## Ưu tiên 3 — Mở khoá vai admin (mục 20)

8. Thêm vai `admin` vào `e2e/helpers/auth.ts` (mật khẩu admin dùng được cho REST; email admin: `admin.test@ftes.vn`). Rồi nghiệm thu hàng đợi kiểm duyệt:
   - Nút **"Chuyển cấp"** CHỈ hiện ở hàng có `reportId != null`.
   - Bấm xong hàng **KHÔNG biến mất** mà đổi sang nhãn "đã chuyển cấp" (BE chỉ đổi `report.status → IN_REVIEW`, không đụng hàng chờ).
   - Hàng do AI/hệ thống đẩy vào (không có `reportId`) → không có nút.

## Ưu tiên 4 — Regression 2 bản vá tối 25/07 ở tầng UI

9. Đăng bài từ composer community → vẫn đăng được bình thường (bản vá `contentFormat` không được làm vỡ đường đăng bài thường; FE không gửi field này nên kỳ vọng PASS).
10. Xoá 1 hội thoại trong gia sư AI của môn → **F5 → nó không hiện lại**.

---

## Bẫy đã biết — đọc trước khi kết luận FAIL

- **Trần tạo nhóm 3/ngày/người** (`GroupRateLimiter.checkCreate`). Spec smoke đã sửa để tái dùng nhóm sẵn có (`ownedGroup`), nhưng nếu bạn viết test mới có tạo nhóm thì nhớ tái dùng, đừng tạo mới — chạy quá 3 lần/ngày là đỏ vì trần chứ không phải sản phẩm hỏng.
- **Tạo nhóm làm token của chính người tạo thành stale** (`IDENTITY_TOKEN_STALE`) → phải lấy token mới sau khi tạo.
- **Thống kê môn**: `computedAt` còn cũ vì worker `StatisticsService.recompute` chưa chạy → số liệu rỗng là `BLOCKED-INFRA`, không phải FE sai.
- **`tsc --noEmit` là incremental** — luôn `rm -f tsconfig.tsbuildinfo` trước khi kết luận sạch (cache từng che 44 lỗi thật).
- Nhánh `master` nhiều người push → `git fetch && git pull --rebase` trước khi push.

## Quy tắc chốt

- Không sửa code sản phẩm trừ khi E2E lộ bug rõ; sửa thì kèm test + giải thích.
- Trước khi kết luận FAIL, đọc controller BE thật ở `FTES-AOS-Backend/src/main/java/vn/ftes/aos/...` để chắc gọi đúng contract.
- Verify trước commit: `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` + `npx vitest run`.
- Cập nhật `openspec/changes/fe-wire-new-be-endpoints/tasks.md`: PASS thì tick `[x]` kèm bằng chứng ngắn; FAIL/BLOCKED giữ `[ ]` kèm repro/điều kiện.

## Báo cáo cuối (dán lại cho phiên server review)

Gồm đúng 4 phần:
1. **Bảng** `hạng mục → PASS / FAIL / BLOCKED-*` (ghi rõ mục nào vừa được Cloudinary mở khoá).
2. **Bug thật** tìm được: triệu chứng → nguyên nhân gốc (đã đọc code) → đã vá chưa, commit nào.
3. **Còn thiếu**: seed / dịch vụ / tài khoản, mỗi cái kèm việc cụ thể cần làm.
4. **Commit đã push** (repo + sha) và trạng thái CI.
