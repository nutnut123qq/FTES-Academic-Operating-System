# Plan — "Trình độ của bạn đã hơn X% người" (challenge strength percentile)

> Ngày 2026-06-17. KHÔNG code ở bước này — duyệt rồi mới làm. Trang: tab Challenges (`ProfileChallenges`).

## Mục tiêu
Dưới hero "6 challenge đã pass" thêm dòng so sánh: **"Trình độ của bạn đã hơn X% người"**, với điểm trình độ
tính theo ĐỘ KHÓ challenge đã pass.

## Trọng số (thầy chốt)
`easy=10 · medium=20 · hard=30 · insane=40` · **expert=?** (đề xuất 50; chờ thầy chốt).
**strengthScore(user) = Σ weight(difficulty) trên các challenge ĐÃ PASS (distinct).**

## Đối chiếu XP gain DB (research) — vì sao đây là metric MỚI, tách riêng
DB hiện **không** weight challenge theo difficulty:
- `users.points`: **flat 20**/challenge (`FLAT_POINTS.challengePassed`), nguồn league + global leaderboard.
- per-course `totalXp` = Σ attempt.score(0-100) + lessonRead×3 + milestone×10.
- `xp_histories` ledger (source, refId, amount, points) — idempotent.
→ Hai con số kinh tế (points/league, totalXp/course-leaderboard) **không đụng tới**.

### 2 đường
- **A — Metric DẪN XUẤT riêng (ĐỀ XUẤT).** `strengthScore` chỉ để tính percentile hiển thị ở profile, KHÔNG
  thay đổi points/XP/league. An toàn, không backfill, không ảnh hưởng kinh tế điểm. Recommend.
- **B — Đổi XP gain thành theo difficulty (10/20/30/40).** Phải sửa `FLAT_POINTS`/luồng `writeXpHistory` +
  **backfill `xp_histories` + `users.points`** cho toàn bộ user cũ → lệch league/leaderboard lịch sử. RỦI RO cao,
  ngoài scope hiển thị. KHÔNG khuyến nghị (trừ khi thầy muốn cải tổ kinh tế điểm).

## Công thức percentile
- pool = các user có `strengthScore > 0` (đã pass ≥1 challenge) — nhóm so sánh có nghĩa.
- beaten = số user trong pool có `strengthScore < strengthScore(me)`.
- **percent = round(beaten / poolSize × 100)**. `null` khi me chưa pass challenge nào (ẩn dòng).
- (tie: cùng điểm không tính "hơn"; ai hơn hẳn mới tính — "hơn X%".)

## BE (repo backend) — mirror pattern `userCodingRank` đã làm
1. **Weights const** dùng chung (BE): `CHALLENGE_DIFFICULTY_WEIGHT = {easy:10,medium:20,hard:30,insane:40,expert:50}`.
2. **`user_solved_challenges_projections.value` += `strengthScore`**: recompute SQL cộng
   `SUM(CASE ch.difficulty WHEN 'easy' THEN 10 … END)` trên các pass (distinct challenge). (1 số/ user, để rank.)
3. **Service** `getChallengeStrengthPercentile(userId)` + `getChallengeStrengthRank(userId)`: đọc projection
   table (như `getRank`/`getLeaderboard` coding):
   - percentile = round(beaten/pool×100) (đã định nghĩa trên).
   - **rank #N** = 1 + COUNT(user có strengthScore > mine), tie-break updated_at ASC. `null` khi mine=0.
4. **Query mới** (optional-auth + visibility guard, mirror `user-coding-rank/`):
   - `userChallengeStrengthPercentile(userId: ID!): Int`
   - `userChallengeStrengthRank(userId: ID!): Int`  ← **"lấy vị thứ nữa" (thầy 2026-06-17)** — #N như tab Coding.
   (Có thể gộp 1 query trả object `{ percentile, rank }` cho gọn — đề xuất gộp.)

## FE (repo starci-academy)
1. **SWR hook(s)** cho percentile + rank (mirror `useQueryUserCodingRankSwr`).
2. **Stats card** (ProfileChallenges): dưới `StatPair` count:
   - dòng **"Trình độ của bạn đã hơn {percent}% người"** (ẩn khi null), nhấn nhẹ vì là điểm khoe.
   - **rank #N** — đề xuất hiển thị kiểu metric như tab Coding (hàng ô: *Đã pass · Hơn X% · #N hạng*), HOẶC
     gắn "#N" cạnh dòng percentile. (Tab Coding đang: 8 Đã giải · 27 Điểm · 89% Tỉ lệ · #2 Hạng → tham chiếu.)
3. **i18n**: `strengthPercentile` = "Trình độ của bạn đã hơn {percent}% người" / "Your level beats {percent}% of
   learners"; `rankLabel` = "Hạng" / "Rank" (đã có ở coding, tái dùng nếu trùng key).

## Mở (chờ thầy chốt)
1. **expert weight** = 50? (hay 40 = insane).
2. **Đường A hay B?** (đề xuất A — metric dẫn xuất, không đụng kinh tế điểm).
3. Pool so sánh = "user có ≥1 challenge pass" (đề xuất) hay TẤT CẢ user (kể cả 0)? (0 làm % bị loãng).
4. Câu chữ: "Trình độ của bạn đã hơn X% người" — ok? (hay "...hơn X% học viên").

## Nit riêng (không thuộc plan này)
"size legend không bằng nhau" ở SegmentBar legend (item width khác nhau) — fix nhỏ: cho mỗi legend item
min-width hoặc grid đều cột. Làm tách, không cần plan.
