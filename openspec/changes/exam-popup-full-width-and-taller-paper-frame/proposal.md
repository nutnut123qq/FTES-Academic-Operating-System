# exam-popup-full-width-and-taller-paper-frame — popup đề PE/FE rộng gần trọn màn, khung xem đề cao theo dialog, cụm mã đề xuống cột phải

## Why

Chủ dự án soi hai ảnh chụp popup đề và chốt hai việc:

1. *"popup PE, FE chi tiết practice — cho nó to tràn ra cả 2 bên màn hình luôn"* — ảnh đề WED201c:
   popup chỉ chiếm khúc giữa màn hình, hai bên còn nguyên nền trống.
2. *"Phần popup hiển thị đề PE vẫn còn quá ít. Mở rộng ô hiện hình ảnh lên trên, Mã đề cho qua
   phải"* — ảnh đề SWE202c_SP26_PE1_416071: tiêu đề + mã đề + chip Coding/Running/PE + đoạn mô tả
   dài chiếm nguyên dải TRÊN CÙNG bên trái, đẩy khung xem PDF xuống thấp và bóp nó lại.

Ba nguyên nhân trong code, mỗi cái một kiểu:

- **Bề ngang:** cả hai dialog ghim `max-w-6xl` (72rem). Trên màn 1080p trở lên trần này bó popup lại
  còn chưa tới 2/3 màn — mà thứ nằm trong đó là một trang đề A4 cần phóng to hết cỡ.
- **Chiều cao:** `ChallengePaper` với `inModal` GỠ HẲN mọi ràng buộc chiều cao (`!inModal &&
  "lg:h-[calc(100dvh-12rem)]"`, `!inModal && "lg:h-full"`, `!inModal && "lg:max-h-[45%]"`) và để cả
  dialog cuộn như một khối. Hệ quả: khung xem đề mắc kẹt ở đúng cái sàn `h-[60dvh]` — người ta mở
  popup lên để NHÌN ĐỀ mà đề lại là thứ nhỏ nhất trong popup. Nhánh FE (`ExamList` +
  `SubjectFeAlbum`) đã gặp và giải đúng bài này rồi: dialog ghim chiều cao, con `flex-1` vào.
- **Cụm tiêu đề:** `ChallengeView` vẽ tiêu đề · chip · mô tả thành một dải ngang trên cùng cho MỌI
  bề mặt. Trên trang thì đúng (khung đề bên dưới vẫn cao bằng viewport); trong popup thì nó ăn mất
  đúng phần chiều cao mà khung đề đang thiếu.

## What Changes

### Bề ngang — bỏ trần `max-w-6xl` ở CẢ HAI popup

- `SubjectWorkspaceRail` (popup đề PE, mở từ rail "Challenges" của trang tổng quan môn) và
  `SubjectPractice/ExamList` (popup đề FE) dùng chung một hộp neo: `sm:w-[96vw]` + máng container
  `sm:p-2`. Hai bề mặt của cùng một sản phẩm thì không được lệch khuôn nhau.
- Dưới `sm` KHÔNG đặt bề ngang: `.modal__dialog` đã `w-full` và `.modal__container` cũng còn
  `w-full` ở cỡ đó (chỉ `sm:` mới `w-fit`), nên nó tự vừa. Đặt `96vw` ở cỡ điện thoại chỉ tổ đẩy
  tổng bề ngang (96vw + máng) vượt viewport.
- Nhánh `isExamExpanded` (toàn màn hình) của `ExamList` GIỮ NGUYÊN — nó hoán nguyên cụm class,
  không merge, đúng lối `useExamExpand` đã chọn.
- Popup rộng ra thì cột phải 400px trên màn rất rộng hoá ra một sợi chỉ dán mép, nên từ `2xl`
  (1536px) cột phải nới thành `30rem`. Trang cũng hưởng — đề PE trên trang đã bỏ trần `max-w-6xl`
  từ trước và rộng y như vậy.

### Chiều cao — dialog cho, khung đề nhận (áp đúng cách nhánh FE đã giải)

Chuỗi bốn mắt xích, thiếu MỘT mắt là `flex-1` rơi vào chiều cao auto và khung lại bẹp về `60dvh`:

1. `SubjectWorkspaceRail` — `Modal.Dialog` ghim `h-[92vh] max-h-[92vh] overflow-hidden`.
2. `ChallengeView` — trong dialog, cột nội dung `min-h-0 flex-1 overflow-y-auto` (và bỏ `p-6` của
   riêng nó: máng 16px của `.modal__dialog` đã là cái khung).
