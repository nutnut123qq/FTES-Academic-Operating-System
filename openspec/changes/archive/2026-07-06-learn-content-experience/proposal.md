# Proposal — learn-content-experience

## Why

Checklist STT 30 + "30 bổ sung": trang Learn content còn thiếu; cần trải nghiệm học đầy
đủ tham khảo StarCI — đọc bài + video + comment mỗi bài + hỏi đáp AI + bôi đen hỏi AI +
mind map course + leaderboard (kèm kì) + chấm bài.

## What Changes

- **Learn 3 cột** (`courses/[courseId]/learn/content`): rail menu module trái · danh
  sách module/lesson giữa · header course + progress phải.
- **Lesson reader**: video placeholder + body bài + switcher ngôn ngữ/chế độ + TOC
  "On this page" + comment mỗi bài + affordance "Hỏi AI về đoạn này" (panel stub).
- **Mind map** course (SVG/CSS radial/tree, "you are here", legend) — không WebGL.
- **Leaderboard** course (podium + list XP bar + filter category + nhãn kì/cohort).
- **Chấm bài**: panel nộp (task + ô URL + chọn grader + Submit/View Attempts + kết quả).
- FE-only, mock. i18n gom scratch rồi merge. Ưu tiên core reader; phần sâu để stub.

## Capabilities

### Modified Capabilities

- `course-learn`: có trang học 3 cột + reader (video/comment/AI-ask/TOC) + mind map +
  leaderboard + chấm bài (bản đầu, mock; tương tác sâu để stub chờ BE).

## Impact

- FE-only, thư mục `features/learn` + route `courses/[courseId]/learn/*` + hooks. Mock,
  không BE thật, không WebGL, không dependency nặng.
