"use client"

import React, { useEffect, useMemo, useState } from "react"
import { toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import type {
    SettingField,
    SettingGroup,
    SettingValue,
} from "@/resources/constants/config"
import { configService } from "@/services/config"
import { useConfigStore } from "@/hooks/zustand/config"
import { AuditNote } from "./AuditNote"
import { SaveResetBar } from "./SaveResetBar"
import { SettingFieldControl } from "./SettingFieldControl"
import type { SettingDraftValue } from "./SettingFieldControl"

/** Props for {@link SettingGroupForm}. */
export interface SettingGroupFormProps {
    /** The loaded (saved) group this form edits. */
    group: SettingGroup
    /** Revalidates the group after a successful save. */
    onSaved: () => Promise<unknown>
}

/** Build the editable draft from the saved fields (numbers become input strings). */
const buildDraft = (fields: Array<SettingField>): Record<string, SettingDraftValue> =>
    Object.fromEntries(
        fields.map((field) => [
            field.key,
            field.type === "toggle" ? field.value === true : String(field.value),
        ]),
    )

/**
 * SettingGroupForm — one category's key-value settings: a control per field
 * (draft state kept apart from the saved store data), live validation
 * (required / min / max / pattern) that blocks Save, a Save/Reset bar with
 * success/error toasts, the audit note, and the unsaved-changes signals
 * (`dirtyCategory` in the config store for the in-app guard + `beforeunload`
 * for reload/close).
 */
export const SettingGroupForm = ({ group, onSaved }: SettingGroupFormProps) => {
    const t = useTranslations()
    const setDirtyCategory = useConfigStore((state) => state.setDirtyCategory)
    const [draft, setDraft] = useState<Record<string, SettingDraftValue>>(
        () => buildDraft(group.fields),
    )
    const [isSaving, setIsSaving] = useState(false)

    /** Per-field translated error messages for the current draft. */
    const errors = useMemo(() => {
        const result: Record<string, string> = {}
        for (const field of group.fields) {
            const value = draft[field.key]
            const rules = field.validation
            if (!rules || typeof value === "boolean") continue
            const text = String(value).trim()
            if (rules.required && text.length === 0) {
                result[field.key] = t("admin.config.settings.required")
                continue
            }
            if (field.type === "number" && text.length > 0) {
                const parsed = Number(text)
                if (!Number.isFinite(parsed)) {
                    result[field.key] = t("admin.config.settings.invalidNumber")
                    continue
                }
                if (rules.min !== undefined && parsed < rules.min) {
                    result[field.key] = t("admin.config.settings.min", { min: rules.min })
                    continue
                }
                if (rules.max !== undefined && parsed > rules.max) {
                    result[field.key] = t("admin.config.settings.max", { max: rules.max })
                    continue
                }
            }
            if (field.type === "text" && rules.pattern && text.length > 0) {
                if (!new RegExp(rules.pattern).test(text)) {
                    result[field.key] = t("admin.config.settings.pattern")
                }
            }
        }
        return result
    }, [group.fields, draft, t])

    const hasErrors = Object.keys(errors).length > 0
    const isDirty = useMemo(
        () =>
            group.fields.some((field) => {
                const saved = field.type === "toggle" ? field.value === true : String(field.value)
                return draft[field.key] !== saved
            }),
        [group.fields, draft],
    )

    // signal the shell's dirty-guard; cleared when clean or on unmount
    useEffect(() => {
        setDirtyCategory(isDirty ? group.id : null)
        return () => setDirtyCategory(null)
    }, [isDirty, group.id, setDirtyCategory])

    // native guard for reload / tab close while dirty
    useEffect(() => {
        if (!isDirty) return
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault()
        }
        window.addEventListener("beforeunload", onBeforeUnload)
        return () => window.removeEventListener("beforeunload", onBeforeUnload)
    }, [isDirty])

    /** Save the draft through the service; keep the draft on failure. */
    const onSave = async () => {
        if (hasErrors || !isDirty || isSaving) return
        const values: Record<string, SettingValue> = Object.fromEntries(
            group.fields.map((field) => {
                const value = draft[field.key]
                if (field.type === "toggle") return [field.key, value === true]
                if (field.type === "number") return [field.key, Number(String(value).trim())]
                return [field.key, String(value)]
            }),
        )
        setIsSaving(true)
        try {
            await configService.saveGroup(group.id, values)
            await onSaved()
            toast.success(t("admin.config.settings.saved"))
        } catch {
            // draft is untouched — the operator can retry
            toast.danger(t("admin.config.settings.saveError"))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                {group.fields.map((field) => (
                    <SettingFieldControl
                        key={field.key}
                        field={field}
                        value={draft[field.key]}
                        error={errors[field.key]}
                        isDisabled={isSaving}
                        onChange={(value) =>
                            setDraft((prev) => ({ ...prev, [field.key]: value }))
                        }
                    />
                ))}
            </div>
            <div className="flex flex-col gap-2">
                <SaveResetBar
                    isDirty={isDirty}
                    hasErrors={hasErrors}
                    isSaving={isSaving}
                    onSave={() => { void onSave() }}
                    onReset={() => setDraft(buildDraft(group.fields))}
                />
                <AuditNote
                    lastChangedBy={group.lastChangedBy}
                    lastChangedAt={group.lastChangedAt}
                />
            </div>
        </div>
    )
}
