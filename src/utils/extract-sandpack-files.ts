import type { SandpackFiles } from "@codesandbox/sandpack-react"
import type { CodeExplainingEntity } from "@/modules/types/entities/code-explaining"

/** Languages treated as renderable React/TSX. */
export const REACT_LANGS = new Set(["tsx", "jsx", "react"])

export const isReactItem = (item: CodeExplainingEntity): boolean =>
    REACT_LANGS.has(item.lang?.toLowerCase())

/**
 * Strips a single markdown code fence from a string.
 * Returns the raw code without fence markers.
 */
export const extractCodeFromFence = (markdown: string): string => {
    const match = markdown.match(/^```[^\n]*\n([\s\S]*?)```\s*$/)
    return match ? match[1] : markdown
}

/**
 * Parses a filename from the first-line comment of the raw code.
 * Handles:
 *   - `// @filename: Foo.tsx`
 *   - `// src/components/Foo.tsx`  → extracts basename `Foo.tsx`
 *   - `// Foo.tsx`
 */
const parseFilenameFromComment = (code: string): string | undefined => {
    const firstLine = code.split("\n")[0].trim()
    // explicit @filename directive
    const explicit = firstLine.match(/^\/\/\s*@filename:\s*(.+)$/)
    if (explicit) return explicit[1].trim()
    // any // comment ending with a known extension
    const pathComment = firstLine.match(/^\/\/\s*(.+\.(tsx|jsx|ts|js|css|json))$/)
    if (pathComment) {
        const parts = pathComment[1].trim().split(/[/\\]/)
        return parts[parts.length - 1]
    }
    return undefined
}

/**
 * Converts codeExplaining items into a Sandpack files map.
 * All tsx/jsx items are included; filenames are resolved from first-line comments
 * with fallback to `App.tsx` / `File{N}.tsx`.
 */
export const buildSandpackFiles = (
    items: CodeExplainingEntity[],
): SandpackFiles => {
    const reactItems = items.filter(isReactItem)
    const files: SandpackFiles = {}
    const usedNames = new Set<string>()

    reactItems.forEach((item, idx) => {
        const raw = extractCodeFromFence(item.code)
        const detected = parseFilenameFromComment(raw)
        const code = detected ? raw.split("\n").slice(1).join("\n") : raw

        let name = detected ?? (idx === 0 ? "App.tsx" : `File${idx + 1}.tsx`)
        if (usedNames.has(name)) name = name.replace(/(\.\w+)$/, `_${idx}$1`)
        usedNames.add(name)

        files[`/${name}`] = { code }
    })

    return files
}
