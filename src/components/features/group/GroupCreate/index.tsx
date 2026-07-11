"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { createGroup, type GroupCreateGroupRequest } from "@/modules/api/rest/group"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { GroupIdentityFields } from "../GroupIdentityFields"
import { useIdentityImagePicker } from "../hooks/useIdentityImagePicker"
import type { GroupType } from "../hooks/useQueryGroupsSwr"

/** Selectable group types for creation. */
const TYPES: Array<GroupType> = ["public", "private", "study", "club", "team"]

/**
 * Maps the FE `type` filter axis back onto the BE create payload (inverse of the
 * mapping in useQueryGroupsSwr): study/club/team pick a concrete `groupType`;
 * public/private are a GENERAL group distinguished by `visibility`.
 */
const toCreatePayload = (
    name: string,
    type: GroupType,
    description: string,
): GroupCreateGroupRequest => {
    const base = { name: name.trim(), description: description.trim() || undefined }
    switch (type) {
        case "study":
            return { ...base, groupType: "STUDY_GROUP" }
        case "club":
            return { ...base, groupType: "CLUB" }
        case "team":
            return { ...base, groupType: "PROJECT_TEAM" }
        case "private":
            return { ...base, groupType: "GENERAL", visibility: "PRIVATE" }
        default:
            return { ...base, groupType: "GENERAL", visibility: "PUBLIC" }
    }
}

/**
 * Create group form (§7). DEFAULT on-canon layout: name + type + description +
 * identity pickers (avatar + cover, local preview) + submit. Submit calls the
 * real `createGroup` endpoint and redirects to the created group's detail route.
 * The avatar/cover stay local preview only — mock BE - endpoint pending: no group
 * identity presign contract yet (see the swap-point in {@link GroupCreate}).
 */
export const GroupCreate = () => {
    const t = useTranslations("groupsHub")
    const router = useRouter()
    const { requireAuth } = useRequireAuth()
    const runRest = useRestWithToast()
    const [name, setName] = useState("")
    const [type, setType] = useState<GroupType>("study")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const avatar = useIdentityImagePicker()
    const cover = useIdentityImagePicker()

    const onSubmit = async () => {
        if (name.trim() === "" || isSubmitting) {
            return
        }
        if (!requireAuth("auth.context.generic")) {
            return
        }
        // mock BE - endpoint pending: no group identity presign contract. When it
        // lands, upload avatar.file / cover.file here (generate presign → PUT to
        // storage → verify) and attach the resulting keys to the payload. Do NOT
        // reuse the PROFILE avatar mutation for a group.
        setIsSubmitting(true)
        const created = await runRest(
            () => createGroup(toCreatePayload(name, type, description)),
            { successMessage: t("create.created") },
        )
        setIsSubmitting(false)
        if (created) {
            router.push(`/groups/${created.id}`)
        }
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

            {/* group identity — avatar + cover (local preview only, presign pending) */}
            <GroupIdentityFields name={name} avatar={avatar} cover={cover} />

            <Button
                variant="secondary"
                fullWidth
                isDisabled={name.trim() === ""}
                isPending={isSubmitting}
                onPress={() => void onSubmit()}
            >
                {t("create.submit")}
            </Button>
        </div>
    )
}
