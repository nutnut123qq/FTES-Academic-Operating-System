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

- [x] 4.1 `tsc --noEmit` sạch + eslint sạch + `vitest` 4/4 xanh + `npm run build` (webpack) xanh
      (`✓ Compiled successfully`).
- [x] 4.2 E2E qua trình duyệt trên apitest (2026-07-20): **5/5 PASS**.
      LEGACY trả phí `mma301-…-react-native-zoom`: một lựa chọn "Trọn khóa" 299.000₫ / 500.000₫ gạch
      / `−40%`, `[role="radio"].length === 0` ⇒ hết hai tier bịa, bullet chỉ số thật, hết
      chứng chỉ/challenge. LEGACY 0 bài học thử `mad101-discrete-mathematics`: đúng 1 button
      "Đăng ký học", `innerText.includes('Học thử') === false`. PACKAGE nhiều tier
      `goi-prf192prf193…`: `PackageEnrollCard` KHÔNG đổi — 5 gói giữ nhãn `{count} phần`, picker vẫn
      đổi headline khi chọn MASTER (369.000₫ / 450.000₫ / −18%), badge tier syllabus nguyên vẹn.
      Console không lỗi React/hydration mới; 10 endpoint trang chi tiết đều 200.
      Bằng chứng: `C:\Users\hahuy\Desktop\cc\E2E-FE-COURSE-CARD-2026-07-20.md` +
      `C:\Users\hahuy\Desktop\cc\e2e-evidence-2026-07-20-course-card\` (4 dump DOM `ca1..ca4.html`).
      Screenshot không chụp được (preview headless timeout 30s) — thay bằng dump DOM thật của card.
- [x] 4.3 Grep chắc chắn không còn tham chiếu `plans` / khoá i18n đã xoá.
