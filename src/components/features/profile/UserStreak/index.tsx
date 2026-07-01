"use client"
import { FireIcon } from "@phosphor-icons/react"
import React from "react"

import {
    cn,
    Card,
    CardContent,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
    Label,
    Typography,
} from "@heroui/react"

import { useTranslations } from "next-intl"

import type { WithClassNames } from "@/modules/types/base/class-name"

/** Weekday initials shown in the streak strip (Mon–Sun). */
const WEEK_DAYS: Array<string> = ["M", "T", "W", "T", "F", "S", "S"]

/** Props for {@link UserStreak}. */
export type UserStreakProps = WithClassNames<undefined>

/**
 * UserStreak — navbar streak widget.
 *
 * Self-contained section (single-use): reads its own i18n and renders the
 * streak dropdown with no props. `"use client"` for the dropdown interactivity.
 *
 * @param props - {@link UserStreakProps}
 */
export const UserStreak = ({ className }: UserStreakProps) => {
    const t = useTranslations("common")

    return (
        <Dropdown>
            <DropdownTrigger>
                <div className={cn("group relative flex size-10 cursor-pointer items-center justify-center rounded-full border-4 border-dashed border-accent/50 bg-accent/5 transition-all hover:scale-110 active:scale-95", className)}>
                    <FireIcon aria-hidden weight="fill" className="size-6 text-accent" />
                </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="User streak information" className="min-w-64">
                <DropdownSection>
                    <DropdownItem key="streaks" className="cursor-default opacity-100 data-[hover=true]:bg-transparent">
                        <div className="grid grid-cols-2 gap-3">
                            <Card>
                                <CardContent className="flex flex-col items-center gap-2 text-center">
                                    <Label>{t("streak.current")}</Label>
                                    <div className="flex items-center justify-center gap-2">
                                        <FireIcon aria-hidden weight="fill" className="size-5 text-accent" />
                                        <Typography type="h5" weight="bold">0</Typography>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex flex-col items-center gap-2 text-center">
                                    <Label>{t("streak.longest")}</Label>
                                    <div className="flex items-center justify-center gap-2">
                                        <FireIcon aria-hidden weight="fill" className="size-5 text-accent" />
                                        <Typography type="h5" weight="bold">0</Typography>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </DropdownItem>
                </DropdownSection>

                <DropdownSection className="mt-2 border-t pt-2">
                    <DropdownItem key="weekly" className="cursor-default opacity-100 data-[hover=true]:bg-transparent">
                        <div className="flex justify-between px-1">
                            {WEEK_DAYS.map((day, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div
                                        className={cn(
                                            "flex size-7 items-center justify-center rounded-full border-2 border-separator",
                                            i === 0 ? "bg-surface-secondary" : null,
                                        )}
                                    >
                                        <Typography type="body-xs" weight="bold" color={i === 0 ? "default" : "muted"}>
                                            {day}
                                        </Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DropdownItem>
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    )
}
