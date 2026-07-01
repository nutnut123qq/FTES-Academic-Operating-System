"use client"

import React from "react"
import {
    Button,
    cn,
    Typography,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { pathConfig } from "@/resources/path"

/** Props for {@link ProfileNotFoundState}. */
export type ProfileNotFoundStateProps = WithClassNames<undefined>

/**
 * 404-style page shown when the requested profile cannot be read —
 * not found, soft-deleted, or a failed fetch. A centered column with a large
 * "404" numeral, a not-found title + description, and a button back home.
 *
 * @param props - {@link ProfileNotFoundStateProps}
 */
export const ProfileNotFoundState = ({
    className,
}: ProfileNotFoundStateProps) => {
    const t = useTranslations()
    const router = useRouter()
    const locale = useLocale()

    return (
        <div className={cn("mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-6 text-center", className)}>
            <Typography type="h1" weight="bold" color="muted">
                404
            </Typography>
            <div className="flex flex-col gap-2">
                <Typography type="h4" weight="semibold">
                    {t("publicProfile.notFound")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("publicProfile.notFoundDescription")}
                </Typography>
            </div>
            <Button
                variant="primary"
                onPress={() => router.push(pathConfig().locale(locale).build())}
            >
                {t("nav.home")}
            </Button>
        </div>
    )
}
