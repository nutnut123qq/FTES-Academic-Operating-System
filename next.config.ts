import {NextConfig} from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Pin the workspace root to this project — a stray package-lock.json in the home
// dir otherwise makes Turbopack infer the wrong root and panic on invalidation.
const nextConfig: NextConfig = {
    turbopack: {
        root: __dirname,
    },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)