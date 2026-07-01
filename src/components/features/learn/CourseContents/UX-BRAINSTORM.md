# UX-BRAINSTORM — Course-home `/learn` = HUB học, không phải "cây thứ 2" (2026-06-21)

> KHÔNG code — brainstorm + chốt hướng. MAX effort. Trang đích: **course-learn-home**
> `/courses/[courseId]/learn` → render `CourseContents/index.tsx`.
> Legacy = inventory (CÓ GÌ), KHÔNG phải design authority. Tư duy từ `main.md` §1 + skill `ui-ux-pro-max`
> + ref sản phẩm thật (Duolingo home redesign, Datacamp XP/streak, LMS dashboard 2025).

---

## 0. TL;DR (đọc 30s)
- **Bug IA gốc:** `/learn` index hiện là **đích của sidebar "Modules"** NHƯNG render lại **nguyên cây
  module→bài→challenge** dạng accordion — TRÙNG vai với **rail trái `ContentMap`** (đã chốt ở
  [CONTENT-MAP-UX-BRAINSTORM] + [CONTENTS-INDEX] = docs 3 cột, cây toàn khóa sống ở rail trái khi đọc bài).
  Cây toàn khóa **đã có nhà** (rail trái + reader). Index không nên là cây thứ 2.
- **Goldmine bị bỏ phí:** BE đã có **streak + 7-ngày** (`myWeeklyStats`), **XP trong khóa** (`userXp`),
  **rank trong khóa** (`leaderboard.myRank`), **badge** (`myAchievements`), **capstone status**
  (`milestoneTaskProgress` + `enrollment.taskPlanStatus`/`personalProjectGithubUrl`), **flashcard due**
  (`flashcardDecksByCourse.dueCount`), **course cover** (`coverImageUrl`). Index hiện KHÔNG xài cái nào.
- **Vanity hiện tại:** panel phải "Challenges by difficulty" (SegmentBar) = **hình dạng tĩnh của khóa**, KHÔNG
  phải tiến độ user → cắt. "Lessons read" vs "Challenges completed" = 2 metric lệch ngữ nghĩa. Capstone **vô
  hình** trên index dù là điểm bán lớn nhất khóa.
- **Chốt hướng: C — "Hub of surfaces + path strip"** ✅: biến `/learn` thành **bệ phóng (launch pad)**:
  (1) header khóa gọn (cover + title + vòng % + **Tiếp tục** = 1 primary action) ·
  (2) **dải "tuần này"** 1 hàng (streak dots · rank · XP — 1 visual, không 3 card) ·
  (3) **"Đi tiếp lộ trình"** = module hiện tại + 2–3 bài kế (KHÔNG cả cây) + link "Xem toàn bộ outline" ·
  (4) **lưới launch card** ra các surface (Capstone, Flashcards-due, Leaderboard-rank, Practice, Foundations,
  Mind-map). Cây sâu vẫn ở rail/reader. Index thôi làm cây → làm hub.

---

## 1. Khoanh vùng trang (route + cây component)

| Route | Component | Hiển thị / làm được |
|---|---|---|
| `/learn` (index, segment = null) | **`CourseContents`** ← *trang đích* | Dashboard 2 cột: TRÁI = continue-hero + search + **accordion module→bài→challenge** (cả cây); PHẢI = MetricCard (lessons/challenges) + ProgressMeter completion + **SegmentBar difficulty (vanity)**. **KHÔNG có rail** (layout chỉ bật rail ở segment `modules`/`personal-project`). |
| `/learn/modules/[moduleId]/contents/[contentId]` | `LessonReader` + **rail `ContentMap`** | Reader docs 3 cột: rail trái = cây toàn khóa (progress-aware) + content + on-this-page phải. **Đây là nơi cây sống.** |
| `/learn/{flashcards,foundations,leaderboard,mind-map,practice,personal-project,headhuntings}` | feature riêng | 7 surface (xem §2c). Sidebar `LearnShell` chuyển giữa chúng. |

