# challenge-uiux-editor Specification

## Purpose
TBD - created by archiving change challenge-uiux-editor. Update Purpose after archive.
## Requirements
### Requirement: Màn hình giải challenge UI/UX có editor HTML/CSS/JS

Hệ thống SHALL cung cấp route giải `/[locale]/challenges/[challengeId]` render `ChallengeView`; khi `challenge.type === "uiux"`, `ChallengeView` SHALL render một editor split-pane gồm pane soạn code (HTML, CSS, JS) và pane preview trực tiếp. Editor pane SHALL dùng `@monaco-editor/react` (đã có trong `package.json`) load động client-side, ba tab HTML/CSS/JS map sang ba Monaco model đúng `language`; MUST KHÔNG thêm dependency editor nặng mới. Nếu Monaco lỗi tải, hệ thống SHALL fallback về textarea phẳng có gợi ý cú pháp thay vì chặn người học.

#### Scenario: Mở challenge UI/UX và soạn code

- **GIVEN** người học đã enroll khoá, mở `/challenges/landing-redesign` với `type === "uiux"`
- **WHEN** trang tải xong
- **THEN** thấy editor split-pane với ba tab HTML/CSS/JS; gõ HTML/CSS vào tab tương ứng cập nhật được nội dung soạn

#### Scenario: Monaco lỗi tải thì fallback textarea

- **GIVEN** trình duyệt không tải được Monaco
- **WHEN** editor mount
- **THEN** hiện textarea phẳng có gợi ý cú pháp cho từng ngôn ngữ, người học vẫn nhập được code (không chặn giải bài)

### Requirement: Preview trực tiếp trong iframe sandbox, debounce

Hệ thống SHALL render kết quả code người học trong `<iframe>` với `sandbox="allow-scripts"` và KHÔNG `allow-same-origin`, dựng nội dung qua `srcDoc` ghép từ HTML + `<style>` CSS + `<script>` JS. Preview SHALL cập nhật theo cơ chế debounce (~400ms) sau khi ngừng gõ, không reload mỗi keystroke. Iframe MUST có `title` cho screen-reader. Khi `prefers-reduced-motion`, cập nhật preview MUST KHÔNG auto-scroll hay animate.

#### Scenario: Preview cập nhật sau khi ngừng gõ

- **GIVEN** editor đang mở với HTML/CSS ban đầu
- **WHEN** người học sửa CSS rồi ngừng gõ ~400ms
- **THEN** iframe preview vẽ lại theo code mới; các keystroke liên tiếp không gây reload từng ký tự

#### Scenario: Script học viên bị cô lập khỏi origin app

- **GIVEN** người học viết JS truy cập `localStorage`/`document.cookie` của trang
- **WHEN** preview chạy script trong iframe
- **THEN** iframe (`allow-scripts` không `allow-same-origin`) không đọc được storage/cookie của origin app, không ảnh hưởng trang chính

### Requirement: Panel target design và checklist yêu cầu

Editor SHALL có panel hiển thị ảnh reference/target design (`alt` mô tả) kèm checklist các yêu cầu map từ `challenge.requirements`, để người học đối chiếu UI mình dựng với thiết kế mục tiêu. Mỗi mục checklist MUST có nhãn đọc được và cho phép tự đánh dấu (mock). Ảnh target SHALL có skeleton khi đang tải.

#### Scenario: Đối chiếu với target và tick yêu cầu

- **GIVEN** editor UI/UX đang mở, có ảnh target và danh sách yêu cầu
- **WHEN** người học dựng xong một phần UI và tự đánh dấu một mục checklist
- **THEN** ảnh target hiển thị cạnh preview để so sánh, mục checklist được tick lại và giữ trạng thái trong phiên

### Requirement: Reset, format, autosave nháp cục bộ và submit stub

Editor SHALL có nút Reset (đưa code về starter và xoá nháp) và Format (định dạng code qua Monaco). Hệ thống SHALL autosave nội dung `{html, css, js}` vào `localStorage["ftesaos-uiux-draft:<challengeId>"]` theo debounce và hydrate lại khi mở lại (mock, per-challenge, per-device), kèm chỉ báo "đã lưu nháp". Nút Submit SHALL gọi mutation mock (`useMutateSubmitUiUxChallengeSwr`) chấm điểm phía FE và hiển thị kết quả; chấm điểm BE là GIẢ ĐỊNH — MUST được ghi rõ là mock.

#### Scenario: Autosave và khôi phục nháp sau reload

- **GIVEN** người học đã gõ code trong editor
- **WHEN** ngừng gõ (autosave chạy) rồi reload trang
- **THEN** code được khôi phục từ localStorage, chỉ báo "đã lưu nháp" hiển thị

#### Scenario: Reset về starter

- **GIVEN** người học đã sửa nhiều so với starter
- **WHEN** bấm Reset
- **THEN** code trở về starter của challenge và nháp trong localStorage bị xoá

#### Scenario: Submit chấm điểm mock

- **GIVEN** người học đã dựng UI và tick checklist
- **WHEN** bấm Submit
- **THEN** hệ thống hiển thị điểm/kết quả tính phía FE (mock), có chú thích chấm điểm là giả định BE

### Requirement: Responsive, gate enroll, states, i18n và a11y

Editor SHALL responsive: desktop split ngang (editor | preview + target), mobile stack dọc với tabs chuyển giữa Soạn / Xem trước / Đề bài. Khi challenge thuộc nội dung premium chưa mở, hệ thống SHALL chặn editor bằng overlay CTA mở khoá bằng **đăng ký khoá học** (enroll khoá chứa challenge), MUST KHÔNG dùng copy/route "VIP"/membership; free-enroll vẫn xem được đề và starter. Editor SHALL có loading skeleton phản chiếu layout, empty/error state, i18n đủ vi/en (`challenge.uiuxEditor.*`), và đạt a11y (iframe `title`, tabs `aria-label`, editor có nhãn, checkbox có nhãn, thứ tự focus hợp lý).

#### Scenario: Mobile chuyển giữa soạn và xem trước

- **GIVEN** viewport mobile
- **WHEN** người học chuyển tab "Xem trước"
- **THEN** pane preview chiếm khung, tab "Soạn" và "Đề bài" ẩn nội dung nhưng vẫn chuyển lại được

#### Scenario: Gate premium mở khoá bằng enroll, không VIP

- **GIVEN** challenge UI/UX thuộc nội dung premium và người dùng chưa mua khoá
- **WHEN** mở màn giải
- **THEN** editor bị overlay chặn với CTA "Đăng ký khoá học" trỏ trang khoá hiện tại, không có copy/vương miện "VIP"

#### Scenario: Song ngữ vi/en

- **GIVEN** app đang ở tiếng Anh
- **WHEN** người học mở editor UI/UX
- **THEN** mọi nhãn (tabs, toolbar, autosave, submit, gate, states) hiển thị tiếng Anh; chuyển sang tiếng Việt hiển thị đầy đủ tiếng Việt

