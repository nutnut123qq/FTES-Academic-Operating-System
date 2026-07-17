# Tasks — fe-starci-ui-refinements

Chế độ **GẤP**: implement → `npx tsc --noEmit` sau mỗi mục; finding không chặn ghi xuống mục
"Findings" cuối file (không dừng lane). i18n vi+en đủ key. Component theo cannon nhà (HeroUI,
hook SWR). KHÔNG commit ở bước viết spec.

## 1. search-command-palette (popup command palette giữa màn hình)
- [x] 1.1 `SearchOverlay/index.tsx`: đổi `Drawer.Backdrop`/`Drawer.Content placement="right"` →
      HeroUI `Modal` **giữa màn hình**, `Modal.Dialog` `rounded-2xl p-0` (theo `GlobalSearchModal`
      StarCI); ô input trên cùng (`SearchOverlayInput`) + badge `Kbd Esc`, list kết quả trong body,
      footer key-hints. Giữ `data-search-overlay` để Navbar Ctrl/K không stack.
- [x] 1.2 Mục **"Phổ biến"** khi query rỗng: `SearchPopular` + hook mới `usePopularSearchRows`
      (map `useQueryRecommendedCoursesSwr` → row icon + title + giá), điều hướng thẳng; recent giữ
      dưới. Không dead-blank (fallback idle hint khi không có popular lẫn recent).
- [x] 1.3 Kết quả live: mỗi row **icon + title + giá/phụ đề** (`SearchRow.price` mới, trailing accent);
      chọn row → `router.push(row.href)` đóng popup, **KHÔNG** qua `/search`. Combobox a11y (↑↓ wrap ·
      ⏎ · Esc) hợp nhất trên `navRows` (idle=popular, typed=results).
- [x] 1.4 `Navbar/index.tsx`: Ctrl/Cmd+K **mở popup** mọi viewport (bỏ nhánh desktop-focus-inline +
      `searchInputRef`); nút/ô search → `openSearch()`. `SearchInline` → **trigger button**
      (`InputButtonLike` + label + `Ctrl K` badge). Xoá `SearchDropdown.tsx` + logic dropdown/activeIndex.
- [x] 1.5 i18n `search.*` (vi+en): thêm `free` (Miễn phí/Free); `popular`/`hint.*` đã có sẵn.
- [x] 1.6 `npx tsc --noEmit` sạch + eslint sạch + unit test (Navbar.shortcut, SearchInline) xanh.
      Runtime smoke còn nợ (auth-gated) — xem Findings.

## 2. course-package-pricing-card (card mua gói gọn)
- [x] 2.1 `CourseDetail/index.tsx` `PackageEnrollCard`: headline = **giá gói chọn LỚN** +
      **giá gốc gạch** + **badge `-%`** (tính từ `packagePrice()` original vs discounted). Badge `-%`
      do block `PriceTag` render sẵn (chip success `−X%` = list→charge gap) → không key i18n riêng.
- [x] 2.2 Dòng scarcity **màu cam** (`text-warning`, "Còn N suất Early bird") — WIRED qua helper
      `packageSlots()`; `PackageView` hiện KHÔNG có field suất → luôn null → line ẩn (không mock số),
      tự bật khi BE gửi `slotAvailable`. Xem Findings [2].
- [x] 2.3 List gói dạng **RADIO** qua `SelectableCardGroup variant="list"`: tên trái, giá phải; gói
      đang chọn **highlight accent** (list variant `bg-accent/10`) + chip **"Đang mở"** cạnh tên.
- [x] 2.4 CTA 3 tầng: **Enroll** (`package.buy`) primary full-width; khi product đã trong giỏ
      (`useGetCartSwr` khớp `productId`) → primary flip **"In cart"** (CheckIcon + TrashIcon, press =
      `usePostRemoveCartItemSwr`); **Học thử miễn phí** secondary; dòng **"N người đã đăng ký"** dưới
      cùng (`course.enrollmentCount`, đã có). `EnrollCard` legacy giữ nguyên — xem Findings [3].
- [x] 2.5 i18n (vi+en): `detail.inCart`, `detail.earlyBirdSlots`, `detail.package.active` ("Đang mở").
      `discountBadge` KHÔNG thêm (PriceTag sở hữu badge) — tránh key chết.
