# Design — App Shell Header-Only Navigation

## Context

- Header hiện tại (`Navbar` → `HeaderNav`): 3 link phẳng (Subjects · Courses · Community) + mega-menu "Explore" 1 popover gom mọi thứ còn lại. Mobile drawer render tất cả nhóm của `useAppNav`.
- `useAppNav` (`src/components/features/app-shell/useAppNav.tsx`) là nguồn nav duy nhất, hiện chia 6 nhóm phẳng (top/learn/community/explore/you/system) — không mô hình hoá quan hệ "module cha → tính năng con".
- Không có sidebar trái toàn cục nào tồn tại; `SubjectWorkspaceShell` có rail trái riêng (GIỮ NGUYÊN).
- Ràng buộc: FE-only (mock BE), HeroUI + phosphor, i18n vi/en qua `next-intl`, build verify = `npm run build` (webpack) + `tsc --noEmit`.

## Goals / Non-Goals

**Goals**
- Header đúng 4 module cấp 1: Home · Workplace · Course · Community; tính năng con nằm trong dropdown của module.
- Một cấu trúc dữ liệu nav phân cấp duy nhất nuôi cả desktop dropdown lẫn mobile drawer.
- Mọi đích đến của nav hiện tại vẫn reachable sau tái cấu trúc (bảng migration bên dưới).
- Menubar/disclosure a11y + keyboard đầy đủ.

**Non-Goals**
- Không đổi route/page nào; không đụng `SubjectWorkspaceShell` rail; không đổi cụm phải header (search/bell/language/theme/account trigger); không realtime/BE.

## Decisions

### D1 — Cấu trúc dữ liệu nav: nhóm 2 cấp trong `useAppNav`

`useAppNav` trả về mảng `AppNavModule` thay cho 6 nhóm phẳng:

```ts
interface AppNavChild {
    key: string          // i18n key dưới "nav."
    label: string
    icon: React.ReactNode
    path: string
    isActive: boolean    // prefix-match theo path con
}
interface AppNavModule {
    key: "home" | "workplace" | "course" | "community"
    label: string
    icon: React.ReactNode
    path: string         // đích khi click chính module
    isActive: boolean    // OR(isActive các con) ∪ prefix(path riêng)
    children: Array<AppNavChild>  // [] với home
}
```

- Vẫn `"use client"` + `useMemo(pathname, t)`; path build qua `pathConfig().locale()` như cũ.
- Consumer: `HeaderNav` (desktop), Navbar mobile drawer. Alternative bị loại: giữ nhóm phẳng + map lại ở mỗi consumer → 2 chỗ drift, đúng cái đang hỏng.

### D2 — Ánh xạ IA (migration đầy đủ — KHÔNG route nào mồ côi)

Nguồn: 21 đích đến hiện có trong `useAppNav`.

| Đích hiện tại | Path | Vị trí MỚI |
|---|---|---|
| Home | `/` | Header: **Home** (link thuần, không dropdown) |
| Subjects | `/subjects` | **Workplace** = link chính của module |
| Resources | `/resources` | Workplace ▾ |
| Challenges (Practice) | `/challenges` | Workplace ▾ |
| Leaderboard | `/leaderboard` | Workplace ▾ |
| AI Hub | `/ai` | Workplace ▾ |
| Workflow (Kanban) | `/workflow` | Workplace ▾ |
| Analytics | `/analytics` | Workplace ▾ |
| Career | `/career` | Workplace ▾ |
| Courses | `/courses` | **Course** = link chính (Catalog) |
| Marketplace | `/marketplace` | Course ▾ |
| Recommendations | `/recommendations` | Course ▾ ("Gợi ý cho bạn") |
| Community | `/community` | **Community** = link chính (Feed) |
| Groups | `/groups` | Community ▾ |
| Events | `/events` | Community ▾ |
| Chat | `/chat` | Community ▾ |
| Search | `/search` | Cụm phải header (SearchButton + Ctrl/K) — đã có, giữ nguyên |
| Activity | `/activity` | AccountMenuDropdown (nhóm "Bạn") |
| Wallet | `/wallet` | AccountMenuDropdown (nhóm "Bạn") |
| Integrations | `/integrations` | AccountMenuDropdown (nhóm "Hệ thống") |
| Roles | `/admin/roles` | AccountMenuDropdown (nhóm "Hệ thống") |

