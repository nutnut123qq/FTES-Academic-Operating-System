# Design — mascot-moments

## Context

`onboarding-mascot-guide` đã (spec) dựng `FtesMascot` (husky đeo kính + áo polo FTES, 4 tư thế,
3 cỡ, idle-motion tắt khi reduced-motion, tên `mascot.name`) + tour engine. Change này KHÔNG chế
linh vật mới — **tái dùng đúng `FtesMascot` đó làm dependency** rồi rải nó vào các khoảnh khắc
ngoài tour. Bám convention app: màu chủ đạo #3F51B5, i18n vi/en, mọi empty state đi qua 2 block
dùng chung `EmptyContent` + `EmptyState` (đều có slot `icon: ReactNode`).

## Goals / Non-Goals

**Goals:** (1) rải linh vật vào ~15 màn trống qua slot `icon` sẵn có, không sửa block; (2) linh
vật `cheer` ở cột mốc gamification; (3) nudge gợi ý có cap/dismiss/persist chống nag; (4) một
persona nhất quán (tên + giọng + guest greeting); (5) a11y đầy đủ, không chặn thao tác. FE-only,
build green.

**Non-Goals:** định nghĩa lại/animation phức tạp cho linh vật (thuộc `onboarding-mascot-guide`);
BE sync cờ "seen" nudge cross-device (giai đoạn này localStorage; BE flag chỉ cho onboarding-
completed theo contract nghiên cứu); dựng pipeline thưởng XP khi celebration (chỉ nghe event có
sẵn); rải linh vật vào MỌI sub-empty nhỏ (giữ 1 linh vật/trang, phần còn lại icon thường).

## Decisions

### 1. Contract `FtesMascot` tái dùng (KHÔNG định nghĩa lại)

Tiêu thụ nguyên contract từ `onboarding-mascot-guide`:

```ts
<FtesMascot pose="greeting" | "explain" | "point" | "cheer" size="sm" | "md" | "lg" animated? />
```

- Linh vật là **trang trí** → `aria-hidden`; nghĩa nằm ở `title`/`description` của empty state
  hoặc copy nudge (vùng `aria-live`).
- Cắm vào empty state = truyền `icon={<FtesMascot pose=… size="md" />}` thay cho icon Phosphor
  mặc định tại **call-site** — KHÔNG sửa `EmptyContent`/`EmptyState`.
- Map ý đồ → pose: `point` = "chưa có gì → đi tạo/khám phá" (dẫn tới CTA); `explain` = "lọc/tìm
  ra rỗng" hoặc panel hẹp (trấn an); `cheer` = cột mốc/hoàn thành; `greeting` = chào khách gate.
- Cỡ: `md` mặc định cho empty state cả trang; `sm` cho panel/popover hẹp (NotificationCenter) và
  cho kết-quả-lọc đổi liên tục (Marketplace) để không lấn.

### 2. Bảng danh mục moment

Cột: **surface | file cắm | pose | trigger | copy (i18n key) | frequency/persist**.
Tất cả `bodyKey` dưới namespace `mascot.*`; tái dùng `mascot.name`.

#### Nhóm A — `mascot-empty-states` (slot icon, không cap, ẩn khi có ≥1 mục)