- [x] 2.6 `npx tsc --noEmit` sạch + eslint file sửa sạch + JSON hợp lệ. Runtime smoke (đổi gói đổi
      giá+badge, add→In cart→xoá, Học thử) còn nợ (auth-gated) — xem Findings [4].

## 3. lesson-title-hierarchy (đảo thứ bậc tiêu đề outline)
- [x] 3.1 `CourseDetail/index.tsx` syllabus header (~L464–476): thêm eyebrow **"Phần {index+1}"**
      (`Typography type="body-xs" color="muted"` + `uppercase tracking-wide`) PHÍA TRÊN; `section.title`
      nâng thành **nổi bật** (`type="body"` `weight="semibold"`, màu foreground mặc định, bỏ `truncate`
      → `line-clamp-2`); description giữ dưới tiêu đề.
- [x] 3.2 `learn/ContentMap/index.tsx` accordion trigger (cùng pattern): eyebrow "Phần N" nhỏ
      (`courseSystem`-style, dùng `learn.contentMap.partLabel`) với index ỔN ĐỊNH theo thứ tự module
      GỐC (`modulePartIndex` map — filter bỏ module rỗng không renumber); `module.title` giữ `body-sm`
      semibold, bỏ `truncate` → `line-clamp-2`; description dưới; GIỮ chip tiến độ.
- [x] 3.3 i18n `courseSystem.detail.partLabel` = "Phần {index}"/"Part {index}" (vi+en) +
      `learn.contentMap.partLabel` = "Phần {index}"/"Part {index}" (ContentMap ở namespace `learn`).
- [x] 3.4 `npx tsc --noEmit` sạch + eslint 2 file sửa sạch. Kiểm mắt (auth-gated) còn nợ — xem Findings [5].

## 4. profile-gamification-redesign (`/profile` 2 cột, data thật)
- [x] 4.1 `ProfileShell/index.tsx` cột trái: thêm **level chip** (từ `useQueryMyGamificationSwr.level`
      — `SelfProfile` KHÔNG có `level`, xem Findings [6]), **@username** (`SelfProfile.username`),
      **followers/following** (real từ `useQueryPublicProfileSwr(username).counters` — SelfProfile
      KHÔNG có field này, Findings [6]), **badges** (medal strip từ `gamification.badges`, cap 6 +N),
      **Joined date** (`SelfProfile.createdAt`, month + year), nút **Edit** + **Share profile**
      (`toast.success` + Web Share/clipboard, mirror StarCI `ShareProfileButton`). `toShellProfile`
      bổ sung `username`/`joinedAt`.
- [x] 4.2 Section **Courses** (`ProfileCourses` mới, render trong `ProfilePersonal`): card mỗi khoá từ
      `useQueryMyCoursesSwr` (course/hooks) — badge **Enrolled/Trial** (`isPurchased`, đã thêm field
      vào `MyCourse`), **% + progress bar** (`ProgressMeter`). Dòng **Content/Challenges/Milestone
      counts** ẩn HOÀN TOÀN — `EnrollmentView` chỉ có `completionPercent`, không có per-dimension
      totals → không mock (Findings [7]). Empty state khi chưa có khoá.
- [x] 4.3 Section **Contributions** (`ProfileContributions` mới): heatmap thật `useGetMyActivityDaysSwr`
      + **chọn năm** (segmented current+2) — map năm → `weeks` (clamp 13..260) để cửa sổ today-anchored
      chạm tới năm chọn, filter days theo năm; dòng **"{n}-day streak · longest {m}"** từ
      `useGetMyStreakSwr` (`currentStreak`/`longestStreak`). `AsyncContent` + skeleton như
      `OverviewContributions` StarCI. Dùng model của block `StreakHeatmap` (`xpLevel`/`XP_LEVEL_CLASS`)
      cho grid year-anchored — xem Findings [8].
- [x] 4.4 Section **Job readiness** + **Skills**: **EMPTY STATE** tử tế (`EmptyContent`, icon +
      copy "sắp có") trong `ProfilePersonal` — KHÔNG mock số liệu.
- [x] 4.5 Giữ **các route con profile hiện có** + tab bar `ProfileShell` (SECTIONS không đổi). Chỉ đổi
      `/profile` root (`ProfilePersonal` thêm section overview) + identity sidebar (`ProfileShell`).
