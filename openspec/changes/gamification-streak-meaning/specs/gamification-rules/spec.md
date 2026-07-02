## ADDED Requirements

### Requirement: XP economy — bảng điểm per-action
Hệ thống SHALL trao XP theo đúng bảng sau (nguồn duy nhất: `rules.ts`), nhân với streak multiplier hiện hành cho các hành động HỌC (đánh dấu ★):

| Hành động | XP gốc |
|---|---|
| ★ Hoàn thành 1 bài học (lesson) | +20 |
| ★ Nộp quiz — điểm < 60% | +10 |
| ★ Nộp quiz — 60–84% | +20 |
| ★ Nộp quiz — 85–99% | +35 |
| ★ Nộp quiz — 100% | +50 |
| ★ Hoàn thành 1 challenge | +40 |
| Đăng nhập lần đầu trong ngày | +5 (KHÔNG tính streak, KHÔNG nhân) |
| Bài viết được upvote | +2 (trần +20/ngày) |
| Bình luận được upvote | +1 (trần +10/ngày) |
| Hoàn thành Daily goal | +10 |
| Hoàn thành Weekly goal | +50 |

Quiz nộp lại cùng bài trong ngày chỉ tính lần có XP cao nhất.

#### Scenario: Quiz 90% với streak 7 ngày
- **WHEN** người học nộp quiz đạt 90% và streak multiplier hiện tại là +35% (7 ngày)
- **THEN** hệ thống trao `round(35 × 1.35) = 47` XP và hiển thị toast +47 XP

#### Scenario: Chỉ đăng nhập không nhân multiplier
- **WHEN** người học đăng nhập lần đầu trong ngày và không làm hành động học nào
- **THEN** nhận đúng +5 XP (không nhân streak) và streak KHÔNG tăng

#### Scenario: Trần upvote trong ngày
- **WHEN** bài viết của người học nhận upvote thứ 11 trong cùng một ngày
- **THEN** không cộng thêm XP (đã chạm trần +20/ngày cho upvote bài viết)

### Requirement: Level curve
Hệ thống SHALL tính level từ tổng XP theo công thức: tổng XP tối thiểu để đạt level L = `35 × (L−1)²` (tương đương `level = 1 + floor(sqrt(xp/35))`, level tối thiểu 1). UI hiển thị tiến độ tới level kế tiếp dạng "còn N XP".

#### Scenario: Level từ XP mock hiện tại
- **WHEN** người học có tổng 4 820 XP
- **THEN** level hiển thị là 12 và tiến độ ghi còn 220 XP để lên level 13 (mốc 5 040)

#### Scenario: Moment level-up
- **WHEN** một lần trao XP đưa tổng XP vượt mốc level kế tiếp
- **THEN** hệ thống hiển thị moment level-up (overlay/toast nổi bật ghi level mới) một lần duy nhất, tự đóng được và đóng được bằng bàn phím

### Requirement: Rank tiers theo tổng XP
Hệ thống SHALL xếp hạng người học vào 5 bậc theo tổng XP: Đồng (0–499), Bạc (500–1 499), Vàng (1 500–3 499), Bạch Kim (3 500–6 999), Kim Cương (≥ 7 000). Tier hiển thị kèm stat Rank trên `/leaderboard` và trong trang guide.

#### Scenario: Tier của người học mock
- **WHEN** người học có 4 820 XP
- **THEN** tier hiển thị là Bạch Kim, kèm ngưỡng kế tiếp (Kim Cương từ 7 000 XP)

### Requirement: Toast +XP khi được trao điểm
Hệ thống SHALL hiển thị toast không chặn thao tác mỗi lần trao XP, ghi số XP (đã nhân) và lý do; nhiều award liên tiếp được gộp/hàng đợi, không chồng đè che nội dung.

#### Scenario: Toast sau khi hoàn thành bài học
- **WHEN** người học hoàn thành một bài học (flow mock)
- **THEN** toast "+N XP · Hoàn thành bài học" xuất hiện rồi tự ẩn, có `role="status"` cho screen reader

### Requirement: Trang giải thích "Cách tính điểm"
Hệ thống SHALL cung cấp trang `/leaderboard/guide` trình bày: bảng XP per-action, công thức level (kèm ví dụ), bảng tier, luật streak (định nghĩa ngày hợp lệ, multiplier, mốc, freeze/repair), luật goals, và mục "Sắp ra mắt" cho League/Season. Trang được link từ header `/leaderboard`, có heading phân cấp đúng và bảng có header cell.

#### Scenario: Mở guide từ leaderboard
- **WHEN** người học bấm link "Cách tính điểm" trên trang `/leaderboard`
- **THEN** điều hướng tới `/leaderboard/guide` hiển thị đủ các mục: XP, Level, Hạng, Streak, Goals, Sắp ra mắt

#### Scenario: League được đánh dấu chưa ra mắt
- **WHEN** người học xem mục League/Season trong guide
- **THEN** nội dung chỉ là outline kèm nhãn "Sắp ra mắt", không có số liệu luật cụ thể

### Requirement: i18n và a11y cho các surface luật
Mọi chuỗi của guide, toast, moment level-up SHALL có bản vi và en dưới namespace `gamification.*`; số hiển thị theo locale; các thành phần tương tác dùng được bằng bàn phím và có tên truy cập được.

#### Scenario: Chuyển ngôn ngữ trên guide
- **WHEN** người học đổi ngôn ngữ vi ↔ en
- **THEN** toàn bộ trang guide (kể cả tên hành động trong bảng XP và tên tier) đổi theo, không còn chuỗi hard-code
