# Design — home-press-coverage

## Context
Home landing gồm các section curated trong `HomeLanding/content.ts` + `sections/*` (khuôn:
`<section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">`, header giữa `mb-10`,
ảnh `<img loading="lazy" onError>` có fallback, i18n `useTranslations("homeLanding")`, section
tự ẩn khi data rỗng). Section mới bám đúng khuôn này. Đây là khối **social proof / báo chí** —
6 bài báo thật về khởi nghiệp gắn với FTES (CafeF, FPTU, Báo Gia Lai, Thương Hiệu & Truyền Thông).

## Goals / Non-Goals
**Goals:** section press trên Home, dữ liệu curated 6 bài, featured + lưới + dải nguồn, link ra
ngoài an toàn, ảnh self-host + fallback, i18n/a11y/reduced-motion. Build green, không BE.
**Non-Goals:** CMS/quản trị bài press trên admin (giai đoạn này curated trong code); auto-fetch
og:image lúc runtime (hotlink dễ vỡ — self-host); structured data/JSON-LD (có thể thêm sau).

## Decisions

### 1. Dữ liệu curated (`PRESS_ARTICLES` trong content.ts)
```ts
type PressArticle = {
  id: string          // slug ổn định, cũng là tên file ảnh public/press/{id}.jpg
  source: string      // khóa nguồn: "cafef" | "fptu" | "baogialai" | "thtt"
  sourceLabel: string // hiển thị: "CafeF", "Đại học FPT", "Báo Gia Lai", "Thương Hiệu & Truyền Thông"
  title: string       // tiêu đề báo thật (tiếng Việt, giữ nguyên 2 locale)
  url: string         // link bài gốc
  thumbnail: string   // "/press/{id}.jpg"
  publishedAt?: string// ISO, nếu biết
}
```
6 phần tử (thứ tự = độ ưu tiên hiển thị, featured = phần tử đầu):

| id | source | sourceLabel | url | title |
|---|---|---|---|---|
| `cafef-tu-duy-lam-chu` | cafef | CafeF | https://cafef.vn/hoc-khoi-nghiep-o-truong-dai-hoc-khong-phai-ai-cung-thanh-founder-nhung-ai-cung-can-tu-duy-lam-chu-188260623192001525.chn | Học khởi nghiệp ở trường đại học: Không phải ai cũng thành founder nhưng ai cũng cần tư duy làm chủ |
| `fptu-do-an-1-ty` | fptu | Đại học FPT | https://daihoc.fpt.edu.vn/tin-tuc/do-an-khoi-nghiep-cua-sinh-vien-fptu-dat-doanh-thu-gan-1-ty-dong-sau-1-nam | Đồ án khởi nghiệp của sinh viên FPTU đạt doanh thu gần 1 tỷ đồng sau 1 năm |
| `gialai-goi-von-4-du-an` | baogialai | Báo Gia Lai | https://baogialai.com.vn/gia-lai-ket-noi-va-goi-von-dau-tu-cho-4-du-an-khoi-nghiep-nam-2025-post575022.html | Gia Lai: Kết nối và gọi vốn đầu tư cho 4 dự án khởi nghiệp năm 2025 |
| `gialai-10-du-an-chung-ket` | baogialai | Báo Gia Lai | https://baogialai.com.vn/10-du-an-vao-chung-ket-cuoc-thi-thanh-nien-gia-lai-khoi-nghiep-sang-tao-post573678.html | 10 dự án vào chung kết cuộc thi Thanh niên Gia Lai khởi nghiệp sáng tạo |
| `gialai-30-du-an-ban-ket` | baogialai | Báo Gia Lai | https://baogialai.com.vn/30-du-an-vao-vong-ban-ket-cuoc-thi-thanh-nien-gia-lai-khoi-nghiep-sang-tao-post572244.html | 30 dự án vào vòng bán kết cuộc thi Thanh niên Gia Lai khởi nghiệp sáng tạo |
| `thtt-be-phong-khoi-nghiep` | thtt | Thương Hiệu & Truyền Thông | https://thuonghieutruyenthong.vn/gia-lai-tao-be-phong-cho-doanh-nghiep-khoi-nghiep-sang-tao | Gia Lai tạo bệ phóng cho doanh nghiệp khởi nghiệp sáng tạo |

### 2. Layout section
- Header giữa: eyebrow "Truyền thông" + heading `homeLanding.press.title` ("Báo chí nói về FTES")
  + subtitle ngắn.
- **Dải nguồn** ("Được nhắc tới trên"): hàng tên nguồn (dedupe theo `source` → CafeF · Đại học
  FPT · Báo Gia Lai · Thương Hiệu & Truyền Thông), muted, wrap; là logo nếu có `public/press/logos/{source}.svg`, else text.
- **Featured** (phần tử [0]): thẻ lớn 2 cột (ảnh trái/tiêu đề phải trên desktop), source eyebrow
  + title (clamp 3 dòng) + "Đọc bài ↗".
- **Lưới** phần còn lại: `grid sm:grid-cols-2 lg:grid-cols-3` thẻ nhỏ (ảnh 16:9 trên, source +
  title clamp 2 dòng dưới). Cả thẻ là link.
- Tự ẩn nếu `PRESS_ARTICLES.length === 0` (như HonorBoardSection).

### 3. Thẻ = link ra ngoài an toàn
- `<a href={url} target="_blank" rel="noopener noreferrer">` bọc cả thẻ; accessible name =
  `"{title} — {sourceLabel} (mở tab mới)"`. Hover: nâng nhẹ + underline title (reduced-motion tắt
  transform). Icon `ArrowUpRightIcon`/`ArrowSquareOutIcon` (Phosphor) cạnh "Đọc bài".

### 4. Ảnh thumbnail (self-host + fallback)
- `public/press/{id}.jpg` (anh gửi ảnh → đặt đúng tên id; hoặc lấy og:image từng bài rồi
  tự-host — KHÔNG hotlink URL báo trực tiếp: nhiều báo chặn hotlink/thiếu CORS/ảnh đổi).
- Component ảnh copy pattern `AchieverImage`: `loading="lazy"` + `onError` → fallback thẻ nền
  `bg-accent/10` + tên nguồn (không vỡ layout khi thiếu ảnh).

### 5. i18n & a11y
- `homeLanding.press.{eyebrow,title,subtitle,featuredOn,readArticle,newTab}` (vi/en). **Tiêu đề
  bài + sourceLabel giữ nguyên tiếng Việt ở cả 2 locale** (tài sản báo thật, không dịch); chỉ
  chrome section dịch.
- a11y: mỗi link có tên rõ (title + nguồn + "mở tab mới"); ảnh `alt` = title; tương phản AA;
  không autoplay.

## Risks / Trade-offs
- **Chưa có ảnh** → fallback nền + tên nguồn (đã xử lý §4); nợ: anh gửi 6 ảnh hoặc mình lấy
  og:image tự-host.
- **URL báo có thể đổi/gỡ** → link chết. Curated trong code nên sửa nhanh; cân nhắc gắn
  `publishedAt` để biết bài cũ.
- Đặt sau Bảng vàng (cùng cụm proof); nếu muốn nổi hơn có thể đưa lên sau Hero — để anh chốt vị trí.
