# UX Brainstorm — dấu "back" ở header trang Settings

> Output `/ux-brainstorm`. KHÔNG code. Câu hỏi: dấu back (←) ở header "Chỉnh sửa hồ sơ" nên thiết kế ntn?

## Vấn đề
Trang settings (EditProfile + ~8 trang: AiSettings/AiUsage/Security/Sessions/Membership/CV…) hiện chồng **3 lớp
điều hướng**: **breadcrumb** (Trang chủ › Hồ sơ › Chỉnh sửa) + **dấu back ←** + **sidebar** (CollapsibleSidebar
nav mọi trang settings). Back hiện `onBack = về Hồ sơ` ⇒ **trùng y hệt** link "Hồ sơ" của breadcrumb. Recruiter/
user liếc: 2 thứ cùng "thoát về Hồ sơ" cạnh nhau = thừa, loãng phân cấp.

Phụ: `SubPageHeader` (`reuseable/` = LEGACY) vi phạm rule — icon `@gravity-ui` (phải phosphor `ArrowLeftIcon`),
chữ `<div className="text-2xl font-bold">/text-sm` (phải `Typography`), `gap-1.5` (cấm). Phải bỏ legacy bất kể hướng.

## Hướng (≥2)
- **A — BỎ dấu back (CHỐT).** Layout settings ĐÃ có sidebar (nav) + breadcrumb (escape/hierarchy). Dấu back =
  thừa (trùng breadcrumb). Header = chỉ **title + subtitle** (Typography). Thoát: breadcrumb (desktop) / sidebar.
  Đúng pattern "settings có sidebar" của GitHub/Linear (không per-page back). → header dựng block sạch
  (`PageHeader`/Typography + phosphor), xoá `SubPageHeader` legacy.
- **B — Giữ back, BỎ breadcrumb.** Back = 1 escape duy nhất, gọn, hợp mobile. Nhưng mất hierarchy desktop +
  sidebar đã cho ngữ cảnh; back-về-đâu kém rõ hơn breadcrumb. Vẫn phải rebuild back thành block (phosphor/Typography).
- **C — Back CHỈ ở mobile.** Desktop: breadcrumb (sidebar lo nav); mobile (sidebar ẩn/rail): hiện back ←.
  Responsive đúng nhất nhưng nhiều code; cân nhắc sau nếu mobile thành ưu tiên.

## CHỐT: A — bỏ dấu back, giữ breadcrumb
- Lý do: đã có sidebar + breadcrumb; back trùng breadcrumb "Hồ sơ"; 1 escape rõ hơn 2. Văn-bản-là-giao-diện
  (breadcrumb chữ rõ hơn mũi tên mơ hồ "về đâu").
- Việc: (1) header settings = block `PageHeader` (đã có `blocks/layout/PageHeader`) hoặc tương đương: title
  `Typography` (h-level) + subtitle muted, KHÔNG back arrow. (2) Giữ breadcrumb (đã là HeroUI `Breadcrumbs`,
  item cuối = trang hiện tại). (3) **Xoá `reuseable/SubPageHeader`** (legacy, hỏng rule) + thay ở mọi trang settings.
- Nếu thầy MUỐN GIỮ back (hướng B): tối thiểu rebuild thành block — phosphor `ArrowLeftIcon`, `Typography`
  (title h4/h5 + subtitle body-sm muted), spacing `gap-2/gap-3` (bỏ 1.5), `onBack` đi tới PARENT cố định
  (KHÔNG `router.back()` vô định) — và khi đó bỏ breadcrumb cho khỏi trùng.

## Cắt / Thêm
- **Cắt:** `SubPageHeader` legacy (gravity icon + div-text + gap-1.5); dấu back trùng breadcrumb.
- **Thêm:** header settings = block sạch (Typography + phosphor); giữ breadcrumb làm escape.
- A11y: breadcrumb item cuối `aria-current="page"`; nếu giữ back → `aria-label` rõ ("Về Hồ sơ", không chỉ "Back").
