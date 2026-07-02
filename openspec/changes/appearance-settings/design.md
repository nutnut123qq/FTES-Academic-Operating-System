# Design — appearance-settings

## Context

- **Navbar thật là `src/components/features/navbar/Navbar/`** (mount qua `src/app/InnerLayout.tsx`). Nút dark/light hiện tại (`AccountMenuDropdown/DarkLightModeSwitch/index.tsx` — HeroUI `Switch` + next-themes) được render ở **2 chỗ trong navbar**, KHÔNG nằm trong account dropdown (dropdown ghi rõ "Language + theme live in the navbar itself"):
  1. hàng inline desktop (`hidden md:flex`, cạnh `LanguageDropdown`, ~dòng 114);
  2. hàng "Giao diện" trong mobile Drawer (~dòng 182, nhãn `nav.appearance` đã có sẵn i18n).
  Vì navbar hiển thị bất kể auth, thay nút tại 2 chỗ này tự nhiên phủ luôn **khách chưa đăng nhập** — không cần entry riêng trong dropdown.
- **Cây legacy `src/components/layouts/shell/Navbar/**`** (có `DarkLightMode/`, `AppearanceRow/`, `MobileNavbar`) KHÔNG được mount ở đâu — để nguyên, chỉ là bản chết chờ dọn riêng.
- **Token accent**: `globals.css` định nghĩa `--accent: oklch(70.03% 0.2092 354.13)` (hồng) + `--accent-foreground: oklch(100% 0 0)` giống hệt nhau ở cả block light (`[data-theme="light"]`, dòng 40–41) và dark (dòng 91–92). HeroUI + Tailwind tokens đều ăn theo biến này.
- **AmbientBackground** (`src/components/blocks/layout/AmbientBackground/index.tsx`): pure presenter, `fixed inset-0 -z-10`, 60 sparks seeded deterministic (hash theo index, không `Math.random` lúc render → hydration-safe), màu `var(--accent)`, keyframe `emberRise` + guard `prefers-reduced-motion` trong `globals.css`, glow radial ở đáy. `InnerLayout` render nó khi không phải route learn.
- **Modal canon**: modal global mount tại `src/components/modals/ModalContainer.tsx`, open qua overlay zustand (`useOverlayHandle(key)` trong `src/hooks/zustand/overlay/`). Luật nhà (rules/drafts): overlay mở TỪ TRONG popover phải render in-panel (z-fight `@apply z-50` baked) — nhưng ở đây nút nằm trần trong navbar (desktop) hoặc trong Drawer (mobile, **đóng drawer trước khi mở modal**) → modal global an toàn, không fight z-index.
- Ràng buộc chung: FE-only, `npm run build` (webpack) + `tsc --noEmit` phải sạch; không emoji trong UI; i18n vi+en.

## Goals / Non-Goals

**Goals**
- Một nút "Giao diện" duy nhất mở modal cài đặt: chế độ sáng/tối/hệ thống, màu chủ đạo, hiệu ứng nền (bật/tắt + hướng).
- Mặc định mới: accent **#3F51B5**, hiệu ứng **BẬT + rơi xuống như sao băng**.
- Persist localStorage, áp lại sau reload không flash màu sai; reduced-motion luôn thắng.
- Giữ AmbientBackground thuần CSS animation + deterministic seeding.

**Non-Goals**
- Không có color picker tự do (chỉ preset curated) — tránh cặp foreground không đạt contrast.
- Không sync lên server/per-account (localStorage per-device là đủ ở FE-only).
- Không sửa/dọn cây legacy `layouts/shell` trong change này.
- Không đổi hành vi next-themes ngoài việc thêm lựa chọn `system`.

## Decisions

### D1 — Store shape: zustand `persist`, tách khỏi next-themes

`src/hooks/zustand/appearance/store.ts`:

```ts
type AccentId = "indigo" | "pink" | "teal" | "emerald" | "amber" | "violet"
type EffectDirection = "rise" | "fall"
type EffectSpeed = "slow" | "normal" | "fast"

interface AppearanceState {
    accent: AccentId            // default "indigo" (#3F51B5)
    effectEnabled: boolean      // default true
    effectDirection: EffectDirection // default "fall"
    effectSpeed: EffectSpeed    // default "normal"
    setAccent: (id: AccentId) => void
    setEffectEnabled: (on: boolean) => void
    setEffectDirection: (d: EffectDirection) => void
    setEffectSpeed: (s: EffectSpeed) => void
}
// persist(..., { name: "ftesaos-appearance" }) — localStorage
```

