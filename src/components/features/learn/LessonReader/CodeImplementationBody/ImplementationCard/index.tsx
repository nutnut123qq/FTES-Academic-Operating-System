"use client"

import React from "react"
import { Chip, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import type { CodeImplementationEntity } from "@/modules/types/entities/code-implementation"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface ImplementationCardProps extends WithClassNames<undefined> {
    /** One implementation guide row from `content.codeImplementations`. */
    item: CodeImplementationEntity
}

/**
 * Renders guide and example for one target language.
 * @param props.item - Code implementation entity for this card.
 */
export const ImplementationCard = ({ item, className }: ImplementationCardProps) => {
    const t = useTranslations()

    return (
        <article className={cn("rounded-xl border border-default-200 p-4 flex flex-col gap-6", className)}>
            <Chip variant="secondary" color="accent" size="sm" className="w-fit">
                <Chip.Label>{item.lang}</Chip.Label>
            </Chip>
            <div>
                <h3 className="text-sm font-semibold mb-2">
                    {t("content.codeImplementation.guideHeading")}
                </h3>
                <MarkdownContent markdown={item.guide} />
            </div>
            <div>
                <h3 className="text-sm font-semibold mb-2">
                    {t("content.codeImplementation.exampleHeading")}
                </h3>
                <MarkdownContent markdown={item.example} />
            </div>
        </article>
    )
}
