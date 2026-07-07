"use client"

import React, { useState } from "react"
import { Button, Chip } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Post kinds a user can attach (§6). */
const KINDS = ["knowledge", "question", "showcase", "resource"] as const

/** Props for {@link CommunityComposerForm}. */
interface CommunityComposerFormProps {
    /** Autofocus the title field (the modal surface wants it; the page doesn't). */
    autoFocusTitle?: boolean
    /** Called after a (mock) submit — the modal closes itself here. */
    onSubmitted?: () => void
}

/**
 * The community post form (kind chips + title + body + submit), shared by the
 * `/community/new` page and the composer modal. ponytail: plain inputs; kind
 * chips toggle local state; submit is a no-op mock (no BE) that just clears
 * the draft and notifies the surface.
 */
export const CommunityComposerForm = ({
    autoFocusTitle = false,
    onSubmitted,
}: CommunityComposerFormProps) => {
    const t = useTranslations("communityHub")
    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const [kind, setKind] = useState<(typeof KINDS)[number]>("knowledge")

    const canSubmit = title.trim() !== "" && body.trim() !== ""

    const onSubmit = () => {
        setTitle("")
        setBody("")
        onSubmitted?.()
    }

    return (
        <div className="flex flex-col gap-4">
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
                autoFocus={autoFocusTitle}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("composer.titleField")}
                className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t("composer.bodyField")}
                rows={6}
                className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
            />

            <Button
                variant="secondary"
                className="self-start"
                isDisabled={!canSubmit}
                onPress={onSubmit}
            >
                {t("composer.submit")}
            </Button>
        </div>
    )
}
