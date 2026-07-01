"use client"

import React, {
    useMemo,
} from "react"
import {
    KeyStatusChipVariant,
} from "../enums"
import {
    AI_BALANCER_KEY_STATUS_DARK_MAP,
    AI_BALANCER_KEY_STATUS_LIGHT_MAP,
} from "../map"
import { cn } from "@heroui/react"
import { AiBalancerKeyStatus } from "@/modules/api/graphql/queries/enums/ai-balancer-key-status"
import type { WithClassNames } from "@/modules/types/base/class-name"

interface KeyStatusChipProps extends WithClassNames<undefined> {
    /** Raw status string from GraphQL (`active` / `disabled` / `probing`). */
    status: string
    /** Translated label for the status. */
    label: string
    /** Light vs dark chip palette (defaults to dark). */
    variant?: KeyStatusChipVariant
}

/**
 * Colored status chip for one balancer API key row.
 *
 * @param props.status - Backend key lifecycle status.
 * @param props.label - Localized status label.
 * @param props.variant - Surface palette (light learn page vs dark admin).
 */
export const KeyStatusChip = ({
    status,
    label,
    variant = KeyStatusChipVariant.Dark,
    className,
}: KeyStatusChipProps) => {
    const visual = useMemo(
        () => {
            const map = variant === KeyStatusChipVariant.Light
                ? AI_BALANCER_KEY_STATUS_LIGHT_MAP
                : AI_BALANCER_KEY_STATUS_DARK_MAP
            return map[status]
                ?? map[AiBalancerKeyStatus.Active]
        },
        [
            status,
            variant,
        ],
    )

    const StatusIcon = visual.Icon

    return (
        <span
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", visual.chipClassName, className)}
        >
            <StatusIcon
                className="h-3.5 w-3.5"
            />
            {label}
        </span>
    )
}