**Hệ quả:** index = nội dung CHÍNH khi bấm "Modules", nhưng giá trị thêm của nó so với "mở rail rồi bấm bài"
phải là **hub/engagement/định hướng**, KHÔNG phải vẽ lại cây. Hiện nó vẽ lại cây → trùng + thiếu hub.

---

## 2. Dữ liệu THẬT khả dụng (grounded — từ Explore BE + DB)

### 2a. Đang dùng
- **`myCourseOutline`** (FULLY used): `course{id,title,displayId}` · `modules[].{title,isPremium,lessons[]}` ·
  `lessons[].{title,minutesRead,difficulty,isPremium,isRead,challenges[]}` ·
  `challenges[].{difficulty,maxScore,status,lastScore,completed}` · `milestones[].tasks[]` ·
  **`progress{lessonsRead,lessonsTotal,challengesCompleted,challengesTotal,tasksCompleted,tasksTotal,completionPercent}`**
  · **`currentTask{kind,id,milestoneId}`** (con trỏ "Tiếp tục").

### 2b. CÓ SẴN nhưng index CHƯA dùng = cơ hội (⭐ goldmine)
| Query | Field chính | Dùng cho hub |
|---|---|---|
| **`myWeeklyStats`** | `streak`, `longestStreak`, `xp` (7d), `lessons` (7d), `days[]{date,active}`, `weeklyGoalLessons`, `streakFreezes` | **Dải "tuần này"**: 7 chấm ngày + streak 🔥 + mục tiêu tuần |
| **`userXp`** | `lessonXp`, `challengeXp`, `milestoneXp`, `totalPoints`, `rewardPoints` | XP đã kiếm (tách nguồn) |
| **`leaderboard.myRank`** | `rank`, `totalXp`, `completedChallenges`, `lessonsRead` (course-scoped) | **Rank trong khóa** → card Leaderboard |
| **`myAchievements`** | `data[]{slug,name,iconKey,earned,tierReached,rarityPercent}`, `newAchievements[]` | Strip badge mới đạt (động lực) |
| **`milestoneTaskProgress`** + `courseEnrollmentStatus` | `currentTask`, `completionTasks[]`, `enrollment.{taskPlanStatus,personalProjectGithubUrl,personalProjectGithubTokenLast4}` | **Card Capstone** (X/Y task + "repo ✓") — hiện vô hình |
| **`flashcardDecksByCourse`** | deck[] + `dueCount`, `masteredCount` (runtime per-user) | Card Flashcards "**N thẻ đến hạn**" |
| **`course`** | **`coverImageUrl`** (cột `thumbnail_url`), `description`, `prerequisites` | Cover ở header khóa (hiện không có ảnh) |
| **`courseMindMap`** | nodes/edges | Card Mind-map (preview) |

### 2c. 7 surface khu Learn (đích của launch card)
mind-map · **modules** (= cây/rail) · foundations · flashcards · practice (coding) · **personal-project** (capstone)
· leaderboard. (headhuntings = global, không course-scoped → KHÔNG lên hub này.)

### 2d. Block tái dùng sẵn (4-tier)
`MetricCard` · `ProgressMeter` · `SegmentBar` · `LabeledCard` · `ListRow` · `StatusChip` · `DifficultyChip` ·
`PressableCard` · `MilestoneRoadmap` · `StatPair` · `AsyncContent` · `PageHeader` · `LearnBreadcrumb`.
**Mới cần (block):** `StatStrip` (dải tuần — streak dots + rank + xp), `SurfaceCard` (launch card icon+title+metric),
`StreakDots` (7 chấm), `CapstoneCard` (progress + repo status). Feature chỉ ghép data; style nằm trong block.

---

