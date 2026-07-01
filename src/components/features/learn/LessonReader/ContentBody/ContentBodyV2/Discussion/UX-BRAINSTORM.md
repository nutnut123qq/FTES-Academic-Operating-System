# UX-BRAINSTORM — "Phần dưới" lesson reader (action bar + bình luận) (2026-06-21)

> `/starci-fe-ux-brainstorm` — KHÔNG code. Target: khu DƯỚI nội dung bài (`ContentBodyV2` → `ContentDiscussion`
> → legacy `reuseable/Discussion`: `InteractionBar` + `CommentItem` + composer) + `LessonPager` + `E2eResultButton`.
> Thầy: *"sửa phần dưới này"*.

## 0. TL;DR
Khu dưới rối vì **lặp hành động + chip bình luận nặng**. `LessonPager` (prev/next) thực ra ỔN — không đụng.
Gom pain vào **Discussion**:
1. **Thanh hành động (InteractionBar) TRÙNG rail "Hành động".** Bar 2 hàng kiểu Facebook: [cảm xúc · view · share] + tabs
   **[Yêu thích | Lưu | Chia sẻ | Mở rộng]**. Nhưng **Lưu/Chia sẻ/Mở rộng đã có ở rail OnThisPage "Hành động"** →
   hiện 2 nơi. Ref [[course-home-no-duplicate-surfaces]] (mỗi thứ 1 nhà).
2. **Chip action bình luận nặng.** Trả lời/Sửa/**Xóa**/Ẩn = HeroUI `Button variant="tertiary"` (có viền/khối) +
   "Xóa" `text-danger` nổi thường trực → cụm dưới mỗi comment trông như hàng nút. Chuẩn (GitHub/YouTube): **text-link
   nhẹ** muted, hover mới rõ; destructive chỉ đỏ khi hover/confirm.
3. **Rác scale + icon cấm.** `InteractionBar` xài `@gravity-ui/icons` (vi phạm phosphor-only) + `gap-1.5 py-2.5
   size-3.5`; comment `gap-1.5 mt-0.5`.
4. **View/share count** dựng hẳn 1 hàng "Facebook stats" nặng cho 1 lượt xem → thừa; gộp 1 dòng meta gọn.

## 1. Khoanh vùng
| Khối | File | Trạng thái |
|---|---|---|
| Thanh tương tác (cảm xúc + save/share/fullscreen + counts) | `reuseable/Discussion/InteractionBar.tsx` | **trùng rail + gravity-ui + scale rác** |
| Item bình luận + action chips | `reuseable/Discussion/CommentItem.tsx` | chip tertiary nặng, Xóa đỏ thường trực |
| Composer (ô nhập + Đăng) | `reuseable/Discussion/CommentComposer.tsx` | ok (rà nhẹ) |
| Rail "Hành động" (bookmark/share/fullscreen) | `OnThisPage/ContentActions` | **nhà thật của actions** |
| Pager prev/next | `LessonReader/LessonPager` | **ỔN — giữ nguyên** (chỉ next hiện vì là bài đầu) |
| Link kết quả E2E | `LessonReader/E2eResultButton` | rà gọn thành 1 chip kết quả |
| Legacy `Discussion` chỉ có **1 consumer** (`ContentDiscussion`) → sửa an toàn | | |

## 2. Pain → Fix (ref)
| # | Pain | Fix | Ref |
|---|---|---|---|
| A | Lưu/Chia sẻ/Mở rộng **2 nơi** (bar + rail) | InteractionBar **chỉ giữ Cảm xúc + counts** (1 dòng); save/share/fullscreen **để rail** (`ContentActions`) là nhà. Mobile vẫn vào rail qua tab OnThisPage. | [[course-home-no-duplicate-surfaces]] |
| B | Chip action comment nặng | Trả lời/Sửa/Xóa/Ẩn = **text-link** (`variant="ghost"`/link, `text-muted hover:text-foreground`, Xóa `hover:text-danger`); cụm `gap-3`. | GitHub/YouTube comment actions · [[interactive-needs-hover]] |
| C | Bar 2 hàng Facebook nặng | Còn 1 hàng: trái = nút **Cảm xúc** (picker) + tổng; phải = view/share count nhỏ. Bỏ hàng tabs. | restraint / [[one-progress-bar-at-a-time]] tinh thần |
| D | gravity-ui + scale rác | `@gravity-ui`→**phosphor**; `1.5/2.5/3.5`→`2/3/4`. | icon rule + §8 |
| E | E2E link trơ cuối trang | gom **1 chip "Kết quả E2E · 12/12 pass →"** đặt liền sau content (trước discussion). | — |

