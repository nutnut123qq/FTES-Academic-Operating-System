# PLAN — Refactor toàn bộ "Learn" `layouts/` → `features/` (strict 4-tầng) + tách user-global domain  (2026-06-18)

> KHÔNG code (brainstorm). ~170 file: `layouts/learn/**` (139) + `layouts/headhunting/**` (12) + `features/profile/CV` (6) +
> `features/practice` (5) + rails. Mục tiêu: dời HẾT khỏi `layouts/` (LEGACY) sang `features/**` đúng rule (main.md §2/§3/§4/§5/§7),
> trích phần tái dùng → `blocks/`, ĐỒNG THỜI sửa IA: domain **user-global** không nên nằm trong shell **per-course** của Learn.

## 0. Nguyên tắc rule (target, từ main.md)
- **Feature CHỈ ghép + đọc store/SWR; KHÔNG style** (className chỉ placement). **Block OWN style, props-only.**
- Mọi `*Props extends WithClassNames`; container đọc store/SWR/`useParams`, KHÔNG nhận data/callback/id props (trừ list-item/block).
- Mọi fetch bọc `AsyncContent` (+ skeleton mirror). Text = `Typography`; icon = phosphor `*Icon` / brand `react-icons/fa6` (**bỏ @gravity-ui**). Spacing 0/2/3/4/6 (**bỏ gap-1.5**). 1 folder = 1 component.
- Exemplar copy: `features/dashboard/index.tsx` (2-cột shell + lazy tab), `features/profile/PublicProfile` (orchestrator mỏng + sub tự fetch), `blocks/cards/LabeledCard`, `blocks/navigation/CollapsibleSidebar`+`SidebarNavItem`, `blocks/async/AsyncContent`.
- Áp draft `migrate-whole-domain-out-of-legacy` (đụng 1 route → migrate cả domain) + `reusable-composite-to-block` + `page-max-width-container`.

## 1. IA — phân loại scope (gốc của "tách CV ra")
| Surface (sidebar) | Scope (BE thật) | Quyết định |
|---|---|---|
| Content/lesson · Challenge · Mind-map · Flashcards · Personal-project/milestones · Leaderboard · AI-Lab playground | **course-scoped** | **GIỮ trong Learn** (per-course shell) |
| **CV** (`cvUrl`/`userCvSubmissionAttempts` — 1 CV/user) | **user-global** | **TÁCH khỏi Learn** → `features/profile/CV` (đã ở đó!) host ở Profile/route riêng; bỏ khỏi sidebar Learn |
| **Headhunting** (companies/consultants global) | **user-global** | **TÁCH** → `features/careers/Headhunting` (area riêng) |
| **Coding Practice** (problems global, progress per-user) | **user-global** | **TÁCH** → `features/practice` (đã ở đó) area `/practice` riêng |
| **Foundations** (reference global, no enroll) | **user-global** | TÁCH → `features/foundations` (truy cập từ Learn vẫn được, nhưng là area global) |
| **StarCi AI** (credit/model/BYOK = global; chỉ playground course-scoped) | **lai** | Catalog model/credit/settings → `features/ai` global; playground giữ trong lesson |

→ **CV là cái thầy chỉ định tách trước.** CV thật ra ĐÃ nằm `features/profile/CV` — chỉ cần: (a) bỏ item "CV" khỏi sidebar Learn (`useSidebarNavItems`), (b) host CV ở route user-level (`/profile/cv` hoặc tab Profile), (c) repoint link. Headhunting/Practice/Foundations/AI tách sau cùng logic.

## 2. Hướng + CHỐT
- **H1 (CHỐT) — Migrate-in-place sang features + tách user-global, THEO PHA.** Mỗi unit Learn → `features/learn/<X>` (course-scoped) hoặc `features/<domain>` (global); trích block; strict rule; xoá legacy sau khi repoint. Phân pha theo rủi ro.
- **H2 — chỉ migrate features, giữ mọi thứ trong Learn.** Ít xáo trộn IA nhưng để CV/Headhunting/Practice (global) kẹt trong shell per-course (load theo courseId dù global) → bỏ lỡ đúng cái thầy muốn sửa → loại.
- **H3 — big-bang rewrite 170 file.** Quá rủi ro (socket challenge/CV/task, mind-map canvas, premium gate) → loại.

## 3. Bản đồ migrate (layouts → features) + block trích ra
**SHELL (làm TRƯỚC — mọi thứ phụ thuộc):**
- `layouts/learn/{layout, Sidebar, LearnMobileBar, LearnPanelToggles}` → **`features/learn/LearnShell`** (reuse blocks `CollapsibleSidebar`/`SidebarNavItem`/`SidebarNavGroup`; nav items hook giữ trong feature).
- `ModuleSidebar` / `MilestoneSidebar` (rail) → `features/learn/ModuleOutline` / `features/learn/MilestoneOutline`; trích **block `OutlineAccordion` + `OutlineRow`** (ModuleContentRow/MilestoneTaskRow chung pattern) + `IndexStrip` block.

