| Bề mặt | Cách che (blur CSS / cắt chuỗi / không render / redirect) | Dữ liệu bị che có nằm trong payload client không? | Hook/endpoint cấp dữ liệu | File:dòng |
| --- | --- | --- | --- | --- |
| `DocumentReader` | Cắt chuỗi URL (`stripPreviewLinks`), overlay gradient fade bên dưới | KHÔNG (Backend chủ động strip content teaser trên server: `LessonContentTeaserService.stripLinks`. FE strip thêm HTML links để phòng thủ) | `useLessonContentSwr.ts` (REST `GET /courses/{id}/lessons/{id}/content`) | `src/components/features/learn/DocumentReader/index.tsx:88`, `219` |
| `LessonVideoBlock` | Theo dõi thời gian phát, dừng video và hiển thị `PackageGateModal` (`usePreviewGate` tại `previewSeconds`) | KHÔNG XÁC ĐỊNH ĐƯỢC (Player phát qua HLS manifest, việc phân giải segment bị gate ở BE hay không không kiểm chứng được qua mã FE) | `useLessonContentSwr.ts` (REST, trả về HLS URL) | `src/components/features/learn/LessonReader/LessonVideoBlock.tsx:131`, `143` |
| `ContentMap` / `MindMap` | Không render action (ngăn click node), render icon khóa | CÓ (Syllabus lấy từ API chứa đủ nội dung để dựng bản đồ, block điều hướng là FE gate) | `useQueryLearnCourseSwr.ts` (REST `GET /courses/{id}`) | `src/components/features/learn/MindMap/status.ts:37` |
| `CourseDetail` (Syllabus) | Ngăn không cho click điều hướng | CÓ (Syllabus nằm trong public endpoint để render mục lục, block click là UX) | `useQueryCourseDetailSwr.ts` | `src/components/features/course/CourseDetail/index.tsx:503`, `571` |
| `UiUxChallengeEditor` | Render màn hình gate đè lên (Overlay mờ / Readonly pane) | CÓ (Render template đằng sau, FE phủ một màn hình khóa lên trên vì base data đã trả về) | `useQueryChallengeSwr.ts` (REST `GET /challenges/{id}`) | `src/components/features/challenge/ChallengeView/UiUxChallengeEditor/index.tsx:131`, `155` |
| `ChallengePaper` (AI Grading) | Component tồn tại nhưng không thể tương tác (chỉ render text `paper.submit.lockedBadge`) | KHÔNG XÁC ĐỊNH ĐƯỢC (Tùy thuộc backend gửi object data thật hay rỗng) | `useQueryChallengeSwr.ts` (REST `GET /challenges/{id}`) | `src/components/features/challenge/ChallengeView/ChallengePaper.tsx:28`, `90` |
| `GradeCodePanel` (IDE) | Disable các button submit, khóa dropdown chọn ngôn ngữ, không lock IDE chạy | KHÔNG (Giới hạn chạy code phụ thuộc endpoint POST ở backend, dữ liệu FE giới hạn UX UI) | `useMutateCodingAttemptSwr.ts` (REST `POST`) | `src/components/features/challenge/ChallengeView/GradeCodePanel/index.tsx:196` |
| `ChallengeSubmission` | Giao diện form bị disable, không gọi request nếu client thấy locked, gọi `PackageGateModal` | KHÔNG (Phòng thủ client không gửi doomed request; backend trả 403 `CHALLENGE_COURSE_ACCESS_DENIED`) | `useQueryChallengeSubmissionResultsSwr.ts`, methods upload | `src/components/features/learn/ChallengeSubmission/index.tsx:119`, `213` |

## Che bằng CSS trên dữ liệu ĐÃ TẢI VỀ
- **`UiUxChallengeEditor`**: Dữ liệu template cho editor pane đã được tải về bởi thẻ bao, nhưng UI/UX bị che mờ do render component gate đè lên trên.
  - Fetch hook: `useQueryChallengeSwr.ts` (`src/components/features/challenge/hooks/useQueryChallengeSwr.ts:8`)
  - Hiding: `src/components/features/challenge/ChallengeView/UiUxChallengeEditor/index.tsx:155` (`{/* editor pane (gated by enroll when premium) */}`)
