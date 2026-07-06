# Proposal — workplace-post-interactions

## Why

Checklist STT 21: trong không gian môn học, nút tim / comment ở bài viết "chưa bấm
được". Tab **Thảo luận** (`SubjectCommunity`) THỰC RA đã wire đầy đủ like + comment
(qua `PostEngagementBar` + reaction/comment hook). Chỗ còn tĩnh là **preview post rows**
ở tab Overview (`SubjectOverview.PostRow`) — heart/comment chỉ là `<span>` trang trí,
không bấm được.

## What Changes

- **`SubjectOverview.PostRow`:** đổi 2 cụm heart/comment từ `<span>` tĩnh → `<Link>`
  dẫn tới tab Thảo luận (`${base}/discussion`) — nơi tương tác like/comment thật đã
  hoạt động. Hover đổi màu (tim → danger, comment → accent) để đọc ra "bấm được".
- Không đụng `SubjectCommunity` (đã interactive). Không hook mới, không i18n mới
  (dùng lại aria-label sẵn có).

## Capabilities

### Modified Capabilities

- `subject-workspace`: bài viết ở Overview preview có heart/comment bấm được, dẫn về
  tab Thảo luận interactive (đúng IA preview → full feed).

## Impact

- FE-only, 1 file (`SubjectOverview`). Không BE, không dependency.
