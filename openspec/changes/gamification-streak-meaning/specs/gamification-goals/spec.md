## ADDED Requirements

### Requirement: Daily goal
Hệ thống SHALL đặt Daily goal mặc định = hoàn thành 2 hành động học trong ngày (lesson/quiz/challenge, đếm không trùng lần trao XP). Hoàn thành trao +10 XP (không nhân multiplier) đúng 1 lần/ngày; tiến độ reset đầu ngày local.

#### Scenario: Hoàn thành daily goal
- **WHEN** người học hoàn thành hành động học thứ 2 trong ngày
- **THEN** card goal chuyển trạng thái hoàn thành, trao +10 XP kèm toast, không trao thêm khi làm hành động thứ 3

### Requirement: Weekly goal
Hệ thống SHALL đặt Weekly goal mặc định = có ≥ 5 ngày streak-hợp-lệ trong tuần (Thứ 2–Chủ nhật, ngày local). Hoàn thành trao +50 XP (không nhân) đúng 1 lần/tuần; tiến độ reset đầu tuần.

#### Scenario: Hoàn thành weekly goal
- **WHEN** người học đạt ngày học hợp lệ thứ 5 trong tuần
- **THEN** card goal weekly chuyển hoàn thành và trao +50 XP kèm toast

### Requirement: Card goals trên leaderboard
Trang `/leaderboard` SHALL hiển thị khối "Mục tiêu" gồm 2 card Daily/Weekly: tên goal, tiến độ (vd. 1/2, 3/5 ngày), thưởng XP, trạng thái hoàn thành. Chuỗi có vi/en; tiến độ đọc được bởi screen reader (không chỉ là thanh màu).

#### Scenario: Xem tiến độ goals
- **WHEN** người học đã học 1 hành động hôm nay và có 3 ngày hợp lệ tuần này
- **THEN** khối Mục tiêu hiển thị Daily 1/2 (+10 XP) và Weekly 3/5 ngày (+50 XP), mỗi card có văn bản tiến độ truy cập được

#### Scenario: Monthly goal chưa có
- **WHEN** người học xem khối Mục tiêu hoặc trang guide
- **THEN** không có Monthly goal nào được hiển thị như luật đang chạy (guide chỉ nhắc ở mục "Sắp ra mắt")
