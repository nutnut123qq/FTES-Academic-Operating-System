## 1. Assets — ảnh mốc thành tựu (nén trước khi code)

- [x] 1.1 Tạo `public/achievements/` và copy 8 ảnh từ `../Ftes-frontend/public/achiver/`, nén
      xuống ≤1280 px chiều ngang / JPEG q82, đổi tên kebab-case không dấu cách:
      `top-100-techfest.jpg`, `innovation-quest.jpg`, `giai-3-knstgl.jpg`,
      `hoc-bong-khoi-nghiep-fpt.jpg`, `open-day.jpg`, `ttsg.jpg`, `goi-von-lan-1.jpg`,
      `demo-day.jpg`
- [x] 1.2 In kích thước từng file sau nén + tổng; **tổng phải < 1.5 MB** (bản gốc ~16 MB).
      Mở xem `giai-3-knstgl.jpg` để chắc chữ trên giấy khen còn đọc được
      → 16.71 MB → **1.26 MB** (PASS); chữ trên phông chung kết đọc rõ. Xem thêm 5 ảnh khác
      để viết mô tả theo đúng bằng chứng (phát hiện caption web cũ ghi sai KNSTGL là
      "Kỹ năng Số TP.HCM", thực tế là "Thanh niên Gia Lai khởi nghiệp sáng tạo 2025 — Giải Ba")

## 2. Dữ liệu + i18n

- [x] 2.1 `HomeLanding/content.ts`: đổi type `AchievementStat` → mốc thành tựu
      (`key`, `year`, `value?` cho xếp hạng, `imageSrc?`, `href?`), cập nhật docstring
- [x] 2.2 `ACHIEVEMENTS` từ 6 → 10 mốc theo thứ tự kể chuyện (giải lớn trước): `techfest`,
      `startupGiaLai`, `innovationQuest`, `knstgl`, `fptScholarship`, `openDay`, `ttsg`,
      `fundraising`, `demoDay`, `aiAssistants` — gắn đúng `imageSrc` + `href` bằng chứng
      (link Facebook/báo lấy từ `Ftes-frontend`), mốc không có thì bỏ trống
- [x] 2.3 `messages/vi.json`: mỗi `achievements.items.<key>` thêm `title` (giữ nguyên bản
      dịch `label` cũ) + `description` (viết theo ảnh bằng chứng, KHÔNG copy caption sai của
      web cũ); bỏ key `label` không còn dùng
- [x] 2.4 `messages/vi.json`: thêm `achievements.{regionLabel, prev, next, viewDetail}` (đặt
      tên trùng bộ `mentors.*`). Bỏ `goToSlide` khỏi kế hoạch: carousel này chỉ có prev/next,
      10 mốc thì dãy dots vô dụng
- [x] 2.5 `messages/en.json`: mirror y hệt 2.3 + 2.4 (dịch tiếng Anh), giữ 2 file cùng shape

## 3. Section carousel

- [x] 3.1 Viết lại `sections/AchievementsSection.tsx`: giữ khung section hiện tại
      (`max-w-6xl` · `py-16` · heading eyebrow+title `mb-10`), bọc track bằng region
      `role="region" aria-roledescription="carousel"` + `aria-label` + xử lý
      ArrowLeft/ArrowRight + `pauseHandlers` từ `useCarousel(slideCount, { intervalMs: 4_500 })`
- [x] 3.2 Track `flex snap-x gap-3 overflow-x-auto` (ẩn scrollbar như `CategoryShelf`), mỗi
      slide là `MediaCard` `w-[17rem] sm:w-[19rem] shrink-0 snap-start`
- [x] 3.3 Slide: `cover` = `<img className="aspect-video w-full object-cover" loading="lazy">`
      khi có `imageSrc`, ngược lại fallback `aspect-video` `bg-accent/10` + icon phosphor của
      mốc (giữ `ACHIEVEMENT_ICON`, thêm icon cho 4 key mới)
      → kiểm crop `object-cover` của ảnh DỌC `goi-von-lan-1.jpg` (1280×1707): dải giữa vẫn
      thấy đủ phông "Kết nối đầu tư" + 3 người + logo FTES → không cần `object-position`
- [x] 3.4 Slide: `meta` = `Chip` năm + `Chip` xếp hạng (chỉ khi có `value`); `title` = i18n
      title; `description` = i18n description; `footer` = HeroUI `Link` "Xem chi tiết" +
      `ArrowRightIcon`, `target="_blank" rel="noopener"` — chỉ render khi có `href`
- [x] 3.5 Hàng điều khiển prev/next dưới track (mượn đúng idiom nút của `MentorTeamSection`),
      chỉ render khi có nhiều hơn 1 mốc

## 3b. Chỉnh cho GIỐNG web cũ (sau khi thầy gửi ảnh chụp khối gốc)

