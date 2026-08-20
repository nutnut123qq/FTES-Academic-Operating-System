"use client"

import React, { useEffect } from "react"
import { Button, Typography } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import { JourneyHero } from "./sections/JourneyHero"
import { HomeMascotGreetingBand } from "./sections/HomeMascotGreeting"
import { PlatformStatsSection } from "./sections/PlatformStatsSection"
import { AchievementsSection } from "./sections/AchievementsSection"
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
 *   3. Thành tựu (real FTES awards / recognitions — numeric stat cards)
 *   4. Ưu đãi & chính sách (eight verbatim offer/policy groups)
 *   5. Bảng vàng FTES (real achievers)
 *   6. Đội ngũ FTES (five real mentors + quotes)
 *   7. FTES FAQ (accordion, incl. the refund Q&A)
 *   8. Closing CTA
 *
 * Full-bleed bands with inner `max-w-6xl` gutter; the feature owns copy (i18n) +
 * navigation, tokens/blocks own the look. The Footer is rendered by `InnerLayout` on
 * landing routes.
 *
 * **Chỉ dành cho khách (góp ý #23).** Người đã đăng nhập vào đây được đưa thẳng sang
 * dashboard: trang này là lời chào hàng ("FTES là gì, học được gì"), còn người đã ở trong
 * hệ thống cần biết HÔM NAY có gì — khoá đang học, việc phải làm, cộng đồng đang bàn gì.
 *
 * Chốt ở ĐÂY chứ không phải ở edge middleware, dù `proxy.ts` mô tả đúng hành vi này. Cờ
 * phiên bản edge (`session_hint`) KHÔNG hề được set bởi bất cứ đâu trong hệ (xem docblock
 * của nó), nên một nhánh redirect ở đó sẽ là code chết — luôn thấy "chưa đăng nhập" kể cả
 * với người đang đăng nhập. Trang tự chốt thì đọc được phiên THẬT.
 *
 * `initialized` là bắt buộc: trước khi adapter Keycloak chạy xong, `authenticated` là
 * `false` với TẤT CẢ mọi người, và chuyển hướng theo nó thì không ai đi đâu cả.
 */
export const HomeLanding = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()
    const initialized = useAppSelector((state) => state.keycloak.initialized)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const signedIn = initialized && authenticated

    useEffect(() => {
        if (signedIn) {
            router.replace("/dashboard")
        }
    }, [signedIn, router])

    // Không vẽ trang chào hàng rồi mới giật sang chỗ khác.
    if (signedIn) {
        return null
    }

    return (
        <main className="flex w-full flex-col items-center">
            <JourneyHero />
            {/* FrosTES welcome — the page's SINGLE mascot, a SMALL low-padding one-liner
                (not a hero banner), right under the hero. */}
            <HomeMascotGreetingBand />
            <PlatformStatsSection />
            <AchievementsSection />
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
