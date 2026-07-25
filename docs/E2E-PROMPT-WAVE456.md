# Prompt E2E — nghiệm thu đợt Workplace/Community/Groups + Hỏi đáp AI tài liệu

> Dán toàn bộ phần dưới vào một phiên Claude Code chạy ở **máy local** (nơi chạy được `npm run dev` và đăng nhập được).

---

Bạn là agent nghiệm thu E2E. Nhiệm vụ: kiểm chứng **~70 nút/tính năng vừa được nối** ở Workplace / Community / Groups / Resource Hub và **hỏi đáp AI tài liệu**, trên backend THẬT. Mọi thứ dưới đây đã qua tsc + unit test + review, nhưng **CHƯA từng chạy với người dùng đăng nhập** — đó chính là thứ bạn phải xác minh.

## Bối cảnh

- Repo FE: `FTES-Academic-Operating-System`, nhánh `master`, commit `99324b9` (Vercel xanh).
- Repo BE: `FTES-AOS-Backend`, commit `a80103a` — đã deploy `apitest.ftes.vn`, migration **V264–V268** đã apply.
- Backend dùng chung: `https://apitest.ftes.vn/api/v1` (REST), `/api/v1/graphql`. **ĐỪNG dựng BE local.**

### Hạ tầng E2E ĐÃ CÓ SẴN trong repo (dùng lại, đừng viết lại)

- `playwright.config.ts` — `baseURL` mặc định `http://localhost:3000`, 2 project: `desktop`, `mobile`.
- `e2e/helpers/auth.ts` — `fetchToken(role)` với `role = "student" | "lecturer" | "ctv"`; mật khẩu lấy từ env **`FTES_TEST_PASSWORD`**; login REST `POST /auth/login` body `{identifier, password}`.
- ~20 spec cũ trong `e2e/` — đọc 1–2 file để bắt chước pattern trước khi viết mới.

Chạy:

```bash
FTES_TEST_PASSWORD='<mật khẩu>' npx playwright test --project=desktop
```

### Chuẩn bị

1. `npm ci` (nếu chưa) và `npx playwright install chromium`.
2. `npm run dev` (cổng 3000). Nếu dùng cổng khác thì set `BASE_URL`.
3. Xác nhận `fetchToken("student")` lấy được token trước khi làm gì tiếp.

---

## Cách phân loại kết quả (QUAN TRỌNG)

Mỗi hạng mục phải kết luận đúng một nhãn:

- **PASS** — chạy đúng như mô tả.
- **FAIL** — lỗi code. Ghi repro tối thiểu + response thật (status + body rút gọn).
- **BLOCKED-DATA** — code có vẻ đúng nhưng thiếu dữ liệu để chứng minh (môn chưa có câu hỏi, chưa ai tạo deck, chưa có bài ghim…). **Phải nói rõ cần seed gì.**
- **BLOCKED-INFRA** — phụ thuộc dịch vụ ngoài chưa sẵn sàng (ai-service chưa index Qdrant, S3 presign còn stub, worker thống kê chưa chạy).
- **BLOCKED-CREDS** — cần tài khoản không có sẵn (đặc biệt: **admin**; helper hiện chỉ có student/lecturer/ctv).

**Đừng gộp BLOCKED thành FAIL.** Phân biệt "code sai" với "thiếu điều kiện" là giá trị chính của đợt này.

---

## Ưu tiên 1 — BE smoke bằng token (nhanh nhất, chạy TRƯỚC)

Chỉ cần `fetchToken` + `fetch`/`request` của Playwright, không cần dev server. Với mỗi ca: assert status + shape.

