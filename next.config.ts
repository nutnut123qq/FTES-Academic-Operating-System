import {NextConfig} from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Pin the workspace root to this project — a stray package-lock.json in the home
// dir otherwise makes Turbopack infer the wrong root and panic on invalidation.
const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
    },
    // Cho phép ĐỔI thư mục build qua env (mặc định vẫn `.next`, không đổi hành vi của ai).
    // Hai phiên làm việc song song trên CÙNG worktree: `next dev` của phiên này ghi `.next/dev`
    // trong khi `next build` của phiên kia đang đọc `.next/build-manifest.json` → build chết
    // giữa chừng (ENOENT / JSON đứt đoạn) dù code hoàn toàn sạch. Verify thì đặt
    // `NEXT_DIST_DIR=.next-verify` để hai bên không giẫm chân nhau.
    distDir: process.env.NEXT_DIST_DIR || ".next",
    /**
     * Bộ nhớ đệm trình duyệt cho ASSET TĨNH.
     *
     * <p><b>Vì sao cần dòng này.</b> Next KHÔNG đặt cache dài cho file trong `/public`: mặc định
     * chúng đi ra với `Cache-Control: public, max-age=0, must-revalidate`. Đã đo trên production —
     * `/fes-mascot-wave.webp` (427 KB) trả về `304` ở MỌI lần tải trang, tức mỗi lần vào trang là
     * một vòng đi-về mạng cho từng ảnh một. Thư mục `/public` hiện 21 MB / 97 ảnh, có file 1,6 MB.
     *
     * <p><b>Nó còn kéo theo `/_next/image`.</b> Optimizer KẾ THỪA `Cache-Control` của nguồn, nên
     * ảnh đã tối ưu cũng trả `max-age=0` — đã đo. Vá ở nguồn là vá luôn cả hai đường; không cần
     * (và không nên) đặt luật riêng cho `/_next/image`, vì header của nó do optimizer tự tính.
     *
     * <p><b>Vì sao KHÔNG dùng `immutable`.</b> File trong `/public` không có băm nội dung trong
     * tên — art linh vật và ảnh bìa môn đều được thay tại chỗ. `immutable` nghĩa là trình duyệt sẽ
     * KHÔNG bao giờ hỏi lại cho tới khi hết hạn, nên đổi ảnh xong người dùng cũ vẫn thấy ảnh cũ
     * hàng tháng trời, không có cách nào ép ngoài đổi tên file.
     *
     * <p>`stale-while-revalidate` cho cả hai thứ cùng lúc: trong 1 ngày KHÔNG có request nào; sau
     * đó vẫn vẽ ngay bằng bản cũ rồi âm thầm tải bản mới ở nền. Ảnh thay sẽ tới tay trong vòng một
     * ngày cộng một lượt ghé, mà không lần nào người dùng phải CHỜ ảnh.
     */
    async headers() {
        return [
            {
                // Mọi asset tĩnh trong `/public`, kể cả file lồng thư mục
                // (`/mascot/greeting.webp`, `/subjects/csd201.png`).
                source: "/:all*(svg|png|jpg|jpeg|webp|avif|gif|ico|woff|woff2|glb|mp4)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=86400, stale-while-revalidate=31536000",
                    },
                ],
            },
        ]
    },
    experimental: {
        /**
         * Bộ nhớ đệm điều hướng phía client (Router Cache).
         *
         * <p>Mặc định của Next 16 là `dynamic: 0` — nghĩa là quay lại một trang đã xem là tải lại
         * payload RSC từ đầu, kèm nguyên màn khung xương, dù vừa rời khỏi đó vài giây trước. Đây
         * chính là cảm giác "sao trang nào cũng load lại".
         *
         * <p>30 giây là đánh đổi có chủ đích: đủ để chuỗi xem-rồi-quay-lại (mở khoá học → bấm vào
         * bài → quay ra danh sách) không tải lại lần nào, nhưng đủ ngắn để dữ liệu đổi ở tab khác
         * không đọng lại lâu. KHÔNG đặt cao hơn: giỏ hàng và thông báo cũng đi qua cache này.
         *
         * <p>Lưu ý: đây là cache của KHUNG TRANG, không phải của dữ liệu SWR — tầng đó đã do
         * `SwrProvider` gác sẵn (dedupe 60s, không revalidate khi focus).
         */
        staleTimes: {
            dynamic: 30,
            static: 300,
        },
    },
    images: {
        // Host được phép cho `next/image` optimizer. Thiếu allowlist → optimizer trả
        // 400 cho MỌI URL remote (ảnh bìa môn ở /en/subjects load lỗi vì host Cloudinary
        // chưa được liệt kê). Chỉ thêm host tin cậy của hệ thống.
        remotePatterns: [
            // Ảnh bìa / avatar / học liệu migrate qua Cloudinary.
            { protocol: "https", hostname: "res.cloudinary.com" },
            // Asset tự-host của FTES (storage/upload/stream/video .ftes.vn).
            { protocol: "https", hostname: "**.ftes.vn" },
            // MinIO / asset host tuỳ biến qua env (vd storage prod).
            ...(process.env.NEXT_PUBLIC_IMAGE_EXTRA_HOSTNAME
                ? [{
                    protocol: "https" as const,
                    hostname: process.env.NEXT_PUBLIC_IMAGE_EXTRA_HOSTNAME,
                }]
                : []),
            // Avatar mặc định sinh theo seed (UserAvatar → utils/avatar.dicebearAvatarUrl).
            // Hôm nay HeroUI Avatar render bằng <img> thuần (Radix) nên KHÔNG qua optimizer;
            // liệt kê sẵn để chỗ nào bọc avatar bằng next/image sau này không ăn 400.
            { protocol: "https", hostname: "api.dicebear.com" },
            // Dev: MinIO cục bộ.
            { protocol: "http", hostname: "localhost" },
        ],
    },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)