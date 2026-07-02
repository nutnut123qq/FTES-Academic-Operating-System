## Context

Repo là Next.js FE (App Router, HeroUI, i18n vi/en), mock-first. Challenges có type taxonomy `coding | sql | uiux | ai | business` (thấy trong `useQueryChallengesSwr` mock: `type: "coding" | "sql" | "uiux" | "ai" | "business"`). `ChallengeCatalog` render card trỏ `/challenges/${challenge.id}` nhưng route/solve-view CHƯA tồn tại. Đây là màn hình GIẢI net-new cho loại `uiux`.

## Goals / Non-Goals

**Goals:** editor HTML/CSS/JS + live preview iframe cho challenge `uiux`; target image + checklist; reset/format; autosave localStorage (mock); submit stub (mock scoring); responsive/mobile; a11y; i18n vi/en; gate = enroll.
**Non-Goals:** BE chấm điểm thật (giả định); pixel-diff so ảnh; editor cho `coding/sql/ai/business` (chỉ khung `ChallengeView` phân nhánh theo type, UI/UX là nhánh đầu tiên có editor); collaborative/realtime; versioning drafts.

## Decisions

### Editor library — Monaco (ĐÃ cài, không thêm dep)
`package.json` đã có `@monaco-editor/react` (^4.7.0) + `monaco-editor` (^0.55.1). → Dùng thẳng Monaco, KHÔNG thêm CodeMirror/textarea. Load động (`next/dynamic`, `ssr: false`) để tránh SSR + giảm bundle. Ba ngôn ngữ = ba model Monaco (`language: "html" | "css" | "javascript"`), chuyển bằng HeroUI tabs (icon+label, mobile ẩn label per house rule). Fallback: nếu Monaco lỗi tải, hiện textarea flat với syntax hint (degrade, không chặn giải bài).

### Nơi mount trong solve view
Route mới `src/app/[locale]/challenges/[challengeId]/page.tsx` → `ChallengeView` (feature `features/challenge/ChallengeView` hoặc `features/learn/ChallengeView` khớp cây learn). `ChallengeView` fetch challenge qua mock `useQueryChallengeSwr(challengeId)`; switch theo `challenge.type`: `uiux` → render `<UiUxChallengeEditor>`; các type khác → placeholder "coming soon" (ngoài scope). Các accordion mô tả (Yêu cầu · Các bước · Gợi ý) dùng `variant="surface"` theo rule trang giải standalone.

### Layout editor
Split-pane 2 cột desktop: trái = editor (tabs HTML/CSS/JS + Monaco), phải = **live preview** trên, **target + checklist** dưới (hoặc target ở cột thứ 3 khi đủ rộng). Mobile: stack dọc, HeroUI tabs chuyển giữa "Soạn" (editor) / "Xem trước" (preview) / "Đề bài" (target+checklist). Toolbar: Reset, Format, Autosave indicator, Submit.

### Live sandboxed preview — iframe srcDoc, debounced
Preview = `<iframe sandbox="allow-scripts" srcDoc={composed} title=...>`. `composed` = template `<!doctype html><style>{css}</style>{html}<script>{js}</script>`. KHÔNG `allow-same-origin` (chặn iframe đọc localStorage/cookie parent → an toàn với JS học viên). Rebuild srcDoc debounce ~400ms sau keystroke để tránh reload liên tục. Reduced-motion: không auto-scroll/animate khi rebuild.

### State / store / autosave
State cục bộ trong `UiUxChallengeEditor` (`useState` cho html/css/js + activeTab). Autosave: `useEffect` debounce ghi `{html,css,js}` vào `localStorage["ftesaos-uiux-draft:<challengeId>"]` (mock, per-challenge). Mount: hydrate từ localStorage nếu có, else seed từ `challenge` starter code (mock). Reset = xoá draft key + về starter. KHÔNG thêm zustand/redux (state đóng trong 1 component; theo canon dùng local state cho phạm vi hẹp).

### Submit stub (mock scoring)
Nút Submit gọi mock `useMutateSubmitUiUxChallengeSwr` (mock, giả định BE grading): tính điểm FE bằng đếm checklist item đã tick / heuristic đơn giản → trả `{ score, passed }`, hiển thị kết quả (HeroUI). Ghi rõ đây là mock; contract BE grading là GIẢ ĐỊNH.

### Gate premium = enroll (không VIP)
Nếu challenge thuộc nội dung premium chưa mở, chặn editor bằng overlay CTA "Đăng ký khoá học" (enroll khoá chứa challenge), KHÔNG "Nạp VIP", KHÔNG vương miện. CTA trỏ trang chi tiết/checkout của khoá hiện tại. Free-enroll vẫn được xem đề + starter.

## Risks / Trade-offs

- Monaco tăng bundle → mitigate bằng dynamic import `ssr:false` + code-split theo route giải.
- iframe `allow-scripts` cho phép JS học viên chạy → KHÔNG `allow-same-origin` nên không truy cập được origin app; chấp nhận rủi ro sandbox chuẩn.
- Mock scoring không phản ánh chấm thật — logged là giả định BE.
- Autosave localStorage per-device, không sync — chấp nhận cho mock.
