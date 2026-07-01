# Logic "Hạng" (rank) & "Top đầu" (percentile)

> Áp cho cả tab **Challenges** (strengthScore) và **Coding** (solvedCount). Hai con số = 2 góc nhìn của CÙNG 1
> thứ tự xếp hạng theo 1 "điểm" (score) của user.

## Khái niệm chung
- **score** = đại lượng dùng để xếp: Challenges = `strengthScore` (Σ trọng số độ khó: easy10/med20/hard30/insane40/
  expert50); Coding = `solvedCount` (số bài distinct đã giải). Mỗi user 1 score (đọc từ projection).
- **pool** = tập user **có score > 0** (đã có hoạt động) — nhóm so sánh. User score=0 → CHƯA xếp (rank/percentile = null → ẩn ô).
- **mine** = score của user đang xem.

## Hạng (rank) — vị trí từ TRÊN xuống
```
rank = 1 + COUNT(pool: score > mine)
       (đồng điểm → tie-break updated_at ASC: ai đạt mốc trước xếp trên)
rank = null  khi mine = 0
```
- `#1` = không ai điểm cao hơn. Càng nhỏ càng giỏi.
- Ví dụ Challenges: an(230) #1 · **starci(170) #2** · minh(60) #3.

## Top đầu (percentile) — % người mình VƯỢT
```
beaten     = COUNT(pool: score < mine)        // số người mình hơn HẲN
poolSize   = COUNT(pool)                       // gồm cả mình
percentile = round(beaten / poolSize × 100)
percentile = null  khi mine = 0
```
- Ý nghĩa: "trình độ bạn hơn **X%** người (trong số đã hoạt động)".
- Ví dụ starci (170), pool 3 người, hơn hẳn minh(60) → beaten=1 → **round(1/3×100)=33%**.
- (Lưu ý: percentile tính theo "vượt HẲN", đồng điểm KHÔNG tính là vượt → công bằng.)

## Quan hệ rank ⟷ percentile
- Cùng 1 ordering: **rank đếm từ đỉnh, percentile đếm từ đáy.** rank nhỏ ⇒ percentile cao.
- Pool nhỏ → percentile thô (3 người: chỉ ra 0/33/67/100…). Pool lớn → mượt.

## Nguồn dữ liệu (BE)
- Đọc thẳng bảng projection (`user_solved_challenges_projections` / `user_coding_projections`), 1 query window/count
  — KHÔNG aggregate raw submission mỗi request. Metric DẪN XUẤT (đường A): **không đụng** points/XP/league.
- Challenges: query `userChallengeStrength → { percentile, rank, xp }` (ĐÃ CÓ).
- Coding: `userCodingRank → Int` (ĐÃ CÓ, theo solvedCount). **Percentile coding CHƯA có** → ô "Top đầu" đang `—`.

## ⚠️ Gap cần làm: "Top đầu" tab Coding
Hiện Coding hiển thị `—` cho Top đầu (placeholder). Để thật: thêm percentile coding = **đúng công thức trên với
score = solvedCount** (pool = user có solvedCount>0). Cách: mở rộng `userCodingRank` → trả `{ rank, percentile }`
(hoặc query gộp), mirror `getChallengeStrength`. FE thay `—` bằng `{percentile}%`.
