# Lesson Reader — Reading UX Brainstorm (2026-06-19)

> Output `/ux-brainstorm`. KHÔNG code. Trang: cột giữa khu Learn
> `/courses/[id]/learn/modules/[m]/contents/[c]` → `features/learn/LessonReader/`.
> Vấn đề thầy nêu: **cột giữa hơi rối + chữ nhỏ & dính**.

---

## 1. Mục tiêu trang
Đây là **đọc dài (long-form)** — học viên ở lại 15–20 phút/bài. Tiêu chí #1 = **đọc thoải mái**:
cỡ chữ đủ lớn, dòng thở, phân cấp heading rõ, đo dòng (measure) vừa mắt, chrome quanh không giành sự
chú ý với nội dung. Hiện tại đang tối ưu "nhồi nhiều chữ/màn" → ngược với mục tiêu.

## 2. Chẩn đoán (số THẬT, không cảm tính)
| Triệu chứng | Giá trị hiện tại | File | Vì sao đau |
|---|---|---|---|
| **Chữ nhỏ** | body = **14px** (`text-sm`) | `MarkdownContent/index.tsx:231`, `map.tsx` p/li | Long-form nên 16–18px. 14px mỏi mắt khi đọc lâu. |
| **Dính (thiếu thở)** | block gap = **6px** (`space-y-1.5`) | `MarkdownContent/index.tsx:231` | Đoạn/heading cách nhau 6px → khối chữ đặc. Long-form cần ~16–24px giữa đoạn, thêm khoảng TRÊN heading. |
| **Phân cấp yếu** | h2=18 · h3=16 · h4=14 (muted) | `map.tsx:137-141` | Heading chỉ nhỉnh body 0–4px → mắt không thấy "mục mới". Thang phẳng = rối. |
| **Đo dòng dài** | measure ~**744px @ 14px** ≈ 110–130 ký tự | `LessonReader/index.tsx:323` `max-w-[1024px]` | Lý tưởng 60–80 ký tự/dòng. Dòng quá dài + chữ nhỏ = lạc dòng khi xuống hàng. |
| **Inline đặc** | `**bold**` = semibold + **nhảy sang foreground** (đậm hơn nền muted) + code chip **hồng** | `map.tsx:257` (strong) + `:212` (code) | FS-content **bold mọi keyword** ([[fs-keyword-bold-convention]]) → 1 đoạn nhiều cú nhảy đậm/màu = nhiễu thị giác ở 14px. |
| **Nhiễu nền** | 60 đốm "ember" hồng bay khắp màn | `blocks/layout/AmbientBackground` mount ở `app/InnerLayout.tsx:33` | App-wide; trên trang ĐỌC = chấm động giành chú ý (đúng "rối" thầy thấy). |
| **Đầu trang nặng** | title 2xl + description + 3 chip meta + tab Nội dung/Thử thách + 4 tab ngôn ngữ | `ContentHeader` + `ContentTabBar` + `ContentBodyV2` | 5 tầng chrome trước khi tới chữ → "rối" phần trên. |

## 3. Ba hướng + hướng chốt

### Hướng A — "Reading-grade typography pass" (80% giá trị, ít churn) ✅ CHỐT (phần lõi)
Chỉ sửa renderer + container, KHÔNG đổi cấu trúc:
- **Body 14→16px** (`text-base`), line-height ~1.7; **li** cũng 16px.
- **Block spacing 6→ ~16px** (`space-y-4`) + **khoảng TRÊN heading lớn hơn khoảng dưới** (heading "thuộc về" đoạn sau): h2 `mt-8`, h3 `mt-6`.
- **Thang heading mạnh lại**: h2 `text-2xl`, h3 `text-xl`, h4 `text-base` semibold (bỏ muted để h4 còn là heading). Giữ id+data-toc cho OnThisPage.
- **Đo dòng cho PROSE ~70ch** (`max-w-[704px]`/44rem) — NHƯNG **code block & bảng được phá khung rộng hơn** (chúng cần bề ngang). → constrain text, không constrain code.
- **Làm dịu inline**: giữ bold = `font-semibold` nhưng **bỏ cú nhảy foreground** (để bold cùng tông, chỉ khác weight) → đỡ lốm đốm; code chip nhạt lại (giảm độ chói hồng, ví dụ `text-foreground` + nền mờ thay vì accent rực).
- **Tắt/giảm AmbientBackground trên route Learn đọc** (ẩn ở learn layout, hoặc opacity rất thấp sau cột đọc).

