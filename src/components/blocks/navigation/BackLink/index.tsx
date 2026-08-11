"use client"

import React, { useEffect, useState } from "react"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link BackLink}. */
export interface BackLinkProps extends WithClassNames<undefined> {
    /**
     * Where to go when there is NO in-app history to step back through — i.e. the page was
     * deep-linked / opened in a fresh tab. Locale-prefixed by the i18n `Link`.
     */
    fallbackHref: string
    /** Label override; defaults to the shared `common.back` ("Quay lại" / "Back"). */
    label?: string
}

/**
 * The house "go back" affordance for a standalone page that can be reached from more than
 * one place (an event opened from Community vs from the events catalog, a group opened from
 * the rail vs from a post…). A hardcoded href would send the viewer somewhere they never
 * came from, so this steps back through the ACTUAL history when there is one.
 *
 * Rendering is history-aware but SSR-safe: the server (and the first client paint) renders
 * the plain {@link fallbackHref} link, then an effect upgrades it to a history step once it
 * can see that this tab has somewhere to go back to (`history.length > 1`). A fresh tab
 * opened straight on the URL keeps the fallback link, so the control is never a dead end.
 *
 * @param props - {@link BackLinkProps}
 */
export const BackLink = ({ fallbackHref, label, className }: BackLinkProps) => {
    const t = useTranslations("common")
    const router = useRouter()
    // Only known on the client, and deliberately read AFTER mount so server and first paint
    // agree (no hydration mismatch).
    const [canStepBack, setCanStepBack] = useState(false)
    useEffect(() => {
        setCanStepBack(window.history.length > 1)
    }, [])

    const text = label ?? t("back")
    const style = className ?? "flex w-fit items-center gap-1 text-sm text-muted no-underline hover:text-foreground"

    if (canStepBack) {
        return (
            <button type="button" onClick={() => router.back()} className={`${style} cursor-pointer`}>
                <ArrowLeftIcon className="size-4" aria-hidden focusable="false" />
                {text}
            </button>
        )
    }

    return (
        <Link href={fallbackHref} className={style}>
            <ArrowLeftIcon className="size-4" aria-hidden focusable="false" />
            {text}
        </Link>
    )
}

export default BackLink