## 3. Ba hướng + CHỐT
### H-1 — "Declutter + de-dupe Discussion" ✅ **CHỐT (làm trước)**
A+B+C+D: bar còn 1 hàng cảm xúc+counts (bỏ trùng actions), comment action = text-link nhẹ, dọn icon/scale.
- ✅ Trúng pain chính, rủi ro thấp (1 consumer), không đụng pager (đang ổn). Chữ "phần dưới" gọn hẳn.
### H-2 — "+ pager/e2e polish"
E: E2E → 1 chip kết quả gần content; rà composer spacing. Nhẹ, làm cùng/kế.
### H-3 — "Migrate legacy `Discussion` → features/blocks"
Tách khỏi `reuseable`, dựng `InteractionBar`/`CommentItem` thành block đúng 4-tầng. Đúng hướng dài hạn nhưng to → defer.

**Chốt: H-1 (+ E nhỏ của H-2). H-3 north-star.**

### ✅ ĐÃ DỰNG 2026-06-21 (thầy duyệt — H-1, 2 chỉnh)
Thầy: *"xúc đi; kết quả E2E chỉ nằm ở dưới thôi; cảm xúc dùng emoji thuần"*.
- **Cảm xúc = emoji THUẦN** (unicode 👍❤️😂😮😢😡): `ReactionEmoji` render `descriptor.emoji` thay sprite Facebook.
  **Xoá** `FacebookEmoji.tsx` + `facebook-emoji.css` (dead). (`fbType` trong constants giữ lại — data thừa vô hại.)
- **Hết trùng action**: `InteractionBar` còn **1 hàng** = trigger cảm xúc + picker + tổng (trái) · view count (phải).
  **Bỏ** tabs Lưu/Chia sẻ/Mở rộng (rail "Hành động" là nhà). Giữ `extends ActionBarProps` để KHÔNG phải sửa chuỗi
  wiring (Discussion/ContentDiscussion/ContentBodyV2) — bar nhận nhưng bỏ qua action props.
- **Comment action nhẹ**: Trả lời/Sửa/Xóa/Ẩn từ `Button variant="tertiary"` (viền) → **`Link` text** (`text-muted
  hover:text-foreground`; Xóa `hover:text-danger`; Ẩn `text-accent hover:underline`) + `cursor-pointer`.
- **Icon/scale**: `@gravity-ui` → phosphor `EyeIcon`; `1.5/2.5/3.5` → grid `2/3/4`.
- **E2E giữ NGUYÊN ở dưới** (bỏ phần E — không đưa lên gần content). LessonPager không đụng. tsc/lint sạch.
- Residual (follow-up): de-plumb hẳn action props khỏi Discussion/ContentDiscussion/ContentBodyV2 (giờ passed-but-ignored);
  bỏ `fbType` khỏi constants. H-3 migrate Discussion → blocks vẫn north-star.

---

## CÂU HỎI 2026-06-21 — Có nên TÁCH khối bình luận ra? (thầy hỏi)
Hiện: reaction + bình luận + pager xếp dọc liền dưới article (chỉ ngăn bằng `Separator` + heading "Bình luận (N)").
Vấn đề: bình luận là **cộng đồng/Q&A**, khác chất với nội dung học → có nên tách khỏi luồng đọc?

| Hướng | Là gì | ✅ | ❌ | Ref |
|---|---|---|---|---|
| **T-1 Inline, ngăn nhẹ** (hiện tại) | giữ dưới article, chỉ divider + heading | đọc xong → thảo luận tự nhiên, luôn thấy | trộn social vào trang đọc; trang dài | Dev.to / Medium |
| **T-2 Inline, KHUNG riêng** ✅ **đề xuất** | bọc cả khối thảo luận trong **surface/section riêng** (nền `bg-default` + heading + khoảng `gap-6`), vẫn dưới article | tách rõ "vùng cộng đồng" mà **không giấu** → giữ engagement (realtime/reaction StarCi đang đầu tư); rẻ | vẫn nối dài trang (chấp nhận được) | YouTube (comments block riêng) · Discourse embed |
| **T-3 Tab riêng** | đưa bình luận sang **tab "Thảo luận"** trong ContentTabBar (cạnh Nội dung/Thử thách), badge số | trang đọc gọn tối đa; tách hẳn | **giấu sau 1 click → giảm khám phá/engagement**; phải sửa ContentTabBar + state | Udemy/Coursera Q&A tab |