| Surface | File cắm | Pose | Trigger | Copy key | Frequency/persist |
|---|---|---|---|---|---|
| MyCourses chưa enroll | `src/components/features/course/MyCourses/index.tsx` (~52 isEmpty) | point | `courses.length===0` sau load | `mascot.empty.myCourses` | Mỗi lần rỗng, không cap; đứng cạnh CTA `courses.mine.browse`, trỏ nút |
| Giỏ hàng trống | `src/components/features/cart/CartShell/index.tsx` (~82) | point | `items.length===0` | `mascot.empty.cart` | Mỗi lần rỗng; kèm CTA về `/courses` để có chỗ trỏ |
| Community feed trống | `src/components/features/community/CommunityFeed/index.tsx` (~187) | point | `posts.length===0` (nhánh `feed.empty`/`feed.campusEmpty`) | `mascot.empty.communityFeed` | Mỗi lần rỗng; CHỈ ở feed chính (neo Community shell) |
| Quest board hết nhiệm vụ | `src/components/features/gamification/QuestBoard/index.tsx` (~208) | explain | `quests.length===0` sau load | `mascot.empty.quests` | Mỗi lần rỗng, không cap |
| Thư viện đã lưu trống | `src/components/features/saved/SavedLibrary/index.tsx` (~246) | point | `tabRows.length===0` theo tab đang mở | `mascot.empty.saved` | 1 linh vật cho tab đang mở (không mỗi tab 1 con) |
| Search 0 kết quả | `src/components/features/search/SearchResults/index.tsx` (~161) | explain | `hasMinChars && !isLoading && !error && 0 match` | `mascot.empty.searchNoResults` | Sau debounce (không nháy khi đang gõ); interpolate `{query}` |
| Thông báo trống | `src/components/features/notification/NotificationCenter/index.tsx` (~232) | explain (sm) | `items.length===0` | `mascot.empty.notifications` | Mỗi lần rỗng; cỡ `sm` (popover hẹp) |
| Hồ sơ — Job readiness rỗng | `src/components/features/profile/ProfilePersonal/index.tsx` (~150) | point | section rỗng, **owner** (không ProfilePublic) | `mascot.empty.jobReadiness` | 1 linh vật cho khối Job-readiness |
| Portfolio trống | `src/components/features/profile/ProfilePortfolio/index.tsx` (~296/311) | point | `projects.length===0 && links.length===0 && editing===null`, owner | `mascot.empty.portfolio` | Sub-empty resume/cert/achievement (~338/475/484) GIỮ icon thường |
| Career Center trống | `src/components/features/career/CareerCenter/index.tsx` (~132 skills) | point | khối skills rỗng (neo) | `mascot.empty.career` | 1 linh vật ở khối skills; roadmaps(~163)/jobs(~210) icon thường |
| Feed nhóm trống | `src/components/features/group/GroupFeed/index.tsx` (~164) | point | `posts.length===0` | `mascot.empty.groupFeed` | Chỉ feed chính; tab khác của nhóm icon thường |
| Danh sách nhóm trống | `src/components/features/group/GroupsList/index.tsx` (~67) | point / explain | `filtered.length===0`; chưa-vào-nhóm → point, do-filter → explain | `mascot.empty.groups` / `mascot.empty.groupsFiltered` | Do filter thì hạ tông (explain) |
| Marketplace 0 kết quả | `src/components/features/marketplace/MarketplaceCatalog/index.tsx` (~108) | explain (sm) | `filtered.length===0` (kết quả lọc) | `mascot.empty.marketplace` | Cỡ `sm`, giọng trấn an (không rủ rê) |
| Dòng thời gian trống | `src/components/features/activity/ActivityTimeline/index.tsx` (~88) | explain | `activity.length===0` | `mascot.empty.activity` | Mỗi lần rỗng, không cap |
| Community đã lưu trống | `src/components/features/community/CommunitySaved/index.tsx` (~155) | point (sm) | `posts.length===0` | `mascot.empty.communitySaved` | Cỡ `sm`/hoặc bỏ nếu CommunityFeed đã có linh vật cùng shell (chống trùng) |

> **Profile Skills rỗng** (`ProfilePersonal` ~156, owner): CỐ Ý **KHÔNG** gắn linh vật — để tránh
> 2 linh vật cạnh nhau trên cùng màn ProfilePersonal, ưu tiên Job-readiness, khối Skills giữ icon
> thường. `ProfilePublic` (~98) luôn giữ icon thường (người khác xem, không cần dẫn dắt).

#### Nhóm B — `mascot-celebrations` (cheer, qua GamificationEventHost)

| Surface | File cắm | Pose | Trigger | Copy key | Frequency/persist |
|---|---|---|---|---|---|
| Quest board — nhận HẾT nhiệm vụ ngày | `src/components/features/gamification/QuestBoard/index.tsx` (nhánh all-claimed, KHÁC empty ~208) | cheer | tất cả quest đã claim (không phải `quests.length===0`) | `mascot.celebrate.questsAllClaimed` | 1 lần / ngày / thiết bị (cờ theo ngày); không lặp trong ngày |

Mở rộng (seed sau, cùng cơ chế): level-up, streak-milestone, hoàn thành khóa đầu — phát qua
`GamificationEventHost`, mỗi loại có cờ chống lặp riêng.

#### Nhóm C — `mascot-nudges` (overlay, cap + dismiss + persist)

| Surface | File cắm | Pose | Trigger | Copy key | Frequency/persist |
|---|---|---|---|---|---|
| Nhắc hoàn tất hồ sơ nghề nghiệp | overlay store, neo ở `ProfilePersonal`/`CareerCenter` | point | hồ sơ thiếu dữ liệu nghề nghiệp & chưa dismiss & không đang tour | `mascot.nudge.completeProfile` | **1 / loại / thiết bị**, dismissible, cờ `ftes:mascot:nudge:{principal}:completeProfile` |

> Nudge là **overlay gợi ý**, KHÁC empty state (empty = nội dung màn, không cap). Nudge PHẢI
> tuân guardrail §5. Đây là mẫu; nudge khác đăng ký cùng cơ chế.

#### Nhóm D — `mascot-persona` (một linh vật + tên + giọng; guest greeting)

| Surface | File cắm | Pose | Trigger | Copy key | Frequency/persist |
|---|---|---|---|---|---|
| Quest board — khách chưa đăng nhập | `src/components/features/gamification/QuestBoard/index.tsx` (~146 SignInIcon gate) | greeting | `!authenticated` | `mascot.persona.guestQuests` | Mỗi lần khách xem `/quests` (welcome, không nag) |
| Saved library — khách chưa đăng nhập | `src/components/features/saved/SavedLibrary/index.tsx` (~201 guest gate) | greeting | `!authenticated` | `mascot.persona.guestSaved` | Mỗi lần khách xem (welcome) |

