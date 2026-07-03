"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    useQueryProfileAcademicSwr,
    type ProfileAcademic as ProfileAcademicData,
} from "../hooks/useQueryProfileAcademicSwr"

/** Academic fields, in display order. */
const FIELDS: Array<keyof ProfileAcademicData> = ["university", "campus", "major", "semester", "gpa"]

/**
 * Academic section of the profile (§2). DEFAULT on-canon layout: a labelled
 * key/value list of academic fields as bordered rows. ponytail: rows hand-rolled;
 * mock data.
 */
export const ProfileAcademic = () => {
    const t = useTranslations("profile")
    const { academic } = useQueryProfileAcademicSwr()

    if (!academic) {
        return null
    }

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("sections.academic")}
            </Typography>
            {FIELDS.map((field) => (
                <div
                    key={field}
                    className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                >
                    <Typography type="body-sm" color="muted" className="w-32 shrink-0">
                        {t(`academic.fields.${field}`)}
                    </Typography>
                    <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                        {academic[field]}
                    </Typography>
                </div>
            ))}
        </div>
    )
}
