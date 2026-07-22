# mascot-moments — Linh vật FTES xuất hiện đúng lúc trên các surface (celebration · nudge · empty-state)

## Why

Change `onboarding-mascot-guide` dựng linh vật FTES + engine tour cho người MỚI. Nhưng linh
vật chỉ sống trong tour thì phí: các "khoảnh khắc" thường ngày (dọn sạch nhiệm vụ, lên cấp,
giỏ hàng trống, không có kết quả tìm kiếm, hồ sơ còn sơ sài) hiện đang trơ hoặc empty-state
generic. Đây là cơ hội để linh vật cổ vũ / dẫn dắt đúng ngữ cảnh, tăng gắn kết mà KHÔNG làm
phiền.

Vấn đề nếu làm ẩu: linh vật nhảy ra khắp nơi = nag. Nên change này gom mọi "moment" vào một
tập primitive có luật chống-nag rõ ràng (1 linh vật/trang, dismissible, không đè lên tour,
tần suất khoá bằng localStorage) thay vì rải `FtesMascot` tuỳ hứng.

## What Changes

- **Primitive moment tái sử dụng:**
  - `MascotCelebration` — banner cổ vũ (pose `cheer`) hiện **tối đa 1 lần/ngày/thiết bị**
    (khoá bằng day-stamp), dismissible, **KHÔNG hiện khi đang có tour** (`useTour().isActive`)
    và không "đốt" lượt trong ngày khi bị hoãn vì tour → hiện lại được khi tour kết thúc.
  - `MascotProfileNudge` — nudge (pose `point`) mời hoàn thiện hồ sơ, hiện **tối đa 1
    lần/thiết bị** (dismiss vĩnh viễn), chỉ khi hồ sơ thực sự sơ sài, không khi đang tour.
- **Empty-state có linh vật** trên các surface có sẵn (thay icon generic bằng `FtesMascot`
  đúng pose theo sắc thái): giỏ hàng trống, feed cộng đồng trống, "Khoá học của tôi" trống,
  thư viện đã lưu (gate khách + empty theo tab), tìm kiếm không kết quả, bảng nhiệm vụ
  (gate khách + empty).
- **Celebration modal lên cấp** — `GamificationEventHost` dùng linh vật pose `cheer` trong
  modal lên cấp (tái dùng cho badge/streak milestone khi các diff đó land).
- **Persistence** localStorage `ftes.mascot.*`: `celebration.<id>` = day-stamp `YYYY-MM-DD`,
  `nudge.<id>` = đã-dismiss. Degrade an toàn khi SSR / private mode.
- **A11y & i18n:** linh vật `aria-hidden` (trang trí), copy nằm trong bong bóng có
  `aria-live`; mọi copy moment có key vi/en; reduced-motion tắt nhún.

Xem bảng danh mục moment (surface · file · pose · trigger · copy key · frequency) trong
`design.md`.

## Capabilities

### New Capabilities
- `mascot-moments`: các khoảnh khắc linh vật ngoài tour — celebration once-per-day, nudge
  once-per-device, empty-state có linh vật, celebration modal lên cấp, luật chống-nag +
  persistence + a11y/i18n.

### Modified Capabilities
- Không đổi contract dữ liệu của gamification / cart / community / saved / search — chỉ thay
  nội dung empty-state và thêm celebration/nudge (thuần FE, không đụng BE).

## Impact

- FE only. Không đổi API/BE. Build stays green.
- Component mới: `MascotCelebration`, `MascotProfileNudge` (dir `features/mascot-moments/`),
  persistence `mascot-moments/persistence.ts`.
- Điểm cắm (đã tích hợp): `CartShell`, `CommunityFeed`, `MyCourses`, `SavedLibrary`,
  `SearchResults`, `QuestBoard`, `GamificationEventHost`.
- Dùng lại `FtesMascot` / `MascotBubble` / `useTour` từ `onboarding-mascot-guide` (change này
  phụ thuộc change đó).
- i18n `mascot.*` + copy empty-state/celebration của từng surface (vi/en).
</content>
