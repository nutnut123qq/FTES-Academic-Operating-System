# Tasks — challenge-uiux-editor

## 1. Nền: route giải + data mock

- [ ] 1.1 Mock `useQueryChallengeSwr(challengeId)` (single challenge): trả `{ id, title, type, difficulty, requirements[], starter: {html,css,js}, targetImageUrl, isLocked, courseId }` (giả định BE)
- [ ] 1.2 Route `src/app/[locale]/challenges/[challengeId]/page.tsx` → render `ChallengeView` (khớp card catalog `/challenges/${id}`)
- [ ] 1.3 `ChallengeView`: fetch challenge, switch theo `type`; `uiux` → `<UiUxChallengeEditor>`, type khác → placeholder "coming soon"; accordion Yêu cầu/Bước/Gợi ý `variant="surface"`
- [ ] 1.4 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 2. Editor pane (Monaco đã cài)

- [ ] 2.1 `UiUxChallengeEditor`: state `html/css/js` + `activeTab`; seed từ `challenge.starter`
- [ ] 2.2 Editor = `@monaco-editor/react` load động (`next/dynamic`, `ssr:false`); 3 tab HTML/CSS/JS (HeroUI tabs, icon+label, mobile ẩn label + `aria-label`); language per tab
- [ ] 2.3 Fallback textarea flat + syntax hint khi Monaco lỗi tải (degrade, không chặn)
- [ ] 2.4 Toolbar: Reset (về starter + xoá draft), Format (Monaco format action)
- [ ] 2.5 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 3. Live preview (iframe sandbox, debounced)

- [ ] 3.1 Compose srcDoc = `<!doctype html><style>{css}</style>{html}<script>{js}</script>`
- [ ] 3.2 `<iframe sandbox="allow-scripts" srcDoc={composed} title=...>` — KHÔNG `allow-same-origin`
- [ ] 3.3 Debounce rebuild srcDoc ~400ms; reduced-motion không auto-scroll/animate
- [ ] 3.4 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 4. Target panel + checklist

- [ ] 4.1 Panel reference: ảnh target (`targetImageUrl`) + `alt`; skeleton khi tải ảnh
- [ ] 4.2 Checklist yêu cầu map từ `challenge.requirements` (checkbox tick tay, mock)
- [ ] 4.3 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 5. Autosave + submit stub

- [ ] 5.1 Autosave debounce → `localStorage["ftesaos-uiux-draft:<challengeId>"]`; hydrate lúc mount; indicator "Đã lưu nháp"
- [ ] 5.2 Mock `useMutateSubmitUiUxChallengeSwr`: mock scoring FE (đếm checklist/heuristic) → `{ score, passed }`; hiển thị kết quả (giả định BE grading)
- [ ] 5.3 Verify: `npx tsc --noEmit` sạch (build: batch-verified by orchestrator)

## 6. Responsive, gate, states, i18n, a11y

- [ ] 6.1 Desktop split ngang; mobile stack + tabs Soạn/Xem trước/Đề bài
- [ ] 6.2 Gate premium: overlay CTA "Đăng ký khoá học" (enroll khoá hiện tại), KHÔNG VIP; free-enroll xem đề + starter
- [ ] 6.3 Loading skeleton (mirror layout) + empty/error state
- [ ] 6.4 i18n `challenge.uiuxEditor.*` (vi/en): tabs, toolbar, autosave, submit, gate, states
- [ ] 6.5 A11y: iframe `title`, tabs `aria-label`, editor label, checklist checkbox nhãn, focus order
- [ ] 6.6 Verify: `npx tsc --noEmit` sạch + JSON messages hợp lệ (build: batch-verified by orchestrator)
