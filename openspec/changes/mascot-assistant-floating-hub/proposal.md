# Linh vật sói nổi là điểm vào DUY NHẤT của trợ lý AI

## Why

Điểm vào AI đang bị xé làm hai và cả hai đều mờ nhạt:

- **Menu tài khoản** có section "Khám phá" nhưng đến giờ chỉ còn ĐÚNG 1 dòng — "Trợ lý học tập
  FrosTES" → `/ai` (`EXPLORE_SHORTCUTS`, 3 dòng còn lại đã bị gỡ ở các change trước). Một section
  có tiêu đề riêng cho 1 dòng là chi phí điều hướng thuần: người dùng phải bấm avatar → đọc nhãn
  section → bấm dòng → mới thấy 7 công cụ AI nằm ở hub.
- **Linh vật nổi** ở góc phải dưới (`MascotAssistant`) thì lại chỉ đưa ra **3** trong số **8** tính
  năng AI (planner · CV · hub), nên 5 công cụ còn lại (summary · flashcards · quiz · debug ·
  cv-review) chỉ tồn tại nếu người dùng tự mò vào `/ai`.

Thêm nữa, ảnh linh vật đang dùng là `plain/greeting.webp` — ảnh TĨNH, động tác "vẫy tay" phải giả
lập bằng CSS xoay quanh chân (`.mascot-wave`, `rotate(-3deg → 4deg)`), đọc ra là lắc lư chứ không
phải vẫy. Đã có sẵn artwork động (`fes-mascot-wave.gif`, nền trong suốt, sói vẫy tay, loop vô hạn)
chưa ai dùng.

## What Changes

- **Đổi asset**: `public/fes-mascot-wave.webp` (animated WebP, convert từ GIF, 260×365, 23 frame,
  loop 0) làm ảnh chính, `public/fes-mascot-wave.gif` làm fallback qua `<picture><source>` cho
  trình duyệt không đọc animated WebP. Dùng `<img>` THUẦN chứ không `next/image`.
- **Menu linh vật gom ĐỦ 8 tính năng AI**, mỗi dòng là một câu gợi ý thân thiện ("Bạn muốn tạo lộ
  trình học không?"), khớp 1-1 với `TOOL_CATALOG` của AI hub + trang dựng CV.
- **Bong bóng chat chủ động**: tự hiện sau ~30–60s, lặp lại ngẫu nhiên 3–5 phút, tự ẩn sau 8s,
  bấm vào thì mở menu, tối đa 3 lần/phiên, không hiện khi menu đang mở.
- **Bồng bềnh thay cho vẫy giả**: `.mascot-wave` (xoay) → `.mascot-float` (translateY 5px, 3s) —
  động tác vẫy giờ nằm trong chính file ảnh. Cả hai đều tắt dưới `prefers-reduced-motion`.
- **Xoá section "Khám phá"** khỏi cả 2 menu tài khoản (authed + guest) và xoá file
  `explore-shortcuts.tsx` cùng nhánh i18n `profileMenu.*` giờ mồ côi.
- **Preload** WebP ở root layout để linh vật không bật lên muộn.

Không đụng: `ContentAiFab` (chat bám bài trên trang đọc — linh vật vẫn tự ẩn ở đó như cũ, quyết
định của chủ sản phẩm), mọi route `/ai/**`, mọi handler AI. Chỉ đổi ĐIỂM VÀO.

## Impact

- Affected specs: `mascot-assistant` (ADDED), `account-menu-gamification` (REMOVED),
  `app-shell-navigation` (MODIFIED)
- Affected code: `public/fes-mascot-wave.{webp,gif}` (mới),
  `src/components/features/mascot-assistant/{MascotAssistant.tsx,options.ts}`,
  `src/app/globals.css`, `src/app/[locale]/layout.tsx`,
  `src/components/features/navbar/Navbar/AccountMenuDropdown/**` (xoá `explore-shortcuts.tsx`),
  `src/messages/{vi,en}.json`
- **Không cần BE**: menu là danh sách route tĩnh, KHÔNG gọi `/ai/quotas/me` (panel hover không
  được phép chờ mạng, và mọi route trong danh sách luôn tồn tại bất kể quota).
- **Cân nhắc tải**: WebP 418KB tải trên MỌI trang vì được preload. Chấp nhận vì đây là artwork
  động do chủ sản phẩm chỉ định; đã hạ từ 360px xuống 260px bề ngang (hiển thị tối đa 130px nên
  260 vẫn dư cho màn 2x) để bớt 100KB so với bản convert nguyên cỡ.
