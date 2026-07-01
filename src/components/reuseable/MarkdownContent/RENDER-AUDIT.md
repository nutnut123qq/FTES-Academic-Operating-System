# RENDER-AUDIT — MarkdownContent: render lesson "đẹp hơn" (2026-06-21)

> Brainstorm `/starci-fe-ux-brainstorm` — KHÔNG code. Target: `components/reuseable/MarkdownContent/**`
> (react-markdown + remark-gfm/directive · shiki code · mermaid · tabs/accordion/chip directives).
> Bối cảnh: trang đọc lesson (`/learn/modules/[m]/contents/[c]`). Tiếp nối [READING-UX-BRAINSTORM]
> (2026-06-19) — phần **cỡ chữ/nhịp/scale (Hướng A)** ĐÃ áp (prop `reading` → 16px · `space-y-4` · h2-2xl).
> Audit này soi phần **CHƯA làm**: tinh chỉnh typography + chrome của element.

---

## 0. TL;DR
Renderer **giàu tính năng** (directive muted/chip/tab/accordion, mermaid có zoom, shiki lazy) nhưng **typography
còn PHẲNG** ở 5 chỗ — đó là toàn bộ khoảng cách giữa "đọc được" và "đọc đẹp":
1. **Nhịp dọc ĐỀU TĂM TẮP** — 1 `space-y-4` duy nhất → heading cách trên = cách dưới = bằng đoạn văn → mắt
   không thấy "mục mới". (Ref vàng: Tailwind Typography `prose` cho heading **margin-top lớn, margin-bottom nhỏ**.)
2. **Inline chói** — mọi inline code = `text-accent` (hồng) + `strong` nhảy `text-foreground`. FS-content **bold mọi
   keyword** → 1 đoạn lốm đốm hồng + đậm. (GitHub/Stripe: inline code **trung tính**, accent chỉ cho LINK.)
3. **Đo dòng (measure) không giới hạn** — body trải hết `max-w-3xl` (~768px ≈ 95–100 ký tự/dòng). Lý tưởng 65–75.
4. **Code block trần** — không header ngôn ngữ/filename, chỉ nút copy. Bài dài 20+ snippet khó định hướng.
5. **Figure/caption thô** — mermaid inline KHÔNG bọc `<figure>`, caption "Hình 1:…" rớt thành 1 `<p>` thường
   (chỉ modal mới có `<figcaption>`); ảnh không caption. + rác scale (`space-y-1.5`/`gap-1.5`/`my-1`/`rounded-medium`)
   và **icon `@gravity-ui`** (vi phạm luật phosphor-only).

## 1. Khoanh vùng (cây render)
| Element | File | Render hiện tại |
|---|---|---|
| Wrapper + remark plugins | `MarkdownContent/index.tsx` | 1 `div` `space-y-4 text-base leading-7` (reading) bọc TẤT CẢ block. |
| h1–h6 · p · li · ul/ol · strong/em · a · hr · blockquote · inline code | `map.tsx` | margin-free, chỉ size/weight/colour; h2/h3 có `id+data-toc` (OnThisPage). |
| code block | `CodeToHtml/index.tsx` | `rounded-xl bg-default` + copy góc; **không header**; shiki material lazy. |
| mermaid | `MermaidDiagram/index.tsx` | box `border rounded-xl p-3` + nút zoom→modal; caption chỉ trong modal; **icon gravity-ui**. |
| table | `MarkdownTableParts.tsx` | HeroUI `Table variant="primary"` (ổn). |
| muted/chip/tab/accordion directive | `index.tsx` + `map.tsx` | custom hast tags → HeroUI. |

## 2. Pain → Fix (ground in ref)
| # | Pain | Fix | Ref |
|---|---|---|---|
| A | Nhịp dọc đều → phân cấp section yếu | **Nhịp BẤT ĐỐI XỨNG**: bỏ `space-y` đồng loạt, cho từng block margin riêng — heading `mt-10/mt-8 mb-3` (khoảng TRÊN > DƯỚI, heading "thuộc về" đoạn sau), `p mb-4`, list/table/code `my-4`. | **Tailwind Typography** `prose` (hand-tuned heading spacing) |
| B | Inline chói (code hồng + bold nhảy màu) | inline code → **trung tính** `bg-default text-foreground` (`~0.875em`), bỏ `text-accent`; `strong` = **chỉ weight**, không đổi màu. Accent **chỉ dành cho link**. | GitHub / Stripe inline code |
| C | Đo dòng quá rộng | cap **prose text ~68–72ch** (`max-w-[68ch] mx-auto`), nhưng **table/code/mermaid break-out** full cột (chúng cần bề ngang). | typography 45–75ch · web.dev |
| D | Code block trần | **header mỏng**: nhãn ngôn ngữ (trái) + copy (phải), border-bottom nhẹ → bài nhiều snippet dễ quét. | Stripe / Mintlify / GitBook code block |
| E | Figure/caption thô | bọc mermaid+ảnh trong **`<figure>`** + `<figcaption>` (italic · muted · center) NGAY INLINE (đem caption từ modal ra); "Hình N" hết là `<p>` lạc. | docs figure pattern |
| F | Rác scale + icon cấm | chuẩn hoá `1.5/1`→`0/2/3/4/6`; `@gravity-ui`→**phosphor** `MagnifyingGlassPlusIcon`. | [[learn-content-padding-shell-p6]] / §8 + icon rule |
| G | (tuỳ chọn) heading không neo | hover hiện `#` anchor trên h2/h3 (id sẵn) → nhảy mục, copy link. | Docusaurus/GitBook anchor |

