"use client"

import React from "react"
import { Button, Dropdown, Label, cn } from "@heroui/react"
import {
    DotsThreeIcon,
    FlagIcon,
    PencilSimpleIcon,
    TrashIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PostActionsMenu}. */
export interface PostActionsMenuProps extends WithClassNames<undefined> {
    /**
     * Whether the viewer authored the item. OWNER-ONLY entries ("Sửa" / "Xoá")
     * render only when this is true — a non-owner sees the report entry alone.
     * The server re-checks ownership (403), the gate here is purely UX.
     */
    isOwner?: boolean
    /** Open the edit flow (owner). Omit to hide the entry entirely. */
    onEdit?: () => void
    /** Start the delete flow (owner) — the caller confirms before writing. */
    onDelete?: () => void
    /** Open the report dialog (any signed-in viewer; the caller guards auth). */
    onReport?: () => void
}

/**
 * The ⋯ overflow menu of a post: "Sửa" and "Xoá" for the author, "Báo cáo" for
 * everyone else (an author can report nothing of their own, so the report entry
 * is hidden for the owner). Renders NOTHING when no entry would be available, so
 * surfaces that pass no handlers keep their previous layout.
 *
 * Purely presentational: every entry is a callback owned by the feature (which
 * runs the auth guard, the confirm dialog and the optimistic mutation).
 *
 * HeroUI note: each `Dropdown.Item` carries a real `id` (its action name) —
 * without it React Aria falls back to generated `react-aria-N` keys.
 *
 * @param props - {@link PostActionsMenuProps}
 */
export const PostActionsMenu = ({
    isOwner = false,
    onEdit,
    onDelete,
    onReport,
    className,
}: PostActionsMenuProps) => {
    const t = useTranslations("communityHub")

    const showEdit = isOwner && Boolean(onEdit)
    const showDelete = isOwner && Boolean(onDelete)
    const showReport = !isOwner && Boolean(onReport)

    if (!showEdit && !showDelete && !showReport) {
        return null
    }

    return (
        <span
            className={cn("inline-flex", className)}
            onClick={(event) => {
                // never navigate the wrapping card link when the menu is pressed
                event.preventDefault()
                event.stopPropagation()
            }}
        >
            <Dropdown>
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={t("engagement.moreActions")}
                >
                    <DotsThreeIcon aria-hidden focusable="false" className="size-5" />
                </Button>
                <Dropdown.Popover>
                    <Dropdown.Menu>
                        <Dropdown.Section>
                            {showEdit ? (
                                <Dropdown.Item
                                    id="edit"
                                    textValue={t("engagement.edit")}
                                    onPress={() => onEdit?.()}
                                >
                                    <PencilSimpleIcon className="size-5" />
                                    <Label>{t("engagement.edit")}</Label>
                                </Dropdown.Item>
                            ) : null}
                            {showDelete ? (
                                <Dropdown.Item
                                    id="delete"
                                    textValue={t("engagement.delete")}
                                    onPress={() => onDelete?.()}
                                >
                                    <TrashIcon className="size-5" />
                                    <Label>{t("engagement.delete")}</Label>
                                </Dropdown.Item>
                            ) : null}
                            {showReport ? (
                                <Dropdown.Item
                                    id="report"
                                    textValue={t("engagement.report")}
                                    onPress={() => onReport?.()}
                                >
                                    <FlagIcon className="size-5" />
                                    <Label>{t("engagement.report")}</Label>
                                </Dropdown.Item>
                            ) : null}
                        </Dropdown.Section>
                    </Dropdown.Menu>
                </Dropdown.Popover>
            </Dropdown>
        </span>
    )
}
