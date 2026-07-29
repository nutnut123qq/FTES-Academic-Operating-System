# Tasks — home-mascot-small-achievements-restyle

## 1. Thu nhỏ bong bóng chào linh vật (FIX 1)
- [x] 1.1 Trong `HomeMascotGreeting`: bỏ `MascotBubble`, import + render `FtesMascot` `size="sm"` trong một hàng inline `flex items-center gap-3`
- [x] 1.2 Render greeting là **một dòng ngắn** (`welcomeTitle`/`welcomeTitleNoName` cho người đăng nhập, `guestTitle` cho khách) — bỏ câu thứ hai (`welcomeBody`/`guestBody`); giữ cá-nhân-hoá theo tên + fallback rỗng-tên
- [x] 1.3 Giảm padding dọc section bọc mascot trong `HomeLanding/index.tsx`: `py-10` → `py-6`; giữ nguyên vị trí (ngay sau `MyCoursesSection`), vẫn 1 linh vật/trang

## 2. Restyle thẻ "Thành tựu" theo ftes-frontend cũ (FIX 2)
- [x] 2.1 Đọc design legacy `Ftes-frontend/src/views/home/components/achiverProject/index.tsx` (lưới "Thành tựu": nền tô, canh trái, icon accent trần, hover-lift)
- [x] 2.2 Thẻ `AchievementsSection`: nội dung canh TRÁI (`items-start text-left`), nền tô accent (`bg-accent/5`), icon accent trần ở đầu (`size-8 text-accent`, bỏ vòng tròn `bg-accent/10`)
- [x] 2.3 Giữ giá trị lớn ("Top 100"…) accent + nhãn dưới; thêm hover-lift (`transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg`)
- [x] 2.4 Giữ đúng 6 thành tựu thật + tiêu đề section ("Achievements / What we've achieved"); token nhà, theme-aware; không đổi i18n

## 3. Verify
- [x] 3.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 3.2 Test mascot `FtesMascot/index.test.tsx` xanh (4/4)
- [ ] 3.3 `npm run build` (webpack) — chậm/timeout cục bộ; CI/Vercel verify
