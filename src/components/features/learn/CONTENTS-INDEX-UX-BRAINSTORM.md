# UX-BRAINSTORM — "Chỉ mục nội dung" kiểu docs cho khu Learn (2026-06-18)

> KHÔNG code — brainstorm + chốt hướng. MAX effort. Trang đích: **khu đọc nội dung khóa học**
> (`/courses/[courseId]/learn/**`) — đặc biệt phần **content/lesson**. Thầy: *"content page đang thiếu page
> chỉ mục như docs"*.
> Legacy = inventory (CÓ GÌ), KHÔNG phải design authority. Tư duy từ `main.md` §1 + skill `ui-ux-pro-max`.

---

## 0. TL;DR (đọc 30s)
- **Thầy chốt mô hình docs 2 TRỤC (rất quan trọng — sửa IA):**
  - **TRỤC TRÁI = "Content map"** = cây chỉ mục **TOÀN KHÓA** (module → bài), bền vững khi đọc, có tiến độ. (đường đen)
  - **TRỤC PHẢI = "On this page" / tag trong 1 bài** = mục lục **heading BÊN TRONG bài đang đọc** + "Trang này hữu
    ích?" — đúng kiểu Sui docs (`Networks / Nodes / Transactions…`). (khung đỏ)
- **Bug IA hiện tại:** rail PHẢI đang để **cây toàn khóa** (`ModuleOutline`) — tức **content-map bị đặt nhầm sang
  phải**; còn **"on this page" thì THIẾU HẲN**. Hai trục đang bị chập làm một, sai cả vị trí lẫn vai trò.
- **Phát hiện data:** BE **đã có sẵn** query giàu `myCourseOutline` (cây module→lesson→challenge + milestone→task,
  mỗi node kèm `isRead` / `completed` / `minutesRead` / `difficulty` / `isPremium`, **+ `progress.completionPercent`**
  tổng khóa, **+ `currentTask`** = con trỏ "học tiếp gì"). Nhưng Learn **không dùng** — chỉ render trong **Profile ›
  Lịch sử học**. → content-map (trái) lấy thẳng từ đây, hết "mù".
