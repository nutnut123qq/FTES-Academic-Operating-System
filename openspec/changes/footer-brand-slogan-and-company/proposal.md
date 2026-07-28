# footer-brand-slogan-and-company — footer mang đúng slogan FTES + khối pháp nhân

## Why
Hai góp ý cùng chỉ vào một khối (file "Góp ý website" 2026-07-26):

1. *"Phần này đang bị sai đối với FTES. FTES phải là Khơi mở tiềm năng / Dẫn đầu công nghệ"* —
   chỗ cạnh logo footer đang là câu mô tả sản phẩm (`footer.tagline`), không phải slogan thương
   hiệu. Slogan thật nằm ở `Ftes-frontend/src/layouts/public_layout/footer/index.tsx`: 2 dòng
   **Khơi mở tiềm năng / Dẫn đầu công nghệ** (nhánh FunnyCode là "Code more, / Have more fun!").
2. *"Về phần footer nên thêm thông tin công ty để tạo độ uy tín và các mục về điều khoản dịch vụ
   giống ftes.vn"* — footer AOS hiện chỉ có logo + tagline + copyright + Điều khoản/Bảo mật.

Nội dung pháp nhân lấy NGUYÊN VĂN từ footer ftes.vn đang chạy, không tự chế.

## What Changes
- Bỏ hẳn `footer.tagline` (chủ box chốt: bỏ, không giữ làm dòng phụ) → thay bằng slogan 2 dòng.
- Thêm khối pháp nhân: CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ GIÁO DỤC FTES · MSDN 5901235207 ·
  thành lập 26/08/2025 · "Giáo dục và Công nghệ – phát triển sản phẩm hỗ trợ học tập".
- Thêm hàng mạng xã hội (link do chủ box cung cấp 2026-07-28):
  Facebook `https://www.facebook.com/ftes.edu/` · YouTube `https://www.youtube.com/@funnycode` ·
  TikTok `https://www.tiktok.com/@funnycode_vn`. (YouTube/TikTok vẫn là kênh FunnyCode — đúng ý
  chủ box, không phải nhầm.)
- Copyright đổi cho khớp bản đang chạy: "© {year} FTES — Nền tảng học lập trình uy tín tại Việt Nam".
- i18n vi + en.

## Out of scope
- Cột "Blogs"/"Khóa học" kéo từ API như footer cũ — footer AOS đang là dải phẳng editorial, thêm
  cột động là đổi layout, để riêng nếu chủ box muốn.
- Trang `/about` (footer cũ có link Giới thiệu) — route này CHƯA tồn tại bên AOS, không link mù.
