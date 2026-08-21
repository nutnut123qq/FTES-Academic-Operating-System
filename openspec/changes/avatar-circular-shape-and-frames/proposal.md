# avatar-circular-shape-and-frames — avatar tròn ở mọi nơi, vẽ lại khung viền + avatar mặc định thành hình tròn

## Why

Chủ dự án chốt: *"đổi avata thành hình tròn, vẽ lại các cái khung và avata mặc định là hình tròn
luôn đi bạn, migrate lại"*.

Ba việc, ba lý do khác nhau:

1. **Hình avatar.** HeroUI v3 vẽ `.avatar` là **vuông bo góc** (`rounded-3xl`, riêng `--sm` là
   `rounded-2xl` — xem `node_modules/@heroui/styles/dist/components/avatar.css`). Với
   `--radius: 0.375rem` của app thì avatar `md` là ô 40px bo 18px. Đó là hình chủ dự án muốn bỏ.
   Đáng nói hơn: app hiện **KHÔNG nhất quán** — `SkeletonAvatar` đã là `rounded-full`, và 6 call
   site (`profile/edit`, `ProfileShell`, `ProfilePublic`, `ProfileActivity`, …) đã tự thêm
   `rounded-full`. Nghĩa là hôm nay skeleton tròn, ảnh thật vuông: lúc dữ liệu về thì hình ĐỔI DẠNG.

2. **Khung viền.** 5 file `public/gamification/frames/frame-*.svg` **không phải vector** — mỗi file
   là một thẻ `<svg>` bọc đúng một ảnh PNG base64 1254×1254 (1,5–1,9 MB/file). Art bên trong là
   **vòng vuông bo góc**, có vương miện ở đỉnh và vòng nguyệt quế ở đáy. Cắt tròn bằng CSS sẽ **xén
   mất cả vương miện lẫn nguyệt quế** — nên phải vẽ lại, không phải đổi `border-radius`.

3. **Avatar mặc định.** 9 file `avatar-*.svg` cũng là PNG-trong-SVG, nền là **ô vuông bo góc** phủ
   kín. Ở đây cắt tròn là an toàn (nền chạm mọi cạnh), nên **giữ nguyên nhân vật**, chỉ cắt lại.

## What Changes

### Art mới (đường dẫn MỚI, không ghi đè)

File cũ **giữ nguyên tại chỗ**. Migration đổi con trỏ DB nằm ở lane backend và deploy sau; nếu ghi
đè cùng đường dẫn thì trong khoảng lệch deploy trình duyệt/CDN sẽ trả art cũ đã cache, còn nếu xoá
thì DB trỏ vào 404.

- **5 khung viền — VECTOR THẬT** (`<circle>`/`<path>` + `linearGradient`, không nhúng ảnh), 512×512,
  tâm trong suốt, 5–10 KB/file thay cho 1,5–1,9 MB:
  `public/gamification/frames/frame-{bronze,silver,gold,crystal,diamond}-round.svg`
- **9 avatar mặc định — cắt tròn từ PNG gốc** (không vẽ lại con sói), 512×512 PNG palette 128 màu,
  18–29 KB/file: `public/gamification/avatars/avatar-{01..09}-{tên}-round.png`
- **Thumbnail** sinh lại bằng `npm run assets:profile-thumbnails` (script tự quét thư mục nên chỉ
  thêm 14 file `-round`, 54 file cũ ra byte-identical, không đụng vào).

### Hình dạng trên giao diện

- `src/app/globals.css` — thêm một khối override `.avatar, .avatar--sm, .avatar--lg { border-radius:
  9999px }` trong mục "Component overrides (UI 2.0)".

**Vì sao 1 khối toàn cục chứ không sửa từng call site:** `<Avatar>` được dựng ở ~60 file (`UserAvatar`
là chỗ chính, nhưng `AvatarGroup`, `UserCell`, `OnlinePresence`, các bảng xếp hạng… vẫn dùng trực
tiếp). Rắc class lên từng chỗ thì chỉ cần sót MỘT chỗ là app có hai kiểu avatar cùng lúc, và chỗ sót
không có gì báo đỏ. Khối override cũng là đúng khuôn có sẵn của file (`.switch__control`,
`.checkbox__control`, `.card`).

**Vì sao rule trần ăn được HeroUI:** HeroUI nạp component CSS trong `@layer components`
(`@heroui/styles/dist/index.css`), còn rule này **không nằm trong layer nào** — theo cascade layer,
style unlayered luôn thắng style trong layer. Đã kiểm bằng cách biên dịch thật `globals.css` qua
`@tailwindcss/postcss`: HeroUI ra `components :: .avatar => calc(var(--radius) * 3)`, rule mới ra
`(unlayered) :: .avatar, .avatar--sm, .avatar--lg => 9999px`.

### KHÔNG đổi

- Cách **chọn / mở khoá** khung (`useAvatarFrames`, catalog, điều kiện EXP/hạng mùa) — đợt này chỉ
  là art + hình dạng.
- Tỉ lệ overlay `w-[132%]` trong `UserAvatar` — art mới được vẽ **theo đúng tỉ lệ đó** (mép trong
  vòng r=191, mép avatar rơi ở r=193,9) nên khung cũ vẫn vừa trong lúc chờ migration.
- `profileAssetThumbnailUrl` — regex đã nhận cả `.png`, hậu tố `-round` đi qua nguyên vẹn.

## Non-goals

