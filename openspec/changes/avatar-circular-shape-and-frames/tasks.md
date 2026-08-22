# Tasks

## 1. Khảo sát (trước khi vẽ)

- [x] 1.1 Xác định nguồn thật của hình vuông bo góc: HeroUI `@layer components` → `.avatar`
      `rounded-3xl` / `.avatar--sm` `rounded-2xl`. KHÔNG có `rounded-[24%]` nào trong `src/`.
- [x] 1.2 Giải mã 5 `frame-*.svg` + 9 `avatar-*.svg` → xác nhận cả 14 file là PNG base64 bọc `<svg>`
      (frame 1254×1254 / avatar 400×400), không phải vector.
- [x] 1.3 Nhìn art cũ: khung = vòng VUÔNG BO GÓC + vương miện đỉnh + nguyệt quế đáy ⇒ cắt tròn sẽ
      xén mất hoạ tiết ⇒ phải vẽ lại. Avatar = ô vuông bo góc nền phủ kín ⇒ cắt tròn an toàn.

## 2. Vẽ 5 khung viền tròn (vector thật)

- [x] 2.1 Dựng hình học theo tỉ lệ overlay `w-[132%]`: mép trong r=191, mép avatar r=193,9, trần
      hoạ tiết r=248.
- [x] 2.2 Vòng kim loại: viền tối ngoài + vòng gradient + viền tối trong + 2 cung sáng (chính ở
      góc trên-trái, phụ ở phải).
- [x] 2.3 ~~Nguyệt quế: cành + 2 hàng lá quét THEO vòng.~~ **LOẠI HẲN** — xem 2.7.
- [x] 2.4 ~~Vương miện vẽ SAU vòng, chân ở mép trong.~~ **LOẠI HẲN** — xem 2.7.
- [x] 2.5 Bề rộng vòng tăng dần theo hạng: 26 / 28 / 30 / 32 / 36.
- [x] 2.6 Đo chương trình: bán kính lớn nhất thực tế 234,9 → 252,8 (< 256, không bị xén);
      mực đè lên vùng mặt 0,36–0,79% (chỉ là chân vương miện lấn mép).

### 2.7 Vẽ lại lần 2 — "vòng bóng sạch + một mặt đá ở đáy"

Chủ dự án soi ảnh ghép 5 khung ở 240px và bác bản nguyệt quế: *bronze/gold đọc ra bánh răng hoặc
nắp chai; crystal/diamond rải mảnh vụn quanh vòng cũng vậy; vương miện của gold chỉ là một cái mấu;
silver đỡ nhất vì mang ít hoạ tiết nhất.*

- [x] 2.7.1 **Bỏ mọi hoạ tiết lặp quanh chu vi.** Lý do gốc + 5 hướng đã loại: xem mục "Hướng ĐÃ
      THỬ VÀ LOẠI" trong `proposal.md`. Tóm tắt: 1200u chu vi / 57u khoảng hở bán kính ⇒ mô-típ lặp
      = vân bán kính nhỏ = răng, không sửa được bằng góc nghiêng hay mật độ.
- [x] 2.7.2 **Bỏ vương miện ở cả 5 hạng** (mấu nhỏ tệ hơn vòng trơn; muốn ra hình phải rộng ~190u
      mà ở 32px vẫn chỉ cao 4,5px).
- [x] 2.7.3 Hoạ tiết duy nhất = **một mặt đá gắn ở 6 giờ**, ellipse rộng-hơn-cao (rx ≈ 1,45 × ry)
      + viền tối đậm + đá bên trong. Bề rộng không tốn ngân sách bán kính nên đá to ra được.
- [x] 2.7.4 Ngồi sâu vào vòng: tâm ở `r = Rout − 6`, `ry` chọn sao cho **mép trên đúng r=196** —
      hở mép avatar (193,9) và viền trong của vòng (tới 194,25). Bán kính lớn nhất 226 → 246.
- [x] 2.7.5 Bệ đá dùng **nửa TỐI** của gam màu, viên đá mới là chỗ sáng (bản đầu tô sáng cả hai →
      bạc/pha lê biến mất trên nền trang sáng).
- [x] 2.7.6 Thêm 1 rãnh khắc tròn (1 đường liền, không lặp) cho gold/crystal/diamond.
- [x] 2.7.7 **Bẫy đã dính:** comment đầu file dài đẩy thẻ `<svg>` xuống byte 1043 → libvips chỉ dò
      1000 byte đầu → `sharp` báo `unsupported image format` → script thumbnail chết. Chuyển phần
      giải thích vào comment BÊN TRONG `<svg>`; thẻ `<svg>` giờ ở byte 252.
- [x] 2.7.8 Soi mắt lại: ghép 5 khung lên avatar thật ở 240px (nền tối + nền sáng), 96/64/48/40px,
      và 32px. Đọc ra "vòng bóng có mặt đá", không còn răng.

## 3. Cắt tròn 9 avatar mặc định

