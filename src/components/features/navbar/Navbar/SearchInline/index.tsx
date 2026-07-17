"use client"

import React from "react"
import { Kbd } from "@heroui/react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useSearchOverlayState } from "@/hooks/zustand/overlay/hooks"
import { InputButtonLike } from "@/components/blocks/buttons/InputButtonLike"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SearchInline}. */
export type SearchInlineProps = WithClassNames<undefined>

/**
 * Desktop navbar search trigger — a field-shaped button (via {@link InputButtonLike})
 * that OPENS the centered command palette on press instead of accepting typed input.
 * Shows the search label and the Ctrl/Cmd+K shortcut hint. The inline results dropdown
 * was retired in favour of the centered popup; typing + results now live entirely
 * inside {@link import("@/components/features/search/SearchOverlay").SearchOverlay}.
 *
 * Mounted only on `md`+ viewports (the navbar hides it below `md`, where the mobile
 * search icon opens the same popup).
 * @param props - optional placement class.
 */
export const SearchInline = ({ className }: SearchInlineProps) => {
    const t = useTranslations()
    const { open: openSearch } = useSearchOverlayState()

    return (
        <InputButtonLike
            className={className ?? "hidden w-[260px] md:flex"}
            onPress={openSearch}
            placeholder={t("search.label")}
            icon={<MagnifyingGlassIcon className="size-5 text-muted" aria-hidden focusable="false" />}
            suffix={
                <>
                    <Kbd><Kbd.Content>Ctrl</Kbd.Content></Kbd>
                    <Kbd><Kbd.Content>K</Kbd.Content></Kbd>
                </>
            }
        />
    )
}
