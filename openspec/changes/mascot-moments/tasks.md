# Tasks — mascot-moments

> **DEPENDENCY:** cần `onboarding-mascot-guide` cung cấp component `FtesMascot`
> (pose `greeting|explain|point|cheer`, size `sm|md|lg`, idle-motion tắt khi reduced-motion,
> `aria-hidden`, tên `mascot.name`). Build change đó TRƯỚC hoặc build KÈM. Change này KHÔNG định
> nghĩa lại linh vật — chỉ tái dùng.

## 0. Chuẩn bị (dependency & i18n gốc)
- [ ] 0.1 Xác nhận `FtesMascot` + `mascot.name` đã có (từ `onboarding-mascot-guide`); nếu build kèm thì import từ đó
- [ ] 0.2 Khởi tạo namespace i18n `mascot.*` cho moment (vi + en) + seed copy các nhóm bên dưới

## 1. Nhóm A — mascot-empty-states (slot icon, 1 linh vật/trang)
- [ ] 1.1 MyCourses (~52): `icon={<FtesMascot pose="point" size="md" />}` cạnh CTA browse; copy `mascot.empty.myCourses`
- [ ] 1.2 CartShell (~82): pose `point` + CTA `/courses`; copy `mascot.empty.cart`
- [ ] 1.3 CommunityFeed (~187): pose `point`, CHỈ feed chính; copy `mascot.empty.communityFeed`
- [ ] 1.4 QuestBoard empty (~208): pose `explain`; copy `mascot.empty.quests`
- [ ] 1.5 SavedLibrary (~246): pose `point`, 1 linh vật cho tab đang mở; copy `mascot.empty.saved`
- [ ] 1.6 SearchResults (~161): pose `explain`, sau debounce, interpolate `{query}`; copy `mascot.empty.searchNoResults`
- [ ] 1.7 NotificationCenter (~232): pose `explain` size `sm`; copy `mascot.empty.notifications`
- [ ] 1.8 ProfilePersonal Job-readiness (~150, owner): pose `point`; copy `mascot.empty.jobReadiness`. Skills (~156) GIỮ icon thường (chống 2 linh vật)
- [ ] 1.9 ProfilePortfolio (~296/311, owner): pose `point`; sub-empty resume/cert/achievement giữ icon thường; copy `mascot.empty.portfolio`
- [ ] 1.10 CareerCenter (~132 skills = neo): pose `point`; roadmaps(~163)/jobs(~210) icon thường; copy `mascot.empty.career`
- [ ] 1.11 GroupFeed (~164): pose `point`, chỉ feed chính; copy `mascot.empty.groupFeed`
- [ ] 1.12 GroupsList (~67): chưa-vào-nhóm → `point` (`mascot.empty.groups`); do-filter → `explain` (`mascot.empty.groupsFiltered`)
- [ ] 1.13 MarketplaceCatalog (~108): pose `explain` size `sm`, giọng trấn an; copy `mascot.empty.marketplace`
- [ ] 1.14 ActivityTimeline (~88): pose `explain`; copy `mascot.empty.activity`
- [ ] 1.15 CommunitySaved (~155): pose `point` size `sm` (hoặc bỏ nếu trùng CommunityFeed cùng shell); copy `mascot.empty.communitySaved`
- [ ] 1.16 Kiểm: `ProfilePublic` (~98) + mọi sub-empty nhỏ GIỮ icon thường (không rải linh vật)

## 2. Nhóm B — mascot-celebrations (cheer qua GamificationEventHost)
- [ ] 2.1 `GamificationEventHost`: nghe sự kiện quest all-claimed → render `FtesMascot pose="cheer"` (overlay/toast ngắn, non-blocking)
- [ ] 2.2 QuestBoard: phân biệt nhánh all-claimed (cheer) vs empty (explain, §1.4) — KHÔNG lẫn
- [ ] 2.3 Cap 1/ngày: cờ localStorage `ftes:mascot:celebrate:{type}:{yyyy-mm-dd}`; copy `mascot.celebrate.questsAllClaimed`

## 3. Nhóm C — mascot-nudges (cap + dismiss + persist, chống nag)
- [ ] 3.1 Overlay store cho nudge + host đọc store, guard "đang có tour overlay" (nhường tour), không stack (1 nudge/lúc)
- [ ] 3.2 Persist "seen": localStorage `ftes:mascot:nudge:{principal}:{type}` (principal = userId | device uuid) — set khi dismiss / sau khi hiện 1 lần
- [ ] 3.3 Nudge mẫu `completeProfile` (pose `point`) neo ở ProfilePersonal/CareerCenter; copy `mascot.nudge.completeProfile`
- [ ] 3.4 Dismiss bằng × + Esc, non-blocking, copy trong vùng `aria-live`

## 4. Nhóm D — mascot-persona (một linh vật + tên + giọng; guest greeting)
- [ ] 4.1 QuestBoard guest gate (~146): `icon={<FtesMascot pose="greeting" />}`; copy `mascot.persona.guestQuests`
- [ ] 4.2 SavedLibrary guest gate (~201): pose `greeting`; copy `mascot.persona.guestSaved`
- [ ] 4.3 Rà toàn bộ moment: mọi copy xưng bằng `mascot.name`, giọng nhất quán, KHÔNG linh vật biến thể khác

## 5. A11y & guardrail
- [ ] 5.1 Linh vật `aria-hidden` mọi nơi; copy nudge/celebration trong `aria-live="polite"`
- [ ] 5.2 Reduced-motion: tắt idle-motion + bỏ trượt/scale của nudge/celebration
- [ ] 5.3 Guardrail: 1 linh vật/trang (empty), 1 nudge/loại/thiết bị, 1 celebration/loại/ngày, không hiện nudge khi đang tour, không stack

## 6. Verify
- [ ] 6.1 i18n `mascot.*` (empty/celebrate/nudge/persona) đủ vi + en; JSON sạch
- [ ] 6.2 tsc/eslint/`npm run build` (webpack) xanh
- [ ] 6.3 Test: empty state hiện/ẩn theo dữ liệu, 1 linh vật/trang; celebration 1/ngày; nudge cap+dismiss+persist+không-khi-tour; guest greeting; reduced-motion
- [ ] 6.4 `openspec validate mascot-moments --strict` PASS
