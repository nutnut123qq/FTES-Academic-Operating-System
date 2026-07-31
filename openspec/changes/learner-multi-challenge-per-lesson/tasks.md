# Tasks

## 1. Read model
- [x] 1.1 `LearnLessonView.challenges` (id, title, slug, type, free) + return từ buildLessonView
- [x] 1.2 Enrich FlatLesson.challenges (thêm title, type) từ `LessonView.challenges`
- [x] 1.3 `challengeCount` = số challenge thật (bỏ hardcode 0)

## 2. Reader
- [x] 2.1 `ChallengesView` render list (mỗi challenge 1 thẻ, khoá độc lập theo free+quyền)
- [x] 2.2 Tab "Thử thách" hiện khi list ≥1 (fallback linkage đơn cho BE cũ)
- [x] 2.3 `OnThisPage`: 1 nút practice mỗi challenge

## 3. Verify
- [x] 3.1 `next build` (webpack) xanh
- [x] 3.2 `openspec validate learner-multi-challenge-per-lesson --strict`