1. **Like bình luận tài liệu** — `PUT /resources/comments/{id}/like` → `{active:true, likeCount}`; gọi lại lần 2 vẫn 200 (idempotent); `DELETE` → `{active:false}`. Rồi `GET /resources/{id}/comments` xem `likeCount`/`likedByMe` có phản ánh đúng **cho cả comment gốc lẫn reply**.
2. **Đánh giá của tôi** — `GET /resources/{id}/ratings/me` khi chưa đánh giá → **200 + data null** (KHÔNG phải 404); `POST /ratings` rồi GET lại → có dữ liệu; `DELETE /ratings/me` → idempotent; kiểm `avgRating`/`ratingCount` của resource có tính lại.
3. **Note bộ sưu tập** — `PATCH /resources/collections/{id}/items/{resourceId}` `{note}` → đổi note mà **sortOrder giữ nguyên**.
4. **Lời mời nhóm** — `GET /invitations/me` → chỉ trả PENDING của chính caller, có `group{name,slug,avatarUrl}` và `inviter`. (Cần ai đó mời tài khoản test → nếu không có, **BLOCKED-DATA**.)
5. **Follow batch** — `GET /community/follows/me?userIds=a,b,c` → mảng id đang theo dõi; truyền >100 id → **400**; không truyền → `[]`.
6. **Phiên AI theo môn** — `GET /ai/sessions?feature=TUTOR_CHAT&subjectId=<UUID môn>` → chỉ phiên của môn đó, mỗi phiên có `contextRef`. `DELETE /ai/sessions?feature=TUTOR_CHAT&subjectId=<UUID>` → `{archived:n}`, gọi lại → `{archived:0}`. **CẢNH BÁO: gọi DELETE mà KHÔNG kèm filter sẽ archive SẠCH mọi phiên của tài khoản — đừng thử ca đó trên tài khoản còn dùng.**
7. **Practice quiz theo môn** — `GET /subjects/{code}/practice/quiz?count=5`: **kiểm kỹ payload KHÔNG chứa `correctKeys`/`explanation`** (rò đáp án là lỗi bảo mật). `POST .../quiz/submit` → điểm + `results[]` có `correctKeys` (chỉ sau khi nộp). Môn chưa có câu hỏi → `count:0, questions:[]` (là **BLOCKED-DATA**, không phải FAIL).
8. **Thống kê môn** — `GET /subjects/{code}/statistics` → có `memberCount/postCount/resourceCount/completionRate/topStudents/leaderboard`. **Nếu tất cả rỗng/null**: nhiều khả năng worker `StatisticsService.recompute` chưa chạy cho môn đó → **BLOCKED-INFRA**, ghi rõ (đừng kết luận FE sai).
9. **Gỡ ảnh nhóm** — `DELETE /groups/{id}/media/AVATAR` → `GroupResponse` với `avatarUrl:null`; gọi lại vẫn 200. Kiểm `viewerMembership` có trong `GET /groups/{id}`.
10. **Hỏi đáp AI tài liệu** — `POST /ai/document-qa` `{documentId, question}`:
    - tài liệu mình đọc được → 200 (có thể `processing:true` nếu ai-service chưa index → **BLOCKED-INFRA**),
    - tài liệu KHÔNG có quyền → **403 `AI_DOCUMENT_ACCESS_DENIED`**,
    - id không tồn tại → **404 `AI_DOCUMENT_NOT_FOUND`**,
    - thiếu cả `documentId` lẫn `lessonId` → **400**.

## Ưu tiên 2 — UI có đăng nhập (Playwright, role `student`)

Viết spec mới trong `e2e/`, đặt tên theo tính năng.

