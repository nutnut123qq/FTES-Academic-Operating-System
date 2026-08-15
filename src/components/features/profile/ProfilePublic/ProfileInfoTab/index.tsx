"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import type { PublicProfile } from "../../hooks/useQueryPublicProfileSwr"
import { AchievementRow, ProjectCard } from "../ProfileEntries"

/** One label/value line in the academic grid. */
const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
        <Typography type="body-xs" color="muted">
            {label}
        </Typography>
        <Typography type="body-sm" weight="medium">
            {value}
        </Typography>
    </div>
)

/**
 * Profile tab — the durable facts about the person: academic record, contact, links, and
 * the FULL project + achievement lists previewed on Overview.
 *
 * Every block here is privacy-sensitive and masked SERVER-side: `academic` arrives `null`
 * when the owner hides it, `academic.gpa` is nulled independently, and `contactEmail` /
 * `phone` are nulled unless shown. Each field renders only when the BE actually sent a
 * value, so a hidden field is simply absent rather than shown blank.
 */
export const ProfileInfoTab = ({ profile }: { profile: PublicProfile }) => {
    const t = useTranslations()

    const academic = profile.academic
    const academicFields = academic
        ? ([
            [t("profile.academic.fields.university"), academic.university],
            [t("profile.academic.fields.campus"), academic.campus],
            [t("profile.academic.fields.majorFromCatalog"), academic.majorFromCatalog],
            [t("profile.academic.fields.major"), academic.major],
            [t("profile.academic.fields.semester"), academic.semester],
            [t("profile.academic.fields.gpa"), academic.gpa],
            [t("publicProfile.academic.fields.studentCode"), academic.studentCode],
            [t("publicProfile.academic.fields.enrollmentYear"), academic.enrollmentYear],
        ] as const).filter(([, value]) => Boolean(value))
        : []

    const contactFields = ([
        [t("publicProfile.contact.email"), profile.contactEmail],
        [t("publicProfile.contact.phone"), profile.phone],
    ] as const).filter(([, value]) => Boolean(value))

    return (
        <div className="flex flex-col gap-6">
            <LabeledCard label={t("profile.sections.academic")}>
                {academicFields.length === 0 ? (
                    <EmptyContent title={t("profile.academic.empty.title")} />
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {academicFields.map(([label, value]) => (
                            <InfoField key={label} label={label} value={value} />
                        ))}
                    </div>
                )}
            </LabeledCard>

            <LabeledCard label={t("profile.personal.contact.title")}>
                {contactFields.length === 0 ? (
                    <EmptyContent title={t("profile.personal.empty.contactTitle")} />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {contactFields.map(([label, value]) => (
                            <InfoField key={label} label={label} value={value} />
                        ))}
                    </div>
                )}
            </LabeledCard>

            <LabeledCard label={t("profile.personal.socials")}>
                {profile.socialLinks.length === 0 ? (
                    <EmptyContent title={t("profile.personal.empty.socialsTitle")} />
                ) : (
                    <div className="flex flex-col gap-2">
                        {profile.socialLinks.map((link) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 text-sm text-accent"
                            >
                                <span className="group-hover:underline">{link.platform}</span>
                                <ArrowSquareOutIcon
                                    className="size-4 shrink-0"
                                    aria-hidden
                                    focusable="false"
                                />
                            </a>
                        ))}
                    </div>
                )}
            </LabeledCard>

            <LabeledCard
                label={t("profile.portfolio.projects")}
                frameless={profile.projects.length > 0}
            >
                {profile.projects.length === 0 ? (
                    <EmptyContent title={t("profile.portfolio.empty.title")} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {profile.projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </LabeledCard>

            <LabeledCard
                label={t("publicProfile.stats.achievements")}
                frameless={profile.achievements.length > 0}
            >
                {profile.achievements.length === 0 ? (
                    <EmptyContent title={t("profile.portfolio.achievements.empty")} />
                ) : (
                    <div className="flex flex-col gap-3">
                        {profile.achievements.map((achievement) => (
                            <AchievementRow key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                )}
            </LabeledCard>
        </div>
    )
}
