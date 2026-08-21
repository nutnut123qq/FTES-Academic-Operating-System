# avatar-circular-shape (delta)

## ADDED Requirements

### Requirement: Avatar là hình TRÒN ở mọi bề mặt

Mọi avatar người dùng SHALL hiển thị dưới dạng hình tròn hoàn chỉnh (`border-radius: 9999px`), ở cả
ba cỡ `sm` / `md` / `lg`, bất kể call site có tự thêm class bo góc hay không. Quy tắc SHALL được
khai MỘT lần ở tầng toàn cục thay vì rắc class lên từng call site, vì primitive avatar được dựng ở
hàng chục file và một chỗ bị sót sẽ không có gì báo lỗi.

Khối skeleton của avatar SHALL cùng hình dạng với avatar thật, để hình không đổi dạng lúc dữ liệu về.

#### Scenario: Avatar có ảnh

- **WHEN** một avatar hiển thị ảnh đã tải xong
- **THEN** ảnh bị cắt theo hình tròn, không còn góc bo vuông

#### Scenario: Avatar rơi về chữ cái đầu

- **WHEN** không có ảnh và avatar hiển thị ô chữ cái đầu
- **THEN** ô chữ cái đó cũng là hình tròn

#### Scenario: Skeleton rồi tới dữ liệu thật

- **WHEN** một danh sách đang hiện skeleton avatar rồi dữ liệu về
- **THEN** hình dạng KHÔNG đổi (tròn → tròn), chỉ nội dung đổi

### Requirement: Bộ khung viền tròn là VECTOR thật

Năm khung viền của thang hạng (bronze, silver, gold, crystal, diamond) SHALL là SVG vector thật —
hình học và gradient khai trực tiếp, KHÔNG nhúng ảnh raster base64.

Mỗi khung SHALL:

- nằm trong khung nhìn 512×512 với **tâm hoàn toàn trong suốt** (khung là trang trí quanh avatar,
  không được che mặt);
- đặt **mép trong của vòng ở r=191**, khớp với tỉ lệ overlay 132% (mép avatar rơi ở
  `512 / 2 / 1.32 = 193,9`) — vòng lấn vào ~3 đơn vị để không hở đường tóc;
- KHÔNG vẽ gì vượt quá **r=248**, để không hoạ tiết nào bị hộp 512 xén;
- giữ nguyên gam màu và **thứ tự hạng** của bộ cũ (bronze khiêm tốn nhất → diamond lộng lẫy nhất).

Bề rộng vòng SHALL tăng dần theo hạng, để hạng vẫn đọc được ở cỡ 32px — cỡ mà hoạ tiết chỉ còn vài
pixel và chỉ màu + độ dày vòng là còn phân biệt được.

#### Scenario: Khung đeo lên avatar

- **WHEN** một người đeo khung và avatar hiện ở bất kỳ bề mặt nào
- **THEN** vòng ôm sát mép avatar tròn, không hở khe, không đè lên khuôn mặt

#### Scenario: Avatar tí hon trên navbar

- **WHEN** avatar hiện ở cỡ 32px
- **THEN** khung vẫn đọc ra hạng bằng màu và độ dày vòng, không nhoè thành một vệt tối

### Requirement: Vòng SẠCH suốt chu vi, hoạ tiết gói trong một cung nhỏ ở đáy

Thân vòng SHALL sạch trơn suốt chu vi. Hoạ tiết SHALL gói trong **một cung nhỏ ở đáy** và SHALL
KHÔNG lặp lại quanh chu vi — không vòng nguyệt quế, không hàng mảnh vụn, không chuỗi hạt viền.

Đây là ràng buộc hình học, không phải sở thích: khung nhìn 512 cho ~1200 đơn vị chu vi nhưng chỉ
~57 đơn vị khoảng hở bán kính (r=191 → r=248). Mô-típ nào lặp quanh chu vi cũng thành **vân nhỏ
theo phương bán kính**, và vân nhỏ theo phương bán kính thì đọc ra **răng cưa** — bánh răng hoặc
nắp chai. Chỉnh góc nghiêng hay tăng mật độ chỉ làm nặng thêm.

