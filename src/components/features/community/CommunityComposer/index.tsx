"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Post kinds a user can attach (§6). */
const KINDS = ["knowledge", "question", "showcase", "resource"] as const

/**
 * Community post composer (§6). DEFAULT on-canon layout: a title + body textarea +
 * post-kind chips + submit. ponytail: plain inputs; kind chips toggle local state;
 * submit is a no-op (no BE).
 */
export const CommunityComposer = () => {
    const t = useTranslations("communityHub")
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [kind, setKind] = useState<(typeof KINDS)[number]>("knowledge")

    const canSubmit = title.trim() !== "" && body.trim() !== ""

    return (
        <div className="flex flex-col gap-4">
            <Typography type="h5" weight="bold">
                {t("composer.title")}
            </Typography>

            {/* kind chips */}
            <div className="flex flex-wrap gap-2">
                {KINDS.map((option) => (
                    <button key={option} type="button" onClick={() => setKind(option)}>
                        <Chip
                            size="sm"
                            variant={kind === option ? "primary" : "soft"}
                            color="accent"
                        >
                            {t(`composer.kinds.${option}`)}
                        </Chip>
                    </button>
                ))}
            </div>

            {/* fields */}
            <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("composer.titleField")}
                className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />
            <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t("composer.bodyField")}
                rows={6}
                className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
            />

            <Button variant="secondary" className="self-start" isDisabled={!canSubmit}>
                {t("composer.submit")}
            </Button>
        </div>
    )
}
