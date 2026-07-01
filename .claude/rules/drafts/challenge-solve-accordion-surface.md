# Draft — Accordion trong trang GIẢI challenge (ChallengeView) dùng `variant="surface"`, KHÔNG `bg-default` (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (Accordion) + **đính chính** [[accordion-default-fill-everywhere]]
  (đã liệt ChallengeView là default) + đồng bộ [[accordion-card-surface-on-standalone-pages]].
- Bối cảnh: trang **giải 1 challenge** (`/learn/content/modules/<m>/contents/<c>/challenges/<id>` → `ChallengeView`),
  các khối "Yêu cầu" · "Các bước hướng dẫn" · "Gợi ý" trước đó render `variant="default" + bg-default` (theo
  [[accordion-default-fill-everywhere]]). Thầy: *"cái accordion này render kiểu bg-surface được không"*.

## Luật (STRICT)
- **ChallengeView (trang giải đề, full-bleed standalone) → accordion `variant="surface"`** (HeroUI bake `bg-surface`
  = màu card + `rounded-3xl`), KHÔNG `bg-default`. Lý do: trang giải là **bề mặt đứng standalone** (không phải cụm
  markdown/code-block dark), accordion đứng thẳng trên nền trang như card thật → đúng họ [[accordion-card-surface-on-standalone-pages]]
  (standalone page = surface), KHÔNG phải [[lesson-accordion-contrast-and-size]] (reading/markdown = default).
- **Đính chính [[accordion-default-fill-everywhere]]:** luật cũ ép MỌI accordion `bg-default` đã liệt ChallengeView
  là default — **sai** cho trang giải. Phân loại đúng theo NGỮ CẢNH NỀN (giống [[accordion-card-surface-on-standalone-pages]]):
  - **reading / lesson markdown** (accordion cùng cụm code block dark) → `variant="default" + bg-default`.
  - **standalone solve / settings / profile** (accordion là card trên `bg-background`) → `variant="surface"`.
- **Class surface:** `variant="surface"` + `className="overflow-hidden border border-default"` — KHÔNG tự thêm
  `bg-*`/`rounded-*` (surface đã bake `bg-surface` + `rounded-3xl`; utility radius/bg bị unlayered đè / thừa).
  Giữ title trigger `text-base font-semibold`, chip điểm cạnh `Accordion.Indicator` như cũ.

## ĐÃ ÁP DỤNG 2026-06-24
- `ChallengeView/index.tsx`: cả 3 accordion (Yêu cầu · Các bước · Gợi ý) `variant="default"`→`"surface"`,
  className bỏ `rounded-2xl bg-default` còn `overflow-hidden border border-default`. Skeleton đã `rounded-3xl`
  (khớp surface). tsc/eslint sạch.
