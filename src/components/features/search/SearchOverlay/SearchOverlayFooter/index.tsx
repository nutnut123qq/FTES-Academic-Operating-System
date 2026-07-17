import React from "react"
import { Kbd, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/**
 * Persistent command-palette footer: the keyboard-hint row spelling out the
 * shortcuts — move (↑↓), open (⏎), and close (Esc). Purely informational; the
 * palette navigates directly from a selected row (no interstitial `/search` step),
 * so there is no "see all results" handoff here.
 */
export const SearchOverlayFooter = () => {
    const t = useTranslations()
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-default px-4 py-3">
            <span className="inline-flex items-center gap-1.5">
                <Kbd><Kbd.Content>↑</Kbd.Content></Kbd>
                <Kbd><Kbd.Content>↓</Kbd.Content></Kbd>
                <Typography type="body-xs" color="muted">
                    {t("search.hint.move")}
                </Typography>
            </span>
            <span className="inline-flex items-center gap-1.5">
                <Kbd><Kbd.Content>↵</Kbd.Content></Kbd>
                <Typography type="body-xs" color="muted">
                    {t("search.hint.open")}
                </Typography>
            </span>
            <span className="inline-flex items-center gap-1.5">
                <Kbd><Kbd.Content>Esc</Kbd.Content></Kbd>
                <Typography type="body-xs" color="muted">
                    {t("search.hint.close")}
                </Typography>
            </span>
        </div>
    )
}
