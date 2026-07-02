# Tasks — challenge-uiux-editor

## 1. Nền: route giải + data mock

- [x] 1.1 Mock `useQueryChallengeSwr(challengeId)` (single challenge): trả `{ id, title, type, difficulty, requirements[], starter: {html,css,js}, targetImageUrl, isLocked, courseId }` (giả định BE)
- [x] 1.2 Route `src/app/[locale]/challenges/[challengeId]/page.tsx` → render `ChallengeView` (khớp card catalog `/challenges/${id}`)
- [x] 1.3 `ChallengeView`: fetch challenge, switch theo `type`; `uiux` → `<UiUxChallengeEditor>`, type khác → placeholder "coming soon"; accordion Yêu cầu/Bước/Gợi ý `variant="surface"`
- [x] 1.4 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 2. Editor pane (Monaco đã cài)

- [x] 2.1 `UiUxChallengeEditor`: state `html/css/js` + `activeTab`; seed từ `challenge.starter`
- [x] 2.2 Editor = `@monaco-editor/react` load động (`next/dynamic`, `ssr:false`); 3 tab HTML/CSS/JS (HeroUI tabs, icon+label, mobile ẩn label + `aria-label`); language per tab
- [x] 2.3 Fallback textarea flat + syntax hint khi Monaco lỗi tải (degrade, không chặn)
- [x] 2.4 Toolbar: Reset (về starter + xoá draft), Format (Monaco format action)
- [x] 2.5 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 3. Live preview (iframe sandbox, debounced)

- [x] 3.1 Compose srcDoc = `<!doctype html><style>{css}</style>{html}<script>{js}</script>`
- [x] 3.2 `<iframe sandbox="allow-scripts" srcDoc={composed} title=...>` — KHÔNG `allow-same-origin`
- [x] 3.3 Debounce rebuild srcDoc ~400ms; reduced-motion không auto-scroll/animate
- [x] 3.4 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 4. Target panel + checklist

- [x] 4.1 Panel reference: ảnh target (`targetImageUrl`) + `alt`; skeleton khi tải ảnh
- [x] 4.2 Checklist yêu cầu map từ `challenge.requirements` (checkbox tick tay, mock)
- [x] 4.3 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 5. Autosave + submit stub

- [x] 5.1 Autosave debounce → `localStorage["ftesaos-uiux-draft:<challengeId>"]`; hydrate lúc mount; indicator "Đã lưu nháp"
- [x] 5.2 Mock `useMutateSubmitUiUxChallengeSwr`: mock scoring FE (đếm checklist/heuristic) → `{ score, passed }`; hiển thị kết quả (giả định BE grading)
- [x] 5.3 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 6. Responsive, gate, states, i18n, a11y

- [x] 6.1 Desktop split ngang; mobile stack + tabs Soạn/Xem trước/Đề bài
- [x] 6.2 Gate premium: overlay CTA "Đăng ký khoá học" (enroll khoá hiện tại), KHÔNG VIP; free-enroll xem đề + starter
- [x] 6.3 Loading skeleton (mirror layout) + empty/error state
- [x] 6.4 i18n `challenge.uiuxEditor.*` (vi/en): tabs, toolbar, autosave, submit, gate, states
- [x] 6.5 A11y: iframe `title`, tabs `aria-label`, editor label, checklist checkbox nhãn, focus order
- [x] 6.6 Verify: `npx tsc --noEmit` sạch + JSON messages hợp lệ (build: batch-verified by orchestrator)
