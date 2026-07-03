# gamification-streak Specification

## Purpose
TBD - created by archiving change gamification-streak-meaning. Update Purpose after archive.
## Requirements
### Requirement: Ngày streak hợp lệ = hành động HỌC có ý nghĩa
Một ngày SHALL chỉ được tính vào streak khi người học thực hiện ≥ 1 hành động học: hoàn thành bài học, nộp quiz, hoặc hoàn thành challenge. Chỉ đăng nhập, xem trang, hoặc hoạt động cộng đồng KHÔNG giữ streak. Ranh giới ngày = ngày local của thiết bị (mock FE; ghi chú: BE thật sẽ dùng Asia/Ho_Chi_Minh).

#### Scenario: Streak tăng khi hoàn thành bài học
- **WHEN** người học có streak 7 và hôm nay (ngày mới, chưa có hành động) hoàn thành 1 bài học
- **THEN** streak thành 8 ngay lập tức và các surface streak cập nhật

#### Scenario: Hai hành động cùng ngày chỉ tính một ngày
- **WHEN** người học đã hoàn thành 1 bài học hôm nay (streak đã tăng) rồi nộp thêm 1 quiz cùng ngày
- **THEN** streak KHÔNG tăng thêm; quiz vẫn được trao XP bình thường

#### Scenario: Login-only không giữ streak
- **WHEN** hôm qua người học chỉ đăng nhập (nhận +5 XP) mà không có hành động học, và không có freeze
- **THEN** hôm nay streak hiển thị 0 (đã reset), kèm gợi ý repair nếu còn trong hạn 48 giờ

### Requirement: Streak reset khi lỡ ngày không có freeze
Khi một ngày trôi qua không có hành động học và người học không có Streak Freeze khả dụng, streak SHALL reset về 0 và multiplier về +0%. Hệ thống ghi lại độ dài streak vừa mất và thời điểm mất để phục vụ repair.

#### Scenario: Reset sau ngày trống
- **WHEN** người học streak 12 không có hành động học nào trong cả ngày hôm qua và không có freeze
- **THEN** streak hiển thị 0, multiplier +0%, popover streak ghi "streak 12 ngày đã mất" kèm lựa chọn repair

### Requirement: Streak Freeze
Người học SHALL có thể sở hữu tối đa 2 Streak Freeze. Khi lỡ 1 ngày, hệ thống tự tiêu thụ 1 freeze để GIỮ streak (ngày đó tính là "đóng băng": streak không tăng, bậc multiplier không tăng, không mất). Freeze nhận từ mốc streak hoặc đổi 50 FTES coin/cái.

#### Scenario: Freeze tự động cứu streak
- **WHEN** người học streak 10 với 1 freeze trong kho lỡ trọn một ngày không hành động học
- **THEN** streak vẫn là 10, kho freeze còn 0, heatmap đánh dấu ngày đó là ngày đóng băng (khác màu ngày hoạt động)

#### Scenario: Không mua vượt trần freeze
- **WHEN** người học đang có 2 freeze và bấm đổi coin lấy freeze
- **THEN** hành động bị chặn kèm thông báo đã đạt tối đa 2 freeze

### Requirement: Streak Repair trong 48 giờ
Trong vòng 48 giờ sau khi streak bị reset, người học SHALL có thể chi FTES coin để khôi phục nguyên trạng streak (số ngày + bậc multiplier). Giá = `10 × số ngày streak đã mất`, trần 200 coin. Quá 48 giờ, lựa chọn repair biến mất.

#### Scenario: Repair thành công
- **WHEN** người học mất streak 12 cách đây 20 giờ và bấm repair với đủ coin
- **THEN** hệ thống trừ 120 coin, streak trở lại 12, multiplier trở lại bậc tương ứng

#### Scenario: Hết hạn repair
- **WHEN** đã 50 giờ kể từ khi mất streak
- **THEN** popover streak không còn hiển thị lựa chọn repair

