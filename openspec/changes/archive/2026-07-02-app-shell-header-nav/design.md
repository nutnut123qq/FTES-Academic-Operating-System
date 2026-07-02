# Design — App Shell Header-Only Navigation

## Context

- Header hiện tại (`Navbar` → `HeaderNav`): 3 link phẳng (Subjects · Courses · Community) + mega-menu "Explore" 1 popover gom mọi thứ còn lại. Mobile drawer render tất cả nhóm của `useAppNav`.
- `useAppNav` (`src/components/features/app-shell/useAppNav.tsx`) là nguồn nav duy nhất, hiện chia 6 nhóm phẳng (top/learn/community/explore/you/system) — không mô hình hoá quan hệ "module cha → tính năng con".
- Không có sidebar trái toàn cục nào tồn tại; `SubjectWorkspaceShell` có rail trái riêng (GIỮ NGUYÊN).
- Ràng buộc: FE-only (mock BE), HeroUI + phosphor, i18n vi/en qua `next-intl`, build verify = `npm run build` (webpack) + `tsc --noEmit`.

## Goals / Non-Goals

**Goals**
- Header đúng 4 module cấp 1: Home · Workplace · Course · Community — **link nhãn thuần, không sub-menu** (xem D9). Tính năng con dùng TỪ TRONG trang landing của module.
- Một nguồn dữ liệu nav duy nhất (`useAppNav`) nuôi cả desktop header lẫn mobile drawer (header chỉ dùng 4 module, không dùng `children`).
- Mọi đích đến của nav hiện tại vẫn reachable sau tái cấu trúc (bảng migration bên dưới) — từ trong trang landing, Account menu, profile popup, hoặc search.
- A11y link đơn giản + keyboard (Tab qua 4 link, Enter điều hướng) — không menubar/disclosure vì không còn menu.

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
- **[Delta hướng-mới / D9]** Header và mobile drawer nay chỉ render 4 **link module** — KHÔNG dùng `children`. `children` có thể **bỏ hẳn khỏi đường header** (`useAppNav` đơn giản hoá còn `{ key, label, icon, path, isActive }` cho header). Chỉ giữ `children` nếu có consumer khác thật sự cần; theo directive này drawer cũng là link thuần nên `children` không cần cho nav shell nữa.

### D2 — Ánh xạ IA (migration đầy đủ — KHÔNG route nào mồ côi)

Nguồn: 21 đích đến hiện có trong `useAppNav`. **[Delta hướng-mới]** Header KHÔNG còn dropdown — cột "Vị trí MỚI" cho các tính năng con nay là "trong trang landing của module", không phải "▾".

| Đích hiện tại | Path | Vị trí MỚI |
|---|---|---|
| Home | `/` | Header: **Home** (link nhãn thuần) |
| Subjects | `/subjects` | **Workplace** = link nhãn header (landing) |
| Resources | `/resources` | Trong trang Workplace/subject-workspace (không ở header) |
| Challenges (Practice) | `/challenges` | Trong trang Workplace/subject-workspace |
| Leaderboard | `/leaderboard` | Trong trang Workplace/subject-workspace |
| ~~AI Hub~~ | `/ai` | **[Delta]** → Profile/avatar popup, section "Khám phá" (owner: `profile-avatar-hub`) — không ở header |
| Workflow (Kanban) | `/workflow` | Trong trang Workplace/subject-workspace |
| Analytics | `/analytics` | Trong trang Workplace/subject-workspace |
| Career | `/career` | Trong trang Workplace/subject-workspace |
| Courses | `/courses` | **Course** = link nhãn header (catalog landing) |
| Marketplace | `/marketplace` | Trong trang Course (catalog) |
| ~~Recommendations~~ | `/recommendations` | **[Delta]** → Profile/avatar popup, section "Khám phá" (owner: `profile-avatar-hub`) — không ở header |
| Community | `/community` | **Community** = link nhãn header (feed landing) |
| Groups | `/groups` | Trong tab/sub-nav của trang Community |
| Events | `/events` | Trong tab/sub-nav của trang Community |
| Chat | `/chat` | Trong tab/sub-nav của trang Community |
| Search | `/search` | Cụm phải header (SearchButton + Ctrl/K) — đã có, giữ nguyên |
| Activity | `/activity` | AccountMenuDropdown (nhóm "Bạn") |
| Wallet | `/wallet` | AccountMenuDropdown (nhóm "Bạn") |
| Integrations | `/integrations` | AccountMenuDropdown (nhóm "Hệ thống") |
| Roles | `/admin/roles` | AccountMenuDropdown (nhóm "Hệ thống") |

