# UX-BRAINSTORM — Trang giải Challenge (`ChallengeView`) (2026-06-21)

> KHÔNG code — brainstorm + chốt hướng. Trang đích: **challenge solve**
> `/learn/content/modules/<m>/contents/<c>/challenges/<id>` → `Challenge/ChallengePage` → `ChallengeView`.
> Legacy = inventory. Tư duy từ `main.md` §1 + ui-ux-pro-max + ref (Exercism · GitHub Classroom autograding ·
> AI-feedback patterns · **trang Dự án cá nhân của chính StarCi**).

## 0. TL;DR
- Trang đã full-bleed (bỏ rail) nhưng vẫn là **ChallengeView legacy** ("modal refugee"): viền/divider mọi section,
  spacer tay `h-2/3/4`, cột trái TRỘN đọc-đề + nộp-bài, tabs lang lạc chỗ.
- **Đây KHÔNG phải IDE code** — là vòng **đọc đề → nộp repo GitHub → AI chấm → học từ feedback**. Cùng job với
  **trang Dự án cá nhân** (đọc brief trái + panel nộp repo sticky phải). → challenge nên mirror pattern đó.
- **Goldmine bỏ phí (BE đã có):** `feedbacks[]` mỗi attempt (`message·detail·severity(low/med/high)·location·suggestion`),
  lịch sử `attempts[]` (`score·shortFeedback·processedAt·numAttempts`), `hint`. Legacy chỉ hiện **1 chip pass/fail +
  điểm tổng** → mất hẳn phần "học từ feedback" = giá trị cốt lõi của AI chấm.
- **CHỐT đề xuất: Hướng A — Workspace** (brief trái + panel Nộp+Kết quả+Feedback sticky phải).

## 1. Khoanh vùng (route + component)
- `ChallengePage` (`Challenge/ChallengePage`): full-height host + nút "← Quay lại bài học" (`onBack`) → render `ChallengeView`.
- `ChallengeView` (`Challenge/ChallengeView`): header (title + chip score/difficulty) → grid `lg:grid-cols-5`:
  - trái `col-span-2`: lang tabs · Score (`Score`) · Prerequisites · Requirements (title+score+body) · Outputs ·
    **`ChallengeSubmissionPanel`** (nộp).
  - phải `col-span-3`: Steps accordion (mở sẵn hết).
- Layout learn: challenge route giờ `fullBleed`, bỏ leftRail/rightRail (đã làm).

