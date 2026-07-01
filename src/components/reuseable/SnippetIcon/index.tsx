"use client"

import { Copy as CopyIcon } from "@gravity-ui/icons"
import { CheckCircleIcon } from "@phosphor-icons/react"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@heroui/react"
import { WithClassNames } from "@/modules/types/base/class-name"

export interface SnippetIconProps extends WithClassNames<{
  copyIcon?: string
  checkIcon?: string
}> {
  copyString: string
}

export const SnippetIcon = ({ copyString, classNames = {}, className }: SnippetIconProps) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(copyString)
        setCopied(true)
        setTimeout(() => setCopied(false), 350)
    }

    return (
        <motion.div
            onClick={handleCopy}
            className={cn("cursor-pointer", className)}
            whileTap={{ scale: 0.9 }}
        >
            <AnimatePresence mode="wait">
                {copied ? (
                    <motion.span
                        key="check"
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                        <CheckCircleIcon className={cn(classNames.checkIcon, "w-5 h-5")} />
                    </motion.span>
                ) : (
                    <motion.span
                        key="copy"
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.85, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                        <CopyIcon className={cn(classNames.copyIcon, "w-5 h-5")} />
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    )
}