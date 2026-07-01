"use client"
import { Moon as MoonIcon, Sun as SunIcon } from "@gravity-ui/icons"
import { Switch, cn } from "@heroui/react"

import { useTheme } from "next-themes"
import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link DarkLightModeSwitch}.
 */
export type DarkLightModeSwitchProps = WithClassNames<undefined>

/**
 * DarkLightModeSwitch is a toggle component to switch between dark and light mode.
 * @param props - optional root class name
 */
export const DarkLightModeSwitch = ({ className }: DarkLightModeSwitchProps = {}) => {
    const { theme, setTheme } = useTheme()
    const isDarkMode = theme === "dark"
    return (
        <Switch
            isSelected={isDarkMode}
            onChange={(value) => setTheme(value ? "dark" : "light")}
            className={cn(className)}
        >
            {({ isSelected }) => (
                <Switch.Control className="h-[32px] w-[52px]">
                    <Switch.Thumb className={cn(
                        "size-[28px] min-w-[28px] rounded-full flex items-center justify-center", 
                        isSelected ? "ms-[22px]" : "")
                    }>
                        {isSelected ? <MoonIcon className="size-5" /> : <SunIcon className="size-5" />}
                    </Switch.Thumb>
                </Switch.Control>
            )}
        </Switch>
    )
}
