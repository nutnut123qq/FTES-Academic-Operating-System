# Tasks

## 1. Khảo sát trước khi sửa

- [x] 1.1 Đọc `.modal__container` / `.modal__dialog` của HeroUI (`@heroui/styles/dist/components/
      modal.css`): container `w-full min-w-0 flex-1 p-4 sm:w-fit sm:p-10`, dialog `flex w-full
      flex-col` + `p-6` (bị `globals.css` ghim lại 16px). ⇒ dialog LÀ flex column, con `flex-1`
      được; và dưới `sm` container còn `w-full` nên không cần đặt bề ngang ở cỡ đó.
- [x] 1.2 Đọc cách nhánh FE đã giải bài con-gà-quả-trứng: `ExamList` ghim `h-[90vh]` →
      `SubjectFeAlbum` `min-h-0 flex-1 overflow-y-auto` → khung `lg:flex-1`. Áp đúng cách này cho
      nhánh PE thay vì chế cách mới.
- [x] 1.3 Xác nhận `AsyncContent` render FRAGMENT (không bọc div) ⇒ chuỗi chiều cao từ
      `Modal.Dialog` xuống `ChallengeView` không bị đứt ở giữa.
- [x] 1.4 Đọc `ChallengePaper.test.tsx` / `solveSurface.test.tsx` / `ExamList.test.tsx` để biết
      cái gì đang được bảo vệ trước khi động vào.

## 2. Việc 6 — popup to tràn ra hai bên

- [x] 2.1 `SubjectWorkspaceRail`: bỏ `max-w-6xl`, dialog `sm:w-[96vw]`, container `p-3 sm:p-2`.
- [x] 2.2 `ExamList`: cùng một hộp neo (`sm:w-[96vw]`, container `p-3 sm:p-2`) để hai popup không
      lệch khuôn nhau.
- [x] 2.3 Giữ nguyên nhánh `isExamExpanded` — vẫn hoán NGUYÊN CỤM class, không merge.
- [x] 2.4 Cột phải khỏi trôi tít sang mép trên màn rất rộng: thêm `2xl:grid-cols-[minmax(0,1fr)_
      30rem]` (từ 1536px), giữ `lg:grid-cols-[minmax(0,1fr)_400px]` làm nền.

## 3. Việc 7.1 — khung xem đề cao lên

- [x] 3.1 `SubjectWorkspaceRail`: dialog ghim `h-[92vh] max-h-[92vh] overflow-hidden` (bỏ
      `max-h-[90vh] overflow-y-auto` — dialog không còn là chỗ cuộn).
- [x] 3.2 `ChallengeView`: trong dialog cột nội dung `min-h-0 flex-1 overflow-y-auto`, bỏ `p-6`
      (máng của `.modal__dialog` đã là khung).
- [x] 3.3 `ChallengePaper`: `<section>` thêm `min-h-0 lg:flex-1` khi `inModal && isFramed`.
- [x] 3.4 `ChallengePaper`: khung hai pane `inModal ? "lg:flex-1" : "lg:h-[calc(100dvh-12rem)]"`.
- [x] 3.5 Bỏ các cửa `!inModal` còn lại quanh chiều cao — pane trái (`lg:h-full` cho viewer, iframe,
      `PaperSections`) và cột phải (`lg:overflow-hidden` + `lg:max-h-[45%]`) giờ áp cho cả hai chủ:
      không cap thì khối nộp bài + thảo luận cao tự nhiên và đẩy khung đề bẹp trở lại.
- [x] 3.6 `PaperSections` mất luôn prop `inModal` (không còn chỗ dùng) — cập nhật cả TSDoc.
- [x] 3.7 Hàng nút "Mở trang đầy đủ" trong dialog thêm `shrink-0`: dialog nay cao cố định nên nó là
      flex item và sẽ bị bóp dẹt nếu để co.

## 4. Việc 7.2 — mã đề + chip + mô tả sang cột phải

