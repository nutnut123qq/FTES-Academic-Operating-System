# GlobalSearchModal — UX brainstorm (2026-06-24)

> KHÔNG code — brainstorm + chốt hướng. Target: `components/modals/GlobalSearchModal/**`.

## Inventory hiện tại
- Cmd/Ctrl+K · `Modal size="lg"` full-bleed (`p-0`). Input (magnifier + ESC kbd) → border → `GlobalSearchContent`.
- Kết quả real-time qua **socket** (`socketIo.globalSearchResults`) — 7 bucket: courses · modules · contents · challenges · flashcardDecks · milestones · milestoneTasks. Mỗi hit có `parentPath` (deep-link).
- Render = **Accordion gập** (mỗi bucket 1 section "Label (count)", mở sẵn) + empty `GlobalSearchEmpty`.

## Pain
1. **Accordion gập cho kết quả search** — command palette KHÔNG dùng accordion; dùng **list phẳng nhóm** (header nhóm + rows) để quét nhanh. Gập = thừa click + chặn keyboard nav.
2. **Không có điều hướng bàn phím** (↑↓ chọn, ↵ mở) — chỉ ESC. Đây là tính năng LÕI của cmd-k.
3. **Empty state để trắng/text** — nên gợi ý **recent + popular/quick links** (không bắt user nghĩ ra từ khoá).
4. **Không có footer phím tắt** (↑↓ di chuyển · ↵ mở · esc đóng).
5. **Vi phạm rule:** icon `@gravity-ui` (`Magnifier`) — phải **phosphor** (`MagnifyingGlassIcon`). `gap-1.5` ở trigger — cấm (→ `gap-2`).

## Refs ngành (command palette)
- Raycast · Linear cmd-k · GitHub cmd-k · [Algolia DocSearch](https://docsearch.algolia.com/): list phẳng nhóm, keyboard-first (↑↓↵), recent + suggestions khi rỗng, footer key-hints.

## Hướng
- **A — Polish:** giữ accordion, đổi icon phosphor, thêm gợi ý empty. Ít giá trị (vẫn thiếu keyboard nav).
- **B — Command palette thật (CHỐT):** (1) **list phẳng nhóm** thay accordion (header nhóm + rows, không gập), (2) **keyboard nav** ↑↓ chọn + ↵ mở + active row highlight, (3) **empty = recent (localStorage) + popular** (courses nổi bật), (4) **footer key-hints**, (5) icon phosphor + bỏ `gap-1.5`.
- **C — Two-pane** (loại trái · kết quả phải): overkill cho scope này.

## Section → data
| Section | Nguồn | Ghi chú |
|---|---|---|
| Input | `search.query` (Redux, debounce 200ms) | giữ |
| Result rows (7 bucket) | `socketIo.globalSearchResults.data.*` + `parentPath` | list phẳng nhóm, icon theo kind |
| Active/nav | state cục bộ index | ↑↓ ↵ |
| Empty recent | localStorage (MỚI) | lưu khi mở 1 hit |
| Empty popular | `useQueryRecommendedCoursesSwr` / trending | reuse query có sẵn |

## Cắt / thêm
- **Cắt:** Accordion gập (→ list phẳng). `@gravity-ui` import. `gap-1.5`.
- **Thêm:** keyboard nav · recent/popular empty · footer key-hints. KHÔNG cần BE mới (recent = localStorage; popular reuse query).

→ Widget đã vẽ trong chat. CHỐT hướng → `/starci-fe-ux-apply`.
