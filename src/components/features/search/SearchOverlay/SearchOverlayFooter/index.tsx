import React from "react"
import { Kbd, Typography } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

/** Props for {@link SearchOverlayFooter}. */
export interface SearchOverlayFooterProps {
    /** Navigate to `/search?q=…` with the current query. */
    onSeeAll: () => void
    /** Whether the see-all action is enabled (query present). */
    canSeeAll: boolean
}

/**
 * Persistent overlay footer: the "See all results" handoff to `/search?q=…` plus the
 * keyboard-hint row (↑↓ move · Enter open · Esc close).
 */
export const SearchOverlayFooter = ({ onSeeAll, canSeeAll }: SearchOverlayFooterProps) => {
    const t = useTranslations()
    return (
        <div className="flex items-center justify-between gap-2 pt-2">
            <button
                type="button"
                onClick={onSeeAll}
                disabled={!canSeeAll}
                className="inline-flex items-center gap-1 rounded-md text-sm text-accent underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
            >
                {t("search.seeAll")}
                <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
            </button>
            <div className="hidden items-center gap-3 sm:flex">
                <span className="inline-flex items-center gap-1">
                    <Kbd><Kbd.Content>↑</Kbd.Content></Kbd>
                    <Kbd><Kbd.Content>↓</Kbd.Content></Kbd>
                    <Typography type="body-xs" color="muted">
                        {t("search.hint.move")}
                    </Typography>
                </span>
                <span className="inline-flex items-center gap-1">
                    <Kbd><Kbd.Content>↵</Kbd.Content></Kbd>
                    <Typography type="body-xs" color="muted">
                        {t("search.hint.open")}
                    </Typography>
                </span>
                <span className="inline-flex items-center gap-1">
                    <Kbd><Kbd.Content>esc</Kbd.Content></Kbd>
                    <Typography type="body-xs" color="muted">
                        {t("search.hint.close")}
                    </Typography>
                </span>
            </div>
        </div>
    )
}
