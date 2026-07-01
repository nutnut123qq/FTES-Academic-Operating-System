"use client"

import React from "react"
import {
    Accordion,
    Typography,
} from "@heroui/react"
import {
    CaretRightIcon,
} from "@phosphor-icons/react"
import {
    useTranslations,
} from "next-intl"
import _ from "lodash"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import { MarkdownContent } from "@/components/reuseable/MarkdownContent"
import { CourseContentTier } from "@/modules/types/enums/course-content-tier"
import { type ModuleEntity } from "@/modules/types/entities/module"

/** Chip tone per learning tier (foundation → advanced reads easy → hard). */
const TIER_TONE: Record<CourseContentTier, "success" | "warning" | "danger"> = {
    [CourseContentTier.Foundation]: "success",
    [CourseContentTier.Intermediate]: "warning",
    [CourseContentTier.Advanced]: "danger",
}

/** Props for {@link ModuleAccordionItem}. */
export interface ModuleAccordionItemProps extends WithClassNames<undefined> {
    /** The module to render as one accordion row (list-item data prop). */
    module: ModuleEntity
}

/**
 * One curriculum module as an accordion row: title + tier badge + premium lock in
 * the trigger; lesson/minute meta + description + free preview bullets in the
 * panel. List-item (rendered in a `.map`), so it takes the `module` data prop.
 *
 * @param props - {@link ModuleAccordionItemProps}
 */
export const ModuleAccordionItem = ({ module }: ModuleAccordionItemProps) => {
    const t = useTranslations()

    const contents = module.contents ?? []
    const minutes = contents.reduce((sum, content) => sum + (content.minutesRead ?? 0), 0)
    const lessonCount = module.numContents || contents.length
    const previews = _.cloneDeep(module.previewContents ?? []).sort(
        (a, b) => a.sortIndex - b.sortIndex,
    )

    return (
        <Accordion.Item aria-label={module.title}>
            <Accordion.Heading>
                <Accordion.Trigger>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <Typography type="body-sm" weight="medium" truncate className="min-w-0">
                            {module.title}
                        </Typography>
                        <div className="flex shrink-0 items-center gap-2">
                            {module.contentTier ? (
                                <StatusChip tone={TIER_TONE[module.contentTier]}>
                                    {t(`courseLanding.tier.${module.contentTier}`)}
                                </StatusChip>
                            ) : null}
                            {previews.length > 0 ? (
                                <StatusChip tone="neutral">
                                    {t("courseLanding.previewCount", { count: previews.length })}
                                </StatusChip>
                            ) : null}
                        </div>
                    </div>
                </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
                <Accordion.Body>
                    <div className="flex flex-col gap-3">
                        <Typography type="body-xs" color="muted">
                            {t("courseLanding.moduleMeta", { lessons: lessonCount, minutes })}
                        </Typography>
                        {module.description ? (
                            <MarkdownContent markdown={module.description} />
                        ) : null}
                        {previews.length > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {previews.map((preview) => (
                                    <li key={preview.id} className="flex items-start gap-2">
                                        <CaretRightIcon aria-hidden focusable="false" className="size-4 shrink-0 text-muted" />
                                        <Typography type="body-sm" color="muted">
                                            {preview.text}
                                        </Typography>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                </Accordion.Body>
            </Accordion.Panel>
        </Accordion.Item>
    )
}
