"use client"

import React from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { CodeExplainingEntity } from "@/modules/types/entities/code-explaining"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface ExplainingCardProps extends WithClassNames<undefined> {
    /** One code explaining row from `content.codeExplainings`. */
    item: CodeExplainingEntity
}

/**
 * Renders one critical code snippet and its explanation.
 * @param props.item - Code explaining entity for this card.
 */
export const ExplainingCard = ({ item, className }: ExplainingCardProps) => {
    const t = useTranslations()

    return (
        <article className={cn("rounded-xl border border-default-200 p-4 flex flex-col gap-3", className)}>
            <div className="flex items-center gap-2">
                <Chip variant="secondary" color="accent" size="sm">
                    <Chip.Label>{t("content.codeExplainings.indexLabel", { index: item.sortIndex })}</Chip.Label>
                </Chip>
                {item.lang ? (
                    <Chip variant="secondary" size="sm">
                        <Chip.Label>{item.lang}</Chip.Label>
                    </Chip>
                ) : null}
            </div>
            <MarkdownContent markdown={item.code} />
            <MarkdownContent markdown={item.explain} />
        </article>
    )
}
