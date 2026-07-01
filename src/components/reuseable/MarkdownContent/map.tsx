import React from "react"
import type { Components } from "react-markdown"
import { isInlineCode } from "react-shiki"
import * as HeroUI from "@heroui/react"
import {
    MarkdownTable,
    MarkdownTableBody,
    MarkdownTableColumn,
    MarkdownTableHead,
    MarkdownTableRow,
} from "./MarkdownTableParts"
import { CodeToHtml } from "./CodeToHtml"
import { LayoutWidget } from "./LayoutWidget"
import { MermaidDiagram } from "./MermaidDiagram"
import { RenderReactComponent } from "./RenderReactComponent"
import { TabsBlock, TabPane } from "./TabsBlock"
import { Link as IntlLink } from "@/i18n/navigation"
import type { MarkdownRenderersParams } from "./types"

// Named handles used by the markdown element renderers below.
const { Link, Table } = HeroUI

// Tailwind size class per the old HeroUI `Text` `size` token. HeroUI v3.0.5 renamed
// `Text` → `Typography` and its root no longer accepts `size`/`elementType`, so prose
// blocks render through this tiny local helper instead — keeping visuals pixel-identical
// and decoupled from the renamed component.
const PROSE_SIZE: Record<string, string> = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
}

/**
 * Minimal prose text node: renders `elementType` with a size class plus extra classes.
 * Drop-in for the former HeroUI `<Text elementType size className>` used by the markdown
 * heading/paragraph/list renderers.
 * @param props.elementType - HTML element/tag to render (default `div`).
 * @param props.size - Size token mapped to a Tailwind text-size class (default `sm`).
 * @param props.className - Extra classes appended after the size class.
 * @param props.children - Inline content.
 */
const ProseText = ({
    elementType: As = "div",
    size = "sm",
    className,
    children,
}: {
    elementType?: React.ElementType
    size?: keyof typeof PROSE_SIZE
    className?: string
    children?: React.ReactNode
}) => React.createElement(
    As,
    { className: [PROSE_SIZE[size], className].filter(Boolean).join(" ") },
    children,
)

/**
 * Recursively flattens a React children tree to its plain-text content — used to
 * derive a stable heading slug (and the "on this page" outline label) from the
 * rendered heading nodes.
 * @param node - The React node to read text from.
 * @returns The concatenated text content.
 */
const getNodeText = (node: React.ReactNode): string => {
    if (node === null || node === undefined || typeof node === "boolean") {
        return ""
    }
    if (typeof node === "string" || typeof node === "number") {
        return String(node)
    }
    if (Array.isArray(node)) {
        return node.map(getNodeText).join("")
    }
    if (React.isValidElement(node)) {
        return getNodeText((node.props as { children?: React.ReactNode }).children)
    }
    return ""
}

/**
 * Slugify heading text into a URL-safe anchor id (diacritics stripped, Vietnamese
 * `đ`→`d`, non-alphanumerics collapsed to single hyphens). Deterministic so the
 * rendered heading id and any "on this page" outline reading it from the DOM agree.
 * @param text - The raw heading text.
 * @returns The anchor slug.
 */
const slugify = (text: string): string =>
    text
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

/**
 * Heading renderer factory: renders a section heading carrying a slug `id` +
 * `data-toc` markers so an "on this page" rail can scan the rendered article
 * (`#lesson-article [data-toc]`) and anchor-scroll to it. `scroll-mt-20` clears
 * the sticky navbar when jumped to.
 * @param level - The heading depth surfaced in the outline (2 or 3).
 * @param sizeClass - The prose size class keeping the visual identical to {@link ProseText}.
 */
