import { ArrowUpRightFromSquare as ArrowUpRightIcon } from "@gravity-ui/icons"
import { Link, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"


/** Minimal shape for content or challenge reference rows. */
export interface ReferenceLinkItem {
    id: string
    url: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    alias: string
}

export interface ReferenceLinksProps extends WithClassNames<undefined> {
    references: Array<ReferenceLinkItem>
    /** i18n key for section title (e.g. reference.title). */
    titleKey: string
}

/**
 * Sorted list of external reference links (content or challenge).
 */
export const ReferenceLinks = ({ references, titleKey, className }: ReferenceLinksProps) => {
    const t = useTranslations()
    if (references.length === 0) {
        return null
    }
    return (
        <div className={cn(className)}>
            <div className="font-semibold text-base text-foreground">
                {t(titleKey)}
            </div>
            <div className="h-3" />
            <ul className="flex flex-col gap-3">
                {references?.sort((prev, next) => prev.sortIndex - next.sortIndex).map((reference) => {
                    return (
                        <li key={reference.id} className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm text-muted">{reference.alias}</span>
                            <span className="text-sm text-foreground">•</span>
                            <Link
                                href={reference.url}
                                target="_blank"
                                className="text-sm text-primary"
                            >
                                {reference.url}
                                <ArrowUpRightIcon className="size-5" />
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
