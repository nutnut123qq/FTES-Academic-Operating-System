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
 * Props for {@link HomeLanding}.
 */
export type HomeLandingProps = {
    /**
     * Bật chốt "người đã đăng nhập thì đi thẳng `/dashboard`" (góp ý #23). Mặc định
     * `false`: route nào muốn chốt thì phải tự khai, vì chỉ route mới biết mình là
     * locale root (đích của domain trần) hay là `/home` (landing ở URL tường minh, phải
     * xem được kể cả khi đã đăng nhập).
     */
    redirectSignedIn?: boolean
}

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
 * **Chốt "đã đăng nhập thì sang dashboard" do ROUTE quyết định, KHÔNG phải component.**
 * Component không biết nó đang được render ở đường dẫn nào, nên khi chốt nằm cứng trong
 * đây nó áp cho MỌI route render nó — cả locale root lẫn `/home` — và người đã đăng nhập
 * không còn lối nào xem được trang chủ (bấm logo navbar cũng bị đá). Giờ mỗi route tự
 * khai qua prop `redirectSignedIn`:
 *
 *   - `src/app/[locale]/page.tsx` (locale root, chỗ gõ domain trần rơi vào) truyền
 *     `redirectSignedIn` ⇒ góp ý #23 vẫn nguyên hiệu lực ở đúng nơi nó có nghĩa.
 *   - `src/app/[locale]/home/page.tsx` render trần ⇒ `/vi/home`, `/en/home` xem được
 *     với người đã đăng nhập.
 *
 * Nội dung trang vẫn là lời chào hàng ("FTES là gì, học được gì"), còn người đã ở trong
 * hệ thống cần biết HÔM NAY có gì — khoá đang học, việc phải làm, cộng đồng đang bàn gì;
 * đó là lý do locale root vẫn đưa họ sang dashboard.
 *
 * Chốt ở TẦNG TRANG chứ không phải ở edge middleware, dù `proxy.ts` mô tả đúng hành vi
 * này. Cờ
 * phiên bản edge (`session_hint`) KHÔNG hề được set bởi bất cứ đâu trong hệ (xem docblock
 * của nó), nên một nhánh redirect ở đó sẽ là code chết — luôn thấy "chưa đăng nhập" kể cả
 * với người đang đăng nhập. Trang tự chốt thì đọc được phiên THẬT.
 *
 * `initialized` là bắt buộc: trước khi phiên ngã ngũ, `authenticated` là `false` với TẤT
 * CẢ mọi người, và chuyển hướng theo nó thì không ai đi đâu cả.
 *
 * Cờ đó trước đây KHÔNG hề được dispatch ở đâu, nên nhánh này là code chết kể từ lúc
 * ship. Giờ `useQueryUserSwr` bật nó khi phiên ngã ngũ (cả nhánh có user lẫn nhánh
 * khách/lỗi/timeout), nên redirect này chạy thật — nhưng chạy SAU lần vẽ đầu, vì không
 * có tín hiệu phiên nào đọc được trước khi paint (`session_hint` ở edge chưa từng được
 * set). Người đã đăng nhập vào `/` sẽ thấy landing chớp một nhịp rồi mới sang dashboard;
 * muốn hết chớp thì phải có session hint đồng bộ, không phải việc của bản vá này.
 */
export const HomeLanding = ({ redirectSignedIn = false }: HomeLandingProps) => {
    const t = useTranslations("homeLanding")
    const router = useRouter()
    const initialized = useAppSelector((state) => state.keycloak.initialized)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const signedIn = initialized && authenticated
    // Chỉ route nào tự khai mới chốt; route không khai thì render landing như thường.
    const shouldRedirect = redirectSignedIn && signedIn

    useEffect(() => {
        if (shouldRedirect) {
            router.replace("/dashboard")
        }
    }, [shouldRedirect, router])

    // Không vẽ trang chào hàng rồi mới giật sang chỗ khác.
    if (shouldRedirect) {
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
