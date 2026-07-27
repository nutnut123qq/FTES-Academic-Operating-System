"use client"

import React, { useEffect, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { usePatchGroupSwr } from "@/hooks/swr/api/rest/mutations/usePatchGroupSwr"
import { RichTextEditor } from "@/components/reuseable/RichTextEditor"
import { groupHeaderKey } from "../hooks/useQueryGroupSwr"
import {
    GROUP_JOIN_POLICIES,
    GROUP_VISIBILITIES,
    useQueryGroupSettingsSwr,
    type GroupJoinPolicy,
    type GroupSettings,
    type GroupVisibility,
} from "./useQueryGroupSettingsSwr"

/** Props for {@link GroupInfoSection}. */
export interface GroupInfoSectionProps {
    /** Group being edited. */
    groupId: string
}

/** Field styling shared by the hand-rolled inputs of this feature (mirrors GroupCreate). */
const FIELD_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/**
 * "Group information" section of the management tab: name, description, join policy
 * and visibility, saved through the real `PATCH /groups/{id}` (partial update — an
 * untouched field is simply not sent).
 *
 * The draft is seeded from the fetched settings and re-seeded only when the SERVER
 * content changes, so an unrelated revalidate (focus refetch, a join decision) never
 * clobbers an edit in flight — same guard the rules editor uses.
 *
 * @param props - {@link GroupInfoSectionProps}
 */
export const GroupInfoSection = ({ groupId }: GroupInfoSectionProps) => {
    const t = useTranslations("groupsHub")
    const runRest = useRestWithToast()
    const { mutate: globalMutate } = useSWRConfig()
    const { settings, isLoading, mutate } = useQueryGroupSettingsSwr(groupId)
    const { trigger, isMutating } = usePatchGroupSwr()
    const [draft, setDraft] = useState<GroupSettings | null>(settings ?? null)

    // re-seed on server CONTENT change only (not on every new object reference)
    const settingsKey = JSON.stringify(settings ?? null)
    useEffect(() => {
        setDraft(settings ?? null)
        // Intentionally keyed on the serialized content, not the `settings` ref.
    }, [settingsKey])

    const onSave = async () => {
        if (!draft || isMutating || draft.name.trim() === "") {
            return
        }
        const updated = await runRest(
            () =>
                trigger({
                    id: groupId,
                    request: {
                        name: draft.name.trim(),
                        description: draft.description.trim(),
                        joinPolicy: draft.joinPolicy,
                        visibility: draft.visibility,
                    },
                }),
            { successMessage: t("manage.infoSaved") },
        )
        await mutate()
        if (updated) {
            // the group header (name/avatar chrome) reads under its own key
            await globalMutate(groupHeaderKey(groupId))
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("manage.info")}
            </Typography>

            {draft === null ? (
                <Typography type="body-sm" color="muted">
                    {isLoading ? t("manage.infoLoading") : t("manage.error")}
                </Typography>
            ) : (
                <>
                    <label className="flex flex-col gap-1">
                        <Typography type="body-xs" color="muted">
                            {t("manage.nameField")}
                        </Typography>
                        <input
                            value={draft.name}
                            onChange={(event) =>
                                setDraft({ ...draft, name: event.target.value })
                            }
                            placeholder={t("manage.nameField")}
                            className={FIELD_CLASS}
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <Typography type="body-xs" color="muted">
                            {t("manage.descriptionField")}
                        </Typography>
                        <RichTextEditor
                            value={draft.description}
                            onChange={(next) => setDraft({ ...draft, description: next })}
                            toolbar="comment"
                            placeholder={t("manage.descriptionField")}
                            minHeight={96}
                        />
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="flex min-w-0 flex-1 flex-col gap-1">
                            <Typography type="body-xs" color="muted">
                                {t("manage.joinPolicy")}
                            </Typography>
                            <select
                                value={draft.joinPolicy}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        joinPolicy: event.target.value as GroupJoinPolicy,
                                    })
                                }
                                className={FIELD_CLASS}
                            >
                                {GROUP_JOIN_POLICIES.map((policy) => (
                                    <option key={policy} value={policy}>
                                        {t(`manage.joinPolicies.${policy}`)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex min-w-0 flex-1 flex-col gap-1">
                            <Typography type="body-xs" color="muted">
                                {t("manage.visibility")}
                            </Typography>
                            <select
                                value={draft.visibility}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        visibility: event.target.value as GroupVisibility,
                                    })
                                }
                                className={FIELD_CLASS}
                            >
                                {GROUP_VISIBILITIES.map((visibility) => (
                                    <option key={visibility} value={visibility}>
                                        {t(`manage.visibilities.${visibility}`)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <Button
                        size="sm"
                        variant="secondary"
                        className="self-start"
                        isDisabled={draft.name.trim() === ""}
                        isPending={isMutating}
                        onPress={() => void onSave()}
                    >
                        {t("manage.saveInfo")}
                    </Button>
                </>
            )}
        </div>
    )
}
