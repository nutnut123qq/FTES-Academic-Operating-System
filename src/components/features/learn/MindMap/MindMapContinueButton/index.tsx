"use client"

import React, { useCallback } from "react"
import { Button, Typography } from "@heroui/react"
import { Panel } from "@xyflow/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowRightIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link MindMapContinueButton}. */
export interface MindMapContinueButtonProps extends WithClassNames<undefined> {
    /** Resume href for the viewer's next content task, or null when none resolvable. */
    resumeHref: string | null
    /** Whether the viewer has finished all content (outline known, nothing left). */
    allContentDone: boolean
}

/**
 * Floating primary "Continue" action for the mind-map: the single primary action on
 * the page. Jumps straight to the viewer's next unread lesson / uncompleted challenge
 * (content-first — never the capstone, which resumes on its own surface). When all
 * content is done it shows a quiet "all done" note instead; for guests (no resume, not
 * done) it renders nothing.
 *
 * Must render as a child of {@link import("@xyflow/react").ReactFlow}.
 *
 * @param props - {@link MindMapContinueButtonProps}
 */
export const MindMapContinueButton = ({ resumeHref, allContentDone }: MindMapContinueButtonProps) => {
    const t = useTranslations()
    const router = useRouter()

    const onResume = useCallback(() => {
        if (resumeHref) {
            router.push(resumeHref)
        }
    }, [router, resumeHref])

    if (resumeHref) {
        return (
            <Panel className="!m-4" position="top-center">
                <Button
                    variant="primary"
                    aria-label={t("mindMap.continueAria")}
                    onPress={onResume}
                    className="rounded-full shadow-lg"
                >
                    {t("mindMap.continue")}
                    <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            </Panel>
        )
    }

    if (allContentDone) {
        return (
            <Panel className="!m-4 rounded-full bg-surface px-4 py-2 shadow-lg" position="top-center">
                <Typography type="body-sm" weight="semibold" className="text-success">
                    {t("mindMap.allDone")}
                </Typography>
            </Panel>
        )
    }

    return null
}