## 3. Điểm đau trang hiện tại (ref: ui-ux-pro-max §4 primary-action, §6 visual-hierarchy; vanity-engineering)
1. **Cây thứ 2.** Accordion module→bài→challenge **trùng vai rail `ContentMap`** (đã chốt là nơi sống của cây).
   Index tốn 80% chiều dọc vẽ lại cây thay vì làm hub.
2. **Vanity panel phải.** "Challenges by difficulty" = hình dạng tĩnh của khóa (không đổi theo user) → **không
   phải tiến độ**, đặt dưới "Completion" gây hiểu nhầm. Cắt.
3. **Metric lệch ngữ nghĩa.** "Lessons **read**" vs "Challenges **completed**" — 2 trục khác nhau bày như đồng cấp.
   Không metric nào link tới hành động (không filter/jump được).
4. **Capstone vô hình.** Personal-project (điểm bán lớn nhất) không xuất hiện 1 chữ nào trên index. Phải tự mò
   sidebar. `taskPlanStatus`/`personalProjectGithubUrl` đã có sẵn.
5. **0 engagement.** Không streak/rank/XP/badge dù BE giàu (`myWeeklyStats`/`leaderboard`/`userXp`). Ref Duolingo:
   streak + path hiển thị thường trực = +2× daily retention; Datacamp: streak gắn ngưỡng XP/ngày.
6. **Không cover khóa.** `coverImageUrl` có sẵn, header chỉ có chữ → thiếu "sense of place".
7. **Hero CTA chìm.** "Tiếp tục" nằm trong Card xám HeroUI, không nổi như primary action duy nhất.

---

## 4. Mục tiêu trang (job-to-be-done, ≤30s)
Người học mở khóa → 30s thấy **4 câu trả lời**:
- **(a) Tôi đang ở đâu / đi được bao %** → vòng % + dải tuần.
- **(b) Làm gì tiếp** → **1 primary "Tiếp tục"** (currentTask) + lộ trình module hiện tại.
- **(c) Tôi có đang đều đặn không** → streak 7-ngày + rank khóa (động lực, không vanity).
- **(d) Khóa này còn làm được gì** → lưới launch card (capstone/flashcards-due/leaderboard/practice/…).
**1 primary action = "Tiếp tục".** Mọi thứ khác là secondary/launch.

---

## 5. Ba hướng + CHỐT

### H-A — "Vá panel phải" (tối giản, giữ cây)
Giữ nguyên cây accordion làm spine. Chỉ: cắt SegmentBar vanity; gộp 3 metric → 1 vòng % thống nhất
(lessons+challenges+capstone); thêm **card Capstone** + **streak mini** vào cột phải; dedupe.
- ✅ Rủi ro thấp nhất, sửa đúng vanity + lộ capstone.
- ❌ **Vẫn là cây thứ 2** (trùng rail), index vẫn không thành hub; goldmine engagement chỉ chạm 1 phần.
- Ref: Coursera course-home (TOC trái + progress rail phải).

### H-B — "Learner cockpit" (dashboard-first, bỏ hẳn cây khỏi index)
Index = dashboard thuần: hero cover+%+Tiếp tục → hàng card engagement (streak/rank/XP) → "Jump back in"
(1–3 bài kế, KHÔNG cây) → lưới surface. Cây CHỈ ở rail/reader.
- ✅ Hub đúng nghĩa nhất, engagement nổi (Duolingo/Datacamp), hết trùng cây.
- ❌ Đổi hành vi mạnh: mất "xem toàn bộ outline" ngay trên landing → người quen lướt cây hụt; phụ thuộc rail
  để browse sâu (rail chỉ hiện khi vào reader). Nhiều query mới cùng lúc.
- Ref: Duolingo home redesign (single path + stats header thường trực).

### H-C — "Hub of surfaces + path strip" ✅ **CHỐT** (hybrid, ROI cao nhất)
Bệ phóng cân giữa **định hướng (path)** + **bệ phóng (surfaces)** + **động lực (week)**, KHÔNG vẽ lại cả cây:
1. **Header khóa gọn** (tier-2): breadcrumb + (cover thumb tròn/nhỏ) + title H3 + **vòng % hoàn thành** +
   **1 primary "Tiếp tục"** (currentTask → reader/capstone). Title↔desc `gap-2`.
