# UX Brainstorm — Profile "Hoạt động" tab (achievements wall + recent-activity feed)

> Output của `/ux-brainstorm`. KHÔNG code. Grounded in BE/DB thật; legacy chỉ là inventory.
> Duyệt hướng → `/ux-apply` (cấu trúc) → `/ui-apply` (da).

## 0. Phạm vi + điểm đau (thầy chỉ)
Tab `ProfileActivityTab`: **Thành tích** (badge wall) · **Trình độ theo khóa** (courses, đã làm) · **Hoạt động gần đây** (feed).
- Badge: **mascot hơi to + spacing hơi quá** (size 64, grid `gap-6` minmax 92px).
- Meta badge/tooltip: muốn **`Tập sự · 13%`** (rank trái màu RING, % phải MUTED) — bỏ kiểu 3 dòng + màu sai (rank đang `text-success` xanh, Top% đang `text-warning` vàng).
- Feed: **render xấu** → làm **kiểu Facebook**. + **bug chữ trống** (kiểm tra text).

## 1. Dữ liệu THẬT (đừng vẽ field không có)

### Feed — `userFeed(userId, limit, cursor)` → item:
| field | nghĩa |
|---|---|
| `actorGlobalId` / `actorUsername` / `actorAvatar?` | người làm (token + avatar) |
| `type` | 1 trong **9** `ActivityType` |
| `targetGlobalId?` / `targetLabel?` | đối tượng (**NULLABLE** — gốc bug) |
| `at` (ISO) | thời điểm |

9 type + câu (vi): `lessonRead` đã đọc · `lessonBookmarked` đã lưu · `challengePassed` đã vượt qua challenge · `codingSolved` đã giải xong · `milestonePassed` đã hoàn thành milestone · `aiLabPassed` đã qua AI Lab · `courseEnrolled` đã tham gia khóa · `discussionCommented` đã bình luận ở · `userFollowed` đã theo dõi. (+ `milestonePassedGrouped` gộp N task.)

### Achievements — `userAchievements(userId)` → item:
`slug · name · description · iconKey · earned · tierReached(1-4|null) · threshold · currentValue · rarityPercent(1-100|null)`.
- **Rank/ring** (`getRank(earned,tierReached)` → `{labelKey, ring}`): T1 `ranks.beginner` xám `#8C95A1` · T2 `junior` đồng `#B06A2C` · T3 `middle` bạc `#AEB8C4` · T4 `senior` vàng `#F0B429`.
- `rarityPercent` = % user có badge (→ "Top 13%"). `MascotBadge` đã tô ring theo tier; locked = viền đứt + xám.

## 2. Bug chữ trống — nguyên nhân + cách sửa
**Nguyên nhân:** `targetLabel === null` (target xoá/không resolve) → i18n vẫn render `<target></target>` rỗng.
**Cách sửa (ux-apply):** mỗi type có **câu fallback KHÔNG target** dùng danh từ chung khi `targetLabel == null`:
- `lessonRead` → "đã đọc **một bài học**" · `milestonePassed` → "đã hoàn thành **một milestone**" · `challengePassed` → "đã vượt qua **một challenge**" · `codingSolved` → "đã giải **một bài**" · `courseEnrolled` → "đã tham gia **một khóa học**" · `discussionCommented` → "đã bình luận **một bài**" · `userFollowed` → "đã theo dõi **một người**" · `lessonBookmarked` → "đã lưu **một bài học**" · `aiLabPassed` → "đã qua **một thử thách AI Lab**".
→ Thêm key `dashboard.feed.<type>NoTarget` (en+vi). **KHÔNG BAO GIỜ render token rỗng.**

## 3. Hướng thiết kế