const buildTocHeading = (level: 2 | 3 | 4, sizeClass: string, marginClass: string, anchorLabel: string) =>
    ({ children }: { children?: React.ReactNode }) => {
        // real heading tag (not a div) so the body keeps semantic outline for SEO
        const Tag = `h${level}` as "h2" | "h3" | "h4"
        const text = getNodeText(children)
        const id = slugify(text)
        return (
            <Tag
                id={id}
                data-toc=""
                data-toc-level={level}
                // clean label for the "on this page" rail — read instead of textContent so the
                // hover anchor (#) and any inline code in the heading never leak into the outline.
                data-toc-label={text}
                className={`group ${marginClass} ${sizeClass} scroll-mt-20 font-semibold`.trim()}
            >
                {children}
                {/* Hover anchor (#) — copy/share a deep link to the section (reading only). */}
                {anchorLabel ? (
                    <a
                        href={`#${id}`}
                        aria-label={anchorLabel}
                        className="ml-2 text-muted no-underline opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        #
                    </a>
                ) : null}
            </Tag>
        )
    }

/**
 * Builds the element-renderer map handed to `ReactMarkdown` so headings, tables, code
 * blocks, mermaid diagrams and inline elements use the app's HeroUI typography.
 *
 * Vertical rhythm is owned by the single `space-y` wrapper in {@link MarkdownContent}; block
 * renderers here stay margin-free and only carry size/weight/colour tokens.
 * @param params - {@link MarkdownRenderersParams} theme flag + translator + mermaid captions.
 * @returns A `Components` map keyed by markdown element name.
 */
