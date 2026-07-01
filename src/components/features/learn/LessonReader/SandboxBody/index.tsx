"use client"

import React, { useMemo } from "react"
import { useTheme } from "next-themes"
import { SandpackPanel } from "@/components/reuseable/SandpackPanel"
import { CodeBodySkeleton } from "../CodeBodySkeleton"
import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { useAppSelector } from "@/redux/hooks"
import { useQueryContentSwr } from "@/hooks/swr/api/graphql/queries/useQueryContentSwr"
import { useRepoSandpackFiles } from "@/hooks/useRepoSandpackFiles"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"

/**
 * Tailwind v4 theme registered at runtime in the preview iframe. `@tailwindcss/browser`
 * uses the DEFAULT config (no HeroUI colors), and heroui.min.css does not ship
 * `bg-background` / `text-foreground` / `default-*` utilities — so we register them
 * here as a `<style type="text/tailwindcss">`. `@custom-variant dark` makes the
 * `.dark` class drive every token (page bg, text, hover) for both light and dark.
 */
const THEME_TAILWINDCSS = `@custom-variant dark (&:where(.dark, .dark *));
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --color-background: var(--sb-bg);
  --color-foreground: var(--sb-fg);
  --color-muted: var(--sb-muted);
  --color-border: var(--sb-border);
  --color-content1: var(--sb-content1);
  --color-default-50: var(--sb-d50);
  --color-default-100: var(--sb-d100);
  --color-default-200: var(--sb-d200);
  --color-default-300: var(--sb-d300);
  --color-default-400: var(--sb-muted);
  --color-default-500: var(--sb-muted);
  --color-default-600: var(--sb-d600);
  --color-default-700: var(--sb-d700);
  --color-accent: var(--sb-accent);
  --color-primary: var(--sb-primary);
  --color-focus: var(--sb-primary);
  --color-danger: var(--sb-danger);
  --color-success: var(--sb-success);
  --color-warning: var(--sb-warning);
}
:root {
  --sb-bg: oklch(97.02% 0.0033 185.90); --sb-fg: #18181b; --sb-muted: #71717a; --sb-border: #e4e4e7;
  --sb-d50: #fafafa; --sb-d100: #f4f4f5; --sb-d200: #e4e4e7; --sb-d300: #d4d4d8; --sb-d600: #52525b; --sb-d700: #3f3f46;
  --sb-content1: #ffffff; --sb-accent: #0d9488; --sb-primary: #006fee; --sb-danger: #f31260; --sb-success: #17c964; --sb-warning: #f5a524;
  /* raw semantic vars (no color- prefix) so the lesson's globals.css var(--border)/var(--background) resolve */
  --background: var(--sb-bg); --foreground: var(--sb-fg); --border: var(--sb-border); --muted: var(--sb-muted);
  --default-100: var(--sb-d100); --default-200: var(--sb-d200); --content1: var(--sb-content1);
}
.dark {
  --sb-bg: oklch(12.00% 0.0033 185.90); --sb-fg: #fafafa; --sb-muted: #a1a1aa; --sb-border: #27272a;
  --sb-d50: oklch(16.00% 0.0033 185.90); --sb-d100: oklch(20.00% 0.0033 185.90); --sb-d200: #3f3f46; --sb-d300: #52525b; --sb-d600: #a1a1aa; --sb-d700: #d4d4d8;
  --sb-content1: oklch(20.00% 0.0033 185.90); --sb-accent: #2dd4bf; --sb-primary: #006fee; --sb-danger: #f31260; --sb-success: #17c964; --sb-warning: #f5a524;
}`

/**
 * Bridges the Sandpack template entry (/App.tsx, imported as ../App) to the real
 * /src/App. Injects the Tailwind theme + toggles the platform light/dark mode on
 * the preview iframe's <html>.
 */
const buildAppBridge = (isDark: boolean, globalsCssImport: string): string => `import { useEffect } from "react"
import App from "./src/App"
${globalsCssImport}

// Force ?sandbox=1 into the URL before App's first render. Sandpack's startRoute
// query does not reliably reach window.location.search inside the preview iframe,
// so multi-client lessons (websocket: chat/presence/reconnection) would otherwise
// fall back to the single-client Local view and lose their User A / User B tabs.
// This runs at module eval — before App's useState reads window.location.search.
if (typeof window !== "undefined" && !new URLSearchParams(window.location.search).has("sandbox")) {
    window.history.replaceState(null, "", window.location.pathname + "?sandbox=1" + window.location.hash)
}

export default function SandboxRoot() {
    useEffect(() => {
        document.documentElement.classList.toggle("dark", ${isDark})
        // load Inter (the font heroui.com uses) so the preview matches the docs
        if (!document.getElementById("sb-font")) {
            const link = document.createElement("link")
            link.id = "sb-font"
            link.rel = "stylesheet"
            link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            document.head.appendChild(link)
        }
        if (!document.getElementById("sb-theme")) {
            const style = document.createElement("style")
            style.id = "sb-theme"
            style.setAttribute("type", "text/tailwindcss")
            style.textContent = ${JSON.stringify(THEME_TAILWINDCSS)}
            document.head.appendChild(style)
        }
    }, [])
    return <App />
}
`

/**
 * Rewrites a lesson source file so it runs inside Sandpack's bundler:
 *  - `import.meta.env.VITE_API_BASE` → the session-scoped mock URL literal
 *  - any other `import.meta.env.X` → "" (bundler can't evaluate import.meta)
 *  - `import.meta.hot...` → undefined (HMR not available)
 *  - strips Tailwind/HeroUI @import directives (loaded via CDN instead)
 */
