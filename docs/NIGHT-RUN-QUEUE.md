# Night-run queue (v3 — 6h backlog, autonomous default layouts)

Scope: hoàn thiện **§3 Subject Workspace** (5 mảng còn lại) + **§2 Profile** + **§4 Course** +
**§5 Resource Hub** + **§6 Community** + **§7 Groups**. Tất cả greenfield, FE-only, **default on-canon**
(không brainstorm riêng — tự chọn layout hợp lý + LOG). Data mock, không BE.

Loop lấy mục `[ ]` trên cùng → 1 OpenSpec change → build webpack+tsc → xanh thì commit + tick + log.

## Guardrails (v3 — bền hơn cho phiên dài)
- Build ĐỎ → `git restore` item đó → đổi mục thành `[⚠]` (skipped, build failed + lý do 1 dòng) → **SANG mục kế** (không dừng cả loop vì 1 lỗi).
- **DỪNG loop chỉ khi 3 item FAIL LIÊN TIẾP** (dấu hiệu lỗi hệ thống) — hoặc hết mục `[ ]`.
- Thiếu BE → mock + log. KHÔNG push/deploy. Mỗi vòng cập nhật `docs/NIGHT-RUN-2026-07-01.md`.

## Build conventions (mỗi vòng BÁM để tránh build đỏ)
- **Cấu trúc:** feature client `components/features/<domain>/<Name>/index.tsx` + mock hook
  `components/features/<domain>/hooks/useQuery<X>Swr.ts` (dùng `useSWR`, trả shape SWR). Route page mỏng render feature.
- **Chỉ dùng primitive đã xác nhận compile:** `Typography` (type: h4/h5/h6/body/body-sm/body-xs; weight bold/medium; color muted; truncate),
  `Chip` (size="sm" variant="soft" color="accent"), `Button` (size="sm" variant secondary/ghost/tertiary), `cn` — từ `@heroui/react`.
- **Icon: CHỈ tên đã xác nhận:** SquaresFourIcon · BookOpenIcon · FolderIcon · TargetIcon · SparkleIcon ·
  ChatCircleIcon · UsersIcon · ChartBarIcon · BriefcaseIcon (+ SidebarSimpleIcon · MagnifyingGlassIcon) từ `@phosphor-icons/react`.
  Cần icon khác → dùng Chip/text thay vì đoán tên (đoán sai = build đỏ).
- **List = hàng bordered** (`rounded-large border border-separator p-4`), KHÔNG card. **Progress = div bar** (`h-2 rounded-full bg-default/40` + con `bg-accent` width %). Grid card đơn giản khi cần (như Practice).
- **id:** `useParams<{...}>()` (next/navigation). **Điều hướng:** `@/i18n/navigation` (Link/useRouter/usePathname, path KHÔNG kèm locale).
- **i18n:** thêm block namespaced vào `messages/{vi,en}.json` bằng script `JSON.stringify(o,null,4)+"\n"`.
- **Verify:** `node_modules/typescript/bin/tsc --noEmit` (0 lỗi) + `node_modules/.bin/next build --webpack` (Compiled successfully) TRƯỚC commit.
- Sidebar shell dùng lại `CollapsibleSidebar`/`SidebarNavGroup`/`SidebarNavItem` (như Subject shell). Reuse `SubjectTabPlaceholder` pattern cho tab chưa dựng.

---

## Đã xong (v1/v2)
- [x] `subject-workspace-shell` (A · sidebar rail) — commit 6a90441
- [x] `subject-workspace-overview` (hub grid trong shell)
- [x] `subject-workspace-resources` — 78608dc
- [x] `subject-workspace-practice` — ba82c46
- [x] `subject-workspace-learning` — 096c2a5

## Backlog (~50)

### §3 Subject Workspace — 5 mảng còn lại (thay placeholder)
- [x] `subject-workspace-community` — feed post rows + scope filter. ✓ build xanh.
- [x] `subject-workspace-members` — role filter + member rows. ✓ build xanh.
- [x] `subject-workspace-statistics` — metric cards + top students. ✓ build xanh.
- [x] `subject-workspace-ai` — card grid AI tools + CTA. ✓ build xanh.
- [x] `subject-workspace-career` — skills chips + careers list + next-subject card. ✓ build xanh. **§3 TRỌN 9 MẢNG.**

