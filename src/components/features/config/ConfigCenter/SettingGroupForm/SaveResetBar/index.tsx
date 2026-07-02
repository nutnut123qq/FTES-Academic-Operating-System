"use client"

import React from "react"
import { Button, Spinner } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link SaveResetBar}. */
export interface SaveResetBarProps {
    /** Whether the draft differs from the saved values. */
    isDirty: boolean
    /** Whether any field currently fails validation (blocks Save). */
    hasErrors: boolean
    /** True while the save is in flight. */
    isSaving: boolean
    /** Fired when Save is pressed. */
    onSave: () => void
    /** Fired when Reset is pressed — draft returns to the saved values. */
    onReset: () => void
}

/**
 * SaveResetBar — the action row of a setting group: Reset (secondary, enabled
 * while dirty) + Save (primary, blocked by validation errors, spinner while
 * saving). An `aria-live` hint announces when validation is blocking the save.
 */
export const SaveResetBar = ({
    isDirty,
    hasErrors,
    isSaving,
    onSave,
    onReset,
}: SaveResetBarProps) => {
    const t = useTranslations()

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <span aria-live="polite" className="text-xs text-danger">
                {hasErrors ? t("admin.config.settings.hasErrors") : ""}
            </span>
            <Button
                variant="secondary"
                onPress={onReset}
                isDisabled={!isDirty || isSaving}
            >
                {t("admin.config.settings.reset")}
            </Button>
            <Button
                variant="primary"
                onPress={onSave}
                isPending={isSaving}
                isDisabled={!isDirty || hasErrors || isSaving}
            >
                {({ isPending }) => (
                    <>
                        {isPending ? <Spinner color="current" size="sm" /> : null}
                        {t("admin.config.settings.save")}
                    </>
                )}
            </Button>
        </div>
    )
}
