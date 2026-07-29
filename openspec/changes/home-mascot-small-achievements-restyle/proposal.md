# home-mascot-small-achievements-restyle — Cáo nhỏ lại dưới "Tiếp tục học" + thẻ Thành tựu theo design ftes-frontend cũ

## Why
Trên trang chủ (`HomeLanding`), thầy chốt hai chỉnh nhỏ về hình thức:

1. *"Tôi cần con cáo chỉ là nhỏ nhỏ phía dưới cái Continue learning á bạn."* — bong bóng
   chào của linh vật FrosTES (`HomeMascotGreeting`) đang render dưới dạng **banner bong bóng
   lớn** (mascot + thẻ bo góc có viền/shadow/ring + tiêu đề `text-lg` đậm + câu thứ hai),
   chiếm nguyên một dải ngay sau "Tiếp tục học". Phải làm nó **nhỏ + kín đáo**: một dòng
   ngắn với mascot nhỏ, đọc như chân trang thân thiện chứ không phải banner.
2. *"Achievements / What we've achieved … Cái này vẫn chưa sửa theo source ftes-frontend cũ."*
   — NỘI DUNG phần "Thành tựu" (`AchievementsSection`) đã đúng (6 thành tựu thật), nhưng
   THIẾT KẾ thẻ chưa khớp phần "Thành tựu" của `Ftes-frontend` cũ.

## What Changes
- **Thu nhỏ bong bóng chào linh vật (`HomeMascotGreeting`):** bỏ `MascotBubble`
  (banner bong bóng lớn), render lại thành **một hàng inline gọn**: `FtesMascot`
  `size="sm"` cạnh **một dòng ngắn** "Chào mừng trở lại, {name}" (bỏ câu thứ hai). Giữ
  cá-nhân-hoá theo tên + fallback cho khách, giữ nguyên vị trí (ngay sau "Tiếp tục học"),
  vẫn 1 linh vật/trang. Section bọc giảm padding dọc (`py-10` → `py-6`) để đọc như chân
  trang nhỏ, không phải hero.
- **Restyle thẻ "Thành tựu" (`AchievementsSection`) theo `Ftes-frontend` cũ:** khớp
  look của lưới "Thành tựu" legacy
  (`Ftes-frontend/src/views/home/components/achiverProject/index.tsx`): nền thẻ **tô nhạt
  theo accent**, nội dung **canh TRÁI**, **icon accent trần ở đầu thẻ (không bọc tròn)**,
  giá trị lớn ("Top 100"…) rồi tới nhãn, và **nhấc nhẹ khi hover**. Hex/token legacy
  (`#F0F6FF`, `text-utilsPrimary`, shadow xanh) ánh xạ sang token nhà (`bg-accent/5`,
  `text-accent`, `border-separator`/`border-accent`) để theme-aware cả sáng lẫn tối. Giữ
  đúng 6 thành tựu thật + tiêu đề section ("Achievements / What we've achieved").

Đây là thay đổi **thuần hình thức** (presentation) — không đụng nội dung/i18n, không BE,
không interactivity.

## Capabilities
### Modified Capabilities
- `home-landing`: thêm hai yêu cầu trình bày cho trang chủ — bong bóng chào linh vật là
  một dòng nhỏ dưới "Tiếp tục học", và thẻ "Thành tựu" theo design của `Ftes-frontend` cũ.

## Impact
FE-only, 3 file:
- `src/components/features/home-landing/HomeLanding/sections/HomeMascotGreeting.tsx`
  (bỏ `MascotBubble` → hàng inline nhỏ `FtesMascot` + một dòng)
- `src/components/features/home-landing/HomeLanding/index.tsx`
  (giảm padding dọc section bọc mascot: `py-10` → `py-6`)
- `src/components/features/home-landing/HomeLanding/sections/AchievementsSection.tsx`
  (thẻ tô-accent, canh trái, icon accent trần, hover-lift)

Không thêm/đổi i18n (dùng key sẵn có; câu thứ hai của greeting chỉ ngừng render). Test
mascot (`FtesMascot/index.test.tsx`) giữ xanh (API primitive không đổi). `tsc --noEmit`
sạch; `npm run build` (webpack) do CI/Vercel verify (build cục bộ chậm/timeout).
