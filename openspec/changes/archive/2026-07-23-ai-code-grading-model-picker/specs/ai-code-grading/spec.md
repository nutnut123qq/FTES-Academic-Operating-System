# ai-code-grading — Spec

## ADDED Requirements

### Requirement: Model picker cho chấm code
Panel chấm code SHALL cho chọn model từ `GET /api/v1/ai/models` (envelope `{code,message,data}`,
`data.models[] {id,label,provider,vision,pricing_hint}`, `data.defaults.chat`). Default =
`defaults.chat`. Danh sách cache 30 phút (SWR).

#### Scenario: Chọn model rồi chấm
- **WHEN** học viên chọn `deepseek/deepseek-chat` và bấm "Chấm bằng AI"
- **THEN** request `POST /api/v1/ai/coding/grade-code` mang `model: "deepseek/deepseek-chat"`
- **AND** kết quả hiển thị chip "Chấm bởi deepseek/deepseek-chat" + `model_note` từ response.

#### Scenario: Không chọn model
- **WHEN** học viên không đụng model picker
- **THEN** request KHÔNG gửi field `model` (hoặc null) → BE dùng default; chip hiển thị model
  thực tế từ `data.model` của response.

### Requirement: Kết quả thực thi tách khỏi kết quả chấm
Bảng test case (execution — khách quan, từ Judge0) SHALL hiển thị TÁCH BIỆT với điểm/nhận xét
(phụ thuộc model). Case fail hiển thị input, expected, actual, status.

#### Scenario: Code sai output
- **WHEN** response `execution.results[1] = {passed:false, status:"Wrong Answer", expected:"5", actual:"4"}`
- **THEN** hàng test case 2 hiển thị đỏ với expected `5` / actual `4`
- **AND** badge tổng "1/2 test PASS".

#### Scenario: SQL không thực thi
- **WHEN** `language = "sql"` (response `execution = null`)
- **THEN** ẩn bảng test case, hiện note "SQL chấm static analysis (không chạy test)".

### Requirement: Chấm lại với model khác
Sau khi có kết quả, panel SHALL có action "Chấm lại với model khác" mở lại model picker.

#### Scenario: So sánh 2 model
- **WHEN** đã chấm bởi model A và chấm lại bởi model B (code không đổi)
- **THEN** hiển thị kết quả mới của B kèm chip model B; phần execution giữ nguyên
  (được phép gửi `run_code_execution:false` ở lần 2 để tiết kiệm — execution không đổi).

### Requirement: Trạng thái chờ & lỗi
Chấm đồng bộ 10–60s. Panel SHALL hiển thị progress ("Đang chạy test case…" → "Đang chấm bằng
{model}…") và xử lý lỗi envelope: 503 `AI_CODE_DOWN` → "Hệ thống chấm đang bảo trì";
400 `AI_MODEL_NOT_ALLOWED` → reset picker về default; 502 `AI_CODE_GRADING_FAILED` → retry CTA.

#### Scenario: Service down
- **WHEN** BE trả `{code:"AI_CODE_DOWN"}` HTTP 503
- **THEN** panel hiện thông báo bảo trì + nút thử lại, KHÔNG mất code đang soạn.
