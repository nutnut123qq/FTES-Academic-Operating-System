# UX-BRAINSTORM — Content-map TRÁI "nhẹ" lại (nav docs, không phải list card) (2026-06-18)

> KHÔNG code — brainstorm + chốt. Trang đích: **rail content-map BÊN TRÁI** khi đọc bài
> (`features/learn/ModuleOutline` đang slot vào `LearnShell.leftRail`). Thầy: *"bên trái nhiều thông tin quá"*.
> Legacy = inventory. Mindset `main.md` §1 + skill `ui-ux-pro-max`.

---

## 0. TL;DR
- **Bug gốc (Pha 2):** trò *dời nguyên* `ModuleOutline` cũ (thiết kế cho rail **phải**, mỗi dòng là **CARD**:
  icon + tiêu đề to (pink, wrap 2–3 dòng) + **mô tả line-clamp-3** + **2 chip kéo** (phút·thử thách)) sang **trái**.
  Một nav docs bên trái phải **GỌN & QUÉT NHANH** (chỉ tiêu đề + tick), nên nó đang **quá tải**: 1 màn chỉ thấy
  ~2–3 bài, phải cuộn nhiều, mắt mỏi.
- **Chốt: L1 — rail = nav tree GỌN** (đọc thẳng `myCourseOutline`): mỗi dòng = **tick đã-đọc + tiêu đề (1–2 dòng) +
  (phút mờ bên phải)**, active tô accent. **CẮT mô tả, chip kéo, đếm challenge, tiêu đề cỡ to.** Mô tả/giàu thông
  tin ĐÃ sống ở **trang Chỉ mục `/learn`** + header bài — rail không lặp lại.
- Bonus: đổi data `modules` → `myCourseOutline` nên rail **hết "mù"** (tick đã-đọc MỌI dòng, không chỉ dòng active).

---

## 1. Hiện trạng (inventory) — mỗi dòng đang gánh gì

`ModuleOutline` → `ModuleAccordion` → **`ModuleContentRow`** render mỗi bài:
| Thành phần | Hiện có | Cần cho NAV? |
|---|---|---|
| KindIcon (free/premium) | ✓ | tick đã-đọc hữu ích hơn |
| `"{sortIndex}. {title}"` cỡ `body`, accent khi active | ✓ (wrap 2–3 dòng) | ✓ nhưng **phải gọn** |
| **Mô tả `line-clamp-3` muted** | ✓ | ✗ **bloat chính** |
| **Chip kéo (framer drag): phút đọc + số thử thách** | ✓ | ✗ vanity trong nav |
| ReadBadge | ✓ **chỉ khi active** | ✗ → cần tick cho MỌI dòng |
| Module header `"{sortIndex}. {title}"` semibold | ✓ (wrap 3 dòng) | ✓ nhưng gọn + thêm progress |
| `ContentSearch` autocomplete trên đầu | ✓ | ✓ giữ |

→ Một dòng cao ~120–150px. Docs nav chuẩn (GitBook/Mintlify/Sui): dòng ~28–36px, **chỉ tiêu đề**.

## 2. Dữ liệu khả dụng (grounded)
`myCourseOutline.modules[].lessons[]`: `title` · **`isRead`** · `minutesRead` · `difficulty` · `isPremium` ·
`challenges[]`. Active = `state.content.id`. → đủ cho rail gọn + progress-aware. (Mô tả `content.description` CÓ nhưng
**cố tình KHÔNG dùng** ở rail — để ở trang Chỉ mục/header.)

## 3. Điểm đau
1. **Mô tả 3 dòng/bài** = thủ phạm số 1 → rail dài, ít bài/màn, mất tính "bản đồ".
2. **Tiêu đề cỡ `body` + pink wrap 2–3 dòng** = quá "loud" cho nav (nav nên trầm, content mới nổi).
3. **Chip kéo phút·challenge mỗi dòng** = nhiễu thị giác + cử chỉ kéo lạ trong nav dọc.
4. **Tick đọc chỉ ở dòng active** → không thấy "đã đi tới đâu" khi liếc (dù BE có `isRead` mọi bài).
5. **Module header wrap 3 dòng** (tên dài) → block nặng đầu mỗi nhóm.
6. Tổng thể đọc như **danh sách thẻ giới thiệu**, không phải **cây điều hướng**.

## 4. Mục tiêu rail (job ≤5s)
Liếc là thấy: **toàn bộ map khóa · mình đang ở đâu (active) · đã đọc gì (tick) · nhảy 1 click**. Mật độ cao,
trầm, quét nhanh. KHÔNG đọc nội dung ở đây — đó là việc của cột content.

## 5. Hướng + CHỐT

