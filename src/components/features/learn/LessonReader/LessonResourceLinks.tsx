"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { ArrowSquareOutIcon, LinkSimpleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

/** Friendly source label from a URL host (falls back to the raw host). */
const sourceOf = (url: string): string => {
    try {
        const host = new URL(url).hostname.replace(/^www\./, "")
        if (host.includes("drive.google")) return "Google Drive"
        if (host.includes("docs.google")) return "Google Docs"
        if (host.includes("forms.gle") || host.includes("forms.google")) return "Google Forms"
        if (host.includes("github")) return "GitHub"
        if (host.includes("youtu")) return "YouTube"
        return host
    } catch {
        return url
    }
}

/**
 * Renders a lesson whose body is essentially just external link(s) as proper resource
 * cards (source + an "open" action that opens a new tab) instead of a naked URL string —
 * the shape most migrated Funnycode "Tài liệu / Link / Submit" lessons take.
 */
export const LessonResourceLinks = ({ urls }: { urls: Array<string> }) => {
    const t = useTranslations("learn")
    return (
        <div className="flex flex-col gap-3">
            {urls.map((url, index) => (
                <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-default bg-surface p-4 transition-colors hover:bg-default"
                >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                        <LinkSimpleIcon aria-hidden focusable="false" className="size-5 text-accent" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <Typography type="body-sm" weight="medium">
                            {t("resource.title")}
                        </Typography>
                        <Typography type="body-xs" color="muted" className="truncate">
                            {sourceOf(url)}
                        </Typography>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-accent">
                        {t("resource.open")}
                        <ArrowSquareOutIcon aria-hidden focusable="false" className="size-4" />
                    </span>
                </a>
            ))}
        </div>
    )
}