**Đề xuất T-2:** bình luận là Q&A theo bài có giá trị sư phạm + StarCi đã đầu tư realtime/reaction → **giữ inline để thấy**,
nhưng cho **khung riêng** (surface `bg-default` rounded + heading + nhịp `gap-6`) để mắt đọc ra "đây là vùng thảo luận,
khác bài học". Reaction (Yêu thích) GIỮ ngay dưới article (thuộc về nội dung); chỉ **comment** mới vào khung riêng.
Nếu mục tiêu là trang đọc tối giản tuyệt đối → T-3 (tab), nhưng đánh đổi engagement.

### ✅ ĐÃ DỰNG T-2 (2026-06-21, *"xúc t2"*)
`Discussion/index.tsx`: reaction bar giữ dưới article (1 `Separator` trên); **comment zone** (heading + composer +
list) bọc trong **`rounded-2xl border border-default bg-default p-6`** — khung surface riêng, ngăn vùng bằng `gap-6`.
Bỏ `Separator` giữa (khung đã tự tách). tsc/lint sạch.

### ✅ ĐÃ DỰNG — TÁCH KHỎI READING CARD (2026-06-21, *"nó dính nhau; yêu thích bỏ ra ngoài card; bình luận card dưới yêu thích"*)
Gốc: `LessonReader` bọc **cả body (article + reaction + comments) trong 1 `<Card>` đọc** → Yêu thích nằm "trong card",
comment là card-lồng-card, pager dính sát. Sửa = **kéo `ContentDiscussion` RA NGOÀI card**:
- `ContentBodyV2`: chỉ còn **article + sentinel** (mark-as-read). Gỡ `ContentDiscussion` + handler thừa
  (`onToggleFavorite/onShare/onFullscreen`) + hook thừa (`useContentOverlayState/useShareOverlayState/useMutateToggleFavoriteSwr/useGraphQLWithToast`).
- **De-plumb `ActionBarProps`** hẳn (sau H-1 đã vô dụng): gỡ khỏi `InteractionBar`/`Discussion`/`ContentDiscussion`.
  Save/share/fullscreen = **chỉ rail `ContentActions`** (self-contained, đã xác nhận). Bỏ `Separator` đầu Discussion.
- `LessonReader`: render `<ContentDiscussion>` + `<LessonPager>` + `<E2eResultButton>` trong **1 block
  `flex flex-col gap-6 pt-6 pb-6`** NGOÀI paper card → các khối rời, cách đều `gap-6`, hết dính. Gate `!isLocked && !isFullWidthTab`.
- Kết quả stack: **[paper card = bài] → Yêu thích (phẳng) → Bình luận (card) → Pager → E2E**, tất cả `gap-6`.
- Full FE `tsc` = 0 lỗi · lint sạch.

## 4. Cắt / Thêm
- **CẮT:** hàng tabs Lưu/Chia sẻ/Mở rộng trong InteractionBar (rail giữ); viền/khối chip comment; "Xóa" đỏ thường trực;
  hàng Facebook-stats; gravity-ui; rác `1.5/2.5/3.5`.
- **THÊM:** 1 dòng tương tác gọn (cảm xúc + counts); comment action text-link có hover; (H-2) chip kết quả E2E.
- **GIỮ:** LessonPager, composer, realtime socket, threaded replies, reaction picker.

## 5. States / a11y / ranh giới
- Mọi action vẫn reachable (save/share/fullscreen ở rail; mobile qua tab OnThisPage) — không mất chức năng.
- Destructive (Xóa) giữ confirm; màu đỏ chỉ ở hover (không gào). Buttons có aria-label; hover + cursor-pointer
  ([[interactive-needs-hover]]).
- Legacy Discussion 1 consumer → đổi an toàn; KHÔNG đụng data/socket/threading.
- Ref: GitHub/YouTube comment UI · design restraint.

### ✅ ĐÃ DỰNG — comment zone = block `LabeledCard` (2026-06-21, *"bình luận render dạng LabeledCard"*)
Thay surface tự dựng (`rounded-2xl border border-default bg-default p-6` + `<h2>`) bằng block chuẩn
**`LabeledCard`** (`@/components/blocks`): `label="Bình luận (N)"` (Label NGOÀI/trên card) + composer & list
trong `Card`/`CardContent` (`contentClassName="flex flex-col gap-6"`). Reaction bar vẫn ngoài (thuộc nội dung).
Đúng luật "Section card = block LabeledCard". tsc/lint sạch.

---