3. `ChallengePaper` — `<section>` `min-h-0 lg:flex-1` khi ở trong dialog VÀ thật sự có khung
   (`isFramed`).
4. `ChallengePaper` — khung hai pane `lg:flex-1` thay cho `lg:h-[calc(100dvh-12rem)]` của trang.

Kéo theo: trong dialog, cột phải cuộn TRONG chính nó y như trên trang (`lg:overflow-hidden` +
`lg:max-h-[45%]` cho dải nộp bài) — không cap thì khối nộp bài + thảo luận cao tự nhiên và đẩy
khung đề bẹp trở lại. Nhờ vậy `inModal` trong `ChallengePaper` co lại còn đúng hai việc: chiều cao
đi từ đâu, và có nhận cụm tiêu đề hay không.

### Cụm tiêu đề — xuống đầu cột phải, CHỈ trong popup có đề

- Tách `ChallengeHeading` (mã đề · chip loại/trạng thái/tag · đoạn mô tả) khỏi thân `ChallengeView`.
  Nó trả về FRAGMENT, nên trên trang hai mảnh rơi thẳng vào cột `gap-6` và giữ NGUYÊN khoảng cách
  cũ — bố cục trang không đổi một pixel.
- `ChallengePaper` nhận thêm prop `heading?: React.ReactNode`, vẽ nó ở đầu dải cuộn của cột phải,
  ngay TRÊN "Tệp đính kèm".
- Điều kiện là `inModal && hasPaper`. Trang giữ nguyên; một challenge trong popup mà không kèm đề
  thi thì chẳng có cột phải nào để tụt xuống.

### Màn hẹp (dưới `lg`) — thứ tự đọc không đổi

Dưới `lg` hai pane vẫn xếp dọc và bản tiêu đề TRÊN CÙNG mới là bản hiện: tiêu đề → đề (`60dvh`) →
nộp bài. Nếu để tiêu đề đi theo cột phải thì trên điện thoại người đọc phải lướt qua cả khung đề
mới biết mình đang mở đề nào.

Hai bản dùng `lg:hidden` / `hidden lg:flex`, tức `display:none` — bản ẩn rời khỏi cả cây a11y, nên
tiêu đề vẫn chỉ được đọc MỘT lần, không phải hai.

## Impact

- `src/components/features/subject/SubjectWorkspaceRail/index.tsx` — hộp neo của popup đề PE.
- `src/components/features/subject/SubjectPractice/ExamList.tsx` — hộp neo của popup đề FE.
- `src/components/features/challenge/ChallengeView/index.tsx` — `ChallengeHeading` + chiều cao
  trong dialog + quyết định trao cụm tiêu đề.
- `src/components/features/challenge/ChallengeView/ChallengePaper.tsx` — chiều cao khung, cột phải
  cuộn trong chính nó, chỗ đứng của `heading`.
- Test: `ChallengePaper.test.tsx`, `solveSurface.test.tsx`, `ExamList.test.tsx`.

**KHÔNG đổi:** trang `/challenges/[challengeId]` (bố cục, khoảng cách, link "về danh sách", cả ba
nhánh solve coding / tự luận / uiux); nhánh toàn màn hình `isExamExpanded` của `ExamList`;
`SubjectFeAlbum`; i18n (không thêm chuỗi nào — đây thuần bố cục).

## Dọn dẹp bắt buộc đi kèm (không phải tiện tay)

`ExamList` có nhánh `kind === "pe"` chọn hộp dialog riêng (`max-h-[90vh] overflow-y-auto`) kèm
doc-comment giải thích *"`ChallengeView` (PE) không tạo vùng cuộn con nào nên nhánh PE giữ nguyên
`max-h` + cuộn ở chính dialog"*. Chính doc-comment của component đã ghi PE **không bao giờ** đi qua
đây (trang Practice chỉ render `kind="fe"`; đề PE mở từ rail). Sau đợt này lời giải thích ấy còn
SAI hẳn — popup PE nay ghim chiều cao và không cuộn ở dialog nữa. Để lại một nhánh chết mang chỉ
dẫn sai ngay cạnh dòng vừa sửa là bẫy cho lần sau, nên nhánh bị gộp về một hộp neo duy nhất.
