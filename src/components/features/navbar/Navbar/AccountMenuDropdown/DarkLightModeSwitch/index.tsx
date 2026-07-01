"use client"
import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { Switch, cn } from "@heroui/react"

import { useTheme } from "next-themes"
import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link DarkLightModeSwitch}.
 */
export type DarkLightModeSwitchProps = WithClassNames<undefined>

/**
 * DarkLightModeSwitch — round HeroUI toggle for dark/light mode, with a sun/moon
 * icon riding inside the thumb. Uses the native Switch sizing (no custom pixel
 * dimensions) so the track + thumb stay perfectly round.
 * @param props - optional root class name (placement only)
 */
export const DarkLightModeSwitch = ({ className }: DarkLightModeSwitchProps = {}) => {
    const { theme, setTheme } = useTheme()
    const isDarkMode = theme === "dark"
    return (
        <Switch
            isSelected={isDarkMode}
            onChange={(value) => setTheme(value ? "dark" : "light")}
            aria-label="Toggle dark mode"
            className={cn(className)}
        >
            {({ isSelected }) => (
                <Switch.Control>
                    <Switch.Thumb>
                        <Switch.Icon>
                            {isSelected ? (
                                <MoonIcon className="size-5 text-inherit" />
                            ) : (
                                <SunIcon className="size-5 text-inherit" />
                            )}
                        </Switch.Icon>
                    </Switch.Thumb>
                </Switch.Control>
            )}
        </Switch>
    )
}
