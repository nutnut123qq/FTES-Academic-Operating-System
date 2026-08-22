# Tasks

## 1. Khảo sát — dựng lại đúng hai ảnh chủ dự án chụp

- [x] 1.1 Đọc `avatar-circular-shape-and-frames` trước: 30/33 task xong, còn 7.1 (migration DB —
      lane backend), 7.2 (xoá art cũ), **7.3 "xem thật trên trình duyệt — chưa làm"**. Hai lỗi này
      chính là phần 7.3.
- [x] 1.2 Loại trừ giả thuyết "sai thứ tự vẽ / bị xén": trong `FramedAvatar` thẻ `<img>` khung đứng
      SAU avatar, cùng `z-index: auto` ⇒ khung luôn ở TRÊN. Rà tổ tiên (`ThreadsPostRow`,
      `UserLink`, HeroUI `.button`): không chỗ nào `overflow-hidden`/`z-index`. **Không phải lỗi
      CSS.**
- [x] 1.3 Xác nhận dữ liệu vẫn trỏ art VUÔNG: backend có `V375__circular_avatar_and_frame_art.sql`
      trong source nhưng `target/classes/db/migration/` mới tới `V364` ⇒ **chưa chạy**. `grep -rn
      "-round" src` ⇒ FE không hề tự đổi con trỏ.
- [x] 1.4 Dựng lại lỗi khung: ghép `frames-frame-gold.webp` (bản app đang tải) ở 132% lên avatar
      tròn — ra đúng ảnh chụp: vành trong bị mép ảnh trùm ở 4 cạnh, hở nền ở 4 góc.
- [x] 1.5 Dựng lại lỗi avatar: cắt tròn `avatar-01..03-*.svg` (art vuông bo góc) ⇒ **lộ 4 múi
      `bg-default`**, mắt vẫn đọc ra hình vuông. CSS tròn của #252 đúng, nhưng cắt tròn một ô vuông
      bo góc thì không ra hình tròn.
- [x] 1.6 Đo cỡ hở 5 khung `-round` (720 tia, alpha > 128): mép trong 217,8 / 212,3 / 196,8 / 193,5 /
      200,8 — lệch nhau theo hạng, trong khi `w-[132%]` đòi 193,9. #253 đã phá hợp đồng r=191 của
      change trước ⇒ bronze/silver hở kể cả sau khi V375 chạy.

## 2. FE chuẩn hoá đường dẫn art cục bộ

- [x] 2.1 `src/utils/profileAsset.ts`: thêm `roundProfileArtUrl` (5 khung → `-round.svg`, 9 avatar
      → `-round.png`), kèm doc giải thích vì sao FE được đổi con trỏ do BE cấp.
- [x] 2.2 Idempotent: chỉ khớp tên art ĐỜI ĐẦU ⇒ sau khi V375 chạy là no-op, không đẻ
      `-round-round` rồi 404 im lặng.
- [x] 2.3 `UserAvatar`: gọi cho CẢ `src` avatar lẫn ảnh khung (`src` và nhánh dự phòng), đặt TRƯỚC
      bước lấy thumbnail. Ảnh tự tải lên / DiceBear không khớp mẫu ⇒ đi thẳng.
- [x] 2.4 Thêm case vào `src/utils/profileAsset.test.ts` (file test sẵn có cạnh util): đổi đúng
      khung + avatar, no-op khi đã `-round`, không đụng art lạ và ảnh tải lên, `null` → `null`.

## 3. Chỉnh cỡ hở của 5 khung về đúng hợp đồng r=191

- [x] 3.1 Thu thẻ `<image>` về giữa hộp 512 (`width`/`height`/`x`/`y`), **PNG giữ nguyên từng byte**
      — không re-encode nên không mất nét.
- [x] 3.2 Đo lại sau khi chỉnh: mép trong 191,0 / 191,0 / 191,0 / 191,0 / 191,3; mép ngoài 220,5 /
      218,5 / 240,0 / 244,0 / 235,3 — đều dưới trần 256, không hoạ tiết nào bị hộp xén.
- [x] 3.3 Comment tiếng Việt BÊN TRONG `<svg>` ghi lại phép đo; kiểm thẻ `<svg>` vẫn ở byte 0
      (luật libvips 1000 byte của change trước), `sharp` đọc lại được cả 5 file.

## 4. Thumbnail

- [x] 4.1 `npm run assets:profile-thumbnails` → 73 file; `git status` chỉ có đúng 5 file
      `frames-frame-*-round.webp` đổi, 68 file còn lại byte-identical.

## 5. Verify

- [x] 5.1 `npx vitest run src/utils/profileAsset.test.ts` → 7 tests xanh.
- [x] 5.2 Soi mắt bản THẬT SỰ ship (đúng file `.webp` app tải): ghép 5 khung lên avatar tròn
      `avatars-avatar-03-wink-round.webp` ở 240 / 96 / 48 / 36 / 32 px, nền sáng và nền tối — khung
      ôm sát, không hở vành nền, không bị xén.
- [x] 5.3 Soi mắt 9 avatar `-round` sau khi cắt tròn: tròn trọn vẹn, hết 4 múi `bg-default`.
- [ ] 5.4 `npx tsc --noEmit` + `npm run build` — **để phase VERIFY chung chạy** (phiên này có 3 lane
      chạy song song cùng thư mục, tsc incremental sẽ đá nhau).
- [ ] 5.5 Xem thật trên trình duyệt sau khi deploy — cần môi trường có đăng nhập.

## 6. Bàn giao / ngoài phạm vi

- [ ] 6.1 Chạy `V375__circular_avatar_and_frame_art.sql` trên môi trường đang dùng — **lane
      backend**. Sau khi chạy, `roundProfileArtUrl` thành no-op và có thể xoá cùng lúc với art cũ.
- [ ] 6.2 Xoá art vuông cũ + `roundProfileArtUrl` — CHỈ sau khi 6.1 đã chạy trên production.
- [ ] 6.3 Ghi lại cho lần thay art khung sau: art phải đặt **mép trong của vòng ở r=191** trong hộp
      512, nếu không `w-[132%]` sẽ hở. #253 thay art mà không đo lại nên lỗi này lọt.

## 7. HARDEN (2026-08-22) — biến 6.3 thành phép ĐO chạy được

- [x] 7.1 Thêm describe `frame art geometry` vào `src/utils/profileAsset.test.ts`: dùng `sharp`
      (đã là dependency mà `scripts/generate-profile-thumbnails.mjs` import, không thêm gói mới)
      render 5 file `public/gamification/frames/frame-*-round.svg` ra raw RGBA, bắn 360 tia từ tâm,
      lấy bán kính đầu/cuối có `alpha > 128`, rồi assert `max(inner)` trong `[188, 194]` và
      `max(outer) <= 248`. Assert theo MAX chứ không MIN vì trang trí ở chân khung cố ý thò vào tới
      r khoảng 137–153 — đo min sẽ ra fail giả.
- [x] 7.2 Số đo thật của bộ art hiện tại (chạy qua chính phép đo trên): inner
      191,5 / 192,0 / 192,0 / 192,0 / 191,5 · outer 221,0 / 219,0 / 240,5 / 243,5 / 235,5.
      Bộ art của đợt trước cho inner 217,8 / 212,3 / 196,8 / 193,5 / 200,8 — tức phép đo này sẽ ĐỎ
      với bộ art đó, đúng thứ đã lọt ra production trong im lặng.
- [x] 7.3 `npx vitest run src/utils/profileAsset.test.ts` → 12 test xanh (7 cũ + 5 mới).
