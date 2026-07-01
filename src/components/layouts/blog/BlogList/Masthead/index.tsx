"use client"

import React from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { BACKEND_INFRA_SCENE } from "./scene"

/**
 * The 3D backend-infra scene is real WebGL (react-three-fiber) — client-only, never SSR'd. While
 * the WebGL chunk loads, hold the same sized skeleton so the masthead doesn't jump on resolve.
 */
const ArchitectureScene = dynamic(
    () => import("@/components/blocks/marketing/ArchitectureScene").then((m) => m.ArchitectureScene),
    {
        ssr: false,
        loading: () => (
            <div
                aria-hidden
                className="h-[440px] w-full animate-pulse rounded-3xl bg-default/20 sm:h-[560px]"
            />
        ),
    },
)

/**
 * Blog masthead — an operational 3D showcase of StarCi's real backend (the topic of the blog).
 * Static, grounded scene (see {@link BACKEND_INFRA_SCENE}); carries no live prod status.
 */
export const Masthead = () => {
    const t = useTranslations("blog")
    return <ArchitectureScene data={BACKEND_INFRA_SCENE} caption={t("masthead.caption")} />
}