## 3. Ba hướng + CHỐT
### H-1 — "Hoàn tất typography pass" (A+B+C+F) ✅ **CHỐT (làm trước)**
Thuần chỉnh renderer/CSS, KHÔNG thêm chrome: nhịp bất đối xứng · inline dịu · measure ~70ch · dọn scale/icon.
- ✅ ROI cao nhất, rủi ro thấp; đúng phần CÒN THIẾU của [READING-UX-BRAINSTORM] Hướng A. Đụng `index.tsx`+`map.tsx`
  (+1 chỗ measure). Chữ "đọc đẹp" ngay.
- ⚠️ phải tách "prose hẹp" khỏi "code/table/mermaid full" để không ép vỡ bảng/code.

### H-2 — "Docs-grade elements" (thêm D+E+G)
Header code block (lang+copy) · figure/figcaption thật cho mermaid+ảnh · anchor heading.
- ✅ Nâng cảm giác "tài liệu xịn" (Stripe/Mintlify). ❌ đụng `CodeToHtml`/`MermaidDiagram` + thêm state → làm SAU H-1.

### H-3 — "Thay bằng Tailwind Typography `prose`" (north-star)
Bỏ map class thủ công, dùng `@tailwindcss/typography` + theme `prose-starci` map token; chỉ giữ custom renderer cho
mermaid/tabs/accordion/table.
- ✅ Nhịp hand-tuned + nhất quán, ít class lẻ. ❌ refactor lớn + phải hoà với token HeroUI + 2 scale (reading/compact).
  Để DÀNH, không làm ngay.

**Chốt: H-1 trước (đọc đẹp ngay), H-2 polish kế. H-3 ghi north-star.**

### ✅ ĐÃ DỰNG 2026-06-21 (thầy duyệt — H-1 + H-2)
- **H-1** (`map.tsx`+`index.tsx`+`MermaidDiagram`): nhịp bất đối xứng (reading: bỏ `space-y` đồng loạt → heading
  `mt-10/8 mb-3`, block `my-4`, first/last reset) · inline code **trung tính** (bỏ `text-accent`) · `strong` chỉ
  weight · measure `max-w-prose` · dọn `1.5/1`→grid · mermaid icon gravity-ui→**phosphor**. Gate theo `reading`.
- **H-2** (`CodeToHtml`+`MermaidDiagram`+`map.tsx`+`index.tsx`+messages): **header code block** (nhãn ngôn ngữ +
  copy, bỏ nút nổi) · mermaid `<figure>`+`<figcaption>` inline (+ strip caption `<p>` khỏi markdown để khỏi
  trùng) · ảnh `![alt]` → `<figure>`+figcaption khi có alt · **anchor `#`** hover trên h2/h3 (reading, i18n
  `markdown.headingAnchor`).
- H-3 (Tailwind `prose`) — vẫn để north-star, chưa làm. tsc/lint/JSON sạch. Chưa verify mắt (trang gate auth).

## 4. Cắt / Thêm
- **Thêm:** nhịp bất đối xứng (mt heading) · inline trung tính · measure ~70ch · (H-2) header code + figcaption + anchor.
- **Cắt:** `space-y` đồng loạt · `text-accent` ở inline code · cú nhảy màu của bold · rác `1.5/1` · icon gravity-ui.
- **Giữ:** id+data-toc (OnThisPage) · shiki lazy · mermaid zoom-modal · directive muted/chip/tab/accordion · HeroUI table.

## 5. States / a11y / ranh giới
- **KHÔNG ép `max-w-70ch` lên code/table/mermaid** (vỡ/tràn) — chỉ prose text hẹp.
- Giữ `h2/h3` thật + `id`/`data-toc` (OnThisPage scan DOM — đừng đổi selector/tag).
- `reading=false` (card/chat/flashcard/modal) GIỮ scale compact — mọi thay đổi gate theo `reading`.
- a11y: inline code đủ contrast trên `bg-default`; figure có `figcaption`; anchor có aria-label; heading đúng cấp.
- Ref: [Tailwind Typography](https://github.com/tailwindlabs/tailwindcss-typography) · [Stripe docs](https://docs.stripe.com/) · Mintlify · GitHub markdown.
