# UX Audit — Settings sidebar nav (xanh lá dựa vào xanh dương)

> Scope: sidebar "Cài đặt" (`SettingsLayout` + `Settings/nav.tsx` + blocks `CollapsibleSidebar` /
> `SidebarNavGroup` / `SidebarNavItem`). Câu hỏi thầy: audit **nhóm xanh lá** (AI / Bookmark / Thành viên)
> **lấy nhóm xanh dương** (Tài khoản: Chỉnh sửa hồ sơ / Bảo mật / Phiên đăng nhập) **làm chuẩn**. KHÔNG code.

## Hiện trạng (grounded)
- `nav.tsx` định nghĩa **5 group**: account(3) · learning(4) · **ai(3)** · **content(1=Bookmark)** · **membership(1=Thành viên)**.
- `SettingsLayout` render `<SidebarNavGroup divider={index>0}>` — **KHÔNG truyền `label`** → group KHÔNG có tiêu đề,
  chỉ ngăn nhau bằng `<Separator className="mb-3" />`.
- **Mọi dòng = `SidebarNavItem` GIỐNG HỆT**: nhưng item dựng bằng **`<ListBox selectionMode="single">` bọc đúng
  1 `<ListBox.Item>`** (mỗi dòng 1 listbox). Active = `bg-accent/10 text-accent`.

## Vì sao xanh lá "lệch" so với xanh dương (2 vấn đề THẬT)

### 1. Sai primitive → chrome xám của HeroUI rò ra (cái thầy thấy: "Gói AI" nền xám)
Mỗi dòng là **1 `ListBox` 1-item** = dùng sai component (listbox single-select cho 1 phần tử). `ListBox.Item`
tự mang **hover / focus / selected state riêng (nền xám `bg-default`)**. Hệ quả: chỉ cần 1 item bị **focus/hover**
(vd "Gói AI" vừa bấm trước khi điều hướng) là hiện **nền xám** — đè/đua với highlight active chủ đích (pink
`bg-accent/10`). Nhóm xanh dương trông sạch **chỉ vì lúc đó không item nào focus/hover** — KHÔNG phải vì nó đúng hơn.
→ Đây là **bug nhất quán**: lẽ ra CHỈ item **active (route hiện tại)** được tô (Bookmark pink), các item khác phẳng.

### 2. Group 1-item → vụn (Bookmark, Thành viên mỗi cái 1 group + 1 divider)
`content` và `membership` mỗi group **đúng 1 item** nhưng vẫn lĩnh 1 `Separator` phía trên → trong vùng xanh lá có
**2 đường kẻ cô lập 2 dòng lẻ**, nhìn rời rạc; trong khi xanh dương là **1 cụm 3 item liền mạch**. Divider cho group
1-item = nhiễu thị giác, không "gom" được gì.

(Phụ: group có `label` trong config nhưng SettingsLayout không truyền → label chết. Hoặc dùng label thật, hoặc bỏ field.)

## Hướng (chốt theo "lấy xanh dương làm chuẩn = chỉ active được tô, cụm liền mạch")

### Hướng A ⭐ — Đổi primitive nav item + dồn group lẻ
- `SidebarNavItem`: bỏ `ListBox/ListBox.Item`, dựng bằng **dòng pressable** (HeroUI `Link onPress` — đúng rule
  "text có action = Link", hoặc 1 pressable row trong block). **Chỉ 1 trạng thái nhìn thấy = active**
  (`bg-accent/10 text-accent`); hover = tint rất nhẹ; focus = **ring**, KHÔNG fill xám. → hết "Gói AI xám", xanh lá
  sạch y xanh dương.
- Gom group lẻ: `content`(Bookmark) + `membership`(Thành viên) → 1 group "Khác"/gộp vào nhóm gần nghĩa, bỏ divider cô lập.
- ✅ Khớp chuẩn xanh dương (chỉ active tô, cụm liền) + đúng rule Link + a11y (1 nav list, ring focus).
- ⚠️ Đụng block `SidebarNavItem` (shared — chỉ settings nav dùng, an toàn).

### Hướng B — Giữ ListBox nhưng gom TOÀN nav thành 1 ListBox
1 `<ListBox selectionMode="single">` bọc TẤT CẢ item (groups = `ListBox.Section`), `selectedKeys=[activeKey]`.
- ✅ Selection do listbox quản lý đúng cách (1 selected), section tự tách (bỏ Separator thủ công).
- ⚠️ Vẫn còn nền xám hover/focus mặc định của HeroUI → phải override token cho khớp "chỉ active pink"; nặng hơn A.

### Loại — giữ nguyên (mỗi dòng 1 ListBox): chính là nguồn của bug xám, bỏ.

## CHỐT: Hướng A
Lý do: trả nav về đúng bản chất "list link, 1 active" — diệt tận gốc chrome xám lạc (vấn đề #1) + gom group lẻ
(vấn đề #2), và **ăn khớp rule vừa chốt "text có action = Link"**. Kết quả: vùng xanh lá đọc sạch + chỉ item đang mở
được tô, đồng nhất với xanh dương.

## Section → dữ liệu / nguồn
| Phần | Nguồn | Ghi chú |
|---|---|---|
| Item nav | `Settings/nav.tsx` groups | đổi renderer item, GIỮ config (gộp content+membership) |
| Active | `pathname === item.href` | chỉ đây mới tô `bg-accent/10 text-accent` |
| Divider/group | `SidebarNavGroup divider` | bỏ divider cho group 1-item sau khi gộp |

## States / a11y
- Active = aria-current="page" + tô accent; hover = tint nhẹ; **focus = ring (focus-visible), không fill**.
- Collapsed rail: chỉ icon, active vẫn tô; label ẩn (giữ logic hiện có).

---
*→ Thầy duyệt → `/ux-apply`. Nếu chốt A, trò ghi draft rule "nav/menu item = pressable Link/row, CHỈ active được
tô; đừng dùng 1-item-ListBox/row (kéo theo hover/focus/selected grey của HeroUI)".*
