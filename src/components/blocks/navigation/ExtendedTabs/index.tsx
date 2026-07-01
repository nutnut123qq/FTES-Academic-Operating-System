import React from "react"
import type { ReactNode } from "react"
import { Tabs, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link ExtendedTabs} block. */
export interface ExtendedTabsProps extends WithClassNames<undefined> {
    /** Currently selected tab id (controlled). */
    selectedKey: string
    /** Fired with the newly selected tab id. */
    onSelectionChange: (key: string) => void
    /**
     * Tab anatomy — keep using the HeroUI compound parts inside:
     * `Tabs.ListContainer` > `Tabs.List` > `Tabs.Tab` (+ `Tabs.Indicator`).
     */
    children: ReactNode
}

/**
 * The StarCi standard tab strip: a thin wrapper over the HeroUI `Tabs` root that
 * bakes in the secondary (underline) variant — foreground text on the selected
 * tab + an accent indicator — and drops the built-in `.tabs__list` baseline (so
 * it never doubles up with an outer separator; see `.extended-tabs` in
 * globals.css). Drop-in replacement for `<Tabs>`; the children still use the
 * `Tabs.*` compound parts. Use this instead of styling `Tabs` per-feature.
 *
 * @param props - {@link ExtendedTabsProps}
 */
export const ExtendedTabs = ({
    selectedKey,
    onSelectionChange,
    children,
    className,
}: ExtendedTabsProps) => {
    return (
        <Tabs
            variant="secondary"
            selectedKey={selectedKey}
            onSelectionChange={(key) => onSelectionChange(String(key))}
            className={cn("extended-tabs", className)}
        >
            {children}
        </Tabs>
    )
}