2. **Dải "Tuần này"** (1 hàng, `StatStrip`): 7 chấm ngày (`days[]`) + 🔥`streak` + #`rank` khóa + `xp` 7d.
   **1 visual tiến độ tại 1 chỗ** (ref [[one-progress-bar-at-a-time]]) — KHÔNG dựng 3 thanh.
3. **"Đi tiếp lộ trình"** (primary, cột chính): **chỉ module đang học** (currentTask) — bài hiện tại highlight
   + 2–3 bài kế + challenge của chúng (tick/difficulty/score). Cuối khối: link **"Xem toàn bộ nội dung →"**
   (mở `/learn/modules` / rail). Search ở đây = nhảy nhanh (mở rail/cmd-k), KHÔNG để cả cây bung.
4. **Lưới launch card** (secondary, cột phụ — `SurfaceCard`, mỗi card có 1 metric thật + hover state):
   - **Capstone** — `X/Y task` + chip "repo ✓ / chưa nối" (lộ cái đang vô hình).
   - **Flashcards** — "**N thẻ đến hạn**" (dueCount) — CTA mạnh nhất nếu >0.
   - **Leaderboard** — "**Hạng #rank**" + top-1 name.
   - **Practice** — coding solved.
   - **Foundations** — số category.
   - **Mind-map** — preview/icon.
- ✅ ROI cao + rủi ro vừa: giữ "you are here" (path docs) NHƯNG bỏ trùng cây (chỉ module hiện tại), lộ
  capstone + engagement goldmine, biến index thành hub bổ trợ rail (không cạnh tranh). Tái dùng outline đã có.
- ⚠️ Phải wire thêm vài query (`myWeeklyStats`, `leaderboard`, `flashcardDecksByCourse`, `milestoneTaskProgress`)
  — mỗi card bọc `AsyncContent` riêng (degrade độc lập, card lỗi không sập trang). Lo responsive 1 cột mobile
  (path trên, surfaces dưới). [[interactive-needs-hover]] cho mọi card/row.
- Ref: Duolingo new home (path + stats header) · Datacamp dashboard (continue + daily goal + surfaces) ·
  LMS 2025 (critical data top, jump-to bất kỳ ≤2 click) · Notion/LMS hub cards.

---

## 6. Bản đồ section → dữ liệu (hướng C chốt)

| # | Section | Hiển thị | Nguồn BE | Block |
|---|---|---|---|---|
| 1 | **Header khóa** | breadcrumb · cover thumb · title H3 · vòng % · **Tiếp tục** | `myCourseOutline.progress.completionPercent` + `currentTask` + `course.coverImageUrl` | `PageHeader`/`LearnBreadcrumb` + `ProgressMeter` (ring) |
| 2 | **Dải "Tuần này"** | 7 chấm ngày · 🔥streak · #rank · xp 7d | `myWeeklyStats` + `leaderboard.myRank` | `StatStrip` + `StreakDots` (mới) |
| 3 | **Đi tiếp lộ trình** | module hiện tại: bài highlight + 2–3 bài kế + challenge (tick/difficulty/score) + "Xem toàn bộ →" | `myCourseOutline.modules[ currentModule ]` | `ListRow` + `DifficultyChip` + `StatusChip` |
| 4 | **Capstone card** | X/Y task · chip repo ✓ · next task | `milestoneTaskProgress` + `courseEnrollmentStatus.enrollment` | `CapstoneCard` (mới) / `MilestoneRoadmap` |
| 5 | **Flashcards card** | "N thẻ đến hạn" · mastered | `flashcardDecksByCourse.dueCount/masteredCount` | `SurfaceCard` |
| 6 | **Leaderboard card** | Hạng #rank · top-1 | `leaderboard.myRank` + `entries[0]` | `SurfaceCard` |
| 7 | **Practice / Foundations / Mind-map card** | metric nhẹ + điều hướng | `practiceCatalog` / `foundationCategories` / `courseMindMap` | `SurfaceCard` |

