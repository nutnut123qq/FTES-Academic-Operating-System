"use client"
import { Navbar } from "@/components/features/navbar/Navbar"
import { Footer } from "@/components/features/footer/Footer"
import { ToastProvider } from "@heroui/react"
import React, { PropsWithChildren, Suspense, useEffect } from "react"
import { CookieConsentBanner } from "@/components/features/cookie-consent/CookieConsentBanner"
import { usePathname } from "next/navigation"
import { HeroUIProvider } from "@/components/providers/HeroUIProvider"
import { NextThemesProvider } from "@/components/providers/NextThemesProvider"
import { SwrProvider } from "@/components/providers/SwrProvider"
import { DrawerContainer } from "@/components/drawers/DrawerContainer"
import { AmbientBackground } from "@/components/blocks/layout/AmbientBackground"
import { TopLoader } from "@/components/blocks/layout/TopLoader"
import { AppSplash } from "@/components/blocks/layout/AppSplash"
import { SseSideEffects } from "@/hooks/sse/SseSideEffects"
import { SwrSideEffects } from "@/hooks/swr/SwrSideEffects"
import { ReduxProvider } from "@/redux/ReduxProvider"
import { ModalContainer } from "@/components/modals/ModalContainer"
import { UseEffects } from "@/hooks/effects/UseEffects"
import { AuthQueryOpener } from "@/components/layouts/auth/AuthQueryOpener"
import { TourProvider } from "@/components/features/onboarding"
import { MascotAssistant } from "@/components/features/mascot-assistant"
import { BadgeUnlockHost } from "@/components/features/gamification/BadgeUnlockHost"
import { useAppearanceStore } from "@/hooks/zustand/appearance/store"

export const InnerLayout = ({ children }: PropsWithChildren) => {
    // The picked ambient effect (Settings → Appearance) runs on EVERY route — the
    // setting is global, so Learn / Community / the Subject workspace must obey it
    // too. What changes per route is its WEIGHT, not whether it exists.
    //
    // History, so the old complaint cannot come back by accident:
    //  - 2026-07-03 (b78ba85c) — "sao băng phải có trên nền mọi trang, chỉ đừng
    //    đâm vào card": keep it everywhere, just stop it hitting the cards. The
    //    same commit deleted a centre-column mask as "không khớp mọi layout", so
    //    masking the reading column is a proven dead end — don't reintroduce it.
    //  - 2026-07-06 (e59300be, checklist STT 2) — "sao băng phải ở dưới nền, không
    //    được đè lên phần hiển thị nội dung". At the time every card was glass
    //    (`bg-surface/60`), so streaks travelled visibly ACROSS the card faces.
    //    That was answered by suppressing the effect outright on these routes,
    //    which also threw away the user's setting.
    //
    // The cause is gone: those surfaces now paint solid (`bg-surface` / HeroUI
    // `Card`, measured alpha = 1), so nothing can show through a card any more.
    // So instead of suppressing, content routes get the RECESSED variant — the
    // effect stays a backdrop in the shells' own negative space and is held at a
    // weight that cannot read as an overlay (see `.ambient-recessed` in
    // globals.css). Decorative routes (landing / home) keep it at full weight.
    const pathname = usePathname()
    const isContentRoute = /\/(?:learn|community|subjects)(?:\/|$)/.test(pathname ?? "")
    // Ambient effect config (appearance-settings) — narrow selectors so InnerLayout
    // only re-renders when these fields change (a rare user action). `effect` is
    // the picked look ("none" = off); direction/speed only apply to `ember`.
    const effect = useAppearanceStore((state) => state.effect)
    const effectDirection = useAppearanceStore((state) => state.effectDirection)
    const effectSpeed = useAppearanceStore((state) => state.effectSpeed)
    // The store persists with `skipHydration` (server markup == first client render,
    // no hydration mismatch); pull the saved config right after mount. The sparks
    // start at opacity 0 and only fade in after ~1s, so the swap is imperceptible.
    useEffect(() => {
        void useAppearanceStore.persist.rehydrate()
    }, [])
    // Footer hiện ở LANDING — cả locale root ("/", "/vi", "/en") LẪN /home ("/home",
    // "/vi/home"): /home là bản ungated của CÙNG trang landing (user đã login xem ở đây).
    // Mọi trang khác (dashboard / learn / profile / auth / …) KHÔNG có footer — thầy chốt 2026-06-26.
    const footerPath = pathname ?? ""
    const showFooter = /^\/(?:[a-z]{2})?\/?$/.test(footerPath) || /^\/(?:[a-z]{2}\/)?home\/?$/.test(footerPath)
    // Header-first shell (2026-07-02): global nav lives in the top bar (HeaderNav).
    // The left sidebar is reserved for in-context nav — the subject workspace rail
    // (its own `SubjectWorkspaceShell`), so InnerLayout renders content full-width.
    return (
        <Suspense>
            <NextThemesProvider 
                attribute="class" 
                defaultTheme="system" 
                enableSystem={true} 
                storageKey="ftesaos-theme"
            >
                <HeroUIProvider>
                    <ReduxProvider>
                        <SwrProvider>
                            <SwrSideEffects />
                            <SseSideEffects />
                            {/* Every `useSearchParams()` consumer needs its OWN Suspense boundary.
                                On a prerendered route that hook bails its nearest boundary out to
                                client rendering — and the only boundary above these three is the
                                one wrapping this entire tree, so a missing wrapper here costs the
                                whole app its server-rendered HTML (a blank white first paint).
                                All three render nothing visible, so `fallback={null}` is exact. */}
                            <Suspense fallback={null}>
                                <UseEffects />
                            </Suspense>
                            {/* `?auth=signin|signup` deep link → opens the auth modal (needs its
                                own Suspense: useSearchParams) */}
                            <Suspense fallback={null}>
                                <AuthQueryOpener />
                            </Suspense>
                            <AppSplash />
                            <Suspense fallback={null}>
                                <TopLoader />
                            </Suspense>
                            <AmbientBackground
                                effect={effect}
                                direction={effectDirection}
                                speed={effectSpeed}
                                recessed={isContentRoute}
                            />
                            {/* Onboarding tour engine — wraps the shell so it can spotlight the
                                Navbar anchors and the account-menu replay entry shares its context.
                                The overlay itself renders in a body-level portal. */}
                            <TourProvider>
                                <Navbar />
                                <ModalContainer />
                                <DrawerContainer />
                                {/* Achievement-unlock celebration — mounted ONCE here so a badge
                                    earned anywhere pops its moment on the viewer's next page load,
                                    wherever they are. Inert for guests (its hooks are auth-gated). */}
                                <BadgeUnlockHost />
                                <div>{children}</div>
                                {showFooter ? <Footer /> : null}
                                {/* Trợ lý FrosTES (linh vật đứng vẫy tay, góc phải dưới) — mount
                                    MỘT lần ở shell gốc nên hiện ở MỌI trang. Đặt TRONG TourProvider
                                    để nó tự ẩn khi guided tour đang chạy (không che spotlight, không
                                    2 linh vật cùng lúc). Nó cũng tự ẩn ở trang đọc bài
                                    (/courses/[id]/learn/…) — nơi ContentAiFab đã chiếm góc phải dưới. */}
                                <MascotAssistant />
                            </TourProvider>
                            <CookieConsentBanner />
                            <ToastProvider />
                        </SwrProvider>
                    </ReduxProvider>
                </HeroUIProvider>
            </NextThemesProvider>
        </Suspense>
    )
}