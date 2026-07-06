# Proposal — subject-workspace-feed-polish

## Why

Ba phản hồi từ checklist review (STT 2, 29B, 29C) trên bề mặt community/subject-workspace:

- **STT 2:** hiệu ứng mưa sao băng (AmbientBackground) chạy đè lên vùng nội dung ở
  trang community + không gian môn học, gây rối khi đọc. User: "sao băng phải ở dưới
  nền, không được đè lên phần hiển thị nội dung". Hiện `AmbientBackground` chỉ bị tắt
  ở route `/learn`; các route đọc-nhiều khác vẫn để streak chạy qua card.
- **STT 29B:** thanh progress ở header không gian môn học không có số % — user muốn
  hiện % ở **bên phải thanh**.
- **STT 29C:** banner "Bạn đã tham gia không gian này" đang gộp stats + nút đăng bài,
  chiếm chỗ và không tắt được. User muốn: (1) banner thành **thông báo tắt được**,
  (2) dời dòng stats (thành viên · moderator · tài liệu) **lên đầu, dưới tên workspace**,
  (3) **dời nút đăng bài** sang chỗ khác.

## What Changes

- **`InnerLayout`:** mở rộng guard tắt AmbientBackground từ chỉ `/learn` sang cả
  `/community` và `/subjects` — các bề mặt nội dung dày, cùng lý do đã áp cho Learn
  (motion cạnh tranh với việc đọc). Effect vẫn chạy ở landing/home/nơi trang trí.
- **`SubjectWorkspaceShell`:** thanh `ProgressMeter` ở header bọc trong 1 hàng flex,
  thêm `{percent}%` (`tabular-nums`) sát bên phải thanh.
- **`SubjectOverview`:** tách banner cũ thành 3 phần:
  - dòng stats muted đặt **đầu trang** (ngay dưới header tên workspace),
  - **notice "đã tham gia" tắt được** (nút ×, nhớ trạng thái qua `localStorage` theo
    `subjectId`) — bỏ stats + bỏ nút đăng bài khỏi banner,
  - nút **"Đăng bài"** dời vào cạnh tiêu đề "Thảo luận gần đây".
- i18n: thêm `subjects.overview.dismiss` (vi/en). Không route mới, không block mới.

## Capabilities

### Modified Capabilities

- `subject-workspace`: header hiện % hoàn thành cạnh thanh progress; tab Overview
  trình bày stats ở đầu + notice tham gia tắt-được + hành động đăng bài cạnh feed.
- `app-shell`: ambient background bị tắt trên route nội dung (learn/community/subjects).

## Impact

- FE-only. 3 file source (`InnerLayout`, `SubjectWorkspaceShell`, `SubjectOverview`)
  + 2 file i18n. Không đổi BE, không thêm dependency.
