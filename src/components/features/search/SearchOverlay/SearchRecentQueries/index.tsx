import React from "react"
import { Typography } from "@heroui/react"
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

/** Props for {@link SearchRecentQueries}. */
export interface SearchRecentQueriesProps {
    /** Recent queries, most-recent-first. */
    recent: Array<string>
    /** Re-run a recent query (fills the input). */
    onSelect: (query: string) => void
    /** Clear all recent queries. */
    onClear: () => void
}

/**
 * Empty-query state of the overlay: the recent-searches list (selectable rows) with
 * a clear-all action, or a localized "start typing" hint when no history exists.
 */
export const SearchRecentQueries = ({ recent, onSelect, onClear }: SearchRecentQueriesProps) => {
    const t = useTranslations()

    if (recent.length === 0) {
        return (
            <Typography type="body-sm" color="muted" className="px-2 py-6 text-center">
                {t("search.idleHint")}
            </Typography>
        )
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-2">
                <Typography type="body-xs" weight="bold" color="muted" className="uppercase">
                    {t("search.recent")}
                </Typography>
                <button
                    type="button"
                    onClick={onClear}
                    className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                    {t("search.clearRecent")}
                </button>
            </div>
            <div className="flex flex-col">
                {recent.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onSelect(item)}
                        className="flex items-center gap-3 rounded-large p-2 text-left transition-colors hover:bg-accent/10"
                    >
                        <ClockCounterClockwiseIcon className="size-5 shrink-0 text-muted" aria-hidden focusable="false" />
                        <Typography type="body-sm" truncate>
                            {item}
                        </Typography>
                    </button>
                ))}
            </div>
        </div>
    )
}