Mô-típ nào **không nhận ra được ở 32px** thì SHALL không được vẽ. Hạng đã do màu và bề rộng vòng
gánh; hoạ tiết chỉ là điểm phân biệt phụ, không phải chỗ đổ công.

Hoạ tiết ở đáy SHALL không liếm vào vùng mặt: mép trong của nó SHALL nằm ngoài cả mép avatar
(r=193,9) lẫn đường viền trong của vòng.

#### Scenario: Nhìn lướt một khung ở cỡ vừa

- **WHEN** một người lạ nhìn khung ở cỡ ~240px
- **THEN** họ gọi nó là "vòng bóng có gắn đá", KHÔNG phải "bánh răng" hay "nắp chai"

#### Scenario: Thu về cỡ nhỏ

- **WHEN** khung thu về 32–48px
- **THEN** hoạ tiết ở đáy gọn thành một chấm duy nhất, KHÔNG thành quầng lởm chởm quanh vòng

### Requirement: File khung phải đọc được bằng bộ dò định dạng của pipeline ảnh

Mỗi file khung SHALL để thẻ `<svg>` nằm trong **1000 byte đầu** của file.

Lý do là hợp đồng công cụ: libvips (nền của `sharp`, thứ mà script sinh thumbnail dùng) chỉ dò 1000
byte đầu để nhận dạng SVG. Comment đầu file dài đẩy thẻ `<svg>` ra ngoài cửa sổ đó thì file vẫn hợp
lệ XML và trình duyệt vẫn vẽ được, nhưng `sharp` báo `Input file contains unsupported image format`
và script sinh thumbnail chết. Phần giải thích thiết kế SHALL nằm trong comment BÊN TRONG `<svg>`.

#### Scenario: Sinh thumbnail cho khung mới

- **WHEN** chạy script sinh thumbnail trên thư mục khung
- **THEN** cả 5 khung đọc được, không file nào bị từ chối vì "unsupported image format"

### Requirement: Avatar mặc định cắt tròn, KHÔNG vẽ lại nhân vật

Chín avatar mặc định SHALL có bản hình tròn dựng từ chính art gốc: cắt theo hộp alpha của ô vuông
bo góc rồi cắt tròn. Nhân vật (con sói FrosTES) SHALL không bị vẽ lại, tô lại, hay đổi biểu cảm.

Bản tròn SHALL **không có nền bịa thêm**: đường cắt phải rơi đúng trên mép của ô gốc, để không xuất
hiện viền ma hình vuông bo góc bên trong đường tròn.

#### Scenario: Chọn ảnh trong album mặc định

- **WHEN** người dùng mở màn chọn ảnh đại diện
- **THEN** mọi ô trong album là hình tròn, mặt sói còn nguyên, không thấy đường viền vuông mờ

### Requirement: Art mới đi đường dẫn MỚI, art cũ giữ nguyên

Art tròn SHALL được thêm ở đường dẫn mới thay vì ghi đè đường dẫn cũ, và art cũ SHALL còn nguyên
cho tới khi migration đổi con trỏ dữ liệu đã chạy xong trên production.

Lý do là hợp đồng vận hành, không phải sở thích: các đường dẫn này nằm trong cơ sở dữ liệu và được
phục vụ qua URL. Ghi đè cùng đường dẫn thì trong khoảng lệch deploy trình duyệt và CDN vẫn trả bản
cũ đã cache; xoá file cũ thì dữ liệu đang trỏ vào đó trả 404.

#### Scenario: Deploy FE trước, migration DB sau

- **WHEN** bản FE mới lên nhưng dữ liệu vẫn trỏ vào đường dẫn cũ
- **THEN** art cũ vẫn tải được bình thường, không có ảnh vỡ

### Requirement: Thumbnail phải khớp với art

Mỗi art mới SHALL có bản thumbnail WebP tương ứng do script sinh thumbnail tạo ra, vì các bề mặt
danh tính tải bản dẫn xuất chứ không tải file gốc. Thumbnail của art CŨ SHALL không bị đổi trong
cùng đợt, để bản cũ không đột nhiên khác đi trong lúc chờ migration.

#### Scenario: Sinh lại thumbnail

- **WHEN** chạy script sinh thumbnail sau khi thêm art mới
- **THEN** chỉ có thumbnail của art mới xuất hiện; thumbnail cũ không đổi nội dung
