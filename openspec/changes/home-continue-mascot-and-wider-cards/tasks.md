## 1. Mascot vào trong dải "Tiếp tục học"

- [x] 1.1 `HomeMascotGreeting.tsx`: thêm export `HomeMascotGreetingBand` — dùng
      `useQueryMyCoursesSwr`, `return null` khi `hasCourses` (mascot đã render trong dải khoá
      học), ngược lại render dải `<section className="mx-auto ... py-10">` như hiện tại
- [x] 1.2 `MyCoursesSection.tsx`: render `<HomeMascotGreeting />` giữa cụm tiêu đề và grid thẻ
- [x] 1.3 `HomeLanding/index.tsx`: thay `<section><HomeMascotGreeting/></section>` bằng
      `<HomeMascotGreetingBand />`, cập nhật comment thứ tự dải + docstring section

## 2. Thẻ khoá học đủ chỗ cho chữ

- [x] 2.1 `MyCoursesSection.tsx`: grid `sm:grid-cols-2 lg:grid-cols-4` → `sm:grid-cols-2`
      (tối đa 2 thẻ/hàng), ghi chú lý do (cột chữ bị bóp mất bởi ảnh + nhãn CTA)
- [x] 2.2 (mở rộng có kiểm soát) `ContinueCard`: title `truncate` 1 dòng → `line-clamp-2`.
      Sau khi xem ảnh chụp thật, tên khoá dài vẫn bị "…" dù thẻ đã rộng gấp đôi. Block dùng
      ở 2 nơi (dải home + `/courses/me`), cả 2 đều lợi. Đã cập nhật docstring + README
      (mục "Overflow handling") vì README cũ khẳng định title dùng prop `truncate`

## 3. Verify

- [x] 3.1 `npx tsc --noEmit` sạch (không output) + `npx eslint` sạch trên 5 file đã đổi/mới
- [x] 3.2 E2E `e2e/home-continue-mascot-and-cards.spec.ts` (không cần mật khẩu test): seed
      `keycloak:access_token` giả + mock `GET **/courses/me/enrollments` 3 enrollment (1 tên
      rất dài, 1 không có `imageHeader`) → mascot nằm TRONG dải, TRÊN grid (so `boundingBox`:
      heading.y < mascot.y < card.y), **đúng 1 mascot** trên trang, `gridTemplateColumns` ≤ 2
      cột, tên khoá rộng > 200 px và **wrap 2 dòng** (đo `height / lineHeight`), thẻ không ảnh
      vẫn render đủ. **Bẫy đã sửa**: mock đầu tiên trả `{data:[...]}` → `restRequest` ném lỗi
      vì envelope BE bắt buộc `code: 200` ⇒ dải im lặng không render, 10/12 test đỏ
- [x] 3.3 E2E ca guest (không seed token): dải khoá học tự ẩn (`heading count 0`), **vẫn đúng
      1 mascot** ở dải riêng sau hero
      → tổng **12/12 passed** (desktop + mobile)
- [x] 3.4 Screenshot thật của dải (desktop + mobile) bằng Playwright, đã xem bằng mắt: sói
      dưới tiêu đề, 2 thẻ/hàng, tên dài xuống 2 dòng. Badge "1 Issue" của dev overlay trong
      ảnh = **401 GraphQL do token giả của mock** (chỉ mock REST, `me` gọi thật), không phải
      lỗi sản phẩm; các warning còn lại (PressResponder / THREE.Clock / WebGL) là pre-existing
- [x] 3.5 `NEXT_DIST_DIR=.next-verify npm run build` → "✓ Compiled successfully in 2.5min",
      **exit 0**, BUILD_ID `4XjJXIXeY-gUHG6ssiPZU`. Đã `git checkout -- tsconfig.json` +
      xoá `.next-verify` (build tự ghi `.next-verify/types` vào tsconfig — side-effect, không
      thuộc change). Working tree chỉ còn đúng file của 2 change, không rác
