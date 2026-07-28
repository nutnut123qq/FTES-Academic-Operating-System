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
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)