- [x] 4.6 i18n `profile.*` (vi+en): `level`, `followers`/`following`, `joined`, `shareProfile`,
      `shareCopied`, `courses.*` (title/trial/enrolled/empty/progressAria), `contributions.*`
      (title/yearAria/streakLine/cellLabel/loadError), `jobReadiness.title`, `skills.title`,
      `empty.jobReadiness`, `empty.skills`. (legend dùng lại `dashboard.contributions.less/more`).
- [x] 4.7 `npx tsc --noEmit` sạch + eslint 7 file sửa sạch. Kiểm mắt (auth-gated) còn nợ — Findings [9].

## Findings — mục 4 (chế độ gấp)
- **[6] `SelfProfile` KHÔNG có `level`/`followers`/`following`.** Contract `SelfProfile`
  (`src/modules/api/rest/profile/types.ts`) chỉ có username/createdAt/... — không có `level`,
  `followers`, `following` (những field này nằm ở `PublicProfile`: `progress.level`, `counters`).
  → level lấy từ `useQueryMyGamificationSwr` (đã dùng sẵn ở ProfileShell); followers/following lấy
  REAL từ `useQueryPublicProfileSwr(self.username).counters` (đã bổ sung `following` vào view model).
  Row followers/following tự ẩn khi cả hai = 0 (không bịa). `toShellProfile` thêm `username`/`joinedAt`.
- **[7] Course counts (Content/Challenges/Milestone) KHÔNG có nguồn.** `EnrollmentView`
  (`GET /courses/me/enrollments`) chỉ có `courseId/courseTitle/slugName/active/completionPercent/
  isPurchased` — không có per-dimension totals. → card khoá CHỈ hiện badge Enrolled/Trial + % +
  progress bar; dòng counts BỎ hẳn (không mock). Tự bật khi BE thêm field. `MyCourse` đã thêm
  `isPurchased` (tolerant Boolean) cho badge.
- **[8] Heatmap year-anchored (không tái dùng trực tiếp component `StreakHeatmap`).** Block
  `StreakHeatmap` cố định cửa sổ ENDING TODAY (weeks×7) nên không render được 1 năm dương lịch bất kỳ.
  → `ProfileContributions` tự dựng grid theo NĂM (Sun-aligned Jan1..Dec31, cell tương lai để trống)
  nhưng TÁI DÙNG model của block (`xpLevel` + `XP_LEVEL_CLASS`) → token/tier y hệt. REST activity-days
  không có date-range param (chỉ `weeks` today-anchored) → năm quá xa ngoài cửa sổ (clamp 260 tuần ≈5y)
  sẽ hiện cell trống (không bịa). Đổi năm → đổi `weeks` → re-key SWR (refetch).
- **[9] Runtime smoke mục 4 chưa chạy (auth-gated).** Mọi hook (`/profiles/me`, `/profiles/{username}`,
  `/courses/me/enrollments`, `/gamification/me/activity-days`, `/gamification/me/streak`,
  `useQueryMyGamificationSwr`) là signed-in. Cần smoke tay: mở `/profile` → sidebar hiện avatar +
  level chip + @username + followers/following (nếu >0) + badges + Edit/Share + Joined "Tháng M YYYY";
  Share → clipboard copy + toast; cột phải: Courses (badge Enrolled/Trial + %/bar) hoặc empty;
  Contributions heatmap + đổi năm refetch + streak line; Job readiness/Skills = empty state; các tab
  con (academic/portfolio/...) vẫn mở như cũ.

## 5. course-detail-thumbnail-rounded (bo tròn thumbnail)
- [x] 5.1 `CourseDetail/index.tsx` `CardCover` (L758): `rounded-large` → **`rounded-2xl`** (token nhà,
      đồng bộ với card enroll `rounded-2xl` bao ngoài L648/891); `overflow-hidden` đã có sẵn.
- [x] 5.2 Không có thumbnail hero khoá khác: hero cột trái (L340) là text-only (title/chip/rating),
      không có `<Image>`. `CardCover` (dùng ở L649 + L892) là thumbnail DUY NHẤT → đã bo.
- [x] 5.3 `npx tsc --noEmit` sạch + eslint file sửa sạch. Kiểm mắt (góc ảnh bo tròn, không tràn)
      auth-gated còn nợ — xem Findings [10].

