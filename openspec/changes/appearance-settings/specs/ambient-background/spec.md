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

### Requirement: Hướng "fall" hiển thị sao băng rơi CHÉO có vệt đuôi

Ở `direction="fall"`, mỗi spark SHALL render thành vệt sao băng rơi theo quỹ đạo **chéo** (không phải rơi thẳng đứng): chuyển động kết hợp CẢ `translateX` LẪN `translateY` để đi trên một đường xiên canonical **từ trên-phải xuống dưới-trái** (top-right → bottom-left), độ nghiêng ~20–35° so với phương thẳng đứng. Phần tử vệt thuôn dài (cao ≈ 7 lần đường kính spark, bo tròn) với gradient `var(--accent)` sáng ở ĐẦU rơi và mờ dần về ĐUÔI (đuôi sao chổi ngược hướng chuyển động), và vệt SHALL được `rotate` để **trục dài của vệt nằm DỌC THEO hướng bay chéo** (đuôi trỏ ngược lại vector vận tốc) — đọc ra như một ngôi sao băng thật, không phải giọt rơi thẳng.

Chuyển động SHALL dùng keyframe mới `meteorFall` trong `globals.css`: khởi hành ngoài mép trên-phải viewport (opacity 0), fade in, đi chéo hết viewport xuống dưới-trái bằng `translateX` (âm, theo `--drift`) + `translateY` (dương) đồng thời, fade out. Góc `rotate` của vệt tính sẵn per-spark khớp với tỉ lệ (Δx, Δy) của quỹ đạo để trục vệt trùng phương bay. Glow radial SHALL neo ở góc trên-phải viewport ở chế độ này (nguồn phát sao băng).

Chế độ fall SHALL đọc như **MƯA SAO BĂNG dày** (không chỉ vài vệt lác đác): mật độ spark ở fall SHALL **cao hơn hẳn rise** — count fall ≈ **120** vs count rise ≈ **60** (giá trị tham chiếu; fall ≥ ~2× rise). Mọi spark thêm ở fall vẫn seeded theo index (hydration-safe, không `Math.random` lúc render) và vẫn có vệt đuôi rõ ràng. Base-duration mỗi spark ở fall SHALL đủ nhanh để rơi **dứt khoát** (≈ 4–7s/spark ở tốc độ `normal`, KHÔNG lê thê 8–18s), để tổng thể trông dồn dập như mưa sao băng thật.

#### Scenario: Fall = mưa sao băng dày, rơi chéo, tốc độ điều chỉnh được

- **GIVEN** hiệu ứng bật với hướng "Rơi xuống như sao băng"
- **WHEN** người dùng nhìn nền trang
- **THEN** có NHIỀU vệt sao băng (mật độ fall ~120, cao hơn hẳn rise ~60) cùng rơi theo đường CHÉO (từ trên-phải xuống dưới-trái), KHÔNG rơi thẳng đứng, mỗi vệt có đuôi mờ dần trỏ ngược hướng bay
- **AND** ở tốc độ `normal` mỗi vệt rơi dứt khoát (~4–7s), và đổi tốc độ (Chậm/Vừa/Nhanh) làm mật độ chuyển động thưa/dồn tương ứng — "Nhanh" cho cảm giác mưa sao băng dồn dập
- **AND** layout các vệt giống hệt giữa SSR và client (seeded deterministic, không hydration mismatch)

#### Scenario: Sao băng đổi màu theo accent

- **GIVEN** hướng fall đang hiển thị với accent xanh
- **WHEN** người dùng đổi accent sang hồng trong modal
- **THEN** vệt sao băng và glow đổi sang hồng ngay (cùng token `--accent`, không hard-code màu)

### Requirement: Người dùng điều chỉnh được TỐC ĐỘ hiệu ứng nền

Appearance modal SHALL cung cấp control tốc độ hiệu ứng nền với 3 mức **Chậm / Vừa / Nhanh** (`effectSpeed: "slow" | "normal" | "fast"`), render dạng radiogroup (a11y: `role="radiogroup"` + mỗi option `role="radio"` `aria-checked`, có nhãn i18n accessible), mặc định **Vừa (`normal`)**. Giá trị SHALL lưu vào appearance store (persist localStorage). `effectSpeed` SHALL map tới hệ số nhân `duration` của keyframe áp trên base-duration mỗi spark: `slow ≈ ×1.6`, `normal = ×1.0`, `fast ≈ ×0.55`. Hệ số SHALL áp cho CẢ hai hướng `rise` (`emberRise`) LẪN `fall` (`meteorFall`). **Base-duration SHALL đã đủ nhanh ở `normal`**: fall rơi dứt khoát ≈ **4–7s/spark** ở `normal` (KHÔNG 8–18s như bản cũ lê thê), nên `fast` (~×0.55 → ≈ 2.5–4s) cho cảm giác mưa sao băng dồn dập còn `slow` (~×1.6) vẫn nhẹ nhàng. Reduced-motion guard SHALL vẫn thắng (hiệu ứng tắt hẳn về mặt hiển thị bất kể tốc độ). Seeded deterministic + thuần CSS (transform/opacity, không rAF) MUST được bảo toàn — chỉ nhân duration, không đổi công thức seed.

#### Scenario: Đổi tốc độ nhanh/chậm hơn

- **GIVEN** hiệu ứng đang bật (hướng bất kỳ) với tốc độ "Vừa"
- **WHEN** người dùng chọn "Nhanh" trong Appearance modal
- **THEN** các spark chuyển động nhanh hơn (duration nhỏ hơn theo hệ số ×0.55) ngay lập tức, không cần reload
- **AND** chọn "Chậm" làm chúng chậm lại (duration lớn hơn theo hệ số ×1.6), và lựa chọn giữ sau reload

#### Scenario: Tốc độ áp cho cả hai hướng

- **GIVEN** người dùng đặt tốc độ "Nhanh"
- **WHEN** họ chuyển hướng giữa "Bay lên" và "Rơi xuống như sao băng"
- **THEN** cả hai chế độ đều chạy với hệ số nhanh (×0.55) — tốc độ độc lập với hướng

#### Scenario: Reduced-motion vẫn thắng tốc độ

- **GIVEN** người dùng đặt tốc độ "Nhanh" + hiệu ứng bật, nhưng OS bật reduce motion
- **WHEN** trang render
- **THEN** không spark/sao băng nào hiển thị hay chuyển động, bất kể tốc độ đã chọn

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

Cả hai hướng SHALL dùng chung công thức spark seeded theo index (không `Math.random` lúc render) để server + client markup khớp (hydration-safe). **Count phụ thuộc hướng**: rise ≈ **60**, fall ≈ **120** (fall dày hơn để đọc ra mưa sao băng) — cùng một hàm seed theo index, chỉ khác số lượng. Animation MUST thuần CSS (transform/opacity), không rAF/không JS loop.

#### Scenario: Không hydration mismatch ở chế độ fall dày

- **WHEN** trang SSR render rồi hydrate với hướng fall (count ~120)
- **THEN** console không có cảnh báo hydration mismatch; layout của cả 120 vệt giống hệt giữa SSR và client (seeded theo index)

#### Scenario: Không vòng lặp JS

- **WHEN** hiệu ứng chạy ở bất kỳ hướng nào
- **THEN** không có requestAnimationFrame/interval nào do AmbientBackground đăng ký; toàn bộ chuyển động đến từ CSS keyframes
