# GitHub team join — non-blocking warning + guided modal (2026-06-25)

> Đổi `GithubTeamGate` từ **modal hard-block** → **warning non-blocking** trên trang learn + **modal hướng dẫn từng bước**, và **chỉ áp cho khóa ĐÃ MUA** (paid). KHÔNG code ở đây.

## Bối cảnh
- File: `src/components/layouts/auth/GithubTeamGate/index.tsx`, mount ở `courses/[courseId]/learn/layout.tsx:168`.
- Data: `myGithubTeamStatus` → `{ linked, githubUsername, teams[] (courseId/slug/title/teamSlug/state: none|pending|active), allInTeam }`.
- BE handler `MyGithubTeamStatusHandler`: lấy MỌI enrollment của user → map course→team (`GITHUB_TEAM_SLUGS_BY_COURSE_SLUG`) → check membership GitHub live.

## Pain (hiện tại)
1. **Hard-block toàn app**: modal non-dismissable (no ESC/outside/close) chặn cả việc ĐỌC bài tới khi vào team → nhốt người học chỉ muốn đọc.
2. **Tính cả trial**: sau migration enrollment-centric, BE lấy mọi enrollment (kể cả trial `is_enrolled=false`) → người HỌC THỬ cũng bị ép vào team GitHub. Sai: team GitHub = đặc quyền PAID.
3. **Hướng dẫn mơ hồ**: `acceptHint` = 1 dòng "open GitHub and accept the invite" — không nói VÀO ĐÂU.

## Yêu cầu thầy
- Team GitHub **chỉ cho paid** (purchase/`is_enrolled=true`); trial không bị gate.
- **Không chặn** trang learn; nhưng **luôn warning** "phải vào team, không thì không truy cập GitHub".
- **Modal có các bước** xác nhận vào team (GitHub > Invitations/Settings).

## Dữ liệu (grounded) + thay đổi BE
| Phần | Field/Change |
|---|---|
| Warning + modal gate | `myGithubTeamStatus.teams[].state` + `linked` + `allInTeam` (đã có) |
| **BE paid-only** | `MyGithubTeamStatusHandler`: `enrollments` where **`isEnrolled: true`** → trial course không sinh team entry → không gate. 1 dòng. |
| Request / recheck | `requestToTeam` mutation (đã có) + `mutate()` recheck (đã có) |

## Hướng (xem widget)
- **A** ✅ — **Banner cảnh báo non-blocking** trên trang learn (HeroUI `Alert` warning: github icon + "Chưa vào team → không truy cập GitHub (challenge/dự án)" + CTA "Vào team ›") + **modal đóng-được** mở từ CTA, có **3 bước đánh số** (Yêu cầu → chấp nhận trên GitHub (email / `github.com/orgs/StarCi-Academy → Invitations`) → "Đã chấp nhận, kiểm tra lại"). Banner ẩn khi `allInCourseTeams`.
- **B** — chỉ 1 chip "Chưa vào team" ở header learn + modal. Nhẹ nhưng cảnh báo + hậu quả dễ bị lướt qua.
- **C** (không vẽ) — warning chỉ ở surface CẦN GitHub (tab Thử thách / Dự án cá nhân) thay vì banner chung. Contextual hơn nhưng thầy muốn "ở trang learn".

### Chốt đề xuất: **A**
- Đúng "không chặn + luôn warning": trang learn dùng được, banner thường trực truyền tải HẬU QUẢ (không truy cập GitHub).
- Modal opt-in (đóng được) gánh hướng dẫn từng bước → giải đúng pain #1 và #3.
- BE paid-only giải pain #2.

## IA mới (A)
1. **Gate trigger**: `authenticated` + có team paid + `!allInCourseTeams` (scope theo `courseSlug` hiện tại như cũ).
2. **Banner** (`Alert` warning, dismiss-per-session? → KHÔNG, luôn hiện tới khi vào team) ở đầu cột learn (trên `LessonReader`/layout content). CTA mở modal.
3. **Modal** (dismissable: X + outside): nếu `!linked` → bước "Link GitHub" trước; nếu linked → list team-state + 3 bước đánh số + nút Request (khi `state=none`) + Recheck + hint chi tiết.
4. **States**: row state none/pending/active (giữ); sending (job realtime, giữ); banner/modal tự ẩn khi active hết.

## Cắt / thêm / i18n
- **Cắt**: `Modal.Backdrop isDismissable={false}` (bỏ hard-block).
- **Thêm**: `Alert` banner (learn layout) + step-list trong modal; mở/đóng state cho modal (từ banner CTA).
- **i18n `githubTeamGate.*` thêm**: `warningTitle`, `warningBody` (banner), `openCta` ("Vào team"), `step1/2/3`, `acceptVia` (`github.com/orgs/StarCi-Academy → Invitations`). Giữ `requestCta`/`recheckCta`/`state.*`.
- **BE**: `MyGithubTeamStatusHandler` filter `isEnrolled: true`.

## CHỐT (thầy duyệt 2026-06-25)
1. **Hướng A** — banner cảnh báo non-blocking trên trang learn + modal đóng-được với 3 bước đánh số.
2. **Banner LUÔN hiện** tới khi vào team (không đóng được; biến mất khi `allInCourseTeams`).
3. Bước 2 ghi rõ: **`github.com/orgs/StarCi-Academy → Invitations`** (+ "hoặc email mời").
4. **BE paid-only**: `MyGithubTeamStatusHandler` filter `isEnrolled: true` (trial không bị gate).
5. Bỏ `Modal.Backdrop isDismissable={false}` (hết hard-block); modal mở từ banner CTA, đóng được.
→ Sẵn sàng `/starci-fe-ux-apply`.

## Modal polish (thầy: "render đẹp hơn, như modal enroll") — CHỐT 2026-06-25
Mirror **PaymentModal** (modal enroll) — grounded từ `components/modals/PaymentModal`:
1. **Header KHÔNG icon** — bỏ `<GithubIcon/>` cạnh title. Header = `<Typography type="body" weight="semibold" className="pr-8">{title}</Typography>` thuần (đúng [[elements/header]] §5: modal header chỉ text, icon nhận diện xuống body). → **update rule** đã ghi.
2. **Identity khóa = `IconTile` cover (flat, không viền)** thay ô bordered "Fullstack Mastery — Not requested". Mẫu PaymentModal summary: `<IconTile size="sm" src={coverImageUrl} icon={<GraduationCapIcon/>}/>` + tên khóa (`Typography body-sm/xs`) + trạng thái team (none/pending/active, tone muted/warning/success). Cover lấy từ `state.course.entity?.coverImageUrl` (gate scope theo course hiện tại).
3. **Steps** giữ 3 bước đánh số nhưng thoáng hơn (gap-14px), buttons trên nền trắng → primary/secondary OK (không cần warning trong modal).
4. **Banner CTA "Vào team" = tông WARNING** (nút nằm trên banner amber → primary hồng chỏi). Button HeroUI KHÔNG có `variant="warning"` (chỉ primary/secondary/tertiary/outline/ghost/danger) → dùng **plain `<button>` + tint** `bg-warning text-warning-foreground rounded-3xl ...` (pattern RatingBar: HeroUI Button unlayered đè utility nên dùng plain button khi cần màu ngoài variant) HOẶC `variant="outline"` + `border-warning text-warning`. Đề xuất plain-button solid warning cho rõ.
→ Apply: sửa `GithubTeamGate` (header bỏ icon + IconTile identity + banner CTA warning) + import IconTile/redux course cover.
