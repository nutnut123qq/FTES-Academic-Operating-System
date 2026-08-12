# Design — linh vật sói nổi là điểm vào duy nhất của trợ lý AI

## Context

`MascotAssistant` đã tồn tại (mount 1 lần ở `InnerLayout`, tự ẩn trên route đọc bài và trên
`/community` dưới `xl` vì hai chỗ đó đã có FAB riêng chiếm góc phải dưới). Change này giữ nguyên
khung đó và đổi 4 thứ: ảnh, danh sách tính năng, chuyển động, và bong bóng chủ động — cộng với
việc dọn lối vào AI trùng lặp trong menu tài khoản.

## Goals / Non-Goals

- **Goals**: 1 điểm vào AI duy nhất trên mọi trang, phơi đủ 8 tính năng, linh vật vẫy tay THẬT
  (ảnh động), mời gọi tương tác mà không nag, không phá CLS.
- **Non-Goals**: đụng `ContentAiFab`/chat bám bài, đổi bất kỳ route hay handler AI nào, gọi quota
  BE để lọc danh sách, làm lại `/ai` hub.

## Decisions

### 1. `<picture>` + `<img>` thuần, KHÔNG `next/image`

`next/image` chạy qua image optimizer → ảnh động bị dẹp còn 1 khung hình, và component không có
cách nào phát ra `<source type="image/webp">` để khai báo fallback. Nên: `<picture><source
srcSet=".webp" type="image/webp" /><img src=".gif" /></picture>`. Trình duyệt đọc được animated
WebP thì lấy WebP; còn lại rơi về GIF. `width`/`height` intrinsic vẫn khai báo để tỉ lệ đúng khi
ảnh chưa tải; nút `fixed` nên không ảnh hưởng CLS của trang.

Convert bằng `sharp` (đã có sẵn trong node_modules, không thêm dependency):
`sharp(gif, {animated:true}).resize({width:260}).webp({quality:80, effort:6, loop:0, delay})` —
giữ nguyên 23 frame, 886KB → 418KB.

**Nhịp phải sửa, không bê nguyên delay gốc.** GIF gốc giữ khung ĐẦU 2600ms trong vòng lặp 4140ms →
63% thời gian linh vật đứng bất động, chỉ vẫy 1,54s. Nhìn thoáng qua đọc ra là "ảnh tĩnh" — đúng
phản hồi đầu tiên nhận được khi ship. Rút khung đầu còn 800ms (các khung sau giữ 70ms) → vòng lặp
2340ms, vẫy chiếm 66%. GIF fallback giữ nguyên bản gốc: re-encode GIF phải lượng tử hoá lại bảng
màu, mà nhánh fallback hiếm khi chạm tới.

### 2. Vẫy tay thuộc về ẢNH, CSS chỉ lo bồng bềnh

`.mascot-wave` cũ xoay quanh `transform-origin: 50% 100%` để GIẢ động tác vẫy trên ảnh tĩnh — giờ
thừa và còn phản tác dụng (ảnh đang vẫy mà cả thân lại lắc). Thay bằng `.mascot-float`
(`translateY(0 → -5px)`, 3s, ease-in-out, infinite). Dưới `prefers-reduced-motion: reduce` thì tắt
`.mascot-float` + `.mascot-assistant-panel`; **khung hình của ảnh động thì không tắt được bằng CSS**
— đó là giới hạn của môi trường, ghi rõ trong comment chứ không giả vờ đã xử lý.

### 3. Danh sách tính năng là hằng số tĩnh, không fetch quota

`AiHub` lọc tile theo `/ai/quotas/me` để hiện số lượt còn lại. Panel linh vật thì KHÔNG: nó mở khi
hover, mà một panel hover không được phép chờ mạng; và mọi route trong danh sách tồn tại vô điều
kiện (hết quota là chuyện của trang đích, không phải của menu). Danh sách vì thế soi gương
`TOOL_CATALOG` bằng tay, kèm comment ràng buộc để lần sau ai thêm tool vào hub thì thêm cả ở đây.

