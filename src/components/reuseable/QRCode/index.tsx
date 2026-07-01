import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface QRCodeProps extends WithClassNames<undefined> {
    size: number
    data: string
    icon?: React.ReactNode
}

export const QRCode = ({ size, data, icon, className }: QRCodeProps) => {
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
    return (
        <div className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
            <img alt="" width={size} height={size} src={src} className="rounded-lg" />
            {icon ? (
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background p-1 shadow-sm">
                    {icon}
                </div>
            ) : null}
        </div>
    )
}