- [x] 3b.1 Badge năm chuyển từ chip trong body → **overlay trên ảnh** (`absolute bottom-3
      left-3`, `bg-accent text-accent-foreground` thay `red-primary` của web cũ)
- [x] 3b.2 Mũi tên prev/next chuyển từ hàng dưới track → **2 bên track** (`absolute
      -left-3/-right-3 top-1/2`, region `relative`), ẩn dưới `sm` để không che ảnh trên phone
- [x] 3b.3 Số card/viewport khớp breakpoint web cũ 1 → 2 → 3 (`w-[17rem]` ·
      `sm:w-[calc(50%-0.375rem)]` · `lg:w-[calc(33.333%-0.5rem)]`)

## 4. Verify

- [x] 4.1 `npx tsc --noEmit` sạch (exit 0) + `npx eslint` sạch trên 2 file đã đổi
- [x] 4.2 Kiểm 2 file JSON i18n cùng shape → 37 key khớp 100%, 10 mốc mỗi bên, không key lệch
- [x] 4.3 `NEXT_DIST_DIR=.next-verify npm run build` xanh (webpack, không turbopack)
      → lần 1 (trước chỉnh layout 3b): BUILD_ID `YQVpTu1DyKG0wFtFD1GnK`, xanh.
      → lần 2 (sau 3b): compile + TypeScript + static pages 6/6 ✓ nhưng **exit 1** vì tôi xoá
        `.next-verify` khi build đang ghi manifest cuối (ENOENT `pages-manifest.json`) — lỗi
        do tôi, không phải code; KHÔNG tính là pass.
      → lần 3 (chạy lại sạch): "✓ Compiled successfully in 5.0min", **exit 0**, BUILD_ID
        `kxdhAZUGa-WRw9Gdk2tkx` → chốt XANH.
      ⚠️ Nhắc: `next build` với `NEXT_DIST_DIR` **ghi thêm** `.next-verify/types` vào
      `tsconfig.json` (và reformat file) → phải `git checkout -- tsconfig.json` sau khi build,
      side-effect này KHÔNG thuộc change
- [x] 4.4 Chạy `npm run dev` + preview `/vi`: region carousel render **10 slide**, track
      overflow 3156/1112 px, chip năm + chip xếp hạng đúng từng mốc, 7 link "Xem chi tiết"
      trỏ đúng URL bằng chứng với `target="_blank" rel="noopener"`, 3 mốc không bằng chứng
      không render link. **Screenshot BẤT KHẢ**: Browser pane không compositing frames trong
      phiên này (`screenshot timed out … pane is not displayed`) → verify bằng đo DOM/CSS thật
      thay cho ảnh. Nút prev/next: `useCarousel` gọi `scrollTo({behavior:"smooth"})`, mà
      `requestAnimationFrame` KHÔNG chạy khi pane ẩn (`document.hidden === true` vĩnh viễn,
      đã chứng minh: rAF không fire) → smooth scroll không nhích trong harness; scroll instant
      trên cùng track đổi `scrollLeft` bình thường (0 → 320) nên track scrollable đúng. Đây là
      giới hạn harness, KHÔNG phải lỗi code — cần bấm tay 1 lần trên máy thật để chốt
- [x] 4.5 Preview ở viewport 375×812: card 272 px ≈ 1.24 card/viewport (có peek card sau),
      `overflow-x: auto` + `scroll-snap-type: x`, `documentElement.scrollWidth == clientWidth`
      → trang KHÔNG tràn ngang
- [x] 4.7 **E2E Playwright thật** (`e2e/home-achievements-carousel.spec.ts`, 5 test × 2
      project desktop/mobile): 10 mốc render, 8 ảnh decode không hỏng, 7 link bằng chứng
      `https` + `_blank` + `noopener` (6 Facebook + 1 báo) và không link rác `#`, **mũi tên
      thật sự scroll track** (poll `scrollLeft` tăng rồi giảm — chạy được vì browser thật có
      rAF, khác pane preview), 3 card/viewport desktop · <2 card + không tràn ngang mobile,
      chụp screenshot đính kèm. → **9 passed, 1 skipped** (mobile bỏ test mũi tên vì đã ẩn
      theo thiết kế). Ảnh chụp thật của khối: desktop + mobile (đã xem, khớp bản web cũ)
- [x] 4.6 Console không lỗi mới (chỉ warning `PressResponder` của HeroUI — **pre-existing**,
      xuất hiện cả ở `/vi/courses` là trang không có khối này). Cả 8 ảnh
      `/achievements/*.jpg` trả **200 image/jpeg** (43–296 KB), `naturalWidth` đúng kích thước
      đã nén. Ảnh `loading="lazy"` chỉ fetch khi đổi sang eager vì pane ẩn (rAF/IO không chạy)