### L1 — Nav tree GỌN ✅ **CHỐT**
Mỗi dòng bài = **[tick đã-đọc] {title}** (1 dòng, clamp-2 tối đa), active = `text-accent` + nền `bg-accent/10`;
phút đọc = số mờ nhỏ bên phải (tùy chọn); khoá premium = `LockIcon` nhỏ. **Bỏ mô tả + chip kéo + đếm challenge.**
Module header = tên gọn (clamp-2) + mini-progress `"3/8"` hoặc thanh mảnh. Giữ `ContentSearch`. Data = `myCourseOutline`.
- ✅ Đúng chuẩn docs, mật độ cao (~10–14 bài/màn), hết "mù" (tick mọi dòng), 1 nguồn data.
- Việc: dựng **`ContentMap` mới** (lean) thay `ModuleContentRow` nặng ở rail (chính là feature trò đã *hoãn* ở Pha 2).

### L2 — Lean mặc định, active mới "nở"
Mọi dòng gọn; **riêng bài active** hiện thêm mô tả 1 dòng. Hybrid.
- Bớt bloat nhưng vẫn nhảy layout khi đổi active; phức tạp hơn, lợi ích nhỏ → **loại** (mô tả đã có ở header bài).

### L3 — Rail siêu gọn + chi tiết dồn sang trang Chỉ mục
Rail chỉ title + tick (cực gọn). MỌI thứ giàu (mô tả, difficulty, challenge, điểm) sống ở **trang Chỉ mục `/learn`**
(đã dựng Pha 1) + header bài. → phân vai rạch ròi: **rail = đi lại, Chỉ mục = tổng quan giàu.**
- ✅ Sạch nhất về phân vai; thực chất = L1 ở mức tối giản nhất. **Gộp vào L1** (L1 đã bỏ hết phần giàu).

→ **CHỐT L1** (= L3 về tinh thần): rail lean, data `myCourseOutline`, chi tiết giàu nằm ở trang Chỉ mục/header.

### CHỐT chi tiết (thầy duyệt 2026-06-18)
- **Lesson row = `[tick đã-đọc] {title}` + `{phút}` mờ bên phải** (clamp-2 title, active `text-accent`+`bg-accent/10`,
  khoá premium `LockIcon` nhỏ). KHÔNG mô tả/chip kéo/đếm challenge.
- **Module header = `{title}` gọn + THANH PROGRESS MẢNH** (đã-đọc/tổng của module) — dùng `ProgressMeter`/thanh
  mảnh accent, KHÔNG dạng số.
- Data `myCourseOutline`; dựng `ContentMap` + block row `ContentMapRow` (props-only) thay `ModuleContentRow` ở
  leftRail + mobile drawer.

## 6. Section → dữ liệu (rail mới)
| Phần rail | Hiển thị | Nguồn |
|---|---|---|
| Search | ô tìm bài (giữ) | client filter |
| Module header | `{title}` gọn + mini-progress `read/total` | `modules[].title` + đếm `lessons[].isRead` |
| Lesson row | **tick đã-đọc** + `{title}` (clamp-2) + active accent + (phút mờ) + khoá | `lessons[].{isRead,title,minutesRead,isPremium}` |
| (bỏ) mô tả · chip kéo · đếm challenge | — | — |

## 7. Cắt / Thêm
- **CẮT khỏi rail:** mô tả (line-clamp-3) · chip kéo phút·challenge · tiêu đề cỡ `body` pink · KindIcon (thay bằng tick).
- **THÊM:** tick `isRead` MỌI dòng (CircleIcon/CheckCircle) · mini-progress/header module · active `bg-accent/10`.
- **GIỮ:** ContentSearch · click→điều hướng · auto-expand module đang đọc · sticky/scroll rail.
- **ĐỔI data:** `useQueryModulesSwr` (mù) → `useQueryMyCourseOutlineSwr` (progress) → đồng bộ với trang Chỉ mục + Profile.
- **Hệ quả:** `ModuleContentRow` nặng (drag/desc/chips) **về hưu** ở rail (giữ cho mobile drawer hay xoá — chốt khi /ux-apply).

## 8. Ranh giới / đừng-vỡ
- Mobile drawer (`LearnMobileBar`) cũng render `ModuleOutline` → thay luôn bằng `ContentMap` lean cho nhất quán.
- Không field BE mới. `ContentMap` đọc `state.course.id` + `state.content.id`; SWR `myCourseOutline` dedupe với
  pager/Chỉ mục (cùng key).
- Feature chỉ ghép + token màu; style ở block; tick/active = block row (vd `ContentMapRow` props-only) → đẹp & tái dùng.

→ Thầy duyệt **L1** → `/ux-apply` dựng `ContentMap` lean (thay `ModuleOutline` ở leftRail + mobile drawer). Feedback → `.claude/rules/drafts/`.
