"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Resource type options for the upload form. */
const TYPES = ["pdf", "slide", "video", "pe", "fe", "source", "notes"] as const

/**
 * Resource upload form (§5). DEFAULT on-canon layout: a dropzone placeholder + a
 * few fields (title, type, subject) + a submit. ponytail: dropzone is a static
 * placeholder, plain inputs; no real upload (submit is a no-op).
 */
export const ResourceUpload = () => {
    const t = useTranslations("resourceHub")
    const [title, setTitle] = useState("")
    const [type, setType] = useState<(typeof TYPES)[number]>("pdf")
    const [subject, setSubject] = useState("")

    const canSubmit = title.trim() !== "" && subject.trim() !== ""

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("upload.title")}
            </Typography>

            {/* dropzone placeholder */}
            <div className="flex h-32 w-full items-center justify-center rounded-large border border-dashed border-separator bg-default/20">
                <Typography type="body-sm" color="muted">
                    {t("upload.dropzone")}
                </Typography>
            </div>

            {/* fields */}
            <div className="flex flex-col gap-3">
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={t("upload.titleField")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
                <select
                    value={type}
                    onChange={(event) => setType(event.target.value as (typeof TYPES)[number])}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
                >
                    {TYPES.map((option) => (
                        <option key={option} value={option}>
                            {t(`types.${option}`)}
                        </option>
                    ))}
                </select>
                <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder={t("upload.subjectField")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
            </div>

            <Button variant="secondary" fullWidth isDisabled={!canSubmit}>
                {t("upload.submit")}
            </Button>
        </div>
    )
}
