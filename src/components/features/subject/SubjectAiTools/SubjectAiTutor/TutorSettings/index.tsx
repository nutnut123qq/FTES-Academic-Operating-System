"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

import { archiveSession } from "@/modules/api/rest/ai"

import { ToolSurfaceHeader } from "../../ToolSurfaceHeader"
import {
    TUTOR_SESSIONS_PAGE_SIZE,
    useTutorSessionsInfiniteSwr,
} from "../useSubjectTutorSwr"

/** Safety cap on how many pages "clear all" pulls before archiving (20 × 20 = 400 sessions). */
const MAX_CLEAR_PAGES = 20

/** Props for {@link TutorSettings}. */
export interface TutorSettingsProps {
    /** Active answering model, already shortened for display (read-only context). */
    modelLabel: string
    /** Back to the chat view. */
    onBack: () => void
    /** Fired after every conversation was archived (parent resets the thread). */
    onCleared?: () => void
}

/**
 * In-panel tutor settings: the active model as read-only context + a destructive
 * "archive every conversation" action.
 *
 * The BE has NO bulk endpoint and no subject filter on the sessions list
 * (`SessionView` omits `contextRef`), so the action loops
 * `DELETE /api/v1/ai/sessions/{id}` over the loaded TUTOR_CHAT sessions — i.e. it
 * clears the user's AI-tutor conversations, not only this subject's. The copy
 * says exactly that; a bulk + subject-scoped endpoint is the proper fix.
 */
export const TutorSettings = ({
    modelLabel,
    onBack,
    onCleared,
}: TutorSettingsProps) => {
    const t = useTranslations()
    const headingRef = React.useRef<HTMLHeadingElement>(null)
    const sessionsSwr = useTutorSessionsInfiniteSwr()
    const [isClearing, setIsClearing] = React.useState(false)
    const [clearError, setClearError] = React.useState(false)

    React.useEffect(() => {
        headingRef.current?.focus()
    }, [])

    // already-archived rows still come back from the list (the BE query has no status
    // predicate) — skip them so "clear all" does not re-DELETE the same sessions
    const sessions = (sessionsSwr.data ?? [])
        .flat()
        .filter((session) => session.status !== "ARCHIVED")

    const onClearAll = async () => {
        if (isClearing || sessions.length === 0) {
            return
        }
        setIsClearing(true)
        setClearError(false)
        let failed = false

        // "all" must mean all: pull the remaining pages first (the list is paginated
        // and the settings view only holds page 0 until it grows), capped so a broken
        // pager can never spin forever.
        let pages = sessionsSwr.data ?? []
        for (let guardPage = 0; guardPage < MAX_CLEAR_PAGES; guardPage += 1) {
            const last = pages[pages.length - 1]
            if (!last || last.length < TUTOR_SESSIONS_PAGE_SIZE) {
                break
            }
            const next = await sessionsSwr.setSize(pages.length + 1)
            if (!next || next.length === pages.length) {
                break
            }
            pages = next
        }

        const targets = pages.flat().filter((session) => session.status !== "ARCHIVED")
        // sequential on purpose: archiving is cheap but the BE has no bulk route,
        // and a burst of parallel DELETEs would only add load for no UX gain
        for (const session of targets) {
            try {
                await archiveSession(session.id)
            } catch {
                failed = true
            }
        }
        setIsClearing(false)
        setClearError(failed)
        await sessionsSwr.mutate()
        if (!failed) {
            onCleared?.()
            onBack()
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
                    {t("subjects.aiTools.tutor.clearHintAll")}
                </Typography>
                {clearError ? (
                    <Typography type="body-sm" className="text-danger">
                        {t("subjects.aiTools.tutor.clearError")}
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
                    {t("subjects.aiTools.tutor.clearAction")}
                </Button>
            </div>
        </div>
    )
}
