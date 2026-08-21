"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
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
 * **Landing này KHÔNG chuyển hướng ai.** Người đã đăng nhập mở `/` hay `/home` đều ở lại
 * đọc landing y như khách.
 *
 * Chốt "đã đăng nhập thì sang dashboard" (góp ý #23) đã được GỠ theo quyết định của chủ
 * sản phẩm (2026-08-21). Lịch sử để người sau khỏi dựng lại rồi vấp y hệt: chốt đó ship ở
 * `bb81af42` nhưng là code chết (cờ `keycloak.initialized` chưa ai dispatch); `68a040d0`
 * bật cờ lên làm nó sống dậy, và vì nó nằm trong COMPONENT nên áp cho mọi route render
 * component này — người đã đăng nhập mất sạch lối vào trang chủ, bấm logo navbar cũng bị
 * đá ra. Bản vá `home-landing-redirect-scope` từng tách chốt theo route để giữ #23; chủ
 * sản phẩm chọn bỏ hẳn.
 *
 * Nếu sau này cần dựng lại: dựng ở SỰ KIỆN đăng nhập (đưa người vừa đăng nhập đi), đừng
 * dựng ở trang. Trang không phân biệt được "vừa đăng nhập xong" với "cố tình mở trang chủ".
 */
export const HomeLanding = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

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
