# LearnLoop section — list trái rút gọn + 4 panel 16:9 bám domain thật

> `/starci-fe-ux-brainstorm` (2026-06-26). KHÔNG code — chốt hướng. Grounded vào UI/domain SẢN PHẨM THẬT (qua
> `.claude/rules` drafts đã rút từ FE), không bịa. Thầy chọn → `/starci-fe-ux-apply`.

## Mục tiêu
Section "Cách học" (LearnLoopScroll): cột phải là 4 panel showcase trong `ShowcaseMockup` (chrome + glow + **16:9**).
Hiện panel quá dài + tự chế (vd capstone vẽ sơ đồ kiến trúc KHÔNG có thật). Yêu cầu:
- **Vùng cam (list trái): rút gọn** — không cầu kì như hiện tại.
- **Vùng đỏ (panel 16:9): render ĐÚNG domain + layout sản phẩm thật**, bản đơn giản, lấp 16:9.

## A. List trái — rút gọn (STRICT)
Bỏ: icon-tile `size-10`, card fill `bg-accent/10` khi active, dòng mô tả `desc` mở ra. Còn lại:
- 1 hàng = **icon nhỏ (`size-4/5`) + nhãn**; active = `text-accent` + **thanh trái 2px** (`border-l-2 border-accent`), done = `CheckCircleIcon` success, chưa tới = muted. KHÔNG nền card, KHÔNG desc (mô tả đã thừa — panel phải đã tự nói).
- Vẫn `ListBox` controlled (scroll lái active + bấm để nhảy) như cũ — chỉ đổi "da" cho gọn.

## B. 4 panel 16:9 — bám UI/domain thật
Mỗi panel = `ShowcaseMockup url=<path thật> aspect="video" tilt="none" backdrop="glow"`. Nội dung ĐƠN GIẢN, lấp 16:9, mô phỏng đúng surface tương ứng:

| Bước | url | Render theo surface THẬT | Nội dung tối giản |
|---|---|---|---|
| **Đọc** | `…/learn/dead-letter-queue` | **LessonReader / ContentHeader + ContentTabBar** | title + 2 chip (phút/độ khó) · **tab ngôn ngữ underline** (TS/Java/C#/Go, bấm được) · **1 code ngắn** (~6-8 dòng, line-number + tint; BỎ window-dots lồng vì chrome ngoài đã có) |
| **Chấm AI** | `…/submit` | **SubmissionResult** ([[verdict-banner-and-separated-finding-cards]]) | **HeroUI `Alert` verdict** (success/danger + `CheckCircleIcon`/`XCircleIcon` phosphor) "Đạt · 92/100" + "cần ≥70" + **+120 XP** · **2-3 tiêu chí** (FeedbackCard: check/warn + text + ±điểm) |
| **Capstone** | `…/personal-project` | **PersonalProjectDashboard** ([[learn-home-surfaces-share-flat-chrome]]) | header `the-shop` + **GitHub chip** (`main`) · **progress meter** "8/20 · 40%" · **2-3 chặng** (done `CheckCircle` / active `Play` / locked `Lock`). **BỎ sơ đồ kiến trúc giả** (không có ở UI thật — capstone là path chặng + tiến độ) |
| **Leaderboard** | `…/leaderboard` | **Leaderboard rows** ([[leaderboard-board-states-podium-champion]] / [[highlight-accent-as-detail-not-block-fill]]) | "Tuần này · XP" + **3 row** (rank№ + avatar + tên + XP, +segment/bar mảnh) + **hàng "Bạn"** (accent chi tiết: ring/chip, KHÔNG tô khối) |

### Nguyên tắc bám-thật
- **Chỉ vẽ thứ có trong sản phẩm**: capstone KHÔNG có arch-diagram → bỏ; thay bằng meter + chặng (đúng `PersonalProjectDashboard`). Đọc dùng **tab ngôn ngữ underline** đúng `ContentTabBar` (không phải chip rời).
- **Domain/số hợp lý** (marketing illustration, không phải data thật, nhưng đúng SHAPE field): điểm `/100`, `+XP`, tiêu chí `±điểm`, tiến độ `done/total · %`, XP rows. Khớp field BE (score/maxScore, totalXp, milestoneProgress…).
- **16:9 + ngắn**: mỗi panel gói vừa khung `aspect-video` (overflow-hidden clip nếu lố); content `justify-center`. Bỏ mọi dòng thừa (desc dài, tip, dots lồng).
- **Token theo dark/light** (surface/default/foreground/muted/accent/success/warning) → đọc tốt trên nền landing tối; glow màu (theme `starci`) ở sau.

## Cắt / bỏ
- List: tile bự + card fill + desc.
- Panel: capstone arch-diagram giả; read tip + paragraph + window-dots lồng; mọi dòng làm tràn 16:9.

## Bước sau (apply)
`/starci-fe-ux-apply` LearnLoopScroll: (1) đổi `ListBox.Item` sang da gọn (icon nhỏ + nhãn + bar trái, bỏ tile/fill/desc); (2) viết lại 4 panel theo bảng trên, mỗi panel fit `aspect="video"`; capstone đổi sang meter+chặng. Verify tsc/eslint + soi 16:9 không tràn.
