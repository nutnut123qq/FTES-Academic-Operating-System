"use client"

import { Magnifier as MagnifyingGlassIcon } from "@gravity-ui/icons"
import React from "react"
import {
    Button,
    Kbd,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link SearchButton}.
 */
export type SearchButtonProps = WithClassNames<undefined>

/**
 * Navbar search trigger showing the label and the Ctrl/Cmd+K shortcut hint.
 *
 * Self-contained section (single-use): reads the search overlay singleton
 * itself and opens it on press, so the navbar just renders `<SearchButton />`.
 * `"use client"` for the singleton hook + press handler.
 * @param props - optional root class name
 */
export const SearchButton = ({ className }: SearchButtonProps) => {
    const t = useTranslations()
    const { open: onOpenSearch } = useSearchOverlayState()
    return (
        <Button className={cn("w-[300px] justify-between px-3", className)} variant="outline" onPress={onOpenSearch}>
            <span className="inline-flex items-center gap-1.5">
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span className="text-sm">{t("search.label")}</span>
            </span>
            <div className="flex items-center gap-1.5 hidden md:inline-flex">
                <Kbd>
                    <Kbd.Content>Ctrl</Kbd.Content>
                </Kbd>
                <Kbd>
                    <Kbd.Content>K</Kbd.Content>
                </Kbd>
            </div>
        </Button>
    )
}