- **Đề xuất chốt: H-C′** — **(1)** chuyển content-map sang **trục TRÁI** (cây toàn khóa, dùng `myCourseOutline`, có
  tick/phút/difficulty/"đang đọc"); **(2)** biến rail PHẢI thành **"On this page"** (heading bài hiện tại + "Trang này
  hữu ích?"); **(3)** thêm **trang Chỉ mục `/learn` root** (course-home) làm landing; **(4)** pager Trước/Sau trong
  reader. Tái dùng render outline đã có ở Profile → ít rủi ro, 1 nguồn data.

---

## 1. Khoanh vùng trang (route + cây component hiện tại)

| Route | Component | Hiển thị / làm được |
|---|---|---|
| `/learn` (root) | **KHÔNG có `page.tsx`** | → hiện không có trang chủ khóa học (404/redirect). **Đây là chỗ trống để đặt chỉ mục.** |
| `/learn/modules` & `/learn/modules/[moduleId]` | `ModuleOverview` | Overview **1 module**: title, mô tả, chip số bài, "path introduction" (preview bullets), grid `ContentCard`. **Không có cái nhìn toàn khóa.** |
| `…/modules/[moduleId]/contents/[contentId]` | `LessonReader` | Trang đọc: header + tab bar (Content / Code / Sandbox / Challenges / AI Lab / E2e) + body cap 1024px + paywall + ads. |
| Layout `learn/layout.tsx` | `LearnShell` + rail phải | Left rail = `LearnSidebar` (9 surface). Right rail = `ModuleOutline` (chỉ trên route `modules`) / `MilestoneOutline` (personal-project). |

**Left rail `LearnSidebar` (`useSidebarNavItems`)** = bộ chuyển *surface* khóa học, KHÔNG phải chỉ mục bài:
mind-map · modules · foundations · headhuntings · flashcards · practice · personal-project · leaderboard · starci-ai.
Item "modules" chỉ trỏ về overview module hiện tại.

**Right rail `ModuleOutline`** = accordion module→contents + `ContentSearch` (autocomplete) + `ModuleIndexStrip`
(thu gọn = cột số trần). Dùng `useQueryModulesSwr` → **0 tiến độ**.

---

## 2. Dữ liệu THẬT khả dụng (grounded)

### 2a. `myCourseOutline` — CÓ SẴN, đang bị bỏ phí ở Learn
`src/modules/api/graphql/queries/types/my-course-outline.ts`:
- `course { id, title, displayId }`
- `modules[] { id, title, orderIndex, isPremium, lessons[] }`
  - `lessons[] { id, displayId, title, minutesRead, difficulty, isPremium, isRead, challenges[] }`
    - `challenges[] { id, title, difficulty, maxScore, status, lastScore, completed }`
- `milestones[] { id, title, orderIndex, tasks[] { id, title, type, maxScore, completed, lastScore } }`
- `progress { lessonsRead, lessonsTotal, challengesCompleted, challengesTotal, tasksCompleted, tasksTotal, completionPercent }`
- `currentTask { kind: lesson|challenge|milestoneTask, id, milestoneId|null }`  ← **"resume" pointer**

### 2b. Phụ trợ
- `courseLearningHistory` (timeline theo ngày: lessonRead / challengePassed / milestonePassed) — đã dùng ở Profile.
- `ModuleEntity` (query `modules`): `sortIndex`, `numContents`, `contentTier`, `previewContents`, `isPremium`.
- `ContentEntity` (reader): `isPremium`, `verified` (schema v2), `isSandbox`, `e2eFlows`, tabs…

### 2c. Field GIÀU đang under-used = cơ hội
`minutesRead` (chưa hiện ở Learn) · `difficulty` lesson/challenge · `completionPercent` · `currentTask` ·
challenge `status`/`lastScore`/`maxScore` · `isRead`. **Tất cả đã có — chỉ thiếu chỗ hiển thị trong Learn.**

### 2d. Block tái dùng sẵn có
`ListRow` · `DifficultyChip` · `StatusChip` · `LabeledCard` · `Accordion` · `AsyncContent` · `EmptyContent` ·
`PressableCard` · `CollapsibleSidebar`/`SidebarNavItem` · `ContentSearch` (đã có ở Learn).

---

## 3. Điểm đau (so chuẩn docs: Docusaurus / GitBook / Mintlify / Stripe)
1. **Không có trang "chỉ mục / course home".** Docs luôn có 1 landing: tổng quan + tiến độ + "đọc tiếp" + cây toàn bộ.
   StarCi thả thẳng người học vào 1 module, không có cái nhìn chim bay. ← **chính cái thầy nói thiếu.**
2. **Cây điều hướng MÙ tiến độ.** BE cho `isRead`/`completed`/`completionPercent`/`currentTask` nhưng rail phải bỏ
   hết → người học không biết "đã học gì / còn gì / đang ở đâu / học tiếp đâu" — đúng job #1 của sidebar docs.
3. **TOC nằm bên PHẢI + thu gọn thành số trần.** Docs để cây bài bên TRÁI, bền vững. Ở đây trái = feature-nav,
   cây bài bị đẩy phải, thu gọn còn `ModuleIndexStrip` = cột số không tiêu đề.
4. **Reader không có "On this page".** Bài markdown dài, không có mục lục heading neo.
5. **Không có pager Trước/Sau bài.** Không đi tuần tự được từ trong reader.
6. **Hai outline trùng, lệch nhau.** Profile render giàu (tick đọc, difficulty, status, điểm); Learn render nghèo.
   Cùng 1 BE, hai cách hiển thị → nợ kỹ thuật + lệch UX.

---

## 3-bis. HAI TRỤC điều hướng (thầy chốt — chuẩn docs)

> Docs (Docusaurus/GitBook/Mintlify/Sui) luôn tách **2 trục** vuông góc nhau. StarCi đang gộp + đặt sai.

| Trục | Là gì | Phạm vi | Vị trí ĐÚNG | Nguồn data | Hiện trạng StarCi |
|---|---|---|---|---|---|
| **Content map** (đen) | cây chỉ mục bài | **toàn khóa** module→bài | **TRÁI**, bền vững khi đọc | `myCourseOutline` (có tiến độ) | đang ở **PHẢI** (`ModuleOutline`) + **mù** (query `modules`) |
| **On this page** (đỏ) | mục lục đề mục | **1 bài đang đọc** (heading H2/H3) | **PHẢI** | parse heading từ markdown body | **CHƯA CÓ** |

**Hệ quả thiết kế:**
- **Trục trái (content map)** = nơi trả lời "khóa này có gì / tôi đang ở đâu / đã học gì". Đặt cố định bên trái, theo
  suốt lúc đọc bài (không phải bấm vào tab "modules" mới thấy). Có tick đã-đọc, phút, difficulty, highlight bài hiện
  tại, "Tiếp tục".
- **Trục phải (on this page)** = neo nhanh trong bài dài (giống ảnh Sui). Cuộn tới đâu highlight heading đó
  (scroll-spy). Dưới cùng = **"Trang này hữu ích? 👍/👎"** (đã có `courseLearningHistory`/feedback infra để nối).
- **Khả thi on-this-page:** body render bằng `react-markdown`, h1/h2/h3 **chưa gắn id** → cần thêm `rehype-slug`
  (hoặc id suy từ text heading) để anchor-scroll. Nhỏ, làm trong `MarkdownContent`. Parse danh sách heading từ
  `activeBody` (đã có sẵn ở `ContentBodyV2`).

---

## 4. Mục tiêu trang (job-to-be-done, ≤30s)
Người học mở khóa → trong 30s phải thấy: **(a)** tôi đã đi được bao nhiêu % · **(b)** bấm 1 nút để **học tiếp đúng
chỗ** · **(c)** toàn bộ lộ trình module→bài, cái nào xong/chưa/khoá, mỗi bài bao phút. **1 primary action = "Tiếp tục".**

---

## 5. Ba hướng + CHỐT

### H-A — "Chỉ thêm 1 trang chỉ mục" (tối giản)
Thêm route `/learn` (hoặc `/learn/contents`) = trang TOC toàn khóa từ `myCourseOutline` (header tiến độ + nút Tiếp tục
+ cây module→bài→challenge có overlay đọc/khó/phút + search). KHÔNG đụng rail/reader.
- ✅ Trả lời thẳng "thiếu page chỉ mục", rủi ro thấp nhất.
- ❌ Vẫn 2 nav rời; rail phải vẫn mù; reader vẫn không pager/position. Lệch outline Profile↔Learn còn đó.

### H-B — "Docs shell thật" (GitBook/Mintlify)
Lật cây bài (myCourseOutline, có tiến độ) thành **nav TRÁI bền vững** xuyên suốt khi đọc; 9 surface gom thành bộ
chuyển phụ (tab trên / cột icon nhỏ). Reader thêm pager Trước/Sau + "On this page". Trang chỉ mục = landing khi chưa
chọn bài.
- ✅ Cảm giác docs đúng nghĩa nhất, 1 nav duy nhất, đã-đọc/đang-đọc rõ ràng.
- ❌ Đại phẫu `LearnShell` + bộ 9-surface + drawer mobile → rủi ro cao. Đè lên đúng lúc đang có `REFACTOR-PLAN`
  (P0 LearnShell). Để là **north-star**, không làm ngay.

### H-C′ — "2 trục đúng chỗ + course-home" ✅ **CHỐT** (cập nhật theo 2-trục thầy chốt)
1. **Content map → TRÁI.** Trên route đọc bài, đặt cây chỉ mục toàn khóa bên trái (sau cột icon 9-surface), dùng
   `myCourseOutline`: tick đã-đọc, `minutesRead`, `DifficultyChip`, highlight bài hiện tại, pin "Tiếp tục" (`currentTask`),
   search (`ContentSearch`). Đây là `ModuleOutline` **đổi vị trí (phải→trái) + đổi data (`modules`→`myCourseOutline`)**.
2. **On this page → PHẢI (mới).** Rail phải = mục lục heading của **bài đang đọc** + scroll-spy + "Trang này hữu ích?"
   — kiểu Sui. Parse heading từ `activeBody`; thêm `rehype-slug` để neo.
3. **TRANG CHỈ MỤC `/learn` root** (course-home, cái thầy xin ban đầu) — landing tổng quan: header tiến độ + "Tiếp tục"
   + cây toàn khóa (cùng block với content-map trái) + capstone. Là đích của item sidebar "Nội dung".
4. **Reader**: pager **Trước/Sau bài** (thứ tự outline) + dòng "Bài N/M • ~k phút" ở `ContentHeader`.
- ✅ ROI cao nhất, rủi ro vừa: **tái dùng** render outline đã chứng minh ở Profile, **1 nguồn data** (Profile/Index/
  content-map) → hết lệch; on-this-page là thêm mới gọn. Đụng vị trí rail trong `LearnShell`/`layout` (trái↔phải) nên
  cần test responsive + drawer mobile.
- ↑ Đây thực chất là bước đệm tiến thẳng tới **H-B** (docs shell): content-map đã sang trái rồi.

---

## 6. Thiết kế trang Chỉ mục (chi tiết — phần lõi của H-C)

**Route:** `/courses/[courseId]/learn` (root, hiện trống) = **"Nội dung khóa học"**. Là đích của item sidebar
"modules" (đổi nhãn → "Nội dung") + nút "Học tiếp" ở course card / dashboard.

**Section → dữ liệu BE:**

| # | Section | Hiển thị | Nguồn (`myCourseOutline`) |
|---|---|---|---|
| 1 | **Header tiến độ** | Vòng % hoàn thành; "đã đọc X/Y bài · challenge A/B · task C/D"; ~phút còn lại (Σ `minutesRead` bài chưa đọc). **Nút primary "Tiếp tục"**. | `progress.*` + `currentTask` |
| 2 | **Cây chỉ mục** (lõi) | Accordion module→bài→challenge: tick đã-đọc / chưa, `DifficultyChip`, `minutesRead`, khoá premium, challenge `StatusChip`+điểm. Bài "đang là currentTask" được highlight. Mỗi bài link vào reader. **Search** (dùng lại `ContentSearch`). Thanh % nhỏ mỗi header module. | `modules[].lessons[].{isRead,difficulty,minutesRead,isPremium}` + `challenges[].{status,lastScore,maxScore,difficulty}` |
| 3 | **Capstone** | Milestone→task: type chip, điểm, tick xong. | `milestones[].tasks[]` |
| 4 (opt) | **Hoạt động gần đây** | timeline ngắn "hôm nay/ tuần này đã đọc gì". | `courseLearningHistory` |

**States (tính từ đầu):** `AsyncContent` skeleton **mirror layout** (header + 3 module × 3 row) · empty = chưa enroll /
chưa có nội dung (CTA về trang khóa) · error + retry (`mutate`). **a11y:** aria-label cho icon tick/khoá, accordion
điều khiển bằng bàn phím, vòng % có text thay thế. **i18n:** mọi copy qua `t()` (đã có namespace
`profileSettings.learning.outline.*` để noi theo / mở rộng sang `learn.contents.*`).

**Tái dùng:** trích cách render ở `profile/.../CourseOutline` thành **block `CourseOutlineTree`** (props-only) để
Profile + trang Chỉ mục + (sau này) rail phải xài chung — đúng luật "reusable-composite-to-block".

---

## 7. Cắt / Gộp / Thêm
- **CHUYỂN:** content-map (cây toàn khóa) từ **rail phải → trục TRÁI**; đổi data `modules` → `myCourseOutline`.
- **THÊM:** rail PHẢI mới **"On this page"** (heading bài + scroll-spy + "Trang này hữu ích?") + `rehype-slug` cho
  `MarkdownContent`; trang `/learn` Chỉ mục; block dùng-chung `CourseOutlineTree`; pager Trước/Sau; dòng "Bài N/M • phút".
- **GỘP:** content-map trái + outline Profile + trang Chỉ mục → **1 block 1 data** (`myCourseOutline`).
- **NÂNG:** `ModuleIndexStrip` (số trần, lúc thu gọn) → chấm tiến độ xong/tổng.
- **CẮT/HẠ ưu tiên:** "path introduction"/`previewContents` ở `ModuleOverview` (vanity, trùng cây) — gập/bỏ; nếu đã có
  content-map trái + trang Chỉ mục thì `ModuleOverview` grid card trùng vai → co lại còn mô tả module.

## 8. Ranh giới / đừng-vỡ
- KHÔNG cần field BE mới — `myCourseOutline` đủ. (`currentTask.kind` đã phân biệt lesson/challenge/milestoneTask để
  build URL "Tiếp tục".)
- Tôn trọng `REFACTOR-PLAN.md` (P0 LearnShell→features): trang Chỉ mục + block tree đặt thẳng trong `features/learn`
  đúng tầng, không đụng đại phẫu shell (để H-B sau).
- Premium gate giữ nguyên ngữ nghĩa (`isPremium` lesson/module = khoá-với-viewer).
- Feature chỉ ghép + đọc SWR/store, KHÔNG style; style nằm trong block; `*Props extends WithClassNames`; spacing
  0/2/3/4/6; icon phosphor/fa6; mọi fetch bọc `AsyncContent`.

→ Feedback bất kỳ lúc nào → trò ghi `.claude/rules/drafts/<temp>.md`.

---

## > CHỐT 2026-06-18 — H-C′, làm trọn bộ (thầy duyệt)
Mô hình docs **3 cột** khi đọc bài: **[icon 9-surface] · [Content map TRÁI] · [Content] · [On this page PHẢI]**.
1. **Content map = TRÁI, LUÔN HIỆN** (docs thật, không phải tab "modules" mới thấy). Cây toàn khóa từ `myCourseOutline`
   (tick đã-đọc · `minutesRead` · `DifficultyChip` · highlight bài hiện tại · pin "Tiếp tục" `currentTask` · search).
   = `ModuleOutline` đổi **phải→trái** + đổi **`modules`→`myCourseOutline`**. Lo **responsive 3 cột** + drawer mobile.
2. **On this page = PHẢI, LÀM LUÔN đợt này.** Heading bài hiện tại + **scroll-spy** + **"Trang này hữu ích? 👍/👎"**
   (kiểu Sui). Thêm `rehype-slug` vào `MarkdownContent`; parse heading list từ `activeBody`.
3. **Trang Chỉ mục `/learn` root** (course-home) + block dùng-chung `CourseOutlineTree`.
4. **Reader**: pager Trước/Sau + dòng "Bài N/M • ~phút".
Rule: feature ghép-only, style→block, `*Props extends WithClassNames`, AsyncContent mọi fetch, spacing 0/2/3/4/6,
icon phosphor/fa6, tsc/eslint sạch. → `/ux-apply` để dựng (đề xuất pha: ① content-map trái + trang Chỉ mục →
② on-this-page + rehype-slug → ③ pager + dòng vị trí).
