# UX Brainstorm — "Theo ngôn ngữ" viz (Challenges tab · Thống kê)

> Scope: chỉ phần render **breakdown ngôn ngữ** trong card "Thống kê" của tab Challenges
> (`ProfileChallenges/index.tsx` ~L216–242). Câu hỏi của thầy: *"ngoài bánh donut ra có
> cách render nào tốt hơn không?"*. KHÔNG code — chỉ chốt hướng.

## Dữ liệu thật (grounded)
- Query `userSolvedChallenges(userId)` → list `{ selectedLang, difficulty, title, submissionUrl, … }`.
- Component tự gom client-side: `langCounts: Record<lang, count>` → `langs: [lang,count][]` (sorted desc)
  → `LanguageDonut items={{key,value}}`. Difficulty: `buildDifficultySegments()` → `SegmentBar`.
- Đặc tính dữ liệu THỰC TẾ: **N nhỏ** (vd 6 bài nộp / 4 ngôn ngữ), nhiều slice gần bằng nhau (33/33/17/17).

## Vấn đề của donut ở ĐÂY (không phải donut xấu nói chung)
1. **Part-to-whole bằng GÓC → so sánh kém.** Mắt người so **chiều dài/vị trí** tốt hơn **góc/diện tích**.
   33% vs 33% vs 17% vs 17% trên donut gần như không phân biệt nổi nếu bỏ legend.
2. **N nhỏ → "%" gây hiểu lầm.** 2/6 = "33%" nghe to, thực ra chỉ 2 bài. Donut phóng đại cảm giác.
3. **Bất nhất TRONG CHÍNH card:** "Theo độ khó" ngay trên dùng thanh ngang (SegmentBar); "Theo ngôn ngữ"
   lại donut → 2 mô hình đọc khác nhau trong 1 khối.
4. **Bất nhất TOÀN TRANG:** tab Tổng quan (`OverviewCodeSkills`, `OverviewChallengeSkills`) đã render
   *cùng dữ liệu by-language* bằng **SegmentBar**. Donut là ngoại lệ duy nhất của cả profile.
5. **Nặng + lệch token:** kéo cả `recharts` cho 4 slice; màu donut tuỳ tiện (xanh/lục) không theo semantic token.
6. **Giá trị DUY NHẤT của donut = số tổng ở giữa ("6 bài nộp")** — dễ giữ lại bằng 1 headline number.

## Các hướng (≥3)

### Hướng A — Hợp nhất về thanh ngang 100% (SegmentBar) ⭐ CHỐT
Bỏ donut. Render language **y như difficulty**: 1 thanh `SegmentBar` (TS/Go/C#/Java) + legend dưới
`lang · count · %`. Giữ **"6 bài nộp"** thành 1 headline (`StatPair`) phía trên 2 thanh.
- ✅ Nhất quán trong card + với cả tab Tổng quan (GitHub language-bar mental model).
- ✅ Part-to-whole bằng chiều dài → đọc được kể cả N nhỏ.
- ✅ Bỏ `recharts`, dùng semantic token, nhẹ, themable, dark-mode chuẩn.
- ✅ Legend sorted desc = kiêm luôn "ngôn ngữ chủ lực".
- ⚠️ Mất "flair" donut; nhiều ngôn ngữ → segment mảnh (legend gánh).

### Hướng B — Danh sách bar-per-language (ranked rows)
Mỗi ngôn ngữ 1 hàng: dot màu + tên + thanh rộng ∝ count + `count · %`, sort desc.
- ✅ Tối ưu cho **so sánh độ lớn + xếp hạng** ("code nhiều nhất = ?"), recruiter quét 1 giây.
- ✅ Scale tốt khi nhiều ngôn ngữ.
- ⚠️ Không thấy part-to-whole tức thì (có % bù); cao hơn về chiều dọc.

### Hướng C — Unit/dot chart (1 chấm = 1 bài nộp)
6 chấm tô màu theo ngôn ngữ + legend.
- ✅ **Trung thực với N nhỏ** (thấy rõ chỉ 6 bài, không bị "%" thổi phồng); khác biệt, vui.
- ⚠️ Không scale quá ~30–50 bài → phải fallback sang bar khi N lớn (thêm logic).

### Loại bỏ — giữ donut "fix cho đẹp"
To hơn/màu chuẩn hơn vẫn không chữa được lỗi góc-khó-so-sánh + N-nhỏ + bất nhất. Bỏ.

## CHỐT: Hướng A (+ vay 1 ý của B)
Thay `LanguageDonut` bằng **SegmentBar** (đồng bộ difficulty) + **headline "N bài nộp"** (`StatPair`) +
**legend = hàng ranked** `lang · count · %` (sorted desc — kiêm vai trò của B). Lý do quyết định:
**chính profile đã chuẩn hoá by-language = SegmentBar ở tab Tổng quan** → donut là nợ bất nhất; hợp nhất
vừa đúng dataviz (length > angle, hợp N nhỏ) vừa gỡ recharts.

## Section → dữ liệu BE/DB
| Phần | Nguồn | Ghi chú |
|---|---|---|
| Headline "N bài nộp" | `challenges.length` | giữ con số tổng (giá trị của donut center) |
| Thanh độ khó | `buildDifficultySegments()` | GIỮ NGUYÊN SegmentBar |
| Thanh ngôn ngữ | `langCounts` → `{key,label,value,color}` | đổi donut → SegmentBar; màu theo palette ngôn ngữ ổn định |
| Legend ngôn ngữ | `langs` sorted desc | `lang · count · %` |

## States / a11y (tính sẵn)
- Empty (0 bài): `AsyncContent` self-hide / "Chưa có bài nộp". Loading: skeleton = headline Metric + 2 thanh ProgressBar.
- SegmentBar cần `ariaLabel` tổng + mỗi segment có label; màu không phải kênh duy nhất (legend có chữ + số).

## Mở rộng (field chưa khai thác)
- `score`, `passedAt`, `courseTitle`, `difficulty` per-challenge: có thể thêm "điểm TB" hoặc timeline —
  ngoài scope câu hỏi viz, ghi lại làm cơ hội.

---
*→ Thầy duyệt hướng → `/ux-apply`. Nếu chốt A, trò sẽ ghi 1 draft rule "categorical breakdown:
ưu tiên thanh ngang/ranked-bar, tránh pie/donut (N nhỏ + so góc kém + lệch token)".*
