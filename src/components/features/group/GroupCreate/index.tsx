"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { GroupType } from "../hooks/useQueryGroupsSwr"

/** Selectable group types for creation. */
const TYPES: Array<GroupType> = ["public", "private", "study", "club", "team"]

/**
 * Create group form (§7). DEFAULT on-canon layout: name + type + description +
 * submit. ponytail: plain inputs + native select; submit disabled until named;
 * no-op (no BE).
 */
export const GroupCreate = () => {
    const t = useTranslations("groupsHub")
    const [name, setName] = useState("")
    const [type, setType] = useState<GroupType>("study")
    const [description, setDescription] = useState("")

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("create.title")}
            </Typography>

            <div className="flex flex-col gap-3">
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("create.nameField")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
                <select
                    value={type}
                    onChange={(event) => setType(event.target.value as GroupType)}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
                >
                    {TYPES.map((option) => (
                        <option key={option} value={option}>
                            {t(`types.${option}`)}
                        </option>
                    ))}
                </select>
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("create.descriptionField")}
                    rows={4}
                    className="w-full resize-none rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
            </div>

            <Button variant="secondary" fullWidth isDisabled={name.trim() === ""}>
                {t("create.submit")}
            </Button>
        </div>
    )
}