## 2. Dữ liệu THẬT (grounded — Explore BE + FE)
### Đang dùng
- `challenge{title,score,difficulty,description}` · `requirements[].langs[]{title,body,score}` · `steps[].langs[]{title,body}`
  · `outputs[].langs[]{text}` · `prerequisites[].langs[]{text}` · `langs[]` (TS/Java/C#/Go).
- Nộp: `ChallengeSubmissionPanel` → `SubmissionRow` (repo URL input + `GradeModelDropdown` lane/model + Submit +
  socket job live `AIProcessingText`) · `submitChallengeSubmission(challengeSubmissionId, githubUrl, lang, mode, model…)`
  → `jobId`. Kết quả: `LastAttemptResult` = chip pass/fail + `{earned}/{max}`.
- Progress: `completionTasks` (`lastScore·maxScore·status·numAttempts`). `Score` (current/max/threshold, tone theo %).

### CÓ nhưng FE CHƯA xài = cơ hội ⭐
| Field BE | Dùng cho |
|---|---|
| **`attempt.feedbacks[]`** `{message,detail,severity,location,suggestion,orderIndex}` | **Khối feedback có cấu trúc** (dot severity + message + location link + suggestion) — chính cái user học được |
| **`userSubmission.attempts[]`** `{attemptNumber,score,shortFeedback,processedAt}` + `numAttempts` | **Lịch sử nộp** (timeline điểm qua các lần) |
| **`challenge.hint`** (markdown) | nút/disclosure "Gợi ý" |
| `submission.{approachScore,outcomeScore}` (70/30) | breakdown điểm approach vs outcome |

### Internal (KHÔNG lộ): `approach/outcomeCriteria`, anti-cheat ip/ua/fingerprint, idempotencyKey → đừng vẽ UI.

## 3. Điểm đau legacy (ui-ux-pro-max §6 hierarchy; vanity/clarity)
1. **Modal refugee**: `border-t/b border-divider` mọi section + `border-l` chia cột → "kẻ sọc" nặng.
2. **Spacer tay loạn nhịp**: `h-2`(8)/`h-3`(12)/`h-4`(16) rải rác thay vì gap nhất quán.
3. **Trộn ĐỌC + LÀM 1 cột**: prerequisites/requirements/outputs (đọc) + submit panel (làm) chung col trái → căng.
4. **Typography thủ công**: `font-semibold text-foreground` lặp lại thay Typography variant.
5. **Grid 5 cột 2/3 khó hiểu** + mobile tab switch như chắp vá.
6. **Feedback/lịch sử/hint VÔ HÌNH** dù BE giàu — mất giá trị "AI chấm để học".

## 4. Hướng + CHỐT
### Hướng A — Workspace (brief trái + panel Nộp+Kết quả sticky phải) ✅ ĐỀ XUẤT
- Header gọn phẳng: title + chip điểm/độ khó + chip trạng thái. 1 hàng lang tabs (global).
- **TRÁI (đọc, cột rộng `max-w` + scroll):** brief = Yêu cầu (mỗi req có điểm) · Hướng dẫn từng bước (accordion) ·
  Kết quả mong đợi · Điều kiện · Gợi ý (hint). Section sạch: whitespace + Typography, KHÔNG viền dày.
- **PHẢI (làm+kết quả, panel sticky ~360px):** `ChallengeSubmissionPanel` (repo URL + grader + Submit) TRÊN, rồi
  **Kết quả**: score ring vs threshold + chip Đạt/Trượt + **feedback list** (severity dot · message · location · suggestion)
  + "Xem N lần nộp" (lịch sử).
- ✅ Đồng bộ **Dự án cá nhân** (đọc brief trái + submit panel sticky phải — cùng job nộp-repo-AI-chấm); tách rõ đọc/làm;
  LỘ feedback (data win lớn nhất); hết viền dày.
- ⚠️ Steps chuyển vào cột trái (accordion) thay vì cột phải. Panel phải cần bọc state (live job giữ nguyên).
- Ref: Exercism (đọc đề + iterate + mentor feedback) · GitHub Classroom autograding (nộp repo → checks + feedback) ·
  AI-feedback patterns (severity + suggestion) · **PersonalProjectWorkspace** (in-app, thầy đã duyệt).

### Hướng C — Tabbed (Đề bài / Nộp & Kết quả / Hướng dẫn)
- Tabs trên đầu, mỗi lúc 1 việc. ✅ Tập trung. ❌ Phải đổi tab "đề"↔"nộp" khi đang làm → kém tiện màn rộng.

### (Hướng B — 1 cột dọc submit inline: đơn giản nhưng phí bề ngang — loại.)

## 5. Section → dữ liệu (hướng A)
| Vùng | Hiển thị | Nguồn BE |
|---|---|---|
| Header | title · chip score · difficulty · status | `challenge` + `completionTasks.status` |
| Lang tabs | TS/Java/C#/Go | `langs[]` |
| Brief trái | Yêu cầu(+điểm) · Hướng dẫn(accordion) · Output · Điều kiện · Gợi ý | `requirements/steps/outputs/prerequisites/hint` |
| Panel phải — Nộp | repo URL · grader lane/model · Submit · live job | `ChallengeSubmissionPanel` + `submitChallengeSubmission` |
| Panel phải — Kết quả | score ring vs threshold · Đạt/Trượt · **feedback list** · lịch sử | `Score` + `attempt.feedbacks[]` + `attempts[]` |

## 6. States / a11y
- Loading: skeleton mirror (brief sections + panel). Empty: chưa có submission → panel ẩn/CTA. Live job: `AIProcessingText` giữ.
- Feedback severity = dot màu semantic (low/med/high) + `aria-label`; location = link tới file (text). Score ring có text thay thế.
- KHÔNG cần field BE mới (feedbacks/attempts/hint đã có). Tái dùng `ChallengeSubmissionPanel`, chỉ thêm khối Feedback + History.

→ Thầy chọn A/C → `/starci-fe-ux-apply`.

## ĐÃ ÁP DỤNG 2026-06-21 (Hướng A)
- `ChallengeView`: dựng lại thành workspace — header phẳng (title + chip score/độ khó/**trạng thái**) + 1 hàng
  **lang tabs global**; 2 cột: TRÁI = brief (Điều kiện · Yêu cầu(+điểm) · Các bước accordion · Output · **Gợi ý**
  disclosure) section sạch (gap-6, bỏ border-per-section + spacer tay); PHẢI = `lg:w-[420px]` "Kết quả của bạn"
  (`Score`) + `ChallengeSubmissionPanel`. Mỗi cột tự scroll; mobile fold thành switch Đề bài/Nộp bài.
- `LastAttemptResult`: **lộ feedback** — render `lastAttempt.feedbacks[]` (dot severity high=danger/med=warning/
  low=info + message + `location` mono + `suggestion`), heading `challenge.lastFeedback`. `SubmissionRow` truyền
  `feedbacks` xuống.
- i18n thêm `challenge.hint`, `challenge.tabs.brief` (vi+en). KHÔNG đụng orchestration của panel (formik/socket/SWR).
- Verify: tsc + lint sạch (lỗi `.next/types` generated + `MindMap/*` ngoài phạm vi).

## RETHINK 2026-06-21 (Hướng A bị bác — cột-đôi tạo khoảng chết)
- **Sự cố:** Hướng A (brief trái + panel phải) thực tế XẤU HƠN: brief cap `max-w-3xl` **căn trái** trong cột flex-1
  → khoảng trống chết khổng lồ giữa brief và panel; panel 420px quá rộng cho mỗi URL+nút; panel rỗng phần dưới khi
  brief dài. Thầy: *"như này còn tệ hơn"*.
- **Insight gốc (deep-think):** trang = **đọc spec DÀI + nộp 1 URL** (KHÔNG editor in-app). Luồng tuần tự: đọc →
  build offline → quay lại nộp → đọc feedback → sửa. 2 chế độ hiếm khi cần CÙNG LÚC → **cột-đôi cố định = sai mô
  hình** (vanity dead-space). Ref THẬT cùng job: **Frontend Mentor** KHÔNG đặt submit cạnh brief — **tách tab**
  "Challenge" / "Submit solution" + AI feedback mỗi lần nộp.
- **3 hướng mới (đều bỏ cột-đôi, đọc-trước):**
  - **H1 — Tabbed (Đề bài / Nộp bài & Kết quả)** ✅ ĐỀ XUẤT: 2 tab, mỗi mode full chiều rộng căn giữa. Tab "Nộp" gom
    form + score ring + feedback (severity·location·suggestion) + lịch sử. Pattern Frontend Mentor; zero gap; khớp luồng.
  - **H2 — Đọc-hero + thẻ nộp slim sticky (~300px), cả cụm `max-w` + `mx-auto`** (căn giữa viewport → hết gap).
  - **H3 — Đọc full + Sheet/Drawer "Nộp bài"** (submit on-demand; sheet che brief khi mở).
- **Chung mọi hướng:** brief về **căn giữa `max-w-3xl mx-auto`** (sửa wall-of-text căn lệch) + giữ feedback đã thêm
  ở `LastAttemptResult`. Ref: [Frontend Mentor](https://www.frontendmentor.io/) (tab Challenge/Submit + AI feedback).
- Chờ thầy chọn H1/H2/H3 → apply.

## ĐÃ ÁP DỤNG 2026-06-21 (H1 — Tabbed, GIỮ sidebar)
- Thầy chốt **H1** + *"giữ cái sidebar"*. Vì tabbed = 1 cột nên KHÔNG cần full-bleed nữa → trả lại **ContentMap rail**
  (cây nội dung) cho challenge; chỉ bỏ on-this-page (challenge không có TOC).
- `layout.tsx`: bỏ `isChallenge` khỏi `leftRail`/`fullBleed`; giữ `(isModules && !isChallenge)` cho rightRail.
- `ChallengePage`: bỏ layout fixed-height 2-scroll; thành **cột đọc căn giữa `max-w-3xl mx-auto`** (như lesson reader)
  + link "← Quay lại bài học" trên đầu.
- `ChallengeView`: viết lại thành **1 cột tabbed** — header (title+chip) → lang tabs global → **tab Đề bài / Nộp bài &
  Kết quả**. Tab "Đề bài" = brief sections sạch; tab "Nộp bài & Kết quả" = `Score` + `ChallengeSubmissionPanel` (bọc
  card) + feedback (đã có ở `LastAttemptResult`). Bỏ DragScrollArea/2-cột → hết khoảng chết; page tự scroll.
- i18n thêm `challenge.tabs.submit`. Verify tsc + lint sạch (lỗi `.next/types` generated + `MindMap/*` ngoài phạm vi).

## DỌN HEADER 2026-06-21 (thầy: "rối quá, quay lại bài học nằm trên") — Hướng A
- Gốc: top 6 hàng — breadcrumb (layout `content/modules/layout`, dừng "Học phần") + back-link + title + chips + lang
  tabs + tab Đề/Nộp. Breadcrumb generic + back-link = **2 nav chồng**; 2 hàng tab tách.
- Sửa (→ còn 3 hàng): `content/modules/layout` **bỏ breadcrumb khi `segments.includes("challenges")`** (leaf dùng
  back-link riêng); `ChallengeView` **gộp tab chính + ngôn ngữ về 1 toolbar** (`flex justify-between border-b`: Đề
  bài/Nộp bài TRÁI · lang PHẢI — pattern TabsCard lesson reader). Back-link "Quay lại bài học" giữ.
- Nguyên tắc rút ra → draft [[leaf-page-one-nav-and-combined-tab-toolbar]].

## RETHINK 2026-06-21 (v2) — Mirror trang TASK Dự án cá nhân (thầy chỉ hình)
- Thầy đưa screenshot **trang task Dự án cá nhân** (`personal-project/tasks/<id>`): rail trái (cây) + brief giữa
  CĂN GIỮA + **aside phải 2 CARD** (`LabeledCard "Github dự án"`: URL + ⚙ cài đặt chấm điểm + nút Đánh giá · card
  "Kết quả chấm điểm": 10/20 + feedback AI). Bảo *"render cho challenge y vậy"*. Đây là Hướng A ĐÚNG EXECUTION (cái
  tôi làm hỏng: brief căn trái + panel full-height).
- **Challenge ≡ task (cùng job nộp-repo + AI chấm)** → mirror 1:1. Tái dùng `TaskSubmissionPanel`/`TaskResults`
  pattern + `LabeledCard`. Map: rail = `ContentMap`; giữa (mx-auto) = back-link + title + chip + lang tabs + brief
  (Yêu cầu/Bước/Output/Gợi ý); phải = card "Nộp bài" (`ChallengeSubmissionPanel` URL+grader+submit) + card "Kết quả
  chấm điểm" (`Score` + `LastAttemptResult` feedback).
- **Khác Hướng A (hết dead-space):** brief `max-w-3xl mx-auto` (KHÔNG căn trái); panel phải = CARD ~360px sticky
  (KHÔNG cột full-height border-l); page tự scroll (KHÔNG fixed 100dvh 2-scroll); **bỏ tab Đề/Nộp** (cả 2 cùng hiện).
- → Thay thế H1 tabbed. Chờ thầy duyệt → apply.

## ĐÃ ÁP DỤNG 2026-06-21 (mirror task page — thầy "chốt đi")
- `ChallengePage`: bỏ wrapper max-w + back-link; chỉ `<ChallengeView onBack={onBack} />` (ChallengeView own split).
- `ChallengeView`: split workspace như task page — CENTER cột đọc `max-w-3xl mx-auto` (back-link + title + chip +
  brief: Yêu cầu/Bước/Output/Gợi ý) · RIGHT `aside` sticky `xl:w-[360px]` gồm 2 `LabeledCard`: **"Nộp bài"**
  (`ProgrammingLanguageTabs` + `ChallengeSubmissionPanel`) + **"Kết quả của bạn"** (`Score` + ghi chú). Bỏ tab Đề/Nộp.
- **Lang chọn ở CARD NỘP (phải)** — thầy chốt: lang là "cài đặt chấm điểm" nằm bên submit, đồng thời lái brief
  (giống `pickBriefByLang` của task). Bỏ lang tabs khỏi cột giữa.
- Hết dead-space (brief `mx-auto`, panel = card sticky, page tự scroll). Verify tsc + lint sạch.

## TINH CHỈNH 2026-06-21
- **Accordion brief:** "Yêu cầu" · "Các bước" · "Gợi ý" đều `variant="default"` + `bg-default` (đồng nhất accordion
  markdown trang task — copy class từ `MarkdownContent/map.tsx`). Default **GẬP HẾT** (thầy: *"default là không expand
  cái nào"*) — chip điểm vẫn hiện ở header. → draft [[accordion-default-fill-everywhere]].
- **Lang selector → Drawer** (thầy: *"lang mở drawer y chang personal project submission"*): bỏ tabs lang inline
  trong card "Nộp bài"; thay bằng **hàng summary** (`GearSixIcon` + "Ngôn ngữ" + lang hiện tại + caret) mở **Drawer
  phải** chứa `ProgrammingLanguageTabs` — y pattern `TaskSubmissionPanel` + `GithubGradingSettings`. Khác task: drawer
  challenge CHỈ có ngôn ngữ (không branch/token — repo URL per-submission, grader lane ở dropdown của panel).

## RETHINK submission 2026-06-21 — challenge NHIỀU submission
- Vấn đề: 1 challenge có thể có N submission (mỗi cái = deliverable: URL + grader + submit + feedback). "Y chang
  task" (1 form) → stack N form đầy đủ trong aside 360px = dài/lặp/rối. Thầy: *"challenge có nhiều submission, đề
  xuất phương án submission tối ưu UX"*.
- Bản chất: challenge = bộ deliverable cần nộp (mỗi cái nộp URL → AI chấm riêng → cộng điểm). Ref: Gradescope
  (assignment = list item + điểm/trạng thái per-item) · GitHub Classroom autograding checklist.
- **3 hướng:** **A — Accordion deliverables** (mỗi submission = dòng: trạng thái·tên·điểm/đạt; mở 1 cái để nộp+
  feedback; auto-mở cái chưa xong) ✅ ĐỀ XUẤT · **C — Checklist + Drawer nộp** (aside = checklist, bấm Nộp → drawer
  rộng) · **B — master-detail** (list + form cái đang chọn).
- **Chốt đề xuất A**: tối ưu cho N (overview 1 liếc), nhất quán accordion `bg-default` "Yêu cầu/Các bước" + luật
  [[one-progress-bar-at-a-time]], xử lý cả 1 (auto-mở) lẫn N. Apply = restructure `ChallengeSubmissionPanel`:
  `SubmissionRow` bọc trong accordion item, header = trạng thái + "N. title" + chip điểm + "earned/max", panel = form
  hiện tại. Chờ thầy chọn → apply.

## ĐÃ ÁP DỤNG 2026-06-21 (A — accordion deliverables)
- `ChallengeSubmissionPanel`: bọc `rows` trong **1 Accordion `bg-default`** (single-open). Header mỗi item = icon
  trạng thái (done=CheckCircle success · failed=XCircle danger · todo=Circle muted) + "N. title" + (đã thử → `earned/max`
  muted · chưa → chip điểm). `defaultExpandedKeys` = deliverable chưa-đạt đầu tiên (auto-mở cái cần làm).
- `SubmissionRow`: thêm prop `inAccordion` → bỏ `border-b/p-3` + ẩn dòng title (header accordion sở hữu); panel chỉ
  còn mô tả + form (URL/grader/submit) + result/feedback.
- 1 submission → 1 item auto-mở (trông như form cũ); N → checklist gọn. Verify tsc + lint sạch.
