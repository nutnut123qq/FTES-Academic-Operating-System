# Tasks — App Shell Header-Only Navigation

## 1. Nav data source (single source of truth)

- [x] 1.1 Refactor `src/components/features/app-shell/useAppNav.tsx` sang cấu trúc 2 cấp `AppNavModule { key, label, icon, path, isActive, children }` với đúng 4 module Home/Workplace/Course/Community theo bảng D2 của design.md (Home `children: []`)
- [x] 1.2 Active-state: child = prefix-match path; module = OR(children) ∪ prefix(path chính); Home chỉ active ở đúng home path
- [x] 1.3 Thêm i18n key `nav.workplace`, `nav.course` (+ nhãn con còn thiếu, nhãn section account menu) vào `src/messages/vi.json` và `src/messages/en.json`

## 2. Desktop HeaderNav

- [x] 2.1 Viết lại `src/components/features/navbar/Navbar/HeaderNav/index.tsx`: 4 module — Home link thuần; Workplace/Course/Community = link + caret trigger mở Popover dropdown 1 cột (icon + label, item active tô accent, chọn item đóng menu)
- [x] 2.2 Xoá mega-menu "Explore" và mọi tham chiếu `section.explore` không còn dùng trong HeaderNav
- [x] 2.3 Hover-open với close-delay ~150ms (vùng hover gồm trigger + panel); tối đa 1 dropdown mở — mở menu mới đóng menu cũ
- [x] 2.4 A11y: `nav` có `aria-label`; trigger có `aria-expanded`/`aria-haspopup`; Enter/Space mở, ArrowUp/Down duyệt item, ESC đóng + trả focus trigger, blur/click-ngoài đóng

## 3. Mobile drawer

- [x] 3.1 Viết lại body drawer trong `src/components/features/navbar/Navbar/index.tsx`: hàng Home link + 3 nhóm accordion Workplace/Course/Community (link chính của module + children), cùng nguồn `useAppNav`
- [x] 3.2 Nhóm chứa route active mặc định mở sẵn; chọn item → navigate + đóng drawer; giữ nguyên rows language/theme cuối drawer

## 4. Account menu (đích di trú)

- [x] 4.1 Thêm vào `AccountMenuAuthed` hai section có label + divider: "Bạn" (Activity `/activity`, Wallet `/wallet`) và "Hệ thống" (Integrations `/integrations`, Roles `/admin/roles`), giữ nguyên các mục cũ ở đầu

## 5. Guard & rà soát

- [x] 5.1 Rà soát toàn app KHÔNG còn/không thêm sidebar trái toàn cục nào; xác nhận `SubjectWorkspaceShell` rail không bị sửa (git diff không đụng file)
- [x] 5.2 Đối chiếu bảng D2: click-through đủ 21 đích đến từ header/drawer/account menu — không route nào mất đường vào

## 6. Verify

- [ ] 6.1 `npm run build` (webpack) xanh — build: batch-verified by orchestrator
- [x] 6.2 `tsc --noEmit` sạch

## 7. Delta amendment — directive chủ sản phẩm: header = LINK THUẦN, không sub-menu (header đã ship với dropdown; đây là ĐẢO hướng)

- [ ] 7.1 Đơn giản hoá `src/components/features/app-shell/useAppNav.tsx`: header đọc 4 module `{ key, label, icon, path, isActive }`; **bỏ `children` khỏi đường header** (drop dropdown data). Giữ 4 module Home/Workplace/Course/Community với path landing đúng (`/`, `/subjects`, `/courses`, `/community`)
- [ ] 7.2 Viết lại `src/components/features/navbar/Navbar/HeaderNav/index.tsx` thành **4 link nhãn thuần**: gỡ HeroUI `Popover`/caret/chevron, gỡ hover-open + close-delay, gỡ roving-focus/ArrowUp-Down/ESC-đóng logic; mỗi module là `Link` tới landing route; giữ active-state theo prefix; gỡ `aria-haspopup`/`aria-expanded`
- [ ] 7.3 Đơn giản hoá mobile drawer trong `src/components/features/navbar/Navbar/index.tsx`: thay 3 nhóm accordion + children bằng **4 hàng link thuần** (Home, Workplace, Course, Community); tap → điều hướng landing + đóng drawer; giữ rows language/theme
- [ ] 7.4 Bỏ `ai` khỏi Workplace và `recommendations` khỏi Course trong data nav (nếu còn) — discovery shortcuts vào profile popup (owner `profile-avatar-hub`); `/ai` + `/recommendations` vẫn là route hợp lệ, reachable qua popup
- [ ] 7.5 Dọn i18n dropdown chết: gỡ key nhãn con chỉ dùng cho dropdown header nếu không còn consumer nào (`nav.*` con của Workplace/Course/Community dùng trong trang landing thì GIỮ; chỉ dọn key mồ côi thật). KHÔNG dead-key
- [ ] 7.6 Rà soát KHÔNG route mồ côi: resources, challenges, leaderboard, workflow, analytics, career, marketplace, groups, events, chat, feed vẫn reachable từ TRONG trang section tương ứng; search (Ctrl/K) tìm mọi trang; xác nhận `SubjectWorkspaceShell` rail không bị đụng
- [ ] 7.7 Ghi chú: đây là amendment trên header ĐÃ SHIP (bản dropdown). Build được orchestrator verify (batch). `tsc --noEmit` phải sạch sau khi gỡ Popover/hover logic