- Migration DB trỏ sang đường dẫn mới (lane backend làm, đã bàn giao danh sách đường dẫn).
- Xoá art cũ (chỉ được xoá sau khi migration đã chạy trên production).

## Ngôn ngữ thiết kế của bộ khung — "VÒNG BÓNG SẠCH, MỘT ĐIỂM NHẤN Ở ĐÁY"

Giữ gam màu và thứ tự hạng của bộ cũ. Vòng **sạch trơn suốt cả chu vi**; hoạ tiết duy nhất là
**một mặt đá gắn ở đáy (6 giờ)** — không lặp lại quanh vòng.

| hạng | bề rộng vòng | rãnh khắc | mặt đá ở đáy (rx × ry) | viên đá |
|---|---|---|---|---|
| bronze | 26 | — | 22 × 15 | đinh tán trơn |
| silver | 28 | — | 25 × 17 | 1 viên tròn (ngọc trai) |
| gold | 30 | có | 28 × 19 | 1 viên cắt giác |
| crystal | 32 | có | 31 × 21 | 1 viên cắt giác lớn hơn |
| diamond | 36 | có | 36 × 25 | 1 viên brilliant (có mặt bàn) |

Bề rộng vòng **tăng dần theo hạng** vì ở 32px (avatar navbar) hoạ tiết chỉ còn vài pixel — lúc đó
chỉ còn màu và độ dày vòng là đọc được hạng. Mặt đá ở đáy **rộng hơn cao** (rx ≈ 1,45 × ry): bề
rộng không tốn ngân sách bán kính, nên đá to ra được mà vẫn nằm trong trần r=248.

Mép trên của mặt đá đặt ở **r=196** — vừa đủ hở mép avatar (193,9) và đường viền trong của vòng
(tới 194,25), nên đá không bao giờ liếm vào mặt.

## Hướng ĐÃ THỬ VÀ LOẠI (đừng làm lại)

### 1. Vòng nguyệt quế / mảnh băng quét quanh chu vi — LOẠI (2 lần)

Bản 1 để lá chĩa thẳng ra ngoài; soi lại đọc thành răng cưa. Bản 2 "sửa" bằng cách **nghiêng lá
~56° và tăng số lá cho chúng chồng lên nhau** — làm răng DÀY HƠN, đẩy hình về phía "bánh răng /
nắp chai" chứ không quay lại "vòng nguyệt quế". Chủ dự án soi ảnh ghép 5 khung ở 240px và bác:
*bronze và gold đọc ra bánh răng; crystal và diamond rải mảnh vụn quanh vòng cũng vậy; silver đỡ
nhất chính vì nó mang ít hoạ tiết nhất.*

**Nguyên nhân gốc — ghi lại để khỏi thử lần thứ ba:** hộp 512 cho ~1200 đơn vị chu vi nhưng chỉ
~57 đơn vị khoảng hở bán kính (r=191 → r=248). Bất cứ mô-típ nào **lặp quanh chu vi** đều thành
**vân nhỏ theo phương bán kính**, và vân nhỏ theo phương bán kính thì **luôn** đọc ra răng. Không
phải lỗi hình dáng chiếc lá, không sửa được bằng cách chỉnh góc nghiêng hay mật độ — càng dày càng
giống bánh răng. Cách duy nhất là **thôi lặp quanh chu vi**.

### 2. Vương miện ở đỉnh — LOẠI

Vương miện cũ rộng 92u (18% đường kính) trên vòng dày 30u: ở 240px nó đọc ra **một cái mấu**, không
ra vương miện. Muốn nó ra hình thì phải rộng ~190u — mà ở 32px vẫn chỉ cao 4,5px, tức vẫn là mấu.
Theo luật "mô-típ không nhận ra được ở 32px thì đừng vẽ", **bỏ hẳn vương miện ở cả 5 hạng**; hạng
đã do màu + bề rộng vòng gánh. Mấu nhỏ còn tệ hơn vòng trơn.

### 3. "Bệ" (collar) loe dần ở đáy để đỡ mặt đá — LOẠI

Thử vẽ một mảng phình ra khỏi vòng ở ±24…32°, mép trong bám theo đường tròn ngoài của vòng. Nó để
lại **một đường nối chạy dọc thân vòng** rồi cụt ngang — trông như vết xước, chứ không như bệ đỡ.
Bỏ; mặt đá gắn thẳng lên vòng, viền tối đậm là đủ tách khỏi thân vòng.

### 4. Mặt đá màu SÁNG trên thân vòng — LOẠI

Bản đầu tô mặt đá bằng tông sáng của hạng: trên nền trang sáng thì bạc và pha lê **biến mất**. Đảo
lại: **bệ đá dùng nửa TỐI của gam màu, viên đá mới là chỗ sáng** — đúng cách trang sức thật đọc, và
tách bạch trên cả nền sáng lẫn nền tối.

### 5. Bẫy kỹ thuật — comment đầu file dài quá 1000 byte

Bản nháp đặt cả đoạn giải thích thiết kế trong comment **trước** thẻ `<svg>`, đẩy thẻ `<svg>` xuống
byte 1043. XML vẫn hợp lệ và trình duyệt vẫn vẽ được, **nhưng libvips (sharp) chỉ dò 1000 byte đầu**
để nhận dạng SVG → `sharp()` báo `Input file contains unsupported image format` → `npm run
assets:profile-thumbnails` chết. **Luật: giữ phần đầu file ngắn, đưa phần giải thích vào comment
BÊN TRONG `<svg>`.** Hiện thẻ `<svg>` nằm ở byte 252.