### 4. Bộ đếm bong bóng để ở MODULE SCOPE, không phải state

`let bubblesShownThisVisit = 0` ở cấp module. Nếu để trong `useState` thì mỗi lần component
remount (một số chuyển route làm cây con dựng lại) hạn mức 3 lần lại reset — người xem 10 trang sẽ
ăn 30 bong bóng. Module scope reset đúng lúc tải lại trang = đúng nghĩa "một phiên truy cập", và
KHÔNG cần chạm `sessionStorage` (đúng yêu cầu "in-memory").

### 5. Hai effect tách vai, không gộp

- Effect **hẹn giờ**: chạy khi góc màn hình yên tĩnh (`!isHidden && !isOpen && bubble === null`),
  đặt `setTimeout` cho lần hiện kế tiếp. Deps `[isHidden, isOpen, bubble]` → mở panel là huỷ hẹn
  (tương tác rồi thì thôi mời), bong bóng ẩn đi là tự hẹn vòng sau.
- Effect **tự ẩn**: chỉ deps `[bubble]`, hẹn 8s rồi `setBubble(null)`.

Gộp hai cái vào một sẽ phải tự quản lý 2 timer trong cùng một closure và huỷ chéo — dài hơn mà dễ
rò timer hơn.

`isHidden` phải tính TRƯỚC hai effect (không phải ngay chỗ `return null`) vì hook không được đặt
sau nhánh return: nếu để hẹn giờ chạy cả khi component ẩn (trang đọc bài, đang chạy tour) thì hạn
mức 3 bong bóng/phiên bị tiêu vào hư không.

### 6. Vỏ ngoài ghim CẢ trên lẫn dưới để panel co được

Panel giờ có 8 dòng (~460px). Ban đầu chặn bằng `max-h-[60vh]` trên `<ul>` — sai, vì khi banner
cookie đang hiện, cả cụm bị nhấc lên `bottom-40` (160px) nên panel tràn khỏi mép trên (đo được
`top: -74` ở 1280×720). Sửa: vỏ ngoài `fixed top-4 bottom-4` (thay vì chỉ `bottom-4`) →
có chiều cao HỮU HẠN; `justify-start` trong `flex-col-reverse` vẫn dồn mọi thứ xuống đáy; nút linh
vật `shrink-0`; panel `flex min-h-0 flex-col` với `<ul>` `min-h-0 flex-1 overflow-y-auto` → danh
sách tự lấy đúng phần chỗ còn lại và cuộn. Vỏ ngoài `pointer-events-none` nên việc nó phủ suốt
mép phải màn hình không chặn thao tác gì.

### 7. Xoá hẳn "Khám phá" thay vì để lại 0 dòng

Bỏ dòng AI khỏi `EXPLORE_SHORTCUTS` sẽ để lại một section rỗng có tiêu đề. Nên xoá cả section, cả
file `explore-shortcuts.tsx`, cả nhánh i18n `profileMenu.*` (grep toàn repo: không consumer nào
khác). `auth.context.explore` thì GIỮ — `SubjectResources` vẫn dùng.

## Risks / Trade-offs

- **418KB preload trên mọi trang.** Đây là cái giá của yêu cầu "linh vật động, xuất hiện ngay".
  Giảm được nữa nếu hạ số frame hoặc quality, nhưng sẽ thấy rõ ở khung hình. Đã chọn 260px thay vì
  360px gốc (hiển thị tối đa 130px) để bớt 100KB.
- **Danh sách 8 dòng chép tay từ `TOOL_CATALOG`.** Có thể trôi khi hub thêm tool. Đổi lại là panel
  mở tức thì, không phụ thuộc mạng/quota. Comment ở cả hai file ràng buộc lẫn nhau.
- **`ContentAiFab` vẫn là nút tròn ở trang đọc bài.** Chủ sản phẩm chốt giữ (chat bám ngữ cảnh bài
  đang đọc + kéo thả + hỏi theo đoạn bôi đen — thay bằng menu điều hướng là mất tính năng). Linh
  vật tự ẩn ở đó nên vẫn chỉ có 1 nút AI trên màn hình.
