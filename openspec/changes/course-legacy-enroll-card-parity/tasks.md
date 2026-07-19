## 1. Tách phần trình bày dùng chung

- [x] 1.1 Rút phần render MỘT lựa chọn mua trong `PackageEnrollCard` (tên · giá bán · giá gạch ·
      chip % giảm · bullet quyền lợi · nút) thành component dùng chung trong cùng file (hoặc file
      cạnh bên nếu file đã quá dài). `PackageEnrollCard` dùng lại — hành vi giữ nguyên 100%.

## 2. EnrollCard (LEGACY)

- [x] 2.1 Bỏ `selectedTier` + `SelectableCardGroup` hai tier; render một lựa chọn "Trọn khoá" bằng
      component ở 1.1, dữ liệu từ `course.price` (vnd / originalVnd).
- [x] 2.2 Nút "Học thử miễn phí" chỉ render khi khoá có bài học thử (đếm từ syllabus đã có trong model).
- [x] 2.3 Bullet quyền lợi: chỉ số bài học + số bài học thử; bỏ `allChallenges`, `certificate`,
      `freeChallenge`. Dòng challenge chỉ render khi `challengeCount` có giá trị.

## 3. Dọn model + i18n

- [x] 3.1 `useQueryCourseDetailSwr.ts`: bỏ `plans` khỏi model và mapper (giữ `price`, đếm bài học thử
      nếu chưa có thì thêm field đếm thật). Sửa mọi nơi còn đọc `course.plans`.
- [x] 3.2 `messages/vi.json` + `en.json`: xoá các khoá i18n không còn dùng
      (`detail.planNames.*`, `detail.planBadges.*`, `detail.planSelectorAria`, và các
      `detail.planIncludes.*` đã bỏ). Không để khoá mồ côi hai chiều.

## 4. Verify

- [ ] 4.1 `tsc --noEmit` sạch + `npm run build` (webpack) xanh.
      (tsc sạch, eslint sạch, `vitest` 4/4 xanh — `npm run build` chạy ở bước sau.)
- [ ] 4.2 Preview: mở một khoá LEGACY trả phí → card một lựa chọn, giá đúng, không tier bịa;
      mở một khoá PACKAGE → card gói KHÔNG đổi so với trước (so ảnh chụp trước/sau).
- [x] 4.3 Grep chắc chắn không còn tham chiếu `plans` / khoá i18n đã xoá.
