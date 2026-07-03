"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

import {
    useSubjectAiStore,
    type SubjectAiModel,
} from "@/hooks/zustand/subjectAi"

import { ToolSurfaceHeader } from "../../ToolSurfaceHeader"

/** Props for {@link TutorSettings}. */
export interface TutorSettingsProps {
    subjectId: string
    /** Active answering model (read-only context here). */
    model: SubjectAiModel
    /** Back to the chat view. */
    onBack: () => void
}

/**
 * In-panel tutor settings: the active model as read-only context + a destructive
 * "clear all conversations" action (scoped to this subject). Renders in-place.
 */
export const TutorSettings = ({
    subjectId,
    model,
    onBack,
}: TutorSettingsProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const clearSubject = useSubjectAiStore((s) => s.clearSubject)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    return (
        <div className="flex flex-col gap-6 p-6">
            <ToolSurfaceHeader
                title={t("subjects.aiTools.tutor.settings")}
                onBack={onBack}
                backLabel={t("common.back")}
                headingRef={headingRef}
            />

            <div className="flex flex-col gap-2">
                <Typography type="body-sm" weight="medium" color="muted">
                    {t("subjects.aiTools.tutor.modelLabel")}
                </Typography>
                <div className="rounded-2xl border border-separator p-3">
                    <Typography type="body-sm">{model}</Typography>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Typography type="body-sm" color="muted">
                    {t("subjects.aiTools.tutor.clearHint")}
                </Typography>
                <Button
                    variant="danger"
                    className="self-start"
                    onPress={() => {
                        clearSubject(subjectId)
                        onBack()
                    }}
                >
                    {t("subjects.aiTools.tutor.clearAction")}
                </Button>
            </div>
        </div>
    )
}
