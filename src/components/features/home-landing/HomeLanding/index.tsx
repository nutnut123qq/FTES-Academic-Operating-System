"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import {
    BookOpenIcon,
    GraduationCapIcon,
    FolderIcon,
    ChatCircleIcon,
    UsersThreeIcon,
    TrophyIcon,
    RobotIcon,
    BriefcaseIcon,
    ArrowRightIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"

// ponytail: a live demo subject id (SubjectWorkspaceShell renders on mock data)
// until the /subjects list lands in Phase 1. Upgrade: point at a real subject.
const DEMO_SUBJECT = "PRF192"

/** One bento tile: i18n key under `bento.*`, icon, target route, and span size. */
interface BentoItem {
    key: string
    icon: React.ReactNode
    href?: string
    big?: boolean
}

const BENTO: Array<BentoItem> = [
    { key: "subject", icon: <BookOpenIcon className="size-6" />, href: `/subjects/${DEMO_SUBJECT}`, big: true },
    { key: "courses", icon: <GraduationCapIcon className="size-6" />, href: "/courses" },
    { key: "resources", icon: <FolderIcon className="size-6" />, href: "/resources" },
    { key: "community", icon: <ChatCircleIcon className="size-6" />, href: "/community" },
    { key: "groups", icon: <UsersThreeIcon className="size-6" />, href: "/groups" },
    { key: "gamification", icon: <TrophyIcon className="size-6" /> },
]

const PILLARS: Array<{ key: string; icon: React.ReactNode }> = [
    { key: "ai", icon: <RobotIcon className="size-6" /> },
    { key: "gamification", icon: <TrophyIcon className="size-6" /> },
    { key: "career", icon: <BriefcaseIcon className="size-6" /> },
]

/** Shared tile chrome for a bento card (link or static). */
const tileClass = "flex flex-col gap-3 rounded-large border border-separator p-6"

/**
 * HomeLanding — the marketing/on-ramp landing for the academic OS (direction A ·
 * product tour + bento, chosen 2026-07-02). Hero → bento grid of the built
 * domains (cards link into the app) → 3 value pillars → final CTA. Feature owns
 * copy (i18n) + navigation; tokens/blocks own the look. The Footer is rendered by
 * `InnerLayout` on landing routes.
 */
export const HomeLanding = () => {
    const t = useTranslations("homeLanding")
    const router = useRouter()

    return (
        <main className="flex w-full flex-col items-center">
            {/* hero */}
            <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-20 text-center sm:px-6">
                <Chip variant="soft" color="accent" size="sm">
                    {t("hero.eyebrow")}
                </Chip>
                <Typography type="h1" weight="bold" className="max-w-3xl">
                    {t.rich("hero.headline", {
                        accent: (chunks) => <span className="text-accent">{chunks}</span>,
                    })}
                </Typography>
                <Typography type="body" color="muted" className="max-w-2xl">
                    {t("hero.subline")}
                </Typography>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" onPress={() => router.push("/courses")}>
                        {t("hero.ctaPrimary")}
                    </Button>
                    <Button variant="secondary" onPress={() => router.push("/community")}>
                        {t("hero.ctaSecondary")}
                    </Button>
                </div>
            </section>

            {/* bento — the ecosystem */}
            <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
                <div className="mb-8 flex flex-col items-center gap-2 text-center">
                    <Typography type="body-sm" color="muted">
                        {t("bento.eyebrow")}
                    </Typography>
                    <Typography type="h3" weight="bold">
                        {t("bento.title")}
                    </Typography>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-fr lg:grid-cols-3">
                    {BENTO.map((item) => {
                        const body = (
                            <>
                                <div className="flex size-11 items-center justify-center rounded-large bg-accent/10 text-accent">
                                    {item.icon}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Typography type={item.big ? "h5" : "h6"} weight="bold">
                                        {t(`bento.${item.key}.title`)}
                                    </Typography>
                                    <Typography type="body-sm" color="muted">
                                        {t(`bento.${item.key}.desc`)}
                                    </Typography>
                                </div>
                            </>
                        )
                        const spanClass = item.big ? "sm:col-span-2 lg:row-span-2" : ""
                        return item.href ? (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={cn(tileClass, "no-underline transition-colors hover:bg-default/40", spanClass)}
                            >
                                {body}
                            </Link>
                        ) : (
                            <div key={item.key} className={cn(tileClass, spanClass)}>
                                {body}
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* pillars */}
            <section className="w-full border-t border-separator bg-default/20">
                <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
                    <Typography type="h3" weight="bold" className="mb-8 text-center">
                        {t("pillars.title")}
                    </Typography>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {PILLARS.map((pillar) => (
                            <div key={pillar.key} className="flex flex-col gap-3">
                                <div className="flex size-11 items-center justify-center rounded-large bg-accent/10 text-accent">
                                    {pillar.icon}
                                </div>
                                <Typography type="h6" weight="bold">
                                    {t(`pillars.${pillar.key}.title`)}
                                </Typography>
                                <Typography type="body-sm" color="muted">
                                    {t(`pillars.${pillar.key}.desc`)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* final CTA */}
            <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
                <Typography type="h3" weight="bold">
                    {t("cta.title")}
                </Typography>
                <Typography type="body" color="muted" className="max-w-xl">
                    {t("cta.subline")}
                </Typography>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" onPress={() => router.push("/courses")}>
                        {t("cta.primary")}
                        <ArrowRightIcon className="size-4" />
                    </Button>
                    <Button variant="secondary" onPress={() => router.push(`/subjects/${DEMO_SUBJECT}`)}>
                        {t("cta.subjectDemo")}
                    </Button>
                </div>
            </section>
        </main>
    )
}
