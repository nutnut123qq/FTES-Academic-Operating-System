# package-gate-compact — Gọn lại modal đăng ký khi nhấp bài học thử + bỏ dòng "đã sở hữu N khóa học"

## Why
Khi học viên nhấp vào một bài học thử bị khoá, `PackageGateModal` mở ra để mời đăng ký.
Modal đang quá "rộng và thưa": dialog `max-w-2xl`, thumbnail `w-28`, thân modal `gap-4`,
mỗi card gói `p-4`/`gap-3` với **cột giá dựng tay 3 dòng** (giá bán · giá gốc gạch · chip −%)
dùng gap lẻ `gap-0.5`/`gap-1.5` ngoài thang cách chuẩn nhà (2·3·4). Cột giá dựng tay này lặp
lại đúng thứ block `PriceTag` đã làm — vi phạm luật "đừng hand-roll, tái dùng block nhà".

Ngoài ra còn key i18n `payment.loyalty.enrolled` = "Bạn đã sở hữu {count} khóa học" — dòng
"loyalty" mà học viên KHÔNG cần thấy trong luồng đăng ký. Key này thực chất đã CHẾT: prop
`breakdown.loyaltyNote` của `PriceTag` (nơi duy nhất render được câu này) không có bất kỳ nơi
nào truyền vào (grep 0 consumer) → key mồ côi ở cả `vi.json` lẫn `en.json`.

## What Changes
- **Bỏ dòng "đã sở hữu N khóa học"** — gỡ key chết `payment.loyalty.enrolled` khỏi cả
  `messages/vi.json` ("Bạn đã sở hữu {count} khóa học") lẫn `messages/en.json`
  ("You own {count} courses"). Không component nào render nó (dead key), nên modal đăng ký
  chắc chắn không còn dòng sở hữu. Giữ nguyên key anh em `payment.loyalty.diligent`.
- **Gọn modal (nhánh trọn khoá + nhánh bán theo gói)** — cùng một compaction cho cả hai:
  - Dialog `max-w-2xl` → `max-w-lg`; thumbnail cover `w-28` → `w-20`; thân modal `gap-4` → `gap-3`;
    lưới gói `gap-3` → `gap-2`; skeleton `gap-3`/`h-24` → `gap-2`/`h-20`.
  - Mỗi card gói (`PackageGateCard`) và card trọn khoá (`WholeCourseGateCard`): `p-4`/`gap-3`
    → `p-3`/`gap-2`, các gap lẻ ngoài thang (0.5/1.5/1) đưa về thang 2·3·4.
  - **Thay cột giá dựng tay bằng block `PriceTag`** (`size="sm"`): giá bán (đậm) + giá gốc gạch
    + chip `−X%` gói gọn 1 hàng, thay cụm 3 dòng dọc. Bỏ luôn hàm cục bộ `formatPrice` + biến
    `discount` (giờ `PriceTag` tự suy) → hết code trùng.
- **Giữ nguyên hành vi**: tab/nội dung tóm-tắt-thanh-toán không có trong modal này nên không đụng;
  luồng checkout (resolve product → add cart → `PaymentModal` / free-enroll) và mọi CTA
  ("Chọn gói này" / "Đăng ký khóa học") giữ nguyên. Chỉ compaction hình + bỏ 1 dòng.

## Impact
FE-only, KHÔNG cần API mới. Sửa `PackageGateModal/index.tsx` (+ test mock thêm `Chip.Label`
để `PriceTag` render chip an toàn), `messages/vi.json`, `messages/en.json`. `WholeCourseGateCard`
được `CourseDetail` tái dùng — vẫn hoạt động (23 test course xanh). `tsc --noEmit` sạch.
