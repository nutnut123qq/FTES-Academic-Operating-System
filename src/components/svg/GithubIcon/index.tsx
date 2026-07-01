import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type GithubIconProps = WithClassNames<undefined>

export const GithubIcon = ({ className }: GithubIconProps) => {
    return (
        <svg className={cn(className)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .5C5.65.5.5 5.74.5 12.22c0 5.18 3.29 9.58 7.86 11.14.58.11.79-.26.79-.57 0-.28-.01-1.02-.02-2-3.2.71-3.88-1.58-3.88-1.58-.52-1.36-1.28-1.72-1.28-1.72-1.04-.74.08-.73.08-.73 1.15.08 1.76 1.21 1.76 1.21 1.02 1.79 2.67 1.27 3.32.97.1-.76.4-1.27.73-1.56-2.56-.3-5.25-1.3-5.25-5.8 0-1.28.44-2.33 1.16-3.15-.12-.3-.51-1.5.11-3.12 0 0 .95-.31 3.11 1.2a10.49 10.49 0 0 1 5.66 0c2.16-1.5 3.11-1.2 3.11-1.2.62 1.62.23 2.82.11 3.12.72.82 1.16 1.87 1.16 3.15 0 4.51-2.7 5.5-5.26 5.79.41.36.77 1.08.77 2.18 0 1.57-.01 2.83-.01 3.21 0 .31.2.69.8.57 4.57-1.56 7.85-5.96 7.85-11.14C23.5 5.74 18.35.5 12 .5Z" />
        </svg>
    )
}