### Requirement: Thang nhân XP theo streak
Streak SHALL cấp multiplier cho XP của hành động học: +5% mỗi ngày liên tiếp, trần +50% (từ ngày thứ 10). Multiplier áp cho hành động học (lesson/quiz/challenge), KHÔNG áp cho login/upvote/goal. XP hiển thị luôn là số đã nhân, làm tròn `round`.

#### Scenario: Multiplier ngày thứ 3
- **WHEN** người học streak 3 hoàn thành 1 challenge (gốc +40)
- **THEN** nhận `round(40 × 1.15) = 46` XP

#### Scenario: Trần multiplier
- **WHEN** người học streak 45 hoàn thành 1 bài học (gốc +20)
- **THEN** nhận `round(20 × 1.5) = 30` XP (trần +50%, không phải +225%)

### Requirement: Mốc thưởng streak
Hệ thống SHALL trao thưởng một-lần tại các mốc streak: 7 ngày → badge "Tuần Lửa" + 50 FTES coin; 30 ngày → badge "Tháng Bền Bỉ" + 200 coin + 1 Streak Freeze; 100 ngày → badge "Trăm Ngày Lửa" + 1 000 coin + title "Ngọn Lửa Bất Diệt". Mỗi mốc chỉ trao 1 lần trọn đời (repair không trao lại mốc đã nhận).

#### Scenario: Đạt mốc 7 ngày
- **WHEN** streak của người học tăng từ 6 lên 7
- **THEN** hệ thống hiển thị moment nhận badge "Tuần Lửa" + 50 coin, badge chuyển trạng thái earned trên `/leaderboard`

#### Scenario: Không trao lại mốc sau repair
- **WHEN** người học từng đạt mốc 7, mất streak, repair rồi lại chạm 7
- **THEN** không trao lại badge/coin của mốc 7

### Requirement: Nhắc streak sắp mất
Khi streak ≥ 3 và đến 20:00 local mà hôm nay chưa có hành động học, hệ thống SHALL đẩy 1 thông báo (notification bell mock) "Streak N ngày sắp mất — hoàn thành 1 bài học/quiz để giữ lửa", tối đa 1 lần/ngày, chỉ khi app đang mở (best-effort, ghi giả định FE).

#### Scenario: Nhắc lúc 20:00
- **WHEN** người học streak 7 chưa học gì hôm nay và đồng hồ tới 20:00 khi app đang mở
- **THEN** notification bell nhận 1 thông báo nhắc giữ streak; không lặp lại trong cùng ngày

### Requirement: Popover chi tiết streak với calendar heatmap
Từ stat card Streak trên `/leaderboard` và chip lửa ở avatar menu, người học SHALL mở được popover chi tiết streak gồm: số ngày hiện tại, multiplier hiện hành, heatmap 12 tuần (ô/ngày phân biệt: hoạt động, đóng băng, trống), kho freeze, mốc kế tiếp còn bao ngày, và (khi áp dụng) lựa chọn repair. Mỗi ô heatmap có nhãn truy cập được (ngày + trạng thái); popover đóng bằng Esc.

#### Scenario: Mở popover từ stat card
- **WHEN** người học bấm stat card Streak (streak 7, multiplier +35%, 1 freeze)
- **THEN** popover hiển thị "7 ngày · +35% XP", heatmap 12 tuần với 7 ô hoạt động gần nhất, "1 Freeze", "còn 23 ngày tới mốc 30"

#### Scenario: A11y heatmap
- **WHEN** screen reader focus vào một ô heatmap của ngày có hoạt động
- **THEN** đọc được ngày cụ thể kèm trạng thái (vd. "28/06 — có hoạt động học")

### Requirement: Surface hiển thị streak nhất quán
Số streak SHALL hiển thị nhất quán từ một nguồn state duy nhất tại: avatar menu (chip lửa), trang profile, stat card `/leaderboard`, và subject workspace. Mọi chuỗi có bản vi/en.

#### Scenario: Đồng bộ mọi surface sau khi tăng streak
- **WHEN** streak tăng từ 7 lên 8 do hoàn thành bài học
- **THEN** chip avatar menu, profile, leaderboard và workspace cùng hiển thị 8 không cần reload trang
