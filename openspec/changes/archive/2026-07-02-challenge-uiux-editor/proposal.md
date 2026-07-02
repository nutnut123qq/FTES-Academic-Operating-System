## Why

Challenges có 5 loại (`coding | sql | uiux | ai | business`) nhưng chưa có màn hình GIẢI cho loại **UI/UX**: người học không có nơi thực sự dựng UI để đối chiếu với target design. Product owner: "Gắn editor vô cho UI/UX luôn đi" — cần một live HTML/CSS (+ JS tối thiểu) editor với preview thời gian thực để giải challenge UI/UX ngay trong app.

## What Changes

- Thêm route giải challenge `/[locale]/challenges/[challengeId]` với `ChallengeView` (solve surface standalone); các card catalog đã trỏ `/challenges/${id}` nhưng route chưa tồn tại.
- Với challenge `type === "uiux"`, `ChallengeView` render một **UI/UX editor** split-pane: editor (HTML/CSS/JS) | live preview.
- Editor pane dùng `@monaco-editor/react` (ĐÃ cài trong `package.json`) với 3 tab HTML / CSS / JS; KHÔNG thêm dependency nặng mới.
- Live preview = `<iframe sandbox srcDoc>` compose từ 3 nguồn, cập nhật debounce (~400ms).
- Panel target: ảnh reference design + checklist yêu cầu (map từ `challenge.requirements`).
- Reset / format code, autosave draft vào localStorage (mock), nút Submit stub (mock scoring FE).
- Responsive: desktop split ngang, mobile stack dọc + tab chuyển Editor/Preview.
- Reduced-motion, loading skeleton, empty/error state; i18n vi/en; a11y.
- Gate: nội dung premium mở khoá bằng **ENROLL khoá học** (không phải VIP) — theo house rule.

## Capabilities

### New Capabilities
- `challenge-uiux-editor`: live HTML/CSS/JS editor + preview để giải challenge UI/UX, có target panel, autosave mock và submit stub.

### Modified Capabilities
- (none)

## Impact

FE only, mock. Monaco đã có sẵn — không thêm dep nặng. BE grading là GIẢ ĐỊNH (chấm điểm hiện mock ở FE). `npm run build` (webpack) + `tsc --noEmit` phải xanh.
