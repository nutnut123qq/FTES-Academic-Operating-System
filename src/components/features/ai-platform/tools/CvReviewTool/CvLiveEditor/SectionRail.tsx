"use client"

import React from "react"
import { Reorder, useDragControls } from "framer-motion"
import { Button, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    CaretDownIcon,
    CaretUpIcon,
    DotsSixVerticalIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@phosphor-icons/react"
import type { CvSectionKey } from "./layout"

/** One reorderable row in the "Bố cục" rail. */
const RailItem = ({
    sectionKey,
    label,
    hidden,
    index,
    count,
    onToggle,
    onMove,
}: {
    sectionKey: CvSectionKey
    label: string
    hidden: boolean
    index: number
    count: number
    onToggle: () => void
    onMove: (dir: -1 | 1) => void
}) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview.rail")
    const controls = useDragControls()

    return (
        <Reorder.Item
            value={sectionKey}
            dragListener={false}
            dragControls={controls}
            className={cn(
                "flex items-center gap-1.5 rounded-xl border border-default bg-surface px-2 py-1.5",
                hidden && "opacity-60",
            )}
        >
            <button
                type="button"
                aria-label={t("dragHandle", { section: label })}
                onPointerDown={(event) => controls.start(event)}
                className="cursor-grab touch-none text-foreground-400 active:cursor-grabbing"
            >
                <DotsSixVerticalIcon aria-hidden focusable="false" className="size-4" />
            </button>

            <Typography type="body-sm" className="flex-1 truncate">
                {label}
            </Typography>

            <div className="flex items-center">
                <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label={t("moveUp", { section: label })}
                    isDisabled={index === 0}
                    onPress={() => onMove(-1)}
                >
                    <CaretUpIcon aria-hidden focusable="false" className="size-4" />
                </Button>
                <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label={t("moveDown", { section: label })}
                    isDisabled={index === count - 1}
                    onPress={() => onMove(1)}
                >
                    <CaretDownIcon aria-hidden focusable="false" className="size-4" />
                </Button>
                <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label={hidden ? t("show", { section: label }) : t("hide", { section: label })}
                    aria-pressed={!hidden}
                    onPress={onToggle}
                >
                    {hidden ? (
                        <EyeSlashIcon aria-hidden focusable="false" className="size-4" />
                    ) : (
                        <EyeIcon aria-hidden focusable="false" className="size-4" />
                    )}
                </Button>
            </div>
        </Reorder.Item>
    )
}

export interface SectionRailProps {
    order: CvSectionKey[]
    hidden: CvSectionKey[]
    labels: Record<CvSectionKey, string>
    onReorder: (next: CvSectionKey[]) => void
    onToggle: (key: CvSectionKey) => void
    onMove: (index: number, dir: -1 | 1) => void
}

/**
 * The left "Bố cục" rail: drag to reorder the sections (pointer via the handle),
 * keyboard move up/down (a11y — framer `Reorder` is pointer-only), and an
 * eye toggle to show/hide. The header (name + contact) is always first and is
 * NOT part of this list, so it can never be reordered or hidden.
 */
export const SectionRail = ({
    order,
    hidden,
    labels,
    onReorder,
    onToggle,
    onMove,
}: SectionRailProps) => {
    const t = useTranslations("aiPlatform.toolPages.cvReview.rail")
    const hiddenSet = new Set(hidden)

    return (
        <aside className="flex w-full flex-col gap-2 sm:w-56 sm:shrink-0">
            <Typography type="body-sm" weight="semibold">
                {t("title")}
            </Typography>
            <Typography type="body-xs" color="muted">
                {t("hint")}
            </Typography>
            <Reorder.Group axis="y" values={order} onReorder={onReorder} className="flex flex-col gap-1.5">
                {order.map((key, index) => (
                    <RailItem
                        key={key}
                        sectionKey={key}
                        label={labels[key]}
                        hidden={hiddenSet.has(key)}
                        index={index}
                        count={order.length}
                        onToggle={() => onToggle(key)}
                        onMove={(dir) => onMove(index, dir)}
                    />
                ))}
            </Reorder.Group>
        </aside>
    )
}
