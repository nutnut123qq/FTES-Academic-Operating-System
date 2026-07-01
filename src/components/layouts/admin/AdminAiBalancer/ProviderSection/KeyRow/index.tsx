"use client"

import React, {
    useCallback,
} from "react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import type { AiBalancerKeyHealth } from "@/modules/api/graphql/queries/types/ai-balancer-health"
import { AiBalancerKeyStatus } from "@/modules/api/graphql/queries/enums/ai-balancer-key-status"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { KeyStatusChip } from "@/components/reuseable/AiBalancer/KeyStatusChip"
import { formatBalancerTimestamp } from "@/components/reuseable/AiBalancer/utils/format-timestamp"

interface KeyRowProps extends WithClassNames<undefined> {
    /** Key health row from GraphQL. */
    keyHealth: AiBalancerKeyHealth
}

/**
 * Table row for one API key suffix in the admin balancer dashboard.
 *
 * List item: keeps its own `keyHealth` payload but reads locale + status labels
 * itself from the i18n hooks (no prop-drilled label resolvers).
 * @param props.keyHealth - Per-key health payload.
 */
export const KeyRow = ({
    keyHealth,
}: KeyRowProps) => {
    const locale = useLocale()
    const t = useTranslations("admin.aiBalancer")

    /** Maps a status enum value to its translated label. */
    const statusLabel = useCallback(
        (status: string) => {
            if (status === AiBalancerKeyStatus.Active) {
                return t("status.active")
            }
            if (status === AiBalancerKeyStatus.Disabled) {
                return t("status.disabled")
            }
            if (status === AiBalancerKeyStatus.Probing) {
                return t("status.probing")
            }
            return status
        },
        [
            t,
        ],
    )

    return (
        <tr className="border-t border-white/5 text-sm text-slate-300">
            <td className="px-4 py-2 font-mono text-slate-200">
                …{keyHealth.keySuffix}
            </td>
            <td className="px-4 py-2">
                <KeyStatusChip
                    status={keyHealth.status}
                    label={statusLabel(keyHealth.status)}
                />
            </td>
            <td className="px-4 py-2 text-center tabular-nums">
                {keyHealth.failCount}
            </td>
            <td className="px-4 py-2 text-slate-400">
                {formatBalancerTimestamp(keyHealth.lastHealthCheckAt, locale)}
            </td>
            <td className="px-4 py-2 text-slate-400">
                {formatBalancerTimestamp(keyHealth.lastUsedAt, locale)}
            </td>
        </tr>
    )
}
