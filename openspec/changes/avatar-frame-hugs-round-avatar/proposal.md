# avatar-frame-hugs-round-avatar — khung viền ôm trọn avatar tròn, avatar hết vuông ở mọi nơi

## Why

Chủ dự án báo hai lỗi ngay sau đợt `avatar-circular-shape-and-frames` (#252 / #253):

1. *"Viền của hải bị avatar đè"* — ảnh chụp một bài trong Community: avatar tròn, khung viền vàng
   chỉ hiện một phần, vành trong bị mép ảnh trùm và nền hở ra ở bốn góc.
2. *"Avatar cho bo tròn nha, Kh phải vuông như này"* — ảnh chụp góc phải navbar: avatar vẫn đọc ra
   hình vuông bo góc.

Đợt trước để lại đúng một việc chưa làm: **task 7.3 "xem thật trên trình duyệt — chưa làm"**. Đây là
phần đó. Cả hai lỗi có CÙNG một gốc, cộng thêm một lỗi thứ ba mà mắt thường chưa bắt được.

### Gốc 1 — dữ liệu vẫn trỏ vào art VUÔNG (cả hai lỗi chủ dự án chụp)

Đợt trước ship 14 file art tròn ở đường dẫn MỚI (`-round`) và **bàn giao việc đổi con trỏ dữ liệu
cho lane backend** (task 7.1, cố ý để ngoài phạm vi). Migration đó đã được viết —
`V375__circular_avatar_and_frame_art.sql` có trong source backend — **nhưng chưa chạy trên môi
trường đang dùng** (`target/classes/db/migration/` mới chỉ có tới `V364`). Nên danh mục vẫn trả:

- `profile.avatar_frames.asset_url` → `/gamification/frames/frame-gold.svg` (vòng VUÔNG bo góc),
- `profile.default_avatars.image_url` + `profiles.avatar_url` → `/gamification/avatars/avatar-NN-*.svg`
  (ô VUÔNG bo góc).

Hệ quả từng lỗi:

- **Khung.** Khung vuông ở 132% bọc avatar tròn 100%: ở bốn cạnh mép tròn của ảnh trùm lên vành
  trong của khung, ở bốn góc thì hở nền — đúng "viền bị avatar đè".
- **Avatar.** CSS `.avatar { border-radius: 9999px }` của #252 **đã đúng và vẫn đang chạy** (kiểm ở
  mục "Đã đúng sẵn" bên dưới). Nhưng **cắt tròn một ô vuông bo góc thì KHÔNG ra hình tròn**: bốn góc
  của art trong suốt và bo vào SÂU HƠN đường tròn cắt, nên lộ bốn múi `bg-default` và mắt vẫn đọc ra
  hình vuông. Đã dựng lại đúng phép cắt để nhìn: bốn múi hiện rõ.

### Gốc 2 — `w-[132%]` là hợp đồng với art, và #253 đã phá hợp đồng đó

`avatar-circular-shape` (đợt trước) đặt ra ràng buộc: **mép trong của vòng phải ở r=191** trong hộp
art 512, vì overlay `w-[132%]` đặt mép avatar đúng ở `256 / 1,32 = 193,9`. #253 thay bộ vector đó
bằng art chủ dự án vẽ, và bộ art này có cỡ hở **lệch nhau theo từng hạng**. Đo trên chính file đang
ship (quét 720 tia, ngưỡng alpha 128):

| hạng | mép trong ĐO ĐƯỢC | cần overlay | ở 132% thì |
|---|---|---|---|
| bronze | 217,8 | 117,7% | hở một vành nền rộng ~12% bán kính |
| silver | 212,3 | 120,8% | hở rõ |
| gold | 196,8 | 130,3% | gần khít |
| crystal | 193,5 | 132,5% | khít |
| diamond | 200,8 | 127,8% | hở nhẹ |

Nghĩa là kể cả sau khi V375 chạy, bronze và silver vẫn KHÔNG ôm avatar. Lỗi này nằm sẵn trong art,
chưa ai báo vì chưa mấy ai đeo khung bronze.

## What Changes

### 1. FE tự chuẩn hoá đường dẫn art cục bộ (`src/utils/profileAsset.ts`)

Thêm `roundProfileArtUrl(url)`: `frame-{bronze,silver,gold,crystal,diamond}.svg` → `-round.svg`, và
`avatar-NN-*.svg` → `-round.png`. `UserAvatar` gọi nó cho CẢ ảnh avatar lẫn ảnh khung, ngay trước
bước lấy thumbnail.