### §2 Profile (route mới /profile)
- [x] `profile-shell` — /profile 2-cột (identity + section tabs) + 5 route. ✓ build xanh.
- [x] `profile-personal` — about + social links rows. ✓ build xanh.
- [x] `profile-academic` — key/value list học vấn. ✓ build xanh.
- [x] `profile-portfolio` — projects grid + certificates. ✓ build xanh.
- [x] `profile-community` — count tiles + activity timeline. ✓ build xanh.
- [x] `profile-progress` — stat cards XP/Level/Coin/Reputation. ✓ build xanh. **§2 Profile TRỌN (shell + 5 section).**
- [x] `profile-public` — /u/[username] view công khai read-only (lệch path để tránh owner-shell). ✓ build xanh.

### §4 Course System (route mới /courses)
- [x] `course-catalog` — /courses: search + level filter + card grid. ✓ build xanh.
- [x] `course-detail` — /courses/[courseId]: hero + outline + enroll CTA. ✓ build xanh.
- [x] `course-lesson` — lesson view: video placeholder + docs + prev/next. ✓ build xanh.
- [x] `course-quiz` — quiz: questions + options + submit/score cục bộ. ✓ build xanh.
- [x] `course-assignments` — assignment rows + status chip. ✓ build xanh.
- [x] `course-progress` — progress bar + completion + certificate stub. ✓ build xanh.
- [x] `course-enroll` — enroll summary + CTA. ✓ build xanh. **§4 Course TRỌN (7 mục).**

### §5 Resource Hub (route mới /resources)
- [x] `resource-hub` — /resources: search + type filter + list. ✓ build xanh.
- [x] `resource-collections` — learning packs list rows. ✓ build xanh.
- [x] `resource-detail` — preview + meta + comments. ✓ build xanh.
- [x] `resource-upload` — dropzone placeholder + fields + submit. ✓ build xanh.
- [x] `resource-rating` — star composer + review list. ✓ build xanh.
- [x] `resource-recommendation` — recommended list rows. ✓ build xanh. **§5 Resource Hub TRỌN (6 mục).**

### §6 Community (route mới /community)
- [x] `community-shell` — /community scope tabs + 4 route. ✓ build xanh.
- [x] `community-feed` — post rows feed (For You). ✓ build xanh.
- [x] `community-post-detail` — post + comments thread. ✓ build xanh.
- [x] `community-composer` — kind chips + title + body + submit. ✓ build xanh.
- [x] `community-trending` — ranked trending list. ✓ build xanh.
- [x] `community-reputation` — contributor leaderboard. ✓ build xanh.
- [x] `community-poll` — poll options + vote + % bars. ✓ build xanh.
- [x] `community-moderation` — report queue + keep/remove. ✓ build xanh. **§6 Community TRỌN (8 mục).**

### §7 Groups (route mới /groups)
- [x] `groups-list` — /groups: type filter + group card grid. ✓ build xanh.
- [x] `group-detail-shell` — /groups/[groupId] header + 5 tab + 5 route. ✓ build xanh.
- [x] `group-feed` — group post rows. ✓ build xanh.
- [x] `group-discussion` — thread rows. ✓ build xanh.
- [x] `group-members` — role filter + member rows. ✓ build xanh.
- [x] `group-events` — event rows + join. ✓ build xanh.
- [x] `group-management` — join requests + rules + pinned. ✓ build xanh.
- [ ] `group-create` — form tạo nhóm stub
- [ ] `group-challenge` — list challenge nhóm
- [ ] `group-announcement` — list announcement

## Layouts đã chốt (interactive)
- `subject-workspace-shell` → A · sidebar rail (xem `.claude/design/subject-workspace.md`).
- Các mục v3 khác: **default on-canon** (tự chọn theo Build conventions, LOG mỗi lựa chọn).
