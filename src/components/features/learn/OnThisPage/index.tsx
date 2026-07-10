"use client"

import React from "react"
import { Button, Label, Link, ScrollShadow, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { useTableOfContents } from "./hooks/useTableOfContents"

/** Props for {@link OnThisPage}. */
export interface OnThisPageProps {
    /** Extra classes on the rail root. */
    className?: string
    /**
     * Mobile mode: render a plain full-width panel (for the mobile drawer) instead
     * of the sticky `w-64` desktop aside. The rail body is identical either way.
     */
    mobile?: boolean
}

/** Build the challenge route for the active lesson. */
const challengeHref = (courseId: string, contentId: string) =>
    `/courses/${courseId}/learn/content/modules/${contentId.split("-")[0]}/contents/${contentId}/challenges/${contentId}-c`

/**
 * Faithful port of StarCI's "On this page" rail — the docs-style right outline of
 * the lesson being read: the in-article headings with anchor-jump + scroll-spy
 * (DOM-scanned via {@link useTableOfContents}), plus a "practice this lesson"
 * action that opens the lesson's challenge.
 *
 * Self-sizing: renders nothing when no lesson is open. Sticky under the navbar on
 * desktop; hidden below `lg` (the reader stacks on mobile, the TOC is redundant).
 *
 * @param props - {@link OnThisPageProps}
 */
export const OnThisPage = ({ className, mobile = false }: OnThisPageProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId, contentId } = useParams<{ courseId: string; contentId?: string }>()
    const { headings, activeId, onJump } = useTableOfContents(contentId)

    // the rail is per-lesson; nothing to host when no lesson is open
    if (!contentId) {
        return null
    }

    const sections = (
        <>
            {/* in-article outline — only when the active body has headings */}
            {headings.length > 0 && (
                <nav className="flex flex-col gap-3">
                    <Label>{t("onThisPage.title")}</Label>
                    <div className="flex flex-col gap-2">
                        {headings.map((heading) => (
                            <Link
                                key={heading.id}
                                onPress={() => onJump(heading.id)}
                                className={cn(
                                    "cursor-pointer text-start text-sm",
                                    heading.level >= 3 && "pl-3",
                                    heading.id === activeId ? "text-accent" : "text-muted",
                                )}
                            >
                                {heading.text}
                            </Link>
                        ))}
                    </div>
                </nav>
            )}

            {/* "practice this lesson" — closes the read → practice loop */}
            <div className="flex flex-col gap-2">
                <Label>{t("lessonRail.challenges.title")}</Label>
                <Button
                    size="sm"
                    variant="primary"
                    className="self-start"
                    onPress={() => router.push(challengeHref(courseId, contentId))}
                >
                    {t("lessonRail.challenges.practice")}
                </Button>
            </div>
        </>
    )

    // mobile: a plain full-width panel for the drawer (no sticky aside chrome)
    if (mobile) {
        return <div className={cn("flex flex-col gap-6 p-6", className)}>{sections}</div>
    }

    return (
        <aside
            className={cn(
                "hidden w-64 shrink-0 lg:sticky lg:top-16 lg:ml-8 lg:block lg:max-h-[calc(100dvh-4rem)] lg:self-start",
                className,
            )}
        >
            <ScrollShadow hideScrollBar className="lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto">
                <div className="flex flex-col gap-6 p-6 pl-0">{sections}</div>
            </ScrollShadow>
        </aside>
    )
}

export default OnThisPage