**Field tận dụng mới:** `coverImageUrl` · `streak`/`days[]` · `leaderboard.myRank` · `dueCount` · `taskPlanStatus`
+ `personalProjectGithubUrl` (chip repo) · `userXp`. Đều ĐÃ CÓ ở BE — chỉ thiếu chỗ bày.

---

## 7. Cắt / Gộp / Thêm
- **CẮT:** SegmentBar "Challenges by difficulty" (vanity tĩnh). Accordion **cả cây** trên index (chuyển vai về
  rail) — index chỉ giữ **module hiện tại**. 2 MetricCard rời (lessons/challenges) → gộp vào vòng % + dải tuần.
- **THÊM:** dải "Tuần này" (streak/rank/xp) · **card Capstone** (lộ cái vô hình) · card Flashcards-due ·
  card Leaderboard-rank · cover khóa · lưới launch card. Block mới: `StatStrip`/`StreakDots`/`SurfaceCard`/`CapstoneCard`.
- **GỘP:** "tiến độ khóa" = 1 vòng % thống nhất (lessons+challenges+task) thay 3 metric lệch.
- **NÂNG:** "Tiếp tục" lên primary action thật (nổi, 1 cái duy nhất).

## 8. States / a11y / ranh giới
- **States:** mỗi card/section bọc `AsyncContent` **riêng** → 1 query lỗi (vd leaderboard) không sập cả hub;
  skeleton **mirror layout** (header + strip + path 3 row + 4 surface card). Empty: chưa enroll → CTA về trang khóa;
  streak 0 → "Bắt đầu chuỗi hôm nay". Error + retry (`mutate`).
- **a11y:** icon tick/khoá/streak có `aria-label`; vòng % có text thay thế; mọi card/row interactive có **hover
  state + `cursor-pointer`**, hover kích bằng cả khối (`group`) — ref [[interactive-needs-hover]]; số liệu dùng
  tabular figures.
- **Ranh giới:** KHÔNG cần field BE mới (tất cả query đã tồn tại). Tôn trọng docs 3 cột đã chốt — index **bổ trợ**
  rail, không thay. Feature ghép-only + đọc SWR; style→block; `*Props extends WithClassNames`; spacing 0/2/3/4/6;
  icon phosphor; breadcrumb bắt buộc ([[header-gap2-and-breadcrumb-everywhere]]); title↔desc `gap-2`.

→ Thầy chọn hướng (widget bên dưới) → `/starci-fe-ux-apply` để dựng. Đề xuất pha:
① header + dải tuần + path (myCourseOutline + myWeeklyStats) → ② lưới surface card (capstone/flashcards/leaderboard)
→ ③ cover + badge strip. Feedback bất kỳ lúc nào → ghi `.claude/rules/drafts/<temp>.md`.

---

## > CHỐT 2026-06-21 (thầy duyệt khi apply) — H-C **rút gọn về LÕI THUẦN**
Thầy bác phần "surfaces": *"trang này sao cần leaderboard, leaderboard ở trang khác rồi mà"* → nguyên tắc
[[course-home-no-duplicate-surfaces]]: **course-home KHÔNG lặp surface đã có trang riêng / đã có trong sidebar**,
KHÔNG bê data trang khác (rank…) lên home. Thầy chọn **"không thêm gì (lõi thuần)"**.
- **GIỮ (lõi — là "nhà" của home):** ① breadcrumb + title H3 · ② **1 khối Continue + tiến độ** (primary "Tiếp tục"
  `currentTask` + `ProgressMeter` completion% + 1 dòng đếm `lessons/challenges/tasks` thống nhất) · ③ **cây index**
  module→bài→challenge (module hiện tại mở sẵn) + search.