- [x] 4.1 Tách `ChallengeHeading` (trả về FRAGMENT, nhận `backLink` tuỳ chọn) khỏi thân
      `ChallengeView`; trên trang hai mảnh rơi thẳng vào cột `gap-6` ⇒ khoảng cách y như cũ.
- [x] 4.2 `ChallengePaper` nhận prop `heading?: React.ReactNode`, vẽ ở ĐẦU dải cuộn cột phải, ngay
      trên "Tệp đính kèm", bọc `hidden lg:flex`.
- [x] 4.3 `ChallengeView` chỉ trao khi `inModal && hasPaper`; bản trên cùng khi đó mang `lg:hidden`.
- [x] 4.4 Kiểm nhánh không được đụng: trang `/challenges/[challengeId]` giữ tiêu đề trên cùng + link
      "về danh sách"; popup của challenge KHÔNG kèm đề giữ nguyên tiêu đề trên cùng.

## 5. Việc 7.3 — màn hẹp giữ thứ tự đọc

- [x] 5.1 Dưới `lg`: tiêu đề → đề (`h-[60dvh]`, không phải 92vh) → nộp bài; cột nội dung của dialog
      là chỗ cuộn.
- [x] 5.2 Hai bản tiêu đề dùng `display:none` (`lg:hidden` / `hidden lg:flex`) ⇒ đúng một bản nằm
      trong cây a11y mỗi lúc, screen reader không đọc tiêu đề hai lần.

## 6. Dọn theo (bắt buộc, không phải tiện tay)

- [x] 6.1 `ExamList`: gộp nhánh `kind === "pe"` chết vào một hộp neo duy nhất — doc-comment của nó
      (*"nhánh PE giữ nguyên `max-h` + cuộn ở chính dialog"*) sau đợt này là chỉ dẫn SAI nằm ngay
      cạnh dòng vừa sửa. Lý do đầy đủ ở `proposal.md`.

## 7. Test

- [x] 7.1 `ChallengePaper.test.tsx` — viết lại describe "inside a dialog" theo quyết định MỚI:
      chiều cao đến từ dialog (`lg:flex-1`) chứ không từ viewport; ghim CẢ BA mắt xích (section →
      khung → pane) vì thiếu một mắt là hỏng im lặng; cột phải vẫn cap `lg:max-h-[45%]`; `heading`
      đứng trước khối nộp bài và bọc `hidden lg:flex`; không trao `heading` thì cột phải y như cũ;
      trang không mượn chiều cao của ai (`not.toContain("lg:flex-1")`).
- [x] 7.2 `solveSurface.test.tsx` — thêm describe "tiêu đề nằm trên cùng hay trong cột phải": ba
      nhánh (popup + có đề / popup + không đề / trang + có đề). Mock `ChallengePaper` echo `heading`.
- [x] 7.3 `ExamList.test.tsx` — thêm case hộp neo (bỏ `max-w-6xl`, có `sm:w-[96vw]` + `h-[92vh]`);
      case toàn màn hình giữ nguyên phần assert sau khi bấm expand.
- [x] 7.4 `npx vitest run` ba file → 43/43 xanh.
- [x] 7.5 `npx vitest run src/components/features/challenge/ChallengeView/ src/components/features/
      subject/SubjectFeAlbum/index.test.tsx` (các test anh em có thể vạ lây) → 98/98 xanh.
- [x] 7.6 `npx eslint` trên 7 file đã đổi → sạch.

## 8. Ngoài phạm vi / chưa làm

- [ ] 8.1 `npm run build` / `npx tsc --noEmit` — có nhiều lane chạy song song cùng thư mục, phase
      VERIFY riêng sẽ chạy.
- [ ] 8.2 Xem thật trên trình duyệt ở 1920 / 1366 / mobile — phiên này không dựng dev server.
      Các con số (`96vw`, `92vh`, `2xl:30rem`) mới chỉ được kiểm bằng tính toán, chưa bằng mắt.

## 9. HARDEN (2026-08-22) — vá nợ sau vòng review đối kháng