## CÂU HỎI 2026-06-25 — "comment xấu quá" + like để TRONG card content trên hay card khác?
> Hiện trạng (sau 2026-06-21): `InteractionBar` **FLAT** (pill cảm xúc + 👁 view) trôi nổi giữa reading card và
> `LabeledCard` "Bình luận (N)" (composer `TextArea rows=3` + list). Thầy: *"comment xấu quá, ý tưởng gì? like để
> trong card content trên hay card khác?"*. **Có widget mockup A/B kèm.**

### Pain
1. **Pill cảm xúc + "1" MỒ CÔI** — 1 hàng flat lửng lơ giữa 2 card, không thuộc khối nào.
2. **Composer = hộp xám bự rỗng** (`rows=3` luôn mở hết) → nặng, trống.
3. **Empty nghèo** ("Chưa có bình luận nào…" 1 dòng muted, thiếu icon/hint — không `EmptyContent` chuẩn).
4. **2 card bordered** (reading paper + comment LabeledCard) chồng dọc → "box nối box" ([[concepts/card]]).

### Like để đâu? (câu hỏi chính — phân biệt với 2026-06-21)
> Lưu ý: 2026-06-21 thầy bảo *"yêu thích bỏ RA NGOÀI card"* vì lúc đó cả body (article+reaction+comment) nằm trong
> **1 card** → reaction là **card-in-card** (lồng). Khác hẳn lần này: **footer-row có `border-t` BÊN TRONG card đọc
> KHÔNG phải card lồng** — chỉ là 1 divider-row cuối "tờ giấy" (kiểu Medium). Nên hướng A dưới KHÔNG tái phạm lỗi cũ.

Nguyên tắc nền: hành động đơn / 1 dòng meta **KHÔNG là 1 card riêng** ([[concepts/card]]) → cảm xúc tuyệt đối không nên là card thứ 3.

| Hướng | Là gì | ✅ | ❌ | Ref |
|---|---|---|---|---|
| **A — chân card đọc** ✅ đề xuất | move `InteractionBar` vào **footer reading Card** (`border-t`, cuối bài) | cảm xúc thuộc về BÀI → ở trong bounded object của bài; hết pill mồ côi; "trong card content trên" đúng ý thầy | chỉ hiện ở tab có reading card (Thử thách full-width không có — nhưng Discussion cũng vậy → hoà) | Medium (clap cuối bài) · Substack |
| **B — toolbar đầu card thảo luận** | gộp cảm xúc+view+đếm comment thành 1 `border-b` toolbar trên card "Thảo luận" | 1 khối community gọn | cảm xúc bị kéo khỏi bài → "react khu comment" (lệch nghĩa) | YouTube |

→ **Đề xuất A.** (Widget: A viền xanh.)

### Làm comment ĐẸP lại (áp cho cả A & B)
1. **Composer avatar-led collapse→expand**: idle = `[avatar][input pill "Đặt câu hỏi hoặc chia sẻ…"]` 1 hàng mảnh;
   focus → bung TextArea + Hủy/Đăng. Bỏ hộp xám rỗng. Ref YouTube/Substack/GitHub.
2. **Empty `EmptyContent` chuẩn**: icon `ChatsCircle` + title + hint ([[labeled-section-render-empty-not-self-hide]]).
3. **Khu thảo luận FRAMELESS** (label ngoài + composer + list flat, KHÔNG `<Card>`) → trang còn 1 card bordered
   (reading paper) → hết box-nối-box ([[concepts/card]]). Composer input vẫn bordered (vẫn có affordance).
4. **Nhãn** "Bình luận (N)" → **"Thảo luận · N"** (Q&A học tập, không phải comment MXH).

### Hướng CHỐT đề xuất
**A + 4 điểm trên**: cảm xúc → chân card đọc (border-t); khu **Thảo luận frameless** (composer avatar-led collapse→expand
+ empty chuẩn + list flat). Stack: **[reading paper card (+footer cảm xúc)] → gap → [Thảo luận phẳng]**. Hết mồ côi,
hết hộp rỗng, hết box-nối-box. → BE field đủ (§ data 2026-06-25), không thêm gì.

### Refs (2026-06-25)
- [25 Comment Thread Design Examples — Subframe](https://www.subframe.com/tips/comment-thread-design-examples)
- [UX Research for Comments Sections — FT/Medium](https://medium.com/ft-product-technology/ux-research-for-comments-sections-c5b58cea1ba5)
- Canonical: Medium · Substack · YouTube · GitHub Discussions.

### Cần thầy chốt
1. Like: **A (chân card đọc — đề xuất)** hay **B (toolbar đầu card thảo luận)**?
2. Khu thảo luận: **frameless (đề xuất)** hay giữ `LabeledCard`?
3. Đổi nhãn "Bình luận (N)" → "Thảo luận · N"?