- **CẮT:** cột phải vanity (2 MetricCard lệch + SegmentBar difficulty) → gộp tiến độ vào header. Bỏ HẲN: dải tuần
  (streak/rank/xp), lưới launch card (capstone/flashcards/leaderboard/practice/mind-map), cover, badge. Bỏ luôn
  hook `useQueryCourseLeaderboardSwr` vừa thêm (dead code) + 3 block dự định (`StatStrip/StreakDots/SurfaceCard`) —
  KHÔNG dựng.
- **Kết quả:** `/learn` = home "tiếp tục học" gọn 1 cột (`max-w-3xl`), không trùng sidebar. Các surface khác vào
  qua sidebar như cũ. Đã dựng trong `CourseContents/index.tsx` + skeleton mirror.

---

## > CHỐT 2026-06-21 (v2) — Workspace dashboard tại `/learn/content` (rail + dashboard)
Thầy đổi hướng: route `/learn` → **`/learn/content`** (segment riêng) + render trang đó thành **dashboard kiểu
workspace** (giống bố cục trang Dự án cá nhân: rail trái + thân dashboard), KHÔNG còn 1-cột-nhúng-cây. Lý do gốc:
cây accordion trong thân = "cây thứ 2" trùng vai rail `ContentMap` của reader. **Đính chính** [[course-home-vertical-rhythm-gap3]]
(bản v1 = continue phẳng 1 cột) cho layout workspace mới.

- **Phân vai rõ (thầy chốt): "personal-project là personal-project, content là content".** KHÔNG clone/đồng bộ
  2 surface; content dashboard chỉ **mượn bố cục** (rail + dashboard), tuyệt đối KHÔNG bê data/khái niệm capstone
  (milestone/task/github) sang. Ref [[course-home-no-duplicate-surfaces]].
- **Đã dựng:**
  1. `learn/layout.tsx`: thêm `isContent = segment === "content"` → `leftRail = <ContentMap/>` (cây nội dung về rail,
     dùng lại đúng rail của reader; storageKey chung `starci.learn.contentMap.width`). rightRail vẫn modules-only.
  2. `CourseContents/index.tsx`: bỏ search + accordion cả-cây. Thân = **dashboard content-scoped**: breadcrumb →
     header (title + desc + meta chương/giờ/học viên) → **continue PHẲNG** (`nextContentTask`, content-first) +
     `ProgressMeter` completion + đếm **bài/challenge** (BỎ tasksStat — capstone không thuộc content) → **region B
     "Đi tiếp lộ trình"** = lessons của **module hiện tại** (highlight bài kế = `activeLessonId`, đọc/chưa-đọc icon,
     difficulty/premium meta), mỗi row → reader. Cây đầy đủ ở rail.
  3. Skeleton mirror cấu trúc mới (header + continue + path rows, KHÔNG search/accordion).
  4. i18n: thêm key `courseContents.keepGoing` (vi "Đi tiếp lộ trình" / en "Keep going").
- **Land thẳng dashboard, KHÔNG auto-forward vào bài.** `/learn/content` không dính `useDefaultRedirect` nên land
  đúng dashboard. (personal-project vẫn bị forward vào task đầu qua `useDefaultRedirect` — để riêng, KHÔNG đụng lần
  này theo yêu cầu thầy; nguyên tắc ghi ở draft [[surface-lands-on-dashboard-no-auto-forward]].)
- **Chưa làm (đề xuất sau, hỏi thầy):** completion% vẫn là equal-weight gồm tasks (BE) — nếu muốn % "thuần nội dung"
  phải sửa BE; rail `ContentMap` mặc định không auto-mở module hiện tại trên trang content (giữ nguyên vì share reader).
- Verify: `tsc`/`eslint` sạch cho file đã sửa (lỗi tsc `MindMap/ModuleNode.pastelBackground` là có sẵn, ngoài phạm vi).