- Lý do Workplace ôm tính năng: user chốt "workplace nhiều tính năng" — đây là không gian làm việc học tập (môn học, tài nguyên, luyện tập, kanban, số liệu, hướng nghiệp). **[Delta hướng-mới]** Header CHỈ là link `/subjects`; các tính năng (Resources, Challenges, Leaderboard, Workflow, Analytics, Career) dùng TỪ TRONG trang Workplace/subject-workspace, KHÔNG liệt kê ở header. AI Hub đã gỡ (xem D8).
- Activity/Wallet/Integrations/Roles là mục cá nhân/quản trị, không thuộc 4 module học — vào Account menu (vẫn là header, đúng intent "nhét hết lên header"). Alternative bị loại: nhét vào Home dropdown → Home thành "Explore" trá hình.
- "Saved/bookmark": chưa có route riêng trong `pathConfig` — không bịa; các item đã lưu hiển thị bên trong Resources/Profile như hiện trạng. Khi có route thật sẽ nest vào Workplace ▾ (ghi chú cho change sau).

### D3 — [SUPERSEDED by D9] Desktop: (bản cũ) split trigger link + dropdown

> **⚠️ Bị thay thế bởi D9.** Bản gốc: mỗi module (Workplace/Course/Community) render link + caret mở HeroUI `Popover` dropdown 1 cột, hover-open. Product owner đã ĐẢO hướng này — xem D9. Giữ lại đây để truy vết lịch sử thiết kế; KHÔNG implement bản dropdown.

### D4 — [SUPERSEDED by D9] A11y disclosure-nav (bản cũ)

> **⚠️ Bị thay thế bởi D9.** Bản gốc dùng disclosure-nav pattern (`aria-expanded`/`aria-haspopup="menu"`, mũi tên duyệt item, ESC đóng). Vì D9 bỏ hết dropdown, a11y rút về **link đơn giản**: `<nav aria-label>` chứa 4 link, Tab qua, Enter điều hướng; KHÔNG `aria-haspopup`/`aria-expanded`, KHÔNG focus-trap, KHÔNG ESC-đóng (không có gì để đóng).

### D5 — Mobile drawer: 4 LINK THUẦN gương desktop

- Drawer giữ nguyên chỗ mở (icon expand). Nội dung: **4 hàng link thuần** (Home, Workplace, Course, Community) — KHÔNG accordion, KHÔNG children. Tap 1 hàng → điều hướng tới landing của module + đóng drawer. Language/theme rows giữ nguyên cuối drawer. (Bản cũ là 3 nhóm accordion + children — bị D9 thay thế cho khớp desktop link-thuần.)

### D6 — Luật shell: không sidebar trái toàn cục

- Không thêm bất kỳ component sidebar/rail toàn cục nào; requirement spec hoá để guard tương lai. Ngoại lệ duy nhất: rail trong `SubjectWorkspaceShell` (in-context của workspace) — không sửa file đó.

### D7 — i18n

- Key mới dưới `nav.`: `workplace`, `course` (nếu chưa có), `section.you`/`section.system` tái dùng cho account menu, và nhãn con giữ key hiện có (`subjects`, `resources`, …) — vi + en trong `src/messages/{vi,en}.json`. Không hardcode chuỗi.

### D8 — [Amendment] Community lộ Group + Event khi hover; discovery shortcuts rời header sang profile popup

Bối cảnh: header đã ship theo D1–D7. Product owner đổi hướng: *"Bỏ phần Explore đi. Hover vào Community thì hiện ra Group, Event… Mấy cái Explore như AI, For you… nhét vào chỗ profile popup (avatar dropdown)."* Delta:

- **Community giữ dropdown, hover PHẢI lộ Groups + Events.** Không đổi cấu trúc (feed/groups/events/chat vẫn nguyên) — chỉ khẳng định thành contract: hover/mở Community ▾ → Groups và Events luôn hiển thị (hai đích cộng đồng chính user muốn nhấn).
- **Gỡ `ai` khỏi Workplace ▾ và `recommendations` khỏi Course ▾.** Đây là các "discovery shortcut" (khám phá) — không thuộc bản chất module học/khoá. Sau delta: Workplace ▾ = subjects, resources, challenges, leaderboard, workflow, analytics, career; Course ▾ = catalog, marketplace.
- **Discovery shortcuts KHÔNG là header module.** Global AI hub (`/ai`), For You (community For You feed), Recommendations (`/recommendations`), Trending (community trending) chuyển sang **profile/avatar popup**, section "Khám phá" — **owner: change `profile-avatar-hub`** (spec + implement bên đó). Change này chỉ gỡ khỏi header + cross-reference.
- **Không route mồ côi.** `/ai` và `/recommendations` vẫn là route hợp lệ, vẫn reachable — chỉ đổi entry point từ header dropdown sang profile popup. Search (Ctrl/K) vẫn tìm ra mọi trang.
- **Coupling ship chung:** việc sửa `useAppNav.tsx` để bỏ `ai` + `recommendations` được thực hiện bởi change `profile-avatar-hub` (header + popup ship cùng lúc để không có khoảng thời gian route mất đường vào). Change này ghi task như delta cụ thể để khớp.

