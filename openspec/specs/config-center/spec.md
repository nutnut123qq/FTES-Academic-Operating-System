# config-center Specification

## Purpose
TBD - created by archiving change config-center. Update Purpose after archive.
## Requirements
### Requirement: Config Center shell với nav danh mục, Super Admin gated

Hệ thống SHALL cung cấp một Config Center tại `/admin/config` như config-section của admin console, gồm nav 7 danh mục (`general`, `feature-flags`, `appearance`, `integrations`, `notifications`, `security`, `limits`) và panel nội dung, chỉ truy cập được bởi role `superAdmin`. Route MUST redirect `/admin/config` → danh mục mặc định (`general`) và deep-link `/admin/config/[category]` phải chọn đúng danh mục. Guard quyền MUST chạy TRƯỚC khi mount bất kỳ nội dung cấu hình nào — người không phải Super Admin (admin, moderator, member, guest) SHALL thấy forbidden surface (403-style), KHÔNG phải 404, và KHÔNG thấy dữ liệu cấu hình nào.

#### Scenario: Super Admin mở Config Center

- **GIVEN** người dùng có role `superAdmin`
- **WHEN** người dùng mở `/admin/config`
- **THEN** trang chuyển tới danh mục mặc định `general` và hiển thị nav 7 danh mục cùng tiêu đề "Trung tâm cấu hình"

#### Scenario: Admin thường bị chặn

- **GIVEN** người dùng có role `admin` (không phải `superAdmin`)
- **WHEN** người dùng mở `/admin/config`
- **THEN** hệ thống hiển thị forbidden surface báo không đủ quyền
- **AND** không có nội dung cấu hình (flag/setting) nào được render hay tải

#### Scenario: Khách bị chặn

- **GIVEN** khách chưa đăng nhập
- **WHEN** khách truy cập `/admin/config`
- **THEN** hệ thống hiển thị forbidden surface (không phải 404) và không lộ dữ liệu cấu hình

#### Scenario: Deep-link tới một danh mục

- **WHEN** Super Admin mở `/admin/config/limits`
- **THEN** nav đánh dấu danh mục "Limits/Quotas" là active và panel hiển thị nhóm setting của danh mục đó

### Requirement: Quản lý Feature Flags với trạng thái on/off/rollout, confirm và tìm kiếm

Danh mục `feature-flags` SHALL hiển thị danh sách feature flag, mỗi flag gồm `key`, mô tả, trạng thái `on` / `off` / `rollout` kèm `rolloutPercent` (0–100), và thông tin đổi lần cuối (`lastChangedBy` + `lastChangedAt`, mock). Đổi trạng thái bật↔tắt SHALL yêu cầu một bước xác nhận (confirm modal) trước khi áp; hủy xác nhận MUST giữ nguyên trạng thái cũ. Danh sách SHALL hỗ trợ tìm kiếm theo key/mô tả và lọc theo trạng thái. Dữ liệu SHALL đọc/ghi qua mock store (zustand + persist localStorage) sau một lớp service có chữ ký khớp BE config-service để swap remote-config chỉ đổi 1 chỗ.

#### Scenario: Bật một cờ cần xác nhận

- **GIVEN** một feature flag đang ở trạng thái `off`
- **WHEN** Super Admin đổi nó sang `on`
- **THEN** một confirm modal xuất hiện cảnh báo ảnh hưởng người dùng thật
- **AND** khi xác nhận, cờ chuyển `on` và `lastChangedBy`/`lastChangedAt` cập nhật (mock)

#### Scenario: Hủy xác nhận giữ nguyên trạng thái

- **GIVEN** confirm modal đang mở cho một cờ đang `off`
- **WHEN** Super Admin bấm Hủy
- **THEN** cờ vẫn ở trạng thái `off`, không có thay đổi nào được ghi

#### Scenario: Rollout theo phần trăm

- **GIVEN** một cờ ở trạng thái `rollout`
- **WHEN** Super Admin đặt `rolloutPercent` = 25
- **THEN** cờ hiển thị "rollout 25%" và giá trị được lưu vào mock store

#### Scenario: Tìm kiếm và lọc cờ

- **GIVEN** danh sách có nhiều cờ
- **WHEN** Super Admin gõ từ khóa vào ô tìm kiếm và chọn lọc trạng thái "on"
- **THEN** chỉ các cờ khớp key/mô tả và đang `on` được hiển thị
- **AND** nếu không cờ nào khớp thì hiển thị empty state

### Requirement: System settings dạng key-value có validate, save/reset, dirty-guard và audit note

Các danh mục ngoài `feature-flags` (`general`, `appearance`, `integrations`, `notifications`, `security`, `limits`) SHALL render form nhóm các setting với kiểu `text` / `number` / `select` / `toggle`. Mỗi field SHALL được validate theo ràng buộc của nó (required, min/max cho number, pattern cho text); lỗi MUST hiển thị cạnh field và chặn Lưu. Form SHALL có nút "Lưu" và "Đặt lại": Lưu ghi qua service (mock) và cập nhật audit note (ai/khi — mock), Đặt lại đưa giá trị nháp về giá trị đã lưu. Khi có thay đổi chưa lưu (dirty), hệ thống SHALL chặn việc rời danh mục/route bằng một xác nhận. Mỗi nhóm SHALL hiển thị audit note "sửa lần cuối bởi ai, lúc nào" (mock).

#### Scenario: Validate chặn lưu giá trị sai

- **GIVEN** một setting kiểu `number` có `max = 100`
- **WHEN** Super Admin nhập 250 rồi bấm Lưu
- **THEN** field hiển thị lỗi vượt giá trị tối đa và thao tác Lưu bị chặn

