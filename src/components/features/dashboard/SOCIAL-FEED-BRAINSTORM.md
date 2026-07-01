# UX Brainstorm — Dashboard FEED nghiêng social + engagement

> Thầy: "feed nói rõ về NGƯỜI KHÁC + ENGAGEMENT, vì feed cần yếu tố social hơn. brainstorm kĩ + tự seed data."
> KHÔNG code (trừ seed data thầy yêu cầu).

## Dữ liệu thật (grounded)
- **Feed CÓ THẬT**: `myFeed` 2 scope **For You** (toàn nền tảng trừ mình) / **Following** (người mình theo dõi),
  **score-ranked + decay 48h**, cursor-paginated. Item: `actorUsername/actorAvatar/actorGlobalId · type · targetLabel/targetGlobalId · at`.
- **9 activity type**: LessonRead · LessonBookmarked · ChallengePassed · CodingSolved · MilestonePassed · AiLabPassed ·
  CourseEnrolled · DiscussionCommented · UserFollowed. (append-only `activities`, `writeActivity` đã emit đủ.)
- **Social graph READY**: `setFollow`, `userFollowers/userFollowing`, `suggestedUsers` (ai chưa follow, rank followerCount).
  Stats projection có `followerCount/followingCount`.
- **ENGAGEMENT trên feed — KHÔNG có**: ReactionEntity (6 cảm xúc FB) + CommentEntity chỉ gắn **content/comment**, KHÔNG gắn
  activity. `MyFeedItemData` **không có reactionCount/hasReacted**, feed item **không comment được**. → react/comment THẲNG
  trên feed = **chưa tồn tại** (đừng fake).
- Dashboard hiện: **Overview = 100% self** (streak/goal/course/contribution); **Explore = social** (`FeedTabs` For You/Following
  + `WhoToFollow` + `TrendingContents`); Community = league + changelog. Feed render qua block `ActivityFeed` (gom theo ngày,
  câu "actor + action + target", icon theo type) — **nhưng KHÔ KHAN: chỉ thông báo, 0 tương tác, 0 social proof.**

## Pain (vì sao feed "chưa social")
1. Feed item chỉ là **dòng thông báo một chiều** — không thả cảm xúc/không bình luận/không "N người cũng vừa…".
2. **Không action xã hội tại chỗ**: thấy actor lạ nhưng **không Follow ngay** trên feed; who-to-follow tách rời.
3. Thiếu **social proof/đám đông** (vd "12 người đã giải bài này tuần nay", "3 người bạn theo dõi vừa đạt huy hiệu").
4. Overview tab tách biệt, self-centric → feed social bị đẩy sang Explore, không phải "mặt tiền".

## Hướng (≥3)

### Hướng A — Social NGAY bằng data thật (FE-only) ⭐ phase 1
Không cần BE mới. Làm feed "có người + có hành động xã hội":
- **Actor click → profile** (đã có); **nút Follow INLINE** trên dòng feed actor lạ + trên `WhoToFollow` (dùng `setFollow`).
- **Dệt người vào feed**: chèn card "Gợi ý theo dõi" (suggestedUsers) + "X vừa theo dõi Y" (UserFollowed activity) giữa feed.
- **Celebration framing**: dòng đạt huy hiệu/giải khó → nhấn (icon + "🎉"), gom milestone (đã có roll-up).
- **Social proof từ projection có sẵn**: followerCount của actor (chip "· N theo dõi"); "đang theo dõi" badge.
- Engagement THẬT (react) → **link về nơi react được**: feed item target là content → CTA "Thả cảm xúc/bình luận" mở lesson (nơi đã có reaction/comment).
- ✅ Social hơn hẳn, 0 BE; ⚠️ chưa react THẲNG trên feed (đẩy về content).

### Hướng B — Engagement THẬT trên feed (cần BE) — phase 2
Mở **reaction (+comment) cho activity**: tái dùng `reaction-type` enum + pattern `ContentReaction` → `ActivityReactionEntity`
(activity_id+user_id unique) + mutation `reactActivity` + expose `reactionCount`/`hasReacted`/`topReactors` trên `MyFeedItemData`.
- Feed item có **hàng react (👍❤️🎉) + đếm + "bạn & N người khác"**; tùy chọn comment nhẹ.
- ✅ Đúng "engagement" thật sự (LinkedIn/FB feed); ⚠️ FEATURE BE thật (entity+mutation+projection count+CDC), nặng → làm sau.

### Hướng C — minimal: chỉ thêm Follow inline + who-to-follow xen kẽ. (ít giá trị, bỏ qua celebration/proof.)

## CHỐT: A (làm ngay, FE + seed) → B (plan BE)
Phase 1 (A): biến feed thành social bằng data có sẵn — Follow inline, dệt suggested/UserFollowed, celebration, social-proof
followerCount, react-via-content. Phase 2 (B): activity-reaction BE cho engagement thật (nêu rõ, không fake). Cân nhắc đưa
`FeedTabs` social lên **Overview/mặt tiền** thay vì chỉ Explore (feed là trái tim cộng đồng).

## Section → dữ liệu (+ gap)
| Phần | Nguồn | Trạng thái |
|---|---|---|
| Feed others (For You/Following) | `myFeed` | ✅ |
| Follow inline / who-to-follow | `setFollow` · `suggestedUsers` | ✅ |
| Social proof (N theo dõi) | stats projection `followerCount` | ✅ (cần expose lên feed item nếu chưa) |
| React/comment THẲNG trên feed | — | ❌ **CẦN BE** `ActivityReaction` (phase 2) |
| React qua content | `contentReactions` (link tới lesson) | ✅ (gián tiếp) |

## Seed data (thầy yêu cầu — sẽ chạy DB)
Để feed Following/For You có nội dung: seed **activities cho các user starci183 đang follow** (Đức Anh/Lan Chi/Quang Huy/
Minh Anh…) — rải nhiều type (ChallengePassed/CodingSolved/LessonRead/MilestonePassed/CourseEnrolled/UserFollowed) với
`created_at` 1–10 ngày gần đây, `payload.target` trỏ content/challenge thật; đảm bảo follow edges tồn tại. (Engagement-seed
chỉ khi có ActivityReaction — chưa, nên seed content_reactions cho social-proof nếu cần.)

## States / a11y
AsyncContent (skeleton feed rows · empty "Theo dõi thêm người để thấy hoạt động" + CTA who-to-follow · error retry).
Follow button isPending; actor link aria-label; infinite scroll cursor (đã có).

---
*→ Thầy duyệt A → `/ux-apply` (Follow inline + who-to-follow xen kẽ + celebration + social proof) + seed. B (activity-reaction)
= chốt scope BE riêng. Draft rule: "feed = social-first: actor click+Follow inline, dệt người/suggested, social proof từ
projection; engagement THẬT (react activity) cần BE, không fake trên feed item."*
