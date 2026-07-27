# learn-about-below-lock-card — Đưa "About this course" xuống ngay dưới card mở khóa, trước "Continue learning"

## Why
Trên trang tổng quan /learn/content (`LearnContentPage`), cột chính đang xếp:
header → "Continue learning" (+ Overall progress) → card học-thử/mở-khóa ("You're on a free
trial / Unlock course") → leaderboard → "About this course". Với người CHƯA mua, thứ tự này
đẩy phần giới thiệu khóa xuống dưới cùng, trong khi ngay sau lời mời mở khóa người học lại
cần đọc "khóa này dạy gì" để quyết định. Thầy chốt: *"Cái About khóa học thì để dưới cái khóa
luôn rồi mới tới Continue learning"* — About phải nằm NGAY DƯỚI card khóa/mở-khóa, và
"Continue learning" xuống SAU About.

## What Changes
- Sắp xếp lại thứ tự các khối anh em trong cột chính của `LearnContentPage`:
  header (title + meta chips) → **card học-thử/mở-khóa (lock card)** → **About this course** →
  **Continue learning + Overall progress** → **leaderboard (LearnNudges)** → tools rail (mobile).
- Đây là REORDER thuần: markup/props/điều kiện render của từng khối GIỮ NGUYÊN. Card mở-khóa
  vẫn chỉ hiện với người chưa có full-access (`access !== undefined && !hasFullAccess`); About
  vẫn chỉ hiện khi `header.description`; Continue-learning giữ nút disabled khi không có
  `continueLessonId`. Chỉ đổi THỨ TỰ, không đổi ĐIỀU KIỆN.
- Không đổi i18n, không đổi component con, không đổi data.

## Capabilities
### New Capabilities
- `learn-content-overview`: quy định thứ tự các khối trong cột chính của trang tổng quan
  /learn/content (lock card → About → Continue learning → leaderboard).

## Impact
FE only, 1 file: `src/components/features/learn/LearnContentPage/index.tsx`. Không đụng API,
không đổi behavior/điều kiện — chỉ trình bày. tsc + webpack build phải xanh.
