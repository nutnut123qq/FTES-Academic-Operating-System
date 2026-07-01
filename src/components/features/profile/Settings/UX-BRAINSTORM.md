# Settings shell → collapsible left sidebar (UX spec)

> `/ux-brainstorm` · trang **Settings** (`SettingsLayout`) · 2026-06-17
> Hướng thầy đã **CHỐT SẴN** → doc này = spec áp dụng, không phải brainstorm nhiều hướng.

## Mục tiêu
Settings = thế giới "quản lý" (khác public profile = thế giới "khoe"). Người dùng vào để **làm 1 việc**
(sửa hồ sơ / đổi bảo mật / xem gói AI…). Sidebar điều hướng nên **nhường chỗ cho nội dung** khi không cần →
cho collapse được, giống VS Code / GitHub settings.

## Inventory (đang có — chỉ để biết, không bê tư duy cũ)
- `SettingsLayout`: `<aside>` trái (sticky, `md:w-64`) + `<main>` phải. Nav từ `getSettingsGroups(locale)`.
- 5 nhóm · item = `{key, href, icon}`:
  account (editProfile · security · sessions) · learning (courseHistory · submissions · attempts · feedback) ·
  ai (aiSettings · aiSubscription · aiUsage) · content (bookmarks) · membership (membership).
- **Pain**: (1) không có ranh giới sidebar↔content (trôi vào nhau); (2) không thu gọn được — chiếm 16rem cố định
  kể cả khi đọc form dài; (3) **phạm rule**: nav row style **inline trong feature** (`bg-accent/15`, hover…) +
  icon `@gravity-ui` (nợ đổi **phosphor**).
- **Data**: 100% từ `nav.tsx` (client). **KHÔNG đụng BE/DB.**

## Hướng CHỐT (1 hướng — thầy đã quyết)
Biến nav thành **sidebar trái collapse được**:

1. **Divider**: 1 nét dọc (`--separator`) ngăn sidebar ↔ content. 1 nét, không bóng/khung.
2. **Toggle collapse** = phosphor **`SidebarSimpleIcon`** (đồng bộ navbar mobile), đặt ở **header sidebar** cạnh
   tiêu đề "Cài đặt".
3. **Bấm collapse → trượt vô**: width sidebar animate `16rem → 0` (trượt sang trái khỏi canvas), divider + content
   reflow full-width. Còn lại **1 nút SidebarSimple nổi** ở mép trái content để mở lại.
4. **Nhớ trạng thái**: persist collapsed (localStorage) → giữ qua điều hướng giữa các trang settings.

### Trạng thái & a11y (tính từ đầu)
- Toggle: `aria-expanded` + `aria-controls` trỏ vào panel; nhãn i18n ("Thu gọn menu" / "Mở menu").
- `prefers-reduced-motion: reduce` → bỏ slide (đổi tức thì), theo convention `AmbientBackground`.
- Active item vẫn suy từ `pathname` (giữ nguyên logic).
- **Mobile (`< md`)**: panel = **Drawer** mở bằng cùng icon SidebarSimple (đồng bộ navbar). Không chiếm cột trên màn hẹp.

## Kiến trúc (đúng rule "feature không style")
- **Chrome thuộc về BLOCK mới `blocks/navigation/CollapsibleSidebar`** — sở hữu TOÀN BỘ style: divider, animation
  trượt (framer-motion width/translate), nút toggle (SidebarSimpleIcon), rail nổi khi collapsed, Drawer mobile,
  persist + reduced-motion. API: `title`, `isCollapsed`/`onCollapsedChange` (hoặc tự quản qua hook), `children` = nav.
- **`SettingsLayout`** chỉ **compose**: render `<CollapsibleSidebar title=…>` bọc danh sách nav, `<main>` content.
  Nav row (active/hover) cũng nên rút thành block `SidebarNavItem`/`SidebarNavGroup` (style rời khỏi feature).
- Icon: đổi `nav.tsx` `@gravity-ui` → **phosphor `*Icon`** (Pencil→`PencilIcon`, ShieldCheck→`ShieldCheckIcon`, …).

## Section → dữ liệu
| Phần | Nguồn | Ghi chú |
|---|---|---|
| Nhóm + item nav | `getSettingsGroups(locale)` (client) | không đổi cấu trúc dữ liệu |
| Active state | `usePathname()` | giữ nguyên |
| Collapsed state | localStorage (client) | mới |
| (toàn bộ) | **không BE/DB** | |

## Cắt / thêm
- **Thêm**: divider · toggle collapse · slide · persist · Drawer mobile · block `CollapsibleSidebar`(+`SidebarNavItem`).
- **Sửa (nợ rule)**: nav style inline → block; icon gravity → phosphor.
- **Cắt**: không cắt destination nào (IA giữ nguyên — đây là đổi *chrome*, không đổi *nội dung*).

→ Gõ `/ux-apply` để dựng (hoặc "ok" trò quất luôn vì thầy đã "xúc").