**COURSE-SCOPED → `features/learn/`:**
- `Content/**` (+ ContentHeader/TabBar/Paywall/tab bodies) → **`features/learn/LessonReader`** (tabs ExtendedTabs; ContentBody/CodeExplaining/CodeImpl/Sandbox/Challenge-grid/AiLab là sub). `AiLabBody` → tách **`features/learn/AiLab`**.
- `Module/` (overview) → `features/learn/ModuleOverview`; ContentCard → block `LessonCard`.
- `Challenge/**` (ChallengePage/View/SubmissionPanel) → `features/learn/Challenge`; **block `AttemptList`+`AttemptRow`** (dùng chung Challenge/CV/Task attempts).
- `mind-map/**` → `features/learn/MindMap` (canvas giữ nguyên engine, chỉ chuyển tầng + state).
- `Task/` + `MilestoneSidebar` + `PersonalProjectSubmission` → `features/learn/PersonalProject`.
- `Flashcard/**` → `features/learn/Flashcards`.
- `Leaderboard/**` → `features/learn/Leaderboard` (podium/table/MyRankCard/XpBreakdown — nhiều cái thành block stats).

**USER-GLOBAL → tách ra `features/<domain>`:**
- **CV**: `features/profile/CV` (giữ) → bỏ khỏi sidebar Learn, route `/profile/cv`. ← **pha sớm (thầy yêu cầu)**.
- Headhunting: `layouts/headhunting/**` → `features/careers/Headhunting` (ConsultantCard/CompanyProfile thành block).
- Practice: `features/practice` (giữ) + gỡ `layouts/learn/Practice/PracticeProblem` (repoint).
- Foundations: `Foundations/**` → `features/foundations`.
- StarciAi catalog/credit → `features/ai` (đồng bộ rule credit-unified-pool).

## 4. Phân pha (mỗi pha tsc/eslint sạch, repoint + xoá legacy ngay)
- **P0 — Shell + blocks nền + tách CV.** LearnShell (sidebar/mobile/toggles) → features; trích các block dùng-nhiều (OutlineAccordion/Row, AttemptList/Row, LessonCard); **bỏ CV khỏi sidebar + route `/profile/cv`**. (Ít rủi ro, mở đường.)
- **P1 — Leaf trình-bày (smell thấp).** Leaderboard, Foundations(+tách global), Module overview, Headhunting(+tách). Chủ yếu presentational → nhanh.
- **P2 — Heavy course-scoped.** LessonReader (+AiLab), Challenge, PersonalProject, Flashcards, MindMap. Đụng socket/redux/canvas → cẩn thận, test tsc kỹ.
- **P3 — Dọn + tách nốt global.** Practice/StarciAi/AI-credit; xoá sạch `layouts/learn` + `layouts/headhunting`; gỡ dead (`Learn/index.tsx`, `UserCvSubmissionAttempts` orphan, `TalentDirectory`, `FoundationContentPanel`); rà spacing/icon/Typography toàn bộ.

## 5. Checklist mỗi unit khi /ux-apply
AsyncContent mọi fetch · `*Props extends WithClassNames` · feature không style (placement-only) · style→block · Typography + phosphor/fa6 (bỏ @gravity-ui) · spacing 0/2/3/4/6 · folder=tên · overlay state qua store (không useState) · repoint importer + **xoá folder legacy** + tsc/eslint sạch.

## 6. Rủi ro / đừng-vỡ
- Socket verdict (challenge/CV/task/coding) + premium gate + mind-map canvas + Sandpack iframe — chuyển tầng KHÔNG đổi logic data/socket.
- 170 file → **làm theo pha, KHÔNG big-bang**; mỗi pha 1 PR/commit, tsc/eslint sạch.
- Trùng tên `ContentDetail` (public article, KHÔNG thuộc Learn sidebar) — để riêng, đừng gộp.
- BE: không cần field mới cho refactor; chỉ IA route đổi (CV `/profile/cv`, Headhunting/Practice area riêng).

→ Thầy duyệt H1 + thứ tự pha (đề xuất bắt đầu **P0**: tách CV + LearnShell). `/ux-apply` từng pha. Feedback → `.claude/rules/drafts/`.

> **CHỐT 2026-06-18: H1, bắt đầu P0.** /ux-apply P0 gồm:
> 1. **Tách CV**: bỏ item `cv` khỏi `Sidebar/useSidebarNavItems`; host CV (`features/profile/CV`) ở route user-level
>    `/profile/cv` (settings/profile); repoint mọi link CV về route mới; gỡ route `/learn/cv` (hoặc redirect).
> 2. **LearnShell → features**: `layouts/learn/{layout helpers, Sidebar, LearnMobileBar, LearnPanelToggles}` →
>    `features/learn/LearnShell`, reuse blocks `CollapsibleSidebar`/`SidebarNavItem`/`SidebarNavGroup`; nav-items hook trong feature.
> 3. **Trích block nền** dùng-nhiều: `OutlineAccordion`+`OutlineRow` (module/milestone rail), `AttemptList`+`AttemptRow`
>    (challenge/cv/task), `LessonCard`. Mỗi cái props-only, own style.
> tsc/eslint sạch sau P0; repoint + xoá legacy đã chuyển; KHÔNG đụng P1-P3.
