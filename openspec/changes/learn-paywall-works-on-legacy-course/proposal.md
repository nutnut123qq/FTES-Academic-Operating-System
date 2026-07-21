# learn-paywall-works-on-legacy-course — tường phí trong bài học phải mua được, và không phủ màn trắng

## Why

Trên khoá LEGACY (`WED201c - Web Design For Everyone`, apitest), mở một bài đang PREVIEW gặp **hai lỗi
nối nhau**, cùng bắt nguồn từ một giả định: tường phí trong trang học được viết cho khoá bán theo gói.

**1. Vệt trắng phủ lên tiêu đề bài.** BE trả `bodyMd: ""` cho bài DOCUMENT dạng tài liệu/link (nội dung
thật nằm ở file đính kèm, không phải markdown) — đo thật:

```
GET /api/v1/lessons/4e1ee540-.../content   (token học viên, bài PREVIEW)
bodyMd => len 0 | ''      locked => true      teaser => {"reason":"PREVIEW","cheapestPackage":null}
```

`DocumentReader` vẫn vẽ lớp fade kiểu Medium (`absolute bottom-0 h-72`) mỗi khi `locked`. Không có chữ
nào để mờ dần ⇒ khung bài cao 0px ⇒ gradient 288px **trải ngược lên trên**, phủ tiêu đề và mô tả bài.

**2. Bấm mua thì vào ngõ cụt.** CTA của tường phí mở `PackageGateModal`, modal này chỉ liệt kê **gói**
của khoá. Khoá LEGACY **không được phép có gói** (BE `PackageService.createPackage` chặn thẳng), nên
danh sách luôn rỗng → modal hiện "Không có gói phù hợp / Các gói của khóa học này chưa được cập nhật"
→ **không có bước thanh toán nào**, không ra QR. Cùng khoá đó, mua từ trang chi tiết thì bình thường
vì trang chi tiết dùng product `COURSE_UNLOCK` cấp khoá.

Câu thông báo còn gây hiểu lầm: nó đổ cho dữ liệu ("gói chưa cập nhật") trong khi đây là trạng thái
ĐÚNG của mọi khoá LEGACY.

## What Changes

- **Fade chỉ vẽ khi có nội dung teaser để mờ** (`locked && hasTeaserBody`, tính cả danh sách link tài
  nguyên). Bài locked mà teaser rỗng thì hiện thẳng thẻ tường phí, không có lớp phủ.
- **`PackageGateModal` có nhánh mua trọn khoá:** khi khoá không có gói nào, modal resolve product
  `COURSE_UNLOCK` cấp khoá rồi chạy đúng luồng `thêm giỏ → PaymentModal` (VietQR) mà CTA ở trang chi
  tiết đang dùng. Sửa ở modal nên áp cho **cả 4 lối vào** đang dùng nó (đọc tài liệu, hết giờ xem thử
  video, ContentMap, LessonReader).
- Thông báo "không có gói phù hợp" **chỉ còn xuất hiện khi khoá cũng không có product** — tức là khoá
  thật sự không bán được, lúc đó câu chữ mới đúng.
- Lỗi khi tải danh sách gói cũng rơi vào nhánh mua trọn khoá: thà có đường mua chạy được còn hơn một
  thẻ báo lỗi cụt.

## Impact

- Affected specs: `course-lesson` (ADDED).
- Affected code: `components/features/learn/DocumentReader/index.tsx`,
  `components/features/course/PackageGateModal/index.tsx` (+ 2 file test mới).
- Không đụng BE, không đụng luồng mua của khoá PACKAGE (nhánh gói giữ nguyên).

## Non-goals

- Sửa câu chữ tường phí "Subscribe to a package…" cho khoá không có gói — cần chốt copy riêng.
- Cho khoá DOCUMENT dạng file/link có nội dung teaser thật (BE trả rỗng là đúng về bảo mật; muốn có
  teaser thì phải chốt nội dung nào được lộ).
