"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SKILL_DOMAINS } from "../hooks/useQuerySkillGraphSwr"
import type { SkillStatus } from "../hooks/useQuerySkillGraphSwr"
import { domainVar } from "../palette"

const STATUSES: Array<SkillStatus> = ["mastered", "learning", "locked"]

/** Legend explaining domain colors, node statuses, and edge kinds. */
export const SkillGraphLegend = () => {
    const t = useTranslations()

    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-default bg-surface p-4">
            <div className="flex flex-col gap-2">
                <Typography type="body-xs" weight="medium" color="muted">
                    {t("skillGraph.legend.domains")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {SKILL_DOMAINS.map((domain) => (
                        <span key={domain} className="flex items-center gap-1.5">
                            <span
                                className="size-3 shrink-0 rounded-full"
                                style={{ backgroundColor: domainVar(domain) }}
                                aria-hidden
                            />
                            <Typography type="body-xs">{t(`skillGraph.domains.${domain}`)}</Typography>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-separator pt-3">
                <Typography type="body-xs" weight="medium" color="muted">
                    {t("skillGraph.legend.statuses")}
                </Typography>
                <div className="flex flex-wrap gap-3">
                    {STATUSES.map((status) => (
                        <span key={status} className="flex items-center gap-1.5">
                            <span
                                className="size-3 shrink-0 rounded-full border border-default"
                                style={{
                                    backgroundColor:
                                        status === "mastered"
                                            ? "var(--accent)"
                                            : status === "learning"
                                              ? "color-mix(in oklch, var(--accent) 55%, var(--surface))"
                                              : "var(--default)",
                                }}
                                aria-hidden
                            />
                            <Typography type="body-xs">{t(`skillGraph.statuses.${status}`)}</Typography>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-separator pt-3">
                <Typography type="body-xs" weight="medium" color="muted">
                    {t("skillGraph.legend.edges")}
                </Typography>
                <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1.5">
                        <svg width="20" height="6" aria-hidden focusable="false">
                            <line x1="0" y1="3" x2="20" y2="3" stroke="var(--muted)" strokeWidth="2" />
                        </svg>
                        <Typography type="body-xs">{t("skillGraph.edges.prerequisite")}</Typography>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg width="20" height="6" aria-hidden focusable="false">
                            <line
                                x1="0"
                                y1="3"
                                x2="20"
                                y2="3"
                                stroke="var(--muted)"
                                strokeWidth="2"
                                strokeDasharray="4 3"
                            />
                        </svg>
                        <Typography type="body-xs">{t("skillGraph.edges.related")}</Typography>
                    </span>
                </div>
            </div>
        </div>
    )
}
