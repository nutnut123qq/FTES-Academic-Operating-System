"use client"
import { cn, ListBox } from "@heroui/react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import React, { useCallback } from "react"
import { AutocompleteGlobalSearchItem } from "@/modules/api/graphql/queries/types/autocomplete-global-search"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link GlobalSearchContentBlock}. */
interface GlobalSearchContentBlockProps extends WithClassNames<undefined> {
    /** Result rows for this bucket section. */
    items: Array<AutocompleteGlobalSearchItem>
}

/**
 * The list body of one global-search group (rows only) — rendered inside an accordion panel.
 * The section heading and hit count live on the accordion trigger in the parent.
 * Navigates to the pressed hit and closes the search modal.
 */
export const GlobalSearchContentBlock = (props: GlobalSearchContentBlockProps) => {
    const { items, className } = props
    const locale = useLocale()
    const router = useRouter()
    const { setOpen } = useSearchOverlayState()

    // Navigate to the canonical server-built route for the pressed hit, then close.
    const onItemPress = useCallback(
        (item: AutocompleteGlobalSearchItem) => {
            // ignore presses with no resolvable route (cache miss / unroutable kind)
            if (!item.path) return
            // server path is locale-agnostic → prepend the active locale
            router.push(`/${locale}${item.path}`)
            setOpen(false)
        }, [locale, router, setOpen])

    /** Render text with `<em>...</em>` as emphasized spans. */
    const renderEmText = (text: string) => {
        const match = text.match(/<em>(.*?)<\/em>/)

        if (!match || match.index === undefined) {
            return text
        }

        const before = 10
        const after = 40

        const start = Math.max(0, match.index - before)
        const end = Math.min(text.length, match.index + match[0].length + after)

        const sliced = text.slice(start, end)

        const parts = sliced.split(/(<em>.*?<\/em>)/g)

        return (
            <>
                {start > 0 ? "…" : null}
                {parts.map((part, index) => {
                    if (part.startsWith("<em>") && part.endsWith("</em>")) {
                        const content = part.replace(/<\/?em>/g, "")
                        return (
                            <span key={index} className="font-semibold text-accent underline decoration-accent/60">
                                {content}
                            </span>
                        )
                    }
                    return <span key={index}>{part}</span>
                })}
                {end < text.length ? "…" : null}
            </>
        )
    }

    if (items.length === 0) {
        return null
    }

    return (
        <ListBox aria-label="search results" className={cn("gap-0", className)}>
            {items.map((item) => {
                const titleLine = item.title ?? item.texts?.[0] ?? item.displayId
                const textLines = item.texts ?? []
                const textValue = [titleLine, ...textLines].join(" ").replace(/<[^>]*>/g, "")
                return (
                    <ListBox.Item
                        key={item.id}
                        className="rounded-lg py-1 data-[hovered=true]:bg-default-100 data-[pressed=true]:bg-default-200"
                        id={item.id}
                        textValue={textValue}
                        onAction={() => onItemPress(item)}
                    >
                        <div className="py-1">
                            <div className="text-sm text-foreground">{titleLine}</div>
                            {textLines.length > 0 ? (
                                <ul className="mt-1 list-none space-y-1.5 pl-0">
                                    {textLines.map((line: string) => (
                                        <li key={line}>
                                            <div className="text-xs text-muted">{renderEmText(line)}</div>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    </ListBox.Item>
                )
            })}
        </ListBox>
    )
}