### A. FEED — kiểu Facebook (CHỐT: A1 + nhóm theo ngày)
- **A1 — Notification-list (FB/LinkedIn):** mỗi dòng = **avatar + huy hiệu icon-type nhỏ góc dưới-phải avatar** + câu (**actor** đậm-link · verb · **target** đậm-link) + **thời gian tương đối** ("2 giờ trước", đã có `getTimeAgoMessage`) + hover nền nhẹ. Phân tách bằng spacing/divider mảnh, KHÔNG border dày. Build trên block **`FeedItem`** (leading=avatar+badge, children=câu, timestamp=relative).
- **A2 — Rich cards:** mỗi activity 1 card có preview target. → **loại**: quá nặng/nhiễu cho micro-activity.
- **A3 — Spine timeline** (block `Timeline` có sẵn, viền trái): gọn nhưng không "Facebook". → phụ.
- **CHỐT = A1**, thêm **header nhóm theo ngày** ("Hôm nay / Hôm qua / Tháng 6, 2026") khi cuộn dài — vừa FB vừa dễ quét. Đổi **datetime tuyệt đối → tương đối** (đỡ rối: "01:56 13 tháng 6, 2026" → "2 ngày trước"). Icon-type: lessonRead `BookOpen` · challengePassed `SealCheck` · codingSolved `Code` · milestonePassed `Flag` · courseEnrolled `GraduationCap` · userFollowed `UserPlus` · discussionCommented `ChatCircle` · lessonBookmarked `BookmarkSimple` · aiLabPassed `Sparkle`. Avatar+badge nên là block tái dùng **`ActivityAvatar`** (avatar + ring icon góc).

### B. ACHIEVEMENTS WALL — tighter + meta đúng (CHỐT: B1)
- **B1 — Grid chặt + meta 1 dòng:** badge **size ~48** (từ 64), grid **`gap-4`** + cell ~`minmax(72px,1fr)` (từ gap-6/92px). Dưới badge:
  - **earned** → **`{rank} · {rarity}%`** trên 1 dòng: `{rank}` tô **màu RING** (`style={{color: ring}}`, data-driven), `· {rarity}%` **muted**. (mindset: 1 màu nổi data-driven + còn lại muted).
  - **locked** → `currentValue/threshold` muted + thanh progress mảnh (đang tiến tới mốc).
- **B2 — Tách earned/locked:** earned lên đầu, locked gom "Đang chinh phục". → giữ **nhóm theo category** hiện có (Học tập/Kỹ năng/Cộng đồng/Khóa) + trong nhóm earned-first (đã có `byFlex`). Không cần tách thêm.
- **Tooltip** (`InfoTooltip`-style, bỏ tự ráp): name (đậm) + description (muted) + **`{rank} · {rarity}%`** (rank ring-color, % muted). **BỎ** dòng rank xanh + Top% vàng (màu sai nghĩa). Container tự pad → không `p-2` trong.

## 4. IA tab Hoạt động (sau redesign)
1. **Thành tích** `LabeledCard`(Trophy) → wall B1 (nhóm category, badge nhỏ, meta rank·rarity ring/muted, tooltip gọn).
2. **Trình độ theo khóa** `LabeledCard`(GraduationCap) → giữ (đã chuẩn IconTile rows).
3. **Hoạt động gần đây** `LabeledCard`(Pulse) → feed A1 (ActivityAvatar + câu actor/target link + relative time + day-group + null-target fallback). Bỏ legacy `layouts/shell/Dashboard/Feed` + `EntityToken`.

## 5. Cắt / Thêm
- **Cắt:** datetime tuyệt đối (→ relative); border dày feed; token rỗng (→ fallback); màu rank xanh + Top% vàng (→ ring + muted); badge 64 + gap-6.
- **Thêm:** block `ActivityAvatar` (avatar+type-icon badge); i18n `dashboard.feed.<type>NoTarget`; day-group header; progress mảnh cho locked badge.
- **Tận dụng field chưa khai thác:** `getTimeAgoMessage` (đã có, feed chưa dùng); `rarityPercent` lên meta chính (không chỉ tooltip).

## 6. A11y/states
Feed/wall qua `AsyncContent` (skeleton mirror, empty tự ẩn, error retry — đã có). Avatar+icon `aria-hidden`; actor/target = `Link` reachable bàn phím; relative-time kèm `title` datetime tuyệt đối cho người cần chính xác.
