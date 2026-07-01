import type {
    useTranslations,
} from "next-intl"

/** Translator returned by next-intl's `useTranslations`, passed to the renderers factory. */
export type MarkdownTranslator = ReturnType<typeof useTranslations>

/** Params for {@link buildMarkdownRenderers} — theme + translator drive the code blocks. */
export interface MarkdownRenderersParams {
    /** True when the app theme is dark; selects mermaid/shiki themes. */
    isDark: boolean
    /** Translator for table aria labels and diagram loading text. */
    t: MarkdownTranslator
    /** Figure captions keyed by trimmed mermaid source, paired from the following paragraph. */
    mermaidCaptions: Record<string, string>
    /**
     * Reading-grade typography: when true, body/headings render at the larger
     * long-form scale (16px body, stronger heading ladder) for full lesson
     * articles. Defaults to the compact scale used in cards / chat / modals.
     */
    reading?: boolean
}
