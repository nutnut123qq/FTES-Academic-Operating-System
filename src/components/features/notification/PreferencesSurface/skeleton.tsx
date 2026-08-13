import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { NOTIFICATION_TYPES } from "../preferences"

/**
 * Loading state of {@link import("./index").PreferencesSurface} — the SAME tree as the
 * real surface (bordered card → title/subtitle pair → the tinted mute-all row → one row
 * per notification type → the dashed browser-push row), with each content node swapped
 * for its `Skeleton.*`. A bare centred `Spinner` used to stand here, so the card
 * collapsed to a short box and then jumped to full height on resolve.
 */
export const PreferencesSurfaceSkeleton = () => {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <div className="flex flex-col gap-0">
                <Skeleton.Typography type="body-sm" className="w-40" />
                <Skeleton.Typography type="body-xs" className="w-64" />
            </div>

            {/* master mute-all row */}
            <div className="flex items-center justify-between gap-3 rounded-large bg-default/40 p-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded-md" />
                    <div className="flex flex-col gap-0">
                        <Skeleton.Typography type="body-sm" className="w-32" />
                        <Skeleton.Typography type="body-xs" className="w-48" />
                    </div>
                </div>
                <Skeleton.Switch />
            </div>

            {/* one row per notification type */}
            <div className="flex flex-col gap-0">
                {NOTIFICATION_TYPES.map((type) => (
                    <div
                        key={type}
                        className="flex items-center justify-between gap-3 py-2"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-5 rounded-md" />
                            <Skeleton.Typography type="body-sm" className="w-36" />
                        </div>
                        <Skeleton.Switch />
                    </div>
                ))}
            </div>

            {/* reserved browser-push row */}
            <div className="flex items-center justify-between gap-3 rounded-large border border-dashed border-separator p-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded-md" />
                    <div className="flex flex-col gap-0">
                        <Skeleton.Typography type="body-sm" className="w-32" />
                        <Skeleton.Typography type="body-xs" className="w-40" />
                    </div>
                </div>
                <Skeleton.Switch />
            </div>
        </div>
    )
}
