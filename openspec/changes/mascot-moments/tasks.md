# Tasks — mascot-moments

## 1. Primitive moment + persistence
- [x] 1.1 `mascot-moments/persistence.ts` — `ftes.mascot.*`: `isCelebrationShownToday/markCelebrationShownToday` (day-stamp), `isNudgeDismissed/markNudgeDismissed`; bọc try/catch SSR + private mode
- [x] 1.2 `MascotCelebration` — pose `cheer`, 1 lần/ngày/thiết bị, dismissible, **ẩn khi tour active** (không đốt lượt ngày khi hoãn vì tour)
- [x] 1.3 `MascotProfileNudge` — pose `point`, 1 lần/thiết bị, chỉ khi hồ sơ sơ sài + đã đăng nhập + không tour; CTA hoàn thiện hồ sơ + dismiss

## 2. Điểm cắm moment (theo danh mục design §4)
- [x] 2.1 `GamificationEventHost` — modal lên cấp pose `cheer`
- [x] 2.2 `QuestBoard` — celebration dọn sạch nhiệm vụ ngày (`cheer`, loại trừ với empty-state) + empty (`explain`) + gate khách (`greeting`)
- [x] 2.3 `MyCourses` — empty (`explain`) + `MascotProfileNudge` (một linh vật/trang)
- [x] 2.4 `CartShell` — empty (`explain`)
- [x] 2.5 `CommunityFeed` — empty (`explain`)
- [x] 2.6 `SavedLibrary` — gate khách (`greeting`) + empty theo tab (`explain`)
- [x] 2.7 `SearchResults` — không kết quả (`point`)

## 3. A11y & i18n & verify
- [x] 3.1 Linh vật `aria-hidden`; copy trong bong bóng `aria-live`; reduced-motion tắt nhún
- [x] 3.2 i18n vi/en cho mọi copy moment (celebration/nudge/empty-state)
- [x] 3.3 tsc/eslint/build xanh; test `GamificationEventHost` (level-up) + celebration/nudge; `openspec validate mascot-moments` PASS
</content>
