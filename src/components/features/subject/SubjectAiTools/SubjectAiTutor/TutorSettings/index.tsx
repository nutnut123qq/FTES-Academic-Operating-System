"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

import { deleteAiSessions } from "@/modules/api/rest/ai"

import { ToolSurfaceHeader } from "../../ToolSurfaceHeader"
import { useTutorSessionsInfiniteSwr } from "../useSubjectTutorSwr"

/** Props for {@link TutorSettings}. */
export interface TutorSettingsProps {
    /**
     * UUID of the subject being cleared — the value stored in `context_ref`, NOT the
     * code from the route. Sending nothing here would wipe EVERY tutor conversation of
     * the user, so it is required.
     */
    subjectUuid: string
    /** Active answering model, already shortened for display (read-only context). */
    modelLabel: string
    /** Back to the chat view. */
    onBack: () => void
    /** Fired after the subject's conversations were archived (parent resets the thread). */
    onCleared?: () => void
}

/**
 * In-panel tutor settings: the active model as read-only context + a destructive
 * "archive this subject's conversations" action.
 *
 * The clear is ONE request — `DELETE /api/v1/ai/sessions?feature=TUTOR_CHAT&subjectId=…`
 * — instead of the old `DELETE /ai/sessions/{id}` loop, which was both N+1 AND wiped the
 * user's conversations in OTHER subjects (the list was not scoped). The BE answers
 * `{archived}`, the number of rows that actually flipped, and that count is shown rather
 * than swallowed; a repeat press legitimately archives `0`.
 *
 * A failure surfaces its own message and does NOT fire `onCleared`, but the list is
 * revalidated either way: a partially applied archive must not leave a stale list behind.
 */
export const TutorSettings = ({
    subjectUuid,
    modelLabel,
    onBack,
    onCleared,
}: TutorSettingsProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const sessionsSwr = useTutorSessionsInfiniteSwr(subjectUuid)
    const [isClearing, setIsClearing] = React.useState(false)
    const [clearError, setClearError] = React.useState(false)
    const [archivedCount, setArchivedCount] = React.useState<number | null>(null)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    // the loaded pages only decide whether the action has anything to act on — the write
    // itself is server-side and covers pages that were never scrolled into view
    const sessions = (sessionsSwr.data ?? [])
        .flat()
        .filter((session) => session.status !== "ARCHIVED")

    const onClearAll = async () => {
        if (isClearing || sessions.length === 0) {
            return
        }
        setIsClearing(true)
        setClearError(false)
        setArchivedCount(null)

        try {
            const result = await deleteAiSessions({
                feature: "TUTOR_CHAT",
                subjectId: subjectUuid,
            })
            setArchivedCount(result?.archived ?? 0)
            await sessionsSwr.mutate()
            onCleared?.()
        } catch {
            setClearError(true)
            await sessionsSwr.mutate()
        } finally {
            setIsClearing(false)
        }
    }

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
                    <Typography type="body-sm">{modelLabel}</Typography>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Typography type="body-sm" color="muted">
                    {t("subjects.aiTools.tutor.clearHint")}
                </Typography>
                {clearError ? (
                    <Typography type="body-sm" className="text-danger">
                        {t("subjects.aiTools.tutor.clearError")}
                    </Typography>
                ) : null}
                {archivedCount !== null && !clearError ? (
                    <Typography type="body-sm" color="muted">
                        {t("subjects.aiTools.tutor.clearedCount", {
                            count: archivedCount,
                        })}
                    </Typography>
                ) : null}
                <Button
                    variant="danger"
                    className="self-start"
                    isPending={isClearing}
                    isDisabled={isClearing || sessions.length === 0}
                    onPress={() => {
                        void onClearAll()
                    }}
                >
                    {t("subjects.aiTools.tutor.clearActionSubject")}
                </Button>
            </div>
        </div>
    )
}
