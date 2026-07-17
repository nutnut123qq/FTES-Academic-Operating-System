"use client"

import React from "react"
import {
    GiftIcon,
    VideoCameraIcon,
    UsersThreeIcon,
    ArrowsClockwiseIcon,
    MedalIcon,
    RoadHorizonIcon,
    CreditCardIcon,
    ExamIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    type Icon,
} from "@phosphor-icons/react"
import { Button, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { ShowcaseMockup, type ShowcaseTheme } from "@/components/blocks/marketing/ShowcaseMockup"
import { OFFER_GROUPS } from "../content"

/**
 * Depth tint for the mockup on the LIGHT offers section. The preset accent triad
 * mixes indigo into the surface → a pink smear on near-white; a foreground-based
 * neutral instead reads as a soft grey drop behind the card (real depth, no tint).
 */
const NEUTRAL_DEPTH: ShowcaseTheme = {
    c1: "var(--foreground)",
    c2: "var(--foreground)",
    c3: "var(--foreground)",
}

/** Icon per offer group key. */
const GROUP_ICON: Record<string, Icon> = {
    newLearner: GiftIcon,
    liveZoom: VideoCameraIcon,
    group: UsersThreeIcon,
    returning: ArrowsClockwiseIcon,
    honor: MedalIcon,
    afterCourse: RoadHorizonIcon,
    installment: CreditCardIcon,
    trial: ExamIcon,
}

/**
 * "Ưu đãi & chính sách" — the eight verbatim FTES offer/policy groups. Desktop: a tab
 * rail on the left, one detail panel on the right. Every panel is kept MOUNTED and only
 * CSS-hidden for the inactive ones, so ALL offer copy exists in the server-rendered HTML
 * (SEO — spec: inactive panels hidden, not unmounted). Keyboard-operable tabs. A closing
 * CTA routes to `/courses`.
 */
export const OffersPolicySection = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()
    const [active, setActive] = React.useState(0)

    return (
        <section className="w-full border-y border-separator bg-default/20">
            <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                <div className="mb-10 flex flex-col items-center gap-2 text-center">
                    <Typography type="body-sm" color="muted">
                        {t("offers.eyebrow")}
                    </Typography>
                    <Typography type="h3" weight="bold">
                        {t("offers.title")}
                    </Typography>
                </div>

                <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-6 lg:grid-cols-[15rem_1fr] lg:gap-8">
                    {/* tab rail */}
                    <div
                        className="flex flex-row flex-wrap gap-2 lg:flex-col"
                        role="tablist"
                        aria-label={t("offers.tabsAria")}
                    >
                        {OFFER_GROUPS.map((group, i) => {
                            const GroupIcon = GROUP_ICON[group.key] ?? GiftIcon
                            const isActive = i === active
                            return (
                                <button
                                    key={group.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={`offer-panel-${group.key}`}
                                    id={`offer-tab-${group.key}`}
                                    onClick={() => setActive(i)}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-xl px-4 py-2 text-left transition-colors",
                                        isActive ? "bg-accent/10" : "hover:bg-accent/10",
                                    )}
                                >
                                    <GroupIcon
                                        className={cn(
                                            "size-5 shrink-0 transition-colors",
                                            isActive ? "text-accent" : "text-muted group-hover:text-accent",
                                        )}
                                        aria-hidden
                                        focusable="false"
                                    />
                                    <span
                                        className={cn(
                                            "hidden text-sm font-medium sm:inline",
                                            isActive ? "text-accent" : "text-foreground",
                                        )}
                                    >
                                        {t(`offers.groups.${group.key}.title`)}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* panels — bọc CẢ cột trong ShowcaseMockup (chrome + tilt 3D + glow),
                        đồng bộ hero look. 8 panel VẪN mounted, inactive chỉ `hidden` (không
                        unmount) → mọi copy ưu đãi vẫn trong HTML server-render (crawlable). */}
                    <div>
                        <ShowcaseMockup
                            url="ftes.edu.vn/uu-dai"
                            tilt="left"
                            aspect="video"
                            backdrop="none"
                            theme={NEUTRAL_DEPTH}
                            contentClassName="flex flex-col justify-center p-6"
                        >
                            {OFFER_GROUPS.map((group, i) => {
                                const GroupIcon = GROUP_ICON[group.key] ?? GiftIcon
                                const lines = Array.from({ length: group.lineCount }, (_, li) => li)
                                return (
                                    <div
                                        key={group.key}
                                        id={`offer-panel-${group.key}`}
                                        role="tabpanel"
                                        aria-labelledby={`offer-tab-${group.key}`}
                                        hidden={i !== active}
                                    >
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="flex size-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                                                <GroupIcon className="size-6" aria-hidden focusable="false" />
                                            </div>
                                            <Typography type="h5" weight="bold">
                                                {t(`offers.groups.${group.key}.title`)}
                                            </Typography>
                                        </div>
                                        <ul className="flex flex-col gap-3">
                                            {lines.map((li) => (
                                                <li key={li} className="flex items-start gap-2">
                                                    <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden focusable="false" />
                                                    <Typography type="body" color="muted">
                                                        {t(`offers.groups.${group.key}.lines.${li}`)}
                                                    </Typography>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            })}
                        </ShowcaseMockup>
                        <div className="mt-6 flex justify-start">
                            <Button variant="primary" onPress={() => router.push("/courses")}>
                                {t("offers.cta")}
                                <ArrowRightIcon className="size-4" aria-hidden focusable="false" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