- **Chế độ sáng/tối KHÔNG vào store này** — next-themes đã sở hữu + persist key `theme` riêng và có sẵn script chống flash. Modal gọi thẳng `useTheme().setTheme("light"|"dark"|"system")`. Nhét theme vào store mới = 2 nguồn sự thật.
- Alternative bị loại: cookie (như cookieConsent) — không cần đọc từ server, localStorage + persist là canon nhà cho preference FE.

### D2 — Áp accent = `data-accent` trên `<html>` + CSS block, KHÔNG inline style

- `globals.css` thêm block cho từng preset, đặt **sau** block theme để thắng theo source-order, mỗi block set cả `--accent` + `--accent-foreground` (giá trị dùng chung light/dark, giống pattern hiện tại):

```css
[data-accent="indigo"]  { --accent: #3F51B5; --accent-foreground: oklch(100% 0 0); }
[data-accent="pink"]    { --accent: oklch(70.03% 0.2092 354.13); --accent-foreground: oklch(100% 0 0); }
/* … teal / emerald / amber / violet, mỗi màu đủ đậm để foreground trắng đạt ≥ 4.5:1 */
```

- Bảng preset (id, hex/oklch, khoá tên i18n) sống ở `src/resources/constants/appearance.ts` — modal render swatch từ bảng này, CSS là nguồn giá trị áp thật. **Mặc định `indigo` cũng phải được ghi vào default của `[data-theme]` block** (đổi giá trị `--accent` gốc dòng 40/91 sang #3F51B5) để trạng thái "chưa từng có localStorage" đã là xanh mà không cần attribute.
- Foreground: mọi preset chọn tông 500–600 đủ đậm để chữ trắng đạt contrast — ghi chú kiểm tra trong tasks.
- Alternative bị loại: inline `style.setProperty` trong effect (flash 1 frame màu cũ, khó SSR); theme HeroUI riêng per màu (nặng, thừa).

### D3 — Chống flash: script inline pre-paint cho accent, store-hydration cho effect

- **Accent** nhìn thấy ngay khi paint (nút, link) → cần đúng trước first paint. Thêm `<script>` inline nhỏ trong `src/app/layout.tsx` (trước nội dung, cùng chỗ họ script của next-themes): đọc `localStorage["ftesaos-appearance"]`, parse `state.accent`, set `document.documentElement.dataset.accent`; try/catch nuốt lỗi (private mode). Đây chính là chiến lược next-themes đang dùng cho `class="dark"`.
- **Effect config** (enabled/direction) KHÔNG cần pre-paint: spark bắt đầu `opacity: 0` và keyframe chỉ hiện dần sau ~1s → zustand persist hydrate trong vài ms là quá đủ, không flash cảm nhận được. `InnerLayout` đọc store sau hydrate; trước hydrate render theo default (blue + fall) cũng vô hại vì vô hình ở giây đầu.
- Alternative bị loại: cookie + SSR read (đổi cả kiến trúc lưu); ẩn toàn app tới khi hydrate (tệ hơn bệnh).

### D4 — AmbientBackground: thêm prop, giữ presenter thuần; InnerLayout đọc store

- `AmbientBackgroundProps` thêm `direction?: "rise" | "fall"` (default `"fall"`) + `speed?: "slow" | "normal" | "fast"` (default `"normal"`). Component vẫn **pure presenter** (không tự đọc store — giữ đúng docstring hiện tại); `InnerLayout` (đã là client component render có điều kiện theo route) đọc `useAppearanceStore` → `{effectEnabled, effectDirection, effectSpeed}` và render `{!isLearnRoute && effectEnabled ? <AmbientBackground direction={effectDirection} speed={effectSpeed} /> : null}`.
- **Tốc độ (`effectSpeed`)**: hệ số nhân duration `SPEED_FACTOR = { slow: 1.6, normal: 1.0, fast: 0.55 }` áp trên base-duration mỗi spark (`animationDuration = baseDuration * factor`) cho CẢ `emberRise` (rise) LẪN `meteorFall` (fall). `InnerLayout` truyền `speed` (hoặc `AmbientBackground` đọc từ props) → nhân vào `animationDuration` inline per-spark; KHÔNG đổi công thức seed (left/size/delay/drift giữ nguyên → deterministic không đổi). Mặc định `normal` (×1.0). Reduced-motion guard vẫn `animation: none !important` → thắng bất kể tốc độ.
- **Base-duration nhanh hơn (chống "chậm quá")**: hạ base-duration seeded — fall ≈ **4–7s/spark** ở `normal` (thay ~8–18s cũ lê thê) để rơi dứt khoát; rise base tương ứng. Mặc định GIỮ `effectSpeed=normal` (KHÔNG đổi sang `fast`); chỉ hạ base để `normal` đã đủ nhanh, `fast` (~×0.55 → ~2.5–4s) cho mưa sao băng dồn dập.
- **Rise** giữ nguyên hành vi: class `ambient-ember`, keyframe `emberRise`, spark tròn mọc từ `bottom-0`, glow ở đáy (duration nhân theo tốc độ; count rise = 60).
- **Fall (MƯA sao băng CHÉO)**: cùng công thức seed (left/size/delay/drift theo index — deterministic không đổi), nhưng **count phụ thuộc hướng**: `COUNT = { rise: 60, fall: 120 }` — fall dày gấp ~2× để đọc ra MƯA sao băng (không lác đác vài vệt). Mỗi spark render thành **vệt chéo**: phần tử đặt `top-0`, cao `size * 7`px, rộng `size`px, `border-radius: 9999px`, `background: linear-gradient(to top, var(--accent), transparent)` (đầu sáng dẫn trước, đuôi mờ = đuôi sao chổi ngược hướng bay). Quỹ đạo canonical **top-right → bottom-left**, nghiêng ~20–35° so với phương đứng. **Vệt phải được `rotate` để trục dài trùng phương bay chéo** — góc tính sẵn inline per-spark từ `atan2(Δx, Δy)` của (drift, quãng rơi), truyền qua CSS var (vd `--tilt`) và áp bằng `rotate(var(--tilt))` trong keyframe (giữ nguyên xuyên suốt animation, chỉ `translate` thay đổi). Glow radial neo góc **trên-phải** (`top-0 right-0`, gradient `at 100% -20%`) khi fall — nguồn phát sao băng.
- Keyframe mới `meteorFall` phải **gộp translateX + translateY** (rơi chéo, không thẳng đứng) và giữ `rotate(var(--tilt))` để trục vệt trùng hướng bay. `--drift` mang giá trị ÂM (đi sang trái) cho quỹ đạo canonical top-right → bottom-left:

```css
@keyframes meteorFall {
    0%   { transform: translate3d(0, -15vh, 0) rotate(var(--tilt, -22deg)); opacity: 0; }
    10%  { opacity: 1; }
    80%  { opacity: 0.8; }
    100% { transform: translate3d(var(--drift, -30vw), 110vh, 0) rotate(var(--tilt, -22deg)); opacity: 0; }
}
```

- **⚠️ `meteorFall` phải được CẬP NHẬT** từ bản cũ (chỉ `translateY`, rơi thẳng) sang bản trên: thêm `translateX` (drift âm) + `rotate(var(--tilt))` để vệt rơi CHÉO và trục đuôi trùng phương bay. Đây là điểm sửa chính của delta hướng-mới ("cho nó rơi chéo").

- Guard reduced-motion mở rộng: `.ambient-ember, .ambient-meteor { animation: none !important; opacity: 0 !important; }` — tắt hiển thị bất kể setting.
- **Hiệu năng**: vẫn transform/opacity-only, thuần CSS, không rAF/JS loop. Count theo hướng (rise 60 / fall 120); fall 120 vệt vẫn ổn vì thuần CSS transform (GPU-composited), không JS per-frame.
- Alternative bị loại: component đọc store trực tiếp (phá presenter, khó test); canvas (nặng, thừa).

### D5 — Entry point + modal

- **Nút**: HeroUI `Button isIconOnly variant="tertiary"` icon `PaletteIcon` (phosphor, `size-5`), `aria-label={t("appearance.title")}`, đặt thế chỗ `DarkLightModeSwitch` ở cả 2 vị trí. Ở mobile drawer, `onPress` = `setDrawerOpen(false)` rồi `openAppearance()` (đóng surface chứa trước khi mở modal — cùng lý do account dropdown đóng trước, tránh chồng overlay).
- **Overlay key**: thêm `"appearance"` vào `OverlayKey` (`src/hooks/zustand/overlay/store.ts`) + `useAppearanceOverlayState` trong `hooks.ts` (theo factory `useOverlayHandle`).
- **`AppearanceModal`** (`src/components/modals/AppearanceModal/index.tsx`, mount thêm vào `ModalContainer`) — mirror cấu trúc `LanguageModal`: `Modal > Backdrop > Container > Dialog > CloseTrigger/Header/Body`. Decomposition:
  - `ModeSection` — 3 lựa chọn light/dark/system, render bằng radiogroup segmented (mỗi option icon Sun/Moon/Desktop + label); đọc/ghi `useTheme()`.
  - `AccentSection` — lưới swatch từ bảng preset; **radiogroup** (`role="radiogroup"` + từng swatch `role="radio"` `aria-checked`), mỗi swatch có tên màu accessible (`aria-label` = tên i18n), swatch chọn có ring + icon check (không chỉ dựa màu); swatch đầu ghi chú "(mặc định)".
  - `EffectSection` — `Switch` bật/tắt + radiogroup 2 hướng ("Bay lên" / "Rơi xuống như sao băng") + radiogroup 3 tốc độ ("Chậm" / "Vừa" / "Nhanh", mặc định "Vừa"); nhóm hướng + nhóm tốc độ đều disabled (visually + aria) khi toggle off.
- Vì background đổi ngay khi state đổi (modal mở trên nền), mọi control áp **ngay lập tức** (live preview), không có nút Lưu — persist tự động qua middleware.
- **Migration nút cũ**: xoá thư mục `AccountMenuDropdown/DarkLightModeSwitch/` sau khi navbar hết import; key i18n `nav.appearance` (đã có, nghĩa "Giao diện") tái dùng cho hàng drawer.

### D6 — i18n

Cụm `appearance.*` (vi + en): `title`, `mode.{label,light,dark,system}`, `accent.{label,default}`, `accent.names.{indigo,pink,teal,emerald,amber,violet}`, `effect.{label,enabled,direction,rise,fall}`, `speed.{label,slow,normal,fast}`. Copy vi chốt: "Giao diện", "Màu chủ đạo", "Hiệu ứng nền", "Bay lên", "Rơi xuống như sao băng", "Tốc độ", "Chậm", "Vừa", "Nhanh".

## Risks / Trade-offs

- [Script inline pre-paint chạy trước hydration, có thể lệch với store nếu key/format đổi] → format persist của zustand là `{"state":{...},"version":0}`; script parse đúng path `state.accent`, try/catch, và constant tên key dùng chung 1 nguồn (`appearance.ts`) để không trôi.
- [Đổi default accent hồng → xanh đổi diện mạo toàn app cho user cũ] → chủ đích của thầy; user muốn hồng chọn lại swatch "pink" (giữ đúng giá trị oklch cũ).
- [Modal mở từ trong mobile Drawer có nguy cơ z-fight (backdrop `@apply z-50` baked)] → đóng drawer trước khi mở modal global (D5), không render modal lồng trong drawer.
- [Vệt sao băng chéo có thể lệch góc `rotate` so với quỹ đạo `translate` thật] → góc `--tilt` tính sẵn từ `atan2(Δx, Δy)` = (drift, quãng đường rơi) per-spark, khớp đúng phương bay; sai số nhỏ chấp nhận được về thẩm mỹ, không chặn release. Quỹ đạo canonical top-right → bottom-left (~20–35° khỏi phương đứng) để đọc ra sao băng thật, không giọt rơi thẳng.
- [`InnerLayout` subscribe store → re-render khi đổi setting] → selector hẹp (`effectEnabled`, `effectDirection`), đổi setting là hành vi hiếm.

## Migration Plan

1. Land store + CSS (data-accent, meteorFall) + script pre-paint → mặc định xanh/fall hoạt động không cần UI.
2. Land AmbientBackground prop + InnerLayout wiring.
3. Land modal + thay nút navbar (xoá DarkLightModeSwitch của cây live).
4. Rollback = revert commit (FE-only, không migration dữ liệu; localStorage key cũ vô hại nếu revert).

## Open Questions

- 4 màu curated còn lại (teal/emerald/amber/violet) lấy giá trị chính xác nào — chọn lúc implement theo chuẩn contrast ≥ 4.5:1 với chữ trắng; không chặn spec.
