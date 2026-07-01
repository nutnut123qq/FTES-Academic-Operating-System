"use client"

import React, {
    useCallback,
} from "react"
import {
    Button,
    cn,
    toast,
} from "@heroui/react"
import {
    NodesRight as ShareIcon,
} from "@gravity-ui/icons"
import {
    useTranslations,
} from "next-intl"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link ShareProfileButton}. */
export interface ShareProfileButtonProps extends WithClassNames<undefined> {
    /** Display name shown in the native share sheet title. */
    title: string
}

/**
 * Share-this-profile action. Uses the Web Share API when available (mobile),
 * otherwise copies the current profile URL to the clipboard and toasts a
 * confirmation. The growth loop: a learner shares their public profile so others
 * can see their flex. Reads the URL from `window.location` at click time so it
 * works on any locale / username without prop-drilling the href.
 *
 * @param props - {@link ShareProfileButtonProps}
 */
export const ShareProfileButton = ({
    title,
    className,
}: ShareProfileButtonProps) => {
    const t = useTranslations()

    const onShare = useCallback(async () => {
        // guard SSR / non-browser
        if (typeof window === "undefined") {
            return
        }
        const url = window.location.href
        // prefer the native share sheet (mobile) when present
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    url,
                })
                return
            } catch {
                // user dismissed the sheet (or it failed) → fall through to copy
            }
        }
        try {
            await navigator.clipboard.writeText(url)
            toast.success(t("publicProfile.share.copied"))
        } catch {
            // clipboard blocked → no-op (rare; nothing actionable to show)
        }
    }, [
        title,
        t,
    ])

    return (
        <Button
            variant="secondary"
            className={cn("w-full", className)}
            onPress={onShare}
        >
            <ShareIcon aria-hidden focusable="false" className="size-5" />
            {t("publicProfile.share.button")}
        </Button>
    )
}