**Vì sao FE được phép đổi con trỏ do BE cấp:** đường dẫn nằm trong DB nhưng FILE ART là tài sản của
FE (`public/gamification/`). Đây đúng là việc `profileAssetThumbnailUrl` đã làm từ trước — viết lại
đường dẫn art CỤC BỘ ngay tại FE thay vì bắt BE lưu sẵn đường thumbnail. Một hàm ở đây gỡ ràng buộc
"FE đổi tên file thì phải deploy DB cùng nhịp".

**Chạy hai lần vẫn ra một kết quả:** chỉ khớp đúng tên art đời đầu, nên khi V375 chạy xong hàm thành
no-op — không sinh `-round-round` rồi 404 trong im lặng. Xoá hàm khi art cũ bị dọn (task 7.2 của
change trước).

### 2. Chỉnh cỡ hở của 5 file `frame-*-round.svg` về đúng hợp đồng r=191

Mỗi file là một thẻ `<image>` bọc PNG. **PNG giữ nguyên từng byte** (không re-encode, không mất
nét); chỉ thẻ `<image>` được thu về giữa hộp 512:

| hạng | width/height | x = y | mép trong sau khi chỉnh | mép ngoài (trần 256) |
|---|---|---|---|---|
| bronze | 449,102 | 31,449 | 191,0 | 220,5 |
| silver | 460,740 | 25,630 | 191,0 | 218,5 |
| gold | 497,037 | 7,482 | 191,0 | 240,0 |
| crystal | 505,385 | 3,308 | 191,0 | 244,0 |
| diamond | 487,133 | 12,434 | 191,3 | 235,3 |

Kèm comment tiếng Việt BÊN TRONG `<svg>` (thẻ `<svg>` vẫn ở byte 0 — giữ luật libvips 1000 byte),
ghi lại phép đo để lần sau thay art không phải dò lại từ đầu.

**Vì sao sửa ở ART chứ không rắc mỗi hạng một tỉ lệ vào `FramedAvatar`:** một con số cho cả bộ thì
mọi bề mặt — feed, bảng xếp hạng, navbar, màn chọn khung — cùng đúng một lần; một bảng tỉ lệ theo mã
hạng thì lần thay art sau lại phải nhớ đi sửa bảng đó, và quên thì không có gì báo đỏ.

### 3. Sinh lại thumbnail

`npm run assets:profile-thumbnails` → 73 file, `git status` chỉ có đúng 5 file
`frames-frame-*-round.webp` đổi; 68 file còn lại byte-identical.

## Đã đúng sẵn — KHÔNG sửa (kèm bằng chứng)

**Thứ tự vẽ khung/avatar không hề sai.** Trong `FramedAvatar` thẻ `<img>` khung đứng SAU avatar
trong cây DOM, cả hai đều `position` với `z-index: auto`, nên theo thứ tự vẽ của CSS khung luôn nằm
TRÊN. Không có `overflow-hidden`, `z-index` hay stacking context nào của tổ tiên xén nó:
`ThreadsPostRow` để avatar trong cột `grid-cols-[48px_…]` (khung ở 36px avatar rộng 47,5px — vừa),
`UserLink` bọc bằng `inline-flex`, HeroUI `.button` có `isolate` nhưng không `overflow`. Không sửa
gì ở đây.

**CSS bo tròn của #252 vẫn đang chạy đúng.** `src/app/globals.css` khai
`.avatar, .avatar--sm, .avatar--lg { border-radius: 9999px }` **ngoài mọi `@layer`** (đếm ngoặc tới
dòng đó: 17 mở / 17 đóng — không nằm trong khối `@layer base`), còn HeroUI nạp `avatar.css` qua
`layer(components)`; style không-layer thắng mọi layer. Ba selector đó cũng là ĐỦ: `grep rounded`
trong `@heroui/styles/dist/components/avatar.css` ra đúng ba dòng, `.avatar--md` không khai radius.
Navbar cũng không có đường vẽ avatar nào đi vòng qua primitive (`grep` cả `navbar/`: chỉ `UserAvatar`
và `Avatar` của HeroUI). Không sửa gì ở đây.

## Non-goals

- Chạy migration V375 / deploy backend — vẫn là việc của lane backend. Đợt này chỉ làm cho FE đúng
  dù V375 chạy hay chưa.
- Vẽ lại art khung. #253 thay bộ vector bằng raster do chủ dự án vẽ; đợt này chỉ chỉnh CỠ, không
  động vào nét.
- Xoá art cũ (task 7.2 của change trước) — chỉ được xoá sau khi V375 đã chạy trên production.
