"use client"

import React, { useMemo } from "react"
import { Card, CardContent, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CpuIcon } from "@phosphor-icons/react"
import type { AiKeyHealthGroup } from "@/modules/api/graphql/queries/types/ai-key-health"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AiKeyGroup}. */
export interface AiKeyGroupProps extends WithClassNames<undefined> {
    /** One per-model AI key health group from GraphQL. */
    group: AiKeyHealthGroup
}

/**
 * One model group of AI keys on the public status page. Header reads
 * "<models> · <provider> · healthy/total keys"; below it a row of masked key
 * chips, each tinted success (healthy) or danger (unhealthy). Token-only colors
 * → works light + dark. The masked label (`sk-...x9f`) is all that is shown.
 *
 * List item: keeps its own `group` payload but reads its own labels from i18n.
 * @param props.group - Masked AI key health for one model.
 */
export const AiKeyGroup = ({ group }: AiKeyGroupProps) => {
    const t = useTranslations("status")

    const header = useMemo(() => {
        const models = group.models.join(", ") || group.provider
        return t("aiKeyGroupHeader", {
            models,
            provider: group.provider,
            healthy: group.healthyKeys,
            total: group.totalKeys,
        })
    }, [group, t])

    return (
        <Card className="border border-default bg-surface">
            <CardContent className="gap-3 p-4">
                <div className="flex items-center gap-2">
                    <CpuIcon
                        aria-hidden
                        focusable="false"
                        className="size-4 shrink-0 text-muted"
                    />
                    <span className="text-sm font-medium text-foreground">
                        {header}
                    </span>
                </div>
                {group.keys.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {group.keys.map((key, index) => (
                            <span
                                key={`${key.keyMask}-${index}`}
                                className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-medium",
                                    key.healthy
                                        ? "bg-success/10 text-success"
                                        : "bg-danger/10 text-danger",
                                )}
                            >
                                {key.keyMask}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-xs text-muted">{t("noKeys")}</span>
                )}
            </CardContent>
        </Card>
    )
}