11. **Flashcard SM-2 (rủi ro cao nhất — bảng mới toanh)**: mở tab Practice của môn → nếu có deck: học 1 thẻ → chấm "Được"/"Khó" → **F5 → tiến độ phải CÒN** (đây là điểm mấu chốt, trước đây reload là mất sạch). Chưa có deck nào → **BLOCKED-DATA** (cần lecturer tạo deck, xem mục 18).
12. **Quiz practice**: làm bài → nộp → thấy điểm + đáp án đúng + giải thích. Trước khi nộp, mở DevTools/network xác nhận payload **không** kèm đáp án.
13. **Thống kê môn**: tab Thống kê hiện số thật hoặc empty state tử tế; **không** được hiện số liệu của môn khác khi chuyển môn (đây là bug vừa vá — đổi môn nhanh 2–3 lần để thử).
14. **Định hướng nghề**: kỹ năng của môn hiện **tên** (không phải UUID); nút "Theo lộ trình" → theo được, trạng thái đổi "Đang theo"; "Ứng tuyển" → "Đã ứng tuyển". Khách chưa đăng nhập mở tab này → phải thấy trạng thái "cần đăng nhập", **không** phải "không có dữ liệu".
15. **Tài liệu**: nút tim bình luận (like/unlike, số đếm đúng, F5 vẫn đúng) · đánh giá cũ được prefill + "Cập nhật"/"Xoá đánh giá" · thêm vào bộ sưu tập · sửa note item · tải xuống · nút "Hỏi AI" từ dòng tài liệu trong workspace môn (`?ask=1` phải tự cuộn + focus).
16. **Hỏi đáp AI tài liệu (UI)**: hỏi 1 câu → có trả lời + trích dẫn; đổi model trong picker → **payload gửi đúng model id, không phải `react-aria-N`** (bug cũ, phải regression); tài liệu chưa index → banner "đang xử lý" + nút "Thử lại" resend đúng câu hỏi.
17. **Community**: menu ⋯ trên **feed row** (chủ bài thấy Sửa/Xoá; người khác thấy Báo cáo; khách bấm ra modal đăng nhập) · sửa/xoá bài từ feed **không** đá khỏi tab đang xem · báo cáo comment · badge "Đã ghim" nếu có bài ghim (không có → BLOCKED-DATA) · nút Theo dõi trong hovercard hiện **đúng trạng thái ngay** (nhờ batch, không cần hover từng người).
18. **Groups**: hộp thư lời mời ở `/groups` (chấp nhận/từ chối) · tab Tài nguyên nhóm (gắn/gỡ) · tạo/sửa/xoá sự kiện + thông báo · rời nhóm · **"Gỡ ảnh"**: thử kịch bản *chọn nhầm file rồi bấm Gỡ* → bấm Lưu → **ảnh cũ trên server PHẢI còn nguyên** (bug vừa vá, dễ tái phát).

## Ưu tiên 3 — role khác

19. **lecturer**: tạo deck flashcard cho môn (mở khoá mục 11), soạn nội dung; kiểm học viên thấy deck.
20. **admin**: hàng đợi kiểm duyệt — nút "Chuyển cấp" chỉ hiện khi hàng có `reportId`, bấm xong hiện nhãn "đã chuyển cấp" (**không** biến mất khỏi danh sách). ⚠️ Helper hiện **không có role admin** → nếu không có mật khẩu admin thì đánh **BLOCKED-CREDS**, đừng bỏ qua im lặng.

---

## Quy tắc chốt

- **Không sửa code sản phẩm** trừ khi E2E lộ bug rõ ràng; nếu sửa thì kèm unit test và giải thích ngắn.
- Trước khi kết luận FAIL, **đọc controller BE thật** (`FTES-AOS-Backend/src/main/java/vn/ftes/aos/...`) để chắc mình gọi đúng contract.
- Ghi kết quả vào `openspec/changes/fe-wire-new-be-endpoints/tasks.md` và `openspec/changes/workplace-community-full-wire/tasks.md`: mục PASS thì tick `[x]` kèm bằng chứng ngắn; FAIL/BLOCKED giữ `[ ]` kèm repro/điều kiện thiếu.
- **Verify trước khi commit**: `rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` (cache incremental TỪNG che 44 lỗi thật — luôn xoá trước), rồi `npx vitest run`.
- Commit theo repo (`test(e2e): nghiệm thu ...`) và push `master`. **Lưu ý: nhánh `master` có nhiều người push — luôn `git fetch && git pull --rebase` trước khi push.**
- **Báo cáo cuối**: bảng `hạng mục → PASS / FAIL / BLOCKED-*`, kèm (a) danh sách bug thật tìm được, (b) danh sách seed/điều kiện còn thiếu, (c) đề xuất việc tiếp theo theo thứ tự giá trị.

Chạy Ưu tiên 1 trước (nhanh, phủ rộng), rồi 2, rồi 3.