Persona xuyên suốt: mọi copy xưng bằng `mascot.name`, giọng thân-thiện-ngắn-gọn, KHÔNG linh vật
biến thể khác ở bất kỳ surface nào.

### 3. Cơ chế persist "seen" (chốt phương án)

- **Nudge (Nhóm C) → localStorage.** Cờ `ftes:mascot:nudge:{principal}:{type}` với `principal` =
  userId (đăng nhập) hoặc device uuid (khách) — cùng họ key `ftes:tour:{principal}:*` của
  `onboarding-mascot-guide`. Set khi user dismiss / khi nudge đã hiện đủ 1 lần → không hiện lại.
- **Celebration theo ngày (Nhóm B) → localStorage** cờ theo ngày `ftes:mascot:celebrate:{type}:{yyyy-mm-dd}`
  để "1 lần / ngày".
- **Empty state (Nhóm A) & guest greeting (Nhóm D) → KHÔNG persist** (không cap): empty = nội
  dung màn, tự ẩn khi có dữ liệu; guest greeting là welcome mỗi lần khách vào — cả hai không phải
  nudge nên không cần cờ.
- **BE flag** chỉ dành cho **onboarding-completed** (đã thuộc `onboarding-mascot-guide`), KHÔNG
  mở rộng sang moment ở đây — theo contract nghiên cứu (client localStorage cho nudge, BE flag
  cho onboarding). Giữ FE-only, không đụng BE.

### 4. Nơi cắm kỹ thuật

- **Empty-state block:** slot `icon` của `EmptyContent`
  (`src/components/blocks/async/EmptyContent/index.tsx`, dùng qua `AsyncContent`
  `emptyContent={{icon,title,description,action}}`) và `EmptyState`
  (`src/components/blocks/feedback/EmptyState/index.tsx`). Chỉ đổi giá trị `icon` tại call-site;
  KHÔNG sửa block. (Tùy chọn chuẩn hóa: thêm biến thể `emptyContent.mascotPose` — tối thiểu chỉ
  cần đặt `<FtesMascot/>` vào `icon`.)
- **Celebration:** `GamificationEventHost` — nghe sự kiện gamification (quest all-claimed…) rồi
  render linh vật `cheer` (toast/overlay ngắn). 1 host, không rải logic vào từng feature.
- **Nudge:** overlay store (cùng họ store overlay dùng cho tour/dialog) — feature đăng ký nudge,
  host đọc store + guard "đang có tour" + đọc cờ localStorage → quyết định hiện.
- **Guest greeting:** tại chính guest-gate `EmptyContent` (QuestBoard/SavedLibrary) — đổi `icon`
  sang `<FtesMascot pose="greeting" />`.
- **Error boundary:** nếu có empty/error fallback dùng chung, cắm linh vật `explain` cùng cách
  (slot icon) — không bắt buộc ở change này (defer nếu boundary chưa chuẩn hóa slot icon).

### 5. Accessibility & guardrail chống nag

- **A11y:** linh vật `aria-hidden` (trang trí); copy moment nằm trong `title`/`description` empty
  state hoặc vùng `aria-live="polite"` cho nudge/celebration để screen-reader đọc. Nudge/celebration
  **KHÔNG chặn thao tác** (không focus-trap, không modal cứng) — dismiss được bằng nút × và Esc.
  `prefers-reduced-motion` → tắt idle-motion linh vật + bỏ hiệu ứng trượt/scale của
  celebration/nudge (đã có ở `FtesMascot`).
- **Guardrail chống nag:**
  - Nudge: **1 / loại / thiết bị**, dismissible, ghi cờ localStorage → không hiện lại; **KHÔNG
    hiện khi đang chạy tour** (onboarding overlay active) — nhường tour.
  - Celebration: **1 / loại / ngày** (cờ theo ngày).
  - Empty state: **1 linh vật / trang** (khối neo); các khối/tab/sub-empty còn lại icon thường —
    không bao giờ 2–3 linh vật cùng màn.
  - Không auto-lặp; mọi overlay đều đóng được; không stack (1 nudge/celebration tại 1 thời điểm).

## Risks / Trade-offs

- **Dependency `onboarding-mascot-guide` chưa build** → `FtesMascot` chưa tồn tại. Giảm thiểu:
  build trước hoặc build kèm; change này chỉ tiêu thụ contract, không tự chế linh vật.
- **Trùng linh vật cùng shell** (Community feed + saved; Profile job-readiness + skills;
  Career skills + roadmaps + jobs) → guardrail "1 linh vật/trang + khối neo" (§2, §5).
- **localStorage lệch khi xóa storage / đổi máy** → chấp nhận ở giai đoạn FE-only (nudge/celebration
  không critical). BE sync = non-goal.
- **Làm phiền** → cap + dismiss + persist + không-khi-đang-tour + không-stack (§5).
