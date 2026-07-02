## ADDED Requirements

### Requirement: Journey camera takeover ends at the next stage change
Trong hero 3D user-journey, việc người dùng kéo xoay scene (orbit) SHALL chỉ tạm
dừng camera rig **cho tới lần đổi trạm active kế tiếp**, không vĩnh viễn. Khi trạm
active đổi (do click/tap/keyboard trên stepper HOẶC do auto-advance), camera MUST
tween mượt trong MỘT chuyển động thẳng từ pose hiện tại (kể cả pose người dùng vừa
xoay) về pose chuẩn của trạm mới — không đi hai pha "quay về pose cũ rồi mới bay".
Điểm pivot của orbit (controls target) MUST đi theo trạm active, để lần kéo xoay
sau khi camera đã dời trạm không bị giật snap về hướng cũ.

#### Scenario: Stepper vẫn lái camera sau khi người dùng đã orbit
- **GIVEN** người dùng đã kéo xoay scene 3D khỏi góc mặc định
- **WHEN** họ click một trạm khác trên stepper
- **THEN** camera tween mượt một bước từ góc đang xoay về góc chuẩn của trạm được chọn
- **AND** trạm đó được highlight và caption cập nhật như bình thường

#### Scenario: Người dùng đang kéo thì luôn thắng
- **GIVEN** camera đang tween về một trạm
- **WHEN** người dùng bắt đầu kéo xoay (orbit start)
- **THEN** camera rig nhả quyền ngay lập tức, không giành lại chừng nào trạm active chưa đổi

#### Scenario: Orbit sau khi đổi trạm pivot quanh trạm active
- **GIVEN** camera đã tween xong tới một trạm
- **WHEN** người dùng kéo xoay
- **THEN** camera quay quanh trạm active (không snap về điểm pivot cũ)
