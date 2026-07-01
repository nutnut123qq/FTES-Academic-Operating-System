"use client"

import { Chip, ScrollShadow, Tooltip } from "@heroui/react"
import { useTranslations } from "next-intl"
import React, { useMemo, useState } from "react"
import { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link TagChips}.
 */
export interface TagChipsProps extends WithClassNames<{
    trigger: string
    content: string
}> {
    /** Tag labels to render (e.g. hashtags). */
    tags: Array<string>
    /**
     * Maximum number of tag chips to show before collapsing the rest into a +N chip.
     * @default 3
     */
    maxVisible?: number

    /** Visual variant passed to each `Chip`. */
    variant?: React.ComponentProps<typeof Chip>["variant"]
}

/**
 * Renders tags as `Chip`s; if there are more than `maxVisible` tags, shows only the first
 * `maxVisible` and a +N chip. Hovering the row opens a HeroUI `Dropdown` listing every tag
 * (controlled open + short close delay so the pointer can move into the menu).
 *
 * @param props.tags — Full list of tag strings.
 * @param props.maxVisible — Cut-off before overflow (default 3).
 */
export const TagChips = ({ tags, maxVisible = 3, variant = "soft", classNames }: TagChipsProps) => {
    const t = useTranslations()
    const [menuOpen, setMenuOpen] = useState(false)
    const visibleTags = useMemo(() => tags.slice(0, maxVisible), [tags, maxVisible])
    return (
        <div className="flex items-center gap-1.5">
            {visibleTags.map((tag, index) => (
                <Chip key={`${String(tag)}-${index}`} variant={variant}>
                    <Chip.Label>{tag}</Chip.Label>
                </Chip>
            ))}
            <Tooltip  delay={0} isOpen={menuOpen} onOpenChange={setMenuOpen}>
                <Tooltip.Trigger className={classNames?.trigger}>
                    <Chip color="default" variant={variant}>
                        <Chip.Label>{t("common.tagsMore", { count: tags.length - maxVisible })}</Chip.Label>
                    </Chip>
                </Tooltip.Trigger>
                <Tooltip.Content className={classNames?.content}>
                    <ScrollShadow className="max-h-[200px]" hideScrollBar={true} orientation="horizontal">
                        <div className="flex flex-col gap-1.5 text-sm">
                            {tags.map((tag) => (
                                <div key={tag}>{tag}</div>
                            ))}
                        </div>
                    </ScrollShadow>
                </Tooltip.Content>
            </Tooltip>
        </div>
    )
}