export const buildMarkdownRenderers = ({
    isDark,
    t,
    mermaidCaptions,
    reading = false,
}: MarkdownRenderersParams): Components => {
    // Long-form lessons read the larger scale; cards / chat / modals keep the compact one.
    const bodySize = reading ? "base" : "sm"
    const h2Size = reading ? PROSE_SIZE["2xl"] : PROSE_SIZE.lg
    const h3Size = reading ? PROSE_SIZE.xl : PROSE_SIZE.base
    // Reading-only asymmetric rhythm: a heading carries MORE space above than below so it
    // reads as a new section binding to the text under it (Tailwind-prose style). Compact
    // mode leaves block renderers margin-free and relies on the wrapper's uniform space-y.
    const h2Margin = reading ? "mt-10 mb-3" : ""
    const h3Margin = reading ? "mt-8 mb-3" : ""
    const blockMy = reading ? "my-4" : ""
    // Heading deep-link anchor only in reading mode (cards / chat have no shareable url).
    const anchorLabel = reading ? t("markdown.headingAnchor") : ""
    return ({
        h1: ({ children }) => (
            <ProseText elementType="h1" size={reading ? "2xl" : "xl"} className={reading ? "mb-4 font-semibold" : "font-semibold"}>{children}</ProseText>
        ),
        h2: buildTocHeading(2, h2Size, h2Margin, anchorLabel),
        h3: buildTocHeading(3, h3Size, h3Margin, anchorLabel),
        // TOC caps at 3 levels (h2/h3/h4). Reading h4 goes through the TOC factory (id + data-toc
        // + anchor) so 2.1.x sub-sections show in the rail; compact (cards/chat, no TOC) stays muted.
        h4: reading
            ? buildTocHeading(4, PROSE_SIZE.base, "mt-6 mb-2", anchorLabel)
            : ({ children }) => <ProseText elementType="h4" size="sm" className="font-semibold text-muted">{children}</ProseText>,
        // h5 stays a readable heading in the article (foreground + weight in reading) but is NOT in
        // the TOC — deeper than 3 levels (e.g. 2.1.3.2 → h5) would over-nest the outline rail.
        h5: ({ children }) => (
            reading
                ? <ProseText elementType="h5" size="sm" className="mt-4 mb-2 font-semibold">{children}</ProseText>
                : <ProseText elementType="h5" size="sm" className="font-semibold text-muted">{children}</ProseText>
        ),
        h6: ({ children }) => (
            reading
                ? <ProseText elementType="h6" size="sm" className="mt-4 mb-2 font-semibold text-muted">{children}</ProseText>
                : <ProseText elementType="h6" size="xs" className="font-semibold text-muted">{children}</ProseText>
        ),
        // Custom `:::muted` directive tags (see remarkMuted in ./index): small, muted label text.
        // `[&_*]:text-muted` forces the muted colour onto any inner `<p>` the container wraps.
        mutedblock: ({ children }: { children?: React.ReactNode }) => (
            <ProseText elementType="div" size="sm" className="font-semibold text-muted [&_*]:text-muted">{children}</ProseText>
        ),
        mutedtext: ({ children }: { children?: React.ReactNode }) => (
            <ProseText elementType="span" size="sm" className="font-semibold text-muted">{children}</ProseText>
        ),
        // Custom `:::chip` directive tag (see remarkChip in ./index): a wrapped row of soft chips,
        // one per authored keyword line. `items` is the `|`-joined keyword list.
        chipblock: ({ items }: { items?: string }) => (
            <span className="my-2 flex flex-wrap gap-2">
                {String(items ?? "").split("|").filter(Boolean).map((keyword, index) => (
                    <HeroUI.Chip key={index} size="sm" variant="soft" color="default">{keyword}</HeroUI.Chip>
                ))}
            </span>
        ),
        // :::tab → [ Preview | Code ] tabs; code/preview panes carry `kind` so TabsBlock can match them.
        tabblock: ({ children }: { children?: React.ReactNode }) => <TabsBlock>{children}</TabsBlock>,
        tabcode: ({ children }: { children?: React.ReactNode }) => <TabPane kind="code">{children}</TabPane>,
        tabpreview: ({ children }: { children?: React.ReactNode }) => <TabPane kind="preview">{children}</TabPane>,
        // ::::accordion / :::panel{title} → HeroUI collapsible accordion (see remarkAccordion in ./index).
        // Use the DEFAULT variant (no baked bg-surface to fight) + an explicit bg-default fill — the
        // same distinct neutral the code blocks use — so the accordion clearly stands apart from the
        // page bg in dark mode. (Surface variant's bg-surface ≈ page bg → it blended in.)
        accordionblock: ({ children }: { children?: React.ReactNode }) => (
            <HeroUI.Accordion variant="surface" className={`${reading ? "my-4" : "my-2"} overflow-hidden border border-default`}>{children}</HeroUI.Accordion>
        ),
        accordionpanel: ({ title, children }: { title?: string, children?: React.ReactNode }) => (
            <HeroUI.Accordion.Item aria-label={String(title ?? "")}>
                <HeroUI.Accordion.Heading>
                    <HeroUI.Accordion.Trigger>
                        <div className="flex w-full items-center justify-between gap-3 text-start">
                            <span className={reading ? "text-base font-semibold" : "text-sm font-semibold"}>{title}</span>
                            <HeroUI.Accordion.Indicator />
                        </div>
                    </HeroUI.Accordion.Trigger>
                </HeroUI.Accordion.Heading>
                <HeroUI.Accordion.Panel>
                    <HeroUI.Accordion.Body>
                        <div className="space-y-2">{children}</div>
                    </HeroUI.Accordion.Body>
                </HeroUI.Accordion.Panel>
            </HeroUI.Accordion.Item>
        ),
        table: ({ children }) => (
            <MarkdownTable ariaLabel={t("markdown.tableAriaLabel")} className={blockMy}>
                {children}
            </MarkdownTable>
        ),
        thead: MarkdownTableHead,
        img: ({ src, alt }) => (
            // Markdown `![caption](src)`: a non-empty alt doubles as a real figure caption;
            // an empty alt renders a bare (decorative) image.
            alt ? (
                <figure className={reading ? "my-4" : undefined}>
                    <img src={src} alt={alt} className="w-full rounded-xl border border-default" />
                    <figcaption className="mt-2 text-center text-sm italic text-muted">{alt}</figcaption>
                </figure>
            ) : (
                <img src={src} alt="" className={`${reading ? "my-4 " : ""}w-full rounded-xl border border-default`} />
            )
        ),
        tbody: MarkdownTableBody,
        th: MarkdownTableColumn,
        td: ({ children }) => <Table.Cell>{children}</Table.Cell>,
        tr: MarkdownTableRow,
        code: (
            { children, node }
        ) => {
            const code = String(children).trim()
            const isInline = node ? isInlineCode(node) : undefined
            if (!isInline) {
                return children
            }
            // Neutral inline code (GitHub/Stripe-style): subtle surface + foreground text, NOT
            // the brand accent — accent is reserved for links so a keyword-dense paragraph stays calm.
            return (
                <code className="rounded-md bg-default px-1 py-0.5 font-mono text-sm text-foreground">
                    {code}
                </code>
            )
        },
        pre: ({ children }) => {
            const child = React.Children.only(children) as React.ReactElement
            const className = (child.props as { className?: string }).className || ""
            const match = /language-(\w+)/.exec(className)
            const lang = match?.[1] || "bash"
            const code = String((child.props as { children?: React.ReactNode }).children || "").replace(/\n$/, "")
            if (lang.toLowerCase() === "mermaid") {
                return (
                    <MermaidDiagram
                        code={code}
                        theme={isDark ? "dark" : "default"}
                        loadingLabel={t("markdown.mermaidRendering")}
                        expandLabel={t("markdown.mermaidExpand")}
                        caption={mermaidCaptions[code.trim()]}
                        fallbackLabel={t("markdown.mermaidFigureLabel")}
                        className={blockMy}
                    />
                )
            }
            // ```mdx fence → live HeroUI render (render-only; tabs come from a :::tab block).
            if (lang.toLowerCase() === "mdx") {
                return <RenderReactComponent code={code} />
            }
            if (lang.toLowerCase() === "layout") {
                return <LayoutWidget html={code} />
            }
            return (
                <CodeToHtml
                    code={code}
                    language={lang}
                    theme={isDark
                        ? "material-theme-darker"
                        : "material-theme-lighter"}
                    className={blockMy}
                />
            )
        },
        blockquote: ({ children }) => (
            <blockquote className={`${reading ? "my-4 " : ""}space-y-2 rounded-r-xl border-l-2 border-accent bg-default/40 px-4 py-2 text-muted`}>
                {children}
            </blockquote>
        ),
        // Bold = weight only — no colour jump — so a keyword-heavy paragraph doesn't flicker.
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        hr: () => <hr className={`${reading ? "my-6 " : ""}border-default`} />,
        ol: ({ children }) => <ol className={`${reading ? "my-4 " : ""}list-decimal space-y-2 pl-5 marker:text-muted`}>{children}</ol>,
        ul: ({ children }) => <ul className={`${reading ? "my-4 " : ""}list-disc space-y-2 pl-5 marker:text-muted`}>{children}</ul>,
        li: ({ children }) => (
            <ProseText elementType="li" size={bodySize} className="space-y-2 leading-relaxed">{children}</ProseText>
        ),
        p: ({ children }) => (
            <ProseText elementType="div" size={bodySize} className={reading ? "mb-4 leading-relaxed" : "leading-relaxed"}>{children}</ProseText>
        ),
        a: ({ href, children }) => {
        // Internal links (e.g. related-problem `/practice/<slug>`) navigate in-app
        // (same tab, locale-aware) via the next-intl Link; external links open a new tab.
            const isInternal = typeof href === "string" && href.startsWith("/")
            if (isInternal) {
                return (
                    <IntlLink href={href} className="!inline text-accent underline underline-offset-2">
                        {children}
                    </IntlLink>
                )
            }
            return (
                <Link href={href} target="_blank" className="!inline text-accent underline underline-offset-2">
                    {children}
                </Link>
            )
        },
    } as Components)
}
