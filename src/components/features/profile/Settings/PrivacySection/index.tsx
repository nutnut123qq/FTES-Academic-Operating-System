"use client"

import React from "react"
import useSWR from "swr"
import { Skeleton, Switch, Typography, cn } from "@heroui/react"
import { GlobeIcon, LockIcon, UsersIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { usePostUpdatePrivacySettingsSwr } from "@/hooks/swr/api/rest/mutations/usePostUpdatePrivacySettingsSwr"
import { getSelfProfile } from "@/modules/api/rest/profile"
import type { ProfilePrivacySettings, SelfProfile } from "@/modules/api/rest/profile"
import { useRestWithToast } from "@/modules/toast/hooks"
import { SELF_PROFILE_KEY } from "../../hooks/useQueryProfileSwr"
import { handleRadioGroupKeyDown } from "../radio-group"

/**
 * Who may open the profile. The three values are the ones the BE actually
 * branches on (`ProfileQueryService.resolveVisibility` / `PublicProfileAssembler`);
 * anything else is treated as public there, so the picker never offers one.
 */
const VISIBILITY_OPTIONS = ["PUBLIC", "MEMBERS", "PRIVATE"] as const

/** One of {@link VISIBILITY_OPTIONS}. */
type ProfileVisibility = (typeof VISIBILITY_OPTIONS)[number]

/** BE default when a user has never saved privacy settings (`PrivacySettingsEntity`). */
const DEFAULT_VISIBILITY: ProfileVisibility = "PUBLIC"

/** Icon per visibility option, in {@link VISIBILITY_OPTIONS} order. */
const VISIBILITY_ICON: Record<ProfileVisibility, React.ReactNode> = {
    PUBLIC: <GlobeIcon className="size-5" aria-hidden focusable="false" />,
    MEMBERS: <UsersIcon className="size-5" aria-hidden focusable="false" />,
    PRIVATE: <LockIcon className="size-5" aria-hidden focusable="false" />,
}

/**
 * The per-field toggles, in render order. Each key is a boolean field of
 * {@link ProfilePrivacySettings} and doubles as the
 * `profileSettings.privacy.fields.<key>` label suffix.
 */
const TOGGLE_FIELDS = [
    "showEmail",
    "showPhone",
    "showGpa",
    "showAcademic",
    "showProgress",
    "showTimeline",
    "showFollowers",
] as const

/** One of {@link TOGGLE_FIELDS}. */
type ToggleField = (typeof TOGGLE_FIELDS)[number]

/**
 * PrivacySection — the "Riêng tư" section of settings: who can open the profile
 * (public / signed-in members / nobody) plus a toggle per field the public
 * profile may reveal (email, phone, GPA, academic block, progress, timeline,
 * followers).
 *
 * Reads the settings off the shared `GET /profiles/me` cache (the same
 * {@link SELF_PROFILE_KEY} every other profile tab uses, so a change here is
 * visible everywhere without a refetch) and writes them with
 * `PUT /profiles/me/privacy`, which is a PARTIAL update — only the changed field
 * is sent. Every write is optimistic and rolls back with an error toast.
 */
export const PrivacySection = () => {
    const t = useTranslations()
    const runRest = useRestWithToast()
    const { data, isLoading, mutate } = useSWR(SELF_PROFILE_KEY, getSelfProfile)
    const { trigger, isMutating } = usePostUpdatePrivacySettingsSwr()

    const privacy = data?.privacy
    const visibility = (privacy?.profileVisibility ?? DEFAULT_VISIBILITY) as ProfileVisibility

    /**
     * Persist one changed privacy field: the shared profile cache flips right away,
     * the PUT sends only that field (the BE ignores nulls), and a failure rolls the
     * cache back with an error toast.
     *
     * @param patch - the single field being changed.
     */
    const save = async (patch: Partial<ProfilePrivacySettings>) => {
        if (!data || !privacy) return
        const nextProfile: SelfProfile = { ...data, privacy: { ...privacy, ...patch } }
        await runRest(
            () =>
                mutate(
                    async () => {
                        const saved = await trigger({
                            profileVisibility: null,
                            showEmail: null,
                            showPhone: null,
                            showGpa: null,
                            showAcademic: null,
                            showProgress: null,
                            showTimeline: null,
                            showFollowers: null,
                            ...patch,
                        })
                        // the endpoint answers with the full settings — keep the rest
                        // of the profile and adopt the server's copy of privacy
                        return { ...data, privacy: saved }
                    },
                    {
                        optimisticData: nextProfile,
                        populateCache: true,
                        rollbackOnError: true,
                        revalidate: false,
                    },
                ),
            { showSuccessToast: false, showErrorToast: true },
        )
    }

    return (
        <AsyncContent
            isLoading={isLoading && !data}
            skeleton={<Skeleton className="h-72 w-full rounded-2xl" />}
        >
            <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-0">
                    <Typography type="h6" weight="bold">
                        {t("profileSettings.privacy.title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("profileSettings.privacy.subtitle")}
                    </Typography>
                </div>

                <section className="flex flex-col gap-3">
                    <div className="text-sm text-muted">
                        {t("profileSettings.privacy.visibility.label")}
                    </div>
                    <div
                        role="radiogroup"
                        aria-label={t("profileSettings.privacy.visibility.label")}
                        className="grid grid-cols-3 gap-2"
                        onKeyDown={handleRadioGroupKeyDown}
                    >
                        {VISIBILITY_OPTIONS.map((option) => {
                            const isSelected = visibility === option
                            const label = t(`profileSettings.privacy.visibility.${option}`)
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    disabled={isMutating}
                                    tabIndex={isSelected ? 0 : -1}
                                    onClick={() => void save({ profileVisibility: option })}
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm outline-none transition-colors",
                                        "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                        isSelected
                                            ? "border-accent bg-accent/10 text-accent"
                                            : "border-default text-foreground hover:bg-default",
                                    )}
                                >
                                    {VISIBILITY_ICON[option]}
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                    <Typography type="body-xs" color="muted">
                        {t(`profileSettings.privacy.visibility.${visibility}Hint`)}
                    </Typography>
                </section>

                <section className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                    <div className="flex flex-col gap-0">
                        <Typography type="body-sm" weight="semibold">
                            {t("profileSettings.privacy.fieldsTitle")}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("profileSettings.privacy.fieldsSubtitle")}
                        </Typography>
                    </div>
                    <div className="flex flex-col gap-0">
                        {TOGGLE_FIELDS.map((field: ToggleField) => {
                            const label = t(`profileSettings.privacy.fields.${field}`)
                            // BE booleans are nullable in the DTO; a missing value means
                            // "the entity default", which is `true` for every field here
                            const enabled = privacy?.[field] ?? true
                            return (
                                <div
                                    key={field}
                                    className="flex items-center justify-between gap-3 py-2"
                                >
                                    <Typography type="body-sm">{label}</Typography>
                                    <Switch
                                        isSelected={enabled}
                                        // nobody can see the profile at all when it is
                                        // private, so the per-field toggles are moot
                                        isDisabled={isMutating || visibility === "PRIVATE"}
                                        onChange={(value) => void save({ [field]: value })}
                                        aria-label={label}
                                    >
                                        <Switch.Control>
                                            <Switch.Thumb />
                                        </Switch.Control>
                                    </Switch>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </section>
        </AsyncContent>
    )
}
