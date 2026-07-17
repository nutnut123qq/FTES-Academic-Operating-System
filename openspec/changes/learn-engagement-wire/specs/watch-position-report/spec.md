# watch-position-report

## ADDED Requirements

### Requirement: Video watch position is reported periodically
Khi learner xem lesson VIDEO, FE SHALL gọi `PUT /courses/lessons/{id}/progress` (qua `usePostReportLessonProgressSwr` — hook sẵn có, hiện 0 call-site) mỗi 30 giây khi đang phát, và flush thêm khi pause / seek lớn / rời trang / ẩn tab, với throttle tối thiểu 5 giây giữa 2 request; hành vi complete hiện tại (FE gọi complete ở mốc 50%) SHALL GIỮ NGUYÊN.

#### Scenario: Report định kỳ khi xem
- **WHEN** learner phát video liên tục 65 giây
- **THEN** có ít nhất 2 request progress mang watchedSeconds tăng dần + videoDurationSeconds

#### Scenario: Flush khi rời trang
- **WHEN** learner đang xem rồi điều hướng sang bài khác
- **THEN** một request progress cuối được bắn với vị trí hiện tại trước khi unmount

#### Scenario: Không spam
- **WHEN** learner pause rồi play liên tiếp trong 3 giây
- **THEN** chỉ 1 request được bắn (throttle 5s)

#### Scenario: Không đổi hành vi complete
- **WHEN** learner xem qua mốc 50%
- **THEN** flow complete hiện tại vẫn chạy như cũ (report position không thay thế nó)

## Seed data

- Không seed FE. Verify cần video READY — seed demo không có video asset (VIDEO lesson trả
  VIDEO_NOT_READY), nên e2e position dùng course thật có video trên apitest HOẶC mock player
  trong unit test; ghi rõ điều này ở tasks (không block merge vì thiếu video seed).
