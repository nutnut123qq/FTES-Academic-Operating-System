# mascot-moments — Linh vật FTES ngoài onboarding: khoảnh khắc trống / mừng / gợi ý / bản sắc

## Why

`onboarding-mascot-guide` mới chỉ đưa linh vật FTES (husky đeo kính, áo polo FTES) vào **tour
người mới**. Sau khi tour kết thúc, linh vật biến mất khỏi toàn bộ hành trình — mọi màn trống,
mọi cột mốc, mọi lúc người dùng lạc lối đều rơi về icon Phosphor vô hồn. Bản sắc "người bạn dẫn
đường" vừa dựng lên bị bỏ dở ngay sau bước đầu.

Nghiên cứu code thật cho thấy app đã có **≥15 bề mặt zero-data** đi qua đúng 2 block dùng chung
(`EmptyContent`, `EmptyState`) — mỗi block có sẵn slot `icon: ReactNode`. Đây là những khoảnh
khắc người dùng dễ **bỏ ngang nhất** (chưa có khóa, giỏ trống, feed trống, search 0 kết quả,
hồ sơ rỗng…): thay một icon xám bằng linh vật đang **chỉ tay về đúng CTA** biến ngõ cụt thành
lời mời. Ngoài màn trống còn 3 loại khoảnh khắc nữa: **ăn mừng** (nhận hết nhiệm vụ ngày →
linh vật reo mừng), **gợi ý có kiểm soát** (nudge nhẹ, chống làm phiền), và **bản sắc** (một
linh vật DUY NHẤT, một cái tên, một giọng điệu xuyên suốt).

Mục tiêu: mở rộng sự hiện diện linh vật FTES ra ngoài tour → tăng gắn kết & bản sắc thương hiệu,
giảm bỏ ngang ở màn trống, biến cột mốc thành niềm vui — **mà không làm phiền** (mỗi bề mặt có
tần suất/điều kiện hiện hợp lý, nudge có cap + dismiss + persist).

## What Changes

Danh mục các "moment" linh vật, chia **4 nhóm** (mỗi nhóm = 1 capability):

- **`mascot-empty-states`** — Linh vật thay icon mặc định trong slot `icon` của `EmptyContent`/
  `EmptyState` ở ~15 bề mặt zero-data (MyCourses, Cart, CommunityFeed, QuestBoard, SavedLibrary,
  SearchResults, NotificationCenter, Profile Job-readiness, Portfolio, CareerCenter, GroupFeed,
  GroupsList, Marketplace, ActivityTimeline, CommunitySaved). Pose theo ý đồ: `point` (dẫn tới
  CTA) cho màn "chưa có gì → đi tạo/khám phá đi", `explain` (trấn an) cho màn "lọc/tìm ra rỗng"
  hoặc panel hẹp. **Không cap** vì bản thân empty state LÀ nội dung màn; ẩn ngay khi có ≥1 mục.
  Guardrail chống chồng: **mỗi trang chỉ 1 linh vật** (khối neo), các khối/tab/sub-empty còn lại
  giữ icon thường.

- **`mascot-celebrations`** — Linh vật `cheer` ở cột mốc tích cực, phát qua host sự kiện
  gamification. Mốc cụ thể grounded: **nhận hết nhiệm vụ trong ngày** (QuestBoard — nhánh
  all-claimed, KHÁC nhánh empty). Mở rộng (level-up, streak-milestone, hoàn thành khóa đầu) đi
  cùng cơ chế nhưng để seed sau.

- **`mascot-nudges`** — Gợi ý nhẹ có kiểm soát (overlay, KHÔNG phải nội dung màn) đẩy người dùng
  tới hành động kế (vd hoàn tất hồ sơ để mở gợi ý nghề nghiệp). BẮT BUỘC **cơ chế chống nag**:
  1 nudge / loại / thiết bị, **dismissible**, ghi cờ "đã xem" vào localStorage, **KHÔNG hiện khi
  đang chạy tour** (onboarding) và không hiện lại sau khi đóng.

- **`mascot-persona`** — Một linh vật DUY NHẤT: **TÁI DÙNG `FtesMascot`** của
  `onboarding-mascot-guide` (dependency — KHÔNG chế linh vật khác), một tên qua i18n `mascot.name`,
  một giọng điệu thân-thiện xuyên suốt mọi moment. Bao gồm **lời chào khách chưa đăng nhập**
  (guest-gate ở QuestBoard & SavedLibrary — pose `greeting`), nơi linh vật xưng danh & mời đăng
  nhập.

Cơ chế dùng chung (chi tiết ở design.md): cắm linh vật qua slot `icon` sẵn có (không sửa block);
`GamificationEventHost` cho celebration; overlay store cho nudge; localStorage store cho cờ
"seen" nudge (BE flag chỉ dành cho onboarding-completed, theo contract nghiên cứu). Đầy đủ a11y
(reduced-motion, `aria-live` cho copy, linh vật `aria-hidden`, không chặn thao tác).

## Capabilities

### New Capabilities
- `mascot-empty-states`: linh vật trong slot icon của EmptyContent/EmptyState ở ~15 bề mặt
  zero-data, pose theo ý đồ, 1 linh vật/trang, không cap (empty = nội dung).
- `mascot-celebrations`: linh vật `cheer` ở cột mốc (grounded: quest all-claimed) qua host sự
  kiện gamification.
- `mascot-nudges`: gợi ý overlay có cap/dismiss/persist chống nag, không hiện khi đang tour.
- `mascot-persona`: một linh vật + một tên + một giọng xuyên suốt; guest-gate greeting; TÁI DÙNG
  `FtesMascot`.

### Modified Capabilities
- Không đổi hành vi capability nào khác. Chỉ đổi **giá trị prop `icon`** tại call-site của các
  empty state có sẵn (block `EmptyContent`/`EmptyState` KHÔNG sửa) + thêm cờ localStorage cho
  nudge. Contract dữ liệu/điều hướng giữ nguyên.

## Impact

- **FE only.** Không đổi API/BE. Build stays green.
- **Dependency: `onboarding-mascot-guide`** phải cung cấp component `FtesMascot`
  (pose `greeting|explain|point|cheer`, size `sm|md|lg`, idle-motion tắt khi reduced-motion,
  tên `mascot.name`). Change này KHÔNG định nghĩa lại linh vật — chỉ tiêu thụ nó. Cần build
  trước, hoặc build kèm.
- Call-site đổi `icon={<FtesMascot .../>}` tại ~15 empty state (danh sách file ở design.md).
- Cơ chế mới nhỏ: cờ localStorage `ftes:mascot:nudge:{principal}:{type}` (seen), lắng
  `GamificationEventHost` cho celebration, đọc overlay store cho nudge; guard "đang có tour
  overlay" để ẩn nudge.
- i18n: thêm khoá copy cho từng moment dưới namespace `mascot.*` (vi + en), tái dùng `mascot.name`.
