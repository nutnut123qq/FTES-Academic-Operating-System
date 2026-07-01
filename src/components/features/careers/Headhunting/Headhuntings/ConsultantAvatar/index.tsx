"use client"

import React, { useEffect, useMemo, useState } from "react"
import { cn } from "@heroui/react"
import { UserCircleIcon } from "@phosphor-icons/react"
import {
    DEFAULT_CONSULTANT_AVATAR_URL,
    resolveConsultantAvatarUrl,
} from "../../utils"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Layout size preset for {@link ConsultantAvatar}. */
export type ConsultantAvatarSize = "card" | "detail"

/** Props for {@link ConsultantAvatar}. */
export interface ConsultantAvatarProps extends WithClassNames<undefined> {
    /** Profile image URL from API (nullable). */
    avatarUrl?: string | null
    /** Alt text (usually full name). */
    fullName: string
    /** Layout size preset. */
    size?: ConsultantAvatarSize
}

/**
 * Consultant profile image with default fallback on missing URL or load error.
 * Single-use presentational piece kept inside the Headhunting feature.
 * @param props - {@link ConsultantAvatarProps}
 */
export const ConsultantAvatar = ({
    avatarUrl,
    fullName,
    size = "card",
    className,
}: ConsultantAvatarProps) => {
    const initialSrc = useMemo(
        () => resolveConsultantAvatarUrl(avatarUrl),
        [avatarUrl],
    )
    const [src, setSrc] = useState(initialSrc)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        setSrc(resolveConsultantAvatarUrl(avatarUrl))
        setFailed(false)
    }, [avatarUrl])

    const onError = () => {
        if (src !== DEFAULT_CONSULTANT_AVATAR_URL) {
            setSrc(DEFAULT_CONSULTANT_AVATAR_URL)
            return
        }
        setFailed(true)
    }

    return (
        <div
            className={cn(
                "relative shrink-0 overflow-hidden bg-accent/10",
                size === "card"
                    ? "aspect-square w-full"
                    : "mx-auto aspect-square w-40 rounded-full",
                className,
            )}
        >
            {!failed ? (
                <img
                    src={src}
                    alt={fullName}
                    className={cn(
                        "h-full w-full object-cover",
                        size === "detail" && "rounded-full",
                    )}
                    onError={onError}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <UserCircleIcon
                        aria-hidden
                        focusable="false"
                        className={cn(
                            "text-accent/60",
                            size === "detail" ? "size-24" : "size-20",
                        )}
                    />
                </div>
            )}
        </div>
    )
}
