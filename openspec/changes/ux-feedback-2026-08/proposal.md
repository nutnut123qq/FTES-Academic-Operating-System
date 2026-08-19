# ux-feedback-2026-08 — Vá đợt góp ý người dùng (23 mục, `test01.docx`)

## Why
Một người dùng đi hết sản phẩm và ghi lại 23 mục góp ý kèm 19 ảnh chụp màn hình
(`test01.docx` ở gốc workspace). Đọc kỹ thì đây KHÔNG phải một danh sách "muốn đẹp hơn":
quá nửa là **lỗi thật**, và vài cái đã hỏng im lặng từ lâu vì không có test nào chạm tới —
nút zoom đếm tới 600% mà chữ không nhúc nhích, hộp thoại báo cáo không có dấu hiệu chọn
nào, thẻ sự kiện luôn mời "Đăng ký" cho chỗ người ta đã giữ.

Mỗi mục dưới đây đã được truy về NGUYÊN NHÂN GỐC ở cấp file:line trước khi vá, chứ không
chỉnh theo triệu chứng.

## What Changes

### Lỗi hỏng chức năng (đã vá)
- **#11 Zoom không hoạt động** — `ExamImageViewer`: `scale()` chỉ gắn trên `<img>`, còn trang
  đề GÕ TAY (`isTextPage`) render qua `MarkdownContent`. Thanh zoom lại nằm ngoài nhánh điều
  kiện nên hiện ở cả hai loại trang ⇒ trang chữ bấm zoom là nút nói dối. Trang chữ giờ phóng
  bằng `font-size` (reflow + cuộn dọc, không kéo ngang).
- **#12 Không chọn được lý do báo cáo** — `ReportDialog` truyền chuỗi trần vào `<Radio>` của
  nhà. `Radio` ở repo này KHÔNG tự vẽ nút chọn, nó giao `isSelected` cho caller qua
  render-prop. Chuyển sang block `SelectableCardGroup` (`variant="list"`) đã có sẵn.
- **#18 Sự kiện đã đăng ký vẫn hiện "Đăng ký"** — `EventController.list()` (BE) map mọi
  event bằng `toView(e, null)` ⇒ `myRegistrationStatus` LUÔN null; chỉ endpoint chi tiết mới
  phân giải. Vá phía FE: ghép trạng thái từ `GET /event/registrations/me` (endpoint đã có),
  trường của BE vẫn được ưu tiên nếu ngày nào đó `list()` trả thật.
- **#15 Thông báo nhóm in lặp 2 lần** — composer chỉ có MỘT ô soạn, còn BE bắt cả `title`
  lẫn `content` `@NotBlank`, nên khi tác giả không đánh `#` heading thì dòng đầu bị nhân bản
  vào cả hai. Vá ở đường ĐỌC (`titleEchoesBody`) để không phụ thuộc lịch deploy BE.
- **#16 Không đăng lại được bài viết** — trang chi tiết quên truyền `onRepost`, mà
  `PostEngagementBar` gác nút 🔁 bằng `onRepost != null`. Feed thì có từ lâu.
- **#10 Rail phải vỡ khi thu nhỏ** — `CollapsibleSidebar` co cột xuống ~4rem nhưng vẫn render
  nguyên children; `SubjectWorkspaceRail` là rail DUY NHẤT chưa đọc `useSidebarCollapsed`.
- **#23 Đăng nhập rồi vẫn thấy landing page** — docblock của `proxy.ts` mô tả luật "đã đăng
  nhập ở root → về dashboard" nhưng CODE chưa từng có nhánh đó, và không thể có: cờ phiên
  `session_hint` không được set bởi bất cứ đâu trong hệ. Chốt ở chính trang landing, nơi đọc
  được phiên thật.
- **#13 Ảnh nhóm upload xong không hiện** — BE `FTES-AOS-Community` tự sinh `storageKey`
  ngẫu nhiên trong khi dịch vụ upload cấp id của riêng nó, nên URL proxy dựng ra luôn 404.
  Sửa trong repo Community (xem báo cáo kèm theo).

### Sai thiết kế tương tác (đã sửa)
- **#1** bộ đếm tour "2 / 8" xuống dòng thành cột — thiếu `whitespace-nowrap`.
- **#2** thanh kéo chọn Xu → ô nhập số (trần Xu hàng trăm, mỗi pixel vài Xu).
- **#3** bỏ cặp tab Tóm tắt/Thanh toán thừa; luồng thẳng + link quay lại.
- **#4** `defaultTheme` `dark` → `system`, thêm nút đổi sáng/tối ở navbar (desktop + drawer).
- **#5** linh vật không mở panel khi hover nữa (hover mở → click theo phản xạ lại đóng).
- **#6** bỏ bộ chọn model AI khỏi bề mặt người học; hệ thống dùng model mặc định của BE.
- **#14** thêm `BackLink` cho trang nhóm.
- **#17** đăng bài xong về FEED thay vì nhảy vào trang chi tiết (giữ ngoại lệ cho bài KHẢO
  SÁT: trang chi tiết là nơi duy nhất bỏ phiếu được).
- **#20** bình luận blog: mặc định mới nhất trước + bộ chọn thứ tự + TRẢ LỜI một cấp (BE đã
  hỗ trợ `parentId` từ lâu, FE chưa từng nối).
- **#22** rail challenge: chip chữ "Đang diễn ra" → chấm màu trạng thái (chip ăn quá nửa
  hàng nên tên challenge nào cũng cụt).
- **#9** dọn overlay che mặt giấy + nội dung nở ra khi rail thu nhỏ.
- **#21** rail điều hướng cộng đồng áp cho cả `/groups`, `/events`, `/blog`.

### Không làm / còn treo
- **#8 (người dùng rút lại)** — đổi sidebar khoá học sang phải: đã được yêu cầu BỎ khỏi đợt này.
- **#7 lộ trình quá chung chung** — phần sinh nội dung nằm ở `ftes-ai-service`, NGOÀI mọi repo
  trên máy; BE Java chỉ proxy. Đợt này chỉ làm được phần FE: `resource_hint` chứa URL thì
  render thành link bấm được. Muốn "chi tiết như roadmap.sh" phải sửa prompt ở service đó.
- **#19 vào blog bị cuộn xuống bình luận** — chưa kết luận được nguyên nhân bằng bằng chứng
  đủ mạnh; không vá mù. Xem báo cáo điều tra.
- **#18 (nửa BE)** — `EventController.list()` vẫn nên tự phân giải trạng thái đăng ký; vá FE
  ở trên là lớp bù, không phải lời bào chữa cho việc để nguyên.

## Capabilities
Không thêm capability mới. Đây là đợt sửa lỗi + chỉnh tương tác trên các bề mặt đã có.
