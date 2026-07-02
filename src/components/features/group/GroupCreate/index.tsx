"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { GroupIdentityFields } from "../GroupIdentityFields"
import { useIdentityImagePicker } from "../hooks/useIdentityImagePicker"
import type { GroupType } from "../hooks/useQueryGroupsSwr"

/** Selectable group types for creation. */
const TYPES: Array<GroupType> = ["public", "private", "study", "club", "team"]

/**
 * Create group form (§7). DEFAULT on-canon layout: name + type + description +
 * identity pickers (avatar + cover, local preview, ≤5 MB PNG/JPEG/WebP/GIF) +
 * submit. ponytail: plain inputs + native select; submit disabled until named;
 * no-op (no BE) — see the presign swap-point in {@link GroupCreate.onSubmit}.
 */
export const GroupCreate = () => {
    const t = useTranslations("groupsHub")
    const [name, setName] = useState("")
    const [type, setType] = useState<GroupType>("study")
    const [description, setDescription] = useState("")
    const avatar = useIdentityImagePicker()
    const cover = useIdentityImagePicker()

    const onSubmit = () => {
        // ponytail: swap-point — khi BE group presign lands, thay log này bằng:
        //   generateGroupIdentityPresignUrl({ contentType }) → { url, key }
        //   → PUT avatar.file / cover.file lên minio qua `url`
        //   → verifyGroupIdentityPresignUrl({ key }) → { uploaded, url }
        // (GIẢ ĐỊNH contract tương tự profile avatar — chưa có; KHÔNG gọi
        //  mutation avatar của PROFILE cho group.)
        console.log("create group (mock)", {
            name,
            type,
            description,
            avatarFile: avatar.file,
            coverFile: cover.file,
        })
    }

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

            {/* group identity — avatar + cover (mock upload, local preview only) */}
            <GroupIdentityFields name={name} avatar={avatar} cover={cover} />

            <Button variant="secondary" fullWidth isDisabled={name.trim() === ""} onPress={onSubmit}>
                {t("create.submit")}
            </Button>
        </div>
    )
}
