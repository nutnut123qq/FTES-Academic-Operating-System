"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { JourneyHero } from "./sections/JourneyHero"
import { PlatformStatsSection } from "./sections/PlatformStatsSection"
import { ModuleShowcaseSection } from "./sections/ModuleShowcaseSection"
import { OffersPolicySection } from "./sections/OffersPolicySection"
import { HonorBoardSection } from "./sections/HonorBoardSection"
import { MentorTeamSection } from "./sections/MentorTeamSection"
import { FaqSection } from "./sections/FaqSection"

/**
 * HomeLanding — the marketing/on-ramp landing for the FTES Academic OS, redesigned
 * around the user's JOURNEY (home-landing-redesign, 2026-07-02). Top → bottom:
 *
 *   1. Hero + 3D user-journey scene (Home → Workplace → Course → Luyện tập/AI →
 *      Thành quả; static fallback for mobile / reduced-motion / no-WebGL)
 *   2. "Số liệu thật" platform stats (count-up) + AI-feature chips
 *   3. Module showcase (what's inside each journey stop)
 *   4. Ưu đãi & chính sách (eight verbatim offer/policy groups)
 *   5. Bảng vàng FTES (real achievers)
 *   6. Đội ngũ FTES (five real mentors + quotes)
 *   7. FTES FAQ (accordion, incl. the refund Q&A)
 *   8. Closing CTA
 *
 * Full-bleed bands with inner `max-w-6xl` gutter; the feature owns copy (i18n) +
 * navigation, tokens/blocks own the look. The Footer is rendered by `InnerLayout` on
 * landing routes.
 */
export const HomeLanding = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

    return (
        <main className="flex w-full flex-col items-center">
            <JourneyHero />
            <PlatformStatsSection />
            <ModuleShowcaseSection />
            <OffersPolicySection />
            <HonorBoardSection />
            <MentorTeamSection />
            <FaqSection />

            {/* closing CTA */}
            <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
                <div className="flex flex-col items-center gap-3">
                    <Typography type="h3" weight="bold">
                        {t("cta.title")}
                    </Typography>
                    <Typography type="body" color="muted" className="max-w-xl">
                        {t("cta.subline")}
                    </Typography>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" onPress={() => router.push("/courses")}>
                        {t("cta.primary")}
                        <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                    </Button>
                    <Button variant="secondary" onPress={() => router.push("/community")}>
                        {t("cta.secondary")}
                    </Button>
                </div>
            </section>
        </main>
    )
}