## Findings (chế độ gấp — ghi tại đây, không chặn)
- **[1] Runtime smoke chưa chạy (auth-gated).** Real search + "Phổ biến" đều cần đăng nhập
  (`useGlobalSearch`/`useQueryRecommendedCoursesSwr` chỉ chạy khi authenticated). Cần smoke tay:
  mở bằng trigger navbar + Ctrl/Cmd+K → popup GIỮA rounded-2xl focus input; idle (đã login) hiện
  "Phổ biến" (icon+title+giá) + recent; gõ ≥2 ký tự → results; chọn row → điều hướng thẳng (không
  qua `/search`); Esc/backdrop đóng; Ctrl/K khi có modal khác mở thì KHÔNG stack.
- **[1] Guest idle-palette** chỉ hiện recent/idle-hint (không có "Phổ biến") vì nguồn gợi ý
  (recommendedCourses) là user-scoped. Đúng spec ("recent MAY be shown alongside"; popular optional).
- **[1] Bỏ "Xem tất cả kết quả" (`/search`) khỏi footer palette** theo yêu cầu direct-navigation +
  footer StarCI (chỉ key-hints). `SearchOverlayFooter` đổi thành key-hints-only (bỏ props
  `onSeeAll`/`canSeeAll`); route `/search` giữ nguyên, chỉ palette không còn handoff trung gian.
- **[1] `SearchRow` thêm field `price?: string`** (trailing accent trong `SearchResultRow`). BE
  `search` không trả giá → live results không có price (giữ breadcrumb/snippet); chỉ popular set giá.
- **[2] Scarcity: `PackageView` KHÔNG có field suất/scarcity.** Contract hiện tại
  (`src/modules/api/rest/course/types.ts` `PackageView`) chỉ có id/name/slug/status/salePrice/
  originalPrice/descriptions/sortOrder/defaultPackage/entitlements. Giả định: khi BE bổ sung
  `slotAvailable?: number` vào PackageView, dòng cam Early bird tự render (helper `packageSlots()`
  đọc field tolerant, guard `!= null`). KHÔNG mock số cho tới khi có field thật. (spec 2.2)
- **[3] `EnrollCard` legacy (Free/Premium) KHÔNG có in-cart toggle.** In-cart↔remove chỉ áp cho
  `PackageEnrollCard` (product-id resolve per-package qua `useGetCoursePackageProductSwr` → khớp
  `cart.items.productId`). Legacy `onEnroll` (`useCourseEnrollment`) resolve product nội bộ + mở
  PaymentModal thẳng, không lộ productId để dò cart → giữ nguyên Enroll/Try free/enrolled-count
  (đã đủ 3 tầng CTA). Nâng cấp in-cart cho legacy = defer (cần hook lộ productId).
- **[4] Runtime smoke pricing-card chưa chạy (auth-gated).** `useGetCartSwr`/`useGetCoursePackageProductSwr`/
  `useQueryCoursePackagesSwr` là signed-in + cần course `saleMode="PACKAGE"` thật. Cần smoke tay:
  mở course PACKAGE → đổi gói (radio) → giá headline + badge `-%` + chip "Đang mở" đổi theo; bấm
  Enroll → item vào giỏ → primary flip "Đã thêm vào giỏ" + icon thùng rác; bấm lại → remove khỏi
  giỏ → về "Đăng ký gói"; "Học thử miễn phí" điều hướng learn; dòng "N người đã đăng ký" dưới cùng.
- **[5] Kiểm mắt lesson-title-hierarchy chưa chạy (auth-gated).** Cần smoke tay: mở course detail →
  outline mỗi section giờ hiện eyebrow "PHẦN N" nhỏ muted PHÍA TRÊN + tiêu đề `body` semibold nổi bật
  (lấn át eyebrow) + description dưới; trong learn shell ContentMap accordion trigger hiện eyebrow
  "PHẦN N" (index theo thứ tự module gốc, ổn định khi search lọc bớt module) + title semibold + chip
  tiến độ giữ nguyên. `LearnModule` không có field part riêng → index suy ra từ vị trí trong `modules`.
- **[10] Kiểm mắt thumbnail-rounded chưa chạy (auth-gated).** Cần smoke tay: mở course detail →
  ảnh cover trong card enroll (cột phải) 4 góc bo `rounded-2xl` khớp viền card bao ngoài, ảnh
  `object-cover` clip gọn trong khung, không tràn góc vuông; placeholder (khi thiếu coverUrl) cũng
  bo. FE-only, không rủi ro contract.