#### Scenario: Lưu thành công cập nhật audit note

- **GIVEN** Super Admin đã sửa một setting hợp lệ
- **WHEN** Super Admin bấm Lưu và service trả thành công (mock)
- **THEN** hiển thị toast thành công và audit note cập nhật thành "sửa lần cuối bởi bạn, lúc bây giờ" (mock)

#### Scenario: Lưu thất bại giữ nguyên bản nháp

- **GIVEN** Super Admin đã sửa một setting hợp lệ
- **WHEN** bấm Lưu và service mô phỏng lỗi
- **THEN** hiển thị toast lỗi và giá trị nháp vẫn giữ nguyên để thử lại

#### Scenario: Dirty-guard chặn rời khi chưa lưu

- **GIVEN** form có thay đổi chưa lưu
- **WHEN** Super Admin bấm sang danh mục khác hoặc rời route
- **THEN** một xác nhận "có thay đổi chưa lưu" xuất hiện; ở lại thì giữ nháp, rời đi thì bỏ nháp

#### Scenario: Đặt lại xóa trạng thái dirty

- **GIVEN** form đang dirty
- **WHEN** Super Admin bấm Đặt lại
- **THEN** mọi field trở về giá trị đã lưu và form không còn dirty (rời danh mục không bị chặn)

### Requirement: Scope selector stub cho Global và environment (deferred)

Config Center SHALL hiển thị một scope selector ở đầu shell với các lựa chọn `Global` (mặc định), `Production`, `Staging` như một stub hướng tới tương lai. Ở giai đoạn này chỉ `Global` SHALL có dữ liệu cấu hình thực; chọn một environment khác SHALL hiển thị trạng thái "cấu hình theo môi trường sắp có" và MUST KHÔNG cho lưu hay ghi đè dữ liệu Global. Việc tách store cấu hình per-environment là DEFERRED (thuộc BE config-service).

#### Scenario: Chọn Global hiển thị cấu hình thực

- **GIVEN** scope đang là `Global`
- **WHEN** Super Admin mở một danh mục setting
- **THEN** các setting thực (mock) của Global được hiển thị và có thể lưu

#### Scenario: Chọn environment khác hiện trạng thái sắp có

- **GIVEN** Super Admin đang xem một danh mục
- **WHEN** đổi scope sang `Production`
- **THEN** panel hiển thị trạng thái "cấu hình theo môi trường sắp có" và không cho lưu
- **AND** dữ liệu cấu hình của `Global` không bị thay đổi

### Requirement: Trạng thái loading, empty và error của Config Center

Config Center SHALL xử lý đủ các trạng thái không-lý-tưởng: khi đang tải cấu hình hiển thị skeleton phản chiếu layout (nav + panel); khi một danh mục không có setting/flag nào hiển thị empty state; khi tải hoặc lưu thất bại hiển thị error state có hành động thử lại. Chrome tĩnh (breadcrumb, nav khung) MUST nằm ngoài skeleton dữ liệu.

#### Scenario: Skeleton khi đang tải

- **GIVEN** cấu hình của danh mục đang được tải (mock delay)
- **WHEN** panel render
- **THEN** hiển thị skeleton phản chiếu bố cục nav + panel, không nhấp nháy nội dung thô

#### Scenario: Empty state cho danh mục trống

- **GIVEN** một danh mục không có setting/flag nào (mock)
- **WHEN** Super Admin mở danh mục đó
- **THEN** hiển thị empty state mô tả chưa có cấu hình, không phải bảng trống lỗi

#### Scenario: Error state khi tải hỏng

- **GIVEN** service trả lỗi khi tải một danh mục (mock)
- **WHEN** panel render
- **THEN** hiển thị error state với nút thử lại; bấm thử lại gọi lại service

### Requirement: Responsive, i18n admin.config.* và a11y của Config Center

Config Center SHALL responsive: desktop bố cục 2 cột (nav rail + panel), mobile nav thu gọn thành dropdown/drawer và panel chiếm toàn chiều rộng. Mọi chữ trong shell, nav, flag, form, confirm, toast và forbidden surface SHALL lấy từ cụm khóa `admin.config.*` với bản dịch đủ ở `vi.json` và `en.json`. Về a11y: nav SHALL là landmark có nhãn; mỗi form field SHALL có label liên kết và lỗi được announce; confirm modal SHALL focus-trap và đóng bằng Esc; radiogroup trạng thái flag và scope selector SHALL có nhãn truy cập được.

#### Scenario: Nav thu gọn trên mobile

- **GIVEN** viewport mobile
- **WHEN** Super Admin mở Config Center
- **THEN** nav danh mục thu gọn thành dropdown/drawer và panel chiếm toàn chiều rộng

#### Scenario: Chuyển ngôn ngữ vi/en

- **GIVEN** Config Center đang hiển thị tiếng Việt
- **WHEN** Super Admin chuyển locale sang English
- **THEN** toàn bộ nhãn (tiêu đề, tên danh mục, nhãn flag/setting, nút Lưu/Đặt lại, thông điệp confirm/toast, forbidden) hiển thị tiếng Anh, không key thô nào lộ ra

#### Scenario: Điều hướng bàn phím và screen reader

- **GIVEN** người dùng dùng bàn phím và screen reader
- **WHEN** người dùng Tab qua nav, danh sách flag và form
- **THEN** nav được đọc là landmark có nhãn, mỗi field đọc được label và lỗi (nếu có), và confirm modal giữ focus bên trong đến khi đóng bằng Esc hoặc nút

