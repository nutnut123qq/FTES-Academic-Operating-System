# UX Brainstorm — khối META cột profile (links + joined)

> Khối thầy khoanh: GitHub · LinkedIn · website (starci.io) · "Tham gia thg 6 2026". "sửa lại tí". KHÔNG code.

## Hiện trạng (grounded — ProfileHero meta block)
- Mỗi link = `<a className="flex min-h-11 items-center gap-2 …">` → **mỗi dòng cao 44px** (tap-target) → khối **thưa, sprawl**, chiếm nhiều chiều dọc.
- Icon: GitHub/LinkedIn/website CÓ icon; **"Tham gia…" KHÔNG icon** → lệch hàng, không nhất quán.
- Label "LinkedIn" generic (trong khi website hiện host "starci.io" — đẹp hơn).
- Data có sẵn: `githubUsername`, `linkedinUrl`, `websiteUrl`(→host), `createdAt`(→joined).

## Pain
1. `min-h-11` làm 4 dòng cao 44px mỗi cái → loãng (meta phụ mà chiếm chỗ như nội dung chính).
2. Joined thiếu icon → không thẳng hàng với 3 link.
3. "LinkedIn" không cá thể hoá (website thì có host).

## Hướng (chốt)

### Hướng A ⭐ — list gọn, nhất quán icon (GitHub-sidebar style)
- Bỏ `min-h-11` → dòng **gọn** (`py-0.5`, ~24–28px), `gap-2` icon+text; cả khối `gap-1.5`.
- **Thêm icon cho joined** (`CalendarBlankIcon`/`CalendarDotIcon` phosphor) → 4 dòng thẳng hàng, đồng bộ.
- LinkedIn: hiện **handle parse từ URL** (`/in/<handle>`) thay "LinkedIn" generic (parity với host website); fallback "LinkedIn" nếu parse fail.
- Tap-target: link vẫn bấm được; meta phụ chấp nhận ~28px (không cần 44px như nút chính) — vẫn có focus-ring.
- ✅ Nhỏ, sửa đúng sprawl + lệch icon; vẫn đọc rõ. **Khuyến nghị.**

### Hướng B — social thành HÀNG icon + joined dòng riêng
GitHub/LinkedIn/website gom 1 **hàng ngang icon-only** (tooltip/aria), joined 1 dòng có calendar icon dưới.
- ✅ Cực gọn, kiểu "social row"; ⚠️ icon-only mất label (host/handle), kém rõ — chỉ hợp khi nhiều social.

### Loại — giữ nguyên `min-h-11`: chính là nguồn sprawl.

## CHỐT: Hướng A
Sửa "tí" đúng nghĩa: bỏ `min-h-11` → dòng gọn, thêm calendar icon cho joined (đồng bộ 4 dòng), LinkedIn hiện handle. Giữ stacked + label (đọc rõ hơn icon-only).

## Section → dữ liệu
| Dòng | Nguồn | Sửa |
|---|---|---|
| GitHub | `githubUsername` | bỏ min-h-11, gọn |
| LinkedIn | `linkedinUrl` → handle `/in/<x>` | label = handle (fallback "LinkedIn") |
| Website | `websiteUrl` → host | giữ |
| Tham gia | `createdAt` | + `CalendarBlankIcon`, gọn |

## a11y
Giữ `aria-label` mỗi link + focus-ring; joined icon `aria-hidden`. Hàng gọn nhưng vẫn là `<a>` bấm được.

---
*→ Thầy duyệt → `/ux-apply`: bỏ `min-h-11`→`py-0.5`, thêm calendar icon joined, LinkedIn handle. Draft rule:
"meta phụ (link/joined) = dòng gọn nhất quán icon, KHÔNG ép tap-target 44px như nút chính".*
