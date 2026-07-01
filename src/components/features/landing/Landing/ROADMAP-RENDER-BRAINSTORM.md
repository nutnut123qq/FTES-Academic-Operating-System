# Landing roadmap — render brainstorm (2026-06-24)

> Section "Ba lộ trình · Một tư duy". Data static (i18n `landing.courses.*` + `LANDING_ROADMAP_TIERS`): 3 track × 4 tầng (Foundation→Application) + topic + module + "Vào khóa". KHÔNG BE.

## Vấn đề
Render cũ = HeroUI `Table` (4 cột × 3 hàng) → đúng data nhưng **phẳng**, chưa kể được "journey" + chưa làm nổi cái **trục chung 4 tầng** (= "MỘT tư duy").

## 3 hướng (ref-grounded)
- **A · Metro map — "một trục, ba tuyến" ✅ CHỐT** (ref: metro/subway map · roadmap.sh node-edge): 1 trục 4 ga dùng CHUNG trên đỉnh; mỗi track = 1 tuyến màu chạy qua 4 ga, node = topic tầng đó, ga cuối (Application) = đích đậm + "Vào khóa". Literal hoá đúng tagline (3 tuyến, 4 ga chung); thấy hết info; kể được journey. On-brand academy kỹ thuật.
- **B · Journey stepper per-track** (roadmap.sh · Duolingo path): mỗi track 1 stepper 4 node nối line. Rõ tiến trình từng track nhưng lặp 4 node 3 lần (kém "trục chung").
- **C · Tier-tab reveal**: 4 tab tầng → 3 thẻ track. Gọn + tương tác nhưng GIẤU info sau tab (landing bán hàng muốn thấy hết).

## ĐÃ ÁP DỤNG 2026-06-24 (hướng A)
- Block mới **`blocks/marketing/RoadmapMetro`** (tier-3, style owns): props `{ stations: string[], tracks: [{key, icon, title, meta, color, stops, viewLabel, onView}] }`. Trục ga chung (header) + mỗi track 1 line: identity + CTA (col 1) → 4 ga (dot ring + topic), rail màu `bg-{color}/40` nối ga, ga cuối filled `bg-{color}` + font-medium. `overflow-x-auto` + `min-w-[680px]` (mobile cuộn ngang, ga thẳng cột). "Vào khóa" = Link `group` + `CaretRightIcon group-hover:translate-x-1` + nhãn `group-hover:underline`.
- Màu tuyến: fullstack=accent · systemDesign=success · devops=warning (`TRACK_LINE_COLOR` ở feature).
- `Landing/index.tsx`: thay khối Table/line-matrix bằng `<RoadmapMetro>` (data từ `LANDING_ROADMAP_TIERS` + i18n). Gỡ import `Table` + `CaretRightIcon` (thừa). tsc/eslint sạch.
- Nhãn tầng UPPERCASE (FOUNDATION…) giữ nguyên — micro-label kỹ thuật cho phép trên landing (theo comment constants), ngoại lệ có chủ đích của [[no-uppercase-text]].