### D9 — [Amendment / directive chủ sản phẩm] Header = LINK THUẦN, không sub-menu

Bối cảnh: header đã ship theo D1–D8 (có dropdown). Product owner ĐẢO hướng (VN): *"Cái mục trên header đừng hiện sub-menu, chỉ hiển thị thôi, bấm vô rồi dùng tính năng sau."* → D9 THAY THẾ D3 (split trigger + dropdown), D4 (disclosure a11y) và phần accordion của D5. Contract mới:

- **4 module = 4 link nhãn thuần.** Bấm module → điều hướng tới landing route của nó (Home `/`, Workplace `/subjects`, Course `/courses`, Community `/community`). KHÔNG `Popover`, KHÔNG caret/chevron, KHÔNG hover-open, KHÔNG click sub-menu, KHÔNG mega-menu — ở BẤT KỲ module nào (kể cả Community, vốn từng lộ Groups/Events khi hover ở D8; nay bỏ dropdown hoàn toàn).
- **Tính năng con dùng TỪ TRONG trang landing.** Workplace features (resources/challenges/leaderboard/workflow/analytics/career) từ trong trang Workplace/subject-workspace; Community sub-areas (groups/events/chat + tab feed) từ tab của trang Community; Course (marketplace + catalog) từ trong trang Course. Header không liệt kê chúng.
- **`HeaderNav` gỡ hết logic dropdown**: bỏ Popover/caret/hover-open/close-delay/roving-focus; render 4 link + active-state theo prefix (giữ). **Mobile drawer** cũng thành 4 link thuần (bỏ accordion + children).
- **`useAppNav` đơn giản hoá**: header đọc 4 module `{ key, label, icon, path, isActive }`; `children` bị drop khỏi đường header (giữ lại chỉ khi consumer khác cần — theo directive drawer cũng link thuần nên không cần).
- **Không route mồ côi:** mọi tính năng từng nằm trong dropdown (resources, challenges, leaderboard, workflow, analytics, career, marketplace, groups, events, chat, feed) vẫn là route hợp lệ, reachable từ trong trang section tương ứng; discovery shortcuts (AI `/ai`, For You, Recommendations `/recommendations`, Trending) ở profile/avatar popup (owner `profile-avatar-hub`); search (Ctrl/K) vẫn tìm mọi trang.
- Alternative bị loại: giữ dropdown "cho tiện" — trái directive tường minh; hoặc để Community riêng có dropdown còn module khác không — không nhất quán, thầy nói "cái mục trên header" (mọi mục) đừng hiện sub-menu.

## Risks / Trade-offs

- [~~Hover-open dropdown flicker~~] → **N/A sau D9**: không còn dropdown nên không còn flicker.
- [Header link thuần → tính năng con "ẩn" một tầng sâu] → chủ đích directive: bấm module vào landing rồi dùng tính năng từ đó; trang landing của mỗi module chịu trách nhiệm phơi tính năng con (tab/sub-nav/section). Search (Ctrl/K) là lối tắt phụ tới mọi trang.
- [Người quen "Explore"/dropdown mất chỗ cũ] → mọi đích vẫn là route hợp lệ, bảng D2 (cột "trong trang landing") là contract; search overlay (Ctrl/K) tìm được mọi trang. **[Delta]** discovery shortcuts (AI, For You, Recommendations, Trending) nay ở profile/avatar popup (section "Khám phá", owner `profile-avatar-hub`), không mất đường vào.
- [AccountMenuAuthed thêm 4 mục làm menu dài] → chia section có divider ("Bạn" / "Hệ thống"), giữ thứ tự cũ ở đầu.

## Migration Plan

1. **[Amendment trên header đã ship]** Đơn giản hoá `useAppNav` về 4 module cho header (bỏ `children` khỏi đường header — D1/D9).
2. Viết lại `HeaderNav` theo **D9**: 4 link thuần, gỡ Popover/caret/hover-open/roving-focus; xoá mega-menu Explore.
3. Viết lại body mobile drawer theo **D5** mới: 4 link thuần (bỏ accordion + children).
4. Thêm nhóm mục mới vào `AccountMenuAuthed`; dọn i18n dropdown chết nếu có.
5. i18n vi/en; verify `npm run build` + `tsc --noEmit`.

Rollback: revert commit (FE-only, không di trú dữ liệu).

## Open Questions

- Không còn — mapping D2 đã chốt toàn bộ; "Saved" chờ route thật ở change riêng.
