# Tasks

## 1. Bước xác nhận dùng chung
- [x] 1.1 `PurchaseConfirmModal`: mua gì / bao nhiêu / chọn cổng / dòng "chưa trừ tiền"
- [x] 1.2 Chỉ confirm trong modal mới gọi mutation
- [x] 1.3 Lỗi ở lại trong modal kèm câu "chưa trừ tiền — thử lại"
- [x] 1.4 Picker cổng dùng `handleRadioGroupKeyDown`; chuyển cổng bằng `submitCheckout` có sẵn

## 2. AI settings
- [x] 2.1 Picker 3 lane roving-focus, khoá lane theo `canPremium` / `canByok`
- [x] 2.2 Card BYOK: provider + ô key `type="password"` + hiển thị `byokKeyLast4` + nút xoá key
- [x] 2.3 `logic.ts`: `buildAiSettingsRequest` + `buildClearByokRequest`
- [x] 2.4 `logic.test.ts` — 6 test, tập trung nhánh từ chối khi đổi provider mà không nhập key
- [x] 2.5 AsyncContent: skeleton + error + retry
- [x] 2.6 Route `/profile/settings/ai-settings`

## 3. Gói AI
- [x] 3.1 Danh mục gói qua `useQueryAiSubscriptionTiersSwr`, đánh dấu gói hiện tại từ `myAiSettings.tier`
- [x] 3.2 Chỉ danh mục gate loading/error/empty; thiếu settings chỉ mất badge
- [x] 3.3 Giá bằng `formatVnd`; cổng PayOS / SePay
- [x] 3.4 Route `/profile/settings/ai-subscription`

## 4. Thành viên
- [x] 4.1 Card quyền lợi + giá + nút mua; cổng PayOS/SePay/Stripe/PayPal/Crypto
- [x] 4.2 Docblock ghi rõ vì sao KHÔNG hiển thị trạng thái hội viên (không có query nào)
- [x] 4.3 Route `/profile/settings/membership`

## 5. Lịch sử học
- [x] 5.1 Dùng `useQueryMyCoursesSwr` của features/course (REST), không dùng bản GraphQL trùng tên
- [x] 5.2 `SurfaceListCard` + `IconTile` + `ProgressMeter` + chip học thử / hạn truy cập
- [x] 5.3 Ô tìm kiếm hiện khi ≥4 khoá; skeleton / empty / error+retry
- [x] 5.4 Route `/profile/settings/learning`

## 6. Rail + i18n + verify
- [x] 6.1 Thêm 4 mục vào rail `SettingsShell` qua builder `pathConfig()` sẵn có
- [x] 6.2 i18n en + vi cho toàn bộ chuỗi mới
- [x] 6.3 `npx tsc --noEmit`
- [x] 6.4 `npx vitest run` cho `AiSettingsSection/logic.test.ts`
- [ ] 6.5 Nghiệm thu runtime trên apitest — KHÔNG THỂ với 3/4 màn: 5 operation GraphQL chưa có ở BE
- [ ] 6.6 E2E trình duyệt — CHƯA làm (cấm dựng dev server trong phiên này)
