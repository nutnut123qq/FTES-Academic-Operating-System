# Profile UX Spec (SSOT)

> Bản chốt thiết kế cho trang `/profile/[username]`. Mọi thay đổi UI profile **chiếu vào file này** — không thiết kế lại theo cảm tính từng lần. Sửa spec → rồi sửa code.

## 1. Mục tiêu & khung

- **Trang này là gì:** hồ sơ công khai = **trang credibility + portfolio** của người học, bắc cầu *học → tuyển dụng*.
- **Đối tượng #1:** recruiter / headhunter (StarCi có talents / headhunting / open-to-work). Thứ 2: bạn học, chính chủ.
- **Metric thành công:** recruiter liếc **≤30s** trả lời được *"người này tuyển được không + có bằng chứng không?"* và có **đường liên hệ** (chuyển đổi).
- **Lợi thế riêng vs GitHub/LinkedIn:** **xác minh bên thứ ba** — `✓ Verified by StarCi` trên capstone/challenge đã chấm. → nhấn mạnh.

## 2. Nguyên tắc xuyên suốt

1. **Thiết kế cho cả dải dữ liệu (rỗng → dày).** Mỗi section **tự ẩn khi rỗng**. Hồ sơ mới → sạch, không ngượng; hồ sơ dày → đầy. KHÔNG bao giờ show placeholder trống to (trừ empty-state hành-động của CHỦ).
2. **Nội dung > vanity.** Dẫn bằng thứ *làm được*, không bằng *con số đếm*. **Không có stat-ribbon làm tiêu đề.**
3. **Bằng chứng > bề rộng.** Nhấn việc đã verify + **độ sâu (độ khó)**; giảm các count (số ngôn ngữ, XP).
4. **Overview = highlight; tab = chiều sâu.** Section Overview là **teaser + "Xem tất cả →"**; danh sách đầy ở tab. KHÔNG lặp nội dung đầy đủ.
5. **Chủ vs khách.** Chủ thấy edit/manage/add + empty-state hành-động ("viết bio", "ghim dự án"); khách chỉ thấy nội dung đã có (rỗng → ẩn).
6. **Trung thực trong cách gọi.** Capstone đang làm = "đang xây" + progress; đã chấm xong = `✓ Verified`. KHÔNG gọi capstone 4% là "nổi bật".
7. **Kiên trì là tín hiệu hạng nhất.** Với learner active-nhưng-mới, heatmap/streak thường là tài sản mạnh nhất → để nổi.

## 3. Sidebar (cố định mọi tab) — "Ai + tuyển được không"

Identity card (`outlined`):
- Avatar + **viền rank** (Junior…Senior — earned, suy từ achievements; concentric `rounded-xl`).
- Display name + `@handle`.
- Chip **open-to-work** + **nút "Liên hệ tuyển dụng"** (khách & openToWork → hành động liên hệ; chủ → ẩn/ "đang bật tìm việc"). ← CHUYỂN ĐỔI chính.
- Action chính: **Follow** (khách) / **Chỉnh sửa hồ sơ + gear** (chủ).
- **Share** (icon, cạnh action).
- `followers · following` (counts).
- Meta nhỏ: github · ngày tham gia.
- **KHÔNG để ở đây:** XP (vanity → bỏ), streak (đã ở heatmap).

## 4. Tab "Tổng quan" (Overview) — trang nhất, curated

Thứ tự ("Ai → Tiếng nói → Việc → Kiên trì"), mỗi khối tự ẩn khi rỗng, gap-6:

1. **Giới thiệu (bio)** — markdown README. Chủ + rỗng → nút "viết bio". `[user.bio]`
2. **Dự án** — **MỘT khối state-aware**, ưu tiên: *đã ghim* → *capstone verified* (`✓ Verified by StarCi`) → *capstone đang làm* (progress bar, khung "đang xây"). Cap ~3. Mỗi item: tiêu đề · khóa/desc · tech chips · progress(nếu đang làm) · link. "Xem tất cả →" tab Dự án. `[user-pinned-projects, user-capstone-progress]`
3. **Đóng góp** — heatmap + streak hiện tại/dài nhất. `[user-contribution-calendar, user-weekly-stats]`
4. **Kỹ năng (compact)** — top 3-4 theo **độ khó**, gộp tín hiệu **code-practice + challenge + tech capstone**. "Xem tất cả →" tab Kỹ năng. `[user-coding-skills, user-solved-challenges]`

KHÔNG: ribbon · achievements wall · donut ngôn ngữ đầy (3 cái đó ở tab khác).

## 5. Tab "Dự án" (Projects) — portfolio đầy đủ

- **Đã ghim** — danh sách pinned đầy đủ; chủ: manage/reorder/add. `[user-pinned-projects]`
- **Capstone theo khóa** — mỗi khóa: roadmap milestone + task progress + repo + trạng thái verified. `[user-capstone-progress, user-capstone-tasks]`
- **Challenge có repo** — bài chấm có repo = artifact kỹ năng đã verify. `[user-solved-challenges]`
- Rỗng (chưa enroll) → "chưa có dự án; tham gia khóa để bắt đầu capstone".

## 6. Tab "Kỹ năng & Lập trình" (Skills) — chiều sâu/năng lực

- **Độ sâu theo độ khó** — giải easy/medium/hard (bars) = tín hiệu sâu thật. `[user-coding-progress, user-coding-skills.byDifficulty]`
- **Ngôn ngữ** — breakdown theo ngôn ngữ (depth per lang, KHÔNG flex số lượng). `[user-coding-skills.byLanguage]`
- **Lịch sử giải** — bài giải gần đây. `[user-coding-history]`
- (Mở rộng) topic/kỹ năng suy từ challenge.
- Rỗng → "chưa giải bài nào; vào Luyện tập".

## 7. Tab "Hoạt động" (Activity) — hành trình & gắn bó

- **Thành tích** — badge đã đạt (theo tier/rank). `[user-achievements]`
- **Khóa học** — khóa đã tham gia + progress. `[user-courses]`
- **Dòng hoạt động** — feed timeline (đọc bài, giải, đạt badge…). `[user-feed]`
- Rỗng → ẩn từng phần.

## 8. Trạng thái & kỹ thuật

- **Loading:** skeleton khớp layout. **Error:** `ErrorState` + retry. **Empty:** theo §2.1.
- **Locked** (profileLocked & không phải chủ): header identity + "hồ sơ riêng tư", giấu tab.
- **Not found:** 404 state.
- Text = **Typography**; className = **placement-only**; dùng **blocks** (MediaCard/ListRow/StatusChip/EmptyState/ProgressMeter/StatPair); verified = `StatusChip` success.

## 9. Mục mở (cần chốt / cần data)

- **Hire CTA**: cơ chế liên hệ (email / nhắn trong app / form)? — riêng tư: KHÔNG lộ email công khai.
- **Kỹ năng gồm challenge**: hiện skills chỉ từ coding-practice → cần aggregate thêm tín hiệu từ challenge (data work).
- **course-pin enrollmentId**: query `myPinnableCapstones` (đang làm) để ghim capstone.
