# content-ai-multimodel-chat — Delta Spec

## ADDED Requirements

### Requirement: Model picker trong composer lấy catalog từ backend

`ContentAiComposer` SHALL render một model picker trong composer-box, lấy danh sách model từ `GET /api/v1/ai/models` qua hook `useQueryAiModelsMetaSwr`. Model mặc định MUST là GPT-OSS-120B (`openai/gpt-oss-120b`) — model đầu tiên có `defaultFor` chứa `"chat"`, hoặc hằng `DEFAULT_CHAT_MODEL` khi catalog chưa tải. Model đã chọn SHALL lưu qua `useContentAiSelectedModel` (chung nguồn với settings) và forward xuống `useContentAiStream.ask` dưới dạng `model` + `provider` (mode `"premium"`); khi người dùng để mặc định, `ask` SHALL dùng `mode:"auto"` với `model:null`. Việc auto-set mặc định MUST chỉ chạy khi chưa có lựa chọn (`selectedModel == null`) để không ghi đè lựa chọn của người dùng.

#### Scenario: Danh sách model tải từ backend, mặc định GPT-OSS-120B

- **GIVEN** người học mở panel Content-AI lần đầu trong phiên
- **WHEN** composer render và catalog tải xong
- **THEN** model picker hiển thị các model từ backend và model đang chọn là GPT-OSS-120B

#### Scenario: Đổi model áp cho câu hỏi kế

- **GIVEN** người học đang chọn GPT-OSS-120B
- **WHEN** người học mở picker và chọn một model khác rồi gửi câu hỏi
- **THEN** câu hỏi được stream với `model`/`provider` của model vừa chọn (mode "premium"), không phải chuỗi mặc định

#### Scenario: Catalog lỗi vẫn dùng được mặc định

- **GIVEN** `GET /api/v1/ai/models` trả lỗi hoặc rỗng
- **WHEN** người học gửi câu hỏi
- **THEN** chat vẫn hoạt động ở model mặc định GPT-OSS-120B, và picker hiển thị thông báo `contentAi.modelLoadError` thay vì crash

### Requirement: Composer là một box chứa input flat + hàng controls

`ContentAiComposer` SHALL là một box bounded duy nhất chứa (1) ô nhập flat (`<textarea>` nền trong suốt, KHÔNG HeroUI Input) và (2) một hàng controls bên trong box gồm model picker, nút Cài đặt (⚙) và nút Gửi. Model picker MUST mở lên trên (`placement="top start"`). Nút ⚙ và Gửi MUST là icon-only có `aria-label`. Panel MUST KHÔNG có toolbar điều khiển ở đầu.

#### Scenario: Bố cục composer

- **WHEN** người dùng quan sát cụm nhập của panel chat
- **THEN** thấy một box duy nhất: ô nhập ở trên, hàng [model picker · ⚙ · gửi] ở dưới, tất cả trong cùng viền box; không có hàng controls trần tách rời và không có toolbar ở đầu panel

### Requirement: Nhiều cuộc hội thoại (multi-session) trong panel

`ContentAiChat` SHALL hỗ trợ nhiều cuộc hội thoại: view danh sách hội thoại (tìm kiếm + cuộn vô hạn + tạo mới + xoá từng cuộc) và view cài đặt render IN-PANEL (KHÔNG Drawer/Modal body-level, tránh z-fight popover-on-popover). Cuộc mới SHALL lazy-create — chỉ tạo session khi gửi tin đầu. Thread SHALL hydrate theo `sessionId` và MUST KHÔNG reset trong effect theo `sessionId` (chỉ reset trong handler chuyển/tạo cuộc) để không xoá turn vừa gửi khi create-mid-send.

#### Scenario: Tạo cuộc mới không đẻ session rỗng

- **GIVEN** người dùng bấm "Cuộc trò chuyện mới"
- **WHEN** thread rỗng và người dùng chưa gửi gì
- **THEN** chưa có session nào được tạo ở backend; session chỉ được tạo khi tin nhắn đầu tiên được gửi

#### Scenario: Chuyển cuộc không mất tin vừa gửi

- **GIVEN** người dùng vừa gửi câu hỏi trong một cuộc mới (session vừa được lazy-create)
- **WHEN** câu trả lời đang stream
- **THEN** turn vừa gửi không bị xoá khỏi thread (reset chỉ xảy ra khi chủ động chuyển/tạo cuộc)

#### Scenario: Overlay phụ render trong panel

- **WHEN** người dùng mở view "Cuộc trò chuyện" hoặc "Cài đặt" từ trong panel chat (popover)
- **THEN** view đó trượt che nội dung panel (in-panel) chứ không mở Drawer/Modal riêng, và không bị popover chat đè z-index
