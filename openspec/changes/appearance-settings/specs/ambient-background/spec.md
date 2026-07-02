# ambient-background — Delta Spec

## ADDED Requirements

### Requirement: AmbientBackground nhận cấu hình từ appearance store

`AmbientBackground` SHALL vẫn là pure presenter, mở rộng props với `direction?: "rise" | "fall"` (mặc định `"fall"`). `InnerLayout` SHALL đọc `effectEnabled` + `effectDirection` từ appearance store (selector hẹp) và: render `AmbientBackground` với `direction` tương ứng khi bật, không render gì khi tắt. Điều kiện loại trừ route learn hiện có MUST giữ nguyên.

#### Scenario: Store tắt hiệu ứng

- **GIVEN** `effectEnabled = false` trong appearance store
- **WHEN** bất kỳ trang non-learn nào render
- **THEN** không có phần tử AmbientBackground nào trong DOM

#### Scenario: Store đổi hướng

- **GIVEN** hiệu ứng đang bật với `effectDirection = "fall"`
- **WHEN** store đổi sang `"rise"`
- **THEN** nền chuyển sang chế độ bay lên mà không cần reload trang

### Requirement: Hướng "rise" giữ nguyên hành vi hiện tại

Ở `direction="rise"`, hiệu ứng SHALL giữ đúng hành vi hiện có: đốm sáng tròn mọc từ mép dưới, keyframe `emberRise` (bay lên hết viewport, trôi ngang theo `--drift`, fade in/out), glow radial ôm mép dưới, màu `var(--accent)`.

#### Scenario: Chọn bay lên

- **WHEN** người dùng đặt hướng "Bay lên"
- **THEN** đốm sáng tròn bay từ đáy lên đỉnh với độ trôi ngang nhẹ, glow nằm ở đáy màn hình — nhìn giống hệt trước thay đổi này

### Requirement: Hướng "fall" hiển thị sao băng có vệt đuôi

Ở `direction="fall"`, mỗi spark SHALL render thành vệt sao băng: phần tử thuôn dài (cao ≈ 7 lần đường kính spark, bo tròn), gradient `var(--accent)` sáng ở đầu rơi và mờ dần về đuôi (đuôi sao chổi ngược hướng rơi), nghiêng nhẹ theo độ trôi ngang. Chuyển động SHALL dùng keyframe mới `meteorFall` trong `globals.css`: khởi hành trên mép trên viewport (opacity 0), fade in, rơi hết viewport xuống dưới kèm trôi chéo theo `--drift`, fade out. Glow radial SHALL chuyển lên mép trên viewport ở chế độ này.

#### Scenario: Nhìn thấy sao băng rơi

- **GIVEN** hiệu ứng bật với hướng "Rơi xuống như sao băng"
- **WHEN** người dùng nhìn nền trang
- **THEN** các vệt sáng thuôn dài màu accent rơi từ trên xuống, hơi chéo, có đuôi mờ dần phía trên — không phải đốm tròn

#### Scenario: Sao băng đổi màu theo accent

- **GIVEN** hướng fall đang hiển thị với accent xanh
- **WHEN** người dùng đổi accent sang hồng trong modal
- **THEN** vệt sao băng và glow đổi sang hồng ngay (cùng token `--accent`, không hard-code màu)

### Requirement: Mặc định hiệu ứng là bật + rơi xuống + accent xanh

Khi chưa có cấu hình lưu trữ, hệ thống SHALL mặc định: hiệu ứng BẬT, hướng `"fall"` (sao băng), accent `#3F51B5`. Giá trị `--accent` gốc trong `globals.css` (cả block light lẫn dark) MUST đổi sang `#3F51B5` để trạng thái không-attribute đã đúng mặc định mới.

#### Scenario: Lần ghé đầu tiên

- **GIVEN** trình duyệt sạch, chưa có localStorage
- **WHEN** trang chủ tải xong
- **THEN** nền hiển thị sao băng xanh #3F51B5 rơi xuống

### Requirement: Reduced-motion luôn thắng cấu hình

Khi `prefers-reduced-motion: reduce`, guard CSS SHALL vô hiệu hoá hiển thị của CẢ hai chế độ (class ember lẫn meteor: `animation: none` + `opacity: 0`), bất kể người dùng bật hiệu ứng trong cài đặt. Cài đặt trong store KHÔNG bị ghi đè (chỉ ép về mặt hiển thị).

#### Scenario: Hệ điều hành giảm chuyển động

- **GIVEN** người dùng bật hiệu ứng + hướng fall trong app, nhưng OS đặt reduce motion
- **WHEN** trang render
- **THEN** không spark/sao băng nào nhìn thấy hay chuyển động; khi OS tắt reduce motion, hiệu ứng hiện lại đúng cấu hình đã lưu

### Requirement: Deterministic seeding và hiệu năng thuần CSS được bảo toàn

Cả hai hướng SHALL dùng chung mảng spark seeded theo index (không `Math.random` lúc render) để server + client markup khớp (hydration-safe). Animation MUST thuần CSS (transform/opacity), không rAF/không JS loop, count mặc định 60 giữ nguyên.

#### Scenario: Không hydration mismatch ở chế độ fall

- **WHEN** trang SSR render rồi hydrate với hướng fall
- **THEN** console không có cảnh báo hydration mismatch; layout spark giống hệt giữa hai lần render cùng count

#### Scenario: Không vòng lặp JS

- **WHEN** hiệu ứng chạy ở bất kỳ hướng nào
- **THEN** không có requestAnimationFrame/interval nào do AmbientBackground đăng ký; toàn bộ chuyển động đến từ CSS keyframes
