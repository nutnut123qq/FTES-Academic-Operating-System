"use client"

import React from "react"
import {
    Button,
    Chip,
} from "@heroui/react"
import {
    CaretUpIcon,
    CaretDownIcon,
    TrashIcon,
    ArrowSquareOutIcon as ExternalLinkIcon,
    SealCheckIcon as VerifiedIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { MediaCard } from "@/components/blocks/cards/MediaCard"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import type { QueryUserPinnedProjectItem } from "@/modules/api/graphql/queries/types/user-pinned-projects"

/** Props for {@link PinnedProjectCard}. */
export interface PinnedProjectCardProps extends WithClassNames<undefined> {
    /** The pinned project to render (list-item data prop — store can't index it). */
    pin: QueryUserPinnedProjectItem
    /**
     * Owner-only management mode. When true the card renders move/remove controls
     * instead of behaving as a plain outbound link.
     */
    manage?: boolean
    /** Whether the move-up control is enabled (false for the first pin). */
    canMoveUp?: boolean
    /** Whether the move-down control is enabled (false for the last pin). */
    canMoveDown?: boolean
    /** True while a mutation touching this pin is in flight (disables controls). */
    isBusy?: boolean
    /** Move this pin one slot earlier. */
    onMoveUp?: (id: string) => void
    /** Move this pin one slot later. */
    onMoveDown?: (id: string) => void
    /** Remove this pin. */
    onRemove?: (id: string) => void
}

/**
 * Presentational card for a single pinned project. In display mode the whole
 * card is an outbound link (when the pin has a URL); in `manage` mode it exposes
 * reorder + remove controls. Built on the {@link MediaCard} block — title via
 * {@link Typography}, tech stack as Chips, and a success-toned "Verified by
 * StarCi" {@link StatusChip} for verified course pins.
 *
 * Pure list-item: receives its `pin` + callbacks from the parent, holds no store.
 *
 * @param props - {@link PinnedProjectCardProps}
 */
export const PinnedProjectCard = ({
    pin,
    manage = false,
    canMoveUp = false,
    canMoveDown = false,
    isBusy = false,
    onMoveUp,
    onMoveDown,
    onRemove,
    className,
}: PinnedProjectCardProps) => {
    const t = useTranslations()

    // verified badge + tech-stack chips share the meta row
    const meta = (
        <>
            {pin.isVerified ? (
                <StatusChip
                    tone="success"
                    icon={<VerifiedIcon className="size-3" aria-hidden="true" focusable="false" />}
                >
                    {t("pinnedProjects.verified")}
                </StatusChip>
            ) : null}
            {(pin.techStack ?? []).map((tech) => (
                <Chip key={tech} variant="soft" size="sm">
                    <Chip.Label>{tech}</Chip.Label>
                </Chip>
            ))}
        </>
    )

    // owner controls (manage mode) — reorder + remove, no outbound navigation
    const manageFooter = manage ? (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="secondary"
                isIconOnly
                isDisabled={isBusy || !canMoveUp}
                aria-label={t("pinnedProjects.moveUp")}
                onPress={() => onMoveUp?.(pin.id)}
            >
                <CaretUpIcon className="size-5" aria-hidden="true" focusable="false" />
            </Button>
            <Button
                size="sm"
                variant="secondary"
                isIconOnly
                isDisabled={isBusy || !canMoveDown}
                aria-label={t("pinnedProjects.moveDown")}
                onPress={() => onMoveDown?.(pin.id)}
            >
                <CaretDownIcon className="size-5" aria-hidden="true" focusable="false" />
            </Button>
            {pin.url ? (
                <Button
                    size="sm"
                    variant="secondary"
                    isIconOnly
                    aria-label={t("pinnedProjects.open")}
                    onPress={() => window.open(pin.url as string, "_blank", "noopener,noreferrer")}
                >
                    <ExternalLinkIcon className="size-5" aria-hidden="true" focusable="false" />
                </Button>
            ) : null}
            <Button
                size="sm"
                variant="danger"
                isIconOnly
                isPending={isBusy}
                aria-label={t("pinnedProjects.remove")}
                onPress={() => onRemove?.(pin.id)}
            >
                <TrashIcon className="size-5" aria-hidden="true" focusable="false" />
            </Button>
        </div>
    ) : undefined

    return (
        <MediaCard
            className={className}
            title={pin.title ?? t("pinnedProjects.untitled")}
            meta={pin.isVerified || (pin.techStack?.length ?? 0) > 0 ? meta : undefined}
            description={pin.description ?? undefined}
            footer={manageFooter}
            // display mode: the whole card is the outbound link (only when it has one)
            href={!manage && pin.url ? pin.url : undefined}
        />
    )
}
