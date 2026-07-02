# App Shell — Header-Only Navigation (4 Module Groups)

## Why

Người dùng chốt: trang nào cũng KHÔNG cần sidebar trái toàn cục — toàn bộ điều hướng chính dồn lên header với đúng 4 module: **Home · Workplace · Course · Community**, mọi tính năng còn lại lồng bên trong các mục đó (dropdown/mega-menu). Header hiện tại lệch ý đồ: hàng link là Subjects · Courses · Community + một mega-menu "Explore" gom hỗn hợp 4 nhóm, khiến IA phẳng và mục "Explore" vô danh. Chỉ riêng Workplace (không gian môn học) nhiều tính năng nên được giữ rail trái riêng của `SubjectWorkspaceShell`.

## What Changes

- **Header IA còn đúng 4 mục cấp 1**: Home (`/`) · Workplace (`/subjects`) · Course (`/courses`) · Community (`/community`). Mỗi mục (trừ Home) vừa là link vừa mở dropdown chứa các tính năng con; Home là link thuần.
- **Bỏ mega-menu "Explore"** — mọi đích đến hiện có được phân bổ lại vào 4 mục hoặc vào Account menu (Activity, Wallet, Integrations, Roles), KHÔNG route nào mất đường vào.
- **Mobile drawer** tái cấu trúc thành cùng 4 nhóm (Home link + 3 nhóm accordion), cùng nguồn dữ liệu nav với desktop.
- **Khẳng định luật shell**: KHÔNG sidebar trái toàn cục ở bất kỳ trang nào; ngoại lệ duy nhất là rail trái của `SubjectWorkspaceShell` (giữ nguyên, không đổi).
- Active-state theo prefix route, a11y menubar/disclosure (keyboard, ESC/blur đóng), i18n vi/en cho nhãn mới.
- Cụm phải của header (Search Ctrl/K, chuông, ngôn ngữ, theme, account) giữ nguyên vị trí; Account menu nhận thêm nhóm mục cá nhân/hệ thống.

## Capabilities

### New Capabilities

- `app-shell-navigation`: cấu trúc điều hướng toàn cục của app shell — header 4 module + dropdown tính năng, mobile drawer 4 nhóm, luật không-sidebar, active-state, a11y và i18n cho điều hướng.

### Modified Capabilities

<!-- Không có: subject-workspace-overview (rail của workspace) giữ nguyên hành vi; các spec hiện có khác không chứa yêu cầu về nav toàn cục. -->

## Impact

- **Code**: `src/components/features/app-shell/useAppNav.tsx` (cấu trúc dữ liệu nav — single source of truth), `src/components/features/navbar/Navbar/HeaderNav/index.tsx` (4 mục + dropdown), `src/components/features/navbar/Navbar/index.tsx` (mobile drawer), `src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx` (nhận Activity/Wallet/Integrations/Roles), `src/messages/vi.json` + `en.json` (nhãn nav).
- **Không đổi**: routes/pages, `SubjectWorkspaceShell` rail, cụm phải header, search overlay.
- **FE-only, mock BE** — không có thay đổi API.