- **`CourseDetail` (Syllabus)** và **`ContentMap` / `MindMap`**: Dữ liệu cấu trúc bài giảng được FE fetch đầy đủ trạng thái nhưng việc ẩn/hiện điều hướng khóa học phụ thuộc vào state FE. Outline nằm trong payload server.
  - Fetch hook `CourseDetail`: `useQueryCourseDetailSwr.ts` (`src/components/features/course/hooks/useQueryCourseDetailSwr.ts:277`)
  - Hiding `CourseDetail`: `src/components/features/course/CourseDetail/index.tsx:571` (`return lesson.isLocked ? (...) : (...)`)
  - Fetch hook `MindMap`: `useQueryLearnCourseSwr.ts` (`src/components/features/learn/hooks/useQueryLearnCourseSwr.ts:16`)
  - Hiding `MindMap`: `src/components/features/learn/MindMap/status.ts:37` (Status check) và ngắt sự kiện click node.

## Che ở nguồn
- **`DocumentReader`**: Backend chủ động gửi teaser server-side (theo comment: `LessonContentTeaserService.stripLinks`). Khẳng định qua bình luận "document-preview-admin-gate" ở FE, FE chỉ nhận đoạn teaser ngắn và làm hiệu ứng CSS mờ dần tại footer cộng thêm phòng thủ strip `<a>` link.
  - Hiding: `src/components/features/learn/DocumentReader/index.tsx:88-91`, `src/components/features/learn/DocumentReader/index.tsx:219`
- **`GradeCodePanel`** và **`ChallengeSubmission`**: UI chặn nút submit chỉ là UX, giới hạn lượt chấm chạy test (quota `freeRunLimit`, limit attempt) được server gate ở điểm cuổi (POST request) hoặc từ chối HTTP 403 (`CHALLENGE_COURSE_ACCESS_DENIED`). Client chặn request "doomed" để giảm payload mạng (Client-side gate).
  - Hiding `GradeCodePanel`: `src/components/features/challenge/ChallengeView/GradeCodePanel/index.tsx:196`
  - Hiding `ChallengeSubmission`: `src/components/features/learn/ChallengeSubmission/index.tsx:119`, `213` và `src/components/features/learn/ChallengeSubmission/ChallengeMethodSolver.tsx:246`
- **`ChallengePaper` (AI Grading)**: Giao diện hand-in block "exists but is GATED", khối uploader biến mất do AI paper là "product that has not been sold yet". Component render form rỗng vì backend không ship data grading.
  - Hiding: `src/components/features/challenge/ChallengeView/ChallengePaper.tsx:90`, `src/components/features/challenge/ChallengeView/ChallengePaper.tsx:241`

## Lệch giữa các bề mặt
- Cùng hiển thị nội dung outline các bài học khóa học:
  - Trên **`CourseDetail`** (Syllabus list), bài học bị khóa hiển thị với UX list item không thể click vào (`src/components/features/course/CourseDetail/index.tsx:571`).
  - Trên bản đồ **`ContentMap` / `MindMap`**, các bài học khóa hiển thị trên node cây biểu đồ với state status khác và ngăn routing (`src/components/features/learn/MindMap/status.ts:37`). Cả 2 bề mặt này đều dựa vào thông tin server trả sẵn nhưng sử dụng logic ẩn click khác nhau.
- Cùng context Trial/Preview của bài học bị khóa (Dữ liệu học):
  - Bề mặt **`DocumentReader`**: Hiển thị text teaser cắt bớt, có CSS gradient mờ (`src/components/features/learn/DocumentReader/index.tsx:88`).
  - Bề mặt **`LessonVideoBlock`**: Cắt giữa chừng bằng JS timer cắt playback của HLS Video dựa trên `previewSeconds` (`src/components/features/learn/LessonReader/LessonVideoBlock.tsx:131`).

## Không đọc được
- **`LessonVideoBlock`**: Dù player trên web dừng tại thời điểm `previewSeconds` (timer của FE), dữ liệu streaming video thực chất lấy từ manifest HLS (qua signed url server trả về). FE không thể tự xác nhận được xem manifest do BE gửi có bị BE cắt xén playlist các file segments `.ts` thực hay không. Do đó, KHÔNG XÁC ĐỊNH ĐƯỢC chỉ bằng việc đọc mã nguồn FE.
- **`ChallengePaper` (AI Grading block)**: Component render placeholder (`lockedBadge`) có ghi chú là AI chưa bán. Tuy nhiên dữ liệu AI backend có ship object kèm theo payload gốc qua API endpoint hay không (trước khi FE render UI này) thì cần kiểm tra API response cụ thể (KHÔNG XÁC ĐỊNH ĐƯỢC qua FE tĩnh).
