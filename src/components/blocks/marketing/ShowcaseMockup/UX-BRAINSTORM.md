# ShowcaseMockup — block khung trình duyệt tái dùng (3-màu · tilt · nền)

> Brainstorm `/starci-fe-ux-brainstorm` (2026-06-26). KHÔNG code ở bước này — chốt API + hướng thị giác.
> Mục tiêu: 1 block dùng lại cho nhiều hero/section, đổi **nội dung** + **bộ 3 màu** + **độ nghiêng** + **nền** qua props,
> không vẽ lại mỗi lần.

## Vấn đề (grounded)
- Landing hiện có `blocks/marketing/MicroservicesDiagram` = card "order-service.v2": **gộp cứng** browser-chrome
  (3 chấm + label) + nền dotted-grid + nội dung topology trong 1 file (211 dòng). **Chưa tilt, chưa tách khung, màu hardcode.**
- Muốn thêm 1 hero kiểu Uni Education (card sáng, nghiêng, mascot, list) → hiện phải dựng lại khung từ đầu.
- → Tách phần **KHUNG** (chrome + tilt + nền + theme) thành block; nội dung là **slot**. `MicroservicesDiagram` trở thành
  1 instance nội dung đặt bên trong.

## Ref (đã soi)
- **DaisyUI `mockup-browser`** — chuẩn "frame + toolbar slot + content slot" (chrome bao quanh, nội dung tự do).
- **Magic UI `Safari`** — 1 component, props `url` + content. (API gọn cho hero.)
- **Aceternity tilt / Comet 3D card** — perspective `rotateY/rotateX` cho độ nghiêng; Linear/Stripe hero dùng cùng kỹ thuật.
- Nguồn: daisyui.com/components/mockup-browser, magicui.design/docs/components/safari, ui.aceternity.com/categories/tilt.

## API đề xuất (composition kiểu DaisyUI — slot tự do)
```tsx
<ShowcaseMockup
  url="unieducation.vn/tim-gia-su"     // address bar (bỏ = ẩn). hoặc title=
  theme={SHOWCASE_THEMES.aqua}          // preset 3 màu (xem dưới)
  tilt="left"                           // "left" | "right" | "none"  (perspective ±; mobile auto none)
  backdrop="glow"                       // "glow" | "stars" | "grid" | "none"
  straightenOnHover                     // optional: hover → rotate 0 (Aceternity-style)
>
  {/* slot nội dung — render gì cũng được: list, diagram, ảnh, mascot... */}
</ShowcaseMockup>
```
- **Composition, KHÔNG nhồi data**: block chỉ lo KHUNG. Nội dung (list gia sư / topology / ảnh) là `children` của feature.
- `MicroservicesDiagram` → `<ShowcaseMockup theme={dark} tilt="none" backdrop="stars" url="order-service.v2">{topology}</ShowcaseMockup>`.

## Tham số hoá "3 màu" (chốt)
1 theme = bộ token set qua `style` trên root, mọi lớp con (chrome/backdrop/slot) đọc `var(--sc-*)`:
```ts
interface ShowcaseTheme {
  c1: string   // màu CHÍNH (accent/focal)      → glow chính, node nhấn, dot 1
  c2: string   // màu PHỤ/cảnh báo               → annotation, dot 2
  c3: string   // màu DỮ LIỆU/bổ trợ             → node phụ, dot 3
  base: "light" | "dark"  // quyết định surface card + tông chrome + chữ
}
// presets: SHOWCASE_THEMES = { aqua(blue/teal/purple-light), starci(pink/amber/teal-dark), slate(purple/green/coral-light) }
```
- Root: `style={{ "--sc-1": c1, "--sc-2": c2, "--sc-3": c3 }}` + class theo `base` (light/dark surface).
- → đổi cả hệ màu chỉ bằng đổi 1 object; **content viết theo `var(--sc-1/2/3)`** thì tự đổi theo theme.
- Mặc định preset map vào token hệ (accent/warning/success) để khỏi bịa hex; cho phép override hex tự do.

## Cấu trúc layer (z thấp→cao)
1. **Backdrop** (absolute, sau card): `glow` = radial từ c1+c2 · `stars` = chấm thưa (như landing dark) · `grid` = lưới svg · `none`.
2. **Tilt wrapper**: `perspective(800px)` + inner `rotateY(±6–9deg) rotateX(2–3deg)`; `transform-style: preserve-3d`.
3. **Card**: `rounded-2xl border bg-[surface theo base]`.
4. **Chrome bar**: 3 chấm (`size-2.5 rounded-full`) + address pill (mono, `url`) — copy y khung hiện có.
5. **Slot**: `children` (overflow-hidden, padding chuẩn).

## 3 HƯỚNG (đã vẽ widget — anh chọn)
| | Theme/base | Tilt | Backdrop | Dùng cho |
|---|---|---|---|---|
| **A** ⭐ | sáng (aqua) | nghiêng | glow | hero marketing (kiểu Uni Education) — nổi, "sản phẩm thật" |
| **B** | tối (starci) | phẳng | stars | giữ đúng StarCi hero hiện tại, chạy qua block |
| **C** | sáng (slate) | nghiêng nhẹ ngược | grid | section nội dung/docs, nhẹ nhàng |

→ **Đề xuất A làm mặc định** (tilt+glow = ấn tượng, đúng ý "nghiêng + có nền"), nhưng cả 3 chỉ là **props của 1 block** —
B = `MicroservicesDiagram` refactor vào, không mất look cũ.

## Responsive + a11y
- `< md`: `tilt="none"` (bỏ perspective — tránh tràn/khó đọc), backdrop nhẹ hơn, address bar `truncate`.
- `prefers-reduced-motion`: tắt straighten-on-hover + mọi transition.
- Chrome dots `aria-hidden`; card có `role="img"` + `aria-label` mô tả khi nội dung thuần trang trí; nội dung thật thì để DOM thật đọc được.
- KHÔNG shadow nặng (theo card global: border + no shadow); glow là backdrop riêng, không phải box-shadow của card.

## Cắt / không làm
- Không làm device-frame iPhone/Safari-chrome cầu kỳ (chỉ generic browser chrome — đủ + nhẹ).
- Không animate topology bên trong ở block (animation thuộc nội dung/feature, không thuộc khung).

## Bước sau
`/starci-fe-ux-apply ShowcaseMockup` → dựng block `blocks/marketing/ShowcaseMockup` + `SHOWCASE_THEMES` + refactor
`MicroservicesDiagram` thành nội dung đặt trong block (theme B). Verify tsc/eslint + soi localhost.
