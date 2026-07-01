# UX-BRAINSTORM — Mind-map (Sơ đồ tư duy) `/learn/mind-map`

> Re-brainstorm 2026-06-21 (Opus, MAX effort). KHÔNG code — chốt hướng rồi `/starci-fe-ux-apply`.

## 0. Vấn đề cốt lõi (tại sao re-brainstorm)
Trang hiện tại là **org-chart trang trí**, không làm được job nào mà sidebar Modules chưa làm:
- **Mù tiến độ.** Nó đọc query PUBLIC `course` (`useQueryCourseSwr`) — chỉ có `title` + `sortIndex`. Không hề biết `isRead`, challenge `status`, `completionPercent`. Node = số + tên, hết.
- **Lặp navigation.** Click module → expand lessons → click lesson → mở `MindMapContentDetailsDrawer` (title + minutesRead + challenge count + description + "Read details"). Đây đúng là cái **Modules content-map** đã làm → vi phạm [[course-home-no-duplicate-surfaces]].
- **Không "you are here", không "việc kế".** Người học mở map ra không biết mình đang ở đâu / làm gì tiếp.

## 1. Job thật của trang map (cái sidebar KHÔNG làm được)
Ref 3 sản phẩm đầu ngành (hội tụ cùng 1 bài học):
- **roadmap.sh** — curriculum = node graph, mỗi node có **status color + Mark-as-done + % done tổng + legend**. → map là thứ để **HÀNH ĐỘNG + nhìn tiến độ**, không chỉ ngắm. (https://roadmap.sh/)
- **Duolingo** — bỏ skill-tree lỏng → **path tuyến tính có hướng** vì tree gây choice-paralysis / không rõ "làm gì tiếp"; data cho thấy linear tăng completion của beginner. (https://blog.duolingo.com/new-duolingo-home-screen-design/)
- **Khan Academy Knowledge Map** — galaxy sao, màu = trình độ. User **mê** cảnh "topic đã chinh phục sáng lên" (tự tin) + thấy rõ mục tiêu kế (định hướng) — nhưng bị gỡ vì nó là **primary nav**, mà linear hợp hơn cho job đó. (https://support.khanacademy.org/hc/en-us/community/posts/360027982751)

→ **Job phòng thủ được của map = ORIENTATION + PROGRESS-AT-A-GLANCE + 1 hành động kế.** KHÔNG phải navigation drawer thứ 2. Giữ sức mạnh riêng của map (nhìn cả 23 module 1 phát = birds-eye) mà sidebar list không cho.

## 2. Ràng buộc dữ liệu (grounded — đừng vẽ field không có)
- **Đổi nguồn data:** `course` (public) → **`myCourseOutline`** (authenticated, `my-course-outline.handler.ts`). Có sẵn:
  - module: `id, title, orderIndex, isPremium, lessons[]`
  - lesson: `id, displayId, title, minutesRead, difficulty, isPremium, **isRead**, challenges[]`
  - challenge: `id, title, difficulty, maxScore, **status** (notStarted|inProgress|failed|completed), lastScore, **completed**`
  - `progress`: `lessonsRead/Total, challengesCompleted/Total, tasksCompleted/Total, **completionPercent**`
  - `**nextContentTask**` (content-first resume: bài chưa đọc đầu → challenge chưa xong → null) + `currentTask`
  - `milestones[].tasks[]` (capstone, có progress)
- **Module progress KHÔNG có sẵn** → tự tính FE: `lessonsRead/total` + `challengesCompleted/total` của module đó. (BE chỉ trả per-lesson/per-challenge.)
- **KHÔNG có graph dependency.** DB không có cạnh prerequisite giữa module/lesson (chỉ là text mô tả). → map vẫn là **cây radial của hierarchy tuyến tính** (course → modules → lessons → challenges), KHÔNG bịa "knowledge graph có ràng buộc".
- **Guest / standalone route** (`/courses/[id]/mind-map`, không auth): `myCourseOutline` cần đăng nhập → degrade về **structure-only** (như hiện tại) + nudge "đăng nhập/ghi danh để theo dõi tiến độ". Đây là exception phải xử lý, không để vỡ.

## 3. Ba hướng (đã vẽ widget cho thầy chọn)
| Hướng | Mô tả | Ref | Trade-off |
|---|---|---|---|
| **A · Living radial map** ⭐ | Giữ graph radial; mỗi node màu theo tiến độ (done/in-progress/not-started/locked); module hiện tại GLOW + path nối; tâm = vòng `completionPercent`; 1 nút **Tiếp tục** bám `nextContentTask` (jump thẳng); click lesson = **navigate thật** (không drawer). | roadmap.sh + Khan | Vẫn là graph (cần đọc layout); nhưng giữ birds-eye + thêm đúng job orientation/progress. |
| **B · Linear journey** | Bỏ graph, 1 cột spine có hướng kiểu Duolingo, current spotlight, locked mờ. | Duolingo | Guided nhất NHƯNG **trùng Modules list** → gần như xoá lý do tồn tại của map. |
| **Baseline · today** | Node phẳng, không tiến độ, click ra drawer. | — | Đẹp nhưng vô-job (đang phải sửa). |

### CHỐT đề xuất: **Hướng A**
Lý do: map chỉ đáng tồn tại nếu làm job mà list không làm = **nhìn cả khóa + thấy mình đã chinh phục tới đâu + đi đâu tiếp**. A giữ birds-eye (sức mạnh riêng của graph) + nâng từ trang trí → **bản đồ sống**, mà KHÔNG biến thành navigation drawer thứ 2 (tôn trọng no-duplicate-surfaces). B đẩy về phía Modules list → tự huỷ. → chờ thầy duyệt A (hoặc đổi).

## 4. IA mới (nếu A được duyệt)
- **Tầng 1 — Breadcrumb** `Home › Courses › <course> › Sơ đồ tư duy` (đang có, giữ; dùng `LearnBreadcrumb`).
- **Canvas (full-bleed, giữ `fullBleed`):**
  - **Tâm** = course node + vòng `completionPercent` (1 thanh/ring tiến độ TỔNG duy nhất — ref [[one-progress-bar-at-a-time]]).
  - **Module node** = `${orderIndex}. ${title}` + trạng thái màu (tính từ lessons/challenges) + mini count `n/m`; module chứa `nextContentTask` = **"you are here"** (viền info + glow + path nối từ tâm).
  - **Lesson node** (khi expand) = `${sortIndex}. ${title}` + ✓ nếu `isRead` + chấm status challenge; **click = điều hướng tới lesson** (auth) / auth-modal (guest). Premium → lock.
- **Floating CTA** (góc, cạnh nút zoom/fullscreen hiện có): **"Tiếp tục học"** bám `nextContentTask`; `null` → "Bạn đã học hết nội dung" + gợi ý capstone (capstone tự resume ở trang Dự án cá nhân — KHÔNG nhảy capstone từ đây, ref [[continue-resumes-content-not-capstone]]).
- **Legend** nhỏ (done/in-progress/not-started/locked/you-are-here) — góc canvas.
- Giữ zoom ±, fit-view, fullscreen, pan (đã có, tốt).

## 5. Section → field BE/DB
| Khối UI | Nguồn (myCourseOutline) |
|---|---|
| Vòng % tâm | `progress.completionPercent` |
| Màu module | suy từ `module.lessons[].isRead` + `lessons[].challenges[].completed` |
| Count `n/m` module | đếm lessons read / total trong module |
| You-are-here + path | module chứa `nextContentTask.id` (kind lesson/challenge) |
| ✓ lesson | `lesson.isRead` |
| Chấm challenge | `challenge.status` / `completed` |
| Lock | `module.isPremium` / `lesson.isPremium` |
| CTA Tiếp tục | `nextContentTask` (jump tới lesson/challenge); `null` → đổi label |
| Difficulty/time (hover) | `lesson.difficulty`, `lesson.minutesRead` |

## 6. States (tính từ đầu)
- **Loading:** skeleton mirror layout radial (đừng nhảy layout) — wrap qua `AsyncContent`.
- **Empty:** course chưa có module → giữ empty box hiện tại ("mind map empty").
- **Error:** thêm retry (hiện chưa có error branch riêng) — `AsyncContent` error=retry.
- **Guest/standalone:** structure-only (không progress) + nudge ghi danh; không gọi `myCourseOutline` khi chưa auth.
- **a11y:** node = `<button>` có `aria-label` (tên + trạng thái + %); cursor-pointer + hover trên CẢ node (ref [[interactive-needs-hover]]); legend đọc được; path là decoration `aria-hidden`.

## 7. Cắt / Thêm
- **CẮT:** `MindMapContentDetailsDrawer` như NAV trung gian (drawer mở rồi mới "Read details" = 2 bước trùng Modules). Hoặc giáng xuống **hover-preview** nhẹ, còn click = đi thẳng.
- **CẮT:** đọc query `course` cho trang này.
- **THÊM:** data `myCourseOutline`; màu trạng thái + you-are-here + vòng % + Continue CTA + legend; navigate thật khi click lesson; error/guest states.

## 8. Việc cần BE (nếu có)
- Không bắt buộc field mới — module progress tự tính FE từ children. **Nếu muốn tối ưu** (tránh tính lại) có thể xin BE thêm `module.lessonsRead/lessonsTotal/challengesCompleted/challengesTotal` vào `myCourseOutline`. Đề xuất, KHÔNG fake — mặc định FE tự tính.

---
**Refs:** roadmap.sh · Duolingo learning path · Khan Academy Knowledge Map (xem links §1). Rules: [[course-home-no-duplicate-surfaces]] · [[continue-resumes-content-not-capstone]] · [[one-progress-bar-at-a-time]] · [[interactive-needs-hover]] · [[three-tier-page-layout]].
