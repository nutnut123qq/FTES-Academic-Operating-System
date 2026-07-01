"use client"

import { ArrowLeft as ArrowLeftIcon, Filmstrip as FilmStripIcon } from "@gravity-ui/icons"
import React, {
    useCallback,
} from "react"
import {
    Button,
} from "@heroui/react"

import {
    useRouter,
} from "next/navigation"
import {

    useTranslations,
} from "next-intl"

/**
 * Admin tool navigation for the AI balancer health page.
 */
export const TopBar = () => {
    const router = useRouter()
    const t = useTranslations("admin.aiBalancer")

    const onBack = useCallback(
        () => {
            router.push("../../admin")
        },
        [
            router,
        ],
    )

    const onOpenUploadVideo = useCallback(
        () => {
            router.push("../upload-video")
        },
        [
            router,
        ],
    )

    return (
        <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                onPress={onBack}
            >
                <ArrowLeftIcon className="h-5 w-5" />
                {t("backToAdmin")}
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
                onPress={onOpenUploadVideo}
            >
                <FilmStripIcon className="h-5 w-5" />
                {t("uploadVideoTool")}
            </Button>
        </div>
    )
}
