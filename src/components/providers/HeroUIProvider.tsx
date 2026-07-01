"use client"
import React, { PropsWithChildren } from "react"
import { I18nProvider } from "@heroui/react"

export const HeroUIProvider = ({ children }: PropsWithChildren) => {
    return <I18nProvider>{children}</I18nProvider>
}