- [x] 9.1 **BLOCKER**: bỏ `max-w-6xl` mà không thay bằng gì làm popup HẸP LẠI còn 448px chứ không
      rộng ra. `Modal.Container` không truyền `size` ⇒ `defaultVariants.size = "md"` ⇒ dialog mang
      `modal__dialog--md`, mà `modal.css` bake `.modal__dialog--md { max-width: 28rem }` trong
      `@layer components` (đã đọc `node_modules/@heroui/styles/dist/components/modal.css:227` và
      `modal/modal.styles.js`). Thêm `max-w-none` vào chuỗi class của `Modal.Dialog` ở CẢ HAI popup
      (`SubjectWorkspaceRail/index.tsx`, `SubjectPractice/ExamList.tsx` nhánh KHÔNG expanded) và
      ghi lý do vào doc-comment. Nhánh `isExamExpanded` có `size="full"` ⇒ `--full` không bake
      `max-width`, không cần đụng.
- [x] 9.2 `ChallengePaper` section: `min-h-0 lg:flex-1` → `lg:min-h-0 lg:flex-1`. `min-h-0` trần
      bỏ sàn `min-height:auto` ở MỌI cỡ màn, nên dưới `lg` cột `min-h-0 flex-1 overflow-y-auto`
      của `ChallengeView` bóp section lại và `overflow-hidden` của khung cắt mất khối nộp bài +
      thảo luận, không có thanh cuộn nào để tới. Cùng lớp lỗi: `ExamImageViewer`
      `h-[60dvh] min-h-0 lg:h-full` → `h-[60dvh] lg:h-full lg:min-h-0`.
- [x] 9.3 Cụm `heading` ra khỏi dải bị cap `lg:max-h-[45%]`, thành con TRỰC TIẾP của cột phải với
      `shrink-0` (giữ `hidden lg:flex`). Ở 1366×768 dải đó chỉ khoảng 264px mà riêng cụm tiêu đề
      đã ~150px, đẩy nút "Nộp bài" ra ngoài tầm nhìn.
- [x] 9.4 Bỏ `2xl:grid-cols-[minmax(0,1fr)_30rem]`; nhánh `inModal` dùng
      `lg:grid-cols-[minmax(0,1fr)_minmax(25rem,32%)]`, nhánh TRANG giữ nguyên `_400px`. Đề PE là
      ảnh A4 dọc `object-contain` nên bị chặn bởi CHIỀU CAO: ở 1920 cột phải cố định để lại ~930px
      nền trống, một bậc 2xl chỉ ăn 80px. Class cũ còn áp cả trên trang `/challenges/[challengeId]`,
      vượt phạm vi "chỉ đổi khi inModal".
- [x] 9.5 `ChallengeView`: skeleton/lỗi/rỗng dùng CHUNG hộp neo với nội dung thật khi `inModal`
      (`ChallengeViewSkeleton` bỏ `max-w-6xl p-6`, bọc `min-h-0 flex-1`; `className` của
      error/empty thành `flex min-h-0 flex-1 items-center justify-center`).
- [x] 9.6 Test: `ChallengePaper.test.tsx` ghim `section` mang `lg:min-h-0` và KHÔNG mang `min-h-0`
      trần · cột phải popup là `minmax(25rem,32%)` và không còn bậc `2xl` · `heading` KHÔNG nằm
      trong phần tử mang `lg:max-h-[45%]` · trang vẫn `_400px`. `ExamList.test.tsx` ghim dialog CÓ
      `max-w-none`. 29 + 7 test xanh.
- [x] 9.7 `npx tsc --noEmit` sạch · `npm run test` 267 file / 1982 test xanh.
- [ ] 9.8 Vẫn CHƯA xem bằng mắt ở 1920 / 1366 / 1024 với ảnh A4 dọc thật (8.2 cũ) — phiên này
      không dựng dev server. `minmax(25rem,32%)` là suy luận từ số đo, chưa phải kiểm bằng mắt.
