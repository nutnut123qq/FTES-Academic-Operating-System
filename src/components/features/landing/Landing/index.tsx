"use client"

import React from "react"
import {
    Accordion,
    Button,
    Link,
    Typography,
} from "@heroui/react"
import {
    ArrowRightIcon,
    ArrowUpIcon,
    CaretRightIcon,
    CloudArrowUpIcon,
    CubeIcon,
    StackIcon,
    TreeStructureIcon,
    UserIcon,
} from "@phosphor-icons/react"
import { FaFacebook, FaGithub, FaLinkedin } from "react-icons/fa6"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
/** Hero architecture diagram in real 3D (WebGL/R3F). Client-only — never SSRs;
 * while the WebGL chunk loads, show a neutral sized skeleton (the old fallback
 * was a *different* SVG diagram → jarring swap to the 3D scene). */
const ArchitectureScene3D = dynamic(
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
import { pathConfig } from "@/resources/path"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { FOUNDER_FACEBOOK, FOUNDER_GITHUB, FOUNDER_LINKEDIN } from "@/components/features/contact/Contact/constants"
import { StatStrip } from "./StatStrip"
import { TalentMarketplace } from "./TalentMarketplace"
import { LearnLoopScroll } from "./LearnLoopScroll"
import { KnowledgeGraph } from "./KnowledgeGraph"
import { KNOWLEDGE_NODES } from "./KnowledgeGraph/data"
import {
    LANDING_COURSE_TRACKS,
    LANDING_FAQ_INDEXES,
    LANDING_FOUNDER_TRUTH_INDEXES,
    LANDING_HERO_KEYWORDS,
    LANDING_ROADMAP_TIERS,
    LANDING_TRACK_COURSE_SLUG,
} from "./constants"
import { HeroBanner } from "@/components/blocks/marketing/HeroBanner"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { SectionHeading } from "@/components/blocks/marketing/SectionHeading"
import { TrackCard } from "@/components/blocks/marketing/TrackCard"
import { TruthList } from "@/components/blocks/marketing/TruthList"

/** Icon per featured course track. */
const COURSE_TRACK_ICONS: Record<string, React.ReactNode> = {
    fullstack: <StackIcon aria-hidden focusable="false" />,
    systemDesign: <TreeStructureIcon aria-hidden focusable="false" />,
    devops: <CloudArrowUpIcon aria-hidden focusable="false" />,
}

/** Metro line colour per track. */
const TRACK_LINE_COLOR: Record<string, "accent" | "success" | "warning"> = {
    fullstack: "accent",
    systemDesign: "success",
    devops: "warning",
}

/** Founder social proof links (brand-icon row in the founder beat). */
const FOUNDER_SOCIALS = [
    { key: "github", href: FOUNDER_GITHUB, icon: FaGithub, label: "GitHub" },
    { key: "linkedin", href: FOUNDER_LINKEDIN, icon: FaLinkedin, label: "LinkedIn" },
    { key: "facebook", href: FOUNDER_FACEBOOK, icon: FaFacebook, label: "Facebook" },
] as const

/** Props for {@link Landing}. */
export type LandingProps = WithClassNames<undefined>

/**
 * Public landing page. Show-don't-tell information architecture: hero → live
 * proof → the wedge (challenge + AI grading) → track ladder → founder beat →
 * recruiter proof → two-sided outcomes → course catalog (conversion) → FAQ →
 * closing CTA. Real data only (platform stats, open-to-work talent, courses);
 * narrative beats stay tight. Container reads SWR + i18n and composes blocks;
 * all styling lives in the blocks.
 *
 * @param props - optional className (placement only).
 */
export const Landing = ({ className }: LandingProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()

    /** Smooth-scroll to the embedded course catalog (the conversion surface). */
    const onSeeCourses = () => {
        document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" })
    }
    const onLogin = () => router.push(pathConfig().locale(locale).authentication().build())

    // Back-to-top FAB — hiện sau khi cuộn qua màn đầu (scrollY > 600), click cuộn mượt về đầu.
    const [showTop, setShowTop] = React.useState(false)
    React.useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 600)
        window.addEventListener("scroll", onScroll, { passive: true })
        onScroll()
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // HERO only fills the first fold (min-height = viewport − navbar, dvh chống nhảy thanh
    // URL mobile, căn giữa dọc). Các beat khác co theo content (bỏ min-h) → hết "nửa màn
    // trống" + nhịp đều bằng root gap.
    const screen = "flex min-h-[calc(100dvh-4rem)] flex-col justify-center"

    return (
        <div className={className}>
            {/* Section-to-section rhythm: gap-16→20 (64–80px) between beats. Chỉ HERO là
                min-h-screen; các beat khác co theo content → gap nhỏ này là khoảng trắng THẬT,
                đủ tách section mà section ngắn (stats, learn-loop) không bị trôi giữa nửa màn trống. */}
            <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-16 sm:px-6 md:gap-20 md:pb-20 lg:px-8">
                {/* 1 — Hero */}
                <div className={screen}>
                    <HeroBanner
                        eyebrow={t("landing.hero.eyebrow")}
                        eyebrowIcon={<CubeIcon aria-hidden focusable="false" className="size-3" />}
                        headline={t.rich("landing.hero.headline", {
                            accent: (chunks) => <span className="text-accent">{chunks}</span>,
                        })}
                        subline={t("landing.hero.subline")}
                        primary={(
                            <Button variant="primary" size="lg" onPress={onSeeCourses}>
                                {t("landing.hero.ctaPrimary")}
                                <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                            </Button>
                        )}
                        secondary={(
                            <Button variant="secondary" size="lg" onPress={onLogin}>
                                {t("landing.hero.ctaSecondary")}
                            </Button>
                        )}
                        keywords={LANDING_HERO_KEYWORDS}
                        keywordsLabel={t("landing.hero.solveWith")}
                        visual={(
                        // grounded StarCi backend topology in real 3D (R3F) — the System Design
                        // value prop made visible (no image; client-only, SVG fallback while loading).
                            <ArchitectureScene3D caption={t("landing.hero.diagramCaption")} />
                        )}
                    />
                </div>

                {/* 2 — Live proof strip + header "minh bạch": đóng khung số liệu THẬT (early,
                    nhỏ) thành tín hiệu trung thực thay vì brag. Header → strip = gap-16 (đồng
                    bộ các section); spacing giữa beat do root gap lo. */}
                <div id="stats" className="flex scroll-mt-24 flex-col gap-16">
                    <SectionHeading
                        anchorId="stats"
                        eyebrow={t("landing.stats.eyebrow")}
                        title={t("landing.stats.title")}
                        intro={t("landing.stats.intro")}
                    />
                    <StatStrip />
                </div>

                {/* 3 — Vòng học 4 bước (read → grade → capstone → rank): scroll-pinned
                    scrollytelling (ghim section, cuộn → bước active + visual phải đổi;
                    cuộn hết → nhả). Tự rơi về layout tĩnh trên mobile / reduced-motion. */}
                <LearnLoopScroll />

                {/* 3 — Lộ trình: 3 track tiêu biểu. Mỗi card = identity (icon/module/tag/title/desc)
                    + tier path (foundation → application) + "Vào khóa" → course thật. Gộp từ 2
                    section cũ (Courses + Roadmap) vì track = course → tránh render lặp cùng 3 track. */}
                <section id="courses" className="flex scroll-mt-24 flex-col gap-12">
                    <SectionHeading
                        anchorId="courses"
                        eyebrow={t("landing.courses.eyebrow")}
                        title={t("landing.courses.title")}
                        intro={t("landing.courses.intro")}
                    />
                    {/* "Ba lộ trình · một tư duy": mỗi track = 1 card tự gói (identity + path 4
                        tier DỌC foundation→application + "Vào khóa" → course thật). 3 card cạnh
                        nhau để đọc + so; cấu trúc 4 tier đồng nhất = "một tư duy". */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {LANDING_COURSE_TRACKS.map((key) => (
                            <TrackCard
                                key={key}
                                icon={COURSE_TRACK_ICONS[key]}
                                title={t(`landing.courses.items.${key}.title`)}
                                meta={`${t(`landing.courses.items.${key}.modules`)} · ${t(`landing.courses.items.${key}.systems`)}`}
                                color={TRACK_LINE_COLOR[key]}
                                tiers={LANDING_ROADMAP_TIERS[key]}
                                viewLabel={t("landing.courses.view")}
                                onView={() => router.push(pathConfig().locale(locale).course(LANDING_TRACK_COURSE_SLUG[key]).build())}
                            />
                        ))}
                    </div>
                </section>

                {/* Bản đồ năng lực — SPLIT: copy "flex trình" (trái) + knowledge graph contained
                    (phải). Graph KHÔNG còn full-bleed (hết "tràn lan") nhưng giữ wow tương tác. */}
                <section id="treasure" className="scroll-mt-24">
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
                        {/* TRÁI — copy flex: heading + stat editorial + dòng lồng ghép + CTA */}
                        <div className="flex flex-col gap-6">
                            <SectionHeading
                                anchorId="treasure"
                                align="start"
                                eyebrow={t("landing.treasure.eyebrow")}
                                title={t("landing.treasure.title")}
                                intro={t("landing.treasure.intro")}
                            />
                            {/* editorial stat: số to + label nhỏ + divider (grounded: số node + số track) */}
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                                        {KNOWLEDGE_NODES.length}
                                    </span>
                                    <Typography type="body-xs" color="muted">
                                        {t("landing.treasure.statConcepts")}
                                    </Typography>
                                </div>
                                <span aria-hidden className="h-10 w-px bg-default" />
                                <div className="flex flex-col">
                                    <span className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                                        {LANDING_COURSE_TRACKS.length}
                                    </span>
                                    <Typography type="body-xs" color="muted">
                                        {t("landing.treasure.statTracks")}
                                    </Typography>
                                </div>
                            </div>
                            {/* giữ ý "lồng ghép" bằng 1 dòng (thay edge animation phải đọc được) */}
                            <Typography type="body-sm" color="muted">
                                {t("landing.treasure.interconnect")}
                            </Typography>
                            <Button variant="primary" size="lg" onPress={onSeeCourses} className="self-start">
                                {t("landing.treasure.cta")}
                                <ArrowRightIcon aria-hidden focusable="false" className="size-5" />
                            </Button>
                        </div>
                        {/* PHẢI — knowledge graph contained: ~38 khái niệm THẬT (node) liên kết
                            builds-on + cross-track (d3-force live, kéo/zoom). Node màu theo track,
                            click → khóa chứa nó. "Kiến thức lồng ghép" (vibe Qdrant, @xyflow). */}
                        <KnowledgeGraph />
                    </div>
                </section>

                {/* 5 — Founder beat */}
                <section id="founder" className="flex scroll-mt-24 flex-col gap-12">
                    <SectionHeading
                        anchorId="founder"
                        eyebrow={t("landing.founder.eyebrow")}
                        title={t("landing.founder.title")}
                        intro={t("landing.founder.thesis")}
                    />
                    {/* the uncomfortable truths are the hero; the founder recedes to a
                        byline (who's saying this), each truth anchored to a real mechanism */}
                    <TruthList
                        items={LANDING_FOUNDER_TRUTH_INDEXES.map((index) => ({
                            truth: t(`landing.founder.truth${index}`),
                            fix: t(`landing.founder.fix${index}`),
                        }))}
                        byline={(
                            <>
                                <IconTile
                                    size="sm"
                                    tone="accent"
                                    src="/landing/founder.jpg"
                                    alt={t("landing.founder.name")}
                                    icon={<UserIcon aria-hidden focusable="false" />}
                                />
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <Typography type="body-sm" weight="semibold">
                                        {t("landing.founder.name")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("landing.founder.titles")}
                                    </Typography>
                                </div>
                                <div className="flex items-center gap-3 sm:ml-auto">
                                    {/* social proof — brand icons (GitHub · LinkedIn · Facebook) */}
                                    {FOUNDER_SOCIALS.map(({ key, href, icon: Icon, label }) => (
                                        <Link
                                            key={key}
                                            href={href}
                                            target="_blank"
                                            aria-label={label}
                                            className="text-muted transition-colors hover:text-accent"
                                        >
                                            <Icon aria-hidden className="size-4" />
                                        </Link>
                                    ))}
                                    {/* blog = "go read + judge the quality yourself" CTA */}
                                    <Link href={pathConfig().locale(locale).blog().build()} className="inline-flex items-center gap-2 text-accent">
                                        {t("landing.founder.blog")}
                                        <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                                    </Link>
                                </div>
                            </>
                        )}
                    />
                </section>

                {/* 6 — Two-sided talent marketplace (engineer outcome + recruiter browse, product-led) */}
                <TalentMarketplace />

                {/* 9 — FAQ */}
                <section id="faq" className="flex scroll-mt-24 flex-col gap-12">
                    <SectionHeading
                        anchorId="faq"
                        eyebrow={t("landing.faq.eyebrow")}
                        title={t("landing.faq.title")}
                    />
                    <Accordion variant="surface">
                        {LANDING_FAQ_INDEXES.map((index) => (
                            <Accordion.Item key={index} aria-label={t(`landing.faq.q${index}`)}>
                                <Accordion.Heading>
                                    <Accordion.Trigger>
                                        <Typography type="body-sm" weight="medium">
                                            {t(`landing.faq.q${index}`)}
                                        </Typography>
                                    </Accordion.Trigger>
                                </Accordion.Heading>
                                <Accordion.Panel>
                                    <Accordion.Body>
                                        <Typography type="body-sm" color="muted">
                                            {t(`landing.faq.a${index}`)}
                                        </Typography>
                                    </Accordion.Body>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </section>

                {/* 10 — Closing CTA */}
                <section className="flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <Typography.Heading level={2} weight="bold" align="center" className="max-w-2xl">
                            {t("landing.closing.title")}
                        </Typography.Heading>
                        <Typography type="body" color="muted" align="center" className="max-w-xl">
                            {t("landing.closing.subtitle")}
                        </Typography>
                    </div>
                    <Button variant="primary" size="lg" onPress={onSeeCourses}>
                        {t("landing.closing.cta")}
                        <CaretRightIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                </section>
            </div>

            {/* Back-to-top FAB — float góc phải-dưới (primary accent), hiện sau khi cuộn qua màn đầu */}
            {showTop ? (
                <Button
                    isIconOnly
                    variant="primary"
                    aria-label={t("landing.backToTop")}
                    onPress={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg"
                >
                    <ArrowUpIcon aria-hidden focusable="false" className="size-5" />
                </Button>
            ) : null}
        </div>
    )
}
