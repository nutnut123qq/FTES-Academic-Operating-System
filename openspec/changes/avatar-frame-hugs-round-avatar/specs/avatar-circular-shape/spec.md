# avatar-circular-shape (delta)

## ADDED Requirements

### Requirement: Hình dạng tròn phải đúng ở CẢ hai tầng — khuôn cắt VÀ art bên trong

Một avatar SHALL chỉ được coi là tròn khi cả khuôn cắt lẫn art bên trong đều tròn. Khuôn cắt tròn
phủ lên art VUÔNG BO GÓC SHALL không được coi là đạt.

Đây là ràng buộc hình học, không phải sự thận trọng thừa: bốn góc của một ô vuông bo góc trong suốt
và **bo vào sâu hơn** đường tròn nội tiếp, nên sau khi cắt vẫn còn bốn múi nền lộ ra và mắt đọc ra
hình vuông. Quy tắc `border-radius` toàn cục KHÔNG tự cứu được art vuông.

#### Scenario: Người dùng đang đeo một ảnh trong album mặc định

- **WHEN** avatar của họ hiện ở bất kỳ bề mặt nào
- **THEN** đường viền ảnh là một đường tròn liền, không lộ múi nền ở bốn góc

### Requirement: FE tự chuẩn hoá đường dẫn art CỤC BỘ của chính nó

Khi FE vẽ lại một art nhận diện cục bộ và ship nó ở đường dẫn mới, FE SHALL tự đổi con trỏ art cũ
sang art mới thay vì chờ dữ liệu được migrate. Phép đổi SHALL:

- chỉ khớp đúng tên art ĐỜI ĐẦU, để khi migration chạy xong nó thành no-op (không sinh
  `-round-round` rồi 404 trong im lặng);
- KHÔNG chạm vào ảnh người dùng tải lên hay ảnh từ máy chủ ngoài;
- áp ở tầng primitive avatar, để mọi bề mặt cùng đổi một lần.

Lý do là ranh giới sở hữu: đường dẫn nằm trong cơ sở dữ liệu nhưng FILE art là tài sản của FE. Không
có phép đổi này thì mỗi lần FE đổi tên file art phải deploy DB cùng nhịp, và khoảng lệch deploy hiện
lên màn hình đúng như một cái lỗi.

#### Scenario: FE lên trước, migration DB chưa chạy

- **WHEN** bản FE mới đã lên nhưng dữ liệu vẫn trỏ vào art đời đầu
- **THEN** người dùng vẫn thấy art MỚI, không thấy art cũ

#### Scenario: Migration DB đã chạy

- **WHEN** dữ liệu đã trỏ thẳng vào art mới
- **THEN** phép đổi không làm gì cả, đường dẫn đi qua nguyên vẹn

## MODIFIED Requirements

### Requirement: Bộ khung viền tròn ĐO ĐƯỢC, hợp đồng r=191 áp cho MỌI art khung

Năm khung viền của thang hạng (bronze, silver, gold, crystal, diamond) SHALL đặt **mép trong của
vòng ở r=191** trong hộp 512 — khớp với tỉ lệ overlay 132% (mép avatar rơi ở `512 / 2 / 1,32 =
193,9`), vòng lấn vào ~3 đơn vị để không hở kẽ nền.

Ràng buộc này SHALL áp cho **mọi** art khung, kể cả art raster do người vẽ tay cấp, và SHALL được
**ĐO LẠI mỗi lần thay art** thay vì tin vào mắt: cỡ hở lệch nhau theo từng hạng là chuyện thường
gặp khi năm khung được vẽ rời, và ở cỡ nhỏ mắt không bắt được vành hở.

Khi art không đạt r=191, cách sửa SHALL là **chỉnh art** (thu/nới hình trong hộp 512), KHÔNG phải
gán cho mỗi hạng một tỉ lệ overlay riêng: một con số cho cả bộ thì mọi bề mặt cùng đúng một lần,
còn một bảng tỉ lệ theo mã hạng thì lần thay art sau quên sửa cũng không có gì báo đỏ.

Mỗi khung SHALL vẫn: nằm trong khung nhìn 512×512 với tâm hoàn toàn trong suốt; KHÔNG vẽ gì vượt
quá r=248; giữ gam màu và thứ tự hạng; để thẻ `<svg>` trong 1000 byte đầu file.

Khi chỉnh cỡ một art raster, phần ảnh SHALL được giữ nguyên byte (đổi khung đặt ảnh, không
re-encode) để không mất nét.

#### Scenario: Thay bộ art khung mới

- **WHEN** một bộ art khung mới được đưa vào
- **THEN** mép trong của cả năm khung được đo lại và chỉnh về r=191 trước khi ship

#### Scenario: Khung đeo lên avatar

- **WHEN** một người đeo khung và avatar hiện ở bất kỳ bề mặt nào
- **THEN** vòng ôm sát mép avatar tròn, không hở vành nền ở bất kỳ góc nào
