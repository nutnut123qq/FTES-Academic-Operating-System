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
- [ ] `subject-workspace-members` — hàng member (initials avatar + tên + role Chip) + filter role (Button). subjects.members.*
- [ ] `subject-workspace-statistics` — metric cards (completion/active/resources/avg) + list top students. subjects.statistics.*
- [ ] `subject-workspace-ai` — card grid AI tools (Tutor/Summary/Quiz/Flashcards/OCR) + CTA. subjects.aiTools.*
- [ ] `subject-workspace-career` — chips related skills + list related careers + card suggested next subject. subjects.career.*

### §2 Profile (route mới /profile)
- [ ] `profile-shell` — /profile + shell 2-cột (identity card trái + tab sections phải). profile.*
- [ ] `profile-personal` — identity card (avatar initials/cover band/bio/social rows)
- [ ] `profile-academic` — list academic (university/campus/major/semester/GPA)
- [ ] `profile-portfolio` — grid projects + rows github/linkedin/resume/certificates
- [ ] `profile-community` — counts followers/following + list activity timeline
- [ ] `profile-progress` — stat cards XP/Level/Coin/Reputation
- [ ] `profile-public` — /profile/[username] view công khai (read-only)

### §4 Course System (route mới /courses)
- [ ] `course-catalog` — /courses: grid course cards + search + filter chips
- [ ] `course-detail` — /courses/[courseId]: hero + outline sections/lessons + CTA enroll
- [ ] `course-lesson` — /courses/[courseId]/lessons/[lessonId]: video placeholder + docs + prev/next
- [ ] `course-quiz` — trang quiz: list câu hỏi (mock) + submit stub
- [ ] `course-assignments` — list assignments + trạng thái
- [ ] `course-progress` — progress + completion + certificate stub
- [ ] `course-enroll` — trang enroll/checkout stub (summary + CTA)

### §5 Resource Hub (route mới /resources)
- [ ] `resource-hub` — /resources: list + type filter + search (mirror subjects Resources)
- [ ] `resource-collections` — list learning packs (rows + count)
- [ ] `resource-detail` — /resources/[resourceId]: preview box + meta + rating/comment/download
- [ ] `resource-upload` — form upload stub (dropzone giả + fields)
- [ ] `resource-rating` — section rating (sao) + comment list
- [ ] `resource-recommendation` — rail "liên quan" (list)

### §6 Community (route mới /community)
- [ ] `community-shell` — /community: tabs ForYou/Following/Campus/Trending + slot feed
- [ ] `community-feed` — list post rows (author/time/title/snippet/reactions count)
- [ ] `community-post-detail` — /community/[postId]: post + thread comments
- [ ] `community-composer` — form tạo post (textarea + attach chips + submit)
- [ ] `community-trending` — list trending
- [ ] `community-reputation` — hiển thị upvote/downvote/accepted (component)
- [ ] `community-poll` — post kiểu poll (options + %)
- [ ] `community-moderation` — queue report stub (rows + action buttons)

### §7 Groups (route mới /groups)
- [ ] `groups-list` — /groups: grid group cards + filter type (Public/Private/Study/Club/Team)
- [ ] `group-detail-shell` — /groups/[groupId]: shell tabs (feed/discussion/resources/events)
- [ ] `group-feed` — feed nhóm
- [ ] `group-discussion` — list thread thảo luận
- [ ] `group-members` — list member theo role (Owner/Admin/Mod/Member)
- [ ] `group-events` — list sự kiện nhóm
- [ ] `group-management` — join request/invitation/rules/pinned (sections)
- [ ] `group-create` — form tạo nhóm stub
- [ ] `group-challenge` — list challenge nhóm
- [ ] `group-announcement` — list announcement

## Layouts đã chốt (interactive)
- `subject-workspace-shell` → A · sidebar rail (xem `.claude/design/subject-workspace.md`).
- Các mục v3 khác: **default on-canon** (tự chọn theo Build conventions, LOG mỗi lựa chọn).
