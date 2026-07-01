# UX brainstorm — khúc "vàng": tab bar + language switcher (2026-06-19)

> Vùng: ngay dưới header bài học — **`ContentTabBar`** ("Nội dung / Thử thách") + **`ProgrammingLanguageTabs`**
> (TS/Java/C#/Go, variant `Pill`, ghim `justify-end` trong card body). KHÔNG code — chỉ chốt hướng.

## Inventory (đang có gì)
- `ContentTabBar` — tab cấp cao: Nội dung / Thử thách (+ Sandbox / AI Lab có điều kiện). Full page-width, thường chỉ 2 mục.
- `ProgrammingLanguageTabs` (`variant=Pill`) — đổi ngôn ngữ code của **cùng một bài**, chỉ hiện khi `langs.length > 1`.
  Render trong `ContentBodyV2` bằng `<div className="flex justify-end">` → pill nổi top-right, dưới là `h-3` rồi `MarkdownContent`.
- State: `redux content.selectedProgrammingLang` → **đã persist** lựa chọn ngôn ngữ (đổi bài vẫn giữ). Không cần BE mới.

## Pain (vì sao khúc vàng chưa ổn)
1. **Hai tầng điều hướng chồng nhau** (tab bar → pill ngôn ngữ ngay dưới). Vi phạm best practice "**avoid multiple tab levels**"
   (USWDS / designsystems.surf): mắt phải phân giải 2 dải control sát nhau, không rõ cái nào chính.
2. **Sai semantic tab vs segmented control.** Consensus design-system: **tab = đi tới NỘI DUNG khác**; **segmented control = CÙNG
   nội dung, đổi format/representation**. TS/Java/C#/Go = *cùng bài, đổi ngôn ngữ trình bày* → đúng ra là **segmented control / filter**,
   không phải một hàng "tab" thứ 2. Hiện nó lại trông như một control rời cạnh tranh với tab thật.
3. **Pill mồ côi top-right.** Khoảng trống lớn bên trái, không label → user không biết scope: đổi *cả bài* hay chỉ *một snippet*?
   (ref language-selector: phải **dễ khám phá + nhất quán vị trí**, top-right cho LTR.)
4. **Tab bar full-width cho 2 mục** → dải ngang dài, dead space.
5. **Pill tách rời prose nó điều khiển** (`justify-end` + `h-3`) → đọc như vật trang trí trôi nổi, không phải thanh điều khiển của bài.

## Ref (web, đã search)
- **Tabs vs Segmented Control** — Medium (Errum) + designsystems.surf + Mobbin: tab→nội dung khác; segmented→cùng nội dung khác cách
  trình bày; segmented giữ ≤5–7 lựa chọn (TS/Java/C#/Go = 4 ✓).
- **Avoid multiple tab levels** — USWDS tabs / designsystems.surf tabs blueprint.
- **Language selector UX** — Smashing / Linguise / SimpleLocalize: vị trí **nhất quán + dễ thấy**, top-right LTR, **giữ scroll** khi đổi.
- **Stripe / Mintlify code docs** — lựa chọn ngôn ngữ **global + persistent** xuyên trang, switcher sống ở **toolbar / code-header**,
  KHÔNG trôi nổi giữa bài. (KnowledgeOwl "shine like Stripe": code sample đổi ngôn ngữ ngay tại chỗ, lựa chọn được nhớ.)

## Hướng (chọn 1)

### Hướng A — Gộp về MỘT thanh "reader toolbar" *(CHỐT)*
- Một dải control ngang duy nhất ngay dưới header: **trái = tab `Nội dung / Thử thách`**, **phải = segmented control ngôn ngữ**
  (đổi `ProgrammingLanguageTabs` từ `Pill` → biến thể **segmented**, gắn nhãn nhỏ + icon `</>`).
- Ngôn ngữ **chỉ hiện ở tab Nội dung** (ẩn ở Thử thách/Sandbox/AI Lab — nơi nó vô nghĩa) → hết cảnh 2 control tranh nhau.
- Lấp dead space của tab bar 2-mục bằng chính switcher; giết pill mồ côi.
- **Vì sao chốt:** đúng cả 2 luật ref — "1 tầng tab" + "language = segmented chứ không phải tab thứ 2"; vị trí top-right nhất quán,
  dễ khám phá; persist đã có sẵn (`selectedProgrammingLang`), giữ scroll mặc định.

### Hướng B — Đẩy ngôn ngữ lên hàng meta/action của header (global kiểu Stripe)
- Switcher nằm cạnh meta-chip / rail "Hành động" ở top-right header → cảm giác *cài đặt cấp trang*, body card sạch trơn.
- Mạnh khi muốn ngôn ngữ là "preference toàn trang". Nhược: xa code nó điều khiển, header đang khá đông (chip + outcomes).

### Hướng C — Thanh nhãn dính đầu body
- Giữ trên body nhưng làm **dải có nhãn đầy đủ** ("Ngôn ngữ ví dụ:" + segmented) trải ngang đầu card + divider → đọc như control-bar
  thuộc về prose. Nhược: vẫn là tầng thứ 2 dưới tab (chưa giải triệt để pain #1).

## Map section → dữ liệu / component
| Thành phần | Nguồn (có sẵn) | Đổi gì |
|---|---|---|
| Tab Nội dung/Thử thách | `ContentTabBar` + `tabItems` | giữ; là dải trái của toolbar |
| Segmented ngôn ngữ | `ProgrammingLanguageTabs` (thêm `variant=Segmented`) + redux `selectedProgrammingLang` | bỏ `justify-end` mồ côi; nhúng vào toolbar phải; chỉ hiện ở tab Content |
| Persist + scroll | redux đã persist; scroll giữ mặc định | thêm i18n nhãn `content.language` + icon |

→ Hướng A. Thầy duyệt thì trò `/ux-apply`: gộp `ContentTabBar` + segmented ngôn ngữ thành 1 reader-toolbar, ẩn ngôn ngữ ngoài tab Content.
KHÔNG đụng BE.
