# learn-gate-uses-real-signals — khoá/mở nội dung phải theo tín hiệu thật, không theo cờ tĩnh

## Why

Ba chỗ trong đường "học thử / bị khoá / mở khoá" đang quyết định bằng tín hiệu SAI LOẠI. Cả ba đều
đánh vào đúng nhóm người dùng cần phục vụ nhất: người đã mua, và khách chưa đăng nhập.

**1. Sơ đồ tư duy tô "khoá" theo cờ nội dung, không theo quyền người xem.** `MindMap` phân loại học
phần bằng `l.isPremium` — mà `isPremium` map từ `!lesson.free`, tức **thuộc tính TĨNH của nội dung**
("bài này là bài trả phí"), đúng với mọi người xem kể cả người đã mua. Hệ quả: học viên ĐÃ MUA mở sơ
đồ vẫn thấy toàn bộ học phần premium tô xám kèm chú giải "Cần nâng cấp". Tín hiệu quyền THẬT của
người xem là `l.isLocked` (map từ `LessonView.locked`, per-viewer) — chính cái `ContentMap` đang dùng.

Cùng chỗ đó, bấm vào một node đang tô khoá vẫn `router.push` thẳng vào bài, trong khi `ContentMap`
chặn và mở `PackageGateModal`. Hai lối vào cùng một dữ liệu, hai hành vi khác nhau.

Chú giải `learn.mindMap.legend.locked` còn ghi "Cần nâng cấp" — trái luật nhà
`premium-unlock-is-enroll-not-vip` (mở khoá là ĐĂNG KÝ/mua khoá, không có hạng để nâng).

**2. Video xem thử phụ thuộc `accessLevel` — trường USER-SCOPED.** `useQueryLearnLessonSwr` chỉ mount
khối video khi `accessLevel === "PREVIEW"`. Khách chưa đăng nhập (hoặc BE trả `accessLevel: null`)
rơi ra ngoài: không có player, cũng không có CTA mua — mất sạch lối vào học thử của đúng nhóm cần mời
chào. Trong khi `LessonView` đã có `previewSeconds` (dữ liệu thật: 544/544 bài đều `900`) — thuộc
tính của NỘI DUNG, đọc được cho mọi người xem — mà FE chưa hề dùng.

**3. Cổng gói bỏ qua gói MIỄN PHÍ có slug khác `"free"`.** `PackageGateModal` lọc
`Number(pkg.salePrice) > 0`, nên một gói giá 0 (mà slug không phải `free`) bị loại khỏi danh sách →
modal chào **mua trọn khoá tính phí** trong khi người dùng chỉ cần nhận gói miễn phí đang mở khoá bài
đó. Nhánh `isFree` trong `PackageGateCard` vốn ĐÃ xử lý checkout giá 0 (thêm giỏ → checkout thẳng).

## What Changes

- **`MindMap` phân loại theo `isLocked`**: một học phần chỉ tô "khoá" khi người xem không mở được bài
  nào trong đó, thay vì "có bài trả phí". Người đã mua không còn thấy khoá.
- **`MindMap` mở node nhất quán với `ContentMap`**: vào bài ĐẦU TIÊN mở được của học phần; nếu không
  bài nào mở được (`accessLevel === "NONE"` toàn bộ) thì mở `PackageGateModal` như rail đang làm,
  không đẩy thẳng vào bài khoá.
- **Chú giải đổi copy** sang ngôn ngữ đăng ký khoá (vi + en), bỏ "Cần nâng cấp" / "Upgrade needed".
- **`hasVideo` thêm nhánh theo `previewSeconds > 0`** (thuộc tính nội dung) bên cạnh nhánh
  `accessLevel === "PREVIEW"`, để khách/`accessLevel: null` vẫn được mount player xem thử.
- **`PackageGateModal` bỏ điều kiện `salePrice > 0`** khi lọc gói mở khoá bài; gói giá 0 vẫn đi đúng
  nhánh `isFree` sẵn có.

## Impact

- Affected specs: `course-lesson` (ADDED).
- Affected code: `components/features/learn/MindMap/index.tsx`,
  `components/features/learn/hooks/useQueryLearnLessonSwr.ts`,
  `components/features/course/PackageGateModal/index.tsx`,
  `messages/vi.json`, `messages/en.json`.
- Không đụng BE.

## Non-goals

- Gộp `MindMap` và `ContentMap` về một nguồn quy tắc gate dùng chung (đáng làm, change riêng).
- Đổi cách BE tính `locked` / `accessLevel` / `previewSeconds`.
