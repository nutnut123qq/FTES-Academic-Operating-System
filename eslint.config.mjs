
import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import { defineConfig } from "eslint/config"

export default defineConfig([
    {
        ignores: [
            "**/.next/**",
            "**/node_modules/**",
            "**/dist/**",
            "**/out/**",
            "**/.turbo/**",
            "**/coverage/**",
            "**/.tmp-screenshot/**",
            // Agent worktrees are FULL copies of this repo. Without this, `eslint .` lints the
            // same source twice and every count is meaningless (measured: 1267 → 1360 problems
            // purely from one worktree copy), which makes a lint baseline impossible to reason about.
            "**/.claude/worktrees/**",
        ],
    },
    { 
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], 
        plugins: { js }, 
        extends: ["js/recommended"], 
        languageOptions: { globals: globals.browser }
    },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        // register react-hooks so `react-hooks/*` rule names resolve (the rule is
        // kept off below; we only need the plugin loaded for the disable directives)
        plugins: { "react-hooks": pluginReactHooks },
        rules: {
            "react/display-name": "off",
            indent: ["error", 4],
            "react-hooks/exhaustive-deps": "off",
            "linebreak-style": "off",
            quotes: ["error", "double"],
            semi: ["error", "never"],
        },
    },
    {
        // === CHUẨN ICON: chỉ dùng @phosphor-icons/react ===
        // Repo từng có 5 bộ icon cùng tồn tại do một cuộc migrate DANG DỞ
        // (phosphor → gravity → quay lại phosphor). Chuẩn đã chốt: phosphor là bộ DUY NHẤT.
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["@gravity-ui/icons", "@gravity-ui/icons/*"],
                            message: "Cấm @gravity-ui/icons (tàn dư của cuộc migrate dang dở). Icon phải import từ \"@phosphor-icons/react\": tên local hậu tố Icon (vd `import { Eye as EyeIcon }`), weight mặc định (fill chỉ cho trạng thái bật/đã-chọn), size bằng class size-4/5/6 chứ không prop size={px}.",
                        },
                        {
                            group: ["react-icons", "react-icons/*"],
                            message: "Cấm react-icons. Icon phải import từ \"@phosphor-icons/react\" (logo thương hiệu: GithubLogo, YoutubeLogo, TwitchLogo...). Ngoại lệ duy nhất đã chốt: logo ngôn ngữ lập trình ở components/reuseable/ProgrammingLanguageTabs/map.tsx.",
                        },
                        {
                            group: ["@icons-pack/react-simple-icons", "@icons-pack/react-simple-icons/*"],
                            message: "Cấm @icons-pack/react-simple-icons. Logo thương hiệu lấy từ \"@phosphor-icons/react\" (GithubLogo, YoutubeLogo, TwitchLogo, GoogleDriveLogo...).",
                        },
                        {
                            group: ["@iconify/react", "@iconify/react/*"],
                            message: "Cấm @iconify/react. Icon phải import từ \"@phosphor-icons/react\" (huy hiệu/hạng: Medal, Trophy, Crown, Diamond).",
                        },
                        {
                            group: ["lucide-react", "lucide-react/*"],
                            message: "Cấm lucide-react. Icon phải import từ \"@phosphor-icons/react\".",
                        },
                    ],
                },
            ],
        },
    },
    {
        // Ngoại lệ CÓ CHỦ ĐÍCH — phosphor không có glyph tương đương:
        // - ProgrammingLanguageTabs/map.tsx: logo ngôn ngữ lập trình (react-icons).
        // - HostPlatformChip/index.tsx: CHỈ còn Vimeo + Cloudflare (react-simple-icons) — phosphor không
        //   có VimeoLogo/CloudflareLogo. YouTube và Google Drive ĐÃ chuyển sang phosphor, nên đừng nới
        //   ngoại lệ này ra thêm glyph nào khác.
        // - LeagueTierBadge/index.tsx: bảng TIER_VISUAL dùng fluent-emoji qua @iconify/react. Không map
        //   sang phosphor được mà không mất nghĩa: đồng/bạc/vàng hiện là BA glyph huy chương hạng 1/2/3
        //   khác nhau, còn phosphor chỉ có Medal + MedalMilitary nên ba hạng thấp sẽ đổ về cùng một hình
        //   — đúng thứ docblock của component nói là đã cố tránh. Nó cũng là ảnh dự phòng ĐA SẮC cho art
        //   PNG thật, và khớp cỡ theo px runtime (prop `size`) nên không dùng được class size-* cố định.
        //   LƯU Ý: component này hiện KHÔNG có caller nào trong src — khi quyết định dùng thật hoặc xoá
        //   hẳn thì xem lại ngoại lệ này.
        files: [
            "src/components/reuseable/ProgrammingLanguageTabs/map.tsx",
            "src/components/reuseable/HostPlatformChip/index.tsx",
            "src/components/reuseable/LeagueTierBadge/index.tsx",
        ],
        rules: {
            "no-restricted-imports": "off",
        },
    },
])
