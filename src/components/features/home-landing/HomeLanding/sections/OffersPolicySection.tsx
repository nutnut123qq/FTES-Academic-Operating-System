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
 * One offer group's copy (icon + title + verbatim bullet lines) — the SAME body rendered by
 * the desktop tab panel and by the mobile swipe card, so the two surfaces cannot drift.
 */
const OfferGroupBody = ({ groupKey, lineCount }: { groupKey: string; lineCount: number }) => {
    const t = useTranslations("homeLanding")
    const GroupIcon = GROUP_ICON[groupKey] ?? GiftIcon
    return (
        <>
            <div className="mb-6 flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <GroupIcon className="size-6" aria-hidden focusable="false" />
                </div>
                <Typography type="h5" weight="bold">
                    {t(`offers.groups.${groupKey}.title`)}
                </Typography>
            </div>
            <ul className="flex flex-col gap-3">
                {Array.from({ length: lineCount }, (_, li) => (
                    <li key={li} className="flex items-start gap-2">
                        <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-success" aria-hidden focusable="false" />
                        <Typography type="body" color="muted">
                            {t(`offers.groups.${groupKey}.lines.${li}`)}
                        </Typography>
                    </li>
                ))}
            </ul>
        </>
    )
}

/**
 * "Ưu đãi & chính sách" — the eight verbatim FTES offer/policy groups.
 *
 * Desktop (`lg:`) is unchanged: a tab rail on the left, one detail panel on the right inside the
 * showcase mockup. Every panel is kept MOUNTED and only CSS-hidden for the inactive ones, so ALL
 * offer copy exists in the server-rendered HTML (SEO — spec: inactive panels hidden, not
 * unmounted). Keyboard-operable tabs. A closing CTA routes to `/courses`.
 *
 * BELOW `lg` the tab rail is hidden entirely — eight chips wrapped into a ragged three-line block
 * that pushed the panel off screen. The groups become a horizontal SWIPE strip instead: plain CSS
 * scroll-snap (`overflow-x-auto` + `snap-x snap-mandatory` on the track, `snap-center` per card),
 * no carousel library, with dots underneath that both report and set the position.
 *
 * Each swipe card is the SAME {@link ShowcaseMockup} frame as the desktop panel — the browser
 * chrome IS the look being swiped, not decoration to drop on small screens. What gets dropped is
 * only the `aspect="video"` lock: a 16:9 content box clips a four-line offer group at phone widths,
 * so the mobile frame grows to its content instead. (`tilt` is already a `md:`-only transform in the
 * block, so a phone gets the flat frame for free.)
 */
export const OffersPolicySection = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()
    const [active, setActive] = React.useState(0)

    // mobile swipe strip: which card is centred (dots only — the scroll itself is native CSS).
    const trackRef = React.useRef<HTMLUListElement>(null)
    const [slide, setSlide] = React.useState(0)

    /**
     * Card whose box crosses the middle of the track = the one the reader is on. Measured with
     * `getBoundingClientRect` rather than `offsetLeft`, which is relative to whatever positioned
     * ancestor happens to exist above the track and would drift by that offset.
     */
    const syncSlide = () => {
        const track = trackRef.current
        if (!track) return
        const middle = track.getBoundingClientRect().left + track.clientWidth / 2
        const cards = Array.from(track.children)
        const index = cards.findIndex((card) => card.getBoundingClientRect().right > middle)
        setSlide(index === -1 ? cards.length - 1 : index)
    }

    const goToSlide = (index: number) => {
        const card = trackRef.current?.children[index]
        card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }

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
                    {/* tab rail — desktop only; below `lg` the swipe strip replaces it */}
                    <div
                        className="hidden gap-2 lg:flex lg:flex-col"
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
                        <div className="hidden lg:block">
                            <ShowcaseMockup
                                url="ftes.edu.vn/uu-dai"
                                tilt="left"
                                aspect="video"
                                backdrop="none"
                                theme={NEUTRAL_DEPTH}
                                contentClassName="flex flex-col justify-center p-6"
                            >
                                {OFFER_GROUPS.map((group, i) => (
                                    <div
                                        key={group.key}
                                        id={`offer-panel-${group.key}`}
                                        role="tabpanel"
                                        aria-labelledby={`offer-tab-${group.key}`}
                                        hidden={i !== active}
                                    >
                                        <OfferGroupBody groupKey={group.key} lineCount={group.lineCount} />
                                    </div>
                                ))}
                            </ShowcaseMockup>
                        </div>

                        {/* mobile: swipe strip (CSS scroll-snap) + position dots */}
                        <div className="lg:hidden">
                            <ul
                                ref={trackRef}
                                onScroll={syncSlide}
                                aria-label={t("offers.swipeAria")}
                                className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
                            >
                                {OFFER_GROUPS.map((group) => (
                                    <li key={group.key} className="w-[85%] shrink-0 snap-center">
                                        <ShowcaseMockup
                                            url="ftes.edu.vn/uu-dai"
                                            tilt="left"
                                            backdrop="none"
                                            theme={NEUTRAL_DEPTH}
                                            contentClassName="flex flex-col justify-center p-5"
                                        >
                                            <OfferGroupBody groupKey={group.key} lineCount={group.lineCount} />
                                        </ShowcaseMockup>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 flex justify-center gap-2">
                                {OFFER_GROUPS.map((group, i) => (
                                    <button
                                        key={group.key}
                                        type="button"
                                        aria-label={t(`offers.groups.${group.key}.title`)}
                                        aria-current={i === slide}
                                        onClick={() => goToSlide(i)}
                                        className={cn(
                                            "size-2 rounded-full transition-colors",
                                            i === slide ? "bg-accent" : "bg-default",
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center lg:justify-start">
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
