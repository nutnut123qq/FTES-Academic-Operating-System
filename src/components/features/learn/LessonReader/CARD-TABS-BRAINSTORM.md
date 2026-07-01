# Lesson Reader — Card surface + Tab system Brainstorm (2026-06-19)

> Output `/ux-brainstorm` (max-effort, 3 research agents). KHÔNG code.
> Trang: `features/learn/LessonReader/`. Thầy khoanh Paint: **vàng = bọc nội dung thành CARD**,
> **đen = 2 thanh tab (Nội dung/Thử thách + TS/Java/C#/Go) brainstorm sửa lại.**
> Nối tiếp [[READING-UX-BRAINSTORM]] (typography đã apply).

---

## 1. Mục tiêu
Khu đọc phải thành **1 "tờ giấy" rõ ràng** trên canvas (card surface) + **chrome tab gọn, đúng phân cấp**
(không 2 thanh giống hệt nhau giành chú ý).

## 2. Findings (data THẬT — grounded)
- **Cột nội dung hiện BARE** trên `bg-background` — header + tab + body + pager đều không card. App có
  surface tokens (`--surface` = "giấy", khác `--background` = "bàn") + card chuẩn `Card`/`CardContent`
  (`bg-surface`, `rounded-3xl`, `px-4 py-3`). (`starci-card.md`, `globals.css`.)
- **Rail 2 bên (ContentMap trái / OnThisPage phải) = lean, không card** → card hóa cột giữa KHÔNG đụng độ,
  ngược lại làm giữa nổi thành container chính.
- **Tab = 2 TRỤC bị render giống nhau** (đây là gốc "rối"):
  | Trục | Tab | Ý nghĩa | Khi nào hiện | Phạm vi |
  |---|---|---|---|---|
  | **VIEW** | Nội dung · (Code-lesson V1) · Sandbox · Thử thách · AI Lab | đổi *chế độ xem* | gate theo `isSandbox`/`challenges`/`playground`/`!verified` | toàn bài |
  | **NGÔN NGỮ** | TypeScript · Java · C# · Go | đổi *bản code* của body | content V2 có ≥2 `bodies` | **CHỈ tab Nội dung** |
  Cả 2 đang là `Tabs variant="secondary"` underline full-width → **trông như 2 nav ngang hàng**, trong khi
  ngôn ngữ thực ra **lệ thuộc** tab Nội dung (swap nguyên body markdown theo lang).
- **Ngôn ngữ per-content VARIABLE 1–4** (không cố định 4) — `ContentBody[]`, swap cả body.
- **Sandbox & AI Lab = full-bleed** (`isFullWidthTab`) → phải thoát mọi card.
- **`#lesson-article` id BẮT BUỘC giữ** (OnThisPage quét `#lesson-article [data-toc]`).
- **Có sẵn `ProgrammingLanguageTabsVariant.Pill`** (gọn `w-fit`, có indicator) — đang dùng `Secondary`.

## 3. CARD — bọc nội dung thành "tờ giấy"
- **Card = `Card`/`CardContent`** (`bg-surface rounded-3xl`, padding card chuẩn) bọc khu đọc; giữ `max-w-3xl`,
  giữ `#lesson-article` BÊN TRONG.
- **Thoát card khi full-bleed:** tab Sandbox/AI Lab → body phá khung (card full-width hoặc bỏ card cho 2 tab này).
- **Paywall fade** chạy bên trong card (gradient → `via-surface` thay `via-background` để khớp nền giấy).
- **Pager/E2E/Ad** = NGOÀI card (chrome phụ dưới giấy), giữ `max-w-3xl`.

## 4. TAB — 3 hướng (đen)

### Hướng A — "1 thanh: VIEW trái + NGÔN NGỮ pill phải" ✅ CHỐT
Gộp 2 thanh thành **1 hàng**: tab VIEW (underline, giữ nguyên) bên trái; **ngôn ngữ = segmented PILL gọn,
đẩy SÁT PHẢI cùng hàng** (đổi `Secondary`→`Pill`). Pill **chỉ hiện khi đang ở tab Nội dung & content có ≥2 lang**.
- ✅ Hết "2 thanh giống nhau"; phân cấp đúng (view = nav chính, lang = control phụ thuộc, gọn, ngữ cảnh).
- ✅ Tái dùng variant Pill có sẵn → ít công. Pattern chuẩn (MDN/Stripe: view tabs trái, language switch phải).
- ⚠️ Khi quá nhiều VIEW tab + 4 lang trên màn hẹp → wrap; xử lý bằng pill co gọn (icon+short) / xuống dòng.

### Hướng B — "Tờ giấy 1 card chứa cả header + tab strip + body" (đúng nghĩa khoanh vàng)
Mọi thứ trong 1 card; tab VIEW = strip ở đỉnh card; lang pill phải. Sandbox/AI Lab body phá full-width trong card.
- ✅ Cảm giác "1 tờ giấy có tab" đúng hình thầy khoanh.
- ⚠️ Full-bleed Sandbox/AI Lab phá "1 card" → phải cho card tự giãn full khi ở 2 tab đó (refactor lớn hơn,
  sticky/scroll phức tạp). Tab VIEW kẹt trong card cố định kém linh hoạt.

### Hướng C — "Card body + dời ngôn ngữ vào dòng meta header"
Body vào card; bỏ thanh lang, nhét segmented lang vào dòng meta header (cạnh "15 phút · 2 thử thách").
- ✅ Bỏ hẳn 1 thanh.
- ⚠️ Header đông hơn; lang xa vùng code → khó thấy khi cần đổi; lệch ngữ cảnh.

**CHỐT A** (+ card kiểu "body card" của Hướng giữa A/B). Lý do: gốc "rối" = **2 thanh cùng kiểu, sai trục**.
A sửa đúng gốc (1 hàng, view≠lang, lang phụ thuộc & gọn) bằng đồ CÓ SẴN (Pill), rủi ro thấp; card vẫn đạt
"tờ giấy". B đẹp về ý niệm nhưng kẹt full-bleed (Sandbox) → để sau nếu thầy muốn. C làm header rối.

## 5. Bảng Section → Dữ liệu / File
| Phần | File | Đổi |
|---|---|---|
| Card "giấy" | `LessonReader/index.tsx` (body wrapper ~320) | bọc `Card/CardContent bg-surface`, giữ `#lesson-article`, full-bleed cho Sandbox/AILab |
| Tab VIEW (giữ) | `ContentTabBar` | giữ underline; thêm slot phải cho lang pill (cùng hàng) |
| Lang → Pill phải | `ContentBodyV2` (lang tabs) + `ProgrammingLanguageTabs` | `Secondary`→`Pill`, render ở slot phải của tab row, chỉ khi tab Nội dung & ≥2 lang |
| Paywall fade | `LessonReader` + `PremiumPaywall` | `via-background`→`via-surface` khớp card |
| Data | `content.bodies` (lang per-content), `isSandbox`/`playground`/`challenges` (gate view) | không cần BE mới |

## 6. Edge / a11y
- **Lang pill chỉ thuộc tab Nội dung** → ẩn ở Sandbox/Thử thách/AI Lab (tránh control "chết").
- **1 lang** → không pill. **0 body** → fallback hiện tại.
- Card: contrast `bg-surface` vs `bg-background` đủ tách (light + dark); border tùy (app thiên fill, ít border).
- Giữ `#lesson-article` + `data-toc` (OnThisPage). Sticky tab khi cuộn = cân nhắc sau (không bắt buộc).
- Pill = `role=tablist`, focus ring, đủ tap 44px.

## 7. Cắt / Thêm
- **Thêm:** card surface "tờ giấy" cho khu đọc · lang pill gọn đẩy phải (1 hàng tab).
- **Cắt:** thanh ngôn ngữ underline full-width thứ 2 (gây ngang-hàng-sai-trục) · nền `background` lộ sau nội dung.
- **Không đụng:** gate tab VIEW, trạng thái redux tab/lang, OnThisPage, ContentMap, full-bleed Sandbox/AILab.
