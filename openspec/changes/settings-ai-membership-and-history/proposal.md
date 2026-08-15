# settings-ai-membership-and-history — 4 màn Cài đặt mới, và một bước xác nhận trước mọi đường tiền

> **Change hồi tố.** Code đã ship trong đợt 2 (2026-08-15); tài liệu viết SAU theo diff thật.
> Khung rail / nút Back / Riêng tư nằm ở change `settings-shell-appearance-privacy`.

## Why

`pathConfig().profile()` đã khai báo sẵn builder cho `ai-settings`, `ai-subscription`, `membership`,
`learning` từ lâu — **không có route nào tồn tại**, bấm vào là 404. Cùng lúc, tầng gọi API cho các
màn đó (client function + hook SWR + type) đã nằm sẵn trong repo mà không consumer nào dùng.

Riêng phần **mua**: repo chưa có khuôn chung "xác nhận trước khi trả tiền". Nếu mỗi màn tự bấm thẳng
mutation thì người dùng không bao giờ được nói rõ mua GÌ, BAO NHIÊU, qua cổng NÀO trước khi bị đẩy
sang cổng thanh toán.

## What Changes

### `PurchaseConfirmModal` — bước xác nhận dùng chung
- Nêu rõ **mua gì**, **bao nhiêu**, cho **chọn cổng thanh toán**, kèm câu "chưa trừ tiền tới khi bạn
  hoàn tất ở cổng".
- **CHỈ nút confirm TRONG modal** mới gọi mutation. Bấm "Mua" ở màn chỉ mở modal.
- **Lỗi ở lại TRONG modal** kèm câu "chưa trừ tiền — thử lại", không toast rồi điều hướng đi: một
  giao dịch chưa từng bắt đầu không được trông giống một giao dịch đã bắt đầu.
- Picker cổng dùng chung `handleRadioGroupKeyDown` với các radiogroup khác của Cài đặt.
- Chuyển sang cổng dùng `submitCheckout` có sẵn (xử lý cả PayOS redirect lẫn SePay form-POST
  `checkoutFields`) — không tự chế lại.

### AI settings (`/profile/settings/ai-settings`)
- Picker 3 lane (auto / premium / byok) theo roving-focus radiogroup; lane bị khoá theo `canPremium`
  / `canByok` do server trả.
- Card BYOK: chọn provider (gemini / openai), ô key `type="password"` (API **không bao giờ** trả key
  về — chỉ có `byokKeyLast4`), nút "Remove key" → `clearByok`.
- **Logic không tầm thường tách ra `logic.ts` + 6 test vitest:** ô key TRỐNG chỉ được chấp nhận khi
  server ĐÃ có key **VÀ** provider KHÔNG đổi. Đổi Gemini→OpenAI mà không nhập key mới sẽ trỏ tài
  khoản vào provider không có key → mọi lượt gọi AI hỏng ở một lane người dùng tưởng đã cấu hình
  xong; nên builder từ chối và form báo lỗi. Lane không phải BYOK gửi lane một mình, giữ nguyên key
  đã lưu cho lần quay lại (xoá là hành động riêng, tường minh).

### Gói AI (`/profile/settings/ai-subscription`)
- `useQueryAiSubscriptionTiersSwr` (hook này vốn tự gate theo pathname `/profile/settings/ai-subscription`
  — khớp đúng route được tạo) cho danh mục gói, `useQueryMyAiSettingsSwr` để đánh dấu gói đang dùng
  (`myAiSettings.tier` — repo KHÔNG có query "my subscription" riêng).
- **Chỉ danh mục gói mới gate loading/error/empty**; thiếu settings chỉ mất badge "gói hiện tại",
  không chết trang. Giá format bằng `formatVnd` có sẵn. Cổng: PayOS / SePay (đúng như request type
  mô tả).

### Thành viên (`/profile/settings/membership`)
- Card quyền lợi + giá + nút mua, `useMutatePurchaseMembershipSwr`. Cổng: PayOS / SePay / Stripe /
  PayPal / Crypto.
- **CỐ Ý không có trạng thái người xem.** Repo chỉ có mutation `purchaseMembership`; không có query
  nào cho biết viewer đã là hội viên hay hạn tới bao giờ. Bịa ra copy "bạn đã là thành viên" tệ hơn
  là không nói. Vì không có read nên màn này cũng không có nhánh SWR loading/error — lỗi duy nhất nó
  có là lỗi checkout, báo trong modal.

### Lịch sử học (`/profile/settings/learning`)
- Dùng **adapter THẬT của FTES** `useQueryMyCoursesSwr` (features/course/hooks, chạy trên REST
  `GET /courses/me/enrollments` — cùng nguồn với băng home và `/courses/me`), KHÔNG dùng bản GraphQL
  trùng tên trong `hooks/swr`. Nhờ vậy màn này không thể nói khác home về việc học viên đang học gì.
- `SurfaceListCard` + `IconTile` ảnh bìa + `ProgressMeter` + chip "Học thử"/hạn truy cập/hết hạn kỳ;
  ô tìm kiếm chỉ hiện khi ≥4 khoá; skeleton / empty / error+retry.
- **DỪNG Ở HUB.** Bản StarCI còn drill-down timeline theo ngày + outline theo chương; adapter
  enrollment của FTES chỉ mang `completionPercent` tổng, nên không dựng drill-down thay vì bịa số.

## Impact

- Affected specs: `profile-settings-ai` (ADDED), `profile-settings-commerce` (ADDED),
  `profile-course-history` (ADDED)
- Affected code: `Settings/{PurchaseConfirmModal,AiSettingsSection,AiPlanSection,MembershipSection,CourseHistorySection}/`,
  4 route dưới `app/[locale]/profile/settings/`, `Settings/SettingsShell/index.tsx` (thêm 4 mục vào
  rail), `messages/{en,vi}.json`
- **RỦI RO ĐÃ BIẾT — 5 operation GraphQL CHƯA CÓ Ở BE.** FE trỏ GraphQL vào
  `https://apitest.ftes.vn/api/v1/graphql` (FTES-AOS-Backend), và `schema.graphqls` không có
  `myAiSettings`, `updateMyAiSettings`, `aiSubscriptionTiers`, `purchaseAiSubscription`,
  `purchaseMembership` (grep `src/main/java` cũng 0 resolver) — chúng là di sản skeleton StarCI.
  Hệ quả thật trên apitest: AI settings + Gói AI rơi vào nhánh error+retry đã dựng sẵn; Thành viên
  hiện lỗi "không mở được cổng thanh toán" trong modal khi bấm mua. **Chỉ Lịch sử học chạy thật**
  vì nó đi REST. Không sửa schema BE trong change này.
- Không migration.
