"use client"

import React, { useState } from "react"
import {
    cn,
    Drawer,
} from "@heroui/react"
import { CaretRightIcon, GearSixIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import {
    PersonalProjectSubmission,
} from "../PersonalProjectSubmission"
import {
    GithubGradingSettings,
} from "../GithubGradingSettings"
import {
    TaskActions,
} from "../TaskActions"
import {
    TaskResults,
} from "../TaskResults"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { usePersonalProjectGithubStore } from "@/hooks/zustand/personalProjectGithub/store"

/** Props for {@link TaskSubmissionPanel}. */
export type TaskSubmissionPanelProps = WithClassNames<undefined>

/**
 * The persistent submission panel — the RIGHT, sticky side of the split workspace.
 *
 * Progressive disclosure: the panel keeps only the primary loop — the GitHub repo URL
 * ({@link PersonalProjectSubmission}), the evaluate/feedback actions ({@link TaskActions}), and the
 * latest grading result ({@link TaskResults}). The set-once config (grading language, branch,
 * private-repo token) is moved into a settings Drawer ({@link GithubGradingSettings}), opened from a
 * read-only summary row. The submission is per-project (not per-task), so this panel does NOT gate
 * on the selected task — only the left brief column swaps per task.
 * @param props - optional className for the root element
 */
export const TaskSubmissionPanel = ({
    className,
}: TaskSubmissionPanelProps = {}) => {
    const t = useTranslations()
    const [isSettingsOpen, setSettingsOpen] = useState(false)
    // read-only summary of the current grading config (what the Drawer edits)
    const lang = usePersonalProjectGithubStore((state) => state.lang)
    const branch = usePersonalProjectGithubStore((state) => state.branch)
    const langLabelMap: Record<string, string> = {
        typescript: t("programmingLanguage.typescript"),
        java: t("programmingLanguage.java"),
        csharp: t("programmingLanguage.csharp"),
        go: t("programmingLanguage.go"),
    }

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <LabeledCard
                label={t("finalProject.page.submitGithub.title")}
                contentClassName="flex flex-col gap-6"
            >
                {/* URL + the settings row are one config GROUP (gap-3 — related); the CTA
                    below is a separate section, kept gap-6 away by the card content. */}
                <div className="flex flex-col gap-3">
                    <PersonalProjectSubmission />
                    {/* settings summary row → opens the drawer. Interactive, so it has a hover:
                        the label "Cài đặt chấm điểm" underlines (a link affordance); the
                        right-side config preview stays muted (no colour change). */}
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        aria-label={t("finalProject.page.submitGithub.settingsTitle")}
                        aria-expanded={isSettingsOpen}
                        className="group flex cursor-pointer items-center justify-between gap-3 rounded-medium bg-default-100 px-3 py-2 text-left"
                    >
                        <span className="flex items-center gap-2 text-sm">
                            <GearSixIcon className="size-4 shrink-0" />
                            <span className="group-hover:underline">{t("finalProject.page.submitGithub.settingsTitle")}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-2 text-xs text-muted">
                            <span className="truncate">{(langLabelMap[lang] ?? lang)} · {branch}</span>
                            <CaretRightIcon className="size-4 shrink-0" />
                        </span>
                    </button>
                </div>
                <TaskActions />
            </LabeledCard>
            <TaskResults />

            {/* grading-settings Drawer (set-once config: language / branch / token) */}
            <Drawer>
                <Drawer.Backdrop isOpen={isSettingsOpen} onOpenChange={setSettingsOpen} className="backdrop-blur-sm">
                    <Drawer.Content placement="right">
                        <Drawer.Dialog className="p-0">
                            <div className="p-3">
                                <Drawer.CloseTrigger />
                                <Drawer.Header>
                                    <Drawer.Heading>{t("finalProject.page.submitGithub.settingsTitle")}</Drawer.Heading>
                                </Drawer.Header>
                            </div>
                            <div className="border-b" />
                            <Drawer.Body className="p-6 pt-3">
                                <GithubGradingSettings />
                            </Drawer.Body>
                        </Drawer.Dialog>
                    </Drawer.Content>
                </Drawer.Backdrop>
            </Drawer>
        </div>
    )
}
