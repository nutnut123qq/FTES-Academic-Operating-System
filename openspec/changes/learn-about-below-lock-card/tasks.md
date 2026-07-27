# Tasks — learn-about-below-lock-card

## 1. Reorder cột chính LearnContentPage
- [x] 1.1 Di chuyển khối card học-thử/mở-khóa (lock card, điều kiện `access !== undefined && !hasFullAccess`) lên NGAY SAU `PageHeader`
- [x] 1.2 Đặt khối "About this course" (`header.description ? <LabeledCard>`) NGAY DƯỚI lock card
- [x] 1.3 Đặt khối "Continue learning" + Overall progress (`{/* continue + progress */}`) SAU About
- [x] 1.4 Giữ leaderboard (`LearnNudges`) và tools rail (mobile) sau cùng như cũ
- [x] 1.5 Xác nhận GIỮ NGUYÊN mọi điều kiện render + markup/props từng khối (pure reorder), spacing dùng `gap-6` của container không đổi

## 2. Verify
- [x] 2.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 2.2 `npm run build` (webpack) xanh
