# rich-comment-editor

## ADDED Requirements

### Requirement: Lỗi tải ảnh của editor phải nhìn thấy được
Khi cú tải ảnh từ nút ảnh trên toolbar hỏng, editor SHALL báo bằng toast lỗi giống hệt đường
"Thêm ảnh" của bộ chọn ảnh đính kèm. Editor SHALL KHÔNG nuốt lỗi vào console: người dùng chọn
file rồi không thấy gì xảy ra không phân biệt được với "app đơ".

Chuỗi thông báo SHALL nằm trong namespace i18n của chính editor, KHÔNG mượn namespace của bề
mặt gọi nó — editor là component dùng chung, kéo namespace của một bề mặt vào là buộc mọi bề
mặt khác phải mang theo khoá không thuộc về mình.

#### Scenario: Tải ảnh hỏng
- **GIVEN** người dùng đang soạn trong editor có nút ảnh
- **WHEN** họ chọn một file và cú tải lên thất bại
- **THEN** một toast lỗi hiện ra, và KHÔNG có ảnh nào được chèn vào nội dung

#### Scenario: Tải ảnh thành công
- **WHEN** cú tải lên thành công
- **THEN** ảnh được chèn vào nội dung tại vị trí con trỏ, không có toast lỗi

### Requirement: Một bề mặt soạn thảo chỉ có một lối thêm ảnh
Bề mặt nào đã render bộ chọn ảnh đính kèm riêng SHALL tắt nút ảnh trên toolbar của editor. Hai
lối cùng lúc là hai cơ chế khác nhau đặt cạnh nhau — một cái chèn ảnh vào thân markdown, một
cái gắn vào danh sách tệp đính kèm của bài — và người dùng không có cách nào biết mình đang
dùng cái nào.

Việc bật/tắt nút ảnh SHALL là một lựa chọn TƯỜNG MINH, không được suy ra từ mức toolbar: mặc
định giữ nguyên hành vi cũ để các bề mặt chỉ dùng editor (không có bộ chọn ảnh riêng) không âm
thầm mất nút.

Extension ảnh của editor SHALL được giữ nguyên kể cả khi nút bị tắt — bài cũ đã có cú pháp ảnh
trong thân vẫn phải render được.

#### Scenario: Composer có bộ chọn ảnh riêng
- **GIVEN** một composer vừa render editor toolbar đầy đủ vừa render bộ chọn ảnh đính kèm
- **WHEN** composer mở ra
- **THEN** toolbar không có nút ảnh, và chỉ còn đúng một lối thêm ảnh trên màn hình

#### Scenario: Bề mặt chỉ dùng editor
- **GIVEN** một bề mặt dùng editor toolbar đầy đủ mà KHÔNG có bộ chọn ảnh riêng
- **WHEN** bề mặt đó render
- **THEN** nút ảnh trên toolbar vẫn còn nguyên như trước

#### Scenario: Bài cũ có ảnh trong thân
- **GIVEN** một bài đã lưu từ trước, thân bài chứa cú pháp ảnh markdown
- **WHEN** bài đó được render bởi editor đã tắt nút ảnh
- **THEN** ảnh vẫn hiện đúng
