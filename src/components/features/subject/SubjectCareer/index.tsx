"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { SkillGraph } from "@/components/features/skill-graph"
import { useQuerySubjectCareerSwr } from "../hooks/useQuerySubjectCareerSwr"

/**
 * Career Bridge tab (§3 → §21). DEFAULT on-canon layout (no dedicated brainstorm):
 * related-skill chips + a related-careers list + a "suggested next subject" card.
 * ponytail: hand-rolled sections; mock data.
 */
export const SubjectCareer = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { career } = useQuerySubjectCareerSwr(subjectId)

    if (!career) {
        return null
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <Typography type="h5" weight="bold">
                {t("career.title")}
            </Typography>

            {/* related skills */}
            <div className="flex flex-col gap-3">
                <Typography type="h6" weight="bold">
                    {t("career.skills")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {career.skills.map((skill) => (
                        <Chip key={skill} size="sm" variant="soft" color="accent">
                            {skill}
                        </Chip>
                    ))}
                </div>
            </div>

            {/* related careers */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("career.careers")}
                </Typography>
                {career.careers.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-large border border-separator p-4"
                    >
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                            {item.title}
                        </Typography>
                        <Chip size="sm" variant="soft" color="accent">
                            {t(`career.demand.${item.demand}`)}
                        </Chip>
                    </div>
                ))}
            </div>

            {/* subject-scoped skill graph (§21) */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("career.skillGraph")}
                </Typography>
                <SkillGraph subjectId={subjectId} heightClassName="h-[400px]" />
            </div>

            {/* suggested next subject */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("career.nextSubject")}
                </Typography>
                <div className="flex items-center gap-3 rounded-large border border-separator p-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-large bg-accent/10 text-sm font-bold text-accent">
                        {career.nextSubject.code.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <Typography type="body-sm" weight="medium" truncate>
                            {career.nextSubject.code} · {career.nextSubject.name}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("career.nextSubjectHint")}
                        </Typography>
                    </div>
                </div>
            </div>
        </div>
    )
}
