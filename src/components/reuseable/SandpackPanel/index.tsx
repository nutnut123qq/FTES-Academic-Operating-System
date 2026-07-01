"use client"

import React from "react"
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    SandpackFileExplorer,
} from "@codesandbox/sandpack-react"
import type { SandpackFiles, SandpackTheme } from "@codesandbox/sandpack-react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

const sharedFont = {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
    size: "13px",
    lineHeight: "1.6",
}

/** Editor dark theme — surface1 matches the platform page background to blend in. */
const darkTheme: SandpackTheme = {
    colors: {
        surface1: "oklch(12.00% 0.0033 185.90)",
        surface2: "oklch(16.00% 0.0033 185.90)",
        surface3: "oklch(22.00% 0.0033 185.90)",
        clickable: "#6b7280",
        base: "#d1d5db",
        disabled: "#4b5563",
        hover: "#e5e7eb",
        accent: "#2dd4bf",
        error: "#f87171",
        errorSurface: "#1f1212",
    },
    syntax: {
        plain: "#e5e7eb",
        comment: { color: "#6b7280", fontStyle: "italic" },
        keyword: "#c084fc",
        tag: "#f472b6",
        punctuation: "#9ca3af",
        definition: "#60a5fa",
        property: "#34d399",
        static: "#fbbf24",
        string: "#86efac",
    },
    font: sharedFont,
}

/** Editor light theme — surface1 matches the platform page background to blend in. */
const lightTheme: SandpackTheme = {
    colors: {
        surface1: "oklch(97.02% 0.0033 185.90)",
        surface2: "oklch(94.00% 0.0033 185.90)",
        surface3: "oklch(90.00% 0.0033 185.90)",
        clickable: "#71717a",
        base: "#27272a",
        disabled: "#a1a1aa",
        hover: "#18181b",
        accent: "#0d9488",
        error: "#dc2626",
        errorSurface: "#fef2f2",
    },
    syntax: {
        plain: "#27272a",
        comment: { color: "#a1a1aa", fontStyle: "italic" },
        keyword: "#9333ea",
        tag: "#db2777",
        punctuation: "#52525b",
        definition: "#2563eb",
        property: "#059669",
        static: "#b45309",
        string: "#15803d",
    },
    font: sharedFont,
}

export interface SandpackPanelProps extends WithClassNames<undefined> {
    /** Assembled files map (stubs + github files + dynamic overrides). */
    files: SandpackFiles
    /** Extra npm dependencies merged from the lesson's package.json. */
    dependencies?: Record<string, string>
    /** When true, use the dark editor theme (follows the platform theme). */
    isDark?: boolean
}

/**
 * External resources injected into the preview iframe by Sandpack itself
 * (the bundler ignores <script>/<link> tags inside index.html). Loads Tailwind
 * v4 utilities (runtime DOM scan) + HeroUI v3 compiled styles via CDN.
 */
const EXTERNAL_RESOURCES = [
    "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
    "https://cdn.jsdelivr.net/npm/@heroui/styles@3/dist/heroui.min.css",
]

export const SandpackPanel = ({ files, dependencies = {}, isDark = true, className }: SandpackPanelProps) => (
    <div className={cn(className)}>
        <SandpackProvider
            template="react-ts"
            theme={isDark ? darkTheme : lightTheme}
            files={files}
            customSetup={{ dependencies }}
            options={{
                recompileMode: "delayed",
                recompileDelay: 600,
                externalResources: EXTERNAL_RESOURCES,
                // load the embedded preview at /?sandbox=1 so lesson frontends that
                // split into Local/Sandbox render the multi-client Sandbox content;
                // frontends without the split simply ignore the query param.
                startRoute: "/?sandbox=1",
            }}
        >
            <SandpackLayout style={{ border: "none", borderRadius: 0, minHeight: 520, width: "100%" }}>
                {/* left half — source: file tree + code editor */}
                <SandpackFileExplorer style={{ width: 190, height: 520 }} />
                <SandpackCodeEditor showLineNumbers showTabs={false} showReadOnly={false} style={{ flex: 1, height: 520 }} />
                {/* right half — live UI preview */}
                <SandpackPreview showNavigator={false} showOpenInCodeSandbox style={{ flex: 1, height: 520 }} />
            </SandpackLayout>
        </SandpackProvider>
    </div>
)