- Lý do Workplace ôm 8 tính năng: user chốt "workplace nhiều tính năng" — đây là không gian làm việc học tập (môn học, tài nguyên, luyện tập, AI, kanban, số liệu, hướng nghiệp).
- Activity/Wallet/Integrations/Roles là mục cá nhân/quản trị, không thuộc 4 module học — vào Account menu (vẫn là header, đúng intent "nhét hết lên header"). Alternative bị loại: nhét vào Home dropdown → Home thành "Explore" trá hình.
- "Saved/bookmark": chưa có route riêng trong `pathConfig` — không bịa; các item đã lưu hiển thị bên trong Resources/Profile như hiện trạng. Khi có route thật sẽ nest vào Workplace ▾ (ghi chú cho change sau).

### D3 — Desktop: 3 module có dropdown = split trigger (link + disclosure)

- Mỗi module (Workplace/Course/Community) render: **link** điều hướng tới `path` + **nút caret** mở dropdown (HeroUI `Popover`, `placement="bottom start"`); hover vào cụm cũng mở (open-on-hover với delay đóng ngắn), click caret/Enter toggle. Home là `Link` thuần.
- Dropdown = 1 cột item (icon + label), item active tô `text-accent`; click item đóng popover.
- Mỗi thời điểm tối đa 1 dropdown mở; mở cái mới đóng cái cũ.
- Alternative bị loại: cả mục là 1 button chỉ-mở-menu (mất khả năng click thẳng vào module — user muốn "Home, Workplace, Course, Community" là đích đến).

### D4 — A11y / keyboard (disclosure-nav pattern)

- Container `<nav aria-label>`; mỗi trigger dropdown có `aria-expanded` + `aria-haspopup="menu"`.
- Tab đi qua: Home → Workplace(link) → caret → … ; Enter/Space trên caret mở menu, ArrowDown vào item đầu, ArrowUp/Down duyệt, ESC đóng + trả focus về trigger, blur/click-ngoài đóng. Popover HeroUI đã lo focus-trap/dismiss; phần thêm là aria-expanded và điều hướng mũi tên trong list.

### D5 — Mobile drawer: 4 nhóm gương desktop

- Drawer giữ nguyên chỗ mở (icon expand). Nội dung: hàng **Home** (link) + 3 nhóm **accordion** (Workplace/Course/Community): header nhóm = label + caret, mở ra list con gồm **link chính của module** ("Tất cả môn học"/"Danh mục khoá học"/"Bảng tin") + các con. Nhóm chứa route active mặc định mở sẵn. Chọn item → đóng drawer (như cũ). Language/theme rows giữ nguyên cuối drawer.

### D6 — Luật shell: không sidebar trái toàn cục

- Không thêm bất kỳ component sidebar/rail toàn cục nào; requirement spec hoá để guard tương lai. Ngoại lệ duy nhất: rail trong `SubjectWorkspaceShell` (in-context của workspace) — không sửa file đó.

### D7 — i18n

- Key mới dưới `nav.`: `workplace`, `course` (nếu chưa có), `section.you`/`section.system` tái dùng cho account menu, và nhãn con giữ key hiện có (`subjects`, `resources`, …) — vi + en trong `src/messages/{vi,en}.json`. Không hardcode chuỗi.

## Risks / Trade-offs

- [Hover-open dropdown dễ flicker khi lướt chuột] → delay đóng ~100–150ms + vùng hover gồm cả trigger lẫn panel; click vẫn là đường chính.
- [Workplace ▾ 8 item hơi dài] → 1 cột có icon, thứ tự theo tần suất (Subjects → Resources → Challenges → …); nếu sau này quá dài mới nâng mega-menu 2 cột — ngoài scope.
- [Người quen "Explore" mất chỗ cũ] → mọi đích vẫn còn, bảng D2 là contract; search overlay (Ctrl/K) tìm được mọi trang.
- [AccountMenuAuthed thêm 4 mục làm menu dài] → chia section có divider ("Bạn" / "Hệ thống"), giữ thứ tự cũ ở đầu.

## Migration Plan

1. Refactor `useAppNav` sang cấu trúc module 2 cấp (D1+D2).
2. Viết lại `HeaderNav` theo D3/D4; xoá mega-menu Explore.
3. Viết lại body mobile drawer theo D5.
4. Thêm nhóm mục mới vào `AccountMenuAuthed`.
5. i18n vi/en; verify `npm run build` + `tsc --noEmit`.

Rollback: revert commit (FE-only, không di trú dữ liệu).

## Open Questions

- Không còn — mapping D2 đã chốt toàn bộ; "Saved" chờ route thật ở change riêng.