const rewriteForSandpack = (code: string, mockApiBase: string): string =>
    code
        .replace(/import\.meta\.env\.VITE_API_BASE/g, JSON.stringify(mockApiBase))
        .replace(/import\.meta\.env\.\w+/g, "\"\"")
        .replace(/import\.meta\.env/g, "({})")
        .replace(/import\.meta\.hot[^\n]*/g, "undefined")
        .replace(/@import\s+["']tailwindcss["'];?/g, "")
        .replace(/@import\s+["']@heroui\/styles["'];?/g, "")

/**
 * Sandbox tab body — runs the lesson's frontend live in Sandpack against a
 * session-isolated mock API served by the standalone mock app. Always light
 * theme (dark mode is intentionally ignored here).
 *
 * Flow:
 * 1. A random sessionId is generated client-side (the mock app lazily seeds on
 *    first request — no handshake needed).
 * 2. The lesson source is fetched from GitHub (cached by repo URL).
 * 3. Every file's `import.meta.env.VITE_API_BASE` is overridden to the mock URL
 *    `<mockHost>/mocks/<module>/<lesson>/sessions/<sessionId>` — the cloned source
 *    still falls back to `http://localhost:3000` for local dev.
 */
export const SandboxBody = () => {
    const queryContentSwr = useQueryContentSwr()
    const content = useAppSelector((state) => state.content.entity)
    // editor chrome follows the platform theme; the preview app stays light
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme !== "light"

    // host of the standalone mock app (e.g. http://localhost:3002 — no /api prefix)
    const mockApiHost = process.env.NEXT_PUBLIC_MOCK_API_BASE_URL ?? ""
    // lesson path on that host (e.g. /mocks/4-server-state.../0-usequery...)
    const lessonPath = content?.backendUrl ?? null

    // fresh isolated session id, stable for this lesson's component lifetime
    const sessionId = useMemo(
        () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`),
        [content?.id],
    )

    const { files: githubFiles, dependencies, isLoading: githubLoading } = useRepoSandpackFiles(
        content?.id,
        content?.githubBaseUrl,
        content?.githubDir,
        content?.isPremium,
    )

    const contentReady = !queryContentSwr.isLoading && !!queryContentSwr.data && !queryContentSwr.error
    // first load (content + repo files) → mirror the code-shaped skeleton via AsyncContent
    const isLoading = !contentReady || githubLoading

    // full session-scoped mock URL the lesson's VITE_API_BASE will point at
    const mockApiBase = lessonPath
        ? `${mockApiHost}${lessonPath}/sessions/${sessionId}`
        : ""

    // rewrite every fetched file's env reference to the live mock URL
    const rewrittenFiles: SandpackFiles = {}
    for (const [path, file] of Object.entries(githubFiles ?? {})) {
        const code = typeof file === "string" ? file : file.code
        rewrittenFiles[path] = { code: rewriteForSandpack(code, mockApiBase) }
    }

    // synthetic stubs: bridge the template entry (+ theme sync) and no-op the
    // vite config the bundler can't run. Tailwind v4 + HeroUI load via
    // SandpackProvider externalResources (not index.html — Sandpack ignores tags there).
    // The bridge imports App directly (bypassing main.tsx), so the lesson's
    // globals.css — normally imported by main.tsx — would never load, dropping
    // its body reset and custom rules (e.g. the `.input` border). Re-import it
    // from the bridge when present (path-safe: only if the lesson ships one).
    const globalsKey = Object.keys(rewrittenFiles).find((p) => p.endsWith("/globals.css"))
    const globalsCssImport = globalsKey ? `import ".${globalsKey}"` : ""

    const stubs: SandpackFiles = {
        "/App.tsx": { code: buildAppBridge(isDark, globalsCssImport) },
        "/vite.config.ts": { code: "// vite config omitted in sandbox" },
    }

    const files: SandpackFiles = { ...stubs, ...rewrittenFiles }

    // thin, rounded, theme-aware scrollbars for the editor/file-tree (default ones look crude)
    const thumb = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.16)"
    const thumbHover = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)"

    const body = (
        <div className="sb-scroll mt-3">
            <style>{`
                .sb-scroll *::-webkit-scrollbar { width: 8px; height: 8px; }
                .sb-scroll *::-webkit-scrollbar-track { background: transparent; }
                .sb-scroll *::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 9999px; border: 2px solid transparent; background-clip: content-box; }
                .sb-scroll *::-webkit-scrollbar-thumb:hover { background: ${thumbHover}; background-clip: content-box; }
                .sb-scroll *::-webkit-scrollbar-corner { background: transparent; }
                .sb-scroll * { scrollbar-width: thin; scrollbar-color: ${thumb} transparent; }
            `}</style>
            {/* key on theme forces a full re-mount (fresh preview iframe) when the
                platform light/dark toggles, so the bridge re-runs and the sandbox UI
                reloads with the new theme instead of keeping the stale dark class. */}
            <SandpackPanel
                key={isDark ? "sandbox-dark" : "sandbox-light"}
                files={files}
                dependencies={dependencies}
                isDark={isDark}
            />
        </div>
    )

    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={<CodeBodySkeleton />}
        >
            {body}
        </AsyncContent>
    )
}