- [x] 3.1 Thử 3 hướng, soi mắt từng bản:
      (a) thu nhỏ art rồi lấp nền phẳng → **hiện viền ma hình vuông bo góc** (nền gốc có vệt tối ở
      mép, không phẳng thật) — LOẠI;
      (b) nới nền bằng nhân bản pixel mép → **lông ngực bị kéo thành vệt xuống dưới** — LOẠI;
      (c) cắt theo hộp alpha rồi kéo về vuông 512 rồi cắt tròn → đường cắt rơi đúng mép ô gốc,
      không nền bịa, không viền ma — **CHỌN**.
- [x] 3.2 Xuất PNG palette 128 màu (so sánh cạnh nhau với truecolour ở 400px: không phân biệt được),
      18–29 KB/file thay vì 232–269 KB.

## 4. Hình dạng trên giao diện

- [x] 4.1 `globals.css`: `.avatar, .avatar--sm, .avatar--lg { border-radius: 9999px }` trong mục
      "Component overrides (UI 2.0)", kèm lý do vì sao là 1 khối toàn cục.
- [x] 4.2 Xác nhận overlay khung đã là `rounded-full` từ trước (`FramedAvatar`), không phải sửa.
- [x] 4.3 Rà các bề mặt avatar không đi qua primitive: `InitialsAvatar`, `SkeletonAvatar`,
      `AvatarUploadButton`, `AvatarCropDialog`, mentor `<img>` ở `CatalogCourseCard`,
      facepile `SubjectWorkspaceShell` — TẤT CẢ đã tròn sẵn.
- [x] 4.4 Kiểm cascade thật: biên dịch `globals.css` qua `@tailwindcss/postcss`, xác nhận HeroUI ở
      `layer components` còn rule mới **unlayered** ⇒ thắng.

## 5. Thumbnail

- [x] 5.1 `npm run assets:profile-thumbnails` → 68 file; `git status` chỉ có 14 file MỚI, 54 file
      cũ ra byte-identical (không đụng vào art cũ).
- [x] 5.2 Sau khi vẽ lại (2.7): chạy lại script, so sha256 trước/sau → **đúng 5 file
      `frames-frame-*-round.webp` đổi**, 63 file còn lại byte-identical; `git status` vẫn không có
      file tracked nào bị sửa trong `profile-thumbnails/`.

## 6. Verify

- [x] 6.1 Soi mắt bản THẬT SỰ ship (file `.webp` mà app tải): 5 khung đeo lên avatar ở 200px, và ở
      48/32px trên nền tối; 9 mặt tròn.
- [x] 6.1b Sau khi vẽ lại (2.7), soi lại đúng cách chủ dự án soi: ghép cả 5 khung lên avatar thật
      thành MỘT dải ở 240px (nền tối + nền sáng) và ở 32px, cộng thêm 96/64/48/40px, rồi nhìn
      thật. Cũng soi lại từ file `.webp` đã ship.
- [x] 6.2 `npx tsc --noEmit`
- [x] 6.3 `npx eslint` trên file đã đổi
- [x] 6.4 `npx vitest run src`

## 7. Bàn giao / ngoài phạm vi

- [ ] 7.1 Migration DB trỏ `profile.avatar_frames.asset_url` và `profile.default_avatars.image_url`
      sang đường dẫn `-round` — **lane backend**, danh sách đường dẫn đã bàn giao.
- [ ] 7.2 Xoá art cũ — CHỈ sau khi 7.1 đã chạy trên production.
- [ ] 7.3 Xem thật trên trình duyệt — chưa làm (phiên này không dựng dev server).

## 8. HARDEN (2026-08-22) — vá nợ sau vòng review đối kháng

- [x] 8.1 Năm bề mặt hồ sơ còn dựng `<Avatar><AvatarImage src={profile.avatarUrl}>` TRẦN đã đổi
      sang `UserAvatar` — tức là mới có art tròn, thumbnail WebP và guard uuid của `avatarInitials`:
      `app/[locale]/profile/edit/page.tsx` (avatar đầu trang; nó hiện VUÔNG ngay bên trên ô xem
      trước TRÒN của `AvatarAppearancePicker`), `ProfileShell/index.tsx` + `ProfilePublic/index.tsx`
      (nhánh `avatarFrameCode == null` — ca của đa số người dùng), `ProfilePublic/ProfileCommunityTab`
      và `ProfileCommunity/ProfileActivity` (hàng follower/following).
- [x] 8.2 `/profile/edit` giữ được preview blob khi đang upload: truyền `avatar={shownAvatar}`
      (= `preview ?? profile.avatarUrl`) vào `UserAvatar`; `blob:` không khớp mẫu art nên đi thẳng.
      `useEditProfileForm` trả thêm `profile` để tầng vẽ có `username`/`seed`/mã khung.
- [x] 8.3 `globals.css`: thêm `object-fit: cover` cho `.avatar__image` vào ĐÚNG khối override
      un-layered đang sửa radius. HeroUI không khai `object-fit`, mặc định của `<img>` là `fill`,
      nên ảnh người dùng TỰ TẢI LÊN không vuông bị bóp méo ở mọi bề mặt (FE không crop, BE không
      truyền `namedTransform`). Art album + DiceBear vuông 512 nên lỗi trốn được suốt hai đợt trước.
- [x] 8.4 `npx tsc --noEmit` sạch · `npm run test` 267 file / 1982 test xanh.
