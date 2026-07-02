# App Shell — Header-Only Navigation (4 Module Groups)

## Why

Người dùng chốt: trang nào cũng KHÔNG cần sidebar trái toàn cục — toàn bộ điều hướng chính dồn lên header với đúng 4 module: **Home · Workplace · Course · Community**, mọi tính năng còn lại lồng bên trong các mục đó (dropdown/mega-menu). Header hiện tại lệch ý đồ: hàng link là Subjects · Courses · Community + một mega-menu "Explore" gom hỗn hợp 4 nhóm, khiến IA phẳng và mục "Explore" vô danh. Chỉ riêng Workplace (không gian môn học) nhiều tính năng nên được giữ rail trái riêng của `SubjectWorkspaceShell`.

## What Changes

- **Header IA còn đúng 4 mục cấp 1**: Home (`/`) · Workplace (`/subjects`) · Course (`/courses`) · Community (`/community`). **[Amendment — hướng mới, ĐẢO thiết kế dropdown cũ]** Mỗi mục là **LINK NHÃN THUẦN**: bấm vào điều hướng tới trang landing của module đó, KHÔNG dropdown / KHÔNG caret / KHÔNG hover sub-menu / KHÔNG mega-menu. Các tính năng con dùng TỪ TRONG trang landing của module.
- **Bỏ mega-menu "Explore" VÀ bỏ mọi dropdown per-module** — mọi đích đến hiện có được phân bổ lại vào trang landing của 4 module, hoặc vào Account menu (Activity, Wallet, Integrations, Roles), hoặc profile/avatar popup, KHÔNG route nào mất đường vào.
- **[Amendment — hướng mới của product owner: header = link thuần, không sub-menu]** Header đã được ship theo bản dropdown; đây là delta ĐẢO hướng (thầy: *"Cái mục trên header đừng hiện sub-menu, chỉ hiển thị thôi, bấm vô rồi dùng tính năng sau"*):
  - **Không dropdown ở BẤT KỲ module nào** — kể cả Community. Trước đây Community ▾ lộ Groups + Events khi hover; nay bỏ hẳn dropdown: Community là link thuần tới `/community`, còn Groups/Events/Chat dùng từ tab/sub-nav TRONG trang Community.
  - **Tính năng con vào trong trang landing**: Workplace features (resources, challenges, leaderboard, workflow, analytics, career) dùng từ trong trang Workplace/subject-workspace; Course (marketplace + catalog) từ trong trang Course; Community (groups, events, chat) từ tab trong trang Community.
  - **Discovery shortcuts KHÔNG còn là header module** — global AI hub, For You, Recommendations, Trending chuyển sang **profile/avatar popup** (owner: change `profile-avatar-hub`, section "Khám phá"). Vì header không còn dropdown nên chúng cũng không nằm ở bất kỳ sub-menu header nào. Route `/ai` và `/recommendations` vẫn hợp lệ và reachable qua popup → KHÔNG route nào mồ côi.
- **Mobile drawer** tái cấu trúc thành **4 LINK THUẦN** (Home, Workplace, Course, Community) — KHÔNG accordion, KHÔNG children — khớp desktop; giữ rows language/theme.
- **Khẳng định luật shell**: KHÔNG sidebar trái toàn cục ở bất kỳ trang nào; ngoại lệ duy nhất là rail trái của `SubjectWorkspaceShell` (giữ nguyên, không đổi).
- Active-state theo prefix route, a11y link đơn giản (Tab qua 4 link, Enter điều hướng — KHÔNG còn menubar/disclosure/ESC vì không có menu), i18n vi/en cho nhãn mới.
- Cụm phải của header (Search Ctrl/K, chuông, ngôn ngữ, theme, account) giữ nguyên vị trí; Account menu nhận thêm nhóm mục cá nhân/hệ thống.

## Capabilities

### New Capabilities

- `app-shell-navigation`: cấu trúc điều hướng toàn cục của app shell — header 4 module **link thuần (không sub-menu)**, mobile drawer 4 link thuần, tính năng con dùng từ trong trang landing của module, luật không-sidebar, active-state, a11y và i18n cho điều hướng.

### Modified Capabilities

<!-- Không có: subject-workspace-overview (rail của workspace) giữ nguyên hành vi; các spec hiện có khác không chứa yêu cầu về nav toàn cục. -->

## Impact

- **Code**: `src/components/features/app-shell/useAppNav.tsx` (đơn giản hoá về 4 module cho header — bỏ `children` khỏi đường header, single source of truth), `src/components/features/navbar/Navbar/HeaderNav/index.tsx` (4 link thuần — gỡ Popover/caret/hover-open), `src/components/features/navbar/Navbar/index.tsx` (mobile drawer = 4 link thuần), `src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx` (nhận Activity/Wallet/Integrations/Roles), `src/messages/vi.json` + `en.json` (nhãn nav; dọn i18n dropdown chết nếu có).
- **Không đổi**: routes/pages, `SubjectWorkspaceShell` rail, cụm phải header, search overlay.
- **FE-only, mock BE** — không có thay đổi API.
