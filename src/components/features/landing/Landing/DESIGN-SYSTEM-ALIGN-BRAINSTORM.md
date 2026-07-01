# Landing — đồng bộ design-system với content/app (2026-06-24)

> Thầy: "lệch phông chữ lệch rules quá · giữ concepts + text · landing đồng bộ với nội dung". Giữ IA/copy 100%; nắn TOKEN render về đúng design-system app.

## Audit lệch
| Trục | Hiện tại | Đồng bộ |
|---|---|---|
| Section title | `Typography.Heading level=2` | **H3** (như PageHeader app) |
| Intro | `type="body"` | **`body-sm` muted** |
| Nhãn mô tả | `type="code"` (mono — khác phông body app) | **body-xs/sm** phông body |
| Case | UPPERCASE (FOUNDATION · FAN-OUT · 4 NGÔN NGỮ) | **sentence-case** (no-uppercase) |
| Section gap | `gap-16/24` (ngoài thang) | **`gap-32`** — NGOẠI LỆ có tên cho landing ([[gap]]) |
| Tag tech | mono border | soft chip token |
| Giữ mono | — | CHỈ code THẬT (code snippet) + terminal diagram (hero `order-service.v2`) — chủ đích |

## Hướng CHỐT B — giữ identity marketing (dark + hero diagram), nắn token về app
Landing "nói cùng ngôn ngữ" với /learn, /profile: Typography token · gap scale (section `gap-32` ngoại lệ; trong section gap-6/3) · sentence-case · soft-chip · phosphor · no-emoji. KHÔNG đổi concepts/IA/copy-nghĩa. Giữ dark theme + hero MicroservicesDiagram (terminal aesthetic, mono hợp lệ).

## ĐÃ ÁP DỤNG (pass 1 — high-impact)
- `SectionHeading`: title `level` mặc định **3** (thêm prop `level` cho hero-scale 2); intro `body`→**`body-sm`** muted. → MỌI section title landing về H3.
- `Landing` wrapper: `gap-16/24`→**`gap-32`** (ngoại lệ landing, ghi [[gap]]).
- `RoadmapMetro` meta: `type="code"`→**`body-xs` muted** (hết mono "23 module").
- `constants` `LANDING_ROADMAP_TIERS.label`: UPPERCASE→**sentence-case** (Foundation/Intermediate/Advanced/Application) + sửa comment stale.
- `HeroBanner`: "Giải bằng" label + lang chips bỏ `font-mono` (giữ màu brand chip).
- `gap.md` thêm ngoại lệ "landing section = gap-32"; đính chính ngầm [[no-uppercase-text]] (gỡ "ngoại lệ landing" cho tier labels).
- tsc/eslint sạch.

## ĐÃ ÁP DỤNG (pass 2 — LearnLoopScroll, chốt cuối sau feedback thầy 2026-06-26)
> Thầy soi HMR: "đỏ (timeline trái) xấu/cầu kì · xanh lá (visual phải) đơn giản · intro máy móc · gap-10". Rồi vòng 2: "phải = LabeledCard nội dung phong phú · selected bỏ border trái → fill bg-accent/10 · icon select = CircleCheck · intro nhắc tuyển dụng thời AI".
- **Bỏ timeline cầu kì:** gỡ số khoanh-tròn 01–04, đường nối dọc, motion-fill-scroll, thanh "01/04" mono. Left giờ = list sạch: 1 icon-tile + title, active mở desc.
- **Selected = FILL `bg-accent/10` (KHÔNG border trái).** Thầy đảo lại bản "accent-detail border" → dùng fill. Đây KHÔNG mâu thuẫn [[highlight-accent-as-detail-not-block-fill]] (rule đó cấm tô NHIỀU row trong list); đây là **selected-state của single-select nav (1 active tại 1 thời điểm)** → fill bg-accent/10 là chuẩn (1 đối tượng đang chọn).
- **Icon selected/done = `CheckCircleIcon` (CircleCheck):** selected → accent tile + `weight="fill"`; done → success tile `regular`; future → step icon muted. (Khớp [[elements/icon]] §2: tích = CheckCircleIcon, KHÔNG CheckIcon trơn.)
- **Phải = block `LabeledCard`** (label NGOÀI: icon bước + title · `labelEnd` = tag) thay shell tự dựng. Nội dung phong phú hơn: mỗi card thêm **1 dòng mô tả** (desc footer); grade +1 tiêu chí + chip "+120 XP"; capstone + hàng tech-tag chips; read = mini-editor (chrome dots + filename + line gutter).
- **gap-10 header→content** (sticky wrapper `gap-8`→`gap-10`).
- **De-mono / bỏ emoji:** lang tabs + leaderboard XP/"12" bỏ `font-mono`; medal 🥇🥈🥉 → số hạng. ([[no-emoji]])
- **intro viết kiểu người + nhấn tuyển-dụng-thời-AI:** "Thời AI, nhà tuyển dụng cần người tự tay làm được việc — không phải người xem hết khóa học. Nên mỗi học phần…" (bỏ mũi tên `→` máy móc).
- **GIỮ mono có chủ đích:** code-window `read` + `DiagramBox` capstone (cùng họ hero `MicroservicesDiagram`).
- tsc + eslint sạch. Code local (chưa push).

## CÒN LẠI (rà khi đụng)
- Rà nốt các `type="code"`/`font-mono` mô tả khác (không phải code thật) ở landing nếu phát hiện.
- Cập nhật COPY-POLISH/ROADMAP brainstorm docs (đang ghi "uppercase đã duyệt" — nay gỡ).