### Hướng B — "Declutter the top chrome" (bổ trợ, làm cùng) ✅ CHỐT (phần nhẹ)
- Gộp 3 chip meta (Nội dung 2/87 · 20 phút · 2 thử thách) thành **1 dòng meta `·`** gọn, bớt viền/độ nặng.
- Hợp nhất nhịp: tab **Nội dung/Thử thách** + tab **ngôn ngữ** đang là 2 thanh chồng → giữ khoảng cách rõ, giảm độ đậm đường kẻ để mắt xuống nội dung nhanh.
- (KHÔNG đổi chức năng tab, chỉ giảm "trọng lượng" thị giác.)

### Hướng C — "Reading mode / focus toggle" (để SAU)
Nút ẩn 2 rail → chỉ còn cột đọc; tuỳ chọn cỡ chữ; nền giấy. Giá trị thật nhưng là tính năng riêng,
không cần để fix bệnh hiện tại. Defer.

**Vì sao A+B:** bệnh gốc là *legibility + nhiễu*, không phải cấu trúc. A sửa thẳng cỡ chữ/nhịp/đo dòng/độ
nhiễu (đo được, rủi ro thấp, đụng `map.tsx` + `MarkdownContent` + 1 chỗ `max-w` + learn layout). B làm phần
trên bớt rối. C là feature mới → tách.

## 4. Bảng Section → File → Đổi gì
| Hạng mục | File | Thay đổi |
|---|---|---|
| Body size/leading/spacing/measure | `components/reuseable/MarkdownContent/index.tsx` | `text-sm`→`text-base`, `space-y-1.5`→`space-y-4`, thêm `leading-7`, bọc prose `max-w-[704px]` (text), cho code/table break-out |
| Thang heading + khoảng trên + inline | `components/reuseable/MarkdownContent/map.tsx` | h1-h6 scale lại + `mt-*`; `p`/`li` 16px; `strong` bỏ nhảy foreground; code chip dịu |
| Đo dòng article | `features/learn/LessonReader/index.tsx:323` | tách "reading measure" (prose hẹp) khỏi "full width" (code/sandbox) |
| Header gọn | `features/learn/LessonReader/ContentHeader` + `ContentTabBar` | meta 1 dòng `·`; giảm trọng lượng đường kẻ tab |
| Nhiễu nền | `app/InnerLayout.tsx` / `courses/[id]/learn/layout.tsx` | ẩn/giảm `AmbientBackground` trên route Learn đọc |

## 5. Edge / a11y
- **Code block & bảng KHÔNG bị ép `max-w-[704px]`** (sẽ vỡ/tràn) → chỉ prose hẹp, code full.
- Mobile: cỡ 16px + spacing rộng vẫn ổn (1 cột); kiểm overflow code.
- Giữ `id`+`data-toc` ở h2/h3 (OnThisPage scan DOM phụ thuộc — đừng đổi selector).
- A11y: 16px body cải thiện contrast/đọc; vẫn focus ring, heading đúng cấp.
- `prefers-reduced-motion` đã guard ember; nếu ẩn ember trên Learn thì khỏi lo.

## 6. Cắt / Thêm
- **Thêm:** body 16px · nhịp đoạn rộng · thang heading rõ · measure ~70ch cho prose · inline dịu.
- **Cắt:** ember hồng trên trang đọc · cú nhảy foreground của bold · độ chói code chip · bớt trọng lượng chrome đầu trang.
- **Không đụng:** chức năng tab/ngôn ngữ, OnThisPage, ContentMap, cấu trúc layout 2 trục.
